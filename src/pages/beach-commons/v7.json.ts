import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V7,
  BEACH_UTILITY_CARTS,
  BEACH_UTILITY_OFFICIAL_CONTEXT,
  BEACH_UTILITY_PICKS,
  beachUtilityCartTotal,
  getBeachUtilityPick,
} from '../../lib/beach-commons-v7';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V7,
        products: BEACH_UTILITY_PICKS.map((product) => ({
          ...product,
          linkRelation: 'plain-direct-merchant-link',
          affiliateTracked: false,
          handsOnTestedByPointCast: false,
        })),
        carts: BEACH_UTILITY_CARTS.map((cart) => ({
          ...cart,
          subtotalUsd: Number(beachUtilityCartTotal(cart).toFixed(2)),
          lines: cart.productIds.map((line) => {
            const product = getBeachUtilityPick(line.id);
            return {
              quantity: line.quantity,
              productId: line.id,
              name: product?.name,
              maker: product?.maker,
              unitPriceUsd: product?.priceUsd,
              subtotalUsd: Number(((product?.priceUsd ?? 0) * line.quantity).toFixed(2)),
              url: product?.url,
            };
          }),
        })),
        officialContext: BEACH_UTILITY_OFFICIAL_CONTEXT,
        related: [
          {
            title: BEACH_COMMONS_V7.previousEdition.title,
            url: BEACH_COMMONS_V7.previousEdition.url,
            relation: 'previous field-study edition',
          },
          {
            title: 'PointCast Block 0518',
            url: BEACH_COMMONS_V7.blockUrl,
            relation: 'permanent feed record',
          },
        ],
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: '<https://pointcast.xyz/beach-commons/v7>; rel="alternate"; type="text/html"',
      },
    },
  );
