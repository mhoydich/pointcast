/**
 * PointCast Session Utilities
 * @file src/lib/auth/session.ts
 *
 * Shared session management logic for Cloudflare Pages Functions.
 * These helpers are imported by individual provider handlers.
 */

import type { User, Session, UserIdentity, UserPreferences, AuthProvider } from './types';

// ---------------------------------------------------------------------------
// ID Generation
// ---------------------------------------------------------------------------

/** Generate a short, URL-safe random ID for users. */
export function generateUserId(): string {
  return `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

/** Generate a session ID. */
export function generateSessionId(): string {
  return `sess_${crypto.randomUUID().replace(/-/g, '')}`;
}

// ---------------------------------------------------------------------------
// Session Cookie
// ---------------------------------------------------------------------------

const SESSION_COOKIE_NAME = 'pc_session';
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/** Build a Set-Cookie header value for the session. */
export function buildSessionCookie(sessionId: string): string {
  return [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].join('; ');
}

/** Build a Set-Cookie header that clears the session cookie. */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

/** Extract the session ID from a Cookie header string. */
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// KV Helpers
// ---------------------------------------------------------------------------

/** Retrieve and validate a session from KV. Returns null if not found or expired. */
export async function getSession(kv: KVNamespace, sessionId: string): Promise<Session | null> {
  const raw = await kv.get(`session:${sessionId}`);
  if (!raw) return null;
  const session: Session = JSON.parse(raw);
  if (Date.now() / 1000 > session.expiresAt) {
    await kv.delete(`session:${sessionId}`);
    return null;
  }
  return session;
}

/** Retrieve a user from KV. */
export async function getUser(kv: KVNamespace, userId: string): Promise<User | null> {
  const raw = await kv.get(`user:${userId}`);
  if (!raw) return null;
  return JSON.parse(raw) as User;
}

/** Resolve a provider identity to a userId. Returns null if not found. */
export async function resolveIdentity(
  kv: KVNamespace,
  provider: AuthProvider,
  providerId: string
): Promise<string | null> {
  return kv.get(`identity:${provider}:${providerId}`);
}

// ---------------------------------------------------------------------------
// Auth Flow Helpers
// ---------------------------------------------------------------------------

/**
 * The core "find or create user" logic.
 * Given a verified provider identity, either finds the existing user or creates a new one.
 * Returns the user and a boolean indicating if this was a new account.
 */
export async function findOrCreateUser(
  kv: KVNamespace,
  provider: AuthProvider,
  providerId: string,
  preferences?: UserPreferences
): Promise<{ user: User; isNew: boolean }> {
  // 1. Check if this identity is already linked to a user
  const existingUserId = await resolveIdentity(kv, provider, providerId);

  if (existingUserId) {
    const user = await getUser(kv, existingUserId);
    if (user) return { user, isNew: false };
  }

  // 2. Create a new user
  const userId = generateUserId();
  const now = Math.floor(Date.now() / 1000);
  const identity: UserIdentity = { provider, providerId, linkedAt: now };

  const newUser: User = {
    id: userId,
    createdAt: now,
    identities: [identity],
    preferences: preferences ?? {},
  };

  // 3. Write user and identity link to KV
  await Promise.all([
    kv.put(`user:${userId}`, JSON.stringify(newUser)),
    kv.put(`identity:${provider}:${providerId}`, userId),
  ]);

  return { user: newUser, isNew: true };
}

/**
 * Create a new session for a user and return the session ID.
 */
export async function createSession(
  kv: KVNamespace,
  userId: string,
  provider: AuthProvider
): Promise<string> {
  const sessionId = generateSessionId();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL_SECONDS;

  const session: Session = {
    id: sessionId,
    userId,
    createdAt: now,
    expiresAt,
    provider,
  };

  await kv.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });

  return sessionId;
}

/**
 * Delete all sessions and identity links for a user (GDPR delete).
 * NOTE: This is a best-effort operation; KV does not support atomic multi-key deletes.
 */
export async function deleteUser(kv: KVNamespace, userId: string): Promise<void> {
  const user = await getUser(kv, userId);
  if (!user) return;

  const deleteOps: Promise<void>[] = [
    kv.delete(`user:${userId}`),
    ...user.identities.map(i => kv.delete(`identity:${i.provider}:${i.providerId}`)),
  ];

  await Promise.all(deleteOps);
}
