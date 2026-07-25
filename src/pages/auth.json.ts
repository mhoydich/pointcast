import type { APIRoute } from 'astro';

import { SUPER_AUTH_NEXT, SUPER_AUTH_PROVIDERS } from '../data/super-auth';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'PointCast Super Auth',
  canonical: 'https://pointcast.xyz/auth',
  version: 1,
  principle: 'An authorization should create a narrow, legible signal—not a silent data vacuum.',
  providers: SUPER_AUTH_PROVIDERS,
  next: SUPER_AUTH_NEXT,
  liveEndpoints: {
    session: '/api/auth/session',
    spotify: '/api/spotify/broadcast',
    shopify: '/api/shopify/connection',
    machineContract: '/auth.json',
  },
  boundaries: [
    'Looking around PointCast requires no account.',
    'Spotify is a single authorized broadcaster signal, not visitor tracking.',
    'Shopify requests read_products only; customers, orders, checkout, and payments stay out.',
    'Wallet operations remain explicit and require wallet approval.',
  ],
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  },
});
