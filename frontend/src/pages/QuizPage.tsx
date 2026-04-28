import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Wallet, Link, AlertTriangle, ExternalLink, CheckCircle2, Database } from 'lucide-react';
import { QuestionCard } from '../components/QuestionCard';
import { submitAnswer, getTotalQuizzes, initializeContract } from '../services/soroban';
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
  onConnectWallet: () => void;
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

  const [accountStatus, setAccountStatus] = useState<AccountStatus>('checking');

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const friendbotUrl = `https://friendbot.stellar.org/?addr=${userAddress}`;

  // ── Check if account is funded on testnet ──────────────────────────────────
  useEffect(() => {
    if (!userAddress) return;
    const checkAccount = async () => {
      try {
        const res = await fetch(
          `https://horizon-testnet.stellar.org/accounts/${userAddress}`
        );
        setAccountStatus(res.ok ? 'funded' : 'unfunded');
      } catch {
        setAccountStatus('unfunded');
      }
    };
    checkAccount();
  }, [userAddress]);

  // ── Wallet gate ─────────────────────────────────────────────────────────────
  if (!userAddress) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="flex items-center px-6 py-5 border-b border-white/5">
          <button onClick={onBack} className="btn-ghost text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={onBack} className="btn-ghost text-sm">Cancel</button>
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
        // Collect all answers from state
        const allAnswers = questions.map(q => ({
          id: q.id,
          answer: results[q.id]?.userAnswer || ''
        }));

        console.log("Submitting batch of", allAnswers.length, "answers...");
        const success = await onBatchSubmit(allAnswers);
        
        if (success) {
          const score = Object.values(results).filter((r) => r.correct).length;
          onComplete(score, questions.length);
        } else {
          setError('Failed to save score on-chain. Please check your wallet and try again.');
        }
      } catch (err) {
        setError('Transaction failed. Make sure you have enough testnet XLM.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const canProceed = answeredIds.has(currentQuestion.id);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <button onClick={onBack} className="btn-ghost text-sm">
          <ArrowLeft size={16} /> Back to Home
        </button>
        <div className="flex items-center gap-3">
           <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <Database size={12} className="text-brand-400" />
            <span className="text-slate-400">On-chain mode enabled</span>
          </div>
          <span className="text-sm font-mono text-brand-400">
            {userAddress.slice(0, 6)}…{userAddress.slice(-4)}
          </span>
        </div>
      </nav>

      {/* Account funding banner */}
      <AnimatePresence>
        {accountStatus === 'unfunded' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertTriangle size={16} />
              <span>
                <strong>Testnet account not funded.</strong> You'll need some test XLM to save your results.
              </span>
            </div>
            <a
              href={friendbotUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setTimeout(() => setAccountStatus('funded'), 5000)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Fund with Friendbot <ExternalLink size={12} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentIndex}
            question={currentQuestion}
            currentIndex={currentIndex}
            total={questions.length}
            result={results[currentQuestion.id] ?? null}
            isSubmitting={false}
            alreadyAnswered={answeredIds.has(currentQuestion.id)}
            onAnswer={handleAnswer}
          />
        </AnimatePresence>

        {error && (
          <p className="mt-4 text-amber-400 text-sm text-center max-w-sm">{error}</p>
        )}

        {canProceed && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            disabled={isSubmitting}
            onClick={handleNext}
            className="btn-primary mt-6 min-w-[200px] justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving to Ledger...
              </>
            ) : isLastQuestion ? (
              <>
                Save Results & Finish
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                Next Question
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        )}
      </main>
    </div>
  );
}
