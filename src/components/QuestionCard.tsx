import { CheckCircle2 } from 'lucide-react';
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
      {/* Question Text */}
      <h2 className="text-lg font-bold text-slate-800 mb-7 leading-relaxed">
        {question.text}
      </h2>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = option === selectedAnswer;

          let className = 'answer-option';
          if (isSelected) {
            className = 'w-full text-left p-4 rounded-xl border border-brand-400 bg-brand-50 hover:bg-brand-50 transition-all duration-200 font-semibold text-brand-700 shadow-md flex items-center justify-between';
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
