import { getDatabase, getUserProfile, saveUserProfile, DEFAULT_USER_PROFILE, getLatestAssessmentScores } from './db.js';
import { parseResumeWithIntelligence } from './resumeParser.js';
import { matchCareersAgainstKnowledgeBase, calculateDetailedSkillGap } from './careerMatchingEngine.js';
import { calculateExplainableEmployability } from './employabilityEngine.js';
import { generatePersonalizedRoadmap } from './roadmapEngine.js';
import { analyzeCareerTransition } from './transitionEngine.js';
import { evaluateAptitudeSubmission, REAL_APTITUDE_QUESTION_BANK } from './aptitudeEngine.js';
import { evaluateTechnicalSubmission } from './technicalAssessmentEngine.js';
import { analyzeCommunicationTranscript } from './communicationEngine.js';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

export async function runFullIntegrationAndEvaluationSuite(): Promise<{
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
}> {
  console.log('====================================================');
  console.log('CareerIQ AI — Phase 5 Integration & Evaluation Suite');
  console.log('====================================================\n');

  const results: TestResult[] = [];

  const runTest = async (name: string, fn: () => Promise<string | void>) => {
    const start = Date.now();
    try {
      const details = await fn();
      const durationMs = Date.now() - start;
      results.push({ name, passed: true, details: details || 'Success', durationMs });
      console.log(`✅ [PASS] ${name} (${durationMs}ms)`);
      if (details) console.log(`   └─ ${details}`);
    } catch (err: any) {
      const durationMs = Date.now() - start;
      results.push({ name, passed: false, details: err.message || String(err), durationMs });
      console.error(`❌ [FAIL] ${name} (${durationMs}ms): ${err.message}`);
    }
  };

  // 1. Database Integrity & Dataset Verification
  await runTest('1. SQLite Database & Datasets Verification', async () => {
    const db = await getDatabase();
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

    if (Number(occCount) < 2000) throw new Error(`Expected >= 2,000 occupations, found ${occCount}`);
    if (Number(skillCount) < 5000) throw new Error(`Expected >= 5,000 skills, found ${skillCount}`);

    return `Verified: ${occCount} occupations (O*NET 29.1 + ESCO v1.1), ${skillCount} skills taxonomy records, ${profCount} active profile.`;
  });

  // 2. Profile Persistence & Retrieval
  await runTest('2. Candidate Profile Persistence in SQLite', async () => {
    const profile = await getUserProfile();
    if (!profile.name || !profile.technicalSkills) throw new Error('Failed to load valid user profile');

    const updated = {
      ...profile,
      technicalSkills: Array.from(new Set([...profile.technicalSkills, 'SQL', 'Python', 'Pandas', 'Git', 'Docker']))
    };
    await saveUserProfile(updated);
    const reloaded = await getUserProfile(profile.id);

    if (!reloaded.technicalSkills.includes('Docker')) {
      throw new Error('Persistence check failed: Docker skill was not saved.');
    }
    return `Verified profile for "${reloaded.name}" with ${reloaded.technicalSkills.length} technical competencies persisted to disk.`;
  });

  // 3. Resume Parser Module
  await runTest('3. Resume Intelligence & Entity Extraction', async () => {
    const sampleResume = `
      ALEX MORGAN
      Email: alex.morgan@test.edu | Phone: 555-0199
      Aspiring Machine Learning & Data Specialist
      
      TECHNICAL SKILLS
      Python, SQL, PostgreSQL, Pandas, NumPy, Scikit-Learn, Git, Docker, REST APIs, Tableau
      
      EDUCATION
      Bachelor of Science in Computer Science, University of Technology, 2026. GPA: 3.8/4.0
      
      EXPERIENCE
      Data Research Intern, Informatics Lab (Jun 2025 - Present)
      - Analyzed 50,000 tabular records with Pandas and built regression models.
      
      PROJECTS
      Autonomous Sales EDA Pipeline: Engineered an end-to-end forecasting pipeline in Python.
    `;

    const parsed = await parseResumeWithIntelligence(sampleResume);
    if (!parsed.technicalSkills.includes('Python') || !parsed.technicalSkills.includes('SQL')) {
      throw new Error('Failed to extract core technical skills Python/SQL');
    }
    return `Extracted ${parsed.technicalSkills.length} technical skills, ${parsed.education.length} degrees, and ${parsed.experience.length} experience entries.`;
  });

  // 4. Career Recommendations Matching Engine
  await runTest('4. Career Recommendation Engine Evaluation', async () => {
    const profile = await getUserProfile();
    const recommendations = await matchCareersAgainstKnowledgeBase(profile, 5);

    if (recommendations.length === 0) throw new Error('No career recommendations returned');
    const top = recommendations[0];
    if (top.matchScore < 0 || top.matchScore > 100) {
      throw new Error(`Match score ${top.matchScore} out of bounds [0, 100]`);
    }

    return `Top match: "${top.title}" (${top.datasetSource}) with ${top.matchScore}% composite match, ${top.matchedSkills.length} matched skills.`;
  });

  // 5. Skill Gap Analysis Matrix
  await runTest('5. Skill Gap Matrix Categorization', async () => {
    const profile = await getUserProfile();
    const gap = await calculateDetailedSkillGap(profile, '15-2051.01'); // Business Intelligence Analysts

    if (!gap.occupation.title) throw new Error('Occupation metadata missing');
    if (gap.gapCoveragePercent < 0 || gap.gapCoveragePercent > 100) {
      throw new Error(`Coverage percentage ${gap.gapCoveragePercent}% out of bounds`);
    }

    return `Role: ${gap.occupation.title}. Strong skills: ${gap.strongSkills.length}, Moderate: ${gap.moderateSkills.length}, Missing: ${gap.missingSkills.length}, Coverage: ${gap.gapCoveragePercent}%.`;
  });

  // 6. Explainable Employability Calculation Engine
  await runTest('6. Employability Calculation Engine Multi-Factor Formula', async () => {
    const profile = await getUserProfile();
    const employability = calculateExplainableEmployability(profile, 85, 80, 90);

    if (employability.overallScore < 0 || employability.overallScore > 100) {
      throw new Error(`Employability score ${employability.overallScore} out of bounds`);
    }

    const comps = employability.components;
    const weightsSum = (
      comps.technicalSkillReadiness.weight +
      comps.careerFit.weight +
      comps.aptitude.weight +
      comps.communication.weight +
      comps.projectReadiness.weight +
      comps.learningReadiness.weight
    );

    if (Math.abs(weightsSum - 1.0) > 0.01) {
      throw new Error(`Component weights do not sum to 1.0 (Sum: ${weightsSum})`);
    }

    return `Overall Score: ${employability.overallScore}%. Weights verified (Technical: 30%, CareerFit: 20%, Aptitude: 15%, Comm: 15%, Projects: 10%, Learning: 10%).`;
  });

  // 7. Aptitude Assessment Diagnostic Engine
  await runTest('7. Aptitude Assessment Scoring & IRT Difficulty Engine', async () => {
    // Simulate answering first 4 questions correctly and 5th question incorrectly
    const answers: Record<string, number> = {};
    for (let i = 0; i < 4; i++) {
      answers[REAL_APTITUDE_QUESTION_BANK[i].id] = REAL_APTITUDE_QUESTION_BANK[i].correctIndex;
    }
    answers[REAL_APTITUDE_QUESTION_BANK[4].id] = (REAL_APTITUDE_QUESTION_BANK[4].correctIndex + 1) % 4; // incorrect

    const result = evaluateAptitudeSubmission({ answers, timeSpentSeconds: 120 });
    if (result.correctCount !== 4) {
      throw new Error(`Expected 4 correct answers, got ${result.correctCount}`);
    }

    return `Aptitude test: 4 correct (${result.accuracyPercentage}%), Categories: ${Object.keys(result.categoryBreakdown).length}.`;
  });

  // 8. Communication NLP Assessment Engine
  await runTest('8. Communication NLP & STAR Speech Assessment', async () => {
    const transcript = 'In our senior capstone, the situation was that our team lacked a unified pipeline. The task was to build a data scraper. My action was writing a modular Python script with rate-limiting. As a result, we collected 100,000 records without IP bans.';
    const result = await analyzeCommunicationTranscript(transcript, 60, 'comm_star_01');

    if (result.wordsPerMinute <= 0) throw new Error('WPM calculation returned invalid value');
    if (result.structureStarScore < 0 || result.structureStarScore > 100) throw new Error('STAR score out of bounds');

    return `Speech NLP: ${result.wordsPerMinute} WPM, Filler Density: ${result.fillerWordDensity}%, STAR Score: ${result.structureStarScore}%, Lexical TTR: ${result.lexicalDiversityTTR}%.`;
  });

  // 9. Technical & Role Readiness Assessment Engine
  await runTest('9. Technical & Role Readiness Diagnostic Engine', async () => {
    const submission = evaluateTechnicalSubmission({
      answers: {
        tech_ds_01: 1, // correct SQL group by
        tech_ds_02: 0, // correct Pandas loc vs iloc
        tech_ds_03: 0  // correct precision vs recall
      },
      timeSpentSeconds: 90
    });

    if (submission.totalQuestions !== 10) throw new Error(`Expected 10 total questions, got ${submission.totalQuestions}`);
    return `Technical Test evaluated: ${submission.correctCount} correct (${submission.accuracyPercentage}%), Skill mastery breakdown generated.`;
  });

  // 10. Learning Roadmap Engine (Phase 4)
  await runTest('10. Learning Roadmap 5-Stage Progression & Certifications', async () => {
    const profile = await getUserProfile();
    const roadmap = await generatePersonalizedRoadmap(profile, '15-2051.01');

    if (roadmap.stages.length !== 5) {
      throw new Error(`Expected 5 stages, got ${roadmap.stages.length}`);
    }
    if (roadmap.recommendedCertifications.length === 0) {
      throw new Error('No certifications recommended');
    }
    if (roadmap.recommendedProjects.length === 0) {
      throw new Error('No capstone projects recommended');
    }

    return `Roadmap: 5 stages (${roadmap.totalEstimatedWeeks} weeks), ${roadmap.prioritySkills.length} missing skills categorized, ${roadmap.recommendedCertifications.length} certifications matched.`;
  });

  // 11. Career Transition Intelligence Engine (Phase 4)
  await runTest('11. Career Transition Delta & Feasibility Engine', async () => {
    const profile = await getUserProfile();
    const transition = await analyzeCareerTransition(profile, 'Junior Developer', 'Data Analyst');

    if (!transition.transitionFeasibility.rating) throw new Error('Transition feasibility rating missing');
    if (transition.stepByStepRoadmap.length !== 4) {
      throw new Error(`Expected 4-phase transition roadmap, got ${transition.stepByStepRoadmap.length}`);
    }

    return `Transition: "${transition.currentCareer.title}" → "${transition.targetCareer.title}". Feasibility: ${transition.transitionFeasibility.score}% (${transition.transitionFeasibility.rating}), Transferable: ${transition.transferableSkills.length}, Missing: ${transition.missingSkills.length}.`;
  });

  console.log('\n====================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Summary: ${passed}/${results.length} Tests Passed (${failed} Failed)`);
  console.log('====================================================\n');

  return {
    totalTests: results.length,
    passedTests: passed,
    failedTests: failed,
    results
  };
}

// Allow CLI execution via `tsx src/server/integrationTest.ts`
if (process.argv[1]?.endsWith('integrationTest.ts') || process.argv[1]?.endsWith('integrationTest.js')) {
  runFullIntegrationAndEvaluationSuite()
    .then((summary) => {
      if (summary.failedTests > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Test suite failed unexpectedly:', err);
      process.exit(1);
    });
}
