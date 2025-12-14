console.log("✅ Native Core Loaded");

window.NativeCore = (function () {
  let debounceTimer = null;

  // 1. INPUT SEARCH
  function handleInput(text) {
    const w = text.trim();
    if (!w) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(w), 300);
  }

  async function runSearch(word) {
    // 1. Backend Search
    const dbResults = await apiSearchVocabulary(word);

    // 2. Google Translate (nếu chưa có hoặc để lấy info)
    let apiData = null;
    const exact = dbResults.find(
      (i) => i.word.toLowerCase() === word.toLowerCase()
    );
    if (!exact) {
      const [trans, phonetics] = await Promise.all([
        getTranslation(word),
        getPhoneticForText(word),
      ]);
      if (trans) apiData = { trans, phonetics };
    }

    window.NativeUI.renderSearchModal(word, dbResults, apiData, {
      onInput: handleInput,
      onSpeak: (t) => speakWithEdgeTTS(t),
      onMark: (item) => {
        apiTriggerInteraction(item.id, item.occurrence);
        // Feedback nhỏ (ko cần reload toàn bộ)
      },
      onAdd: async (w, d) => {
        try {
          await apiSaveVocabulary({
            text: w,
            translation: d.trans,
            phonetics: d.phonetics,
          });
          runSearch(w); // Reload list
        } catch (e) {
          alert(e.message);
        }
      },
      // Mic & Speak đã bind trong UI
    });
  }

  // 2. TOGGLE
  function toggle() {
    // Init search trống
    window.NativeUI.renderSearchModal("", [], null, { onInput: handleInput });
  }

  // 3. SHIFT HANDLER
  async function handleSelection() {
    const sel = window.getSelection().toString().trim();
    if (!sel) return;
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();

    // Lấy data nhanh
    speakWithEdgeTTS(sel);
    const [trans, phonetics] = await Promise.all([
      getTranslation(sel),
      getPhoneticForText(sel),
    ]);

    if (trans) {
      window.NativeUI.renderPopup({ text: sel, trans, phonetics }, rect, {
        onSpeak: (t) => speakWithEdgeTTS(t),
        // Mic bind trong UI
        // Add bind trong UI (sẽ gọi lại runSearch)
        onInput: handleInput, // Truyền vào để nút Add dùng được
      });
    }
  }

  return { toggle, handleSelection };
})();

// EVENT
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyQ") {
    e.preventDefault();
    window.NativeCore.toggle();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    window.NativeCore.handleSelection();
  }
  if (e.key === "Escape") {
    window.NativeUI.hideAll();
  }
});
