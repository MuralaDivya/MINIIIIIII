import React, { useState, useEffect } from 'react';
import { Sidebar, NavItemKey } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { DashboardView } from './components/DashboardView.js';
import { ProfileView } from './components/ProfileView.js';
import { CoachView } from './components/CoachView.js';
import { AgentPreviewView } from './components/AgentPreviewView.js';
import { UserProfile, EmployabilityBreakdown, CareerRecommendation } from './types/index.js';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

import { ResumeUploadView } from './components/ResumeUploadView.js';
import { CareerRecommendationsView } from './components/CareerRecommendationsView.js';
import { SkillGapView } from './components/SkillGapView.js';
import { KnowledgeBaseSearchView } from './components/KnowledgeBaseSearchView.js';
import { AptitudeAssessmentView } from './components/AptitudeAssessmentView.js';
import { CommunicationAssessmentView } from './components/CommunicationAssessmentView.js';
import { TechnicalAssessmentView } from './components/TechnicalAssessmentView.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [selectedGapRole, setSelectedGapRole] = useState<string>('15-2051.01');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    profile: UserProfile;
    employability: EmployabilityBreakdown;
    profileCompletionPercentage: number;
    topCareerMatches: CareerRecommendation[];
    recentAssessments: any;
    recommendedNextActions: any[];
  } | null>(null);
  const [geminiReady, setGeminiReady] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial dashboard and profile data from persistent backend
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Check backend health & Gemini status
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setGeminiReady(Boolean(healthData.geminiConfigured));
      }

      // 2. Fetch Dashboard & Profile
      const dashRes = await fetch('/api/dashboard');
      if (!dashRes.ok) throw new Error(`Dashboard API returned status ${dashRes.status}`);
      const data = await dashRes.json();
      setDashboardData(data);
      setProfile(data.profile);
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setErrorMsg(err.message || 'Failed connecting to backend service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (updatedProfile: UserProfile): Promise<boolean> => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const json = await res.json();
      setProfile(json.profile);
      
      // Refresh dashboard calculations
      const dashRes = await fetch('/api/dashboard');
      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardData(data);
      }
      return true;
    } catch (e: any) {
      console.error('Error saving profile:', e);
      return false;
    }
  };

  const handleResetProfile = async () => {
    try {
      const res = await fetch('/api/profile/reset', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setProfile(json.profile);
        const dashRes = await fetch('/api/dashboard');
        if (dashRes.ok) {
          const data = await dashRes.json();
          setDashboardData(data);
        }
      }
    } catch (e) {
      console.error('Error resetting profile:', e);
    }
  };

  // Section titles and subtitles for header
  const headerMeta: Record<NavItemKey, { title: string; subtitle: string }> = {
    dashboard: { 
      title: 'Career Intelligence Dashboard', 
      subtitle: 'Real-time multi-agent analytics, employability readiness, and career matches' 
    },
    resume: { 
      title: 'Resume Analysis Agent', 
      subtitle: 'Real PDF/DOCX parsing, entity extraction, and SQLite profile persistence' 
    },
    careers: { 
      title: 'Career Recommendation Agent', 
      subtitle: 'Empirical skill coverage & semantic match across 2,516 O*NET and ESCO occupations' 
    },
    'skill-gap': { 
      title: 'Skill Gap Analysis Agent', 
      subtitle: 'Strong vs. moderate vs. missing skills classification with priority ranking' 
    },
    knowledge: {
      title: 'Occupations & Skills Knowledge Base',
      subtitle: '1,016 O*NET 29.1 roles + 1,500 ESCO v1.1 roles + 10,000 skills taxonomy'
    },
    roadmap: { 
      title: 'Learning Roadmap Agent', 
      subtitle: 'Adaptive 5-stage progression derived from empirical skill deficits' 
    },
    aptitude: { 
      title: 'Aptitude Assessment Agent', 
      subtitle: 'Adaptive diagnostic across Quantitative, Logical, Verbal, and Data Interpretation' 
    },
    communication: { 
      title: 'Communication Assessment Agent', 
      subtitle: 'Speech-to-text NLP analysis, WPM delivery, and STAR narrative structure' 
    },
    technical: {
      title: 'Technical & Role Readiness Assessment',
      subtitle: 'Targeted code and scenario evaluation mapped to O*NET occupational competencies'
    },
    transition: { 
      title: 'Career Transition Agent', 
      subtitle: 'Cross-role transferable skill delta and pivot strategy engine' 
    },
    coach: { 
      title: 'AI Career Coach', 
      subtitle: 'Grounded conversational career guidance powered by Gemini 3.8 Flash' 
    },
    profile: { 
      title: 'Candidate Profile & Parameters', 
      subtitle: 'Persistent SQLite candidate attributes, skills taxonomy, and archetypes' 
    }
  };

  return (
    <div className="flex min-h-screen bg-[#060d1d] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        systemHealthy={!errorMsg}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={headerMeta[currentTab]?.title || 'CareerIQ AI'}
          subtitle={headerMeta[currentTab]?.subtitle || 'Intelligent Multi-Agent Platform'}
          profile={profile}
          onOpenProfile={() => setCurrentTab('profile')}
          geminiReady={geminiReady}
        />

        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs font-medium">Bootstrapping CareerIQ multi-agent database & metrics...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-8 max-w-lg mx-auto text-center space-y-4 mt-12">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Connection Error</h2>
              <p className="text-xs text-slate-400">{errorMsg}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
              </button>
            </div>
          ) : currentTab === 'dashboard' && dashboardData ? (
            <DashboardView
              profile={dashboardData.profile}
              employability={dashboardData.employability}
              completionPercentage={dashboardData.profileCompletionPercentage}
              careerMatches={dashboardData.topCareerMatches}
              recentAssessments={dashboardData.recentAssessments}
              recommendedActions={dashboardData.recommendedNextActions}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          ) : currentTab === 'resume' ? (
            <ResumeUploadView
              onProfileUpdated={(updated) => {
                setProfile(updated);
                loadData();
              }}
              onNavigateToCareers={() => setCurrentTab('careers')}
            />
          ) : currentTab === 'careers' ? (
            <CareerRecommendationsView
              onSelectRoleForGap={(roleCode) => {
                setSelectedGapRole(roleCode);
                setCurrentTab('skill-gap');
              }}
            />
          ) : currentTab === 'skill-gap' ? (
            <SkillGapView
              initialTarget={selectedGapRole || profile?.targetCareer || '15-2051.01'}
            />
          ) : currentTab === 'knowledge' ? (
            <KnowledgeBaseSearchView />
          ) : currentTab === 'aptitude' ? (
            <AptitudeAssessmentView onComplete={loadData} />
          ) : currentTab === 'communication' ? (
            <CommunicationAssessmentView onComplete={loadData} />
          ) : currentTab === 'technical' ? (
            <TechnicalAssessmentView onComplete={loadData} targetCareer={profile?.targetCareer} />
          ) : currentTab === 'profile' && profile ? (
            <ProfileView
              initialProfile={profile}
              onSaveProfile={handleSaveProfile}
              onResetProfile={handleResetProfile}
            />
          ) : currentTab === 'coach' && profile ? (
            <CoachView profile={profile} />
          ) : (
            <AgentPreviewView moduleKey={currentTab} onNavigate={(tab) => setCurrentTab(tab)} />
          )}
        </main>
      </div>
    </div>
  );
}
