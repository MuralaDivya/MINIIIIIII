export type UserPersona = 'fresh_graduate' | 'mid_career_professional' | 'career_switcher';

export interface EducationEntry {
  id: string;
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
  gpa?: string;
}

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  headline: string;
  persona: UserPersona;
  currentCareer: string;
  targetCareer: string;
  technicalSkills: string[];
  softSkills: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  domains: string[];
  interests: string[];
  updatedAt: string;
}

export interface CareerRecommendation {
  id: string;
  occupationCode: string; // e.g. O*NET SOC "15-2051.01"
  title: string;
  datasetSource: 'O*NET 29.1' | 'ESCO v1.1';
  matchScore: number; // 0-100 explainable composite
  semanticSimilarity: number; // 0-100
  skillCoverageScore: number; // 0-100
  profileRelevanceScore: number; // 0-100
  interestAlignmentScore: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  requiredSkills: string[];
  whyRecommended: string;
  nextRecommendedAction: string;
  salaryMedianUsd?: number;
  jobGrowthRate?: string;
}

export interface SkillGapItem {
  skillName: string;
  status: 'strong' | 'moderate' | 'missing';
  importance: 'critical' | 'high' | 'medium';
  onetElementId?: string;
  frequencyInOccupation: number; // Percentage in occupational standard
  reason: string;
}

export interface RoadmapStage {
  stageNumber: number;
  stageName: string; // e.g. "Stage 1: Foundation"
  focusArea: string;
  estimatedWeeks: number;
  skillsToAcquire: string[];
  suggestedProject: {
    title: string;
    objective: string;
    keyDeliverables: string[];
  };
  recommendedResourceCategory: string;
  verificationMilestone: string;
}

export interface AptitudeCategoryScore {
  category: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability' | 'Data Interpretation';
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export interface AptitudeState {
  overallScore: number; // 0-100
  totalQuestionsAttempted: number;
  totalCorrect: number;
  adaptiveLevelReached: 'entry' | 'medium' | 'advanced';
  categoryScores: AptitudeCategoryScore[];
  weakAreas: string[];
  strongAreas: string[];
  completedAt?: string;
}

export interface CommunicationState {
  confidenceIndicator: number; // 0-100 based on observable speech/language features
  wordsPerMinute: number;
  fillerWordFrequencyPercent: number;
  grammarAccuracyPercent: number;
  fluencyScore: number;
  sentenceStructureRating: 'Needs Improvement' | 'Competent' | 'Proficient' | 'Executive';
  fillerWordsDetected: { word: string; count: number }[];
  observableFeedback: string;
  analyzedAt?: string;
}

export interface EmployabilityBreakdown {
  overallScore: number; // Weighted composite 0-100
  components: {
    technicalSkillReadiness: { score: number; weight: number }; // 30%
    careerFit: { score: number; weight: number }; // 20%
    aptitude: { score: number; weight: number }; // 15%
    communication: { score: number; weight: number }; // 15%
    projectReadiness: { score: number; weight: number }; // 10%
    learningReadiness: { score: number; weight: number }; // 10%
  };
  explanation: string;
  evidenceFactors: string[];
  improvementPriorities: string[];
}

export interface SystemArchitectureStatus {
  databaseConnected: boolean;
  databaseType: string;
  geminiConfigured: boolean;
  knowledgeBaseOccupationsCount: number;
  activeAgents: string[];
  uptimeSeconds: number;
}
