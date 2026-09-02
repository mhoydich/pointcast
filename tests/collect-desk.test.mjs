import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

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
      db.sessions.set(args[0], { token: args[0], user_id: args[1], expires_at: args[2] });
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
  }
  prepare(sql) { return new FakeD1Statement(this, sql); }
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
  db.subscribers.set('ready@example.com', {
    email: 'ready@example.com', user_id: null, status: 'confirmed', token: 'x'.repeat(48),
    created_at: '2026-09-01T00:00:00.000Z', confirmed_at: '2026-09-01T00:01:00.000Z',
    last_sent_day: null, tz: 'America/Los_Angeles',
  });
  const response = await enterToday({
    request: new Request(`https://pointcast.xyz/k/today?claim=1&t=${'x'.repeat(48)}`),
    env: { AUTH_DB: db },
  });
  assert.equal(response.status, 302);
  assert.match(response.headers.get('set-cookie'), /^pc_session=pcs_/);
  assert.match(response.headers.get('location'), /\/collect\?claim=1&from=daily-email/);
  assert.ok(db.identities.has('email:ready@example.com'));
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
  }, 't'.repeat(48));
  await fakeEmail.send({ to: 'private@example.com', ...content });
  assert.equal(content.subject, 'Sitting 02 · Hartley is ready');
  assert.match(content.html, /\/k\/today\?claim=1&amp;t=/);
  assert.match(content.html, /Unsubscribe/);

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
  assert.match(config, /crons = \["0 7 \* \* \*"\]/);
  assert.match(config, /name = "SEND_EMAIL"/);
  for (const column of ['email', 'user_id', 'status', 'token', 'created_at', 'confirmed_at', 'last_sent_day', 'tz']) {
    assert.match(migration, new RegExp(`\\b${column}\\b`));
  }
  assert.match(page, /Collect a dog a day/);
  assert.match(page, /claimKennelClubSitting/);
  assert.match(agents, /collectJson: 'https:\/\/pointcast\.xyz\/collect\.json'/);
});

