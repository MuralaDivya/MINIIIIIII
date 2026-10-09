import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Compass, 
  Clock, 
  Briefcase, 
  Layers, 
  Target, 
  HelpCircle,
  Loader2,
  Calendar,
  Flame,
  ArrowRightLeft
} from 'lucide-react';
import { UserProfile } from '../types/index.js';
import { TransitionAnalysisResult } from '../server/transitionEngine.js';

interface CareerTransitionViewProps {
  profile: UserProfile;
  onNavigateToRoadmap?: () => void;
  onNavigateToCoach?: () => void;
}

export const CareerTransitionView: React.FC<CareerTransitionViewProps> = ({
  profile,
  onNavigateToRoadmap,
  onNavigateToCoach
}) => {
  const [currentCareerInput, setCurrentCareerInput] = useState(profile.currentCareer || 'Junior Developer');
  const [targetCareerInput, setTargetCareerInput] = useState(profile.targetCareer || 'Data Analyst');
  const [analysisData, setAnalysisData] = useState<TransitionAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [careerOptions, setCareerOptions] = useState<Array<{ code: string; title: string }>>([]);

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

  const runAnalysis = async (current: string, target: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/growth/transition?current=${encodeURIComponent(current)}&target=${encodeURIComponent(target)}`
      );
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data: TransitionAnalysisResult = await res.json();
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Transition analysis error:', err);
      setErrorMsg(err.message || 'Failed to analyze career transition.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    runAnalysis(currentCareerInput, targetCareerInput);
  }, []);

  const handleSwapCareers = () => {
    const temp = currentCareerInput;
    setCurrentCareerInput(targetCareerInput);
    setTargetCareerInput(temp);
    runAnalysis(targetCareerInput, temp);
  };

  const handleQuickAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(currentCareerInput, targetCareerInput);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/60 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Career Transition Intelligence</h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Cross-Role Skill Delta
                </span>
              </div>
              <p className="text-xs text-blue-200/60 font-medium mt-0.5">
                Evaluates transferable competencies, deficit gap difficulty, and step-by-step transition roadmap
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Database:</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-[#070e20] text-blue-300 border border-[#17326c] font-mono">
              2,516 O*NET & ESCO Roles
            </span>
          </div>
        </div>

        {/* Transition Input Form */}
        <form
          onSubmit={handleQuickAnalyze}
          className="p-4 rounded-xl bg-[#070e20] border border-[#17326c]/60 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto] gap-3 items-center text-xs"
        >
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Current Career / Baseline</label>
            <input
              type="text"
              value={currentCareerInput}
              onChange={(e) => setCurrentCareerInput(e.target.value)}
              placeholder="e.g. Junior Developer, Research Assistant..."
              className="w-full px-3 py-2 bg-[#0c1a36] border border-[#17326c] rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSwapCareers}
            title="Swap roles"
            className="w-9 h-9 rounded-lg bg-[#0f2249] hover:bg-[#17326c] text-cyan-400 flex items-center justify-center self-end mb-0.5 transition-colors border border-[#17326c]"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Target Career / Destination</label>
            <input
              type="text"
              value={targetCareerInput}
              onChange={(e) => setTargetCareerInput(e.target.value)}
              placeholder="e.g. Data Analyst, Cloud Solutions Architect..."
              className="w-full px-3 py-2 bg-[#0c1a36] border border-[#17326c] rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 self-end mb-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Analyze Delta
          </button>
        </form>

        {/* Feasibility Summary Scoreboard */}
        {analysisData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#17326c]/50 text-xs">
            <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40">
              <div className="text-[11px] text-slate-400">Feasibility Rating</div>
              <div className="text-base font-bold text-cyan-300 mt-0.5">
                {analysisData.transitionFeasibility.rating}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {analysisData.transitionFeasibility.score}% Feasibility Score
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40">
              <div className="text-[11px] text-slate-400">Estimated Transition</div>
              <div className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{analysisData.transitionFeasibility.estimatedMonths} Months</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Focused progression</div>
            </div>

            <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40">
              <div className="text-[11px] text-slate-400">Transition Difficulty</div>
              <div
                className={`text-base font-bold mt-0.5 flex items-center gap-1.5 ${
                  analysisData.transitionFeasibility.difficultyRating === 'Low'
                    ? 'text-emerald-300'
                    : analysisData.transitionFeasibility.difficultyRating === 'Medium'
                    ? 'text-amber-300'
                    : 'text-rose-300'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>{analysisData.transitionFeasibility.difficultyRating} Difficulty</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Based on skill delta</div>
            </div>

            <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/40">
              <div className="text-[11px] text-slate-400">Transferable Skills</div>
              <div className="text-base font-bold text-emerald-300 mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{analysisData.transferableSkills.length} Verified</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Deficits: {analysisData.missingSkills.length} skills
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Strategic Pivot Blueprint Card */}
      {analysisData?.aiStrategicPivotAdvice && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#0c1e40] to-blue-950/40 border border-blue-500/30 text-xs shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Strategic Career Pivot Narrative (Gemini Grounded)
            </span>
            <span className="text-[10px] text-blue-200/50">Interview Bridge Strategy</span>
          </div>
          <div className="text-slate-200 leading-relaxed whitespace-pre-line">
            {analysisData.aiStrategicPivotAdvice}
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="h-72 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs">Computing cross-role transferable competencies & difficulty delta...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center space-y-2">
          <AlertTriangle className="w-6 h-6 mx-auto text-rose-400" />
          <p className="font-bold">{errorMsg}</p>
        </div>
      ) : analysisData ? (
        <div className="space-y-6">
          {/* Side-by-Side Competency Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transferable Skills Card */}
            <div className="p-6 rounded-2xl bg-[#0a152d] border border-emerald-500/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Transferable Competencies</h3>
                    <p className="text-[11px] text-emerald-400 font-medium">Assets carry over into {analysisData.targetCareer.title}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {analysisData.transferableSkills.length} Skills
                </span>
              </div>

              <div className="space-y-2.5">
                {analysisData.transferableSkills.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          item.relevance === 'Direct Match'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-cyan-300 border border-blue-500/30'
                        }`}
                      >
                        {item.relevance}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.applicationInTarget}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Skills Deficit Card */}
            <div className="p-6 rounded-2xl bg-[#0a152d] border border-amber-500/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Missing Skill Deficits</h3>
                    <p className="text-[11px] text-amber-400 font-medium">Target requirements needed for full qualification</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {analysisData.missingSkills.length} Deficits
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {analysisData.missingSkills.slice(0, 8).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          item.importance === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.importance === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {item.importance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Category: {item.learningCategory}</span>
                      <span className="text-cyan-300 font-mono text-[10px]">{item.difficultyToAcquire}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step-by-Step Transition Roadmap */}
          <div className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">4-Phase Transition Bridge Roadmap</h3>
                <p className="text-xs text-slate-400">
                  Step-by-step roadmap to transition from {analysisData.currentCareer.title} to {analysisData.targetCareer.title}
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/30">
                Total Horizon: {analysisData.transitionFeasibility.estimatedMonths} Months
              </span>
            </div>

            <div className="space-y-4">
              {analysisData.stepByStepRoadmap.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-5 rounded-xl bg-[#070e20] border border-[#17326c]/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#17326c]/40 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-blue-600/30 border border-blue-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center">
                        {step.stepNumber}
                      </span>
                      <h4 className="text-sm font-bold text-white">{step.phaseTitle}</h4>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {step.timeline}
                    </span>
                  </div>

                  <p className="text-xs text-blue-200/90 leading-relaxed font-medium">
                    Goal: {step.milestoneGoal}
                  </p>

                  <div className="text-xs space-y-1.5 pt-1">
                    <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">Key Execution Steps:</span>
                    <ul className="space-y-1 text-slate-400 text-[11px]">
                      {step.keyActions.map((act, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-300 bg-[#0a152d] p-2.5 rounded-lg border border-[#17326c]/40 flex items-center justify-between">
                    <span className="text-slate-400">Verifiable Deliverable:</span>
                    <span className="font-semibold text-cyan-300">{step.deliverable}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Footer Navigation helper */}
      <div className="p-4 rounded-xl bg-[#0c1a36] border border-[#17326c]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-300">
          Ready to generate an adaptive 5-stage learning progression for this career?
        </span>
        <div className="flex items-center gap-2">
          {onNavigateToRoadmap && (
            <button
              onClick={onNavigateToRoadmap}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              Open Learning Roadmap <Compass className="w-3.5 h-3.5" />
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
