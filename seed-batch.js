import fs from 'fs';
import { rpc, Networks, Keypair, TransactionBuilder, Contract, nativeToScVal } from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(RPC_URL);
const NETWORK_PASSPHRASE = Networks.TESTNET;
const contract = new Contract(CONTRACT_ID);

async function rawGetTransaction(hash) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: { hash } })
  });
  const json = await res.json();
  return json.result || { status: 'NOT_FOUND' };
}

async function seedBatch() {
  const data = JSON.parse(fs.readFileSync('./src/data/questions.json', 'utf-8'));
  console.log(`Loaded ${data.length} questions from JSON.`);

  const kp = Keypair.random();
  console.log('Funding temporary seeder account:', kp.publicKey());
  const fundRes = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
  if (!fundRes.ok) throw new Error('friendbot failed');
  console.log('Funded ✓ Waiting 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));

  const BATCH_SIZE = 1;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    console.log(`\nPreparing batch ${i/BATCH_SIZE + 1} (Questions ${i+1} to ${i + chunk.length})...`);
    
    // Need enough fee for 80 transactions - 10,000 stroops * 80 = 800,000 (0.08 XLM base fee logic)
    const account = await server.getAccount(kp.publicKey());
    let txBuilder = new TransactionBuilder(account, { fee: (5000 * chunk.length).toString(), networkPassphrase: NETWORK_PASSPHRASE });
    
    for (const item of chunk) {
      txBuilder = txBuilder.addOperation(
        contract.call(
          'add_question',
          nativeToScVal(item.id, { type: 'u32' }),
          nativeToScVal(item.text, { type: 'string' }),
          nativeToScVal(item.correctAnswer, { type: 'string' })
        )
      );
    }
    
    const tx = txBuilder.setTimeout(180).build();
    console.log('Simulating and preparing chunk...');
    const prepared = await server.prepareTransaction(tx);
    prepared.sign(kp);
    
    const send = await server.sendTransaction(prepared);
    console.log(`Batch ${i/BATCH_SIZE + 1} sent. Hash: ${send.hash}`);
    
    for (let poll = 0; poll < 40; poll++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await rawGetTransaction(send.hash);
        process.stdout.write(`...${status.status} `);
        if (status.status === 'SUCCESS') { 
          console.log(`\n  ✅ Batch ${i/BATCH_SIZE + 1} sealed on chain!`); 
          break; 
        }
        if (status.status === 'FAILED') { 
          console.error(`\n  ❌ Batch ${i/BATCH_SIZE + 1} failed on chain!`); 
          process.exit(1); 
        }
    }
  }
  
  console.log('\n🎉 Successfully seeded ALL questions to Soroban contract!');
}

seedBatch().catch(console.error);
