import {
  rpc,
  Contract,
  nativeToScVal,
} from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
const server = new rpc.Server('https://soroban-testnet.stellar.org');
const contract = new Contract(CONTRACT_ID);

async function check() {
  console.log('Testing "hello" function on contract:', CONTRACT_ID);
  try {
     const tx = await server.simulateTransaction({
        toXDR: () => 'fake', // Stub to avoid crash if some code calls it
        addOperation: () => contract.call('hello', nativeToScVal('World', {type:'string'}))
     });
     console.log('Simulation success:', tx.error ? 'No' : 'Yes');
     if (!tx.error) {
        console.log('CONTRACT IS THE OLD HELLO WORLD VERSION.');
     }
  } catch (e) {
     console.log('Hello function NOT found or simulation failed.');
  }

  console.log('Testing "get_total_quizzes" function...');
  try {
     const tx2 = await server.simulateTransaction({
        toXDR: () => 'fake',
        addOperation: () => contract.call('get_total_quizzes')
     });
     console.log('Simulation success:', tx2.error ? 'No' : 'Yes');
  } catch (e) {
     console.log('get_total_quizzes function NOT found.');
  }
}

check();
