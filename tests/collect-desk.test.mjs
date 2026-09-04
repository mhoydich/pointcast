import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

import { onRequestPost as subscribe } from '../functions/api/collect/subscribe.ts';
import { onRequestGet as confirm } from '../functions/api/collect/confirm.ts';
import { onRequestGet as enterToday } from '../functions/k/today.ts';
import { claimKennelClubSitting } from '../src/lib/collect-client.ts';
import { dailyEmail } from '../src/lib/collect-email.ts';

const root = new URL('../', import.meta.url);

class FakeKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

class FakeEmail {
  constructor() { this.messages = []; }
  async send(message) {
    this.messages.push(message);
    return { messageId: `collect-${this.messages.length}` };
  }
}

class FakeD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  async first() {
    const { db, sql, args } = this;
    if (sql.startsWith('SELECT payload FROM users')) return db.users.get(args[0]) ?? null;
    if (sql.startsWith('SELECT user_id FROM identities')) return db.identities.get(`${args[0]}:${args[1]}`) ?? null;
    if (sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) return db.sessions.get(args[0]) ?? null;
    if (sql.startsWith('SELECT authenticated_at FROM sessions')) {
      const row = db.sessions.get(args[0]);
      return row ? { authenticated_at: row.authenticated_at ?? 0 } : null;
    }
    if (sql.startsWith('DELETE FROM oauth_states') && sql.includes('RETURNING')) {
      const row = db.oauthStates.get(args[0]) ?? null;
      db.oauthStates.delete(args[0]);
      return row;
    }
    if (sql.startsWith('SELECT email, user_id, status, token') && sql.includes('WHERE email = ?')) {
      return db.subscribers.get(args[0]) ?? null;
    }
    if (sql.startsWith('SELECT email, user_id, status, token') && sql.includes('WHERE token = ?')) {
      return [...db.subscribers.values()].find((row) => row.token === args[0]) ?? null;
    }
    if (sql.startsWith('UPDATE collect_login_tokens') && sql.includes('RETURNING subscriber_email')) {
      const row = db.loginTokens.get(args[1]);
      if (!row || row.consumed_at !== null || row.revoked_at !== null || row.expires_at <= args[2]) return null;
      row.consumed_at = args[0];
      return { subscriber_email: row.subscriber_email };
    }
    if (sql.startsWith('SELECT token FROM subscribers')) {
      const row = db.subscribers.get(args[0]);
      return row ? { token: row.token } : null;
    }
    throw new Error(`Unsupported first: ${sql}`);
  }
  async run() {
    const { db, sql, args } = this;
    if (sql === 'DELETE FROM sessions WHERE expires_at <= ?') {
      for (const [token, row] of db.sessions) if (row.expires_at <= args[0]) db.sessions.delete(token);
    } else if (sql === 'DELETE FROM oauth_states WHERE expires_at <= ?') {
      for (const [key, row] of db.oauthStates) if (row.expires_at <= args[0]) db.oauthStates.delete(key);
    } else if (sql.startsWith('INSERT INTO oauth_states')) {
      db.oauthStates.set(args[0], { payload: args[1], expires_at: args[2] });
    } else if (sql.startsWith('INSERT INTO subscribers')) {
      db.subscribers.set(args[0], {
        email: args[0], user_id: args[1], status: args[2], token: args[3], created_at: args[4],
        confirmed_at: args[5], last_sent_day: args[6], tz: args[7],
      });
    } else if (sql.startsWith('INSERT INTO users')) {
      db.users.set(args[0], { payload: args[1] });
    } else if (sql.startsWith('INSERT INTO identities')) {
      db.identities.set(`${args[0]}:${args[1]}`, { user_id: args[2], payload: args[3] });
    } else if (sql.startsWith('INSERT INTO sessions')) {
      db.sessions.set(args[0], {
        token: args[0], user_id: args[1], expires_at: args[2], authenticated_at: args[3] ?? 0,
      });
    } else if (sql.startsWith("UPDATE subscribers SET status = 'confirmed'")) {
      const row = db.subscribers.get(args[2]);
      db.subscribers.set(args[2], { ...row, status: 'confirmed', user_id: args[0], confirmed_at: row.confirmed_at ?? args[1] });
    } else if (sql.startsWith('UPDATE subscribers SET user_id = ?')) {
      const row = db.subscribers.get(args[1]);
      db.subscribers.set(args[1], { ...row, user_id: args[0] });
    } else if (sql === 'DELETE FROM oauth_states WHERE state = ?') {
      db.oauthStates.delete(args[0]);
    } else if (sql === 'DELETE FROM sessions WHERE token = ?') {
      db.sessions.delete(args[0]);
    } else {
      throw new Error(`Unsupported run: ${sql}`);
    }
    return { success: true, meta: { changes: 1 } };
  }
}

class FakeD1 {
  constructor() {
    this.users = new Map();
    this.identities = new Map();
    this.sessions = new Map();
    this.oauthStates = new Map();
    this.subscribers = new Map();
    this.loginTokens = new Map();
  }
  prepare(sql) { return new FakeD1Statement(this, sql); }
  async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); }
}

class DailyD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  async first() {
    if (this.sql.includes('FROM alias_receipts')) return { new_aliases: 0, renewed_aliases: 0 };
    throw new Error(`Unsupported daily first: ${this.sql}`);
  }
  async all() {
    if (this.sql.startsWith('SELECT email, token, last_sent_day FROM subscribers')) {
      const day = this.args[0];
      return {
        results: [...this.db.subscribers.values()]
          .filter((row) => row.status === 'confirmed' && row.last_sent_day !== day)
          .map(({ email, token, last_sent_day }) => ({ email, token, last_sent_day })),
      };
    }
    throw new Error(`Unsupported daily all: ${this.sql}`);
  }
  async run() {
    const { db, sql, args } = this;
    if (sql.startsWith('UPDATE subscribers SET last_sent_day = ?') && sql.includes("status = 'confirmed'")) {
      const row = db.subscribers.get(args[1]);
      if (!row || row.status !== 'confirmed' || row.last_sent_day === args[2]) {
        return { meta: { changes: 0 } };
      }
      row.last_sent_day = args[0];
    } else if (sql.startsWith('UPDATE collect_login_tokens SET revoked_at = ?')) {
      for (const row of db.loginTokens.values()) {
        if (row.subscriber_email === args[1] && row.consumed_at === null && row.revoked_at === null) {
          row.revoked_at = args[0];
        }
      }
    } else if (sql.startsWith('INSERT INTO collect_login_tokens')) {
      db.loginTokens.set(args[0], {
        token_hash: args[0], subscriber_email: args[1], issued_at: args[2], expires_at: args[3],
        consumed_at: null, revoked_at: null, sent_day: args[4],
      });
    } else if (sql.startsWith('INSERT INTO kennel_daily_runs')) {
      db.lastRun = { day: args[0], attempted: args[3], sent: args[4], failed: args[5] };
    } else {
      throw new Error(`Unsupported daily run: ${sql}`);
    }
    return { meta: { changes: 1 } };
  }
}

class DailyD1 {
  constructor(subscriber) {
    this.subscribers = new Map([[subscriber.email, subscriber]]);
    this.loginTokens = new Map();
  }
  prepare(sql) { return new DailyD1Statement(this, sql); }
  async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); }
}

function post(path, body, headers = {}) {
  return new Request(`https://pointcast.xyz${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.24', ...headers },
    body: JSON.stringify(body),
  });
}

test('collect subscription is double opt-in, rate-limited storage-backed, and never echoes an email', async () => {
  const env = { AUTH_DB: new FakeD1(), PC_RATES_KV: new FakeKV(), SEND_EMAIL: new FakeEmail() };
  const response = await subscribe({ request: post('/api/collect/subscribe', { email: ' Dog@Example.com ' }), env });
  assert.equal(response.status, 202);
  assert.equal(env.SEND_EMAIL.messages.length, 1);
  assert.equal(env.SEND_EMAIL.messages[0].from.email, 'kennel@pointcast.xyz');
  assert.equal(env.SEND_EMAIL.messages[0].to, 'dog@example.com');
  assert.equal(env.AUTH_DB.subscribers.get('dog@example.com').status, 'pending');
  assert.ok(env.PC_RATES_KV.values.size >= 2);
  const body = await response.text();
  assert.doesNotMatch(body, /dog@example\.com/i);

  const token = env.SEND_EMAIL.messages[0].text.match(/token=([A-Za-z0-9_-]+)/)?.[1];
  assert.ok(token);
  const confirmed = await confirm({
    request: new Request(`https://pointcast.xyz/api/collect/confirm?token=${token}`),
    env,
  });
  assert.equal(confirmed.status, 302);
  assert.match(confirmed.headers.get('set-cookie'), /^pc_session=pcs_/);
  assert.match(confirmed.headers.get('location'), /confirmed=1&claim=1/);
  assert.equal(env.AUTH_DB.subscribers.get('dog@example.com').status, 'confirmed');
  assert.ok(env.AUTH_DB.identities.has('email:dog@example.com'));

  const replay = await confirm({
    request: new Request(`https://pointcast.xyz/api/collect/confirm?token=${token}`),
    env,
  });
  assert.match(replay.headers.get('location'), /confirmation-expired-or-used/);
});

test('daily email token signs the confirmed email identity in and lands on an immediate claim', async () => {
  const db = new FakeD1();
  const loginToken = 'l'.repeat(48);
  const loginHash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(loginToken))).toString('hex');
  db.subscribers.set('ready@example.com', {
    email: 'ready@example.com', user_id: null, status: 'confirmed', token: 'x'.repeat(48),
    created_at: '2026-09-01T00:00:00.000Z', confirmed_at: '2026-09-01T00:01:00.000Z',
    last_sent_day: null, tz: 'America/Los_Angeles',
  });
  db.loginTokens.set(loginHash, {
    subscriber_email: 'ready@example.com', issued_at: Date.now(), expires_at: Date.now() + 60_000,
    consumed_at: null, revoked_at: null, sent_day: '2026-09-04',
  });
  const response = await enterToday({
    request: new Request(`https://pointcast.xyz/k/today?claim=1&t=${loginToken}`),
    env: { AUTH_DB: db },
  });
  assert.equal(response.status, 302);
  assert.match(response.headers.get('set-cookie'), /^pc_session=pcs_/);
  assert.match(response.headers.get('location'), /\/collect\?claim=1&from=daily-email/);
  assert.ok(db.identities.has('email:ready@example.com'));

  const replay = await enterToday({
    request: new Request(`https://pointcast.xyz/k/today?claim=1&t=${loginToken}`),
    env: { AUTH_DB: db },
  });
  assert.equal(replay.headers.get('set-cookie'), null);
  assert.match(replay.headers.get('location'), /daily-link-invalid/);

  const unsubscribeTokenAsLogin = await enterToday({
    request: new Request(`https://pointcast.xyz/k/today?claim=1&t=${'x'.repeat(48)}`),
    env: { AUTH_DB: db },
  });
  assert.equal(unsubscribeTokenAsLogin.headers.get('set-cookie'), null);
  assert.match(unsubscribeTokenAsLogin.headers.get('location'), /daily-link-invalid/);
});

test('claim client uses the parallel claim API contract and supports a fake fetch', async () => {
  let seen;
  const result = await claimKennelClubSitting(1, async (input, init) => {
    seen = { input, init };
    return Response.json({ ok: true, heldUntilWallet: true });
  });
  assert.equal(seen.input, '/api/kennel-club/claim');
  assert.equal(seen.init.method, 'POST');
  assert.deepEqual(JSON.parse(seen.init.body), { tokenId: 1 });
  assert.equal(result.heldUntilWallet, true);
});

test('daily mail content and worker contract are binding-native, idempotent, and privacy-safe', async () => {
  const fakeEmail = new FakeEmail();
  const content = dailyEmail({
    day: 2,
    name: 'Hartley',
    breed: 'Black Labrador Retriever',
    title: 'The Library Hour',
    image: { png: '/images/kennel-club/september-sitting/02-hartley.png' },
  }, 'l'.repeat(48), 'u'.repeat(48));
  await fakeEmail.send({ to: 'private@example.com', ...content });
  assert.equal(content.subject, 'Sitting 02 · Hartley is ready');
  assert.match(content.html, /\/k\/today\?claim=1&amp;t=/);
  assert.match(content.html, /Unsubscribe/);
  assert.match(content.text, new RegExp(`t=${'l'.repeat(48)}`));
  assert.match(content.text, new RegExp(`t=${'u'.repeat(48)}`));

  const [worker, config, migration, page, agents] = await Promise.all([
    readFile(new URL('workers/kennel-daily/src/index.ts', root), 'utf8'),
    readFile(new URL('workers/kennel-daily/wrangler.toml', root), 'utf8'),
    readFile(new URL('migrations/auth/0004_collect_subscribers.sql', root), 'utf8'),
    readFile(new URL('src/pages/collect.astro', root), 'utf8'),
    readFile(new URL('src/pages/agents.json.ts', root), 'utf8'),
  ]);
  assert.match(worker, /UPDATE subscribers SET last_sent_day = \?/);
  assert.match(worker, /WHERE email = \? AND last_sent_day = \?/);
  assert.match(worker, /kind: 'daily'/);
  assert.match(worker, /email-not-configured/);
  assert.match(worker, /List-Unsubscribe/);
  assert.match(worker, /INSERT INTO collect_login_tokens/);
  assert.match(worker, /COLLECT_LOGIN_TTL_MS = 15 \* 60 \* 1000/);
  assert.match(worker, /SET revoked_at = \?/);
  assert.match(config, /crons = \["0 7 \* \* \*"\]/);
  assert.match(config, /name = "SEND_EMAIL"/);
  for (const column of ['email', 'user_id', 'status', 'token', 'created_at', 'confirmed_at', 'last_sent_day', 'tz']) {
    assert.match(migration, new RegExp(`\\b${column}\\b`));
  }
  assert.match(page, /Collect a dog a day/);
  assert.match(page, /claimKennelClubSitting/);
  assert.match(agents, /collectJson: 'https:\/\/pointcast\.xyz\/collect\.json'/);
});

test('daily worker issues a hashed 15-minute login distinct from the reusable unsubscribe token', async () => {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const { runKennelDaily } = await server.ssrLoadModule('/workers/kennel-daily/src/index.ts');
    const unsubscribeToken = 'u'.repeat(48);
    const db = new DailyD1({
      email: 'daily@example.com', token: unsubscribeToken, status: 'confirmed',
      last_sent_day: null,
    });
    const sender = new FakeEmail();
    const now = new Date('2026-09-04T07:00:00.000Z');
    const result = await runKennelDaily({
      AUTH_DB: db,
      SEND_EMAIL: sender,
      KENNEL_DAILY_DRY_RUN: 'false',
    }, { now });
    assert.equal(result.sent, 1);
    assert.equal(db.loginTokens.size, 1);
    const stored = [...db.loginTokens.values()][0];
    assert.equal(stored.expires_at - stored.issued_at, 15 * 60 * 1000);
    assert.equal(stored.sent_day, result.day);
    const message = sender.messages[0];
    const loginToken = message.text.match(/\/k\/today\?claim=1&t=([A-Za-z0-9_-]+)/)[1];
    assert.notEqual(loginToken, unsubscribeToken);
    assert.match(message.text, new RegExp(`/api/collect/unsubscribe\\?t=${unsubscribeToken}`));
    const loginHash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(loginToken))).toString('hex');
    assert.equal(stored.token_hash, loginHash);
    assert.doesNotMatch(JSON.stringify(stored), new RegExp(loginToken));

    const rerun = await runKennelDaily({
      AUTH_DB: db,
      SEND_EMAIL: sender,
      KENNEL_DAILY_DRY_RUN: 'false',
    }, { now });
    assert.equal(rerun.attempted, 0);
    assert.equal(sender.messages.length, 1);
  } finally {
    await server.close();
  }
});
