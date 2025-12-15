console.log("✅ Native Core Loaded - Smart Ranking Mode");

window.NativeCore = (function () {
  let debounceTimer = null;
  let latestQuery = "";
  let currentMode = "EN";

  let lastDbResults = [];

  const VIETNAMESE_REGEX =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

  // --- HELPER: TÍNH ĐIỂM ƯU TIÊN (Ranking) ---
  function sortResultsByRelevance(items, keyword, mode) {
    if (!keyword || items.length === 0) return items;
    const searchStr = keyword.toLowerCase().trim();

    return items.sort((a, b) => {
      const scoreA = calculateScore(a, searchStr, mode);
      const scoreB = calculateScore(b, searchStr, mode);
      return scoreB - scoreA; // Điểm cao xếp trên
    });
  }

  function calculateScore(item, keyword, mode) {
    let score = 0;
    // 1. Ưu tiên khớp chính xác từ gốc (Word)
    if (item.word.toLowerCase() === keyword) return 1000;

    // 2. Logic so sánh Meaning (Cho Mode VI)
    if (mode === "VI" && item.meaning) {
      const meaningLower = item.meaning.toLowerCase();

      // Tách nghĩa bằng dấu phẩy, chấm phẩy (Vd: "táo, quả táo; táo tây")
      const parts = meaningLower.split(/[,;]+/).map((p) => p.trim());

      // Case A: Khớp chính xác 1 segment (Vd: search "táo" khớp segment "táo") -> Ưu tiên cao nhất
      if (parts.includes(keyword)) {
        score += 500;
      }
      // Case B: Bắt đầu bằng từ khóa (Vd: "táo quân") -> Ưu tiên nhì
      else if (parts.some((p) => p.startsWith(keyword + " "))) {
        score += 100;
      }
      // Case C: Chỉ chứa từ khóa (Vd: "cấu tạo") -> Ưu tiên thấp
      else if (meaningLower.includes(keyword)) {
        score += 10;
      }
    }
    // 3. Logic cho Mode EN (Word match)
    else if (mode === "EN") {
      if (item.word.toLowerCase().startsWith(keyword)) score += 100;
      else if (item.word.toLowerCase().includes(keyword)) score += 10;
    }

    // Bonus: Điểm trừ nhẹ nếu từ quá dài (để ưu tiên từ ngắn gọn hơn)
    score -= item.word.length * 0.1;

    return score;
  }

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
      // Reload search, ép kiểu EN để tìm chính xác từ vừa tạo
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

  // --- 5. INPUT & HANDLERS ---
  function handleInput(text) {
    latestQuery = text;
    const detectedMode = VIETNAMESE_REGEX.test(text) ? "VI" : "EN";
    currentMode = detectedMode;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runSearch(text.trim());
    }, 400);
  }

  async function handleEnter(text) {
    const rawInput = text.trim();
    if (!rawInput) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    const exactMatch = lastDbResults.find(
      (i) => i.word.toLowerCase() === rawInput.toLowerCase()
    );
    if (exactMatch) {
      onEdit(exactMatch);
      return;
    }

    // Logic xử lý Enter nhanh (khi chưa render)
    // Tự động detect và xử lý y như runSearch nhưng bỏ qua bước render list
    const isVietnamese = VIETNAMESE_REGEX.test(rawInput);
    if (isVietnamese) {
      const englishWord = await translateViToEn(rawInput);
      if (englishWord) {
        const existing = await apiCheckVocabulary(englishWord);
        if (existing) onEdit(existing);
        else onOpenCreate(englishWord, rawInput);
      } else {
        onOpenCreate(rawInput, "");
      }
    } else {
      const existing = await apiCheckVocabulary(rawInput);
      if (existing) onEdit(existing);
      else onOpenCreate(rawInput, "");
    }
  }

  // 👇 [UPDATED] RUN SEARCH VỚI LOGIC RANKING MỚI
  async function runSearch(rawInput, forceMode = null) {
    const runMode = forceMode || currentMode;
    const currentRunQuery = rawInput;

    try {
      let searchKeyword = rawInput; // Từ dùng để Search DB
      let displayKeyword = rawInput; // Từ dùng để hiển thị đề xuất Create
      let impliedMeaning = "";
      let translatedEnglish = "";

      // === BƯỚC 1: XỬ LÝ VIETNAMESE ===
      if (runMode === "VI" && rawInput.trim()) {
        // A. Dịch sang Anh để lấy từ chuẩn cho "Create New"
        translatedEnglish = await translateViToEn(rawInput);

        // B. NHƯNG Search DB thì dùng Tiếng Việt (rawInput)
        // Lý do: Để tìm ra những từ có nghĩa chứa "tạo" (create, make, generate...)
        searchKeyword = rawInput;

        if (translatedEnglish) {
          displayKeyword = translatedEnglish.toLowerCase().trim();
          impliedMeaning = rawInput;
        }
      }

      // === BƯỚC 2: SEARCH DATABASE ===
      // Lưu ý: searchKeyword ở đây là VI (nếu mode VI) hoặc EN (nếu mode EN)
      // Backend API search cả cột word và meaning nên tìm kiểu gì cũng ra.
      let dbResults = await apiSearchVocabulary(searchKeyword);

      if (latestQuery.trim() !== currentRunQuery) return;

      // === BƯỚC 3: SMART FALLBACK (Cho ca khó không dấu) ===
      // ... (Logic fallback cũ nếu cần, ở đây ta tập trung vào Ranking) ...

      // === BƯỚC 4: SẮP XẾP KẾT QUẢ (RANKING) ===
      // Sắp xếp lại dbResults dựa trên độ khớp với rawInput
      dbResults = sortResultsByRelevance(dbResults, rawInput, runMode);
      lastDbResults = dbResults; // Lưu lại cho handleEnter

      // === BƯỚC 5: CHUẨN BỊ DATA CHO CREATE NEW ===
      let apiData = null;

      // Kiểm tra xem từ Tiếng Anh (sau khi dịch) đã có trong DB chưa?
      // (Chỉ áp dụng cho Mode VI để tránh tạo trùng)
      let exactMatchInDb = null;
      if (runMode === "VI" && translatedEnglish) {
        // Tìm trong list kết quả xem có ông nào word == translatedEnglish không
        exactMatchInDb = dbResults.find(
          (i) => i.word.toLowerCase() === translatedEnglish.toLowerCase()
        );
      } else {
        exactMatchInDb = dbResults.find(
          (i) => i.word.toLowerCase() === displayKeyword.toLowerCase()
        );
      }

      // Nếu chưa có, chuẩn bị data để gợi ý tạo mới
      if (!exactMatchInDb && displayKeyword) {
        const phonetics = await getPhoneticForText(displayKeyword);
        let trans = null;

        if (runMode === "EN") {
          trans = await getTranslation(displayKeyword);
        } else {
          // Mode VI
          const googleData = await getTranslation(displayKeyword);
          trans = { wordMeaning: impliedMeaning, dict: googleData?.dict || [] };
        }

        if (latestQuery.trim() !== currentRunQuery) return;
        if (trans) apiData = { trans, phonetics };
      }

      // === BƯỚC 6: RENDER ===
      // Lưu ý: displayKeyword là từ Tiếng Anh (để hiện ở dòng Create New)
      window.NativeUI.renderSearchModal(displayKeyword, dbResults, apiData, {
        onInput: handleInput,
        onEnter: handleEnter,
        onSpeak: (t) => speakWithEdgeTTS(t),
        onOpenCreate: (word) =>
          onOpenCreate(word, runMode === "VI" ? impliedMeaning : ""),
        onEdit: onEdit,
        onMic: onOpenAssessment,
        onMicPractice: (keyword) =>
          onOpenAssessment({
            word: keyword,
            id: null,
            pronunciation: apiData?.phonetics?.us || "",
          }),

        // 👇 THÊM HÀM NÀY XUỐNG UI
        onInteract: handleInteraction,

        onMark: (item) => {
          /*...*/
        },
        mode: runMode,
        rawInput: rawInput,
      });
    } catch (e) {
      console.error("Search error:", e);
    }
  }

  // 👇 [NEW] HÀM CẬP NHẬT COUNT & TIME (INTERACTION)
  async function handleInteraction(item) {
    if (!item || !item.id) return;

    // Tính toán count mới (tăng 1)
    const newCount = (item.occurrence || 0) + 1;

    // Update local cache ngay lập tức để UI phản hồi (nếu cần)
    item.occurrence = newCount;

    try {
      // Gọi API PATCH trực tiếp để update count
      // (Backend Prisma sẽ tự động update cột 'updatedAt' thành giờ hiện tại)
      await fetch(`https://localhost:5001/vocabulary/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrence: newCount }),
        credentials: "include",
      });
      // console.log(`Interact: ${item.word} -> ${newCount}`);
    } catch (e) {
      console.error("Interaction update failed", e);
    }
  }

  // ... (Phần còn lại: toggle, handleSelection, Event Listeners giữ nguyên) ...
  function toggle() {
    latestQuery = "";
    currentMode = "EN";
    lastDbResults = [];
    window.NativeUI.renderSearchModal("", [], null, {
      onInput: handleInput,
      onEnter: handleEnter,
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

  return { toggle, handleSelection, handleEnter, handleInteraction };
})();

// Global Listeners
window.addEventListener("keydown", (e) => {
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
