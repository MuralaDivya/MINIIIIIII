import React from 'react';
import { NavItemKey } from './Sidebar.js';
import { 
  FileText, 
  Briefcase, 
  Split, 
  Compass, 
  BrainCircuit, 
  Mic, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  Database,
  Code,
  Cpu
} from 'lucide-react';

interface AgentPreviewViewProps {
  moduleKey: NavItemKey;
  onNavigate: (tab: NavItemKey) => void;
}

export const AgentPreviewView: React.FC<AgentPreviewViewProps> = ({ moduleKey, onNavigate }) => {
  const metadata: Record<NavItemKey, {
    title: string;
    phase: string;
    icon: any;
    description: string;
    algorithm: string;
    dataset: string;
    inputs: string[];
    outputs: string[];
  }> = {
    dashboard: { title: 'Dashboard', phase: 'Phase 1', icon: Layers, description: '', algorithm: '', dataset: '', inputs: [], outputs: [] },
    profile: { title: 'Profile', phase: 'Phase 1', icon: Layers, description: '', algorithm: '', dataset: '', inputs: [], outputs: [] },
    coach: { title: 'AI Coach', phase: 'Phase 1', icon: Layers, description: '', algorithm: '', dataset: '', inputs: [], outputs: [] },
    knowledge: { title: 'Knowledge Base', phase: 'Phase 2', icon: Database, description: '', algorithm: '', dataset: '', inputs: [], outputs: [] },
    technical: { title: 'Technical Readiness', phase: 'Phase 3', icon: Cpu, description: '', algorithm: '', dataset: '', inputs: [], outputs: [] },
    resume: {
      title: 'Resume Analysis Agent',
      phase: 'Phase 3',
      icon: FileText,
      description: 'Ingests PDF, DOCX, and TXT resumes without inventing fake content. Extracts structured technical skills, soft skills, projects, degrees, certifications, and domain expertise.',
      algorithm: 'Entity recognition, regex pattern matching, semantic skill extraction & normalization against ESCO taxonomy',
      dataset: 'ESCO Skills Taxonomy & O*NET Competencies',
      inputs: ['Raw Resume (PDF, DOCX, TXT)', 'Parsing configuration'],
      outputs: ['Structured Candidate Profile JSON', 'Extracted Skills List', 'Timeline Data']
    },
    careers: {
      title: 'Career Recommendation Agent',
      phase: 'Phase 4',
      icon: Briefcase,
      description: 'Generates explainable top-5 career rankings using vector embeddings, cosine semantic similarity, and skill coverage rather than keyword heuristics.',
      algorithm: 'sentence-transformers/all-MiniLM-L6-v2 vector embeddings + Cosine Similarity + Weighted Skill Coverage',
      dataset: 'O*NET 29.1 Standard Occupational Classification (SOC) & ESCO Occupations',
      inputs: ['User Profile Vector', 'Occupational Skill Profiles'],
      outputs: ['Top 5 Ranked Careers', 'Semantic Match %', 'Skill Coverage %', 'Evidence Explanations']
    },
    'skill-gap': {
      title: 'Skill Gap Analysis Agent',
      phase: 'Phase 5',
      icon: Split,
      description: 'Compares user skills against target career occupational standards, categorizing competencies into Strong, Moderate, and Missing with importance priority.',
      algorithm: 'Normalized set intersection, taxonomy distance mapping, priority ranking by frequency in occupation',
      dataset: 'O*NET 29.1 Skills, Knowledge & Work Activities Hierarchy',
      inputs: ['Target Occupation Code', 'Verified User Skills'],
      outputs: ['Strong Competencies', 'Moderate Competencies', 'Missing Critical Skills', 'Priority Action Matrix']
    },
    roadmap: {
      title: 'Learning Roadmap Agent',
      phase: 'Phase 6',
      icon: Compass,
      description: 'Synthesizes an adaptive 5-stage progression (Foundation, Core Skills, Advanced Skills, Projects, Job Readiness) dynamically generated from individual skill gaps.',
      algorithm: 'Prerequisite dependency DAG (Directed Acyclic Graph) + Gemini explanation synthesizer',
      dataset: 'Curated Open Learning Resources, GitHub Portfolio Benchmarks',
      inputs: ['Prioritized Missing Skills', 'Candidate Experience Level', 'Target Role'],
      outputs: ['Staged Milestone Timeline', 'Recommended Projects', 'Resource Categories']
    },
    aptitude: {
      title: 'Aptitude Assessment Agent',
      phase: 'Phase 7',
      icon: BrainCircuit,
      description: 'Interactive adaptive test across Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Data Interpretation with dynamic difficulty scaling.',
      algorithm: 'Item Response Theory (IRT) difficulty step scaling + Actual accuracy calculation',
      dataset: 'Standardized Psychometric & Analytical Aptitude Question Bank with validated solutions',
      inputs: ['User Question Responses', 'Response Latency'],
      outputs: ['Category-wise Accuracy %', 'Adaptive Level Reached', 'Weak Areas Diagnostic']
    },
    communication: {
      title: 'Communication Assessment Agent',
      phase: 'Phase 8',
      icon: Mic,
      description: 'Analyzes spoken audio from interview answers via speech-to-text. Evaluates grammar, vocabulary, filler word frequency, speech rate (WPM), and provides an observable Communication Confidence Indicator.',
      algorithm: 'Whisper / Audio transcription + NLP grammatical analysis + Lexical diversity & WPM counting',
      dataset: 'Interview question prompts & speech fluency benchmarks',
      inputs: ['Audio Waveform / Speech Input', 'Selected Interview Question'],
      outputs: ['Observable Confidence Indicator', 'Words Per Minute (WPM)', 'Filler Word Count', 'Grammar Score']
    },
    transition: {
      title: 'Career Transition Agent',
      phase: 'Phase 10',
      icon: TrendingUp,
      description: 'Enables selecting Current Career and Target Career to compute transferable skills, net deficit, transition difficulty, and bespoke bridge roadmap.',
      algorithm: 'Cross-occupational skill graph vector alignment & transition delta calculus',
      dataset: 'O*NET Related Occupations Matrix & ESCO Transversal Skills',
      inputs: ['Current Occupation Code', 'Target Occupation Code'],
      outputs: ['Transferable Skills', 'Deficit Skills', 'Transition Difficulty Rating', 'Bridge Sequence']
    }
  };

  const currentMeta = metadata[moduleKey] || metadata.careers;
  const Icon = currentMeta.icon;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-300">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{currentMeta.title}</h1>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {currentMeta.phase}
                </span>
              </div>
              <p className="text-xs text-blue-200/60 font-medium">Architectural Specification & Agent Contract</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0f2249] hover:bg-[#17326c] text-blue-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        <p className="text-sm text-blue-100/90 leading-relaxed">
          {currentMeta.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#17326c]/50 text-xs">
          <div className="p-3.5 rounded-xl bg-[#070e20] border border-[#17326c]/50 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              Underlying Algorithm & Engine
            </div>
            <p className="text-slate-300">{currentMeta.algorithm}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#070e20] border border-[#17326c]/50 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Empirical Dataset Source
            </div>
            <p className="text-slate-300">{currentMeta.dataset}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="space-y-2">
            <div className="font-semibold text-slate-300">Expected Agent Inputs:</div>
            <div className="space-y-1">
              {currentMeta.inputs.map((inp, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{inp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-300">Structured Agent Outputs:</div>
            <div className="space-y-1">
              {currentMeta.outputs.map((out, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{out}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-center justify-between">
          <span>Phase 1 foundation is established and ready to execute this module upon prompt.</span>
          <span className="font-mono text-[10px] text-cyan-300">Status: Contract Ready</span>
        </div>
      </div>
    </div>
  );
};
