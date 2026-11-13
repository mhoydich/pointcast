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

test('RSS export escapes content and links each message', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#t', from: { name: 'A <b>', kind: 'human' }, body: 'fish & chips <script>' });
  const res = await handleLoom(new Request(`${base}?to=%23t&format=rss`), { kv });
  assert.match(res.headers.get('content-type'), /rss\+xml/);
  const text = await res.text();
  assert.match(text, /fish &amp; chips &lt;script&gt;/);
  assert.ok(!text.includes('<script>'));
  assert.match(text, /<guid isPermaLink="false">loom:[0-9a-f]{24}#m_/);
});

test('whole-thread reads may be cached briefly; live polls never are', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#t', from: { name: 'A', kind: 'human' }, body: 'x' });
  const full = await handleLoom(new Request(`${base}?to=%23t`), { kv });
  const poll = await handleLoom(new Request(`${base}?to=%23t&since=1`), { kv });
  assert.equal(full.headers.get('cache-control'), 'public, max-age=10');
  assert.equal(poll.headers.get('cache-control'), 'no-store');
});

const alice = { name: 'Ana', kind: 'human' };
// A counting limiter shaped like functions/api/loom.ts: per (bucket, clientId) fixed budget.
const countingLimit = (max, ipMax = 1000) => { const seen = new Map(); return async (bucket, clientId = 'ip') => {
  const k = `${bucket}:${clientId}`; const n = (seen.get(k) ?? 0) + 1; seen.set(k, n);
  return { allowed: n <= (bucket === 'loom:append:ip' ? ipMax : max), retryAfter: 42 };
}; };

test('A: a refused append says when to retry, in the body and in Retry-After', async () => {
  const kv = memoryKv();
  const res = await post(kv, { to: '#t', from: alice, body: 'x' }, { limit: async () => ({ allowed: false, retryAfter: 37 }) });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '37');
  assert.equal((await res.json()).retryAfterSec, 37);
  const legacy = await post(kv, { to: '#t', from: alice, body: 'x' }, { limit: async () => false });
  assert.equal((await legacy.json()).retryAfterSec, 60);
});

test('B: budgets are per sender; one sender hits its own limit, another is untouched', async () => {
  const kv = memoryKv();
  const limit = countingLimit(2);
  const as = (name, operator) => post(kv, { to: '#t', from: { name, kind: 'agent', operator }, body: 'hi' }, { limit });
  assert.equal((await as('Bot A', 'op')).status, 201);
  assert.equal((await as('bot a', 'OP')).status, 201); // same sender, case-insensitive
  assert.equal((await as('Bot A', 'op')).status, 429);
  assert.equal((await as('Bot B', 'op')).status, 201);
  // rotating names still hits the per-IP ceiling
  const flood = countingLimit(99, 2);
  const names = [];
  for (const n of ['x1', 'x2', 'x3']) names.push((await post(kv, { to: '#t', from: { name: n, kind: 'human' }, body: 'hi' }, { limit: flood })).status);
  assert.deepEqual(names, [201, 201, 429]);
  // verified agents are keyed on their id
  const seen = [];
  await post(kv, { to: '#t', from: alice, body: 'v' }, { verifiedAgent: 'pci_x', limit: async (b, c) => { seen.push([b, c]); return true; } });
  assert.deepEqual(seen, [['loom:append:verified', 'pci_x']]);
});

test('C: a late title sticks on an untitled log; otherwise it is refused with a reason', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#late', from: alice, body: 'first' });
  const late = await (await post(kv, { to: '#late', from: alice, body: 'second', title: 'Named late' })).json();
  assert.deepEqual(late.title, { applied: true, value: 'Named late' });
  assert.equal((await get(kv, '?to=%23late')).log.title, 'Named late');
  const again = await (await post(kv, { to: '#late', from: alice, body: 'third', title: 'Other' })).json();
  assert.deepEqual(again.title, { applied: false, reason: 'title_already_set' });
  const reply = await (await post(kv, { to: late.address, from: alice, body: 'r', title: 'On reply' })).json();
  assert.deepEqual(reply.title, { applied: false, reason: 'title_on_reply' });
  const seed = await (await post(kv, { to: '#loom', from: alice, body: 's', title: 'Mine' })).json();
  assert.equal(seed.title.applied, false);
  assert.equal((await get(kv, '?to=%23loom')).log.title, 'The Loom — start here');
  assert.equal((await (await post(kv, { to: '#none', from: alice, body: 'n' })).json()).title, undefined);
});

test('D: a question with an image stays a question and keeps the image', async () => {
  const kv = memoryKv();
  const media = { url: 'https://pointcast.xyz/a.png', alt: 'a court' };
  const q = await (await post(kv, { to: '#t', from: alice, kind: 'question', body: 'Is this court open?', media })).json();
  assert.equal(q.message.kind, 'question');
  assert.equal(q.message.media.url, media.url);
  assert.equal((await (await post(kv, { to: '#t', from: alice, kind: 'note', body: 'look', media })).json()).message.kind, 'image');
  assert.equal((await (await post(kv, { to: '#t', from: alice, body: 'look', media })).json()).message.kind, 'image');
});

test('E: reading a never-written address says so and offers nearest real names', async () => {
  const kv = memoryKv();
  await post(kv, { to: 'https://pointcast.xyz/court', from: alice, body: 'dry' });
  await post(kv, { to: '@court', from: alice, body: 'inbox' });
  await post(kv, { to: '#courts', from: alice, body: 'topic' });
  const miss = await get(kv, `?to=${encodeURIComponent('https://pointcast.xyz/courts')}`);
  assert.equal(miss.exists, false);
  assert.equal(miss.count, 0);
  assert.equal(miss.nearest[0].address, 'https://pointcast.xyz/court');
  assert.ok(miss.nearest.every((n) => n.kind !== 'handle'));
  assert.ok(miss.hint);
  const handle = await get(kv, '?to=%40courts');
  assert.deepEqual(handle.nearest.map((n) => n.address), ['@court']);
  const hit = await get(kv, `?to=${encodeURIComponent('https://pointcast.xyz/court')}`);
  assert.equal(hit.exists, true);
  assert.equal(hit.nearest, undefined);
  assert.equal((await get(kv, '?to=%23loom')).exists, true);
});

test('G: only=new returns just newer messages; plain since keeps the whole thread; compact directory', async () => {
  const kv = memoryKv();
  for (const b of ['one', 'two', 'three']) await post(kv, { to: 'https://example.com/p', from: alice, body: `${b} http://example.org/x` });
  const q = `?to=${encodeURIComponent('https://example.com/p')}`;
  const full = await get(kv, `${q}&since=1`);
  assert.equal(full.messages.length, 3); // page contract: whole folded thread
  assert.equal(full.since, 1);
  const only = await get(kv, `${q}&since=1&only=new`);
  assert.deepEqual(only.messages.map((m) => m.body.split(' ')[0]), ['two', 'three']);
  assert.equal(only.count, 3);
  assert.equal(only.newCount, 2);
  const dir = await get(kv, '?compact=1');
  assert.ok(dir.logs.length > 0 && dir.logs.every((e) => !e.last || e.last.body === undefined));
  assert.equal(dir.network.hosts, undefined);
  const short = await get(kv, '?short=1');
  assert.equal(short.network.hosts, undefined);
  const normal = await get(kv, '');
  assert.ok(normal.network.hosts.length > 0);
  assert.ok(normal.logs.some((e) => e.last?.body));
});

test('review 1: unsigned budget is per IP+name, so another IP cannot lock a name out', async () => {
  const kv = memoryKv();
  const limit = countingLimit(1);
  const as = (ip) => handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify({ to: '#t', from: alice, body: 'x' }) }), { kv, limit });
  assert.equal((await as('1.1.1.1')).status, 201);
  assert.equal((await as('1.1.1.1')).status, 429);
  assert.equal((await as('2.2.2.2')).status, 201);
});

test('review 2: late titles only stick on topics', async () => {
  const kv = memoryKv();
  for (const to of ['https://example.com/p', '@someone']) {
    await post(kv, { to, from: alice, body: 'first' });
    const r = await (await post(kv, { to, from: alice, body: 'second', title: 'Hijack' })).json();
    assert.deepEqual(r.title, { applied: false, reason: 'title_after_first_post' });
  }
  assert.equal((await (await post(kv, { to: 'https://example.com/new', from: alice, body: 'a', title: 'First time' })).json()).title.applied, true);
});

test('review 4: misses get the short read cache and skip hopeless candidates', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#a', from: alice, body: 'x' });
  await post(kv, { to: 'https://pointcast.xyz/court', from: alice, body: 'x' });
  const res = await handleLoom(new Request(`${base}?to=${encodeURIComponent('https://pointcast.xyz/courts')}`), { kv });
  assert.equal(res.headers.get('cache-control'), 'public, max-age=10');
  assert.deepEqual((await res.json()).nearest.map((n) => n.address), ['https://pointcast.xyz/court']);
});

test('review 5: only=new includes older messages touched by edits and plus', async () => {
  const kv = memoryKv();
  const a = await (await post(kv, { to: '#t', from: alice, body: 'old' })).json();
  await post(kv, { to: '#t', from: alice, body: 'mid' });
  await post(kv, { action: 'plus', to: a.address, clientId: 'c' });
  await post(kv, { action: 'edit', to: a.address, token: a.editToken, body: 'old, edited' });
  const r = await get(kv, '?to=%23t&since=2&only=new');
  assert.deepEqual(r.messages.map((m) => m.body), ['old, edited']);
  assert.equal(r.messages[0].plus, 1);
  assert.equal((await get(kv, '?to=%23t&since=2')).messages.length, 2);
});

test('review 9: over-long appends are flagged truncated, over-long edits refused', async () => {
  const kv = memoryKv();
  const made = await (await post(kv, { to: '#t', from: alice, body: 'y'.repeat(2500) })).json();
  assert.equal(made.truncated, true);
  assert.equal(made.bodyMax, 2000);
  assert.equal(made.message.body.length, 2000);
  assert.equal(made.message.truncated, undefined);
  const edit = await post(kv, { action: 'edit', to: made.address, token: made.editToken, body: 'z'.repeat(2500) });
  assert.equal(edit.status, 400);
  assert.equal((await edit.json()).error, 'body_too_long');
  assert.equal((await (await post(kv, { to: '#t', from: alice, body: 'ok' })).json()).truncated, undefined);
});
