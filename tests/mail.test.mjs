import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost as inbound, verifySvixSignature } from '../functions/api/mail/inbound.ts';
import { onRequestGet as inbox } from '../functions/api/mail/inbox.ts';
import { sendMail } from '../src/lib/mail.ts';

async function signedHeaders(payload, secret, id = 'msg_town_mail_1', now = Date.now()) {
  const timestamp = String(Math.floor(now / 1000));
  const key = await crypto.subtle.importKey(
    'raw',
    Buffer.from(secret.slice('whsec_'.length), 'base64'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${payload}`),
  );
  return new Headers({
    'content-type': 'application/json',
    'svix-id': id,
    'svix-timestamp': timestamp,
    'svix-signature': `v1,${Buffer.from(signature).toString('base64')}`,
  });
}

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/gu, ' ').trim();
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  async run() {
    if (!this.sql.startsWith('INSERT OR IGNORE INTO inbox')) throw new Error(`Unsupported run: ${this.sql}`);
    const [webhookId, emailId, from, to, subject, text, receivedAt] = this.args;
    if (this.db.webhookIds.has(webhookId) || this.db.emailIds.has(emailId)) {
      return { success: true, meta: { changes: 0 } };
    }
    this.db.webhookIds.add(webhookId);
    this.db.emailIds.add(emailId);
    this.db.inbox.push({ webhookId, emailId, from, to, subject, text, receivedAt });
    return { success: true, meta: { changes: 1 } };
  }
  async first() {
    if (this.sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) return this.db.session;
    if (this.sql.startsWith('SELECT payload FROM users')) return this.db.user;
    if (this.sql.startsWith('SELECT 1 AS present FROM inbox')) {
      return this.db.webhookIds.has(this.args[0]) ? { present: 1 } : null;
    }
    throw new Error(`Unsupported first: ${this.sql}`);
  }
  async all() {
    if (!this.sql.includes('FROM inbox')) throw new Error(`Unsupported all: ${this.sql}`);
    return {
      success: true,
      results: this.db.inbox.slice(0, this.args[0]).map((row) => ({
        from_address: row.from,
        to_addresses: row.to,
        subject: row.subject,
        text: row.text,
        received_at: row.receivedAt,
      })),
    };
  }
}

class FakeD1 {
  constructor() {
    this.inbox = [];
    this.webhookIds = new Set();
    this.emailIds = new Set();
    this.session = null;
    this.user = null;
  }
  prepare(sql) { return new FakeStatement(this, sql); }
}

class FakePresence {
  constructor() { this.requests = []; }
  idFromName(name) { return name; }
  get() {
    return {
      fetch: async (input, init) => {
        this.requests.push({ input, init });
        return Response.json({ ok: true });
      },
    };
  }
}

test('mail adapter prefers Resend, falls back to SEND_EMAIL, and exposes zero-config state', async () => {
  const calls = [];
  const binding = { messages: [], async send(message) { this.messages.push(message); return { messageId: 'binding-1' }; } };
  const resend = await sendMail({
    from: 'PointCast <hello@pointcast.xyz>',
    to: 'resident@example.com',
    subject: 'Welcome',
    text: 'Hello from town.',
  }, { RESEND_API_KEY: 'test-key', SEND_EMAIL: binding }, async (input, init) => {
    calls.push({ input, init });
    return Response.json({ id: 'resend-1' });
  });
  assert.deepEqual(resend, { configured: true, provider: 'resend', messageId: 'resend-1' });
  assert.equal(binding.messages.length, 0);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer test-key');

  const fallback = await sendMail({
    from: 'PointCast <hello@pointcast.xyz>',
    to: 'resident@example.com',
    subject: 'Welcome',
    html: '<p>Hello from town.</p>',
  }, { SEND_EMAIL: binding });
  assert.deepEqual(fallback, { configured: true, provider: 'send_email', messageId: 'binding-1' });
  assert.deepEqual(binding.messages[0].from, { name: 'PointCast', email: 'hello@pointcast.xyz' });
  assert.deepEqual(await sendMail({ from: 'a@example.com', to: 'b@example.com', subject: 'x', text: 'y' }, {}), {
    configured: false,
  });
});

test('Resend inbound verifies raw Svix signatures, stores once, and emits a PII-free mail burst', async () => {
  const db = new FakeD1();
  const presence = new FakePresence();
  const secret = `whsec_${Buffer.from('0123456789abcdef0123456789abcdef').toString('base64')}`;
  const payload = JSON.stringify({
    type: 'email.received',
    created_at: '2026-09-03T17:00:00.000Z',
    data: { email_id: 'received-1', from: 'metadata@example.com', to: ['town@inbound.pointcast.xyz'] },
  });
  const headers = await signedHeaders(payload, secret);
  assert.equal(await verifySvixSignature(payload, headers, secret), true);

  const originalFetch = globalThis.fetch;
  let retrievals = 0;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'https://api.resend.com/emails/receiving/received-1');
    retrievals += 1;
    return Response.json({
      from: 'sender@example.com',
      to: ['town@inbound.pointcast.xyz'],
      subject: 'A note for town',
      text: 'Plain text body',
      created_at: '2026-09-03T17:00:00.000Z',
    });
  };
  try {
    const env = { AUTH_DB: db, PRESENCE: presence, RESEND_API_KEY: 'test-key', RESEND_WEBHOOK_SECRET: secret };
    const response = await inbound({
      env,
      request: new Request('https://pointcast.xyz/api/mail/inbound', { method: 'POST', headers, body: payload }),
    });
    assert.deepEqual(await response.json(), { ok: true, stored: true });
    assert.deepEqual(db.inbox[0], {
      webhookId: 'msg_town_mail_1',
      emailId: 'received-1',
      from: 'sender@example.com',
      to: '["town@inbound.pointcast.xyz"]',
      subject: 'A note for town',
      text: 'Plain text body',
      receivedAt: '2026-09-03T17:00:00.000Z',
    });
    const burst = JSON.parse(presence.requests[0].init.body);
    assert.equal(burst.kind, 'mail');
    assert.doesNotMatch(JSON.stringify(burst), /sender@example|inbound\.pointcast|A note for town|Plain text body/u);

    const replay = await inbound({
      env,
      request: new Request('https://pointcast.xyz/api/mail/inbound', { method: 'POST', headers, body: payload }),
    });
    assert.deepEqual(await replay.json(), { ok: true, stored: false });
    assert.equal(presence.requests.length, 1);
    assert.equal(retrievals, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('town inbox GET requires the director role and returns the stored mail contract', async () => {
  const db = new FakeD1();
  db.inbox.push({
    from: 'sender@example.com',
    to: '["town@inbound.pointcast.xyz"]',
    subject: 'Hello',
    text: 'Town body',
    receivedAt: '2026-09-03T17:00:00.000Z',
  });
  const denied = await inbox({ env: { AUTH_DB: db }, request: new Request('https://pointcast.xyz/api/mail/inbox') });
  assert.equal(denied.status, 403);

  db.session = { token: 'session-1', user_id: 'user-1', expires_at: Date.now() + 60_000 };
  db.user = { payload: JSON.stringify({
    userId: 'user-1',
    createdAt: '2026-09-03T00:00:00.000Z',
    identities: [],
    preferredName: 'Mike',
    roles: ['broadcaster'],
  }) };
  const response = await inbox({
    env: { AUTH_DB: db },
    request: new Request('https://pointcast.xyz/api/mail/inbox?limit=10', {
      headers: { cookie: 'pc_session=session-1' },
    }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).messages[0], {
    from: 'sender@example.com',
    to: ['town@inbound.pointcast.xyz'],
    subject: 'Hello',
    text: 'Town body',
    receivedAt: '2026-09-03T17:00:00.000Z',
  });
});
