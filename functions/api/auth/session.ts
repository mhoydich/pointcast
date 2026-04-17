import type {
  AuthIdentity,
  AuthSession,
  PointCastUser,
} from '../../../src/lib/auth/types';

export interface AuthEnv {
  USERS?: KVNamespace;
}

interface SessionContext {
  session: AuthSession;
  user: PointCastUser;
}

const SESSION_COOKIE_NAME = 'pc_session';
const INTERNAL_AUTH_HEADER = 'x-pointcast-internal-auth';
const USER_PREFIX = 'user:';
const IDENTITY_PREFIX = 'identity:';
const SESSION_PREFIX = 'session:';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

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

function requireUsers(env: AuthEnv): KVNamespace {
  if (!env.USERS) {
    throw new Error('kv-not-bound');
  }
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

async function readJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadUser(env: AuthEnv, userId: string): Promise<PointCastUser | null> {
  return readJson<PointCastUser>(requireUsers(env), userKey(userId));
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
  const kv = requireUsers(env);
  const session: AuthSession = {
    userId,
    sessionToken: makeSessionToken(),
    expiresAt: futureIso(ttlSeconds),
  };
  await kv.put(sessionKey(session.sessionToken), JSON.stringify(session), {
    expirationTtl: ttlSeconds,
  });
  return session;
}

export async function readSessionFromRequest(
  request: Request,
  env: AuthEnv,
): Promise<SessionContext | null> {
  const kv = env.USERS;
  if (!kv) return null;

  const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);
  if (!sessionToken) return null;

  const session = await readJson<AuthSession>(kv, sessionKey(sessionToken));
  if (!session) return null;

  if (Date.parse(session.expiresAt) <= Date.now()) {
    await kv.delete(sessionKey(sessionToken));
    return null;
  }

  const user = await loadUser(env, session.userId);
  if (!user) {
    await kv.delete(sessionKey(sessionToken));
    return null;
  }

  return { session, user };
}

export async function destroySessionFromRequest(request: Request, env: AuthEnv): Promise<void> {
  const kv = env.USERS;
  if (!kv) return;

  const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);
  if (!sessionToken) return;

  await kv.delete(sessionKey(sessionToken));
}

export async function upsertUserForIdentity(
  env: AuthEnv,
  identity: AuthIdentity,
  options?: { currentUserId?: string | null },
): Promise<PointCastUser> {
  const kv = requireUsers(env);
  const existingUserId = await kv.get(identityKey(identity.provider, identity.id));
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
  };

  await Promise.all([
    kv.put(userKey(nextUser.userId), JSON.stringify(nextUser)),
    kv.put(identityKey(identity.provider, identity.id), nextUser.userId),
  ]);

  return nextUser;
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.USERS) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }

  const current = await readSessionFromRequest(request, env);
  if (!current) {
    return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  return authJson({
    ok: true,
    session: current.session,
    user: current.user,
  });
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.USERS) {
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
