import { describe, it, expect, beforeEach } from 'vitest';
import { generateChallengeCode, saveAttempt, getAllAttempts, getAttemptsForPlayer } from '../services/challengeService';
import type { CustomQuiz } from '../types/challenge';

describe('Challenge storage and attempt tracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const dummyQuiz: CustomQuiz = {
    id: 'q-1',
    title: 'Web3 Security Quiz',
    description: 'Security fundamentals',
    category: 'Web3 & Tech',
    timePerQuestion: 15,
    questions: [
      { id: 1, text: 'What is reentrancy?', options: ['Vulnerability', 'Token standard', 'Consensus', 'Bridge'], correctAnswer: 'Vulnerability', category: 'Web3 & Tech' },
      { id: 2, text: 'What is a private key?', options: ['Secret seed', 'Public address', 'Block hash', 'Tx ID'], correctAnswer: 'Secret seed', category: 'Web3 & Tech' },
    ],
    creatorAddress: 'GUSER123',
    createdAt: new Date().toISOString(),
    attemptCount: 0,
  };

  it('should generate code and store quiz in localStorage', () => {
    const code = generateChallengeCode(dummyQuiz);
    expect(code).toMatch(/^DQ-/);
    const stored = JSON.parse(localStorage.getItem('dquiz_challenges') || '{}');
    const cleanCode = code.replace(/^DQ-/, '');
    expect(stored[cleanCode]).toBeDefined();
    expect(stored[cleanCode].payload.t).toBe('Web3 Security Quiz');
  });

  it('should save and retrieve attempt for a player', () => {
    const attempt = {
      challengeCode: 'DQ-SEC001',
      quizTitle: 'Web3 Security Quiz',
      playerAddress: 'GPLAYER123',
      score: 2,
      total: 2,
      percentage: 100,
      completedAt: new Date().toISOString(),
    };

    saveAttempt(attempt);

    const all = getAllAttempts();
    expect(all.length).toBe(1);
    expect(all[0].playerAddress).toBe('GPLAYER123');

    const playerAttempts = getAttemptsForPlayer('GPLAYER123');
    expect(playerAttempts.length).toBe(1);
    expect(playerAttempts[0].score).toBe(2);
  });
});
