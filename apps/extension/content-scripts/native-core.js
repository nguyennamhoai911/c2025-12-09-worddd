console.log("✅ Native Core Loaded");

window.NativeCore = (function () {
  let debounceTimer = null;

  // --- 1. LOGIC AUTO-FILL ---
  async function fetchAutoFillData(word) {
    if (!word) return null;
    try {
        const dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
            .then(r => r.ok ? r.json() : null).catch(() => null);
        const translatePromise = getTranslation(word);
        const [dictRes, transRes] = await Promise.all([dictPromise, translatePromise]);
        let newData = {};
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
              await apiUpdateVocabulary(data.id, data);
              console.log("✅ Updated successfully");
          } else {
              await apiCreateFullVocabulary(data);
              console.log("✅ Created successfully");
          }
          runSearch(data.word);
      } catch (e) {
          alert("Save failed: " + e.message + "\n(Check Login or Network)");
      }
  }
  
  // --- 3. ASSESSMENT HANDLER ---
  function onOpenAssessment(vocab) {
      const vocabItem = vocab.id ? vocab : {
          id: 'temp',
          word: vocab.word,
          pronunciation: vocab.pronunciation || '',
      };

      window.NativeUI.renderAssessmentModal(vocabItem, {
          onSpeak: (text) => speakWithEdgeTTS(text),
          onRecord: async (onSuccess, onError) => {
              try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  const mediaRecorder = new MediaRecorder(stream);
                  const chunks = [];
                  
                  mediaRecorder.ondataavailable = e => chunks.push(e.data);
                  mediaRecorder.onstop = async () => {
                      const blob = new Blob(chunks, { type: 'audio/webm' });
                      window.lastRecordedBlob = blob; 
                      
                      try {
                          const result = await assessPronunciation(blob, vocabItem.word);
                          if (vocabItem.id !== 'temp' && result.NBest && result.NBest[0]) {
                              const score = result.NBest[0].AccuracyScore;
                              await apiAddScore(vocabItem.id, score);
                          }
                          if (result.NBest) onSuccess(result.NBest[0]);
                          else onError("No result");
                      } catch (err) {
                          onError(err.message);
                      }
                      stream.getTracks().forEach(t => t.stop());
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
          }
      });
  }

  // --- 4. FORM OPEN HANDLERS ---
  async function onOpenCreate(initialWord) {
      let initialData = { word: initialWord || '', isEditMode: false };
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
          onAutoFill: fetchAutoFillData,
          onSave: handleSaveVocab
      });
  }

  // --- 5. INPUT & SEARCH ---
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
      onMic: onOpenAssessment,
      onMicPractice: (keyword) => onOpenAssessment({ word: keyword, id: null, pronunciation: apiData?.phonetics?.us || '' }),
      onMark: (item) => {
        apiTriggerInteraction(item.id, item.occurrence);
      },
    });
  }

  // --- 6. CORE PUBLIC METHODS ---
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
  if (e.key === "Escape") {
    window.NativeUI.hideAll();
  }
});
