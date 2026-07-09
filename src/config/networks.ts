import { Networks } from '@stellar/stellar-sdk';

export type NetworkName = 'TESTNET' | 'MAINNET';

export interface NetworkConfig {
  name: NetworkName;
  label: string;
  rpcUrl: string;
  horizonUrl: string;
  contractId: string;
  nativeToken: string;
  passphrase: string;
  explorerBase: string;
  isTestnet: boolean;
}

const NETWORKS: Record<NetworkName, NetworkConfig> = {
  TESTNET: {
    name: 'TESTNET',
    label: 'Testnet',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    contractId: 'CARMZTNTQ3FQT2B3DTKB47P4LA4H3435NTO5FX26DSW24DSF2BU7X73A',
    nativeToken: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    passphrase: Networks.TESTNET,
    explorerBase: 'https://stellar.expert/explorer/testnet',
    isTestnet: true,
  },
  MAINNET: {
    name: 'MAINNET',
    label: 'Mainnet',
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    horizonUrl: 'https://horizon.stellar.org',
    // Replace this with your real Mainnet contract ID once deployed
    contractId: 'PLACEHOLDER_MAINNET_CONTRACT_ID',
    nativeToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
    passphrase: Networks.PUBLIC,
    explorerBase: 'https://stellar.expert/explorer/public',
    isTestnet: false,
  },
};

const STORAGE_KEY = 'dquiz_network';

export function getActiveNetworkName(): NetworkName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as NetworkName | null;
    if (stored && stored in NETWORKS) return stored;
  } catch {
    // localStorage not available
  }
  return 'TESTNET';
}

export function setActiveNetwork(network: NetworkName): void {
  try {
    localStorage.setItem(STORAGE_KEY, network);
  } catch {
    // localStorage not available
  }
}

export function getActiveConfig(): NetworkConfig {
  return NETWORKS[getActiveNetworkName()];
}

export { NETWORKS };
