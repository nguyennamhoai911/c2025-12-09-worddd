// =======================================================================
// MODULE: MAIN CONTROLLER (Entry Point)
// =======================================================================

// --- SYNC LOGIC (Added) ---
// --- SYNC LOGIC (Added) ---
(function checkAndSyncSettings() {
  if (typeof APP_CONFIG === 'undefined') return;
  
  // Check if we are on the Frontend App
  const currentOrigin = window.location.origin;
  const frontendUrl = APP_CONFIG.FRONTEND_URL; // e.g. localhost:3000
  
  // Simple check: if current origin matches frontend url (ignoring protocol mostly relative) or localhost:3000/3005
  if (currentOrigin.includes("localhost:3000") || currentOrigin.includes("localhost:3005") || (frontendUrl && currentOrigin === new URL(frontendUrl).origin)) {
      
      console.log("🟢 Detected Web App. Checking for config sync...");
      const token = localStorage.getItem('token');
      
      if (token) {
        chrome.storage.sync.set({ authToken: token });
        
        fetch(`${APP_CONFIG.API_URL}/auth/me`, {
             headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(user => {
             if(user.id) {
                 const updates = {};
                   if (user.googleApiKey && user.googleCx) {
                        updates.googleApiKeys = [{ key: user.googleApiKey, cx: user.googleCx }];
                        updates.googleApiKey = user.googleApiKey; 
                        updates.googleSearchEngineId = user.googleCx;
                   }
                   if (user.azureSpeechKey) updates.azureKey = user.azureSpeechKey;
                   if (user.azureSpeechRegion) updates.azureRegion = user.azureSpeechRegion;
                   if (user.geminiApiKey) updates.geminiApiKey = user.geminiApiKey; // Sync Gemini Key
                   
                   if (Object.keys(updates).length > 0) {
                       chrome.storage.sync.set(updates, () => {
                           console.log("✅ Settings synced from Web App:", Object.keys(updates));
                       });
                   }
             }
        })
        .catch(err => console.error("❌ Sync Error:", err));
      }
  }
})();

// --- HELPER: Extract Sentence Context (Robust) ---
function extractSentenceContext(selection) {
    if (!selection.anchorNode) return "";
    
    // 1. Get the paragraph or block text
    // Note: anchorNode might be a text node, so use parentElement to get the block
    let parentEl = selection.anchorNode.nodeType === 3 ? selection.anchorNode.parentElement : selection.anchorNode;
    // Attempt to go up to a block-level element if we are in an inline one (like <span> or <b>)
    while (parentEl && window.getComputedStyle(parentEl).display === 'inline') {
        parentEl = parentEl.parentElement;
    }
    if (!parentEl) return selection.toString();

    const fullText = parentEl.innerText || parentEl.textContent;
    const selectedText = selection.toString().trim();
    if (!fullText || !selectedText) return selectedText;

    // 2. Find the approx index of selection in fullText
    // Cannot rely on selection.anchorOffset directly against fullText because DOM structure implies multiple nodes.
    // Instead, we trust that the selected text exists in the paragraph's text.
    // NOTE: If the word appears multiple times, this simple indexOf might fail to pick the *correct* one.
    // For a perfect solution, we need Range-to-Text alignment, but for this level, find the first occurrence 
    // or the one closest to a heuristic is acceptable. 
    // To Improve: We just grab the sentence containing the *first* match.
    
    try {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
            const segments = segmenter.segment(fullText);
            
            // Find segment containing the selection
            // Since we don't have exact offset in fullText easily, we search for the segment containing the selected string
            for (const segment of segments) {
                if (segment.segment.includes(selectedText)) {
                    return segment.segment.trim();
                }
            }
        }
    } catch (e) {
        console.warn("Intl.Segmenter failed, fallback to simple split", e);
    }

    // Fallback: Regex Split
    // Split by . ! ? followed by space or end of string
    const sentences = fullText.match(/[^\.!\?]+[\.!\?]+(\s|$)/g) || [fullText];
    const match = sentences.find(s => s.includes(selectedText));
    return match ? match.trim() : selectedText;
}

// --- API: Get AI Translation ---
async function apiGetAiTranslation(text, context) {
    try {
        const storage = await chrome.storage.sync.get(['geminiApiKey', 'authToken']);
        if (!storage.geminiApiKey || !storage.authToken) return null; // Fallback to Google Translate if no key
        
        console.log("🤖 Calling Gemini AI...");
        const response = await fetch(`${APP_CONFIG.API_URL}/ai/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storage.authToken}`
            },
            body: JSON.stringify({ text, context })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data; // { ipa, meaning, context_translation, part_of_speech }
        }
    } catch (e) {
        console.error("AI Error:", e);
    }
    return null;
}

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let lastRecordedBlob = null;

// 1. Handle Mark Click
async function onMarkClick(btnElement, statusElement, data) {
  if (!data) return;
  btnElement.disabled = true;
  btnElement.style.opacity = "0.7";
  btnElement.style.transform = "scale(0.9)";
  statusElement.innerHTML = '<span style="color:#2196F3">⏳ Đang lưu...</span>';

  try {
    await apiSaveVocabulary(data);
    btnElement.style.background = "#4CAF50";
    btnElement.style.boxShadow = "0 4px 0 #388E3C";
    statusElement.innerHTML =
      '<span style="color:#4CAF50;">✅ Đã lưu vào sổ từ!</span>';
    await saveToHistory(data.text, data);
  } catch (err) {
    btnElement.style.background = "#FF9800";
    if (err.message.includes("Chưa đăng nhập")) {
      statusElement.innerHTML =
        '<span style="color:#F44336">⚠️ Vui lòng đăng nhập App!</span>';
    } else {
      statusElement.innerHTML = `<span style="color:#F44336">❌ Lỗi: ${err.message}</span>`;
    }
  } finally {
    btnElement.disabled = false;
    btnElement.style.opacity = "1";
    btnElement.style.transform = "scale(1)";
  }
}

// 2. Handle Mic Click
async function handleMicClick(referenceText, btnElement, existingVocab) {
  if (!isRecording) {
    try {
      if (!navigator.mediaDevices) {
        alert("Mic not supported");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const resultDiv = document.getElementById("assessment-result");
        if (resultDiv)
          resultDiv.innerHTML =
            '<div style="font-size:12px; color:#ddd; text-align:center;">⏳ Processing...</div>';
        try {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          lastRecordedBlob = audioBlob;
          if (audioBlob.size < 1000) throw new Error("No audio detected.");

          // 1. Gọi Azure lấy điểm (Code cũ)
          const result = await assessPronunciation(audioBlob, referenceText);

          // 👇 [NEW CODE] Tự động lưu điểm và thời gian nếu từ đã tồn tại
          if (
            existingVocab &&
            existingVocab.id &&
            result.NBest &&
            result.NBest[0]
          ) {
            const score = result.NBest[0].AccuracyScore;

            // Gọi API lưu điểm ngầm (không cần await để UI phản hồi nhanh)
            apiAddScore(existingVocab.id, score).then((success) => {
              if (success) console.log("✅ Score & Time synced to DB!");
            });

            // Cập nhật lại UI Badge điểm ngay lập tức (Optional - Visual feedback)
            // Bạn có thể update lại biến existingVocab.pronunciationScores local ở đây nếu muốn
          }
          // 👆 [END NEW CODE]

          renderAssessmentResult(result, resultDiv, referenceText, {
            playUserAudio: () => {
              const u = URL.createObjectURL(lastRecordedBlob);
              new Audio(u).play();
            },
            speakEdge: speakWithEdgeTTS,
          });
        } catch (err) {
          if (resultDiv)
            resultDiv.innerHTML = `<div style="color:#ff5252; text-align:center;">❌ ${err.message}</div>`;
        } finally {
          stream.getTracks().forEach((t) => t.stop());
        }
      };
      mediaRecorder.start();
      isRecording = true;
      btnElement.classList.add("recording");
    } catch (err) {
      alert("Mic Error: " + err.message);
    }
  } else {
    if (mediaRecorder) mediaRecorder.stop();
    isRecording = false;
    btnElement.classList.remove("recording");
  }
}

// 3. Main Event Listener
document.addEventListener("keydown", async (e) => {
  if (e.key === "Shift") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      let contextText = extractSentenceContext(selection); // Use new helper
      if (contextText.length > 200) contextText = "..." + contextText.substring(0, 200) + "..."; // Safeguard

      // 1. Setup Popup Coordinates & Create Shell
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const popup = createPopup(); // Defined in lookup-ui.js
      isPopupOpen = true;

      const topPos =
        rect.top + window.scrollY - 450 < window.scrollY
          ? rect.bottom + window.scrollY + 10
          : rect.top + window.scrollY - 450;
      const leftPos =
        rect.left + window.scrollX + 350 > window.innerWidth
          ? window.innerWidth - 360
          : rect.left + window.scrollX;

      popup.style.top = `${topPos}px`;
      popup.style.left = `${leftPos}px`;
      
      // Mutable Data Object (Filled progressively)
      const currentData = {
          text: selectedText,
          contextText: contextText,
          isAi: true,
          existing: null
      };

      // Callbacks
      const safeToggleSound = typeof toggleSoundState !== 'undefined' ? toggleSoundState : () => {};
      const callbacks = {
          closePopup,
          toggleSound: safeToggleSound,
          speakEdge: speakWithEdgeTTS,
          handleMic: (referenceText, btnElement) => handleMicClick(referenceText, btnElement, currentData.existing),
          handleMark: (btn, status) => onMarkClick(btn, status, currentData)
      };

      // 2. ⚡ RENDER INITIAL SHELL (Wait for nothing)
      if (typeof renderInitialPopup === 'function') {
          renderInitialPopup(selectedText, callbacks);
      } else {
          // Fallback if UI script outdated
          popup.innerHTML = '<div class="tts-content"><div class="tts-loading">✨ Đang xử lý...</div></div>';
          popup.style.display = "block";
      }

      // Play Audio immediately
      speakWithEdgeTTS(selectedText);
      
      // 3. 🚀 PARALLEL EXECUTION: Start Tasks independently
      
      // TASK A: AI Translation
      apiGetAiTranslation(selectedText, contextText)
          .then(aiData => {
              if (aiData) {
                  // Update Data Object
                  currentData.translation = {
                      wordMeaning: aiData.meaning,
                      contextMeaning: aiData.context_translation,
                      commonMeanings: aiData.common_meanings || ""
                  };
                  currentData.phonetics = { us: aiData.ipa, uk: null };
                  currentData.partOfSpeech = aiData.part_of_speech;
                  currentData.contextHighlight = aiData.context_highlight;

                   // fetch images in background
                  getImages(selectedText);

                  // Update UI
                  if (typeof updatePopupAiData === 'function') {
                      updatePopupAiData(currentData);
                  }
              } else {
                  // AI Failed UI
                   const contentArea = document.getElementById("content-area");
                   if(contentArea) contentArea.innerHTML = `<div style="color:#d32f2f; padding:10px;">⚠️ AI Analysis failed. Please check your API Key.</div>`;
              }
          })
          .catch(err => {
              console.error("AI Task Error:", err);
               const contentArea = document.getElementById("content-area");
               if(contentArea) contentArea.innerHTML = `<div style="color:#d32f2f; padding:10px;">❌ Error: ${err.message}</div>`;
          });

      // TASK B: DB Check (Independent)
      apiCheckVocabulary(selectedText)
          .then(existingVocab => {
              currentData.existing = existingVocab;
              // Update UI
              if (typeof updatePopupDbData === 'function') {
                  updatePopupDbData(existingVocab);
              }
          })
          .catch(err => {
              // Ignore DB errors (just assume not starred)
          });

    } else if (isPopupOpen) {
      closePopup();
    }
  } else if (e.key === "Escape" && isPopupOpen) {
    closePopup();
  }
});

// 4. Flashcard Listener
// 4. Flashcard Listener
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "SHOW_FLASHCARD") {
    console.log("📩 Received SHOW_FLASHCARD message");

    try {
      // Step 1: Lấy danh sách từ Starred từ Backend
      const list = await apiGetStarredVocabulary();

      if (list && list.length > 0) {
        // Step 2: Lấy index hiện tại từ Storage (Logic Xoay Vòng)
        const storageData = await chrome.storage.local.get([
          "flashcardCurrentIndex",
        ]);
        let currentIndex = storageData.flashcardCurrentIndex || 0;

        // Validate: Nếu index vượt quá độ dài list (do xóa bớt từ), reset về 0
        if (currentIndex >= list.length) {
          currentIndex = 0;
        }

        // Pick từ theo thứ tự
        const selectedItem = list[currentIndex];
        console.log(
          `🔄 Rotational Pick [${currentIndex + 1}/${list.length}]:`,
          selectedItem.word
        );

        // Step 3: Tính toán Index tiếp theo và Lưu lại ngay
        const nextIndex = (currentIndex + 1) % list.length; // Quay vòng về 0 nếu hết list
        await chrome.storage.local.set({ flashcardCurrentIndex: nextIndex });

        // Step 4: Map Data
        const flashcardItem = {
          word: selectedItem.word,
          data: {
            translation: selectedItem.meaning || "No definition",
            pronunciation: selectedItem.pronunciation || "",
            partOfSpeech: selectedItem.partOfSpeech || "",
            images: [],
          },
        };

        // Step 5: Show UI (Giữ nguyên logic cũ)
        showFlashcard(flashcardItem, {
          speakEdge: speakWithEdgeTTS,

          // Mic Logic
          onMic: () => {
            if (window.NativeUI) {
              window.NativeUI.renderAssessmentModal(
                {
                  ...selectedItem,
                  pronunciation: selectedItem.pronunciation || "",
                },
                {
                  onSpeak: (t) => speakWithEdgeTTS(t),
                  onRecord: async (onSuccess, onError) => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                      });
                      const mediaRecorder = new MediaRecorder(stream);
                      const chunks = [];
                      mediaRecorder.ondataavailable = (e) =>
                        chunks.push(e.data);
                      mediaRecorder.onstop = async () => {
                        const blob = new Blob(chunks, { type: "audio/webm" });
                        window.lastRecordedBlob = blob;
                        try {
                          const result = await assessPronunciation(
                            blob,
                            selectedItem.word
                          );
                          if (
                            selectedItem.id &&
                            result.NBest &&
                            result.NBest[0]
                          ) {
                            apiAddScore(
                              selectedItem.id,
                              result.NBest[0].AccuracyScore
                            );
                          }
                          if (result.NBest) onSuccess(result.NBest[0]);
                          else onError("No result");
                        } catch (err) {
                          onError(err.message);
                        }
                        stream.getTracks().forEach((t) => t.stop());
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
                  },
                }
              );
            }
          },

          // Edit Logic
          onEdit: () => {
            if (window.NativeUI) {
              window.NativeUI.renderFormModal(
                { ...selectedItem, isEditMode: true },
                {
                  onAutoFill: () => null,
                  onSave: async (d) => {
                    await apiUpdateVocabulary(d.id, d);
                  },
                }
              );
            }
          },
        });
      } else {
        console.log(
          "⚠️ No starred words found. Please star some words in App."
        );
      }
    } catch (e) {
      console.error("🔥 Flashcard Error:", e);
    }
  }
});
