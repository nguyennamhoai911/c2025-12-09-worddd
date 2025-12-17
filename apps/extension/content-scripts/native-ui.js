console.log("✅ Native UI Loaded");

window.NativeUI = (function () {
  let root = null;
  let searchWrapper = null;
  let searchModal = null; // 👇 Biến tham chiếu tới Modal
  let formWrapper = null;
  let miniPopup = null;
  let assessWrapper = null; // New wrapper for assessment modal

  // 👇 [UPDATED] BỘ ICON CHUẨN ĐẸP (Lấy từ Shift Popup)
  const ICONS = {
    search:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    mic: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    sound:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>',
    mark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>',
    close:
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  };

  // --- 1. HÀM XỬ LÝ KÉO THẢ & LƯU VỊ TRÍ ---
  function enableDragAndPersist(headerEl, modalEl) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    // A. Khôi phục vị trí cũ (nếu có)
    const savedPos = localStorage.getItem("vocab_widget_pos");
    if (savedPos) {
      const { top, left } = JSON.parse(savedPos);
      // Kiểm tra xem vị trí có bị trôi ra khỏi màn hình không
      const safeTop = Math.min(Math.max(0, top), window.innerHeight - 50);
      const safeLeft = Math.min(Math.max(0, left), window.innerWidth - 50);

      modalEl.style.top = safeTop + "px";
      modalEl.style.left = safeLeft + "px";
      modalEl.style.transform = "none"; // Bỏ căn giữa mặc định
    }

    // B. Bắt đầu kéo
    headerEl.onmousedown = (e) => {
      // Chỉ kéo khi click vào vùng trống của header (tránh input)
      if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      // Lấy vị trí hiện tại (tính cả khi đang dùng transform)
      const rect = modalEl.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      // Xóa transform để chuyển sang dùng top/left tuyệt đối mượt mà
      modalEl.style.transform = "none";
      modalEl.style.left = initialLeft + "px";
      modalEl.style.top = initialTop + "px";
      modalEl.style.width = rect.width + "px"; // Cố định chiều rộng để không bị co giãn
    };

    // C. Đang kéo
    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault(); // Chặn bôi đen text

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      modalEl.style.left = `${initialLeft + dx}px`;
      modalEl.style.top = `${initialTop + dy}px`;
    };

    // D. Thả chuột (Lưu vị trí)
    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;

      // Lưu vào LocalStorage
      const pos = {
        top: parseInt(modalEl.style.top || 0),
        left: parseInt(modalEl.style.left || 0),
      };
      localStorage.setItem("vocab_widget_pos", JSON.stringify(pos));
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function init() {
    if (document.getElementById("vocab-root")) return;
    root = document.createElement("div");
    root.id = "vocab-root";
    document.body.appendChild(root);
    const style = document.createElement("style");
    style.innerHTML = `
      .vocab-mode-switch { display: flex; align-items: center; background: #f1f3f4; border-radius: 6px; padding: 2px; margin-right: 8px; border: 1px solid #e0e0e0; }
      .mode-btn { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; color: #5f6368; transition: all 0.2s; user-select: none; }
      .mode-btn.active { background: #fff; color: #1a73e8; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
      .google-trans-box { background: #f8f9fa; border-bottom: 1px solid #f1f3f4; padding: 10px 16px; margin-bottom: 5px; }
      .google-main-text { font-size: 15px; color: #202124; font-weight: 500; }
      .google-sub-text { font-size: 11px; color: #5f6368; margin-top: 2px; }
    `;
    root.appendChild(style);
    // 1. Search Wrapper
    searchWrapper = document.createElement("div");
    searchWrapper.id = "vocab-search-wrapper";
    searchWrapper.innerHTML = `
        <div id="vocab-search-modal">
            <div class="vocab-header" id="vocab-drag-handle">
                <div class="vocab-input-affix">
                    <div id="vocab-mode-container"></div>
                    <input class="vocab-search-input" id="native-search-input" placeholder="Search..." autocomplete="off">
                </div>
            </div>
            <div id="vocab-modal-body" class="vocab-body"></div>
            <div id="vocab-modal-assessment"></div>
        </div>
    `;
    root.appendChild(searchWrapper);

    // 👇 KHỞI TẠO DRAG
    searchModal = document.getElementById("vocab-search-modal");
    const dragHandle = document.getElementById("vocab-drag-handle");
    enableDragAndPersist(dragHandle, searchModal);

    // 2. Full Form Modal Wrapper
    formWrapper = document.createElement("div");
    formWrapper.className = "vocab-modal-overlay";
    formWrapper.style.display = "none";
    root.appendChild(formWrapper);

    // 3. Mini Popup
    miniPopup = document.createElement("div");
    miniPopup.id = "vocab-mini-popup";
    root.appendChild(miniPopup);

    // 4. Assessment Modal Wrapper
    if (!document.getElementById("vocab-assess-wrapper")) {
      assessWrapper = document.createElement("div");
      assessWrapper.id = "vocab-assess-wrapper";
      assessWrapper.className = "assess-modal-overlay";
      assessWrapper.style.display = "none";
      root.appendChild(assessWrapper);

      assessWrapper.onclick = (e) => {
        if (e.target === assessWrapper) assessWrapper.style.display = "none";
      };
    } else {
      assessWrapper = document.getElementById("vocab-assess-wrapper");
    }

    // Close events
    searchWrapper.onclick = (e) => {
      if (e.target === searchWrapper) hideAll();
    };
    // 👇 [FIX 1]: XÓA hoặc COMMENT dòng này để chặn click ra ngoài bị tắt
    // formWrapper.onclick = (e) => {
    //   if (e.target === formWrapper) formWrapper.style.display = "none";
    // };
    searchWrapper.addEventListener("keydown", (e) => e.stopPropagation());
  }

  function hideAll() {
    if (searchWrapper) searchWrapper.style.display = "none";
    if (formWrapper) formWrapper.style.display = "none";
    if (miniPopup) miniPopup.style.display = "none";
    if (assessWrapper) assessWrapper.style.display = "none";
    window.speechSynthesis.cancel();
  }

  function renderFormModal(data, handlers) {
    init();
    formWrapper.style.display = "flex";
    searchWrapper.style.display = "none";
    miniPopup.style.display = "none";

    const isEdit = data.isEditMode;

    formWrapper.innerHTML = `
        <div class="vocab-modal-content">
            <div class="vocab-modal-header">
                <div style="width:100%">
                    <div class="vocab-modal-title">${
                      isEdit ? "Editing Vocabulary" : "Create New Vocabulary"
                    }</div>
                    <div style="position:relative">
                        <textarea 
                            id="form-word" 
                            class="vocab-input-large" 
                            placeholder="Word..." 
                            rows="1"
                            ${isEdit ? "readonly" : ""}
                        >${data.word || ""}</textarea>
                        <div id="form-autofill-status" class="autofill-loading" style="display:none">✨ Auto-filling...</div>
                    </div>
                </div>
                <button id="form-close" style="background:none; border:none; color:white; cursor:pointer;">${
                  ICONS.close
                }</button>
            </div>
            <div class="vocab-modal-body">
                <div class="vocab-grid-2">
                    <div>
                        <label class="vocab-label">Pronunciation</label>
                        <input id="form-pronun" class="vocab-input-field" value="${
                          data.pronunciation || ""
                        }" placeholder="/.../">
                    </div>
                    <div>
                        <label class="vocab-label">Part Of Speech</label>
                        <select id="form-pos" class="vocab-select-field">
                            <option value="">-- Select --</option>
                            <option value="noun" ${
                              data.partOfSpeech === "noun" ? "selected" : ""
                            }>Noun</option>
                            <option value="verb" ${
                              data.partOfSpeech === "verb" ? "selected" : ""
                            }>Verb</option>
                            <option value="adjective" ${
                              data.partOfSpeech === "adjective"
                                ? "selected"
                                : ""
                            }>Adjective</option>
                            <option value="adverb" ${
                              data.partOfSpeech === "adverb" ? "selected" : ""
                            }>Adverb</option>
                            <option value="phrase" ${
                              data.partOfSpeech === "phrase" ? "selected" : ""
                            }>Phrase</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="vocab-label">Meaning</label>
                    <textarea id="form-meaning" class="vocab-textarea-field" placeholder="Nghĩa của từ...">${
                      data.meaning || ""
                    }</textarea>
                </div>
                <div>
                    <label class="vocab-label">Example</label>
                    <textarea id="form-example" class="vocab-textarea-field" style="background:#f9fafb; font-style:italic;" placeholder="Ví dụ...">${
                      data.example || ""
                    }</textarea>
                </div>
                <div class="vocab-grid-2">
                    <div>
                        <label class="vocab-label">Topic</label>
                        <input id="form-topic" class="vocab-input-field" value="${
                          data.topic || ""
                        }" placeholder="IT, Travel...">
                    </div>
                    <div>
                        <label class="vocab-label">Related Words</label>
                        <input id="form-related" class="vocab-input-field" value="${
                          data.relatedWords || ""
                        }" placeholder="Synonyms...">
                    </div>
                </div>
            </div>
            <div class="vocab-modal-footer">
                <button id="form-cancel" class="btn-cancel">Cancel</button>
                <button id="form-save" class="btn-save">${
                  isEdit ? "Save Changes" : "Create Word"
                }</button>
            </div>
        </div>
    `;

    const wordInput = document.getElementById("form-word");
    const statusDiv = document.getElementById("form-autofill-status");

    // 👇 [FIX 3]: Logic tự động giãn chiều cao (Auto-resize) cho Word Input
    const adjustHeight = () => {
      wordInput.style.height = "auto";
      wordInput.style.height = wordInput.scrollHeight + "px";
    };
    wordInput.addEventListener("input", adjustHeight);
    // Gọi 1 lần lúc init để nó khớp với nội dung ban đầu
    setTimeout(adjustHeight, 0);

    if (!isEdit) {
      wordInput.onblur = async () => {
        const val = wordInput.value.trim();
        if (val && handlers.onAutoFill) {
          statusDiv.style.display = "inline-block";
          const autoData = await handlers.onAutoFill(val);
          statusDiv.style.display = "none";
          if (autoData) {
            if (autoData.pronunciation)
              document.getElementById("form-pronun").value =
                autoData.pronunciation;
            if (autoData.partOfSpeech)
              document.getElementById("form-pos").value = autoData.partOfSpeech;
            if (autoData.meaning)
              document.getElementById("form-meaning").value = autoData.meaning;
            if (autoData.example)
              document.getElementById("form-example").value = autoData.example;
          }
        }
      };
      if (data.word) wordInput.onblur();
    }

    document.getElementById("form-close").onclick = () => {
      formWrapper.style.display = "none";
    };
    document.getElementById("form-cancel").onclick = () => {
      formWrapper.style.display = "none";
    };

    document.getElementById("form-save").onclick = () => {
      const newData = {
        id: data.id,
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

    if (!isEdit) setTimeout(() => wordInput.focus(), 100);
  }

  // ... (Các phần trên giữ nguyên) ...

  function renderSearchModal(keyword, dbResults, apiData, handlers) {
    init();
    searchWrapper.style.display = "block";

    const input = document.getElementById("native-search-input");
    const body = document.getElementById("vocab-modal-body");
    const modeContainer = document.getElementById("vocab-mode-container");
    const mode = handlers.mode || "EN";
    const userTyped = handlers.rawInput || "";

    // 1. RENDER TOGGLE SWITCH
    modeContainer.innerHTML = `
      <div class="vocab-mode-switch">
        <div class="mode-btn ${
          mode === "EN" ? "active" : ""
        }" id="btn-mode-en">🇬🇧 Anh</div>
        <div class="mode-btn ${
          mode === "VI" ? "active" : ""
        }" id="btn-mode-vi">🇻🇳 Việt</div>
      </div>
    `;
    document.getElementById("btn-mode-en").onclick = (e) => {
      e.stopPropagation();
      handlers.onModeChange("EN");
    };
    document.getElementById("btn-mode-vi").onclick = (e) => {
      e.stopPropagation();
      handlers.onModeChange("VI");
    };

    // 2. INPUT HANDLING
    input.setAttribute(
      "placeholder",
      mode === "VI" ? "Nhập tiếng Việt..." : "Type English..."
    );
    if (document.activeElement !== input) {
      input.value = userTyped;
      input.focus();
    }
    // Bind events (giữ nguyên logic cũ để tránh mất event listener)
    if (!input.dataset.hasEvent) {
      input.oninput = (e) => handlers.onInput(e.target.value);
      input.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") handlers.onEnter(input.value);
      });
      ["paste", "copy", "cut", "selectstart"].forEach((evt) =>
        input.addEventListener(evt, (e) => e.stopPropagation())
      );
      input.dataset.hasEvent = "true";
    }

    // 3. RENDER CONTENT
    let html = "";

    // A. GOOGLE TRANSLATE (Ưu tiên hiển thị trước)
    if (apiData && apiData.trans) {
      const mainMean =
        typeof apiData.trans === "string"
          ? apiData.trans
          : apiData.trans.wordMeaning;
      html += `
        <div class="google-trans-box">
             <div style="display:flex; justify-content:space-between;">
                <div>
                    <div class="google-main-text">${mainMean}</div>
                    <div class="google-sub-text">Google Translate (${
                      mode === "VI" ? "VI ➝ EN" : "Auto"
                    })</div>
                    <div style="font-size:12px; color:#1a73e8;">${
                      apiData.phonetics?.us || ""
                    }</div>
                </div>
                <div style="display:flex; gap:5px;">
                     <button class="action-btn-circle" id="btn-create-auto">${
                       ICONS.mark
                     }</button>
                     <button class="action-btn-circle" onclick="window.NativeUI.speak('${mainMean.replace(
                       /'/g,
                       "\\'"
                     )}')">${ICONS.sound}</button>
                </div>
             </div>
        </div>`;
    }

    // B. DATABASE RESULTS
    if (dbResults && dbResults.length > 0) {
      dbResults.forEach((item, idx) => {
        html += `
            <div class="vocab-list-item" id="item-${item.id}">
                <div style="flex:1">
                    <div class="vocab-word-text" style="${
                      item.word.toLowerCase() === keyword.toLowerCase()
                        ? "color:#1a73e8"
                        : ""
                    }">
                        ${item.word} ${
          item.partOfSpeech
            ? `<span class="vocab-tag">${item.partOfSpeech}</span>`
            : ""
        }
                    </div>
                    <div class="vocab-word-meta">${item.meaning || ""}</div>
                </div>
                <div class="vocab-actions">
                    <button class="action-btn-circle btn-sound" id="btn-speak-${
                      item.id
                    }">${ICONS.sound}</button>
                    <button class="action-btn-circle btn-mic" id="btn-mic-${
                      item.id
                    }">${ICONS.mic}</button>
                </div>
            </div>`;
      });
    } else if (!apiData && keyword) {
      html += `<div style="padding:20px; text-align:center; color:#999;">Đang tìm kiếm...</div>`;
    }

    body.innerHTML = html;

    // 4. BIND EVENTS CHO LIST ITEM (Sau khi gán innerHTML)
    if (document.getElementById("btn-create-auto")) {
      document.getElementById("btn-create-auto").onclick = (e) => {
        e.stopPropagation();
        handlers.onOpenCreate(
          apiData.trans.wordMeaning || apiData.trans || keyword
        );
      };
    }
    if (dbResults) {
      dbResults.forEach((item) => {
        const row = document.getElementById(`item-${item.id}`);
        if (row) {
          row.onclick = () => {
            handlers.onInteract(item);
            handlers.onEdit(item);
          };
          document.getElementById(`btn-speak-${item.id}`).onclick = (e) => {
            e.stopPropagation();
            handlers.onInteract(item);
            handlers.onSpeak(item.word);
          };
          document.getElementById(`btn-mic-${item.id}`).onclick = (e) => {
            e.stopPropagation();
            handlers.onInteract(item);
            handlers.onMic(item);
          };
        }
      });
    }
  }

  // ... (Các hàm khác giữ nguyên) ...

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
            <div style="font-weight:700; font-size:18px; color:#1890ff; margin-bottom:4px;">${
              data.text
            }</div>
            <div style="color:#888; font-family:monospace; margin-bottom:8px;">${
              data.phonetics?.us || ""
            }</div>
            <div style="margin-bottom:12px; color:#333;">${meaning}</div>
            <div style="display:flex; gap:8px;">
                <button id="pp-listen" class="ant-btn ant-btn-icon">${
                  ICONS.sound
                }</button>
                <button id="pp-mic" class="ant-btn ant-btn-icon">${
                  ICONS.mic
                }</button>
                <div style="flex:1"></div>
                <button id="pp-add" class="ant-btn ant-btn-primary">Add to DB</button>
            </div>
            <div id="pp-assessment"></div>
        </div>
      `;
    document.getElementById("pp-listen").onclick = () =>
      handlers.onSpeak(data.text);
    document.getElementById("pp-mic").onclick = () =>
      handleMicClick(data.text, document.getElementById("pp-assessment"));
    document.getElementById("pp-add").onclick = () => {
      hideAll();
      handlers.onOpenCreate(data.text);
    };
  }

  // --- [NEW] RENDER ASSESSMENT MODAL ---
  function renderAssessmentModal(vocab, handlers) {
    init();
    assessWrapper.style.display = "flex";

    const renderContent = (result = null, isRecording = false, error = "") => {
      let scoreHtml = `<div style="color:#e5e7eb; font-size:48px;">?</div>`;
      let borderColor = "#f3f4f6";
      let phonemeHtml = "";

      if (result) {
        const score = Math.round(result.AccuracyScore);
        borderColor =
          score >= 80 ? "#4caf50" : score >= 60 ? "#fbc02d" : "#ef4444";
        scoreHtml = `<div style="color:${borderColor}">${score}</div>`;

        if (result.Words && result.Words[0] && result.Words[0].Phonemes) {
          phonemeHtml = result.Words[0].Phonemes.map((p) => {
            const bgClass =
              p.AccuracyScore >= 80
                ? "bg-green"
                : p.AccuracyScore >= 60
                ? "bg-yellow"
                : "bg-red";
            return `<span class="phoneme-badge ${bgClass}" title="${p.AccuracyScore}">${p.Phoneme}</span>`;
          }).join("");
        }
      }

      assessWrapper.innerHTML = `
            <div class="assess-modal-content">
                <button id="assess-close" style="position:absolute; top:15px; right:15px; background:none; border:none; font-size:20px; cursor:pointer; color:#9ca3af;">✕</button>
                <div class="assess-word">${vocab.word}</div>
                <div class="assess-pronun">/${vocab.pronunciation || ""}/</div>
                <div class="score-circle-container" style="border-color: ${borderColor}">
                    ${scoreHtml}
                </div>
                ${
                  phonemeHtml
                    ? `<div class="phoneme-list">${phonemeHtml}</div>`
                    : ""
                }
                <div class="assess-controls">
                    <button id="btn-listen-sample" class="btn-control btn-speaker" title="Nghe mẫu">
                       ${ICONS.sound}
                    </button>
                    <button id="btn-record-toggle" class="btn-control btn-record ${
                      isRecording ? "recording" : ""
                    }">
                       ${
                         isRecording
                           ? '<div style="width:20px; height:20px; background:white; border-radius:4px;"></div>'
                           : ICONS.mic
                       }
                    </button>
                    <button id="btn-playback-user" class="btn-control btn-playback" title="Nghe lại" ${
                      !result ? "disabled" : ""
                    }>
                       <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </button>
                </div>
                <div class="assess-status">
                    ${
                      isRecording
                        ? '<span style="color:#ef4444">Listening...</span>'
                        : error
                        ? `<span style="color:#ef4444">${error}</span>`
                        : result
                        ? vocab.id !== "temp"
                          ? '<span style="color:#10b981">✅ Score Saved!</span>'
                          : '<span style="color:#f59e0b">⚠️ Practice Mode (Not Saved)</span>'
                        : "Click mic to start"
                    }
                </div>
            </div>
          `;

      document.getElementById("assess-close").onclick = () =>
        (assessWrapper.style.display = "none");
      document.getElementById("btn-listen-sample").onclick = () =>
        handlers.onSpeak(vocab.word);

      document.getElementById("btn-record-toggle").onclick = () => {
        if (isRecording) handlers.onStop();
        else
          handlers.onRecord(
            (res) => renderContent(res, false),
            (err) => renderContent(null, false, err)
          );
        if (!isRecording) renderContent(null, true);
      };

      document.getElementById("btn-playback-user").onclick = () =>
        handlers.onPlayback();
    };

    renderContent();
  }

  function renderAssessmentResult(data, container) {
    if (!data || !data.NBest) {
      container.innerHTML = `<div style="color:red; text-align:center; padding:10px;">Error</div>`;
      return;
    }
    const result = data.NBest[0];
    const score = Math.round(result.AccuracyScore);
    const color = score >= 80 ? "#52c41a" : score >= 60 ? "#faad14" : "#ff4d4f";
    let html = `...`; // Old assessment result renderer can be deprecated or kept for mini-popups
    container.innerHTML = html;
    container.style.display = "block";
  }

  async function handleMicClick(text, container) {
    // This logic should now be in native-core.js
    // It will call renderAssessmentModal instead
  }

  return {
    renderSearchModal,
    renderPopup,
    renderFormModal,
    renderAssessmentModal,
    hideAll,
  };
})();
