// Seed the contract with 5 quiz questions using add_question
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

const QUESTIONS = [
  { id: 1, q: 'What is the native asset of the Stellar network?', a: 'XLM' },
  { id: 2, q: 'Which programming language is used to write Soroban smart contracts?', a: 'Rust' },
  { id: 3, q: 'What does "DeFi" stand for in Web3?', a: 'Decentralized Finance' },
  { id: 4, q: 'What is a smart contract?', a: 'Self-executing code on a blockchain' },
  { id: 5, q: 'What wallet is used to interact with Stellar DApps?', a: 'Freighter' },
];

async function seed() {
  // Create a fresh funded keypair
  const kp = Keypair.random();
  const pub = kp.publicKey();

  console.log('Funding admin account:', pub);
  const fundRes = await fetch(`https://friendbot.stellar.org/?addr=${pub}`);
  if (!fundRes.ok) throw new Error('Friendbot funding failed: ' + await fundRes.text());
  console.log('Funded ✓');

  await new Promise(r => setTimeout(r, 5000));

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
      .setTimeout(60)
      .build();

    console.log(`\nPreparing Q${item.id}: ${item.q.slice(0, 40)}...`);
    const prepared = await server.prepareTransaction(tx);
    prepared.sign(kp);

    const send = await server.sendTransaction(prepared);
    console.log('Sent tx hash:', send.hash);

    // Wait for confirmation - getTransaction throws when NOT_FOUND
    let res = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        res = await server.getTransaction(send.hash);
        if (res.status !== 'NOT_FOUND') break;
      } catch {
        // NOT_FOUND throws an exception - keep polling
      }
    }

    if (!res) { console.error(`❌ Q${item.id} timed out`); process.exit(1); }

    if (res.status === 'SUCCESS') {
      console.log(`✅ Q${item.id} seeded!`);
    } else {
      console.error(`❌ Q${item.id} FAILED:`, res.status);
      process.exit(1);
    }
  }

  console.log('\n🎉 All 5 questions seeded! The contract is now ready.');
}

seed().catch(e => { console.error('Seed error:', e); process.exit(1); });
