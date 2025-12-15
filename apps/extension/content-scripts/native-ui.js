console.log("✅ Native UI Loaded");

window.NativeUI = (function () {
  let root = null;
  let searchWrapper = null;
  let formWrapper = null; // 👇 NEW: Container cho Form Modal
  let miniPopup = null;

  // Icons SVG
  const ICONS = {
    search:
      '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/></svg>',
    mic: '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M512 624c93.9 0 170-75.2 170-168V232c0-92.8-76.1-168-170-168s-170 75.2-170 168v224c0 92.8 76.1 168 170 168zm-110-392c0-59.6 49.3-108 110-108s110 48.4 110 108v224c0 59.6-49.3 108-110 108s-110-48.4-110-108V232zm270 224c0 88.4-71.6 160-160 160s-160-71.6-160-160a30 30 0 00-60 0c0 110.5 82 202.1 190 217.5V944h-90a30 30 0 000 60h240a30 30 0 000-60h-90V873.5c108-15.4 190-107 190-217.5a30 30 0 00-60 0z"/></svg>',
    sound:
      '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M625.9 115c-5.9 0-11.9 1.6-17.4 5.3L254 352H90c-17.7 0-32 14.3-32 32v256c0 17.7 14.3 32 32 32h164l354.5 231.7c5.5 3.6 11.6 5.3 17.4 5.3 16.7 0 32.1-13.3 32.1-32.1V147.1c0-18.8-15.4-32.1-32.1-32.1zM586 803L298 614.8V409.2L586 221v582zm302.2-402.1c-5.9-7.9-17.2-9.6-25.2-3.7l-35.9 26.8c-8 6-9.6 17.3-3.7 25.3C842.1 474.6 852 503 852 533c0 23.8-6.2 46.5-16.7 66.7-4.8 9.3-1.4 20.7 7.5 25.8l34.6 19.8c9.3 5.3 21.2 2.3 26.6-6.6C918 612.2 926 573.9 926 533c0-43-12.7-83.3-34.9-117.4z"/></svg>',
    mark: '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 00.6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0046.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3z"/></svg>',
    close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  };

  function init() {
    if (document.getElementById("vocab-root")) return;
    root = document.createElement("div");
    root.id = "vocab-root";
    document.body.appendChild(root);

    // 1. Search Wrapper
    searchWrapper = document.createElement("div");
    searchWrapper.id = "vocab-search-wrapper";
    searchWrapper.innerHTML = `
        <div id="vocab-search-modal">
            <div class="vocab-header">
                <div class="vocab-input-affix">
                    <span style="font-size:20px">${ICONS.search}</span>
                    <input class="vocab-search-input" id="native-search-input" placeholder="Type to search or create..." autocomplete="off">
                </div>
            </div>
            <div id="vocab-modal-body" class="vocab-body"></div>
            <div id="vocab-modal-assessment"></div>
        </div>
    `;
    root.appendChild(searchWrapper);

    // 2. Full Form Modal Wrapper (Mới)
    formWrapper = document.createElement("div");
    formWrapper.className = "vocab-modal-overlay";
    formWrapper.style.display = "none";
    root.appendChild(formWrapper);

    // 3. Mini Popup
    miniPopup = document.createElement("div");
    miniPopup.id = "vocab-mini-popup";
    root.appendChild(miniPopup);

    // Close events
    searchWrapper.onclick = (e) => {
        if (e.target === searchWrapper) hideAll();
    };
    formWrapper.onclick = (e) => {
        if (e.target === formWrapper) formWrapper.style.display = "none";
    };
    searchWrapper.addEventListener("keydown", (e) => e.stopPropagation());
  }

  function hideAll() {
    if (searchWrapper) searchWrapper.style.display = "none";
    if (formWrapper) formWrapper.style.display = "none";
    if (miniPopup) miniPopup.style.display = "none";
    window.speechSynthesis.cancel();
  }

  // --- NEW: RENDER FULL FORM MODAL ---
  function renderFormModal(data, handlers) {
    init();
    formWrapper.style.display = "flex";
    searchWrapper.style.display = "none"; // Ẩn search đi
    miniPopup.style.display = "none";

    // data = { word, meaning, example, topic, partOfSpeech, relatedWords, pronunciation, isEditMode }
    const isEdit = data.isEditMode;
    
    formWrapper.innerHTML = `
        <div class="vocab-modal-content">
            <div class="vocab-modal-header">
                <div style="width:100%">
                    <div class="vocab-modal-title">${isEdit ? "Editing Vocabulary" : "Create New Vocabulary"}</div>
                    <div style="position:relative">
                        <input id="form-word" class="vocab-input-large" value="${data.word || ''}" placeholder="Word..." ${isEdit ? 'readonly' : ''}>
                        <div id="form-autofill-status" class="autofill-loading" style="display:none">✨ Auto-filling...</div>
                    </div>
                </div>
                <button id="form-close" style="background:none; border:none; color:white; cursor:pointer;">${ICONS.close}</button>
            </div>
            
            <div class="vocab-modal-body">
                <div class="vocab-grid-2">
                    <div>
                        <label class="vocab-label">Pronunciation</label>
                        <input id="form-pronun" class="vocab-input-field" value="${data.pronunciation || ''}" placeholder="/.../">
                    </div>
                    <div>
                        <label class="vocab-label">Part Of Speech</label>
                        <select id="form-pos" class="vocab-select-field">
                            <option value="">-- Select --</option>
                            <option value="noun" ${data.partOfSpeech === 'noun' ? 'selected' : ''}>Noun</option>
                            <option value="verb" ${data.partOfSpeech === 'verb' ? 'selected' : ''}>Verb</option>
                            <option value="adjective" ${data.partOfSpeech === 'adjective' ? 'selected' : ''}>Adjective</option>
                            <option value="adverb" ${data.partOfSpeech === 'adverb' ? 'selected' : ''}>Adverb</option>
                            <option value="phrase" ${data.partOfSpeech === 'phrase' ? 'selected' : ''}>Phrase</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="vocab-label">Meaning</label>
                    <textarea id="form-meaning" class="vocab-textarea-field" placeholder="Nghĩa của từ...">${data.meaning || ''}</textarea>
                </div>

                <div>
                    <label class="vocab-label">Example</label>
                    <textarea id="form-example" class="vocab-textarea-field" style="background:#f9fafb; font-style:italic;" placeholder="Ví dụ...">${data.example || ''}</textarea>
                </div>

                <div class="vocab-grid-2">
                    <div>
                        <label class="vocab-label">Topic</label>
                        <input id="form-topic" class="vocab-input-field" value="${data.topic || ''}" placeholder="IT, Travel...">
                    </div>
                    <div>
                        <label class="vocab-label">Related Words</label>
                        <input id="form-related" class="vocab-input-field" value="${data.relatedWords || ''}" placeholder="Synonyms...">
                    </div>
                </div>
            </div>

            <div class="vocab-modal-footer">
                <button id="form-cancel" class="btn-cancel">Cancel</button>
                <button id="form-save" class="btn-save">${isEdit ? "Save Changes" : "Create Word"}</button>
            </div>
        </div>
    `;

    // Bind Events
    const wordInput = document.getElementById("form-word");
    const statusDiv = document.getElementById("form-autofill-status");

    // Auto-fill trigger on blur (giống Frontend)
    if (!isEdit) {
        wordInput.onblur = async () => {
             const val = wordInput.value.trim();
             if(val && handlers.onAutoFill) {
                 statusDiv.style.display = "inline-block";
                 const autoData = await handlers.onAutoFill(val);
                 statusDiv.style.display = "none";
                 
                 // Fill data back to UI
                 if(autoData) {
                     if(autoData.pronunciation) document.getElementById("form-pronun").value = autoData.pronunciation;
                     if(autoData.partOfSpeech) document.getElementById("form-pos").value = autoData.partOfSpeech;
                     if(autoData.meaning) document.getElementById("form-meaning").value = autoData.meaning;
                     if(autoData.example) document.getElementById("form-example").value = autoData.example;
                 }
             }
        };
        // Tự động trigger autofill nếu mở form mà word đã có sẵn
        if (data.word) wordInput.onblur();
    }

    document.getElementById("form-close").onclick = () => { formWrapper.style.display = "none"; };
    document.getElementById("form-cancel").onclick = () => { formWrapper.style.display = "none"; };
    
    document.getElementById("form-save").onclick = () => {
        // Collect Data
        const newData = {
            id: data.id, // Keep ID if edit
            word: document.getElementById("form-word").value.trim(),
            pronunciation: document.getElementById("form-pronun").value.trim(),
            partOfSpeech: document.getElementById("form-pos").value,
            meaning: document.getElementById("form-meaning").value.trim(),
            example: document.getElementById("form-example").value.trim(),
            topic: document.getElementById("form-topic").value.trim(),
            relatedWords: document.getElementById("form-related").value.trim(),
        };
        handlers.onSave(newData);
        formWrapper.style.display = "none";
    };
    
    // Focus vào ô word nếu tạo mới
    if (!isEdit) setTimeout(() => wordInput.focus(), 100);
  }

  // --- UPDATED: RENDER SEARCH MODAL (CTRL + Q) ---
  function renderSearchModal(keyword, dbResults, apiData, handlers) {
    init();
    searchWrapper.style.display = "block";

    const input = document.getElementById("native-search-input");
    if (input.value !== keyword && keyword) input.value = keyword;
    if (!keyword) input.value = '';
    input.focus();
    input.oninput = (e) => handlers.onInput(e.target.value);

    // Enter to Add logic
    const exactMatch = dbResults.find(
      (w) => w.word.toLowerCase() === (keyword || "").toLowerCase()
    );
    input.onkeydown = (e) => {
      if (e.key === "Enter" && keyword && !exactMatch) {
        handlers.onOpenCreate(keyword); 
      }
    };

    const body = document.getElementById("vocab-modal-body");
    let html = "";

    // 1. CREATE NEW (Nếu chưa có)
    if (keyword && !exactMatch) {
      const trans = apiData?.trans || {};
      const meaning =
        trans.wordMeaning ||
        (typeof trans === "string" ? trans : "Translating...");
      const pronun = apiData?.phonetics?.us || "";

      html += `
        <div class="vocab-add-box" id="open-create-form" style="cursor: pointer;">
            <div class="vocab-add-title">Create New: "${keyword}"</div>
            <div class="vocab-add-info">${pronun} • ${meaning}</div>
            <div style="font-size:12px; color:#1890ff; margin-bottom:8px;">Click here or press Enter to open form</div>
            <div>
                <button id="add-listen" class="ant-btn ant-btn-icon" title="Listen">${ICONS.sound}</button>
                <button id="add-mic" class="ant-btn ant-btn-icon" title="Practice">${ICONS.mic}</button>
            </div>
        </div>`;
    }

    // 2. LIST (Đã có) - Hiện Mic/Loa, Topic, Type
    if (dbResults.length > 0) {
      dbResults.forEach((item, idx) => {
        html += `
            <div class="vocab-list-item" id="vocab-item-${idx}">
                <div class="vocab-list-left">
                    <div class="vocab-word-row">
                        <span class="vocab-word-text">${item.word}</span>
                        ${
                          item.partOfSpeech
                            ? `<span class="vocab-tag">${item.partOfSpeech}</span>`
                            : ""
                        }
                        ${
                          item.topic
                            ? `<span class="vocab-tag tag-blue">${item.topic}</span>`
                            : ""
                        }
                    </div>
                    <div class="vocab-word-meta">${item.meaning || ""}</div>
                </div>
                <div class="vocab-actions">
                    <button class="ant-btn ant-btn-icon btn-edit" data-idx="${idx}" title="Edit Vocabulary">${ICONS.mark}</button>
                    <button class="ant-btn ant-btn-icon btn-listen" data-idx="${idx}" title="Listen">${ICONS.sound}</button>
                    <button class="ant-btn ant-btn-icon btn-mic" data-idx="${idx}" title="Practice">${ICONS.mic}</button>
                </div>
            </div>`;
      });
    } else if (!keyword) {
      html += `<div style="text-align:center; padding:30px; color:#999;">Type to search...</div>`;
    }

    body.innerHTML = html;

    // Bind Events
    if (keyword && !exactMatch) {
      document.getElementById("add-listen").onclick = (e) => { e.stopPropagation(); handlers.onSpeak(keyword); };
      document.getElementById("add-mic").onclick = (e) => {
        e.stopPropagation();
        handleMicClick(
          keyword,
          document.getElementById("vocab-modal-assessment")
        );
      };
      document.getElementById("open-create-form").onclick = () => handlers.onOpenCreate(keyword);
    }

    dbResults.forEach((item, idx) => {
      const itemElement = document.getElementById(`vocab-item-${idx}`);
      if (!itemElement) return;

      // Click on the row (but not on a button) to mark it
      itemElement.onclick = (e) => {
        if (!e.target.closest("button")) {
          handlers.onMark(item);
        }
      };

      // Click on Edit button
      const btnEdit = itemElement.querySelector(".btn-edit");
      if (btnEdit) {
        btnEdit.onclick = (e) => {
          e.stopPropagation();
          handlers.onEdit(item.word); // <-- FIX: Call onEdit
        };
      }

      // Click on Listen button
      const btnListen = itemElement.querySelector(".btn-listen");
      if (btnListen) {
        btnListen.onclick = (e) => {
          e.stopPropagation();
          handlers.onSpeak(item.word);
        };
      }

      // Click on Mic button
      const btnMic = itemElement.querySelector(".btn-mic");
      if (btnMic) {
        btnMic.onclick = (e) => {
          e.stopPropagation();
          handleMicClick(
            item.word,
            document.getElementById("vocab-modal-assessment")
          );
        };
      }
    });
  }

  // --- RETAIN OLD FUNCTIONS ---
  function renderPopup(data, rect, handlers) {
    init();
    miniPopup.style.display = "block";
    searchWrapper.style.display = "none";

    let top = rect.bottom + 10;
    let left = rect.left;
    if (top + 200 > window.innerHeight) top = rect.top - 200;
    miniPopup.style.top = top + "px";
    miniPopup.style.left = left + "px";

    const trans = data.trans;
    const meaning = typeof trans === "string" ? trans : trans.wordMeaning;

    miniPopup.innerHTML = `
        <div style="padding:16px;">
            <div style="font-weight:700; font-size:18px; color:#1890ff; margin-bottom:4px;">${data.text}</div>
            <div style="color:#888; font-family:monospace; margin-bottom:8px;">${data.phonetics?.us || ""}</div>
            <div style="margin-bottom:12px; color:#333;">${meaning}</div>
            <div style="display:flex; gap:8px;">
                <button id="pp-listen" class="ant-btn ant-btn-icon">${ICONS.sound}</button>
                <button id="pp-mic" class="ant-btn ant-btn-icon">${ICONS.mic}</button>
                <div style="flex:1"></div>
                <button id="pp-add" class="ant-btn ant-btn-primary">Add to DB</button>
            </div>
            <div id="pp-assessment"></div>
        </div>
      `;

    document.getElementById("pp-listen").onclick = () => handlers.onSpeak(data.text);
    document.getElementById("pp-mic").onclick = () => handleMicClick(data.text, document.getElementById("pp-assessment"));
    document.getElementById("pp-add").onclick = () => {
      hideAll();
      handlers.onOpenCreate(data.text);
    };
  }

  function renderAssessmentResult(data, container) {
    if (!data || !data.NBest) {
      container.innerHTML = `<div style="color:red; text-align:center; padding:10px;">Error</div>`;
      return;
    }

    const result = data.NBest[0];
    const score = Math.round(result.AccuracyScore);
    const color = score >= 80 ? "#52c41a" : score >= 60 ? "#faad14" : "#ff4d4f";

    let html = `
        <div class="assessment-box">
            <div class="total-score-circle" style="color:${color}; border-color:${color}">${score}</div>
            <div class="analyzed-content">
      `;

    result.Words.forEach((w) => {
      if (w.ErrorType === "Omission") return;
      html += `<div class="word-block"><div class="word-text-display">${w.Word}</div><div class="phoneme-row">`;
      (w.Phonemes || []).forEach((p) => {
        let pc = p.AccuracyScore >= 80 ? "p-perfect" : p.AccuracyScore >= 60 ? "p-good" : "p-bad";
        html += `<span class="phoneme-char ${pc}">${p.Phoneme}</span>`;
      });
      html += `</div></div>`;
    });
    html += `</div></div>`;

    container.innerHTML = html;
    container.style.display = "block";
  }

  async function handleMicClick(text, container) {
    container.style.display = "block";
    container.innerHTML = `<div style="text-align:center; padding:10px; color:#1890ff;">Listening...</div>`;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        container.innerHTML = `<div style="text-align:center; padding:10px; color:#888;">Analyzing...</div>`;
        const blob = new Blob(chunks, { type: "audio/webm" });
        try {
          // This function is defined in another file (e.g., lookup-services.js) and needs to be available in the scope
          const res = await assessPronunciation(blob, text);
          renderAssessmentResult(res, container);
        } catch (e) {
          container.innerHTML = `<div style="color:red; text-align:center;">${e.message}</div>`;
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
      }, 3500);
    } catch (e) {
      container.innerHTML = `<div style="color:red; text-align:center;">Mic Error</div>`;
    }
  }

  return { renderSearchModal, renderPopup, renderFormModal, hideAll };
})();