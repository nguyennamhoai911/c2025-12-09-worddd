// =======================================================================
// MODULE: MAIN CONTROLLER (Entry Point)
// =======================================================================

// --- SYNC LOGIC (Added) ---
// --- SYNC LOGIC (Added) ---
(function checkAndSyncSettings() {
  if (typeof APP_CONFIG === "undefined") return;

  // Check if we are on the Frontend App
  const currentOrigin = window.location.origin;
  const frontendUrl = APP_CONFIG.FRONTEND_URL; // e.g. localhost:3000

  // Simple check: if current origin matches frontend url (ignoring protocol mostly relative) or localhost:3000/3005
  if (
    currentOrigin.includes("localhost:3000") ||
    currentOrigin.includes("localhost:3005") ||
    (frontendUrl && currentOrigin === new URL(frontendUrl).origin)
  ) {
    console.log("🟢 Detected Web App. Checking for config sync...");
    const token = localStorage.getItem("token");

    if (token) {
      chrome.storage.sync.set({ authToken: token });

      fetch(`${APP_CONFIG.API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((user) => {
          if (user.id) {
            const updates = {};
            if (user.googleApiKey && user.googleCx) {
              updates.googleApiKeys = [
                { key: user.googleApiKey, cx: user.googleCx },
              ];
              updates.googleApiKey = user.googleApiKey;
              updates.googleSearchEngineId = user.googleCx;
            }
            if (user.azureSpeechKey) updates.azureKey = user.azureSpeechKey;
            if (user.azureSpeechRegion)
              updates.azureRegion = user.azureSpeechRegion;
            if (user.geminiApiKey) updates.geminiApiKey = user.geminiApiKey; // Sync Gemini Key

            if (Object.keys(updates).length > 0) {
              chrome.storage.sync.set(updates, () => {
                console.log(
                  "✅ Settings synced from Web App:",
                  Object.keys(updates),
                );
              });
            }
          }
        })
        .catch((err) => console.error("❌ Sync Error:", err));
    }
  }
})();

// --- HELPER: Extract Sentence Context (Robust) ---
function extractSentenceContext(selection) {
  if (!selection.anchorNode) return "";

  // 1. Get the paragraph or block text
  // Note: anchorNode might be a text node, so use parentElement to get the block
  let parentEl =
    selection.anchorNode.nodeType === 3
      ? selection.anchorNode.parentElement
      : selection.anchorNode;
  // Attempt to go up to a block-level element if we are in an inline one (like <span> or <b>)
  while (parentEl && window.getComputedStyle(parentEl).display === "inline") {
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
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
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
  const match = sentences.find((s) => s.includes(selectedText));
  return match ? match.trim() : selectedText;
}

// --- API: Get AI Translation ---
// --- API: Get AI Translation ---
async function apiGetAiTranslation(text, context) {
  try {
    const storage = await chrome.storage.sync.get([
      "geminiApiKey",
      "authToken",
      "azureTranslatorKey",
      "azureTranslatorRegion",
    ]);

    // 1. LOCAL OVERRIDE: Azure Translator
    if (storage.azureTranslatorKey && storage.azureTranslatorRegion) {
      console.log("🌐 Using Azure Translator (Local)...");
      return await apiCallAzureTranslatorLocal(
        text,
        context,
        storage.azureTranslatorKey,
        storage.azureTranslatorRegion,
      );
    }

    // 2. DEFAULT: Backend AI (Gemini)
    if (!storage.geminiApiKey || !storage.authToken)
      return { error: "Chưa cấu hình Azure/AI Key." };

    console.log("🤖 Calling Gemini AI...");
    const response = await fetch(`${APP_CONFIG.API_URL}/ai/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storage.authToken}`,
      },
      body: JSON.stringify({ text, context }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      return { error: `Server Error: ${response.status}` };
    }
  } catch (e) {
    console.error("AI Error:", e);
    return { error: e.message };
  }
  return { error: "Unknown Error" };
}

// --- Helper: Free Dictionary API for POS & IPA ---
async function getDictionaryData(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[0];
    if (!entry) return null;

    const pos = entry.meanings?.[0]?.partOfSpeech || "";
    const ipa =
      entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || "";

    return { pos, ipa };
  } catch {
    return null;
  }
}

// --- Helper: Azure Dictionary Lookup ---
async function apiCallAzureDictionary(text, key, region) {
  try {
    const endpoint =
      "https://api.cognitive.microsofttranslator.com/dictionary/lookup?api-version=3.0&from=en&to=vi";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ Text: text }]),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data[0]?.translations?.map((t) => t.displayTarget) || [];
  } catch {
    return null;
  }
}

// --- Helper: Azure Translator Local ---
async function apiCallAzureTranslatorLocal(text, context, key, region) {
  try {
    const endpoint =
      "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=vi";

    // Prepare Batch (Text + Context)
    const body = [{ Text: text }];
    let contextIndex = -1;
    if (context && context !== text) {
      body.push({ Text: context });
      contextIndex = 1;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("Azure Translation Failed");

    const data = await response.json();
    let wordTranslation =
      data[0]?.translations?.[0]?.text || "Đang cập nhật...";
    const contextTranslation =
      contextIndex !== -1 ? data[contextIndex]?.translations?.[0]?.text : "";

    // === SMART CONTEXT FIX logic ===
    // Nếu có ngữ cảnh, hãy kiểm tra xem từ dịch đơn lẻ có khớp với ngữ cảnh không.
    // Nếu không khớp (ví dụ "Chì" ko có trong "Dẫn dắt..."), ta dùng Dictionary API để tìm từ đúng.
    if (contextTranslation && wordTranslation) {
      const lowerContext = contextTranslation.toLowerCase();
      const lowerWord = wordTranslation.toLowerCase();

      if (!lowerContext.includes(lowerWord)) {
        // Từ dịch đơn lẻ KHÔNG khớp với ngữ cảnh. Khả năng cao là sai nghĩa (Homonym).
        console.log(
          "⚠️ Context Mismatch detected. Trying Dictionary Search...",
        );

        const candidates = await apiCallAzureDictionary(text, key, region);
        if (candidates && candidates.length > 0) {
          // Tìm candidate nào xuất hiện trong Context (Ưu tiên từ dài nhất để chính xác nhất)
          // Ví dụ: "Dẫn dắt" > "Dẫn"
          const bestMatch = candidates
            .filter((c) => lowerContext.includes(c.toLowerCase()))
            .sort((a, b) => b.length - a.length)[0];

          if (bestMatch) {
            console.log(
              `✅ Fixed Meaning: "${wordTranslation}" -> "${bestMatch}"`,
            );
            wordTranslation = bestMatch; // Override with better meaning
          }
        }
      }
    }

    // 1. Enrich with POS & IPA (Dictionary API + Local Fallback)
    let phonetics = { us: "", uk: "" };
    let partOfSpeech = "";

    // Parallel fetch for speed
    const [dictData, azureIpa] = await Promise.all([
      getDictionaryData(text),
      window.getPhoneticForText
        ? getPhoneticForText(text).catch(() => null)
        : null,
    ]);

    if (dictData) {
      partOfSpeech = dictData.pos; // e.g. "noun", "verb"
      phonetics.us = dictData.ipa; // Dictionary API usually gives good IPA
    }

    // If Azure Speech gave IPA, prefer or merge?
    if (azureIpa && (!phonetics.us || phonetics.us === "")) {
      phonetics = azureIpa;
    }

    // 2. Smart Auto Highlight Logic (Simple & Reliable)
    let contextHighlight = "";
    if (contextTranslation && wordTranslation) {
      // Normalize both strings
      const normalizedContext = contextTranslation.toLowerCase().trim();
      const normalizedWord = wordTranslation.toLowerCase().trim();

      // Find position in normalized string
      const idx = normalizedContext.indexOf(normalizedWord);

      if (idx !== -1) {
        // Extract from ORIGINAL string (preserving case)
        contextHighlight = contextTranslation.substring(
          idx,
          idx + normalizedWord.length,
        );
        var highlightIndices = { start: idx, end: idx + normalizedWord.length };
      }
    }

    // Construct Data Object compatible with UI
    return {
      text: text,
      contextText: context,
      translation: {
        wordMeaning: wordTranslation,
        contextMeaning: contextTranslation,
        commonMeanings: "",
        dict: [],
      },
      phonetics: phonetics || { us: "", uk: "" },
      partOfSpeech: partOfSpeech,
      contextHighlight: contextHighlight,
      contextHighlightRange: highlightIndices || null, // Pass indices for 100% accuracy
    };
  } catch (e) {
    console.error("Azure Translator Local Error:", e);
    return { error: "Azure Error: " + e.message };
  }
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

function openPopupFromSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const selectedText = selection.toString().trim();
  if (!selectedText) return false;

  let range = null;
  try {
    range = selection.getRangeAt(0);
  } catch {
    return false;
  }

  let contextText = extractSentenceContext(selection);
  if (contextText.length > 200) {
    contextText = "..." + contextText.substring(0, 200) + "...";
  }

  const rect = range.getBoundingClientRect();
  const popup = createPopup();
  isPopupOpen = true;

  // [SOURCE: Fixed Position Logic]
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const POPUP_HEIGHT = 450; 
  const POPUP_WIDTH = 360;

  // Logic mới cho position: fixed (KHÔNG dùng window.scrollY nữa)
  let topPos = rect.bottom + 10; // Mặc định hiện bên dưới dòng chữ
  let leftPos = rect.left;

  // 1. Kiểm tra nếu tràn dưới màn hình -> Đẩy lên trên
  if (topPos + POPUP_HEIGHT > viewportHeight) {
    topPos = rect.top - POPUP_HEIGHT - 10;
  }

  // 2. Kiểm tra nếu tràn bên phải -> Đẩy sang trái
  if (leftPos + POPUP_WIDTH > viewportWidth) {
    leftPos = viewportWidth - POPUP_WIDTH - 20; // Cách mép phải 20px
  }

  // 3. Kiểm tra an toàn
  if (leftPos < 10) leftPos = 10;
  if (topPos < 10) topPos = 10;

  popup.style.top = `${topPos}px`;
  popup.style.left = `${leftPos}px`;

  const currentData = {
    text: selectedText,
    contextText,
    isAi: true,
    existing: null,
  };

  const safeToggleSound =
    typeof toggleSoundState !== "undefined" ? toggleSoundState : () => {};
  const callbacks = {
    closePopup,
    toggleSound: safeToggleSound,
    speakEdge: speakWithEdgeTTS,
    handleMic: (referenceText, btnElement) =>
      handleMicClick(referenceText, btnElement, currentData.existing),
    handleMark: (btn, status) => onMarkClick(btn, status, currentData),
  };

  if (typeof renderInitialPopup === "function") {
    renderInitialPopup(selectedText, callbacks);
  } else {
    popup.innerHTML =
      '<div class="tts-content"><div class="tts-loading">ƒo" Ž?ang x ¯- lA«...</div></div>';
    popup.style.display = "block";
  }

  speakWithEdgeTTS(selectedText);

  apiGetAiTranslation(selectedText, contextText)
    .then((aiData) => {
      if (aiData && !aiData.error) {
        currentData.translation = {
          wordMeaning:
            aiData.meaning ||
            (aiData.translation ? aiData.translation.wordMeaning : ""),
          contextMeaning:
            aiData.context_translation ||
            (aiData.translation ? aiData.translation.contextMeaning : ""),
          commonMeanings: aiData.common_meanings || "",
        };
        currentData.phonetics = {
          us: aiData.ipa || (aiData.phonetics ? aiData.phonetics.us : ""),
          uk: null,
        };
        currentData.partOfSpeech = aiData.part_of_speech || "";
        currentData.contextHighlight = aiData.context_highlight || "";

        getImages(selectedText);

        if (typeof updatePopupAiData === "function") {
          updatePopupAiData(currentData);
        }
      } else {
        const msg = aiData?.error || "AI/Translator Config Missing.";
        const contentArea = document.getElementById("content-area");
        if (contentArea) {
          contentArea.innerHTML = `<div style="color:#d32f2f; padding:10px; font-size:13px;">ƒ?O ${msg}</div>`;
        }
      }
    })
    .catch((err) => {
      console.error("AI Task Error:", err);
      const contentArea = document.getElementById("content-area");
      if (contentArea) {
        contentArea.innerHTML = `<div style="color:#d32f2f; padding:10px;">ƒ?O Error: ${err.message}</div>`;
      }
    });

  apiCheckVocabulary(selectedText)
    .then((existingVocab) => {
      currentData.existing = existingVocab;
      if (typeof updatePopupDbData === "function") {
        updatePopupDbData(existingVocab);
      }
    })
    .catch(() => {});

  return true;
}

// 3. Main Event Listener
document.addEventListener(
  "keydown",
  async (e) => {
    if (e.key === "Shift") {
      const didOpen = openPopupFromSelection();
      if (!didOpen && isPopupOpen) {
        closePopup();
      }
    } else if (e.key === "Escape" && isPopupOpen) {
      closePopup();
    }
  },
  true,
);

// Fallback cho các site chặn keydown (FB)
document.addEventListener(
  "keyup",
  (e) => {
    if (e.key === "Shift" && !isPopupOpen) {
      openPopupFromSelection();
    }
  },
  true,
);

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
          selectedItem.word,
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
                            selectedItem.word,
                          );
                          if (
                            selectedItem.id &&
                            result.NBest &&
                            result.NBest[0]
                          ) {
                            apiAddScore(
                              selectedItem.id,
                              result.NBest[0].AccuracyScore,
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
                },
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
                },
              );
            }
          },
        });
      } else {
        console.log(
          "⚠️ No starred words found. Please star some words in App.",
        );
      }
    } catch (e) {
      console.error("🔥 Flashcard Error:", e);
    }
  }
});
