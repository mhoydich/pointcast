import test from 'node:test';
import assert from 'node:assert/strict';
import { SqliteD1, MemoryKV } from './helpers/me-d1.mjs';
import { handleKeeps } from '../functions/api/keeps.ts';
import { handleCollections } from '../functions/api/me/collections.ts';
import { handlePublic } from '../functions/api/me/_public.ts';
import { canPublishSavedSource } from '../functions/api/me/_public-eligibility.ts';

const USER = 'pcu_source_test';
const EXCERPT = 'REMOVED-SHORTWAVE-EXCERPT-should-stay-private';
const asUser = async () => ({ user: { userId: USER, identities: [], roles: [] }, session: { userId: USER } });
const request = (path, method = 'GET', body) => new Request(`https://pointcast.xyz${path}`, {
  method, headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', 'X-PointCast-Account': USER },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
async function ok(response) { const result = await response.json(); assert.equal(response.status, 200, JSON.stringify(result)); return result; }
async function fixture(t) {
  const db = new SqliteD1(['0029_me_keeps.sql', '0030_me_collections.sql']); t.after(() => db.close());
  const env = { AUTH_DB: db, VISITS: new MemoryKV(), ME_KEEPS_D1: '1' };
  const saved = await ok(await handleKeeps(request('/api/keeps', 'POST', { items: [
    { kind: 'post', postId: 'bar:source-id', text: EXCERPT, source: 'bar', note: 'private post note' },
    { kind: 'link', url: 'https://example.com/public', title: 'A public link' },
  ] }), env, asUser));
  const post = saved.keeps.find((k) => k.kind === 'post'), link = saved.keeps.find((k) => k.kind === 'link');
  const col = (body) => handleCollections(request('/api/me/collections', 'POST', body), env, asUser);
  const collection = (await ok(await col({ action: 'create', title: 'Mixed private collection', items: [{ keepId: post.id }, { keepId: link.id }] }))).collection;
  const pub = (json) => handlePublic(request(`/collections/${collection.id}${json ? '.json' : ''}`), env, 'collection', `${collection.id}${json ? '.json' : ''}`);
  return { db, env, post, link, collection, col, pub };
}

test('source publication policy fails closed for post and unknown shapes', () => {
  assert.equal(canPublishSavedSource({ kind: 'link' }), true);
  for (const value of [null, {}, [], { kind: 'post', source: 'bar' }, { kind: 'post', source: 'chain' }, { kind: 'unknown' }]) assert.equal(canPublishSavedSource(value), false);
});

test('selected post publication is refused without losing private data or blocking other selected links', async (t) => {
  const f = await fixture(t), c = f.collection;
  for (const action of ['preview', 'publish']) {
    const response = await f.col({ action, id: c.id, version: c.version, selectedKeepIds: [f.post.id, f.link.id], previewToken: 'not-permission' });
    assert.equal(response.status, 409);
    const value = await response.json(); assert.equal(value.reason, 'source-publication-unavailable'); assert.match(value.error, /private collection/);
  }
  const privateShelf = await ok(await handleKeeps(request('/api/keeps'), f.env, asUser));
  assert.equal(privateShelf.keeps.find((k) => k.id === f.post.id).text, EXCERPT);
  assert.equal(privateShelf.keeps.find((k) => k.id === f.post.id).note, 'private post note');
  const row = f.db.sqlite.prepare('SELECT items_json,published_json,version FROM me_collections WHERE id=?').get(c.id);
  assert.equal(JSON.parse(row.items_json).length, 2); assert.equal(row.published_json, null); assert.equal(row.version, c.version);
  const preview = await ok(await f.col({ action: 'preview', id: c.id, version: c.version, selectedKeepIds: [f.link.id] }));
  await ok(await f.col({ action: 'publish', id: c.id, version: c.version, selectedKeepIds: [f.link.id], previewToken: preview.previewToken }));
  const publicView = await ok(await f.pub(true));
  assert.deepEqual(publicView.items.map((item) => item.url), [f.link.url]);
  assert.equal(JSON.stringify(publicView).includes(EXCERPT), false);
});

test('every public response suppresses old post snapshots, including mislabeled snapshot entries', async (t) => {
  const f = await fixture(t), c = f.collection;
  const postMember = c.items.find((item) => item.keepId === f.post.id), linkMember = c.items.find((item) => item.keepId === f.link.id);
  const snapshot = { title: c.title, description: '', items: [
    { ...postMember, kind: 'post', title: EXCERPT, url: 'https://pointcast.xyz/shortwave#bar%3Asource-id', site: 'Shortwave', caption: 'removed excerpt' },
    { ...postMember, kind: 'link', title: EXCERPT, url: f.link.url, site: 'historical malformed card', caption: '' },
    { ...linkMember, kind: 'link', title: f.link.title, url: f.link.url, site: 'example.com', caption: '' },
  ] };
  f.db.sqlite.prepare('UPDATE me_collections SET published_json=?,published_at=? WHERE id=?').run(JSON.stringify(snapshot), new Date().toISOString(), c.id);
  // Missing/unavailable original sources cannot make a stored excerpt public.
  f.env.VISITS.get = async () => { throw Error('source lookup unavailable'); };
  const publicView = await ok(await f.pub(true));
  assert.equal(publicView.items.length, 1); assert.equal(publicView.items[0].url, f.link.url);
  assert.equal(JSON.stringify(publicView).includes(EXCERPT), false);
  const html = await f.pub(false); assert.equal(html.status, 200); assert.equal((await html.text()).includes(EXCERPT), false);
  const privatePost = f.db.sqlite.prepare('SELECT data_json FROM me_keeps WHERE user_id=? AND id=?').get(USER, f.post.id);
  assert.equal(JSON.parse(privatePost.data_json).text, EXCERPT);
});
