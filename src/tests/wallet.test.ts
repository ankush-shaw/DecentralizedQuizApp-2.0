import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WalletNotInstalledError,
  TransactionRejectedError,
  ContractCallError,
} from '../services/errors';

// A mock logic representing error classification in the UI
function classifyError(e: unknown): { message: string; type: string } {
  if (e instanceof WalletNotInstalledError) {
    return { message: e.message, type: 'WalletNotInstalled' };
  }
  if (e instanceof TransactionRejectedError) {
    return { message: e.message, type: 'TransactionRejected' };
  }
  if (e instanceof ContractCallError) {
    return { message: e.message, type: 'ContractCallError' };
  }
  return { message: (e as any)?.message || 'An unexpected error occurred.', type: 'Unknown' };
}

describe('Frontend Business Logic & Error Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Custom Error Classes', () => {
    it('should construct WalletNotInstalledError with correct name and properties', () => {
      const err = new WalletNotInstalledError('Freighter');
      expect(err.name).toBe('WalletNotInstalledError');
      expect(err.walletName).toBe('Freighter');
      expect(err.message).toContain('Freighter wallet is not installed');
    });

    it('should construct TransactionRejectedError with correct name and default message', () => {
      const err = new TransactionRejectedError();
      expect(err.name).toBe('TransactionRejectedError');
      expect(err.message).toContain('Transaction was rejected');
    });

    it('should construct ContractCallError with contract details and optional hash', () => {
      const err = new ContractCallError('submit_batch', 'simulation failed', 'tx123');
      expect(err.name).toBe('ContractCallError');
      expect(err.functionName).toBe('submit_batch');
      expect(err.txHash).toBe('tx123');
      expect(err.message).toContain("Contract call 'submit_batch' failed on-chain");
    });
  });

  describe('classifyError utility', () => {
    it('should correctly classify WalletNotInstalledError', () => {
      const err = new WalletNotInstalledError('Hana');
      const result = classifyError(err);
      expect(result.type).toBe('WalletNotInstalled');
      expect(result.message).toContain('Hana');
    });

    it('should correctly classify TransactionRejectedError', () => {
      const err = new TransactionRejectedError('Cancelled by user');
      const result = classifyError(err);
      expect(result.type).toBe('TransactionRejected');
      expect(result.message).toBe('Cancelled by user');
    });

    it('should correctly classify ContractCallError', () => {
      const err = new ContractCallError('pay_entry_fee', 'out of gas');
      const result = classifyError(err);
      expect(result.type).toBe('ContractCallError');
      expect(result.message).toContain('pay_entry_fee');
    });

    it('should fall back to Unknown for generic errors', () => {
      const err = new Error('Generic database error');
      const result = classifyError(err);
      expect(result.type).toBe('Unknown');
      expect(result.message).toBe('Generic database error');
    });
  });

  describe('Quiz Score local tracking', () => {
    // Simple verification helper representing correct answers logic
    const mockQuestions = [
      { id: 1, text: 'Q1', options: ['A', 'B'], correctAnswer: 'A' },
      { id: 2, text: 'Q2', options: ['A', 'B'], correctAnswer: 'B' },
    ];

    it('should correctly evaluate score locally based on questions and answers', () => {
      const userAnswers = [
        { id: 1, answer: 'A' }, // Correct
        { id: 2, answer: 'A' }, // Incorrect
      ];

      const score = userAnswers.filter((ua) => {
        const q = mockQuestions.find((mq) => mq.id === ua.id);
        return q && q.correctAnswer === ua.answer;
      }).length;

      expect(score).toBe(1);
    });
  });
});
