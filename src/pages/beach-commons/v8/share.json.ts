import type { APIRoute } from 'astro';
import {
  BEACH_BLANKET_COVERAGE_PATHS,
  BEACH_BLANKET_PROMOTION_CAMPAIGN,
  BEACH_BLANKET_PROMO_DISPATCHES,
  BEACH_BLANKET_PROMO_LINKS,
} from '../../../lib/beach-commons-v8-promotion';

export const GET: APIRoute = () => {
  const payload = {
    schema: 'https://pointcast.xyz/schemas/promotion-packet/v1',
    name: 'The Beach Blanket Review promotion packet',
    description:
      'Copy-ready launch dispatches, coverage routes, image credits, and public campaign receipts for PointCast Beach Commons V8.',
    campaign: BEACH_BLANKET_PROMOTION_CAMPAIGN,
    dispatches: BEACH_BLANKET_PROMO_DISPATCHES.map((dispatch) => ({
      ...dispatch,
      url: new URL(dispatch.href, 'https://pointcast.xyz').toString(),
      image: new URL(dispatch.image, 'https://pointcast.xyz').toString(),
    })),
    coveragePaths: BEACH_BLANKET_COVERAGE_PATHS,
    links: BEACH_BLANKET_PROMO_LINKS,
    editorialBoundary: {
      event:
        'Beach Commons remains an unofficial shopping and coordination study. No event, installation, permit, merchant partnership, or County affiliation is announced.',
      products:
        'Current maker and merchant specifications were compared. PointCast received no samples and claims no hands-on product testing.',
      photography:
        'V8 product images are credited editorial references. Third-party publications should request their own merchant permissions or use PointCast original concept imagery.',
      affiliate:
        'PointCast is not enrolled in a listed merchant program, uses no affiliate tracking parameter, and earns $0 from every shopping link.',
      coverage:
        'Applications, self-publishing routes, and editorial pitches do not guarantee independent coverage.',
      telemetry:
        'The PointCast campaign records aggregate impressions and clicks without visitor identifiers or behavioral profiles.',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
