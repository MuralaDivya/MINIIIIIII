import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { UserProfile } from '../types/index.js';

let dbInstance: Database | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'careeriq.sqlite');

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr_default_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@university.edu',
  headline: 'Aspiring Data & AI Specialist | Computer Science Senior',
  persona: 'fresh_graduate',
  currentCareer: 'Student / Junior Developer',
  targetCareer: 'Data Analyst / Junior ML Engineer',
  technicalSkills: [
    'Python',
    'SQL',
    'Pandas',
    'Data Analysis',
    'Git',
    'JavaScript',
    'HTML/CSS',
    'NumPy',
    'Scikit-Learn'
  ],
  softSkills: [
    'Analytical Thinking',
    'Problem Solving',
    'Team Collaboration',
    'Technical Communication'
  ],
  education: [
    {
      id: 'edu_1',
      degree: 'Bachelor of Science',
      field: 'Computer Science & Information Systems',
      institution: 'State Technical University',
      graduationYear: '2026',
      gpa: '3.78 / 4.0'
    }
  ],
  experience: [
    {
      id: 'exp_1',
      role: 'Undergraduate Research Assistant (Data Lab)',
      company: 'University Informatics Institute',
      duration: 'Jun 2025 – Present (10 mos)',
      description: 'Cleaned and processed 50,000+ tabular records using Python and Pandas. Constructed exploratory dashboards and performed regression analyses.'
    },
    {
      id: 'exp_2',
      role: 'Software Development Intern',
      company: 'Apex Cloud Solutions',
      duration: 'May 2024 – Aug 2024 (3 mos)',
      description: 'Built RESTful endpoints in Node.js and maintained PostgreSQL relational schemas for internal analytics service.'
    }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Retail Sales Demand Forecasting & EDA',
      description: 'Engineered an end-to-end data pipeline using Python, Pandas, and Matplotlib to forecast weekly retail SKU sales across 15 store locations.',
      technologies: ['Python', 'Pandas', 'SQL', 'Scikit-Learn'],
      url: 'https://github.com/careeriq-demo/sales-eda-forecast'
    },
    {
      id: 'proj_2',
      title: 'Autonomous Portfolio Tracker & Analyzer',
      description: 'Interactive dashboard tracking asset allocation and risk metrics with automated variance calculation and CSV ingestion.',
      technologies: ['TypeScript', 'React', 'Tailwind CSS', 'Chart.js'],
      url: 'https://github.com/careeriq-demo/portfolio-analyzer'
    }
  ],
  certifications: [
    {
      id: 'cert_1',
      name: 'Google Data Analytics Professional Certificate',
      issuer: 'Coursera / Google Career Certificates',
      year: '2025'
    }
  ],
  domains: ['Data Analytics', 'Machine Learning', 'Cloud Computing', 'FinTech'],
  interests: ['Exploratory Data Analysis', 'Statistical Inference', 'Predictive Modeling', 'Data Visualization'],
  updatedAt: new Date().toISOString()
};

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  ensureDataDirectory();
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Failed reading existing sqlite db, creating new one', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  saveDatabaseToDisk(dbInstance);
  return dbInstance;
}

function initTables(db: Database) {
  // 1. User Profiles
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Occupations Knowledge Base (O*NET & ESCO normalized schema)
  db.run(`
    CREATE TABLE IF NOT EXISTS occupations (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      dataset_source TEXT NOT NULL,
      description TEXT NOT NULL,
      skills_json TEXT NOT NULL,
      salary_median REAL,
      job_growth TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 3. Normalized Skills Taxonomy
  db.run(`
    CREATE TABLE IF NOT EXISTS skills_taxonomy (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      onet_element_id TEXT
    );
  `);

  // 4. Assessment History
  db.run(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      assessment_type TEXT NOT NULL,
      score REAL NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 5. Orchestrator Event Logs
  db.run(`
    CREATE TABLE IF NOT EXISTS orchestrator_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload_json TEXT
    );
  `);

  // Seed default profile if not exists
  const stmt = db.prepare('SELECT id FROM profiles WHERE id = :id');
  stmt.bind({ ':id': DEFAULT_USER_PROFILE.id });
  const hasProfile = stmt.step();
  stmt.free();

  if (!hasProfile) {
    const insertStmt = db.prepare(`
      INSERT INTO profiles (id, data, updated_at)
      VALUES (:id, :data, :updated_at)
    `);
    insertStmt.run({
      ':id': DEFAULT_USER_PROFILE.id,
      ':data': JSON.stringify(DEFAULT_USER_PROFILE),
      ':updated_at': DEFAULT_USER_PROFILE.updatedAt
    });
    insertStmt.free();
  }
}

export function saveDatabaseToDisk(db: Database) {
  try {
    ensureDataDirectory();
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database to disk:', err);
  }
}

export async function getUserProfile(id: string = DEFAULT_USER_PROFILE.id): Promise<UserProfile> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT data FROM profiles WHERE id = :id');
  stmt.bind({ ':id': id });
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return JSON.parse(row.data as string) as UserProfile;
  }
  stmt.free();
  return DEFAULT_USER_PROFILE;
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const db = await getDatabase();
  profile.updatedAt = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO profiles (id, data, updated_at)
    VALUES (:id, :data, :updated_at)
  `);
  
  stmt.run({
    ':id': profile.id,
    ':data': JSON.stringify(profile),
    ':updated_at': profile.updatedAt
  });
  stmt.free();

  // Log orchestrator event
  logOrchestratorEvent('ProfileAgent', 'PROFILE_UPDATED', { userId: profile.id, persona: profile.persona });

  saveDatabaseToDisk(db);
  return profile;
}

export async function logOrchestratorEvent(agentName: string, eventType: string, payload: any) {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      INSERT INTO orchestrator_logs (id, timestamp, agent_name, event_type, payload_json)
      VALUES (:id, :timestamp, :agent_name, :event_type, :payload_json)
    `);
    stmt.run({
      ':id': `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ':timestamp': new Date().toISOString(),
      ':agent_name': agentName,
      ':event_type': eventType,
      ':payload_json': JSON.stringify(payload)
    });
    stmt.free();
    saveDatabaseToDisk(db);
  } catch (e) {
    console.error('Error logging orchestrator event:', e);
  }
}

export async function saveAssessmentRecord(
  userId: string,
  assessmentType: 'aptitude' | 'communication' | 'technical',
  score: number,
  details: any
): Promise<string> {
  const db = await getDatabase();
  const id = `asmt_${assessmentType}_${Date.now()}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO assessments (id, user_id, assessment_type, score, details_json, created_at)
    VALUES (:id, :user_id, :assessment_type, :score, :details_json, :created_at)
  `);

  stmt.run({
    ':id': id,
    ':user_id': userId,
    ':assessment_type': assessmentType,
    ':score': score,
    ':details_json': JSON.stringify(details),
    ':created_at': now
  });
  stmt.free();

  logOrchestratorEvent('AssessmentAgent', 'ASSESSMENT_COMPLETED', {
    userId,
    assessmentType,
    score
  });

  saveDatabaseToDisk(db);
  return id;
}

export async function getLatestAssessmentScores(userId: string = DEFAULT_USER_PROFILE.id): Promise<{
  aptitude?: { score: number; date: string; details: any };
  communication?: { score: number; date: string; details: any };
  technical?: { score: number; date: string; details: any };
}> {
  const db = await getDatabase();
  const types = ['aptitude', 'communication', 'technical'] as const;
  const result: any = {};

  for (const type of types) {
    const stmt = db.prepare(`
      SELECT score, details_json, created_at
      FROM assessments
      WHERE user_id = :userId AND assessment_type = :type
      ORDER BY created_at DESC
      LIMIT 1
    `);
    stmt.bind({ ':userId': userId, ':type': type });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      result[type] = {
        score: Number(row.score),
        date: row.created_at,
        details: JSON.parse(row.details_json as string || '{}')
      };
    }
    stmt.free();
  }

  return result;
}

export async function getAssessmentHistory(userId: string = DEFAULT_USER_PROFILE.id): Promise<any[]> {
  const db = await getDatabase();
  const stmt = db.prepare(`
    SELECT id, assessment_type, score, details_json, created_at
    FROM assessments
    WHERE user_id = :userId
    ORDER BY created_at DESC
    LIMIT 20
  `);
  stmt.bind({ ':userId': userId });
  const list: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    list.push({
      id: row.id,
      assessmentType: row.assessment_type,
      score: Number(row.score),
      details: JSON.parse(row.details_json as string || '{}'),
      createdAt: row.created_at
    });
  }
  stmt.free();
  return list;
}
