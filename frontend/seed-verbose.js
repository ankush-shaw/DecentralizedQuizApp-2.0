// Verbose seed script - logs everything
import {
  rpc,
  Networks,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  nativeToScVal,
} from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
const server = new rpc.Server('https://soroban-testnet.stellar.org');
const contract = new Contract(CONTRACT_ID);
const NETWORK_PASSPHRASE = Networks.TESTNET;

async function seed() {
  const kp = Keypair.random();
  const pub = kp.publicKey();

  console.log('Funding:', pub);
  const fundRes = await fetch(`https://friendbot.stellar.org/?addr=${pub}`);
  const fundText = await fundRes.text();
  console.log('Fund response status:', fundRes.status);
  if (!fundRes.ok) throw new Error('Friendbot failed: ' + fundText);
  console.log('Funded ✓ — waiting 7s for account to propagate...');
  await new Promise(r => setTimeout(r, 7000));

  const account = await server.getAccount(pub);
  console.log('Account sequence:', account.sequence);

  // Try just ONE question first
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call(
        'add_question',
        nativeToScVal(1, { type: 'u32' }),
        nativeToScVal('What is the native asset of the Stellar network?', { type: 'string' }),
        nativeToScVal('XLM', { type: 'string' })
      )
    )
    .setTimeout(60)
    .build();

  console.log('Preparing transaction...');
  const prepared = await server.prepareTransaction(tx);
  console.log('Prepared ✓');
  prepared.sign(kp);

  console.log('Sending transaction...');
  const send = await server.sendTransaction(prepared);
  console.log('Send result:', JSON.stringify(send, null, 2));

  // Poll
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res = await server.getTransaction(send.hash);
      console.log(`Poll ${i+1}: status = ${res.status}`);
      if (res.status === 'SUCCESS') { console.log('✅ Q1 seeded!'); return; }
      if (res.status === 'FAILED') { console.error('❌ FAILED'); return; }
    } catch (e) {
      console.log(`Poll ${i+1}: not found yet (${e.message?.slice(0, 60)})`);
    }
  }
  console.error('⏰ Timed out');
}

seed().catch(console.error);
