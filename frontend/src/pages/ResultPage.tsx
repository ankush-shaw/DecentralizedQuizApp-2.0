import { ScoreDisplay } from '../components/ScoreDisplay';

interface ResultPageProps {
  score: number;
  total: number;
  address: string;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function ResultPage({ score, total, address, onPlayAgain, onHome }: ResultPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-3xl font-black mb-2 text-center">Quiz Complete!</h1>
      <p className="text-slate-400 mb-10 text-center">Here's how you did on the blockchain quiz.</p>
      <ScoreDisplay
        score={score}
        total={total}
        address={address}
        onPlayAgain={onPlayAgain}
      />
      
      <div className="mt-8 flex items-center gap-4">
        <button 
          onClick={onHome}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/20 transition-colors text-sm font-semibold"
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
