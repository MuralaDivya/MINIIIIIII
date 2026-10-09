import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { getDatabase, saveDatabaseToDisk } from './db.js';

interface ONetOccupation {
  code: string;
  title: string;
  description: string;
  skills: string[];
  techSkills: string[];
}

interface ESCOOccupation {
  uri: string;
  code: string;
  title: string;
  description: string;
  skills: string[];
}

export async function runDatasetIngestion(): Promise<{
  onetOccupationsCount: number;
  escoOccupationsCount: number;
  totalSkillsCount: number;
}> {
  console.log('Starting ingestion of real O*NET 29.1 and ESCO v1.1 datasets into SQLite...');
  const db = await getDatabase();

  // Create tables if not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS occupations (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      dataset_source TEXT NOT NULL,
      description TEXT NOT NULL,
      skills_json TEXT NOT NULL,
      source_uri TEXT,
      salary_median REAL,
      job_growth TEXT,
      created_at TEXT NOT NULL
    );
  `);

  try {
    db.run(`ALTER TABLE occupations ADD COLUMN source_uri TEXT;`);
  } catch (e) {}

  try {
    db.run(`ALTER TABLE skills_taxonomy ADD COLUMN dataset_source TEXT;`);
  } catch (e) {}

  try {
    db.run(`ALTER TABLE skills_taxonomy ADD COLUMN source_id TEXT;`);
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS skills_taxonomy (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      dataset_source TEXT NOT NULL,
      source_id TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS occupation_skills (
      id TEXT PRIMARY KEY,
      occupation_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      importance_score REAL,
      skill_type TEXT NOT NULL
    );
  `);

  // Create search indexes
  try {
    db.run(`CREATE INDEX IF NOT EXISTS idx_occupations_title ON occupations(title);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_occupations_code ON occupations(code);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_skills_name ON skills_taxonomy(name);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_occ_skills ON occupation_skills(occupation_id);`);
  } catch (e) {
    // Indexes might already exist
  }

  // 1. Ingest O*NET 29.1 Technology Skills with Hot Technology prioritization
  console.log('Reading O*NET Technology Skills...');
  const techSkillsByCode = new Map<string, { hot: string[]; standard: string[] }>();
  const allUniqueTechSkills = new Set<string>();

  const techPath = path.resolve(process.cwd(), 'data/datasets/onet_technology_skills.txt');
  if (fs.existsSync(techPath)) {
    const fileStream = fs.createReadStream(techPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const code = parts[0].trim();
        const skillName = parts[1].trim();
        const isHot = parts[4]?.trim() === 'Y';
        const inDemand = parts[5]?.trim() === 'Y';

        if (!code || !skillName) continue;
        if (!techSkillsByCode.has(code)) {
          techSkillsByCode.set(code, { hot: [], standard: [] });
        }

        const bucket = techSkillsByCode.get(code)!;
        if (isHot || inDemand) {
          bucket.hot.push(skillName);
        } else {
          bucket.standard.push(skillName);
        }
        allUniqueTechSkills.add(skillName);
      }
    }
  }

  // 2. Ingest O*NET 29.1 Core Skills (Importance >= 3.0 on 1-5 scale)
  console.log('Reading O*NET Core Skills...');
  const coreSkillsByCode = new Map<string, { name: string; score: number }[]>();
  const skillsPath = path.resolve(process.cwd(), 'data/datasets/onet_skills.txt');
  if (fs.existsSync(skillsPath)) {
    const fileStream = fs.createReadStream(skillsPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      const parts = line.split('\t');
      if (parts.length >= 5) {
        const code = parts[0].trim();
        const elementName = parts[2]?.trim();
        const scaleId = parts[3]?.trim();
        const dataValue = parseFloat(parts[4]);

        if (scaleId === 'IM' && dataValue >= 2.75 && elementName) {
          if (!coreSkillsByCode.has(code)) {
            coreSkillsByCode.set(code, []);
          }
          coreSkillsByCode.get(code)!.push({ name: elementName, score: dataValue });
        }
      }
    }
  }

  // 3. Ingest O*NET 29.1 Occupations
  console.log('Inserting O*NET Occupations...');
  let onetCount = 0;
  const occPath = path.resolve(process.cwd(), 'data/datasets/onet_occupations.txt');
  if (fs.existsSync(occPath)) {
    const fileStream = fs.createReadStream(occPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;

    const insertOccStmt = db.prepare(`
      INSERT OR REPLACE INTO occupations 
      (id, code, title, dataset_source, description, skills_json, source_uri, created_at)
      VALUES (:id, :code, :title, :dataset_source, :description, :skills_json, :source_uri, :created_at)
    `);

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const code = parts[0].trim();
        const title = parts[1].trim();
        const description = parts[2].trim();

        const techBucket = techSkillsByCode.get(code);
        const hotTech = techBucket ? techBucket.hot : [];
        const stdTech = techBucket ? techBucket.standard : [];
        const coreList = coreSkillsByCode.get(code) || [];

        // Prioritize Hot / In-Demand technologies, then remaining tech, then core skills
        const combinedSkills = Array.from(new Set([
          ...hotTech,
          ...stdTech.slice(0, 20),
          ...coreList.slice(0, 10).map(c => c.name)
        ])).slice(0, 45);

        insertOccStmt.run({
          ':id': `onet_${code}`,
          ':code': code,
          ':title': title,
          ':dataset_source': 'O*NET 29.1',
          ':description': description,
          ':skills_json': JSON.stringify(combinedSkills),
          ':source_uri': `https://www.onetonline.org/link/summary/${code}`,
          ':created_at': new Date().toISOString()
        });

        onetCount++;
      }
    }
    insertOccStmt.free();
  }

  // 4. Ingest ESCO v1.1 Occupations
  console.log('Inserting ESCO Occupations...');
  let escoCount = 0;
  const escoOccPath = path.resolve(process.cwd(), 'data/datasets/esco_occupations.csv');
  if (fs.existsSync(escoOccPath)) {
    const fileStream = fs.createReadStream(escoOccPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;

    const insertEscoStmt = db.prepare(`
      INSERT OR REPLACE INTO occupations 
      (id, code, title, dataset_source, description, skills_json, source_uri, created_at)
      VALUES (:id, :code, :title, :dataset_source, :description, :skills_json, :source_uri, :created_at)
    `);

    // Ingest up to 1,500 core ESCO occupations to maintain efficient WASM SQLite size
    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (escoCount >= 1500) break;

      // CSV parsing handling simple quoted fields
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      // fallback split if standard regex
      const parts = line.split(',');
      if (parts.length >= 4) {
        const uri = parts[1]?.replace(/^"|"$/g, '').trim();
        const iscoGroup = parts[2]?.replace(/^"|"$/g, '').trim();
        const title = parts[3]?.replace(/^"|"$/g, '').trim();
        const description = (parts.slice(12).join(',') || title).replace(/^"|"$/g, '').trim();

        if (title && iscoGroup) {
          insertEscoStmt.run({
            ':id': `esco_${iscoGroup}_${escoCount}`,
            ':code': `ISCO-${iscoGroup}`,
            ':title': title,
            ':dataset_source': 'ESCO v1.1',
            ':description': description.slice(0, 500),
            ':skills_json': JSON.stringify([]),
            ':source_uri': uri || `http://data.europa.eu/esco/occupation/${iscoGroup}`,
            ':created_at': new Date().toISOString()
          });
          escoCount++;
        }
      }
    }
    insertEscoStmt.free();
  }

  // 5. Ingest Skills Taxonomy into skills_taxonomy table
  console.log('Inserting Skills Taxonomy...');
  let skillTaxCount = 0;
  const insertSkillStmt = db.prepare(`
    INSERT OR REPLACE INTO skills_taxonomy (id, name, category, source, dataset_source, source_id)
    VALUES (:id, :name, :category, :source, :dataset_source, :source_id)
  `);

  // Ingest O*NET technology skills
  for (const skill of allUniqueTechSkills) {
    if (skillTaxCount >= 5000) break; // Ingest top 5000 technology skills
    insertSkillStmt.run({
      ':id': `skill_onet_${skillTaxCount}`,
      ':name': skill,
      ':category': 'technology',
      ':source': 'O*NET 29.1',
      ':dataset_source': 'O*NET 29.1',
      ':source_id': 'tech_example'
    });
    skillTaxCount++;
  }

  // Ingest ESCO Skills from esco_skills.csv
  const escoSkillsPath = path.resolve(process.cwd(), 'data/datasets/esco_skills.csv');
  if (fs.existsSync(escoSkillsPath)) {
    const fileStream = fs.createReadStream(escoSkillsPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;

    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (skillTaxCount >= 10000) break; // Cap at 10,000 skills for sqlite memory balance

      const parts = line.split(',');
      if (parts.length >= 5) {
        const uri = parts[1]?.replace(/^"|"$/g, '').trim();
        const skillType = parts[2]?.replace(/^"|"$/g, '').trim();
        const preferredLabel = parts[4]?.replace(/^"|"$/g, '').trim();

        if (preferredLabel && preferredLabel.length < 80) {
          insertSkillStmt.run({
            ':id': `skill_esco_${skillTaxCount}`,
            ':name': preferredLabel,
            ':category': skillType || 'competence',
            ':source': 'ESCO v1.1',
            ':dataset_source': 'ESCO v1.1',
            ':source_id': uri
          });
          skillTaxCount++;
        }
      }
    }
  }
  insertSkillStmt.free();

  saveDatabaseToDisk(db);
  console.log(`Ingestion complete! O*NET: ${onetCount}, ESCO: ${escoCount}, Skills: ${skillTaxCount}`);

  return {
    onetOccupationsCount: onetCount,
    escoOccupationsCount: escoCount,
    totalSkillsCount: skillTaxCount
  };
}

// Allow direct execution via CLI
if (process.argv[1]?.endsWith('ingestDatasets.ts') || process.argv[1]?.endsWith('ingestDatasets.js')) {
  runDatasetIngestion()
    .then((stats) => {
      console.log('Ingestion stats:', stats);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Ingestion failed:', err);
      process.exit(1);
    });
}
