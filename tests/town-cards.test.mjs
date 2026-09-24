import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleCard } from '../functions/api/card.ts';
import { handleShortwave } from '../functions/api/shortwave.ts';
import { PROFILE_CONTRACT, normalizeCardInput } from '../functions/_lib/town-card.ts';

class Store {
  data = new Map();
  async get(key, type) { const v = this.data.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; }
  async put(key, value) { this.data.set(key, value); }
  async delete(key) { this.data.delete(key); }
  async list({ prefix, limit, cursor }) { const names = [...this.data.keys()].filter((k) => k.startsWith(prefix)).sort(); const start = Number(cursor || 0), slice = names.slice(start, start + limit); return { keys: slice.map((name) => ({ name })), list_complete: start + limit >= names.length, cursor: String(start + limit) }; }
}
const TZ_A = 'tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY';
const TZ_B = 'tz2FjJhB1d7fXkjZ3tMoP7Jc4eT9PqWn7xdF';
const users = {
  ann: { userId: 'pcu_ann', preferredName: 'Ann', identities: [{ provider: 'kukai', id: TZ_A, name: 'a', verifiedAt: '' }] },
  bo: { userId: 'pcu_bo', preferredName: 'Bo', identities: [{ provider: 'google', id: 'g1', name: 'Bo', verifiedAt: '' }] },
  cy: { userId: 'pcu_cy', preferredName: 'Cy', identities: [{ provider: 'kukai', id: TZ_B, name: 'c', verifiedAt: '' }] },
};
const env = () => ({ VISITS: new Store(), PC_RATES_KV: new Store() });
const as = (u) => ({ readSession: async () => (u ? { user: u } : null), readProfile: async (_c, h) => (h === 'onchain' ? { owner: TZ_B, tokenId: 7 } : null) });
const save = (e, u, card, headers = { 'Sec-Fetch-Site': 'same-origin' }) => handleCard(new Request('https://pointcast.xyz/api/card', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ card }) }), e, as(u));

test('the profile contract constant matches contracts.json', () => {
  assert.equal(PROFILE_CONTRACT, JSON.parse(readFileSync(new URL('../src/data/contracts.json', import.meta.url))).profile_objects.mainnet);
});

test('a member claims a handle; a second member cannot take it; the public card hides nothing it should show and nothing it should not', async () => {
  const e = env();
  const res = await save(e, users.ann, { handle: '@Ann-Z', name: 'Ann ✓', noun: 12, bio: 'hi', song: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc', links: [{ url: 'example.com', label: '' }], color: '#2F8F4E', wallet: TZ_A });
  const saved = await res.json();
  assert.equal(res.status, 200, JSON.stringify(saved));
  assert.equal(saved.card.handle, 'ann-z'); assert.equal(saved.card.name, 'Ann'); assert.equal(saved.card.song, 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC');
  assert.deepEqual(saved.card.links, [{ url: 'https://example.com/', label: 'example.com' }]); assert.equal(saved.card.color, '#2f8f4e');
  const taken = await save(e, users.bo, { handle: 'ann-z' });
  assert.equal(taken.status, 409); assert.equal((await taken.json()).reason, 'handle-taken');
  const pub = await handleCard(new Request('https://pointcast.xyz/api/card?handle=ANN-Z'), e, as(null));
  const body = await pub.json();
  assert.equal(pub.status, 200); assert.equal(body.card.wallet, TZ_A); assert.equal(pub.headers.get('Access-Control-Allow-Origin'), '*');
  assert.ok(!JSON.stringify(body).includes('pcu_ann'));
  assert.equal((await handleCard(new Request('https://pointcast.xyz/api/card?handle=nobody'), e, as(null))).status, 404);
});

test('changing a handle frees the old one', async () => {
  const e = env();
  await save(e, users.ann, { handle: 'first' });
  assert.equal((await save(e, users.ann, { handle: 'second' })).status, 200);
  assert.equal((await save(e, users.bo, { handle: 'first' })).status, 200);
});

test('Tezos rules: a held handle needs the holding wallet, and the holder takes it back from an off-chain card', async () => {
  const e = env();
  const blocked = await save(e, users.ann, { handle: 'onchain' });
  assert.equal(blocked.status, 409); assert.equal((await blocked.json()).reason, 'held-on-chain');
  // Bo got there before the on-chain claim existed.
  const early = env();
  await early.VISITS.put('card:v1:handle:onchain', 'pcu_bo');
  await early.VISITS.put('card:v1:user:pcu_bo', JSON.stringify({ handle: 'onchain', name: 'Bo', noun: 0, onchain: null }));
  const res = await save(early, users.cy, { handle: 'onchain' });
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body)); assert.equal(body.card.onchain.tokenId, 7);
  assert.equal(JSON.parse(early.VISITS.data.get('card:v1:user:pcu_bo')).released, true);
  // A chain outage saves nothing.
  const down = await handleCard(new Request('https://pointcast.xyz/api/card', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' }, body: JSON.stringify({ handle: 'quiet' }) }), env(), { ...as(users.ann), readProfile: async () => { throw Error('tzkt'); } });
  assert.equal(down.status, 503);
});

test('bounds: reserved handles, wallets you do not hold, bad songs and links, cross-site writes, no session', async () => {
  for (const bad of [{ handle: 'ab' }, { handle: 'admin' }, { handle: 'ok-handle', wallet: TZ_B }, { handle: 'ok-handle', song: 'https://evil.example/track/x' }, { handle: 'ok-handle', links: [{ url: 'javascript:alert(1)' }] }, { handle: 'ok-handle', links: [1, 2, 3, 4] }, { handle: 'ok-handle', noun: 1200 }]) {
    assert.throws(() => normalizeCardInput(bad, users.ann), JSON.stringify(bad));
  }
  assert.equal((await save(env(), users.ann, { handle: 'fine' }, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await save(env(), null, { handle: 'fine' })).status, 401);
});

test('a member post carries the card, not what the page claimed; others stay self-reported and cannot fake a check or @', async () => {
  const e = env();
  await save(e, users.ann, { handle: 'ann', name: 'Ann Real', noun: 44, color: '#c0262d' });
  const post = (b, u, h = { 'Sec-Fetch-Site': 'same-origin' }) => handleShortwave(new Request('https://pointcast.xyz/api/shortwave', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...h }, body: JSON.stringify(b) }), e, { readSession: async () => (u ? { user: u } : null) });
  const mine = await (await post({ text: 'hello #town', who: 'Somebody Else', noun: 1 }, users.ann)).json();
  assert.equal(mine.post.who, 'Ann Real'); assert.equal(mine.post.noun, 44); assert.equal(mine.post.handle, 'ann'); assert.equal(mine.post.verified, true); assert.equal(mine.post.attribution, 'card');
  const fake = await (await post({ text: 'I am ann', who: '@Ann Real ✓' }, null)).json();
  assert.equal(fake.post.who, 'Ann Real'); assert.equal(fake.post.verified, undefined); assert.equal(fake.post.handle, undefined); assert.equal(fake.post.attribution, 'self-reported');
  const crossSite = await (await post({ text: 'from elsewhere' }, users.ann, { 'Sec-Fetch-Site': 'cross-site' })).json();
  assert.equal(crossSite.post.verified, undefined);
  const broken = await (await handleShortwave(new Request('https://pointcast.xyz/api/shortwave', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' }, body: '{"text":"still posts"}' }), e, { readSession: async () => { throw Error('d1 down'); } })).json();
  assert.equal(broken.ok, true); assert.equal(broken.post.attribution, 'self-reported');
  const profile = await (await handleShortwave(new Request('https://pointcast.xyz/api/shortwave?handle=ann'), e)).json();
  assert.deepEqual(profile.posts.map((p) => p.text), ['hello #town']);
  assert.equal((await handleShortwave(new Request('https://pointcast.xyz/api/shortwave?handle=ghost'), e)).status, 404);
});
