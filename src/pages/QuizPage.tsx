import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Wallet,
  Coins,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { QuestionCard } from '../components/QuestionCard';
import {
  getTotalQuizzes,
  payEntryFee,
  submitBatchAnswers,
  listenForQuizEvents,
} from '../services/soroban';
import {
  WalletNotInstalledError,
  TransactionRejectedError,
  ContractCallError,
} from '../services/errors';
import type { Question, QuizResult, QuizEvent, TxStatus } from '../types';
import quizData from '../data/questions.json';

const QUIZ_QUESTIONS = quizData as Question[];

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

interface QuizPageProps {
  userAddress: string;
  onComplete: (score: number, total: number, txHash: string | null) => void;
  onBack: () => void;
  onConnectWallet: (type: 'freighter' | 'albedo') => void;
  setTxStatus: (status: TxStatus) => void;
}

export function QuizPage({
  userAddress,
  onComplete,
  onBack,
  onConnectWallet,
  setTxStatus,
}: QuizPageProps) {
  const [isPaid, setIsPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<number, QuizResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());
  const [recentEvents, setRecentEvents] = useState<QuizEvent[]>([]);
  const [ledgerAtStart, setLedgerAtStart] = useState<number | undefined>(undefined);

  const [questions] = useState<Question[]>(() =>
    shuffleArray(QUIZ_QUESTIONS.slice(0, 15))
      .slice(0, 10)
      .map((q) => ({ ...q, options: shuffleArray(q.options) }))
  );

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // ── Capture starting ledger when user pays fee ─────────────────────────────
  const captureLedger = useCallback(async () => {
    try {
      const res = await fetch('https://soroban-testnet.stellar.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getLatestLedger', params: {} }),
      });
      const json = await res.json();
      setLedgerAtStart(Math.max(1, (json.result?.sequence ?? 100) - 2));
    } catch {
      // Non-fatal; event polling will use a reasonable default
    }
  }, []);

  // ── Classify error type ──────────────────────────────────────────────────────
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

  // ── Handle entry fee payment ─────────────────────────────────────────────────
  const handlePay = async () => {
    setIsPaying(true);
    setError(null);
    setErrorType(null);
    setTxStatus({ state: 'pending', hash: null, error: null, functionName: 'pay_entry_fee' });

    try {
      const success = await payEntryFee(userAddress);
      if (success) {
        setTxStatus({ state: 'success', hash: null, error: null, functionName: 'pay_entry_fee' });
        await captureLedger();
        setIsPaid(true);
      } else {
        setTxStatus({ state: 'failed', hash: null, error: 'Transaction timed out.', functionName: 'pay_entry_fee' });
        setError('Transaction timed out or failed on-chain.');
        setErrorType('ContractCallError');
      }
    } catch (e: unknown) {
      const { message, type } = classifyError(e);
      setError(message);
      setErrorType(type);
      setTxStatus({ state: 'failed', hash: null, error: message, functionName: 'pay_entry_fee' });
    } finally {
      setIsPaying(false);
    }
  };

  // ── Wallet gate ──────────────────────────────────────────────────────────────
  if (!userAddress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center glass m-6">
        <Wallet className="w-16 h-16 text-brand-400 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Wallet Required</h2>
        <p className="text-slate-400 mb-8 max-w-sm">
          Please connect your wallet to participate in the decentralized quiz.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto">
          <button
            onClick={() => onConnectWallet('freighter')}
            className="btn-primary flex-1 justify-center"
          >
            Freighter
          </button>
          <button
            onClick={() => onConnectWallet('albedo')}
            className="btn-ghost flex-1 justify-center border border-white/10"
          >
            Albedo
          </button>
        </div>
      </div>
    );
  }

  // ── Payment gate ─────────────────────────────────────────────────────────────
  if (!isPaid) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="flex items-center px-6 py-5 border-b border-white/5">
          <button onClick={onBack} className="btn-ghost text-sm flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </button>
        </nav>
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-10 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center mb-8 mx-auto">
              <Coins className="w-10 h-10 text-brand-400" />
            </div>
            <h2 className="text-3xl font-black mb-4">Entry Fee</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              A small entry fee of{' '}
              <span className="text-white font-bold">1.0 XLM</span> is required. This
              is a secure{' '}
              <span className="text-brand-400">inter-contract call</span> on the Stellar
              network.
            </p>

            {/* Error display with error type badge */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <div>
                    {errorType && (
                      <span className="text-xs font-mono bg-red-500/20 px-2 py-0.5 rounded text-red-300 mb-1 inline-block">
                        {errorType}
                      </span>
                    )}
                    <p className="text-sm font-medium mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={isPaying}
              className="btn-primary w-full justify-center"
              id="btn-pay-entry-fee"
            >
              {isPaying ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing…
                </>
              ) : (
                'Pay 1.0 XLM & Start'
              )}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Answer handler (local, no chain call) ────────────────────────────────────
  const handleAnswer = (answer: string) => {
    if (answeredIds.has(currentQuestion.id)) return;
    const correct = answer === currentQuestion.correctAnswer;
    setResults((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        userAnswer: answer,
        correct,
      },
    }));
    setAnsweredIds((prev) => new Set([...prev, currentQuestion.id]));
  };

  // ── Submit all answers in one batch tx ───────────────────────────────────────
  const handleNext = async () => {
    setError(null);
    setErrorType(null);

    if (isLastQuestion) {
      setIsSubmitting(true);
      setTxStatus({ state: 'pending', hash: null, error: null, functionName: 'submit_batch' });

      try {
        const allAnswers = questions.map((q) => ({
          id: q.id,
          answer: results[q.id]?.userAnswer || '',
        }));

        // ── Contract call from frontend (Level 2 requirement) ────────────────
        const { score, hash } = await submitBatchAnswers(userAddress, allAnswers);

        setTxStatus({ state: 'success', hash, error: null, functionName: 'submit_batch' });

        // ── Real-time event integration — poll for quiz_ans events ───────────
        try {
          const events = await listenForQuizEvents(ledgerAtStart);
          if (events.length > 0) setRecentEvents(events);
        } catch {
          // Non-fatal
        }

        onComplete(score, questions.length, hash);
      } catch (e: unknown) {
        // ── Handle all 3 named error types ───────────────────────────────────
        const { message, type } = classifyError(e);
        setError(message);
        setErrorType(type);
        setTxStatus({ state: 'failed', hash: null, error: message, functionName: 'submit_batch' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // ── Quiz UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <button onClick={onBack} className="btn-ghost text-sm">
          <ArrowLeft size={16} /> Back to Home
        </button>
        <span className="text-sm font-mono text-brand-400">
          {userAddress.slice(0, 6)}…{userAddress.slice(-4)}
        </span>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Progress bar */}
          <div className="flex justify-between items-center mb-8">
            <span className="text-slate-500 text-sm font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i === currentIndex
                      ? 'bg-brand-400'
                      : i < currentIndex
                      ? 'bg-brand-400/30'
                      : 'bg-white/5'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                selectedAnswer={results[currentQuestion.id]?.userAnswer}
                disabled={isSubmitting}
              />
            </motion.div>
          </AnimatePresence>

          {/* Real-time event feed */}
          {recentEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-2"
              id="event-feed"
            >
              <Zap size={14} className="text-brand-400 flex-shrink-0" />
              <span className="text-xs text-brand-400">
                {recentEvents.length} on-chain quiz event{recentEvents.length > 1 ? 's' : ''}{' '}
                detected — contract state updated!
              </span>
            </motion.div>
          )}

          {/* Error display with error type badge */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-start gap-2 text-red-400 text-sm p-3 rounded-xl bg-red-500/10 border border-red-500/20"
              id="quiz-error-display"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                {errorType && (
                  <span className="text-xs font-mono bg-red-500/20 px-2 py-0.5 rounded text-red-300 mb-1 inline-block">
                    {errorType}
                  </span>
                )}
                <p className="mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Next / Submit button */}
          <div className="mt-10 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!answeredIds.has(currentQuestion.id) || isSubmitting}
              className="btn-primary"
              id="btn-next-question"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving Score…
                </>
              ) : isLastQuestion ? (
                <>
                  Save Results & Finish
                  <ArrowRight size={20} />
                </>
              ) : (
                <>
                  Next Question
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
