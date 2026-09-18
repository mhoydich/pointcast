import test from 'node:test';
import assert from 'node:assert/strict';
import { handleShortwave, normalizePost } from '../functions/api/shortwave.ts';
class Store {
  data = new Map(); writes = []; failWrite = false;
  async get(key, type) { const v = this.data.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; }
  async put(key, value, options) { if (this.failWrite) throw Error('offline'); this.data.set(key, value); this.writes.push({ key, options }); }
  async list({ prefix, limit, cursor }) { const names = [...this.data.keys()].filter((k) => k.startsWith(prefix)).sort(); const start = Number(cursor || 0), slice = names.slice(start, start + limit); return { keys: slice.map((name) => ({ name })), list_complete: start + limit >= names.length, cursor: String(start + limit) }; }
}
const env = () => ({ VISITS: new Store(), PC_RATES_KV: new Store() });
const URL_ = 'https://pointcast.xyz/api/shortwave';
const post = (b) => new Request(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.9' }, body: JSON.stringify(b) });
test('a post from the bar is saved for a year and read back newest first', async () => {
  const e = env(); await e.VISITS.put('unrelated:private', 'secret');
  const first = await handleShortwave(post({ text: 'first light 📍 33.92,-118.42', who: 'tz2FjJ…xdFw', noun: 233 }), e);
  assert.equal(first.status, 201);
  assert.equal(e.VISITS.writes.at(-1).options.expirationTtl, 31536000);
  await new Promise((r) => setTimeout(r, 3));
  await handleShortwave(post({ text: 'second' }), e);
  const feed = await (await handleShortwave(new Request(URL_), e)).json();
  assert.deepEqual(feed.posts.map((p) => p.text), ['second', 'first light 📍 33.92,-118.42']);
  assert.equal(feed.posts[1].noun, 233); assert.equal(feed.posts[0].who, 'visitor'); assert.equal(feed.posts[0].via, 'bar');
  assert.ok(!JSON.stringify(feed).includes('secret'));
});
test('bounds: 280 code points, plain text, known via, noun range', () => {
  assert.equal(Array.from(normalizePost({ text: '🎺'.repeat(280) }).text).length, 280);
  for (const bad of [{ text: '' }, { text: 'x'.repeat(281) }, { text: 5 }, { text: 'ok', who: 9 }, { text: 'ok', noun: 1200 }, { text: 'ok', noun: 1.5 }, { text: 'ok', via: 'system' }, { text: 'a' + String.fromCharCode(7) + 'b' }, []]) assert.throws(() => normalizePost(bad));
  assert.equal(normalizePost({ text: '  <b>hi</b>\n there ' }).text, '<b>hi</b> there');
});
test('quota, missing bindings and failed writes never report success', async () => {
  const e = env();
  for (let i = 0; i < 20; i++) assert.equal((await handleShortwave(post({ text: 'n' + i }), e)).status, 201);
  const blocked = await handleShortwave(post({ text: 'one more' }), e);
  assert.equal(blocked.status, 429); assert.ok(Number(blocked.headers.get('Retry-After')) > 0);
  assert.equal((await handleShortwave(post({ text: 'x' }), { VISITS: new Store() })).status, 503);
  const failed = env(); failed.VISITS.failWrite = true;
  assert.equal((await handleShortwave(post({ text: 'x' }), failed)).status, 503);
  assert.equal((await handleShortwave(new Request(URL_, { method: 'POST', body: '{}' }), env())).status, 400);
});
test('the list is cacheable for the bar poll, pages are not, CORS is open', async () => {
  const e = env();
  for (let i = 0; i < 45; i++) await e.VISITS.put('shortwave:post:v1:' + String(i).padStart(3, '0'), JSON.stringify({ id: String(i), text: 't' + i }));
  const one = await handleShortwave(new Request(URL_), e); const a = await one.json();
  assert.match(one.headers.get('Cache-Control'), /s-maxage=20/); assert.equal(a.posts.length, 40);
  const two = await handleShortwave(new Request(URL_ + '?cursor=' + a.nextCursor), e);
  assert.equal(two.headers.get('Cache-Control'), 'no-store'); assert.equal((await two.json()).posts.length, 5);
  const o = await handleShortwave(new Request(URL_, { method: 'OPTIONS' }), e);
  assert.equal(o.status, 204); assert.equal(o.headers.get('Access-Control-Allow-Origin'), '*');
});
