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
} from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const WASM_PATH = '../target/wasm32v1-none/release/hello_world.wasm';

const server = new rpc.Server(RPC_URL);

async function deploy() {
  const kp = Keypair.random();
  const addressStr = kp.publicKey();
  const address = new Address(addressStr);

  console.log('--- DEPLOYING FRESH CONTRACT ---');
  console.log('Admin:', addressStr);

  const fund = await fetch(`https://friendbot.stellar.org/?addr=${addressStr}`);
  await fund.text();
  console.log('Account funded.');

  await new Promise(r => setTimeout(r, 6000));
  let account = await server.getAccount(addressStr);

  const wasm = fs.readFileSync(path.resolve(WASM_PATH));
  console.log('Uploading WASM...');
  const uploadTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.uploadContractWasm({ wasm }))
    .setTimeout(60).build();
  const uploadPrepared = await server.prepareTransaction(uploadTx);
  uploadPrepared.sign(kp);
  const uploadRes = await server.sendTransaction(uploadPrepared);
  console.log('Upload Hash:', uploadRes.hash);
  
  await waitForTx(uploadRes.hash);
  console.log('WASM Uploaded.');

  // Extract from Stellar Lab if needed, but I'll try to find it via event or just use the hash
  console.log('PLEASE CHECK STELLAR EXPERT FOR THE WASM ID from hash:', uploadRes.hash);
}

async function waitForTx(hash) {
  let res = await server.getTransaction(hash);
  while (res.status === 'NOT_FOUND' || res.status === 'PENDING') {
    await new Promise(r => setTimeout(r, 2000));
    res = await server.getTransaction(hash);
  }
  return res;
}

deploy().catch(console.error);
