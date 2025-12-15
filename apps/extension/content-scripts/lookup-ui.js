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

  const existing = data.existing;

  // Logic tính điểm trung bình 3 lần gần nhất (nếu có)
  let scoreBadge = "";
  if (
    existing &&
    existing.pronunciationScores &&
    existing.pronunciationScores.length > 0
  ) {
    const scores = existing.pronunciationScores.slice(-3); // Lấy 3 điểm cuối
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    let color = avg >= 80 ? "#4CAF50" : avg >= 60 ? "#FFC107" : "#F44336";
    scoreBadge = `<span style="position:absolute; top:-5px; right:-5px; background:${color}; color:white; font-size:10px; padding:2px 5px; border-radius:10px; border:1px solid white;">${avg}</span>`;
  }

  // 👇 [UPDATE] Render nút Mark
  let markBtnHtml = "";
  if (existing) {
    // A. ĐÃ CÓ: Hiện nút "Đã lưu" (Màu xám hoặc Xanh đậm, không cho click save nữa)
    markBtnHtml = `
        <button id="mark-btn-disabled" class="mic-btn" style="width:55px; height:55px; background:#E0E0E0; box-shadow:none; cursor:default; position:relative;" title="Đã có trong bộ từ vựng">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#4CAF50" stroke="#4CAF50" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            ${scoreBadge}
        </button>`;
  } else {
    // B. CHƯA CÓ: Hiện nút Save như cũ
    markBtnHtml = `
        <button id="mark-btn" class="mic-btn" style="width:55px; height:55px; background:#FF9800; box-shadow: 0 4px 0 #F57C00;" title="Lưu từ này">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>`;
  }

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
            
            ${markBtnHtml}

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
  // 2. Hiển thị Phiên âm
  if (data.phonetics && (data.phonetics.us || data.phonetics.uk)) {
    content += `<div class="tts-phonetic">
            ${
              data.phonetics.uk
                ? `<div class="phonetic-item"><span class="flag">🇬🇧</span><span class="phonetic-text">${data.phonetics.uk}</span></div>`
                : ""
            }
            ${
              data.phonetics.us
                ? `<div class="phonetic-item"><span class="flag">🇺🇸</span><span class="phonetic-text">${data.phonetics.us}</span></div>`
                : ""
            }
        </div>`;
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

  // Chỉ gán sự kiện click nếu nút mark-btn tồn tại (tức là chưa lưu)
  const markBtn = document.getElementById("mark-btn");
  if (markBtn) {
    markBtn.onclick = (e) => {
      e.stopPropagation();
      handleMark(markBtn, document.getElementById("save-status"));
    };
  }

  // Mic Event
  const micBtn = document.getElementById("mic-btn");
  micBtn.onclick = (e) => {
    e.stopPropagation();
    handleMic(data.text, micBtn, data.existing); // 👈 Thêm data.existing
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

[cite_start]; // [cite: 704]
function showFlashcard(item, callbacks) {
  // 1. Xóa thẻ cũ
  const oldCard = document.getElementById("vocab-flashcard");
  if (oldCard) oldCard.remove();

  // 2. Lấy trạng thái âm thanh đã lưu (Mặc định là Bật)
  chrome.storage.local.get(["flashcard_sound_on"], (result) => {
    // Lưu ý: !== false nghĩa là undefined (lần đầu) cũng là True
    let isSoundOn = result.flashcard_sound_on !== false;

    // 3. Tạo thẻ
    const card = document.createElement("div");
    card.id = "vocab-flashcard";
    card.className = "flashcard-slide-in";

    // Style Gọn nhẹ, Hiện đại
    Object.assign(card.style, {
      cursor: "pointer",
      borderLeft: "5px solid #58cc02", // Màu xanh thương hiệu
      fontFamily: "'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      maxWidth: "280px", // Gọn gàng
      background: "#fff",
      boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
      borderRadius: "8px",
      overflow: "hidden",
    });

    // Icons SVG
    const ICON_CLOSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const ICON_SOUND_ON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    const ICON_SOUND_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
    const ICON_MIC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;

    // 4. Chuẩn bị HTML cho Phiên âm & Từ loại
    const pronunHtml = item.data.pronunciation
      ? `<span style="font-family:monospace; font-size:12px; color:#888; margin-left:8px;">/${item.data.pronunciation}/</span>`
      : "";

    const posHtml = item.data.partOfSpeech
      ? `<span style="font-size:10px; font-weight:700; color:#1890ff; background:#e6f7ff; border:1px solid #91d5ff; padding:1px 4px; border-radius:4px; margin-left:6px; text-transform:uppercase; vertical-align:middle;">${item.data.partOfSpeech}</span>`
      : "";

    // 5. Nội dung HTML
    card.innerHTML = `
      <div style="padding:12px 12px 4px 12px; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
              <div style="display:flex; align-items:center; flex-wrap:wrap;">
                  <span style="font-size:18px; color:#333; font-weight:800; line-height:1.2;">${
                    item.word
                  }</span>
                  ${posHtml}
              </div>
              <div style="margin-top:2px;">${pronunHtml}</div>
          </div>
          <button id="fc-close" style="background:none; border:none; cursor:pointer; padding:4px;">${ICON_CLOSE}</button>
      </div>

      <div style="padding:4px 12px 12px 12px;">
          <p style="margin:0; font-size:15px; color:#444; line-height:1.4;">${
            item.data.translation
          }</p>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#f9f9f9; border-top:1px solid #eee;">
          <div style="display:flex; gap:8px;">
              <button id="fc-sound-btn" title="Bật/Tắt đọc tự động" style="background:#fff; border:1px solid #ddd; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;">
                  ${isSoundOn ? ICON_SOUND_ON : ICON_SOUND_OFF}
              </button>
              <button id="fc-mic-btn" title="Luyện phát âm" style="background:#fff; border:1px solid #ddd; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#f57c00;">
                  ${ICON_MIC}
              </button>
          </div>
          <div id="fc-timer" style="font-size:11px; font-weight:bold; color:#aaa;">12s</div>
      </div>
    `;

    document.body.appendChild(card);

    // --- LOGIC ---

    // A. Auto Speak (Chỉ đọc nếu Sound đang ON)
    if (isSoundOn) {
      callbacks.speakEdge(item.word);
    }

    // B. Toggle Sound & Save Memory
    const btnSound = document.getElementById("fc-sound-btn");
    btnSound.onclick = (e) => {
      e.stopPropagation();
      isSoundOn = !isSoundOn; // Đổi trạng thái

      // Update UI Icon
      btnSound.innerHTML = isSoundOn ? ICON_SOUND_ON : ICON_SOUND_OFF;

      // Save vào Storage (Quan trọng!)
      chrome.storage.local.set({ flashcard_sound_on: isSoundOn });

      if (!isSoundOn) window.speechSynthesis.cancel();
      else callbacks.speakEdge(item.word);
    };

    // C. Các nút khác
    document.getElementById("fc-mic-btn").onclick = (e) => {
      e.stopPropagation();
      card.remove();
      if (callbacks.onMic) callbacks.onMic();
    };

    document.getElementById("fc-close").onclick = (e) => {
      e.stopPropagation();
      card.remove();
      window.speechSynthesis.cancel();
    };

    // Click vào card để Edit
    card.onclick = (e) => {
      if (e.target.closest("button")) return;
      card.remove();
      if (callbacks.onEdit) callbacks.onEdit();
    };

    // Timer Auto Close
    let timeLeft = 12;
    const interval = setInterval(() => {
      timeLeft--;
      const t = document.getElementById("fc-timer");
      if (t) t.innerText = `${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(interval);
        card.classList.add("flashcard-slide-out");
        setTimeout(() => {
          if (card.parentNode) card.remove();
        }, 500);
      }
    }, 1000);
  });
}
