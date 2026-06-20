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
const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

const QUIZ_QUESTIONS = [
  {
    text: 'What is the native asset of the Stellar network?',
    answer: 'XLM',
  },
  {
    text: 'Which programming language is used to write Soroban smart contracts?',
    answer: 'Rust',
  },
  {
    text: 'What does "DeFi" stand for in Web3?',
    answer: 'Decentralized Finance',
  },
  {
    text: 'What is a smart contract?',
    answer: 'Self-executing code on a blockchain',
  },
  {
    text: 'What wallet is used to interact with Stellar DApps?',
    answer: 'Freighter',
  },
];

async function setup() {
  const kp = Keypair.random();
  const address = kp.publicKey();

  console.log('Funding temporary admin account:', address);
  const fundRes = await fetch(`https://friendbot.stellar.org/?addr=${address}`);
  if (!fundRes.ok) throw new Error('Funding failed');
  console.log('Account funded.');

  // Wait for Horizon to catch up
  await new Promise(r => setTimeout(r, 5000));

  let account = await server.getAccount(address);

  for (const q of QUIZ_QUESTIONS) {
    console.log(`Creating quiz: ${q.text}`);
    
    // contract.call returns an Operation
    const op = contract.call(
      'create_quiz',
      nativeToScVal(address, { type: 'address' }),
      nativeToScVal(q.text, { type: 'string' }),
      nativeToScVal(q.answer, { type: 'string' })
    );

    let tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    console.log('Preparing transaction...');
    const preparedTx = await server.prepareTransaction(tx);
    preparedTx.sign(kp);
    
    console.log('Sending transaction...');
    const sendResult = await server.sendTransaction(preparedTx);
    console.log('Sent. Hash:', sendResult.hash);

    let status = 'PENDING';
    while (status === 'PENDING' || status === 'NOT_FOUND') {
      await new Promise(r => setTimeout(r, 2000));
      const res = await server.getTransaction(sendResult.hash);
      status = res.status;
      if (status === 'SUCCESS') {
        console.log('Success!');
      } else if (status === 'FAILED') {
        console.error('Failed!', JSON.stringify(res, null, 2));
        process.exit(1);
      } else {
        console.log('Current status:', status);
      }
    }
    
    // Refresh account for next sequence number
    account = await server.getAccount(address);
  }

  console.log('All 5 quizzes created on-chain!');
}

setup().catch(console.error);
