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

export function ResultPage({ score, total, address, txHash, onPlayAgain, onHome }: ResultPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-slate-50">
      <h1 className="text-3xl font-black mb-2 text-center text-slate-800">Quiz Complete! 🎉</h1>
      <p className="text-slate-400 mb-10 text-center text-sm">
        Here's how you did on the blockchain quiz.
      </p>

      <ScoreDisplay
        score={score}
        total={total}
        address={address}
        onPlayAgain={onPlayAgain}
      />

      {txHash && (
        <div
          className="mt-6 max-w-md w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3"
          id="tx-confirmation"
        >
          <div>
            <p className="text-xs text-emerald-600 font-semibold mb-1">✅ Score saved on-chain</p>
            <p className="text-xs font-mono text-slate-400 truncate">
              {txHash.slice(0, 12)}…{txHash.slice(-8)}
            </p>
          </div>
          <a
            href={`${TX_EXPLORER}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors flex-shrink-0 font-semibold"
          >
            View tx <ExternalLink size={12} />
          </a>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onHome}
          className="btn-ghost text-sm"
          id="btn-back-home"
        >
          Back to Home
        </button>
        <a
          href="https://forms.gle/igDFFfURB9HXRL2H8"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm"
        >
          Submit Feedback
        </a>
      </div>
    </div>
  );
}
