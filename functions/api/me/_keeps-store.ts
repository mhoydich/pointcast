/** Keeps persistence. D1 batches are transactions; no request state is global. */
import type { AuthEnv } from '../auth/session.ts';

export const KEEPS_CAP = 300;
export const KEEPS_PREFIX = 'keeps:v1:';
export type KeepsEnv = AuthEnv & { VISITS?: KVNamespace; ME_KEEPS_D1?: string };
export type Keep = {
  id: string; itemId?: string; version?: number; kind: 'post' | 'link'; keptAt: string;
  text: string; who: string; noun: number; postId: string; postAt: string;
  source: 'bar' | 'chain' | 'web'; url: string; title: string; site: string;
  image: string; description: string; note: string;
};
export type RejectedKeep = { id: string; reason: string };
export type ImportResult = { acceptedIds: string[]; duplicateIds: string[]; rejected: RejectedKeep[] };
type KeepRow = { id: string; item_id: string; data_json: string; version: number };
type IncomingKeep = { sourceId: string; item: Keep };

export class KeepsError extends Error {
  reason: string;
  status: number;
  constructor(reason: string, status = 503) { super(reason); this.name = 'KeepsError'; this.reason = reason; this.status = status; }
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v : '').replace(/[\x00-\x1F\x7F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function https(v: unknown): string {
  if (typeof v !== 'string' || v.trim().length > 600) return '';
  const s = v.trim();
  if (/[\x00-\x20\x7F]/.test(s)) return '';
  try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password && u.toString().length <= 600 ? u.toString() : ''; } catch { return ''; }
}

export function normalizeKeep(input: unknown, now = Date.now()): Keep {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('A keep is a JSON object.');
  const b = input as Record<string, unknown>;
  const kind = b.kind === 'link' ? 'link' : b.kind === 'post' ? 'post' : null;
  if (!kind) throw new Error('kind must be post or link.');
  const url = https(b.url), postId = text(b.postId, 80), body = Array.from(text(b.text, 1200)).slice(0, 280).join('');
  if (kind === 'link' && !url) throw new Error('A kept link needs a valid https URL of at most 600 characters.');
  if (kind === 'post' && !postId) throw new Error('A kept post needs its postId.');
  if (kind === 'post' && !body) throw new Error('A kept post needs its text.');
  const noun = Number(b.noun), keptAt = Date.parse(text(b.keptAt, 40)), postAt = Date.parse(text(b.postAt, 40));
  return {
    id: kind === 'post' ? `post:${postId}` : `link:${url}`, kind,
    keptAt: new Date(Number.isFinite(keptAt) && keptAt <= now ? keptAt : now).toISOString(),
    text: body, who: text(b.who, 40), noun: Number.isInteger(noun) && noun >= 0 && noun <= 1199 ? noun : 0,
    postId, postAt: Number.isFinite(postAt) ? new Date(postAt).toISOString() : '',
    source: b.source === 'chain' ? 'chain' : b.source === 'bar' ? 'bar' : 'web', url,
    title: text(b.title, 160), site: text(b.site, 60), image: https(b.image),
    description: text(b.description, 240), note: text(b.note, 140),
  };
}

export async function hasKeepsMigration(env: KeepsEnv, userId: string): Promise<boolean> {
  if (!env.AUTH_DB) return false;
  try {
    return Boolean(await env.AUTH_DB.prepare('SELECT user_id FROM me_keeps_migrations WHERE user_id = ?').bind(userId).first());
  } catch (error) {
    // The safe legacy code may deploy before the schema. Connection failures
    // never authorize fallback writes, because this account may be migrated.
    if (env.ME_KEEPS_D1 !== '1' && /no such table: me_keeps_migrations/i.test(String(error))) return false;
    throw error;
  }
}

export async function readLegacyKeeps(env: KeepsEnv, userId: string): Promise<Keep[]> {
  if (!env.VISITS) throw new KeepsError('unavailable');
  const stored = await env.VISITS.get<{ items: Keep[] }>(KEEPS_PREFIX + userId, 'json');
  if (!stored) return [];
  if (!Array.isArray(stored.items)) throw new KeepsError('invalid-legacy-shelf');
  return stored.items;
}

/**
 * Requires a staged pause/drain before enabling '1': code cannot prove a KV
 * snapshot is current while old deployments still write it. Row inserts and
 * the permanent marker commit together. Each insert checks the marker too,
 * so an older concurrent migration cannot resurrect a subsequently deleted
 * keep. Migrated users never return to the old KV writer, even if flag is off.
 */
export async function ensureKeepsMigrated(env: KeepsEnv, userId: string): Promise<D1Database> {
  const db = env.AUTH_DB;
  if (!db) throw new KeepsError('unavailable');
  if (await hasKeepsMigration(env, userId)) return db;
  if (env.ME_KEEPS_D1 !== '1') throw new KeepsError(env.ME_KEEPS_D1 === 'pause' ? 'writes-paused' : 'keeps-not-enabled');
  const legacy = await readLegacyKeeps(env, userId);
  if (legacy.length > KEEPS_CAP) throw new KeepsError('legacy-shelf-over-cap');
  const items = new Map<string, Keep>();
  for (const raw of legacy) {
    let item: Keep;
    try { item = normalizeKeep(raw); } catch { throw new KeepsError('invalid-legacy-shelf'); }
    if (typeof raw.id !== 'string' || !raw.id || raw.id.length > 700) throw new KeepsError('invalid-legacy-shelf');
    item.id = raw.id; // Freeze legacy aliases, independent of URL normalization.
    if (!items.has(item.id)) items.set(item.id, item);
  }
  const now = new Date().toISOString();
  const rows = [...items.values()].map((item) => ({ itemId: crypto.randomUUID(), data: item }));
  await db.batch([db.prepare(`
    INSERT OR IGNORE INTO me_keeps(user_id, id, item_id, data_json, created_at, updated_at)
    SELECT ?, json_extract(value, '$.data.id'), json_extract(value, '$.itemId'),
      json_extract(value, '$.data'), json_extract(value, '$.data.keptAt'), ?
    FROM json_each(?) WHERE NOT EXISTS (SELECT 1 FROM me_keeps_migrations WHERE user_id = ?)
  `).bind(userId, now, JSON.stringify(rows), userId),
  db.prepare('INSERT OR IGNORE INTO me_keeps_migrations(user_id, migrated_at, source_count) VALUES (?, ?, ?)').bind(userId, now, legacy.length)]);
  return db;
}

export async function listD1Keeps(db: D1Database, userId: string): Promise<Keep[]> {
  const result = await db.prepare('SELECT id, item_id, data_json, version FROM me_keeps WHERE user_id = ? ORDER BY created_at DESC, id').bind(userId).all<KeepRow>();
  return result.results.map((row) => ({ ...JSON.parse(row.data_json), id: row.id, itemId: row.item_id, version: row.version }));
}

function sourceId(raw: unknown, index: number): string {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const b = raw as Record<string, unknown>;
    if (typeof b.id === 'string' && b.id.length <= 700) return b.id;
    if (b.kind === 'post' && typeof b.postId === 'string') return `post:${b.postId}`;
    if (b.kind === 'link' && typeof b.url === 'string' && b.url.length <= 600) return `link:${b.url}`;
  }
  return `item:${index}`;
}

export function prepareKeepImport(body: Record<string, unknown>): { incoming: IncomingKeep[]; result: ImportResult; v2: boolean } {
  const v2 = body.importProtocol === 2;
  if ('importProtocol' in body && !v2) throw new KeepsError('unsupported-import-protocol', 400);
  if ('items' in body && !Array.isArray(body.items)) throw new KeepsError('invalid-items', 400);
  const raw = Array.isArray(body.items) ? body.items : [body.item ?? body];
  if (raw.length > (v2 ? 100 : KEEPS_CAP)) throw new KeepsError('import-batch-too-large', 400);
  const result: ImportResult = { acceptedIds: [], duplicateIds: [], rejected: [] };
  const incoming: IncomingKeep[] = [];
  raw.forEach((value, index) => {
    const id = sourceId(value, index);
    try { incoming.push({ sourceId: id, item: normalizeKeep(value) }); }
    catch {
      if (!v2) throw new KeepsError('invalid-keep', 400);
      result.rejected.push({ id, reason: 'invalid-keep' });
    }
  });
  return { incoming, result, v2 };
}

export async function importD1Keeps(db: D1Database, userId: string, body: Record<string, unknown>): Promise<ImportResult> {
  const { incoming, result, v2 } = prepareKeepImport(body);
  if (!incoming.length) return result;
  const now = new Date().toISOString();
  const unique = new Map<string, Keep>();
  for (const { item } of incoming) if (!unique.has(item.id)) unique.set(item.id, item);
  const rows = [...unique.values()].map((item) => ({ itemId: crypto.randomUUID(), data: item }));
  // A JSON-bound table keeps 300-item imports well below D1's invocation query
  // limit. LIMIT and the cap trigger are evaluated in this same transaction.
  const writes = [db.prepare(`
    INSERT OR IGNORE INTO me_keeps(user_id, id, item_id, data_json, created_at, updated_at)
    SELECT ?, json_extract(source.value, '$.data.id'), json_extract(source.value, '$.itemId'),
      json_extract(source.value, '$.data'), json_extract(source.value, '$.data.keptAt'), ?
    FROM json_each(?) AS source
    WHERE NOT EXISTS (SELECT 1 FROM me_keeps WHERE user_id = ? AND id = json_extract(source.value, '$.data.id'))
    ORDER BY CAST(source.key AS INTEGER)
    ${v2 ? 'LIMIT (SELECT max(0, 300 - count(*)) FROM me_keeps WHERE user_id = ?)' : ''}
    RETURNING id
  `).bind(userId, now, JSON.stringify(rows), userId, ...(v2 ? [userId] : []))];
  // Acknowledgments come from the same transaction, before a subsequent delete.
  writes.push(db.prepare('SELECT id FROM me_keeps WHERE user_id = ?').bind(userId));
  let outcomes: D1Result<{ id: string }>[];
  try { outcomes = await db.batch<{ id: string }>(writes); }
  catch (error) {
    if (String(error).includes('me-keeps-cap')) throw new KeepsError('limit-reached', 409);
    throw error;
  }
  const acknowledged = new Set(outcomes.at(-1)!.results.map((row) => row.id));
  const inserted = new Set(outcomes[0].results.map((row) => row.id));
  const seen = new Set<string>();
  incoming.forEach(({ sourceId, item }) => {
    if (acknowledged.has(item.id)) {
      result.acceptedIds.push(sourceId);
      if (!inserted.has(item.id) || seen.has(item.id)) result.duplicateIds.push(sourceId);
      seen.add(item.id);
    } else result.rejected.push({ id: sourceId, reason: 'limit-reached' });
  });
  return result;
}

export async function importLegacyKeeps(env: KeepsEnv, userId: string, current: Keep[], body: Record<string, unknown>): Promise<ImportResult> {
  const { incoming, result, v2 } = prepareKeepImport(body);
  const items = new Map(current.map((item) => [item.id, item]));
  for (const { item, sourceId } of incoming) {
    if (items.has(item.id)) { result.acceptedIds.push(sourceId); result.duplicateIds.push(sourceId); }
    else if (items.size >= KEEPS_CAP) {
      if (!v2) throw new KeepsError('limit-reached', 409);
      result.rejected.push({ id: sourceId, reason: 'limit-reached' });
    } else { items.set(item.id, item); result.acceptedIds.push(sourceId); }
  }
  if (incoming.length) await env.VISITS!.put(KEEPS_PREFIX + userId, JSON.stringify({ items: [...items.values()].sort((a, b) => b.keptAt.localeCompare(a.keptAt)), updatedAt: new Date().toISOString() }));
  return result;
}

export async function editD1Keep(db: D1Database, userId: string, body: Record<string, unknown>): Promise<void> {
  if (typeof body.id !== 'string' || !body.id || body.id.length > 700 || !Number.isInteger(body.version) || Number(body.version) < 1) throw new KeepsError('invalid-edit', 400);
  if (!('title' in body) && !('note' in body)) throw new KeepsError('invalid-edit', 400);
  if (('title' in body && typeof body.title !== 'string') || ('note' in body && typeof body.note !== 'string')) throw new KeepsError('invalid-edit', 400);
  const row = await db.prepare('SELECT data_json, item_id, version FROM me_keeps WHERE user_id = ? AND id = ?').bind(userId, body.id).first<KeepRow>();
  if (!row) throw new KeepsError('not-found', 404);
  if (row.version !== body.version) throw new KeepsError('conflict', 409);
  if ('expectedItemId' in body && body.expectedItemId !== row.item_id) throw new KeepsError('conflict', 409);
  const item: Keep = JSON.parse(row.data_json);
  if ('title' in body) item.title = text(body.title, 160);
  if ('note' in body) item.note = text(body.note, 140);
  const result = await db.prepare('UPDATE me_keeps SET data_json = ?, updated_at = ?, version = version + 1 WHERE user_id = ? AND id = ? AND item_id = ? AND version = ?')
    .bind(JSON.stringify(item), new Date().toISOString(), userId, body.id, row.item_id, body.version).run();
  if (!result.meta.changes) throw new KeepsError('conflict', 409);
}
