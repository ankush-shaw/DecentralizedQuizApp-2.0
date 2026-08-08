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
  Clock,
} from 'lucide-react';
import { QuestionCard } from '../components/QuestionCard';
import { ThemeToggle } from '../components/ThemeToggle';
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
import type { Question, QuizResult, QuizEvent, TxStatus, QuizCategory } from '../types';
import type { Theme } from '../hooks/useTheme';
import { useQuizState } from '../hooks/useQuizState';
import quizData from '../data/questions.json';

const TIME_PER_QUESTION = 15;
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
  selectedCategory?: QuizCategory;
  customQuestions?: Question[] | null;
  customTimePerQuestion?: number | null;
  onComplete: (score: number, total: number, txHash: string | null, detailedResults?: QuizResult[]) => void;
  onBack: () => void;
  onConnectWallet: (type: 'freighter' | 'albedo') => void;
  setTxStatus: (status: TxStatus) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function QuizPage({
  userAddress,
  selectedCategory = 'All',
  customQuestions: customQuestionsProp,
  customTimePerQuestion,
  onComplete,
  onBack,
  onConnectWallet,
  setTxStatus,
  theme,
  onToggleTheme,
}: QuizPageProps) {
  const {
    isPaid,
    setIsPaid,
    currentIndex,
    setCurrentIndex,
    results,
    setResults,
    answeredIds,
    setAnsweredIds,
    highestScore,
    setHighestScore,
    clearQuizState
  } = useQuizState(userAddress);
  
  const [isPaying, setIsPaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<QuizEvent[]>([]);
  const [ledgerAtStart, setLedgerAtStart] = useState<number | undefined>(undefined);

  const effectiveTimePerQ = customTimePerQuestion || TIME_PER_QUESTION;
  const [timeLeft, setTimeLeft] = useState(effectiveTimePerQ);

  const [questions] = useState<Question[]>(() => {
    // Use custom questions if provided (from Challenge Arena)
    if (customQuestionsProp && customQuestionsProp.length > 0) {
      return customQuestionsProp.map((q) => ({ ...q, options: shuffleArray(q.options) }));
    }
    // Otherwise use standard quiz pool
    let pool = QUIZ_QUESTIONS;
    if (selectedCategory && selectedCategory !== 'All') {
      const filtered = pool.filter((q) => q.category === selectedCategory);
      if (filtered.length > 0) {
        pool = filtered;
      }
    }
    return shuffleArray(pool)
      .slice(0, 10)
      .map((q) => ({ ...q, options: shuffleArray(q.options) }));
  });

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  useEffect(() => {
    setTimeLeft(effectiveTimePerQ);
  }, [currentIndex, effectiveTimePerQ]);

  useEffect(() => {
    if (!isPaid || !userAddress || isSubmitting) return;
    if (answeredIds.has(currentQuestion.id)) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isPaid, userAddress, answeredIds, currentQuestion.id, isSubmitting]);

  useEffect(() => {
    if (timeLeft === 0 && !answeredIds.has(currentQuestion.id)) {
      setResults((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          userAnswer: '__TIMEOUT__',
          correctAnswer: currentQuestion.correctAnswer,
          correct: false,
          timedOut: true,
          category: currentQuestion.category,
        },
      }));
      setAnsweredIds((prev) => new Set([...prev, currentQuestion.id]));
    }
  }, [timeLeft, currentQuestion.id, answeredIds, setResults, setAnsweredIds]);



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
      // Non-fatal
    }
  }, []);

  function classifyError(e: unknown): { message: string; type: string } {
    if (e instanceof WalletNotInstalledError) return { message: e.message, type: 'WalletNotInstalled' };
    if (e instanceof TransactionRejectedError) return { message: e.message, type: 'TransactionRejected' };
    if (e instanceof ContractCallError) return { message: e.message, type: 'ContractCallError' };
    return { message: (e as any)?.message || 'An unexpected error occurred.', type: 'Unknown' };
  }

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

  // ── Wallet gate
  if (!userAddress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <div className="glass p-10 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900 flex items-center justify-center mb-6 mx-auto">
            <Wallet className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-2xl font-black mb-3 text-slate-800 dark:text-slate-100">Wallet Required</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
            Please connect your wallet to participate in the decentralized quiz.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => onConnectWallet('freighter')} className="btn-primary justify-center">
              Connect Freighter
            </button>
            <button onClick={() => onConnectWallet('albedo')} className="btn-ghost justify-center">
              Connect Albedo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment gate
  if (!isPaid) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <nav className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <button onClick={onBack} className="btn-ghost text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-10 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900 flex items-center justify-center mb-8 mx-auto">
              <Coins className="w-10 h-10 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-3xl font-black mb-3 text-slate-800 dark:text-slate-100">Entry Fee</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
              A small fee of{' '}
              <span className="text-slate-800 dark:text-slate-200 font-bold">1.0 XLM</span> is required. This is a
              secure{' '}
              <span className="text-brand-600 dark:text-brand-400 font-semibold">inter-contract call</span> on the Stellar network.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    {errorType && (
                      <span className="text-xs font-mono bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded text-red-500 dark:text-red-400 mb-1 inline-block">
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
                  <Loader2 className="animate-spin" size={18} />
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

  const handleAnswer = (answer: string) => {
    if (answeredIds.has(currentQuestion.id)) return;
    const correct = answer === currentQuestion.correctAnswer;
    setResults((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        userAnswer: answer,
        correctAnswer: currentQuestion.correctAnswer,
        correct,
        timedOut: false,
        category: currentQuestion.category,
      },
    }));
    setAnsweredIds((prev) => new Set([...prev, currentQuestion.id]));
  };

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

        const detailedResults = questions.map((q) => results[q.id] || {
          questionId: q.id,
          questionText: q.text,
          userAnswer: '',
          correctAnswer: q.correctAnswer,
          correct: false,
          timedOut: false,
          category: q.category,
        });

        const actualScore = detailedResults.filter((r) => r.correct).length;

        const { hash } = await submitBatchAnswers(userAddress, allAnswers, questions);
        setTxStatus({ state: 'success', hash, error: null, functionName: 'submit_batch' });
        try {
          const events = await listenForQuizEvents(ledgerAtStart);
          if (events.length > 0) setRecentEvents(events);
        } catch {}
        if (actualScore > highestScore) {
          setHighestScore(actualScore);
        }
        clearQuizState();
        onComplete(actualScore, questions.length, hash, detailedResults);
      } catch (e: unknown) {
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

  // ── Quiz UI
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <nav className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="btn-ghost text-sm">
          <ArrowLeft size={15} /> Back to Home
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            {userAddress.slice(0, 6)}…{userAddress.slice(-4)}
          </span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex gap-1.5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-7 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? 'bg-brand-500'
                      : i < currentIndex
                      ? 'bg-brand-200 dark:bg-brand-800'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Clock size={16} className={timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-brand-500"} />
                {timeLeft}s remaining
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-red-500' : 'bg-brand-500'}`} 
                style={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
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

          {/* Event Feed */}
          {recentEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 flex items-center gap-2"
              id="event-feed"
            >
              <Zap size={14} className="text-brand-500 dark:text-brand-400 flex-shrink-0" />
              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                {recentEvents.length} on-chain quiz event{recentEvents.length > 1 ? 's' : ''} detected — contract state updated!
              </span>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-start gap-2 text-red-600 dark:text-red-400 text-sm p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900"
              id="quiz-error-display"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                {errorType && (
                  <span className="text-xs font-mono bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded text-red-500 dark:text-red-400 mb-1 inline-block">
                    {errorType}
                  </span>
                )}
                <p className="mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Next / Submit */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!answeredIds.has(currentQuestion.id) || isSubmitting}
              className="btn-primary"
              id="btn-next-question"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving Score…
                </>
              ) : isLastQuestion ? (
                <>Save Results & Finish <ArrowRight size={18} /></>
              ) : (
                <>Next Question <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
