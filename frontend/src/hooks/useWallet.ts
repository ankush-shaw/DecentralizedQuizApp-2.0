import { useState, useCallback } from 'react';
import { connectWallet, isFreighterInstalled } from '../services/soroban';
import type { WalletState } from '../types';

/**
 * Custom hook for managing Freighter wallet state
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const connect = useCallback(async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const address = await connectWallet();

      if (address) {
        setWallet({
          address,
          isConnecting: false,
          isConnected: true,
          error: null,
        });
      } else {
        // connectWallet returned null — could be rejection or not installed
        const notInstalled = !isFreighterInstalled();
        setWallet({
          address: null,
          isConnecting: false,
          isConnected: false,
          error: notInstalled
            ? 'Freighter is not installed. Get it at freighter.app'
            : 'Connection rejected. Please approve the request in Freighter.',
        });
      }
    } catch {
      setWallet({
        address: null,
        isConnecting: false,
        isConnected: false,
        error: 'Failed to connect. Is Freighter installed and on Testnet?',
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
  }, []);

  return { wallet, connect, disconnect };
}
