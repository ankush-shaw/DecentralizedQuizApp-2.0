/**
 * errors.ts — Typed error classes for the Decentralized Quiz App
 *
 * Level 2 Requirement: 3 distinct error types handled.
 */

// ─── Error Type 1: Wallet Not Installed ─────────────────────────────────────
/**
 * Thrown when the user tries to connect a wallet that isn't installed in their browser.
 * e.g. Freighter extension not found, xBull SDK missing, Hana wallet absent.
 */
export class WalletNotInstalledError extends Error {
  public readonly walletName: string;

  constructor(walletName: string) {
    super(
      `${walletName} wallet is not installed. Please install the ${walletName} browser extension and try again.`
    );
    this.name = 'WalletNotInstalledError';
    this.walletName = walletName;
    // Restore prototype chain in TypeScript
    Object.setPrototypeOf(this, WalletNotInstalledError.prototype);
  }
}

// ─── Error Type 2: Transaction Rejected ─────────────────────────────────────
/**
 * Thrown when the user explicitly rejects/cancels a transaction signing request
 * in their wallet popup (Freighter, Albedo, xBull, Hana).
 */
export class TransactionRejectedError extends Error {
  constructor(reason?: string) {
    super(
      reason ||
        'Transaction was rejected. You cancelled the signing request in your wallet.'
    );
    this.name = 'TransactionRejectedError';
    Object.setPrototypeOf(this, TransactionRejectedError.prototype);
  }
}

// ─── Error Type 3: Contract Call Error ──────────────────────────────────────
/**
 * Thrown when a Soroban smart contract call fails on-chain.
 * Includes the function name and underlying RPC error for debugging.
 */
export class ContractCallError extends Error {
  public readonly functionName: string;
  public readonly txHash?: string;

  constructor(functionName: string, reason: string, txHash?: string) {
    super(
      `Contract call '${functionName}' failed on-chain: ${reason}`
    );
    this.name = 'ContractCallError';
    this.functionName = functionName;
    this.txHash = txHash;
    Object.setPrototypeOf(this, ContractCallError.prototype);
  }
}
