document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const azureKeyInput = document.getElementById("azure-key-input");
  const azureRegionInput = document.getElementById("azure-region-input");
  const saveBtn = document.getElementById("save-btn");
  const testBtn = document.getElementById("test-btn");

  // Status Elements
  const connDot = document.getElementById("conn-dot");
  const connText = document.getElementById("conn-text");

  // Toggle Visibility
  document.querySelectorAll(".toggle-visibility").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const input = e.target.parentElement.querySelector("input");
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
      }
    });
  });

  // --- 1. LOAD DATA ---
  chrome.storage.sync.get(
    ["googleApiKeys", "azureKey", "azureRegion", "authToken"],
    (result) => {
      // 1.1 Check Auth Token (Auto-sync Status)
      if (result.authToken) {
        connDot.className = "status-dot status-connected";
        connText.textContent = "Đã kết nối Web App (Ready to Save)";
      } else {
        connDot.className = "status-dot status-disconnected";
        connText.textContent = "Chưa có Token (Hãy F5 trang Web App)";
      }

      // 1.2 Load Azure
      if (result.azureKey) azureKeyInput.value = result.azureKey;
      if (result.azureRegion) azureRegionInput.value = result.azureRegion;

      // 1.3 Load Google Keys (List)
      const keys = result.googleApiKeys || [];
      for (let i = 0; i < 5; i++) {
        const keyInput = document.getElementById(`api-key-${i}`);
        const cxInput = document.getElementById(`cx-${i}`);
        if (keys[i]) {
          if (keyInput) keyInput.value = keys[i].key || "";
          if (cxInput) cxInput.value = keys[i].cx || "";
        }
      }
    }
  );

  // --- 2. SAVE DATA ---
  saveBtn.addEventListener("click", () => {
    const azureKey = azureKeyInput.value.trim();
    const azureRegion = azureRegionInput.value.trim();

    let googleKeysList = [];
    for (let i = 0; i < 5; i++) {
      const keyVal = document.getElementById(`api-key-${i}`).value.trim();
      const cxVal = document.getElementById(`cx-${i}`).value.trim();
      if (keyVal) {
        googleKeysList.push({ key: keyVal, cx: cxVal });
      }
    }

    if (googleKeysList.length === 0) {
      showStatusMessage("⚠️ Cần ít nhất 1 Google API Key chính!", "warning");
      return;
    }

    // Save
    chrome.storage.sync.set(
      {
        googleApiKeys: googleKeysList,
        azureKey: azureKey,
        azureRegion: azureRegion,
      },
      () => {
        showStatusMessage(`✅ Đã lưu cài đặt thành công!`, "success");
        setTimeout(hideStatusMessage, 3000);
      }
    );
  });

  // --- 3. TEST API ---
  testBtn.addEventListener("click", async () => {
    const key0 = document.getElementById("api-key-0").value.trim();
    const cx0 = document.getElementById("cx-0").value.trim();

    if (!key0 || !cx0) {
      showStatusMessage("⚠️ Cần nhập Key & CX ở ô đầu tiên để test", "warning");
      return;
    }

    showStatusMessage("⏳ Đang test Key chính...", "loading");

    try {
      const url = `https://www.googleapis.com/customsearch/v1?q=test&cx=${cx0}&searchType=image&key=${key0}&num=1`;
      const response = await fetch(url);

      if (response.ok) {
        showStatusMessage("✅ Key chính hoạt động ngon lành!", "success");
        setTimeout(hideStatusMessage, 3000);
      } else {
        const errorData = await response.json();
        showStatusMessage(
          `❌ Lỗi: ${errorData.error?.message || "Check lại Key/CX"}`,
          "error"
        );
      }
    } catch (error) {
      showStatusMessage(`❌ Lỗi mạng: ${error.message}`, "error");
    }
  });
});

function showStatusMessage(message, type) {
  const statusDiv = document.getElementById("status-message");
  statusDiv.textContent = message;
  statusDiv.className = `status-message show ${type}`;
  statusDiv.style.display = "block";
  if (type === "success") statusDiv.style.backgroundColor = "#4caf50";
  if (type === "error") statusDiv.style.backgroundColor = "#f44336";
  if (type === "warning") statusDiv.style.backgroundColor = "#ff9800";
  if (type === "loading") statusDiv.style.backgroundColor = "#2196f3";
}

function hideStatusMessage() {
  const statusDiv = document.getElementById("status-message");
  statusDiv.style.display = "none";
}
