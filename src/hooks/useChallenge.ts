import { useState, useCallback, useEffect } from 'react';
import type { CustomQuiz } from '../types/challenge';
import type { Question, QuizCategory } from '../types';
import {
  generateChallengeCode,
  lookupChallenge,
  decodePayload,
  saveAttempt,
  incrementAttemptCount,
  getAttemptsForPlayer,
  getAllChallenges,
} from '../services/challengeService';
import type { StoredAttempt } from '../services/challengeService';
import { registerFeaturedChallenges } from '../data/featuredChallenges';

const MY_QUIZZES_KEY = 'dquiz_my_created_quizzes';

export function useChallenge(playerAddress: string | null) {
  const [myQuizzes, setMyQuizzes] = useState<CustomQuiz[]>([]);
  const [myAttempts, setMyAttempts] = useState<StoredAttempt[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<{
    code: string;
    title: string;
    category: QuizCategory;
    timePerQuestion: number;
    questions: Question[];
    creator: string;
  } | null>(null);

  // Register featured challenges on mount
  useEffect(() => {
    registerFeaturedChallenges();
  }, []);

  // Load user's created quizzes from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(MY_QUIZZES_KEY) || '[]');
      setMyQuizzes(stored);
    } catch { /* ignore */ }
  }, []);

  // Load user's attempts
  useEffect(() => {
    if (playerAddress) {
      setMyAttempts(getAttemptsForPlayer(playerAddress));
    }
  }, [playerAddress]);

  /** Create a new custom quiz and generate a challenge code */
  const createQuiz = useCallback((quiz: CustomQuiz): string => {
    const code = generateChallengeCode(quiz);

    // Save to user's created quizzes list
    const updated = [...myQuizzes, quiz];
    setMyQuizzes(updated);
    localStorage.setItem(MY_QUIZZES_KEY, JSON.stringify(updated));

    return code;
  }, [myQuizzes]);

  /** Load a challenge by code and set it as active */
  const loadChallenge = useCallback((code: string): boolean => {
    const result = lookupChallenge(code);
    if (!result) return false;

    const decoded = decodePayload(result.payload);
    setActiveChallenge({
      code,
      title: decoded.title,
      category: decoded.category,
      timePerQuestion: decoded.timePerQuestion,
      questions: decoded.questions,
      creator: decoded.creator,
    });
    return true;
  }, []);

  /** Record a completed challenge attempt */
  const recordAttempt = useCallback((code: string, title: string, score: number, total: number) => {
    if (!playerAddress) return;
    const attempt: StoredAttempt = {
      challengeCode: code,
      quizTitle: title,
      playerAddress,
      score,
      total,
      percentage: Math.round((score / total) * 100),
      completedAt: new Date().toISOString(),
    };
    saveAttempt(attempt);
    incrementAttemptCount(code);
    setMyAttempts((prev) => [...prev, attempt]);
  }, [playerAddress]);

  /** Clear the active challenge */
  const clearChallenge = useCallback(() => {
    setActiveChallenge(null);
  }, []);

  /** Get all stored challenge codes with metadata */
  const getAllStoredChallenges = useCallback(() => {
    const all = getAllChallenges();
    return Object.entries(all).map(([code, data]) => ({
      code: `DQ-${code}`,
      title: data.payload.t,
      category: data.payload.c as QuizCategory,
      questionCount: data.payload.q.length,
      creator: data.payload.cr,
      attemptCount: data.attemptCount,
      createdAt: data.createdAt,
    }));
  }, []);

  return {
    myQuizzes,
    myAttempts,
    activeChallenge,
    createQuiz,
    loadChallenge,
    recordAttempt,
    clearChallenge,
    getAllStoredChallenges,
  };
}
