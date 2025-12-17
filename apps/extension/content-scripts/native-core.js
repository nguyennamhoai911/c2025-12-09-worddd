console.log("✅ Native Core Loaded - Smart Ranking Mode");

window.NativeCore = (function () {
  let debounceTimer = null;
  let latestQuery = "";
  let currentMode = "EN";
  let lastDbResults = [];
  let currentApiData = null; // Cache kết quả Translate

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
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runSearch(text.trim());
    }, 300); // Giảm delay xuống 300ms cho cảm giác nhanh hơn
  }
  function setMode(newMode) {
    if (currentMode === newMode) return;
    currentMode = newMode;
    runSearch(latestQuery, true); // Search lại ngay với mode mới
  }
  async function handleEnter(text) {
    const rawInput = text.trim();
    if (!rawInput) return;

    // 1. Ưu tiên mở từ có trong DB
    const exactMatch = lastDbResults.find(
      (i) => i.word.toLowerCase() === rawInput.toLowerCase()
    );
    if (exactMatch) {
      onEdit(exactMatch);
      return;
    }

    // 2. Nếu không, mở form tạo mới (Dùng từ đã dịch nếu có)
    const wordToCreate =
      currentApiData && currentApiData.trans
        ? typeof currentApiData.trans === "string"
          ? currentApiData.trans
          : currentApiData.trans.wordMeaning
        : rawInput;

    onOpenCreate(wordToCreate, currentMode === "VI" ? rawInput : "");
  }

  // Cập nhật trong hàm gọi renderSearchModal cũ (hoặc tạo hàm getHandlers riêng nếu bạn refactor):
  function getHandlers() {
    return {
      mode: currentMode,
      rawInput: latestQuery,
      onInput: handleInput,
      onEnter: handleEnter,
      onModeChange: setMode, // 👈 Quan trọng: Truyền hàm này xuống UI
      onSpeak: (t) => speakWithEdgeTTS(t),
      onOpenCreate: (w, m) => onOpenCreate(w, m),
      onEdit: onEdit,
      onMic: onOpenAssessment,
      onInteract: handleInteraction,
    };
  }

  // 👇 [UPDATED] RUN SEARCH VỚI LOGIC RANKING MỚI
  async function runSearch(rawInput, forceRefresh = false) {
    if (!rawInput) {
      window.NativeUI.renderSearchModal("", [], null, getHandlers());
      return;
    }
    if (forceRefresh) {
      lastDbResults = [];
      currentApiData = null;
    }

    const runQuery = rawInput;

    // TASK 1: Google Translate (Chạy độc lập)
    if (currentMode === "VI") {
      translateViToEn(runQuery).then(async (res) => {
        if (latestQuery !== runQuery) return; // Query đã cũ -> Bỏ qua
        if (res) {
          const phonetics = await getPhoneticForText(res);
          currentApiData = { trans: res, phonetics };
          renderUI(); // Render ngay khi có kết quả dịch
        }
      });
    } else {
      currentApiData = null; // Mode EN không cần dịch Việt->Anh
    }

    // TASK 2: Database Search (Chạy độc lập)
    apiSearchVocabulary(runQuery).then((results) => {
      if (latestQuery !== runQuery) return;
      lastDbResults = results; // Có thể thêm hàm sortResultsByRelevance ở đây nếu muốn
      renderUI(); // Render ngay khi có kết quả DB
    });
  }

  function renderUI() {
    window.NativeUI.renderSearchModal(
      latestQuery,
      lastDbResults,
      currentApiData,
      getHandlers()
    );
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

  return {
    toggle,
    handleSelection,
    handleEnter,
    handleInteraction,
    // 👇 EXPOSE HÀM NÀY ĐỂ FLASHCARD GỌI
    openEdit: onEdit,
    // 👇 EXPOSE HÀM NÀY ĐỂ FLASHCARD GỌI MIC
    openAssessment: onOpenAssessment,
  };
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
