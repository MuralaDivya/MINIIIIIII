import { UserProfile } from '../types/index.js';

export interface TechnicalQuestion {
  id: string;
  skillTag: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'intermediate' | 'advanced';
}

export const DATA_AND_SOFTWARE_QUESTION_BANK: TechnicalQuestion[] = [
  {
    id: 'tech_sql_01',
    skillTag: 'SQL',
    question: 'In PostgreSQL, which window function calculates the cumulative running sum of the "revenue" column ordered by "transaction_date"?',
    codeSnippet: 'SELECT transaction_date, revenue, \n  ____(revenue) OVER (ORDER BY transaction_date) AS running_total \nFROM transactions;',
    options: ['SUM', 'ROW_NUMBER', 'CUME_DIST', 'LAG'],
    correctIndex: 0,
    explanation: 'The SUM() aggregate function paired with an OVER (ORDER BY transaction_date) clause acts as a window function calculating running cumulative totals.',
    difficulty: 'intermediate'
  },
  {
    id: 'tech_sql_02',
    skillTag: 'SQL',
    question: 'What is the operational difference between WHERE and HAVING clauses in an analytical SQL query?',
    options: [
      'WHERE filters rows after aggregation; HAVING filters rows before aggregation.',
      'WHERE filters individual rows prior to GROUP BY aggregation; HAVING filters aggregated groups.',
      'WHERE and HAVING are interchangeable synonyms in modern ANSI SQL.',
      'HAVING can only be applied to indexed primary key columns.'
    ],
    correctIndex: 1,
    explanation: 'The WHERE clause operates on individual rows before any grouping occurs. The HAVING clause applies filter predicates to the aggregated groups resulting from GROUP BY.',
    difficulty: 'intermediate'
  },
  {
    id: 'tech_py_01',
    skillTag: 'Python',
    question: 'In Python, what is the average time complexity of key lookup and insertion in a standard built-in dict?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    correctIndex: 2,
    explanation: 'Python dictionaries are implemented using hash tables with open addressing, providing average O(1) time complexity for lookup, insertion, and deletion.',
    difficulty: 'intermediate'
  },
  {
    id: 'tech_pandas_01',
    skillTag: 'Pandas',
    question: 'In Pandas, which method efficiently imputes missing NaN values in a DataFrame column with the column median?',
    codeSnippet: 'df["income"] = df["income"].____(df["income"].median())',
    options: ['dropna', 'fillna', 'replace_null', 'interpolate_median'],
    correctIndex: 1,
    explanation: 'df["col"].fillna(df["col"].median()) replaces missing NaN values with the median value of the series.',
    difficulty: 'intermediate'
  },
  {
    id: 'tech_pandas_02',
    skillTag: 'Pandas',
    question: 'To combine two DataFrames (A and B) where you want all rows from DataFrame A and only matching rows from DataFrame B, which join strategy should you specify in pd.merge()?',
    options: ['how="inner"', 'how="left"', 'how="outer"', 'how="cross"'],
    correctIndex: 1,
    explanation: 'A left join (how="left") retains every row from the left DataFrame (A) and populates columns with NaN where no matching key exists in the right DataFrame (B).',
    difficulty: 'intermediate'
  },
  {
    id: 'tech_ml_01',
    skillTag: 'Machine Learning',
    question: 'When evaluating a fraud detection model with severe class imbalance (99.8% non-fraud vs 0.2% fraud), which evaluation metric is LEAST informative?',
    options: ['Precision-Recall AUC', 'F1-Score', 'Raw Accuracy', 'ROC-AUC'],
    correctIndex: 2,
    explanation: 'Raw accuracy is misleading in highly imbalanced classes because a naive classifier predicting "non-fraud" 100% of the time achieves 99.8% accuracy while detecting zero fraud.',
    difficulty: 'advanced'
  },
  {
    id: 'tech_git_01',
    skillTag: 'Git',
    question: 'Which Git command stages all modified and deleted tracked files as well as new untracked files for the upcoming commit?',
    options: ['git commit -a', 'git add .', 'git push --all', 'git merge --stage'],
    correctIndex: 1,
    explanation: '"git add ." stages all modifications, additions, and deletions in the current repository directory tree.',
    difficulty: 'intermediate'
  },
  {
    id: 'tech_js_01',
    skillTag: 'JavaScript',
    question: 'What will be output by console.log(typeof null) according to ECMAScript specification?',
    options: ['"null"', '"undefined"', '"object"', '"boolean"'],
    correctIndex: 2,
    explanation: 'In JavaScript, typeof null returns "object", which is a historical design artifact from the initial JS engine implementation.',
    difficulty: 'intermediate'
  },
  {
    id: 'tech_data_01',
    skillTag: 'Data Architecture',
    question: 'In modern data engineering, what is the fundamental difference between ETL (Extract-Transform-Load) and ELT (Extract-Load-Transform)?',
    options: [
      'ETL transforms data after loading into a cloud data warehouse like Snowflake; ELT transforms before.',
      'ELT loads raw data directly into the cloud warehouse and leverages the warehouse compute power for in-database transformations.',
      'ETL is exclusively used for streaming data, while ELT is exclusively for batch files.',
      'ELT requires manual CSV imports and does not support automated pipelines.'
    ],
    correctIndex: 1,
    explanation: 'ELT loads untransformed raw data directly into high-performance cloud data warehouses (e.g. Snowflake, BigQuery) and executes transformations inside the warehouse using SQL/dbt.',
    difficulty: 'advanced'
  },
  {
    id: 'tech_db_01',
    skillTag: 'Database Systems',
    question: 'Which property of ACID database transactions ensures that partially completed transactions are rolled back in the event of a system crash?',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correctIndex: 0,
    explanation: 'Atomicity ensures the "all-or-nothing" rule: either all operations in a transaction succeed and are committed, or none take effect and the database state rolls back.',
    difficulty: 'intermediate'
  }
];

export interface TechnicalSubmission {
  answers: Record<string, number>; // questionId -> selectedIndex
  timeSpentSeconds: number;
}

export interface TechnicalAssessmentResult {
  overallScore: number;
  totalQuestions: number;
  correctCount: number;
  accuracyPercentage: number;
  timeSpentSeconds: number;
  skillMastery: Record<string, {
    total: number;
    correct: number;
    percentage: number;
    status: 'proficient' | 'review_recommended';
  }>;
  strengths: string[];
  weaknesses: string[];
  itemReview: Array<{
    id: string;
    skillTag: string;
    question: string;
    codeSnippet?: string;
    options: string[];
    selectedAnswerIndex: number | null;
    correctAnswerIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export function evaluateTechnicalSubmission(submission: TechnicalSubmission): TechnicalAssessmentResult {
  const { answers, timeSpentSeconds } = submission;
  let correctCount = 0;

  const skillStats: Record<string, { total: number; correct: number }> = {};

  const itemReview = DATA_AND_SOFTWARE_QUESTION_BANK.map(q => {
    const selected = answers[q.id] !== undefined ? answers[q.id] : null;
    const isCorrect = selected === q.correctIndex;

    if (!skillStats[q.skillTag]) {
      skillStats[q.skillTag] = { total: 0, correct: 0 };
    }
    skillStats[q.skillTag].total++;
    if (isCorrect) {
      skillStats[q.skillTag].correct++;
      correctCount++;
    }

    return {
      id: q.id,
      skillTag: q.skillTag,
      question: q.question,
      codeSnippet: q.codeSnippet,
      options: q.options,
      selectedAnswerIndex: selected,
      correctAnswerIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation
    };
  });

  const totalQuestions = DATA_AND_SOFTWARE_QUESTION_BANK.length;
  const accuracyPercentage = Math.round((correctCount / totalQuestions) * 100);

  const skillMastery: Record<string, any> = {};
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const [skill, stats] of Object.entries(skillStats)) {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const status = pct >= 70 ? 'proficient' : 'review_recommended';

    skillMastery[skill] = {
      total: stats.total,
      correct: stats.correct,
      percentage: pct,
      status
    };

    if (pct >= 70) {
      strengths.push(`${skill} (${pct}% mastery)`);
    } else {
      weaknesses.push(`${skill} (${pct}% mastery - review recommended)`);
    }
  }

  return {
    overallScore: accuracyPercentage,
    totalQuestions,
    correctCount,
    accuracyPercentage,
    timeSpentSeconds,
    skillMastery,
    strengths,
    weaknesses,
    itemReview
  };
}
