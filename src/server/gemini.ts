import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export async function generateExplainableGuidance(prompt: string, systemInstruction?: string): Promise<string> {
  const ai = getGeminiClient();
  const sysInst = systemInstruction || 
    'You are the CareerIQ AI Explainability & Career Coaching Agent. Provide precise, professional, evidence-grounded career insights based strictly on user data and occupational standards. Never fabricate statistics.';

  const modelsToAttempt = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of modelsToAttempt) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: sysInst,
          temperature: 0.7
        }
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} request failed, checking alternatives:`, err?.message || err);
      // Wait 300ms before next attempt
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return 'CareerIQ AI guidance is currently experiencing high traffic. Your profile data and analytical calculations remain fully functional and saved.';
}
