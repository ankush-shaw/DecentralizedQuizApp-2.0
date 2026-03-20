import { Trophy, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScoreDisplayProps {
  score: number;
  total: number;
  address: string;
  onPlayAgain: () => void;
}

export function ScoreDisplay({ score, total, address, onPlayAgain }: ScoreDisplayProps) {
  const percentage = Math.round((score / total) * 100);

  const getMessage = () => {
    if (percentage === 100) return { text: 'Perfect Score! 🎉', color: 'text-yellow-400' };
    if (percentage >= 80) return { text: 'Excellent Work! 🚀', color: 'text-green-400' };
    if (percentage >= 60) return { text: 'Good Job! 👍', color: 'text-brand-400' };
    if (percentage >= 40) return { text: 'Keep Practicing! 💪', color: 'text-orange-400' };
    return { text: 'Better luck next time! 🎯', color: 'text-red-400' };
  };

  const { text, color } = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-10 max-w-md mx-auto w-full text-center"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="p-5 rounded-full bg-brand-500/20 border border-brand-500/30">
          <Trophy size={48} className="text-brand-400" />
        </div>
      </div>

      {/* Score Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="relative inline-flex items-center justify-center w-32 h-32 mb-6"
      >
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="rgb(20, 177, 245)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={339.3}
            initial={{ strokeDashoffset: 339.3 }}
            animate={{ strokeDashoffset: 339.3 - (339.3 * percentage) / 100 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute text-3xl font-black text-white">{percentage}%</div>
      </motion.div>

      {/* Message */}
      <h2 className={`text-2xl font-bold mb-2 ${color}`}>{text}</h2>
      <p className="text-slate-400 mb-2">
        You answered <span className="text-white font-bold">{score}</span> out of{' '}
        <span className="text-white font-bold">{total}</span> questions correctly.
      </p>

      {/* On-chain score note */}
      <div className="mt-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
        <div className="flex items-center justify-center gap-2 text-brand-400 text-sm">
          <Zap size={14} />
          <span>Score recorded on-chain for</span>
        </div>
        <p className="font-mono text-xs text-slate-400 mt-1 truncate">{address}</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPlayAgain}
        className="btn-primary mt-8 w-full justify-center"
      >
        <Star size={18} />
        Play Again
      </motion.button>
    </motion.div>
  );
}
