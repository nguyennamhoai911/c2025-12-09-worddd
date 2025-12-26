// =======================================================================
// MODULE: MAIN CONTROLLER (Entry Point)
// =======================================================================

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
      let contextText = "";
      try {
        if (selection.anchorNode && selection.anchorNode.parentElement) {
          const parentText = selection.anchorNode.parentElement.innerText;
          const idx = parentText.indexOf(selectedText);
          if (idx !== -1) {
            contextText = parentText
              .substring(
                Math.max(0, idx - 100),
                Math.min(parentText.length, idx + selectedText.length + 100)
              )
              .trim()
              .replace(/\s+/g, " ");
          }
        }
      } catch (err) {}
      if (contextText.length > 200)
        contextText = "..." + contextText.substring(0, 200) + "...";

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const popup = createPopup();
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
      popup.innerHTML =
        '<div class="tts-content"><div class="tts-loading">⏳ Đang phân tích...</div></div>';
      popup.style.display = "block";

      speakWithEdgeTTS(selectedText);

      let data = await getFromCache(selectedText);
      if (!data) {
        const isLong = selectedText.split(/\s+/).length > 5;
        const [translation, images] = await Promise.all([
          getTranslation(selectedText, contextText),
          isLong ? [] : getImages(selectedText),
        ]);
        data = {
          translation,
          phonetics: await getPhoneticForText(selectedText),
          images,
          text: selectedText,
          contextText,
        };
        if (translation) await saveToCache(selectedText, data);
      } else if (contextText && !data.contextMeaning) {
        const tr = await getTranslation(selectedText, contextText);
        if (tr) data.translation = tr;
      }

      data.existing = null;
      renderPopupContent(data, isSoundEnabled, {
        toggleSound: toggleSoundState,
        closePopup,
        speakEdge: speakWithEdgeTTS,
        handleMic: (referenceText, btnElement) =>
          handleMicClick(referenceText, btnElement, data.existing),
        handleMark: (btn, status) => onMarkClick(btn, status, data),
      });

      // 👇 [UPDATE] Logic kiểm tra DB (chạy ngầm sau khi render)
      try {
        const existingVocab = await apiCheckVocabulary(selectedText);
        if (existingVocab && isPopupOpen) {
          data.existing = existingVocab; // 👈 Thêm cái này để UI biết
          renderPopupContent(data, isSoundEnabled, {
            toggleSound: toggleSoundState,
            closePopup,
            speakEdge: speakWithEdgeTTS,
            handleMic: (referenceText, btnElement) =>
              handleMicClick(referenceText, btnElement, data.existing),
            handleMark: (btn, status) => onMarkClick(btn, status, data),
          });
        }
      } catch (e) {}
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
