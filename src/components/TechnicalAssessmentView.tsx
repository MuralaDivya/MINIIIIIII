import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  Loader2,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { TechnicalAssessmentResult } from '../server/technicalAssessmentEngine.js';

interface TechnicalQuestionClient {
  id: string;
  skillTag: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  difficulty: string;
}

interface TechnicalAssessmentViewProps {
  onComplete: () => void;
  targetCareer?: string;
}

export const TechnicalAssessmentView: React.FC<TechnicalAssessmentViewProps> = ({ 
  onComplete,
  targetCareer = 'Data Analyst / Junior ML Engineer'
}) => {
  const [questions, setQuestions] = useState<TechnicalQuestionClient[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<TechnicalAssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/assessments/technical/questions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed loading technical questions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isTestActive && !results) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTestActive, results]);

  const handleStartTest = () => {
    setIsTestActive(true);
    setElapsedSeconds(0);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setResults(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/assessments/technical/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: selectedAnswers,
          timeSpentSeconds: elapsedSeconds
        })
      });

      if (!res.ok) throw new Error(`Submission failed (HTTP ${res.status})`);
      const data = await res.json();
      setResults(data.result);
      setIsTestActive(false);
      onComplete();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to grade technical assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#17326c]/60">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-6 h-6 text-cyan-400" />
            Technical & Career Readiness Assessment
          </h1>
          <p className="text-xs text-blue-200/70 mt-1">
            Role-grounded technical verification based on target occupation ({targetCareer}) and O*NET required competencies.
          </p>
        </div>

        {isTestActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a152d] border border-cyan-500/40 text-cyan-300 font-mono text-xs">
            <Timer className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>Elapsed: {formatTimer(elapsedSeconds)}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs">Loading role-specific technical assessment...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : !isTestActive && !results ? (
        /* Intro screen */
        <div className="p-8 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 space-y-6 shadow-xl">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono border border-blue-400/30">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Role: {targetCareer}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Full-Stack & Data Readiness Challenge</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consists of <strong>{questions.length} empirical technical questions</strong> spanning SQL Window Functions, Python Data Structures, Pandas Data Cleaning, Machine Learning Metrics, and Data Architecture. Results dynamically update your Technical Skill Readiness component in SQLite.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleStartTest}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30"
            >
              <span>Begin Technical Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : isTestActive && currentQ ? (
        /* Question Runner */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-cyan-400 font-mono">
                {answeredCount}/{questions.length} Answered
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-cyan-400'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#070e20] text-slate-400 border border-[#17326c] hover:border-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-[#0a152d] border border-[#17326c]/80 space-y-6 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Competency: {currentQ.skillTag}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">
                Level: {currentQ.difficulty}
              </span>
            </div>

            <h3 className="text-base font-bold text-white leading-relaxed">
              {currentQ.question}
            </h3>

            {currentQ.codeSnippet && (
              <pre className="p-4 rounded-xl bg-[#070e20] border border-[#17326c] text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {currentQ.codeSnippet}
              </pre>
            )}

            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-blue-600/20 border-cyan-400 text-white font-semibold shadow-md shadow-blue-600/20'
                        : 'bg-[#070e20] border-[#17326c]/80 hover:border-blue-500/50 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'border-cyan-400 bg-cyan-400 text-[#060d1d]' : 'border-slate-500 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span>{opt}</span>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#17326c]/50 flex justify-between items-center">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg bg-[#070e20] border border-[#17326c] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-3">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitTest}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Evaluating Code Mastery...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Technical Assessment</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : results ? (
        /* Results View */
        <div className="space-y-7 animate-fade-in">
          <div className="p-7 rounded-2xl bg-[#0a152d] border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Evaluation Complete & Stored in SQLite
              </span>
              <h2 className="text-2xl font-bold text-white">Technical Readiness Results</h2>
              <p className="text-xs text-blue-200/70">
                Correctly solved {results.correctCount} of {results.totalQuestions} questions in {formatTimer(results.timeSpentSeconds)}.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#070e20] p-4 rounded-xl border border-[#17326c]">
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Technical Score</span>
                <span className="text-3xl font-black text-cyan-400">{results.overallScore}%</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Code2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Skill-by-skill mastery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(results.skillMastery).map(([skill, stats]) => (
              <div key={skill} className="p-3.5 rounded-xl bg-[#0a152d] border border-[#17326c]/60 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{skill}</span>
                  <span className="font-mono text-cyan-400 font-bold">{stats.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stats.percentage >= 70 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Score: {stats.correct}/{stats.total}</span>
                  <span className="capitalize text-slate-300">{stats.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Explanations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-blue-400">
              Technical Derivations & Code Explanations ({results.itemReview.length})
            </h3>

            <div className="space-y-3">
              {results.itemReview.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                    item.isCorrect ? 'bg-[#0a152d] border-emerald-500/30' : 'bg-[#0a152d] border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white">Q{idx + 1}. {item.question}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                      item.isCorrect 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {item.isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {item.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  {item.codeSnippet && (
                    <pre className="p-2.5 rounded bg-[#070e20] text-cyan-300 font-mono text-[11px] overflow-x-auto">
                      {item.codeSnippet}
                    </pre>
                  )}

                  <div className="p-2.5 rounded bg-[#070e20] border border-[#17326c]/40 text-blue-100/90 leading-relaxed text-[11px]">
                    <span className="font-bold text-cyan-300 block mb-0.5">Technical Explanation:</span>
                    {item.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleStartTest}
              className="px-4 py-2 rounded-lg bg-[#0c1a36] hover:bg-[#132750] border border-[#17326c] text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake Technical Assessment
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
