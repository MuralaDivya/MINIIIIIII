import React, { useState, useRef } from 'react';
import { UserProfile } from '../types/index.js';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Briefcase, 
  GraduationCap, 
  Layers, 
  FolderGit2,
  Award
} from 'lucide-react';

interface ResumeUploadViewProps {
  onProfileUpdated: (updatedProfile: UserProfile) => void;
  onNavigateToCareers: () => void;
}

export const ResumeUploadView: React.FC<ResumeUploadViewProps> = ({
  onProfileUpdated,
  onNavigateToCareers
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<{
    extracted: any;
    filename?: string;
    filesize?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a PDF, DOCX, or TXT resume file.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      setParseResult({
        extracted: data.extracted,
        filename: data.filename,
        filesize: data.filesize
      });
      onProfileUpdated(data.profile);
    } catch (err: any) {
      console.error('Resume upload failed:', err);
      setErrorMsg(err.message || 'Failed to parse resume document.');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (pasteText.trim().length < 50) {
      setErrorMsg('Please enter at least 50 characters of resume text.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/resume/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: pasteText })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || 'Parsing failed');
      }

      const data = await res.json();
      setParseResult({
        extracted: data.extracted,
        filename: 'Pasted Document',
        filesize: pasteText.length
      });
      onProfileUpdated(data.profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse pasted resume text.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-[#17326c]/60">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          Real Resume Analysis Agent
        </h1>
        <p className="text-xs text-blue-200/70 mt-1">
          Ingests real PDF and DOCX files without fake mock heuristics. Extracts candidate education, experience, technical skills, projects, and certifications into structured SQLite state.
        </p>
      </div>

      {/* Input Mode Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setInputMode('upload'); setErrorMsg(null); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            inputMode === 'upload'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-[#0a152d] text-slate-300 hover:text-white border border-[#17326c]'
          }`}
        >
          Upload PDF / DOCX File
        </button>
        <button
          onClick={() => { setInputMode('paste'); setErrorMsg(null); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            inputMode === 'paste'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-[#0a152d] text-slate-300 hover:text-white border border-[#17326c]'
          }`}
        >
          Paste Raw Resume Text
        </button>
      </div>

      {/* Upload or Paste Container */}
      <div className="p-7 rounded-2xl bg-[#0a152d] border border-[#17326c]/60 space-y-5">
        {inputMode === 'upload' ? (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#1f4591] hover:border-blue-400 bg-[#070e20] rounded-xl p-8 text-center cursor-pointer transition-all space-y-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 group-hover:bg-blue-600/30 text-blue-400 flex items-center justify-center mx-auto transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  {selectedFile ? selectedFile.name : 'Click to select or drag & drop resume file'}
                </span>
                <span className="text-xs text-blue-200/60 block mt-1">
                  Supports PDF (.pdf), Word (.docx), and Text (.txt) up to 10MB
                </span>
              </div>
              {selectedFile && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-mono border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready to parse: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUploadSubmit}
                disabled={isParsing || !selectedFile}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/30"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Text & Entities...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Parse Resume File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              rows={8}
              placeholder="Paste complete resume text here (Summary, Experience, Education, Skills, Projects)..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full p-4 bg-[#070e20] border border-[#17326c] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Characters: {pasteText.length}</span>
              <button
                onClick={handlePasteSubmit}
                disabled={isParsing || pasteText.trim().length < 50}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/30"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing Resume Text...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Analyze & Extract Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Extracted Profile Review Card */}
      {parseResult && (
        <div className="p-7 rounded-2xl bg-[#0a152d] border border-[#17326c]/80 space-y-6 animate-fade-in shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#17326c]/50">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resume Successfully Parsed & Committed to SQLite</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {parseResult.extracted.name}
              </h2>
              <p className="text-xs text-blue-200/70">{parseResult.extracted.headline}</p>
            </div>

            <button
              onClick={onNavigateToCareers}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
            >
              <span>View Career Matches</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Technical Skills Extracted */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Verified Technical Skills ({parseResult.extracted.technicalSkills.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#070e20] border border-[#17326c]">
              {parseResult.extracted.technicalSkills.map((s: string) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-medium"
                >
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>

          {/* Experience and Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Experience */}
            <div className="p-4 rounded-xl bg-[#070e20] border border-[#17326c]/60 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Experience Entries ({parseResult.extracted.experience.length})
              </h3>
              {parseResult.extracted.experience.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No formal employment entries extracted.</p>
              ) : (
                <div className="space-y-2.5">
                  {parseResult.extracted.experience.map((exp: any, i: number) => (
                    <div key={i} className="text-xs space-y-0.5 border-b border-[#17326c]/40 pb-2 last:border-0">
                      <div className="font-bold text-white">{exp.role}</div>
                      <div className="text-slate-400">{exp.company} • {exp.duration}</div>
                      <p className="text-[11px] text-slate-300/80 leading-relaxed mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education */}
            <div className="p-4 rounded-xl bg-[#070e20] border border-[#17326c]/60 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-cyan-400" />
                Education ({parseResult.extracted.education.length})
              </h3>
              {parseResult.extracted.education.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No education entries extracted.</p>
              ) : (
                <div className="space-y-2.5">
                  {parseResult.extracted.education.map((edu: any, i: number) => (
                    <div key={i} className="text-xs space-y-0.5 border-b border-[#17326c]/40 pb-2 last:border-0">
                      <div className="font-bold text-white">{edu.degree} in {edu.field}</div>
                      <div className="text-slate-400">{edu.institution} • {edu.graduationYear}</div>
                      {edu.gpa && <div className="text-blue-300 font-mono text-[11px]">GPA: {edu.gpa}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Projects */}
            <div className="p-4 rounded-xl bg-[#070e20] border border-[#17326c]/60 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-emerald-400" />
                Projects ({parseResult.extracted.projects.length})
              </h3>
              {parseResult.extracted.projects.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No explicit projects listed.</p>
              ) : (
                <div className="space-y-2">
                  {parseResult.extracted.projects.map((proj: any, i: number) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <div className="font-bold text-white">{proj.title}</div>
                      <p className="text-[11px] text-slate-400">{proj.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="p-4 rounded-xl bg-[#070e20] border border-[#17326c]/60 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Certifications ({parseResult.extracted.certifications.length})
              </h3>
              {parseResult.extracted.certifications.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No certifications listed.</p>
              ) : (
                <div className="space-y-2">
                  {parseResult.extracted.certifications.map((cert: any, i: number) => (
                    <div key={i} className="text-xs">
                      <div className="font-bold text-white">{cert.name}</div>
                      <div className="text-slate-400">{cert.issuer} {cert.year ? `(${cert.year})` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
