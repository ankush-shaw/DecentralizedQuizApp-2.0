import { useState, useEffect } from 'react';
import type { QuizResult } from '../types';

interface QuizState {
  isPaid: boolean;
  currentIndex: number;
  results: Record<number, QuizResult>;
  answeredIds: number[];
}

const STORAGE_KEY = 'dquiz_progress_v1';

export function useQuizState(userAddress: string) {
  // We use the user address in the key to ensure state is per-wallet
  const key = `${STORAGE_KEY}_${userAddress}`;

  const loadState = (): QuizState | null => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load quiz state', e);
    }
    return null;
  };

  const [isPaid, setIsPaid] = useState<boolean>(() => {
    return loadState()?.isPaid ?? false;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    return loadState()?.currentIndex ?? 0;
  });

  const [results, setResults] = useState<Record<number, QuizResult>>(() => {
    return loadState()?.results ?? {};
  });

  const [answeredIds, setAnsweredIds] = useState<Set<number>>(() => {
    const loaded = loadState()?.answeredIds;
    return loaded ? new Set(loaded) : new Set();
  });

  // Save state whenever it changes
  useEffect(() => {
    if (userAddress) {
      const stateToSave: QuizState = {
        isPaid,
        currentIndex,
        results,
        answeredIds: Array.from(answeredIds),
      };
      try {
        localStorage.setItem(key, JSON.stringify(stateToSave));
      } catch (e) {
        console.error('Failed to save quiz state', e);
      }
    }
  }, [isPaid, currentIndex, results, answeredIds, userAddress, key]);

  const clearQuizState = () => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to clear quiz state', e);
    }
    setIsPaid(false);
    setCurrentIndex(0);
    setResults({});
    setAnsweredIds(new Set());
  };

  return {
    isPaid,
    setIsPaid,
    currentIndex,
    setCurrentIndex,
    results,
    setResults,
    answeredIds,
    setAnsweredIds,
    clearQuizState,
  };
}
