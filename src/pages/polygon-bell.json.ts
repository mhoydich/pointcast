import type { APIRoute } from 'astro';
import { POLYGON_BELL_PUBLISH, polygonBellProofTemplate } from '../lib/polygon-bell-publish';
import { POLYGON_BELL_ATTRIBUTES, POLYGON_BELL_TOKEN, polygonBellAbsoluteUrl } from '../lib/polygon-bell-token';

export const GET: APIRoute = ({ site }) => {
  const payload = {
    surface: 'polygon-bell',
    updatedAt: POLYGON_BELL_TOKEN.updatedAt,
    projectLead: POLYGON_BELL_TOKEN.projectLead,
    status: POLYGON_BELL_TOKEN.status,
    token: {
      name: POLYGON_BELL_TOKEN.name,
      symbol: POLYGON_BELL_TOKEN.symbol,
      tokenId: POLYGON_BELL_TOKEN.tokenId,
      standard: POLYGON_BELL_TOKEN.standard,
      status: POLYGON_BELL_TOKEN.status,
      chain: POLYGON_BELL_TOKEN.chain,
      chainId: POLYGON_BELL_TOKEN.chainId,
      chainHex: POLYGON_BELL_TOKEN.chainHex,
      contract: POLYGON_BELL_TOKEN.contract,
      editionCap: POLYGON_BELL_TOKEN.editionCap,
      unlockRings: POLYGON_BELL_TOKEN.unlockRings,
      attributes: POLYGON_BELL_ATTRIBUTES,
    },
    publish: {
      status: POLYGON_BELL_PUBLISH.status,
      chainName: POLYGON_BELL_PUBLISH.chainName,
      chainId: POLYGON_BELL_PUBLISH.chainId,
      chainHex: POLYGON_BELL_PUBLISH.chainHex,
      nativeCurrency: POLYGON_BELL_PUBLISH.nativeCurrency,
      rpcUrls: POLYGON_BELL_PUBLISH.rpcUrls,
      blockExplorerUrls: POLYGON_BELL_PUBLISH.blockExplorerUrls,
      transactionMode: POLYGON_BELL_PUBLISH.transactionMode,
      proofTemplate: polygonBellProofTemplate(site),
    },
    routes: {
      human: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.pageHref, site),
      publish: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.publishHref, site),
      metadata: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.metadataHref, site),
      image: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.imagePath, site),
      source: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.sourceHref, site),
    },
    nextMoves: [
      'Publish a bell proof from MetaMask on Polygon.',
      'Deploy ERC-1155 or Zora creator contract on Polygon after proof lane settles.',
      'Paste contract address into POLYGON_BELL_TOKEN.contract.',
      'Swap local receipt collection for wallet-signed mint call.',
      'Keep the five-rung lobby unlock as the eligibility ritual.',
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
