import { describe, it, expect, beforeEach } from 'vitest';
import { encodeQuiz, decodePayload, generateChallengeCode, lookupChallenge, getAllChallenges } from '../services/challengeService';
import type { CustomQuiz } from '../types/challenge';

describe('challengeService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleQuiz: CustomQuiz = {
    id: 'test-uuid-123',
    title: 'Stellar Soroban Basics',
    description: 'A test quiz about Soroban',
    category: 'Stellar & Crypto',
    timePerQuestion: 15,
    questions: [
      { id: 1, text: 'What is Soroban?', options: ['Smart Contract Engine', 'Crypto Wallet', 'DEX', 'NFT Market'], correctAnswer: 'Smart Contract Engine', category: 'Stellar & Crypto' },
      { id: 2, text: 'What language is used for Soroban?', options: ['Rust', 'Solidity', 'Go', 'Python'], correctAnswer: 'Rust', category: 'Stellar & Crypto' },
    ],
    creatorAddress: 'GABC1234567890TEST',
    createdAt: new Date().toISOString(),
    attemptCount: 0,
  };

  it('should encode a CustomQuiz into a compact payload', () => {
    const payload = encodeQuiz(sampleQuiz);
    expect(payload.t).toBe('Stellar Soroban Basics');
    expect(payload.c).toBe('Stellar & Crypto');
    expect(payload.q.length).toBe(2);
    expect(payload.q[0][0]).toBe('What is Soroban?');
    expect(payload.q[0][5]).toBe(0); // correct index for option 0
    expect(payload.q[1][5]).toBe(0); // correct index for option 0 ('Rust')
  });

  it('should decode a payload back into quiz properties', () => {
    const payload = encodeQuiz(sampleQuiz);
    const decoded = decodePayload(payload);
    expect(decoded.title).toBe('Stellar Soroban Basics');
    expect(decoded.category).toBe('Stellar & Crypto');
    expect(decoded.questions.length).toBe(2);
    expect(decoded.questions[0].text).toBe('What is Soroban?');
    expect(decoded.questions[0].correctAnswer).toBe('Smart Contract Engine');
  });

  it('should generate a 6-character challenge code starting with DQ-', () => {
    const code = generateChallengeCode(sampleQuiz);
    expect(code).toMatch(/^DQ-[A-Z2-9]{6}$/);
  });

  it('should store and look up a challenge by code', () => {
    const code = generateChallengeCode(sampleQuiz);
    const found = lookupChallenge(code);
    expect(found).not.toBeNull();
    expect(found?.payload.t).toBe('Stellar Soroban Basics');
  });
});
