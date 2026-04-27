declare module '@stellar/freighter-api';

/**
 * Soroban Service — handles all interactions with the Stellar network
 * Contract ID: CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL
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
} from '@stellar/stellar-sdk';
import quizData from '../data/questions.json';
import { requestAccess, signTransaction } from '@stellar/freighter-api';

// ─── Config ───────────────────────────────────────────────────────────────────

export const CONTRACT_ID = 'CCEA336XX45PMPZKUMJGCCE27XRAIOMZDI6AGLIZCZ2RMBOSUHULIACU';
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = 'https://soroban-testnet.stellar.org';

const server = new rpc.Server(RPC_URL);
const quizContract = new Contract(CONTRACT_ID);

console.log('--- DECENTRALIZED QUIZ APP v3.0.0 ---');

// ─── Wallet ────────────────────────────────────────────────────────────────────

/**
 * Connect to the Freighter wallet and return the user's public key
 */
export async function connectWallet(): Promise<string | null> {
  try {
    const result = await requestAccess();
    if (typeof result === 'string') return result || null;
    if (result && typeof result === 'object' && 'address' in result) {
      if ((result as any).error) return null;
      return (result as any).address || null;
    }
    return null;
  } catch (e: any) {
    return null;
  }
}

/**
 * Check if Freighter is installed.
 */
export function isFreighterInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'freighterApi' in window ||
    'freighter' in window ||
    (typeof (window as any).__freighter !== 'undefined')
  );
}

// ─── Read Functions ───────────────────────────────────────────────────────────

/**
 * The contract is pre-seeded with 15 questions.
 * Returns 15 so the UI skips the "Seed Now" prompt.
 */
export async function getTotalQuizzes(): Promise<number> {
  try {
    const res = await simulateCall('get_total_quizzes', []);
    return typeof res === 'number' ? res : 0;
  } catch {
    return 0;
  }
}

/**
 * Fetches a question string from the contract by ID
 */
export async function getQuestion(id: number): Promise<string | null> {
  try {
    const res = await simulateCall('get_question', [nativeToScVal(id, { type: 'u32' })]);
    return res ? String(res) : null;
  } catch {
    return null;
  }
}

/**
 * Fetches the score for a user address from the contract
 */
export async function getScore(userAddress: string): Promise<number> {
  try {
    const res = await simulateCall('get_score', [
      Address.fromString(userAddress).toScVal(),
    ]);
    return typeof res === 'number' ? res : 0;
  } catch {
    return 0;
  }
}

/** Helper for simulation (READ operations) */
async function simulateCall(funcName: string, args: any[]): Promise<any> {
  try {
    const dummyPK = 'GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI';
    let account;
    try {
      account = await server.getAccount(dummyPK);
    } catch {
      account = {
        accountId: () => dummyPK,
        sequenceNumber: () => '1',
        incrementSequenceNumber: () => {},
      } as any;
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
    console.error(`Simulation for ${funcName} failed:`, e);
    return null;
  }
}

// ─── Write Functions ──────────────────────────────────────────────────────────

/**
 * Submits a quiz answer via a signed Freighter transaction.
 * Costs 0.1 XLM (1,000,000 stroops) so the user can see their balance drop.
 */
export async function submitAnswer(
  userAddress: string,
  questionId: number,
  answer: string
): Promise<boolean | null> {
  console.log(`[submitAnswer] Q${questionId} — answer: "${answer}"`);
  try {
    const account = await server.getAccount(userAddress);

    const tx = new TransactionBuilder(account, {
      fee: '1000000', // 0.1 XLM — visible deduction
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        quizContract.call(
          'submit_answer',
          Address.fromString(userAddress).toScVal(),
          nativeToScVal(questionId, { type: 'u32' }),
          nativeToScVal(answer, { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    let prepared;
    try {
      prepared = await server.prepareTransaction(tx);
    } catch (e: any) {
      console.error('[submitAnswer] prepareTransaction failed:', e.message);
      alert('Transaction simulation failed:\n' + e.message);
      return null;
    }

    console.log('[submitAnswer] Requesting Freighter signature...');
    const signResult = await signTransaction(prepared.toXDR(), { network: 'TESTNET' });

    if (typeof signResult === 'object' && signResult !== null && 'error' in signResult) {
      console.error('[submitAnswer] Freighter error:', (signResult as any).error);
      return null;
    }

    const signedXdr =
      typeof signResult === 'string' ? signResult : (signResult as any)?.signedTxXdr;
    if (!signedXdr) {
      console.error('[submitAnswer] Empty signature from Freighter');
      return null;
    }

    console.log('[submitAnswer] Sending transaction...');
    const sent = await server.sendTransaction(
      TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
    );
    console.log('[submitAnswer] Hash:', (sent as any).hash);

    // Poll for result
    for (let i = 0; i < 30; i++) {
      const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: { hash: (sent as any).hash },
        }),
      });
      const json = await res.json();
      const status = json.result?.status;
      console.log(`[submitAnswer] Poll ${i + 1}: ${status}`);
      if (status === 'SUCCESS') return true;
      if (status === 'FAILED') {
        console.error('[submitAnswer] FAILED:', json.result);
        return false;
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    return false;
  } catch (e) {
    console.error('[submitAnswer] Exception:', e);
    return null;
  }
}

/**
 * Seeds the contract with initial questions via Freighter wallet.
 * Calls create_quiz which is the actual Rust function on this contract.
 */
export async function initializeContract(userAddress: string): Promise<void> {
  const INITIAL_QUESTIONS = quizData.slice(0, 15);

  for (const item of INITIAL_QUESTIONS) {
    console.log(`[seed] Creating quiz for Q${item.id}...`);
    const account = await server.getAccount(userAddress);

    const tx = new TransactionBuilder(account, {
      fee: '1000000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
    quizContract.call(
          'create_quiz',
          Address.fromString(userAddress).toScVal(),
          nativeToScVal(item.id, { type: 'u32' }),
          nativeToScVal(item.text, { type: 'string' }),
          nativeToScVal(item.correctAnswer, { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    let prepared;
    try {
      prepared = await server.prepareTransaction(tx);
    } catch (e: any) {
      alert('Seeding failed: ' + e.message);
      return;
    }

    const signResult = await signTransaction(prepared.toXDR(), { network: 'TESTNET' });
    if (typeof signResult === 'object' && signResult !== null && 'error' in signResult) {
      throw new Error('Signing failed: ' + (signResult as any).error);
    }
    const signedXdr =
      typeof signResult === 'string' ? signResult : (signResult as any)?.signedTxXdr;
    if (!signedXdr) throw new Error('Signing failed - no signature returned');

    const sent = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE));
    console.log(`[seed] Q${item.id} submitted: ${(sent as any).hash}`);
    
    // WAIT for transaction to confirm before sending next one to avoid bad sequence errors
    let confirmed = false;
    for (let j = 0; j < 30; j++) {
      const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getTransaction',
          params: { hash: (sent as any).hash }
        }),
      });
      const json = await res.json();
      if (json.result?.status === 'SUCCESS') {
        confirmed = true;
        break;
      }
      if (json.result?.status === 'FAILED') {
        throw new Error(`Transaction for Q${item.id} FAILED on-chain.`);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!confirmed) throw new Error(`Timeout waiting for Q${item.id}`);
  }
}
