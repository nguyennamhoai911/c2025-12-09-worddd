document.addEventListener("DOMContentLoaded", async () => {
  // Elements cho Azure (Giữ nguyên)
  const azureKeyInput = document.getElementById("azure-key-input");
  const azureRegionInput = document.getElementById("azure-region-input");
  const saveBtn = document.getElementById("save-btn");
  const testBtn = document.getElementById("test-btn");

  // Xử lý nút mắt thần (Toggle Visibility) cho tất cả input password
  document.querySelectorAll(".toggle-visibility").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Tìm input cùng cấp với nút bấm
      const input = e.target.parentElement.querySelector("input");
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
      }
    });
  });

  // --- 1. LOAD DATA ---
  chrome.storage.sync.get(
    ["googleApiKeys", "azureKey", "azureRegion"], // Lưu ý: key mới là 'googleApiKeys' (dạng mảng)
    (result) => {
      // Load Azure
      if (result.azureKey) azureKeyInput.value = result.azureKey;
      if (result.azureRegion) azureRegionInput.value = result.azureRegion;

      // Load Google Keys (List)
      const keys = result.googleApiKeys || [];

      // Loop qua 5 slot để điền dữ liệu
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

    // Gom dữ liệu từ 5 slot Google
    let googleKeysList = [];
    for (let i = 0; i < 5; i++) {
      const keyVal = document.getElementById(`api-key-${i}`).value.trim();
      const cxVal = document.getElementById(`cx-${i}`).value.trim();

      // Chỉ lưu nếu có điền Key (CX có thể dùng chung hoặc riêng)
      if (keyVal) {
        googleKeysList.push({
          key: keyVal,
          cx: cxVal, // Nếu cx trống, logic bên content.js sẽ handle sau
        });
      }
    }

    // Validation
    if (googleKeysList.length === 0) {
      showStatusMessage("⚠️ Cần ít nhất 1 Google API Key chính!", "warning");
      return;
    }

    // Save to Storage
    chrome.storage.sync.set(
      {
        googleApiKeys: googleKeysList, // Lưu dạng mảng object
        azureKey: azureKey,
        azureRegion: azureRegion,
      },
      () => {
        showStatusMessage(
          `✅ Đã lưu ${googleKeysList.length} bộ key!`,
          "success"
        );
        setTimeout(hideStatusMessage, 3000);
      }
    );
  });

  // --- 3. TEST API (Test key đầu tiên) ---
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
}

function hideStatusMessage() {
  const statusDiv = document.getElementById("status-message");
  statusDiv.className = "status-message";
}
// Function xử lý khi click nút "Star Word"
async function handleStarWord(wordToSave) {
  try {
    // 1. Get Auth Token (Token lưu ở storage khi user login extension)
    const { token } = await chrome.storage.local.get(["token"]);
    if (!token) {
      alert("Please login via Extension first!");
      return;
    }

    // 2. Auto-fetch Missing Info (Vì DB cần full info)
    // Ví dụ: Gọi Google Translate API free endpoint để lấy nghĩa
    const googleData = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURI(
        wordToSave
      )}`
    ).then((res) => res.json());

    const meaning = googleData[0][0][0]; // Extract meaning

    // Ví dụ: Gọi Free Dictionary API để lấy phonetics & example
    const dictData = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${wordToSave}`
    ).then((res) => res.json());

    const pronunciation = dictData[0]?.phonetics[0]?.text || "";
    const example = dictData[0]?.meanings[0]?.definitions[0]?.example || "";
    const partOfSpeech = dictData[0]?.meanings[0]?.partOfSpeech || "noun";

    // 3. Prepare Payload
    const payload = {
      word: wordToSave,
      meaning: meaning,
      pronunciation: pronunciation,
      example: example,
      partOfSpeech: partOfSpeech,
      topic: "From Extension", // Auto tag source
      isStarred: true,
    };

    // 4. Send to YOUR Backend
    const response = await fetch("http://localhost:5000/vocabulary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      updateUI_StarActive(); // Đổi màu ngôi sao trên popup
    }
  } catch (err) {
    console.error("Failed to save word:", err);
  }
}
