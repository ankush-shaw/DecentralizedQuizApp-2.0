// TypeScript types for the Quiz DApp

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizResult {
  questionId: number;
  userAnswer: string;
  correct: boolean;
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
