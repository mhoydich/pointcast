import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

// Executes the production SQL and migration, rather than mocking first-answer arbitration.
export function confirmDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../migrations/auth/0035_loom_confirms.sql', import.meta.url), 'utf8'));
  const prepare = (sql, args = []) => ({
    bind: (...values) => prepare(sql, values),
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
    run: async () => sqlite.prepare(sql).run(...args),
    execute: () => sqlite.prepare(sql).run(...args),
  });
  return { prepare, batch: async (statements) => {
    sqlite.exec('BEGIN');
    try { const result = statements.map((s) => s.execute()); sqlite.exec('COMMIT'); return result; }
    catch (e) { sqlite.exec('ROLLBACK'); throw e; }
  }, close: () => sqlite.close() };
}
