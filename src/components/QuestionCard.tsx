import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  disabled?: boolean;
}

export function QuestionCard({ question, onAnswer, selectedAnswer, disabled }: QuestionCardProps) {
  return (
    <div className="glass p-8 w-full max-w-2xl mx-auto">
      {question.category && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 text-brand-600 dark:text-brand-400 text-xs font-semibold">
          <span>{question.category}</span>
        </div>
      )}

      {/* Question Text */}
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-7 leading-relaxed">
        {question.text}
      </h2>

      {selectedAnswer === '__TIMEOUT__' && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-semibold flex items-center justify-center gap-2">
          <AlertCircle size={18} />
          Time's Up! No answer was submitted.
        </div>
      )}

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = option === selectedAnswer;

          let className = 'answer-option';
          if (isSelected) {
            className = 'w-full text-left p-4 rounded-xl border border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all duration-200 font-semibold text-brand-700 dark:text-brand-300 shadow-md flex items-center justify-between';
          } else {
            className = 'answer-option flex items-center justify-between';
          }

          return (
            <button
              key={option}
              onClick={() => !disabled && onAnswer(option)}
              disabled={disabled}
              className={className}
            >
              <span className="font-medium">{option}</span>
              {isSelected && (
                <CheckCircle2 size={18} className="text-brand-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
