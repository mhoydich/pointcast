import type { APIRoute } from 'astro';
import {
  AFFILIATE_PATHS,
  BEACH_COMMONS_V8,
  BLANKET_OFFICIAL_CONTEXT,
  BLANKET_PICKS,
  BLANKET_SYSTEMS,
  MERCHANT_OFFERS,
  blanketSystemTotal,
  getBlanketPick,
} from '../../lib/beach-commons-v8';
import {
  BEACH_BLANKET_COVERAGE_PATHS,
  BEACH_BLANKET_PROMOTION_CAMPAIGN,
  BEACH_BLANKET_PROMO_DISPATCHES,
  BEACH_BLANKET_PROMO_LINKS,
} from '../../lib/beach-commons-v8-promotion';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V8,
        products: BLANKET_PICKS.map((product) => ({
          ...product,
          linkRelation: 'plain-direct-merchant-link',
          affiliateTracked: false,
          handsOnTestedByPointCast: false,
          photography: {
            localEditorialReference: product.image,
            source: product.imageSource,
            credit: product.imageCredit,
          },
        })),
        systems: BLANKET_SYSTEMS.map((system) => ({
          ...system,
          subtotalUsd: Number(blanketSystemTotal(system).toFixed(2)),
          products: system.lines.map((line) => {
            const product = getBlanketPick(line.id);
            return {
              quantity: line.quantity,
              productId: line.id,
              maker: product?.maker,
              name: product?.name,
              unitPriceUsd: product?.priceUsd,
              subtotalUsd: Number(((product?.priceUsd ?? 0) * line.quantity).toFixed(2)),
              url: product?.url,
            };
          }),
        })),
        affiliateLedger: {
          pointcastStatus: 'not enrolled; no tracking parameters; revenue $0',
          applicationPaths: AFFILIATE_PATHS,
          merchantOffers: MERCHANT_OFFERS,
        },
        promotion: {
          campaign: BEACH_BLANKET_PROMOTION_CAMPAIGN,
          dispatches: BEACH_BLANKET_PROMO_DISPATCHES,
          coveragePaths: BEACH_BLANKET_COVERAGE_PATHS,
          links: BEACH_BLANKET_PROMO_LINKS,
        },
        officialContext: BLANKET_OFFICIAL_CONTEXT,
        related: [
          {
            title: BEACH_COMMONS_V8.previousEdition.title,
            url: BEACH_COMMONS_V8.previousEdition.url,
            relation: 'previous field-study edition',
          },
          {
            title: 'PointCast Block 0521',
            url: BEACH_COMMONS_V8.blockUrl,
            relation: 'permanent feed record',
          },
          {
            title: 'A Blanket Is a Tiny Public Room',
            url: BEACH_BLANKET_PROMO_LINKS.promotionDesk,
            relation: 'promotion desk and coverage ladder',
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
        Link: '<https://pointcast.xyz/beach-commons/v8>; rel="alternate"; type="text/html"',
      },
    },
  );
