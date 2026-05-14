import type { APIRoute } from 'astro';
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
      chain: POLYGON_BELL_TOKEN.chain,
      chainId: POLYGON_BELL_TOKEN.chainId,
      chainHex: POLYGON_BELL_TOKEN.chainHex,
      contract: POLYGON_BELL_TOKEN.contract,
      editionCap: POLYGON_BELL_TOKEN.editionCap,
      unlockRings: POLYGON_BELL_TOKEN.unlockRings,
      attributes: POLYGON_BELL_ATTRIBUTES,
    },
    routes: {
      human: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.pageHref, site),
      metadata: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.metadataHref, site),
      image: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.imagePath, site),
      source: polygonBellAbsoluteUrl(POLYGON_BELL_TOKEN.sourceHref, site),
    },
    nextMoves: [
      'Deploy ERC-1155 or Zora creator contract on Polygon.',
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
