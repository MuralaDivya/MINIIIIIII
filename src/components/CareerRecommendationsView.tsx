import React, { useState, useEffect } from 'react';
import { CareerRecommendation } from '../types/index.js';
import { 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Filter, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Layers,
  Database
} from 'lucide-react';

interface CareerRecommendationsViewProps {
  onSelectRoleForGap: (roleCode: string) => void;
}

export const CareerRecommendationsView: React.FC<CareerRecommendationsViewProps> = ({
  onSelectRoleForGap
}) => {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [filterSource, setFilterSource] = useState<'all' | 'O*NET 29.1' | 'ESCO v1.1'>('all');
  const [sortBy, setSortBy] = useState<'match' | 'semantic' | 'coverage'>('match');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/career/recommendations');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed loading recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filtered = recommendations
    .filter(r => filterSource === 'all' || r.datasetSource === filterSource)
    .sort((a, b) => {
      if (sortBy === 'semantic') return b.semanticSimilarity - a.semanticSimilarity;
      if (sortBy === 'coverage') return b.skillCoverageScore - a.skillCoverageScore;
      return b.matchScore - a.matchScore;
    });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#17326c]/60">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" />
            Explainable Career Intelligence & Recommendations
          </h1>
          <p className="text-xs text-blue-200/70 mt-1">
            Grounded in 2,516 real occupational standards from O*NET 29.1 and ESCO v1.1. No synthetic scores.
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="px-3.5 py-2 bg-[#0c1a36] hover:bg-[#132750] border border-[#17326c] text-blue-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Recalculate Matches
        </button>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Dataset Source:</span>
          {(['all', 'O*NET 29.1', 'ESCO v1.1'] as const).map(source => (
            <button
              key={source}
              onClick={() => setFilterSource(source)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterSource === source
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#070e20] text-slate-300 hover:text-white border border-[#17326c]'
              }`}
            >
              {source === 'all' ? 'All (2,516 Roles)' : source}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 bg-[#070e20] border border-[#17326c] rounded-md text-white focus:outline-none focus:border-blue-500"
          >
            <option value="match">Highest Career Fit Score</option>
            <option value="coverage">Skill Coverage Score</option>
            <option value="semantic">Semantic Relevance</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-xs">Computing cosine similarity & skill intersection against 2,516 occupational standards...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
          {errorMsg}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-[#0a152d] rounded-xl border border-[#17326c]">
          No occupations matched the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((career) => (
            <div
              key={career.id}
              className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-5 shadow-sm"
            >
              <div>
                {/* Source & Code Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-400" />
                      {career.datasetSource} • {career.occupationCode}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">{career.matchScore}%</span>
                    <span className="text-[10px] block text-slate-400 font-mono">Fit Score</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{career.title}</h3>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[#070e20] border border-[#17326c]/50 text-[11px] mb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Skill Coverage</span>
                    <span className="text-white font-bold">{career.skillCoverageScore}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Semantic Fit</span>
                    <span className="text-white font-bold">{career.semanticSimilarity}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Profile Relev.</span>
                    <span className="text-white font-bold">{career.profileRelevanceScore}%</span>
                  </div>
                </div>

                {/* Matched Skills */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Matched Competencies ({career.matchedSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {career.matchedSkills.slice(0, 8).map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        ✓ {s}
                      </span>
                    ))}
                    {career.matchedSkills.length > 8 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{career.matchedSkills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Identified Skill Gaps ({career.missingSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {career.missingSkills.slice(0, 6).map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        △ {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Evidence Note */}
                <div className="p-3 rounded-xl bg-[#070e20] border border-[#17326c]/60 text-xs text-blue-100/90 leading-relaxed mb-3">
                  <span className="font-semibold text-cyan-300 block mb-0.5 text-[11px]">Matching Evidence:</span>
                  {career.whyRecommended}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-[#17326c]/50 flex items-center justify-between gap-3">
                <a
                  href={
                    career.datasetSource === 'O*NET 29.1'
                      ? `https://www.onetonline.org/link/summary/${career.occupationCode}`
                      : `https://esco.ec.europa.eu/en/classification/occupation`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Official Standard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => onSelectRoleForGap(career.occupationCode)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <span>Skill Gap Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
