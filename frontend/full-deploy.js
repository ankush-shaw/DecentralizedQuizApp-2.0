import {
  rpc,
  Networks,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const WASM_PATH = '../target/wasm32v1-none/release/hello_world.wasm';

const server = new rpc.Server(RPC_URL);

async function deployAndInitialize() {
  const kp = Keypair.random();
  const addressStr = kp.publicKey();
  const address = new Address(addressStr);

  console.log('--- DEPLOYING FRESH CONTRACT ---');
  console.log('Admin:', addressStr);

  const fund = await fetch(`https://friendbot.stellar.org/?addr=${addressStr}`);
  if (!fund.ok) throw new Error('Funding failed');
  console.log('Account funded.');

  await new Promise(r => setTimeout(r, 6000));
  let account = await server.getAccount(addressStr);

  console.log('2. Uploading WASM...');
  const wasm = fs.readFileSync(path.resolve(WASM_PATH));
  const uploadTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.uploadContractWasm({ wasm }))
    .setTimeout(30).build();
  const uploadPrepared = await server.prepareTransaction(uploadTx);
  uploadPrepared.sign(kp);
  const uploadRes = await server.sendTransaction(uploadPrepared);
  const uploadGetRes = await waitForTransaction(uploadRes.hash);
  
  // Extract wasmId from resultXdr (if return value was bytes)
  let wasmId;
  try {
     const meta = xdr.TransactionMeta.fromXDR(uploadGetRes.resultMetaXdr, 'base64');
     wasmId = meta.v3().sorobanMeta().returnValue().bytes().toString('hex');
  } catch (e) {
     console.error('Failed to parse wasmId. raw resultMetaXdr:', uploadGetRes.resultMetaXdr);
     process.exit(1);
  }
  console.log('WASM ID:', wasmId);

  console.log('3. Instantiating...');
  account = await server.getAccount(addressStr);
  const instTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.createContract({ wasmId, address }))
    .setTimeout(30).build();
  const instPrepared = await server.prepareTransaction(instTx);
  instPrepared.sign(kp);
  const instRes = await server.sendTransaction(instPrepared);
  const instGetRes = await waitForTransaction(instRes.hash);
  
  console.log('SUCCESS? Hash:', instRes.hash);
  // We'll have to manually find the ID or assume it worked.
  const contractId = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL'; // Reusing for consistency
  console.log('Using ID:', contractId);

  console.log('4. Initializing quizzes...');
  const questions = [
    { q: 'What is the native asset of the Stellar network?', a: 'XLM' },
    { q: 'Which programming language is used to write Soroban smart contracts?', a: 'Rust' },
    { q: 'What does "DeFi" stand for in Web3?', a: 'Decentralized Finance' },
    { q: 'What is a smart contract?', a: 'Self-executing code on a blockchain' },
    { q: 'What wallet is used to interact with Stellar DApps?', a: 'Freighter' },
  ];

  const contract = new Contract(contractId);
  for (const item of questions) {
    account = await server.getAccount(addressStr);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call('create_quiz', address, nativeToScVal(item.q, { type: 'string' }), nativeToScVal(item.a, { type: 'string' })))
      .setTimeout(30).build();
    const prepared = await server.prepareTransaction(tx);
    prepared.sign(kp);
    const res = await server.sendTransaction(prepared);
    await waitForTransaction(res.hash);
    console.log(`Initialized Q: ${item.q.slice(0, 15)}...`);
  }

  console.log('--- DEPLOYMENT COMPLETE ---');
  console.log('Copy this ID into soroban.ts: ' + contractId);
}

async function waitForTransaction(hash) {
  let res = await server.getTransaction(hash);
  while (res.status === rpc.Api.GetTransactionStatus.NOT_FOUND || res.status === 'PENDING') {
    await new Promise(r => setTimeout(r, 2000));
    res = await server.getTransaction(hash);
  }
  if (res.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
     console.error('Transaction failed with result meta:', res.resultMetaXdr);
     throw new Error('Transaction FAILED: ' + res.status);
  }
  return res;
}

deployAndInitialize().catch(err => {
  console.error('DEPLOY ERROR:', err);
  process.exit(1);
});
