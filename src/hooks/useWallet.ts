import { useState, useCallback } from 'react';
import { connectWallet, getXlmBalance } from '../services/soroban';
import { WalletNotInstalledError, TransactionRejectedError } from '../services/errors';
import type { WalletType } from '../services/soroban';
import type { WalletState } from '../types';

/**
 * Custom hook for managing multi-wallet state (Freighter / Albedo / xBull / Hana)
 *
 * Level 2: Handles WalletNotInstalledError and TransactionRejectedError distinctly.
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const connect = useCallback(async (type: WalletType = 'freighter') => {
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
        // connectWallet returned null without throwing — treat as rejection
        setWallet({
          address: null,
          balance: null,
          isConnecting: false,
          isConnected: false,
          error: 'Connection returned no address. Please try again.',
        });
      }
    } catch (e: unknown) {
      // ── Handle each named error type with a specific message ──────────────
      let errorMessage: string;

      if (e instanceof WalletNotInstalledError) {
        // Error Type 1: Wallet extension not installed
        errorMessage = e.message;
      } else if (e instanceof TransactionRejectedError) {
        // Error Type 2: User rejected/cancelled the connection
        errorMessage = e.message;
      } else {
        // Fallback for unknown errors
        errorMessage = `Failed to connect to ${type}. Please try again.`;
      }

      setWallet({
        address: null,
        balance: null,
        isConnecting: false,
        isConnected: false,
        error: errorMessage,
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
