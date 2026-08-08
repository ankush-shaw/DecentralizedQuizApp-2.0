import { motion } from 'framer-motion';
import { Trophy, Users, Medal } from 'lucide-react';
import type { StoredAttempt } from '../services/challengeService';

interface ChallengeLeaderboardProps {
  attempts: StoredAttempt[];
  challengeTitle?: string;
}

export function ChallengeLeaderboard({ attempts, challengeTitle }: ChallengeLeaderboardProps) {
  if (!attempts || attempts.length === 0) return null;

  // Aggregate best score per player
  const bestScores = new Map<string, StoredAttempt>();
  for (const attempt of attempts) {
    const existing = bestScores.get(attempt.playerAddress);
    if (!existing || attempt.percentage > existing.percentage) {
      bestScores.set(attempt.playerAddress, attempt);
    }
  }

  const ranked = Array.from(bestScores.values())
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);

  const RANK_STYLES = [
    'text-amber-500',   // 1st
    'text-slate-400',   // 2nd
    'text-orange-600',  // 3rd
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5 w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {challengeTitle ? `${challengeTitle} — Leaderboard` : 'Challenge Leaderboard'}
          </h4>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
          <Users size={10} /> {ranked.length} player{ranked.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {ranked.map((entry, i) => (
          <div
            key={entry.playerAddress}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              i === 0
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/60'
                : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold w-6 text-center ${RANK_STYLES[i] || 'text-slate-400'}`}>
                {i < 3 ? <Medal size={16} /> : `#${i + 1}`}
              </span>
              <div>
                <p className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                  {entry.playerAddress.slice(0, 8)}…{entry.playerAddress.slice(-6)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {new Date(entry.completedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${
                entry.percentage >= 80 ? 'text-emerald-500' : entry.percentage >= 60 ? 'text-brand-500' : 'text-amber-500'
              }`}>
                {entry.score}/{entry.total}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">{entry.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
