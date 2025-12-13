// =======================================================================
// MODULE: UI RENDERING
// =======================================================================

let popup = null;
let isPopupOpen = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function createPopup() {
  if (popup) popup.remove();
  popup = document.createElement("div");
  popup.id = "tts-popup";
  popup.style.display = "none";
  document.body.appendChild(popup);
  return popup;
}

function closePopup() {
  if (popup) popup.style.display = "none";
  window.speechSynthesis.cancel();
  isPopupOpen = false;
}

function enableDragging(header) {
  header.style.cursor = "move";
  header.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;
    isDragging = true;
    const rect = popup.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    header.style.cursor = "grabbing";
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    popup.style.left = e.clientX - dragOffset.x + "px";
    popup.style.top = e.clientY - dragOffset.y + "px";
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    header.style.cursor = "move";
  });
}

function renderPopupContent(data, isSoundEnabled, callbacks) {
  if (!popup) return;
  const { toggleSound, closePopup, speakEdge, handleMark, handleMic } =
    callbacks;

  let content = `
      <div class="tts-header" id="popup-header">
        <button id="sound-toggle" class="sound-btn">${
          isSoundEnabled ? "🔊" : "🔇"
        }</button>
        <div style="flex:1"></div>
        <button id="close-popup" class="close-btn">✕</button>
      </div>

      <div class="tts-actions">
        <div style="display:flex; gap:15px; align-items:center;">
            <button id="replay-tts-btn" class="mic-btn" style="width:45px; height:45px; background:#4CAF50;" title="Nghe lại">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            
            <button id="mark-btn" class="mic-btn" style="width:55px; height:55px; background:#FF9800; box-shadow: 0 4px 0 #F57C00;" title="Lưu từ này">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>

            <button id="mic-btn" class="mic-btn" style="width:45px; height:45px;" title="Check phát âm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
        </div>
        <div id="save-status" style="margin-top:8px; font-size:12px; font-weight:600; min-height:18px;"></div>
        <div id="assessment-result"></div>
      </div>
      
      <div class="tts-content">`;

  // Images
  if (data.images && data.images.length) {
    content += `<div class="tts-images-container">${data.images
      .map(
        (url) =>
          `<div class="tts-image"><img src="${url}" onerror="this.style.display='none'"/></div>`
      )
      .join("")}</div>`;
  }

  // Meaning
  if (data.translation) {
    content += `<div class="word-text" style="font-size:24px; text-align:center; margin-bottom:5px;">${data.text}</div>`;
    const mainMeaning =
      typeof data.translation === "string"
        ? data.translation
        : data.translation.wordMeaning;
    if (mainMeaning)
      content += `<div class="primary-meaning">${mainMeaning}</div>`;

    if (data.translation.contextMeaning) {
      content += `<div class="context-box"><strong>Ngữ cảnh:</strong><br/><em style="color:#777">"...${
        data.contextText || ""
      }..."</em><br/>👉 <span style="color:#2e7d32; font-weight:600;">${
        data.translation.contextMeaning
      }</span></div>`;
    }
  } else {
    content += `<div class="tts-info">Không tìm thấy bản dịch.</div>`;
  }

  content += `</div>`; // End .tts-content
  popup.innerHTML = content;

  // Events
  enableDragging(document.getElementById("popup-header"));
  document.getElementById("close-popup").onclick = closePopup;
  document.getElementById("sound-toggle").onclick = toggleSound;
  document.getElementById("replay-tts-btn").onclick = () =>
    speakEdge(data.text);

  // Mark Event
  const markBtn = document.getElementById("mark-btn");
  markBtn.onclick = (e) => {
    e.stopPropagation();
    handleMark(markBtn, document.getElementById("save-status"));
  };

  // Mic Event
  const micBtn = document.getElementById("mic-btn");
  micBtn.onclick = (e) => {
    e.stopPropagation();
    handleMic(data.text, micBtn);
  };
}

function renderAssessmentResult(data, container, referenceText, callbacks) {
  if (!container) return;
  if (!data || data.error) {
    container.innerHTML = `<div style="color:#ff5252; text-align:center;">⚠️ ${
      data?.error || "Lỗi API"
    }</div>`;
    return;
  }
  const result = data.NBest[0];
  const totalScore =
    result.AccuracyScore || result.PronunciationAssessment?.AccuracyScore || 0;
  const words = result.Words || [];
  let scoreColor =
    totalScore >= 80 ? "#4caf50" : totalScore >= 60 ? "#ffeb3b" : "#ff5252";

  let html = `<div class="assessment-box" style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-top:10px;">
    <div class="assessment-actions">
        <button id="btn-play-user" class="action-btn-small btn-user-audio">🗣️ My Voice</button>
        <button id="btn-play-standard" class="action-btn-small btn-ref-audio">🎧 Standard</button>
    </div>
    <div class="total-score-circle" style="border-color: ${scoreColor}; color: ${scoreColor}">${Math.round(
    totalScore
  )}</div>
    <div class="analyzed-content">`;

  words.forEach((word) => {
    const wScore =
      word.AccuracyScore || word.PronunciationAssessment?.AccuracyScore || 0;
    const errorType =
      word.ErrorType || word.PronunciationAssessment?.ErrorType || "None";
    let wordColor =
      errorType === "Omission" ? "#777" : wScore < 60 ? "#ff5252" : "#fff";
    let phonemeHtml = "";
    if (errorType !== "Omission") {
      (word.Phonemes || []).forEach((p) => {
        let pClass =
          p.AccuracyScore >= 90
            ? "p-perfect"
            : p.AccuracyScore >= 80
            ? "p-good"
            : p.AccuracyScore >= 60
            ? "p-fair"
            : "p-bad";
        phonemeHtml += `<span class="phoneme-char ${pClass}" title="/${p.Phoneme}/: ${p.AccuracyScore}">${p.Phoneme}</span>`;
      });
    } else {
      phonemeHtml = `<span style="font-size:10px; color:#999;">(missed)</span>`;
    }
    html += `<div class="word-block"><span class="word-text" style="color:${wordColor}">${word.Word}</span><div class="phoneme-row">${phonemeHtml}</div></div>`;
  });
  html += `</div></div>`;
  container.innerHTML = html;

  setTimeout(() => {
    const btnUser = document.getElementById("btn-play-user");
    const btnStandard = document.getElementById("btn-play-standard");
    if (btnUser) btnUser.onclick = callbacks.playUserAudio;
    if (btnStandard)
      btnStandard.onclick = () => callbacks.speakEdge(referenceText);
  }, 0);
}

function showFlashcard(item, callbacks) {
  const oldCard = document.getElementById("vocab-flashcard");
  if (oldCard) oldCard.remove();
  const card = document.createElement("div");
  card.id = "vocab-flashcard";
  card.className = "flashcard-slide-in";
  let imgHtml =
    item.data.images && item.data.images.length > 0
      ? `<img src="${item.data.images[0]}" style="width:100%; height:120px; object-fit:cover; border-radius:8px 8px 0 0; display:block;">`
      : "";
  const meaning = item.data.translation.wordMeaning || item.data.translation;
  card.innerHTML = `${imgHtml}<div style="padding:15px;"><h3 style="margin:0; font-size:22px; color:#333;">${item.word}</h3><p style="margin:5px 0 10px 0; color:#555;">${meaning}</p><div style="display:flex; justify-content:space-between;"><button id="fc-play-btn">▶</button><div id="fc-timer" style="color:#999;">10s</div></div></div><button id="fc-close" style="position:absolute; top:5px; right:5px;">✕</button>`;
  document.body.appendChild(card);
  callbacks.speakEdge(item.word);
  document.getElementById("fc-play-btn").onclick = () =>
    callbacks.speakEdge(item.word);
  document.getElementById("fc-close").onclick = () => card.remove();
  let timeLeft = 10;
  const interval = setInterval(() => {
    timeLeft--;
    const timerElem = document.getElementById("fc-timer");
    if (timerElem) timerElem.innerText = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(interval);
      card.classList.add("flashcard-slide-out");
      setTimeout(() => card.remove(), 500);
    }
  }, 1000);
}
