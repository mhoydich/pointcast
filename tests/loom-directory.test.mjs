import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { addressKey } from '../src/lib/loom/address.mjs';
import { directoryResponse, LOGS_PER_PAGE, readDirectory } from '../src/lib/loom/directory.mjs';
import { MAX_INDEX, MAX_ROOMS } from '../src/lib/loom/service.mjs';

const origin = 'https://pointcast.xyz';
const request = path => new Request(new URL(path, origin));
const card = { op: 'append', id: 'm_abcdef', seq: 1, at: '2026-11-13', from: { name: 'Tess', kind: 'agent', address: '@tess' }, body: 'CARD Tess', kind: 'note' };
const log = (address, ops) => ({ address, ops, seq: ops.length, createdAt: '2026-11-13', updatedAt: '2026-11-14', kind: address.startsWith('@') ? 'handle' : 'topic' });

async function board(logs) {
  const keys = [];
  const data = new Map();
  const index = [];
  for (const log of logs) {
    const key = await addressKey(log.address);
    const name = 'loom:log:' + key;
    keys.push({ name });
    data.set(name, { ...log, key });
    index.push({ key, address: log.address, kind: log.kind, title: 'Inbox for ' + log.address, count: log.ops.length });
  }
  const newest = index.reverse();
  const topics = newest.filter(entry => entry.kind === 'topic').slice(0, MAX_ROOMS);
  const rooms = [...topics, ...newest.filter(entry => entry.kind !== 'topic').slice(0, MAX_ROOMS - topics.length)];
  data.set('loom:index', newest.slice(0, MAX_INDEX));
  data.set('loom:rooms', rooms);
  const stats = { lists: 0, reads: 0, inFlight: 0, peak: 0 };
  const kv = {
    async list({ cursor, limit, prefix }) {
      assert.equal(prefix, 'loom:log:');
      stats.lists++;
      const start = Number(cursor ?? 0), end = start + limit;
      return { keys: keys.slice(start, end), list_complete: end >= keys.length, cursor: String(end) };
    },
    async get(key, type) {
      stats.reads++;
      stats.peak = Math.max(stats.peak, ++stats.inFlight);
      await new Promise(resolve => setImmediate(resolve));
      stats.inFlight--;
      const stored = data.get(key);
      return stored ? (type === 'json' ? stored : JSON.stringify(stored)) : null;
    },
  };
  return { kv, stats, rooms };
}

test('visible self-posted cards, current edits, introductions and source links survive folding', async () => {
  const { kv } = await board([
    log('@tess', [card, { op: 'edit', id: card.id, seq: 2, at: '2026-11-14', body: 'CARD Tess\ndoes: <reviews>' },
      { ...card, seq: 3, id: 'm_other1', body: 'CARD foreign', from: { name: 'Other', kind: 'agent', address: '@other' } }]),
    log('@pat', [{ ...card, body: 'I draw.', from: { name: 'Pat', kind: 'agent', address: '@pat' } }]),
    log('#room', [{ ...card, body: 'hello', from: { name: 'Mira', kind: 'human' } },
      { ...card, seq: 2, id: 'm_ghost1', from: { name: 'Withdrawn', kind: 'human' } },
      { op: 'hide', id: 'm_ghost1', seq: 3 }]),
  ]);
  const result = await directoryResponse(request('/loom/directory'), kv);
  const html = await result.text();
  assert.doesNotMatch(html, /CARD foreign|Withdrawn|<reviews>/);
  const document = new JSDOM(html).window.document;
  assert.deepEqual([...document.querySelectorAll('h2')].map(el => el.textContent), ['Mira', 'Other', 'Pat', 'Tess']);
  assert.equal(document.querySelector('article a[href*="%40tess"]').getAttribute('href'), '/loom?to=%40tess#m_abcdef');
  assert.match(document.body.textContent, /First visible self-post.*I draw\./s);
  assert.match(html, /&lt;reviews&gt;/);
  const text = await directoryResponse(request('/loom/directory.txt?q=reviews'), kv, true);
  assert.match(text.headers.get('Content-Type'), /text\/plain/);
  assert.match(await text.text(), /Tess · agent · @tess\nSelf-posted card\nCARD Tess\ndoes: <reviews>/);
});

test('2,000 rooms / 10,000 posts: bounded reads, shared cache and usable continuation even after zero matches', async () => {
  const logs = Array.from({ length: 2000 }, (_, i) => log('#room-' + i, Array.from({ length: 5 }, (_, n) =>
    ({ ...card, seq: n + 1, id: 'm_person' + n, from: { name: 'Reader ' + (i * 5 + n), kind: 'human' } }))));
  const { kv, stats, rooms } = await board(logs);
  const entries = new Map();
  const cache = { match: async key => entries.get(key)?.clone(), put: async (key, response) => entries.set(key, response) };
  const query = encodeURIComponent('Reader 84');
  const run = async path => new JSDOM(await (await directoryResponse(request(path), kv, false, cache)).text()).window.document;
  const first = await run('/loom/directory?q=' + query);
  assert.equal(first.querySelectorAll('h2').length, 0);
  assert.deepEqual(stats, { lists: 1, reads: LOGS_PER_PAGE + 2, inFlight: 0, peak: 2 });
  const warmText = await directoryResponse(request('/loom/directory.txt?q=Reader+12'), kv, true, cache);
  assert.match(await warmText.text(), /Reader 12 · human/);
  assert.deepEqual([stats.lists, stats.reads], [1, 18]);
  const next = first.querySelector('nav a').getAttribute('href');
  assert.equal(new URL(next, origin).searchParams.get('q'), 'Reader 84');
  const second = await run(next);
  assert.equal(second.querySelector('h2').textContent, 'Reader 84');
  assert.deepEqual([stats.lists, stats.reads, stats.peak], [2, 34, 2]);

  // Lou's R5 fixture still has all 2,000 log records after the board directory
  // retains only its newest 400 topics. Walk the real cold pagination path.
  assert.equal(rooms.length, MAX_ROOMS);
  assert.ok(!rooms.some(room => room.address === '#room-0'));
  const baseline = { ...stats };
  const names = new Set();
  let cursor, pages = 0;
  do {
    const page = await readDirectory(kv, cursor);
    assert.equal(page.scanned, LOGS_PER_PAGE);
    assert.equal(page.people.length, 80);
    assert.equal(page.trimmed, false);
    assert.equal(Object.hasOwn(page, 'topics'), false);
    for (const person of page.people) names.add(person.name);
    pages++;
    assert.ok(pages <= 125, 'the continuation must advance');
    cursor = page.next;
  } while (cursor);
  assert.equal(pages, 125);
  assert.deepEqual(names, new Set(Array.from({ length: 10_000 }, (_, i) => 'Reader ' + i)));
  assert.deepEqual([stats.lists - baseline.lists, stats.reads - baseline.reads], [125, 2002]);
});

test('exact inbox search reads the inbox directly, including a card outside the first log page', async () => {
  const { kv, stats } = await board([...Array.from({ length: 20 }, (_, i) => log('#room-' + i, [])), log('@tess', [card])]);
  const html = await (await directoryResponse(request('/loom/directory?q=%40Tess'), kv)).text();
  assert.match(html, /CARD Tess/);
  assert.match(html, /Visible self-posts in @tess/);
  assert.deepEqual([stats.lists, stats.reads], [0, 1]);
  const partial = new JSDOM(await (await directoryResponse(request('/loom/directory?q=tes'), kv)).text()).window.document;
  assert.equal(partial.querySelector('section a').getAttribute('href'), '/loom/directory?q=%40tess');
});

test('missing storage, failed reads and unsupported methods never appear as a successful empty search', async () => {
  const failed = {
    async list() { return { keys: [{ name: 'unavailable' }], list_complete: true }; },
    async get() { throw new Error('offline'); },
  };
  for (const q of ['', '?q=%40tess']) {
    const response = await directoryResponse(request('/loom/directory' + q), failed);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal((await directoryResponse(request('/loom/directory.txt'), null, true)).status, 503);
  assert.equal((await directoryResponse(new Request(origin, { method: 'POST' }), failed)).status, 405);
  const { kv } = await board([]);
  const head = await directoryResponse(new Request(origin + '/loom/directory', { method: 'HEAD' }), kv);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
