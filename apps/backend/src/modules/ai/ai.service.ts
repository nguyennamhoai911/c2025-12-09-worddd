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

    // DIRECT CALL: XIAOMI MIMO V2 FLASH
    const MODEL_ID = 'xiaomi/mimo-v2-flash'; 

    try {
        console.log(`🚀 AI Analyzing with: ${MODEL_ID}...`);
        return await this.callOpenRouter(MODEL_ID, prompt, apiKey);
    } catch (e) {
        console.error(`❌ Model ${MODEL_ID} failed:`, e.message);
        throw new BadRequestException(`AI Model (${MODEL_ID}) failed. Please try again later.`);
    }
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