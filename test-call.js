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

console.log('Starting script with direct node...');

const kp = Keypair.random();
const address = kp.publicKey();

console.log('Funding admin:', address);
const fund = await fetch(`https://friendbot.stellar.org/?addr=${address}`);
if (!fund.ok) {
  console.error('Fund failed:', await fund.text());
  process.exit(1);
}
console.log('Funded.');

// Wait for Horizon
await new Promise(r => setTimeout(r, 6000));

let account = await server.getAccount(address);
console.log('Got account sequence:', account.sequence);

const tx = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: NETWORK_PASSPHRASE,
})
  .addOperation(
    contract.call(
      'create_quiz',
      nativeToScVal(address, { type: 'address' }),
      nativeToScVal('Test?', { type: 'string' }),
      nativeToScVal('Yes!', { type: 'string' })
    )
  )
  .setTimeout(30)
  .build();

console.log('Preparing...');
const prepared = await server.prepareTransaction(tx);
prepared.sign(kp);

console.log('Sending...');
const send = await server.sendTransaction(prepared);
console.log('Result hash:', send.hash);

let status = 'PENDING';
while (status === 'PENDING') {
  await new Promise(r => setTimeout(r, 2000));
  const res = await server.getTransaction(send.hash);
  status = res.status;
  console.log('Current status:', status);
}

console.log('Done!');
