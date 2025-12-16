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
