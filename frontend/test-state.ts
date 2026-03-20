import { rpc, Contract, scValToNative, Networks, TransactionBuilder, BASE_FEE } from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CA7G4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEIU3J';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

async function check() {
  console.log('--- Contract State Check ---');
  console.log('Contract ID:', CONTRACT_ID);
  
  try {
    const dummyPK = 'GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI';
    const tx = new TransactionBuilder({
      accountId: () => dummyPK,
      sequenceNumber: () => '1',
      incrementSequenceNumber: () => {},
    } as any, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_total_quizzes', []))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      const total = scValToNative(sim.result.retval);
      console.log('Total Quizzes:', total);
      if (total > 0) {
        console.log('Contract is INITIALIZED.');
      } else {
        console.log('Contract is EMPTY.');
      }
    } else {
       console.log('Simulation failed (Contract might not exist or function names differ).');
       console.log('Sim result:', sim);
    }
  } catch (e) {
    console.error('Check threw an error:', e);
  }
}

check();
