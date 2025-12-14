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
async function handleMicClick(referenceText, btnElement) {
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
          const result = await assessPronunciation(audioBlob, referenceText);
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

      renderPopupContent(data, isSoundEnabled, {
        toggleSound: toggleSoundState,
        closePopup,
        speakEdge: speakWithEdgeTTS,
        handleMic: handleMicClick,
        handleMark: (btn, status) => onMarkClick(btn, status, data),
      });
    } else if (isPopupOpen) {
      closePopup();
    }
  } else if (e.key === "Escape" && isPopupOpen) {
    closePopup();
  }
});

// 4. Flashcard Listener
chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === "SHOW_FLASHCARD") {
    const result = await chrome.storage.local.get(["vocabHistory"]);
    const history = result.vocabHistory || [];
    if (history.length > 0) {
      const randomItem =
        history[Math.floor(Math.random() * Math.min(10, history.length))];
      showFlashcard(randomItem, { speakEdge: speakWithEdgeTTS });
    }
  }
});

// Init
if (window.speechSynthesis) window.speechSynthesis.getVoices();
