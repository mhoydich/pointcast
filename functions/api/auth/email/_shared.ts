import { randomUrlSafeString, safeReturnTo } from '../_oauth.ts';
import type { AuthEnv } from '../session.ts';

export const EMAIL_TOKEN_TTL_SECONDS = 15 * 60;
export const EMAIL_TOKEN_PREFIX = 'email-magic:';
export const EMAIL_RATE_WINDOW_SECONDS = 15 * 60;
export const EMAIL_RATE_EMAIL_LIMIT = 3;
export const EMAIL_RATE_IP_LIMIT = 10;
export const EMAIL_FROM = 'hello@pointcast.xyz';
export const EMAIL_PUBLIC_ORIGIN = 'https://pointcast.xyz';

export interface EmailAuthEnv extends AuthEnv {
  SEND_EMAIL?: SendEmail;
  PC_RATES_KV?: KVNamespace;
  POINTCAST_BROADCAST_EMAIL?: string;
}

export interface EmailMagicState {
  email: string;
  returnTo: string;
  currentUserId: string | null;
  issuedAt: string;
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return null;
  return email;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function createEmailToken(): string {
  return randomUrlSafeString(32);
}

export async function emailTokenKey(token: string): Promise<string> {
  return `${EMAIL_TOKEN_PREFIX}${await sha256Hex(token)}`;
}

export function emailReturnTo(value: unknown): string {
  return safeReturnTo(typeof value === 'string' ? value : null);
}

export async function enforceEmailRateLimit(
  env: EmailAuthEnv,
  email: string,
  ip: string,
  now = Date.now(),
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number; reason: string }> {
  const kv = env.PC_RATES_KV ?? env.USERS;
  if (!kv) return { allowed: false, retryAfterSeconds: 60, reason: 'rate-limit-not-configured' };

  const windowIndex = Math.floor(now / (EMAIL_RATE_WINDOW_SECONDS * 1000));
  const [emailHash, ipHash] = await Promise.all([
    sha256Hex(email),
    sha256Hex(ip || 'unknown'),
  ]);
  const entries = [
    { key: `rl:auth-email:email:${emailHash}:${windowIndex}`, limit: EMAIL_RATE_EMAIL_LIMIT },
    { key: `rl:auth-email:ip:${ipHash}:${windowIndex}`, limit: EMAIL_RATE_IP_LIMIT },
  ];
  const counts = await Promise.all(entries.map(async ({ key }) => {
    const raw = await kv.get(key);
    const parsed = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }));
  const blockedIndex = counts.findIndex((count, index) => count >= entries[index].limit);
  if (blockedIndex >= 0) {
    const elapsedSeconds = Math.floor((now / 1000) % EMAIL_RATE_WINDOW_SECONDS);
    return {
      allowed: false,
      retryAfterSeconds: EMAIL_RATE_WINDOW_SECONDS - elapsedSeconds,
      reason: blockedIndex === 0 ? 'email-rate-limited' : 'ip-rate-limited',
    };
  }

  await Promise.all(entries.map(({ key }, index) => kv.put(
    key,
    String(counts[index] + 1),
    { expirationTtl: EMAIL_RATE_WINDOW_SECONDS + 5 },
  )));
  return { allowed: true };
}

export function magicLink(token: string): string {
  const url = new URL('/api/auth/email/callback', EMAIL_PUBLIC_ORIGIN);
  url.searchParams.set('token', token);
  return url.toString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function magicEmail(link: string): {
  subject: string;
  text: string;
  html: string;
} {
  const safeLink = escapeHtml(link);
  return {
    subject: 'Your PointCast sign-in link',
    text: `Open this one-time link to sign in to PointCast:\n\n${link}\n\nThis link expires in 15 minutes. If you did not request it, ignore this email.`,
    html: `<p>Open this one-time link to sign in to PointCast:</p><p><a href="${safeLink}">Sign in to PointCast</a></p><p>This link expires in 15 minutes. If you did not request it, ignore this email.</p>`,
  };
}
