import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from './hooks/useWallet';
import { submitAnswer, initializeContract } from './services/soroban';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { ResultPage } from './pages/ResultPage';

type Page = 'home' | 'quiz' | 'result';

interface QuizOutcome {
  score: number;
  total: number;
}

function App() {
  const { wallet, connect, disconnect } = useWallet();
  const [page, setPage] = useState<Page>('home');
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);

  const handleStartQuiz = () => {
    if (!wallet.isConnected) {
      connect();
      return;
    }
    setPage('quiz');
  };

  const handleSubmitAnswer = useCallback(
    async (questionId: number, answer: string): Promise<boolean | null> => {
      if (!wallet.address) return null;
      // Try to submit on-chain; catches errors gracefully
      try {
        const result = await submitAnswer(wallet.address, questionId, answer);
        return result;
      } catch {
        // If Freighter is not available or user rejects, return null (UI handles this)
        return null;
      }
    },
    [wallet.address]
  );

  const handleQuizComplete = (score: number, total: number) => {
    setOutcome({ score, total });
    setPage('result');
  };

  const handlePlayAgain = () => {
    setOutcome(null);
    setPage('quiz');
  };

  const handleInitialize = useCallback(async () => {
    if (!wallet.address) return;
    await initializeContract(wallet.address);
  }, [wallet.address]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-brand-950/30 via-slate-950 to-purple-950/20 pointer-events-none" />
      {/* Grid texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HomePage
                wallet={wallet}
                onConnect={connect}
                onDisconnect={disconnect}
                onStartQuiz={handleStartQuiz}
                onInitialize={handleInitialize}
              />
            </motion.div>
          )}

          {page === 'quiz' && wallet.address && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuizPage
                userAddress={wallet.address ?? ''}
                onSubmitAnswer={handleSubmitAnswer}
                onComplete={handleQuizComplete}
                onBack={() => setPage('home')}
                onConnectWallet={connect}
              />
            </motion.div>
          )}

          {page === 'result' && outcome && wallet.address && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultPage
                score={outcome.score}
                total={outcome.total}
                address={wallet.address}
                onPlayAgain={handlePlayAgain}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
