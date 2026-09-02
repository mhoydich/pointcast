import {
  authJson,
  hasAuthStorage,
  readSessionFromRequest,
  type AuthEnv,
} from '../auth/session.ts';

export const USER_STATE_KEYS = [
  'passportStamps',
  'companion',
  'mood',
  'library',
  'quests',
  'highScores',
] as const;

export type UserStateKey = typeof USER_STATE_KEYS[number];
export type UserStateEntry = { updatedAt: number; value: unknown };
export type UserStatePayload = Partial<Record<UserStateKey, UserStateEntry>>;

interface UserStateRow {
  payload: string;
  version: number;
  updated_at: number;
}

const USER_STATE_PREFIX = 'user-state:';
const MAX_PAYLOAD_BYTES = 16 * 1024;

function stateKey(userId: string): string {
  return `${USER_STATE_PREFIX}${userId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function parsePayload(raw: string | null | undefined): UserStatePayload {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return normalizePayload(value) ?? {};
  } catch {
    return {};
  }
}

function validCompanion(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if ('nounId' in value && (!Number.isInteger(value.nounId) || value.nounId < 0 || value.nounId > 1199)) return false;
  if ('name' in value && typeof value.name !== 'string') return false;
  if ('mood' in value && typeof value.mood !== 'string') return false;
  return !('care' in value) || Array.isArray(value.care) || isRecord(value.care);
}

function validValue(key: UserStateKey, value: unknown): boolean {
  switch (key) {
    case 'passportStamps':
    case 'quests':
    case 'highScores':
      return isRecord(value);
    case 'companion':
      return validCompanion(value);
    case 'mood':
      return typeof value === 'string' && value.length <= 64;
    case 'library':
      return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length <= 512);
  }
}

export function normalizePayload(value: unknown): UserStatePayload | null {
  if (!isRecord(value)) return null;
  const payload: UserStatePayload = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!(USER_STATE_KEYS as readonly string[]).includes(key)) return null;
    if (!isRecord(entry) || !Number.isFinite(entry.updatedAt) || entry.updatedAt <= 0 || !('value' in entry)) return null;
    if (!validValue(key as UserStateKey, entry.value)) return null;
    payload[key as UserStateKey] = { updatedAt: Math.floor(entry.updatedAt as number), value: entry.value };
  }
  return payload;
}

function mergePayload(current: UserStatePayload, incoming: UserStatePayload): UserStatePayload {
  const merged: UserStatePayload = { ...current };
  for (const key of USER_STATE_KEYS) {
    const next = incoming[key];
    if (!next) continue;
    const existing = merged[key];
    if (!existing || next.updatedAt >= existing.updatedAt) merged[key] = next;
  }
  return merged;
}

async function readState(env: AuthEnv, userId: string): Promise<{ payload: UserStatePayload; version: number } | null> {
  if (env.AUTH_DB) {
    const row = await env.AUTH_DB.prepare(
      'SELECT payload, version, updated_at FROM user_state WHERE user_id = ?',
    ).bind(userId).first<UserStateRow>();
    if (row) return { payload: parsePayload(row.payload), version: row.version };

    // Match auth's D1-first migration behavior so preview/KV accounts retain
    // their state during the cutover without a dual-write penalty.
    if (env.USERS) {
      const legacy = await env.USERS.get(stateKey(userId));
      if (legacy) {
        const payload = parsePayload(legacy);
        await writeState(env, userId, payload, 1);
        return { payload, version: 1 };
      }
    }
    return null;
  }
  if (!env.USERS) return null;
  const legacy = await env.USERS.get(stateKey(userId));
  return legacy ? { payload: parsePayload(legacy), version: 1 } : null;
}

async function writeState(env: AuthEnv, userId: string, payload: UserStatePayload, version: number): Promise<void> {
  const serialized = JSON.stringify(payload);
  if (env.AUTH_DB) {
    await env.AUTH_DB.prepare(`
      INSERT INTO user_state (user_id, payload, version, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        payload = excluded.payload,
        version = excluded.version,
        updated_at = excluded.updated_at
    `).bind(userId, serialized, version, Date.now()).run();
    return;
  }
  if (!env.USERS) throw new Error('kv-not-bound');
  await env.USERS.put(stateKey(userId), serialized);
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  const state = await readState(env, current.user.userId);
  return authJson({ ok: true, payload: state?.payload ?? {}, version: state?.version ?? 0 });
};

export const onRequestPut: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });

  let body: { payload?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const incoming = normalizePayload(body.payload);
  if (!incoming) return authJson({ ok: false, reason: 'invalid-payload' }, { status: 400 });

  const existing = await readState(env, current.user.userId);
  const payload = mergePayload(existing?.payload ?? {}, incoming);
  if (byteLength(payload) > MAX_PAYLOAD_BYTES) {
    return authJson({ ok: false, reason: 'payload-too-large', maxBytes: MAX_PAYLOAD_BYTES }, { status: 413 });
  }
  const version = (existing?.version ?? 0) + 1;
  await writeState(env, current.user.userId, payload, version);
  return authJson({ ok: true, payload, version });
};
