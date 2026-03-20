import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { Question, QuizResult } from '../types';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  total: number;
  result: QuizResult | null;
  isSubmitting: boolean;
  alreadyAnswered: boolean;
  onAnswer: (answer: string) => void;
}

export function QuestionCard({
  question,
  currentIndex,
  total,
  result,
  isSubmitting,
  alreadyAnswered,
  onAnswer,
}: QuestionCardProps) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="glass p-8 max-w-2xl mx-auto w-full"
    >
      {/* Progress */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-slate-400 font-medium">
          Question {currentIndex + 1} of {total}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1 w-8 rounded-full transition-all ${
                i <= currentIndex ? 'bg-brand-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question Text */}
      <h2 className="text-xl font-bold text-slate-100 mb-8 leading-relaxed">
        {question.text}
      </h2>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          let className = 'answer-option';

          if (result) {
          if (option === question.correctAnswer) {
              className += ' answer-correct';
            } else if (option === result.userAnswer && !result.correct) {
              className += ' answer-wrong';
            }
          }

          return (
            <motion.button
              key={option}
              whileHover={!result && !alreadyAnswered ? { scale: 1.01 } : {}}
              whileTap={!result && !alreadyAnswered ? { scale: 0.99 } : {}}
              onClick={() => !result && !alreadyAnswered && !isSubmitting && onAnswer(option)}
              disabled={!!result || alreadyAnswered || isSubmitting}
              className={className}
            >
              <span className="flex items-center justify-between">
                <span>{option}</span>
                {result && option === question.correctAnswer && (
                  <CheckCircle2 size={20} className="text-green-400" />
                )}
                {result && option === result.userAnswer && !result.correct && (
                  <XCircle size={20} className="text-red-400" />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Submitting indicator */}
      {isSubmitting && (
        <div className="mt-6 flex items-center justify-center gap-2 text-brand-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-medium">Submitting answer to chain…</span>
        </div>
      )}

      {/* Already answered warning */}
      {alreadyAnswered && !result && (
        <p className="mt-4 text-center text-sm text-amber-400">
          You've already answered this question.
        </p>
      )}
    </motion.div>
  );
}
