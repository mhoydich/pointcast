import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { DatabaseSync } from 'node:sqlite';

const turn = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

// Pause the first room read of every writer AFTER taking its snapshot. This is
// an adversarial, legal storage ordering, not a latency/load benchmark. Reads
// and writes themselves still go through the real Pages handler and real SQL.
export function readSchedule(key, writers, { delayedWriter = null } = {}) {
  const context = new AsyncLocalStorage();
  const arrived = new Set();
  const ready = deferred();
  const release = deferred();
  return {
    run: (writer, fn) => context.run(writer, fn),
    ready: ready.promise,
    release: release.resolve,
    cancel() { ready.resolve(); release.resolve(); },
    async afterRead(readKey) {
      const writer = context.getStore();
      if (readKey !== key || writer === undefined || arrived.has(writer)) return;
      arrived.add(writer);
      if (arrived.size === writers) ready.resolve();
      await ready.promise;
      if (writer === delayedWriter) await release.promise;
    },
  };
}

export function localStores(schedule, { atomic }) {
  const archive = new Map();
  let archiveWrites = 0;
  let conflicts = 0;
  let batches = 0;
  const kv = {
    async get(key) {
      await turn();
      const value = archive.get(key) ?? null;
      if (!atomic) await schedule.afterRead(key);
      return value;
    },
    async put(key, value) {
      assert.equal(atomic, false, 'atomic handler must never write the KV archive');
      await turn();
      archiveWrites += 1;
      archive.set(key, value);
    },
  };

  // Disposable SQLite fixture only. No Wrangler, D1 binding, migration file,
  // migration ledger, disk database, account credentials, or remote service.
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`
    CREATE TABLE loom_atomic_state (
      singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
      revision INTEGER NOT NULL CONSTRAINT loom_revision_matches CHECK(revision >= 0)
    );
    INSERT INTO loom_atomic_state VALUES (1, 0);
    CREATE TABLE loom_atomic_values (
      key TEXT PRIMARY KEY CHECK(key LIKE 'loom:%'), value TEXT NOT NULL
    );
  `);
  const db = {
    withSession(mode) {
      assert.equal(mode, 'first-primary');
      return this;
    },
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          await turn();
          const row = sqlite.prepare(sql).get(...this.args) ?? null;
          if (sql.includes('FROM loom_atomic_values')) await schedule.afterRead(this.args[0]);
          return row;
        },
        execute() { return sqlite.prepare(sql).run(...this.args); },
      };
    },
    async batch(statements) {
      await turn();
      batches += 1;
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => statement.execute());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        if (/CHECK constraint failed: loom_revision_matches/.test(error.message)) conflicts += 1;
        throw error;
      }
    },
  };
  // One independent local rate store. Writers have distinct IPs, so the real
  // wrapper's per-IP limit does not turn the 25/100-writer test into a 429 test.
  const rates = new Map();
  return {
    env: { PC_LOOM_KV: kv, AUTH_DB: db, PC_RATES_KV: {
      async get(key) { return rates.get(key) ?? null; },
      async put(key, value) { rates.set(key, value); },
    } },
    archive,
    stats: () => ({ archiveWrites, batches, conflicts }),
    close: () => sqlite.close(),
  };
}
