import { POLYGON_CHAIN_HEX, POLYGON_CHAIN_ID, RPC_URLS } from './eth/config';
import { POLYGON_BELL_TOKEN, polygonBellAbsoluteUrl } from './polygon-bell-token';

export const POLYGON_BELL_PROOF_STORAGE_KEY = 'pc:polygon-bell:001:polygon-proof';

export const POLYGON_BELL_PUBLISH = {
  status: 'wallet-publish-ready',
  chainName: 'Polygon',
  chainId: POLYGON_CHAIN_ID,
  chainHex: POLYGON_CHAIN_HEX,
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: [RPC_URLS.polygon],
  blockExplorerUrls: ['https://polygonscan.com'],
  explorerTxBase: 'https://polygonscan.com/tx/',
  storageKey: POLYGON_BELL_PROOF_STORAGE_KEY,
  memoPrefix: 'pointcast:polygon-bell:001',
  transactionMode: 'self-addressed calldata proof',
} as const;

export function polygonBellProofTemplate(site?: URL | string | null) {
  return {
    protocol: 'pointcast.polygon-bell.proof.v1',
    token: {
      name: POLYGON_BELL_TOKEN.name,
      symbol: POLYGON_BELL_TOKEN.symbol,
      tokenId: POLYGON_BELL_TOKEN.tokenId,
      metadata: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.metadataHref, site),
      source: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.sourceHref, site),
    },
    chain: {
      name: POLYGON_BELL_TOKEN.chain,
      chainId: POLYGON_BELL_TOKEN.chainId,
    },
    note: 'Bell proof transaction. This is an on-chain publication marker, not the final ERC-1155 mint.',
  };
}
