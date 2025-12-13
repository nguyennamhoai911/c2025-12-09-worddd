// --- MODULE: SERVICES & API ---

// 1. Caching System
async function getFromCache(key) {
  const storageKey = `cache_${key.toLowerCase().trim()}`;
  const result = await chrome.storage.local.get([storageKey]);
  const cachedItem = result[storageKey];
  // Cache hết hạn sau 24h
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
    console.warn("Save History Error:", e);
  }
}

// 2. Google Translate & Dictionary API
async function getTranslation(text, contextText = "") {
  try {
    let contextMeaning = null;
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
          if (dataCtx && dataCtx[0])
            contextMeaning = dataCtx[0].map((item) => item[0]).join("");
        }
      } catch (e) {
        /* Ignore */
      }
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
    console.error("Translation Error:", error);
    return null;
  }
  return null;
}

// 3. Image Fetching (Google Custom Search + Unsplash Fallback)
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
      return data.items.slice(0, 3).map((item) => item.link);
  } catch (e) {
    if (e.message === "QUOTA_EXCEEDED") throw e;
  }
  return null;
}

async function getImagesFromUnsplash(searchTerm) {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchTerm
      )}&per_page=3&client_id=E8nbwS_cEWGVX4rM0e_-Eq6IpI_QKlO4eFEKfOl3AUo`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.results) return data.results.map((item) => item.urls.regular);
    }
  } catch (error) {
    console.error("Unsplash Error:", error);
  }
  return [];
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
    for (let i = 0; i < keyList.length; i++) {
      const { key, cx } = keyList[i];
      if (!key || !cx) continue;
      try {
        const resultImages = await tryFetchGoogleImage(searchTerm, key, cx);
        if (resultImages && resultImages.length > 0) {
          images = resultImages;
          break;
        }
      } catch (err) {
        continue;
      }
    }
  }
  if (images.length === 0) images = await getImagesFromUnsplash(searchTerm);
  return images;
}

// 4. Phonetics
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
      data[0].phonetics?.forEach((p) => {
        if (p.text) {
          if (p.audio && p.audio.includes("-uk")) result.uk = p.text;
          else if (p.audio && p.audio.includes("-us")) result.us = p.text;
          else if (!result.us && !result.uk) result.us = p.text;
        }
      });
      if (!result.uk && !result.us && data[0].phonetic)
        result.us = data[0].phonetic;
      return result;
    }
  } catch (error) {
    console.error("Phonetic Error:", error);
  }
  return null;
}

async function getPhoneticForText(text) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const isLongText = words.length > 5;
  const phonetics = await Promise.all(
    words.map(async (word) => {
      const cleanWord = word.replace(/[.,!?;:'"()]/g, "");
      return cleanWord ? await getPhoneticForWord(cleanWord) : null;
    })
  );

  const ukParts = [],
    usParts = [];
  phonetics.forEach((p, idx) => {
    const cleanWord = words[idx].replace(/[.,!?;:'"()]/g, "");
    if (p) {
      if (!isLongText && p.uk) ukParts.push(p.uk);
      usParts.push(p.us || p.uk || cleanWord);
    } else {
      if (!isLongText) ukParts.push(cleanWord);
      usParts.push(cleanWord);
    }
  });

  const formatPhonetics = (parts) => {
    const combined = parts
      .map((part) => (part ? part.replace(/^\/|\/$/g, "") : ""))
      .filter(Boolean)
      .join(" ");
    return combined ? `//${combined}//` : null;
  };
  return { uk: null, us: formatPhonetics(usParts) };
}

// 5. Azure Speech & Audio Utils
async function convertAudioToWav(audioBlob) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 16000,
  });
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const pcmData = audioBuffer.getChannelData(0);
  const wavBuffer = encodeWAV(pcmData, 16000);
  return new Blob([wavBuffer], { type: "audio/wav" });
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++)
      view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return view;
}

async function assessPronunciation(audioBlob, referenceText) {
  try {
    const result = await chrome.storage.sync.get(["azureKey", "azureRegion"]);
    const key = result.azureKey;
    const region = result.azureRegion;
    if (!key || !region)
      throw new Error("Chưa nhập Azure Key/Region trong cài đặt.");
    const wavBlob = await convertAudioToWav(audioBlob);
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
      if (response.status === 401)
        throw new Error("Sai Azure Key hoặc Region.");
      if (response.status === 400)
        throw new Error("Bad Request (Audio lỗi hoặc Text quá dài).");
      throw new Error(`Azure Error ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    throw e;
  }
}
