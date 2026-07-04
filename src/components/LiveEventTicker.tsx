import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Radio } from 'lucide-react';
import { listenForQuizEvents } from '../services/soroban';
import type { QuizEvent } from '../types';

export function LiveEventTicker() {
  const [events, setEvents] = useState<QuizEvent[]>([]);
  const [lastLedger, setLastLedger] = useState<number | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function poll() {
      try {
        const newEvents = await listenForQuizEvents(lastLedger);
        if (!mountedRef.current) return;

        if (newEvents.length > 0) {
          setEvents((prev) => {
            const merged = [...newEvents, ...prev];
            const uniqueMap = new Map();
            merged.forEach((ev) => {
              const key = `${ev.questionId}-${ev.solver}-${ev.timestamp}`;
              if (!uniqueMap.has(key)) uniqueMap.set(key, ev);
            });
            return Array.from(uniqueMap.values()).slice(0, 8);
          });
          const latestEventLedger = lastLedger ? lastLedger + 1 : undefined;
          setLastLedger(latestEventLedger);
        }
      } catch (e) {
        console.error('Error polling events:', e);
      }
    }

    poll();
    const interval = setInterval(poll, 6000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [lastLedger]);

  return (
    <div className="glass p-5 w-full" id="live-event-ticker">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Radio size={13} className="text-brand-500" />
            Live Event Stream
          </h4>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
          Real-time
        </span>
      </div>

      <div className="h-44 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs gap-2">
              <Radio size={20} className="text-slate-200 dark:text-slate-700" />
              <span>Listening for contract activity...</span>
            </div>
          ) : (
            events.map((event) => {
              const shortAddr = `${event.solver.slice(0, 6)}...${event.solver.slice(-4)}`;
              const timeString = new Date(event.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              return (
                <motion.div
                  key={`${event.questionId}-${event.solver}-${event.timestamp}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] leading-relaxed"
                >
                  <Zap size={12} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-slate-600 dark:text-slate-300">
                    <span className="font-mono text-slate-800 dark:text-slate-100 font-semibold mr-1 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px]">
                      {shortAddr}
                    </span>
                    solved Q<span className="font-bold text-brand-600 dark:text-brand-400">#{event.questionId}</span> on-chain!
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">{timeString}</span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
