import { NOW_PLAYING } from '../../../src/data/now-playing';

export type SpotifyBroadcastEnv = Cloudflare.Env;

export interface PublicNowPlaying {
  blockId: string;
  channel: string;
  provider: 'Spotify';
  trackId: string;
  title: string;
  artist: string;
  url: string;
  embedUrl: string;
  image: string | null;
  status: 'playing' | 'paused' | 'off-air' | 'editorial';
  updatedAt: string;
  source: string;
  live: boolean;
  mode: 'spotify-live' | 'editorial';
}

export interface StoredSpotifyCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface EncryptedValue {
  version: 1;
  iv: string;
  ciphertext: string;
}

interface CachedSignal {
  fetchedAt: number;
  record: PublicNowPlaying;
}

interface SpotifyTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
}

interface SpotifyCurrentlyPlaying {
  is_playing?: boolean;
  item?: {
    id?: string;
    name?: string;
    type?: string;
    external_urls?: { spotify?: string };
    artists?: Array<{ name?: string }>;
    album?: {
      images?: Array<{ url?: string; height?: number; width?: number }>;
    };
    show?: {
      publisher?: string;
      images?: Array<{ url?: string; height?: number; width?: number }>;
    };
  } | null;
}

const CREDENTIALS_KEY = 'spotify:broadcast:credentials:v1';
const SIGNAL_KEY = 'spotify:broadcast:signal:v1';
const SIGNAL_FRESH_MS = 60_000;
const TOKEN_REFRESH_SKEW_MS = 60_000;
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CURRENT_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey(env: SpotifyBroadcastEnv): Promise<CryptoKey> {
  const encoded = env.SPOTIFY_TOKEN_ENCRYPTION_KEY ?? '';
  const bytes = base64UrlToBytes(encoded);
  if (bytes.byteLength !== 32) throw new Error('spotify-encryption-key-invalid');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptValue(
  env: SpotifyBroadcastEnv,
  value: unknown,
): Promise<EncryptedValue> {
  const key = await encryptionKey(env);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return {
    version: 1,
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
  };
}

async function decryptValue<T>(
  env: SpotifyBroadcastEnv,
  encrypted: EncryptedValue,
): Promise<T> {
  if (encrypted.version !== 1) throw new Error('spotify-encryption-version-unsupported');
  const key = await encryptionKey(env);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlToBytes(encrypted.iv) },
    key,
    base64UrlToBytes(encrypted.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

function editorialFallback(): PublicNowPlaying {
  return {
    ...NOW_PLAYING,
    image: NOW_PLAYING.image || null,
    status: 'editorial',
    live: false,
    mode: 'editorial',
  };
}

function requireUsers(env: SpotifyBroadcastEnv): KVNamespace {
  if (!env.USERS) throw new Error('kv-not-bound');
  return env.USERS;
}

function providerAuth(env: SpotifyBroadcastEnv): string {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    throw new Error('spotify-not-configured');
  }
  return btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
}

async function readCredentials(
  env: SpotifyBroadcastEnv,
): Promise<StoredSpotifyCredentials | null> {
  if (!env.USERS || !env.SPOTIFY_TOKEN_ENCRYPTION_KEY) return null;
  const encrypted = await env.USERS.get<EncryptedValue>(CREDENTIALS_KEY, 'json');
  if (!encrypted) return null;
  try {
    return await decryptValue<StoredSpotifyCredentials>(env, encrypted);
  } catch {
    return null;
  }
}

export async function hasSpotifyCredentials(env: SpotifyBroadcastEnv): Promise<boolean> {
  if (!env.USERS) return false;
  return Boolean(await env.USERS.get(CREDENTIALS_KEY));
}

export async function storeSpotifyCredentials(
  env: SpotifyBroadcastEnv,
  credentials: StoredSpotifyCredentials,
): Promise<void> {
  const encrypted = await encryptValue(env, credentials);
  await requireUsers(env).put(CREDENTIALS_KEY, JSON.stringify(encrypted));
}

async function refreshSpotifyAccessToken(
  env: SpotifyBroadcastEnv,
  credentials: StoredSpotifyCredentials,
): Promise<StoredSpotifyCredentials> {
  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${providerAuth(env)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
    }),
  });
  const token = await response.json() as SpotifyTokenResponse;
  if (!response.ok || !token.access_token) {
    throw new Error(token.error === 'invalid_grant'
      ? 'spotify-reauthorization-required'
      : 'spotify-token-refresh-failed');
  }

  const nextCredentials: StoredSpotifyCredentials = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token || credentials.refreshToken,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
  };
  await storeSpotifyCredentials(env, nextCredentials);
  return nextCredentials;
}

async function userAccessToken(
  env: SpotifyBroadcastEnv,
  forceRefresh = false,
): Promise<string | null> {
  const credentials = await readCredentials(env);
  if (!credentials) return null;
  if (!forceRefresh && credentials.accessToken
    && credentials.expiresAt > Date.now() + TOKEN_REFRESH_SKEW_MS) {
    return credentials.accessToken;
  }
  return (await refreshSpotifyAccessToken(env, credentials)).accessToken;
}

async function fetchCurrentlyPlaying(
  env: SpotifyBroadcastEnv,
): Promise<Response | null> {
  let token = await userAccessToken(env);
  if (!token) return null;

  let response = await fetch(SPOTIFY_CURRENT_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status !== 401) return response;

  token = await userAccessToken(env, true);
  if (!token) return null;
  response = await fetch(SPOTIFY_CURRENT_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
}

function bestImage(
  images: Array<{ url?: string; height?: number; width?: number }> | undefined,
): string | null {
  if (!images?.length) return null;
  return images.find((image) => (image.height ?? 0) >= 300)?.url
    ?? images[0]?.url
    ?? null;
}

function publicRecord(payload: SpotifyCurrentlyPlaying): PublicNowPlaying | null {
  const item = payload.item;
  const trackId = item?.id?.trim() ?? '';
  const title = item?.name?.trim() ?? '';
  const spotifyUrl = item?.external_urls?.spotify ?? '';
  if (!trackId || !title || !spotifyUrl.startsWith('https://open.spotify.com/')) return null;

  const artists = item?.artists
    ?.map((artist) => artist.name?.trim())
    .filter((name): name is string => Boolean(name))
    .join(', ');
  const artist = artists
    || item?.show?.publisher?.trim()
    || 'Spotify';
  const images = item?.album?.images ?? item?.show?.images;
  return {
    blockId: NOW_PLAYING.blockId,
    channel: 'SPN',
    provider: 'Spotify',
    trackId,
    title,
    artist,
    url: spotifyUrl,
    embedUrl: spotifyUrl.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/')
      + '?utm_source=pointcast',
    image: bestImage(images),
    status: payload.is_playing ? 'playing' : 'paused',
    updatedAt: new Date().toISOString(),
    source: 'Live Spotify signal authorized by the PointCast broadcaster.',
    live: Boolean(payload.is_playing),
    mode: 'spotify-live',
  };
}

async function cachedSignal(env: SpotifyBroadcastEnv): Promise<CachedSignal | null> {
  if (!env.USERS) return null;
  return env.USERS.get<CachedSignal>(SIGNAL_KEY, 'json');
}

async function storeSignal(
  env: SpotifyBroadcastEnv,
  record: PublicNowPlaying,
): Promise<void> {
  if (!env.USERS) return;
  const value: CachedSignal = { fetchedAt: Date.now(), record };
  await env.USERS.put(SIGNAL_KEY, JSON.stringify(value), { expirationTtl: 24 * 60 * 60 });
}

export async function resolveNowPlaying(
  env: SpotifyBroadcastEnv,
  options?: { force?: boolean },
): Promise<PublicNowPlaying> {
  const fallback = editorialFallback();
  const cached = await cachedSignal(env).catch(() => null);
  if (!options?.force && cached && Date.now() - cached.fetchedAt < SIGNAL_FRESH_MS) {
    return cached.record;
  }
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET
    || !env.SPOTIFY_TOKEN_ENCRYPTION_KEY) {
    return cached?.record ?? fallback;
  }

  try {
    const response = await fetchCurrentlyPlaying(env);
    if (!response) return cached?.record ?? fallback;
    if (response.status === 204) {
      const offAir: PublicNowPlaying = {
        ...(cached?.record ?? fallback),
        status: 'off-air',
        live: false,
        updatedAt: new Date().toISOString(),
      };
      await storeSignal(env, offAir).catch(() => undefined);
      return offAir;
    }
    if (!response.ok) return cached?.record ?? fallback;

    const record = publicRecord(await response.json() as SpotifyCurrentlyPlaying);
    if (!record) return cached?.record ?? fallback;
    await storeSignal(env, record).catch(() => undefined);
    return record;
  } catch {
    return cached?.record ?? fallback;
  }
}

export async function clearSpotifyBroadcast(env: SpotifyBroadcastEnv): Promise<void> {
  const kv = requireUsers(env);
  await Promise.all([
    kv.delete(CREDENTIALS_KEY),
    kv.delete(SIGNAL_KEY),
  ]);
}
