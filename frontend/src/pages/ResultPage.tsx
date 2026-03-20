import { ScoreDisplay } from '../components/ScoreDisplay';

interface ResultPageProps {
  score: number;
  total: number;
  address: string;
  onPlayAgain: () => void;
}

export function ResultPage({ score, total, address, onPlayAgain }: ResultPageProps) {
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
    </div>
  );
}
