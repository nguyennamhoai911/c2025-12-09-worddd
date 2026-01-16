import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {

  // List of high-speed, high-quality FREE models to try in order
  private readonly PREFERRED_MODELS = [
    'google/gemini-2.0-flash-exp:free', // Super fast & smart
    'google/gemini-2.0-flash-thinking-exp:free', // Detailed thinking
    'meta-llama/llama-3.3-70b-instruct:free', // Robust
    'microsoft/phi-3-mini-128k-instruct:free', // Very fast fallback
  ];

  async analyzeVocabulary(
    text: string,
    context: string,
    apiKey: string,
  ): Promise<any> {
    if (!apiKey) {
      throw new BadRequestException('OpenRouter API Key is missing. Please update it in Settings.');
    }

    const prompt = `Act as a professional Vietnamese translator.
**Context:** "${context}"
**Target:** "${text}"

**Task:**
1. Translate meanings naturally, like a native Vietnamese speaker (not word-for-word).
2. Identify the IPA, Meaning (in context), Part of Speech.
3. Translate the full context sentence.
4. **IMPORTANT:** In the sentence translation, wrap the translation of "${text}" inside brackets [ ].

**Output JSON:**
{
  "ipa": "IPA transcription",
  "meaning": "Natural Vietnamese meaning of '${text}'",
  "common_meanings": "2-3 short synonyms",
  "context_translation": "Full sentence translation with [highlight]",
  "part_of_speech": "Verb/Noun/Adj/etc"
}

**Example:**
Input: "leaving" in "Why Are Designers Leaving Figma?"
Output:
{
  "ipa": "/ˈliːvɪŋ/",
  "meaning": "bỏ đi",
  "common_meanings": "rời khỏi, chia tay",
  "context_translation": "Tại sao các nhà thiết kế lại [bỏ đi] khỏi Figma?",
  "part_of_speech": "Verb"
}`;

    // 🚀 SPEED OPTIMIZATION: RACE CONDITION
    // Fire requests to top 3 fastest models simultaneously. First to reply wins.
    // This avoids waiting for a slow/cold model to timeout.
    const RACERS = [
        'google/gemini-2.0-flash-exp:free',
        'google/gemini-2.0-flash-thinking-exp:free',
        'microsoft/phi-3-mini-128k-instruct:free' 
    ];

    try {
        console.log("🏎️ Starting AI Race between:", RACERS.join(", "));
        const winner = await Promise.any(
            RACERS.map(modelId => this.callOpenRouterWithTimeout(modelId, prompt, apiKey, 8000))
        );
        console.log("🏆 Race Winner found!");
        return winner;
    } catch (aggregateError) {
        console.warn("⚠️ All racers failed or timed out. Switching to Sequential Fallback...", aggregateError);
    }

    // 2. Sequential Fallback (Slower but reliable)
    // Try Llama 3.3 (Heavy but reliable) explicitly if racers fail
    try {
        console.log("🐢 Trying Backup: meta-llama/llama-3.3-70b-instruct:free");
        return await this.callOpenRouter(
            'meta-llama/llama-3.3-70b-instruct:free', 
            prompt, 
            apiKey
        );
    } catch(e) {}

    console.warn("⚠️ Priority backups failed. Switch to Auto-Discovery Mode...");

    // 2. Fallback: Fetch ALL Free Models from OpenRouter (slower but safer)
    try {
        const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            const freeModels = modelsData.data
                .filter((m: any) => (m.id.includes(':free') || m.pricing?.prompt === '0') && !m.id.includes('experimental'))
                .sort((a: any, b: any) => (b.context_length || 0) - (a.context_length || 0)); // Sort by capability

            console.log(`📋 Found ${freeModels.length} fallback free models.`);

            for (const model of freeModels) {
                 // Skip if we already tried it in priority list
                 if (this.PREFERRED_MODELS.includes(model.id)) continue;

                 try {
                    console.log(`🔄 Trying Fallback Model: ${model.id}...`);
                    const result = await this.callOpenRouter(model.id, prompt, apiKey);
                    if (result) return result;
                 } catch (e) {
                    // Continue
                 }
            }
        }
    } catch (err) {
        console.error("Fallback discovery failed:", err);
    }

    throw new Error("All AI models (Priority & Fallback) failed. Please check backend logs.");
  }

  // Helper to standardise the call
  private async callOpenRouter(modelId: string, prompt: string, apiKey: string): Promise<any> {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://vocabulary-coach.app',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          })
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);
        
        const data = await response.json();
        let textResponse = data.choices[0].message.content;
        textResponse = textResponse.replace(/^```json/, '').replace(/```$/, '').trim();
        
        const result = JSON.parse(textResponse);

        // Extract Highlight [ ]
        if (result.context_translation && result.context_translation.includes('[')) {
            const match = result.context_translation.match(/\[(.*?)\]/);
            if (match) {
                result.context_highlight = match[1];
                result.context_translation = result.context_translation.replace(/\[/g, '').replace(/\]/g, '');
            }
        } else {
            result.context_highlight = result.meaning;
        }

        console.log(`✅ Success with ${modelId}`);
        return result;
  }

  private async callOpenRouterWithTimeout(modelId: string, prompt: string, apiKey: string, timeoutMs: number): Promise<any> {
      return new Promise(async (resolve, reject) => {
          const timer = setTimeout(() => {
              reject(new Error(`Timeout ${timeoutMs}ms for ${modelId}`));
          }, timeoutMs);

          try {
              const res = await this.callOpenRouter(modelId, prompt, apiKey);
              clearTimeout(timer);
              resolve(res);
          } catch (e) {
              clearTimeout(timer);
              reject(e);
          }
      });
  }



}