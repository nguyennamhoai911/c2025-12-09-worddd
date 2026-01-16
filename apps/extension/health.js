document.addEventListener('DOMContentLoaded', () => {
  const stBackend = document.getElementById('st-backend');
  const stSsl = document.getElementById('st-ssl');
  const stDb = document.getElementById('st-db');
  const stOauth = document.getElementById('st-oauth');
  const stToken = document.getElementById('st-token');
  const stApiKey = document.getElementById('st-apikey');
  const stAzure = document.getElementById('st-azure');
  const stGemini = document.getElementById('st-gemini');
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
    chrome.storage.sync.get(['authToken', 'googleApiKey', 'azureKey', 'geminiApiKey'], (result) => {
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
    });

    async function testGemini(key) {
       const btn = document.getElementById('btn-test-gemini');
       btn.textContent = '...';
       
       try {
         // Check if it looks like an OpenRouter Key
         const isOpenRouter = key.startsWith('sk-or-');
         
         if (isOpenRouter) {
             // === OPENROUTER TEST (Dynamic Model Discovery) ===
             console.log("Testing OpenRouter Key - Discovering available models...");
             btn.textContent = 'Discovering...';

             try {
                 // Step 1: Get list of available models
                 const modelsRes = await fetch("https://openrouter.ai/api/v1/models", {
                     headers: {
                         "Authorization": `Bearer ${key}`
                     }
                 });

                 if (!modelsRes.ok) {
                     throw new Error("Failed to fetch models list. Check your API key.");
                 }

                 const modelsData = await modelsRes.json();
                 console.log("Available models:", modelsData);

                 // Step 2: Find first free model (pricing.prompt = 0 or has 'free' in id)
                 const freeModel = modelsData.data.find(m => 
                     m.id.includes(':free') || 
                     (m.pricing && parseFloat(m.pricing.prompt) === 0)
                 );

                 if (!freeModel) {
                     throw new Error("No free models found. You may need to add credits to your OpenRouter account.");
                 }

                 const modelId = freeModel.id;
                 console.log("Selected free model:", modelId);
                 btn.textContent = `Testing ${modelId.split('/').pop().substring(0,15)}...`;

                 // Step 3: Test the model
                 const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${key}`,
                      "Content-Type": "application/json",
                      "HTTP-Referer": "https://vocabulary-coach.app",
                      "X-Title": "Vocabulary Coach"
                    },
                    body: JSON.stringify({
                      "model": modelId,
                      "messages": [
                        {"role": "user", "content": "Say OK"}
                      ]
                    })
                 });
                 
                 const data = await res.json();
                 
                 if (res.ok && data.choices && data.choices[0]) {
                     alert(`✅ OpenRouter OK!\nFree Model: ${modelId}\nReply: ${data.choices[0].message.content}`);
                     btn.textContent = 'OK';
                 } else {
                     throw new Error(data.error?.message || `Test failed: ${JSON.stringify(data)}`);
                 }
             } catch (e) {
                 throw new Error("OpenRouter Error: " + e.message);
             }
         } else {
             // === LEGACY GOOGLE GEMINI TEST ===
             // 1. Check Available Models first
             const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
             const modelsRes = await fetch(modelsUrl);
             if (!modelsRes.ok) {
                throw new Error("Key không hợp lệ hoặc chưa bật API (ListModels Failed)");
             }
             const modelsData = await modelsRes.json();
             const availableModels = modelsData.models ? modelsData.models.map(m => m.name) : [];
             console.log("Available Models:", availableModels);

             // 2. Choose the best model
             let fullModelPath = availableModels.find(m => m.includes('gemini-1.5-flash')) 
                               || 'models/gemini-1.5-flash';
             let modelName = fullModelPath.replace('models/', '');
             
             // 3. Test Generate
             const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
             const res = await fetch(generateUrl, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ contents: [{ parts: [{ text: "Hello, just say OK" }] }] })
             });
             
             const data = await res.json();
             if (res.ok && data.candidates) {
                alert(`✅ Google API OK!\nModel: ${modelName}\nReply: ${data.candidates[0].content.parts[0].text}`);
                btn.textContent = 'OK';
             } else {
                throw new Error(data.error?.message || JSON.stringify(data));
             }
         }

       } catch (e) {
         alert("❌ AI Check Failed:\n" + e.message);
         btn.textContent = 'FAIL';
         console.error(e);
       }
    }

    try {
      // 2. Fetch Backend Health (Endpoint trả về HTML nhưng ta chỉ cần check status ok)
      // Lưu ý: Endpoint này trả về HTML, ta sẽ fetch text
      const start = Date.now();
      const res = await fetch(HEALTH_URL, { 
        method: 'GET',
        headers: { 'Accept': 'text/html' } // Force HTML response
      }).catch(err => {
        throw new Error(err.message);
      });

      const text = await res.text();
      const ping = Date.now() - start;

      if (res.ok) {
        stBackend.innerHTML = `<span class="status ok">ONLINE (${ping}ms) ✅</span>`;
        stSsl.innerHTML = `<span class="status ok">SECURE ✅</span>`;
        
        // Parse HTML Hacker để lấy thông tin Database (Quick & Dirty Regex)
        // Vì controller trả về HTML đẹp, ta phải bóc tách
        // Dấu hiệu: STATUS: ... status-ok ... >ONLINE
        
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

        // Show raw data toggle
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
      rawOutput.textContent = `Error Details: ${msg}\n\nHint: Open ${HEALTH_URL} in browser and accept risk if using self-signed cert.`;
    }
  }

  // Auto Run
  runCheck();
});
