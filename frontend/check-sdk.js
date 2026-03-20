import {
  rpc,
  Networks,
  Contract,
  Address,
  xdr,
} from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CCATST7MXGZQWB6HQCHDLUKUZA6MVK4KIGCDFVQ34COE543GTINOK3BL';
const server = new rpc.Server('https://soroban-testnet.stellar.org');

async function check() {
  console.log('Checking contract:', CONTRACT_ID);
  try {
     // 1. Check if contract exists by fetching its ledger entry
     const key = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
        contract: Address.fromString(CONTRACT_ID).toScAddress(),
        key: xdr.ScVal.scvSymbol('COUNT'), // Guessing a key
        durability: xdr.ContractDataDurability.instance()
     }));

     const res = await server.getLedgerEntries([key]);
     console.log('Ledger entries found:', res.entries?.length || 0);

     if (res.entries && res.entries.length > 0) {
        console.log('Contract exists and has state.');
     } else {
        console.log('Contract does not have state (maybe not initialized or wrong ID).');
     }
  } catch (e) {
     console.error('Check failed:', e);
  }
}

check();
