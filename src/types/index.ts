export type QuizCategory =
  | 'All'
  | 'Stellar & Crypto'
  | 'Web3 & Tech'
  | 'History & Culture'
  | 'General Science'
  | 'Math & Logic';

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  category?: QuizCategory;
}

export interface QuizResult {
  questionId: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  timedOut: boolean;
  category?: QuizCategory;
}

// ─── Achievement Tiers ────────────────────────────────────────────────────────
/** Achievement tier based on quiz performance percentage */
export type AchievementTier = 'gold' | 'silver' | 'bronze' | 'none';

export function getAchievementTier(percentage: number): AchievementTier {
  if (percentage === 100) return 'gold';
  if (percentage >= 80) return 'silver';
  if (percentage >= 60) return 'bronze';
  return 'none';
}

export interface LeaderboardEntry {
  address: string;
  score: number;
  rank: number;
}

export type WalletState = {
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
};

export type QuizState = 'idle' | 'loading' | 'active' | 'submitting' | 'complete' | 'error';

// ─── Transaction Status ───────────────────────────────────────────────────────
/** Tracks the lifecycle of a Soroban transaction submitted from the frontend */
export type TxStatusState = 'idle' | 'pending' | 'success' | 'failed';

export interface TxStatus {
  state: TxStatusState;
  hash: string | null;
  error: string | null;
  /** Name of the contract function being called */
  functionName: string | null;
}

// ─── Contract Event ────────────────────────────────────────────────────────
/** Represents a quiz_ans contract event emitted by the Soroban contract */
export interface QuizEvent {
  questionId: number;
  solver: string;
  timestamp: number;
}

