import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { onRequestGet, onRequestPost, onRequestDelete } from '../functions/api/me/ai-companions.ts';
import { confirmAiVisit, GENTLE_INVITATION } from '../functions/_lib/ai-companions.ts';
import { mountAiCompanion } from '../src/lib/auth/ai-companion-ui.ts';

function environment(t) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/auth/0001_init.sql', import.meta.url), 'utf8'));
  db.exec(readFileSync(new URL('../migrations/auth/0016_ai_companions.sql', import.meta.url), 'utf8'));
  for (const id of ['alice', 'bob']) {
    db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(id, JSON.stringify({ userId: id, preferredName: id, identities: [] }), new Date().toISOString());
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run('session-' + id, id, Date.now() + 60000);
  }
  t.after(() => db.close());
  return { db, AUTH_DB: { prepare(sql) {
    return { args: [], bind(...args) { this.args = args; return this; },
      async first() { return db.prepare(sql).get(...this.args) ?? null; },
      async all() { return { results: db.prepare(sql).all(...this.args) }; },
      async run() { const r = db.prepare(sql).run(...this.args); return { success: true, meta: { changes: Number(r.changes) } }; },
    };
  } } };
}
function request(method = 'GET', body, user = 'alice', origin = 'https://pointcast.xyz') {
  return new Request('https://pointcast.xyz/api/me/ai-companions', {
    method, headers: { cookie: 'pc_session=session-' + user, origin, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function invitation(env, options = {}) {
  const response = await onRequestPost({ env, request: request('POST', { provider: 'claude', approach: 'subscription', gentle: false, ...options }) });
  assert.equal(response.status, 201);
  return response.json();
}

test('visit invitation is private, stores only a code hash, and never reports copied setup as confirmed', async (t) => {
  const env = environment(t);
  const issued = await invitation(env);
  assert.match(issued.code, /^[A-Za-z0-9_-]{43}$/);
  const row = env.db.prepare('SELECT * FROM ai_companions').get();
  assert.notEqual(row.code_hash, issued.code);
  assert.equal(row.confirmed_at, null);
  const response = await onRequestGet({ env, request: request() });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const data = await response.json();
  assert.equal(data.companions[0].status, 'waiting');
  assert.ok(!JSON.stringify(data).includes(issued.code));
  assert.ok(!JSON.stringify(data).includes(row.code_hash));
  assert.deepEqual((await (await onRequestGet({ env, request: request('GET', undefined, 'bob') })).json()).companions, []);
  assert.equal((await onRequestGet({ env, request: request('GET', undefined, 'nobody') })).status, 401);
});

test('agent confirmation consumes the code atomically, gives no private account data, and honors opt-in preference', async (t) => {
  const env = environment(t);
  const { code } = await invitation(env, { gentle: true });
  const results = await Promise.all([confirmAiVisit(env, { code }), confirmAiVisit(env, { code })]);
  assert.equal(results.filter((r) => !r.isError).length, 1);
  const output = JSON.parse(results.find((r) => !r.isError).content[0].text);
  assert.equal(output.confirmed, true);
  assert.equal(output.userSelectedPreference, GENTLE_INVITATION);
  assert.ok(!JSON.stringify(output).includes('alice'));
  assert.ok(!JSON.stringify(output).includes(code));
  const data = await (await onRequestGet({ env, request: request() })).json();
  assert.equal(data.companions[0].status, 'visit-confirmed');
  assert.ok(data.companions[0].confirmedAt);
  assert.equal(env.db.prepare('SELECT code_hash FROM ai_companions').get().code_hash, null);
});

test('expired, regenerated, and removed invitations cannot confirm a visit', async (t) => {
  const env = environment(t);
  const old = await invitation(env);
  const next = await invitation(env);
  assert.equal((await confirmAiVisit(env, { code: old.code })).isError, true);
  env.db.prepare('UPDATE ai_companions SET expires_at = ?').run(Date.now() - 1);
  assert.equal((await confirmAiVisit(env, { code: next.code })).isError, true);
  assert.equal((await (await onRequestGet({ env, request: request() })).json()).companions[0].status, 'expired');
  const fresh = await invitation(env);
  await onRequestDelete({ env, request: request('DELETE', { provider: 'claude' }, 'bob') });
  assert.equal((await (await onRequestGet({ env, request: request() })).json()).companions.length, 1);
  await onRequestDelete({ env, request: request('DELETE', { provider: 'claude' }) });
  assert.equal((await confirmAiVisit(env, { code: fresh.code })).isError, true);
  assert.equal((await (await onRequestGet({ env, request: request() })).json()).companions.length, 0);
});

test('browser writes reject cross-origin, malformed, unauthenticated, oversized, and unknown values', async (t) => {
  const env = environment(t);
  const body = { provider: 'claude', approach: 'subscription', gentle: false };
  assert.equal((await onRequestPost({ env, request: request('POST', body, 'alice', 'https://evil.example') })).status, 403);
  assert.equal((await onRequestPost({ env, request: request('POST', body, 'nobody') })).status, 401);
  for (const value of [null, [], { ...body, provider: 'admin' }, { ...body, approach: 'secret-key' }, { ...body, gentle: 'true' }]) {
    assert.equal((await onRequestPost({ env, request: request('POST', value) })).status, 400);
  }
  assert.equal((await onRequestPost({ env, request: request('POST', { ...body, huge: 'a'.repeat(2000) }) })).status, 413);
  assert.equal(env.db.prepare('SELECT count(*) AS count FROM ai_companions').get().count, 0);
  assert.equal((await onRequestGet({ env: {}, request: request() })).status, 503);
});

test('default visit does not insert personality preferences', async (t) => {
  const env = environment(t);
  const { code } = await invitation(env);
  const output = JSON.parse((await confirmAiVisit(env, { code })).content[0].text);
  assert.equal('userSelectedPreference' in output, false);
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
function domEnvironment(t) {
  const dom = new JSDOM('<section data-ai-companion><form data-ai-form><select name="provider"><option value="claude">Claude</option></select><select name="approach"><option value="subscription">Subscription</option></select><input name="gentle" type="checkbox"><button data-ai-create disabled></button></form><div data-ai-invitation hidden><textarea data-ai-prompt></textarea><button data-ai-copy></button><p data-ai-expiry></p></div><output data-ai-status></output><ul data-ai-list></ul><button data-ai-refresh></button></section>', { url: 'https://pointcast.xyz/me' });
  const keys = ['window', 'document', 'AbortController'];
  const prior = keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  for (const key of keys) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
  t.after(() => { dom.window.close(); for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  return dom;
}
test('AI UI clears private invitation on sign-out and ignores an old account response', async (t) => {
  const dom = domEnvironment(t);
  let resolvePost;
  let signedIn = true;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    if (init.method === 'POST') return new Promise((resolve) => { resolvePost = resolve; });
    return signedIn ? Response.json({ companions: [] }) : Response.json({}, { status: 401 });
  });
  const root = dom.window.document.querySelector('section');
  const cleanup = mountAiCompanion(root); t.after(cleanup);
  await tick();
  assert.equal(root.querySelector('[data-ai-create]').disabled, false);
  root.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  signedIn = false;
  dom.window.dispatchEvent(new dom.window.Event('pc:auth-change'));
  resolvePost(Response.json({ code: 'private-code', expiresAt: new Date(Date.now() + 60000).toISOString() }));
  await tick(); await tick();
  assert.equal(root.querySelector('[data-ai-invitation]').hidden, true);
  assert.equal(root.querySelector('textarea').value, '');
  assert.equal(root.querySelector('[data-ai-create]').disabled, true);
  assert.match(root.querySelector('output').textContent, /Sign in/);
});
test('AI UI renders server-confirmed receipt and expires one-time invitation without claiming persistent connection', async (t) => {
  const dom = domEnvironment(t);
  let confirmed = false;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    if (init.method === 'POST') return Response.json({ code: 'private-code', expiresAt: new Date(Date.now() + 60000).toISOString() });
    return Response.json({ companions: confirmed ? [{ provider: 'claude', status: 'visit-confirmed', confirmedAt: new Date().toISOString() }] : [] });
  });
  const root = dom.window.document.querySelector('section');
  const cleanup = mountAiCompanion(root); t.after(cleanup);
  await tick();
  root.querySelector('form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  await tick(); await tick();
  assert.equal(root.querySelector('[data-ai-invitation]').hidden, false);
  assert.match(root.querySelector('textarea').value, /private-code/);
  confirmed = true; root.querySelector('[data-ai-refresh]').click();
  await tick();
  assert.equal(root.querySelector('textarea').value, '');
  assert.match(root.querySelector('ul').textContent, /Visit confirmed/);
});

test('AI UI removes stale invitations after cross-tab deletion or replacement', async (t) => {
  const dom = domEnvironment(t);
  let receipt = null;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    if (init.method === 'POST') {
      receipt = { provider: 'claude', status: 'waiting', confirmedAt: null, invitationId: 'first' };
      return Response.json({ code: 'private-code', invitationId: 'first', expiresAt: new Date(Date.now() + 60000).toISOString() });
    }
    return Response.json({ companions: receipt ? [receipt] : [] });
  });
  const root = dom.window.document.querySelector('section');
  const cleanup = mountAiCompanion(root); t.after(cleanup);
  await tick();
  const submit = async () => {
    root.querySelector('form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    await tick(); await tick();
    assert.equal(root.querySelector('[data-ai-invitation]').hidden, false);
  };
  await submit();
  receipt = null;
  root.querySelector('[data-ai-refresh]').click(); await tick();
  assert.equal(root.querySelector('textarea').value, '');
  await submit();
  receipt.invitationId = 'replaced-in-another-tab';
  root.querySelector('[data-ai-refresh]').click(); await tick();
  assert.equal(root.querySelector('textarea').value, '');
});
