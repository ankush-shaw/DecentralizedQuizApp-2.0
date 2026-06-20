import { xdr } from '@stellar/stellar-sdk';


const RPC_URL = 'https://soroban-testnet.stellar.org';

async function test() {
  const hash = '883e91a5aa5ca12e0fedef10b3298791b7824174098b3768d551ec97c1e1b7d7'; // The upload hash from the last run
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: { hash } })
  });
  const json = await res.json();
  const resultXdr = json.result.resultXdr;
  
  const txResult = xdr.TransactionResult.fromXDR(resultXdr, 'base64');
  const wasmIdScVal = txResult.result().results()[0].tr().invokeHostFunctionResult().success();
  console.log('WASM ScVal:', wasmIdScVal);
}
test().catch(console.error);
