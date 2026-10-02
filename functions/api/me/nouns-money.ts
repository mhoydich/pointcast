import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { isNounsMoneyNoteId, isNounsMoneyCollectionValue, readState, type NounsMoneyCollectionValue } from './_state.ts';
export { isNounsMoneyNoteId, isNounsMoneyCollectionValue } from './_state.ts';
export type { NounsMoneyCollectionValue } from './_state.ts';

export const NOUNS_MONEY_COLLECTION_SCHEMA = 'pointcast.nouns-money.collection/v1';
export const NOUNS_MONEY_COLLECTION_SLOT = 'nounsMoneyCollection';
const SLOT_PATH = '$.nounsMoneyCollection';
const MAX_BODY_BYTES = 256;
const MAX_STATE_BYTES = 16 * 1024;

export interface NounsMoneyCollectionResponse {
  ok: true;
  schema: typeof NOUNS_MONEY_COLLECTION_SCHEMA;
  userId: string;
  storage: 'account';
  noteIds: string[];
  collectedAt: Record<string, string>;
  updatedAt: string | null;
  changed?: boolean;
}
interface StateRow { payload: string; version: number; updated_at: number; }

const unavailable = () => authJson({ ok: false, reason: 'nouns-money-collection-unavailable' }, { status: 503 });
const failure = (reason: string, status: number) => authJson({ ok: false, reason }, { status });

function collection(row: StateRow | null, userId: string, changed?: boolean): NounsMoneyCollectionResponse {
  const entry = row ? JSON.parse(row.payload)[NOUNS_MONEY_COLLECTION_SLOT] : undefined;
  if (entry && (!Number.isSafeInteger(entry.updatedAt) || entry.updatedAt <= 0
    || entry.updatedAt > 8_640_000_000_000_000 || !isNounsMoneyCollectionValue(entry.value))) {
    throw new Error('invalid-stored-collection');
  }
  const value: NounsMoneyCollectionValue = entry?.value ?? {};
  const noteIds = Object.keys(value).sort();
  return {
    ok: true, schema: NOUNS_MONEY_COLLECTION_SCHEMA, userId, storage: 'account', noteIds,
    collectedAt: Object.fromEntries(noteIds.map((noteId) => [noteId, new Date(value[noteId]).toISOString()])),
    updatedAt: entry ? new Date(entry.updatedAt).toISOString() : null,
    ...(changed === undefined ? {} : { changed }),
  };
}

async function readCollection(db: D1Database, userId: string, changed?: boolean): Promise<NounsMoneyCollectionResponse> {
  const row = await db.prepare('SELECT payload, version, updated_at FROM user_state WHERE user_id = ?')
    .bind(userId).first<StateRow>();
  return collection(row, userId, changed);
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB) return unavailable();
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return failure('unauthorized', 401);
    await readState(env, current.user.userId);
    return authJson(await readCollection(env.AUTH_DB, current.user.userId));
  } catch { return unavailable(); }
};

async function readNoteId(request: Request): Promise<string | Response> {
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    return failure('json-required', 415);
  }
  const reader = request.body?.getReader();
  const bytes = new Uint8Array(MAX_BODY_BYTES);
  let size = 0;
  if (reader) {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (size + chunk.value.byteLength > MAX_BODY_BYTES) {
        await reader.cancel();
        return failure('body-too-large', 413);
      }
      bytes.set(chunk.value, size);
      size += chunk.value.byteLength;
    }
  }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, size))); }
  catch { return failure('bad-body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).length !== 1 || !('noteId' in body) || !isNounsMoneyNoteId(body.noteId)) {
    return failure('invalid-note-id', 400);
  }
  return body.noteId;
}

async function mutate(request: Request, env: AuthEnv, remove: boolean): Promise<Response> {
  if (request.headers.get('origin') !== new URL(request.url).origin) return failure('origin-not-allowed', 403);
  if (!env.AUTH_DB) return unavailable();
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return failure('unauthorized', 401);
    // This identifies the account the UI displayed. It is a consistency
    // guard, never an authentication credential: the signed session is final.
    if (request.headers.get('X-PointCast-User') !== current.user.userId) return failure('account-changed', 409);
    const noteId = await readNoteId(request);
    if (noteId instanceof Response) return noteId;
    const userId = current.user.userId;
    await readState(env, userId);
    const now = Date.now();
    const notePath = `${SLOT_PATH}.value."${noteId}"`;
    let row: StateRow | null;
    if (remove) {
      // A single statement removes only this note and preserves every other
      // profile field, even when another tab is updating the same account.
      row = await env.AUTH_DB.prepare(`
        UPDATE user_state SET
          payload = json_set(json_remove(payload, ?), '$.nounsMoneyCollection.updatedAt', ?),
          version = version + 1, updated_at = ?
        WHERE user_id = ? AND json_extract(payload, ?) IS NOT NULL
        RETURNING payload, version, updated_at
      `).bind(notePath, now, now, userId, notePath).first<StateRow>();
    } else {
      const initial = JSON.stringify({ [NOUNS_MONEY_COLLECTION_SLOT]: { updatedAt: now, value: { [noteId]: now } } });
      row = await env.AUTH_DB.prepare(`
        INSERT INTO user_state (user_id, payload, version, updated_at) VALUES (?, ?, 1, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          payload = json_set(user_state.payload, '$.nounsMoneyCollection.updatedAt', ?, ?, ?),
          version = user_state.version + 1, updated_at = excluded.updated_at
        WHERE json_extract(user_state.payload, ?) IS NULL
          AND length(CAST(json_set(user_state.payload, '$.nounsMoneyCollection.updatedAt', ?, ?, ?) AS BLOB)) <= ?
        RETURNING payload, version, updated_at
      `).bind(userId, initial, now, now, notePath, now, notePath, now, notePath, now, MAX_STATE_BYTES).first<StateRow>();
    }
    if (row) return authJson(collection(row, userId, true));
    const stored = await env.AUTH_DB.prepare('SELECT payload, version, updated_at FROM user_state WHERE user_id = ?')
      .bind(userId).first<StateRow>();
    const saved = collection(stored, userId, false);
    if (!remove && !saved.noteIds.includes(noteId)) {
      const capacity = await env.AUTH_DB.prepare(`
        SELECT length(CAST(json_set(payload, '$.nounsMoneyCollection.updatedAt', ?, ?, ?) AS BLOB)) AS bytes
        FROM user_state WHERE user_id = ?
      `).bind(now, notePath, now, userId).first<{ bytes: number }>();
      if (capacity && capacity.bytes > MAX_STATE_BYTES) return failure('payload-too-large', 413);
      return failure('collection-write-conflict', 409);
    }
    return authJson(saved);
  } catch { return unavailable(); }
}

export const onRequestPost: PagesFunction<AuthEnv> = ({ request, env }) => mutate(request, env, false);
export const onRequestDelete: PagesFunction<AuthEnv> = ({ request, env }) => mutate(request, env, true);
