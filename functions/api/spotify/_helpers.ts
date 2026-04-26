/**
 * Spotify shared helpers — Client Credentials Flow.
 *
 * Server-side only. Trades SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET (set
 * as Cloudflare Pages env vars) for an app token via the accounts API,
 * caches it in the VISITS KV with a 50-minute TTL (Spotify tokens are
 * valid 1h), and exposes a fetch wrapper that auto-refreshes on 401.
 *
 * If the env vars aren't set, getSpotifyToken() returns null. Endpoints
 * should treat null as "Spotify not configured" and return 503 with a
 * clear shape so the v3 page can hide search UI gracefully.
 */

export interface SpotifyEnv {
  VISITS?: KVNamespace;
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
}

const TOKEN_KEY = 'spotify:app-token';
const TOKEN_TTL_SECONDS = 50 * 60; // refresh well before Spotify's 60min expiry

interface CachedToken {
  token: string;
  expiresAt: number;
}

export async function getSpotifyToken(env: SpotifyEnv): Promise<string | null> {
  const id = env.SPOTIFY_CLIENT_ID;
  const secret = env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (env.VISITS) {
    const cached = await env.VISITS.get(TOKEN_KEY, 'json') as CachedToken | null;
    if (cached?.token && cached.expiresAt > Date.now() + 30_000) {
      return cached.token;
    }
  }

  const auth = btoa(`${id}:${secret}`);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  const cached: CachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  if (env.VISITS) {
    try {
      await env.VISITS.put(TOKEN_KEY, JSON.stringify(cached), {
        expirationTtl: TOKEN_TTL_SECONDS,
      });
    } catch { /* non-fatal */ }
  }
  return cached.token;
}

export async function spotifyFetch(
  env: SpotifyEnv,
  path: string,
  init?: RequestInit,
): Promise<Response | null> {
  const token = await getSpotifyToken(env);
  if (!token) return null;
  const url = path.startsWith('http')
    ? path
    : `https://api.spotify.com/v1${path.startsWith('/') ? path : '/' + path}`;
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      'Authorization': `Bearer ${token}`,
    },
  });
}

export const SPOTIFY_JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export function spotifyError(
  code: string,
  status: number,
  message?: string,
): Response {
  return new Response(
    JSON.stringify({ ok: false, error: code, message: message ?? code }),
    {
      status,
      headers: SPOTIFY_JSON_HEADERS,
    },
  );
}
