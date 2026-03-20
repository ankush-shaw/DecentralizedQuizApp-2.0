import {
  rpc,
  Networks,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Contract,
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';

const addressStr = 'GBBIG46...'; // User's address
try {
  console.log('Testing Address string...');
  const val1 = nativeToScVal(addressStr, { type: 'address' });
  console.log('String Success:', !!val1);
} catch (e) {
  console.error('String Failed:', e);
}

try {
  console.log('Testing Address object...');
  const val2 = nativeToScVal(new Address(addressStr), { type: 'address' });
  console.log('Object Success:', !!val2);
} catch (e) {
  console.error('Object Failed:', e);
}
