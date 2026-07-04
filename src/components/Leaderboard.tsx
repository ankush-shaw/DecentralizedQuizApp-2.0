import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  address: string;
  score: number;
  rank: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
}

export function Leaderboard({ entries, isLoading }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="text-amber-500 w-4 h-4" />;
      case 2: return <Medal className="text-slate-400 w-4 h-4" />;
      case 3: return <Award className="text-amber-600 w-4 h-4" />;
      default: return <span className="text-xs font-bold text-slate-400 font-mono">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900';
      case 2: return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
      case 3: return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900';
      default: return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="glass p-6 w-full" id="leaderboard-panel">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          On-Chain Leaderboard
        </h3>
        <span className="badge bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900">
          Stellar Testnet
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
          <Trophy size={32} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
          No records yet. Be the first to quiz!
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const shortAddr = `${entry.address.slice(0, 8)}...${entry.address.slice(-6)}`;
            return (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-3.5 rounded-xl border ${getRankStyle(entry.rank)}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate" title={entry.address}>
                    {shortAddr}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-base font-black text-slate-800 dark:text-slate-100">{entry.score}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">pts</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
