// Examine contract storage - check if questions are actually seeded
import {
  rpc,
  Contract,
  Networks,
  nativeToScVal,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
} from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
const DUMMY_PK = 'GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI';
const server = new rpc.Server('https://soroban-testnet.stellar.org');
const contract = new Contract(CONTRACT_ID);

async function test() {
  const account = await server.getAccount(DUMMY_PK);

  // Try get_question(1) to see if question 1 is seeded
  console.log('\n--- Testing get_question(1) ---');
  try {
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(contract.call('get_question', nativeToScVal(1, { type: 'u32' })))
      .setTimeout(30).build();
    const sim = await server.simulateTransaction(tx);
    if (sim.error) {
      console.log('get_question FAILED:', sim.error);
    } else {
      const val = scValToNative(sim.result.retval);
      console.log('✅ Question 1 exists:', val);
    }
  } catch(e) { console.error('get_question threw:', e.message); }

  // Try get_score to see what param type it takes
  console.log('\n--- Testing get_score with string param ---');
  try {
    const tx2 = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(contract.call('get_score', nativeToScVal(DUMMY_PK, { type: 'string' })))
      .setTimeout(30).build();
    const sim2 = await server.simulateTransaction(tx2);
    if (sim2.error) {
      console.log('get_score (string) FAILED:', sim2.error);
    } else {
      console.log('✅ get_score (string) worked:', scValToNative(sim2.result.retval));
    }
  } catch(e) { console.error('get_score threw:', e.message); }

  // Also try get_score with i32 (address type)
  console.log('\n--- Testing get_score with address param ---');
  const { Address, nativeToScVal: nts } = await import('@stellar/stellar-sdk');
  try {
    const addr = Address.fromString(DUMMY_PK).toScVal();
    const tx3 = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(contract.call('get_score', addr))
      .setTimeout(30).build();
    const sim3 = await server.simulateTransaction(tx3);
    if (sim3.error) {
      console.log('get_score (address) FAILED:', sim3.error);
    } else {
      console.log('✅ get_score (address) worked:', scValToNative(sim3.result.retval));
    }
  } catch(e) { console.error('get_score (address) threw:', e.message); }
}

test().catch(console.error);
