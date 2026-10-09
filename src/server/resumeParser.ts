import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { getGeminiClient } from './gemini.js';
import { UserProfile, EducationEntry, ExperienceEntry, ProjectEntry, CertificationEntry } from '../types/index.js';

export interface ExtractedResumeData {
  name: string;
  email: string;
  headline: string;
  technicalSkills: string[];
  softSkills: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  domains: string[];
  interests: string[];
  rawTextLength: number;
  extractedAt: string;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    try {
      const parser = new (PDFParse as any)(buffer);
      const res = await parser.getText();
      return typeof res === 'string' ? res : (res?.text || '');
    } catch {
      return buffer.toString('utf-8');
    }
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // Fallback as plain text
  return buffer.toString('utf-8');
}

export async function parseResumeWithIntelligence(rawText: string): Promise<ExtractedResumeData> {
  const cleanedText = rawText.trim();
  if (cleanedText.length < 50) {
    throw new Error('Resume text is too short or empty to extract valid candidate data.');
  }

  // 1. Rule-based regex extraction as deterministic baseline
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const emailMatch = cleanedText.match(emailRegex);
  const foundEmail = emailMatch ? emailMatch[0] : '';

  // 2. Structured entity extraction via Server-Side Gemini (strictly grounded in resume text)
  const ai = getGeminiClient();
  const prompt = `You are a strict, precise Resume Entity Extraction Agent.
Extract candidate information from the following real resume text into valid JSON.

CRITICAL INSTRUCTIONS:
- ONLY extract information that is explicitly present in the resume text.
- DO NOT invent, hallucinate, or extrapolate any skills, jobs, degrees, or companies.
- If a section (e.g. projects or certifications) is not present in the text, return an empty array.
- For technicalSkills and softSkills, list only terms specifically mentioned or demonstrated.
- Return ONLY valid JSON matching this exact structure:
{
  "name": "Candidate Full Name or empty string",
  "email": "Candidate email or empty string",
  "headline": "Current title or professional summary headline",
  "technicalSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "education": [
    {
      "id": "edu_1",
      "degree": "Degree name",
      "field": "Field of study / major",
      "institution": "University / College name",
      "graduationYear": "Year or Graduation date",
      "gpa": "GPA if mentioned, else empty string"
    }
  ],
  "experience": [
    {
      "id": "exp_1",
      "role": "Job role title",
      "company": "Company name",
      "duration": "Dates / duration",
      "description": "Key responsibilities and achievements"
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "title": "Project title",
      "description": "What was built",
      "technologies": ["tech1", "tech2"],
      "url": "URL if present else empty string"
    }
  ],
  "certifications": [
    {
      "id": "cert_1",
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year if mentioned else empty string"
    }
  ],
  "domains": ["domain1", "domain2"],
  "interests": ["interest1"]
}

RESUME TEXT TO EXTRACT:
${cleanedText.slice(0, 12000)}`;

  let parsedJson: any = null;
  const modelsToAttempt = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of modelsToAttempt) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      if (response.text) {
        parsedJson = JSON.parse(response.text.trim());
        break;
      }
    } catch (err: any) {
      console.warn(`Resume extraction with ${model} failed, trying next:`, err?.message || err);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // Deterministic fallback if API fails
  if (!parsedJson) {
    parsedJson = fallbackDeterministicExtraction(cleanedText, foundEmail);
  }

  return {
    name: parsedJson.name || 'Candidate',
    email: parsedJson.email || foundEmail,
    headline: parsedJson.headline || 'Professional',
    technicalSkills: Array.isArray(parsedJson.technicalSkills) ? parsedJson.technicalSkills : [],
    softSkills: Array.isArray(parsedJson.softSkills) ? parsedJson.softSkills : [],
    education: Array.isArray(parsedJson.education) ? parsedJson.education : [],
    experience: Array.isArray(parsedJson.experience) ? parsedJson.experience : [],
    projects: Array.isArray(parsedJson.projects) ? parsedJson.projects : [],
    certifications: Array.isArray(parsedJson.certifications) ? parsedJson.certifications : [],
    domains: Array.isArray(parsedJson.domains) ? parsedJson.domains : [],
    interests: Array.isArray(parsedJson.interests) ? parsedJson.interests : [],
    rawTextLength: cleanedText.length,
    extractedAt: new Date().toISOString()
  };
}

function fallbackDeterministicExtraction(text: string, email: string): any {
  // Extract common tech skills present in text
  const commonTech = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'SQL', 'C++', 'C#', 'React', 'Node.js',
    'HTML', 'CSS', 'Git', 'Docker', 'AWS', 'Linux', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Excel', 'Tableau', 'Power BI', 'Kubernetes'
  ];
  const matchedTech = commonTech.filter(t => 
    new RegExp(`\\b${t.replace(/[.+]/g, '\\$&')}\\b`, 'i').test(text)
  );

  return {
    name: text.split('\n')[0]?.trim().slice(0, 40) || 'Candidate',
    email,
    headline: 'Candidate Profile (Extracted)',
    technicalSkills: matchedTech,
    softSkills: ['Problem Solving', 'Communication'],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    domains: [],
    interests: []
  };
}
