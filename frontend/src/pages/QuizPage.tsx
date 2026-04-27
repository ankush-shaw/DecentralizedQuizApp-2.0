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
  onSubmitAnswer: (qId: number, answer: string) => Promise<boolean | null>;
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
  onConnectWallet: () => void;
}

type AccountStatus = 'checking' | 'funded' | 'unfunded';

export function QuizPage({
  userAddress,
  onSubmitAnswer,
  onComplete,
  onBack,
  onConnectWallet,
}: QuizPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<number, QuizResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());
  const [onChainCount, setOnChainCount] = useState(0);

  const [questions] = useState<Question[]>(() => 
    shuffleArray(QUIZ_QUESTIONS.slice(0, 15)).slice(0, 5).map(q => ({
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
        </nav>
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-10 max-w-md w-full text-center"
          >
            <div className="p-4 rounded-full bg-brand-500/20 inline-flex mb-4">
              <Wallet size={36} className="text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Wallet Required</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Connect your <strong className="text-white">Freighter wallet</strong> before playing.
              Each answer requires your on-chain signature.
            </p>
            <button onClick={onConnectWallet} className="btn-primary w-full justify-center">
              <Wallet size={18} /> Connect Wallet
            </button>
            <p className="mt-4 text-xs text-slate-500">
              Don't have Freighter?{' '}
              <a href="https://freighter.app" target="_blank" rel="noreferrer" className="text-brand-400 underline">
                Install it here
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Answer handler ─────────────────────────────────────────────────────────
  const handleAnswer = async (answer: string) => {
    if (answeredIds.has(currentQuestion.id) || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmitAnswer(currentQuestion.id, answer);
      const isOnChain = result !== null;
      const correct = answer === currentQuestion.correctAnswer;

      if (isOnChain) {
        setOnChainCount((c) => c + 1);
        // If it worked, mark account as funded (in case we didn't know)
        setAccountStatus('funded');
      } else {
        setError('Transaction failed — answer not recorded on-chain.');
      }

      setResults((prev) => ({
        ...prev,
        [currentQuestion.id]: { questionId: currentQuestion.id, userAnswer: answer, correct },
      }));
      setAnsweredIds((prev) => new Set([...prev, currentQuestion.id]));
    } catch {
      setError('Transaction error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setError(null);
    if (isLastQuestion) {
      const score = Object.values(results).filter((r) => r.correct).length;
      onComplete(score, questions.length);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const canProceed = answeredIds.has(currentQuestion.id) && !isSubmitting;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <button onClick={onBack} className="btn-ghost text-sm">
          <ArrowLeft size={16} /> Back to Home
        </button>
        <div className="flex items-center gap-3">
          <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <Link size={12} className="text-green-400" />
            <span className="text-slate-400">{onChainCount}/{answeredIds.size} on-chain</span>
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
                <strong>Testnet account not funded.</strong> Answers can't be submitted on-chain yet.
              </span>
            </div>
            <a
              href={friendbotUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setTimeout(() => setAccountStatus('funded'), 5000)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Fund with Friendbot (free) <ExternalLink size={12} />
            </a>
          </motion.div>
        )}
        {accountStatus === 'funded' && onChainCount === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-500/10 border-b border-green-500/30 px-6 py-3 flex items-center gap-2 text-green-400 text-sm"
          >
            <CheckCircle2 size={16} />
            <span>Account funded ✓ — Freighter will ask you to sign each answer transaction.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentIndex}
            question={currentQuestion}
            currentIndex={currentIndex}
            total={questions.length}
            result={results[currentQuestion.id] ?? null}
            isSubmitting={isSubmitting}
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
            onClick={handleNext}
            className="btn-primary mt-6"
          >
            {isLastQuestion ? 'View Results' : 'Next Question'}
            <ArrowRight size={18} />
          </motion.button>
        )}
      </main>
    </div>
  );
}
