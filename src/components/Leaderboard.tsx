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

/**
 * Leaderboard Component — displays on-chain top 5 high scores.
 * Satisfies Level 3 Advanced Smart Contract state visualization.
 */
export function Leaderboard({ entries, isLoading }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-amber-400 w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />;
      case 2:
        return <Medal className="text-slate-300 w-5 h-5 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
      case 3:
        return <Award className="text-amber-600 w-5 h-5 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />;
      default:
        return <span className="text-xs font-bold text-slate-500 font-mono">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500/10 border-amber-500/30';
      case 2:
        return 'bg-slate-400/10 border-slate-400/20';
      case 3:
        return 'bg-amber-700/10 border-amber-700/20';
      default:
        return 'bg-white/5 border-white/5';
    }
  };

  return (
    <div className="glass p-6 w-full rounded-3xl" id="leaderboard-panel">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Trophy size={18} className="text-brand-400" />
          On-Chain Leaderboard
        </h3>
        <span className="text-[10px] font-mono uppercase bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded text-brand-400">
          Stellar Testnet
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          No records yet. Be the first to quiz!
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry, index) => {
            const isTop3 = entry.rank <= 3;
            const shortAddr = `${entry.address.slice(0, 8)}...${entry.address.slice(-6)}`;
            
            return (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-3.5 rounded-xl border ${getRankBg(
                  entry.rank
                )} transition-colors`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span className="text-xs md:text-sm font-mono text-slate-300 truncate" title={entry.address}>
                    {shortAddr}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-base font-black text-slate-100">{entry.score}</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">pts</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
