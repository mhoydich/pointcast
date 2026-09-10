import type { APIRoute } from 'astro';

import { ACCOUNT_PROVIDERS } from '../data/super-auth';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'PointCast Account',
  canonical: 'https://pointcast.xyz/auth',
  version: 3,
  purpose: 'Sign in, review linked identities, link a wallet, or sign out.',
  providers: ACCOUNT_PROVIDERS,
  endpoints: {
    session: '/api/auth/session',
    xAvailability: '/api/auth/x?status=1',
    xSignIn: '/api/auth/x?intent=login',
    xLink: '/api/auth/x?intent=link',
    privateAiVisits: '/api/me/ai-companions',
    aiSetup: '/connectors',
    machineContract: '/auth.json',
  },
  boundaries: [
    'Looking around PointCast requires no account.',
    'X linking is a sign-in identity; it grants no posting or DM permission.',
    'AI visits are private, one-time receipts; app and plan choices are self-reported.',
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
