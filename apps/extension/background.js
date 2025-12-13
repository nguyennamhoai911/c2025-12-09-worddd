// Setup Alarm khi Extension được Installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed. Setting up alarms...");
  // Tạo alarm tên 'vocab_review' chạy mỗi 15 phút
  chrome.alarms.create("vocab_review", {
    periodInMinutes: 15, // Bạn có thể sửa số này nếu muốn nhắc nhanh/chậm hơn
  });
});

// Lắng nghe Alarm trigger
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "vocab_review") {
    // Tìm tab đang active để gửi message hiển thị Flashcard
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Gửi message xuống content-script (lookup-main.js sẽ bắt cái này)
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "SHOW_FLASHCARD",
        });
      }
    });
  }
});
