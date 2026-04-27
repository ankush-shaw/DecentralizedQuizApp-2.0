// Check what functions are available on the deployed contract
const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
const RPC_URL = 'https://soroban-testnet.stellar.org';

async function getContractInfo() {
  // Get the contract's WASM hash from its ledger entry
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'getLedgerEntries',
      params: {
        keys: [
          // ContractData entry for the contract itself
          Buffer.from(
            (await import('@stellar/stellar-sdk')).then ? '' : ''
          ).toString('base64')
        ]
      }
    })
  });
  
  // Instead, let's just try calling each possible function and see which exist
  const { rpc, Networks, TransactionBuilder, BASE_FEE, Contract, nativeToScVal, Address } = await import('@stellar/stellar-sdk');
  const server = new rpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);
  
  const dummyPK = 'GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI';
  const account = await server.getAccount(dummyPK);
  
  const functions = ['create_quiz', 'add_question', 'submit_answer', 'get_question', 'get_score', 'get_total_quizzes', 'get_quiz_count'];
  
  console.log('Testing which functions exist on the contract...\n');
  for (const fn of functions) {
    try {
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(contract.call(fn, nativeToScVal(1, { type: 'u32' })))
        .setTimeout(30).build();
      const result = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(result)) {
        console.log(`✅ ${fn} — EXISTS and works`);
      } else {
        console.log(`⚠️  ${fn} — EXISTS but errored:`, result.error);
      }
    } catch (e) {
      if (e.message.includes('non-existent')) {
        console.log(`❌ ${fn} — DOES NOT EXIST`);
      } else {
        console.log(`⚠️  ${fn} — EXISTS but errored: ${e.message.split('\n')[0]}`);
      }
    }
  }
}

getContractInfo().catch(console.error);
