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

async function uploadChunk(workerId, kp, questions) {
  console.log(`[Worker ${workerId}] Starting upload of ${questions.length} questions.`);
  for (const item of questions) {
    try {
      const account = await server.getAccount(kp.publicKey());
      const tx = new TransactionBuilder(account, { fee: "5000", networkPassphrase: NETWORK_PASSPHRASE })
        .addOperation(
          contract.call(
            'add_question',
            nativeToScVal(item.id, { type: 'u32' }),
            nativeToScVal(item.text, { type: 'string' }),
            nativeToScVal(item.correctAnswer, { type: 'string' })
          )
        ).setTimeout(120).build();

      const prepared = await server.prepareTransaction(tx);
      prepared.sign(kp);
      const send = await server.sendTransaction(prepared);
      
      for (let poll = 0; poll < 40; poll++) {
          await new Promise(r => setTimeout(r, 2000));
          const status = await rawGetTransaction(send.hash);
          if (status.status === 'SUCCESS') { 
            console.log(`✅ [Worker ${workerId}] Q${item.id} sealed!`); 
            break; 
          }
          if (status.status === 'FAILED') { 
            console.error(`❌ [Worker ${workerId}] Q${item.id} failed!`); 
            break; 
          }
      }
    } catch(e) {
      console.error(`[Worker ${workerId}] Error on Q${item.id}: ${e.message}`);
    }
  }
}

async function run() {
  const data = JSON.parse(fs.readFileSync('./src/data/questions.json', 'utf-8'));
  console.log(`Loaded ${data.length} questions from JSON.`);
  
  const numWorkers = 15; // 15 parallel workers for ultra-speed
  const kps = [];
  
  console.log(`Funding ${numWorkers} worker accounts...`);
  for (let i = 0; i < numWorkers; i++) {
    const kp = Keypair.random();
    kps.push(kp);
    const fund = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
    if(!fund.ok) console.log(`Friendbot failed on worker ${i+1}`);
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log('All workers funded! Slicing array and distributing work...');

  const chunkSize = Math.ceil(data.length / numWorkers);
  const chunks = Array.from({ length: numWorkers }, (_, i) =>
    data.slice(i * chunkSize, i * chunkSize + chunkSize)
  ).filter(c => c.length > 0);

  const promises = chunks.map((chunk, index) => uploadChunk(index + 1, kps[index], chunk));
  
  console.log('🚀 IGNITING ALL WORKERS!');
  await Promise.all(promises);
  console.log('🎉 ALL WORKERS FINISHED SEEDING OVER 200 QUESTIONS!');
}

run().catch(console.error);
