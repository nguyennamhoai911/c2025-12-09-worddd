// apps/extension/background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension Installed/Reloaded");
  createNextAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "vocab_review") {
    console.log(
      "⏰ Alarm Triggered: vocab_review at " + new Date().toLocaleTimeString()
    );

    // 1. Gửi tin nhắn xuống Tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.log("⚠️ No active tab found.");
        return;
      }

      console.log(`📡 Sending message to Tab ID: ${tabs[0].id}`);
      chrome.tabs
        .sendMessage(tabs[0].id, { action: "SHOW_FLASHCARD" })
        .catch((err) =>
          console.log(
            "❌ Could not send message (Content Script not ready?):",
            err
          )
        );
    });

    // 2. Tạo Alarm tiếp theo (Recursive)
    createNextAlarm();
  }
});

function createNextAlarm() {
  // Setup alarm chạy sau 12 giây
  chrome.alarms.create("vocab_review", { when: Date.now() + 300000 });
  console.log("⏳ Next alarm scheduled in 12s...");
}

// Xử lý Request từ Content Script (TTS, etc.)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TTS_SPEAK") {
    const text = request.text;
    if (!text) return;

    // Ngừng đọc cũ
    chrome.tts.stop();

    // Tìm giọng đọc tốt nhất
    chrome.tts.getVoices((voices) => {
      // Ưu tiên giọng Google US English hoặc giọng US bất kỳ (trừ Zira nghe chán)
      const voice = voices.find(v => v.voiceName === "Google US English" || (v.lang === "en-US" && !v.voiceName.includes("Zira")));
      
      const options = {
        rate: 1.0, // Tốc độ chuẩn
        lang: 'en-US',
      };
      
      if (voice) {
        options.voiceName = voice.voiceName;
        console.log("🔊 TTS playing with voice:", voice.voiceName);
      }

      chrome.tts.speak(text, options, () => {
        if (chrome.runtime.lastError) {
          console.error("TTS Error:", chrome.runtime.lastError);
        }
      });
    });
  }
});
