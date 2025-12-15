console.log("✅ Native Core Loaded - Dual Check Mode");

window.NativeCore = (function () {
  let debounceTimer = null;
  let latestQuery = "";
  let currentMode = "EN";
  let lastDbResults = [];

  const VIETNAMESE_REGEX =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

  // --- HELPER: CHECK TỪ ĐIỂN TIẾNG ANH ---
  // Kiểm tra nhanh xem từ này có tồn tại trong từ điển Anh-Anh không
  async function checkIsEnglish(word) {
    if (!word || word.length < 2) return false;
    try {
      // Gọi API Dictionary (Head request hoặc Get nhẹ)
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
          word
        )}`
      );
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // --- HELPER: SORTING (Ranking) ---
  function sortResultsByRelevance(items, keyword, mode) {
    if (!keyword || items.length === 0) return items;
    const searchStr = keyword.toLowerCase().trim();
    return items.sort((a, b) => {
      const scoreA = calculateScore(a, searchStr, mode);
      const scoreB = calculateScore(b, searchStr, mode);
      return scoreB - scoreA;
    });
  }

  function calculateScore(item, keyword, mode) {
    let score = 0;
    if (item.word.toLowerCase() === keyword) return 1000;
    if (mode === "VI" && item.meaning) {
      const meaningLower = item.meaning.toLowerCase();
      const parts = meaningLower.split(/[,;]+/).map((p) => p.trim());
      if (parts.includes(keyword)) score += 500;
      else if (parts.some((p) => p.startsWith(keyword + " "))) score += 100;
      else if (meaningLower.includes(keyword)) score += 10;
    } else if (mode === "EN") {
      if (item.word.toLowerCase().startsWith(keyword)) score += 100;
      else if (item.word.toLowerCase().includes(keyword)) score += 10;
    }
    return score;
  }

  // --- 1. LOGIC AUTO-FILL (Giữ nguyên) ---
  async function fetchAutoFillData(word) {
    if (!word) return null;
    try {
      const [dictRes, transRes] = await Promise.all([
        fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
            word
          )}`
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        getTranslation(word),
      ]);
      let newData = {};
      if (dictRes && dictRes[0]) {
        const entry = dictRes[0];
        if (entry.phonetic) newData.pronunciation = entry.phonetic;
        else if (entry.phonetics?.[0])
          newData.pronunciation = entry.phonetics[0].text;
        if (entry.meanings?.[0]) {
          newData.partOfSpeech = entry.meanings[0].partOfSpeech;
          const def = entry.meanings[0].definitions.find((d) => d.example);
          if (def) newData.example = def.example;
        }
      }
      if (transRes) {
        const mean =
          typeof transRes === "string" ? transRes : transRes.wordMeaning;
        if (mean) newData.meaning = mean;
      }
      return newData;
    } catch (e) {
      return null;
    }
  }

  // --- 2. HANDLERS (Save, Mic, Edit, Create...) Giữ nguyên ---
  async function handleSaveVocab(data) {
    try {
      if (data.id) {
        await apiUpdateVocabulary(data.id, data);
        console.log("✅ Updated");
      } else {
        await apiCreateFullVocabulary(data);
        console.log("✅ Created");
      }
      runSearch(data.word, "EN");
    } catch (e) {
      alert("Save failed: " + e.message);
    }
  }

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
        /* Logic record cũ */
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const mediaRecorder = new MediaRecorder(stream);
          const chunks = [];
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = async () => {
            try {
              const result = await assessPronunciation(
                new Blob(chunks, { type: "audio/webm" }),
                vocabItem.word
              );
              if (vocabItem.id !== "temp" && result.NBest?.[0]) {
                await apiAddScore(vocabItem.id, result.NBest[0].AccuracyScore);
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
        /* Logic playback cũ */
      },
    });
  }

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
      { ...item, isEditMode: true },
      { onAutoFill: fetchAutoFillData, onSave: handleSaveVocab }
    );
  }

  // --- 5. INPUT & AUTO DETECT ---
  function handleInput(text) {
    latestQuery = text;
    const detectedMode = VIETNAMESE_REGEX.test(text) ? "VI" : "EN";
    currentMode = detectedMode;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runSearch(text.trim());
    }, 400);
  }

  // --- [UPDATED] HANDLE ENTER (Smart Check) ---
  async function handleEnter(text) {
    const rawInput = text.trim();
    if (!rawInput) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    // Check DB results cache
    const exactMatch = lastDbResults.find(
      (i) => i.word.toLowerCase() === rawInput.toLowerCase()
    );
    if (exactMatch) {
      onEdit(exactMatch);
      return;
    }

    // Logic định danh
    const isVietnameseChar = VIETNAMESE_REGEX.test(rawInput);

    if (isVietnameseChar) {
      // Chắc chắn là Việt
      const englishWord = await translateViToEn(rawInput);
      if (englishWord) {
        const existing = await apiCheckVocabulary(englishWord);
        if (existing) onEdit(existing);
        else onOpenCreate(englishWord, rawInput);
      } else {
        onOpenCreate(rawInput, "");
      }
    } else {
      // Không dấu -> Có thể là Anh hoặc Việt không dấu
      // Check xem có phải từ Tiếng Anh chuẩn không?
      const [isEng, existing] = await Promise.all([
        checkIsEnglish(rawInput),
        apiCheckVocabulary(rawInput),
      ]);

      if (existing || isEng) {
        // Là tiếng Anh (có trong DB hoặc có trong từ điển)
        if (existing) onEdit(existing);
        else onOpenCreate(rawInput, "");
      } else {
        // Không phải Anh -> Thử dịch xem có phải Việt không dấu?
        const translated = await translateViToEn(rawInput);
        if (translated && translated.toLowerCase() !== rawInput.toLowerCase()) {
          // Dịch ra từ khác -> Là Việt
          const existingTrans = await apiCheckVocabulary(translated);
          if (existingTrans) onEdit(existingTrans);
          else onOpenCreate(translated, rawInput);
        } else {
          // Vẫn y nguyên -> Là Anh (Từ mới)
          onOpenCreate(rawInput, "");
        }
      }
    }
  }

  // --- [UPDATED] RUN SEARCH (Dual Check) ---
  async function runSearch(rawInput, forceMode = null) {
    const runMode = forceMode || currentMode;
    const currentRunQuery = rawInput;

    try {
      let searchKeyword = rawInput;
      let impliedMeaning = "";
      let translatedFromVi = null;

      // 1. VIETNAMESE (Có dấu)
      if (runMode === "VI" && rawInput.trim()) {
        translatedFromVi = await translateViToEn(rawInput);
        if (latestQuery.trim() !== currentRunQuery) return;
        if (translatedFromVi) {
          searchKeyword = translatedFromVi.toLowerCase().trim();
          impliedMeaning = rawInput;
        }
      }

      // 2. SEARCH DB
      let dbResults = await apiSearchVocabulary(searchKeyword);
      if (latestQuery.trim() !== currentRunQuery) return;

      // 3. SMART FALLBACK (Sửa lỗi nhận nhầm EN -> VI)
      const exact = dbResults.find(
        (i) => i.word.toLowerCase() === searchKeyword.toLowerCase()
      );

      if (runMode === "EN" && !exact && rawInput.length > 1) {
        // Chạy song song 2 việc: Check xem có phải từ Anh chuẩn ko + Dịch thử
        const [isEng, tryTranslate] = await Promise.all([
          checkIsEnglish(rawInput),
          translateViToEn(rawInput),
        ]);

        if (latestQuery.trim() !== currentRunQuery) return;

        // Logic quyết định:
        if (isEng) {
          // A. Nó là từ tiếng Anh chuẩn (VD: "Men", "Chat") -> Giữ EN
          // Dù Google có dịch ra "Men rượu" hay gì thì kệ nó
        } else if (
          tryTranslate &&
          tryTranslate.toLowerCase() !== rawInput.toLowerCase()
        ) {
          // B. Không phải Anh chuẩn, mà dịch lại ra từ khác -> Chắc là Việt không dấu
          console.log(`💡 Switch to VI: "${rawInput}" -> "${tryTranslate}"`);

          searchKeyword = tryTranslate.toLowerCase().trim();
          impliedMeaning = rawInput;

          // Search lại với từ khóa mới
          const retryDbResults = await apiSearchVocabulary(searchKeyword);
          dbResults = retryDbResults;
          forceMode = "VI"; // Ép giao diện sang VI
        }
      }

      // 4. RANKING
      dbResults = sortResultsByRelevance(
        dbResults,
        rawInput,
        forceMode || runMode
      );
      lastDbResults = dbResults;

      // 5. PREPARE DATA FOR CREATE
      let apiData = null;
      const finalExact = dbResults.find(
        (i) => i.word.toLowerCase() === searchKeyword.toLowerCase()
      );

      if (searchKeyword && !finalExact) {
        const phonetics = await getPhoneticForText(searchKeyword);
        let trans = null;
        const finalMode = forceMode || runMode;

        if (finalMode === "EN") {
          trans = await getTranslation(searchKeyword);
        } else {
          const googleData = await getTranslation(searchKeyword);
          trans = { wordMeaning: impliedMeaning, dict: googleData?.dict || [] };
        }

        if (latestQuery.trim() !== currentRunQuery) return;
        if (trans) apiData = { trans, phonetics };
      }

      // 6. RENDER
      window.NativeUI.renderSearchModal(searchKeyword, dbResults, apiData, {
        onInput: handleInput,
        onEnter: handleEnter,
        onSpeak: (t) => speakWithEdgeTTS(t),
        onOpenCreate: (word) =>
          onOpenCreate(
            word,
            (forceMode || runMode) === "VI" ? impliedMeaning : ""
          ),
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
        mode: forceMode || runMode,
        rawInput: rawInput,
      });
    } catch (e) {
      console.error(e);
    }
  }

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
    /* Giữ nguyên logic cũ */
    const sel = window.getSelection().toString().trim();
    if (!sel) return;
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    speakWithEdgeTTS(sel);
    const [trans, phonetics] = await Promise.all([
      getTranslation(sel),
      getPhoneticForText(sel),
    ]);
    if (trans)
      window.NativeUI.renderPopup({ text: sel, trans, phonetics }, rect, {
        onSpeak: (t) => speakWithEdgeTTS(t),
        onOpenCreate: (w) => onOpenCreate(w),
      });
  }

  return { toggle, handleSelection };
})();

// Global Listeners
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyQ") {
    e.preventDefault();
    window.NativeCore.toggle();
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key === "Escape") window.NativeUI.hideAll();
});
