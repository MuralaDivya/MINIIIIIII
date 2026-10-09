export interface AptitudeQuestion {
  id: string;
  category: 'quantitative' | 'logical' | 'verbal' | 'data_interpretation';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const REAL_APTITUDE_QUESTION_BANK: AptitudeQuestion[] = [
  // 1. Quantitative Reasoning
  {
    id: 'quant_01',
    category: 'quantitative',
    question: 'A machine produces 240 units in 4 hours. If two identical machines work together at the same constant rate, how many units will they produce in 7 hours?',
    options: ['420 units', '840 units', '680 units', '720 units'],
    correctIndex: 1,
    explanation: 'One machine rate = 240 units / 4 hours = 60 units/hour. Two machines combined rate = 60 × 2 = 120 units/hour. In 7 hours, total production = 120 × 7 = 840 units.',
    difficulty: 'easy'
  },
  {
    id: 'quant_02',
    category: 'quantitative',
    question: 'An investment portfolio increases in value by 20% in the first year and then decreases by 10% in the second year. What is the net overall percentage change over the two-year period?',
    options: ['+10% net gain', '+8% net gain', '+5% net gain', '+12% net gain'],
    correctIndex: 1,
    explanation: 'Let initial value be 100. After year 1 (+20%): 100 × 1.20 = 120. After year 2 (-10%): 120 × 0.90 = 108. Net change = (108 - 100) / 100 = +8% net gain.',
    difficulty: 'medium'
  },
  {
    id: 'quant_03',
    category: 'quantitative',
    question: 'If a project team of 6 engineers can complete a data pipeline in 15 days, how many total engineers working at the same pace are needed to complete the identical pipeline in 10 days?',
    options: ['8 engineers', '9 engineers', '10 engineers', '12 engineers'],
    correctIndex: 1,
    explanation: 'Total work = 6 engineers × 15 days = 90 engineer-days. To complete in 10 days: 90 engineer-days / 10 days = 9 engineers.',
    difficulty: 'easy'
  },
  {
    id: 'quant_04',
    category: 'quantitative',
    question: 'A bag contains 5 blue marbles, 4 green marbles, and 3 red marbles. If two marbles are drawn at random without replacement, what is the probability that both are blue?',
    options: ['5/33', '10/66', '5/18', '25/144'],
    correctIndex: 0,
    explanation: 'Total marbles = 5 + 4 + 3 = 12. P(1st blue) = 5/12. After drawing one blue, 4 blue remain out of 11 total. P(2nd blue) = 4/11. P(both blue) = (5/12) × (4/11) = 20/132 = 5/33.',
    difficulty: 'medium'
  },

  // 2. Logical Reasoning
  {
    id: 'logic_01',
    category: 'logical',
    question: 'Consider the statements: 1. All algorithms require finite steps. 2. Some finite procedures are deterministic. Which conclusion strictly follows?',
    options: [
      'All algorithms are deterministic.',
      'Some procedures that require finite steps are deterministic.',
      'No deterministic procedures are algorithms.',
      'All deterministic procedures are algorithms.'
    ],
    correctIndex: 1,
    explanation: 'Statement 2 states that some finite procedures are deterministic. Since all algorithms are finite procedures, the intersection between finite procedures and deterministic procedures confirms that some procedures requiring finite steps are deterministic.',
    difficulty: 'medium'
  },
  {
    id: 'logic_02',
    category: 'logical',
    question: 'Look at the number sequence: 4, 9, 19, 39, 79, ___. Which number logically completes the pattern?',
    options: ['119', '149', '159', '169'],
    correctIndex: 2,
    explanation: 'The pattern is (Previous × 2) + 1: (4 × 2) + 1 = 9; (9 × 2) + 1 = 19; (19 × 2) + 1 = 39; (39 × 2) + 1 = 79; (79 × 2) + 1 = 159.',
    difficulty: 'easy'
  },
  {
    id: 'logic_03',
    category: 'logical',
    question: 'Five microservices (A, B, C, D, E) depend on each other. B can only deploy after A. C must deploy before A. E depends on D, and D depends on B. Which service must be deployed first?',
    options: ['Service A', 'Service B', 'Service C', 'Service D'],
    correctIndex: 2,
    explanation: 'Dependencies order: C must deploy before A; B deploys after A (so C -> A -> B); D depends on B (C -> A -> B -> D); E depends on D (C -> A -> B -> D -> E). Service C has no prerequisites and must deploy first.',
    difficulty: 'medium'
  },
  {
    id: 'logic_04',
    category: 'logical',
    question: 'In a code language, if "DATA" is encoded as "EBUB" and "QUERY" is encoded as "RVFSZ", how is "STACK" encoded in the same rule?',
    options: ['TUBDL', 'TUADK', 'RUBCL', 'SUBDL'],
    correctIndex: 0,
    explanation: 'Each character is shifted forward by +1 position in the alphabet: S->T, T->U, A->B, C->D, K->L. The resulting encoded word is "TUBDL".',
    difficulty: 'easy'
  },

  // 3. Verbal Ability
  {
    id: 'verbal_01',
    category: 'verbal',
    question: 'Choose the word that most accurately completes the sentence: "The engineering team adopted an ________ architecture to ensure that individual service failures would not compromise the entire distributed system."',
    options: ['ambiguous', 'ephemeral', 'resilient', 'archaic'],
    correctIndex: 2,
    explanation: '"Resilient" means capable of withstanding shock, failure, or adversity without collapsing, which directly matches the engineering goal of fault tolerance in distributed systems.',
    difficulty: 'easy'
  },
  {
    id: 'verbal_02',
    category: 'verbal',
    question: 'Read the statement: "While automated regression testing detects syntax and execution bugs, it cannot validate whether business domain requirements match customer expectations." What is the author\'s primary implication?',
    options: [
      'Automated regression testing is unnecessary.',
      'Automated testing must be paired with user acceptance and requirements validation.',
      'Customer expectations should be converted to execution bugs.',
      'Syntax bugs are the only failures that matter in software.'
    ],
    correctIndex: 1,
    explanation: 'The author establishes the specific boundary of automated testing (syntax/execution) and highlights its limitation regarding customer expectations, implying that automated testing alone is insufficient without requirements validation.',
    difficulty: 'medium'
  },
  {
    id: 'verbal_03',
    category: 'verbal',
    question: 'Identify the sentence with correct grammatical structure and subject-verb agreement:',
    options: [
      'Each of the candidate algorithms have demonstrated linear time complexity.',
      'Each of the candidate algorithms has demonstrated linear time complexity.',
      'Each of the candidate algorithms are demonstrating linear time complexity.',
      'Each of the candidate algorithms were demonstrated linear time complexity.'
    ],
    correctIndex: 1,
    explanation: 'The subject pronoun "Each" is singular and requires a singular verb ("has demonstrated"), regardless of the plural prepositional phrase "of the candidate algorithms".',
    difficulty: 'medium'
  },
  {
    id: 'verbal_04',
    category: 'verbal',
    question: 'Which of the following is an antonym for the word "OBSOLETE"?',
    options: ['Redundant', 'Contemporary', 'Desolate', 'Incongruous'],
    correctIndex: 1,
    explanation: '"Obsolete" means outdated or no longer in general use. "Contemporary" means modern, current, or belonging to the present time, making it the antonym.',
    difficulty: 'easy'
  },

  // 4. Data Interpretation
  {
    id: 'data_01',
    category: 'data_interpretation',
    question: 'A SaaS platform logs active users across 4 quarters: Q1: 40,000; Q2: 52,000; Q3: 65,000; Q4: 78,000. What is the percentage increase in active users from Q1 to Q4?',
    options: ['80%', '95%', '90%', '75%'],
    correctIndex: 1,
    explanation: 'Percentage increase = ((Value_Q4 - Value_Q1) / Value_Q1) × 100 = ((78,000 - 40,000) / 40,000) × 100 = (38,000 / 40,000) × 100 = 0.95 × 100 = 95%.',
    difficulty: 'easy'
  },
  {
    id: 'data_02',
    category: 'data_interpretation',
    question: 'In a company database of 1,200 incident tickets, 35% are classified as network issues, 45% as application bugs, and the remainder as hardware failures. How many tickets are hardware failures?',
    options: ['200 tickets', '240 tickets', '280 tickets', '180 tickets'],
    correctIndex: 1,
    explanation: 'Hardware percentage = 100% - (35% + 45%) = 100% - 80% = 20%. Hardware count = 20% of 1,200 = 0.20 × 1,200 = 240 tickets.',
    difficulty: 'easy'
  },
  {
    id: 'data_03',
    category: 'data_interpretation',
    question: 'Server A processes 500 requests/sec with an average latency of 20ms. Server B processes 800 requests/sec with an average latency of 30ms. What is the weighted average latency across both servers combined?',
    options: ['25.0 ms', '26.15 ms', '27.42 ms', '28.0 ms'],
    correctIndex: 1,
    explanation: 'Total requests = 500 + 800 = 1,300 requests/sec. Weighted sum = (500 × 20) + (800 × 30) = 10,000 + 24,000 = 34,000. Weighted average latency = 34,000 / 1,300 ≈ 26.15 ms.',
    difficulty: 'medium'
  },
  {
    id: 'data_04',
    category: 'data_interpretation',
    question: 'A machine learning classifier predicts 200 positive cases, of which 160 are True Positives and 40 are False Positives. It also identifies 700 True Negatives and 100 False Negatives. What is the Precision of this model?',
    options: ['80%', '61.5%', '70%', '85%'],
    correctIndex: 0,
    explanation: 'Precision = True Positives / (True Positives + False Positives) = 160 / (160 + 40) = 160 / 200 = 0.80 = 80%.',
    difficulty: 'medium'
  }
];

export interface AptitudeSubmission {
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  timeSpentSeconds: number;
}

export interface AptitudeResult {
  overallScore: number;
  totalQuestions: number;
  correctCount: number;
  accuracyPercentage: number;
  timeSpentSeconds: number;
  categoryBreakdown: Record<string, {
    total: number;
    correct: number;
    accuracy: number;
    status: 'strong' | 'moderate' | 'needs_work';
  }>;
  strengths: string[];
  weaknesses: string[];
  itemReview: Array<{
    id: string;
    category: string;
    question: string;
    options: string[];
    selectedAnswerIndex: number | null;
    correctAnswerIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export function evaluateAptitudeSubmission(submission: AptitudeSubmission): AptitudeResult {
  const { answers, timeSpentSeconds } = submission;
  let correctCount = 0;

  const categoryStats: Record<string, { total: number; correct: number }> = {
    quantitative: { total: 0, correct: 0 },
    logical: { total: 0, correct: 0 },
    verbal: { total: 0, correct: 0 },
    data_interpretation: { total: 0, correct: 0 }
  };

  const itemReview = REAL_APTITUDE_QUESTION_BANK.map(q => {
    const selected = answers[q.id] !== undefined ? answers[q.id] : null;
    const isCorrect = selected === q.correctIndex;

    if (!categoryStats[q.category]) {
      categoryStats[q.category] = { total: 0, correct: 0 };
    }
    categoryStats[q.category].total++;
    if (isCorrect) {
      categoryStats[q.category].correct++;
      correctCount++;
    }

    return {
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      selectedAnswerIndex: selected,
      correctAnswerIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation
    };
  });

  const totalQuestions = REAL_APTITUDE_QUESTION_BANK.length;
  const accuracyPercentage = Math.round((correctCount / totalQuestions) * 100);

  const categoryBreakdown: Record<string, any> = {};
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const [cat, stats] of Object.entries(categoryStats)) {
    const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const status = acc >= 75 ? 'strong' : acc >= 50 ? 'moderate' : 'needs_work';

    categoryBreakdown[cat] = {
      total: stats.total,
      correct: stats.correct,
      accuracy: acc,
      status
    };

    const formattedName = cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (acc >= 75) {
      strengths.push(`${formattedName} (${acc}% accuracy)`);
    } else {
      weaknesses.push(`${formattedName} (${acc}% accuracy - targeted practice recommended)`);
    }
  }

  return {
    overallScore: accuracyPercentage,
    totalQuestions,
    correctCount,
    accuracyPercentage,
    timeSpentSeconds,
    categoryBreakdown,
    strengths,
    weaknesses,
    itemReview
  };
}
