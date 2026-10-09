import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Timer, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RotateCcw, 
  Loader2,
  Volume2,
  FileText,
  TrendingUp,
  MessageSquareQuote
} from 'lucide-react';
import { CommunicationAnalysisResult, COMMUNICATION_PROMPTS } from '../server/communicationEngine.js';

interface CommunicationAssessmentViewProps {
  onComplete: () => void;
}

export const CommunicationAssessmentView: React.FC<CommunicationAssessmentViewProps> = ({ onComplete }) => {
  const [selectedPromptId, setSelectedPromptId] = useState('comm_star_01');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CommunicationAnalysisResult | null>(null);
  const [speechApiSupported, setSpeechApiSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Initialize Web Speech Recognition API if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setErrorMsg('Microphone access not granted. You can type or paste your response in the transcript box below.');
          }
          setIsRecording(false);
        };

        recognition.onend = () => {
          // Keep recording state synced
        };

        recognitionRef.current = recognition;
      } catch (e) {
        setSpeechApiSupported(false);
      }
    } else {
      setSpeechApiSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRecording]);

  const handleStartRecording = () => {
    setErrorMsg(null);
    setResults(null);
    if (!transcript) {
      setRecordingSeconds(0);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        // If already started or permission issue
        setIsRecording(true);
      }
    } else {
      // Speech API not supported on this browser/environment
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  const handleAnalyze = async () => {
    if (transcript.trim().length < 15) {
      setErrorMsg('Please record or type at least 15 characters of speech.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/assessments/communication/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          durationSeconds: Math.max(15, recordingSeconds),
          promptId: selectedPromptId
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || 'Analysis failed');
      }

      const data = await res.json();
      setResults(data.result);
      onComplete();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to analyze communication transcript.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const currentPrompt = COMMUNICATION_PROMPTS.find(p => p.id === selectedPromptId) || COMMUNICATION_PROMPTS[0];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#17326c]/60">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-cyan-400" />
            Communication & Speech Assessment Agent
          </h1>
          <p className="text-xs text-blue-200/70 mt-1">
            Real speech-to-text NLP analysis measuring delivery pacing (WPM), verbal filler density, and STAR narrative structure.
          </p>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Recording: {formatTimer(recordingSeconds)}</span>
          </div>
        )}
      </div>

      {/* Prompt Selector */}
      <div className="p-6 rounded-2xl bg-[#0a152d] border border-[#17326c]/70 space-y-4">
        <span className="text-[10px] text-blue-200/60 uppercase tracking-wider font-semibold block">
          Select Interview Scenario Prompt
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {COMMUNICATION_PROMPTS.map(p => (
            <div
              key={p.id}
              onClick={() => { setSelectedPromptId(p.id); setResults(null); }}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                selectedPromptId === p.id
                  ? 'bg-blue-600/20 border-cyan-400 text-white shadow-md shadow-blue-600/20'
                  : 'bg-[#070e20] border-[#17326c]/60 hover:border-blue-500/50 text-slate-300'
              }`}
            >
              <div>
                <span className="font-bold block mb-1">{p.title}</span>
                <span className="text-[10px] text-slate-400 block mb-2 capitalize">{p.category.replace('_', ' ')}</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">Target: ~{p.targetDurationSeconds}s</span>
            </div>
          ))}
        </div>

        {/* Selected prompt presentation */}
        <div className="p-4 rounded-xl bg-[#070e20] border border-[#17326c] flex items-start gap-3">
          <MessageSquareQuote className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-white block">Interview Question:</span>
            <p className="text-blue-100/90 leading-relaxed italic">"{currentPrompt.prompt}"</p>
          </div>
        </div>
      </div>

      {/* Recording & Transcript Studio */}
      <div className="p-7 rounded-2xl bg-[#0a152d] border border-[#17326c]/80 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#17326c]/50">
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
              >
                <Mic className="w-4 h-4 text-white" />
                <span>Start Microphone Recording</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/30 animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Recording</span>
              </button>
            )}

            <span className="text-xs text-slate-400 font-mono">
              Duration: {formatTimer(recordingSeconds)}
            </span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || transcript.trim().length < 15}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Speech & STAR Flow...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Spoken Response</span>
              </>
            )}
          </button>
        </div>

        {/* Live Audio Waves Indicator */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1 py-3 bg-[#070e20] rounded-xl border border-cyan-500/30">
            {[40, 70, 90, 60, 80, 100, 50, 75, 45, 85].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-cyan-400 rounded-full animate-pulse"
                style={{ height: `${h * 0.3}px`, animationDelay: `${i * 100}ms` }}
              />
            ))}
            <span className="text-xs text-cyan-300 font-medium ml-3">Listening & transcribing spoken speech...</span>
          </div>
        )}

        {/* Transcript editor */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Spoken Transcript
            </span>
            <span className="text-slate-400">
              Words: {transcript.trim().split(/\s+/).filter(Boolean).length} | Characters: {transcript.length}
            </span>
          </div>
          <textarea
            rows={5}
            placeholder={
              speechApiSupported 
                ? "Click 'Start Microphone Recording' to speak, or type/paste your spoken answer here..."
                : "Speech API not available in this environment. Type or paste your spoken answer here to evaluate..."
            }
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full p-4 bg-[#070e20] border border-[#17326c] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans leading-relaxed"
          />
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Analysis Results View */}
      {results && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Score Banner */}
          <div className="p-7 rounded-2xl bg-[#0a152d] border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Evaluation Complete & Stored in SQLite
              </span>
              <h2 className="text-2xl font-bold text-white">Communication Diagnostic Results</h2>
              <p className="text-xs text-blue-200/70">
                Evaluated across {results.wordCount} spoken words over {results.durationSeconds}s duration.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#070e20] p-4 rounded-xl border border-[#17326c]">
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Communication Score</span>
                <span className="text-3xl font-black text-cyan-400">{results.overallScore}%</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Observable Delivery Metrics (WPM, Fillers, STAR) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {/* Pacing WPM */}
            <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 space-y-1.5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Speaking Rate</span>
              <span className="text-2xl font-black text-white">{results.wordsPerMinute} <span className="text-xs font-normal text-slate-400">WPM</span></span>
              <span className={`text-[10px] block font-medium capitalize ${
                results.wpmAssessment === 'optimal' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                Pacing: {results.wpmAssessment.replace('_', ' ')} (Benchmark: 125–160)
              </span>
            </div>

            {/* Filler Word Density */}
            <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 space-y-1.5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Filler Density</span>
              <span className={`text-2xl font-black ${results.fillerWordDensity <= 3.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {results.fillerWordDensity}%
              </span>
              <span className="text-[10px] text-slate-400 block">
                {results.fillerWordsCount} filler words detected
              </span>
            </div>

            {/* STAR Structure */}
            <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 space-y-1.5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">STAR Structure</span>
              <span className="text-2xl font-black text-cyan-400">{results.structureStarScore}%</span>
              <span className="text-[10px] text-slate-400 block">Situation / Action / Result Flow</span>
            </div>

            {/* Content Relevance */}
            <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 space-y-1.5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Clarity & Response</span>
              <span className="text-2xl font-black text-blue-400">{results.contentRelevanceScore}%</span>
              <span className="text-[10px] text-slate-400 block">Direct Engagement & Tone</span>
            </div>
          </div>

          {/* Detected Filler Words List */}
          {results.detectedFillerWords.length > 0 && (
            <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 space-y-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Observed Filler Words in Spoken Transcript:
              </span>
              <div className="flex flex-wrap gap-2">
                {results.detectedFillerWords.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded bg-[#070e20] text-amber-300 border border-amber-500/30 text-xs font-mono">
                    "{f.word}": {f.count}x
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualitative Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0a152d] border border-emerald-500/30 space-y-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Observable Strengths
              </h3>
              <ul className="text-xs space-y-1 text-slate-200">
                {results.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">✓ {s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#0a152d] border border-amber-500/30 space-y-2">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Actionable Coaching Tips
              </h3>
              <ul className="text-xs space-y-1 text-slate-200">
                {results.actionableCoachingTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">→ {tip}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Evidence Summary */}
          <div className="p-4 rounded-xl bg-[#070e20] border border-[#17326c] text-xs text-blue-100/90 leading-relaxed">
            <span className="font-bold text-cyan-300 block mb-1">Evaluator Evidence Summary:</span>
            {results.evidenceSummary}
          </div>
        </div>
      )}
    </div>
  );
};
