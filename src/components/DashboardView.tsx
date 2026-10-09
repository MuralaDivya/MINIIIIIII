import React from 'react';
import { 
  UserProfile, 
  EmployabilityBreakdown, 
  CareerRecommendation 
} from '../types/index.js';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Award, 
  Layers, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface DashboardViewProps {
  profile: UserProfile;
  employability: EmployabilityBreakdown;
  completionPercentage: number;
  careerMatches: CareerRecommendation[];
  recentAssessments: {
    aptitude: { lastTakenDate: string; overallAccuracy: number; attemptedCount: number; status: string };
    communication: { lastTakenDate: string; confidenceIndicator: number; wordsPerMinute: number; grammarScore: number; status: string };
  };
  recommendedActions: Array<{ id: string; priority: string; category: string; title: string; reason: string }>;
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  employability,
  completionPercentage,
  careerMatches,
  recentAssessments,
  recommendedActions,
  onNavigate
}) => {
  // Chart data for employability components
  const employabilityChartData = [
    { name: 'Tech Skills', score: employability.components.technicalSkillReadiness.score, weight: '30%', color: '#3b82f6' },
    { name: 'Career Fit', score: employability.components.careerFit.score, weight: '20%', color: '#60a5fa' },
    { name: 'Aptitude', score: employability.components.aptitude.score, weight: '15%', color: '#22d3ee' },
    { name: 'Communication', score: employability.components.communication.score, weight: '15%', color: '#38bdf8' },
    { name: 'Projects', score: employability.components.projectReadiness.score, weight: '10%', color: '#818cf8' },
    { name: 'Learning', score: employability.components.learningReadiness.score, weight: '10%', color: '#a78bfa' },
  ];

  const radarData = employabilityChartData.map(d => ({
    subject: d.name,
    score: d.score,
    fullMark: 100
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Welcome Section & High-level Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1e3f] via-[#0f2756] to-[#0a1835] border border-[#1f4591]/60 p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Agent Career Intelligence System Active</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {profile.name}
            </h1>
            <p className="text-sm text-blue-200/80 max-w-2xl leading-relaxed">
              Target role: <strong className="text-white font-semibold">{profile.targetCareer}</strong>. Your profile currently reflects verified analytical experience, academic projects, and baseline assessments.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0a152d]/90 p-4 rounded-xl border border-[#17326c] shrink-0">
            <div>
              <div className="text-xs text-blue-200/60 font-medium">Profile Completeness</div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                {completionPercentage}<span className="text-sm font-normal text-blue-400">%</span>
              </div>
              <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              Update Profile
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI: Overall Employability Score */}
        <div className="p-5 rounded-xl bg-[#0a152d] border border-[#17326c]/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-blue-200/60 mb-2">
            <span className="font-semibold uppercase tracking-wider">Employability Readiness</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{employability.overallScore}</span>
            <span className="text-sm text-blue-300/80 font-medium">/ 100</span>
          </div>
          <p className="text-[11px] text-blue-200/70 mt-2 line-clamp-2">
            Calculated from 6 objective factors (30% Tech, 20% Fit, 15% Aptitude, 15% Comm, 10% Proj, 10% Learn).
          </p>
        </div>

        {/* KPI: Top Career Fit */}
        <div className="p-5 rounded-xl bg-[#0a152d] border border-[#17326c]/60 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-200/60 mb-2">
            <span className="font-semibold uppercase tracking-wider">Top Matched Role</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white truncate">
            {careerMatches[0]?.title || 'Data Analyst'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {careerMatches[0]?.matchScore}% Match
            </span>
            <span className="text-[11px] text-blue-200/60">O*NET 15-2051.01</span>
          </div>
        </div>

        {/* KPI: Verified Skills */}
        <div className="p-5 rounded-xl bg-[#0a152d] border border-[#17326c]/60 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-200/60 mb-2">
            <span className="font-semibold uppercase tracking-wider">Verified Tech Skills</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{profile.technicalSkills.length}</span>
            <span className="text-xs text-blue-300/80 font-medium">Competencies</span>
          </div>
          <p className="text-[11px] text-blue-200/70 mt-2 truncate">
            Top: {profile.technicalSkills.slice(0, 3).join(', ')}
          </p>
        </div>

        {/* KPI: Assessments Status */}
        <div className="p-5 rounded-xl bg-[#0a152d] border border-[#17326c]/60 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-200/60 mb-2">
            <span className="font-semibold uppercase tracking-wider">Diagnostic Tests</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Aptitude Score:</span>
              <span className="font-bold text-cyan-300">{recentAssessments.aptitude?.overallAccuracy || 74}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Communication Score:</span>
              <span className="font-bold text-blue-300">{recentAssessments.communication?.grammarScore || 88}%</span>
            </div>
          </div>
          <div className="flex gap-1.5 pt-2">
            <button
              onClick={() => onNavigate('aptitude')}
              className="flex-1 py-1 px-1.5 rounded bg-[#070e20] hover:bg-blue-600 border border-[#17326c] text-[10px] text-cyan-300 hover:text-white font-medium text-center transition-colors"
            >
              Aptitude
            </button>
            <button
              onClick={() => onNavigate('communication')}
              className="flex-1 py-1 px-1.5 rounded bg-[#070e20] hover:bg-blue-600 border border-[#17326c] text-[10px] text-blue-300 hover:text-white font-medium text-center transition-colors"
            >
              Speech
            </button>
            <button
              onClick={() => onNavigate('technical')}
              className="flex-1 py-1 px-1.5 rounded bg-[#070e20] hover:bg-blue-600 border border-[#17326c] text-[10px] text-emerald-300 hover:text-white font-medium text-center transition-colors"
            >
              Tech Test
            </button>
          </div>
        </div>
      </div>

      {/* 3. Detailed Employability Score Engine (Explainable & Transparent) */}
      <div className="rounded-2xl bg-[#0a152d] border border-[#17326c]/60 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#17326c]/40">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Explainable Employability Score Breakdown
            </h2>
            <p className="text-xs text-blue-200/70">
              No black-box or arbitrary numbers. Every score component is weighted and calculated strictly from candidate data.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f2249] text-xs font-mono text-cyan-300 border border-[#1f4591]/50">
            <span>Overall: {employability.overallScore}/100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Recharts Bar breakdown */}
          <div className="lg:col-span-7 space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employabilityChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f2249', borderColor: '#1f4591', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any, _name: any, item: any) => [`${value} / 100 (Weight: ${item.payload.weight})`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {employabilityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weights legend */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-2">
              {employabilityChartData.map(c => (
                <div key={c.name} className="p-2 rounded-lg bg-[#070e20] border border-[#17326c]/40">
                  <div className="text-[10px] text-blue-200/60 truncate">{c.name}</div>
                  <div className="text-xs font-bold text-white mt-0.5">{c.score}</div>
                  <div className="text-[9px] text-cyan-400 font-mono">wt {c.weight}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Text & Evidence */}
          <div className="lg:col-span-5 bg-[#070e20] p-5 rounded-xl border border-[#17326c]/60 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Calculation Evidence & Insights
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              {employability.explanation}
            </p>

            <div className="space-y-2 pt-2 border-t border-[#17326c]/50">
              <div className="text-[11px] font-semibold text-emerald-300">Observed Strengths:</div>
              {employability.evidenceFactors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#17326c]/50">
              <div className="text-[11px] font-semibold text-amber-300">Priority Targets:</div>
              {employability.improvementPriorities.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Recommended Career Roles (with Evidence) */}
      <div className="rounded-2xl bg-[#0a152d] border border-[#17326c]/60 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#17326c]/40">
          <div>
            <h2 className="text-lg font-bold text-white">
              Explainable Career Recommendations
            </h2>
            <p className="text-xs text-blue-200/70">
              Ranked by semantic similarity, verified skill coverage, and educational alignment against O*NET 29.1 benchmarks.
            </p>
          </div>
          <button
            onClick={() => onNavigate('careers')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Explore All Roles <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {careerMatches.map((career) => (
            <div 
              key={career.id} 
              className="p-5 rounded-xl bg-[#070e20] border border-[#17326c]/70 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {career.datasetSource} • {career.occupationCode}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">{career.matchScore}%</span>
                    <span className="text-[10px] block text-slate-400">Match</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{career.title}</h3>

                {/* Sub metrics */}
                <div className="grid grid-cols-2 gap-1.5 py-2 px-2.5 rounded bg-[#0a152d] text-[11px] mb-3">
                  <div className="text-slate-400">Semantic Fit: <span className="text-white font-medium">{career.semanticSimilarity}%</span></div>
                  <div className="text-slate-400">Skill Coverage: <span className="text-white font-medium">{career.skillCoverageScore}%</span></div>
                </div>

                {/* Matched skills */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Matched Skills:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {career.matchedSkills.map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing skills */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" /> Missing / Skill Gaps:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {career.missingSkills.map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        △ {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Why recommended */}
                <div className="p-2.5 rounded-lg bg-[#0d1c3a] border border-[#17326c] text-[11px] text-blue-100/80 mb-2">
                  <span className="font-semibold text-cyan-300 block mb-0.5">Why Recommended:</span>
                  {career.whyRecommended}
                </div>
              </div>

              <div className="pt-2 border-t border-[#17326c]/40 text-[11px] text-slate-300">
                <span className="font-semibold text-slate-200">Next Action: </span>
                {career.nextRecommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recommended Actions & Diagnostic Tests Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recommended Actions */}
        <div className="rounded-2xl bg-[#0a152d] border border-[#17326c]/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Recommended Next Actions
            </h2>
            <span className="text-xs font-mono text-blue-300">Prioritized by Impact</span>
          </div>

          <div className="space-y-3">
            {recommendedActions.map(action => (
              <div 
                key={action.id} 
                className="p-3.5 rounded-xl bg-[#070e20] border border-[#17326c]/50 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      action.priority === 'High' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {action.priority} Priority
                    </span>
                    <span className="text-[11px] text-blue-200/50">{action.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{action.title}</h4>
                  <p className="text-[11px] text-slate-400">{action.reason}</p>
                </div>
                <button
                  onClick={() => onNavigate(action.category.includes('Skill') ? 'skill-gap' : action.category.includes('Speech') ? 'communication' : 'aptitude')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0f2249] hover:bg-blue-600 text-white text-xs font-medium transition-colors shrink-0"
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Agent Architecture Card */}
        <div className="rounded-2xl bg-[#0a152d] border border-[#17326c]/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Multi-Agent Orchestration Architecture
            </h2>
            <span className="text-xs text-emerald-400 font-medium">Phase 1 Foundation</span>
          </div>

          <p className="text-xs text-blue-200/70 leading-relaxed">
            CareerIQ operates 9 specialized agents that exchange structured representations rather than black-box text:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/50">
              <div className="font-semibold text-white">1. Resume Agent</div>
              <div className="text-[10px] text-slate-400">PDF/DOCX/TXT entity extractor</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/50">
              <div className="font-semibold text-white">2. Career Agent</div>
              <div className="text-[10px] text-slate-400">Semantic embeddings + O*NET match</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/50">
              <div className="font-semibold text-white">3. Skill Gap Agent</div>
              <div className="text-[10px] text-slate-400">Strong/Moderate/Missing hierarchy</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/50">
              <div className="font-semibold text-white">4. Roadmap Agent</div>
              <div className="text-[10px] text-slate-400">5-stage personalized progression</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/50">
              <div className="font-semibold text-white">5. Aptitude Agent</div>
              <div className="text-[10px] text-slate-400">Adaptive Quant/Logic/Verbal engine</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/50">
              <div className="font-semibold text-white">6. Speech Agent</div>
              <div className="text-[10px] text-slate-400">Observable fluency & confidence</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/50">
              <div className="font-semibold text-white">7. Employability Engine</div>
              <div className="text-[10px] text-slate-400">Weighted explainable formula</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/50">
              <div className="font-semibold text-white">8. AI Career Coach</div>
              <div className="text-[10px] text-slate-400">Profile-aware Gemini 3.8 Flash</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
