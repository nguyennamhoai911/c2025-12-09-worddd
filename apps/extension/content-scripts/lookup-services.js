// =======================================================================
// MODULE: SERVICES (API, Audio, Caching)
// =======================================================================

const BACKEND_URL = APP_CONFIG.API_URL;
let isSoundEnabled = true;

// --- 1. SETTINGS & AUDIO ---
function toggleSoundState() {
  isSoundEnabled = !isSoundEnabled;
  if (!isSoundEnabled) window.speechSynthesis.cancel();
  return isSoundEnabled;
}


// Sử dụng Edge TTS API (Phiên bản Stable Backup)
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


// --- 2. BACKEND API (SAVE VOCAB) ---
// apps/extension/content-scripts/lookup-services.js

// --- 2. BACKEND API (SAVE VOCAB) ---
async function apiSaveVocabulary(data) {
  // 👇 1. LOG CHECK CONFIG
  console.log(
    `%c[EXT-DEBUG] 🚀 Starting Save...`,
    "color: cyan; font-weight: bold"
  );
  console.log(`[EXT-DEBUG] Backend URL:`, BACKEND_URL);

  try {
    const meaning =
      typeof data.translation === "string"
        ? data.translation
        : data.translation?.wordMeaning || "";

    const partOfSpeech =
      data.translation?.dict && data.translation.dict.length > 0
        ? data.translation.dict[0].pos
        : "";

    const pronunciation = data.phonetics?.us
      ? data.phonetics.us.replace(/\//g, "")
      : "";

    const payload = {
      word: data.text,
      meaning: meaning,
      example: data.contextText || "",
      pronunciation: pronunciation,
      partOfSpeech: partOfSpeech,
      topic: "Extension",
      isStarred: false,
    };

    // 👇 2. LOG REQUEST
    console.log(`[EXT-DEBUG] Payload:`, payload);
    console.log(`[EXT-DEBUG] Sending request to: ${BACKEND_URL}/vocabulary`);

    const response = await fetch(`${BACKEND_URL}/vocabulary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    // 👇 3. LOG RESPONSE STATUS
    console.log(`[EXT-DEBUG] Response Status:`, response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[EXT-DEBUG] Server Error Body:`, errText); // Xem server trả về lỗi gì

      if (response.status === 401) throw new Error("Chưa đăng nhập (401)");
      if (response.status === 403) throw new Error("Bị chặn quyền (403)");
      throw new Error(`Lỗi Server: ${response.status}`);
    }

    const json = await response.json();
    console.log(`[EXT-DEBUG] Success Data:`, json);
    return json;
  } catch (error) {
    // 👇 4. LOG NETWORK ERROR (Quan trọng nhất)
    console.error(`[EXT-DEBUG] 🔥 FATAL ERROR:`, error);

    if (error.message.includes("Failed to fetch")) {
      console.warn(
        `[EXT-DEBUG] 👉 Gợi ý: Có thể do lỗi SSL, CORS, hoặc chưa add host_permissions trong manifest.`
      );
    }
    throw error;
  }
}

// --- 3. CACHING SYSTEM ---
async function getFromCache(key) {
  const storageKey = `cache_${key.toLowerCase().trim()}`;
  const result = await chrome.storage.local.get([storageKey]);
  const cachedItem = result[storageKey];
  if (cachedItem && Date.now() - cachedItem.timestamp < 24 * 60 * 60 * 1000) {
    return cachedItem.data;
  }
  return null;
}

async function saveToCache(key, data) {
  const storageKey = `cache_${key.toLowerCase().trim()}`;
  await chrome.storage.local.set({
    [storageKey]: { data: data, timestamp: Date.now() },
  });
}

async function saveToHistory(word, data) {
  try {
    const result = await chrome.storage.local.get(["vocabHistory"]);
    let history = result.vocabHistory || [];
    history = history.filter(
      (item) =>
        item && item.word && item.word.toLowerCase() !== word.toLowerCase()
    );
    history.unshift({ word: word, data: data, timestamp: Date.now() });
    if (history.length > 50) history.pop();
    await chrome.storage.local.set({ vocabHistory: history });
  } catch (e) {
    console.warn("History Error:", e);
  }
}

// --- 4. GOOGLE TRANSLATE API ---
async function getTranslation(text, contextText = "") {
  try {
    let contextMeaning = null;
    if (contextText && contextText.length > 0 && contextText !== text) {
      try {
        const urlCtx = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
          contextText
        )}`;
        const resCtx = await fetch(urlCtx);
        if (resCtx.ok) {
          const dataCtx = await resCtx.json();
          if (dataCtx && dataCtx[0])
            contextMeaning = dataCtx[0].map((item) => item[0]).join("");
        }
      } catch (e) {}
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=${encodeURIComponent(
      text
    )}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Google API Error");
    const data = await response.json();

    if (data) {
      const mainMeaning = data[0]
        ? data[0].map((item) => item[0]).join("")
        : "";
      let dict = [];
      if (data[1]) {
        data[1].forEach((group) => {
          dict.push({ pos: group[0], terms: group[1].slice(0, 5) });
        });
      }
      return {
        wordMeaning: mainMeaning,
        contextMeaning: contextMeaning,
        dict: dict,
      };
    }
  } catch (error) {
    return null;
  }
  return null;
}

// --- 5. IMAGE API ---
async function tryFetchGoogleImage(searchTerm, apiKey, cx) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      searchTerm
    )}&cx=${cx}&searchType=image&key=${apiKey}&num=3`;
    const response = await fetch(url);
    if (response.status === 403 || response.status === 429)
      throw new Error(`QUOTA_EXCEEDED`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.items && data.items.length > 0)
      return data.items.map((item) => item.link);
  } catch (e) {
    if (e.message === "QUOTA_EXCEEDED") throw e;
  }
  return null;
}

async function getImages(englishText) {
  const searchTerm = englishText.trim();
  let images = [];
  const result = await chrome.storage.sync.get([
    "googleApiKeys",
    "googleApiKey",
    "googleSearchEngineId",
  ]);
  let keyList = result.googleApiKeys || [];
  if (
    keyList.length === 0 &&
    result.googleApiKey &&
    result.googleSearchEngineId
  ) {
    keyList.push({ key: result.googleApiKey, cx: result.googleSearchEngineId });
  }

  if (keyList.length > 0) {
    for (const { key, cx } of keyList) {
      if (!key || !cx) continue;
      try {
        const res = await tryFetchGoogleImage(searchTerm, key, cx);
        if (res) {
          images = res;
          break;
        }
      } catch (err) {
        continue;
      }
    }
  }
  // Fallback Unsplash
  if (images.length === 0) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          searchTerm
        )}&per_page=3&client_id=E8nbwS_cEWGVX4rM0e_-Eq6IpI_QKlO4eFEKfOl3AUo`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results) images = data.results.map((i) => i.urls.regular);
      }
    } catch (e) {}
  }
  return images;
}

// --- 6. PHONETICS (UPDATED FROM OLD CODE) ---

// Helper: Lấy phiên âm từng từ (Logic cũ)
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
      const result = { uk: null, us: null };

      // Ưu tiên lấy từ file audio để biết chính xác giọng
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

      // Fallback nếu không tìm thấy trong phonetics array
      if (!result.uk && !result.us && data[0].phonetic) {
        result.us = data[0].phonetic;
      }
      return result;
    }
  } catch (error) {}
  return null;
}

// Main: Lấy phiên âm cho cả câu/đoạn (Logic cũ)
async function getPhoneticForText(text) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const isLongText = words.length > 5;

  // Chạy song song request cho từng từ
  const phonetics = await Promise.all(
    words.map(async (word) => {
      const cleanWord = word.replace(/[.,!?;:'"()]/g, "");
      if (!cleanWord) return null;
      return await getPhoneticForWord(cleanWord);
    })
  );

  const ukParts = [];
  const usParts = [];

  phonetics.forEach((p, idx) => {
    if (p) {
      if (!isLongText && p.uk) ukParts.push(p.uk);

      if (p.us) usParts.push(p.us);
      else if (p.uk) usParts.push(p.uk); // Fallback UK sang US nếu thiếu
      else {
        // Fallback word gốc nếu không có phiên âm
        const cleanWord = words[idx].replace(/[.,!?;:'"()]/g, "");
        usParts.push(cleanWord);
      }
    } else {
      const cleanWord = words[idx].replace(/[.,!?;:'"()]/g, "");
      if (!isLongText) ukParts.push(cleanWord);
      usParts.push(cleanWord);
    }
  });

  const format = (parts) => {
    if (parts.length === 0) return null;
    const combined = parts
      .map((part) => (part ? part.replace(/^\/|\/$/g, "") : "")) // Bỏ dấu / thừa
      .filter(Boolean)
      .join(" ");
    return combined ? `/${combined}/` : null; // Bọc lại bằng //
  };

  return {
    uk: format(ukParts),
    us: format(usParts),
  };
}

// Helper: Convert Audio
async function convertAudioToWav(audioBlob) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 16000,
  });
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const pcmData = audioBuffer.getChannelData(0);

  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++)
      view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, pcmData.length * 2, true);
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

async function assessPronunciation(audioBlob, referenceText) {
  try {
    const result = await chrome.storage.sync.get(["azureKey", "azureRegion"]);
    const key = result.azureKey;
    const region = result.azureRegion;
    // Fallback: Use Browser Speech Recognition if Azure is missing
    if (!key || !region) {
        console.warn("Missing Azure Key, switching to Basic Browser Speech Recognition");
        return await new Promise((resolve, reject) => {
             const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
             if (!SpeechRecognition) return reject("Browser does not support Speech API");
             throw new Error("Cần nhập Azure Key để chấm điểm chi tiết. (Browser Basic Mode not supported for pre-recorded blob)");
        });
    }

    const wavBlob = await convertAudioToWav(audioBlob);
    const assessParams = {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      PhonemeAlphabet: "IPA",
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

    if (!response.ok) throw new Error(`Azure Error ${response.status}`);
    return await response.json();
  } catch (e) {
    throw e;
  }
}
// --- [NEW] CHECK VOCAB EXISTENCE ---
async function apiCheckVocabulary(word) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/vocabulary/check?word=${encodeURIComponent(word)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Để lấy cookie auth
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data; // Trả về object từ vựng nếu có, hoặc null/rỗng
    }
  } catch (e) {
    console.warn("Check vocab failed:", e);
  }
  return null;
}
// --- [NEW] UPDATE SCORE TO BACKEND ---
async function apiAddScore(vocabId, score) {
  // Nếu vocabId là "temp" hoặc không có ID -> Không lưu được (chỉ luyện tập)
  if (!vocabId || vocabId === "temp") return false;

  try {
    const response = await fetch(`${BACKEND_URL}/vocabulary/${vocabId}/score`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Math.round(score) }),
      credentials: "include",
    });
    return response.ok;
  } catch (e) {
    console.error("Save score failed:", e);
    return false;
  }
}

// Tìm kiếm danh sách từ (cho Quick Search)
async function apiSearchVocabulary(keyword) {
  try {
    if (!keyword) return [];
    const res = await fetch(
      `${BACKEND_URL}/vocabulary?search=${encodeURIComponent(keyword)}&limit=5`,
      {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    if (res.ok) {
      const json = await res.json();
      return json.data; // Trả về mảng items
    }
  } catch (e) {}
  return [];
}

// Hàm Save đầy đủ (thay thế hoặc bổ sung cho apiSaveVocabulary cũ)
async function apiCreateFullVocabulary(payload) {
  // Payload: { word, meaning, example, topic, partOfSpeech, pronunciation, relatedWords }
  const response = await fetch(`${BACKEND_URL}/vocabulary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Save failed");
  return await response.json();
}
async function apiUpdateVocabulary(id, data) {
  try {
    const payload = {
      word: data.word,
      meaning: data.meaning,
      example: data.example,
      topic: data.topic,
      partOfSpeech: data.partOfSpeech,
      pronunciation: data.pronunciation,
      relatedWords: data.relatedWords,
      // Backend không nhận 'isEditMode' nên đừng gửi
    };

    const response = await fetch(`${BACKEND_URL}/vocabulary/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) throw new Error("Update failed");
    return await response.json();
  } catch (error) {
    throw error;
  }
}
// --- [NEW] DỊCH VIỆT -> ANH ---
async function translateViToEn(vietnameseText) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(
      vietnameseText
    )}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data[0]) {
      return data[0].map((item) => item[0]).join("");
    }
  } catch (error) {
    console.error("Translate VI->EN error:", error);
  }
  return null;
}
// ... (các code cũ giữ nguyên)

// --- [NEW] FETCH STARRED VOCABULARY ---
async function apiGetStarredVocabulary() {
  try {
    // Gọi API lấy danh sách từ đã Star (Lấy limit 50 từ mới nhất để random)
    const res = await fetch(
      `${BACKEND_URL}/vocabulary?isStarred=true&limit=50`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Quan trọng để gửi Cookie Auth
      }
    );

    if (res.ok) {
      const json = await res.json();
      return json.data; // Trả về mảng VocabItem
    }
  } catch (e) {
    console.error("Fetch starred failed:", e);
  }
  return [];
}
