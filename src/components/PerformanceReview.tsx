import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { QuizResult } from '../types';

interface PerformanceReviewProps {
  results: QuizResult[];
}

export function PerformanceReview({ results }: PerformanceReviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!results || results.length === 0) return null;

  const correctCount = results.filter((r) => r.correct).length;
  const timedOutCount = results.filter((r) => r.timedOut).length;
  const incorrectCount = results.length - correctCount - timedOutCount;
  const accuracy = Math.round((correctCount / results.length) * 100);

  // Per-category accuracy
  const categoryStats = results.reduce<Record<string, { correct: number; total: number }>>((acc, r) => {
    const cat = r.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { correct: 0, total: 0 };
    acc[cat].total++;
    if (r.correct) acc[cat].correct++;
    return acc;
  }, {});
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      {/* Summary Stats Bar */}
      <div className="glass p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Performance Breakdown
          </h3>
          <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-lg">
            {accuracy}% Accuracy
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{correctCount}</p>
              <p className="text-[10px] text-emerald-500/80 font-semibold uppercase tracking-wider">Correct</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/60">
            <XCircle size={16} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-lg font-black text-red-600 dark:text-red-400">{incorrectCount}</p>
              <p className="text-[10px] text-red-500/80 font-semibold uppercase tracking-wider">Wrong</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60">
            <Clock size={16} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">{timedOutCount}</p>
              <p className="text-[10px] text-amber-500/80 font-semibold uppercase tracking-wider">Timed Out</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance Bars */}
      {Object.keys(categoryStats).length > 1 && (
        <div className="glass p-5 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Category Breakdown
          </h4>
          <div className="space-y-2.5">
            {Object.entries(categoryStats).map(([cat, { correct, total }]) => {
              const pct = Math.round((correct / total) * 100);
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{cat}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{correct}/{total} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-brand-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expand/Collapse Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-3"
      >
        {isExpanded ? (
          <>Hide Question Review <ChevronUp size={14} /></>
        ) : (
          <>View Question-by-Question Review <ChevronDown size={14} /></>
        )}
      </button>

      {/* Detailed Question Review */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {results.map((r, i) => (
            <motion.div
              key={r.questionId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`p-4 rounded-xl border transition-all ${
                r.correct
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/60'
                  : r.timedOut
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/60'
                    : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-0.5">
                    Q{i + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                    {r.questionText}
                  </p>
                </div>
                <div className="flex-shrink-0 mt-0.5">
                  {r.correct ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : r.timedOut ? (
                    <Clock size={18} className="text-amber-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </div>
              </div>

              <div className="ml-7 space-y-1">
                {r.timedOut ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ⏱️ No answer submitted (timed out)
                  </p>
                ) : (
                  <p className={`text-xs font-medium ${r.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    Your answer: <span className="font-bold">{r.userAnswer}</span>
                  </p>
                )}
                {!r.correct && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Correct: <span className="font-bold">{r.correctAnswer}</span>
                  </p>
                )}
                {r.category && (
                  <span className="inline-block text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mt-1">
                    {r.category}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
