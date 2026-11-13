/**
 * Loom stores. The service (service.mjs) never touches storage directly; it
 * asks a store, and every write is one of two moves:
 *
 *   appendOps(key, init, ops, now, { title, sender })   add ops to one log
 *   pushList(name, entry, { keyField, cap })            update the directory or an outbox
 *
 * Every guard the service checks before writing (does the parent exist, does
 * the edit token match, is this a poll) is about an append op, and append ops
 * never change once written, so read → check → append is safe as long as the
 * append itself is atomic.
 *
 *   d1Store   one row per op in D1 (migrations/auth/0035_loom.sql). An append
 *             is one INSERT that takes the next seq for its log inside the
 *             statement, so two people appending at once both land, in order.
 *             The directory and outboxes are queries over the rows, so there
 *             is no second copy to drift.
 *   kvStore   the v1 layout in Workers KV (prefix `loom:`): one value per log,
 *             rewritten on every append, so two writes to one log in the same
 *             second can race and the later wins. Kept as the fallback and as
 *             the archive D1 imports from.
 *   layered   D1 first, KV underneath: a thread that only exists in KV is read
 *             from KV and imported whole on its first new write. Until the
 *             migration is applied, every call falls through to KV, so this
 *             code can ship before the table exists.
 *
 * List names: `index` (the directory) · `out:<addressKey of sender>` (an outbox).
 */
import { addressKey } from './address.mjs';
import { MAX_OPS, excerpt, stampOps, upsertFront } from './log.mjs';

const MAX_INDEX = 300;
const MAX_OUTBOX = 200;

async function readJson(kv, key, fallback) {
  try { const raw = await kv.get(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
const writeJson = (kv, key, value) => kv.put(key, JSON.stringify(value));

/** v1 storage: one KV value per log, per list. */
export function kvStore(kv) {
  return {
    kind: 'kv',
    getLog: (key) => readJson(kv, `loom:log:${key}`, null),
    async appendOps(key, init, ops, now, options = {}) {
      const log = (await readJson(kv, `loom:log:${key}`, null)) ?? structuredClone(init);
      const stamped = stampOps(log, ops, now, options);
      await writeJson(kv, `loom:log:${key}`, log);
      return { log, ops: stamped };
    },
    getList: (name) => readJson(kv, `loom:${name}`, null),
    async pushList(name, entry, options = {}) {
      const list = upsertFront(await readJson(kv, `loom:${name}`, []), entry, options);
      await writeJson(kv, `loom:${name}`, list);
      return { list };
    },
  };
}

/** v2 storage: the loom_ops and loom_logs tables in a D1 database. */
export function d1Store(db) {
  const getLog = async (key) => {
    const head = await db.prepare('SELECT key, address, kind, label, title, created_at, updated_at FROM loom_logs WHERE key = ?').bind(key).first();
    if (!head) return null;
    const { results } = await db.prepare('SELECT seq, op_json, at FROM loom_ops WHERE log_key = ? ORDER BY seq DESC LIMIT ?').bind(key, MAX_OPS).all();
    const ops = results.reverse().map((r) => ({ ...JSON.parse(r.op_json), seq: r.seq, at: r.at }));
    return {
      v: 1, address: head.address, key: head.key, kind: head.kind, label: head.label, title: head.title,
      createdAt: head.created_at, updatedAt: head.updated_at, seq: ops.at(-1)?.seq ?? 0, ops,
      ...(ops[0]?.seq > 1 ? { trimmedBefore: ops[0].seq } : {}),
    };
  };
  return {
    kind: 'd1',
    getLog,
    async appendOps(key, init, ops, now, { title = null, sender = null } = {}) {
      const senderKey = sender ? await addressKey(sender) : null;
      const statements = [
        db.prepare(`INSERT INTO loom_logs (key, address, kind, label, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
          ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at, title = COALESCE(loom_logs.title, excluded.title)`)
          .bind(key, init.address, init.kind, init.label, init.title ?? title ?? null, init.createdAt ?? now, now),
        // A seed or a v1 thread arrives whole the first time; its rows keep their seq, so a repeat is a no-op.
        ...(init.ops ?? []).map(({ seq, at, ...op }) => db.prepare('INSERT OR IGNORE INTO loom_ops (log_key, seq, op_json, sender_key, at) VALUES (?, ?, ?, NULL, ?)')
          .bind(key, seq, JSON.stringify(op), at ?? now)),
        ...ops.map((op) => db.prepare(`INSERT INTO loom_ops (log_key, seq, op_json, sender_key, at)
          SELECT ?1, COALESCE(MAX(seq), 0) + 1, ?2, ?3, ?4 FROM loom_ops WHERE log_key = ?1 RETURNING seq`)
          .bind(key, JSON.stringify(op), senderKey, now)),
      ];
      // A batch is one transaction: the log row, any import and the new ops land together or not at all.
      const results = await db.batch(statements);
      const seqs = results.slice(-ops.length).map((r) => r.results[0].seq);
      const log = await getLog(key);
      return { log, ops: seqs.map((seq, i) => log.ops.find((o) => o.seq === seq) ?? { ...ops[i], seq, at: now }) };
    },
    async getList(name) {
      if (name === 'index') {
        const { results } = await db.prepare('SELECT key, address, kind, label, title, updated_at, summary_json FROM loom_logs ORDER BY updated_at DESC LIMIT ?').bind(MAX_INDEX).all();
        return results.map((r) => {
          const summary = r.summary_json ? JSON.parse(r.summary_json) : {};
          return { address: r.address, key: r.key, kind: r.kind, label: r.label, title: r.title, updatedAt: r.updated_at, count: summary.count ?? 0, last: summary.last ?? null };
        });
      }
      if (name.startsWith('out:')) {
        const { results } = await db.prepare(`SELECT o.log_key, o.op_json, o.at, l.address FROM loom_ops o JOIN loom_logs l ON l.key = o.log_key
          WHERE o.sender_key = ? ORDER BY o.at DESC, o.seq DESC LIMIT ?`).bind(name.slice(4), MAX_OUTBOX).all();
        return results.map((r) => { const op = JSON.parse(r.op_json); return { to: r.address, key: r.log_key, id: op.id, at: r.at, body: excerpt(op.body, 120) }; });
      }
      return null;
    },
    async pushList(name, entry) {
      // Outboxes are a query over sender_key; only the directory's summary cache is written. It only
      // moves forward, so two appends finishing out of order cannot leave the older count behind.
      if (name === 'index') {
        await db.prepare(`UPDATE loom_logs SET summary_json = ?1 WHERE key = ?2
          AND (summary_json IS NULL OR COALESCE(json_extract(summary_json, '$.seq'), 0) <= ?3)`)
          .bind(JSON.stringify({ seq: entry.seq ?? 0, count: entry.count, last: entry.last }), entry.key, entry.seq ?? 0).run();
      } else {
        // Nothing to write, but touch the table so a missing migration still reads as missing and
        // layered() files the outbox entry in KV instead of dropping it.
        await db.prepare('SELECT 1 FROM loom_ops WHERE 0').all();
      }
      return { list: null };
    },
  };
}

const tableMissing = (error) => /no such table/i.test(String(error?.message ?? error));

/** D1 in front, the v1 KV archive behind. */
export function layered(primary, legacy) {
  if (!legacy) return primary;
  // Until migration 0035 is applied, D1 answers "no such table": use KV for that call.
  const either = (fn) => async (...args) => {
    try { return await fn(primary, ...args); } catch (error) {
      if (tableMissing(error)) return fn(legacy, ...args);
      throw error;
    }
  };
  return {
    kind: primary.kind,
    getLog: either(async (store, key) => {
      if (store === legacy) return legacy.getLog(key);
      const log = await primary.getLog(key);
      if (log) return log;
      const archived = await legacy.getLog(key);
      return archived ? { ...archived, archived: true } : null;
    }),
    appendOps: either((store, ...args) => store.appendOps(...args)),
    getList: either(async (store, name) => {
      const older = (await legacy.getList(name)) ?? [];
      if (store === legacy) return older;
      const newer = (await primary.getList(name)) ?? [];
      if (name === 'index') {
        const keys = new Set(newer.map((e) => e.key));
        return [...newer, ...older.filter((e) => !keys.has(e.key))].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, MAX_INDEX);
      }
      const ids = new Set(newer.map((e) => e.id));
      return [...newer, ...older.filter((e) => !ids.has(e.id))].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, MAX_OUTBOX);
    }),
    pushList: either((store, ...args) => store.pushList(...args)),
  };
}

/**
 * The store a deployment should use: D1 when AUTH_DB is bound (with the KV
 * archive behind it), otherwise KV alone, otherwise none (read-only).
 */
export function loomStore({ db = null, kv = null } = {}) {
  const legacy = kv ? kvStore(kv) : null;
  if (!db) return legacy;
  return layered(d1Store(db), legacy);
}
