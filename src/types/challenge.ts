import type { Question, QuizCategory } from './index';

// ─── Custom Quiz / Challenge Types ────────────────────────────────────────────

/** A user-created custom quiz */
export interface CustomQuiz {
  /** Unique ID (generated UUID) */
  id: string;
  /** Human-readable title */
  title: string;
  /** Optional description */
  description: string;
  /** Quiz category tag */
  category: QuizCategory;
  /** The questions in this quiz */
  questions: Question[];
  /** Time per question in seconds */
  timePerQuestion: number;
  /** Creator wallet address */
  creatorAddress: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** Number of times this quiz has been attempted */
  attemptCount: number;
}

/** A compact challenge code payload (encoded into a shareable string) */
export interface ChallengePayload {
  /** Quiz title (abbreviated) */
  t: string;
  /** Category */
  c: string;
  /** Time per question */
  tp: number;
  /** Questions as compact tuples: [text, opt1, opt2, opt3, opt4, correctIndex] */
  q: [string, string, string, string, string, number][];
  /** Creator address */
  cr: string;
}

/** A record of a user's attempt at a challenge */
export interface ChallengeAttempt {
  /** The challenge/quiz ID */
  quizId: string;
  /** Challenge code used */
  challengeCode: string;
  /** Player wallet address */
  playerAddress: string;
  /** Score achieved */
  score: number;
  /** Total questions */
  total: number;
  /** Percentage */
  percentage: number;
  /** ISO timestamp */
  completedAt: string;
}

/** Filter options for browsing challenges */
export type ChallengeFilter = 'all' | 'my-created' | 'my-attempted' | 'featured';

/** Featured / sample challenge descriptor */
export interface FeaturedChallenge {
  code: string;
  title: string;
  category: QuizCategory;
  questionCount: number;
  description: string;
}
