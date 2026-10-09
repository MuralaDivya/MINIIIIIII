import { UserProfile, EmployabilityBreakdown } from '../types/index.js';

export function calculateExplainableEmployability(
  profile: UserProfile,
  aptitudeScore?: number,
  communicationScore?: number,
  technicalAssessmentScore?: number
): EmployabilityBreakdown {
  // 1. Technical Skill Readiness (Weight: 30%)
  // Real calculation based on technical skills count, domain coverage, and actual technical test if taken
  const techCount = profile.technicalSkills.length;
  const rawTechScore = Math.min(100, Math.round((techCount / 10) * 85 + (profile.certifications.length > 0 ? 10 : 0)));
  const technicalSkillReadiness = technicalAssessmentScore !== undefined
    ? Math.round(rawTechScore * 0.5 + technicalAssessmentScore * 0.5)
    : Math.max(30, Math.min(98, rawTechScore));

  // 2. Career Fit (Weight: 20%)
  // Alignment between current skills and target career domain keywords
  const targetTokens = (profile.targetCareer + ' ' + (profile.domains || []).join(' ')).toLowerCase();
  const matchedTokens = profile.technicalSkills.filter(skill => 
    targetTokens.includes(skill.toLowerCase()) || 
    ['python', 'sql', 'data', 'analysis', 'cloud', 'javascript', 'react'].some(k => 
      targetTokens.includes(k) && skill.toLowerCase().includes(k)
    )
  );
  const careerFit = Math.min(96, Math.max(40, Math.round(50 + (matchedTokens.length * 8))));

  // 3. Aptitude (Weight: 15%)
  const aptitude = aptitudeScore !== undefined ? Math.max(0, Math.min(100, Math.round(aptitudeScore))) : 72;

  // 4. Communication (Weight: 15%)
  const communication = communicationScore !== undefined ? Math.max(0, Math.min(100, Math.round(communicationScore))) : 70;

  // 5. Project Readiness (Weight: 10%)
  // Real score based on projects documented, tech stack breadth, and github/live links
  const projectCount = profile.projects.length;
  const projectsWithTech = profile.projects.filter(p => p.technologies && p.technologies.length >= 2).length;
  const projectReadiness = Math.min(95, Math.max(25, Math.round((projectCount * 30) + (projectsWithTech * 10))));

  // 6. Learning Readiness (Weight: 10%)
  // Evaluated by active certifications, interests, and educational progression
  const certCount = profile.certifications.length;
  const interestsCount = profile.interests.length;
  const learningReadiness = Math.min(95, Math.max(40, Math.round(50 + (certCount * 20) + (interestsCount * 5))));

  // Weighted total:
  // 30% Tech + 20% Fit + 15% Aptitude + 15% Comm + 10% Projects + 10% Learning
  const overallScore = Math.round(
    technicalSkillReadiness * 0.30 +
    careerFit * 0.20 +
    aptitude * 0.15 +
    communication * 0.15 +
    projectReadiness * 0.10 +
    learningReadiness * 0.10
  );

  const evidenceFactors: string[] = [];
  const improvementPriorities: string[] = [];

  if (technicalSkillReadiness >= 75) {
    evidenceFactors.push(`Strong technical foundation with ${techCount} verified technical competencies.`);
  } else {
    improvementPriorities.push(`Expand core technical stack with 2-3 additional industry-standard tools.`);
  }

  if (projectCount >= 2) {
    evidenceFactors.push(`Demonstrated hands-on experience through ${projectCount} practical portfolio projects.`);
  } else {
    improvementPriorities.push(`Build and deploy at least 1 end-to-end portfolio project with measurable business metrics.`);
  }

  if (careerFit >= 70) {
    evidenceFactors.push(`High domain alignment (${matchedTokens.length} direct skill matches) towards target role "${profile.targetCareer}".`);
  } else {
    improvementPriorities.push(`Align portfolio projects more specifically with target career domain (${profile.targetCareer}).`);
  }

  if (communication < 75) {
    improvementPriorities.push(`Refine technical interview articulation and reduce filler word density.`);
  }

  const explanation = `Readiness is at ${overallScore}/100. Strengths include ${profile.technicalSkills.slice(0, 3).join(', ')} backed by ${projectCount} documented projects. Key focus area: close domain gaps for ${profile.targetCareer}.`;

  return {
    overallScore,
    components: {
      technicalSkillReadiness: { score: technicalSkillReadiness, weight: 0.30 },
      careerFit: { score: careerFit, weight: 0.20 },
      aptitude: { score: aptitude, weight: 0.15 },
      communication: { score: communication, weight: 0.15 },
      projectReadiness: { score: projectReadiness, weight: 0.10 },
      learningReadiness: { score: learningReadiness, weight: 0.10 }
    },
    explanation,
    evidenceFactors,
    improvementPriorities
  };
}
