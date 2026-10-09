import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  FolderGit2, 
  ArrowRight, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  BookOpen,
  Layers,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { RoadmapStage } from '../types/index.js';
import { RecommendedCertification, RecommendedProject, PersonalizedRoadmapResult } from '../server/roadmapEngine.js';

interface LearningRoadmapViewProps {
  initialTarget?: string;
  onNavigateToTransition?: () => void;
  onNavigateToCoach?: () => void;
}

export const LearningRoadmapView: React.FC<LearningRoadmapViewProps> = ({
  initialTarget,
  onNavigateToTransition,
  onNavigateToCoach
}) => {
  const [targetQuery, setTargetQuery] = useState(initialTarget || 'Data Analyst / Junior ML Engineer');
  const [roadmapData, setRoadmapData] = useState<PersonalizedRoadmapResult | null>(null);
  const [careerOptions, setCareerOptions] = useState<Array<{ code: string; title: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active view tab: 'stages' | 'projects' | 'certifications' | 'skills'
  const [activeSection, setActiveSection] = useState<'stages' | 'projects' | 'certifications' | 'skills'>('stages');

  // Deep dive explanation modal state
  const [explainingStage, setExplainingStage] = useState<RoadmapStage | null>(null);
  const [stageExplanation, setStageExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Completed milestones state for tracking user progress
  const [completedStages, setCompletedStages] = useState<Record<number, boolean>>({});

  const fetchRoadmap = async (targetRole: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/growth/roadmap?target=${encodeURIComponent(targetRole)}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: PersonalizedRoadmapResult = await res.json();
      setRoadmapData(data);
    } catch (err: any) {
      console.error('Failed to load roadmap:', err);
      setErrorMsg(err.message || 'Could not generate roadmap for this career.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/growth/career-options');
      if (res.ok) {
        const json = await res.json();
        setCareerOptions(json.options || []);
      }
    } catch (e) {
      console.warn('Could not fetch career options:', e);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchRoadmap(targetQuery);
  }, []);

  const handleSelectNewTarget = (newRole: string) => {
    setTargetQuery(newRole);
    fetchRoadmap(newRole);
  };

  const handleDeepDiveExplain = async (stage: RoadmapStage) => {
    setExplainingStage(stage);
    setStageExplanation(null);
    setIsExplaining(true);
    try {
      const res = await fetch('/api/growth/roadmap/explain-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          targetTitle: roadmapData?.targetOccupation.title || targetQuery
        })
      });
      const data = await res.json();
      setStageExplanation(data.explanation || 'Detailed stage curriculum generated.');
    } catch (err: any) {
      setStageExplanation(`Unable to connect to AI curriculum service: ${err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  const toggleStageCompleted = (stageNumber: number) => {
    setCompletedStages(prev => ({
      ...prev,
      [stageNumber]: !prev[stageNumber]
    }));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/60 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-300 shrink-0">
              <Compass className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Personalized Learning Roadmap</h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Adaptive 5-Stage DAG
                </span>
              </div>
              <p className="text-xs text-blue-200/60 font-medium mt-0.5">
                Progression synthesized strictly from candidate profile skill gaps against occupational standards
              </p>
            </div>
          </div>

          {/* Target Role Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Target Career:</label>
            <select
              value={targetQuery}
              onChange={(e) => handleSelectNewTarget(e.target.value)}
              className="px-3 py-1.5 bg-[#070e20] border border-[#17326c] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 max-w-[260px] truncate"
            >
              <option value={targetQuery}>{targetQuery} (Current Profile Target)</option>
              {careerOptions.slice(0, 30).map((opt) => (
                <option key={opt.code} value={opt.title}>
                  {opt.title} ({opt.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overview Stats Bar */}
        {roadmapData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#17326c]/50 text-xs">
            <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40">
              <div className="text-[11px] text-slate-400">Total Duration</div>
              <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>{roadmapData.totalEstimatedWeeks} Weeks</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">~{Math.round(roadmapData.totalEstimatedWeeks / 4)} Months Adaptive</div>
            </div>

            <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40">
              <div className="text-[11px] text-slate-400">Missing Deficits</div>
              <div className="text-lg font-bold text-amber-300 mt-0.5 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>{roadmapData.totalMissingSkillsCount} Skills</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Partitioned across stages</div>
            </div>

            <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40">
              <div className="text-[11px] text-slate-400">Verified Certifications</div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>{roadmapData.recommendedCertifications.length} Matches</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Industry credential benchmarks</div>
            </div>

            <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40">
              <div className="text-[11px] text-slate-400">Occupational Standard</div>
              <div className="text-lg font-bold text-blue-300 mt-0.5 truncate">
                {roadmapData.targetOccupation.datasetSource}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">Code: {roadmapData.targetOccupation.code}</div>
            </div>
          </div>
        )}
      </div>

      {/* AI Personalized Strategy Card */}
      {roadmapData?.aiPersonalizedStrategy && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#0c1e40] to-blue-950/40 border border-blue-500/30 text-xs shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI Strategic Growth Blueprint (Gemini Grounded)
            </span>
            <span className="text-[10px] text-blue-200/50">Personalized to Candidate Profile</span>
          </div>
          <div className="text-slate-200 leading-relaxed whitespace-pre-line">
            {roadmapData.aiPersonalizedStrategy}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#17326c]/60 pb-2">
        <button
          onClick={() => setActiveSection('stages')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeSection === 'stages'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#0f2249]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          5-Stage Learning Progression
        </button>

        <button
          onClick={() => setActiveSection('projects')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeSection === 'projects'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#0f2249]'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          Recommended Projects ({roadmapData?.recommendedProjects.length || 0})
        </button>

        <button
          onClick={() => setActiveSection('certifications')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeSection === 'certifications'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#0f2249]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Relevant Certifications ({roadmapData?.recommendedCertifications.length || 0})
        </button>

        <button
          onClick={() => setActiveSection('skills')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeSection === 'skills'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#0f2249]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Priority Skills Matrix ({roadmapData?.prioritySkills.length || 0})
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="h-72 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs">Generating verified skill gap progression & milestones...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center space-y-2">
          <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
          <p className="font-bold">{errorMsg}</p>
          <button
            onClick={() => fetchRoadmap(targetQuery)}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500"
          >
            Retry
          </button>
        </div>
      ) : activeSection === 'stages' && roadmapData ? (
        /* Stages Progression Timeline */
        <div className="space-y-4">
          {roadmapData.stages.map((stage) => {
            const isCompleted = completedStages[stage.stageNumber];
            return (
              <div
                key={stage.stageNumber}
                className={`p-6 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-[#08152c]/90 border-emerald-500/40 shadow-sm'
                    : 'bg-[#0a152d] border-[#17326c]/70 hover:border-blue-500/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                        {stage.stageNumber}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {stage.stageName}
                      </h3>
                      <span className="text-[11px] font-mono text-cyan-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-400/20">
                        {stage.estimatedWeeks} Weeks Duration
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-200/80 leading-relaxed pt-1">
                      {stage.focusArea}
                    </p>
                  </div>

                  {/* Actions for this stage */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDeepDiveExplain(stage)}
                      className="px-3 py-1.5 rounded-lg bg-[#0f2249] hover:bg-[#17326c] text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#17326c]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Gemini Deep-Dive
                    </button>
                    <button
                      onClick={() => toggleStageCompleted(stage.stageNumber)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#0c1a36] text-slate-300 hover:text-white border border-[#17326c]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isCompleted ? 'Mark Incomplete' : 'Mark Done'}
                    </button>
                  </div>
                </div>

                {/* Targeted Skills & Deliverables */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 mt-4 border-t border-[#17326c]/50 text-xs">
                  {/* Skills to Acquire */}
                  <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40 space-y-1.5">
                    <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                      Targeted Skill Gaps
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.skillsToAcquire.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-200 border border-blue-400/20 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Project */}
                  <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40 space-y-1.5">
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3" />
                      Stage Practical Project
                    </div>
                    <div className="font-semibold text-white truncate">{stage.suggestedProject.title}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{stage.suggestedProject.objective}</p>
                  </div>

                  {/* Verification Milestone */}
                  <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40 space-y-1.5">
                    <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verification Criterion
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {stage.verificationMilestone}
                    </p>
                    <div className="text-[10px] text-slate-400 truncate">
                      Source: {stage.recommendedResourceCategory}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeSection === 'projects' && roadmapData ? (
        /* Projects Section */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmapData.recommendedProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                    {proj.difficulty} · ~{proj.estimatedHours}h
                  </span>
                  <span className="text-xs text-slate-400">Portfolio Proof</span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">{proj.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{proj.summary}</p>

                <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40 text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                    Targeted Deficit Skills:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proj.targetedMissingSkills.map((s, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="font-semibold text-slate-300">Deliverables to Showcase:</span>
                  <ul className="space-y-1 text-slate-400 text-[11px]">
                    {proj.portfolioDeliverables.map((d, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-[#17326c]/50 text-[11px] text-slate-400 italic">
                Business Context: {proj.businessContext}
              </div>
            </div>
          ))}
        </div>
      ) : activeSection === 'certifications' && roadmapData ? (
        /* Certifications Section */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmapData.recommendedCertifications.map((cert) => (
            <div
              key={cert.id}
              className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {cert.difficulty} · ~{cert.estimatedPreparationWeeks} Weeks Prep
                  </span>
                  <span className="text-xs font-bold text-cyan-400">{cert.relevanceScore}% Match</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{cert.name}</h3>
                  <p className="text-xs text-blue-300 font-medium">Issuer: {cert.issuer}</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{cert.whyRecommended}</p>

                <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40 text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                    Validates Missing Skills:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cert.targetedMissingSkills.map((s, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#17326c]/50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Verifiable Credential</span>
                <a
                  href={cert.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  Official Details <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : activeSection === 'skills' && roadmapData ? (
        /* Priority Skills Matrix */
        <div className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Verified Missing Competencies</h3>
              <p className="text-xs text-slate-400">
                Sorted by priority in {roadmapData.targetOccupation.title} occupational curriculum
              </p>
            </div>
            <span className="text-xs text-cyan-400 font-mono">
              {roadmapData.prioritySkills.length} Total Gaps
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#17326c] text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Skill Name</th>
                  <th className="py-2.5 px-3">Criticality</th>
                  <th className="py-2.5 px-3">Occupational Frequency</th>
                  <th className="py-2.5 px-3">Recommended Stage</th>
                  <th className="py-2.5 px-3">Learning Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17326c]/40">
                {roadmapData.prioritySkills.map((skill, idx) => (
                  <tr key={idx} className="hover:bg-[#0c1a36]/50">
                    <td className="py-3 px-3 font-semibold text-white">{skill.name}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          skill.importance === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : skill.importance === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {skill.importance}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{skill.frequency}% in O*NET/ESCO</td>
                    <td className="py-3 px-3 font-mono text-cyan-300">Stage {skill.recommendedStage}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => {
                          const matchingStage = roadmapData.stages.find(s => s.stageNumber === skill.recommendedStage) || roadmapData.stages[0];
                          handleDeepDiveExplain(matchingStage);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                      >
                        Curriculum <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Deep-Dive Stage Modal */}
      {explainingStage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a152d] border border-[#17326c] rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#17326c]/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Curriculum Deep-Dive: {explainingStage.stageName}
                </h3>
              </div>
              <button
                onClick={() => setExplainingStage(null)}
                className="w-8 h-8 rounded-lg bg-[#0f2249] hover:bg-[#17326c] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
              {isExplaining ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <p className="text-xs">Synthesizing weekly study milestones and verifiable learning documentation...</p>
                </div>
              ) : (
                <div className="text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
                  {stageExplanation}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#17326c]/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Model: Gemini 3.8 Flash (Server-Side)</span>
              <button
                onClick={() => setExplainingStage(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation helper */}
      <div className="p-4 rounded-xl bg-[#0c1a36] border border-[#17326c]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-300">
          Want to analyze cross-occupational transferable skills from your current role?
        </span>
        <div className="flex items-center gap-2">
          {onNavigateToTransition && (
            <button
              onClick={onNavigateToTransition}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              Open Career Transition Agent <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onNavigateToCoach && (
            <button
              onClick={onNavigateToCoach}
              className="px-3 py-1.5 rounded-lg bg-[#0f2249] hover:bg-[#17326c] text-cyan-300 font-semibold transition-colors"
            >
              Ask AI Career Coach
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
