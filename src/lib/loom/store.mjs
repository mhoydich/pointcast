/**
 * Loom stores. The service (service.mjs) never touches storage directly; it
 * asks a store, and every write is one of three atomic-per-document moves:
 *
 *   appendOps(key, init, ops, now, { title })   stamp seq/at onto one log
 *   pushList(name, entry, { keyField, cap })    front-insert into a capped list
 *   putRecord(name, record, expectVersion)      compare-and-set one record
 *
 * Every guard the service checks before writing (does the parent exist, does
 * the edit token match, is this a poll) is about an append op, and append ops
 * never change once written, so read → check → append is safe as long as the
 * append itself is atomic. That is the whole point of v2:
 *
 *   doStore     one Durable Object per log, list and record (workers/loom).
 *               Writes are serialised inside the object, so two people
 *               appending in the same millisecond both land, in order. Logs
 *               also hold WebSockets and push new ops the moment they append.
 *   kvStore     the v1 layout in Workers KV (prefix `loom:`). Read-modify-
 *               write, so two writes to one log in the same second can race
 *               and the later wins. Kept as the fallback and as the archive
 *               the Durable Objects import from on first touch.
 *   layered     Durable Objects first, KV underneath for reads that have no
 *               object yet. Lists that were never written as objects are
 *               seeded from KV once, then the object owns them.
 *
 * Document names: `log:<key>` · `index` · `out:<key>` · `peers` · `keys:<key>`.
 */
import { stampOps, upsertFront } from './log.mjs';

async function readJson(kv, key, fallback) {
  try { const raw = await kv.get(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
const writeJson = (kv, key, value) => kv.put(key, JSON.stringify(value));
const kvName = (name) => (name.startsWith('log:') ? `loom:log:${name.slice(4)}` : `loom:${name}`);

/** v1 storage: one KV value per document. */
export function kvStore(kv) {
  return {
    kind: 'kv',
    pushes: false,
    getLog: (key) => readJson(kv, `loom:log:${key}`, null),
    async appendOps(key, init, ops, now, options = {}) {
      const log = (await readJson(kv, `loom:log:${key}`, null)) ?? structuredClone(init);
      const stamped = stampOps(log, ops, now, options);
      await writeJson(kv, `loom:log:${key}`, log);
      return { log, ops: stamped };
    },
    getList: (name) => readJson(kv, kvName(name), null),
    async pushList(name, entry, options = {}) {
      const list = upsertFront(await readJson(kv, kvName(name), []), entry, options);
      await writeJson(kv, kvName(name), list);
      return { list };
    },
    getRecord: (name) => readJson(kv, kvName(name), null),
    async putRecord(name, record, expectVersion = 0) {
      const current = await readJson(kv, kvName(name), null);
      if ((current?.version ?? 0) !== expectVersion) return { ok: false, conflict: true, record: current };
      const next = { ...record, version: expectVersion + 1 };
      await writeJson(kv, kvName(name), next);
      return { ok: true, record: next };
    },
  };
}

/**
 * v2 storage: a Durable Object namespace (binding LOOM, class LoomDoc in the
 * pointcast-loom Worker). Each document is its own object, addressed by name.
 * `seedList(name)` supplies the starting contents of a list the objects have
 * never held (layered() passes the KV archive's copy).
 */
export function doStore(ns, { seedList = async () => [] } = {}) {
  const call = async (name, path, body) => {
    const stub = ns.get(ns.idFromName(name));
    const res = await stub.fetch(`https://loom.do${path}?name=${encodeURIComponent(name)}`, body === undefined
      ? { method: 'GET' }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok && res.status !== 409) throw new Error(`loom_do_${res.status}`);
    return res.json();
  };
  return {
    kind: 'durable-object',
    pushes: true,
    async getLog(key) { return (await call(`log:${key}`, '/log')).log; },
    async appendOps(key, init, ops, now, options = {}) {
      return call(`log:${key}`, '/log/append', { init, ops, now, title: options.title ?? null });
    },
    async getList(name) { return (await call(name, '/list')).list; },
    async pushList(name, entry, options = {}) {
      const body = { entry, keyField: options.keyField ?? null, cap: options.cap ?? 300 };
      const first = await call(name, '/list/push', body);
      return first.needSeed ? call(name, '/list/push', { ...body, seed: (await seedList(name)) ?? [] }) : first;
    },
    async getRecord(name) { return (await call(name, '/record')).record; },
    putRecord(name, record, expectVersion = 0) { return call(name, '/record/put', { record, expectVersion }); },
    /** Forward a WebSocket upgrade to the log's object (functions/api/loom/live.ts). */
    connect(key, request) { return ns.get(ns.idFromName(`log:${key}`)).fetch(`https://loom.do/live?name=${encodeURIComponent(`log:${key}`)}`, request); },
  };
}

/**
 * Durable Objects in front, the v1 KV archive behind. `primary` should be a
 * doStore built with seedList reading `legacy`; see loomStore() below.
 */
export function layered(primary, legacy) {
  if (!legacy) return primary;
  return {
    kind: primary.kind,
    pushes: primary.pushes,
    async getLog(key) {
      const log = await primary.getLog(key);
      if (log) return log;
      const archived = await legacy.getLog(key);
      return archived ? { ...archived, archived: true } : null;
    },
    appendOps: (...args) => primary.appendOps(...args),
    async getList(name) { return (await primary.getList(name)) ?? (await legacy.getList(name)); },
    pushList: (...args) => primary.pushList(...args),
    getRecord: (name) => primary.getRecord(name),
    putRecord: (...args) => primary.putRecord(...args),
    connect: primary.connect,
  };
}

/**
 * The store a deployment should use: Durable Objects when LOOM is bound (with
 * the KV archive behind them), otherwise KV alone, otherwise none (read-only).
 */
export function loomStore({ ns = null, kv = null } = {}) {
  const legacy = kv ? kvStore(kv) : null;
  if (!ns) return legacy;
  return layered(doStore(ns, { seedList: async (name) => (legacy ? await legacy.getList(name) : null) ?? [] }), legacy);
}
