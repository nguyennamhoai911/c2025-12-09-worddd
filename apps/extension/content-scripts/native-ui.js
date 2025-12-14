console.log("✅ Native UI Loaded");

window.NativeUI = (function () {
  let root = null;
  let searchWrapper = null; // Ctrl+Q Container
  let miniPopup = null; // Shift Popup

  // Icons
  const ICONS = {
    search:
      '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/></svg>',
    mic: '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M512 624c93.9 0 170-75.2 170-168V232c0-92.8-76.1-168-170-168s-170 75.2-170 168v224c0 92.8 76.1 168 170 168zm-110-392c0-59.6 49.3-108 110-108s110 48.4 110 108v224c0 59.6-49.3 108-110 108s-110-48.4-110-108V232zm270 224c0 88.4-71.6 160-160 160s-160-71.6-160-160a30 30 0 00-60 0c0 110.5 82 202.1 190 217.5V944h-90a30 30 0 000 60h240a30 30 0 000-60h-90V873.5c108-15.4 190-107 190-217.5a30 30 0 00-60 0z"/></svg>',
    sound:
      '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M625.9 115c-5.9 0-11.9 1.6-17.4 5.3L254 352H90c-17.7 0-32 14.3-32 32v256c0 17.7 14.3 32 32 32h164l354.5 231.7c5.5 3.6 11.6 5.3 17.4 5.3 16.7 0 32.1-13.3 32.1-32.1V147.1c0-18.8-15.4-32.1-32.1-32.1zM586 803L298 614.8V409.2L586 221v582zm302.2-402.1c-5.9-7.9-17.2-9.6-25.2-3.7l-35.9 26.8c-8 6-9.6 17.3-3.7 25.3C842.1 474.6 852 503 852 533c0 23.8-6.2 46.5-16.7 66.7-4.8 9.3-1.4 20.7 7.5 25.8l34.6 19.8c9.3 5.3 21.2 2.3 26.6-6.6C918 612.2 926 573.9 926 533c0-43-12.7-83.3-34.9-117.4z"/></svg>',
    mark: '<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 00.6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0046.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3z"/></svg>',
  };

  function init() {
    if (document.getElementById("vocab-root")) return;
    root = document.createElement("div");
    root.id = "vocab-root";
    document.body.appendChild(root);

    // 1. Search Wrapper (Ctrl+Q) - Transparent Overlay
    searchWrapper = document.createElement("div");
    searchWrapper.id = "vocab-search-wrapper";
    searchWrapper.innerHTML = `
        <div id="vocab-search-modal">
            <div class="vocab-header">
                <div class="vocab-input-affix">
                    ${ICONS.search}
                    <input class="vocab-search-input" id="native-search-input" placeholder="Search vocabulary..." autocomplete="off">
                </div>
            </div>
            <div id="vocab-modal-body" class="vocab-body"></div>
            <div id="vocab-modal-assessment"></div>
        </div>
    `;
    root.appendChild(searchWrapper);

    // 2. Mini Popup (Shift)
    miniPopup = document.createElement("div");
    miniPopup.id = "vocab-mini-popup";
    root.appendChild(miniPopup);

    // Close Events
    searchWrapper.onclick = (e) => {
      if (e.target === searchWrapper) hideAll();
    };
    searchWrapper.addEventListener("keydown", (e) => e.stopPropagation());
  }

  function hideAll() {
    if (searchWrapper) searchWrapper.style.display = "none";
    if (miniPopup) miniPopup.style.display = "none";
    window.speechSynthesis.cancel();
  }

  // --- MODE 1: RENDER SEARCH MODAL (CTRL + Q) ---
  function renderSearchModal(keyword, dbResults, apiData, handlers) {
    init();
    searchWrapper.style.display = "block";

    const input = document.getElementById("native-search-input");
    if (input.value !== keyword && keyword) input.value = keyword;
    input.focus();
    input.oninput = (e) => handlers.onInput(e.target.value);

    // Enter to Add logic
    const exactMatch = dbResults.find(
      (w) => w.word.toLowerCase() === (keyword || "").toLowerCase()
    );
    input.onkeydown = (e) => {
      if (e.key === "Enter" && keyword && !exactMatch) {
        handlers.onAdd(keyword, apiData);
      }
    };

    const body = document.getElementById("vocab-modal-body");
    let html = "";

    // 1. ADD NEW (Nếu chưa có)
    if (keyword && !exactMatch) {
      const trans = apiData?.trans || {};
      const meaning =
        trans.wordMeaning ||
        (typeof trans === "string" ? trans : "Translating...");
      const pronun = apiData?.phonetics?.us || "";

      html += `
        <div class="vocab-add-box">
            <div class="vocab-add-title">Add: "${keyword}"</div>
            <div class="vocab-add-info">${pronun} • ${meaning}</div>
            <div style="font-size:12px; color:#888; margin-bottom:8px;">Press Enter to save to DB</div>
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
                    <button class="ant-btn ant-btn-icon btn-mark" data-idx="${idx}" title="Mark Interaction">${
          ICONS.mark
        }</button>
                    <button class="ant-btn ant-btn-icon btn-listen" data-idx="${idx}" title="Listen">${
          ICONS.sound
        }</button>
                    <button class="ant-btn ant-btn-icon btn-mic" data-idx="${idx}" title="Practice">${
          ICONS.mic
        }</button>
                </div>
            </div>`;
      });
    } else if (!keyword) {
      html += `<div style="text-align:center; padding:30px; color:#999;">Type to search...</div>`;
    }

    body.innerHTML = html;

    // Bind Events
    if (keyword && !exactMatch) {
      document.getElementById("add-listen").onclick = () =>
        handlers.onSpeak(keyword);
      document.getElementById("add-mic").onclick = () =>
        handleMicClick(
          keyword,
          document.getElementById("vocab-modal-assessment")
        );
    }

    dbResults.forEach((item, idx) => {
      document.getElementById(`vocab-item-${idx}`).onclick = (e) => {
        if (!e.target.closest("button")) handlers.onMark(item); // Click row -> Mark
      };
      // Buttons
      const btnsListen = document.querySelectorAll(".btn-listen");
      btnsListen.forEach(
        (b) =>
          (b.onclick = (e) => {
            e.stopPropagation();
            handlers.onSpeak(dbResults[b.dataset.idx].word);
          })
      );

      const btnsMic = document.querySelectorAll(".btn-mic");
      btnsMic.forEach(
        (b) =>
          (b.onclick = (e) => {
            e.stopPropagation();
            // Gọi Mic và render kết quả vào div assessment chung
            handleMicClick(
              dbResults[b.dataset.idx].word,
              document.getElementById("vocab-modal-assessment")
            );
          })
      );

      const btnsMark = document.querySelectorAll(".btn-mark");
      btnsMark.forEach(
        (b) =>
          (b.onclick = (e) => {
            e.stopPropagation();
            handlers.onMark(dbResults[b.dataset.idx]);
          })
      );
    });
  }

  // --- MODE 2: RENDER SHIFT POPUP ---
  function renderPopup(data, rect, handlers) {
    init();
    miniPopup.style.display = "block";
    searchWrapper.style.display = "none";

    // Pos calc
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
      // Mở modal to để add
      renderSearchModal(
        data.text,
        [],
        { trans: data.trans, phonetics: data.phonetics },
        handlers
      );
    };
  }

  // --- ASSESSMENT RENDERER (ELSA STYLE) ---
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
        let pc =
          p.AccuracyScore >= 80
            ? "p-perfect"
            : p.AccuracyScore >= 60
            ? "p-good"
            : "p-bad";
        html += `<span class="phoneme-char ${pc}">${p.Phoneme}</span>`;
      });
      html += `</div></div>`;
    });
    html += `</div></div>`;

    container.innerHTML = html;
    container.style.display = "block";
  }

  // --- MIC LOGIC (NATIVE) ---
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
          // Gọi hàm assessPronunciation từ services (đã có ở file kia)
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

  return { renderSearchModal, renderPopup, hideAll };
})();
