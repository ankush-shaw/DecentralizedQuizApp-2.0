import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Github, ExternalLink, Shield, Brain, Layers, Zap, LogOut, Swords, PenTool } from 'lucide-react';
import type { WalletState, QuizCategory, Question } from '../types';
import { getTotalQuizzes, getLeaderboard, CONTRACT_ID, getIsTestnet } from '../services/soroban';
import type { WalletType } from '../services/soroban';
import { Leaderboard } from '../components/Leaderboard';
import { LiveEventTicker } from '../components/LiveEventTicker';
import { ThemeToggle } from '../components/ThemeToggle';
import { NetworkSwitcher } from '../components/NetworkSwitcher';
import { CategorySelector } from '../components/CategorySelector';
import type { Theme } from '../hooks/useTheme';
import { useQuizState } from '../hooks/useQuizState';
import type { NetworkName } from '../config/networks';
import quizData from '../data/questions.json';

interface HomePageProps {
  wallet: WalletState;
  onConnect: (type: WalletType) => void;
  onDisconnect: () => void;
  onStartQuiz: () => void;
  onInitialize: () => Promise<void>;
  theme: Theme;
  onToggleTheme: () => void;
  activeNetwork: NetworkName;
  onSwitchNetwork: (network: NetworkName) => void;
  selectedCategory: QuizCategory;
  onSelectCategory: (category: QuizCategory) => void;
  onOpenBuilder: () => void;
  onOpenArena: () => void;
}

export function HomePage({ wallet, onConnect, onDisconnect, onStartQuiz, onInitialize, theme, onToggleTheme, activeNetwork, onSwitchNetwork, selectedCategory, onSelectCategory, onOpenBuilder, onOpenArena }: HomePageProps) {
  const [totalQuizzes, setTotalQuizzes] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const { highestScore } = useQuizState(wallet.address || '');

  const categoryCounts = useMemo(() => {
    const counts: Record<QuizCategory, number> = {
      'All': (quizData as Question[]).length,
      'Stellar & Crypto': 0,
      'Web3 & Tech': 0,
      'History & Culture': 0,
      'General Science': 0,
      'Math & Logic': 0,
    };
    (quizData as Question[]).forEach((q) => {
      if (q.category && q.category in counts) {
        counts[q.category as QuizCategory]++;
      }
    });
    return counts;
  }, []);

  useEffect(() => {
    async function checkCount() {
      try {
        setErrorStatus(null);
        const count = await getTotalQuizzes();
        setTotalQuizzes(count);
      } catch (e: any) {
        console.error('Initial check failed:', e);
        setErrorStatus(e.message || 'Simulation failure');
        setTotalQuizzes(null);
      }
    }

    async function fetchOnChainLeaderboard() {
      setIsLoadingLeaderboard(true);
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (e) {
        console.error('Failed to fetch leaderboard:', e);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    }

    checkCount();
    fetchOnChainLeaderboard();
  }, [wallet.isConnected]);

  const features = [
    { icon: Brain, title: 'On-Chain Questions', desc: 'All questions stored immutably on Stellar Soroban — fully transparent and verifiable.', color: 'bg-violet-50 text-violet-600 border-violet-100' },
    { icon: Shield, title: 'Tamper-Proof Scoring', desc: 'Your score is verified and recorded by smart contracts. No admin, no cheating.', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { icon: Layers, title: 'Permissionless', desc: 'Anyone can build, play, and verify results on the Stellar network without permission.', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { icon: PenTool, title: 'Custom Quiz Builder', desc: 'Create your own quizzes with custom questions, time limits, and shareable challenge codes.', color: 'bg-pink-50 text-pink-600 border-pink-100' },
    { icon: Swords, title: 'Challenge Arena', desc: 'Enter challenge codes to compete on peer-to-peer quizzes. Track scores and leaderboards.', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="sticky top-1 z-40 mx-4 mt-4 flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">DQuiz</span>
          <span className={`badge border ml-1 ${activeNetwork === 'MAINNET' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' : 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-900'}`}>
            {activeNetwork === 'MAINNET' ? 'Mainnet' : 'Testnet'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <NetworkSwitcher activeNetwork={activeNetwork} onSwitch={onSwitchNetwork} />
          {wallet.isConnected && wallet.address ? (
            <div className="flex items-center gap-3">
              {(wallet.balance === '0.00' || !wallet.balance || parseFloat(wallet.balance) < 1) && getIsTestnet() && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`https://friendbot.stellar.org?addr=${wallet.address}`);
                      if (res.ok) alert('Success! Account funded. Please refresh the page.');
                    } catch {
                      alert('Friendbot busy. Try again.');
                    }
                  }}
                  className="text-xs font-semibold bg-brand-100 hover:bg-brand-200 text-brand-700 dark:bg-brand-900/50 dark:hover:bg-brand-800 dark:text-brand-300 px-3 py-1.5 rounded-lg transition-colors border border-brand-200 dark:border-brand-700 shadow-sm flex items-center gap-1 flex-shrink-0"
                  title="Get free testnet XLM"
                >
                  <Zap size={12} className="text-brand-500" />
                  <span className="hidden md:inline">Fund Wallet</span>
                </button>
              )}
              {wallet.balance && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg hidden md:inline-block">
                  {wallet.balance} XLM
                </span>
              )}
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg hidden sm:inline-block">
                {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
              </span>
              <button 
                onClick={onDisconnect} 
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                title="Disconnect Wallet"
              >
                <LogOut size={12} className="sm:hidden" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onConnect('freighter')}
              className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              Connect Wallet
            </button>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </nav>

      <div className="flex-1 px-6 py-16 max-w-5xl mx-auto w-full">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Powered by Stellar Soroban
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-5 tracking-tight leading-tight text-slate-900 dark:text-white">
            Quiz on the{' '}
            <span className="text-gradient">Blockchain</span>
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            A transparent, tamper-proof quiz platform. Questions, answers, and scores live immutably on the Stellar network.
          </p>

          {/* CTA Area */}
          <AnimatePresence mode="wait">
            {wallet.isConnected && wallet.address ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button onClick={onStartQuiz} className="btn-primary group text-base px-8 py-3.5">
                    Start Quiz
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  {(!totalQuizzes || totalQuizzes === 0) && (
                    <button onClick={onInitialize} className="btn-ghost text-sm">
                      Initialize Contract
                    </button>
                  )}
                </div>

                {/* Challenge Buttons */}
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button onClick={onOpenBuilder} className="btn-ghost text-sm group">
                    <PenTool size={15} className="text-violet-500" />
                    Create Quiz
                  </button>
                  <button onClick={onOpenArena} className="btn-ghost text-sm group">
                    <Swords size={15} className="text-orange-500" />
                    Challenge Arena
                  </button>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">Connect your Stellar wallet to begin</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mx-auto">
                  {[
                    { type: 'freighter' as WalletType, label: 'Freighter', emoji: '🚀' },
                    { type: 'albedo' as WalletType, label: 'Albedo', emoji: '🌐' },
                    { type: 'xbull' as WalletType, label: 'xBull', emoji: '🐂' },
                    { type: 'hana' as WalletType, label: 'Hana', emoji: '🌸' },
                  ].map(({ type, label, emoji }, i) => (
                    <motion.button
                      key={type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onConnect(type)}
                      disabled={wallet.isConnecting}
                      id={`btn-connect-${type}`}
                      className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-200 dark:hover:border-brand-800 hover:text-brand-700 dark:hover:text-brand-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-xs font-bold tracking-wide">{label}</span>
                    </motion.button>
                  ))}
                </div>
                {wallet.error && <p className="text-red-500 text-xs mt-1 text-center">{wallet.error}</p>}
                {wallet.isConnecting && <p className="text-brand-500 text-xs mt-1 animate-pulse">Connecting...</p>}
                <button onClick={onOpenArena} className="btn-ghost text-xs mt-2">
                  <Swords size={14} className="text-orange-500" /> Browse Challenge Arena
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Category Selector */}
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          categoryCounts={categoryCounts}
        />

        {/* Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {[
            { label: 'Quiz Questions', value: totalQuizzes !== null ? totalQuizzes.toString() : '—' },
            { label: 'Network', value: 'Stellar' },
            { label: 'Entry Fee', value: '1 XLM' },
            { label: 'Your Best', value: highestScore > 0 ? highestScore.toString() : '—' },
          ].map((stat, i) => (
            <div key={i} className="glass p-5 text-center">
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Leaderboard + Live Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
        >
          <Leaderboard entries={leaderboard} isLoading={isLoadingLeaderboard} />
          <LiveEventTicker />
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="glass p-7 text-left group cursor-default hover:-translate-y-1 transition-transform duration-300"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 dark:brightness-125 dark:bg-opacity-10 dark:border-opacity-30 ${f.color}`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-base font-bold mb-2 text-slate-800 dark:text-slate-100">{f.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Soroban Testnet
            </span>
            <span className="font-mono text-slate-300 dark:text-slate-600">v1.0.0</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://github.com/ankush-shaw/DecentralizedQuizApp-2.0" target="_blank" rel="noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <Github size={18} />
            </a>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5 font-medium"
            >
              View Contract <ExternalLink size={13} />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
