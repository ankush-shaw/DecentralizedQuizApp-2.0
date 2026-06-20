declare module '@stellar/freighter-api';

/**
 * Soroban Service — handles all interactions with the Stellar network
 * Contract ID: CDMMSDM3KSHC5FBN2SIZYOH3FLT5ICAHHNYYCCEB7UFZZ3KMBT44OI4E
 *
 * Level 2: Contract called from frontend, 3 error types, real-time event integration.
 */
import {
  Contract,
  rpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Address,
  scValToNative,
  nativeToScVal,
  xdr,
} from '@stellar/stellar-sdk';
import quizData from '../data/questions.json';
import { requestAccess, signTransaction, isConnected } from '@stellar/freighter-api';
import albedo from '@albedo-link/intent';
import {
  WalletNotInstalledError,
  TransactionRejectedError,
  ContractCallError,
} from './errors';
import type { QuizEvent } from '../types';

// ─── Config ───────────────────────────────────────────────────────────────────

export const CONTRACT_ID = 'CDMMSDM3KSHC5FBN2SIZYOH3FLT5ICAHHNYYCCEB7UFZZ3KMBT44OI4E';
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const NATIVE_TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

const server = new rpc.Server(RPC_URL);
const quizContract = new Contract(CONTRACT_ID);

console.log('--- DECENTRALIZED QUIZ APP v3.1.0 (Level 2) ---');

// ─── Wallet ────────────────────────────────────────────────────────────────────

export type WalletType = 'freighter' | 'albedo' | 'xbull' | 'hana';

/**
 * Connect to a wallet (Freighter, Albedo, xBull, or Hana) and return the user's public key.
 *
 * Error Handling:
 *  - Throws WalletNotInstalledError if the browser extension isn't present
 *  - Throws TransactionRejectedError if the user cancels the permission request
 */
export async function connectWallet(type: WalletType = 'freighter'): Promise<string | null> {
  try {
    if (type === 'albedo') {
      try {
        const res = await albedo.publicKey({ token: 'quiz-app-' + Math.random() });
        return res.pubkey;
      } catch (e: any) {
        if (e?.message?.toLowerCase().includes('cancel') || e?.message?.toLowerCase().includes('reject')) {
          throw new TransactionRejectedError('Albedo: permission request was cancelled.');
        }
        throw e;
      }
    }

    if (type === 'xbull') {
      const xBull = (window as any).xBullSDK;
      if (!xBull) throw new WalletNotInstalledError('xBull');
      try {
        await xBull.connect({ canRequestPublicKey: true, canRequestSign: true });
        const publicKey = await xBull.getPublicKey();
        return publicKey || null;
      } catch (e: any) {
        if (e instanceof WalletNotInstalledError) throw e;
        if (e?.message?.toLowerCase().includes('cancel') || e?.message?.toLowerCase().includes('reject')) {
          throw new TransactionRejectedError('xBull: connection was rejected by the user.');
        }
        throw e;
      }
    }

    if (type === 'hana') {
      const hana = (window as any).hanaWallet?.stellar;
      if (!hana) throw new WalletNotInstalledError('Hana');
      try {
        const response = await hana.getPublicKey();
        return response || null;
      } catch (e: any) {
        if (e instanceof WalletNotInstalledError) throw e;
        throw new TransactionRejectedError('Hana: permission was denied.');
      }
    }

    // Freighter (default)
    const freighterInstalled =
      (await isConnected()) ||
      'freighterApi' in window ||
      'freighter' in window ||
      typeof (window as any).__freighter !== 'undefined';
    if (!freighterInstalled) throw new WalletNotInstalledError('Freighter');

    const result = await requestAccess();
    if (typeof result === 'string') return result || null;
    if (result && typeof result === 'object' && 'address' in result) {
      if ((result as any).error) {
        throw new TransactionRejectedError('Freighter: access was denied.');
      }
      return (result as any).address || null;
    }
    return null;
  } catch (e: any) {
    // Re-throw typed errors as-is, log and re-throw others
    if (
      e instanceof WalletNotInstalledError ||
      e instanceof TransactionRejectedError
    ) {
      throw e;
    }
    console.error(`[connectWallet] ${type} error:`, e.message);
    throw new TransactionRejectedError(`Could not connect to ${type}: ${e.message}`);
  }
}

/**
 * Check if the specified wallet is installed/available.
 */
export async function isWalletInstalledAsync(type: WalletType): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (type === 'albedo') return true;
  if (type === 'xbull') return !!(window as any).xBullSDK;
  if (type === 'hana') return !!(window as any).hanaWallet?.stellar;
  
  return (
    (await isConnected()) ||
    'freighterApi' in window ||
    'freighter' in window ||
    typeof (window as any).__freighter !== 'undefined'
  );
}

// ─── Internal Signing Helpers ─────────────────────────────────────────────────

async function signWithXBull(xdr: string): Promise<string | null> {
  try {
    const xBull = (window as any).xBullSDK;
    if (!xBull) return null;
    const result = await xBull.signXDR(xdr);
    return result || null;
  } catch (e: any) {
    if (e?.message?.toLowerCase().includes('cancel') || e?.message?.toLowerCase().includes('reject')) {
      throw new TransactionRejectedError('xBull: transaction signing was rejected.');
    }
    return null;
  }
}

async function signWithHana(xdrStr: string): Promise<string | null> {
  try {
    const hana = (window as any).hanaWallet?.stellar;
    if (!hana) return null;
    const result = await hana.signTransaction(xdrStr, { networkPassphrase: NETWORK_PASSPHRASE });
    return result?.signedTxXdr || result || null;
  } catch (e: any) {
    if (e?.message?.toLowerCase().includes('cancel') || e?.message?.toLowerCase().includes('reject')) {
      throw new TransactionRejectedError('Hana: transaction signing was rejected.');
    }
    return null;
  }
}

async function signWithAlbedo(xdrStr: string): Promise<string | null> {
  try {
    const res = await albedo.tx({ xdr: xdrStr, network: 'testnet' });
    return res.signed_envelope_xdr;
  } catch (e: any) {
    if (e?.message?.toLowerCase().includes('cancel') || e?.message?.toLowerCase().includes('reject')) {
      throw new TransactionRejectedError('Albedo: transaction signing was cancelled.');
    }
    return null;
  }
}

/**
 * Unified transaction signer — routes to the correct wallet based on localStorage.
 * Throws TransactionRejectedError if the user cancels.
 */
async function signTx(preparedXdr: string): Promise<string | null> {
  const walletType = localStorage.getItem('walletType') as WalletType | null;

  if (walletType === 'albedo') return signWithAlbedo(preparedXdr);
  if (walletType === 'xbull') return signWithXBull(preparedXdr);
  if (walletType === 'hana') return signWithHana(preparedXdr);

  // Default: Freighter
  try {
    const signResult = await signTransaction(preparedXdr, { network: 'TESTNET' });
    if (typeof signResult === 'object' && signResult !== null && 'error' in signResult) {
      throw new TransactionRejectedError(`Freighter: ${(signResult as any).error}`);
    }
    const signed = typeof signResult === 'string' ? signResult : (signResult as any)?.signedTxXdr ?? null;
    if (!signed) throw new TransactionRejectedError('Freighter returned no signed XDR.');
    return signed;
  } catch (e) {
    if (e instanceof TransactionRejectedError) throw e;
    throw new TransactionRejectedError('Freighter signing failed unexpectedly.');
  }
}

// ─── Transaction Status Helper ────────────────────────────────────────────────

/**
 * Polls the RPC until the transaction is confirmed or failed.
 * Returns { status, hash } for the UI to display.
 *
 * Level 2 Requirement: Transaction status visible.
 */
export async function waitForTxConfirmation(
  hash: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<{ status: 'SUCCESS' | 'FAILED'; hash: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: { hash },
      }),
    });
    const json = await res.json();
    const status = json.result?.status;
    if (status === 'SUCCESS') return { status: 'SUCCESS', hash };
    if (status === 'FAILED') return { status: 'FAILED', hash };
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: 'FAILED', hash };
}

// ─── Real-Time Event Listener ────────────────────────────────────────────────

/**
 * Polls the Soroban RPC for quiz_ans contract events emitted after a batch submission.
 * Implements real-time event integration for Level 2.
 *
 * @param startLedger - The ledger to start scanning from (use current ledger - 5 for safety)
 * @returns Array of QuizEvent objects
 */
export async function listenForQuizEvents(startLedger?: number): Promise<QuizEvent[]> {
  try {
    // Get current ledger if not provided
    let fromLedger = startLedger;
    if (!fromLedger) {
      const latestRes = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getLatestLedger', params: {} }),
      });
      const latestJson = await latestRes.json();
      fromLedger = Math.max(1, (latestJson.result?.sequence ?? 100) - 5);
    }

    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getEvents',
        params: {
          startLedger: fromLedger,
          filters: [
            {
              type: 'contract',
              contractIds: [CONTRACT_ID],
              topics: [['*', '*']],
            },
          ],
          pagination: { limit: 20 },
        },
      }),
    });

    const json = await res.json();
    const events: QuizEvent[] = [];

    if (json.result?.events) {
      for (const event of json.result.events) {
        try {
          // quiz_ans events have topics: [Symbol("quiz_ans"), Address(solver)]
          // and value: U32(questionId)
          const topicSymbol = event.topic?.[0];
          const topicSolver = event.topic?.[1];
          const valueRaw = event.value;

          if (topicSymbol && topicSolver && valueRaw) {
            const solverVal = scValToNative(xdr.ScVal.fromXDR(topicSolver, 'base64'));
            const qId = scValToNative(xdr.ScVal.fromXDR(valueRaw, 'base64'));

            events.push({
              questionId: Number(qId),
              solver: String(solverVal),
              timestamp: Date.now(),
            });
          }
        } catch {
          // Silently skip events that can't be parsed
        }
      }
    }

    return events;
  } catch (e) {
    console.error('[listenForQuizEvents] Error:', e);
    return [];
  }
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export async function getXlmBalance(address: string): Promise<string | null> {
  try {
    const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
    if (!response.ok) return '0.00';
    const data = await response.json();
    const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
    return nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : '0.00';
  } catch {
    return null;
  }
}

// ─── Read Functions ───────────────────────────────────────────────────────────

export async function getTotalQuizzes(): Promise<number> {
  try {
    const res = await simulateCall('get_total_quizzes', []);
    return typeof res === 'number' ? res : 0;
  } catch {
    return 0;
  }
}

export async function getQuestion(id: number): Promise<string | null> {
  try {
    const res = await simulateCall('get_question', [nativeToScVal(id, { type: 'u32' })]);
    return res ? String(res) : null;
  } catch {
    return null;
  }
}

export async function getScore(userAddress: string): Promise<number> {
  try {
    const res = await simulateCall('get_score', [Address.fromString(userAddress).toScVal()]);
    return typeof res === 'number' ? res : 0;
  } catch {
    return 0;
  }
}

/** Helper for simulation (READ-only operations — no signing required) */
async function simulateCall(funcName: string, args: any[]): Promise<any> {
  try {
    const dummyPK = 'GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI';
    let account: any;
    try {
      account = await server.getAccount(dummyPK);
    } catch {
      account = {
        accountId: () => dummyPK,
        sequenceNumber: () => '1',
        incrementSequenceNumber: () => {},
      };
    }
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(quizContract.call(funcName, ...args))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result) && result.result) {
      return scValToNative(result.result.retval);
    }
    return null;
  } catch (e) {
    console.error(`[simulateCall] ${funcName} failed:`, e);
    return null;
  }
}

// ─── Write Functions ──────────────────────────────────────────────────────────

/**
 * Pay entry fee — inter-contract call to the Native XLM Token contract.
 * Throws WalletNotInstalledError, TransactionRejectedError, or ContractCallError.
 */
export async function payEntryFee(userAddress: string): Promise<boolean> {
  const amount = '10000000'; // 1.0 XLM in stroops
  let hash: string | undefined;

  try {
    const account = await server.getAccount(userAddress);
    const tx = new TransactionBuilder(account, {
      fee: '1000000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        quizContract.call(
          'pay_entry_fee',
          Address.fromString(userAddress).toScVal(),
          Address.fromString(NATIVE_TOKEN).toScVal(),
          nativeToScVal(amount, { type: 'i128' })
        )
      )
      .setTimeout(30)
      .build();

    let prepared: any;
    try {
      prepared = await server.prepareTransaction(tx);
    } catch (e: any) {
      throw new ContractCallError('pay_entry_fee', e.message);
    }

    const signedXdr = await signTx(prepared.toXDR());
    if (!signedXdr) throw new TransactionRejectedError();

    const sent = await server.sendTransaction(
      TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
    );
    hash = (sent as any).hash;

    const result = await waitForTxConfirmation(hash!);
    if (result.status === 'SUCCESS') return true;
    throw new ContractCallError('pay_entry_fee', 'Transaction confirmed as FAILED on-chain.', hash);
  } catch (e) {
    if (
      e instanceof WalletNotInstalledError ||
      e instanceof TransactionRejectedError ||
      e instanceof ContractCallError
    ) {
      throw e;
    }
    throw new ContractCallError('pay_entry_fee', (e as any).message || 'Unknown error', hash);
  }
}

/**
 * Submit multiple quiz answers in a single signed transaction.
 * Returns { score, hash } on success.
 * Throws WalletNotInstalledError, TransactionRejectedError, or ContractCallError.
 */
export async function submitBatchAnswers(
  userAddress: string,
  answers: { id: number; answer: string }[]
): Promise<{ score: number; hash: string }> {
  let hash: string | undefined;
  console.log(`[submitBatchAnswers] Submitting ${answers.length} answers…`);

  try {
    const account = await server.getAccount(userAddress);

    const scAnswers = nativeToScVal(
      answers.map((a) => [
        nativeToScVal(a.id, { type: 'u32' }),
        nativeToScVal(a.answer, { type: 'string' }),
      ])
    );

    const tx = new TransactionBuilder(account, {
      fee: '1000000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        quizContract.call(
          'submit_batch',
          Address.fromString(userAddress).toScVal(),
          scAnswers
        )
      )
      .setTimeout(30)
      .build();

    let prepared: any;
    try {
      prepared = await server.prepareTransaction(tx);
    } catch (e: any) {
      throw new ContractCallError('submit_batch', e.message);
    }

    const signedXdr = await signTx(prepared.toXDR());
    if (!signedXdr) throw new TransactionRejectedError();

    const sent = await server.sendTransaction(
      TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
    );
    hash = (sent as any).hash;
    console.log(`[submitBatchAnswers] tx hash: ${hash}`);

    const result = await waitForTxConfirmation(hash!);
    if (result.status === 'FAILED') {
      throw new ContractCallError('submit_batch', 'Transaction confirmed as FAILED on-chain.', hash);
    }

    // Count locally correct answers (contract returns score but parsing resultMetaXdr is complex)
    const score = answers.filter((a) => {
      const q = (quizData as any[]).find((q: any) => q.id === a.id);
      return q && q.correctAnswer === a.answer;
    }).length;

    return { score, hash: hash! };
  } catch (e) {
    if (
      e instanceof WalletNotInstalledError ||
      e instanceof TransactionRejectedError ||
      e instanceof ContractCallError
    ) {
      throw e;
    }
    throw new ContractCallError('submit_batch', (e as any).message || 'Unknown error', hash);
  }
}

/**
 * Seeds the contract with initial questions (admin function).
 */
export async function initializeContract(userAddress: string): Promise<void> {
  const INITIAL_QUESTIONS = (quizData as any[]).slice(0, 15);
  console.log(`[seed] Initializing ${INITIAL_QUESTIONS.length} questions…`);

  try {
    const account = await server.getAccount(userAddress);

    const scItems = nativeToScVal(
      INITIAL_QUESTIONS.map((item: any) => [
        nativeToScVal(item.id, { type: 'u32' }),
        nativeToScVal(item.text, { type: 'string' }),
        nativeToScVal(item.correctAnswer, { type: 'string' }),
      ])
    );

    const tx = new TransactionBuilder(account, {
      fee: '1000000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(quizContract.call('create_quiz_batch', scItems))
      .setTimeout(30)
      .build();

    let prepared: any;
    try {
      prepared = await server.prepareTransaction(tx);
    } catch (e: any) {
      throw new ContractCallError('create_quiz_batch', e.message);
    }

    const signedXdr = await signTx(prepared.toXDR());
    if (!signedXdr) throw new TransactionRejectedError('Contract initialization was rejected.');

    const sent = await server.sendTransaction(
      TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
    );

    const result = await waitForTxConfirmation((sent as any).hash);
    if (result.status === 'SUCCESS') {
      alert('Contract initialized with all 15 questions! 🚀');
      window.location.reload();
    } else {
      throw new ContractCallError('create_quiz_batch', 'Initialization failed on-chain.');
    }
  } catch (e: any) {
    if (
      e instanceof WalletNotInstalledError ||
      e instanceof TransactionRejectedError ||
      e instanceof ContractCallError
    ) {
      alert(e.message);
      return;
    }
    alert('Failed to initialize: ' + e.message);
  }
}
