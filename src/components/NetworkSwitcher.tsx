import { motion } from 'framer-motion';
import type { NetworkName } from '../config/networks';
import { NETWORKS } from '../config/networks';

interface NetworkSwitcherProps {
  activeNetwork: NetworkName;
  onSwitch: (network: NetworkName) => void;
}

export function NetworkSwitcher({ activeNetwork, onSwitch }: NetworkSwitcherProps) {
  const isMainnet = activeNetwork === 'MAINNET';

  const handleToggle = () => {
    const next: NetworkName = isMainnet ? 'TESTNET' : 'MAINNET';
    onSwitch(next);
  };

  return (
    <div className="flex items-center gap-2" title={`Switch to ${isMainnet ? 'Testnet' : 'Mainnet'}`}>
      <span className={`text-xs font-semibold transition-colors hidden sm:inline ${!isMainnet ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {NETWORKS.TESTNET.label}
      </span>

      <button
        id="btn-network-switcher"
        onClick={handleToggle}
        aria-label={`Switch network (currently ${activeNetwork})`}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 flex-shrink-0 ${
          isMainnet
            ? 'bg-emerald-500 border-emerald-600 focus:ring-emerald-400'
            : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-brand-400'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm ${
            isMainnet
              ? 'bg-white left-[calc(100%-1.25rem)]'
              : 'bg-white left-0.5'
          }`}
        />
      </button>

      <span className={`text-xs font-semibold transition-colors hidden sm:inline ${isMainnet ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {NETWORKS.MAINNET.label}
      </span>

      {isMainnet && (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-1.5 py-0.5 rounded-md flex-shrink-0">
          LIVE
        </span>
      )}
    </div>
  );
}
