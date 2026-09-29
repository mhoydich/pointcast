import type { APIRoute } from 'astro';
import { shopFrontJson, SHOP_FRONT_VERSION } from '../../lib/shop-front';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(shopFrontJson(), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'X-PointCast-Shop-Version': SHOP_FRONT_VERSION,
    },
  });
