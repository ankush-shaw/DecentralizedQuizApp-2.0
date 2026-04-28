import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Rocket, ChevronRight, Github, ExternalLink, Database, Shield, Brain, Layers } from 'lucide-react';
import type { WalletState } from '../types';
import { getTotalQuizzes, CONTRACT_ID } from '../services/soroban';

interface HomePageProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartQuiz: () => void;
  onInitialize: () => Promise<void>;
}

export function HomePage({ wallet, onConnect, onDisconnect, onStartQuiz, onInitialize }: HomePageProps) {
  const [totalQuizzes, setTotalQuizzes] = useState<number | null>(null);


  const [errorStatus, setErrorStatus] = useState<string | null>(null);

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
    checkCount();
  }, [wallet.isConnected]);



  const features = [
    { icon: Brain, title: 'On-Chain Questions', desc: 'All questions stored immutably on Stellar Soroban.' },
    { icon: Shield, title: 'Tamper-Proof Scoring', desc: 'Your score is verified and recorded by smart contracts.' },
    { icon: Layers, title: 'Permissionless', desc: 'Anyone can build, play, and verify results on the network.' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-4xl w-full text-center">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Powered by Stellar Soroban
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
            Quiz on the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-200 to-purple-400">
              Blockchain
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            A fully decentralized quiz platform where questions, answers, and scores live immutably on the Stellar network. No admin. No cheating.
          </p>

          {/* Wallet State / Initialization */}
          <div className="flex flex-col items-center gap-6">
            <AnimatePresence mode="wait">
              {wallet.isConnected && wallet.address ? (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex items-center gap-3">
                    <button onClick={onStartQuiz} className="btn-primary group">
                      Start Quiz
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    {(!totalQuizzes || totalQuizzes === 0) && (
                      <button onClick={onInitialize} className="btn-ghost text-sm border border-white/10">
                        Initialize Contract
                      </button>
                    )}
                    <button onClick={onDisconnect} className="btn-ghost text-sm">
                      Disconnect
                    </button>
                  </div>
                  


                  <div className="text-sm text-slate-500 font-mono">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="connect"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onConnect}
                  className="btn-primary"
                >
                  <Wallet size={20} />
                  Connect Wallet
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass p-8 text-left group hover:border-brand-500/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon size={24} className="text-brand-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-slate-500 text-sm flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Soroban Testnet
            </span>
            <span>v1.0.0</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a 
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`} 
              target="_blank" 
              rel="noreferrer" 
              className="text-slate-500 hover:text-brand-400 transition-colors flex items-center gap-1.5 text-sm"
            >
              View Contract <ExternalLink size={14} />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

const Loader2 = ({ size, className }: { size: number; className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
