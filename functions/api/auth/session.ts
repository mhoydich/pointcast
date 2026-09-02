import type {
  AuthIdentity,
  AuthRole,
  AuthSession,
  PointCastUser,
} from '../../../src/lib/auth/types';

export interface AuthEnv {
  AUTH_DB?: D1Database;
  USERS?: KVNamespace;
}

interface SessionContext {
  session: AuthSession;
  user: PointCastUser;
}

interface UserRow {
  payload: string;
}

interface IdentityRow {
  user_id: string;
}

interface SessionRow {
  token: string;
  user_id: string;
  expires_at: number;
}

interface AuthStateRow {
  payload: string;
  expires_at: number;
}

const SESSION_COOKIE_NAME = 'pc_session';
const INTERNAL_AUTH_HEADER = 'x-pointcast-internal-auth';
const USER_PREFIX = 'user:';
const IDENTITY_PREFIX = 'identity:';
const SESSION_PREFIX = 'session:';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_REFRESH_WINDOW_SECONDS = 60 * 60 * 24 * 7;

export class IdentityConflictError extends Error {
  constructor(message = 'identity-already-linked') {
    super(message);
    this.name = 'IdentityConflictError';
  }
}

export function authJson(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      ...(init?.headers ?? {}),
    },
  });
}

export function hasAuthStorage(env: AuthEnv): boolean {
  return Boolean(env.AUTH_DB || env.USERS);
}

function requireUsers(env: AuthEnv): KVNamespace {
  if (!env.USERS) throw new Error('kv-not-bound');
  return env.USERS;
}

function nowIso(): string {
  return new Date().toISOString();
}

function futureIso(ttlSeconds: number): string {
  return new Date(Date.now() + ttlSeconds * 1000).toISOString();
}

function makeUserId(): string {
  return `pcu_${crypto.randomUUID().replaceAll('-', '')}`;
}

function makeSessionToken(): string {
  return `pcs_${crypto.randomUUID().replaceAll('-', '')}`;
}

function userKey(userId: string): string {
  return `${USER_PREFIX}${userId}`;
}

function identityKey(provider: AuthIdentity['provider'], id: string): string {
  return `${IDENTITY_PREFIX}${provider}:${id}`;
}

function sessionKey(sessionToken: string): string {
  return `${SESSION_PREFIX}${sessionToken}`;
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const match = cookieHeader.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

function parseStoredValue<T>(raw: string | null): T | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

async function readKvValue<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return parseStoredValue<T>(await kv.get(key));
}

async function readKvUser(kv: KVNamespace, key: string): Promise<PointCastUser | null> {
  const raw = await kv.get(key);
  return raw === null ? null : parseUser(raw);
}

function parseUser(raw: string): PointCastUser | null {
  try {
    return JSON.parse(raw) as PointCastUser;
  } catch {
    return null;
  }
}

function parseAuthState<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function cleanupStatements(db: D1Database, now = Date.now()): D1PreparedStatement[] {
  return [
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now),
    db.prepare('DELETE FROM oauth_states WHERE expires_at <= ?').bind(now),
  ];
}

async function writeUserToD1(db: D1Database, user: PointCastUser): Promise<void> {
  const statements = [
    ...cleanupStatements(db),
    db.prepare(`
      INSERT INTO users (id, payload, created_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET payload = excluded.payload
    `).bind(user.userId, JSON.stringify(user), user.createdAt),
    ...user.identities.map((identity) => db.prepare(`
      INSERT INTO identities (provider, id, user_id, payload)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(provider, id) DO UPDATE SET
        user_id = excluded.user_id,
        payload = excluded.payload
    `).bind(identity.provider, identity.id, user.userId, JSON.stringify(identity))),
  ];
  await db.batch(statements);
}

async function loadUser(env: AuthEnv, userId: string): Promise<PointCastUser | null> {
  if (env.AUTH_DB) {
    const row = await env.AUTH_DB.prepare('SELECT payload FROM users WHERE id = ?')
      .bind(userId)
      .first<UserRow>();
    if (row) return parseUser(row.payload);

    // Existing KV accounts migrate lazily. This is needed by session
    // read-through so a cutover does not strand the session's user record.
    if (env.USERS) {
      const legacyUser = await readKvUser(env.USERS, userKey(userId));
      if (legacyUser) {
        await writeUserToD1(env.AUTH_DB, legacyUser);
        return legacyUser;
      }
    }
    return null;
  }

  return readKvUser(requireUsers(env), userKey(userId));
}

export async function loadUserById(env: AuthEnv, userId: string): Promise<PointCastUser | null> {
  return loadUser(env, userId);
}

async function loadIdentityUserId(
  env: AuthEnv,
  provider: AuthIdentity['provider'],
  id: string,
): Promise<string | null> {
  if (env.AUTH_DB) {
    const row = await env.AUTH_DB.prepare(
      'SELECT user_id FROM identities WHERE provider = ? AND id = ?',
    ).bind(provider, id).first<IdentityRow>();
    if (row) return row.user_id;

    // Preserve returning users whose old cookie has expired: migrate the KV
    // identity mapping and its user before treating the login as a new account.
    if (env.USERS) {
      const legacyUserId = await env.USERS.get(identityKey(provider, id));
      if (legacyUserId) {
        const legacyUser = await loadUser(env, legacyUserId);
        if (legacyUser) return legacyUser.userId;
      }
    }
    return null;
  }

  return requireUsers(env).get(identityKey(provider, id));
}

async function writeSessionToD1(db: D1Database, session: AuthSession): Promise<void> {
  const expiresAt = Date.parse(session.expiresAt);
  await db.batch([
    ...cleanupStatements(db),
    db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        user_id = excluded.user_id,
        expires_at = excluded.expires_at
    `).bind(session.sessionToken, session.userId, expiresAt),
  ]);
}

export async function deleteSession(env: AuthEnv, sessionToken: string): Promise<void> {
  if (env.AUTH_DB) {
    await env.AUTH_DB.prepare('DELETE FROM sessions WHERE token = ?').bind(sessionToken).run();
    // A lazily migrated session can still have its original KV record. Remove
    // it only when it exists so D1 logout/rotation cannot resurrect via KV.
    if (env.USERS && await env.USERS.get(sessionKey(sessionToken))) {
      await env.USERS.delete(sessionKey(sessionToken));
    }
    return;
  }
  if (env.USERS) await env.USERS.delete(sessionKey(sessionToken));
}

export async function writeAuthState<T>(
  env: AuthEnv,
  state: string,
  payload: T,
  ttlSeconds: number,
): Promise<void> {
  if (env.AUTH_DB) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    await env.AUTH_DB.batch([
      ...cleanupStatements(env.AUTH_DB),
      env.AUTH_DB.prepare(`
        INSERT INTO oauth_states (state, payload, expires_at)
        VALUES (?, ?, ?)
        ON CONFLICT(state) DO UPDATE SET
          payload = excluded.payload,
          expires_at = excluded.expires_at
      `).bind(state, JSON.stringify(payload), expiresAt),
    ]);
    return;
  }

  await requireUsers(env).put(state, JSON.stringify(payload), { expirationTtl: ttlSeconds });
}

export async function readAuthState<T>(env: AuthEnv, state: string): Promise<T | null> {
  if (env.AUTH_DB) {
    const row = await env.AUTH_DB.prepare(
      'SELECT payload, expires_at FROM oauth_states WHERE state = ?',
    ).bind(state).first<AuthStateRow>();
    if (row) {
      if (row.expires_at <= Date.now()) {
        await env.AUTH_DB.prepare('DELETE FROM oauth_states WHERE state = ?').bind(state).run();
        return null;
      }
      return parseAuthState<T>(row.payload);
    }

    // Allows an OAuth flow started immediately before the D1 deploy to finish.
    if (env.USERS) return readKvValue<T>(env.USERS, state);
    return null;
  }

  return readKvValue<T>(requireUsers(env), state);
}

export async function consumeAuthState<T>(env: AuthEnv, state: string): Promise<T | null> {
  if (env.AUTH_DB) {
    const row = await env.AUTH_DB.prepare(`
      DELETE FROM oauth_states
      WHERE state = ?
      RETURNING payload, expires_at
    `).bind(state).first<AuthStateRow>();
    if (row) return row.expires_at > Date.now() ? parseAuthState<T>(row.payload) : null;

    // Consume legacy KV state once when it was issued before cutover.
    if (env.USERS) {
      const legacy = await readKvValue<T>(env.USERS, state);
      if (legacy !== null) await env.USERS.delete(state);
      return legacy;
    }
    return null;
  }

  const kv = requireUsers(env);
  const value = await readKvValue<T>(kv, state);
  if (value !== null) await kv.delete(state);
  return value;
}

function mergeIdentity(identities: AuthIdentity[], incoming: AuthIdentity): AuthIdentity[] {
  const next = identities.filter((identity) => !(identity.provider === incoming.provider && identity.id === incoming.id));
  next.push(incoming);
  return next;
}

function shortName(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function sessionCookie(session: AuthSession): string {
  const expiresAt = Date.parse(session.expiresAt);
  const maxAge = Number.isFinite(expiresAt)
    ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    : SESSION_TTL_SECONDS;
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(session.sessionToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearedSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function withSessionCookie(response: Response, session: AuthSession): Response {
  const headers = new Headers(response.headers);
  headers.set('Set-Cookie', sessionCookie(session));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function issueSession(
  env: AuthEnv,
  userId: string,
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<AuthSession> {
  const session: AuthSession = {
    userId,
    sessionToken: makeSessionToken(),
    expiresAt: futureIso(ttlSeconds),
  };

  if (env.AUTH_DB) {
    await writeSessionToD1(env.AUTH_DB, session);
  } else {
    await requireUsers(env).put(sessionKey(session.sessionToken), JSON.stringify(session), {
      expirationTtl: ttlSeconds,
    });
  }
  return session;
}

export async function readSessionFromRequest(
  request: Request,
  env: AuthEnv,
): Promise<SessionContext | null> {
  if (!hasAuthStorage(env)) return null;

  const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);
  if (!sessionToken) return null;

  let session: AuthSession | null = null;
  if (env.AUTH_DB) {
    const row = await env.AUTH_DB.prepare(
      'SELECT token, user_id, expires_at FROM sessions WHERE token = ?',
    ).bind(sessionToken).first<SessionRow>();
    if (row) {
      session = {
        userId: row.user_id,
        sessionToken: row.token,
        expiresAt: new Date(row.expires_at).toISOString(),
      };
    } else if (env.USERS) {
      const legacySession = await readKvValue<AuthSession>(env.USERS, sessionKey(sessionToken));
      if (legacySession && Date.parse(legacySession.expiresAt) > Date.now()) {
        // Load/migrate the user first to satisfy the sessions foreign key,
        // then copy the legacy session into D1 and continue this request.
        const legacyUser = await loadUser(env, legacySession.userId);
        if (legacyUser) {
          await writeSessionToD1(env.AUTH_DB, legacySession);
          return { session: legacySession, user: legacyUser };
        }
      }
      return null;
    }
  } else {
    session = await readKvValue<AuthSession>(requireUsers(env), sessionKey(sessionToken));
  }

  if (!session) return null;
  if (Date.parse(session.expiresAt) <= Date.now()) {
    await deleteSession(env, sessionToken);
    return null;
  }

  const user = await loadUser(env, session.userId);
  if (!user) {
    await deleteSession(env, sessionToken);
    return null;
  }

  return { session, user };
}

export async function destroySessionFromRequest(request: Request, env: AuthEnv): Promise<void> {
  const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);
  if (sessionToken) await deleteSession(env, sessionToken);
}

export async function upsertUserForIdentity(
  env: AuthEnv,
  identity: AuthIdentity,
  options?: {
    currentUserId?: string | null;
    roles?: AuthRole[];
  },
): Promise<PointCastUser> {
  if (!hasAuthStorage(env)) throw new Error('kv-not-bound');

  const existingUserId = await loadIdentityUserId(env, identity.provider, identity.id);
  const currentUserId = options?.currentUserId ?? null;

  if (currentUserId && existingUserId && existingUserId !== currentUserId) {
    throw new IdentityConflictError();
  }

  const targetUserId = currentUserId ?? existingUserId ?? makeUserId();
  const currentUser = currentUserId ? await loadUser(env, currentUserId) : null;
  const mappedUser = existingUserId ? await loadUser(env, existingUserId) : null;
  const baseUser = currentUser ?? mappedUser;

  const nextUser: PointCastUser = {
    userId: targetUserId,
    createdAt: baseUser?.createdAt ?? nowIso(),
    identities: mergeIdentity(baseUser?.identities ?? [], identity),
    preferredName: baseUser?.preferredName || identity.name || shortName(identity.id),
    roles: Array.from(new Set([
      ...(baseUser?.roles ?? []),
      ...(options?.roles ?? []),
    ])),
  };

  if (env.AUTH_DB) {
    await writeUserToD1(env.AUTH_DB, nextUser);
  } else {
    const kv = requireUsers(env);
    await Promise.all([
      kv.put(userKey(nextUser.userId), JSON.stringify(nextUser)),
      kv.put(identityKey(identity.provider, identity.id), nextUser.userId),
    ]);
  }

  return nextUser;
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }

  const current = await readSessionFromRequest(request, env);
  if (!current) {
    return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const body = {
    ok: true,
    session: current.session,
    user: current.user,
  };

  // Keep active PointCast members signed in without weakening the 30-day
  // inactivity boundary. A site visit during the final seven days rotates the
  // opaque cookie and storage record; a long-absent browser must sign again.
  const remainingSeconds = Math.floor((Date.parse(current.session.expiresAt) - Date.now()) / 1000);
  if (remainingSeconds > SESSION_REFRESH_WINDOW_SECONDS) return authJson(body);

  const renewed = await issueSession(env, current.user.userId);
  await deleteSession(env, current.session.sessionToken);
  return withSessionCookie(
    authJson({ ...body, session: renewed, renewed: true }),
    renewed,
  );
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }

  if (request.headers.get(INTERNAL_AUTH_HEADER) !== '1') {
    return authJson({ ok: false, reason: 'internal-only' }, { status: 403 });
  }

  let body: { userId?: unknown; ttlSeconds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const userId = typeof body.userId === 'string' ? body.userId : '';
  if (!userId) {
    return authJson({ ok: false, reason: 'missing-user-id' }, { status: 400 });
  }

  const user = await loadUser(env, userId);
  if (!user) {
    return authJson({ ok: false, reason: 'user-not-found' }, { status: 404 });
  }

  const ttlSeconds = typeof body.ttlSeconds === 'number' && Number.isFinite(body.ttlSeconds)
    ? Math.max(60, Math.floor(body.ttlSeconds))
    : SESSION_TTL_SECONDS;
  const session = await issueSession(env, userId, ttlSeconds);
  return withSessionCookie(
    authJson({
      ok: true,
      session,
      user,
    }),
    session,
  );
};

export const onRequestDelete: PagesFunction<AuthEnv> = async ({ request, env }) => {
  await destroySessionFromRequest(request, env);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'Set-Cookie': clearedSessionCookie(),
    },
  });
};
