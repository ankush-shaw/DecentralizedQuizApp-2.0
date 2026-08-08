import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from './hooks/useWallet';
import { useTheme } from './hooks/useTheme';
import { useChallenge } from './hooks/useChallenge';
import { initializeContract } from './services/soroban';
import { getActiveNetworkName, setActiveNetwork } from './config/networks';
import type { NetworkName } from './config/networks';
import type { QuizCategory, QuizResult, Question } from './types';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { ResultPage } from './pages/ResultPage';
import { QuizBuilder } from './components/QuizBuilder';
import { ChallengeArena } from './components/ChallengeArena';
import { TransactionStatus } from './components/TransactionStatus';
import type { TxStatus } from './types';

type Page = 'home' | 'quiz' | 'result';

interface QuizOutcome {
  score: number;
  total: number;
  txHash: string | null;
  detailedResults: QuizResult[];
}

const DEFAULT_TX_STATUS: TxStatus = {
  state: 'idle',
  hash: null,
  error: null,
  functionName: null,
};

function App() {
  const { wallet, connect, disconnect } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [page, setPage] = useState<Page>('home');
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const [activeNetwork, setNetwork] = useState<NetworkName>(() => getActiveNetworkName());
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory>('All');

  // ── Challenge state
  const challenge = useChallenge(wallet.address);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showArena, setShowArena] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<Question[] | null>(null);
  const [customTimePerQ, setCustomTimePerQ] = useState<number | null>(null);

  const handleNetworkSwitch = useCallback((network: NetworkName) => {
    setActiveNetwork(network);
    setNetwork(network);
    window.location.reload();
  }, []);

  /** Global transaction status */
  const [txStatus, setTxStatus] = useState<TxStatus>(DEFAULT_TX_STATUS);

  const dismissTx = useCallback(() => setTxStatus(DEFAULT_TX_STATUS), []);

  const handleStartQuiz = () => {
    if (!wallet.isConnected) {
      connect('freighter');
      return;
    }
    setCustomQuestions(null);
    setCustomTimePerQ(null);
    setPage('quiz');
  };

  /** Start a challenge quiz with custom questions */
  const handleStartChallenge = () => {
    if (!wallet.isConnected) {
      connect('freighter');
      return;
    }
    if (challenge.activeChallenge) {
      setCustomQuestions(challenge.activeChallenge.questions);
      setCustomTimePerQ(challenge.activeChallenge.timePerQuestion);
      setShowArena(false);
      setPage('quiz');
    }
  };

  const handleQuizComplete = (score: number, total: number, txHash: string | null, detailedResults: QuizResult[] = []) => {
    // Record challenge attempt if applicable
    if (challenge.activeChallenge) {
      challenge.recordAttempt(
        challenge.activeChallenge.code,
        challenge.activeChallenge.title,
        score,
        total
      );
      challenge.clearChallenge();
    }
    setCustomQuestions(null);
    setCustomTimePerQ(null);
    setOutcome({ score, total, txHash, detailedResults });
    setPage('result');
  };

  const handlePlayAgain = () => {
    setOutcome(null);
    setTxStatus(DEFAULT_TX_STATUS);
    setPage('quiz');
  };

  const handleInitialize = useCallback(async () => {
    if (!wallet.address) return;
    setTxStatus({ state: 'pending', hash: null, error: null, functionName: 'create_quiz_batch' });
    try {
      await initializeContract(wallet.address);
      setTxStatus({ state: 'success', hash: null, error: null, functionName: 'create_quiz_batch' });
    } catch (e: any) {
      setTxStatus({ state: 'failed', hash: null, error: e.message, functionName: 'create_quiz_batch' });
    }
  }, [wallet.address]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-100 selection:text-brand-700 transition-colors duration-300">
      {/* Subtle decorative top gradient bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-violet-500 to-brand-600 z-50" />

      {/* Light background mesh pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(99,102,241) 1px, transparent 0)',
          backgroundSize: '32px 32px',
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
                theme={theme}
                onToggleTheme={toggleTheme}
                activeNetwork={activeNetwork}
                onSwitchNetwork={handleNetworkSwitch}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onOpenBuilder={() => setShowBuilder(true)}
                onOpenArena={() => setShowArena(true)}
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
                selectedCategory={selectedCategory}
                customQuestions={customQuestions}
                customTimePerQuestion={customTimePerQ}
                onComplete={handleQuizComplete}
                onBack={() => { setPage('home'); setCustomQuestions(null); setCustomTimePerQ(null); challenge.clearChallenge(); }}
                onConnectWallet={connect}
                setTxStatus={setTxStatus}
                theme={theme}
                onToggleTheme={toggleTheme}
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
                txHash={outcome.txHash}
                detailedResults={outcome.detailedResults}
                onPlayAgain={handlePlayAgain}
                onHome={() => setPage('home')}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global floating transaction status panel */}
      <TransactionStatus status={txStatus} onDismiss={dismissTx} />

      {/* Quiz Builder Modal */}
      <AnimatePresence>
        {showBuilder && wallet.address && (
          <QuizBuilder
            creatorAddress={wallet.address}
            onCreateQuiz={challenge.createQuiz}
            onClose={() => setShowBuilder(false)}
          />
        )}
      </AnimatePresence>

      {/* Challenge Arena Modal */}
      <AnimatePresence>
        {showArena && (
          <ChallengeArena
            onLoadChallenge={challenge.loadChallenge}
            onStartChallenge={handleStartChallenge}
            myAttempts={challenge.myAttempts}
            getAllStoredChallenges={challenge.getAllStoredChallenges}
            onClose={() => setShowArena(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
