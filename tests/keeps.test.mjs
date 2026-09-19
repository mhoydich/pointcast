import test from 'node:test';
import assert from 'node:assert/strict';
import { handleKeeps, normalizeKeep } from '../functions/api/keeps.ts';
class Store { data = new Map(); fail = false; async get(k, t) { const v = this.data.get(k); return v === undefined ? null : t === 'json' ? JSON.parse(v) : v; } async put(k, v) { if (this.fail) throw Error('offline'); this.data.set(k, v); } }
const URL_ = 'https://pointcast.xyz/api/keeps';
const as = (userId) => async () => (userId ? { user: { userId } } : null);
const req = (method, body, extra = {}) => new Request(URL_, { method, headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
const postKeep = { kind: 'post', postId: '8210-abc', text: 'coffee is on #morning', who: 'tz2FjJ…xdFw', noun: 233, postAt: '2026-09-19T16:00:00.000Z', source: 'bar' };
const linkKeep = { kind: 'link', url: 'https://open.spotify.com/track/7vooILIm1H', title: 'Set Adrift on Memory Bliss', site: 'Spotify', image: 'https://i.scdn.co/image/abc' };
test('a member keeps a post and a link, newest first, and can let one go', async () => {
  const env = { VISITS: new Store() };
  assert.equal((await handleKeeps(req('POST', { item: postKeep }), env, as('pcu_1'))).status, 200);
  const two = await (await handleKeeps(req('POST', { item: linkKeep }), env, as('pcu_1'))).json();
  assert.deepEqual(two.keeps.map((k) => k.kind).sort(), ['link', 'post']);
  const again = await (await handleKeeps(req('POST', { item: postKeep }), env, as('pcu_1'))).json(); assert.equal(again.keeps.length, 2);
  const other = await (await handleKeeps(req('GET'), env, as('pcu_2'))).json(); assert.equal(other.keeps.length, 0);
  const gone = await (await handleKeeps(req('DELETE', { id: 'post:8210-abc' }), env, as('pcu_1'))).json();
  assert.deepEqual(gone.keeps.map((k) => k.id), ['link:https://open.spotify.com/track/7vooILIm1H']);
});
test('no session, cross-site writes and bad shapes are refused; storage failure is not success', async () => {
  const env = { VISITS: new Store() };
  assert.equal((await handleKeeps(req('GET'), env, as(null))).status, 401);
  assert.equal((await handleKeeps(req('POST', { item: postKeep }, { 'Sec-Fetch-Site': 'cross-site' }), env, as('pcu_1'))).status, 403);
  assert.equal((await handleKeeps(req('POST', { item: { kind: 'link', url: 'http://insecure.example/x' } }), env, as('pcu_1'))).status, 400);
  env.VISITS.fail = true; assert.equal((await handleKeeps(req('POST', { item: postKeep }), env, as('pcu_1'))).status, 503);
  assert.equal((await handleKeeps(req('GET'), {}, as('pcu_1'))).status, 503);
});
test('a browser shelf merges in on sign-in, bounded and cleaned', async () => {
  const env = { VISITS: new Store() };
  const items = [postKeep, linkKeep, { kind: 'nope' }, { ...linkKeep, url: 'https://site.com/a', image: 'http://insecure/x.png', title: 'x'.repeat(400), keptAt: '2999-01-01T00:00:00Z' }];
  const merged = await (await handleKeeps(req('POST', { items }), env, as('pcu_9'))).json();
  assert.equal(merged.keeps.length, 3);
  const k = merged.keeps.find((x) => x.url === 'https://site.com/a'); assert.equal(k.image, ''); assert.equal(k.title.length, 160); assert.ok(Date.parse(k.keptAt) <= Date.now());
  assert.throws(() => normalizeKeep({ kind: 'post', text: 'no id' })); assert.equal(normalizeKeep({ ...postKeep, noun: 5000 }).noun, 0);
});
