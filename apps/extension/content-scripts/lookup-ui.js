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
  popup.style.position = "absolute"; // Ensure absolute positioning
  popup.style.zIndex = "10000";      // Ensure high z-index
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
    
    // Disable Text Selection while dragging
    document.body.style.userSelect = "none";
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    // Calculate position taking Scroll into account (since it's absolute)
    const newLeft = e.clientX + window.scrollX - dragOffset.x;
    const newTop = e.clientY + window.scrollY - dragOffset.y;
    
    popup.style.left = newLeft + "px";
    popup.style.top = newTop + "px";
  });
  
  document.addEventListener("mouseup", () => {
    isDragging = false;
    if (header) header.style.cursor = "move";
    document.body.style.userSelect = ""; // Restore selection
  });
}

// --- RENDER POPUP (COMPLETE REDESIGN) ---
function renderPopupContent(data, isSoundEnabled, callbacks) {
  if (!popup) return;
  const { toggleSound, closePopup, speakEdge, handleMark, handleMic } = callbacks;
  const existing = data.existing;

  // 1. Prepare Data
  const mainMeaning = typeof data.translation === "string" ? data.translation : data.translation?.wordMeaning || "Đang cập nhật...";
  const contextMeaning = data.translation?.contextMeaning || data.contextMeaning || "";
  const commonMeanings = data.translation?.commonMeanings || ""; // e.g. "khuyến nghị, đề xuất"
  const ipa = data.phonetics?.us || data.phonetics?.uk || "/.../";
  
  // Clean IPA slashes if present
  const cleanIpa = ipa.replace(/^\/|\/$/g, ""); 
  
  const pos = data.partOfSpeech || ""; // e.g. "Verb Phrase"
  const isStarred = !!existing;

  // 2. Prepare HTML Structure
  // Using Inline CSS for single-file portability as requested
  
  const content = `
    <div style="
        font-family: 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        width: 320px;
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        color: #333;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
    ">
        <!-- HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom:-5px;" id="popup-header">
            <div style="width: 40px; height: 40px; background: #FFC107; border-radius: 50%; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <!-- Hippo Logo Placeholder -->
                 <span style="font-size:24px;">🦛</span>
            </div>
            
            <div style="display: flex; gap: 12px; align-items: center;">
                 <!-- Bookmark Icon -->
                 <button id="btn-mark" style="background:none; border:none; cursor:pointer; color: ${isStarred ? '#4CAF50' : '#BDBDBD'}; transition: color 0.2s;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                 </button>
                 
                 <!-- Sound Toggle -->
                 <button id="btn-sound" style="background:none; border:none; cursor:pointer; color: ${isSoundEnabled ? '#333' : '#BDBDBD'};">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${isSoundEnabled 
                           ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>' 
                           : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
                        }
                    </svg>
                 </button>
                 
                 <!-- Close -->
                 <button id="btn-close" style="background:none; border:none; cursor:pointer; color: #BDBDBD;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                 </button>
            </div>
        </div>

        <!-- WORD & PLAY -->
        <div style="display: flex; align-items: center; gap: 8px;">
            <button id="btn-play-main" style="
                background: none; 
                border: none; 
                cursor: pointer; 
                color: #00C853; /* Bright Green */
                padding: 0;
                display: flex; 
                align-items: center;
            ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
            <span style="font-size: 20px; font-weight: 700; color: #000;">${data.text}</span>
        </div>
        
        <!-- IPA & POS -->
        <div style="color: #666; font-size: 14px; display:flex; align-items:center; gap:6px;">
            <span style="font-family: 'Lucida Sans Unicode', 'Arial Unicode MS', sans-serif;">/${cleanIpa}/</span>
            ${pos ? `<span style="font-size:12px; color:#888; border:1px solid #eee; padding:1px 4px; border-radius:4px;">(${pos})</span>` : ''}
            <span style="cursor:help; color:#999;" title="Part of Speech Info">ⓘ</span>
        </div>
        
        <!-- MEANING -->
        <div>
            <div style="font-size: 18px; font-weight: 700; color: #000; margin-bottom: 4px;">${mainMeaning}</div>
            ${commonMeanings ? `<div style="font-size: 14px; font-style: italic; color: #757575;">${commonMeanings}</div>` : ''}
        </div>
        
        <!-- DIVIDER -->
        <hr style="border: 0; border-top: 1px solid #F0F0F0; width: 100%; margin: 4px 0;">
        
        <!-- ASSESSMENT SECTION (Practice Mode) -->
        <div id="assessment-area" style="text-align:center;">
            <div id="assessment-result" style="margin-bottom:8px;"></div>
             <!-- Initial State: Just Big Mic Button -->
             <div id="practice-initial" style="padding: 20px 0;">
                <button id="btn-mic-initial" style="
                    width: 64px; height: 64px; 
                    border-radius: 50%; border: none; 
                    background: #E8F5E9; 
                    display: inline-flex; align-items: center; justify-content: center;
                    cursor: pointer; color: #00C853;
                    transition: all 0.2s;
                    box-shadow: 0 4px 10px rgba(0, 200, 83, 0.2);
                ">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                </button>
                <div style="font-size:12px; color:#888; margin-top:8px;">Practice</div>
             </div>

             <!-- Result State (Hidden Initially) -->
             <div id="practice-result" style="display:none;">
                 <!-- Colored IPA using existing cleanup logic -->
                 <div style="text-align:center; margin-bottom:12px;">
                    <span style="font-size: 18px; font-family: 'Lucida Sans Unicode', sans-serif; font-weight:600;" id="result-ipa">
                        /${cleanIpa}/
                    </span>
                 </div>
                 
                 <!-- Score & Mic Re-try -->
                 <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px;">
                    <!-- Legend -->
                    <div style="display:flex; flex-direction:column; gap:4px; font-size:10px; color:#666;">
                        <div style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; background:#FF5252; border-radius:4px;"></span> 0~59</div>
                        <div style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; background:#FFC107; border-radius:4px;"></span> 60~79</div>
                        <div style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; background:#00C853; border-radius:4px;"></span> 80~100</div>
                    </div>
                    
                    <!-- Circle Score -->
                    <div id="score-circle-container" style="position:relative; width:60px; height:60px;">
                        <!-- Content injected by JS -->
                    </div>
                    
                    <!-- Mic Button (Small Retry) -->
                    <div style="text-align:center;">
                        <button id="btn-mic-retry" style="
                            width: 48px; height: 48px; 
                            border-radius: 50%; border: 1px solid #E0E0E0; 
                            background: #F9F9F9; 
                            display:flex; align-items:center; justify-content:center;
                            cursor:pointer; color:#00C853;
                            transition: all 0.2s;
                        ">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </button>
                        <div style="font-size:10px; color:#888; margin-top:4px;">Practice</div>
                    </div>
                 </div>
                 
                 <!-- Review Buttons -->
                 <div style="display:flex; gap:12px; margin-top:16px;">
                    <button id="btn-play-user" style="flex:1; padding:8px; border-radius:20px; border:1px solid #ddd; background:#fff; font-size:13px; color:#555; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:#00C853"><path d="M8 5v14l11-7z"/></svg>
                        My voice
                    </button>
                    <button id="btn-play-std" style="flex:1; padding:8px; border-radius:20px; border:1px solid #ddd; background:#fff; font-size:13px; color:#555; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:#00C853"><path d="M8 5v14l11-7z"/></svg>
                        Standard
                    </button>
                 </div>
             </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #F0F0F0; width: 100%; margin: 4px 0;">

        <!-- CONTEXT -->
        <div>
            <div style="font-size: 14px; font-weight: 700; color: #000; margin-bottom: 8px;">Context</div>
            <div style="font-size: 14px; font-style: italic; color: #666; font-family:serif; line-height: 1.5; margin-bottom: 8px;">
                ${
                    data.contextText
                    ? data.contextText.replace(data.text, `<u style="text-decoration: underline; text-decoration-color: #999;">${data.text}</u>`)
                    : 'No context found.'
                }
            </div>
            <div style="font-size: 14px; color: #333; line-height: 1.4;">
                ${
                  contextMeaning 
                  ? (data.contextHighlight 
                      ? contextMeaning.replace(data.contextHighlight, `<u style="text-decoration: underline; text-decoration-color: #333;">${data.contextHighlight}</u>`)
                      : contextMeaning)
                  : ''
                }
            </div>
        </div>
        
        <div id="save-status" style="display:none;"></div>
    </div>
  `;
  
  popup.innerHTML = content;

  // 3. Attach Events
  enableDragging(document.getElementById("popup-header"));
  document.getElementById("btn-close").onclick = closePopup;
  document.getElementById("btn-sound").onclick = toggleSound;
  
  // Play Default
  const playMain = document.getElementById("btn-play-main");
  const playStd = document.getElementById("btn-play-std");
  playMain.onclick = () => speakEdge(data.text);
  playStd.onclick = () => speakEdge(data.text);
  
  // Mic Event Binding for New UI (Initial & Retry)
  // Mic Event Binding for New UI (Initial & Retry)
  const btnMicInitial = document.getElementById("btn-mic-initial");
  const btnMicRetry = document.getElementById("btn-mic-retry");
  
  // Helper to toggle visual state
  const toggleMicVisual = (btn, isStreaming) => {
      if (isStreaming) {
          // Show STOP state
          btn.style.background = "#FFEBEE"; 
          btn.style.color = "#F44336";
          btn.style.animation = "pulse 1.5s infinite"; // Optional pulse if global css allows
          // Change Icon to Square (Stop)
          btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;
      } else {
          // Revert to Mic Icon
          btn.style.background = "#E8F5E9"; // match initial green bg if it was green, or #F9F9F9 for retry
          if(btn.id === 'btn-mic-retry') btn.style.background = "#F9F9F9";
          
          btn.style.color = "#00C853";
          btn.style.animation = "none";
          btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
      }
  };

  const triggerMic = (btn) => {
      // NOTE: `handleMic` toggles the actual recording logic in lookup-main.js
      // We need to know the *next* state. 
      // Since we don't have direct access to `isRecording` variable from here easily without callback return,
      // We assume the toggle works.
      // Better approach: handleMic returns the new state or a promise.
      
      // Let's rely on class checking or just toggle local visual state knowing handleMic does the same.
      const isNowRecording = !btn.classList.contains("recording-active");
      
      if (isNowRecording) {
         btn.classList.add("recording-active");
         toggleMicVisual(btn, true);
      } else {
         btn.classList.remove("recording-active");
         toggleMicVisual(btn, false);
      }
      
      handleMic(data.text, btn, existing); 
  };

  if (btnMicInitial) {
      btnMicInitial.onclick = (e) => {
          e.stopPropagation();
          triggerMic(btnMicInitial);
      };
  }
  if (btnMicRetry) {
      btnMicRetry.onclick = (e) => {
          e.stopPropagation();
          triggerMic(btnMicRetry);
      };
  }
  
  // Mark / Save
  const btnMark = document.getElementById("btn-mark");
  if (!isStarred) {
      btnMark.onclick = (e) => {
          e.currentTarget.style.color = "#4CAF50"; // Visual feedback imminent
          handleMark(btnMark, document.getElementById("save-status"));
      };
  }
  
  // Mic - Logic reused from old code but attached to new UI
  const btnMic = document.getElementById("btn-mic");
  if (btnMic) {
      btnMic.onclick = (e) => {
          // Add recording visual state
          btnMic.style.background = "#FFEBEE"; 
          btnMic.style.color = "#F44336";
          handleMic(data.text, btnMic, existing);
      };
  }
}

// Keep helper for renderAssessmentResult if needed, or integrate it directly later.
// --- RENDER ASSESSMENT RESULT ---
function renderAssessmentResult(data, container, referenceText, callbacks) {
    const result = data.NBest?.[0];
    if (!result) return;

    // 0. CLEAR PROCESSING / ERROR STATUS
    const statusDiv = document.getElementById("assessment-result");
    if (statusDiv) statusDiv.innerHTML = "";

    const score = Math.round(result.PronunciationAssessment?.AccuracyScore || result.AccuracyScore || 0);

    // 1. Hide Initial / Show Result
    const initialArea = document.getElementById("practice-initial");
    const resultArea = document.getElementById("practice-result");
    if (initialArea) initialArea.style.display = "none";
    if (resultArea) {
      resultArea.style.display = "block";
      resultArea.classList.add("fade-in"); // Add simple animation class if css exists
    }

    // 2. Render Score Circle
    const circleContainer = document.getElementById("score-circle-container");
    if (circleContainer) {
        let color = "#FF5252"; // Red
        if (score >= 80) color = "#00C853"; // Green
        else if (score >= 60) color = "#FFC107"; // Orange

        // SVG Circle Progress
        const radius = 26;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        
        circleContainer.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="${radius}" stroke="#EEEEEE" stroke-width="6" fill="none"></circle>
                <circle cx="30" cy="30" r="${radius}" stroke="${color}" stroke-width="6" fill="none"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        stroke-linecap="round" transform="rotate(-90 30 30)"></circle>
                <text x="50%" y="45%" text-anchor="middle" dy=".3em" font-size="18" font-weight="bold" fill="#333">${score}</text>
                <text x="50%" y="70%" text-anchor="middle" dy=".3em" font-size="8" fill="${color}">${score >= 80 ? 'Good!' : (score >= 60 ? 'Okay' : 'Try again')}</text>
            </svg>
        `;
    }

    // 3. Render Colored IPA (Phoneme level)
    const ipaContainer = document.getElementById("result-ipa");
    if (ipaContainer && result.Words) {
        // Collect all phonemes with scores
        // Flattening logic: extension's analyze logic usually returns phonemes per word.
        // We will reconstruct the sticked IPA string but colored per phoneme.
        
        let htmlBuilder = "/";
        
        result.Words.forEach(word => {
            if (word.Phonemes) {
                word.Phonemes.forEach(p => {
                    let pScore = p.PronunciationAssessment?.AccuracyScore || p.AccuracyScore || 0;
                    let pColor = "#FF5252";
                    if (pScore >= 80) pColor = "#00C853";
                    else if (pScore >= 60) pColor = "#FFC107";
                    
                    htmlBuilder += `<span style="color:${pColor};">${p.Phoneme}</span>`;
                });
                htmlBuilder += " "; // Space between words
            } else {
                 // Fallback if no phonemes (error word)
                 htmlBuilder += `<span style="color:#FF5252;">${word.Word}</span> `;
            }
        });
        
        htmlBuilder = htmlBuilder.trim() + "/";
        ipaContainer.innerHTML = htmlBuilder;
    }

    // 4. Bind Review Buttons
    const btnPlayUser = document.getElementById("btn-play-user");
    const btnPlayStd = document.getElementById("btn-play-std");
    
    if (btnPlayUser && callbacks.playUserAudio) {
        btnPlayUser.onclick = callbacks.playUserAudio;
    }
    if (btnPlayStd && callbacks.speakEdge) {
        btnPlayStd.onclick = () => callbacks.speakEdge(referenceText);
    }
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
