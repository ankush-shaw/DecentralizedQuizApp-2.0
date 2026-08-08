import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Check, Copy,
  CheckCircle2, AlertCircle, Sparkles, Share2, X,
} from 'lucide-react';
import type { QuizCategory, Question } from '../types';
import type { CustomQuiz } from '../types/challenge';

interface QuizBuilderProps {
  creatorAddress: string;
  onCreateQuiz: (quiz: CustomQuiz) => string;
  onClose: () => void;
}

const CATEGORIES: QuizCategory[] = ['Stellar & Crypto', 'Web3 & Tech', 'History & Culture', 'General Science', 'Math & Logic'];

interface DraftQuestion {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
}

const emptyQuestion = (): DraftQuestion => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
});

export function QuizBuilder({ creatorAddress, onCreateQuiz, onClose }: QuizBuilderProps) {
  // ── Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1: Metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuizCategory>('Stellar & Crypto');
  const [timePerQuestion, setTimePerQuestion] = useState(15);

  // ── Step 2: Questions
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion(), emptyQuestion(), emptyQuestion()]);

  // ── Step 3: Result
  const [challengeCode, setChallengeCode] = useState('');
  const [copied, setCopied] = useState(false);

  // ── Validation
  const isStep1Valid = title.trim().length >= 3;
  const isStep2Valid = questions.length >= 2 && questions.every(
    (q) => q.text.trim().length > 0 && q.options.every((o) => o.trim().length > 0)
  );

  const updateQuestion = useCallback((index: number, field: keyof DraftQuestion, value: unknown) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (field === 'options') {
        updated[index] = { ...updated[index], options: value as [string, string, string, string] };
      } else if (field === 'correctIndex') {
        updated[index] = { ...updated[index], correctIndex: value as number };
      } else {
        updated[index] = { ...updated[index], text: value as string };
      }
      return updated;
    });
  }, []);

  const updateOption = useCallback((qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options] as [string, string, string, string];
      opts[oIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  }, []);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index: number) => {
    if (questions.length <= 2) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    const builtQuestions: Question[] = questions.map((q, i) => ({
      id: Date.now() + i,
      text: q.text.trim(),
      options: q.options.map((o) => o.trim()),
      correctAnswer: q.options[q.correctIndex].trim(),
      category,
    }));

    const quiz: CustomQuiz = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      category,
      questions: builtQuestions,
      timePerQuestion,
      creatorAddress,
      createdAt: new Date().toISOString(),
      attemptCount: 0,
    };

    const code = onCreateQuiz(quiz);
    setChallengeCode(code);
    setStep(3);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(challengeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'DQuiz Challenge',
      text: `🧠 I created a quiz challenge on DQuiz! Use code ${challengeCode} to take it. Can you beat my quiz?`,
      url: 'https://decentralized-quiz-app.vercel.app/',
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await handleCopyCode();
    } catch { /* cancelled */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="h-1.5 bg-gradient-to-r from-brand-500 via-violet-500 to-pink-500" />
        <div className="flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
              {step === 3 ? '🎉 Challenge Created!' : '✨ Create Custom Quiz'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {step === 1 && 'Set your quiz details'}
              {step === 2 && `Add questions (${questions.length} added)`}
              {step === 3 && 'Share your challenge code with friends'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Step Indicator */}
        {step !== 3 && (
          <div className="px-8 pb-4">
            <div className="flex items-center gap-2">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {step > s ? <Check size={14} /> : s}
                  </div>
                  {s < 2 && (
                    <div className={`flex-1 h-0.5 rounded transition-colors ${step > s ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-8 pb-8 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ══════════════ STEP 1: METADATA ══════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Stellar Deep Dive"
                    maxLength={60}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">{title.length}/60 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your quiz..."
                    maxLength={200}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          category === cat
                            ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Time Per Question: {timePerQuestion}s
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>5s (Hard)</span>
                    <span>60s (Easy)</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Add Questions <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ══════════════ STEP 2: QUESTIONS ══════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {questions.map((q, qi) => (
                  <div
                    key={qi}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Question {qi + 1}</span>
                      {questions.length > 2 && (
                        <button
                          onClick={() => removeQuestion(qi)}
                          className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 mb-3"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="relative">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                            placeholder={`Option ${oi + 1}`}
                            className={`w-full pl-3 pr-8 py-2 rounded-lg border text-xs transition-all ${
                              q.correctIndex === oi
                                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                            } text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30`}
                          />
                          <button
                            onClick={() => updateQuestion(qi, 'correctIndex', oi)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              q.correctIndex === oi
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                            }`}
                            title="Mark as correct answer"
                          >
                            {q.correctIndex === oi && <Check size={10} className="text-white" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {questions.length < 20 && (
                  <button
                    onClick={addQuestion}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-400 hover:text-brand-500 hover:border-brand-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Question
                  </button>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="btn-ghost flex-1 justify-center">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!isStep2Valid}
                    className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={16} /> Create Challenge
                  </button>
                </div>

                {!isStep2Valid && (
                  <p className="text-[10px] text-amber-500 flex items-center gap-1 justify-center">
                    <AlertCircle size={12} /> Need at least 2 questions with all fields filled
                  </p>
                )}
              </motion.div>
            )}

            {/* ══════════════ STEP 3: SUCCESS ══════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center"
                  >
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </motion.div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-2">
                    Your Challenge Code
                  </p>
                  <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border-2 border-brand-200 dark:border-brand-800">
                    <span className="text-3xl font-black text-brand-600 dark:text-brand-400 font-mono tracking-wider">
                      {challengeCode}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Share this code with your friends. They can enter it in the <strong>Challenge Arena</strong> to take your quiz!
                </p>

                <div className="flex gap-3 justify-center">
                  <button onClick={handleCopyCode} className="btn-ghost text-sm">
                    {copied ? <><Check size={14} className="text-emerald-500" /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                  </button>
                  <button onClick={handleShare} className="btn-primary text-sm">
                    <Share2 size={14} /> Share
                  </button>
                </div>

                <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Close & return to home
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
