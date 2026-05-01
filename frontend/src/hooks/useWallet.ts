import { useState, useCallback } from 'react';
import { connectWallet, isWalletInstalled, getXlmBalance } from '../services/soroban';
import type { WalletState } from '../types';

/**
 * Custom hook for managing multi-wallet state (Freighter/Albedo)
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const connect = useCallback(async (type: 'freighter' | 'albedo' = 'freighter') => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const address = await connectWallet(type);

      if (address) {
        localStorage.setItem('walletType', type);
        const balance = await getXlmBalance(address);
        setWallet({
          address,
          balance,
          isConnecting: false,
          isConnected: true,
          error: null,
        });
      } else {
        // connectWallet returned null — could be rejection or not installed
        const notInstalled = !isWalletInstalled(type);
        setWallet({
          address: null,
          balance: null,
          isConnecting: false,
          isConnected: false,
          error: notInstalled
            ? `${type.charAt(0).toUpperCase() + type.slice(1)} is not available. Please install it.`
            : 'Connection rejected. Please approve the request in your wallet.',
        });
      }
    } catch {
      setWallet({
        address: null,
        balance: null,
        isConnecting: false,
        isConnected: false,
        error: `Failed to connect to ${type}.`,
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('walletType');
    setWallet({
      address: null,
      balance: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
  }, []);

  return { wallet, connect, disconnect };
}

