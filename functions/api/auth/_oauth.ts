export const OAUTH_STATE_TTL_SECONDS = 10 * 60;

export interface OAuthStateRecord {
  nonce: string;
  returnTo: string;
  currentUserId: string | null;
  createdAt: string;
}

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

export function randomUrlSafeString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function safeReturnTo(value: string | null, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const parsed = new URL(value, 'https://pointcast.invalid');
    if (parsed.origin !== 'https://pointcast.invalid') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export async function secureEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  return crypto.subtle.timingSafeEqual(leftHash, rightHash);
}

export function appendResult(
  returnTo: string,
  key: string,
  value: string,
): string {
  const target = new URL(safeReturnTo(returnTo), 'https://pointcast.invalid');
  target.searchParams.set(key, value);
  return `${target.pathname}${target.search}${target.hash}`;
}
