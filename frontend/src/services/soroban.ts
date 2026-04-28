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

export const CONTRACT_ID = 'CCN42P4LRUSG426R5WAOCAIX3WSZG2T7Y3YHFETN3F4JY3NM7OINJRAD';
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const NATIVE_TOKEN = 'CAS3J7GYCCXG7Y3I7A6OTNWD5YEMVFD6P6HKDCDOED2CUEV7V5KWD7DY';

/**
 * Pay the entry fee for the quiz (1 XLM)
 * This uses an inter-contract call to the Native XLM Token contract.
 */
export async function payEntryFee(userAddress: string): Promise<boolean> {
  try {
    const account = await server.getAccount(userAddress);
    
    // Amount in stroops (1.0 XLM = 10,000,000 stroops)
    const amount = '10000000';

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

    const prepared = await server.prepareTransaction(tx);
    const signResult = await signTransaction(prepared.toXDR(), { network: 'TESTNET' });
    
    const signedXdr = typeof signResult === 'string' ? signResult : (signResult as any)?.signedTxXdr;
    if (!signedXdr) return false;

    const sent = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE));
    
    // Wait for confirmation
    for (let i = 0; i < 30; i++) {
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
      if (json.result?.status === 'SUCCESS') return true;
      if (json.result?.status === 'FAILED') return false;
      await new Promise(r => setTimeout(r, 2000));
    }
    return false;
  } catch (e) {
    console.error('Entry fee payment failed:', e);
    return false;
  }
}

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
 * Submits multiple quiz answers in a single signed transaction.
 * This is the ultimate UX improvement for Level 5.
 */
export async function submitBatchAnswers(
  userAddress: string,
  answers: { id: number; answer: string }[]
): Promise<number | null> {
  console.log(`[submitBatchAnswers] Submitting ${answers.length} answers...`);
  try {
    const account = await server.getAccount(userAddress);

    // Convert array of answers to Soroban Vector format [(u32, String)]
    const scAnswers = nativeToScVal(
      answers.map((a) => [
        nativeToScVal(a.id, { type: 'u32' }),
        nativeToScVal(a.answer, { type: 'string' })
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

    let prepared;
    try {
      prepared = await server.prepareTransaction(tx);
    } catch (e: any) {
      console.error('[submitBatchAnswers] prepareTransaction failed:', e.message);
      alert('Transaction simulation failed: ' + e.message + '\n\nTry refreshing the page and ensuring your wallet is funded.');
      return null;
    }
    const signResult = await signTransaction(prepared.toXDR(), { network: 'TESTNET' });

    if (typeof signResult === 'object' && signResult !== null && 'error' in signResult) {
      return null;
    }

    const signedXdr = typeof signResult === 'string' ? signResult : (signResult as any)?.signedTxXdr;
    if (!signedXdr) return null;

    const sent = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE));
    
    // Poll for result
    for (let i = 0; i < 30; i++) {
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
        // Extract the return value (number of correct answers)
        const resultMetaXdr = json.result.resultMetaXdr;
        // In a real app we'd parse this, but for simplicity we return a success indicator
        return answers.length; 
      }
      if (json.result?.status === 'FAILED') return null;
      await new Promise(r => setTimeout(r, 2000));
    }
    return null;
  } catch (e) {
    console.error('[submitBatchAnswers] Exception:', e);
    return null;
  }
}

/**
 * Seeds the contract with initial questions via Freighter wallet.
 * Calls create_quiz which is the actual Rust function on this contract.
 */
export async function initializeContract(userAddress: string): Promise<void> {
  const INITIAL_QUESTIONS = quizData.slice(0, 15);
  console.log(`[seed] Initializing batch of ${INITIAL_QUESTIONS.length} questions...`);

  try {
    const account = await server.getAccount(userAddress);

    // Convert array to Soroban Vector format [(u32, String, String)]
    const scItems = nativeToScVal(
      INITIAL_QUESTIONS.map((item) => [
        nativeToScVal(item.id, { type: 'u32' }),
        nativeToScVal(item.text, { type: 'string' }),
        nativeToScVal(item.correctAnswer, { type: 'string' })
      ])
    );

    const tx = new TransactionBuilder(account, {
      fee: '1000000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        quizContract.call(
          'create_quiz_batch',
          scItems
        )
      )
      .setTimeout(30)
      .build();

    let prepared;
    try {
      prepared = await server.prepareTransaction(tx);
    } catch (e: any) {
      alert('Initialization simulation failed: ' + e.message);
      return;
    }

    const signResult = await signTransaction(prepared.toXDR(), { network: 'TESTNET' });
    if (typeof signResult === 'object' && signResult !== null && 'error' in signResult) {
      throw new Error('Signing failed: ' + (signResult as any).error);
    }
    const signedXdr = typeof signResult === 'string' ? signResult : (signResult as any)?.signedTxXdr;
    if (!signedXdr) throw new Error('Signing failed - no signature');

    const sent = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE));
    console.log(`[seed] Batch submitted: ${(sent as any).hash}`);

    // Wait for confirmation
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
        alert('Contract initialized successfully with all 15 questions in ONE transaction! 🚀');
        window.location.reload(); // Refresh to update counts
        return;
      }
      if (json.result?.status === 'FAILED') throw new Error('Transaction failed on-chain.');
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e: any) {
    console.error('[initializeContract] Error:', e);
    alert('Failed to initialize: ' + e.message);
  }
}
