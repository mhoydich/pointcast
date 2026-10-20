import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAddress, extractAddresses, addressKey } from '../src/lib/loom/address.mjs';
import { fold } from '../src/lib/loom/fold.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const base = 'https://pointcast.xyz/api/loom';
const post = (kv, body, opts = {}) => handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { kv, ...opts });
const get = async (kv, query) => (await handleLoom(new Request(`${base}${query}`), { kv })).json();

test('addresses canonicalise so spellings of one thing share a log', () => {
  assert.equal(parseAddress('http://www.PointCast.xyz/court/?utm_source=x#top').address, 'https://pointcast.xyz/court');
  assert.equal(parseAddress('pc:/court').address, 'https://pointcast.xyz/court');
  assert.equal(parseAddress('pc:block/42').address, 'https://pointcast.xyz/b/42');
  assert.equal(parseAddress('example.com/a').address, 'https://example.com/a');
  assert.equal(parseAddress('@Mike').address, '@mike');
  assert.equal(parseAddress('#Pickleball').address, '#pickleball');
  assert.equal(parseAddress('geo:33.91834,-118.41612').address, 'geo:33.918,-118.416');
  assert.equal(parseAddress('0xABCDEFabcdef0123456789abcdef0123456789AB').kind, 'wallet');
  assert.equal(parseAddress('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb').kind, 'wallet');
  assert.throws(() => parseAddress('javascript:alert(1)'));
  assert.throws(() => parseAddress('mailto:a@b.c'));
  assert.throws(() => parseAddress('geo:99,0'));
});

test('extractAddresses finds links, mentions and topics', () => {
  const found = extractAddresses('ask @Sky about #tides at https://pointcast.xyz/air. email a@b.com');
  assert.deepEqual(found.mentions, ['@sky']);
  assert.deepEqual(found.topics, ['#tides']);
  assert.deepEqual(found.links, ['https://pointcast.xyz/air']);
});

test('fold threads replies, applies edits, plus and votes, and supports playback', () => {
  const ops = [
    { seq: 1, op: 'append', id: 'm_a', from: { name: 'A', kind: 'human' }, body: 'root' },
    { seq: 2, op: 'append', id: 'm_b', from: { name: 'B', kind: 'agent' }, body: 'reply', parent: 'm_a' },
    { seq: 3, op: 'append', id: 'm_c', from: { name: 'A', kind: 'human' }, body: 'second root' },
    { seq: 4, op: 'edit', id: 'm_a', body: 'root, edited' },
    { seq: 5, op: 'plus', id: 'm_b', by: 'c1' },
    { seq: 6, op: 'plus', id: 'm_b', by: 'c1' },
    { seq: 7, op: 'append', id: 'm_p', from: { name: 'C', kind: 'human' }, body: 'q', poll: { question: 'q', options: ['x', 'y'] } },
    { seq: 8, op: 'vote', id: 'm_p', choice: 0, by: 'c1' },
    { seq: 9, op: 'vote', id: 'm_p', choice: 1, by: 'c1' },
  ];
  const now = fold(ops);
  assert.deepEqual(now.messages.map((m) => m.id), ['m_a', 'm_b', 'm_c', 'm_p']);
  assert.equal(now.messages[0].body, 'root, edited');
  assert.equal(now.messages[1].depth, 1);
  assert.equal(now.messages[1].plus, 1);
  assert.deepEqual(now.messages[3].poll.options.map((o) => o.votes), [0, 1]);
  const then = fold(ops, { until: 2 });
  assert.equal(then.count, 2);
  assert.equal(then.messages[0].body, 'root');
});

test('read of an empty store shows the seeded welcome thread', async () => {
  const kv = memoryKv();
  const index = await get(kv, '');
  assert.equal(index.logs[0].address, '#loom');
  const welcome = await get(kv, '?to=%23loom');
  assert.ok(welcome.count >= 3);
  assert.equal(welcome.messages[0].from.name, 'Collator');
});

test('append to a page, reply by message address, and ripple into an inbox', async () => {
  const kv = memoryKv();
  const res = await post(kv, { to: 'https://pointcast.xyz/court', from: { name: 'Ana', kind: 'human' }, body: 'Courts are dry, @sky can you confirm? #courts' });
  assert.equal(res.status, 201);
  const made = await res.json();
  assert.ok(made.editToken);
  assert.deepEqual(made.reached.sort(), ['#courts', '@sky']);

  const reply = await (await post(kv, { to: made.address, from: { name: 'Sky', kind: 'agent', model: 'house' }, body: 'Confirmed dry.', confidence: 0.9 })).json();
  assert.equal(reply.message.parent, made.message.id);

  const page = await get(kv, `?to=${encodeURIComponent('https://pointcast.xyz/court/')}`);
  assert.equal(page.count, 2);
  assert.equal(page.messages[1].depth, 1);
  assert.equal(page.messages[1].from.kind, 'agent');
  assert.ok(!JSON.stringify(page).includes('tokenHash'));

  const inbox = await get(kv, '?to=%40sky');
  assert.equal(inbox.messages[0].via.address, 'https://pointcast.xyz/court');

  const outbox = await get(kv, '?from=%40ana');
  assert.equal(outbox.sent[0].to, 'https://pointcast.xyz/court');
});

test('the Collator stitches two threads that cite the same link', async () => {
  const kv = memoryKv();
  await post(kv, { to: 'https://example.com/a', from: { name: 'A', kind: 'human' }, body: 'see https://pointcast.xyz/air' });
  const second = await (await post(kv, { to: 'https://pointcast.xyz/court', from: { name: 'B', kind: 'human' }, body: 'also https://pointcast.xyz/air' })).json();
  const court = await get(kv, `?to=${encodeURIComponent('https://pointcast.xyz/court')}`);
  const collate = court.messages.find((m) => m.from.name === 'Collator');
  assert.ok(collate, 'collator note present');
  assert.equal(collate.parent, second.message.id);
  assert.match(collate.body, /example\.com\/a/);
});

test('edits need the token; withdraw hides; admin hide needs the key', async () => {
  const kv = memoryKv();
  const made = await (await post(kv, { to: '#test', from: { name: 'A', kind: 'human' }, body: 'first' })).json();
  assert.equal((await post(kv, { action: 'edit', to: made.address, token: 'nope', body: 'x' })).status, 403);
  assert.equal((await post(kv, { action: 'edit', to: made.address, token: made.editToken, body: 'second' })).status, 200);
  let log = await get(kv, '?to=%23test');
  assert.equal(log.messages[0].body, 'second');
  assert.equal(log.messages[0].edits, 1);
  assert.equal((await post(kv, { action: 'hide', to: made.address }, { adminKey: 'k' })).status, 403);
  await post(kv, { action: 'withdraw', to: made.address, token: made.editToken });
  log = await get(kv, '?to=%23test');
  assert.equal(log.count, 0);
});

test('validation: reserved names, robot kind, bad media, rate limit, unbound store', async () => {
  const kv = memoryKv();
  const status = async (body, opts) => (await post(kv, body, opts)).status;
  assert.equal(await status({ to: '#t', from: { name: 'Collator', kind: 'human' }, body: 'x' }), 400);
  assert.equal(await status({ to: '#t', from: { name: 'R', kind: 'robot' }, body: 'x' }), 400);
  assert.equal(await status({ to: '#t', from: { name: 'R', kind: 'human' }, body: 'x', media: { url: 'javascript:1' } }), 400);
  assert.equal(await status({ to: '#t', from: { name: 'R', kind: 'human' }, body: 'x' }, { limit: async () => false }), 429);
  assert.equal(await status({ to: '#t', from: { name: 'R', kind: 'human' }, body: 'x' }, { kv: null }), 503);
  const img = await (await post(kv, { to: '#t', from: { name: 'R', kind: 'human' }, media: { url: 'https://pointcast.xyz/a.png', alt: 'a court' } })).json();
  assert.equal(img.message.kind, 'image');
});

test('verified agents get an agent address and mark', async () => {
  const kv = memoryKv();
  const made = await (await post(kv, { to: '#t', from: { name: 'Bot', kind: 'human' }, body: 'hi' }, { verifiedAgent: 'pci_0123456789abcdef0123456789abcdef' })).json();
  assert.equal(made.message.from.kind, 'agent');
  assert.equal(made.message.from.verified, true);
  assert.equal(made.message.from.address, 'agent:pci_0123456789abcdef0123456789abcdef');
});

test('ActivityStreams export', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#t', from: { name: 'A', kind: 'human' }, body: 'hello #t' });
  const res = await handleLoom(new Request(`${base}?to=%23t&format=as2`), { kv });
  assert.match(res.headers.get('content-type'), /activity\+json/);
  const as2 = await res.json();
  assert.equal(as2.type, 'OrderedCollection');
  assert.equal(as2.orderedItems[0].object.content, 'hello #t');
  assert.equal(typeof (await addressKey('#t')), 'string');
});
