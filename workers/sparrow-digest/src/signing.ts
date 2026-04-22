/**
 * sparrow-digest · signing.ts — v0.34 HMAC unsubscribe tokens
 *
 * Shape: <email>.<expires_at>.<hex-hmac>
 *   · email         — URL-encoded email string
 *   · expires_at    — unix seconds (integer)
 *   · hex-hmac      — lowercase hex HMAC-SHA256 over `${email}.${expires_at}`
 *
 * Signing key rotation: the worker + the Pages Function share the
 * same SPARROW_DIGEST_SIGNING_KEY env var. Rotating invalidates all
 * outstanding tokens; subscribers still get new tokens on the next
 * digest send. Acceptable trade-off for a recovery path.
 *
 * TTL: 30 days. An email from 4 weeks ago still unsubscribes cleanly.
 *
 * Zero dependencies — uses the Web Crypto API which is present in
 * both Cloudflare Workers and Cloudflare Pages Functions runtimes.
 */

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Encode an ArrayBuffer to lowercase hex. */
function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/** Constant-time string comparison. Critical for HMAC verification. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function importKey(secret: string): Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bufferToHex(sig);
}

/**
 * Produce an unsubscribe token for the given email.
 * `ttlSeconds` defaults to 30 days.
 */
export async function signUnsubToken(
  email: string,
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const msg = `${normalized}.${expiresAt}`;
  const sig = await hmac(secret, msg);
  return `${encodeURIComponent(normalized)}.${expiresAt}.${sig}`;
}

export interface VerifyResult {
  ok: boolean;
  email?: string;
  expiresAt?: number;
  reason?: 'malformed' | 'expired' | 'bad-hmac' | 'missing-secret';
}

/**
 * Verify an unsubscribe token. On success returns the decoded email +
 * expiry; on failure returns a reason the caller can surface.
 */
export async function verifyUnsubToken(
  token: string,
  secret: string,
  now: number = Math.floor(Date.now() / 1000),
): Promise<VerifyResult> {
  if (!secret) return { ok: false, reason: 'missing-secret' };
  if (typeof token !== 'string') return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [encodedEmail, expiresStr, providedHmac] = parts;
  let email: string;
  try {
    email = decodeURIComponent(encodedEmail).toLowerCase();
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    return { ok: false, reason: 'malformed' };
  }
  if (expiresAt < now) {
    return { ok: false, reason: 'expired', email, expiresAt };
  }
  if (!/^[0-9a-f]{64}$/i.test(providedHmac)) {
    return { ok: false, reason: 'malformed' };
  }
  const expected = await hmac(secret, `${email}.${expiresAt}`);
  if (!timingSafeEqual(expected, providedHmac.toLowerCase())) {
    return { ok: false, reason: 'bad-hmac' };
  }
  return { ok: true, email, expiresAt };
}

/**
 * Build an unsubscribe URL suitable for an email footer, given the
 * origin, the subscriber's email, and the signing secret.
 */
export async function buildUnsubUrl(
  origin: string,
  email: string,
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string> {
  const token = await signUnsubToken(email, secret, ttlSeconds);
  return `${origin}/api/sparrow/digest-subscribe?unsub_token=${encodeURIComponent(token)}`;
}
