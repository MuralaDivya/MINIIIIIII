import React, { useState, useEffect } from 'react';
import { Database, Search, ExternalLink, Layers, CheckCircle2, RefreshCw } from 'lucide-react';

export const KnowledgeBaseSearchView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('data');
  const [stats, setStats] = useState<{
    onetOccupations: number;
    escoOccupations: number;
    totalOccupations: number;
    skillsTaxonomyCount: number;
    sources: string[];
  } | null>(null);
  const [searchResults, setSearchResults] = useState<{
    occupations: any[];
    skills: any[];
  }>({ occupations: [], skills: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load dataset record counts
    fetch('/api/knowledge-base/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));

    // Initial search
    executeSearch('data');
  }, []);

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/knowledge-base/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-7">
      {/* Header */}
      <div className="pb-4 border-b border-[#17326c]/60">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-cyan-400" />
          Real O*NET 29.1 & ESCO v1.1 Knowledge Base Explorer
        </h1>
        <p className="text-xs text-blue-200/70 mt-1">
          Explore the exact normalized occupational standards and skill taxonomies imported into SQLite.
        </p>
      </div>

      {/* Dataset Counts Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60">
            <span className="text-[10px] text-blue-200/60 uppercase tracking-wider block font-medium">O*NET Occupations</span>
            <span className="text-2xl font-black text-white">{stats.onetOccupations}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">US Dept of Labor (29.1)</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60">
            <span className="text-[10px] text-blue-200/60 uppercase tracking-wider block font-medium">ESCO Occupations</span>
            <span className="text-2xl font-black text-white">{stats.escoOccupations}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">European Commission (v1.1)</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60">
            <span className="text-[10px] text-blue-200/60 uppercase tracking-wider block font-medium">Total Occupations</span>
            <span className="text-2xl font-black text-emerald-400">{stats.totalOccupations}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Standardized Roles</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60">
            <span className="text-[10px] text-blue-200/60 uppercase tracking-wider block font-medium">Skills Taxonomy</span>
            <span className="text-2xl font-black text-cyan-400">{stats.skillsTaxonomyCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Competencies Indexed</span>
          </div>
        </div>
      )}

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search occupations or skills by title or keyword (e.g. data, engineer, python, cloud)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a152d] border border-[#17326c] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Query Knowledge Base</span>
        </button>
      </form>

      {/* Search Results */}
      <div className="space-y-6">
        {/* Occupations matched */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            Matching Occupations ({searchResults.occupations.length})
          </h2>

          <div className="space-y-3">
            {searchResults.occupations.map((occ) => (
              <div key={occ.id} className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {occ.dataset_source} • {occ.code}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">{occ.title}</h3>
                  </div>

                  {occ.source_uri && (
                    <a
                      href={occ.source_uri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{occ.description}</p>

                {occ.skills && occ.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {occ.skills.slice(0, 10).map((s: string) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-[#070e20] text-blue-300 border border-[#17326c]/50">
                        {s}
                      </span>
                    ))}
                    {occ.skills.length > 10 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{occ.skills.length - 10} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Skills matched */}
        {searchResults.skills.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Matching Taxonomy Skills ({searchResults.skills.length})
            </h2>

            <div className="flex flex-wrap gap-1.5 p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60">
              {searchResults.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-2.5 py-1 rounded-lg bg-[#070e20] text-blue-200 border border-[#17326c] text-xs font-medium"
                >
                  {skill.name} <span className="text-[10px] text-slate-500">({skill.dataset_source})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
