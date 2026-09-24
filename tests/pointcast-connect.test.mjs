import test from 'node:test';
import assert from 'node:assert/strict';
import { handleConnect } from '../functions/_lib/pointcast-connect-http.ts';
import { normalizeClient, normalizeRedirect, normalizeScope, pairwiseSub } from '../functions/_lib/pointcast-connect.ts';

class Store {
  data = new Map();
  async get(key, type) { const v = this.data.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; }
  async put(key, value) { this.data.set(key, value); }
  async delete(key) { this.data.delete(key); }
}
const TZ = 'tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY';
const ann = { userId: 'pcu_ann', preferredName: 'Ann', identities: [{ provider: 'kukai', id: TZ, name: 'a', verifiedAt: '' }] };
const env = () => { const e = { VISITS: new Store(), USERS: new Store() }; e.VISITS.data.set('card:v1:user:pcu_ann', JSON.stringify({ handle: 'ann', name: 'Ann', noun: 3, bio: 'b', now: '', place: 'El Segundo', song: '', links: [], color: '#185fa5', wallet: '', onchain: null })); return e; };
const signedIn = { readSession: async () => ({ user: ann }) };
const APP = 'https://tonebloom.xyz';
const approve = (e, body, headers = { 'Sec-Fetch-Site': 'same-origin' }) => handleConnect(new Request('https://pointcast.xyz/api/connect/authorize', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }), e, 'authorize', signedIn);
const trade = (e, body, origin) => handleConnect(new Request('https://pointcast.xyz/api/connect/token', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) }), e, 'token');

test('apps are origins: https anywhere, http only on localhost, no paths, redirects stay home', () => {
  assert.equal(normalizeClient('https://tonebloom.xyz'), APP);
  assert.equal(normalizeClient('http://localhost:5173'), 'http://localhost:5173');
  for (const bad of ['http://tonebloom.xyz', 'https://tonebloom.xyz/app', 'javascript:alert(1)', 'https://user@x.com', 'tonebloom.xyz', 'https://localhost:3000/x']) assert.equal(normalizeClient(bad), null, bad);
  assert.equal(normalizeRedirect('https://tonebloom.xyz/cb?x=1', APP), 'https://tonebloom.xyz/cb?x=1');
  assert.equal(normalizeRedirect('https://evil.example/cb', APP), null);
  assert.deepEqual(normalizeScope('wallet admin'), ['card', 'wallet']); assert.deepEqual(normalizeScope(''), ['card']);
});

test('the full handshake: consent preview, one-time code, exchange returns exactly what was shown', async () => {
  const e = env();
  const shown = await (await handleConnect(new Request(`https://pointcast.xyz/api/connect/authorize?client=${encodeURIComponent(APP)}&scope=card+wallet`), e, 'authorize', signedIn)).json();
  assert.equal(shown.app.name, 'Tone Bloom'); assert.equal(shown.app.known, true); assert.equal(shown.card.handle, 'ann'); assert.equal(shown.wallet, TZ);
  const granted = await (await approve(e, { client: APP, scope: ['card', 'wallet'] })).json();
  assert.equal(granted.ok, true); assert.equal(granted.expiresIn, 120); assert.match(granted.code, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(![...e.USERS.data.keys()].some((k) => k.includes(granted.code)), 'the raw code is never stored');
  const res = await trade(e, { code: granted.code, client: APP }, APP);
  const id = await res.json();
  assert.equal(res.status, 200); assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(id.aud, APP); assert.equal(id.card.handle, 'ann'); assert.equal(id.wallet, TZ); assert.equal(id.access, 'none-ongoing');
  assert.ok(!JSON.stringify(id).includes('pcu_ann'), 'the account id never leaves PointCast');
  const grants = await (await handleConnect(new Request('https://pointcast.xyz/api/connect/grants'), e, 'grants', signedIn)).json();
  assert.equal(grants.grants[0].client, APP); assert.equal(grants.grants[0].count, 1);
});

test('codes work once, only for their app, only from that app or a server, and never without asking for wallet', async () => {
  const e = env();
  const stolen = (await (await approve(e, { client: APP, scope: 'card' })).json()).code;
  assert.equal((await trade(e, { code: stolen, client: 'https://evil.example' }, 'https://evil.example')).status, 400);
  assert.equal((await trade(e, { code: stolen, client: APP })).status, 400, 'a code shown to the wrong site is burned');
  const { code } = await (await approve(e, { client: APP, scope: 'card' })).json();
  assert.equal((await trade(e, { code, client: APP }, 'https://evil.example')).status, 403);
  const server = await (await trade(e, { code, client: APP })).json();
  assert.equal(server.ok, true); assert.equal(server.wallet, undefined);
  assert.equal((await trade(e, { code, client: APP })).status, 400, 'second use fails');
  assert.equal((await trade(e, { code: 'x'.repeat(43), client: APP })).status, 400);
});

test('each app sees a different id for the same person; the same app always sees the same one', async () => {
  const a1 = await pairwiseSub('pcu_ann', APP), a2 = await pairwiseSub('pcu_ann', APP), b = await pairwiseSub('pcu_ann', 'https://industrynext.xyz');
  assert.equal(a1, a2); assert.notEqual(a1, b); assert.match(a1, /^pc_[A-Za-z0-9_-]{32}$/);
  const e = env();
  const one = await (await trade(e, { code: (await (await approve(e, { client: APP })).json()).code, client: APP })).json();
  const two = await (await trade(e, { code: (await (await approve(e, { client: 'https://industrynext.xyz' })).json()).code, client: 'https://industrynext.xyz' })).json();
  assert.equal(one.sub, a1); assert.notEqual(one.sub, two.sub);
});

test('only PointCast pages can approve, and only signed-in members', async () => {
  const e = env();
  assert.equal((await approve(e, { client: APP }, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await approve(e, { client: APP }, { Origin: APP })).status, 403);
  const anon = await handleConnect(new Request('https://pointcast.xyz/api/connect/authorize', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' }, body: JSON.stringify({ client: APP }) }), e, 'authorize', { readSession: async () => null });
  assert.equal(anon.status, 401);
  assert.equal((await approve(e, { client: 'http://tonebloom.xyz' })).status, 400);
  const pre = await handleConnect(new Request('https://pointcast.xyz/api/connect/token', { method: 'OPTIONS' }), e, 'token');
  assert.equal(pre.status, 204); assert.equal(pre.headers.get('Access-Control-Allow-Origin'), '*');
});
