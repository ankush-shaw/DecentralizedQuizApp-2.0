import { ScoreDisplay } from '../components/ScoreDisplay';
import { ExternalLink } from 'lucide-react';

interface ResultPageProps {
  score: number;
  total: number;
  address: string;
  txHash: string | null;
  onPlayAgain: () => void;
  onHome: () => void;
}

const TX_EXPLORER = 'https://stellar.expert/explorer/testnet/tx';

/**
 * ResultPage — displays final score and on-chain confirmation.
 * Level 2: Shows transaction hash with explorer link for user confirmation.
 */
export function ResultPage({ score, total, address, txHash, onPlayAgain, onHome }: ResultPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-3xl font-black mb-2 text-center">Quiz Complete!</h1>
      <p className="text-slate-400 mb-10 text-center">
        Here's how you did on the blockchain quiz.
      </p>

      <ScoreDisplay
        score={score}
        total={total}
        address={address}
        onPlayAgain={onPlayAgain}
      />

      {/* Transaction confirmation — Level 2: transaction status visible */}
      {txHash && (
        <div
          className="mt-6 max-w-md w-full p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-between gap-3"
          id="tx-confirmation"
        >
          <div>
            <p className="text-xs text-green-400 font-semibold mb-1">✅ Score saved on-chain</p>
            <p className="text-xs font-mono text-slate-400 truncate">
              {txHash.slice(0, 12)}…{txHash.slice(-8)}
            </p>
          </div>
          <a
            href={`${TX_EXPLORER}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0"
          >
            View tx <ExternalLink size={12} />
          </a>
        </div>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={onHome}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/20 transition-colors text-sm font-semibold"
          id="btn-back-home"
        >
          Back to Home
        </button>
        <a
          href="https://forms.gle/igDFFfURB9HXRL2H8"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 text-brand-400 transition-colors text-sm font-semibold"
        >
          Submit Feedback
        </a>
      </div>
    </div>
  );
}
