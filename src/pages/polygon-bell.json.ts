import type { APIRoute } from 'astro';
import { POLYGON_BELL_ABI, POLYGON_BELL_MINT } from '../lib/polygon-bell-contract';
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
    mint: {
      status: POLYGON_BELL_MINT.status,
      contract: POLYGON_BELL_MINT.contract,
      functionName: POLYGON_BELL_MINT.functionName,
      functionSignature: POLYGON_BELL_MINT.functionSignature,
      abi: POLYGON_BELL_ABI,
      source: POLYGON_BELL_MINT.source,
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
      'Deploy contracts/eth/PointCastPolygonBell1155.sol on Polygon.',
      'Paste contract address into src/data/contracts.json polygon_bell.polygon.',
      'Use the live mint button after a proof transaction exists.',
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
