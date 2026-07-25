import { secureEqual } from '../auth/_oauth';

export type ShopifyEnv = Cloudflare.Env;

export interface StoredShopifyCredentials {
  shop: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  scopes: string[];
  connectedAt: string;
  connectedByUserId: string;
}

interface EncryptedValue {
  version: 1;
  iv: string;
  ciphertext: string;
}

interface ShopifyTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
  error?: string;
}

const CREDENTIALS_KEY = 'shopify:catalog:credentials:v1';
const DEFAULT_SCOPES = ['read_products'];
const TOKEN_REFRESH_SKEW_MS = 60_000;
const SHOP_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/u;

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
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function requireUsers(env: ShopifyEnv): KVNamespace {
  if (!env.USERS) throw new Error('kv-not-bound');
  return env.USERS;
}

async function encryptionKey(env: ShopifyEnv): Promise<CryptoKey> {
  const encoded = env.POINTCAST_INTEGRATION_ENCRYPTION_KEY ?? '';
  const bytes = base64UrlToBytes(encoded);
  if (bytes.byteLength !== 32) throw new Error('shopify-encryption-key-invalid');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptValue(env: ShopifyEnv, value: unknown): Promise<EncryptedValue> {
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

async function decryptValue<T>(env: ShopifyEnv, encrypted: EncryptedValue): Promise<T> {
  if (encrypted.version !== 1) throw new Error('shopify-encryption-version-unsupported');
  const key = await encryptionKey(env);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlToBytes(encrypted.iv) },
    key,
    base64UrlToBytes(encrypted.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToHex(new Uint8Array(signature));
}

export function normalizeShopDomain(value: string | null): string | null {
  if (!value) return null;
  let shop = value.trim().toLowerCase();
  shop = shop.replace(/^https?:\/\//u, '').replace(/\/+$/u, '');
  if (!shop || shop.includes('/') || shop.includes('?') || shop.includes('#')) return null;
  if (!shop.includes('.')) shop = `${shop}.myshopify.com`;
  return SHOP_PATTERN.test(shop) ? shop : null;
}

export function shopifyScopes(): string[] {
  return [...DEFAULT_SCOPES];
}

export function shopifyConfigured(env: ShopifyEnv): boolean {
  return Boolean(
    env.USERS
    && env.SHOPIFY_CLIENT_ID
    && env.SHOPIFY_CLIENT_SECRET
    && env.POINTCAST_INTEGRATION_ENCRYPTION_KEY,
  );
}

export async function signShopifyState(state: string, secret: string): Promise<string> {
  return `${state}.${await hmacHex(secret, state)}`;
}

export async function verifyShopifyState(
  signedState: string | null,
  expectedState: string,
  secret: string,
): Promise<boolean> {
  if (!signedState) return false;
  const separator = signedState.lastIndexOf('.');
  if (separator <= 0) return false;
  const state = signedState.slice(0, separator);
  const signature = signedState.slice(separator + 1);
  if (!(await secureEqual(state, expectedState))) return false;
  return secureEqual(signature, await hmacHex(secret, state));
}

export async function verifyShopifyCallbackHmac(
  url: URL,
  secret: string,
): Promise<boolean> {
  const provided = url.searchParams.get('hmac') ?? '';
  if (!/^[a-f0-9]{64}$/iu.test(provided)) return false;
  const message = Array.from(url.searchParams.entries())
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return secureEqual(provided.toLowerCase(), await hmacHex(secret, message));
}

export function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function storeShopifyCredentials(
  env: ShopifyEnv,
  credentials: StoredShopifyCredentials,
): Promise<void> {
  const encrypted = await encryptValue(env, credentials);
  await requireUsers(env).put(CREDENTIALS_KEY, JSON.stringify(encrypted));
}

export async function readShopifyCredentials(
  env: ShopifyEnv,
): Promise<StoredShopifyCredentials | null> {
  if (!shopifyConfigured(env)) return null;
  const encrypted = await env.USERS?.get<EncryptedValue>(CREDENTIALS_KEY, 'json');
  if (!encrypted) return null;
  try {
    return await decryptValue<StoredShopifyCredentials>(env, encrypted);
  } catch {
    return null;
  }
}

export async function clearShopifyConnection(env: ShopifyEnv): Promise<void> {
  await requireUsers(env).delete(CREDENTIALS_KEY);
}

async function refreshShopifyCredentials(
  env: ShopifyEnv,
  credentials: StoredShopifyCredentials,
): Promise<StoredShopifyCredentials> {
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    throw new Error('shopify-not-configured');
  }
  const response = await fetch(`https://${credentials.shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
    }),
  });
  const token: ShopifyTokenResponse = await response
    .json<ShopifyTokenResponse>()
    .catch((): ShopifyTokenResponse => ({}));
  if (!response.ok || !token.access_token || !token.refresh_token) {
    throw new Error(token.error === 'invalid_grant'
      ? 'shopify-reauthorization-required'
      : 'shopify-token-refresh-failed');
  }
  const now = Date.now();
  const refreshed: StoredShopifyCredentials = {
    ...credentials,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    accessTokenExpiresAt: now + (token.expires_in ?? 3600) * 1000,
    refreshTokenExpiresAt: now + (token.refresh_token_expires_in ?? 7_776_000) * 1000,
    scopes: token.scope
      ? token.scope.split(',').map((scope) => scope.trim()).filter(Boolean)
      : credentials.scopes,
  };
  await storeShopifyCredentials(env, refreshed);
  return refreshed;
}

export async function shopifyAccessToken(env: ShopifyEnv): Promise<string | null> {
  const credentials = await readShopifyCredentials(env);
  if (!credentials) return null;
  if (credentials.accessTokenExpiresAt > Date.now() + TOKEN_REFRESH_SKEW_MS) {
    return credentials.accessToken;
  }
  if (credentials.refreshTokenExpiresAt <= Date.now()) {
    throw new Error('shopify-reauthorization-required');
  }
  return (await refreshShopifyCredentials(env, credentials)).accessToken;
}
