# CareerIQ AI — Intelligent Multi-Agent Career Intelligence Platform

CareerIQ AI is an end-to-end, multi-agent career intelligence platform powered by empirical occupational datasets (O*NET 29.1 and ESCO v1.1), explainable skill gap matrices, adaptive diagnostics, and server-side AI guidance.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 SPA Frontend                           │
│  Dashboard · Resume Parser · Career Matches · Skill Gap Matrix        │
│  Aptitude Diagnostic · Speech NLP · Technical Readiness               │
│  Learning Roadmap · Career Transition · Profile-Aware AI Coach        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP (REST JSON)
┌────────────────────────────────────▼───────────────────────────────────┐
│                    Express Backend Server (Node.js 22)                 │
│  Vite Middlewares (Dev) / Static Asset Serving (Production)            │
│  /api/health · /api/dashboard · /api/career/* · /api/growth/*         │
│  /api/assessments/* · /api/resume/* · /api/gemini/advisor             │
└──────┬─────────────────────────────┬───────────────────────────┬───────┘
       │                             │                           │
┌──────▼──────────────┐   ┌──────────▼───────────────┐   ┌───────▼───────┐
│  SQLite (sql.js)    │   │  Occupational Datasets   │   │ Google GenAI  │
│  Persistent Disk DB │   │  1,016 O*NET 29.1 Roles  │   │ Server-Side   │
│  Profiles, History, │   │  1,500 ESCO v1.1 Roles   │   │ Gemini 3.8    │
│  Orchestrator Logs  │   │  10,000 Skills Taxonomy  │   │ Flash Model   │
└─────────────────────┘   └──────────────────────────┘   └───────────────┘
```

---

## Actual Models & Data Sources Used

1. **AI Models (Server-Side Only via `@google/genai`)**:
   - Primary: `gemini-3.8-flash`
   - Fallback: `gemini-3.1-flash-lite`
   - All API keys reside exclusively in `process.env.GEMINI_API_KEY` on the server. If the API key is unconfigured or experiences latency spikes, deterministic analytical fallbacks are executed.

2. **Occupational Datasets**:
   - **O*NET 29.1** (U.S. Department of Labor / Employment & Training Administration): 1,016 Standard Occupational Classification (SOC) profiles with technology skills and core work activities.
   - **ESCO v1.1** (European Commission Directorate-General for Employment): 1,500 multilingual occupational classifications and transversal skill groupings.
   - **Normalized Skills Taxonomy**: 10,000 standardized technical and soft skill records.

3. **Storage Engine**:
   - **SQLite via `sql.js` (WebAssembly)**: Stored in `/data/careeriq.sqlite` with file persistence on disk. No external TCP database connections required.

---

## Prerequisites

- **Node.js**: v22.0.0 or higher
- **npm**: v10.0.0 or higher

---

## Installation & Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd careeriq-ai
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` (optional for local AI features):
   ```env
   PORT=3000
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Database initialization (Automatic)**:
   The SQLite database `/data/careeriq.sqlite` is automatically initialized with the default candidate profile, 2,516 occupations, and 10,000 skills taxonomy records upon first server startup.

   To re-run dataset ingestion manually from raw dataset text files:
   ```bash
   npx tsx src/server/ingestDatasets.ts
   ```

---

## Running the Application

### Development Mode (with Vite Middleware & HMR)
```bash
npm run dev
```
Access the application at `http://localhost:3000`.

### Production Build & Launch
```bash
npm run build
npm start
```

---

## Testing & Evaluation Suite

CareerIQ AI includes an automated 11-module integration and evaluation test suite:

```bash
npm test
```

### Verified Test Cases & Modules

| Module / Test Case | Verification Criteria | Status |
|---|---|---|
| **1. Database & Datasets** | Validates SQLite connection, $\ge 2,000$ occupations, $\ge 5,000$ skills | ✅ PASS |
| **2. Profile Persistence** | Tests creating, updating, and persisting candidate skills to disk | ✅ PASS |
| **3. Resume Parser** | Tests regex & entity extraction of technical skills, degrees, and experience | ✅ PASS |
| **4. Career Recommendations** | Validates composite career matching formula $[0, 100]$ across O*NET/ESCO | ✅ PASS |
| **5. Skill Gap Matrix** | Tests Strong, Moderate, and Missing competency categorization | ✅ PASS |
| **6. Employability Engine** | Checks 6-factor weights ($30\% + 20\% + 15\% + 15\% + 10\% + 10\% = 1.0$) | ✅ PASS |
| **7. Aptitude Diagnostic** | Tests 4 cognitive categories and answer verification | ✅ PASS |
| **8. Communication Speech NLP** | Evaluates WPM calculation, filler word density, and STAR structure | ✅ PASS |
| **9. Technical Readiness** | Validates domain-specific code and scenario assessments | ✅ PASS |
| **10. Learning Roadmap** | Validates 5-stage progression, certifications, and project linkages | ✅ PASS |
| **11. Career Transition** | Validates transferable skills, deficit delta, and 4-phase bridge roadmap | ✅ PASS |

---

## API Endpoints Reference

### Core Architecture & Dashboard
- `GET /api/health` — System status, database counts, and configured agents.
- `GET /api/dashboard` — Employability score breakdown, career matches, recent assessment results, and next actions.
- `GET /api/profile` — Fetch persistent candidate profile.
- `PUT /api/profile` — Update candidate profile in SQLite.
- `POST /api/profile/reset` — Reset candidate profile to default baseline.

### Career Intelligence & Knowledge Base
- `GET /api/career/recommendations` — Top career matches across O*NET 29.1 and ESCO v1.1.
- `GET /api/career/skill-gap?target=:code` — Categorized skill gaps for target occupation.
- `GET /api/knowledge-base/search?q=:query` — Search 2,516 occupations and 10,000 skills.
- `GET /api/knowledge-base/stats` — Total dataset statistics and sources.

### Personalized Growth (Phase 4)
- `GET /api/growth/roadmap?target=:code` — 5-stage adaptive progression with verified projects & certifications.
- `POST /api/growth/roadmap/explain-stage` — Gemini-powered weekly milestones & verifiable resources.
- `GET /api/growth/transition?current=:role&target=:role` — Transferable skills, deficit delta, feasibility, and 4-phase transition roadmap.
- `GET /api/growth/career-options` — Autocomplete options from O*NET 29.1 catalog.

### Assessments & Evaluation
- `GET /api/assessments/latest` — Latest diagnostic assessment records.
- `GET /api/assessments/aptitude/questions` — Psychometric question bank.
- `POST /api/assessments/aptitude/submit` — Submit aptitude diagnostic.
- `GET /api/assessments/communication/prompts` — Structured STAR interview prompts.
- `POST /api/assessments/communication/analyze` — Spoken speech NLP analysis.
- `GET /api/assessments/technical/questions` — Domain code & scenario questions.
- `POST /api/assessments/technical/submit` — Submit technical readiness evaluation.
- `GET /api/system/test-suite` — Run automated 11-module evaluation suite.

### Resume & AI Coach
- `POST /api/resume/upload` — Parse PDF, DOCX, or TXT resume with entity extraction.
- `POST /api/resume/paste` — Parse pasted resume text.
- `POST /api/gemini/advisor` — Multi-agent grounded career coach powered by Gemini 3.8 Flash.

---

## Known Limitations & Boundaries

1. **WASM SQLite Concurrency**: `sql.js` runs in-memory with file persistence. High-throughput distributed clustering requires upgrading to Cloud SQL / PostgreSQL.
2. **Speech Recognition**: The Communication Assessment utilizes browser Web Speech API for real-time speech-to-text; browsers without Web Speech support can paste transcribed responses directly for full NLP analysis.
3. **AI Guidance Fallback**: If `GEMINI_API_KEY` is not supplied or experiences transient API limits, deterministic O*NET-grounded guidance is delivered seamlessly without system interruption.
