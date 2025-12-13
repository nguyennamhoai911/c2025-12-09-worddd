// --- MODULE: MAIN CONTROLLER ---
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isSoundEnabled = true;
let lastRecordedBlob = null;

// 1. TTS Helper
async function speakWithEdgeTTS(text) {
  if (!isSoundEnabled) return;
  window.speechSynthesis.cancel();
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const ariaVoice = voices.find(
      (v) =>
        v.name.includes("Aria") ||
        v.name.includes("Natural") ||
        v.lang === "en-US"
    );
    if (ariaVoice) utterance.voice = ariaVoice;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("TTS Error:", error);
  }
}

function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  if (!isSoundEnabled) window.speechSynthesis.cancel();
  const btn = document.getElementById("sound-toggle");
  if (btn) btn.innerHTML = isSoundEnabled ? "🔊" : "🔇";
}

// 2. Mic & Assessment Handler
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

// 3. Shift Key Listener (The Core)
document.addEventListener("keydown", async (e) => {
  const target = e.target;
  // Ignore typing in inputs
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  )
    return;

  if (e.key === "Shift") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      // Smart Context Logic
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
              .trim();
            contextText = contextText.replace(/\s+/g, " ");
          }
        }
      } catch (err) {
        /* ignore */
      }
      if (contextText.length > 200)
        contextText = "..." + contextText.substring(0, 200) + "...";

      // Prepare UI
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const popup = createPopup();
      isPopupOpen = true;

      // Calculate Position
      const topPos =
        rect.top + window.scrollY - 400 - 20 < window.scrollY
          ? rect.bottom + window.scrollY + 10
          : rect.top + window.scrollY - 400 - 20;
      const leftPos =
        rect.left + window.scrollX + 350 > window.innerWidth
          ? window.innerWidth - 360
          : rect.left + window.scrollX;
      popup.style.top = topPos + "px";
      popup.style.left = leftPos + "px";
      popup.innerHTML =
        '<div class="tts-content"><div class="tts-loading">⏳ Analyzing...</div></div>';
      popup.style.display = "block";

      speakWithEdgeTTS(selectedText);

      // Data Fetching
      let data = await getFromCache(selectedText);
      if (!data) {
        const isLong = selectedText.split(/\s+/).length > 5;
        const [translation, phonetics, images] = await Promise.all([
          getTranslation(selectedText, contextText),
          isLong ? null : getPhoneticForText(selectedText),
          isLong ? [] : getImages(selectedText),
        ]);
        data = {
          translation,
          phonetics,
          images,
          text: selectedText,
          contextText,
        };
        if (translation) {
          await saveToCache(selectedText, data);
          await saveToHistory(selectedText, data);
        }
      } else if (contextText && !data.contextMeaning) {
        const tr = await getTranslation(selectedText, contextText);
        if (tr) data.translation = tr;
      }

      // Render
      renderPopupContent(data, isSoundEnabled, {
        toggleSound,
        closePopup,
        speakEdge: speakWithEdgeTTS,
        handleMic: handleMicClick,
      });
    } else if (isPopupOpen) {
      closePopup();
    }
  } else if (e.key === "Escape" && isPopupOpen) {
    closePopup();
  }
});

// 4. Background Message Listener (Flashcard)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "SHOW_FLASHCARD") {
    const result = await chrome.storage.local.get(["vocabHistory"]);
    const history = result.vocabHistory || [];
    if (history.length > 0) {
      const randomItem = history.slice(0, 10)[
        Math.floor(Math.random() * Math.min(10, history.length))
      ];
      showFlashcard(randomItem, { speakEdge: speakWithEdgeTTS });
    }
  }
});

// Init
if (window.speechSynthesis) window.speechSynthesis.getVoices();
