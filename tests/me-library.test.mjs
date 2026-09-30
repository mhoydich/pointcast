import test from 'node:test';
import assert from 'node:assert/strict';
import { SqliteD1, MemoryKV } from './helpers/me-d1.mjs';
import { handleKeeps } from '../functions/api/keeps.ts';
import { handleCollections } from '../functions/api/me/collections.ts';
import { handleProfile } from '../functions/api/me/profile.ts';
import { handleExport } from '../functions/api/me/export.ts';
import { handleReport } from '../functions/api/me/report.ts';
import { handleModerate } from '../functions/api/me/moderate.ts';
import { handlePublic } from '../functions/api/me/_public.ts';

const A = 'pcu_a', B = 'pcu_b';
const as = (userId, roles = []) => async () => userId ? { user: { userId, preferredName: userId === A ? 'Alice private name' : 'Bob private name', identities: [], roles }, session: { userId, sessionToken: 'server-only-test-token', expiresAt: '2026-12-01T00:00:00.000Z' } } : null;
const req = (path, method = 'GET', data, userId = A, headers = {}) => new Request(`https://pointcast.xyz${path}`, { method, headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', ...(userId ? { 'X-PointCast-Account': userId } : {}), ...headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
const draft = (n, extra = {}) => ({ kind: 'link', url: `https://example.com/${n}`, title: `Item ${n}`, note: `PRIVATE-NOTE-${n}`, ...extra });

function fixture(t) {
  const db = new SqliteD1(['0029_me_keeps.sql', '0030_me_collections.sql']);
  t.after(() => db.close());
  const env = { AUTH_DB: db, VISITS: new MemoryKV(), ME_KEEPS_D1: '1' };
  const col = (data, userId = A) => handleCollections(req('/api/me/collections', data ? 'POST' : 'GET', data, userId), env, as(userId));
  const profile = (data, userId = A) => handleProfile(req('/api/me/profile', data ? 'POST' : 'GET', data, userId), env, as(userId));
  const pub = (kind, id, json = true, method = 'GET') => handlePublic(req(`/${kind === 'collection' ? 'collections' : 'people'}/${id}${json ? '.json' : ''}`, method), env, kind, id + (json ? '.json' : ''));
  const keeps = (method, data, userId = A) => handleKeeps(req('/api/keeps', method, data, userId), env, as(userId));
  return { db, env, col, profile, pub, keeps,
    async add(n, extra, userId = A) { const body = await good(await keeps('POST', { item: draft(n, extra) }, userId)); return body.keeps.find((k) => k.url === draft(n, extra).url); },
    async create(title, items = [], userId = A) { return (await good(await col({ action: 'create', title, items: items.map((k) => ({ keepId: k.id, caption: `Public caption for ${k.title}` })) }, userId))).collection; },
    async update(row, data, userId = A) { return (await good(await col({ action: 'update', id: row.id, version: row.version, ...data }, userId))).collection; },
    async publish(row, selected = row.items.map((m) => m.keepId), userId = A) {
      const preview = await good(await col({ action: 'preview', id: row.id, version: row.version, selectedKeepIds: selected }, userId));
      return (await good(await col({ action: 'publish', id: row.id, version: row.version, selectedKeepIds: selected, previewToken: preview.previewToken }, userId))).collection;
    },
    async publishProfile(row, userId = A) {
      const preview = await good(await profile({ action: 'preview', version: row.version }, userId));
      return (await good(await profile({ action: 'publish', version: row.version, previewToken: preview.previewToken }, userId))).profile;
    },
  };
}
async function good(response) { const value = await response.json(); assert.equal(response.status, 200, JSON.stringify(value)); assert.equal(value.ok, true); return value; }
async function reason(response, status, expected) { const value = await response.json(); assert.equal(response.status, status, JSON.stringify(value)); if (expected) assert.equal(value.reason, expected); return value; }


test('private APIs enforce auth, owner access, origin, and the account-bound write header', async (t) => {
  const f = fixture(t), item = await f.add(1), row = await f.create('Private collection', [item]);
  await reason(await f.col(undefined, null), 401, 'unauthorized');
  await reason(await f.col({ action: 'update', id: row.id, version: row.version, title: 'Stolen' }, B), 404, 'not-found');
  await reason(await f.col({ action: 'create', title: 'Foreign keep', items: [{ keepId: item.id }] }, B), 400, 'missing-keep');
  assert.deepEqual((await good(await f.col(undefined, B))).collections, []);
  await reason(await handleCollections(req('/api/me/collections', 'POST', { action: 'create', title: 'Cross site' }, A, { Origin: 'https://elsewhere.example' }), f.env, as(A)), 403, 'cross-site');
  await reason(await handleProfile(req('/api/me/profile', 'POST', { action: 'update', version: 1, name: 'Wrong account' }, A), f.env, as(B)), 409, 'account-changed');
  await reason(await handleCollections(req('/api/me/collections', 'POST', { action: 'create', title: 'Unbound' }, null), f.env, as(A)), 400, 'account-required');
  for (const json of [true, false]) assert.equal((await f.pub('collection', row.id, json)).status, 404);
  assert.equal(f.db.sqlite.prepare('SELECT count(*) AS n FROM me_profiles WHERE user_id=?').get(B).n, 0, 'mismatched account request never creates B profile');
});

test('collection and profile updates reject stale versions without losing newer edits', async (t) => {
  const f = fixture(t); let c = await f.create('Original'); const oldVersion = c.version;
  c = await f.update(c, { title: 'Current' });
  await reason(await f.col({ action: 'update', id: c.id, version: oldVersion, title: 'Stale' }), 409, 'conflict');
  assert.equal((await good(await f.col())).collections[0].title, 'Current');
  let p = (await good(await f.profile())).profile; const v = p.version;
  p = (await good(await f.profile({ action: 'update', version: v, name: 'Current profile' }))).profile;
  await reason(await f.profile({ action: 'update', version: v, name: 'Stale profile' }), 409, 'conflict');
  assert.equal((await good(await f.profile())).profile.name, 'Current profile');
});

test('publication uses only the selected public-safe subset and never includes private notes or internal IDs', async (t) => {
  const f = fixture(t), first = await f.add(1), privateLink = await f.add(2, { url: 'https://example.com/private?token=private-value' });
  let c = await f.create('Chosen public items', [first, privateLink]);
  await reason(await f.col({ action: 'preview', id: c.id, version: c.version, selectedKeepIds: [privateLink.id] }), 400, 'private-url');
  const preview = await good(await f.col({ action: 'preview', id: c.id, version: c.version, selectedKeepIds: [first.id] }));
  assert.equal(preview.preview.items.length, 1);
  assert.deepEqual(Object.keys(preview.preview.items[0]).sort(), ['caption', 'kind', 'site', 'title', 'url']);
  c = await f.publish(c, [first.id]);
  const body = await good(await f.pub('collection', c.id));
  assert.equal(body.items.length, 1); assert.equal(body.items[0].url, first.url);
  const serialized = JSON.stringify(body);
  for (const forbidden of ['PRIVATE-NOTE', 'private-value', 'userId', 'keepId', 'itemId', 'membershipId', 'server-only-test-token', A]) assert.equal(serialized.includes(forbidden), false, forbidden);
  const html = await (await f.pub('collection', c.id, false)).text();
  assert.equal(html.includes('PRIVATE-NOTE'), false); assert.equal(html.includes('private-value'), false);
  await reason(await f.col({ action: 'preview', id: c.id, version: c.version, selectedKeepIds: ['missing'] }), 400, 'invalid-selection');
});

test('draft title, caption and order changes do not alter public content until explicitly published', async (t) => {
  const f = fixture(t), first = await f.add(1), second = await f.add(2);
  let c = await f.publish(await f.create('Published title', [first, second]));
  c = await f.update(c, { title: 'Draft title', items: [{ keepId: second.id, caption: 'New second caption' }, { keepId: first.id, caption: 'New first caption' }] });
  let publicView = await good(await f.pub('collection', c.id));
  assert.equal(publicView.title, 'Published title'); assert.equal(publicView.items[0].url, first.url); assert.notEqual(publicView.items[0].caption, 'New first caption');
  c = await f.publish(c);
  publicView = await good(await f.pub('collection', c.id));
  assert.equal(publicView.title, 'Draft title'); assert.equal(publicView.items[0].url, second.url); assert.equal(publicView.items[0].caption, 'New second caption');
});

test('membership removal withdraws only one collection and readding it cannot resurrect the previous publication', async (t) => {
  const f = fixture(t), item = await f.add(1);
  let first = await f.publish(await f.create('First', [item]));
  const second = await f.publish(await f.create('Second', [item]));
  const priorMembership = first.items[0].membershipId;
  first = await f.update(first, { items: [] });
  assert.equal((await good(await f.pub('collection', first.id))).items.length, 0);
  assert.equal((await good(await f.pub('collection', second.id))).items.length, 1);
  first = await f.update(first, { items: [{ keepId: item.id, caption: 'Added again' }] });
  assert.notEqual(first.items[0].membershipId, priorMembership);
  assert.equal((await good(await f.pub('collection', first.id))).items.length, 0);
  first = await f.publish(first);
  assert.equal((await good(await f.pub('collection', first.id))).items.length, 1);
  await good(await f.col({ action: 'delete', id: first.id, version: first.version }));
  assert.equal((await f.pub('collection', first.id)).status, 404);
  assert.equal((await good(await f.keeps('GET'))).keeps.length, 1, 'deleting collection preserves source keep');
});

test('deleting and re-saving a keep withdraws all old public references until membership is reviewed again', async (t) => {
  const f = fixture(t), item = await f.add(1);
  let first = await f.publish(await f.create('First', [item])); const second = await f.publish(await f.create('Second', [item]));
  await good(await f.keeps('DELETE', { id: item.id }));
  for (const c of [first, second]) assert.equal((await good(await f.pub('collection', c.id))).items.length, 0);
  const replacement = await f.add(1); assert.notEqual(item.itemId, replacement.itemId);
  for (const c of [first, second]) assert.equal((await good(await f.pub('collection', c.id))).items.length, 0);
  await reason(await f.col({ action: 'preview', id: first.id, version: first.version, selectedKeepIds: [item.id] }), 409, 'missing-keep');
  first = await f.update(first, { items: [{ keepId: replacement.id, caption: 'Reviewed replacement' }] });
  assert.equal((await good(await f.pub('collection', first.id))).items.length, 0);
  first = await f.publish(first);
  assert.equal((await good(await f.pub('collection', first.id))).items.length, 1);
  assert.equal((await good(await f.pub('collection', second.id))).items.length, 0);
});

test('owner collection views omit deleted memberships and readding an alias does not revive them', async (t) => {
  const f = fixture(t), item = await f.add(1);
  let c = await f.publish(await f.create('Owner projection', [item]));
  const originalVersion = c.version;
  await good(await f.keeps('DELETE', { id: item.id, version: item.version, expectedItemId: item.itemId }));
  c = (await good(await f.col())).collections[0];
  assert.deepEqual(c.items, []); assert.equal(c.version, originalVersion);
  const replacement = await f.add(1);
  assert.notEqual(replacement.itemId, item.itemId);
  c = (await good(await f.col())).collections[0];
  assert.deepEqual(c.items, []); assert.equal(c.version, originalVersion);
  const exportResponse = await handleExport(req('/api/me/export'), f.env, as(A));
  assert.equal(exportResponse.status, 200);
  const exported = await exportResponse.json();
  assert.deepEqual(exported.collections[0].items, []);
  assert.equal(exported.collections[0].publishedSnapshot.items.length, 1, 'owner export preserves historical publication snapshots');
  c = await f.update(c, { title: 'Renamed privately' });
  assert.deepEqual(c.items, [], 'metadata update response omits old member identities');
  c = await f.publish(c, []);
  assert.deepEqual(c.items, [], 'publication response omits old member identities');
  c = await f.update(c, { items: [] });
  assert.deepEqual(JSON.parse(f.db.sqlite.prepare('SELECT items_json FROM me_collections WHERE id=?').get(c.id).items_json), [], 'explicit membership edit removes stored historical references');
});

test('a preview token is invalid when a displayed saved-card title changes before publish', async (t) => {
  const f = fixture(t), item = await f.add(1), c = await f.create('Preview', [item]);
  const selectedKeepIds = [item.id];
  const preview = await good(await f.col({ action: 'preview', id: c.id, version: c.version, selectedKeepIds }));
  await good(await f.keeps('PATCH', { id: item.id, title: 'Changed on another device', version: item.version, expectedItemId: item.itemId }));
  await reason(await f.col({ action: 'publish', id: c.id, version: c.version, selectedKeepIds, previewToken: preview.previewToken }), 409, 'preview-changed');
  assert.equal((await f.pub('collection', c.id)).status, 404);
  const published = await f.publish(c);
  assert.equal((await good(await f.pub('collection', published.id))).items[0].title, 'Changed on another device');
});

test('profile featured collections require ownership and publication; public filtering withdraws hidden or private features', async (t) => {
  const f = fixture(t), item = await f.add(1); let c = await f.publish(await f.create('Public feature', [item]));
  const foreign = await f.create('Another account', [], B), privateC = await f.create('Private feature');
  let p = (await good(await f.profile())).profile;
  await reason(await f.profile({ action: 'update', version: p.version, featured: [foreign.id] }), 400, 'invalid-featured');
  p = (await good(await f.profile({ action: 'update', version: p.version, name: 'Public name', featured: [privateC.id] }))).profile;
  await reason(await f.profile({ action: 'preview', version: p.version }), 409, 'private-featured');
  p = (await good(await f.profile({ action: 'update', version: p.version, featured: [c.id] }))).profile;
  p = await f.publishProfile(p);
  let publicP = await good(await f.pub('profile', p.publicId));
  assert.equal(publicP.featured.length, 1); assert.equal(publicP.name, 'Public name');
  assert.equal(JSON.stringify(publicP).includes('Alice private name'), false);
  assert.equal(JSON.stringify(publicP).includes(A), false);
  c = (await good(await f.col({ action: 'unpublish', id: c.id, version: c.version }))).collection;
  publicP = await good(await f.pub('profile', p.publicId)); assert.deepEqual(publicP.featured, []);
  c = await f.publish(c);
  assert.equal((await good(await f.pub('profile', p.publicId))).featured.length, 1);
  // Even a malformed historical snapshot must not attach someone else's page.
  const raw = f.db.sqlite.prepare('SELECT published_json FROM me_profiles WHERE user_id=?').get(A);
  const old = JSON.parse(raw.published_json); old.featured = [foreign.id];
  f.db.sqlite.prepare('UPDATE me_profiles SET published_json=? WHERE user_id=?').run(JSON.stringify(old), A);
  assert.deepEqual((await good(await f.pub('profile', p.publicId))).featured, []);
});

test('profile publication preview changes when the featured public collection changes', async (t) => {
  const f = fixture(t); let c = await f.publish(await f.create('Before'));
  let p = (await good(await f.profile())).profile;
  p = (await good(await f.profile({ action: 'update', version: p.version, featured: [c.id] }))).profile;
  const preview = await good(await f.profile({ action: 'preview', version: p.version }));
  assert.equal(preview.preview.featured[0].title, 'Before');
  c = await f.update(c, { title: 'After' }); await f.publish(c);
  await reason(await f.profile({ action: 'publish', version: p.version, previewToken: preview.previewToken }), 409, 'preview-changed');
});

test('public HTML escapes labels and captions; HTML, JSON, HEAD and withdrawal agree without shared caching', async (t) => {
  const f = fixture(t), hostile = '<script>alert("x")</script>', item = await f.add(1, { title: hostile });
  let c = await f.create(hostile, [item]); c = await f.update(c, { description: '" onload="oops', items: [{ keepId: item.id, caption: '<img src=x onerror=alert(1)>' }] }); c = await f.publish(c);
  const htmlResponse = await f.pub('collection', c.id, false), html = await htmlResponse.text();
  assert.equal(html.includes('<script>'), false); assert.equal(html.includes('<img src=x'), false);
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(html.includes('&lt;img src=x'));
  assert.equal(htmlResponse.headers.get('cache-control'), 'no-store');
  assert.match(htmlResponse.headers.get('content-security-policy'), /default-src 'none'/);
  const jsonResponse = await f.pub('collection', c.id); const value = await good(jsonResponse);
  assert.equal(value.title, hostile); assert.equal(value.items[0].caption, '<img src=x onerror=alert(1)>');
  assert.match(jsonResponse.headers.get('content-type'), /application\/json/); assert.equal(jsonResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(await (await f.pub('collection', c.id, false, 'HEAD')).text(), '');
  await good(await f.col({ action: 'unpublish', id: c.id, version: c.version }));
  for (const json of [false, true]) { const response = await f.pub('collection', c.id, json); assert.equal(response.status, 404); assert.equal(response.headers.get('cache-control'), 'no-store'); }
});

test('owner export includes private notes and drafts only for the authenticated account', async (t) => {
  const f = fixture(t); const a = await f.add(1), b = await f.add(2, undefined, B);
  await f.create('A collection', [a]); await f.create('B collection', [b], B);
  await f.profile(); await f.profile(undefined, B);
  await reason(await handleExport(req('/api/me/export'), f.env, as(null)), 401, 'unauthorized');
  const response = await handleExport(req('/api/me/export', 'GET', undefined, B), f.env, as(B));
  assert.equal(response.status, 200); const raw = await response.text(); const value = JSON.parse(raw);
  assert.equal(value.keeps.length, 1); assert.equal(value.keeps[0].note, 'PRIVATE-NOTE-2');
  assert.equal(raw.includes('PRIVATE-NOTE-1'), false); assert.equal(raw.includes('A collection'), false);
  assert.match(response.headers.get('content-disposition'), /attachment/); assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('reports require a signed same-origin request, and only directors may hide or release public content', async (t) => {
  const f = fixture(t); let c = await f.publish(await f.create('Reported page'));
  const report = { type: 'collection', id: c.id, reason: 'A moderation test' };
  await reason(await handleReport(req('/api/me/report', 'POST', report), f.env, as(null)), 401, 'unauthorized');
  await reason(await handleReport(req('/api/me/report', 'POST', report, A, { Origin: 'https://foreign.example' }), f.env, as(A)), 403, 'cross-site');
  for (let i = 0; i < 2; i++) await good(await handleReport(req('/api/me/report', 'POST', report, B), f.env, as(B)));
  assert.equal(f.db.sqlite.prepare('SELECT count(*) AS n FROM me_reports').get().n, 1, 'repeat report is idempotent');
  await reason(await handleModerate(req('/api/me/moderate', 'GET'), f.env, as(A)), 403, 'forbidden');
  const director = as('pcu_director', ['broadcaster']);
  const reports = await good(await handleModerate(req('/api/me/moderate', 'GET'), f.env, director));
  assert.equal(reports.reports.length, 1); assert.equal('reporter_id' in reports.reports[0], false);
  await good(await handleModerate(req('/api/me/moderate', 'POST', { action: 'hide', type: 'collection', id: c.id }), f.env, director));
  assert.equal((await f.pub('collection', c.id)).status, 404);
  c = (await good(await f.col())).collections[0]; assert.equal(c.hidden, true);
  await reason(await f.col({ action: 'preview', id: c.id, version: c.version, selectedKeepIds: [] }), 403, 'moderated');
  await good(await handleModerate(req('/api/me/moderate', 'POST', { action: 'release', type: 'collection', id: c.id }), f.env, director));
  assert.equal((await f.pub('collection', c.id)).status, 404, 'release permits new publication but never republishes automatically');
  c = (await good(await f.col())).collections[0]; await f.publish(c);
  assert.equal((await f.pub('collection', c.id)).status, 200);
});

test('profile text and links are escaped in public HTML; drafts and moderation never silently publish', async (t) => {
  const f = fixture(t); let p = (await good(await f.profile())).profile;
  const hostile = '<script>alert("profile")</script>';
  p = (await good(await f.profile({ action: 'update', version: p.version, name: hostile, bio: 'A "quote" <tag>', noun: 42, links: [{ label: '<img src=x onerror=alert(1)>', url: 'https://example.com/?a=1&b=2' }] }))).profile;
  assert.equal((await f.pub('profile', p.publicId)).status, 404);
  p = await f.publishProfile(p);
  const html = await (await f.pub('profile', p.publicId, false)).text();
  assert.equal(html.includes('<script>'), false); assert.equal(html.includes('<img src=x'), false);
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(html.includes('href="https://example.com/?a=1&amp;b=2"'));
  let value = await good(await f.pub('profile', p.publicId));
  assert.equal(value.name, hostile); assert.equal(value.noun, 42); assert.equal(value.links.length, 1);
  p = (await good(await f.profile({ action: 'update', version: p.version, name: 'Draft only' }))).profile;
  assert.equal((await good(await f.pub('profile', p.publicId))).name, hostile);
  const director = as('pcu_director', ['broadcaster']);
  await good(await handleModerate(req('/api/me/moderate', 'POST', { type: 'profile', id: p.publicId, action: 'hide' }), f.env, director));
  for (const json of [true, false]) assert.equal((await f.pub('profile', p.publicId, json)).status, 404);
  p = (await good(await f.profile())).profile;
  await reason(await f.profile({ action: 'preview', version: p.version }), 403, 'moderated');
  await good(await handleModerate(req('/api/me/moderate', 'POST', { type: 'profile', id: p.publicId, action: 'release' }), f.env, director));
  assert.equal((await f.pub('profile', p.publicId)).status, 404);
});

test('300 long-link members fit the bounded library body and oversized requests cannot change collections', async (t) => {
  const f = fixture(t);
  const imported = await good(await f.keeps('POST', { items: Array.from({ length: 300 }, (_, n) => draft(n, { url: `https://example.com/${n}/${'a'.repeat(540)}` })) }));
  assert.equal(imported.keeps.length, 300);
  const create = { action: 'create', title: 'All three hundred', items: imported.keeps.map((item) => ({ keepId: item.id, caption: '🌻'.repeat(280) })) };
  const bytes = new TextEncoder().encode(JSON.stringify(create)).byteLength;
  assert.ok(bytes > 160_000 && bytes < 1_000_000, `fixture is ${bytes} bytes`);
  const collection = (await good(await f.col(create))).collection;
  assert.equal(collection.items.length, 300);
  assert.ok(collection.items.every((item) => item.caption === '🌻'.repeat(280)));
  const before = f.db.sqlite.prepare('SELECT * FROM me_collections WHERE id=?').get(collection.id);
  const oversized = { action: 'update', id: collection.id, version: collection.version, title: 'Must not replace title', description: 'x'.repeat(1_000_000) };
  assert.ok(new TextEncoder().encode(JSON.stringify(oversized)).byteLength > 1_000_000);
  await reason(await f.col(oversized), 413, 'body-too-large');
  assert.deepEqual(f.db.sqlite.prepare('SELECT * FROM me_collections WHERE id=?').get(collection.id), before);
  await reason(await f.col({ ...oversized, action: 'create' }), 413, 'body-too-large');
  assert.equal(f.db.sqlite.prepare('SELECT count(*) AS n FROM me_collections').get().n, 1);
  assert.equal((await good(await f.keeps('GET'))).keeps.length, 300);
});

test('database collection cap preserves all existing rows and reports have a per-account daily bound', async (t) => {
  const f = fixture(t);
  for (let i = 0; i < 50; i++) await f.create(`Collection ${i}`);
  await reason(await f.col({ action: 'create', title: 'Over limit' }), 409, 'collection-limit');
  assert.equal((await good(await f.col())).collections.length, 50);
  for (let i = 0; i < 20; i++) {
    const id = `col_${i.toString(16).padStart(32, '0')}`;
    await good(await handleReport(req('/api/me/report', 'POST', { type: 'collection', id, reason: 'Test reason' }, B), f.env, as(B)));
  }
  await reason(await handleReport(req('/api/me/report', 'POST', { type: 'collection', id: `col_${'f'.repeat(32)}`, reason: 'Over bound' }, B), f.env, as(B)), 429, 'report-limit');
  assert.equal(f.db.sqlite.prepare('SELECT count(*) AS n FROM me_reports').get().n, 20);
});
