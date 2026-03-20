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
  try {
    const res = await simulateCall('get_total_quizzes', []);
    return typeof res === 'number' ? res : 0;
  } catch (e) {
    console.error('getTotalQuizzes error:', e);
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
      nativeToScVal(new Address(userAddress), { type: 'address' }),
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
      
      const tx = new TransactionBuilder({
        accountId: () => dummyPK,
        sequenceNumber: () => '1',
        incrementSequenceNumber: () => {},
      } as any, {
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
  try {
    const account = await server.getAccount(userAddress);

    const txInit = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call(
        'submit_answer', 
        nativeToScVal(new Address(userAddress), { type: 'address' }), 
        nativeToScVal(questionId, { type: 'u32' }), 
        nativeToScVal(answer, { type: 'string' })
      )
    )
    .setTimeout(30).build();

    const sim = await server.simulateTransaction(txInit);
    if (!rpc.Api.isSimulationSuccess(sim)) {
      console.error('Submission simulation failed (contract might be empty or ID invalid):', sim);
      return null;
    }

    const prepared = await server.prepareTransaction(txInit);
    const { signedTxXdr, error } = (await signTransaction(prepared.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    })) as any;

    if (error || !signedTxXdr) return null;

    const submitted = await server.sendTransaction(TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE));

    let res = await server.getTransaction(submitted.hash);
    while (res.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise((r) => setTimeout(r, 1000));
      res = await server.getTransaction(submitted.hash);
    }

    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      const resultMeta = (res as any).resultMetaXdr;
      if (resultMeta) {
        const meta = xdr.TransactionMeta.fromXDR(resultMeta, 'base64');
        const ret = meta?.v3()?.sorobanMeta()?.returnValue();
        if (ret) return scValToNative(ret) as boolean;
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('submitAnswer error:', e);
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

  for (const item of INITIAL_QUESTIONS) {
    const account = await server.getAccount(userAddress);
    
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call(
        'create_quiz', 
        nativeToScVal(new Address(userAddress), { type: 'address' }), 
        nativeToScVal(item.q, { type: 'string' }), 
        nativeToScVal(item.a, { type: 'string' })
      )).setTimeout(30).build();

    const prepared = await server.prepareTransaction(tx);
    const { signedTxXdr, error } = (await signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE })) as any;
    if (error || !signedTxXdr) throw new Error('Signing failed');

    const result = await server.sendTransaction(TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE));
    let status = rpc.Api.GetTransactionStatus.NOT_FOUND;
    while (status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise((r) => setTimeout(r, 1000));
      const txRes = await server.getTransaction(result.hash);
      status = txRes.status;
    }
  }
}
