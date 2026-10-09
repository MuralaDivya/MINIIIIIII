import React, { useState } from 'react';
import { UserProfile, UserPersona, EducationEntry, ExperienceEntry, ProjectEntry, CertificationEntry } from '../types/index.js';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ProfileViewProps {
  initialProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<boolean>;
  onResetProfile: () => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialProfile,
  onSaveProfile,
  onResetProfile
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [newTechSkill, setNewTechSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const personas: { key: UserPersona; title: string; desc: string }[] = [
    {
      key: 'fresh_graduate',
      title: 'Fresh Graduate',
      desc: 'Unsure which career role best matches academic projects and core foundation.'
    },
    {
      key: 'mid_career_professional',
      title: 'Mid-Career Professional',
      desc: 'Looking to identify skill gaps, upskill in high-value areas, and accelerate promotion.'
    },
    {
      key: 'career_switcher',
      title: 'Career Switcher',
      desc: 'Transitioning from non-technical/current discipline into a target domain.'
    }
  ];

  const handlePersonaChange = (newPersona: UserPersona) => {
    let updated = { ...profile, persona: newPersona };
    if (newPersona === 'career_switcher') {
      updated.currentCareer = 'Mechanical Engineer';
      updated.targetCareer = 'Data Analyst / BI Specialist';
    } else if (newPersona === 'mid_career_professional') {
      updated.currentCareer = 'Junior Software Developer';
      updated.targetCareer = 'Senior Full Stack & Cloud Architect';
    } else {
      updated.currentCareer = 'Student / Junior Developer';
      updated.targetCareer = 'Data Analyst / Junior ML Engineer';
    }
    setProfile(updated);
  };

  const handleAddTechSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTechSkill.trim();
    if (trimmed && !profile.technicalSkills.includes(trimmed)) {
      setProfile({ ...profile, technicalSkills: [...profile.technicalSkills, trimmed] });
      setNewTechSkill('');
    }
  };

  const handleRemoveTechSkill = (skill: string) => {
    setProfile({
      ...profile,
      technicalSkills: profile.technicalSkills.filter(s => s !== skill)
    });
  };

  const handleAddSoftSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSoftSkill.trim();
    if (trimmed && !profile.softSkills.includes(trimmed)) {
      setProfile({ ...profile, softSkills: [...profile.softSkills, trimmed] });
      setNewSoftSkill('');
    }
  };

  const handleRemoveSoftSkill = (skill: string) => {
    setProfile({
      ...profile,
      softSkills: profile.softSkills.filter(s => s !== skill)
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const ok = await onSaveProfile(profile);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#17326c]/60">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-blue-400" />
            Candidate Profile & Career Parameters
          </h1>
          <p className="text-xs text-blue-200/70">
            Stored in persistent SQLite database. Directly informs semantic embeddings, skill gap analysis, and the AI coach.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onResetProfile}
            className="px-3 py-2 bg-[#0c1a36] hover:bg-[#132750] border border-[#17326c] text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Benchmark
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Persisting to SQLite...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile successfully committed to persistent SQLite database! Orchestrator updated.</span>
        </div>
      )}

      {/* 1. Persona Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-blue-200/60 block">
          Select User Archetype
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {personas.map((p) => {
            const isSelected = profile.persona === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePersonaChange(p.key)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-[#0f244e] border-blue-400/80 shadow-md shadow-blue-500/10'
                    : 'bg-[#0a152d] border-[#17326c]/60 hover:border-blue-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {p.title}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                </div>
                <p className="text-[11px] text-blue-200/60 leading-relaxed">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Core Profile Fields */}
      <div className="rounded-2xl bg-[#0a152d] border border-[#17326c]/60 p-6 space-y-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider text-blue-400">
          Basic Candidate Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#070e20] border border-[#17326c] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-2 bg-[#070e20] border border-[#17326c] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-300 block mb-1">Professional Headline</label>
            <input
              type="text"
              value={profile.headline}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              className="w-full px-3 py-2 bg-[#070e20] border border-[#17326c] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Current Role / Field</label>
            <input
              type="text"
              value={profile.currentCareer}
              onChange={(e) => setProfile({ ...profile, currentCareer: e.target.value })}
              className="w-full px-3 py-2 bg-[#070e20] border border-[#17326c] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Target Desired Career</label>
            <input
              type="text"
              value={profile.targetCareer}
              onChange={(e) => setProfile({ ...profile, targetCareer: e.target.value })}
              className="w-full px-3 py-2 bg-[#070e20] border border-[#17326c] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Skills Repository */}
      <div className="rounded-2xl bg-[#0a152d] border border-[#17326c]/60 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-blue-400">
            Verified Skills Taxonomy
          </h2>
          <span className="text-xs text-blue-200/60 font-mono">
            {profile.technicalSkills.length} Technical • {profile.softSkills.length} Soft
          </span>
        </div>

        {/* Technical Skills */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Technical Skills</label>
            <span className="text-[11px] text-slate-400">Used for O*NET match & skill gap matrix</span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl bg-[#070e20] border border-[#17326c]">
            {profile.technicalSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-medium"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveTechSkill(skill)}
                  className="hover:text-rose-400 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddTechSkill} className="flex gap-2">
            <input
              type="text"
              placeholder="Add technical skill (e.g. PyTorch, Docker, Tableau)..."
              value={newTechSkill}
              onChange={(e) => setNewTechSkill(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#070e20] border border-[#17326c] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#17326c] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Skill
            </button>
          </form>
        </div>

        {/* Soft Skills */}
        <div className="space-y-3 pt-2 border-t border-[#17326c]/40">
          <label className="text-xs font-semibold text-slate-300 block">Soft & Interpersonal Skills</label>
          <div className="flex flex-wrap gap-2 min-h-10 p-3 rounded-xl bg-[#070e20] border border-[#17326c]">
            {profile.softSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSoftSkill(skill)}
                  className="hover:text-rose-400 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddSoftSkill} className="flex gap-2">
            <input
              type="text"
              placeholder="Add soft skill (e.g. Stakeholder Management, Agile)..."
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#070e20] border border-[#17326c] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#17326c] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Soft Skill
            </button>
          </form>
        </div>
      </div>

      {/* 4. Experience & Projects Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        <div className="rounded-2xl bg-[#0a152d] border border-[#17326c]/60 p-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            Education
          </h3>
          <div className="space-y-3">
            {profile.education.map((edu) => (
              <div key={edu.id} className="p-3.5 rounded-xl bg-[#070e20] border border-[#17326c]/50 text-xs space-y-1">
                <div className="font-bold text-white">{edu.degree} in {edu.field}</div>
                <div className="text-slate-400">{edu.institution} • Class of {edu.graduationYear}</div>
                {edu.gpa && <div className="text-blue-300 font-mono text-[11px]">GPA: {edu.gpa}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="rounded-2xl bg-[#0a152d] border border-[#17326c]/60 p-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-blue-400" />
            Experience
          </h3>
          <div className="space-y-3">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="p-3.5 rounded-xl bg-[#070e20] border border-[#17326c]/50 text-xs space-y-1">
                <div className="font-bold text-white">{exp.role}</div>
                <div className="text-slate-400">{exp.company} • {exp.duration}</div>
                <p className="text-[11px] text-slate-300/80 leading-relaxed mt-1">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
