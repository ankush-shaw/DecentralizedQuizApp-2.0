import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from './hooks/useWallet';
import { initializeContract } from './services/soroban';
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
  const [page, setPage] = useState<Page>('home');
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);

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
    <div className="min-h-screen bg-slate-950">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-brand-950/30 via-slate-950 to-purple-950/20 pointer-events-none" />
      {/* Grid texture */}
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
                onComplete={handleQuizComplete}
                onBack={() => setPage('home')}
                onConnectWallet={connect}
                setTxStatus={setTxStatus}
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
