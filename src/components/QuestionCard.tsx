import { CheckCircle2 } from 'lucide-react';
import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  onAnswer,
  selectedAnswer,
  disabled,
}: QuestionCardProps) {
  return (
    <div className="glass p-8 w-full max-w-2xl mx-auto">
      {/* Question Text */}
      <h2 className="text-xl font-bold text-slate-100 mb-8 leading-relaxed">
        {question.text}
      </h2>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = option === selectedAnswer;
          
          let className = 'answer-option transition-all duration-200 w-full text-left p-4 rounded-xl border flex items-center justify-between group';
          
          if (isSelected) {
            className += ' border-brand-400 bg-brand-400/10 text-brand-400';
          } else {
            className += ' border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 hover:border-white/20';
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
                <CheckCircle2 size={20} className="text-brand-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
