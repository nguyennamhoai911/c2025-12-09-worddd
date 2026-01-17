document.addEventListener("DOMContentLoaded", async () => {
  const syncStatus = document.getElementById("sync-status");
  const openSettingsBtn = document.getElementById("open-settings-btn");
  const syncNowBtn = document.getElementById("sync-now-btn");

  const SETTINGS_URL = "http://localhost:3000/settings";

  // 1. Open Settings
  openSettingsBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: SETTINGS_URL });
  });

  const openHealthBtn = document.getElementById("open-health-btn");
  if (openHealthBtn) {
    openHealthBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "health.html";
    });
  }

  // 2. Check current status
  async function checkStatus() {
    chrome.storage.sync.get(
      ["googleApiKeys", "googleApiKey", "azureKey", "authToken", "azureTranslatorKey"],
      (result) => {
        const keys = result.googleApiKeys || [];
        const singleKey = result.googleApiKey;
        const azureKey = result.azureKey;
        const azureTranslatorKey = result.azureTranslatorKey;
        const token = result.authToken;

        let statusHtml = "";

        // Login Status
        if (token) {
          statusHtml += `<div>👤 Tài khoản: <span style="color:#4CAF50">Đã kết nối</span></div>`;
        } else {
          statusHtml += `<div>👤 Tài khoản: <span style="color:#f44336">Chưa đăng nhập</span></div>`;
        }

        // Google API Status
        if (keys.length > 0 || singleKey) {
          statusHtml += `<div>🔍 Google API: <span style="color:#4CAF50">Đã có (${
            keys.length || 1
          } keys)</span></div>`;
        } else {
          statusHtml += `<div>🔍 Google API: <span style="color:#FF9800">Chưa có (Dùng Unsplash)</span></div>`;
        }

        // Azure Speech Status
        if (azureKey) {
          statusHtml += `<div>🎙️ Azure Speech: <span style="color:#4CAF50">Đã có</span></div>`;
        } else {
          statusHtml += `<div>🎙️ Azure Speech: <span style="color:#FF9800">Chưa có</span></div>`;
        }

        // Azure Translator Status
        if (azureTranslatorKey) {
          statusHtml += `<div>🌐 Azure Translator: <span style="color:#4CAF50">Đã có</span></div>`;
        } else {
          statusHtml += `<div>🌐 Azure Translator: <span style="color:#FF9800">Chưa có</span></div>`;
        }

        syncStatus.innerHTML = statusHtml;
      }
    );
  }

  checkStatus();

  // 3. Sync Now
  syncNowBtn.addEventListener("click", () => {
      showStatusMessage("⏳ Đang đồng bộ...", "loading");
      
      chrome.storage.sync.get(["authToken"], async (result) => {
          if (!result.authToken) {
               showStatusMessage("❌ Chưa có Token. Hãy đăng nhập Web.", "error");
               return;
          }

          try {
               const configApiUrl = (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG.API_URL : "http://localhost:3001"; // Fallback if config missing

               const response = await fetch(`${configApiUrl}/auth/me`, {
                   headers: { Authorization: `Bearer ${result.authToken}` }
               });
               
               if (response.ok) {
                   const user = await response.json();
                   
                   // Save to storage
                   const updates = {};
                   if (user.googleApiKey && user.googleCx) {
                        updates.googleApiKeys = [{ key: user.googleApiKey, cx: user.googleCx }];
                        updates.googleApiKey = user.googleApiKey; 
                        updates.googleSearchEngineId = user.googleCx; 
                   }
                   if (user.azureSpeechKey) updates.azureKey = user.azureSpeechKey;
                   if (user.azureSpeechRegion) updates.azureRegion = user.azureSpeechRegion;
                   
                   // SYNC AZURE TRANSLATOR
                   if (user.azureTranslatorKey) updates.azureTranslatorKey = user.azureTranslatorKey;
                   if (user.azureTranslatorRegion) updates.azureTranslatorRegion = user.azureTranslatorRegion;
                   
                   chrome.storage.sync.set(updates, () => {
                       showStatusMessage("✅ Đồng bộ thành công!", "success");
                       checkStatus();
                       setTimeout(hideStatusMessage, 2000);
                   });
               } else {
                   showStatusMessage("❌ Lỗi Server: " + response.status, "error");
               }
          } catch (e) {
              showStatusMessage("❌ Lỗi mạng: " + e.message, "error");
          }
      });
  });
});

function showStatusMessage(message, type) {
  const statusDiv = document.getElementById("status-message");
  statusDiv.textContent = message;
  statusDiv.className = `status-message show ${type}`;
}

function hideStatusMessage() {
  const statusDiv = document.getElementById("status-message");
  statusDiv.className = "status-message";
}
