import { POLYGON_BELL_TOKEN } from './polygon-bell-token';

export const POLYGON_BELL_MINT_STORAGE_KEY = 'pc:polygon-bell:001:mint';

export const POLYGON_BELL_MINT = {
  status: POLYGON_BELL_TOKEN.contract ? 'mint-ready' : 'contract-pending',
  contract: POLYGON_BELL_TOKEN.contract,
  functionName: 'mintBell',
  functionSignature: 'mintBell(bytes32 proofHash)',
  storageKey: POLYGON_BELL_MINT_STORAGE_KEY,
  explorerAddressBase: 'https://polygonscan.com/address/',
  explorerTxBase: 'https://polygonscan.com/tx/',
  source: 'contracts/eth/PointCastPolygonBell1155.sol',
} as const;

export const POLYGON_BELL_ABI = [
  {
    type: 'function',
    name: 'mintBell',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proofHash', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'hasMinted',
    stateMutability: 'view',
    inputs: [{ name: 'collector', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'proofUsed',
    stateMutability: 'view',
    inputs: [{ name: 'proofHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'totalMinted',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'BellMinted',
    inputs: [
      { name: 'collector', type: 'address', indexed: true },
      { name: 'proofHash', type: 'bytes32', indexed: true },
      { name: 'supply', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
] as const;
