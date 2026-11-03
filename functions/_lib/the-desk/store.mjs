// The Desk — the ledger, over a D1 database (or the node:sqlite shim in tests).
// Thin on purpose: every rule lives in gate.mjs; this file only reads and writes.
import { cents, iso, qty6 } from './util.mjs';

export function deskStore(db) {
  const q = (sql, ...args) => db.prepare(sql).bind(...args);
  const all = async (sql, ...args) => (await q(sql, ...args).all()).results || [];
  const first = (sql, ...args) => q(sql, ...args).first();
  const run = async (sql, ...args) => (await q(sql, ...args).run())?.meta?.changes ?? 0;

  return {
    // ─── state ───
    state: () => first('SELECT * FROM tdesk_state WHERE id = 1'),
    setKilled: (by, ms) =>
      run('UPDATE tdesk_state SET killed = 1, keys_disabled = 1, killed_at = ?, killed_by = ?, updated_at = ? WHERE id = 1', iso(ms), by, iso(ms)),
    rearm: (ms) =>
      run('UPDATE tdesk_state SET killed = 0, keys_disabled = 0, killed_at = NULL, killed_by = NULL, updated_at = ? WHERE id = 1', iso(ms)),
    setHalted: (day, ms) => run('UPDATE tdesk_state SET halted_day = ?, halted_at = ?, updated_at = ? WHERE id = 1', day, iso(ms), iso(ms)),
    /** Lease so the cron tick, /propose, /approve and /kill never interleave ledger writes. */
    async acquireLock(owner, ms, ttlMs) {
      const n = await run(
        'UPDATE tdesk_state SET lock_owner = ?, lock_until = ? WHERE id = 1 AND (lock_until IS NULL OR lock_until < ? OR lock_owner = ?)',
        owner, ms + ttlMs, ms, owner,
      );
      return n === 1;
    },
    releaseLock: (owner) => run('UPDATE tdesk_state SET lock_owner = NULL, lock_until = NULL WHERE id = 1 AND lock_owner = ?', owner),

    // ─── orders ───
    insertOrder: (o) =>
      run(
        `INSERT INTO tdesk_orders (id, created_at, agent, venue, instrument, title, action, qty, limit_price, notional, mode, status, refusal, config_hash, reasoning, flatten)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        o.id, o.created_at, o.agent, o.venue, o.instrument, o.title ?? null, o.action, o.qty, o.limit_price, o.notional, o.mode,
        o.status, o.refusal ?? null, o.config_hash, o.reasoning, o.flatten ? 1 : 0,
      ),
    async updateOrder(id, fields) {
      const keys = Object.keys(fields);
      if (!keys.length) return 0;
      return run(`UPDATE tdesk_orders SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, ...keys.map((k) => fields[k]), id);
    },
    order: (id) => first('SELECT * FROM tdesk_orders WHERE id = ?', id),
    ordersByStatus: (status) => all('SELECT * FROM tdesk_orders WHERE status = ? ORDER BY created_at', status),
    recentOrders: (limit = 100) => all('SELECT * FROM tdesk_orders ORDER BY created_at DESC, rowid DESC LIMIT ?', limit),
    unrevealed: () => all("SELECT * FROM tdesk_orders WHERE sealed_at IS NOT NULL AND revealed_at IS NULL AND status IN ('filled', 'partial', 'unfilled', 'canceled')"),
    lastChain: async () => (await first('SELECT chain FROM tdesk_orders WHERE chain IS NOT NULL ORDER BY sealed_at DESC, rowid DESC LIMIT 1'))?.chain ?? null,

    // ─── positions & cash ───
    positions: () => all('SELECT * FROM tdesk_positions ORDER BY venue, instrument, agent'),
    position: (agent, venue, instrument) =>
      first('SELECT * FROM tdesk_positions WHERE agent = ? AND venue = ? AND instrument = ?', agent, venue, instrument),
    async setPosition(agent, venue, instrument, title, qty, cost, ms) {
      if (qty6(qty) <= 0) return run('DELETE FROM tdesk_positions WHERE agent = ? AND venue = ? AND instrument = ?', agent, venue, instrument);
      return run(
        `INSERT INTO tdesk_positions (agent, venue, instrument, title, qty, cost, opened_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (agent, venue, instrument) DO UPDATE SET qty = excluded.qty, cost = excluded.cost, updated_at = excluded.updated_at`,
        agent, venue, instrument, title ?? null, qty6(qty), cents(cost), iso(ms), iso(ms),
      );
    },
    async cash(venue, bankrollUsd) {
      const row = await first('SELECT cash FROM tdesk_cash WHERE venue = ?', venue);
      return row ? row.cash : bankrollUsd;
    },
    setCash: (venue, cash, ms) =>
      run(
        'INSERT INTO tdesk_cash (venue, cash, updated_at) VALUES (?, ?, ?) ON CONFLICT (venue) DO UPDATE SET cash = excluded.cash, updated_at = excluded.updated_at',
        venue, cents(cash), iso(ms),
      ),
    addAgentPnl: (agent, venue, realized, fees) =>
      run(
        `INSERT INTO tdesk_agent_pnl (agent, venue, realized, fees) VALUES (?, ?, ?, ?)
         ON CONFLICT (agent, venue) DO UPDATE SET realized = realized + excluded.realized, fees = fees + excluded.fees`,
        agent, venue, cents(realized), cents(fees),
      ),
    agentPnl: () => all('SELECT * FROM tdesk_agent_pnl'),

    // ─── marks & days ───
    setMark: (venue, instrument, price, ms) =>
      run(
        'INSERT INTO tdesk_marks (venue, instrument, price, at) VALUES (?, ?, ?, ?) ON CONFLICT (venue, instrument) DO UPDATE SET price = excluded.price, at = excluded.at',
        venue, instrument, price, iso(ms),
      ),
    marks: () => all('SELECT * FROM tdesk_marks'),
    day: (day) => first('SELECT * FROM tdesk_days WHERE day = ?', day),
    putDay: (day, start, last, low, halted) =>
      run(
        `INSERT INTO tdesk_days (day, start_equity, last_equity, low_equity, halted) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (day) DO UPDATE SET last_equity = excluded.last_equity, low_equity = MIN(low_equity, excluded.low_equity), halted = MAX(halted, excluded.halted)`,
        day, cents(start), cents(last), cents(low), halted ? 1 : 0,
      ),
    days: (limit = 30) => all('SELECT * FROM tdesk_days ORDER BY day DESC LIMIT ?', limit),

    // ─── events ───
    event: (ms, kind, { agent = null, venue = null, orderId = null, detail = null } = {}) =>
      run('INSERT INTO tdesk_events (at, kind, agent, venue, order_id, detail) VALUES (?, ?, ?, ?, ?, ?)', iso(ms), kind, agent, venue, orderId, detail),
    events: (limit = 100) => all('SELECT * FROM tdesk_events ORDER BY id DESC LIMIT ?', limit),
  };
}
