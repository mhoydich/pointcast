import type { OAuthStateRecord } from '../auth/_oauth.ts';
import type { SpotifyBroadcastEnv, StoredSpotifyCredentials } from './_broadcast.ts';

export interface SpotifyOAuthStateRecord extends OAuthStateRecord {
  personal?: boolean;
}

export interface PersonalSpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  imageUrl: string | null;
  spotifyUrl: string;
  isPlaying: boolean;
  progressMs: number | null;
  durationMs: number | null;
}

export interface PersonalSpotifyStatus {
  configured: boolean;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'reconnect_required' | 'not_seated' | 'unavailable';
  track: PersonalSpotifyTrack | null;
  checkedAt: string;
}

interface EncryptedCredentials {
  version: 1;
  iv: string;
  ciphertext: string;
}

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const CURRENT_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

function credentialsKey(userId: string): string {
  if (!userId) throw new Error('spotify-owner-required');
  return `spotify:personal:credentials:v1:${userId}`;
}

function base64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function bytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')), (char) => char.charCodeAt(0));
}

async function encryptionKey(env: SpotifyBroadcastEnv): Promise<CryptoKey> {
  const key = bytes(env.SPOTIFY_TOKEN_ENCRYPTION_KEY ?? '');
  if (key.byteLength !== 32) throw new Error('spotify-encryption-key-invalid');
  return crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function validCredentials(value: unknown): value is StoredSpotifyCredentials {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredSpotifyCredentials>;
  return typeof candidate.accessToken === 'string' && candidate.accessToken.length > 0
    && typeof candidate.refreshToken === 'string' && candidate.refreshToken.length > 0
    && typeof candidate.expiresAt === 'number' && Number.isFinite(candidate.expiresAt) && candidate.expiresAt > 0;
}

export function personalSpotifyConfigured(env: SpotifyBroadcastEnv): boolean {
  return Boolean(env.USERS && env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET && env.SPOTIFY_TOKEN_ENCRYPTION_KEY);
}

export async function storePersonalSpotifyCredentials(
  env: SpotifyBroadcastEnv,
  userId: string,
  credentials: StoredSpotifyCredentials,
): Promise<void> {
  if (!env.USERS || !validCredentials(credentials)) throw new Error('spotify-storage-unavailable');
  const key = credentialsKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // Same AES-GCM/key pattern as the broadcaster, with the owner authenticated too.
  // Moving ciphertext to another user's key must never grant that user access.
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(key) },
    await encryptionKey(env),
    new TextEncoder().encode(JSON.stringify(credentials)),
  );
  const record: EncryptedCredentials = { version: 1, iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext)) };
  await env.USERS.put(key, JSON.stringify(record));
}

async function readCredentials(env: SpotifyBroadcastEnv, userId: string): Promise<StoredSpotifyCredentials | null> {
  const key = credentialsKey(userId);
  const encrypted = await env.USERS!.get<EncryptedCredentials>(key, 'json');
  if (!encrypted) return null;
  if (encrypted.version !== 1) throw new Error('spotify-reauthorization-required');
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes(encrypted.iv), additionalData: new TextEncoder().encode(key) },
      await encryptionKey(env),
      bytes(encrypted.ciphertext),
    );
    const credentials: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    if (!validCredentials(credentials)) throw new Error('spotify-reauthorization-required');
    return credentials;
  } catch {
    throw new Error('spotify-reauthorization-required');
  }
}

// Provider responses are small; cap them so an unexpected upstream response
// cannot make this private status endpoint buffer an unbounded body.
async function providerJson(response: Response): Promise<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('spotify-invalid-response');
  let size = 0;
  let text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 64 * 1024) {
        await reader.cancel();
        throw new Error('spotify-invalid-response');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    const result: unknown = JSON.parse(text + decoder.decode());
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('spotify-invalid-response');
    return result as Record<string, unknown>;
  } finally {
    reader.releaseLock();
  }
}

async function refreshCredentials(
  env: SpotifyBroadcastEnv,
  userId: string,
  credentials: StoredSpotifyCredentials,
): Promise<StoredSpotifyCredentials> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: credentials.refreshToken }),
  });
  const token = await providerJson(response);
  if (!response.ok || typeof token.access_token !== 'string' || !token.access_token) {
    throw new Error(token.error === 'invalid_grant' ? 'spotify-reauthorization-required' : 'spotify-refresh-unavailable');
  }
  if (typeof token.expires_in !== 'number' || !Number.isSafeInteger(token.expires_in) || token.expires_in <= 0) {
    throw new Error('spotify-invalid-response');
  }
  const next = {
    accessToken: token.access_token,
    refreshToken: typeof token.refresh_token === 'string' && token.refresh_token ? token.refresh_token : credentials.refreshToken,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
  // Avoid overwriting a newer connection or a disconnect observed while the
  // provider request was in flight. KV propagation is still eventually consistent.
  const latest = await readCredentials(env, userId);
  if (!latest || latest.accessToken !== credentials.accessToken
    || latest.refreshToken !== credentials.refreshToken || latest.expiresAt !== credentials.expiresAt) {
    throw new Error('spotify-connection-changed');
  }
  await storePersonalSpotifyCredentials(env, userId, next);
  return next;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function label(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 512) : '';
}

function milliseconds(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function trackMetadata(payload: Record<string, unknown>): PersonalSpotifyTrack | null {
  const item = record(payload.item);
  if (item.type !== 'track' || typeof item.id !== 'string' || !/^[A-Za-z0-9]{22}$/u.test(item.id) || !label(item.name)) return null;
  const album = record(item.album);
  const image = Array.isArray(album.images) ? record(album.images[0]).url : null;
  let imageUrl: string | null = null;
  try {
    const url = new URL(typeof image === 'string' ? image : '');
    if (url.protocol === 'https:' && !url.username && !url.password && url.hostname.endsWith('.scdn.co')) imageUrl = url.toString();
  } catch { /* Missing artwork is allowed. */ }
  return {
    id: item.id,
    title: label(item.name),
    artist: Array.isArray(item.artists) ? item.artists.slice(0, 12).map((artist) => label(record(artist).name)).filter(Boolean).join(', ') : '',
    album: label(album.name),
    imageUrl,
    spotifyUrl: `https://open.spotify.com/track/${item.id}`,
    isPlaying: payload.is_playing === true,
    progressMs: milliseconds(payload.progress_ms),
    durationMs: milliseconds(item.duration_ms),
  };
}

export async function resolvePersonalSpotify(env: SpotifyBroadcastEnv, userId: string): Promise<PersonalSpotifyStatus> {
  const result = (status: PersonalSpotifyStatus['status'], track: PersonalSpotifyTrack | null = null): PersonalSpotifyStatus => ({
    configured: personalSpotifyConfigured(env), connected: status === 'connected', status, track, checkedAt: new Date().toISOString(),
  });
  if (!personalSpotifyConfigured(env)) return result('unavailable');
  let credentials: StoredSpotifyCredentials | null;
  try {
    credentials = await readCredentials(env, userId);
  } catch (error) {
    return result(error instanceof Error && error.message === 'spotify-reauthorization-required' ? 'reconnect_required' : 'unavailable');
  }
  if (!credentials) return result('disconnected');
  try {
    let refreshed = false;
    if (credentials.expiresAt <= Date.now() + 60_000) {
      credentials = await refreshCredentials(env, userId, credentials);
      refreshed = true;
    }
    const current = (token: string) => fetch(CURRENT_ENDPOINT, {
      signal: AbortSignal.timeout(8000), headers: { Authorization: `Bearer ${token}` },
    });
    let response = await current(credentials.accessToken);
    if (response.status === 401 && !refreshed) {
      await response.body?.cancel();
      credentials = await refreshCredentials(env, userId, credentials);
      response = await current(credentials.accessToken);
    }
    if (response.status === 204) return result('connected');
    if (!response.ok) {
      await response.body?.cancel();
      // 403 after a valid sign-in is Spotify's development-mode allowlist: this app may seat five
      // accounts, named by hand. Signing in again cannot fix it, so do not ask the person to.
      return result(response.status === 403 ? 'not_seated' : response.status === 401 ? 'reconnect_required' : 'unavailable');
    }
    return result('connected', trackMetadata(await providerJson(response)));
  } catch (error) {
    return result(error instanceof Error && error.message === 'spotify-reauthorization-required' ? 'reconnect_required' : 'unavailable');
  }
}

export async function clearPersonalSpotify(env: SpotifyBroadcastEnv, userId: string): Promise<void> {
  if (!env.USERS) throw new Error('spotify-storage-unavailable');
  await env.USERS.delete(credentialsKey(userId));
}
