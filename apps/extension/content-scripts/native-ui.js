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

  // --- 1. HÀM XỬ LÝ KÉO THẢ & RESIZE & LƯU STATE ---
  function enableDragAndPersist(headerEl, modalEl) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    // A. Load State (Size & Position)
    const savedState = localStorage.getItem("vocab_widget_state");
    if (savedState) {
      try {
        const { top, left, width, height } = JSON.parse(savedState);
        // Validate bounds
        const safeTop = Math.min(Math.max(0, top), window.innerHeight - 50);
        const safeLeft = Math.min(Math.max(0, left), window.innerWidth - 50);

        modalEl.style.top = safeTop + "px";
        modalEl.style.left = safeLeft + "px";
        modalEl.style.transform = "none"; // Bỏ center default

        if (width) modalEl.style.width = width + "px";
        if (height) modalEl.style.height = height + "px";
      } catch (e) {}
    } else {
      modalEl.style.width = "600px"; // Default width
      modalEl.style.top = "15%";
      modalEl.style.left = "50%";
      modalEl.style.transform = "translateX(-50%)";
    }

    // Helper: Save to LocalStorage
    const saveState = () => {
      const rect = modalEl.getBoundingClientRect();
      const state = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
      localStorage.setItem("vocab_widget_state", JSON.stringify(state));
    };

    // B. Drag Logic
    headerEl.onmousedown = (e) => {
      // Ignore click on inputs/buttons
      if (
        e.target.tagName === "INPUT" ||
        e.target.closest(".vocab-mode-flag") ||
        e.target.tagName === "BUTTON"
      )
        return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = modalEl.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      modalEl.style.transform = "none";
      modalEl.style.width = rect.width + "px"; // Fix width khi start drag
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      modalEl.style.left = `${initialLeft + (e.clientX - startX)}px`;
      modalEl.style.top = `${initialTop + (e.clientY - startY)}px`;
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        saveState();
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // C. Resize Observer (Auto Save Size)
    const resizeObserver = new ResizeObserver(() => {
      if (window.vocabResizeTimer) clearTimeout(window.vocabResizeTimer);
      window.vocabResizeTimer = setTimeout(saveState, 500); // Debounce save
    });
    resizeObserver.observe(modalEl);
  }

  function init() {
    if (document.getElementById("vocab-root")) return;
    root = document.createElement("div");
    root.id = "vocab-root";
    document.body.appendChild(root);
    const style = document.createElement("style");
    style.innerHTML = `
      .vocab-mode-flag {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #fff;
        border: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        z-index: 20;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        user-select: none;
        transition: all 0.2s;
      }
      .vocab-mode-flag:hover { transform: translateY(-50%) scale(1.1); box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
      .google-trans-box { background: #f8f9fa; border-bottom: 1px solid #eee; padding: 12px 16px; cursor: pointer; transition: background 0.1s; }
      .google-trans-box:hover { background: #e8f0fe; }
      .google-main-text { font-size: 16px; color: #1a73e8; font-weight: 600; margin-bottom: 2px; }
      .google-sub-text { font-size: 11px; color: #5f6368; }
      .vocab-list-item { cursor: pointer; padding: 10px 16px; border-bottom: 1px solid #f1f1f1; display: flex; align-items: flex-start; gap: 10px; transition: background 0.1s; }
      .vocab-list-item:hover { background: #f5f5f5; }
      .vocab-actions { display: flex; gap: 8px; align-items: center; margin-left: auto; }
      .vocab-score-badge { font-size:10px; color:#fff; padding:1px 6px; border-radius:10px; margin-left:6px; font-weight:bold; }
      .vocab-search-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        color: #333;
        resize: none; /* Không cho user kéo giãn thủ công */
        overflow: hidden; /* Ẩn thanh cuộn */
        min-height: 24px;
        line-height: 1.5;
        font-family: inherit;
        padding-top: 4px; 
      }
      .action-btn-circle {
        width: 28px; height: 28px; border-radius: 50%; border: 1px solid #ddd;
        background: #fff; display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: #5f6368; padding: 0; z-index: 10;
      }
      .action-btn-circle:hover { background: #f1f3f4; color: #1a73e8; border-color: #1a73e8; }
      .action-btn-circle svg { width: 16px; height: 16px; }
    `;
    root.appendChild(style);
    // 1. Search Wrapper
    searchWrapper = document.createElement("div");
    searchWrapper.id = "vocab-search-wrapper";
    searchWrapper.innerHTML = `
      <div id="vocab-search-modal">
        <div class="vocab-header" id="vocab-drag-handle" style="position:relative;">
          <div class="vocab-input-affix" style="padding-right: 45px;"> ${ICONS.search}
            <textarea class="vocab-search-input" id="native-search-input" placeholder="Search..." autocomplete="off" rows="1"></textarea>
          </div>
          <div id="vocab-mode-trigger"></div>
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

  // --- RENDER FORM MODAL (POPUP CHI TIẾT) ---
  function renderFormModal(data, handlers) {
    if (!formWrapper) return;

    // Style lại wrapper để nó nằm đè lên search nhưng độc lập
    formWrapper.innerHTML = "";
    formWrapper.style.display = "flex"; // Hiện form

    const isEdit = data.isEditMode;

    // Meaning value for prefill
    const meaningVal = data.meaning || "";
    // HTML Header có Mic và Loa
    const html = `
      <div class="vocab-modal-content" style="width: 400px; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;">
        <div class="vocab-header" style="justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #eee; background: #f8f9fa;">
           <div style="font-weight: 700; font-size: 16px; color: #333; display: flex; align-items: center; gap: 10px;">
              ${isEdit ? "Edit Word" : "New Word"}
              
              <button type="button" class="action-btn-circle btn-sound" id="btn-popup-speak" title="Listen">${
                ICONS.sound
              }</button>
              <button type="button" class="action-btn-circle btn-mic" id="btn-popup-mic" title="Practice">${
                ICONS.mic
              }</button>
           </div>
           
           <div id="btn-close-form" style="cursor: pointer; padding: 4px; color: #666;">${
             ICONS.close
           }</div>
        </div>

        <div class="vocab-body" style="padding: 16px; overflow-y: auto; max-height: 60vh;">
            <div style="margin-bottom: 12px;">
                <label style="display:block; font-size:11px; font-weight:600; color:#5f6368; margin-bottom:4px;">WORD</label>
                <input id="input-word" value="${
                  data.word || ""
                }" class="vocab-form-input" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-weight:bold; color:#1a73e8;">
            </div>
            
            <div style="display:flex; gap:10px; margin-bottom: 12px;">
                <div style="flex:1">
                    <label style="display:block; font-size:11px; font-weight:600; color:#5f6368; margin-bottom:4px;">TYPE</label>
                    <input id="input-pos" value="${
                      data.partOfSpeech || ""
                    }" class="vocab-form-input" placeholder="n, v, adj..." style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;">
                </div>
                <div style="flex:1">
                    <label style="display:block; font-size:11px; font-weight:600; color:#5f6368; margin-bottom:4px;">IPA</label>
                    <input id="input-ipa" value="${
                      data.pronunciation || ""
                    }" class="vocab-form-input" placeholder="/.../" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;">
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <label style="display:block; font-size:11px; font-weight:600; color:#5f6368; margin-bottom:4px;">MEANING</label>
                <textarea id="input-mean" rows="2" class="vocab-form-input" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; resize:vertical;">${meaningVal}</textarea>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:11px; font-weight:600; color:#5f6368; margin-bottom:4px;">EXAMPLE</label>
                <textarea id="input-ex" rows="2" class="vocab-form-input" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; resize:vertical;">${
                  data.example || ""
                }</textarea>
            </div>

            <button id="btn-save-form" style="width:100%; background:#1a73e8; color:white; padding:10px; border:none; border-radius:6px; font-weight:600; cursor:pointer;">
                ${isEdit ? "Update Vocabulary" : "Save to Library"}
            </button>
        </div>
      </div>
    `;

    formWrapper.innerHTML = html;

    // --- BIND EVENTS ---

    // 1. Close Button: Chỉ đóng formWrapper
    document.getElementById("btn-close-form").onclick = () => {
      formWrapper.style.display = "none";
      // Search Modal vẫn giữ nguyên bên dưới
    };

    // 2. Speak Button: Luôn dùng handlers.onSpeak để có giọng Aria
    document.getElementById("btn-popup-speak").onclick = () => {
      const currentWord = document.getElementById("input-word").value;
      // Gọi handler từ Core để dùng giọng Aria
      if (handlers.onSpeak) handlers.onSpeak(currentWord);
    };

    // 3. Mic Button
    document.getElementById("btn-popup-mic").onclick = () => {
      const currentWord = document.getElementById("input-word").value;
      const currentIpa = document.getElementById("input-ipa").value;
      // Gọi Modal Assessment
      window.NativeCore.openAssessment({
        word: currentWord,
        pronunciation: currentIpa,
        id: data.id || "temp_form",
      });
    };

    // 4. Save Button (Giữ nguyên logic cũ)
    document.getElementById("btn-save-form").onclick = async () => {
      const newData = {
        id: data.id,
        word: document.getElementById("input-word").value,
        partOfSpeech: document.getElementById("input-pos").value,
        pronunciation: document.getElementById("input-ipa").value,
        meaning: document.getElementById("input-mean").value,
        example: document.getElementById("input-ex").value,
        occurrence: data.occurrence || 1,
      };

      // Gọi hàm save handler truyền từ Core
      if (handlers.onSave) {
        // Show loading text
        document.getElementById("btn-save-form").textContent = "Saving...";
        await handlers.onSave(newData);
        formWrapper.style.display = "none"; // Đóng form sau khi save xong
      }
    };
  }
  function renderSearchModal(keyword, dbResults, apiData, handlers) {
    init(); // Đảm bảo init đã chạy
    searchWrapper.style.display = "block";

    const input = document.getElementById("native-search-input");
    const body = document.getElementById("vocab-modal-body");
    const modeTrigger = document.getElementById("vocab-mode-trigger");
    const mode = handlers.mode || "EN";
    const userTyped = handlers.rawInput || "";

    // 1. RENDER FLAG BUTTON
    const flagIcon = mode === "VI" ? "🇻🇳" : "🇬🇧";
    modeTrigger.innerHTML = `<div class="vocab-mode-flag" title="Chuyển chế độ" style="cursor:pointer;">${flagIcon}</div>`;
    modeTrigger.onclick = (e) => {
      e.stopPropagation();
      handlers.onModeChange(mode === "VI" ? "EN" : "VI");
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
    // Auto height
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

    if (!input.dataset.hasEvent) {
      input.oninput = (e) => {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
        handlers.onInput(e.target.value);
      };
      input.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handlers.onEnter(input.value);
        }
      });
      ["paste", "copy", "cut", "selectstart"].forEach((evt) =>
        input.addEventListener(evt, (e) => e.stopPropagation())
      );
      input.dataset.hasEvent = "true";
    }

    // 3. RENDER BODY
    let html = "";

    // A. GOOGLE RESULT (STYLE CỨNG ĐỂ HIỆN NÚT)
    if (apiData && apiData.trans) {
      const transText =
        typeof apiData.trans === "string"
          ? apiData.trans
          : apiData.trans.wordMeaning;
      const phonetics = apiData.phonetics?.us || "";
      const label =
        mode === "VI" ? "Dịch Anh (Tự động)" : "Nghĩa tiếng Việt (Google)";

      // 👇 Style trực tiếp cho nút (width, height, background) để đảm bảo hiện 100%
      const btnStyle = `width:30px; height:30px; border-radius:50%; border:1px solid #ddd; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; min-width:30px; color:#555;`;

      html += `
        <div class="google-trans-box" id="google-result-box" style="padding:12px 16px; border-bottom:1px solid #eee; background:#f8f9fa; cursor:pointer;">
             <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex:1; margin-right:10px;">
                    <div class="google-main-text" style="font-size:16px; color:#1a73e8; font-weight:bold; margin-bottom:4px; word-break:break-word;">
                        ${transText}
                    </div>
                    <div class="google-sub-text" style="font-size:11px; color:#666;">
                        ${
                          phonetics
                            ? `<span style="color:#333;">/${phonetics}/</span> • `
                            : ""
                        }
                        ${label}
                    </div>
                </div>
                
                <div style="display:flex; gap:8px; align-items:center;">
                     <button type="button" style="${btnStyle}" id="btn-trans-speak" title="Nghe">${
        ICONS.sound
      }</button>
                     <button type="button" style="${btnStyle}" id="btn-trans-mic" title="Luyện nói">${
        ICONS.mic
      }</button>
                </div>
             </div>
        </div>`;
    }

    // B. DATABASE RESULTS
    if (dbResults && dbResults.length > 0) {
      dbResults.forEach((item) => {
        const isMatch = item.word.toLowerCase() === keyword.toLowerCase();
        let scoreHtml = "";
        if (item.pronunciationScores && item.pronunciationScores.length > 0) {
          const avg = Math.round(
            item.pronunciationScores.reduce((a, b) => a + b, 0) /
              item.pronunciationScores.length
          );
          const color =
            avg >= 80 ? "#4caf50" : avg >= 60 ? "#fbc02d" : "#ef4444";
          scoreHtml = `<span style="font-size:10px; background:${color}; color:#fff; padding:1px 6px; border-radius:10px; margin-left:6px; font-weight:bold;">${avg}</span>`;
        }

        const btnStyle = `width:28px; height:28px; border-radius:50%; border:1px solid #ddd; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; min-width:28px; color:#555;`;

        html += `
            <div class="vocab-list-item" id="item-${
              item.id
            }" style="padding:10px 16px; border-bottom:1px solid #f1f1f1; display:flex; align-items:flex-start; cursor:pointer;">
                <div style="flex:1;">
                    <div class="vocab-word-text" style="${
                      isMatch ? "color:#1a73e8; font-weight:700" : ""
                    }">
                        ${item.word}
                        ${
                          item.pronunciation
                            ? `<span style="color:#666; font-weight:400; margin-left:4px;">/${item.pronunciation}/</span>`
                            : ""
                        }
                        ${scoreHtml}
                    </div>
                    <div class="vocab-word-meta" style="font-size:12px; color:#666; margin-top:2px;">
                       ${
                         item.partOfSpeech
                           ? `<span style="border:1px solid #eee; padding:0 4px; border-radius:4px; margin-right:4px;">${item.partOfSpeech}</span>`
                           : ""
                       } 
                       ${item.meaning || ""}
                    </div>
                </div>
                <div style="display:flex; gap:8px; align-items:center; margin-left:10px;">
                    <button type="button" style="${btnStyle}" id="btn-speak-${
          item.id
        }">${ICONS.sound}</button>
                    <button type="button" style="${btnStyle}" id="btn-mic-${
          item.id
        }">${ICONS.mic}</button>
                </div>
            </div>`;
      });
    } else if (!apiData && keyword) {
      html += `<div style="padding:20px; text-align:center; color:#999;">Đang tìm kiếm...</div>`;
    }

    body.innerHTML = html;

    // 4. BIND EVENTS
    if (apiData && apiData.trans) {
      const transText =
        typeof apiData.trans === "string"
          ? apiData.trans
          : apiData.trans.wordMeaning;

      const box = document.getElementById("google-result-box");
      if (box)
        box.onclick = (e) => {
          if (e.target.closest("button")) return;
          // Mode VI: Lưu từ Anh (transText), Nghĩa (keyword)
          // Mode EN: Lưu từ Anh (keyword), Nghĩa (User nhập)
          const wordToSave = mode === "VI" ? transText : keyword;
          const meaningToSave = mode === "VI" ? keyword : "";
          handlers.onOpenCreate(wordToSave, meaningToSave);
        };

      const btnSpeak = document.getElementById("btn-trans-speak");
      if (btnSpeak)
        btnSpeak.onclick = (e) => {
          e.stopPropagation();
          // Luôn đọc từ Tiếng Anh
          const textToSpeak = mode === "VI" ? transText : keyword;
          handlers.onSpeak(textToSpeak);
        };

      const btnMic = document.getElementById("btn-trans-mic");
      if (btnMic)
        btnMic.onclick = (e) => {
          e.stopPropagation();
          const textToPractice = mode === "VI" ? transText : keyword;
          handlers.onMic({
            word: textToPractice,
            id: "temp_google",
            pronunciation: apiData.phonetics?.us || "",
          });
        };
    }

    if (dbResults) {
      dbResults.forEach((item) => {
        const row = document.getElementById(`item-${item.id}`);
        if (row) {
          row.onclick = (e) => {
            if (e.target.closest("button")) return;
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

  // Helper Speak: Update để hỗ trợ set ngôn ngữ tiếng Anh chuẩn
  function speak(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; // 👈 Quan trọng: Ép giọng Anh Mỹ
    window.speechSynthesis.speak(u);
  }

  // Return API
  return {
    renderSearchModal,
    renderPopup: window.NativeUI?.renderPopup || function () {},
    renderFormModal,
    renderAssessmentModal,
    hideAll,
    speak: speak, // Sử dụng hàm speak đã nâng cấp
  };

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
        <div id="mini-popup-content" style="padding:16px;">
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

    // Add click-outside-to-close functionality
    const handleClickOutside = (e) => {
      if (miniPopup && miniPopup.style.display === "block") {
        const popupContent = document.getElementById("mini-popup-content");
        if (popupContent && !popupContent.contains(e.target)) {
          miniPopup.style.display = "none";
          document.removeEventListener("mousedown", handleClickOutside);
        }
      }
    };

    // Remove any existing listener before adding new one
    document.removeEventListener("mousedown", handleClickOutside);
    // Use setTimeout to avoid immediate closing from the same click that opened it
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
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
