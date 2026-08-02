import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from './hooks/useWallet';
import { useTheme } from './hooks/useTheme';
import { initializeContract } from './services/soroban';
import { getActiveNetworkName, setActiveNetwork } from './config/networks';
import type { NetworkName } from './config/networks';
import type { QuizCategory } from './types';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { ResultPage } from './pages/ResultPage';
import { TransactionStatus } from './components/TransactionStatus';
import type { TxStatus } from './types';

type Page = 'home' | 'quiz' | 'result';

interface QuizOutcome {
  score: number;
  total: number;
  txHash: string | null;
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

  const handleNetworkSwitch = useCallback((network: NetworkName) => {
    setActiveNetwork(network);
    setNetwork(network);
    // Reload the app data for the new network
    window.location.reload();
  }, []);

  /** Global transaction status — shown as a floating panel across all pages */
  const [txStatus, setTxStatus] = useState<TxStatus>(DEFAULT_TX_STATUS);

  const dismissTx = useCallback(() => setTxStatus(DEFAULT_TX_STATUS), []);

  const handleStartQuiz = () => {
    if (!wallet.isConnected) {
      connect('freighter');
      return;
    }
    setPage('quiz');
  };

  const handleQuizComplete = (score: number, total: number, txHash: string | null) => {
    setOutcome({ score, total, txHash });
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
                onComplete={handleQuizComplete}
                onBack={() => setPage('home')}
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
    </div>
  );
}

export default App;
