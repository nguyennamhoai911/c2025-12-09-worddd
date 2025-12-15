console.log("✅ Native Core Loaded");

window.NativeCore = (function () {
  let debounceTimer = null;

  // --- 1. LOGIC AUTO-FILL (Ported from useVocabModals.ts) ---
  async function fetchAutoFillData(word) {
    if (!word) return null;
    try {
        // Call Dictionary API
        const dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
            .then(r => r.ok ? r.json() : null).catch(() => null);
        
        // Call Google Translate
        const translatePromise = getTranslation(word); // From lookup-services.js

        const [dictRes, transRes] = await Promise.all([dictPromise, translatePromise]);
        
        let newData = {};

        // Parse Dictionary API response
        if (dictRes && dictRes[0]) {
            const entry = dictRes[0];
            if (entry.phonetic) newData.pronunciation = entry.phonetic;
            else if (entry.phonetics && entry.phonetics.length > 0) {
                 const p = entry.phonetics.find(x => x.text && x.audio);
                 newData.pronunciation = p ? p.text : (entry.phonetics[0]?.text || '');
            }
            if (entry.meanings && entry.meanings.length > 0) {
                const m = entry.meanings[0];
                newData.partOfSpeech = m.partOfSpeech;
                if (m.definitions) {
                    const def = m.definitions.find(d => d.example);
                    if (def) newData.example = def.example;
                }
            }
        }

        // Parse Translation response
        if (transRes) {
             const mean = typeof transRes === 'string' ? transRes : transRes.wordMeaning;
             if(mean) newData.meaning = mean;
        }

        return newData;
    } catch (e) {
        console.error("Autofill error:", e);
        return null;
    }
  }
  
  // --- 2. HANDLE SAVE (CREATE / UPDATE) ---
  async function handleSaveVocab(data) {
      try {
          if (data.id) {
              // Update Logic - Requires apiUpdateVocabulary function
              // await apiUpdateVocabulary(data.id, data); 
              console.log("Update logic not implemented yet.");
          } else {
              // Create Logic
              await apiCreateFullVocabulary(data);
          }
          // After save, reload search to show the new/updated item
          runSearch(data.word);
      } catch (e) {
          alert("Save failed: " + e.message);
      }
  }
  
  // --- 3. FORM OPEN HANDLERS ---
  async function onOpenCreate(initialWord) {
      let initialData = { word: initialWord || '', isEditMode: false };
      // If creating from a word, pre-fill it with data
      if(initialWord) {
          const autoData = await fetchAutoFillData(initialWord);
          if(autoData) initialData = {...initialData, ...autoData};
      }
      window.NativeUI.renderFormModal(initialData, {
          onAutoFill: fetchAutoFillData,
          onSave: handleSaveVocab
      });
  }

  async function onEdit(word) {
       const existing = await apiCheckVocabulary(word);
       if (!existing) {
           alert("Word not found!");
           return onOpenCreate(word);
       }
       window.NativeUI.renderFormModal({ 
          ...existing,
          isEditMode: true 
      }, {
          onAutoFill: fetchAutoFillData, // Not used in edit mode
          onSave: handleSaveVocab
      });
  }

  // --- 4. INPUT SEARCH ---
  function handleInput(text) {
    const w = text.trim();
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(w), 300);
  }

  async function runSearch(word) {
    const dbResults = await apiSearchVocabulary(word);

    let apiData = null;
    const exact = dbResults.find((i) => i.word.toLowerCase() === (word || "").toLowerCase());
    if (word && !exact) {
      const [trans, phonetics] = await Promise.all([
        getTranslation(word),
        getPhoneticForText(word),
      ]);
      if (trans) apiData = { trans, phonetics };
    }

    window.NativeUI.renderSearchModal(word, dbResults, apiData, {
      onInput: handleInput,
      onSpeak: (t) => speakWithEdgeTTS(t),
      onOpenCreate: onOpenCreate,
      onEdit: onEdit,
      onMark: (item) => {
        apiTriggerInteraction(item.id, item.occurrence);
      },
    });
  }

  // --- 5. CORE PUBLIC METHODS ---
  function toggle() {
    runSearch("");
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
        onOpenCreate: onOpenCreate
      });
    }
  }

  return { toggle, handleSelection };
})();

// --- GLOBAL EVENT LISTENERS ---
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyQ") {
    e.preventDefault();
    window.NativeCore.toggle();
  }
});

window.addEventListener("keyup", (e) => {
  // Shift key selection is now primarily handled by `lookup-main.js` for the main feature.
  // This can be repurposed or removed if it conflicts.
  // if (e.key === "Shift") {
  //   window.NativeCore.handleSelection();
  // }
  if (e.key === "Escape") {
    window.NativeUI.hideAll();
  }
});