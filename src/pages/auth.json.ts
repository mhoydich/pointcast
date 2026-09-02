import type { APIRoute } from 'astro';

import { ACCOUNT_PROVIDERS } from '../data/super-auth';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'PointCast Account',
  canonical: 'https://pointcast.xyz/auth',
  version: 2,
  purpose: 'Sign in, review linked identities, link a wallet, or sign out.',
  providers: ACCOUNT_PROVIDERS,
  endpoints: {
    session: '/api/auth/session',
    machineContract: '/auth.json',
  },
  boundaries: [
    'Looking around PointCast requires no account.',
    'Linked identities are shown by provider name without exposing their identifiers here.',
    'Wallet operations remain explicit and require wallet approval.',
    'Music and shop administration live in the private dashboard panel.',
  ],
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  },
});
