import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChallenge } from '../hooks/useChallenge';
import type { CustomQuiz } from '../types/challenge';

describe('useChallenge hook', () => {
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

  it('should initialize with empty active challenge', () => {
    const { result } = renderHook(() => useChallenge('GUSER123'));
    expect(result.current.activeChallenge).toBeNull();
  });

  it('should create a quiz and return a challenge code', () => {
    const { result } = renderHook(() => useChallenge('GUSER123'));
    let code = '';
    act(() => {
      code = result.current.createQuiz(dummyQuiz);
    });
    expect(code).toMatch(/^DQ-/);
    expect(result.current.myQuizzes.length).toBe(1);
  });

  it('should load a challenge by code', () => {
    const { result } = renderHook(() => useChallenge('GUSER123'));
    let code = '';
    act(() => {
      code = result.current.createQuiz(dummyQuiz);
    });
    let loaded = false;
    act(() => {
      loaded = result.current.loadChallenge(code);
    });
    expect(loaded).toBe(true);
    expect(result.current.activeChallenge?.title).toBe('Web3 Security Quiz');
  });

  it('should record an attempt', () => {
    const { result } = renderHook(() => useChallenge('GUSER123'));
    act(() => {
      result.current.recordAttempt('DQ-TEST01', 'Test Quiz', 5, 5);
    });
    expect(result.current.myAttempts.length).toBe(1);
    expect(result.current.myAttempts[0].score).toBe(5);
    expect(result.current.myAttempts[0].percentage).toBe(100);
  });
});
