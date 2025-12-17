console.log("✅ Native Core Loaded - Smart Ranking Mode");

window.NativeCore = (function () {
  let debounceTimer = null;
  let latestQuery = "";
  let lastDbResults = [];
  let currentApiData = null; // Cache kết quả Translate
  let currentMode = localStorage.getItem("vocab_last_mode") || "EN";

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

  // --- [FIXED] POPUP LOGIC (Thêm onSpeak/onMic) ---

  // --- FIX POPUP CÂM & LOGIC TẠO TỪ ---

  async function onOpenCreate(englishWord, meaningVal = "") {
    const h = getHandlers(); // Lấy handlers (chứa onSpeak đã fix Aria)

    window.NativeUI.renderFormModal(
      { word: englishWord, meaning: meaningVal, isEditMode: false },
      {
        onSave: handleSaveVocab,
        onAutoFill: fetchAutoFillData,
        onSpeak: h.onSpeak, // 👈 Phải có dòng này thì nút loa trong Popup mới kêu
        onMic: h.onMic,
      }
    );
  }

  async function onEdit(item) {
    const h = getHandlers();

    window.NativeUI.renderFormModal(
      { ...item, isEditMode: true },
      {
        onSave: handleSaveVocab,
        onAutoFill: fetchAutoFillData,
        onSpeak: h.onSpeak, // 👈 Fix lỗi loa
        onMic: h.onMic,
      }
    );
  }

  // --- 5. INPUT & HANDLERS ---
  function handleInput(text) {
    latestQuery = text;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runSearch(text.trim());
    }, 50); // Giảm delay xuống 50ms cho cảm giác nhanh hơn
  }
  function setMode(newMode) {
    if (currentMode === newMode) return;
    currentMode = newMode;
    localStorage.setItem("vocab_last_mode", newMode); // Lưu vào Storage
    runSearch(latestQuery, true);
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

  function getHandlers() {
    return {
      mode: currentMode,
      rawInput: latestQuery,
      onInput: handleInput,
      onModeChange: setMode,
      onEnter: handleEnter,

      // Force English Voice (Aria)
      onSpeak: (text) => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        const voices = window.speechSynthesis.getVoices();
        const ariaVoice = voices.find(
          (v) => v.name.includes("Aria") && v.name.includes("English")
        );
        const googleVoice = voices.find((v) =>
          v.name.includes("Google US English")
        );
        if (ariaVoice) u.voice = ariaVoice;
        else if (googleVoice) u.voice = googleVoice;
        window.speechSynthesis.speak(u);
      },

      onOpenCreate: (word) => onOpenCreate(word),
      onEdit: onEdit,
      onMic: onOpenAssessment, // Đảm bảo hàm này được truyền xuống
      onInteract: handleInteraction,

      // Thêm Handler Save để Popup gọi được
      onSave: handleSaveVocab,
    };
  }

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

    // TASK 1: GOOGLE TRANSLATE (Chạy cho cả 2 mode)
    // Mode VI: Dịch Việt -> Anh
    // Mode EN: Dịch Anh -> Việt (Để lấy nghĩa hiển thị)
    const promiseTrans =
      currentMode === "VI"
        ? translateViToEn(runQuery)
        : getTranslation(runQuery); // Hàm này trả về object hoặc string tùy implement

    promiseTrans
      .then(async (result) => {
        if (latestQuery !== runQuery) return;

        if (result) {
          // Chuẩn hóa data
          const transText =
            typeof result === "string" ? result : result.wordMeaning;

          // Mode VI: transText là tiếng Anh -> Lấy Phonetic
          // Mode EN: runQuery là tiếng Anh -> Lấy Phonetic từ runQuery (nếu cần, hoặc DB đã có)
          let phonetics = "";
          if (currentMode === "VI") {
            phonetics = await getPhoneticForText(transText);
          }

          currentApiData = {
            trans: transText, // Kết quả dịch
            phonetics: phonetics,
          };
          renderUI();
        }
      })
      .catch((e) => console.log("Trans Err", e));

    // TASK 2: DATABASE SEARCH (Chạy song song)
    apiSearchVocabulary(runQuery)
      .then((results) => {
        if (latestQuery !== runQuery) return;
        lastDbResults = results;
        renderUI();
      })
      .catch((err) => console.log("DB err", err));
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

  function toggle() {
    const modal = document.getElementById("vocab-search-wrapper");
    // Nếu đang hiện -> Ẩn
    if (modal && modal.style.display === "block") {
      window.NativeUI.hideAll();
    } else {
      // Nếu đang ẩn -> Hiện lại (Dữ liệu cũ vẫn còn trong biến lastDbResults/latestQuery)
      renderUI();
      setTimeout(() => {
        const input = document.getElementById("native-search-input");
        if (input) input.focus();
      }, 100);
    }
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
