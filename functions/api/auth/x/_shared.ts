import type { AuthIdentity, PointCastUser } from '../../../../src/lib/auth/types';
import { appendResult, safeReturnTo } from '../_oauth.ts';
import { IdentityConflictError } from '../session.ts';

export const X_STATE_PREFIX = 'oauth-state:x:';
export const X_STATE_COOKIE = '__Host-pc_x_oauth';
export const X_SCOPES = 'tweet.read users.read';
export const X_CALLBACK_PATH = '/api/auth/x/callback';

export interface XStateRecord {
  browserToken: string;
  codeVerifier: string;
  returnTo: string;
  origin: string;
  intent: 'login' | 'link';
  currentUserId: string | null;
  sessionToken: string | null;
  createdAt: string;
}

export function xConfigured(env: Cloudflare.Env): boolean {
  return Boolean(env.AUTH_DB && env.X_CLIENT_ID?.trim() && env.X_CLIENT_SECRET?.trim());
}

export async function xReady(env: Cloudflare.Env): Promise<boolean> {
  if (!xConfigured(env)) return false;
  try {
    return Boolean(await env.AUTH_DB.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'identities_one_x_per_user_idx'").first());
  } catch { return false; }
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  return btoa(String.fromCharCode(...digest)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export function xBrowserToken(request: Request): string {
  const value = (request.headers.get('cookie') ?? '').split(';')
    .map((part) => part.trim()).find((part) => part.startsWith(`${X_STATE_COOKIE}=`));
  return value?.slice(X_STATE_COOKIE.length + 1) ?? '';
}

export function xCookie(value: string, maxAge = 600): string {
  return `${X_STATE_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function xRedirect(request: Request, returnTo: string, key: string, value: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(appendResult(safeReturnTo(returnTo), key, value), request.url).toString(),
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'Set-Cookie': xCookie('', 0),
    },
  });
}

export function xIdentity(value: unknown): AuthIdentity | null {
  if (!value || typeof value !== 'object') return null;
  const data = (value as { data?: Record<string, unknown> }).data;
  if (!data || typeof data.id !== 'string' || !/^\d{1,25}$/u.test(data.id)
    || typeof data.username !== 'string' || !/^[a-zA-Z0-9_]{1,15}$/u.test(data.username)) return null;
  let avatar: string | undefined;
  if (typeof data.profile_image_url === 'string') {
    try {
      const parsed = new URL(data.profile_image_url);
      if (parsed.protocol === 'https:' && parsed.hostname === 'pbs.twimg.com') avatar = parsed.href;
    } catch { /* An invalid avatar never invalidates the verified account. */ }
  }
  return {
    provider: 'x',
    id: data.id,
    username: data.username,
    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim().slice(0, 100) : `@${data.username}`,
    ...(avatar ? { avatar } : {}),
    verifiedAt: new Date().toISOString(),
  };
}

export class XAccountLinkedError extends Error {
  constructor() { super('x-account-already-linked'); }
}

// X uses D1 exclusively: KV cannot atomically claim an identity. The guarded
// identity upsert and user JSON merge share one D1 transaction. A competing
// owner causes a NOT NULL violation, rolling the whole transaction back.
export async function saveXIdentity(
  db: D1Database,
  identity: AuthIdentity,
  currentUserId: string | null,
): Promise<PointCastUser> {
  const mapped = await db.prepare("SELECT user_id FROM identities WHERE provider = 'x' AND id = ?")
    .bind(identity.id).first<{ user_id: string }>();
  if (currentUserId && mapped && mapped.user_id !== currentUserId) throw new IdentityConflictError();
  const userId = currentUserId ?? mapped?.user_id ?? `pcu_${crypto.randomUUID().replaceAll('-', '')}`;
  const row = await db.prepare('SELECT payload FROM users WHERE id = ?').bind(userId).first<{ payload: string }>();
  if (currentUserId && !row) throw new Error('x-user-missing');
  const otherX = await db.prepare("SELECT id FROM identities WHERE provider = 'x' AND user_id = ? AND id != ?")
    .bind(userId, identity.id).first<{ id: string }>();
  if (otherX) throw new XAccountLinkedError();
  const user: PointCastUser = row ? JSON.parse(row.payload) : {
    userId, createdAt: new Date().toISOString(), identities: [], preferredName: identity.name, roles: [],
  };
  const statements: D1PreparedStatement[] = [];
  if (!row) statements.push(db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)')
    .bind(userId, JSON.stringify(user), user.createdAt));
  statements.push(
    db.prepare(`INSERT INTO identities (provider, id, user_id, payload)
      VALUES ('x', ?, ?, ?)
      ON CONFLICT(provider, id) DO UPDATE SET payload = CASE
        WHEN identities.user_id = excluded.user_id THEN excluded.payload ELSE NULL END`)
      .bind(identity.id, userId, JSON.stringify(identity)),
    db.prepare(`UPDATE users SET payload = json_set(payload, '$.identities',
      json_insert(COALESCE((SELECT json_group_array(json(value))
        FROM json_each(users.payload, '$.identities')
        WHERE json_extract(value, '$.provider') != 'x'), '[]'), '$[#]', json(?)))
      WHERE id = ?`).bind(JSON.stringify(identity), userId),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    const owner = await db.prepare("SELECT user_id FROM identities WHERE provider = 'x' AND id = ?")
      .bind(identity.id).first<{ user_id: string }>();
    if (owner && owner.user_id !== userId) throw new IdentityConflictError();
    const linked = await db.prepare("SELECT id FROM identities WHERE provider = 'x' AND user_id = ? AND id != ?")
      .bind(userId, identity.id).first<{ id: string }>();
    if (linked) throw new XAccountLinkedError();
    throw error;
  }
  const saved = await db.prepare('SELECT payload FROM users WHERE id = ?').bind(userId).first<{ payload: string }>();
  if (!saved) throw new Error('x-user-missing');
  return JSON.parse(saved.payload) as PointCastUser;
}

export async function removeXIdentity(db: D1Database, userId: string, id: string): Promise<boolean> {
  const results = await db.batch([
    db.prepare(`UPDATE users SET payload = json_set(payload, '$.identities',
      json(COALESCE((SELECT json_group_array(json(value)) FROM json_each(users.payload, '$.identities')
        WHERE NOT (json_extract(value, '$.provider') = 'x' AND json_extract(value, '$.id') = ?)), '[]')))
      WHERE id = ?
        AND EXISTS (SELECT 1 FROM identities WHERE user_id = ? AND provider = 'x' AND id = ?)
        AND EXISTS (SELECT 1 FROM identities WHERE user_id = ? AND provider != 'x')`)
      .bind(id, userId, userId, id, userId),
    db.prepare(`DELETE FROM identities WHERE provider = 'x' AND id = ? AND user_id = ?
      AND EXISTS (SELECT 1 FROM identities WHERE user_id = ? AND provider != 'x')`)
      .bind(id, userId, userId),
  ]);
  return (results[1]?.meta.changes ?? 0) === 1;
}
