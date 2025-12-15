console.log("✅ Native Core Loaded");

window.NativeCore = (function () {
  let debounceTimer = null;
  let latestQuery = "";

  // 👇 [NEW] QUẢN LÝ CHẾ ĐỘ (EN hoặc VI)
  let currentMode = "EN"; // Mặc định là Ctrl + Q

  // --- 1. LOGIC AUTO-FILL ---
  // (Giữ nguyên logic cũ)
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
      // Khi save xong, reload lại search bằng từ tiếng ANH
      // (Dù đang ở mode VI, ta vẫn muốn thấy kết quả từ tiếng Anh)
      runSearch(data.word, "EN_FORCE");
    } catch (e) {
      alert("Save failed: " + e.message + "\n(Check Login or Network)");
    }
  }

  // --- 3. ASSESSMENT HANDLER ---
  function onOpenAssessment(vocab) {
    // Logic mic luôn luôn dùng tiếng Anh (word)
    const vocabItem = vocab.id
      ? vocab
      : {
          id: "temp",
          word: vocab.word, // Luôn là tiếng Anh
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
              // Chấm điểm luôn dùng từ tiếng Anh
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
    // Luôn mở form tạo với từ Tiếng Anh
    let initialData = {
      word: englishWord || "",
      meaning: meaningSuggestion, // Gợi ý nghĩa (nếu từ mode VI)
      isEditMode: false,
    };

    if (englishWord) {
      const autoData = await fetchAutoFillData(englishWord);
      if (autoData) {
        // Ưu tiên nghĩa từ Google Translate nếu mode VI chưa cung cấp
        initialData = { ...initialData, ...autoData };
        // Nếu mode VI đã có nghĩa (là input), thì giữ nguyên nghĩa đó
        if (meaningSuggestion) initialData.meaning = meaningSuggestion;
      }
    }
    window.NativeUI.renderFormModal(initialData, {
      onAutoFill: fetchAutoFillData,
      onSave: handleSaveVocab,
    });
  }

  async function onEdit(item) {
    // item luôn là object từ DB (Tiếng Anh)
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

  // --- 5. INPUT & SEARCH ---
  function handleInput(text) {
    latestQuery = text;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runSearch(text.trim());
    }, 500); // Tăng debounce lên chút vì có thể phải gọi Google Translate
  }

  // 👇 [UPDATED LOGIC] SEARCH VỚI QUY TRÌNH DỊCH -> SEARCH DB
  async function runSearch(rawInput, forceMode = null) {
    const runMode = forceMode || currentMode;
    const currentRunQuery = rawInput;

    try {
      let searchKeyword = rawInput; // Mặc định là từ người dùng nhập (Mode EN)
      let impliedMeaning = ""; // Nghĩa tiếng Việt (nếu Mode VI)

      // BƯỚC 1: XỬ LÝ ĐẦU VÀO (DỊCH NẾU CẦN)
      if (runMode === "VI" && rawInput.trim()) {
        // Dịch Việt -> Anh
        const translated = await translateViToEn(rawInput);

        // Check race condition (Nếu người dùng đã gõ từ khác thì hủy luôn)
        if (latestQuery !== currentRunQuery) return;

        if (translated) {
          searchKeyword = translated.toLowerCase().trim(); // Từ để search DB là Tiếng Anh
          impliedMeaning = rawInput; // Input gốc chính là nghĩa
        } else {
          // Nếu không dịch được (lỗi mạng...), search luôn từ gốc
          searchKeyword = rawInput;
        }
      }

      // BƯỚC 2: TÌM KIẾM TRONG DB (Luôn tìm bằng từ Tiếng Anh)
      const dbResults = await apiSearchVocabulary(searchKeyword);

      if (latestQuery !== currentRunQuery) return;

      // BƯỚC 3: CHUẨN BỊ DATA CHO PHẦN "CREATE NEW"
      let apiData = null;
      // Kiểm tra xem từ Tiếng Anh này đã có trong DB chưa
      const exact = dbResults.find(
        (i) => i.word.toLowerCase() === searchKeyword.toLowerCase()
      );

      // Nếu chưa có, chuẩn bị data để gợi ý tạo mới
      if (searchKeyword && !exact) {
        const phonetics = await getPhoneticForText(searchKeyword);

        let trans = null;
        if (runMode === "EN") {
          // Mode EN: Cần dịch Anh -> Việt
          trans = await getTranslation(searchKeyword);
        } else {
          // Mode VI: Đã có nghĩa (impliedMeaning) rồi
          // Nhưng vẫn gọi Google để lấy thêm từ loại (dict) nếu có
          const googleData = await getTranslation(searchKeyword);
          trans = {
            wordMeaning: impliedMeaning, // Ưu tiên input của user
            dict: googleData?.dict || [],
          };
        }

        if (latestQuery !== currentRunQuery) return;
        if (trans) apiData = { trans, phonetics };
      }

      // BƯỚC 4: RENDER GIAO DIỆN
      window.NativeUI.renderSearchModal(searchKeyword, dbResults, apiData, {
        onInput: handleInput,
        onSpeak: (t) => speakWithEdgeTTS(t),

        // Logic tạo mới:
        // Mode VI: Tạo từ "hello" với nghĩa "xin chào"
        onOpenCreate: (word) =>
          onOpenCreate(word, runMode === "VI" ? impliedMeaning : ""),

        onEdit: onEdit,
        onMic: onOpenAssessment,
        // Logic Mic Practice: Luôn dùng từ Tiếng Anh để chấm điểm
        onMicPractice: (keyword) =>
          onOpenAssessment({
            word: keyword, // keyword ở đây là searchKeyword (Tiếng Anh)
            id: null,
            pronunciation: apiData?.phonetics?.us || "",
          }),
        onMark: (item) => {
          /* ... */
        },

        // Params cho UI hiển thị
        mode: runMode,
        rawInput: rawInput, // Để hiển thị lại trong ô input (không bị đổi thành tiếng Anh)
      });
    } catch (e) {
      console.error("Search error:", e);
    }
  }

  // --- 6. PUBLIC METHODS ---
  function toggle(mode = "EN") {
    currentMode = mode; // Set chế độ
    latestQuery = "";
    // Reset UI với chế độ mới
    window.NativeUI.renderSearchModal("", [], null, {
      onInput: handleInput,
      mode: currentMode,
      rawInput: "",
    });
  }

  // ... (handleSelection giữ nguyên) ...
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
        onOpenCreate: (w) => onOpenCreate(w), // Popup Shift luôn là EN -> VI
      });
    }
  }

  return { toggle, handleSelection };
})();

// --- GLOBAL LISTENER ---
window.addEventListener("keydown", (e) => {
  // Ctrl + Q: Mode English
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyQ") {
    e.preventDefault();
    window.NativeCore.toggle("EN");
  }
  // Ctrl + Y: Mode Vietnamese
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyY") {
    e.preventDefault();
    window.NativeCore.toggle("VI");
  }
});

// ... (Escape listener giữ nguyên) ...
window.addEventListener("keyup", (e) => {
  if (e.key === "Escape") {
    window.NativeUI.hideAll();
  }
});
