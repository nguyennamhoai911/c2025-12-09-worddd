// =======================================================================
// MODULE: UI RENDERING
// =======================================================================

let popup = null;
let isPopupOpen = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function createPopup() {
  // 1. Clean up ghost elements (Zombie Popups)
  const oldPopup = document.getElementById("tts-popup");
  if (oldPopup) {
    oldPopup.remove();
  }

  // 2. Create New
  popup = document.createElement("div");
  popup.id = "tts-popup";
  popup.style.display = "none";
  
  // Ensure Inline Styles match CSS for robustness
  popup.style.position = "fixed"; 
  popup.style.zIndex = "2147483647"; 
  
  // Prevent Scroll Leak
  popup.addEventListener("wheel", (e) => {
    e.stopPropagation(); 
  }, { passive: false });

  document.body.appendChild(popup);
  
  // Add click-outside-to-close functionality
  const handleClickOutside = (e) => {
    if (popup && popup.style.display !== "none" && isPopupOpen) {
      // Check if click is outside the popup
      if (!popup.contains(e.target)) {
        closePopup();
      }
    }
  };
  
  // Store the handler so we can remove it later if needed
  popup._clickOutsideHandler = handleClickOutside;
  
  return popup;
}

function closePopup() {
  // Lookup by ID to ensure we catch the exact element in DOM
  const el = document.getElementById("tts-popup");
  if (el) {
    el.style.display = "none";
    el.innerHTML = ""; // Clear content to free memory/media
    
    // Remove click-outside listener
    if (el._clickOutsideHandler) {
      document.removeEventListener("mousedown", el._clickOutsideHandler);
    }
  }
  
  // Reset Variables
  window.speechSynthesis.cancel();
  isPopupOpen = false;
  isDragging = false; 
  
  // Blur focus
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
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
    
    // Calculate position relative to Viewport (Fixed)
    const newLeft = e.clientX - dragOffset.x;
    const newTop = e.clientY - dragOffset.y;
    
    popup.style.left = newLeft + "px";
    popup.style.top = newTop + "px";
  });
  
  document.addEventListener("mouseup", () => {
    isDragging = false;
    if (header) header.style.cursor = "move";
    document.body.style.userSelect = ""; // Restore selection
  });
}

function enableResizing(handle, content) {
  console.log('🔧 enableResizing called', { handle, content });
  if (!handle || !content) {
    console.warn('⚠️ Resize handle or content not found!');
    return;
  }
  
  let isResizing = false;
  let startX, startWidth;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(window.getComputedStyle(content).width, 10);
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    e.preventDefault();
    
    const newWidth = Math.max(300, startWidth + (e.clientX - startX));
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const clampedWidth = Math.min(newWidth, maxWidth);
    
    content.style.width = clampedWidth + "px";
  };

  const handleMouseUp = async () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.userSelect = "";
    
    const finalWidth = parseInt(content.style.width, 10);
    
    try {
      await chrome.storage.local.set({ popupWidth: finalWidth });
      console.log(`✅ Popup width saved: ${finalWidth}px`);
    } catch (e) {
      console.warn("Failed to save popup width:", e);
    }
  };

  handle.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

// Store callbacks for later updates
let uiCallbacks = {};

// --- PROGRESSIVE RENDERING: INITIAL SHELL ---
async function renderInitialPopup(text, callbacks) {
  if (!popup) return;
  uiCallbacks = callbacks || {};
  const { closePopup, toggleSound, speakEdge, handleMic, handleMark } = uiCallbacks;

  // Load width
  let width = 380;
  try {
    const storage = await chrome.storage.local.get(['popupWidth']);
    if (storage.popupWidth) width = storage.popupWidth;
  } catch (e) {}

  popup.style.width = width + "px";
  popup.style.maxWidth = "min(800px, calc(100vw - 40px))";
  popup.style.height = "auto";
  popup.style.boxSizing = "border-box";
  popup.style.display = "block";

  // Skeleton Style
  const skeletonStyle = `
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    display: inline-block;
  `;

  // Content Structure
  const content = `
    <div id="popup-content" style="
        font-family: 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        width: 100%;
        height: 100%;
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        color: #333;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: visible;
        overflow-x: hidden;
        box-sizing: border-box;
    ">
         <!-- HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom:-5px;" id="popup-header">
            <div style="width: 40px; height: 40px; background: #FFC107; border-radius: 50%; display:flex; align-items:center; justify-content:center;">
                 <span style="font-size:24px;">🦛</span>
            </div>
            
            <div style="display: flex; gap: 12px; align-items: center;">
                 <!-- Bookmark Icon -->
                 <button id="btn-mark" disabled style="background:none; border:none; cursor:wait; color: #E0E0E0; transition: color 0.2s;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                 </button>

                 <!-- Sound Toggle -->
                 <button id="btn-sound" style="background:none; border:none; cursor:pointer; color: #333;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                 </button>

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
            <button id="btn-play-main" style="background: none; border: none; cursor: pointer; color: #00C853; padding: 0;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <span style="font-size: 20px; font-weight: 700; color: #000;">${text}</span>
        </div>

        <!-- MEANING AREA (Skeleton) -->
        <div id="content-area">
             <div style="display:flex; gap:8px; margin-bottom:4px;">
                <div style="${skeletonStyle} width: 60px; height: 14px;"></div>
                <div style="${skeletonStyle} width: 40px; height: 14px;"></div>
             </div>
             <div style="${skeletonStyle} width: 70%; height: 24px; margin-bottom:4px;"></div>
             <div style="${skeletonStyle} width: 50%; height: 16px;"></div>
        </div>

        <hr style="border: 0; border-top: 1px solid #F0F0F0; width: 100%; margin: 4px 0;">
        
        <!-- PRACTICE AREA (Dual View) -->
        <div id="assessment-area" style="padding: 10px 0;">
             <!-- VIEW 1: INITIAL STATE -->
             <div id="practice-initial" style="text-align:center;">
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

             <!-- VIEW 2: RESULT STATE (Hidden) -->
             <div id="practice-result" style="display:none;">
                  <div style="text-align:center; margin-bottom:12px;">
                     <span style="font-size: 18px; font-family: 'Lucida Sans Unicode', sans-serif; font-weight:600;" id="result-ipa"></span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px;">
                     <div style="display:flex; flex-direction:column; gap:4px; font-size:10px; color:#666;">
                         <div style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; background:#FF5252; border-radius:4px;"></span> 0~59</div>
                         <div style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; background:#FFC107; border-radius:4px;"></span> 60~79</div>
                         <div style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; background:#00C853; border-radius:4px;"></span> 80~100</div>
                     </div>
                     <div id="score-circle-container" style="position:relative; width:60px; height:60px;"></div>
                     <div style="text-align:center;">
                        <button id="btn-mic-retry" style="width: 48px; height: 48px; border-radius: 50%; border: 1px solid #E0E0E0; background: #F9F9F9; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#00C853; transition: all 0.2s;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        </button>
                        <div style="font-size:10px; color:#888; margin-top:4px;">Practice</div>
                     </div>
                  </div>
                  <div style="display:flex; gap:12px; margin-top:16px;">
                     <button id="btn-play-user" style="flex:1; padding:8px; border-radius:20px; border:1px solid #ddd; background:#fff; font-size:13px; color:#555; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:#00C853"><path d="M8 5v14l11-7z"/></svg>My voice
                     </button>
                     <button id="btn-play-std" style="flex:1; padding:8px; border-radius:20px; border:1px solid #ddd; background:#fff; font-size:13px; color:#555; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:#00C853"><path d="M8 5v14l11-7z"/></svg>Standard
                     </button>
                  </div>
             </div>
             
             <div id="assessment-result"></div>
        </div>

        <hr style="border: 0; border-top: 1px solid #F0F0F0; width: 100%; margin: 4px 0;">

        <!-- CONTEXT AREA (Skeleton) -->
        <div id="context-area">
             <div style="font-size: 14px; font-weight: 700; color: #000; margin-bottom: 8px;">Context</div>
             <div style="${skeletonStyle} width: 100%; height: 40px;"></div>
        </div>

        <!-- RESIZE HANDLE -->
        <div id="resize-handle" style="position: absolute; top: 0; right: 0; width: 10px; height: 100%; cursor: ew-resize; background: rgba(0, 0, 0, 0.05); z-index: 99999;"></div>
    </div>
  `;

  popup.innerHTML = content;
  
// Helper to toggle visual state (Global)
const toggleMicVisual = (btn, isStreaming) => {
   if (isStreaming) {
       // Show STOP state
       btn.style.background = "#FFEBEE"; 
       btn.style.color = "#F44336";
       btn.style.animation = "pulse 1.5s infinite"; 
       btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;
       btn.innerHTML += `<span style="position: absolute; bottom: -24px; font-size: 10px; color: #F44336; width: 100%;">Stop</span>`;

       // SHOW IPA PREVIEW (User Request: "take from above")
       if(btn.id === "btn-mic-initial") {
           let ipaPreview = document.getElementById("temp-ipa-preview");
           if (!ipaPreview) {
               ipaPreview = document.createElement("div");
               ipaPreview.id = "temp-ipa-preview";
               ipaPreview.style.fontFamily = "'Lucida Sans Unicode', sans-serif";
               ipaPreview.style.fontSize = "18px";
               ipaPreview.style.marginBottom = "12px";
               ipaPreview.style.fontWeight = "bold";
               
               btn.parentElement.insertBefore(ipaPreview, btn);
           }
           
           // Copy content from Top
           const ipaSource = document.querySelector("#content-area span");
           if(ipaSource) {
               // Mimic Color Style from User Image (Green/Yellow/Red mix - static for now or just green)
               // User image has specific phoneme coloring which is hard to guess without analysis.
               // We will use a gradient text or just simple Green as "Standard".
               ipaPreview.innerHTML = `<span style="color:#00C853">${ipaSource.textContent}</span>`;
           } else {
               ipaPreview.textContent = "/.../";
           }
           ipaPreview.style.display = "block";
       }

   } else {
       // Revert
       btn.style.background = "#E8F5E9"; 
       if(btn.id === 'btn-mic-retry') btn.style.background = "#F9F9F9";
       
       btn.style.color = "#00C853";
       btn.style.animation = "none";
       btn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
       
       // Hide Temp IPA
       const ipaPreview = document.getElementById("temp-ipa-preview");
       if (ipaPreview) ipaPreview.style.display = "none";
   }
};

  // Attach Standard Events
  if(callbacks) {
      document.getElementById("btn-close").onclick = closePopup;
      document.getElementById("btn-sound").onclick = toggleSound;
      document.getElementById("btn-play-main").onclick = () => speakEdge(text);
      document.getElementById("btn-play-std").onclick = () => speakEdge(text);
      
      const btnMic = document.getElementById("btn-mic-initial");
      const btnMicRetry = document.getElementById("btn-mic-retry");
      
      const handleMicWrapper = (btn) => {
          const isRecording = btn.getAttribute("data-recording") === "true";
          // Toggle State
          if(!isRecording) {
              btn.setAttribute("data-recording", "true");
              toggleMicVisual(btn, true);
          } else {
              btn.setAttribute("data-recording", "false");
              toggleMicVisual(btn, false);
          }
          handleMic(text, btn);
      };
      
      if(btnMic) btnMic.onclick = () => handleMicWrapper(btnMic);
      if(btnMicRetry) btnMicRetry.onclick = () => handleMicWrapper(btnMicRetry);
      
      document.getElementById("btn-mark").onclick = () => handleMark(document.getElementById("btn-mark"), document.createElement('div'));
  }

  const header = document.getElementById("popup-header");
  if(header) enableDragging(header);
  
  const resizeHandle = document.getElementById("resize-handle");
  if(resizeHandle) enableResizing(resizeHandle, popup);
  
  // Activate click-outside-to-close functionality
  if (popup._clickOutsideHandler) {
    // Remove any existing listener first
    document.removeEventListener("mousedown", popup._clickOutsideHandler);
    // Add with a delay to prevent immediate closing from the same click that opened the popup
    setTimeout(() => {
      document.addEventListener("mousedown", popup._clickOutsideHandler);
      isPopupOpen = true;
    }, 100);
  }
}

// --- UPDATE: INJECT AI DATA ---
function updatePopupAiData(data) {
    if (!document.getElementById("content-area")) return; // Popup closed

    const mainMeaning = typeof data.translation === "string" ? data.translation : data.translation?.wordMeaning || "Đang cập nhật...";
    const contextMeaning = data.translation?.contextMeaning || data.contextMeaning || "";
    const commonMeanings = data.translation?.commonMeanings || "";
    const ipa = data.phonetics?.us || data.phonetics?.uk || "/.../";
    const cleanIpa = ipa.replace(/^\/|\/$/g, ""); 
    const pos = data.partOfSpeech || "";

    // 1. Update Meaning Area
    const contentArea = document.getElementById("content-area");
    contentArea.innerHTML = `
        <div style="color: #666; font-size: 14px; display:flex; align-items:center; gap:6px;">
            <span style="font-family: 'Lucida Sans Unicode', 'Arial Unicode MS', sans-serif;">/${cleanIpa}/</span>
            ${pos ? `<span style="font-size:12px; color:#888; border:1px solid #eee; padding:1px 4px; border-radius:4px;">(${pos})</span>` : ''}
            <span style="cursor:help; color:#999;" title="Part of Speech Info">ⓘ</span>
        </div>
        <div>
            <div style="font-size: 18px; font-weight: 700; color: #000; margin-bottom: 4px;">${mainMeaning}</div>
            ${commonMeanings ? `<div style="font-size: 14px; font-style: italic; color: #757575;">${commonMeanings}</div>` : ''}
        </div>
    `;

    // 2. Update Context Area
    const contextArea = document.getElementById("context-area");
    if (contextArea) {
        contextArea.innerHTML = `
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
                  (() => {
                      const text = contextMeaning || "";
                      const range = data.contextHighlightRange;
                      
                      // 1. Precise Index-Based Highlighting (The Silver Bullet)
                      if (range && typeof range.start === 'number' && typeof range.end === 'number') {
                          if (range.end <= text.length) {
                              return text.substring(0, range.start) + 
                                     `<u style="text-decoration: underline; font-weight: 600;">${text.substring(range.start, range.end)}</u>` + 
                                     text.substring(range.end);
                          }
                      }

                      // 2. Fallback: Regex Search
                      const hl = data.contextHighlight;
                      if (!hl) return text;
                      try {
                          const escaped = hl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          const regex = new RegExp(escaped, 'gi'); 
                          return text.replace(regex, `<u style="text-decoration: underline; font-weight: 600;">$&</u>`);
                      } catch(e) { return text; }
                  })()
                }
            </div>
        `;
    }
}

// --- UPDATE: INJECT DB DATA (STAR STATUS) ---
function updatePopupDbData(existingVocab) {
    const btnMark = document.getElementById("btn-mark");
    if (btnMark) {
        const isStarred = !!existingVocab;
        btnMark.disabled = false;
        btnMark.style.cursor = "pointer";
        btnMark.style.color = isStarred ? '#4CAF50' : '#BDBDBD';
        
        // Update Icon Fill
        btnMark.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
        `;
    }

    // 2. Override: If score exists, show it!
    if (existingVocab && existingVocab.pronunciationScores && existingVocab.pronunciationScores.length > 0) {
        // Sort to find latest
        // Sort to find latest VALID score (>0)
        // Fixes bug where previous error/zero scores from database caused "0 Try again" view
        const validScores = existingVocab.pronunciationScores
             .filter(s => typeof s.score === 'number' && s.score > 0)
             .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
             
        if (validScores.length === 0) return; // No valid scores -> Show Mic
        const bestScore = validScores[0];
        
        // Mock Assessment Result Format for renderAssessmentResult
        const resultData = {
             AccuracyScore: bestScore.score,
             NBest: [{ 
                 AccuracyScore: bestScore.score, 
                 PronunciationAssessment: { AccuracyScore: bestScore.score },
                 Words: [] 
             }] 
        };

        const assessmentArea = document.getElementById("assessment-area");
        if(assessmentArea) {
             // Hide "My Voice" button via inline style injection or finding element
             // We can do it after renderAssessmentResult call, but let's do it cleanly
             // Actually renderAssessmentResult re-enables display block on #practice-result.
             
             renderAssessmentResult(resultData, assessmentArea, existingVocab.word, uiCallbacks);
             
             // Hide User Voice button because we don't have the blob
             const btnPlayUser = document.getElementById("btn-play-user");
             if(btnPlayUser) btnPlayUser.style.display = "none";
        }
    }
}

// --- RENDER POPUP (COMPLETE REDESIGN) ---
async function renderPopupContent(data, isSoundEnabled, callbacks) {
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

  // 1.5. Load User Preferences (Width only) from Local Storage
  let width = 380; // Default
  
  try {
    const storage = await chrome.storage.local.get(['popupWidth']);
    if (storage.popupWidth) width = storage.popupWidth;
  } catch (e) {
    console.warn("Failed to load popup preferences:", e);
  }

  // Apply Width to Container (Not Content)
  popup.style.width = width + "px";
  popup.style.maxWidth = "min(800px, calc(100vw - 40px))";
  popup.style.height = "auto";
  popup.style.boxSizing = "border-box";

  // 2. Prepare HTML Structure
  const content = `
    <div id="popup-content" style="
        font-family: 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        width: 100%;
        height: 100%;
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        color: #333;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: visible;
        overflow-x: hidden;
        box-sizing: border-box;
    ">
        <!-- Global Style for All Children -->
        <style>
            #popup-content * {
                box-sizing: border-box;
                word-wrap: break-word;
                overflow-wrap: break-word;
            }
            #popup-content > div {
                min-width: 0;
                flex-shrink: 1;
            }
            #popup-content button {
                flex-shrink: 0;
                white-space: nowrap;
            }
            #popup-content div[style*="display: flex"] {
                flex-wrap: wrap;
            }
        </style>
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
        
        <!-- RESIZE HANDLE (Right Edge) -->
        <div id="resize-handle" style="
            position: absolute;
            top: 0;
            right: 0;
            width: 10px;
            height: 100%;
            cursor: ew-resize;
            background: rgba(0, 0, 0, 0.1);
            z-index: 99999;
            transition: background 0.2s;
            border-left: 1px solid rgba(0,0,0,0.05);
        " onmouseover="this.style.background='rgba(0, 0, 0, 0.3)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.1)'"></div>
    </div>
  `;
  
  popup.innerHTML = content;

  // 3. Attach Events
  enableDragging(document.getElementById("popup-header"));
  enableResizing(document.getElementById("resize-handle"), popup);
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
