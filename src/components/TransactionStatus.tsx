import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ExternalLink, X } from 'lucide-react';
import type { TxStatus } from '../types';

interface TransactionStatusProps {
  status: TxStatus;
  onDismiss: () => void;
}

const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet/tx';

/**
 * TransactionStatus — a floating panel that shows live transaction lifecycle feedback.
 *
 * Level 2 Requirement: Transaction status visible to the user.
 * States: PENDING → SUCCESS (with hash + explorer link) or FAILED (with error reason).
 */
export function TransactionStatus({ status, onDismiss }: TransactionStatusProps) {
  if (status.state === 'idle') return null;

  const isPending = status.state === 'pending';
  const isSuccess = status.state === 'success';
  const isFailed  = status.state === 'failed';

  const borderColor = isPending
    ? 'border-brand-500/40'
    : isSuccess
    ? 'border-green-500/40'
    : 'border-red-500/40';

  const bgColor = isPending
    ? 'bg-brand-500/10'
    : isSuccess
    ? 'bg-green-500/10'
    : 'bg-red-500/10';

  const icon = isPending ? (
    <Loader2 size={20} className="text-brand-400 animate-spin" />
  ) : isSuccess ? (
    <CheckCircle2 size={20} className="text-green-400" />
  ) : (
    <XCircle size={20} className="text-red-400" />
  );

  const label = isPending
    ? `Submitting${status.functionName ? ` (${status.functionName})` : ''}…`
    : isSuccess
    ? 'Transaction Confirmed!'
    : 'Transaction Failed';

  const labelColor = isPending
    ? 'text-brand-300'
    : isSuccess
    ? 'text-green-300'
    : 'text-red-300';

  return (
    <AnimatePresence>
      <motion.div
        key="tx-status"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', bounce: 0.3 }}
        className={`fixed bottom-6 right-6 z-50 max-w-sm w-full rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-xl p-4 shadow-2xl`}
        id="tx-status-panel"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className={`font-semibold text-sm ${labelColor}`}>{label}</span>
          </div>
          {!isPending && (
            <button
              onClick={onDismiss}
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Pending pulse bar */}
        {isPending && (
          <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-brand-400 rounded-full"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
        )}

        {/* Success: tx hash + explorer link */}
        {isSuccess && status.hash && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono truncate">
              {status.hash.slice(0, 8)}…{status.hash.slice(-6)}
            </span>
            <a
              href={`${EXPLORER_BASE}/${status.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0"
              title="View on Stellar Expert"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Failed: error message */}
        {isFailed && status.error && (
          <p className="mt-2 text-xs text-red-400 leading-relaxed">{status.error}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
