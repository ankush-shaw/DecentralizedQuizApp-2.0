import {
  rpc,
  Networks,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

const INITIAL_QUESTIONS = [
  { q: 'What is the native asset of the Stellar network?', a: 'XLM' },
  { q: 'Which programming language is used to write Soroban smart contracts?', a: 'Rust' },
  { q: 'What does "DeFi" stand for in Web3?', a: 'Decentralized Finance' },
  { q: 'What is a smart contract?', a: 'Self-executing code on a blockchain' },
  { q: 'What wallet is used to interact with Stellar DApps?', a: 'Freighter' },
];

async function seed() {
  const kp = Keypair.random();
  const addressStr = kp.publicKey();
  const address = new Address(addressStr);

  console.log('--- SEEDING CONTRACT ---');
  console.log('Contract:', CONTRACT_ID);
  console.log('Temp Admin:', addressStr);

  const fund = await fetch(`https://friendbot.stellar.org/?addr=${addressStr}`);
  if (!fund.ok) {
    console.error('Fund failed:', await fund.text());
    process.exit(1);
  }
  console.log('Funded.');

  // Wait for Horizon
  await new Promise(r => setTimeout(r, 6000));
  let account = await server.getAccount(addressStr);

  for (const item of INITIAL_QUESTIONS) {
    console.log(`Adding Q: ${item.q}`);
    const op = contract.call(
      'create_quiz',
      address, // Pass Address object directly
      nativeToScVal(item.q, { type: 'string' }),
      nativeToScVal(item.a, { type: 'string' })
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(kp);
    
    const send = await server.sendTransaction(prepared);
    console.log('Tx sent:', send.hash);

    let status = 'PENDING';
    while (status === 'PENDING' || status === 'NOT_FOUND') {
      await new Promise(r => setTimeout(r, 2000));
      const res = await server.getTransaction(send.hash);
      status = res.status;
      if (status === 'SUCCESS') console.log('Success!');
      if (status === 'FAILED') {
        console.error('FAILED!', JSON.stringify(res, null, 2));
        process.exit(1);
      }
    }
    // Refresh account
    account = await server.getAccount(addressStr);
  }

  console.log('--- SEEDING FINISHED ---');
}

seed().catch(err => {
    console.error('SEED ERROR:', err);
    process.exit(1);
});
