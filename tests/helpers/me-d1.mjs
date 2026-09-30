import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

/** Execute production SQL against SQLite. Only the D1 transport is adapted. */
export class SqliteD1 {
  constructor(migrations = ['0029_me_keeps.sql']) {
    this.sqlite = new DatabaseSync(':memory:');
    this.sqlite.exec('PRAGMA foreign_keys = ON');
    for (const name of migrations) this.sqlite.exec(readFileSync(new URL(`../../migrations/auth/${name}`, import.meta.url), 'utf8'));
  }
  prepare(sql) { return new Statement(this, sql, []); }
  async exec(sql) { this.sqlite.exec(sql); return { count: 1, duration: 0 }; }
  async batch(statements) {
    this.sqlite.exec('BEGIN IMMEDIATE');
    try {
      const result = statements.map((statement) => statement.execute());
      this.sqlite.exec('COMMIT');
      return result;
    } catch (error) { this.sqlite.exec('ROLLBACK'); throw error; }
  }
  close() { this.sqlite.close(); }
}

class Statement {
  constructor(db, sql, values) { this.db = db; this.sql = sql; this.values = values; }
  bind(...values) { return new Statement(this.db, this.sql, values); }
  execute() {
    const sql = this.db.sqlite;
    const before = sql.prepare('SELECT total_changes() AS n').get().n;
    const statement = sql.prepare(this.sql);
    const results = statement.columns().length ? statement.all(...this.values).map((row) => ({ ...row })) : (statement.run(...this.values), []);
    const changes = sql.prepare('SELECT total_changes() AS n').get().n - before;
    return { success: true, results, meta: { changes, duration: 0 } };
  }
  async all() { return this.execute(); }
  async run() { return this.execute(); }
  async first(column) { const row = this.execute().results[0] ?? null; return column && row ? row[column] : row; }
}

export class MemoryKV {
  data = new Map();
  writes = 0;
  async get(key, type) {
    const value = this.data.get(key);
    return value === undefined ? null : type === 'json' ? JSON.parse(value) : value;
  }
  async put(key, value) { this.writes++; this.data.set(key, value); }
}
