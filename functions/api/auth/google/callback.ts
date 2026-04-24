/**
 * GET /api/auth/google/callback
 *
 * OAuth 2.0 authorization-code callback. Validates the state cookie
 * planted by /api/auth/google/start, exchanges the auth code for tokens,
 * fetches the Google profile, and issues a PointCast session cookie.
 *
 * Session shape (cookie `pc_session`, JSON-encoded base64 since we don't
 * have a JWT signing key wired yet — v0 is opaque + short-lived):
 *   { sub, email, name, picture, iat, exp }
 *
 * v0 limitations:
 *   - Session cookie is unsigned (NOT a JWT). Anyone with browser access
 *     could mint one. Treat as identity hint only, NOT auth credential.
 *     v1 ships JWT signing once GOOGLE_SESSION_SECRET is wired.
 *   - No refresh token storage; access token discarded after profile fetch.
 *   - No KV-backed session store yet.
 *
 * Per super-sprint directive 2026-04-21 ~00:35 PT: "and yah, the google
 * auth, try something with tezos."
 */

interface Env {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

interface UserInfo {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

function htmlError(message: string, status = 400): Response {
  const safe = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Auth error</title><body style="font-family:Georgia,serif;padding:48px;max-width:600px;color:#12110E"><h1 style="color:#8A2432">Auth error</h1><p>${safe}</p><p><a href="/">← back to PointCast</a></p></body>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie') || '';
  const parts = raw.split(';').map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(name + '=')) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

function decodeState(b64: string): { s: string; n: string } | null {
  try {
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (padded.length % 4)) % 4);
    const json = atob(padded + padding);
    const obj = JSON.parse(json);
    if (obj && typeof obj.s === 'string') return { s: obj.s, n: typeof obj.n === 'string' ? obj.n : '/' };
    return null;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const env = ctx.env || ({} as Env);
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI || 'https://pointcast.xyz/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    return htmlError(
      'Google OAuth not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing). See functions/api/auth/google/start.ts header.',
      503,
    );
  }

  const url = new URL(ctx.request.url);
  const code = url.searchParams.get('code');
  const stateB64 = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) return htmlError(`Google returned an error: ${errorParam}`, 400);
  if (!code || !stateB64) return htmlError('Missing code or state. Restart from /api/auth/google/start.', 400);

  // Validate state
  const stateCookie = readCookie(ctx.request, 'pc_oauth_state');
  const decoded = decodeState(stateB64);
  if (!stateCookie || !decoded || decoded.s !== stateCookie) {
    return htmlError('CSRF state mismatch. Restart from /api/auth/google/start.', 400);
  }
  const next = decoded.n && decoded.n.startsWith('/') ? decoded.n : '/cos';

  // Exchange code for tokens
  let token: TokenResponse;
  try {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      const txt = await res.text();
      return htmlError(`Google token exchange failed (${res.status}): ${txt.slice(0, 200)}`, 502);
    }
    token = (await res.json()) as TokenResponse;
  } catch (err: any) {
    return htmlError(`Network error exchanging code: ${err && err.message ? err.message : String(err)}`, 502);
  }

  if (!token.access_token) {
    return htmlError('Google token response missing access_token.', 502);
  }

  // Fetch profile
  let profile: UserInfo = {};
  try {
    const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (res.ok) profile = (await res.json()) as UserInfo;
  } catch {
    /* profile is best-effort */
  }

  // Build session
  const now = Math.floor(Date.now() / 1000);
  const session = {
    sub: profile.sub || '',
    email: profile.email || '',
    name: profile.name || '',
    picture: profile.picture || '',
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
    provider: 'google',
    v: 1,
  };
  const sessionB64 = btoa(JSON.stringify(session))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sessionCookie = [
    `pc_session=${sessionB64}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=2592000',
  ].join('; ');

  // Clear the state cookie
  const clearStateCookie = 'pc_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

  const headers = new Headers();
  headers.append('Location', next);
  headers.append('Set-Cookie', sessionCookie);
  headers.append('Set-Cookie', clearStateCookie);
  headers.set('Cache-Control', 'no-store');

  return new Response(null, { status: 302, headers });
};
