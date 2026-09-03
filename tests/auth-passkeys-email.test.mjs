import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { onRequestGet as emailCallback } from '../functions/api/auth/email/callback.ts';
import { onRequestPost as emailStart } from '../functions/api/auth/email/start.ts';
import { emailTokenKey } from '../functions/api/auth/email/_shared.ts';
import { createLoginOptionsHandler } from '../functions/api/auth/passkey/login/options.ts';
import { createLoginVerifyHandler } from '../functions/api/auth/passkey/login/verify.ts';
import { createRegisterOptionsHandler } from '../functions/api/auth/passkey/register/options.ts';
import { createRegisterVerifyHandler } from '../functions/api/auth/passkey/register/verify.ts';
import {
  onRequestDelete as deleteCredential,
  onRequestGet as listCredentials,
} from '../functions/api/auth/passkey/credentials.ts';
import {
  issueSession,
  upsertUserForIdentity,
} from '../functions/api/auth/session.ts';

const root = new URL('../', import.meta.url);

class FakeKV {
  constructor(entries = []) {
    this.values = new Map(entries);
    this.puts = [];
    this.deletes = [];
  }

  async get(key, type) {
    const value = this.values.get(key) ?? null;
    if (value === null || type !== 'json') return value;
    return JSON.parse(value);
  }

  async put(key, value, options) {
    this.values.set(key, value);
    this.puts.push({ key, value, options });
  }

  async delete(key) {
    this.values.delete(key);
    this.deletes.push(key);
  }
}

class FakeD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first() {
    const { sql, args, db } = this;
    if (sql.startsWith('SELECT payload FROM users')) {
      const row = db.users.get(args[0]);
      return row ? { payload: row.payload } : null;
    }
    if (sql.startsWith('SELECT user_id FROM identities')) {
      const row = db.identities.get(`${args[0]}:${args[1]}`);
      return row ? { user_id: row.user_id } : null;
    }
    if (sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) {
      const row = db.sessions.get(args[0]);
      return row ? { ...row } : null;
    }
    if (sql.startsWith('SELECT payload, expires_at FROM oauth_states')) {
      const row = db.oauthStates.get(args[0]);
      return row ? { ...row } : null;
    }
    if (sql.startsWith('DELETE FROM oauth_states') && sql.includes('RETURNING')) {
      const row = db.oauthStates.get(args[0]) ?? null;
      db.oauthStates.delete(args[0]);
      return row ? { ...row } : null;
    }
    if (sql.startsWith('SELECT credential_id, user_id, public_key') && sql.includes('credential_id = ?')) {
      const row = db.passkeys.get(args[0]);
      return row ? { ...row } : null;
    }
    throw new Error(`Unsupported fake D1 first(): ${sql}`);
  }

  async all() {
    const { sql, args, db } = this;
    if (sql.startsWith('SELECT credential_id, user_id, public_key') && sql.includes('user_id = ?')) {
      return {
        success: true,
        results: [...db.passkeys.values()].filter((row) => row.user_id === args[0]),
      };
    }
    throw new Error(`Unsupported fake D1 all(): ${sql}`);
  }

  async run() {
    const { sql, args, db } = this;
    if (sql === 'DELETE FROM sessions WHERE expires_at <= ?') {
      for (const [token, row] of db.sessions) {
        if (row.expires_at <= args[0]) db.sessions.delete(token);
      }
    } else if (sql === 'DELETE FROM oauth_states WHERE expires_at <= ?') {
      for (const [state, row] of db.oauthStates) {
        if (row.expires_at <= args[0]) db.oauthStates.delete(state);
      }
    } else if (sql.startsWith('INSERT INTO users')) {
      db.users.set(args[0], { id: args[0], payload: args[1], created_at: args[2] });
    } else if (sql.startsWith('UPDATE users SET payload')) {
      const current = db.users.get(args[1]);
      if (current) db.users.set(args[1], { ...current, payload: args[0] });
    } else if (sql.startsWith('INSERT INTO identities')) {
      db.identities.set(`${args[0]}:${args[1]}`, {
        provider: args[0], id: args[1], user_id: args[2], payload: args[3],
      });
    } else if (sql.startsWith('DELETE FROM identities')) {
      db.identities.delete(`${args[0]}:${args[1]}`);
    } else if (sql.startsWith('INSERT INTO sessions')) {
      db.sessions.set(args[0], { token: args[0], user_id: args[1], expires_at: args[2] });
    } else if (sql.startsWith('INSERT INTO oauth_states')) {
      db.oauthStates.set(args[0], { payload: args[1], expires_at: args[2] });
    } else if (sql.startsWith('INSERT INTO passkey_credentials')) {
      db.passkeys.set(args[0], {
        credential_id: args[0],
        user_id: args[1],
        public_key: args[2],
        counter: args[3],
        transports: args[4],
        created_at: args[5],
        last_used_at: null,
        label: args[6],
      });
    } else if (sql.startsWith('UPDATE passkey_credentials SET counter')) {
      const row = db.passkeys.get(args[2]);
      if (row) db.passkeys.set(args[2], { ...row, counter: args[0], last_used_at: args[1] });
    } else if (sql.startsWith('DELETE FROM passkey_credentials')) {
      db.passkeys.delete(args[0]);
    } else if (sql === 'DELETE FROM sessions WHERE token = ?') {
      db.sessions.delete(args[0]);
    } else if (sql === 'DELETE FROM oauth_states WHERE state = ?') {
      db.oauthStates.delete(args[0]);
    } else {
      throw new Error(`Unsupported fake D1 run(): ${sql}`);
    }
    return { success: true };
  }
}

class FakeD1 {
  constructor() {
    this.users = new Map();
    this.identities = new Map();
    this.sessions = new Map();
    this.oauthStates = new Map();
    this.passkeys = new Map();
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  async batch(statements) {
    return Promise.all(statements.map((statement) => statement.run()));
  }
}

class FakeSendEmail {
  constructor() {
    this.messages = [];
  }

  async send(message) {
    this.messages.push(message);
    return { messageId: `email-${this.messages.length}` };
  }
}

function jsonRequest(path, body, cookie, headers = {}) {
  return new Request(`https://pointcast.xyz${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie: `pc_session=${cookie}` } : {}),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function registrationResponse(id = 'credential-test') {
  return {
    id,
    rawId: id,
    type: 'public-key',
    response: { clientDataJSON: 'client', attestationObject: 'attestation' },
    clientExtensionResults: {},
    authenticatorAttachment: 'platform',
  };
}

function authenticationResponse(id = 'credential-test') {
  return {
    id,
    rawId: id,
    type: 'public-key',
    response: {
      clientDataJSON: 'client',
      authenticatorData: 'authenticator',
      signature: 'signature',
      userHandle: null,
    },
    clientExtensionResults: {},
    authenticatorAttachment: 'platform',
  };
}

async function seedUser(env) {
  const user = await upsertUserForIdentity(env, {
    provider: 'google',
    id: 'google-test',
    name: 'Test member',
    verifiedAt: new Date().toISOString(),
  });
  const session = await issueSession(env, user.userId);
  return { user, session };
}

test('passkey migration, pinned libraries, UI, and binding configuration are explicit', async () => {
  const [migration, pkg, menu, me, config] = await Promise.all([
    readFile(new URL('migrations/auth/0003_passkeys.sql', root), 'utf8'),
    readFile(new URL('package.json', root), 'utf8'),
    Promise.all([
      readFile(new URL('src/components/AuthMenu.astro', root), 'utf8'),
      readFile(new URL('src/scripts/chrome/auth-menu.ts', root), 'utf8'),
    ]).then((parts) => parts.join('\n')),
    readFile(new URL('src/pages/me.astro', root), 'utf8'),
    readFile(new URL('wrangler.toml', root), 'utf8'),
  ]);
  assert.match(migration, /CREATE TABLE passkey_credentials/);
  for (const column of ['credential_id', 'user_id', 'public_key', 'counter', 'transports', 'created_at', 'last_used_at', 'label']) {
    assert.match(migration, new RegExp(column));
  }
  assert.equal(JSON.parse(pkg).dependencies['@simplewebauthn/server'], '14.0.0');
  assert.equal(JSON.parse(pkg).dependencies['@simplewebauthn/browser'], '14.0.0');
  assert.match(menu, /data-provider="passkey"/);
  assert.match(menu, /Face ID \/ Touch ID/);
  assert.match(menu, /Email me a link/);
  assert.match(menu, /data-auth-email-form/);
  assert.match(menu, /root\.addEventListener\('click'|scope\.on\(root, 'click'/);
  assert.doesNotMatch(menu, /\sid=/);
  assert.match(me, /Add a passkey to this device/);
  assert.match(me, /data-me-passkey-list/);
  assert.doesNotMatch(config, /^\[\[send_email\]\]/m);
  assert.match(config, /Pages config files do NOT accept a/);
  assert.match(config, /Email → name SEND_EMAIL/);
});

test('passkey registration and discoverable login consume challenges once and reject expiry', async () => {
  const db = new FakeD1();
  const env = { AUTH_DB: db, PASSKEY_ALLOWED_ORIGINS: 'https://preview.pointcast.xyz' };
  const { user, session } = await seedUser(env);
  const cookie = session.sessionToken;
  const registerOptions = createRegisterOptionsHandler(async (options) => {
    assert.equal(options.rpID, 'pointcast.xyz');
    assert.equal(options.authenticatorSelection.residentKey, 'required');
    return { challenge: 'register-challenge', rp: {}, user: {}, pubKeyCredParams: [] };
  });
  const optionsResponse = await registerOptions({
    request: jsonRequest('/api/auth/passkey/register/options', { label: 'Mike’s Mac' }, cookie),
    env,
  });
  assert.equal(optionsResponse.status, 200);
  const optionsPayload = await optionsResponse.json();
  assert.equal(optionsPayload.options.challenge, 'register-challenge');

  let registrationVerifications = 0;
  const registerVerify = createRegisterVerifyHandler(async (options) => {
    registrationVerifications += 1;
    assert.equal(options.expectedChallenge, 'register-challenge');
    assert.deepEqual(options.expectedOrigin, ['https://pointcast.xyz', 'https://preview.pointcast.xyz']);
    return {
      verified: true,
      registrationInfo: {
        credential: {
          id: 'credential-test',
          publicKey: Uint8Array.from([1, 2, 3]),
          counter: 4,
          transports: ['internal'],
        },
      },
    };
  });
  const verifyBody = { flowId: optionsPayload.flowId, response: registrationResponse() };
  const verifyResponse = await registerVerify({
    request: jsonRequest('/api/auth/passkey/register/verify', verifyBody, cookie),
    env,
  });
  assert.equal(verifyResponse.status, 200);
  assert.equal(db.passkeys.get('credential-test').label, 'Mike’s Mac');
  assert.equal(db.identities.get('passkey:credential-test').user_id, user.userId);
  assert.equal((await verifyResponse.json()).user.identities.at(-1).provider, 'passkey');

  const replay = await registerVerify({
    request: jsonRequest('/api/auth/passkey/register/verify', verifyBody, cookie),
    env,
  });
  assert.equal(replay.status, 401);
  assert.equal((await replay.json()).reason, 'passkey-challenge-expired-or-used');
  assert.equal(registrationVerifications, 1);

  const loginOptions = createLoginOptionsHandler(async (options) => {
    assert.equal(options.rpID, 'pointcast.xyz');
    assert.equal(options.allowCredentials, undefined);
    return { challenge: 'login-challenge', rpId: 'pointcast.xyz' };
  });
  const loginOptionsResponse = await loginOptions({ env, request: jsonRequest('/api/auth/passkey/login/options', {}) });
  const loginOptionsPayload = await loginOptionsResponse.json();
  let loginVerifications = 0;
  const loginVerify = createLoginVerifyHandler(async (options) => {
    loginVerifications += 1;
    assert.equal(options.expectedChallenge, 'login-challenge');
    assert.equal(options.credential.counter, 4);
    return {
      verified: true,
      authenticationInfo: { newCounter: 5 },
    };
  });
  const loginBody = { flowId: loginOptionsPayload.flowId, response: authenticationResponse() };
  const loginResponse = await loginVerify({
    env,
    request: jsonRequest('/api/auth/passkey/login/verify', loginBody),
  });
  assert.equal(loginResponse.status, 200);
  assert.match(loginResponse.headers.get('set-cookie'), /^pc_session=pcs_/);
  assert.equal((await loginResponse.json()).user.userId, user.userId);
  assert.equal(db.passkeys.get('credential-test').counter, 5);

  const loginReplay = await loginVerify({
    env,
    request: jsonRequest('/api/auth/passkey/login/verify', loginBody),
  });
  assert.equal(loginReplay.status, 401);
  assert.equal(loginVerifications, 1);

  const expiringOptions = await loginOptions({ env, request: jsonRequest('/api/auth/passkey/login/options', {}) });
  const expiringPayload = await expiringOptions.json();
  db.oauthStates.get(`webauthn:login:${expiringPayload.flowId}`).expires_at = Date.now() - 1;
  const expired = await loginVerify({
    env,
    request: jsonRequest('/api/auth/passkey/login/verify', {
      flowId: expiringPayload.flowId,
      response: authenticationResponse(),
    }),
  });
  assert.equal(expired.status, 401);
  assert.equal((await expired.json()).reason, 'passkey-challenge-expired-or-used');
  assert.equal(loginVerifications, 1);

  const listed = await listCredentials({
    env,
    request: new Request('https://pointcast.xyz/api/auth/passkey/credentials', {
      headers: { cookie: `pc_session=${cookie}` },
    }),
  });
  assert.deepEqual((await listed.json()).passkeys.map((passkey) => passkey.label), ['Mike’s Mac']);
  const removed = await deleteCredential({
    env,
    request: new Request('https://pointcast.xyz/api/auth/passkey/credentials', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', cookie: `pc_session=${cookie}` },
      body: JSON.stringify({ credentialId: 'credential-test' }),
    }),
  });
  assert.equal(removed.status, 200);
  assert.equal(db.passkeys.size, 0);
  assert.equal(db.identities.has('passkey:credential-test'), false);
  assert.equal(JSON.parse(db.users.get(user.userId).payload).identities.some((identity) => identity.provider === 'passkey'), false);
});

test('email magic links use the binding, create a session once, reject expiry, and make no fetch call', async () => {
  const db = new FakeD1();
  const rates = new FakeKV();
  const sender = new FakeSendEmail();
  const env = { AUTH_DB: db, PC_RATES_KV: rates, SEND_EMAIL: sender };
  const missing = await emailStart({
    env: { AUTH_DB: new FakeD1(), PC_RATES_KV: new FakeKV() },
    request: jsonRequest('/api/auth/email/start', { email: 'mike@example.com' }),
  });
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).reason, 'email-sign-in-not-configured');

  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('external fetch should not be used by the email binding flow');
  };
  try {
    const start = await emailStart({
      env,
      request: jsonRequest('/api/auth/email/start', {
        email: ' Mike@Example.com ',
        returnTo: '/me?from=email',
      }, null, { 'CF-Connecting-IP': '203.0.113.8' }),
    });
    assert.equal(start.status, 202);
    assert.equal(sender.messages.length, 1);
    assert.equal(sender.messages[0].from.email, 'hello@pointcast.xyz');
    assert.equal(sender.messages[0].to, 'mike@example.com');
    const token = sender.messages[0].text.match(/token=([A-Za-z0-9_-]+)/)[1];
    assert.ok(db.oauthStates.has(await emailTokenKey(token)));

    const callback = await emailCallback({
      env,
      request: new Request(`https://pointcast.xyz/api/auth/email/callback?token=${token}`),
    });
    assert.equal(callback.status, 302);
    assert.match(callback.headers.get('set-cookie'), /^pc_session=pcs_/);
    assert.match(callback.headers.get('location'), /\/me\?from=email&auth=email$/);
    assert.ok(db.identities.has('email:mike@example.com'));

    const replay = await emailCallback({
      env,
      request: new Request(`https://pointcast.xyz/api/auth/email/callback?token=${token}`),
    });
    assert.equal(replay.status, 302);
    assert.match(replay.headers.get('location'), /auth_error=email-link-expired-or-used/);

    await emailStart({
      env,
      request: jsonRequest('/api/auth/email/start', { email: 'other@example.com' }, null, {
        'CF-Connecting-IP': '203.0.113.9',
      }),
    });
    const expiredToken = sender.messages.at(-1).text.match(/token=([A-Za-z0-9_-]+)/)[1];
    db.oauthStates.get(await emailTokenKey(expiredToken)).expires_at = Date.now() - 1;
    const expired = await emailCallback({
      env,
      request: new Request(`https://pointcast.xyz/api/auth/email/callback?token=${expiredToken}`),
    });
    assert.match(expired.headers.get('location'), /auth_error=email-link-expired-or-used/);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('email account linking requires the initiating session at callback time', async () => {
  const db = new FakeD1();
  const sender = new FakeSendEmail();
  const env = {
    AUTH_DB: db,
    PC_RATES_KV: new FakeKV(),
    SEND_EMAIL: sender,
  };
  const { user, session } = await seedUser(env);
  const start = await emailStart({
    env,
    request: jsonRequest('/api/auth/email/start', {
      email: 'linked@example.com',
      returnTo: '/me',
    }, session.sessionToken, { 'CF-Connecting-IP': '203.0.113.31' }),
  });
  assert.equal(start.status, 202);
  const token = sender.messages[0].text.match(/token=([A-Za-z0-9_-]+)/)[1];

  const crossBrowserCallback = await emailCallback({
    env,
    request: new Request(`https://pointcast.xyz/api/auth/email/callback?token=${token}`),
  });
  assert.equal(crossBrowserCallback.status, 302);
  const emailUserId = db.identities.get('email:linked@example.com').user_id;
  assert.notEqual(emailUserId, user.userId);
  assert.deepEqual(
    JSON.parse(db.users.get(user.userId).payload).identities.map((identity) => identity.provider),
    ['google'],
  );

  const secondStart = await emailStart({
    env,
    request: jsonRequest('/api/auth/email/start', {
      email: 'same-browser@example.com',
      returnTo: '/me',
    }, session.sessionToken, { 'CF-Connecting-IP': '203.0.113.31' }),
  });
  assert.equal(secondStart.status, 202);
  const secondToken = sender.messages[1].text.match(/token=([A-Za-z0-9_-]+)/)[1];
  const sameBrowserCallback = await emailCallback({
    env,
    request: new Request(`https://pointcast.xyz/api/auth/email/callback?token=${secondToken}`, {
      headers: { cookie: `pc_session=${session.sessionToken}` },
    }),
  });
  assert.equal(sameBrowserCallback.status, 302);
  assert.equal(db.identities.get('email:same-browser@example.com').user_id, user.userId);
});

test('email magic-link rate limiting applies independently to email and IP keys', async () => {
  const db = new FakeD1();
  const rates = new FakeKV();
  const sender = new FakeSendEmail();
  const env = { AUTH_DB: db, PC_RATES_KV: rates, SEND_EMAIL: sender };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await emailStart({
      env,
      request: jsonRequest('/api/auth/email/start', { email: 'limited@example.com' }, null, {
        'CF-Connecting-IP': `203.0.113.${attempt + 20}`,
      }),
    });
    assert.equal(response.status, 202);
  }
  const emailLimited = await emailStart({
    env,
    request: jsonRequest('/api/auth/email/start', { email: 'limited@example.com' }, null, {
      'CF-Connecting-IP': '203.0.113.99',
    }),
  });
  assert.equal(emailLimited.status, 429);
  assert.equal((await emailLimited.json()).reason, 'email-rate-limited');

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await emailStart({
      env,
      request: jsonRequest('/api/auth/email/start', { email: `person-${attempt}@example.com` }, null, {
        'CF-Connecting-IP': '198.51.100.44',
      }),
    });
    assert.equal(response.status, 202);
  }
  const ipLimited = await emailStart({
    env,
    request: jsonRequest('/api/auth/email/start', { email: 'person-11@example.com' }, null, {
      'CF-Connecting-IP': '198.51.100.44',
    }),
  });
  assert.equal(ipLimited.status, 429);
  assert.equal((await ipLimited.json()).reason, 'ip-rate-limited');
  assert.ok(rates.puts.some(({ key }) => key.startsWith('rl:auth-email:email:')));
  assert.ok(rates.puts.some(({ key }) => key.startsWith('rl:auth-email:ip:')));
});
