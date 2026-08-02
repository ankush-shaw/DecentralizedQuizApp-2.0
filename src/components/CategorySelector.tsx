import { motion } from 'framer-motion';
import { Layers, Rocket, Cpu, Sparkles, Landmark, Binary } from 'lucide-react';
import type { QuizCategory } from '../types';

interface CategorySelectorProps {
  selectedCategory: QuizCategory;
  onSelectCategory: (category: QuizCategory) => void;
  categoryCounts?: Record<QuizCategory, number>;
}

const CATEGORIES: {
  id: QuizCategory;
  name: string;
  desc: string;
  icon: typeof Rocket;
  color: string;
  badgeColor: string;
}[] = [
  {
    id: 'All',
    name: 'All Topics',
    desc: 'Mixed set across all Web3, science & math categories.',
    icon: Layers,
    color: 'from-brand-500/10 to-violet-500/10 border-brand-200/60 dark:border-brand-800/60 text-brand-600 dark:text-brand-400',
    badgeColor: 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
  },
  {
    id: 'Stellar & Crypto',
    name: 'Stellar & Crypto',
    desc: 'Soroban smart contracts, XLM, Stellar & Web3.',
    icon: Rocket,
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
  {
    id: 'Web3 & Tech',
    name: 'Web3 & Tech',
    desc: 'Computer science, software & cryptography.',
    icon: Cpu,
    color: 'from-purple-500/10 to-pink-500/10 border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  },
  {
    id: 'History & Culture',
    name: 'History & Culture',
    desc: 'World history, civilizations, revolutions & culture.',
    icon: Landmark,
    color: 'from-amber-500/10 to-orange-500/10 border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
  {
    id: 'General Science',
    name: 'General Science',
    desc: 'Biology, physics, geography & general knowledge.',
    icon: Sparkles,
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    id: 'Math & Logic',
    name: 'Math & Logic',
    desc: 'Algebra, geometry, logic puzzles & calculus.',
    icon: Binary,
    color: 'from-rose-500/10 to-red-500/10 border-rose-200/60 dark:border-rose-800/60 text-rose-600 dark:text-rose-400',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
];

export function CategorySelector({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: CategorySelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Select Quiz Category
        </h3>
        <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
          Selected: {selectedCategory}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {CATEGORIES.map((cat, i) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;
          const count = categoryCounts ? categoryCounts[cat.id] : undefined;

          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative flex flex-col justify-between text-left p-4 rounded-2xl border transition-all duration-200 bg-gradient-to-b shadow-sm ${
                isSelected
                  ? 'border-brand-500 dark:border-brand-400 bg-brand-50/70 dark:bg-brand-950/50 shadow-md ring-2 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border bg-gradient-to-br ${cat.color}`}>
                    <Icon size={18} />
                  </div>
                  {count !== undefined && (
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${cat.badgeColor}`}>
                      {count} Qs
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                  {cat.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {cat.desc}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
