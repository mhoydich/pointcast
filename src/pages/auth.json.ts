import type { APIRoute } from 'astro';

import { ACCOUNT_PROVIDERS } from '../data/super-auth';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'PointCast Account',
  canonical: 'https://pointcast.xyz/auth',
  version: 4,
  purpose: 'Sign in, review linked identities, link a wallet, or sign out.',
  providers: ACCOUNT_PROVIDERS,
  endpoints: {
    session: '/api/auth/session',
    githubAvailability: '/api/auth/github?status=1',
    githubSignIn: '/api/auth/github?intent=login',
    githubLink: '/api/auth/github?intent=link',
    xAvailability: '/api/auth/x?status=1',
    xSignIn: '/api/auth/x?intent=login',
    xLink: '/api/auth/x?intent=link',
    privateAiVisits: '/api/me/ai-companions',
    aiSetup: '/connectors',
    machineContract: '/auth.json',
  },
  boundaries: [
    'Looking around PointCast requires no account.',
    'GitHub sign-in verifies public identity with no repository or email scopes; provider tokens are not stored.',
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
