import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Wallet, Coins, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { QuestionCard } from '../components/QuestionCard';
import { submitAnswer, getTotalQuizzes, initializeContract, payEntryFee } from '../services/soroban';
import type { Question, QuizResult } from '../types';
import quizData from '../data/questions.json';

const QUIZ_QUESTIONS = quizData as Question[];

// Helper to shuffle the array
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
  onBatchSubmit: (answers: { id: number; answer: string }[]) => Promise<boolean>;
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
  onConnectWallet: (type: 'freighter' | 'albedo') => void;
}

export function QuizPage({
  userAddress,
  onBatchSubmit,
  onComplete,
  onBack,
  onConnectWallet,
}: QuizPageProps) {
  const [isPaid, setIsPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<number, QuizResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());

  const [questions] = useState<Question[]>(() => 
    shuffleArray(QUIZ_QUESTIONS.slice(0, 15)).slice(0, 10).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }))
  );

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handlePay = async () => {
    setIsPaying(true);
    setError(null);
    try {
      const success = await payEntryFee(userAddress);
      if (success) {
        setIsPaid(true);
      } else {
        setError('Transaction timed out or failed on-chain.');
      }
    } catch (e: any) {
      setError(e.message || 'Payment failed. Please check your balance.');
    } finally {
      setIsPaying(false);
    }
  };

  // ── Wallet gate ─────────────────────────────────────────────────────────────
  if (!userAddress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center glass m-6">
        <Wallet className="w-16 h-16 text-brand-400 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Wallet Required</h2>
        <p className="text-slate-400 mb-8 max-w-sm">Please connect your wallet to participate in the decentralized quiz.</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto">
          <button onClick={() => onConnectWallet('freighter')} className="btn-primary flex-1 justify-center">Freighter</button>
          <button onClick={() => onConnectWallet('albedo')} className="btn-ghost flex-1 justify-center border border-white/10">Albedo</button>
        </div>
      </div>
    );
  }

  // ── Payment gate ────────────────────────────────────────────────────────────
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
              To play this quiz, a small entry fee of <span className="text-white font-bold">1.0 XLM</span> is required. 
              This is a secure <span className="text-brand-400">inter-contract call</span> on the Stellar network.
            </p>
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <button 
              onClick={handlePay} 
              disabled={isPaying}
              className="btn-primary w-full justify-center"
            >
              {isPaying ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
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

  // ── Answer handler (Local only for UX) ──────────────────────────────────────
  const handleAnswer = (answer: string) => {
    if (answeredIds.has(currentQuestion.id)) return;

    const correct = answer === currentQuestion.correctAnswer;
    setResults((prev) => ({
      ...prev,
      [currentQuestion.id]: { questionId: currentQuestion.id, userAnswer: answer, correct },
    }));
    setAnsweredIds((prev) => new Set([...prev, currentQuestion.id]));
  };

  const handleNext = async () => {
    setError(null);
    if (isLastQuestion) {
      setIsSubmitting(true);
      try {
        const allAnswers = questions.map(q => ({
          id: q.id,
          answer: results[q.id]?.userAnswer || ''
        }));

        const success = await onBatchSubmit(allAnswers);
        
        if (success) {
          const score = Object.values(results).filter((r) => r.correct).length;
          onComplete(score, questions.length);
        } else {
          setError('Failed to save score on-chain. Please check your wallet.');
        }
      } catch (err) {
        setError('Transaction failed.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <button onClick={onBack} className="btn-ghost text-sm">
          <ArrowLeft size={16} /> Back to Home
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-brand-400">
            {userAddress.slice(0, 6)}…{userAddress.slice(-4)}
          </span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-8">
            <span className="text-slate-500 text-sm font-medium">Question {currentIndex + 1} of {questions.length}</span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-brand-400' : i < currentIndex ? 'bg-brand-400/30' : 'bg-white/5'
                  }`}
                />
              ))}
            </div>
          </div>

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

          <div className="mt-10 flex justify-between items-center">
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="flex-1" />
            <button
              onClick={handleNext}
              disabled={!answeredIds.has(currentQuestion.id) || isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving Score...
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
