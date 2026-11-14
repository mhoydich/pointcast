/** Transaction boundary for every Loom write, including echoes and derived lists.
 * D1 batch is atomic. A named CHECK aborts the ENTIRE batch if the revision
 * changed while the handler ran. No process-local lock or KV retry can do this.
 * Legacy KV is a read-only archive after cutover; see docs/setup/loom-atomic.md.
 */
import { handleLoom } from './service.mjs';

const unavailable = (error = 'loom_storage_unavailable') => new Response(JSON.stringify({ ok: false, error }), {
  status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
});
const memoize = (fn) => {
  const calls = new Map();
  return (...args) => { const key = JSON.stringify(args); if (!calls.has(key)) calls.set(key, Promise.resolve().then(() => fn(...args))); return calls.get(key); };
};

export async function handleAtomicLoom(request, { db, kv: archive = null, attempts = 8, ...options } = {}) {
  if (request.method === 'OPTIONS') return handleLoom(request, options);
  if (!db?.withSession) return unavailable();
  const clock = options.clock ?? (() => new Date());
  const now = clock();
  // Retrying a storage conflict must not charge rate budgets or call an
  // external counter again. These callbacks must not perform Loom writes.
  const stable = { ...options, clock: () => now,
    ...(options.limit ? { limit: memoize(options.limit) } : {}),
    ...(options.drumCount ? { drumCount: memoize(options.drumCount) } : {}),
  };
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      // Every attempt begins on the primary; no stale replica can accept a
      // write or make a newly committed post look absent in the next GET.
      const session = db.withSession('first-primary');
      const state = await session.prepare('SELECT revision FROM loom_atomic_state WHERE singleton = 1').first();
      if (!state || !Number.isSafeInteger(state.revision)) return unavailable();
      const writes = new Map();
      const reads = new Map();
      let readFailed = false;
      const kv = {
        async get(key) {
          if (writes.has(key)) return writes.get(key);
          if (!reads.has(key)) reads.set(key, (async () => {
            try {
              const row = await session.prepare('SELECT value FROM loom_atomic_values WHERE key = ?').bind(key).first();
              const value = row ? row.value : (archive ? await archive.get(key) : null);
              // service.readJson historically swallowed invalid JSON. Detect it
              // here so a corrupt log cannot be mistaken for an empty room.
              if (value !== null && (key === 'loom:index' || key === 'loom:rooms' || key.startsWith('loom:log:') || key.startsWith('loom:out:'))) JSON.parse(value);
              return value;
            } catch (error) { readFailed = true; throw error; }
          })());
          return reads.get(key);
        },
        async put(key, value) { writes.set(key, value); },
      };
      const response = await handleLoom(request.clone(), { ...stable, kv });
      if (readFailed) return unavailable();
      // Never commit a partially executed failed request. A GET may attempt
      // a legacy room-list backfill; it is intentionally not persisted.
      if (!response.ok || request.method !== 'POST' || !writes.size) return response;
      const statements = [session.prepare(`UPDATE loom_atomic_state SET revision = CASE WHEN revision = ? THEN revision + 1 ELSE -1 END WHERE singleton = 1`).bind(state.revision)];
      for (const [key, value] of writes) statements.push(session.prepare('INSERT INTO loom_atomic_values(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(key, value));
      try { await session.batch(statements); }
      catch (error) {
        // Only a known rolled-back conflict is retryable. An unknown commit
        // outcome is NOT replayed (it could duplicate an accepted append).
        if (/CHECK constraint failed: loom_revision_matches/.test(String(error?.message ?? error))) continue;
        return unavailable();
      }
      return response; // no 201 until all destination writes have committed
    } catch { return unavailable(); }
  }
  return unavailable('loom_write_contention');
}

/** One read path for bot, For You, topic and sitemap server routes. */
export const atomicReader = (options) => (request) => handleAtomicLoom(request, options);
