import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Swords, Play, Users, Clock, ChevronRight,
  Sparkles, Trophy, X, ArrowLeft,
} from 'lucide-react';
import type { QuizCategory } from '../types';
import { FEATURED_CHALLENGES } from '../data/featuredChallenges';
import type { StoredAttempt } from '../services/challengeService';

interface ChallengeArenaProps {
  onLoadChallenge: (code: string) => boolean;
  onStartChallenge: () => void;
  myAttempts: StoredAttempt[];
  getAllStoredChallenges: () => {
    code: string;
    title: string;
    category: string;
    questionCount: number;
    creator: string;
    attemptCount: number;
    createdAt: string;
  }[];
  onClose: () => void;
}

type TabFilter = 'featured' | 'all' | 'my-history';

const CATEGORY_EMOJI: Record<string, string> = {
  'Stellar & Crypto': '⭐',
  'Web3 & Tech': '🌐',
  'History & Culture': '📜',
  'General Science': '🔬',
  'Math & Logic': '🧮',
  'All': '📚',
};

export function ChallengeArena({
  onLoadChallenge,
  onStartChallenge,
  myAttempts,
  getAllStoredChallenges,
  onClose,
}: ChallengeArenaProps) {
  const [codeInput, setCodeInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('featured');
  const [loadedCode, setLoadedCode] = useState<string | null>(null);

  const allChallenges = useMemo(() => getAllStoredChallenges(), [getAllStoredChallenges]);

  const handleSearch = () => {
    if (!codeInput.trim()) return;
    setSearchError('');
    const success = onLoadChallenge(codeInput.trim());
    if (success) {
      setLoadedCode(codeInput.trim());
    } else {
      setSearchError('Challenge not found. Check your code and try again.');
    }
  };

  const handleLoadFeatured = (code: string) => {
    const success = onLoadChallenge(code);
    if (success) {
      setLoadedCode(code);
    }
  };

  const handleStartLoaded = () => {
    if (loadedCode) {
      onStartChallenge();
    }
  };

  const tabs: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'featured', label: 'Featured', icon: <Sparkles size={13} /> },
    { key: 'all', label: 'All Challenges', icon: <Swords size={13} /> },
    { key: 'my-history', label: 'My History', icon: <Trophy size={13} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
        <div className="flex items-center justify-between px-8 pt-6 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 flex items-center justify-center">
              <Swords size={20} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Challenge Arena</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Enter a code or browse challenges</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Code Search Bar */}
        <div className="px-8 pb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setSearchError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter code e.g. DQ-STAR01"
                maxLength={12}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all uppercase tracking-wider"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary px-5">
              <Search size={16} /> Go
            </button>
          </div>
          {searchError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <X size={12} /> {searchError}
            </p>
          )}

          {/* Loaded challenge preview */}
          <AnimatePresence>
            {loadedCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✅ Challenge Loaded!</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">Code: {loadedCode}</p>
                  </div>
                  <button onClick={handleStartLoaded} className="btn-primary text-sm">
                    <Play size={14} /> Start Quiz
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="px-8 pb-2">
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-8 pb-8 max-h-[45vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Featured Tab */}
            {activeTab === 'featured' && (
              <motion.div
                key="featured"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pt-3"
              >
                {FEATURED_CHALLENGES.map((fc) => (
                  <motion.div
                    key={fc.code}
                    whileHover={{ y: -2 }}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-pointer"
                    onClick={() => handleLoadFeatured(fc.meta.code)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{CATEGORY_EMOJI[fc.meta.category] || '📚'}</span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{fc.meta.title}</h4>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{fc.meta.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md">
                              {fc.meta.category}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Users size={10} /> {fc.meta.questionCount} Qs
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        {fc.meta.code}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* All Challenges Tab */}
            {activeTab === 'all' && (
              <motion.div
                key="all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pt-3"
              >
                {allChallenges.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                    <Swords size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold">No challenges yet</p>
                    <p className="text-xs mt-1">Create one or enter a friend's code!</p>
                  </div>
                ) : (
                  allChallenges.map((ch) => (
                    <motion.div
                      key={ch.code}
                      whileHover={{ y: -1 }}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => handleLoadFeatured(ch.code)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{CATEGORY_EMOJI[ch.category] || '📚'}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ch.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {ch.questionCount} Qs · {ch.attemptCount} attempts · by {ch.creator.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* My History Tab */}
            {activeTab === 'my-history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pt-3"
              >
                {myAttempts.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                    <Trophy size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold">No attempts yet</p>
                    <p className="text-xs mt-1">Take a challenge to see your history here!</p>
                  </div>
                ) : (
                  myAttempts.slice().reverse().map((attempt, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{attempt.quizTitle}</p>
                        <p className="text-[10px] text-slate-400">
                          Code: {attempt.challengeCode} · {new Date(attempt.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${attempt.percentage >= 80 ? 'text-emerald-500' : attempt.percentage >= 60 ? 'text-brand-500' : 'text-amber-500'}`}>
                          {attempt.score}/{attempt.total}
                        </p>
                        <p className="text-[10px] text-slate-400">{attempt.percentage}%</p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
