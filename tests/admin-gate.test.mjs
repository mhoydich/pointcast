import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// The /admin/* gate in functions/_middleware.ts holds two keys: the
// ADMIN_TOKEN (query ?k= / cookie pc_admin) and — since /desk started
// linking straight into the publisher — the director's own PointCast
// session. Everyone else still gets the plain 404 with no hint that a
// gate exists at all.

const ADMIN = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const ADMIN_TOKEN = 'token-under-test';
const SESSION_TOKEN = 'session-under-test';

async function withMiddleware(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    return await run(await server.ssrLoadModule('/functions/_middleware.ts'));
  } finally {
    await server.close();
  }
}

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  async first() {
    if (this.sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) {
      return this.args[0] === SESSION_TOKEN ? this.db.session : null;
    }
    if (this.sql.startsWith('SELECT payload FROM users')) {
      return { payload: JSON.stringify(this.db.user) };
    }
    throw new Error(`Unsupported fake first(): ${this.sql}`);
  }
  async run() {
    if (this.sql.startsWith('DELETE FROM sessions')) return { success: true, meta: { changes: 0 } };
    throw new Error(`Unsupported fake run(): ${this.sql}`);
  }
}

class FakeD1 {
  constructor(user) {
    this.user = user;
    this.session = { token: SESSION_TOKEN, user_id: user.userId, expires_at: Date.now() + 60_000 };
  }
  prepare(sql) { return new FakeStatement(this, sql); }
}

function fakeUser({ roles = [], identities = [] } = {}) {
  return {
    userId: 'pcu_admin_gate_test',
    createdAt: '2026-09-04T00:00:00.000Z',
    preferredName: 'Gate test',
    roles,
    identities,
  };
}

const PASSED = 'publisher body';

async function gate(middleware, { cookie, query, user } = {}) {
  const url = new URL('https://pointcast.xyz/admin/deploy/new/');
  if (query) url.searchParams.set('k', query);
  const headers = { accept: 'text/html', 'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/140.0' };
  if (cookie) headers.cookie = cookie;
  return middleware.onRequest({
    request: new Request(url.toString(), { headers }),
    env: { ADMIN_TOKEN, ...(user ? { AUTH_DB: new FakeD1(user) } : {}) },
    next: async () => new Response(PASSED, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
    waitUntil: () => {},
  });
}

test('/admin/* without a token and without a session stays a plain 404', async () => {
  await withMiddleware(async (middleware) => {
    const response = await gate(middleware);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), 'Not Found');
  });
});

test('/admin/* with the token cookie passes through', async () => {
  await withMiddleware(async (middleware) => {
    const response = await gate(middleware, { cookie: `pc_admin=${ADMIN_TOKEN}` });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), PASSED);
  });
});

test('/admin/* with ?k=<token> sets the sticky cookie and redirects to the clean URL', async () => {
  await withMiddleware(async (middleware) => {
    const response = await gate(middleware, { query: ADMIN_TOKEN });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), 'https://pointcast.xyz/admin/deploy/new/');
    assert.match(response.headers.get('set-cookie') ?? '', /^pc_admin=token-under-test; Path=\/admin;/);
  });
});

test('a director session unlocks /admin/* with no token in hand', async () => {
  await withMiddleware(async (middleware) => {
    const byRole = await gate(middleware, {
      cookie: `pc_session=${SESSION_TOKEN}`,
      user: fakeUser({ roles: ['broadcaster'] }),
    });
    assert.equal(byRole.status, 200);
    assert.equal(await byRole.text(), PASSED);

    const byWallet = await gate(middleware, {
      cookie: `pc_session=${SESSION_TOKEN}`,
      user: fakeUser({ identities: [{ provider: 'kukai', id: ADMIN }] }),
    });
    assert.equal(byWallet.status, 200);
  });
});

test('a signed-in non-director session still gets the plain 404', async () => {
  await withMiddleware(async (middleware) => {
    const response = await gate(middleware, {
      cookie: `pc_session=${SESSION_TOKEN}`,
      user: fakeUser({ identities: [{ provider: 'google', id: ADMIN }] }),
    });
    assert.equal(response.status, 404);
    assert.equal(await response.text(), 'Not Found');
  });
});

test('the gate reads a session only for tokenless /admin/* GETs', async () => {
  await withMiddleware(async (middleware) => {
    let reads = 0;
    const db = new FakeD1(fakeUser({ roles: ['broadcaster'] }));
    const counting = { prepare: (sql) => { reads += 1; return db.prepare(sql); } };
    const call = (pathname, headers) => middleware.onRequest({
      request: new Request(`https://pointcast.xyz${pathname}`, {
        headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/140.0', ...headers },
      }),
      env: { ADMIN_TOKEN, AUTH_DB: counting },
      next: async () => new Response(PASSED, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
      waitUntil: () => {},
    });

    await call('/desk/', { cookie: `pc_session=${SESSION_TOKEN}` });
    await call('/coffee/', { cookie: `pc_session=${SESSION_TOKEN}` });
    assert.equal(reads, 0, 'ordinary pages must not pay for a session read');

    await call('/admin/deploy/new/', { cookie: `pc_admin=${ADMIN_TOKEN}` });
    assert.equal(reads, 0, 'the token path must not pay for a session read');

    await call('/admin/deploy/new/', { cookie: `pc_session=${SESSION_TOKEN}` });
    assert.ok(reads > 0, 'a tokenless /admin/* GET resolves the session');
  });
});
