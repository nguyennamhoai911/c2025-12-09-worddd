document.addEventListener('DOMContentLoaded', () => {
  const stBackend = document.getElementById('st-backend');
  const stSsl = document.getElementById('st-ssl');
  const stDb = document.getElementById('st-db');
  const stOauth = document.getElementById('st-oauth');
  const stToken = document.getElementById('st-token');
  const stApiKey = document.getElementById('st-apikey');
  const stAzure = document.getElementById('st-azure');
  const stGemini = document.getElementById('st-gemini');
  const stTranslator = document.getElementById('st-translator'); // NEW
  const rawOutput = document.getElementById('raw-output');

  const backBtn = document.getElementById('back-btn');
  const retryBtn = document.getElementById('retry-btn');
  const closeX = document.getElementById('close-x');

  // URL Health Check
  const HEALTH_URL = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.API_URL : 'https://localhost:5000');

  // Navigation
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });
  closeX.addEventListener('click', () => {
    window.close();
  });
  retryBtn.addEventListener('click', runCheck);

  async function runCheck() {
    // Reset UI
    const loading = '<div class="loading-spinner"></div>';
    stBackend.innerHTML = loading;
    stSsl.innerHTML = loading;
    stDb.textContent = '...';
    stOauth.textContent = '...';
    
    // 1. Check Local Extension Config
    chrome.storage.sync.get(
        ['authToken', 'googleApiKey', 'azureKey', 'geminiApiKey', 'azureTranslatorKey', 'azureTranslatorRegion'], 
        (result) => {
      
      if (result.authToken) {
        stToken.innerHTML = '<span class="status ok">FOUND ✅</span>';
      } else {
        stToken.innerHTML = '<span class="status err">MISSING ❌</span>';
      }

      if (result.googleApiKey) {
        stApiKey.innerHTML = '<span class="status ok">SET ✅</span>';
      } else {
        stApiKey.innerHTML = '<span class="status warn">EMPTY ⚠️</span>';
      }

      if (result.azureKey) {
        stAzure.innerHTML = '<span class="status ok">READY ✅</span>';
      } else {
        stAzure.innerHTML = '<span class="status err">MISSING ❌</span>';
      }

      if (result.geminiApiKey) {
        stGemini.innerHTML = '<span class="status ok">READY ✅</span>';
        const btn = document.getElementById('btn-test-gemini');
        btn.style.display = 'inline-block';
        btn.onclick = () => testGemini(result.geminiApiKey);
      } else {
        stGemini.innerHTML = '<span class="status warn">EMPTY ⚠️</span>';
      }

      // AZURE TRANSLATOR CHECK
      if (result.azureTranslatorKey && result.azureTranslatorRegion) {
        stTranslator.innerHTML = '<span class="status ok">READY ✅</span>';
        const btn = document.getElementById('btn-test-translator');
        btn.style.display = 'inline-block';
        btn.onclick = () => testAzureTranslator(result.azureTranslatorKey, result.azureTranslatorRegion);
      } else {
        stTranslator.innerHTML = '<span class="status warn">MISSING ⚠️</span>';
      }
    });

    async function testAzureTranslator(key, region) {
         const btn = document.getElementById('btn-test-translator');
         btn.textContent = 'Testing...';
         try {
             // Use explicit endpoint
             const endpoint = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=vi";
             const response = await fetch(endpoint, {
                 method: 'POST',
                 headers: {
                     'Ocp-Apim-Subscription-Key': key,
                     'Ocp-Apim-Subscription-Region': region,
                     'Content-Type': 'application/json'
                 },
                 body: JSON.stringify([{ "Text": "Hello world" }])
             });
 
             if (!response.ok) {
                  // Specific Error Handling
                  if (response.status === 401) throw new Error("401 Unauthorized (Sai Key hoặc Hết hạn)");
                  if (response.status === 403) throw new Error("403 Forbidden (Sai quyền hoặc hết Quota)");
                  
                  const errText = await response.text();
                  throw new Error(`Status ${response.status}: ${errText}`);
             }
 
             const data = await response.json();
             // Expect: [{ translations: [{ text: "Chào thế giới", ... }] }]
             const translation = data[0]?.translations?.[0]?.text;
             
             alert(`✅ Azure Translator OK!\nDịch thử 'Hello world': ${translation}`);
             btn.textContent = 'OK';
         } catch (e) {
             let msg = e.message;
             if (e.message.includes('Failed to fetch')) {
                 msg = "Lỗi mạng (CORS/Chặn). Hãy chắc chắn bạn đã chạy Update Manifest.";
             }
             alert("❌ Check Failed:\n" + msg + "\n\nKiểm tra lại Region (ví dụ: southeastasia) và Key.");
             btn.textContent = 'FAIL';
             console.error(e);
         }
    }

    async function testGemini(key) {
       const btn = document.getElementById('btn-test-gemini');
       btn.textContent = '...';
       
       try {
         const isOpenRouter = key.startsWith('sk-or-');
         if (isOpenRouter) {
             alert("OpenRouter Check Not Implemented in this Quick Fix view.");
         } else {
             // Legacy Google Gemini
             const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
             const res = await fetch(generateUrl, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ contents: [{ parts: [{ text: "Hello, just say OK" }] }] })
             });
             
             const data = await res.json();
             if (res.ok && data.candidates) {
                alert(`✅ Google API OK!\nReply: ${data.candidates[0].content.parts[0].text}`);
                btn.textContent = 'OK';
             } else {
                throw new Error(data.error?.message || JSON.stringify(data));
             }
         }
       } catch (e) {
         alert("❌ AI Check Failed:\n" + e.message);
         btn.textContent = 'FAIL';
       }
    }

    try {
      // 2. Fetch Backend Health
      const start = Date.now();
      const res = await fetch(HEALTH_URL, { 
        method: 'GET',
        headers: { 'Accept': 'text/html' }
      }).catch(err => {
        throw new Error(err.message);
      });

      const text = await res.text();
      const ping = Date.now() - start;

      if (res.ok) {
        stBackend.innerHTML = `<span class="status ok">ONLINE (${ping}ms) ✅</span>`;
        stSsl.innerHTML = `<span class="status ok">SECURE ✅</span>`;
        
        if (text.includes('Connected') || text.includes('ONLINE')) {
           stDb.innerHTML = '<span class="status ok">CONNECTED ✅</span>';
        } else {
           stDb.innerHTML = '<span class="status err">DISCONNECTED ❌</span>';
        }

        if (text.includes('Ready') || text.includes('GOOGLE OAUTH:</span> <span class="value">Ready')) {
           stOauth.innerHTML = '<span class="status ok">READY ✅</span>';
        } else {
           stOauth.innerHTML = '<span class="status warn">NOT CONFIG ⚠️</span>';
        }

        rawOutput.style.display = 'block';
        rawOutput.textContent = "Raw HTML Preview:\n" + text.substring(0, 500) + "...";

      } else {
        throw new Error(`Status ${res.status}`);
      }

    } catch (e) {
      console.error(e);
      stBackend.innerHTML = `<span class="status err">FAILED ❌</span>`;
      stSsl.innerHTML = `<span class="status err">ERROR ❌</span>`;
      stDb.innerHTML = `<span class="status err">UNREACHABLE</span>`;
      stOauth.innerHTML = `<span class="status err">UNREACHABLE</span>`;
      
      let msg = e.message;
      if (msg.includes('Failed to fetch')) {
         msg += ' (Check SSL/Cert?)';
      }
      rawOutput.style.display = 'block';
      rawOutput.textContent = `Error Details: ${msg}\n\nHint: Open ${HEALTH_URL} in browser.`;
    }
  }

  // Auto Run
  runCheck();
});
