let popup = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isSoundEnabled = true;
let isPopupOpen = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let lastRecordedBlob = null; // Biến lưu file ghi âm gần nhất
// Lưu từ vựng vào lịch sử (để hiện Flashcard sau này)
async function saveToHistory(word, data) {
  try {
    const result = await chrome.storage.local.get(["vocabHistory"]);
    let history = result.vocabHistory || [];
    history = history.filter(
      (item) =>
        item && item.word && item.word.toLowerCase() !== word.toLowerCase()
    );
    history.unshift({
      word: word,
      data: data,
      timestamp: Date.now(),
    });
    if (history.length > 50) history.pop();
    await chrome.storage.local.set({ vocabHistory: history });
  } catch (e) {
    console.warn("Lỗi khi lưu lịch sử:", e);
  }
}

// Lấy dữ liệu từ Cache (RAM/Storage)
async function getFromCache(key) {
  const storageKey = `cache_${key.toLowerCase().trim()}`;
  const result = await chrome.storage.local.get([storageKey]);
  const cachedItem = result[storageKey];

  // Cache hết hạn sau 24h
  if (cachedItem && Date.now() - cachedItem.timestamp < 24 * 60 * 60 * 1000) {
    console.log(`⚡ Hit Cache for: ${key}`);
    return cachedItem.data;
  }
  return null;
}

// Lưu data mới vào Cache
async function saveToCache(key, data) {
  const storageKey = `cache_${key.toLowerCase().trim()}`;
  await chrome.storage.local.set({
    [storageKey]: {
      data: data,
      timestamp: Date.now(),
    },
  });
}
// Tạo popup
function createPopup() {
  if (popup) {
    popup.remove();
  }

  popup = document.createElement("div");
  popup.id = "tts-popup";
  popup.style.display = "none";
  document.body.appendChild(popup);

  return popup;
}

// Đóng popup và dừng âm thanh
function closePopup() {
  if (popup) {
    popup.style.display = "none";
  }
  speechSynthesis.cancel();
  isPopupOpen = false;
}

// Lấy nghĩa tiếng Việt từ Google Translate
// --- 2. UPDATED TRANSLATION (WITH CONTEXT) ---
// --- 2. TRANSLATION (SAFE MODE) ---
// --- 2. TRANSLATION (DICTIONARY MODE) ---
async function getTranslation(text, contextText = "") {
  try {
    let contextMeaning = null;

    // 1. Dịch ngữ cảnh (giữ nguyên logic cũ)
    if (
      contextText &&
      contextText.length > 0 &&
      contextText.length < 500 &&
      contextText !== text
    ) {
      try {
        const urlContext = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
          contextText
        )}`;
        const resCtx = await fetch(urlContext);
        if (resCtx.ok) {
          const dataCtx = await resCtx.json();
          if (dataCtx && dataCtx[0]) {
            contextMeaning = dataCtx[0].map((item) => item[0]).join("");
          }
        }
      } catch (e) {
        /* Ignore context error */
      }
    }

    // 2. Dịch từ khóa & Lấy Từ điển (THÊM &dt=bd)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=${encodeURIComponent(
      text
    )}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Google API Error");

    const data = await response.json();

    if (data) {
      // Lấy nghĩa chính (như cũ)
      const mainMeaning = data[0]
        ? data[0].map((item) => item[0]).join("")
        : "";

      // Lấy dữ liệu từ điển (Noun, Verb...) - QUAN TRỌNG
      let dict = [];
      if (data[1]) {
        data[1].forEach((group) => {
          dict.push({
            pos: group[0], // noun, verb, adjective...
            terms: group[1].slice(0, 5), // Lấy top 5 nghĩa
          });
        });
      }

      return {
        wordMeaning: mainMeaning,
        contextMeaning: contextMeaning,
        dict: dict, // Trả về thêm từ điển
      };
    }
  } catch (error) {
    console.error("Translation Error:", error);
    return null;
  }
  return null;
}

// --- LOGIC MỚI: FALLBACK SYSTEM ---

// Hàm helper để gọi Google API đơn lẻ
async function tryFetchGoogleImage(searchTerm, apiKey, cx) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      searchTerm
    )}&cx=${cx}&searchType=image&key=${apiKey}&num=3`;

    const response = await fetch(url);

    // Nếu hết quota (403) hoặc quá tải (429) -> Throw error để loop bắt được
    if (response.status === 403 || response.status === 429) {
      throw new Error(`QUOTA_EXCEEDED`);
    }

    if (!response.ok) return null; // Lỗi khác thì return null luôn

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items.slice(0, 3).map((item) => item.link);
    }
  } catch (e) {
    if (e.message === "QUOTA_EXCEEDED") throw e; // Ném tiếp ra ngoài
    console.warn("Google Fetch Error:", e);
  }
  return null;
}

// Hàm chính: Loop qua danh sách Key
async function getImages(englishText) {
  const searchTerm = englishText.trim();
  let images = [];

  // 1. Lấy Settings
  const result = await chrome.storage.sync.get([
    "googleApiKeys",
    "googleApiKey",
    "googleSearchEngineId",
  ]); // Lấy cả key cũ và mới để tương thích

  // Convert cấu trúc cũ sang list nếu chưa có list
  let keyList = result.googleApiKeys || [];
  if (
    keyList.length === 0 &&
    result.googleApiKey &&
    result.googleSearchEngineId
  ) {
    keyList.push({ key: result.googleApiKey, cx: result.googleSearchEngineId });
  }

  // 2. Thử Google Custom Search (Loop Fallback)
  if (keyList.length > 0) {
    for (let i = 0; i < keyList.length; i++) {
      const { key, cx } = keyList[i];
      if (!key || !cx) continue;

      try {
        console.log(`Trying Google Key #${i + 1}...`);
        const resultImages = await tryFetchGoogleImage(searchTerm, key, cx);

        if (resultImages && resultImages.length > 0) {
          images = resultImages;
          console.log(`✅ Success with Key #${i + 1}`);
          break; // Tìm thấy ảnh thì thoát vòng lặp ngay
        }
      } catch (err) {
        if (err.message === "QUOTA_EXCEEDED") {
          console.warn(
            `⚠️ Key #${i + 1} hết quota. Đang chuyển sang Key tiếp theo...`
          );
          continue; // Chuyển sang key tiếp theo trong vòng lặp
        }
      }
    }
  }

  // 3. Nếu tất cả Google Keys đều tạch -> Dùng Unsplash (Last Resort)
  if (images.length === 0) {
    console.log("⚠️ All Google Keys failed or empty. Switching to Unsplash...");
    images = await getImagesFromUnsplash(searchTerm);
  }

  return images;
}
// Lấy 3 hình ảnh từ Unsplash API
async function getImagesFromUnsplash(searchTerm) {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchTerm
      )}&per_page=3&client_id=E8nbwS_cEWGVX4rM0e_-Eq6IpI_QKlO4eFEKfOl3AUo`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results.map((item) => item.urls.regular);
      }
    }
  } catch (error) {
    console.error("Error fetching Unsplash images:", error);
  }

  return [];
}

// --- LOGIC MỚI: FALLBACK SYSTEM ---

// Hàm helper để gọi Google API đơn lẻ
async function tryFetchGoogleImage(searchTerm, apiKey, cx) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      searchTerm
    )}&cx=${cx}&searchType=image&key=${apiKey}&num=3`;

    const response = await fetch(url);

    // Nếu hết quota (403) hoặc quá tải (429) -> Throw error để loop bắt được
    if (response.status === 403 || response.status === 429) {
      throw new Error(`QUOTA_EXCEEDED`);
    }

    if (!response.ok) return null; // Lỗi khác thì return null luôn

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items.slice(0, 3).map((item) => item.link);
    }
  } catch (e) {
    if (e.message === "QUOTA_EXCEEDED") throw e; // Ném tiếp ra ngoài
    console.warn("Google Fetch Error:", e);
  }
  return null;
}

// Hàm chính: Loop qua danh sách Key
async function getImages(englishText) {
  const searchTerm = englishText.trim();
  let images = [];

  // 1. Lấy Settings
  const result = await chrome.storage.sync.get([
    "googleApiKeys",
    "googleApiKey",
    "googleSearchEngineId",
  ]); // Lấy cả key cũ và mới để tương thích

  // Convert cấu trúc cũ sang list nếu chưa có list
  let keyList = result.googleApiKeys || [];
  if (
    keyList.length === 0 &&
    result.googleApiKey &&
    result.googleSearchEngineId
  ) {
    keyList.push({ key: result.googleApiKey, cx: result.googleSearchEngineId });
  }

  // 2. Thử Google Custom Search (Loop Fallback)
  if (keyList.length > 0) {
    for (let i = 0; i < keyList.length; i++) {
      const { key, cx } = keyList[i];
      if (!key || !cx) continue;

      try {
        console.log(`Trying Google Key #${i + 1}...`);
        const resultImages = await tryFetchGoogleImage(searchTerm, key, cx);

        if (resultImages && resultImages.length > 0) {
          images = resultImages;
          console.log(`✅ Success with Key #${i + 1}`);
          break; // Tìm thấy ảnh thì thoát vòng lặp ngay
        }
      } catch (err) {
        if (err.message === "QUOTA_EXCEEDED") {
          console.warn(
            `⚠️ Key #${i + 1} hết quota. Đang chuyển sang Key tiếp theo...`
          );
          continue; // Chuyển sang key tiếp theo trong vòng lặp
        }
      }
    }
  }

  // 3. Nếu tất cả Google Keys đều tạch -> Dùng Unsplash (Last Resort)
  if (images.length === 0) {
    console.log("⚠️ All Google Keys failed or empty. Switching to Unsplash...");
    images = await getImagesFromUnsplash(searchTerm);
  }

  return images;
}

// Lấy phiên âm của một từ
async function getPhoneticForWord(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word.trim()
      )}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (data && data[0]) {
      const result = {
        uk: null,
        us: null,
      };

      data[0].phonetics?.forEach((p) => {
        if (p.text) {
          if (p.audio && p.audio.includes("-uk")) {
            result.uk = p.text;
          } else if (p.audio && p.audio.includes("-us")) {
            result.us = p.text;
          } else if (!result.us && !result.uk) {
            result.us = p.text;
          }
        }
      });

      if (!result.uk && !result.us && data[0].phonetic) {
        result.us = data[0].phonetic;
      }

      return result;
    }
  } catch (error) {
    console.error("Error fetching phonetic:", error);
  }
  return null;
}

// Lấy phiên âm cho cả đoạn văn
async function getPhoneticForText(text) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const isLongText = words.length > 5;

  const phonetics = await Promise.all(
    words.map(async (word) => {
      const cleanWord = word.replace(/[.,!?;:'"()]/g, "");
      if (!cleanWord) return null;

      const phonetic = await getPhoneticForWord(cleanWord);
      return phonetic;
    })
  );

  const ukParts = [];
  const usParts = [];

  phonetics.forEach((p, idx) => {
    if (p) {
      if (!isLongText && p.uk) {
        ukParts.push(p.uk);
      }
      if (p.us) {
        usParts.push(p.us);
      } else if (p.uk) {
        usParts.push(p.uk);
      } else {
        const cleanWord = words[idx].replace(/[.,!?;:'"()]/g, "");
        usParts.push(cleanWord);
      }
    } else {
      const cleanWord = words[idx].replace(/[.,!?;:'"()]/g, "");
      if (!isLongText) ukParts.push(cleanWord);
      usParts.push(cleanWord);
    }
  });

  const formatPhonetics = (parts) => {
    if (parts.length === 0) {
      return null;
    }
    const combined = parts
      .map((part) => (part ? part.replace(/^\/|\/$/g, "") : ""))
      .filter(Boolean)
      .join(" ");

    if (combined) {
      return `//${combined}//`;
    }
    return null;
  };

  return {
    uk: null,
    us: formatPhonetics(usParts),
  };
}

// Sử dụng Edge TTS API
async function speakWithEdgeTTS(text) {
  if (!isSoundEnabled) return;

  speechSynthesis.cancel();

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = speechSynthesis.getVoices();
    const ariaVoice =
      voices.find(
        (voice) => voice.name.includes("Aria") && voice.lang === "en-US"
      ) ||
      voices.find(
        (voice) =>
          voice.name.includes("Natural") && voice.lang.startsWith("en-US")
      ) ||
      voices.find(
        (voice) =>
          (voice.name.includes("Microsoft") || voice.name.includes("Online")) &&
          voice.lang === "en-US"
      ) ||
      voices.find((voice) => voice.lang === "en-US");

    if (ariaVoice) {
      utterance.voice = ariaVoice;
    }

    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Error with TTS:", error);
  }
}

// Toggle âm thanh
function toggleSound() {
  isSoundEnabled = !isSoundEnabled;

  if (!isSoundEnabled) {
    speechSynthesis.cancel();
  }

  const btn = document.getElementById("sound-toggle");
  if (btn) {
    btn.innerHTML = isSoundEnabled
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    btn.style.opacity = isSoundEnabled ? "1" : "0.5";
  }
}

// Thêm chức năng drag popup
function enableDragging(header) {
  header.style.cursor = "move";

  header.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;
    const rect = popup.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    header.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    popup.style.left = x + "px";
    popup.style.top = y + "px";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = "move";
    }
  });
}

// Hiển thị popup
// --- 3. SHOW POPUP (NEW POSITION & UI) ---
// --- 3. SHOW POPUP (OPTIMIZED & SAFE) ---
async function showPopup(rect, text, contextText) {
  if (!popup) popup = createPopup();
  isPopupOpen = true;

  // 1. Hiển thị UI Loading ngay lập tức để user biết app đang chạy
  popup.innerHTML =
    '<div class="tts-content"><div class="tts-loading">⏳ Đang phân tích dữ liệu...</div></div>';
  popup.style.display = "block";

  // 2. Tính toán vị trí hiển thị (Ưu tiên hiện bên trên)
  const popupHeight = 400; // Chiều cao ước lượng
  let topPos = rect.top + window.scrollY - popupHeight - 20;
  let leftPos = rect.left + window.scrollX;

  // Nếu bị che ở trên thì lật xuống dưới
  if (topPos < window.scrollY) topPos = rect.bottom + window.scrollY + 10;
  // Nếu bị tràn lề phải thì đẩy sang trái
  if (leftPos + 350 > window.innerWidth) leftPos = window.innerWidth - 360;

  popup.style.top = `${topPos}px`;
  popup.style.left = `${leftPos}px`;

  try {
    // A. Kiểm tra Cache trước
    let data = await getFromCache(text);

    // B. Nếu chưa có cache, gọi API
    if (!data) {
      // --- LOGIC QUAN TRỌNG: CHECK ĐỘ DÀI ---
      // Nếu chọn quá dài (> 5 từ), ta coi là đoạn văn.
      // Chỉ dịch, KHÔNG lấy ảnh và phiên âm từng từ để tránh treo máy.
      const wordCount = text.trim().split(/\s+/).length;
      const isLongText = wordCount > 5;

      // Tạo danh sách các việc cần làm (Promises)
      const promises = [getTranslation(text, contextText)];

      if (!isLongText) {
        // Nếu từ ngắn: Lấy thêm phiên âm và ảnh
        promises.push(getPhoneticForText(text));
        promises.push(getImages(text));
      } else {
        // Nếu từ dài: Trả về rỗng ngay lập tức (không gọi API)
        promises.push(Promise.resolve(null)); // Phiên âm rỗng
        promises.push(Promise.resolve([])); // Ảnh rỗng
      }

      // Chạy song song tất cả request
      const [translation, phonetics, images] = await Promise.all(promises);

      data = { translation, phonetics, images, text, contextText };

      // Chỉ lưu cache nếu dịch thành công
      if (translation) {
        await saveToCache(text, data);
        await saveToHistory(text, data);
      }
    } else {
      // Nếu đã có cache nhưng ngữ cảnh mới, update lại ngữ cảnh
      if (!data.contextMeaning && contextText) {
        const translation = await getTranslation(text, contextText);
        if (translation) data.translation = translation;
      }
    }

    // C. Render UI (Nội dung Popup)
    let content = `
        <div class="tts-header" id="popup-header">
          <button id="sound-toggle" class="sound-btn" title="Bật/Tắt tiếng">${
            isSoundEnabled ? "🔊" : "🔇"
          }</button>
          <div style="flex:1"></div>
          <button id="close-popup" class="close-btn" title="Đóng">✕</button>
        </div>
        
        <div class="tts-actions">
            <div style="display:flex; gap:10px; align-items:center;">
                <button id="replay-tts-btn" class="mic-btn" style="width:40px; height:40px; background:#4CAF50;" title="Nghe lại (TTS)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
                <button id="mic-btn" class="mic-btn" title="Kiểm tra phát âm (Azure)">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
            </div>
            <div id="assessment-result"></div>
        </div>

        <div class="tts-content">
      `;

    // 1. Hiển thị Ảnh (Chỉ hiện nếu có)
    if (data.images && data.images.length) {
      content += `<div class="tts-images-container">
            ${data.images
              .map(
                (url) =>
                  `<div class="tts-image"><img src="${url}" onerror="this.style.display='none'"/></div>`
              )
              .join("")}
        </div>`;
    }

    // 2. Hiển thị Phiên âm (Chỉ hiện nếu có)
    if (data.phonetics && (data.phonetics.us || data.phonetics.uk)) {
      content += `<div class="tts-phonetic">
            ${
              data.phonetics.uk
                ? `<div class="phonetic-item"><span class="flag">🇬🇧</span><span class="phonetic-text">${data.phonetics.uk}</span></div>`
                : ""
            }
            ${
              data.phonetics.us
                ? `<div class="phonetic-item"><span class="flag">🇺🇸</span><span class="phonetic-text">${data.phonetics.us}</span></div>`
                : ""
            }
        </div>`;
    }

    // 3. Hiển thị Nghĩa (Dictionary Style) & Ngữ cảnh
    if (data.translation) {
      // 3.1. Hiện từ gốc
      content += `<div class="word-text" style="font-size:24px; text-align:center; margin-bottom:5px;">${data.text}</div>`;

      // 3.2. [NEW] LUÔN HIỆN NGHĨA CHÍNH (Google Translate Meaning)
      // Lấy nghĩa chính từ data
      const mainMeaning =
        typeof data.translation === "string"
          ? data.translation
          : data.translation.wordMeaning;

      if (mainMeaning) {
        content += `<div class="primary-meaning">${mainMeaning}</div>`;
      }

      // 3.3. Hiện Từ điển chi tiết (Nếu có)
      if (data.translation.dict && data.translation.dict.length > 0) {
        content += `<div class="dict-container">`;
        data.translation.dict.forEach((d) => {
          content += `
                    <div class="dict-row">
                        <span class="dict-pos">${d.pos}</span>
                        <span class="dict-meanings">${d.terms.join(", ")}</span>
                    </div>
                `;
        });
        content += `</div>`;
      }
      // (Bỏ phần else cũ vì mình đã hiện mainMeaning ở trên rồi)

      // 3.4. Hiện Ngữ cảnh (Context)
      if (data.translation.contextMeaning) {
        content += `
                <div class="context-box">
                    <strong>Ngữ cảnh:</strong><br/>
                    <em style="color:#777">"...${
                      data.contextText || ""
                    }..."</em><br/>
                    👉 <span style="color:#2e7d32; font-weight:600;">${
                      data.translation.contextMeaning
                    }</span>
                </div>
            `;
      }
    } else {
      content += `<div class="tts-info">Không tìm thấy bản dịch.</div>`;
    }

    content += `</div>`; // End tts-content
    popup.innerHTML = content;

    // D. Gán sự kiện cho các nút bấm
    const header = document.getElementById("popup-header");
    if (typeof enableDragging === "function") enableDragging(header);

    document.getElementById("close-popup").onclick = closePopup;
    document.getElementById("sound-toggle").onclick = toggleSound;
    document.getElementById("replay-tts-btn").onclick = () =>
      speakWithEdgeTTS(text);

    const micBtn = document.getElementById("mic-btn");
    if (micBtn) {
      micBtn.onclick = (e) => {
        e.stopPropagation();
        // Đảm bảo hàm handleMicClick đã có trong code
        if (typeof handleMicClick === "function") handleMicClick(text, micBtn);
      };
    }
  } catch (err) {
    console.error("Popup Render Error:", err);
    // Hiển thị lỗi ra UI thay vì treo "Đang tải"
    popup.innerHTML = `
        <div class="tts-header"><button id="close-error" class="close-btn">✕</button></div>
        <div class="tts-content" style="color:#ff5252; text-align:center; padding:20px;">
            ⚠️ Lỗi xử lý: ${err.message}<br>
            <span style="font-size:12px; color:#999;">Hãy thử reload trang hoặc kiểm tra kết nối mạng.</span>
        </div>`;
    document.getElementById("close-error").onclick = closePopup;
  }
}
// --- 4. FLASHCARD SYSTEM (15 MINS) ---

function showFlashcard(item) {
  // Xóa cái cũ nếu đang hiện
  const oldCard = document.getElementById("vocab-flashcard");
  if (oldCard) oldCard.remove();

  const card = document.createElement("div");
  card.id = "vocab-flashcard";
  card.className = "flashcard-slide-in"; // Animation class (trong CSS)

  let imgHtml = "";
  if (item.data.images && item.data.images.length > 0) {
    imgHtml = `<img src="${item.data.images[0]}" style="width:100%; height:120px; object-fit:cover; border-radius:8px 8px 0 0; display:block;">`;
  }

  const meaning = item.data.translation.wordMeaning || item.data.translation;

  card.innerHTML = `
        ${imgHtml}
        <div style="padding:15px;">
            <div style="font-size:10px; color:#888; text-transform:uppercase; margin-bottom:5px;">Ôn tập từ vựng</div>
            <h3 style="margin:0; font-size:22px; color:#333;">${item.word}</h3>
            <p style="margin:5px 0 10px 0; color:#555; font-size:14px;">${meaning}</p>
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <button id="fc-play-btn" style="background:#58cc02; border:none; border-radius:50%; width:32px; height:32px; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    ▶
                </button>
                <div style="font-size:10px; color:#999;" id="fc-timer">10s</div>
            </div>
        </div>
        <button id="fc-close" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.5); color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">✕</button>
    `;

  document.body.appendChild(card);

  // Auto đọc âm thanh
  speakWithEdgeTTS(item.word);

  // Bắt sự kiện
  document.getElementById("fc-play-btn").onclick = () =>
    speakWithEdgeTTS(item.word);
  document.getElementById("fc-close").onclick = () => card.remove();

  // Đếm ngược 10s rồi tự tắt
  let timeLeft = 10;
  const timerElem = document.getElementById("fc-timer");
  const interval = setInterval(() => {
    timeLeft--;
    timerElem.innerText = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(interval);
      card.classList.add("flashcard-slide-out"); // Animation biến mất
      setTimeout(() => card.remove(), 500);
    }
  }, 1000);
}

// Lắng nghe tin nhắn từ background.js (Mỗi 15p)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "SHOW_FLASHCARD") {
    const result = await chrome.storage.local.get(["vocabHistory"]);
    const history = result.vocabHistory || [];

    if (history.length > 0) {
      // Lấy ngẫu nhiên 1 từ trong 10 từ gần nhất
      const recentItems = history.slice(0, 10);
      const randomItem =
        recentItems[Math.floor(Math.random() * recentItems.length)];
      showFlashcard(randomItem);
    }
  }
});

// Xử lý sự kiện nhấn phím
// --- 5. EVENT INPUT (CAPTURE CONTEXT) ---
// --- 5. EVENT INPUT (SMART CONTEXT CAPTURE) ---
document.addEventListener("keydown", async (e) => {
  if (e.key === "Shift") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // --- LOGIC LẤY NGỮ CẢNH THÔNG MINH (SMART CONTEXT) ---
      let contextText = "";

      try {
        if (selection.anchorNode && selection.anchorNode.parentElement) {
          const parentText = selection.anchorNode.parentElement.innerText;

          // Tìm vị trí của từ được chọn trong đoạn văn cha
          // Lưu ý: indexOf có thể tìm sai nếu từ xuất hiện nhiều lần,
          // nhưng đây là cách nhẹ nhất cho browser extension.
          const startIdx = parentText.indexOf(selectedText);
          const endIdx = startIdx + selectedText.length;

          if (startIdx !== -1) {
            // 1. Lấy tối đa 100 ký tự trước và sau từ đó
            const lookBack = 100;
            const lookAhead = 100;

            // Xác định vùng cắt thô
            let sliceStart = Math.max(0, startIdx - lookBack);
            let sliceEnd = Math.min(parentText.length, endIdx + lookAhead);

            // 2. Tinh chỉnh: Cố gắng tìm dấu chấm câu (.) để cắt cho đẹp
            // Tìm dấu chấm gần nhất TRƯỚC vùng cắt (trong phạm vi sliceStart)
            const lastDotBefore = parentText.lastIndexOf(".", startIdx);
            if (lastDotBefore !== -1 && lastDotBefore >= sliceStart) {
              sliceStart = lastDotBefore + 1; // Lấy sau dấu chấm
            }

            // Tìm dấu chấm gần nhất SAU vùng cắt
            const firstDotAfter = parentText.indexOf(".", endIdx);
            if (firstDotAfter !== -1 && firstDotAfter <= sliceEnd) {
              sliceEnd = firstDotAfter + 1; // Lấy cả dấu chấm
            }

            // Cắt chuỗi
            contextText = parentText.substring(sliceStart, sliceEnd).trim();

            // Clean up: Xóa xuống dòng thừa
            contextText = contextText.replace(/\s+/g, " ");
          }
        }
      } catch (err) {
        console.warn("Context extraction error:", err);
        contextText = ""; // Fallback nếu lỗi
      }

      // Giới hạn cứng lần cuối để đảm bảo API không bao giờ chết
      if (contextText.length > 200) {
        contextText = "..." + contextText.substring(0, 200) + "...";
      }
      // -----------------------------------------------------

      // Đọc ngay lập tức
      speakWithEdgeTTS(selectedText);

      // Gọi popup
      showPopup(rect, selectedText, contextText);
    } else if (isPopupOpen) {
      closePopup();
    }
  } else if (e.key === "Escape" && isPopupOpen) {
    closePopup();
  }
});

// Khởi tạo
async function init() {
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      const voices = speechSynthesis.getVoices();
      console.log(
        "Available voices:",
        voices.filter((v) => v.lang.startsWith("en-US")).map((v) => v.name)
      );
    };
  }
  createPopup();
}

init();
/* =========================================
   CẬP NHẬT: LOGIC XỬ LÝ LỖI (ERROR HANDLING)
   ========================================= */

// 1. Xử lý khi bấm nút Mic
async function handleMicClick(referenceText, btnElement) {
  if (!isRecording) {
    // Bắt đầu ghi âm
    try {
      // Check xem trình duyệt có hỗ trợ không
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Trình duyệt này không hỗ trợ ghi âm!");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);

      mediaRecorder.onstop = async () => {
        // UI: Đang xử lý
        const resultDiv = document.getElementById("assessment-result");
        if (resultDiv) {
          resultDiv.innerHTML =
            '<div style="font-size:12px; color:#ddd; text-align:center; padding:5px;">⏳ Đang gửi lên Azure...<br>(Quá trình này mất khoảng 2-3s)</div>';
        }

        try {
          // Gom chunk thành blob
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

          // [NEW] Lưu vào biến global để replay sau này
          lastRecordedBlob = audioBlob;

          // Debug: Log ra console để check
          console.log("Audio recorded size:", audioBlob.size);

          if (audioBlob.size < 1000) {
            throw new Error("File ghi âm quá ngắn hoặc không có tiếng.");
          }

          // Gọi hàm xử lý chính (giữ nguyên logic cũ)
          // Lưu ý: truyền thêm referenceText vào render để nút Standard hoạt động
          const result = await assessPronunciation(audioBlob, referenceText);

          // Render kết quả (truyền thêm referenceText)
          renderAssessmentResult(result, resultDiv, referenceText);
        } catch (err) {
          // ... (giữ nguyên code xử lý lỗi cũ)
          console.error("Processing Error:", err);
          if (resultDiv) {
            resultDiv.innerHTML = `<div style="color:#ff5252; font-size:13px; text-align:center; padding:5px;">❌ Lỗi: ${err.message}</div>`;
          }
        } finally {
          // Luôn luôn tắt stream Mic để giải phóng RAM
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      isRecording = true;
      btnElement.classList.add("recording");
    } catch (err) {
      console.error("Mic Access Error:", err);
      alert("Không thể mở Mic. Hãy kiểm tra quyền truy cập!");
    }
  } else {
    // Stop recording
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    isRecording = false;
    btnElement.classList.remove("recording");
  }
}

// 2. Gọi API Azure Speech (Đã bọc Try-Catch toàn bộ)
async function assessPronunciation(audioBlob, referenceText) {
  try {
    const result = await chrome.storage.sync.get(["azureKey", "azureRegion"]);
    const key = result.azureKey;
    const region = result.azureRegion;

    if (!key || !region) {
      throw new Error("Chưa nhập Azure Key/Region trong cài đặt.");
    }

    // Convert WebM sang WAV 16kHz Mono
    // Lỗi thường xảy ra ở đây do convert
    const wavBlob = await convertAudioToWav(audioBlob);
    console.log("Converted WAV size:", wavBlob.size);

    const assessParams = {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
    };

    const paramsHeader = btoa(JSON.stringify(assessParams));
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        Accept: "application/json",
        "Pronunciation-Assessment": paramsHeader,
      },
      body: wavBlob,
    });

    if (!response.ok) {
      // Nếu Azure trả lỗi (400, 401...)
      const errText = await response.text();
      console.error("Azure API Error:", response.status, errText);

      if (response.status === 401)
        throw new Error("Sai Azure Key hoặc Region.");
      if (response.status === 400)
        throw new Error("Bad Request (Audio lỗi hoặc Text quá dài).");

      throw new Error(
        `Azure Error ${response.status}: ${errText.substring(0, 50)}...`
      );
    }

    return await response.json();
  } catch (e) {
    // Ném lỗi ra ngoài để handleMicClick bắt được
    throw e;
  }
}
/* ======================================================
   HÀM HIỂN THỊ KẾT QUẢ CHI TIẾT (ELSA STYLE)
   ====================================================== */
// [UPDATE] Thêm tham số referenceText vào cuối
function renderAssessmentResult(data, container, referenceText) {
  if (!container) return;

  console.log("🔍 Azure Response:", data);

  // 1. Check lỗi cơ bản (Giữ nguyên)
  if (!data || data.error) {
    container.innerHTML = `<div style="color:#ff5252; text-align:center;">⚠️ ${
      data?.error || "Lỗi API"
    }</div>`;
    return;
  }
  if (!data.NBest || !data.NBest[0]) {
    container.innerHTML = `<div style="color:#ffb74d; text-align:center;">🤔 Không nghe rõ. Thử lại nhé!</div>`;
    return;
  }

  const result = data.NBest[0];

  // Lấy điểm tổng (Flattened JSON fix) - Giữ nguyên logic cũ
  const totalScore =
    result.AccuracyScore !== undefined
      ? result.AccuracyScore
      : result.PronunciationAssessment
      ? result.PronunciationAssessment.AccuracyScore
      : 0;

  const words = result.Words || [];

  // Xác định màu cho vòng tròn điểm tổng - Giữ nguyên
  let scoreColor = "#ff5252";
  if (totalScore >= 80) scoreColor = "#4caf50";
  else if (totalScore >= 60) scoreColor = "#ffeb3b";

  // --- BẮT ĐẦU RENDER HTML ---
  // Thêm ID để dễ querySelector nút bấm
  let html = `<div class="assessment-box" id="result-box-content" style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-top:10px;">`;

  // [NEW] 2 Nút Playback: User Voice & Azure Standard
  html += `
    <div class="assessment-actions">
        <button id="btn-play-user" class="action-btn-small btn-user-audio" title="Nghe lại giọng bạn">
            🗣️ My Voice
        </button>
        <button id="btn-play-standard" class="action-btn-small btn-ref-audio" title="Nghe giọng chuẩn">
            🎧 Standard
        </button>
    </div>
  `;

  // 1. Vòng tròn điểm số (Giữ nguyên)
  html += `
    <div class="total-score-circle" style="border-color: ${scoreColor}; color: ${scoreColor}">
      ${Math.round(totalScore)}
    </div>
    <div style="text-align:center; color:#ddd; font-size:13px; margin-bottom:15px;">Điểm phát âm tổng quát</div>
  `;

  // 2. Container chứa các từ (Giữ nguyên logic loop words)
  html += `<div class="analyzed-content">`;

  words.forEach((word) => {
    // ... (Giữ nguyên logic render từng từ và phoneme cũ của bạn ở đây) ...
    // Để tiết kiệm không gian chat, tôi viết tắt đoạn này là "RENDER_WORDS_LOGIC"
    // Bạn hãy copy paste lại đoạn logic loop words cũ vào đây nhé

    const wordText = word.Word;
    const wScore =
      word.AccuracyScore ||
      (word.PronunciationAssessment
        ? word.PronunciationAssessment.AccuracyScore
        : 0);
    const errorType =
      word.ErrorType ||
      (word.PronunciationAssessment
        ? word.PronunciationAssessment.ErrorType
        : "None");
    let wordColor = "#fff";
    if (errorType === "Omission") wordColor = "#777";
    else if (wScore < 60) wordColor = "#ff5252";

    const phonemes = word.Phonemes || [];
    let phonemeHtml = "";

    if (errorType === "Omission") {
      phonemeHtml = `<span style="font-size:10px; color:#999;">(missed)</span>`;
    } else {
      phonemes.forEach((p) => {
        const pScore = p.AccuracyScore;
        const pText = p.Phoneme;
        let pClass = "p-bad";
        if (pScore >= 90) pClass = "p-perfect";
        else if (pScore >= 80) pClass = "p-good";
        else if (pScore >= 60) pClass = "p-fair";
        phonemeHtml += `<span class="phoneme-char ${pClass}" title="Âm: /${pText}/ - Điểm: ${pScore}">${pText}</span>`;
      });
    }

    html += `
      <div class="word-block">
        <span class="word-text" style="color:${wordColor}">${wordText}</span>
        <div class="phoneme-row">${phonemeHtml}</div>
      </div>
    `;
  });

  html += `</div>`; // Đóng analyzed-content
  html += `</div>`; // Đóng assessment-box

  container.innerHTML = html;

  // [NEW] Gán sự kiện Click cho 2 nút vừa tạo
  // Cần dùng setTimeout hoặc requestAnimationFrame để đảm bảo DOM đã được render
  setTimeout(() => {
    const btnUser = document.getElementById("btn-play-user");
    const btnStandard = document.getElementById("btn-play-standard");

    // Play User Recording
    if (btnUser && lastRecordedBlob) {
      btnUser.onclick = () => {
        const audioUrl = URL.createObjectURL(lastRecordedBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      };
    }

    // Play Standard (Dùng lại hàm speakWithEdgeTTS có sẵn)
    if (btnStandard && referenceText) {
      btnStandard.onclick = () => {
        speakWithEdgeTTS(referenceText);
      };
    }
  }, 0);
}
// 1. Chuyển đổi Blob Audio sang WAV 16kHz Mono
async function convertAudioToWav(audioBlob) {
  // Tạo AudioContext với sample rate 16000 (chuẩn Azure Speech)
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 16000,
  });
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Lấy dữ liệu channel 0 (Mono)
  const pcmData = audioBuffer.getChannelData(0);

  // Encode sang WAV
  const wavBuffer = encodeWAV(pcmData, 16000);
  return new Blob([wavBuffer], { type: "audio/wav" });
}

// 2. Hàm Encode cấu trúc file WAV
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // Helper viết chuỗi
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Ghi dữ liệu PCM
  floatTo16BitPCM(view, 44, samples);

  return view;
}

// 3. Chuyển đổi Float sang 16-bit PCM
function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}
