import { motion, AnimatePresence } from 'framer-motion';
import { Award, Copy, Check, ExternalLink, X, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import { getAchievementTier } from '../types';
import type { AchievementTier } from '../types';

interface NftAchievementBadgeProps {
  score: number;
  total: number;
  address: string;
  txHash: string | null;
}

const TIER_CONFIG: Record<Exclude<AchievementTier, 'none'>, {
  title: string;
  subtitle: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
  bgGlow: string;
}> = {
  gold: {
    title: '🏆 Gold Champion',
    subtitle: 'Perfect Score Achievement',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    borderColor: 'border-amber-400/60 dark:border-amber-500/40',
    iconColor: 'text-amber-500',
    bgGlow: 'bg-amber-500/10',
  },
  silver: {
    title: '🥈 Silver Innovator',
    subtitle: 'Outstanding Performance',
    gradient: 'from-slate-300 via-gray-400 to-slate-500',
    borderColor: 'border-slate-300/60 dark:border-slate-500/40',
    iconColor: 'text-slate-400',
    bgGlow: 'bg-slate-400/10',
  },
  bronze: {
    title: '🥉 Bronze Scholar',
    subtitle: 'Solid Achievement',
    gradient: 'from-orange-400 via-amber-600 to-orange-700',
    borderColor: 'border-orange-400/60 dark:border-orange-600/40',
    iconColor: 'text-orange-500',
    bgGlow: 'bg-orange-500/10',
  },
};

export function NftAchievementBadge({ score, total, address, txHash }: NftAchievementBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const percentage = Math.round((score / total) * 100);
  const tier = getAchievementTier(percentage);

  const nftMetadata = useMemo(() => ({
    name: `DQuiz Achievement — ${tier === 'gold' ? 'Gold Champion' : tier === 'silver' ? 'Silver Innovator' : 'Bronze Scholar'}`,
    description: `Scored ${score}/${total} (${percentage}%) on the Decentralized Quiz App, verified on the Stellar Network.`,
    properties: {
      score: `${score}/${total}`,
      percentage: `${percentage}%`,
      tier: tier.toUpperCase(),
      wallet: address,
      txHash: txHash || 'N/A',
      network: 'Stellar Testnet',
      contract: 'CARMZTNTQ3FQT2B3DTKB47P4LA4H3435NTO5FX26DSW24DSF2BU7X73A',
      timestamp: new Date().toISOString(),
    },
  }), [score, total, percentage, tier, address, txHash]);

  if (tier === 'none') return null;
  const config = TIER_CONFIG[tier];

  const handleCopyMetadata = async () => {
    await navigator.clipboard.writeText(JSON.stringify(nftMetadata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(true)}
        className={`mt-6 w-full max-w-md mx-auto flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl border-2 ${config.borderColor} ${config.bgGlow} text-sm font-bold transition-all shadow-sm hover:shadow-md`}
      >
        <Award size={18} className={config.iconColor} />
        <span className="text-slate-700 dark:text-slate-200">View Web3 Achievement Badge</span>
        <Sparkles size={14} className={config.iconColor} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={16} className="text-slate-500" />
              </button>

              {/* Header Gradient */}
              <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

              <div className="p-8">
                {/* Badge Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center ${config.bgGlow} border-2 ${config.borderColor}`}
                  >
                    <Award size={40} className={config.iconColor} />
                  </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-center text-slate-800 dark:text-slate-100 mb-1">
                  {config.title}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center font-semibold mb-6">
                  {config.subtitle}
                </p>

                {/* Certificate Card */}
                <div className={`p-5 rounded-2xl border ${config.borderColor} ${config.bgGlow} mb-5`}>
                  <div className="text-center mb-4">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">Official On-Chain Certificate</p>
                    <p className="text-4xl font-black bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent">
                      {score}/{total}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">{percentage}% Accuracy</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Wallet</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">{address.slice(0, 8)}…{address.slice(-6)}</span>
                    </div>
                    {txHash && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 dark:text-slate-500">Transaction</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-mono text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {txHash.slice(0, 8)}…{txHash.slice(-6)} <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Network</span>
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">Stellar Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Verified</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✅ On-chain</span>
                    </div>
                  </div>
                </div>

                {/* Copy NFT Metadata */}
                <button
                  onClick={handleCopyMetadata}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {copied ? (
                    <><Check size={14} className="text-emerald-500" /> NFT Metadata Copied!</>
                  ) : (
                    <><Copy size={14} /> Copy SIP-0016 NFT Metadata JSON</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
