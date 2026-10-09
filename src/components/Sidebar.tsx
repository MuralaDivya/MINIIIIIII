import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Split, 
  Compass, 
  BrainCircuit, 
  Mic, 
  TrendingUp, 
  Bot, 
  User, 
  Database,
  Cpu
} from 'lucide-react';

export type NavItemKey = 
  | 'dashboard' 
  | 'resume' 
  | 'careers' 
  | 'skill-gap' 
  | 'knowledge'
  | 'aptitude' 
  | 'communication' 
  | 'technical'
  | 'roadmap' 
  | 'transition' 
  | 'coach' 
  | 'profile';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  systemHealthy: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, systemHealthy }) => {
  const navItems = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard, badge: undefined },
    { key: 'resume' as NavItemKey, label: 'Resume Parser', icon: FileText, badge: 'PDF/DOCX' },
    { key: 'careers' as NavItemKey, label: 'Career Matches', icon: Briefcase, badge: 'O*NET+ESCO' },
    { key: 'skill-gap' as NavItemKey, label: 'Skill Gap Matrix', icon: Split, badge: 'Active' },
    { key: 'knowledge' as NavItemKey, label: 'O*NET/ESCO Data', icon: Database, badge: '2,516' },
    { key: 'aptitude' as NavItemKey, label: 'Aptitude Test', icon: BrainCircuit, badge: 'Diagnostic' },
    { key: 'communication' as NavItemKey, label: 'Communication Test', icon: Mic, badge: 'Live NLP' },
    { key: 'technical' as NavItemKey, label: 'Technical Readiness', icon: Cpu, badge: 'Role Test' },
    { key: 'roadmap' as NavItemKey, label: 'Learning Roadmap', icon: Compass, badge: 'Active' },
    { key: 'transition' as NavItemKey, label: 'Career Transition', icon: TrendingUp, badge: 'Active' },
    { key: 'coach' as NavItemKey, label: 'AI Career Coach', icon: Bot, badge: 'Live AI' },
    { key: 'profile' as NavItemKey, label: 'Candidate Profile', icon: User, badge: 'SQLite' },
  ];

  return (
    <aside className="w-64 bg-[#0a152d] border-r border-[#17326c]/60 flex flex-col h-screen shrink-0 sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#17326c]/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              CareerIQ <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-medium border border-blue-400/30">AI</span>
            </h1>
            <p className="text-[11px] text-blue-200/60 font-medium">Multi-Agent Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-200/40">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#0f2249]/70'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badge === 'Live AI'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-[#17326c]/70 text-blue-300/80'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-[#17326c]/60 bg-[#070e20]">
        <div className="p-2.5 rounded-lg bg-[#0c1a36] border border-[#17326c]/50 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" /> Persistent DB
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SQLite (Disk)
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Orchestrator:</span>
            <span className="text-blue-300 font-mono text-[10px]">9 Agents Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
