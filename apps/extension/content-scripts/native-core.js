console.log("✅ Native Core Loaded - Smart Auto Detect Mode");

window.NativeCore = (function () {
  let debounceTimer = null;
  let latestQuery = "";

  // Biến lưu mode hiện tại (được auto detect cập nhật liên tục)
  let currentMode = "EN";

  // Bộ lọc ký tự tiếng Việt có dấu
  const VIETNAMESE_REGEX =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

  // --- 1. LOGIC AUTO-FILL (Giữ nguyên) ---
  async function fetchAutoFillData(word) {
    if (!word) return null;
    try {
      const dictPromise = fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
          word
        )}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const translatePromise = getTranslation(word);
      const [dictRes, transRes] = await Promise.all([
        dictPromise,
        translatePromise,
      ]);

      let newData = {};
      if (dictRes && dictRes[0]) {
        const entry = dictRes[0];
        if (entry.phonetic) newData.pronunciation = entry.phonetic;
        else if (entry.phonetics && entry.phonetics.length > 0) {
          const p = entry.phonetics.find((x) => x.text && x.audio);
          newData.pronunciation = p ? p.text : entry.phonetics[0]?.text || "";
        }
        if (entry.meanings && entry.meanings.length > 0) {
          const m = entry.meanings[0];
          newData.partOfSpeech = m.partOfSpeech;
          if (m.definitions) {
            const def = m.definitions.find((d) => d.example);
            if (def) newData.example = def.example;
          }
        }
      }
      if (transRes) {
        const mean =
          typeof transRes === "string" ? transRes : transRes.wordMeaning;
        if (mean) newData.meaning = mean;
      }
      return newData;
    } catch (e) {
      console.error("Autofill error:", e);
      return null;
    }
  }

  // --- 2. HANDLE SAVE ---
  async function handleSaveVocab(data) {
    try {
      if (data.id) {
        await apiUpdateVocabulary(data.id, data);
        console.log("✅ Updated successfully");
      } else {
        await apiCreateFullVocabulary(data);
        console.log("✅ Created successfully");
      }
      // Save xong thì load lại (ép kiểu EN để hiện từ tiếng Anh vừa save)
      runSearch(data.word, "EN");
    } catch (e) {
      alert("Save failed: " + e.message + "\n(Check Login or Network)");
    }
  }

  // --- 3. ASSESSMENT HANDLER ---
  function onOpenAssessment(vocab) {
    const vocabItem = vocab.id
      ? vocab
      : {
          id: "temp",
          word: vocab.word,
          pronunciation: vocab.pronunciation || "",
        };

    window.NativeUI.renderAssessmentModal(vocabItem, {
      onSpeak: (text) => speakWithEdgeTTS(text),
      onRecord: async (onSuccess, onError) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const mediaRecorder = new MediaRecorder(stream);
          const chunks = [];
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: "audio/webm" });
            window.lastRecordedBlob = blob;
            try {
              const result = await assessPronunciation(blob, vocabItem.word);
              if (vocabItem.id !== "temp" && result.NBest && result.NBest[0]) {
                const score = result.NBest[0].AccuracyScore;
                await apiAddScore(vocabItem.id, score);
              }
              if (result.NBest) onSuccess(result.NBest[0]);
              else onError("No result");
            } catch (err) {
              onError(err.message);
            }
            stream.getTracks().forEach((t) => t.stop());
          };
          mediaRecorder.start();
          window.currentRecorder = mediaRecorder;
        } catch (e) {
          onError("Mic Error: " + e.message);
        }
      },
      onStop: () => {
        if (window.currentRecorder) window.currentRecorder.stop();
      },
      onPlayback: () => {
        if (window.lastRecordedBlob) {
          const url = URL.createObjectURL(window.lastRecordedBlob);
          new Audio(url).play();
        }
      },
    });
  }

  // --- 4. FORM OPEN HANDLERS ---
  async function onOpenCreate(englishWord, meaningSuggestion = "") {
    let initialData = {
      word: englishWord || "",
      meaning: meaningSuggestion,
      isEditMode: false,
    };

    if (englishWord) {
      const autoData = await fetchAutoFillData(englishWord);
      if (autoData) {
        initialData = { ...initialData, ...autoData };
        // Nếu mode VI đã có nghĩa (là input), thì ưu tiên giữ nguyên nghĩa đó
        if (meaningSuggestion) initialData.meaning = meaningSuggestion;
      }
    }
    window.NativeUI.renderFormModal(initialData, {
      onAutoFill: fetchAutoFillData,
      onSave: handleSaveVocab,
    });
  }

  async function onEdit(item) {
    window.NativeUI.renderFormModal(
      {
        ...item,
        isEditMode: true,
      },
      {
        onAutoFill: fetchAutoFillData,
        onSave: handleSaveVocab,
      }
    );
  }

  // --- 5. INPUT & AUTO DETECT LOGIC ---
  function handleInput(text) {
    latestQuery = text;

    // Auto Detect Sơ bộ bằng Regex (Nhanh)
    // Nếu có dấu -> VI, Không dấu -> Tạm gọi là EN (sẽ check kỹ hơn ở runSearch)
    const detectedMode = VIETNAMESE_REGEX.test(text) ? "VI" : "EN";
    currentMode = detectedMode;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runSearch(text.trim());
    }, 500);
  }

  // --- [UPDATED] RUN SEARCH (CORE LOGIC) ---
  async function runSearch(rawInput, forceMode = null) {
    const runMode = forceMode || currentMode;
    const currentRunQuery = rawInput;

    try {
      let searchKeyword = rawInput;
      let impliedMeaning = "";
      let translatedFromVi = null;

      // BƯỚC 1: XỬ LÝ VIỆT NAM (REGEX DETECTED)
      if (runMode === "VI" && rawInput.trim()) {
        translatedFromVi = await translateViToEn(rawInput);
        if (latestQuery !== currentRunQuery) return; // Race check

        if (translatedFromVi) {
          searchKeyword = translatedFromVi.toLowerCase().trim();
          impliedMeaning = rawInput;
        }
      }

      // BƯỚC 2: SEARCH DATABASE (Luôn tìm bằng tiếng Anh)
      const dbResults = await apiSearchVocabulary(searchKeyword);

      if (latestQuery !== currentRunQuery) return; // Race check

      // BƯỚC 3: SMART FALLBACK (Xử lý ca khó: "Anh ta")
      // Logic: Nếu đang ở mode EN (do không có dấu), nhưng tìm DB không thấy
      // -> Thử dịch sang Anh. Nếu dịch ra từ khác -> Chuyển sang mode VI.
      const exact = dbResults.find(
        (i) => i.word.toLowerCase() === searchKeyword.toLowerCase()
      );

      // Điều kiện fallback: Mode EN + Không có trong DB + Input đủ dài
      if (runMode === "EN" && !exact && rawInput.length > 1) {
        const tryTranslate = await translateViToEn(rawInput);

        if (latestQuery !== currentRunQuery) return;

        // Nếu kết quả dịch KHÁC input gốc (VD: "anh ta" -> "he") => Là Tiếng Việt
        if (
          tryTranslate &&
          tryTranslate.toLowerCase() !== rawInput.toLowerCase()
        ) {
          console.log(
            `💡 Smart Detect: "${rawInput}" seems to be Vietnamese -> "${tryTranslate}"`
          );

          // Cập nhật lại biến để render theo mode VI
          searchKeyword = tryTranslate.toLowerCase().trim();
          impliedMeaning = rawInput;

          // Gọi API tìm kiếm lại với từ tiếng Anh mới
          const retryDbResults = await apiSearchVocabulary(searchKeyword);
          dbResults.length = 0;
          dbResults.push(...retryDbResults);

          // Ép kiểu render mode sang VI để UI hiển thị đúng
          // (Lưu ý: ta không đổi currentMode global để tránh nhảy icon lung tung khi đang gõ)
          forceMode = "VI";
        }
      }

      // BƯỚC 4: CHUẨN BỊ DATA HIỂN THỊ
      let apiData = null;
      const finalExact = dbResults.find(
        (i) => i.word.toLowerCase() === searchKeyword.toLowerCase()
      );

      // Nếu chưa có trong DB, chuẩn bị data cho box "Create New"
      if (searchKeyword && !finalExact) {
        const phonetics = await getPhoneticForText(searchKeyword);

        let trans = null;
        // Xác định mode cuối cùng để lấy nghĩa
        const finalMode = forceMode || runMode;

        if (finalMode === "EN") {
          trans = await getTranslation(searchKeyword);
        } else {
          // Mode VI: Nghĩa chính là Input
          const googleData = await getTranslation(searchKeyword);
          trans = {
            wordMeaning: impliedMeaning,
            dict: googleData?.dict || [],
          };
        }

        if (latestQuery !== currentRunQuery) return;
        if (trans) apiData = { trans, phonetics };
      }

      // BƯỚC 5: RENDER UI
      const finalMode = forceMode || runMode;

      window.NativeUI.renderSearchModal(searchKeyword, dbResults, apiData, {
        onInput: handleInput,
        onSpeak: (t) => speakWithEdgeTTS(t),

        onOpenCreate: (word) =>
          onOpenCreate(word, finalMode === "VI" ? impliedMeaning : ""),

        onEdit: onEdit,
        onMic: onOpenAssessment,
        onMicPractice: (keyword) =>
          onOpenAssessment({
            word: keyword,
            id: null,
            pronunciation: apiData?.phonetics?.us || "",
          }),
        onMark: (item) => {
          /*...*/
        },

        mode: finalMode,
        rawInput: rawInput,
      });
    } catch (e) {
      console.error("Search error:", e);
    }
  }

  // --- 6. PUBLIC METHODS ---
  function toggle() {
    latestQuery = "";
    currentMode = "EN";
    window.NativeUI.renderSearchModal("", [], null, {
      onInput: handleInput,
      mode: "EN",
      rawInput: "",
    });
  }

  async function handleSelection() {
    const sel = window.getSelection().toString().trim();
    if (!sel) return;
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    speakWithEdgeTTS(sel);
    const [trans, phonetics] = await Promise.all([
      getTranslation(sel),
      getPhoneticForText(sel),
    ]);
    if (trans) {
      window.NativeUI.renderPopup({ text: sel, trans, phonetics }, rect, {
        onSpeak: (t) => speakWithEdgeTTS(t),
        onOpenCreate: (w) => onOpenCreate(w),
      });
    }
  }

  return { toggle, handleSelection };
})();

// --- GLOBAL EVENT LISTENERS (GỘP PHÍM TẮT) ---
window.addEventListener("keydown", (e) => {
  // Chỉ dùng Ctrl + Q cho tất cả
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyQ") {
    e.preventDefault();
    window.NativeCore.toggle();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Escape") {
    window.NativeUI.hideAll();
  }
});
