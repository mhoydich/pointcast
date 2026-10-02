import type { AuthEnv } from '../auth/session.ts';

export type NounsMoneyCollectionValue = Record<string, number>;

export function isNounsMoneyNoteId(value: unknown): value is string {
  return typeof value === 'string' && /^nm100-0\d{2}$/.test(value);
}

export function isNounsMoneyCollectionValue(value: unknown): value is NounsMoneyCollectionValue {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(value).every(([noteId, at]) => isNounsMoneyNoteId(noteId)
      && Number.isSafeInteger(at) && at > 0 && at <= 8_640_000_000_000_000);
}

export const USER_STATE_KEYS = [
  'passportStamps',
  'companion',
  'mood',
  'library',
  'quests',
  'highScores',
  'nounsMoneyCollection',
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
export const MAX_PAYLOAD_BYTES = 16 * 1024;

function stateKey(userId: string): string {
  return `${USER_STATE_PREFIX}${userId}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function byteLength(value: unknown): number {
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
  if ('nounId' in value && (typeof value.nounId !== 'number' || !Number.isInteger(value.nounId) || value.nounId < 0 || value.nounId > 1199)) return false;
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
    case 'nounsMoneyCollection':
      return isNounsMoneyCollectionValue(value);
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
    if (!isRecord(entry) || typeof entry.updatedAt !== 'number' || !Number.isFinite(entry.updatedAt) || entry.updatedAt <= 0 || !('value' in entry)) return null;
    if (!validValue(key as UserStateKey, entry.value)) return null;
    payload[key as UserStateKey] = { updatedAt: Math.floor(entry.updatedAt as number), value: entry.value };
  }
  return payload;
}

export function mergePayload(current: UserStatePayload, incoming: UserStatePayload): UserStatePayload {
  const merged: UserStatePayload = { ...current };
  for (const key of USER_STATE_KEYS) {
    const next = incoming[key];
    if (!next) continue;
    const existing = merged[key];
    if (!existing || next.updatedAt >= existing.updatedAt) merged[key] = next;
  }
  return merged;
}

export async function readState(env: AuthEnv, userId: string): Promise<{ payload: UserStatePayload; version: number } | null> {
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
        // Migration initializes an absent row only. A collect or a generic
        // profile update may have created it while the KV read was in flight;
        // that newer D1 row must win without losing any of its fields.
        await env.AUTH_DB.prepare(`
          INSERT INTO user_state (user_id, payload, version, updated_at)
          VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO NOTHING
        `).bind(userId, JSON.stringify(payload), Date.now()).run();
        const migrated = await env.AUTH_DB.prepare(
          'SELECT payload, version, updated_at FROM user_state WHERE user_id = ?',
        ).bind(userId).first<UserStateRow>();
        return migrated ? { payload: parsePayload(migrated.payload), version: migrated.version } : null;
      }
    }
    return null;
  }
  if (!env.USERS) return null;
  const legacy = await env.USERS.get(stateKey(userId));
  return legacy ? { payload: parsePayload(legacy), version: 1 } : null;
}

export async function writeState(env: AuthEnv, userId: string, payload: UserStatePayload, version: number): Promise<boolean> {
  const serialized = JSON.stringify(payload);
  if (env.AUTH_DB) {
    const result = await env.AUTH_DB.prepare(`
      INSERT INTO user_state (user_id, payload, version, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        -- The collection has its own atomic endpoint. Never replace its
        -- current value with the generic client's earlier read snapshot.
        payload = CASE WHEN json_type(user_state.payload, '$.nounsMoneyCollection') IS NOT NULL
          THEN json_set(excluded.payload, '$.nounsMoneyCollection', json_extract(user_state.payload, '$.nounsMoneyCollection'))
          ELSE json_remove(excluded.payload, '$.nounsMoneyCollection') END,
        version = user_state.version + 1,
        updated_at = excluded.updated_at
      WHERE length(CAST(CASE WHEN json_type(user_state.payload, '$.nounsMoneyCollection') IS NOT NULL
        THEN json_set(excluded.payload, '$.nounsMoneyCollection', json_extract(user_state.payload, '$.nounsMoneyCollection'))
        ELSE json_remove(excluded.payload, '$.nounsMoneyCollection') END AS BLOB)) <= ?
    `).bind(userId, serialized, version, Date.now(), MAX_PAYLOAD_BYTES).run();
    return result.meta.changes > 0;
  }
  if (!env.USERS) throw new Error('kv-not-bound');
  await env.USERS.put(stateKey(userId), serialized);
  return true;
}

