import { UserProfile } from '../types/index.js';
import { getDatabase, logOrchestratorEvent } from './db.js';
import { generateExplainableGuidance } from './gemini.js';

export interface TransitionAnalysisResult {
  currentCareer: {
    code: string;
    title: string;
    datasetSource: string;
    description: string;
    totalSkillsCount: number;
    skillsSample: string[];
  };
  targetCareer: {
    code: string;
    title: string;
    datasetSource: string;
    description: string;
    totalSkillsCount: number;
    skillsSample: string[];
    salaryMedianUsd?: number;
    jobGrowthRate?: string;
  };
  transferableSkills: Array<{
    name: string;
    relevance: 'High Transferability' | 'Direct Match' | 'Complementary';
    applicationInTarget: string;
  }>;
  missingSkills: Array<{
    name: string;
    importance: 'critical' | 'high' | 'medium';
    difficultyToAcquire: 'Fast (1-2 weeks)' | 'Moderate (3-5 weeks)' | 'Significant (6+ weeks)';
    learningCategory: string;
  }>;
  transitionFeasibility: {
    score: number; // 0-100
    rating: 'Highly Feasible' | 'Moderate Pivot' | 'Substantial Pivot' | 'Long-Term Transformation';
    estimatedMonths: number;
    difficultyRating: 'Low' | 'Medium' | 'High';
    rationale: string;
  };
  stepByStepRoadmap: Array<{
    stepNumber: number;
    phaseTitle: string;
    timeline: string;
    milestoneGoal: string;
    keyActions: string[];
    deliverable: string;
  }>;
  aiStrategicPivotAdvice?: string;
  analyzedAt: string;
}

interface RawOccupation {
  id: string;
  code: string;
  title: string;
  dataset_source: string;
  description: string;
  skills_json: string;
  salary_median?: number;
  job_growth?: string;
}

export async function analyzeCareerTransition(
  profile: UserProfile,
  currentCareerQuery: string,
  targetCareerQuery: string
): Promise<TransitionAnalysisResult> {
  const db = await getDatabase();

  // 1. Resolve Current Career Occupation from SQLite
  const currentQuery = (currentCareerQuery || profile.currentCareer || 'Junior Developer').trim();
  const targetQuery = (targetCareerQuery || profile.targetCareer || 'Data Analyst').trim();

  const resolveOcc = (q: string): RawOccupation | null => {
    // 1. Try exact code or id
    let stmt = db.prepare(`
      SELECT id, code, title, dataset_source, description, skills_json, salary_median, job_growth
      FROM occupations
      WHERE code = :q OR id = :q
      LIMIT 1
    `);
    stmt.bind({ ':q': q });
    let result: RawOccupation | null = null;
    if (stmt.step()) {
      result = stmt.getAsObject() as unknown as RawOccupation;
    }
    stmt.free();
    if (result && result.skills_json && result.skills_json.length > 10) return result;

    // 2. Try title match with populated skills
    const words = q.split(/[\s/,]+/).filter(w => w.length >= 3);
    const w1 = words[0] || q;
    const w2 = words[1] || w1;

    stmt = db.prepare(`
      SELECT id, code, title, dataset_source, description, skills_json, salary_median, job_growth
      FROM occupations
      WHERE (title LIKE :exactLike OR (title LIKE :w1 AND title LIKE :w2) OR title LIKE :w1)
        AND length(skills_json) > 10
      ORDER BY 
        CASE WHEN title LIKE :exactQ THEN 1 ELSE 2 END,
        CASE WHEN dataset_source = 'O*NET 29.1' THEN 1 ELSE 2 END
      LIMIT 1
    `);
    stmt.bind({
      ':exactLike': `%${q}%`,
      ':exactQ': q,
      ':w1': `%${w1}%`,
      ':w2': `%${w2}%`
    });
    if (stmt.step()) {
      result = stmt.getAsObject() as unknown as RawOccupation;
    }
    stmt.free();
    return result;
  };

  let currentOcc = resolveOcc(currentQuery);
  if (!currentOcc) {
    // Fallback: search for first developer / software role with skills
    const fallbackStmt = db.prepare(`SELECT * FROM occupations WHERE (title LIKE '%Software%' OR title LIKE '%Developer%') AND length(skills_json) > 10 LIMIT 1`);
    if (fallbackStmt.step()) currentOcc = fallbackStmt.getAsObject() as unknown as RawOccupation;
    fallbackStmt.free();
  }

  let targetOcc = resolveOcc(targetQuery);
  if (!targetOcc) {
    // Fallback: search for data analyst with skills
    const fallbackStmt = db.prepare(`SELECT * FROM occupations WHERE (title LIKE '%Data Analyst%' OR title LIKE '%Data%') AND length(skills_json) > 10 LIMIT 1`);
    if (fallbackStmt.step()) targetOcc = fallbackStmt.getAsObject() as unknown as RawOccupation;
    fallbackStmt.free();
  }

  const currentSkills: string[] = currentOcc ? JSON.parse(currentOcc.skills_json || '[]') : [];
  const targetSkills: string[] = targetOcc ? JSON.parse(targetOcc.skills_json || '[]') : [];

  // Include candidate verified skills from their actual profile
  const userTechSkills = profile.technicalSkills || [];
  const userSoftSkills = profile.softSkills || [];
  const allCurrentSourceSkills = new Set([
    ...currentSkills.map(s => s.toLowerCase().trim()),
    ...userTechSkills.map(s => s.toLowerCase().trim()),
    ...userSoftSkills.map(s => s.toLowerCase().trim())
  ]);

  // 2. Identify Transferable Skills
  const transferableSkills: TransitionAnalysisResult['transferableSkills'] = [];
  const targetSkillsSet = new Set(targetSkills.map(s => s.toLowerCase().trim()));

  for (const tSkill of targetSkills) {
    const lower = tSkill.toLowerCase().trim();
    const isDirect = allCurrentSourceSkills.has(lower);
    const isPartial = !isDirect && Array.from(allCurrentSourceSkills).some(c => 
      (c.length > 3 && lower.includes(c)) || (lower.length > 3 && c.includes(lower))
    );

    if (isDirect) {
      transferableSkills.push({
        name: tSkill,
        relevance: 'Direct Match',
        applicationInTarget: `Direct transfer from ${currentOcc?.title || 'current skillset'} into ${targetOcc?.title || 'target role'}.`
      });
    } else if (isPartial) {
      transferableSkills.push({
        name: tSkill,
        relevance: 'High Transferability',
        applicationInTarget: `Strong conceptual overlap with your existing technical background.`
      });
    }
  }

  // If transferable list is empty or minimal, inject candidate's strongest verified skills that support target
  if (transferableSkills.length < 3) {
    for (const skill of userTechSkills.slice(0, 3)) {
      if (!transferableSkills.some(t => t.name.toLowerCase() === skill.toLowerCase())) {
        transferableSkills.push({
          name: skill,
          relevance: 'Complementary',
          applicationInTarget: `Proven technical asset from your profile accelerating computational and domain tasks.`
        });
      }
    }
  }

  // 3. Identify Missing Skills (Skills required in Target but absent from Current)
  const missingSkills: TransitionAnalysisResult['missingSkills'] = [];
  const transferableNames = new Set(transferableSkills.map(t => t.name.toLowerCase()));

  for (let i = 0; i < targetSkills.length; i++) {
    const skill = targetSkills[i];
    const lower = skill.toLowerCase().trim();

    if (!transferableNames.has(lower) && !allCurrentSourceSkills.has(lower)) {
      const importance = i < 3 ? 'critical' : i < 8 ? 'high' : 'medium';
      const difficulty = i < 2 ? 'Fast (1-2 weeks)' : i < 6 ? 'Moderate (3-5 weeks)' : 'Significant (6+ weeks)';
      
      let category = 'Domain Tooling';
      if (lower.includes('sql') || lower.includes('database') || lower.includes('data')) category = 'Data Management';
      else if (lower.includes('python') || lower.includes('programming') || lower.includes('code')) category = 'Software Engineering';
      else if (lower.includes('cloud') || lower.includes('aws') || lower.includes('azure')) category = 'Cloud Infrastructure';
      else if (lower.includes('analytics') || lower.includes('statistic') || lower.includes('model')) category = 'Quantitative & Analytical';
      
      missingSkills.push({
        name: skill,
        importance,
        difficultyToAcquire: difficulty,
        learningCategory: category
      });
    }
  }

  // 4. Calculate Transition Feasibility Score & Difficulty
  const totalTargetNeeded = Math.max(1, targetSkills.length);
  const transferRatio = transferableSkills.length / Math.min(10, totalTargetNeeded);
  const baselineFeasibility = Math.min(95, Math.max(25, Math.round(transferRatio * 70 + 20)));

  let rating: TransitionAnalysisResult['transitionFeasibility']['rating'] = 'Substantial Pivot';
  let difficulty: TransitionAnalysisResult['transitionFeasibility']['difficultyRating'] = 'High';
  let estimatedMonths = 6;

  if (baselineFeasibility >= 75) {
    rating = 'Highly Feasible';
    difficulty = 'Low';
    estimatedMonths = 2;
  } else if (baselineFeasibility >= 55) {
    rating = 'Moderate Pivot';
    difficulty = 'Medium';
    estimatedMonths = 4;
  } else if (baselineFeasibility >= 35) {
    rating = 'Substantial Pivot';
    difficulty = 'High';
    estimatedMonths = 6;
  } else {
    rating = 'Long-Term Transformation';
    difficulty = 'High';
    estimatedMonths = 9;
  }

  const rationale = `Found ${transferableSkills.length} transferable competencies between "${currentOcc?.title}" and "${targetOcc?.title}". Candidate must bridge ${missingSkills.length} specific occupational deficits, primarily in ${missingSkills.slice(0, 3).map(m => m.name).join(', ') || 'specialized tools'}.`;

  // 5. Construct 4-Phase Transition Bridge Roadmap
  const primaryDeficits = missingSkills.slice(0, 3).map(m => m.name);
  const secondaryDeficits = missingSkills.slice(3, 6).map(m => m.name);

  const stepByStepRoadmap: TransitionAnalysisResult['stepByStepRoadmap'] = [
    {
      stepNumber: 1,
      phaseTitle: 'Phase 1: Transferable Skill Audit & Foundational Setup',
      timeline: 'Weeks 1–3',
      milestoneGoal: `Inventory existing competencies in ${currentOcc?.title} and install core tooling for ${targetOcc?.title}.`,
      keyActions: [
        `Catalog existing strengths (${transferableSkills.slice(0, 3).map(t => t.name).join(', ') || 'Core Skills'}) that directly carry over`,
        `Set up target development environment, standard libraries, and version control repository`,
        `Audit day-to-day workflow differences between current role and ${targetOcc?.title}`
      ],
      deliverable: `Documented Skill Delta Matrix & configured local development environment`
    },
    {
      stepNumber: 2,
      phaseTitle: 'Phase 2: Core Occupational Deficit Acquisition',
      timeline: 'Weeks 4–8',
      milestoneGoal: `Acquire primary missing critical skills (${primaryDeficits.join(', ') || 'Core Competencies'}).`,
      keyActions: [
        `Complete structured documentation and exercises for ${primaryDeficits[0] || 'primary target skill'}`,
        `Build weekly mini-projects applying ${primaryDeficits.slice(0, 2).join(' and ') || 'target tools'}`,
        `Complete intermediate technical diagnostic test in CareerIQ with score >= 75%`
      ],
      deliverable: `3 functional mini-project repositories on GitHub demonstrating deficit mastery`
    },
    {
      stepNumber: 3,
      phaseTitle: 'Phase 3: Flagship Proof-of-Work & Industry Capstone',
      timeline: 'Weeks 9–12',
      milestoneGoal: `Construct a standout capstone bridging past experience with target ${targetOcc?.title} challenges.`,
      keyActions: [
        `Design a capstone combining ${transferableSkills[0]?.name || 'transferable skills'} with newly acquired ${primaryDeficits[0] || 'target tools'}`,
        `Implement end-to-end data/software pipeline with documentation, automated tests, and live deployment`,
        `Write a public engineering case study detailing architectural decisions and metrics`
      ],
      deliverable: `Production-ready GitHub repository with interactive demo and technical blog post`
    },
    {
      stepNumber: 4,
      phaseTitle: 'Phase 4: Candidate Positioning, Resume Reframing & Job Launch',
      timeline: 'Weeks 13–16',
      milestoneGoal: `Pivot resume, LinkedIn, and interview messaging to showcase proven readiness as a ${targetOcc?.title}.`,
      keyActions: [
        `Reframe existing ${currentOcc?.title} experience to highlight transferable analytical & problem-solving outcomes`,
        `Feature the flagship capstone prominently at the top of the technical portfolio`,
        `Practice STAR behavioral stories emphasizing adaptability, fast skill acquisition, and domain knowledge`
      ],
      deliverable: `Tailored ATS-optimized resume, refreshed portfolio, and targeted application pipeline`
    }
  ];

  // 6. Optional Gemini Strategic Pivot Advice
  let aiStrategicPivotAdvice: string | undefined = undefined;
  try {
    const prompt = `Candidate is transitioning from: "${currentOcc?.title}" to: "${targetOcc?.title}".
Candidate Background: ${profile.headline}.
Transferable Skills: ${transferableSkills.map(t => t.name).join(', ')}.
Key Missing Deficits: ${missingSkills.slice(0, 5).map(m => m.name).join(', ')}.
Feasibility: ${rating} (${baselineFeasibility}% feasibility).

Provide 3 crisp strategic transition principles:
1. "The Bridge Story": How to narrate this transition to recruiters so it sounds like a natural, intentional career evolution rather than a random jump.
2. "The De-risking Strategy": What single proof-of-work project will immediately convince a hiring manager they won't need to train you from scratch.
3. "Common Pitfall to Avoid": The #1 mistake candidates make when moving from ${currentOcc?.title} to ${targetOcc?.title}.`;

    aiStrategicPivotAdvice = await generateExplainableGuidance(
      prompt,
      'You are the CareerIQ AI Career Transition Strategist. Ground your advice in hiring realities and occupational data.'
    );
  } catch (err) {
    console.warn('Gemini transition advice fallback:', err);
    aiStrategicPivotAdvice = `Your transition from ${currentOcc?.title} to ${targetOcc?.title} leverages valuable transferable skills in ${transferableSkills.slice(0, 3).map(t => t.name).join(', ')}. Frame your background as a multi-disciplinary advantage that brings fresh problem-solving perspectives to ${targetOcc?.title} teams.`;
  }

  logOrchestratorEvent('CareerTransitionAgent', 'TRANSITION_ANALYZED', {
    userId: profile.id,
    currentRole: currentOcc?.title,
    targetRole: targetOcc?.title,
    transferableCount: transferableSkills.length,
    missingCount: missingSkills.length,
    feasibilityScore: baselineFeasibility
  });

  return {
    currentCareer: {
      code: currentOcc?.code || 'SOC-CURRENT',
      title: currentOcc?.title || currentQuery,
      datasetSource: currentOcc?.dataset_source || 'O*NET 29.1',
      description: currentOcc?.description || 'Current candidate baseline occupational background.',
      totalSkillsCount: currentSkills.length,
      skillsSample: currentSkills.slice(0, 8)
    },
    targetCareer: {
      code: targetOcc?.code || 'SOC-TARGET',
      title: targetOcc?.title || targetQuery,
      datasetSource: targetOcc?.dataset_source || 'O*NET 29.1',
      description: targetOcc?.description || 'Target occupational standard.',
      totalSkillsCount: targetSkills.length,
      skillsSample: targetSkills.slice(0, 8),
      salaryMedianUsd: targetOcc?.salary_median || 88500,
      jobGrowthRate: targetOcc?.job_growth || 'Faster than average'
    },
    transferableSkills,
    missingSkills,
    transitionFeasibility: {
      score: baselineFeasibility,
      rating,
      estimatedMonths,
      difficultyRating: difficulty,
      rationale
    },
    stepByStepRoadmap,
    aiStrategicPivotAdvice,
    analyzedAt: new Date().toISOString()
  };
}
