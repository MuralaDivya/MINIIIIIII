import { UserProfile, RoadmapStage } from '../types/index.js';
import { calculateDetailedSkillGap } from './careerMatchingEngine.js';
import { getDatabase, logOrchestratorEvent } from './db.js';
import { generateExplainableGuidance } from './gemini.js';

export interface RecommendedCertification {
  id: string;
  name: string;
  issuer: string;
  targetedMissingSkills: string[];
  relevanceScore: number; // 0-100
  estimatedPreparationWeeks: number;
  difficulty: 'Foundational' | 'Associate' | 'Professional' | 'Specialty';
  officialUrl: string;
  whyRecommended: string;
}

export interface RecommendedProject {
  id: string;
  title: string;
  summary: string;
  targetedMissingSkills: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Production Capstone';
  estimatedHours: number;
  architectureComponents: string[];
  portfolioDeliverables: string[];
  businessContext: string;
}

export interface PersonalizedRoadmapResult {
  targetOccupation: {
    code: string;
    title: string;
    datasetSource: string;
    description: string;
  };
  totalEstimatedWeeks: number;
  totalMissingSkillsCount: number;
  stages: RoadmapStage[];
  prioritySkills: Array<{
    name: string;
    importance: 'critical' | 'high' | 'medium';
    frequency: number;
    recommendedStage: number;
  }>;
  recommendedCertifications: RecommendedCertification[];
  recommendedProjects: RecommendedProject[];
  aiPersonalizedStrategy?: string;
  generatedAt: string;
}

// Curated verifiable learning catalog mapped to occupational skill categories
const VERIFIABLE_LEARNING_RESOURCES: Record<string, Array<{ name: string; platform: string; url: string; type: string }>> = {
  python: [
    { name: 'Official Python Documentation & Tutorial', platform: 'Python Software Foundation', url: 'https://docs.python.org/3/tutorial/', type: 'Documentation' },
    { name: 'Python for Everybody Specialization', platform: 'Coursera / University of Michigan', url: 'https://www.coursera.org/specializations/python', type: 'Course' }
  ],
  sql: [
    { name: 'PostgreSQL Official Documentation & Manual', platform: 'PostgreSQL Global Development Group', url: 'https://www.postgresql.org/docs/', type: 'Documentation' },
    { name: 'SQLBolt - Interactive SQL Lessons', platform: 'SQLBolt', url: 'https://sqlbolt.com/', type: 'Interactive' }
  ],
  data_analysis: [
    { name: 'Pandas User Guide & Cookbook', platform: 'Pandas Development Team', url: 'https://pandas.pydata.org/docs/user_guide/', type: 'Documentation' },
    { name: 'Google Data Analytics Professional Certificate', platform: 'Coursera / Google', url: 'https://grow.google/certificates/data-analytics/', type: 'Certification Course' }
  ],
  machine_learning: [
    { name: 'Scikit-Learn Machine Learning in Python', platform: 'Scikit-Learn Consortium', url: 'https://scikit-learn.org/stable/', type: 'Documentation' },
    { name: 'Machine Learning Specialization by Andrew Ng', platform: 'Coursera / DeepLearning.AI', url: 'https://www.coursera.org/specializations/machine-learning-introduction', type: 'Course' }
  ],
  cloud: [
    { name: 'AWS Certified Cloud Practitioner & Skill Builder', platform: 'Amazon Web Services', url: 'https://explore.skillbuilder.aws/', type: 'Platform' },
    { name: 'Google Cloud Computing Fundamentals', platform: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google/', type: 'Interactive' }
  ],
  visualization: [
    { name: 'Microsoft Power BI Guided Learning & Docs', platform: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/power-bi/', type: 'Documentation' },
    { name: 'Tableau Free Training Videos & Documentation', platform: 'Tableau / Salesforce', url: 'https://www.tableau.com/learn/training', type: 'Course' }
  ],
  devops_git: [
    { name: 'Pro Git Book (Official Free Edition)', platform: 'Git SCM', url: 'https://git-scm.com/book/en/v2', type: 'Book / Documentation' },
    { name: 'Docker Get Started Official Guide', platform: 'Docker Docs', url: 'https://docs.docker.com/get-started/', type: 'Documentation' }
  ],
  general: [
    { name: 'O*NET OnLine Occupational Standards & Skills', platform: 'US Department of Labor', url: 'https://www.onetonline.org/', type: 'Occupational Standard' },
    { name: 'ESCO European Skills/Competences Catalog', platform: 'European Commission', url: 'https://esco.ec.europa.eu/', type: 'Taxonomy' }
  ]
};

// Verified Industry Certifications linked to competencies
const CERTIFICATION_KNOWLEDGE_BASE: Array<{
  name: string;
  issuer: string;
  skills: string[];
  domains: string[];
  difficulty: 'Foundational' | 'Associate' | 'Professional' | 'Specialty';
  weeks: number;
  url: string;
  description: string;
}> = [
  {
    name: 'Google Data Analytics Professional Certificate',
    issuer: 'Google / Coursera',
    skills: ['SQL', 'Spreadsheets', 'Tableau', 'R', 'Data Cleaning', 'Data Analysis'],
    domains: ['data', 'analytics'],
    difficulty: 'Foundational',
    weeks: 10,
    url: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    description: 'Demonstrates job-ready skills in data cleaning, SQL queries, Tableau visual storytelling, and statistical analysis.'
  },
  {
    name: 'Microsoft Certified: Power BI Data Analyst Associate (PL-300)',
    issuer: 'Microsoft',
    skills: ['Power BI', 'DAX', 'Power Query', 'Data Modeling', 'Data Visualization', 'Business Intelligence'],
    domains: ['data', 'bi', 'business analyst'],
    difficulty: 'Associate',
    weeks: 8,
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/',
    description: 'Validates ability to model, visualize, and analyze data with Microsoft Power BI, deploy reports, and create scalable semantic models.'
  },
  {
    name: 'AWS Certified Machine Learning - Specialty',
    issuer: 'Amazon Web Services',
    skills: ['Machine Learning', 'AWS SageMaker', 'Python', 'Feature Engineering', 'Model Deployment', 'Cloud ML'],
    domains: ['machine learning', 'ai', 'data science'],
    difficulty: 'Specialty',
    weeks: 14,
    url: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/',
    description: 'Validates expertise in designing, building, tuning, and deploying ML models on the AWS cloud infrastructure.'
  },
  {
    name: 'AWS Certified Solutions Architect - Associate',
    issuer: 'Amazon Web Services',
    skills: ['Cloud Computing', 'AWS', 'System Architecture', 'Security', 'Distributed Systems'],
    domains: ['cloud', 'software', 'devops', 'backend'],
    difficulty: 'Associate',
    weeks: 10,
    url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    description: 'Industry benchmark certification demonstrating knowledge of resilient, high-performing cloud architectures.'
  },
  {
    name: 'Databricks Certified Associate Developer for Apache Spark',
    issuer: 'Databricks',
    skills: ['Apache Spark', 'Python', 'PySpark', 'Data Engineering', 'Big Data', 'DataFrame API'],
    domains: ['data engineering', 'big data'],
    difficulty: 'Associate',
    weeks: 8,
    url: 'https://www.databricks.com/learn/certification/apache-spark-developer-associate',
    description: 'Validates ability to execute Spark SQL queries, optimize Spark DataFrames, and manage distributed data processing pipelines.'
  },
  {
    name: 'Meta Database Engineer Professional Certificate',
    issuer: 'Meta / Coursera',
    skills: ['SQL', 'Relational Databases', 'Database Design', 'MySQL', 'Python', 'Data Modeling'],
    domains: ['database', 'backend', 'data'],
    difficulty: 'Associate',
    weeks: 12,
    url: 'https://www.coursera.org/professional-certificates/meta-database-engineer',
    description: 'Comprehensive validation of normalized schema design, indexing, transactions, and SQL query optimization.'
  },
  {
    name: 'TensorFlow Developer Certificate',
    issuer: 'DeepLearning.AI / Google',
    skills: ['TensorFlow', 'Deep Learning', 'Neural Networks', 'Computer Vision', 'NLP'],
    domains: ['ai', 'deep learning', 'machine learning'],
    difficulty: 'Associate',
    weeks: 9,
    url: 'https://www.tensorflow.org/certificate',
    description: 'Demonstrates proficiency in building and training neural networks using TensorFlow for computer vision, NLP, and regression.'
  }
];

export async function generatePersonalizedRoadmap(
  profile: UserProfile,
  targetCareerCodeOrTitle: string
): Promise<PersonalizedRoadmapResult> {
  // 1. Calculate empirical skill gap from O*NET / ESCO database
  const skillGap = await calculateDetailedSkillGap(profile, targetCareerCodeOrTitle);
  const targetOcc = skillGap.occupation;
  const missingSkills = skillGap.missingSkills;
  const candidateSkills = new Set(profile.technicalSkills.map(s => s.toLowerCase()));

  // Partition missing skills into priority categories
  const criticalSkills = missingSkills.filter(s => s.importance === 'critical').map(s => s.skillName);
  const highSkills = missingSkills.filter(s => s.importance === 'high').map(s => s.skillName);
  const mediumSkills = missingSkills.filter(s => s.importance === 'medium').map(s => s.skillName);

  // Fallback items if missing skills is small
  const allMissingNames = missingSkills.map(s => s.skillName);
  const pool = allMissingNames.length > 0 ? allMissingNames : ['Target Domain Tooling', 'Applied Best Practices', 'Production Integration'];

  // Construct 5 adaptive stages
  // Stage 1: Foundational Prerequisites & Tooling
  const stage1Skills = pool.slice(0, Math.max(1, Math.ceil(pool.length * 0.25)));
  // Stage 2: Core Occupational Competencies
  const stage2Skills = pool.slice(stage1Skills.length, stage1Skills.length + Math.max(1, Math.ceil(pool.length * 0.35)));
  // Stage 3: Advanced Specialized Methods
  const stage3Skills = pool.slice(stage1Skills.length + stage2Skills.length, stage1Skills.length + stage2Skills.length + Math.max(1, Math.ceil(pool.length * 0.25)));
  // Stage 4: Capstone Project Synthesis
  const stage4Skills = pool.slice(stage1Skills.length + stage2Skills.length + stage3Skills.length);
  if (stage4Skills.length === 0 && pool.length > 0) {
    stage4Skills.push(pool[0]);
  }

  const stages: RoadmapStage[] = [
    {
      stageNumber: 1,
      stageName: 'Stage 1: Core Fundamentals & Prerequisite Tooling',
      focusArea: 'Foundational syntax, development environment setup, and data/computational workflow standards.',
      estimatedWeeks: 3,
      skillsToAcquire: stage1Skills.length > 0 ? stage1Skills : ['Environment Setup', 'Foundational Syntax'],
      suggestedProject: {
        title: `Foundational ${targetOcc.title} Workflow Pipeline`,
        objective: `Build a clean, documented baseline script implementing verified foundational skills (${stage1Skills.slice(0, 2).join(', ') || 'Core Tools'}).`,
        keyDeliverables: [
          'Executable script with configuration file & environment specification (requirements.txt / package.json)',
          'Modular code structure adhering to style guidelines and unit test coverage',
          'Documented README explaining operational instructions and input/output structure'
        ]
      },
      recommendedResourceCategory: 'Official Documentation & Foundational Interactive Labs',
      verificationMilestone: `Demonstrate mastery of basic concepts and push verified working repository to GitHub.`
    },
    {
      stageNumber: 2,
      stageName: 'Stage 2: Core Occupational Competency Mastery',
      focusArea: `Deep dive into primary daily skills required for ${targetOcc.title} in the ${targetOcc.datasetSource} standard.`,
      estimatedWeeks: 4,
      skillsToAcquire: stage2Skills.length > 0 ? stage2Skills : ['Core Analytical Methods', 'Query Optimization'],
      suggestedProject: {
        title: `End-to-End ${targetOcc.title} Analytics Engine`,
        objective: `Apply ${stage2Skills.slice(0, 3).join(', ')} against real-world datasets to solve an operational business question.`,
        keyDeliverables: [
          'Automated data ingestion and schema validation module',
          'Analytical transformation pipeline with clean error handling and logging',
          'Comprehensive summary report with visualized performance benchmarks'
        ]
      },
      recommendedResourceCategory: 'Comprehensive Specialization Courses & User Manuals',
      verificationMilestone: `Pass technical assessment covering ${stage2Skills[0] || 'core competencies'} with >=80% accuracy.`
    },
    {
      stageNumber: 3,
      stageName: 'Stage 3: Advanced Specialization & Cloud/Scalability',
      focusArea: 'Scaling solutions, deploying pipelines, integrating cloud/BI services, and automating workflows.',
      estimatedWeeks: 4,
      skillsToAcquire: stage3Skills.length > 0 ? stage3Skills : ['Cloud Deployment', 'Pipeline Optimization'],
      suggestedProject: {
        title: `Cloud-Integrated ${targetOcc.title} Solution`,
        objective: `Containerize and deploy the analytical pipeline using cloud-native tools and continuous integration.`,
        keyDeliverables: [
          'Dockerfile & CI/CD workflow configuration (GitHub Actions)',
          'Automated scheduled execution with cloud storage or warehouse integration',
          'Live interactive dashboard or REST API exposing analytical outputs'
        ]
      },
      recommendedResourceCategory: 'Cloud Provider Certification Curriculum & Production Guides',
      verificationMilestone: `Deploy live working service or hosted report with verifiable public URL.`
    },
    {
      stageNumber: 4,
      stageName: 'Stage 4: Industry Capstone & Proof-of-Work Portfolio',
      focusArea: 'Synthesizing all acquired competencies into a standout portfolio project matching occupational standards.',
      estimatedWeeks: 3,
      skillsToAcquire: stage4Skills.length > 0 ? stage4Skills : ['System Integration', 'Technical Documentation'],
      suggestedProject: {
        title: `Flagship ${targetOcc.title} Portfolio Capstone`,
        objective: `Build an enterprise-grade proof of work addressing actual industry use-cases for ${targetOcc.title}.`,
        keyDeliverables: [
          'Public GitHub repository with comprehensive architectural diagram and documentation',
          'Production-quality dataset modeling, reproducible setup script, and performance analysis',
          '3-minute video walk-through explaining technical decisions and quantifiable outcomes'
        ]
      },
      recommendedResourceCategory: 'Open Source Repositories & Portfolio Case Study Walkthroughs',
      verificationMilestone: `Complete code review and publish project write-up or technical blog post.`
    },
    {
      stageNumber: 5,
      stageName: 'Stage 5: Industry Readiness & Technical Interview Preparation',
      focusArea: 'Coding interviews, behavioral STAR framing, domain scenario questions, and resume alignment.',
      estimatedWeeks: 2,
      skillsToAcquire: ['STAR Interview Framing', 'System/Process Explanation', 'Case Study Problem Solving', 'Resume Technical Alignment'],
      suggestedProject: {
        title: `Professional Candidate Brief & Case Study Deck`,
        objective: `Structure candidate story, target role skill mapping, and technical case study presentation for interviews.`,
        keyDeliverables: [
          'Updated ATS-optimized resume emphasizing verified skills and capstone accomplishments',
          '5 structured STAR narrative responses tailored to target occupational competencies',
          'Completed simulated technical and communication diagnostic assessments in CareerIQ'
        ]
      },
      recommendedResourceCategory: 'Interview Preparation Question Banks & Real Diagnostic Tests',
      verificationMilestone: `Score >=80% on Technical Assessment and >=75% on Communication Assessment.`
    }
  ];

  const totalEstimatedWeeks = stages.reduce((acc, s) => acc + s.estimatedWeeks, 0);

  // Priority skills list
  const prioritySkills = missingSkills.map((s, idx) => ({
    name: s.skillName,
    importance: s.importance,
    frequency: s.frequencyInOccupation,
    recommendedStage: idx < 3 ? 1 : idx < 7 ? 2 : idx < 12 ? 3 : 4
  }));

  // Match relevant certifications
  const targetLower = targetOcc.title.toLowerCase();
  const recommendedCertifications: RecommendedCertification[] = CERTIFICATION_KNOWLEDGE_BASE
    .map(cert => {
      // Calculate relevance
      let relevance = 40;
      if (cert.domains.some(d => targetLower.includes(d))) relevance += 35;
      const matchedMissing = cert.skills.filter(s => 
        missingSkills.some(m => m.skillName.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(m.skillName.toLowerCase()))
      );
      relevance += Math.min(25, matchedMissing.length * 10);

      return {
        id: `cert_${cert.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: cert.name,
        issuer: cert.issuer,
        targetedMissingSkills: matchedMissing.length > 0 ? matchedMissing : [cert.skills[0]],
        relevanceScore: Math.min(98, relevance),
        estimatedPreparationWeeks: cert.weeks,
        difficulty: cert.difficulty,
        officialUrl: cert.url,
        whyRecommended: cert.description
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 4);

  // Generate tailored project recommendations linked directly to specific missing skills
  const primaryMissing = missingSkills.slice(0, 4).map(s => s.skillName);
  const secondaryMissing = missingSkills.slice(4, 8).map(s => s.skillName);

  const recommendedProjects: RecommendedProject[] = [
    {
      id: 'proj_rec_1',
      title: `${targetOcc.title} Production Data & Feature Pipeline`,
      summary: `End-to-end automated pipeline implementing ${primaryMissing.slice(0, 2).join(' and ') || 'core target competencies'} with schema validation and test coverage.`,
      targetedMissingSkills: primaryMissing.length > 0 ? primaryMissing.slice(0, 3) : ['Data Processing', 'ETL'],
      difficulty: 'Intermediate',
      estimatedHours: 35,
      architectureComponents: ['Automated Ingestion Script', 'Data Transformation Engine', 'Automated Unit Tests', 'GitHub Actions CI'],
      portfolioDeliverables: [
        'Complete repository with instructions to run locally via Docker',
        'Clean dataset outputs with automated data validation reports',
        'Benchmarked execution metrics and documentation'
      ],
      businessContext: `Solves the common business problem of ingesting heterogeneous source feeds and producing reliable, queryable datasets for ${targetOcc.title} stakeholders.`
    },
    {
      id: 'proj_rec_2',
      title: `Interactive Executive Insights & Decision Dashboard`,
      summary: `Production-ready analytical dashboard implementing ${secondaryMissing.slice(0, 2).join(' and ') || 'interactive visualization tools'} with drill-downs and KPIs.`,
      targetedMissingSkills: secondaryMissing.length > 0 ? secondaryMissing.slice(0, 3) : ['Business Intelligence', 'Data Storytelling'],
      difficulty: 'Intermediate',
      estimatedHours: 25,
      architectureComponents: ['Relational / Analytical Data Store', 'KPI Aggregation Queries', 'Interactive UI / Dashboard Interface', 'User Access & Filter Controls'],
      portfolioDeliverables: [
        'Interactive deployed dashboard or packaged report file',
        'Executive executive briefing deck (1-page memo)',
        'Technical schema documentation'
      ],
      businessContext: `Translates raw organizational metrics into actionable executive decision drivers, directly matching daily responsibilities of ${targetOcc.title}.`
    },
    {
      id: 'proj_rec_3',
      title: `Enterprise ${targetOcc.title} Capstone with Scalable Architecture`,
      summary: `Comprehensive capstone synthesizing ${[...primaryMissing.slice(0, 2), ...secondaryMissing.slice(0, 2)].join(', ')} with end-to-end monitoring and documentation.`,
      targetedMissingSkills: [...primaryMissing.slice(0, 2), ...secondaryMissing.slice(0, 2)],
      difficulty: 'Production Capstone',
      estimatedHours: 50,
      architectureComponents: ['Cloud / Containerized Infrastructure', 'End-to-End Analytical Pipeline', 'REST API / Export Layer', 'Automated Health Monitoring'],
      portfolioDeliverables: [
        'Production GitHub repo with MIT License, documentation, and live demo link',
        'Architectural design document and trade-off analysis',
        'Portfolio video demonstration'
      ],
      businessContext: `Serves as the centerpiece proof-of-work project to demonstrate senior junior or mid-level competency during recruiter and engineering team evaluations.`
    }
  ];

  // Optional Gemini enrichment for personalized strategy
  let aiPersonalizedStrategy: string | undefined = undefined;
  try {
    const prompt = `Candidate: ${profile.name} (${profile.headline}).
Target Career: ${targetOcc.title} (${targetOcc.datasetSource}).
Existing Verified Skills: ${profile.technicalSkills.join(', ')}.
Primary Missing Skill Gaps: ${missingSkills.slice(0, 6).map(s => s.skillName).join(', ')}.
Total Missing Skills: ${missingSkills.length}.

Provide a concise 3-paragraph executive career growth strategy:
1. Analysis of how their existing strengths accelerate their learning.
2. The single highest-leverage skill to master first and why.
3. How to position the projects in interviews to bypass lack of traditional tenure.
Keep it direct, professional, and grounded in real occupational standards.`;

    const sysInst = `You are the CareerIQ AI Learning Roadmap Synthesizer. Ground your advice in real ${targetOcc.datasetSource} occupational standards. Do not invent unrealistic claims.`;
    aiPersonalizedStrategy = await generateExplainableGuidance(prompt, sysInst);
  } catch (err) {
    console.warn('Gemini roadmap enrichment fallback to structured plan:', err);
    aiPersonalizedStrategy = `Based on your existing foundation in ${profile.technicalSkills.slice(0, 3).join(', ')}, you possess a high baseline for transitioning into ${targetOcc.title}. Prioritize mastering ${primaryMissing[0] || 'core occupational tools'} in Stage 1 to unlock rapid progress across advanced competencies.`;
  }

  logOrchestratorEvent('LearningRoadmapAgent', 'ROADMAP_GENERATED', {
    userId: profile.id,
    targetCareer: targetOcc.title,
    missingSkillsCount: missingSkills.length,
    stagesCount: stages.length
  });

  return {
    targetOccupation: {
      code: targetOcc.code,
      title: targetOcc.title,
      datasetSource: targetOcc.datasetSource,
      description: targetOcc.description
    },
    totalEstimatedWeeks,
    totalMissingSkillsCount: missingSkills.length,
    stages,
    prioritySkills,
    recommendedCertifications,
    recommendedProjects,
    aiPersonalizedStrategy,
    generatedAt: new Date().toISOString()
  };
}

export async function explainRoadmapStageWithGemini(
  profile: UserProfile,
  targetOccupationTitle: string,
  stage: RoadmapStage
): Promise<string> {
  const prompt = `Candidate: ${profile.name} (${profile.headline})
Target Career: ${targetOccupationTitle}
Stage: ${stage.stageName} (${stage.focusArea})
Skills to acquire: ${stage.skillsToAcquire.join(', ')}
Suggested Project: ${stage.suggestedProject.title} - ${stage.suggestedProject.objective}

Explain in detail:
1. Exactly why these skills are critical for a ${targetOccupationTitle}.
2. Step-by-step weekly milestone plan for this stage (${stage.estimatedWeeks} weeks).
3. 3 verifiable learning resources (official documentation, reputable platforms) with exact study topics.
4. How to verify that you have successfully mastered this stage before moving on.`;

  return await generateExplainableGuidance(
    prompt,
    'You are the CareerIQ AI Curriculum Architect. Provide highly specific, actionable, and verifiable learning guidance.'
  );
}
