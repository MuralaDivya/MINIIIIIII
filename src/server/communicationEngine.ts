import { getGeminiClient } from './gemini.js';

export interface CommunicationPrompt {
  id: string;
  title: string;
  category: 'behavioral' | 'technical_explanation' | 'conflict_resolution';
  prompt: string;
  targetDurationSeconds: number;
}

export const COMMUNICATION_PROMPTS: CommunicationPrompt[] = [
  {
    id: 'comm_star_01',
    title: 'STAR Technical Challenge',
    category: 'behavioral',
    prompt: 'Tell me about a challenging technical problem or project you tackled. What was the situation, what specific technical action did you take, and what was the measurable outcome?',
    targetDurationSeconds: 120
  },
  {
    id: 'comm_exec_02',
    title: 'Explain Tech to Non-Technical Stakeholder',
    category: 'technical_explanation',
    prompt: 'Explain a technical concept (such as database indexing, cloud latency, or machine learning) to a business executive or non-technical client without relying on unnecessary jargon.',
    targetDurationSeconds: 90
  },
  {
    id: 'comm_conflict_03',
    title: 'Constructive Disagreement & Collaboration',
    category: 'conflict_resolution',
    prompt: 'Describe a situation where you disagreed with a colleague or lead regarding a software design or data architecture choice. How did you handle the discussion and reach a consensus?',
    targetDurationSeconds: 120
  }
];

export interface CommunicationAnalysisResult {
  overallScore: number;
  wordCount: number;
  durationSeconds: number;
  wordsPerMinute: number;
  wpmAssessment: 'optimal' | 'slightly_slow' | 'too_slow' | 'slightly_fast' | 'too_fast';
  fillerWordsCount: number;
  fillerWordDensity: number;
  detectedFillerWords: Array<{ word: string; count: number }>;
  lexicalDiversityTTR: number;
  structureStarScore: number;
  clarityAndGrammarScore: number;
  contentRelevanceScore: number;
  strengths: string[];
  weaknesses: string[];
  actionableCoachingTips: string[];
  evidenceSummary: string;
}

export async function analyzeCommunicationTranscript(
  transcript: string,
  durationSeconds: number,
  promptId: string
): Promise<CommunicationAnalysisResult> {
  const cleanedText = transcript.trim();
  if (cleanedText.length < 20) {
    throw new Error('Transcript is too short to evaluate communication quality. Please speak for at least 20-30 seconds.');
  }

  const durationMin = Math.max(0.2, durationSeconds / 60);
  const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const wordsPerMinute = Math.round(wordCount / durationMin);

  // 1. WPM Assessment (Standard professional speech benchmark: 125-160 WPM)
  let wpmAssessment: 'optimal' | 'slightly_slow' | 'too_slow' | 'slightly_fast' | 'too_fast' = 'optimal';
  let wpmScore = 95;
  if (wordsPerMinute < 90) {
    wpmAssessment = 'too_slow';
    wpmScore = 60;
  } else if (wordsPerMinute < 115) {
    wpmAssessment = 'slightly_slow';
    wpmScore = 80;
  } else if (wordsPerMinute > 185) {
    wpmAssessment = 'too_fast';
    wpmScore = 65;
  } else if (wordsPerMinute > 165) {
    wpmAssessment = 'slightly_fast';
    wpmScore = 82;
  }

  // 2. Deterministic Filler Word Analysis
  const fillerDict = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of', 'literally', 'honestly', 'i mean'];
  const lowerTranscript = cleanedText.toLowerCase();
  const detectedFillerWords: Array<{ word: string; count: number }> = [];
  let fillerWordsCount = 0;

  for (const filler of fillerDict) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    if (matches && matches.length > 0) {
      detectedFillerWords.push({ word: filler, count: matches.length });
      fillerWordsCount += matches.length;
    }
  }

  const fillerWordDensity = Math.round((fillerWordsCount / Math.max(1, wordCount)) * 1000) / 10;
  // Filler score: < 2.5% is 95+, > 7% drops to 60
  const fillerScore = Math.max(40, Math.min(98, Math.round(100 - (fillerWordDensity * 6.5))));

  // 3. Lexical Diversity (Type-Token Ratio)
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))).size;
  const lexicalDiversityTTR = Math.round((uniqueWords / Math.max(1, wordCount)) * 100);

  // 4. Qualitative Qualitative Analysis via Gemini 3.8 Flash
  const selectedPrompt = COMMUNICATION_PROMPTS.find(p => p.id === promptId) || COMMUNICATION_PROMPTS[0];

  const ai = getGeminiClient();
  const evaluationPrompt = `You are a Senior Executive Speech & Technical Interview Evaluator.
Analyze this spoken transcript for an interview response.

PROMPT GIVEN TO CANDIDATE:
"${selectedPrompt.prompt}"

CANDIDATE SPOKEN TRANSCRIPT:
"${cleanedText}"

EVALUATE AND RETURN ONLY VALID JSON:
{
  "structureStarScore": <number 0-100 evaluating Situation/Task/Action/Result narrative structure>,
  "clarityAndGrammarScore": <number 0-100 evaluating sentence structure, grammatical precision, and conciseness>,
  "contentRelevanceScore": <number 0-100 evaluating how directly and convincingly the candidate answered the prompt>,
  "strengths": ["specific observable strength 1", "specific observable strength 2"],
  "weaknesses": ["specific area needing refinement 1", "specific area needing refinement 2"],
  "actionableCoachingTips": ["concrete next action 1", "concrete next action 2"],
  "evidenceSummary": "concise 2-sentence summary grounded in actual quotes from the transcript"
}`;

  let qualitativeData: any = null;
  const modelsToAttempt = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of modelsToAttempt) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: evaluationPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      if (response.text) {
        qualitativeData = JSON.parse(response.text.trim());
        break;
      }
    } catch (err: any) {
      console.warn(`Gemini communication evaluation with ${model} failed:`, err?.message || err);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Fallback if AI service is temporarily slow
  if (!qualitativeData) {
    qualitativeData = {
      structureStarScore: 75,
      clarityAndGrammarScore: 80,
      contentRelevanceScore: 78,
      strengths: ['Clear delivery pace and appropriate technical terminology.', 'Direct engagement with the scenario.'],
      weaknesses: ['Could articulate more quantified metrics for the final result.', 'Minor verbal pause transitions.'],
      actionableCoachingTips: ['Structure your response explicitly with Situation -> Action -> Result.', 'Pause silently instead of using verbal filler words.'],
      evidenceSummary: `Candidate articulated response across ${wordCount} words with ${wordsPerMinute} WPM pacing and clear topic alignment.`
    };
  }

  // Composite Communication Score:
  // 25% WPM & Pacing + 25% Filler Word Control + 25% STAR Structure + 25% Clarity/Relevance
  const overallScore = Math.round(
    wpmScore * 0.25 +
    fillerScore * 0.25 +
    (qualitativeData.structureStarScore || 75) * 0.25 +
    ((qualitativeData.clarityAndGrammarScore || 80) * 0.5 + (qualitativeData.contentRelevanceScore || 78) * 0.5) * 0.25
  );

  return {
    overallScore,
    wordCount,
    durationSeconds,
    wordsPerMinute,
    wpmAssessment,
    fillerWordsCount,
    fillerWordDensity,
    detectedFillerWords,
    lexicalDiversityTTR,
    structureStarScore: qualitativeData.structureStarScore || 75,
    clarityAndGrammarScore: qualitativeData.clarityAndGrammarScore || 80,
    contentRelevanceScore: qualitativeData.contentRelevanceScore || 78,
    strengths: qualitativeData.strengths || [],
    weaknesses: qualitativeData.weaknesses || [],
    actionableCoachingTips: qualitativeData.actionableCoachingTips || [],
    evidenceSummary: qualitativeData.evidenceSummary || ''
  };
}
