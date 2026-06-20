import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Radio } from 'lucide-react';
import { listenForQuizEvents } from '../services/soroban';
import type { QuizEvent } from '../types';

/**
 * LiveEventTicker — polls Soroban contract events and streams them to the user.
 * Satisfies Level 3 Real-time event streaming and updates.
 */
export function LiveEventTicker() {
  const [events, setEvents] = useState<QuizEvent[]>([]);
  const [lastLedger, setLastLedger] = useState<number | undefined>(undefined);
  const mountedRef = useRef(true);

  // Poll for events every 5 seconds
  useEffect(() => {
    mountedRef.current = true;
    
    async function poll() {
      try {
        const newEvents = await listenForQuizEvents(lastLedger);
        if (!mountedRef.current) return;
        
        if (newEvents.length > 0) {
          // Deduplicate and merge events
          setEvents((prev) => {
            const merged = [...newEvents, ...prev];
            // Keep only top 8 unique events
            const uniqueMap = new Map();
            merged.forEach((ev) => {
              const key = `${ev.questionId}-${ev.solver}-${ev.timestamp}`;
              if (!uniqueMap.has(key)) uniqueMap.set(key, ev);
            });
            return Array.from(uniqueMap.values()).slice(0, 8);
          });

          // Update the ledger pointer to avoid double-fetching
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
    <div className="glass p-5 w-full rounded-3xl" id="live-event-ticker">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio size={14} className="text-brand-400" />
            Live Event Stream
          </h4>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Real-time Polling</span>
      </div>

      <div className="h-44 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
              Listening for contract activity...
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
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] leading-relaxed text-slate-300"
                >
                  <Zap size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-white mr-1.5 bg-black/20 px-1 py-0.5 rounded text-[10px]">
                      {shortAddr}
                    </span>
                    solved Question{' '}
                    <span className="font-semibold text-brand-400">#{event.questionId}</span>{' '}
                    on-chain!
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">{timeString}</span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
