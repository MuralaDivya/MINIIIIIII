import React, { useState } from 'react';
import { UserProfile } from '../types/index.js';
import { Bot, Send, Sparkles, User, Lightbulb, Clock, CheckCircle2 } from 'lucide-react';

interface CoachViewProps {
  profile: UserProfile;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export const CoachView: React.FC<CoachViewProps> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'coach',
      text: `Hello ${profile.name}! I am your CareerIQ AI Coach. I have direct access to your candidate profile, verified technical competencies (${profile.technicalSkills.slice(0, 4).join(', ')}), target role (${profile.targetCareer}), and employability breakdown. How can I guide your career strategy today?`,
      timestamp: 'Just now'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const samplePrompts = [
    `Why was Data Analyst recommended for me?`,
    `What skill should I learn next to improve my readiness?`,
    `Why is my Employability score at its current level?`,
    `What portfolio project should I build to impress recruiters?`,
    `How can I explain my academic research experience on a resume?`
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, topic: 'career_guidance' })
      });
      const data = await response.json();

      const coachMsg: ChatMessage = {
        id: `coach_${Date.now()}`,
        sender: 'coach',
        text: data.reply || (data.error ? `Note: ${data.details || data.error}` : 'Guidance completed.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `coach_err_${Date.now()}`,
          sender: 'coach',
          text: `Service communication error: ${err.message}. Please check connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-[#0a152d] border border-[#17326c]/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-300">
            <Bot className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Profile-Aware AI Career Coach
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-[11px] text-blue-200/60">
              Grounded in candidate profile, O*NET standards, and explainable employability metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested question chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[10px] font-semibold text-blue-200/50 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-400" /> Quick questions:
        </span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="text-xs px-2.5 py-1 rounded-full bg-[#0d1e3f] hover:bg-[#153164] border border-[#17326c] text-blue-200/90 hover:text-white shrink-0 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-[#070e20] border border-[#17326c]/60">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed space-y-1 shadow-sm ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-[#0c1a36] border border-[#17326c]/80 text-blue-100 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                <div className={`text-[9px] text-right ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                  {m.timestamp}
                </div>
              </div>
              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto justify-start animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-300 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1a36] border border-[#17326c]/80 text-xs text-blue-300 rounded-tl-none flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Analyzing candidate profile & synthesizing evidence-grounded response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2 shrink-0 pt-2"
      >
        <input
          type="text"
          placeholder="Ask anything about your career fit, missing skills, or interview readiness..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-[#0a152d] border border-[#17326c] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputPrompt.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </form>
    </div>
  );
};
