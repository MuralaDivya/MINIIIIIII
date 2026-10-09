import React, { useState, useEffect } from 'react';
import { SkillGapItem } from '../types/index.js';
import { 
  Split, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  TrendingUp,
  Database,
  ArrowRight
} from 'lucide-react';

interface SkillGapViewProps {
  initialTarget?: string;
  onNavigateToRoadmap?: () => void;
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({
  initialTarget = '15-2051.01',
  onNavigateToRoadmap
}) => {
  const [targetCode, setTargetCode] = useState(initialTarget);
  const [searchQuery, setSearchQuery] = useState('');
  const [gapData, setGapData] = useState<{
    occupation: { title: string; code: string; datasetSource: string; description: string; sourceUri?: string };
    strongSkills: SkillGapItem[];
    moderateSkills: SkillGapItem[];
    missingSkills: SkillGapItem[];
    totalRequiredCount: number;
    gapCoveragePercent: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSkillGap = async (code: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/career/skill-gap?target=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGapData(data);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load skill gap data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillGap(targetCode);
  }, [targetCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setTargetCode(searchQuery.trim());
      fetchSkillGap(searchQuery.trim());
    }
  };

  const priorityColors = {
    critical: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    high: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-7">
      {/* Header */}
      <div className="pb-4 border-b border-[#17326c]/60">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Split className="w-6 h-6 text-blue-400" />
          Skill Gap Analysis Agent
        </h1>
        <p className="text-xs text-blue-200/70 mt-1">
          Compares verified candidate skills against official O*NET 29.1 and ESCO v1.1 occupational requirements. Categorized into Strong, Moderate, and Missing with priority weighting.
        </p>
      </div>

      {/* Target Selector & Search Bar */}
      <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Quick Target Roles:</span>
          <button
            onClick={() => { setTargetCode('15-2051.01'); }}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              targetCode.includes('15-2051.01') ? 'bg-blue-600 text-white' : 'bg-[#070e20] text-slate-300 border border-[#17326c]'
            }`}
          >
            Data Analyst (O*NET)
          </button>
          <button
            onClick={() => { setTargetCode('15-1252.00'); }}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              targetCode.includes('15-1252.00') ? 'bg-blue-600 text-white' : 'bg-[#070e20] text-slate-300 border border-[#17326c]'
            }`}
          >
            Software Engineer
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search role code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-[#070e20] border border-[#17326c] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Analyze
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <p className="text-xs">Evaluating occupational skill matrix against candidate profile...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      ) : gapData ? (
        <div className="space-y-6">
          {/* Occupation Details Card */}
          <div className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {gapData.occupation.datasetSource} • {gapData.occupation.code}
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">{gapData.occupation.title}</h2>
              </div>

              <div className="bg-[#070e20] p-3 rounded-xl border border-[#17326c]/60 text-right shrink-0">
                <span className="text-xs text-slate-400 block">Gap Coverage</span>
                <span className="text-2xl font-black text-cyan-400">{gapData.gapCoveragePercent}%</span>
              </div>
            </div>

            <p className="text-xs text-blue-100/80 leading-relaxed">
              {gapData.occupation.description}
            </p>

            {/* Coverage Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Verified Skills: {gapData.strongSkills.length} of {gapData.totalRequiredCount}</span>
                <span>Missing: {gapData.missingSkills.length} skills</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${(gapData.strongSkills.length / Math.max(1, gapData.totalRequiredCount)) * 100}%` }}
                />
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(gapData.moderateSkills.length / Math.max(1, gapData.totalRequiredCount)) * 100}%` }}
                />
                <div 
                  className="h-full bg-amber-500/40" 
                  style={{ width: `${(gapData.missingSkills.length / Math.max(1, gapData.totalRequiredCount)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Missing Skills Matrix (Critical Focus) */}
          <div className="p-6 rounded-2xl bg-[#0a152d] border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Missing Competencies & Required Knowledge ({gapData.missingSkills.length})
              </h3>
              <span className="text-[11px] text-slate-400">Sourced directly from occupational benchmark</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gapData.missingSkills.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#070e20] border border-[#17326c]/60 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white">△ {item.skillName}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${priorityColors[item.importance]}`}>
                      {item.importance}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.reason}</p>
                  <div className="text-[10px] text-cyan-400/80 font-mono">
                    Industry Frequency: {item.frequencyInOccupation}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strong & Moderate Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strong Skills */}
            <div className="p-6 rounded-2xl bg-[#0a152d] border border-emerald-500/30 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Strong Verified Competencies ({gapData.strongSkills.length})
              </h3>
              <div className="space-y-2">
                {gapData.strongSkills.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/40 text-xs flex items-center justify-between">
                    <span className="text-slate-200 font-semibold">✓ {item.skillName}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Verified</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Moderate Skills */}
            <div className="p-6 rounded-2xl bg-[#0a152d] border border-blue-500/30 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-blue-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Moderate / Transferable Skills ({gapData.moderateSkills.length})
              </h3>
              {gapData.moderateSkills.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3">No secondary transferable skills recorded.</p>
              ) : (
                <div className="space-y-2">
                  {gapData.moderateSkills.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#070e20] border border-[#17326c]/40 text-xs flex items-center justify-between">
                      <span className="text-slate-200 font-semibold">~ {item.skillName}</span>
                      <span className="text-[10px] text-blue-300 font-mono">Transferable</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
