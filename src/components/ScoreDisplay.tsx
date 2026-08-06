import { Trophy, Star, Zap, Share2 } from 'lucide-react';
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
    if (percentage === 100) return { text: 'Perfect Score! 🎉', color: 'text-amber-500' };
    if (percentage >= 80) return { text: 'Excellent Work! 🚀', color: 'text-emerald-600' };
    if (percentage >= 60) return { text: 'Good Job! 👍', color: 'text-brand-600' };
    if (percentage >= 40) return { text: 'Keep Practicing! 💪', color: 'text-orange-500' };
    return { text: 'Better luck next time! 🎯', color: 'text-rose-500' };
  };

  const handleShare = async () => {
    const shareData = {
      title: 'DQuiz — Blockchain Quiz Result',
      text: `🧠 I scored ${score}/${total} (${percentage}%) on the Decentralized Quiz App! My score is verified on-chain on the Stellar Network. Try it yourself!`,
      url: 'https://decentralized-quiz-app.vercel.app/',
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert('Result copied to clipboard!');
      }
    } catch {
      // User cancelled share
    }
  };

  const { text, color } = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-10 max-w-md mx-auto w-full text-center"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="p-5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900">
          <Trophy size={44} className="text-brand-600 dark:text-brand-400" />
        </div>
      </div>

      {/* Score Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
        className="relative inline-flex items-center justify-center w-32 h-32 mb-6"
      >
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgb(226,232,240)" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="rgb(99,102,241)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={339.3}
            initial={{ strokeDashoffset: 339.3 }}
            animate={{ strokeDashoffset: 339.3 - (339.3 * percentage) / 100 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute text-3xl font-black text-slate-800 dark:text-slate-100">{percentage}%</div>
      </motion.div>

      {/* Message */}
      <h2 className={`text-2xl font-bold mb-2 ${color}`}>{text}</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
        You answered <span className="text-slate-800 dark:text-slate-200 font-bold">{score}</span> out of{' '}
        <span className="text-slate-800 dark:text-slate-200 font-bold">{total}</span> questions correctly.
      </p>

      {/* On-chain badge */}
      <div className="mt-5 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900">
        <div className="flex items-center justify-center gap-2 text-brand-600 dark:text-brand-400 text-sm mb-1">
          <Zap size={13} />
          <span className="font-semibold">Score recorded on-chain for</span>
        </div>
        <p className="font-mono text-xs text-slate-400 dark:text-slate-500 truncate">{address}</p>
      </div>

      <div className="flex gap-3 mt-7">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPlayAgain}
          className="btn-primary flex-1 justify-center"
        >
          <Star size={16} />
          Play Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="btn-ghost justify-center px-4"
          title="Share your result"
        >
          <Share2 size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

