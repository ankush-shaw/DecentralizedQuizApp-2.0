// Quick test to verify the contract accepts string-type user addresses
import {
  rpc,
  Contract,
  Networks,
  nativeToScVal,
  TransactionBuilder,
  BASE_FEE,
} from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
const DUMMY_PK = 'GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI';
const server = new rpc.Server('https://soroban-testnet.stellar.org');
const contract = new Contract(CONTRACT_ID);

async function testSimulate() {
  console.log('Testing submit_answer simulation with string user param...');
  try {
    const account = await server.getAccount(DUMMY_PK);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'submit_answer',
          nativeToScVal(DUMMY_PK, { type: 'string' }),       // string, not Address
          nativeToScVal(1, { type: 'u32' }),
          nativeToScVal('XLM', { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (sim.error) {
      console.error('❌ Simulation STILL failing:', sim.error);
    } else {
      console.log('✅ Simulation SUCCESS! Freighter will now be invoked.');
      console.log('Return value type:', sim.result?.retval?.switch()?.name);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSimulate();
