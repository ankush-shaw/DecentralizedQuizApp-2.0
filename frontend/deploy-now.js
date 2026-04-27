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
  xdr,
} from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const WASM_PATH = '../../target/wasm32-unknown-unknown/release/quiz_contract.wasm';

const server = new rpc.Server(RPC_URL);

async function deployAndSeed() {
  console.log('🚀 STARTING ULTIMATE DEPLOYMENT & SEEDING...');
  
  // 1. Setup Account
  const kp = Keypair.random();
  const addressStr = kp.publicKey();
  console.log('Deployer Account:', addressStr);
  console.log('Secret Key:', kp.secret());

  console.log('Funding via Friendbot...');
  const fund = await fetch(`https://friendbot.stellar.org/?addr=${addressStr}`);
  if (!fund.ok) throw new Error('Funding failed');
  await new Promise(r => setTimeout(r, 5000));
  let account = await server.getAccount(addressStr);

  // 2. Upload WASM
  console.log('Step 1: Uploading WASM...');
  const wasm = fs.readFileSync(path.resolve(WASM_PATH));
  const uploadTx = new TransactionBuilder(account, { fee: '1000000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.uploadContractWasm({ wasm }))
    .setTimeout(30).build();
  
  const uploadPrepared = await server.prepareTransaction(uploadTx);
  uploadPrepared.sign(kp);
  const uploadRes = await server.sendTransaction(uploadPrepared);
  console.log('Upload Hash:', uploadRes.hash);
  const uploadResult = await waitForTransaction(uploadRes.hash);
  
  // Extract wasmHash from resultXdr
  const txResult = xdr.TransactionResult.fromXDR(uploadResult.resultXdr, 'base64');
  const wasmHash = txResult.result().results()[0].tr().invokeHostFunctionResult().success().toString('hex');
  console.log('WASM Hash:', wasmHash);
  console.log('Waiting 30s for indexing...');
  await new Promise(r => setTimeout(r, 30000));

  // 3. Instantiate
  console.log('Step 2: Instantiating Contract...');
  account = await server.getAccount(addressStr);
  const instTx = new TransactionBuilder(account, { fee: '1000000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.createCustomContract({ wasmHash: Buffer.from(wasmHash, 'hex'), address: new Address(addressStr) }))
    .setTimeout(30).build();
  
  let instRes;
  while (true) {
    try {
      const instPrepared = await server.prepareTransaction(instTx);
      instPrepared.sign(kp);
      instRes = await server.sendTransaction(instPrepared);
      break;
    } catch (e) {
      console.log('Simulation Error:', e.message);
      if (e.message.includes('MissingValue') || e.message.includes('not exist') || e.message.includes('switch')) {
        console.log('Waiting for WASM indexing or network stability...');
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      throw e;
    }
  }
  const instResult = await waitForTransaction(instRes.hash);
  
  // Extract contractId (C...)
  const contractId = JSON.stringify(instResult).match(/C[A-Z0-9]{55}/)?.[0];
  console.log('✅ NEW CONTRACT ID:', contractId);

  // 4. Seed Questions
  console.log('Step 3: Seeding Questions...');
  const quizData = JSON.parse(fs.readFileSync('./src/data/questions.json', 'utf8'));
  const contract = new Contract(contractId);

  for (const item of quizData.slice(0, 15)) {
    console.log(`Seeding Q${item.id}: ${item.text.slice(0, 30)}...`);
    account = await server.getAccount(addressStr);
    const seedTx = new TransactionBuilder(account, { fee: '1000000', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call('create_quiz', 
        nativeToScVal(item.id, { type: 'u32' }), 
        nativeToScVal(item.text, { type: 'string' }), 
        nativeToScVal(item.correctAnswer, { type: 'string' })
      )).setTimeout(30).build();

    const seedPrepared = await server.prepareTransaction(seedTx);
    seedPrepared.sign(kp);
    const seedRes = await server.sendTransaction(seedPrepared);
    await waitForTransaction(seedRes.hash);
  }

  console.log('🎉 DEPLOYMENT COMPLETE!');
  console.log('--------------------------------------------------');
  console.log('UPDATE YOUR soroban.ts WITH THIS CONTRACT ID:');
  console.log(contractId);
  console.log('--------------------------------------------------');
}

async function waitForTransaction(hash) {
  while (true) {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: { hash } })
    });
    const json = await res.json();
    const status = json.result?.status;
    if (status === 'SUCCESS') return json.result;
    if (status === 'FAILED') throw new Error('Transaction FAILED: ' + JSON.stringify(json.result));
    await new Promise(r => setTimeout(r, 2000));
  }
}

deployAndSeed().catch(console.error);
