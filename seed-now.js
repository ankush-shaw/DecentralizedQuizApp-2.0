import {
  rpc,
  Networks,
  Keypair,
  TransactionBuilder,
  Contract,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import fs from 'fs';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';

const server = new rpc.Server(RPC_URL);

async function seedContract() {
  console.log('🚀 SEEDING CONTRACT WITH add_question(id, text, answer)...');

  const kp = Keypair.random();
  const deployerAddress = kp.publicKey();
  console.log('Seeder Account:', deployerAddress);

  console.log('Funding via Friendbot...');
  const fund = await fetch(`https://friendbot.stellar.org/?addr=${deployerAddress}`);
  if (!fund.ok) throw new Error('Funding failed: ' + await fund.text());
  await new Promise(r => setTimeout(r, 5000));

  const quizData = JSON.parse(fs.readFileSync('./src/data/questions.json', 'utf8'));
  const contract = new Contract(CONTRACT_ID);

  for (const item of quizData.slice(0, 15)) {
    console.log(`Seeding Q${item.id}: "${item.text.slice(0, 40)}..."`);

    let account = await server.getAccount(deployerAddress);

    // Correct signature: add_question(id: u32, text: String, answer: String)
    const tx = new TransactionBuilder(account, {
      fee: '1000000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'add_question',
          nativeToScVal(item.id, { type: 'u32' }),
          nativeToScVal(item.text, { type: 'string' }),
          nativeToScVal(item.correctAnswer, { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(kp);
    const sent = await server.sendTransaction(prepared);

    const result = await waitForTransaction(sent.hash);
    if (result.status === 'SUCCESS') {
      console.log(`  ✅ Q${item.id} seeded!`);
    } else {
      console.error(`  ❌ Q${item.id} FAILED:`, JSON.stringify(result).slice(0, 200));
    }
  }

  console.log('\n🎉 SEEDING COMPLETE!');
}

async function waitForTransaction(hash) {
  while (true) {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getTransaction',
        params: { hash }
      }),
    });
    const json = await res.json();
    const status = json.result?.status;
    if (status === 'SUCCESS' || status === 'FAILED') return json.result;
    await new Promise(r => setTimeout(r, 2000));
  }
}

seedContract().catch(console.error);
