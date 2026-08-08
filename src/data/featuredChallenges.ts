import type { FeaturedChallenge } from '../types/challenge';
import type { ChallengePayload } from '../types/challenge';

// ─── Featured Community Challenges ────────────────────────────────────────────
// Pre-built challenges users can try immediately. These are stored as payloads
// and auto-registered into localStorage on first load.

export const FEATURED_CHALLENGES: { code: string; meta: FeaturedChallenge; payload: ChallengePayload }[] = [
  {
    code: 'STAR01',
    meta: {
      code: 'DQ-STAR01',
      title: 'Stellar Fundamentals',
      category: 'Stellar & Crypto',
      questionCount: 5,
      description: 'Test your knowledge of Stellar blockchain basics — consensus, lumens, and anchors.',
    },
    payload: {
      t: 'Stellar Fundamentals',
      c: 'Stellar & Crypto',
      tp: 20,
      q: [
        ['What consensus protocol does Stellar use?', 'Proof of Work', 'Stellar Consensus Protocol (SCP)', 'Proof of Stake', 'Delegated BFT', 1],
        ['What is the native asset of the Stellar network?', 'SOL', 'XRP', 'XLM (Lumens)', 'USDC', 2],
        ['What is a Stellar anchor?', 'A mining node', 'An entity that bridges fiat and Stellar', 'A type of smart contract', 'A wallet provider', 1],
        ['How long does a typical Stellar transaction take?', '10 minutes', '3-5 seconds', '1 minute', '30 seconds', 1],
        ['What is the minimum balance required for a Stellar account?', '0 XLM', '1 XLM', '10 XLM', '100 XLM', 1],
      ],
      cr: 'DQuiz_Official',
    },
  },
  {
    code: 'WEB302',
    meta: {
      code: 'DQ-WEB302',
      title: 'Web3 Deep Dive',
      category: 'Web3 & Tech',
      questionCount: 5,
      description: 'Challenge yourself on DeFi, DAOs, and decentralized technologies.',
    },
    payload: {
      t: 'Web3 Deep Dive',
      c: 'Web3 & Tech',
      tp: 20,
      q: [
        ['What does DAO stand for?', 'Digital Asset Organization', 'Decentralized Autonomous Organization', 'Distributed Application Overlay', 'Data Access Object', 1],
        ['What is a liquidity pool?', 'A crypto wallet', 'A smart contract holding paired tokens for trading', 'A mining farm', 'A blockchain node', 1],
        ['What is "gas" in blockchain?', 'A cryptocurrency', 'A fee for computational work', 'A consensus mechanism', 'A type of token', 1],
        ['What does TVL stand for in DeFi?', 'Total Value Locked', 'Token Verification Layer', 'Transaction Volume Ledger', 'Total Validator Load', 0],
        ['What is an oracle in Web3?', 'A prediction market', 'A service providing external data to smart contracts', 'A type of wallet', 'A layer-2 solution', 1],
      ],
      cr: 'DQuiz_Official',
    },
  },
  {
    code: 'BRAIN3',
    meta: {
      code: 'DQ-BRAIN3',
      title: 'Logic & Riddles',
      category: 'Math & Logic',
      questionCount: 5,
      description: 'Brain teasers and logic puzzles to test your critical thinking.',
    },
    payload: {
      t: 'Logic & Riddles',
      c: 'Math & Logic',
      tp: 25,
      q: [
        ['If all roses are flowers and some flowers fade quickly, can we say some roses fade quickly?', 'Yes', 'No', 'Maybe', 'Not enough info', 1],
        ['What is the next number: 2, 6, 12, 20, 30, ?', '40', '42', '36', '38', 1],
        ['A bat and ball cost $1.10 together. The bat costs $1 more than the ball. How much is the ball?', '$0.10', '$0.05', '$0.15', '$0.20', 1],
        ['How many times can you subtract 5 from 25?', '5 times', '1 time', '25 times', 'Infinite', 1],
        ['What comes next: J, F, M, A, M, J, J, ?', 'A', 'S', 'K', 'O', 0],
      ],
      cr: 'DQuiz_Official',
    },
  },
];

/** Register featured challenges into localStorage (idempotent) */
export function registerFeaturedChallenges(): void {
  const storageKey = 'dquiz_challenges';
  let stored: Record<string, unknown> = {};
  try {
    stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch { /* ignore */ }

  let updated = false;
  for (const fc of FEATURED_CHALLENGES) {
    if (!stored[fc.code]) {
      stored[fc.code] = {
        payload: fc.payload,
        quizId: `featured-${fc.code}`,
        createdAt: '2025-01-01T00:00:00Z',
        attemptCount: 0,
      };
      updated = true;
    }
  }
  if (updated) {
    localStorage.setItem(storageKey, JSON.stringify(stored));
  }
}
