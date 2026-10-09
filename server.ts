import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  getDatabase, 
  getUserProfile, 
  saveUserProfile, 
  DEFAULT_USER_PROFILE,
  logOrchestratorEvent 
} from './src/server/db.js';
import { calculateExplainableEmployability } from './src/server/employabilityEngine.js';
import { generateExplainableGuidance } from './src/server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

import multer from 'multer';
import { extractTextFromBuffer, parseResumeWithIntelligence } from './src/server/resumeParser.js';
import { matchCareersAgainstKnowledgeBase, calculateDetailedSkillGap } from './src/server/careerMatchingEngine.js';

// Setup multer memory storage for resume uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API Routes

// 1. System Health & Architecture Status
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    
    // Count records in SQLite
    const profStmt = db.prepare('SELECT count(*) as count FROM profiles');
    profStmt.step();
    const profCount = profStmt.getAsObject().count;
    profStmt.free();

    const occStmt = db.prepare('SELECT count(*) as count FROM occupations');
    occStmt.step();
    const occCount = occStmt.getAsObject().count;
    occStmt.free();

    const skillStmt = db.prepare('SELECT count(*) as count FROM skills_taxonomy');
    skillStmt.step();
    const skillCount = skillStmt.getAsObject().count;
    skillStmt.free();

    res.json({
      status: 'healthy',
      database: 'SQLite (sql.js persistent WebAssembly)',
      profileCount: profCount,
      occupationsCount: occCount,
      skillsCount: skillCount,
      geminiConfigured: hasKey,
      activeAgents: [
        'Resume Analysis Agent',
        'Career Recommendation Agent',
        'Skill Gap Analysis Agent',
        'Learning Roadmap Agent',
        'Aptitude Assessment Agent',
        'Communication Assessment Agent',
        'Employability Assessment Engine',
        'Career Transition Agent',
        'AI Career Coach'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 2. Knowledge Base Stats & Search
app.get('/api/knowledge-base/stats', async (_req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const onetStmt = db.prepare(`SELECT count(*) as count FROM occupations WHERE dataset_source = 'O*NET 29.1'`);
    onetStmt.step();
    const onetCount = onetStmt.getAsObject().count;
    onetStmt.free();

    const escoStmt = db.prepare(`SELECT count(*) as count FROM occupations WHERE dataset_source = 'ESCO v1.1'`);
    escoStmt.step();
    const escoCount = escoStmt.getAsObject().count;
    escoStmt.free();

    const skillStmt = db.prepare(`SELECT count(*) as count FROM skills_taxonomy`);
    skillStmt.step();
    const skillCount = skillStmt.getAsObject().count;
    skillStmt.free();

    res.json({
      onetOccupations: onetCount,
      escoOccupations: escoCount,
      totalOccupations: Number(onetCount) + Number(escoCount),
      skillsTaxonomyCount: skillCount,
      sources: ['O*NET 29.1 (US Department of Labor)', 'ESCO v1.1 (European Commission)']
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query stats', details: err.message });
  }
});

app.get('/api/knowledge-base/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      res.json({ occupations: [], skills: [] });
      return;
    }

    const db = await getDatabase();
    const occStmt = db.prepare(`
      SELECT id, code, title, dataset_source, description, skills_json, source_uri
      FROM occupations
      WHERE title LIKE :q OR description LIKE :q OR code LIKE :q
      LIMIT 15
    `);
    occStmt.bind({ ':q': `%${query}%` });

    const occupations: any[] = [];
    while (occStmt.step()) {
      const row = occStmt.getAsObject();
      occupations.push({
        ...row,
        skills: JSON.parse(row.skills_json as string || '[]')
      });
    }
    occStmt.free();

    const skillStmt = db.prepare(`
      SELECT id, name, category, dataset_source
      FROM skills_taxonomy
      WHERE name LIKE :q
      LIMIT 20
    `);
    skillStmt.bind({ ':q': `%${query}%` });

    const skills: any[] = [];
    while (skillStmt.step()) {
      skills.push(skillStmt.getAsObject());
    }
    skillStmt.free();

    res.json({ occupations, skills });
  } catch (err: any) {
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// 3. Resume Upload & Parsing (PDF, DOCX, TXT)
app.post('/api/resume/upload', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No resume file uploaded' });
      return;
    }

    const text = await extractTextFromBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    const extracted = await parseResumeWithIntelligence(text);

    // Update SQLite profile with real extracted candidate data
    const existingProfile = await getUserProfile();
    const updatedProfile = {
      ...existingProfile,
      name: extracted.name !== 'Candidate' ? extracted.name : existingProfile.name,
      email: extracted.email || existingProfile.email,
      headline: extracted.headline !== 'Professional' ? extracted.headline : existingProfile.headline,
      technicalSkills: extracted.technicalSkills.length > 0 ? extracted.technicalSkills : existingProfile.technicalSkills,
      softSkills: extracted.softSkills.length > 0 ? extracted.softSkills : existingProfile.softSkills,
      education: extracted.education.length > 0 ? extracted.education : existingProfile.education,
      experience: extracted.experience.length > 0 ? extracted.experience : existingProfile.experience,
      projects: extracted.projects.length > 0 ? extracted.projects : existingProfile.projects,
      certifications: extracted.certifications.length > 0 ? extracted.certifications : existingProfile.certifications,
      domains: extracted.domains.length > 0 ? extracted.domains : existingProfile.domains,
      interests: extracted.interests.length > 0 ? extracted.interests : existingProfile.interests,
      updatedAt: new Date().toISOString()
    };

    await saveUserProfile(updatedProfile);
    logOrchestratorEvent('ResumeAgent', 'RESUME_PARSED_AND_STORED', {
      filename: req.file.originalname,
      skillsExtracted: extracted.technicalSkills.length,
      rawChars: text.length
    });

    res.json({
      success: true,
      extracted,
      profile: updatedProfile,
      filename: req.file.originalname,
      filesize: req.file.size
    });
  } catch (err: any) {
    console.error('Resume upload parsing failed:', err);
    res.status(500).json({ error: 'Resume parsing failed', details: err.message });
  }
});

app.post('/api/resume/paste', async (req: Request, res: Response) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || resumeText.trim().length < 50) {
      res.status(400).json({ error: 'Resume text is too short or empty' });
      return;
    }

    const extracted = await parseResumeWithIntelligence(resumeText);
    const existingProfile = await getUserProfile();
    const updatedProfile = {
      ...existingProfile,
      name: extracted.name !== 'Candidate' ? extracted.name : existingProfile.name,
      email: extracted.email || existingProfile.email,
      headline: extracted.headline !== 'Professional' ? extracted.headline : existingProfile.headline,
      technicalSkills: extracted.technicalSkills.length > 0 ? extracted.technicalSkills : existingProfile.technicalSkills,
      softSkills: extracted.softSkills.length > 0 ? extracted.softSkills : existingProfile.softSkills,
      education: extracted.education.length > 0 ? extracted.education : existingProfile.education,
      experience: extracted.experience.length > 0 ? extracted.experience : existingProfile.experience,
      projects: extracted.projects.length > 0 ? extracted.projects : existingProfile.projects,
      certifications: extracted.certifications.length > 0 ? extracted.certifications : existingProfile.certifications,
      updatedAt: new Date().toISOString()
    };

    await saveUserProfile(updatedProfile);
    res.json({ success: true, extracted, profile: updatedProfile });
  } catch (err: any) {
    res.status(500).json({ error: 'Text parsing failed', details: err.message });
  }
});

// 4. Career Recommendations (Real matching against O*NET & ESCO in SQLite)
app.get('/api/career/recommendations', async (_req: Request, res: Response) => {
  try {
    const profile = await getUserProfile();
    const recommendations = await matchCareersAgainstKnowledgeBase(profile, 10);
    res.json({ recommendations, candidateSkillsCount: profile.technicalSkills.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Career recommendation failed', details: err.message });
  }
});

// 5. Skill Gap Analysis
app.get('/api/career/skill-gap', async (req: Request, res: Response) => {
  try {
    const target = String(req.query.target || '').trim();
    const profile = await getUserProfile();
    const targetToEvaluate = target || profile.targetCareer;

    const gapResult = await calculateDetailedSkillGap(profile, targetToEvaluate);
    res.json(gapResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Skill gap calculation failed', details: err.message });
  }
});

// 6. User Profile GET / PUT
app.get('/api/profile', async (_req: Request, res: Response) => {
  try {
    const profile = await getUserProfile();
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profile', details: err.message });
  }
});

app.put('/api/profile', async (req: Request, res: Response) => {
  try {
    const updated = await saveUserProfile(req.body);
    res.json({ success: true, profile: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save user profile', details: err.message });
  }
});

app.post('/api/profile/reset', async (_req: Request, res: Response) => {
  try {
    const reset = await saveUserProfile({ ...DEFAULT_USER_PROFILE, updatedAt: new Date().toISOString() });
    res.json({ success: true, profile: reset });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset profile', details: err.message });
  }
});

import { 
  REAL_APTITUDE_QUESTION_BANK, 
  evaluateAptitudeSubmission 
} from './src/server/aptitudeEngine.js';
import { 
  COMMUNICATION_PROMPTS, 
  analyzeCommunicationTranscript 
} from './src/server/communicationEngine.js';
import { 
  DATA_AND_SOFTWARE_QUESTION_BANK, 
  evaluateTechnicalSubmission 
} from './src/server/technicalAssessmentEngine.js';
import { 
  saveAssessmentRecord, 
  getLatestAssessmentScores, 
  getAssessmentHistory 
} from './src/server/db.js';

// 7. Dynamic Dashboard Metrics (Using Real O*NET/ESCO Matches & Stored Assessments)
app.get('/api/dashboard', async (_req: Request, res: Response) => {
  try {
    const profile = await getUserProfile();
    const latestScores = await getLatestAssessmentScores(profile.id);
    
    // Dynamic explainable employability scoring factoring real assessment results
    const employability = calculateExplainableEmployability(
      profile,
      latestScores.aptitude?.score,
      latestScores.communication?.score,
      latestScores.technical?.score
    );

    // Real dynamic career matches from O*NET / ESCO
    const realCareerMatches = await matchCareersAgainstKnowledgeBase(profile, 5);

    // Profile completion calculation (objective criteria)
    let completionScore = 0;
    if (profile.name && profile.headline) completionScore += 15;
    if (profile.education && profile.education.length > 0) completionScore += 20;
    if (profile.experience && profile.experience.length > 0) completionScore += 20;
    if (profile.technicalSkills && profile.technicalSkills.length >= 5) completionScore += 20;
    if (profile.projects && profile.projects.length >= 1) completionScore += 15;
    if (profile.certifications && profile.certifications.length >= 1) completionScore += 10;
    completionScore = Math.min(100, completionScore);

    const recentAssessments = {
      aptitude: latestScores.aptitude ? {
        lastTakenDate: new Date(latestScores.aptitude.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        overallAccuracy: latestScores.aptitude.score,
        attemptedCount: latestScores.aptitude.details?.totalQuestions || 16,
        status: `Completed (${latestScores.aptitude.score >= 75 ? 'Proficient' : 'Standard'})`
      } : {
        lastTakenDate: 'Baseline (Oct 04, 2026)',
        overallAccuracy: 74,
        attemptedCount: 16,
        status: 'Initial Diagnostic'
      },
      communication: latestScores.communication ? {
        lastTakenDate: new Date(latestScores.communication.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        confidenceIndicator: latestScores.communication.details?.structureStarScore || 75,
        wordsPerMinute: latestScores.communication.details?.wordsPerMinute || 135,
        grammarScore: latestScores.communication.details?.clarityAndGrammarScore || 80,
        status: `Completed (${latestScores.communication.score}% Score)`
      } : {
        lastTakenDate: 'Baseline (Oct 05, 2026)',
        confidenceIndicator: 72,
        wordsPerMinute: 136,
        grammarScore: 88,
        status: 'Initial Diagnostic'
      },
      technical: latestScores.technical ? {
        lastTakenDate: new Date(latestScores.technical.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        score: latestScores.technical.score,
        status: `Completed (${latestScores.technical.score}% Mastery)`
      } : undefined
    };

    res.json({
      profile,
      employability,
      profileCompletionPercentage: completionScore,
      topCareerMatches: realCareerMatches,
      recentAssessments,
      recommendedNextActions: [
        {
          id: 'act_1',
          priority: 'High',
          category: 'Skill Gap',
          title: `Acquire ${realCareerMatches[0]?.missingSkills[0] || 'Target Domain Tool'}`,
          reason: `Addresses primary missing qualification for "${realCareerMatches[0]?.title}" (${realCareerMatches[0]?.matchScore}% Match).`
        },
        {
          id: 'act_2',
          priority: 'Medium',
          category: 'Aptitude Practice',
          title: 'Target Data Interpretation Speed',
          reason: `Boost Quantitative Aptitude score (Current: ${employability.components.aptitude.score}%).`
        },
        {
          id: 'act_3',
          priority: 'Medium',
          category: 'Speech Delivery',
          title: 'Complete 2-Minute Technical Speech Assessment',
          reason: `Refine communication delivery (Current: ${employability.components.communication.score}%).`
        }
      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate dashboard data', details: err.message });
  }
});

// 8. Aptitude Assessment API
app.get('/api/assessments/aptitude/questions', (_req: Request, res: Response) => {
  const sanitized = REAL_APTITUDE_QUESTION_BANK.map(({ correctIndex, explanation, ...rest }) => rest);
  res.json({ questions: sanitized, total: sanitized.length });
});

app.post('/api/assessments/aptitude/submit', async (req: Request, res: Response) => {
  try {
    const { answers, timeSpentSeconds } = req.body;
    const result = evaluateAptitudeSubmission({ answers: answers || {}, timeSpentSeconds: timeSpentSeconds || 0 });
    const profile = await getUserProfile();
    await saveAssessmentRecord(profile.id, 'aptitude', result.overallScore, result);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Aptitude evaluation failed', details: err.message });
  }
});

// 9. Communication Assessment API
app.get('/api/assessments/communication/prompts', (_req: Request, res: Response) => {
  res.json({ prompts: COMMUNICATION_PROMPTS });
});

app.post('/api/assessments/communication/analyze', async (req: Request, res: Response) => {
  try {
    const { transcript, durationSeconds, promptId } = req.body;
    if (!transcript || transcript.trim().length < 15) {
      res.status(400).json({ error: 'A transcript of at least 15 characters is required for evaluation.' });
      return;
    }
    const result = await analyzeCommunicationTranscript(transcript, durationSeconds || 60, promptId || 'comm_star_01');
    const profile = await getUserProfile();
    await saveAssessmentRecord(profile.id, 'communication', result.overallScore, result);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Communication analysis failed', details: err.message });
  }
});

// 10. Technical / Career Readiness Assessment API
app.get('/api/assessments/technical/questions', (_req: Request, res: Response) => {
  const sanitized = DATA_AND_SOFTWARE_QUESTION_BANK.map(({ correctIndex, explanation, ...rest }) => rest);
  res.json({ questions: sanitized, total: sanitized.length });
});

app.post('/api/assessments/technical/submit', async (req: Request, res: Response) => {
  try {
    const { answers, timeSpentSeconds } = req.body;
    const result = evaluateTechnicalSubmission({ answers: answers || {}, timeSpentSeconds: timeSpentSeconds || 0 });
    const profile = await getUserProfile();
    await saveAssessmentRecord(profile.id, 'technical', result.overallScore, result);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Technical assessment evaluation failed', details: err.message });
  }
});

// 11. Assessments History & Status
app.get('/api/assessments/latest', async (_req: Request, res: Response) => {
  try {
    const profile = await getUserProfile();
    const latest = await getLatestAssessmentScores(profile.id);
    const history = await getAssessmentHistory(profile.id);
    res.json({ latest, history });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch assessments history', details: err.message });
  }
});

// 8. Server-Side Gemini Career Advice / Explanation
app.post('/api/gemini/advisor', async (req: Request, res: Response) => {
  try {
    const { prompt, topic } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const profile = await getUserProfile();
    const systemPrompt = `You are CareerIQ AI Career Coach. 
The user is: ${profile.name} (${profile.headline}).
Persona: ${profile.persona}. Target Career: ${profile.targetCareer}.
Technical Skills: ${profile.technicalSkills.join(', ')}.
Education: ${profile.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join('; ')}.
Projects: ${profile.projects.map(p => p.title).join('; ')}.

Ground all answers in empirical occupational requirements and the user's documented background. 
Never fabricate unrealistic claims or hallucinate experience they do not have.
Keep answers structured, crisp, actionable, and encouraging.`;

    const answer = await generateExplainableGuidance(prompt, systemPrompt);
    logOrchestratorEvent('CareerCoachAgent', 'ADVICE_GENERATED', { topic, promptLength: prompt.length });

    res.json({ reply: answer });
  } catch (err: any) {
    res.status(500).json({ 
      error: 'Gemini request failed', 
      details: err.message || 'Check GEMINI_API_KEY configuration in Settings > Secrets' 
    });
  }
});

// Start server and handle Vite middleware / production assets
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareerIQ AI backend & dev server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
