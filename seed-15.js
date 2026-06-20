import { rpc, Networks, Keypair, TransactionBuilder, BASE_FEE, Contract, nativeToScVal } from '@stellar/stellar-sdk';

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

const QUESTIONS = [
  { id: 1, q: 'What is the native asset of the Stellar network?', a: 'XLM' },
  { id: 2, q: 'Which programming language is used to write Soroban smart contracts?', a: 'Rust' },
  { id: 3, q: 'What does "DeFi" stand for in Web3?', a: 'Decentralized Finance' },
  { id: 4, q: 'What is a smart contract?', a: 'Self-executing code on a blockchain' },
  { id: 5, q: 'What wallet is used to interact with Stellar DApps?', a: 'Freighter' },
  { id: 6, q: 'Which consensus mechanism does the Stellar network use?', a: 'Stellar Consensus Protocol (SCP)' },
  { id: 7, q: 'What exactly is Soroban?', a: 'The smart contract platform on Stellar' },
  { id: 8, q: 'In Stellar, what is a "trustline"?', a: 'A required opt-in to hold specific assets' },
  { id: 9, q: 'Who founded the Stellar Development Foundation?', a: 'Jed McCaleb' },
  { id: 10, q: 'What is the primary mission of the Stellar network?', a: 'To bank the unbanked and connect global financial systems' },
  { id: 11, q: 'What is meant by State Archival in Soroban?', a: 'A mechanism to expire and restore old data to reduce bloat' },
  { id: 12, q: 'What is a non-fungible token (NFT)?', a: 'A unique, indivisible digital asset' },
  { id: 13, q: 'What is the role of an RPC node in Web3?', a: 'To allow applications to read and write to the blockchain' },
  { id: 14, q: 'What is the term for the smallest unit of XLM?', a: 'Stroop' },
  { id: 15, q: 'What happens to Soroban transaction fees?', a: 'They go into a fee pool' }
];

async function seed() {
  const kp = Keypair.random();
  console.log('Funding:', kp.publicKey());
  const fundRes = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
  if (!fundRes.ok) throw new Error('friendbot failed');
  console.log('Funded ✓');
  await new Promise(r => setTimeout(r, 6000));
  
  for (const item of QUESTIONS) {
    const account = await server.getAccount(kp.publicKey());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call('add_question', nativeToScVal(item.id, { type: 'u32' }), nativeToScVal(item.q, { type: 'string' }), nativeToScVal(item.a, { type: 'string' })))
      .setTimeout(60).build();
    
    const prepared = await server.prepareTransaction(tx);
    prepared.sign(kp);
    const send = await server.sendTransaction(prepared);
    console.log(`Q${item.id} sent: ${send.hash}`);
    
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await rawGetTransaction(send.hash);
        if (status.status === 'SUCCESS') { console.log(`  ✅ Q${item.id} seeded!`); break; }
        if (status.status === 'FAILED') { console.error(`  ❌ Q${item.id} failed.`); process.exit(1); }
    }
  }
}

seed().catch(console.error);
