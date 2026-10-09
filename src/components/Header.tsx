import React from 'react';
import { UserProfile, UserPersona } from '../types/index.js';
import { Sparkles, UserCheck, ShieldCheck, ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  profile: UserProfile | null;
  onOpenProfile: () => void;
  geminiReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  profile,
  onOpenProfile,
  geminiReady
}) => {
  const personaLabels: Record<UserPersona, { label: string; color: string }> = {
    fresh_graduate: { label: 'Fresh Graduate', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
    mid_career_professional: { label: 'Mid-Career Professional', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
    career_switcher: { label: 'Career Switcher', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' }
  };

  const personaMeta = profile ? personaLabels[profile.persona] : personaLabels.fresh_graduate;

  return (
    <header className="h-16 px-8 border-b border-[#17326c]/60 bg-[#0a152d]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-blue-200/60 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Gemini Status Chip */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          geminiReady 
            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' 
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Gemini 3.8 Flash {geminiReady ? 'Active' : 'Standby'}</span>
        </div>

        {/* User Persona & Profile button */}
        {profile && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0f2249] hover:bg-[#17326c] border border-[#1f4591]/50 transition-all text-left group"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
              {profile.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                {profile.name}
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-normal ${personaMeta.color}`}>
                  {personaMeta.label}
                </span>
              </div>
              <div className="text-[10px] text-blue-200/60 truncate max-w-[140px]">
                {profile.targetCareer}
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        )}
      </div>
    </header>
  );
};
