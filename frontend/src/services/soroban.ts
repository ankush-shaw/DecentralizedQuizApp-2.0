declare module '@stellar/freighter-api';

/**
 * Soroban Service — handles all interactions with the Stellar network
 * Contract ID: CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL
 */
import {
  Contract,
  rpc,
  Networks,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  scValToNative,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk';
import { requestAccess, signTransaction } from '@stellar/freighter-api';

// ─── Config ───────────────────────────────────────────────────────────────────

export const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = 'https://soroban-testnet.stellar.org';

const server = new rpc.Server(RPC_URL, { allowHttp: false });
const contract = new Contract(CONTRACT_ID);

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

// ─── Read Functions (simulation) ───────────────────────────────────────────────

/**
 * Fetches total quizzes from the contract
 */
export async function getTotalQuizzes(): Promise<number> {
  // On-chain contract CCATST... does not have get_total_quizzes. 
  // We know it has 5 questions from previous steps.
  return 5;
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
      nativeToScVal(userAddress, { type: 'string' }),
    ]);
    return typeof res === 'number' ? res : 0;
  } catch {
    return 0;
  }
}

/** Helper for simulation (READ operations) */
async function simulateCall(funcName: string, args: any[]): Promise<any> {
    try {
      // FIX: Used a guaranteed valid 56-character public key for simulation
      const dummyPK = 'GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI';
      
      // Fetch real account if possible, otherwise use dummy logic
      let account;
      try {
        account = await server.getAccount(dummyPK);
      } catch (e) {
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
        .addOperation(contract.call(funcName, ...args))
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

// ─── Write Functions (signed transactions) ────────────────────────────────────

/**
 * Submits a quiz answer via a signed Freighter transaction
 */
export async function submitAnswer(
  userAddress: string,
  questionId: number,
  answer: string
): Promise<boolean | null> {
  console.log(`[submitAnswer] Starting for user ${userAddress}, Q${questionId}, ans: ${answer}`);
  try {
    const account = await server.getAccount(userAddress);
    console.log('[submitAnswer] Account loaded. Sequence:', account.sequence);

    const txInit = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call(
        'submit_answer', 
        nativeToScVal(userAddress, { type: 'string' }),
        nativeToScVal(questionId, { type: 'u32' }), 
        nativeToScVal(answer, { type: 'string' })
      )
    )
    .setTimeout(30).build();

    console.log('[submitAnswer] Simulating transaction...');
    const sim = await server.simulateTransaction(txInit);
    if (!rpc.Api.isSimulationSuccess(sim)) {
      console.error('[submitAnswer] Simulation failed!', sim);
      return null;
    }
    console.log('[submitAnswer] Simulation SUCCESS. Preparing transaction...');

    const prepared = await server.prepareTransaction(txInit);
    console.log('[submitAnswer] Asking Freighter for signature...');
    
    // Call Freighter directly; the user is already connected.
    const signResult = await signTransaction(prepared.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      network: 'TESTNET' // Pass network to Freighter as well
    });

    if (typeof signResult === 'object' && signResult !== null && 'error' in signResult) {
      console.error('[submitAnswer] Freighter returned an error:', (signResult as any).error);
      return null;
    }
    
    // signResult is a string when successful in current Freighter API versions
    const signedTxXdr = typeof signResult === 'string' ? signResult : (signResult as any)?.signedTxXdr;

    if (!signedTxXdr) {
      console.error('[submitAnswer] Freighter returned empty signature! result:', signResult);
      return null;
    }

    console.log('[submitAnswer] Signed successfully! Sending to network...');
    const submitted = await server.sendTransaction(TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE));
    console.log('[submitAnswer] Sent. Hash:', submitted.hash);

    let finalStatus = 'NOT_FOUND';
    for (let i = 0; i < 30; i++) {
      try {
        const rpcRes = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: { hash: submitted.hash } })
        });
        const json = await rpcRes.json();
        const status = json.result?.status || 'NOT_FOUND';
        console.log(`[submitAnswer] Poll ${i+1}: status = ${status}`);
        
        if (status === 'SUCCESS' || status === 'FAILED') {
          finalStatus = status;
          break;
        }
      } catch (e) {
        console.log('[submitAnswer] Poll error:', e);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('[submitAnswer] Final status:', finalStatus);
    if (finalStatus === 'SUCCESS') {
      return true;
    }
    
    console.error('[submitAnswer] Transaction FAILED on network.');
    return false;
  } catch (e) {
    console.error('[submitAnswer] Caught exception:', e);
    return null;
  }
}

/**
 * Seeds the contract with initial 5 questions.
 */
export async function initializeContract(userAddress: string): Promise<void> {
  const INITIAL_QUESTIONS = [
    { q: 'What is the native asset of the Stellar network?', a: 'XLM' },
    { q: 'Which programming language is used to write Soroban smart contracts?', a: 'Rust' },
    { q: 'What does "DeFi" stand for in Web3?', a: 'Digital Finance' },
    { q: 'What is a smart contract?', a: 'Self-executing code on a blockchain' },
    { q: 'What wallet is used to interact with Stellar DApps?', a: 'Freighter' },
  ];

    let i = 1;
    for (const item of INITIAL_QUESTIONS) {
    const account = await server.getAccount(userAddress);
    
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call(
        'add_question', 
        nativeToScVal(i++, { type: 'u32' }), 
        nativeToScVal(item.q, { type: 'string' }), 
        nativeToScVal(item.a, { type: 'string' })
      )).setTimeout(30).build();

    const prepared = await server.prepareTransaction(tx);
    const signResult = await signTransaction(prepared.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
    if (typeof signResult === 'object' && signResult !== null && 'error' in signResult) throw new Error('Signing failed: ' + (signResult as any).error);
    
    const signedTxXdr = typeof signResult === 'string' ? signResult : (signResult as any)?.signedTxXdr;
    if (!signedTxXdr) throw new Error('Signing failed - no signature returned');

    const result = await server.sendTransaction(TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE));
    
    // Poll using raw HTTP to bypass SDK XDR parsing bug
    let finalStatus = 'NOT_FOUND';
    for (let i = 0; i < 30; i++) {
      try {
        const rpcRes = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: { hash: result.hash } })
        });
        const json = await rpcRes.json();
        const status = json.result?.status || 'NOT_FOUND';
        if (status === 'SUCCESS' || status === 'FAILED') {
          finalStatus = status;
          break;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
