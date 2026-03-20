// Seed script using raw HTTP RPC calls to avoid local SDK XDR parsing bugs
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
const RPC_URL = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Raw RPC call to avoid SDK XDR parsing
async function rawGetTransaction(hash) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'getTransaction',
      params: { hash }
    })
  });
  const json = await res.json();
  return json.result || { status: 'NOT_FOUND' };
}

const QUESTIONS = [
  { id: 1, q: 'What is the native asset of the Stellar network?', a: 'XLM' },
  { id: 2, q: 'Which programming language is used to write Soroban smart contracts?', a: 'Rust' },
  { id: 3, q: 'What does "DeFi" stand for in Web3?', a: 'Decentralized Finance' },
  { id: 4, q: 'What is a smart contract?', a: 'Self-executing code on a blockchain' },
  { id: 5, q: 'What wallet is used to interact with Stellar DApps?', a: 'Freighter' },
];

async function seed() {
  const kp = Keypair.random();
  const pub = kp.publicKey();

  console.log('Funding:', pub);
  const fundRes = await fetch(`https://friendbot.stellar.org/?addr=${pub}`);
  if (!fundRes.ok) throw new Error('Friendbot failed');
  console.log('Funded ✓ — waiting 8s...');
  await new Promise(r => setTimeout(r, 8000));

  for (const item of QUESTIONS) {
    const account = await server.getAccount(pub);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(
        contract.call(
          'add_question',
          nativeToScVal(item.id, { type: 'u32' }),
          nativeToScVal(item.q, { type: 'string' }),
          nativeToScVal(item.a, { type: 'string' })
        )
      )
      .setTimeout(60).build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(kp);

    const send = await server.sendTransaction(prepared);
    console.log(`Q${item.id}: sent hash = ${send.hash}`);

    // Poll using raw HTTP - bypasses the broken XDR parser
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const status = await rawGetTransaction(send.hash);
      console.log(`  poll ${i+1}: ${status.status}`);
      if (status.status === 'SUCCESS') { console.log(`  ✅ Q${item.id} seeded!`); break; }
      if (status.status === 'FAILED') { console.error(`  ❌ Q${item.id} FAILED`); process.exit(1); }
    }
  }

  console.log('\n🎉 All 5 questions seeded!');
}

seed().catch(e => { console.error('Error:', e.message); process.exit(1); });
