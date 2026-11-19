import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAddress, extractAddresses, addressKey } from '../src/lib/loom/address.mjs';
import { fold } from '../src/lib/loom/fold.mjs';
import { handleLoom, MAX_OPS, MAX_ROOMS } from '../src/lib/loom/service.mjs';

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const base = 'https://pointcast.xyz/api/loom';
const post = (kv, body, opts = {}) => handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { kv, firstHelloEnabled: false, ...opts }); // first-hello is covered in loom-welcome.test.mjs
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

test('over-long appends are refused without writing; a body at the limit still posts', async () => {
  const kv = memoryKv();
  const body = 'y'.repeat(2000);
  const rejected = await post(kv, { to: '#t', from: alice, body: '  ' + body + 'z  ' });
  assert.equal(rejected.status, 400);
  const error = await rejected.json();
  assert.equal(error.error, 'body_too_long');
  assert.equal(error.bodyMax, 2000);
  assert.equal(error.bodyLength, 2001);
  assert.equal(kv.map.size, 0);

  const accepted = await post(kv, { to: '#t', from: alice, body: '  ' + body + '  ' });
  assert.equal(accepted.status, 201);
  const made = await accepted.json();
  assert.equal(made.message.body, body);
  const edit = await post(kv, { action: 'edit', to: made.address, token: made.editToken, body: body + 'z' });
  assert.equal(edit.status, 400);
  assert.equal((await edit.json()).error, 'body_too_long');
  assert.equal((await get(kv, '?to=%23t')).messages[0].body, body);
});

test('C8: link threads cannot push topics and inboxes out of the directory', async () => {
  const kv = memoryKv();
  const clock = (() => { let t = Date.parse('2026-11-01T00:00:00Z'); return () => new Date((t += 1000)); })();
  const p = (to, body) => handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, from: { name: `bot${to.length}`, kind: 'agent' }, body, clientId: 'c8' }) }), { kv, clock, firstHelloEnabled: false, limit: async () => true });
  for (let i = 0; i < 10; i += 1) assert.equal((await p(`#room-${i}`, `hello ${i}`)).status, 201);
  for (let i = 0; i < 5; i += 1) assert.equal((await p(`@inbox${i}`, `hi ${i}`)).status, 201);
  for (let i = 0; i < 130; i += 1) assert.equal((await p(`https://example.com/p${i}`, `note ${i}`)).status, 201);
  assert.equal((await p('https://example.com/p7', 'second')).status, 201);
  const d = await get(kv, '');
  const addrs = d.logs.map((e) => e.address);
  for (let i = 0; i < 10; i += 1) assert.ok(addrs.includes(`#room-${i}`), `#room-${i}`);
  for (let i = 0; i < 5; i += 1) assert.ok(addrs.includes(`@inbox${i}`), `@inbox${i}`);
  assert.ok(addrs.includes('https://example.com/p7'));
  assert.ok(!addrs.includes('https://example.com/p8'));
  assert.equal(d.logs.filter((e) => e.kind === 'url').length, 1);
  assert.equal(d.views.links, 130);
  assert.ok(d.views.linksHidden >= 100);
  const links = await get(kv, '?kind=url');
  assert.ok(links.logs.some((e) => e.address === 'https://example.com/p8' && e.count === 1));
  assert.equal(links.logs[0].address, 'https://example.com/p7');
  const links2 = await get(kv, '?view=links');
  assert.ok(links2.logs.length >= 100 && links2.logs.every((e) => e.kind === 'url'));
  const topics = await get(kv, '?kind=topic');
  for (let i = 0; i < 10; i += 1) assert.ok(topics.logs.some((e) => e.address === `#room-${i}`));
  assert.ok(topics.logs.every((e) => e.kind === 'topic'));
});

test('C8: loom:rooms backfills once from the recent index', async () => {
  const kv = memoryKv();
  const entry = (address, kind) => ({ address, key: `k${address}`, kind, label: address, updatedAt: '2026-11-01T00:00:00Z', count: 1 });
  kv.map.set('loom:index', JSON.stringify([entry('#old', 'topic'), entry('https://a.example/x', 'url')]));
  const d = await get(kv, '');
  assert.ok(d.logs.some((e) => e.address === '#old'));
  assert.ok(JSON.parse(kv.map.get('loom:rooms')).some((e) => e.address === '#old'));
});

test('C8 review: a room survives more link threads than the recent index holds; search still finds one-message links', async () => {
  const kv = memoryKv();
  const clock = (() => { let t = Date.parse('2026-11-01T00:00:00Z'); return () => new Date((t += 1000)); })();
  const p = (to, body) => handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, from: { name: 'bot', kind: 'agent' }, body, clientId: 'c8r' }) }), { kv, clock, firstHelloEnabled: false, limit: async () => true });
  await p('#keeper', 'first');
  await p('@keeper', 'hi');
  for (let i = 0; i < 310; i += 1) assert.equal((await p(`https://example.com/q${i}`, `note ${i}`)).status, 201);
  assert.ok(!JSON.parse(kv.map.get('loom:index')).some((e) => e.address === '#keeper'), 'the recent index really dropped the room');
  const d = await get(kv, '');
  assert.ok(d.logs.some((e) => e.address === '#keeper'));
  assert.ok(d.logs.some((e) => e.address === '@keeper'));
  assert.ok((await get(kv, '?kind=topic')).logs.some((e) => e.address === '#keeper'));
  const found = await get(kv, '?q=q309');
  assert.ok(found.logs.some((e) => e.address === 'https://example.com/q309'));
  // A room entry lost from loom:rooms (concurrent write) heals from the recent index on the next room post.
  await p('#second', 'x');
  kv.map.set('loom:rooms', JSON.stringify(JSON.parse(kv.map.get('loom:rooms')).filter((e) => e.address !== '#second')));
  await p('#third', 'y');
  const rooms = JSON.parse(kv.map.get('loom:rooms')).map((e) => e.address);
  assert.deepEqual(rooms.slice(0, 2), ['#third', '#second']);
  assert.ok(rooms.includes('#keeper'));
});

test('C8 review: a withdrawn message leaves the directory excerpt in both lists', async () => {
  const kv = memoryKv();
  const alice = { name: 'alice', kind: 'human' };
  await post(kv, { to: '#quiet', from: alice, body: 'kept line' });
  const made = await (await post(kv, { to: '#quiet', from: alice, body: 'secret oops' })).json();
  assert.match(JSON.stringify((await get(kv, '')).logs), /secret oops/);
  const res = await post(kv, { action: 'withdraw', to: '#quiet', id: made.message.id, token: made.editToken });
  assert.equal(res.status, 200);
  assert.doesNotMatch(kv.map.get('loom:index'), /secret oops/);
  assert.doesNotMatch(kv.map.get('loom:rooms'), /secret oops/);
  const row = (await get(kv, '')).logs.find((e) => e.address === '#quiet');
  assert.equal(row.count, 1);
  assert.equal(row.last.body, 'kept line');
});

test('C8: over the room cap, a flood of new inboxes never pushes a topic out', async () => {
  const kv = memoryKv();
  const entry = (address, kind, at) => ({ address, key: `k${address}`, kind, label: address, updatedAt: at, count: 2 });
  const handles = Array.from({ length: MAX_ROOMS }, (_, i) => entry(`@h${i}`, 'handle', `2026-11-13T10:${String(i % 60).padStart(2, '0')}:00Z`));
  kv.map.set('loom:rooms', JSON.stringify([entry('#quiet', 'topic', '2026-11-01T00:00:00Z'), ...handles.slice(0, MAX_ROOMS - 1)]));
  await post(kv, { to: '@newcomer', from: { name: 'someone', kind: 'human' }, body: 'hi' });
  const rooms = JSON.parse(kv.map.get('loom:rooms'));
  assert.equal(rooms.length, MAX_ROOMS);
  assert.ok(rooms.some((e) => e.address === '#quiet'));
  assert.ok(rooms.some((e) => e.address === '@newcomer'));
});

test('item 31: messages trimmed from the live log are archived first and can be paged back', async () => {
  const kv = memoryKv();
  const first = await (await post(kv, { to: '#deep', from: alice, body: 'post 1, the oldest' })).json();
  await post(kv, { action: 'edit', to: first.address, token: first.editToken, body: 'post 1, edited before it left' });
  const N = MAX_OPS + 40; // under ARCHIVE_BATCH, so one save drains it
  // Fill past the cap by writing the stored log directly (601 real posts would trip the rate limiter).
  const key = `loom:log:${first.address.split('#')[0].slice(5)}`;
  const stored = JSON.parse(kv.map.get(key));
  for (let i = stored.seq + 1; i <= N; i += 1) stored.ops.push({ op: 'append', id: `m_fill${i}`, from: alice, kind: 'note', body: `post ${i}`, seq: i, at: '2026-11-18T00:00:00.000Z' });
  stored.seq = N;
  kv.map.set(key, JSON.stringify(stored));
  // The next real append triggers the trim.
  const last = await post(kv, { to: '#deep', from: alice, body: 'the newest post' });
  assert.equal(last.status, 201);
  const live = await get(kv, '?to=%23deep');
  assert.equal(live.ops.length, MAX_OPS);
  assert.equal(live.log.trimmedBefore, N + 1 - MAX_OPS + 1);
  assert.equal(live.log.archivedFrom, 1);
  assert.ok(!live.messages.some((m) => m.seq === 1), 'the oldest post has left the live log');

  // Page back from the edge of the live log: every trimmed append is there, none twice, none lost.
  const seen = [];
  let before = live.log.trimmedBefore;
  for (let guard = 0; guard < 10 && before; guard += 1) {
    const page = (await get(kv, `?to=%23deep&before=${before}`)).archive;
    assert.ok(page.messages.length <= 40);
    seen.push(...page.messages);
    before = page.more ? page.nextBefore : 0;
  }
  const seqs = seen.map((m) => m.seq).sort((a, b) => a - b);
  // seq 2 is the edit op, not a message, so it has no archive entry of its own.
  const expected = [1]; for (let s = 3; s < live.log.trimmedBefore; s += 1) expected.push(s);
  assert.deepEqual(seqs, expected);
  const oldest = seen.find((m) => m.seq === 1);
  assert.equal(oldest.body, 'post 1, edited before it left', 'the archive holds the final edited text');
  assert.equal(oldest.tokenHash, undefined, 'no edit-token hash leaves the server');
  assert.ok(!JSON.stringify(seen).includes('tokenHash'));
});

test('item 31: a hidden message leaves a tombstone, and a failed archive write trims nothing', async () => {
  const kv = memoryKv();
  const first = await (await post(kv, { to: '#deep2', from: alice, body: 'this one gets hidden' })).json();
  const key = `loom:log:${first.address.split('#')[0].slice(5)}`;
  const stored = JSON.parse(kv.map.get(key));
  stored.ops.push({ op: 'hide', id: first.message.id, reason: 'moderated', seq: 2, at: '2026-11-18T00:00:00.000Z' });
  for (let i = 3; i <= MAX_OPS + 5; i += 1) stored.ops.push({ op: 'append', id: `m_fill${i}`, from: alice, kind: 'note', body: `post ${i}`, seq: i, at: '2026-11-18T00:00:00.000Z' });
  stored.seq = MAX_OPS + 5;
  kv.map.set(key, JSON.stringify(stored));

  // Archive writes fail: the append still succeeds and the live log keeps everything.
  const flaky = { map: kv.map, get: kv.get, put: async (k, v) => { if (k.startsWith('loom:arch:')) throw new Error('kv down'); kv.map.set(k, v); } };
  assert.equal((await post(flaky, { to: '#deep2', from: alice, body: 'written while the archive is down' })).status, 201);
  const kept = await get(kv, '?to=%23deep2');
  assert.equal(kept.ops.length, MAX_OPS + 6);
  assert.equal(kept.log.trimmedBefore, null);

  // Archive back up: the next append trims, and the hidden message does not come back through the archive.
  assert.equal((await post(kv, { to: '#deep2', from: alice, body: 'archive is back' })).status, 201);
  const live = await get(kv, '?to=%23deep2');
  assert.equal(live.ops.length, MAX_OPS);
  const page = (await get(kv, `?to=%23deep2&before=${live.log.trimmedBefore}`)).archive;
  assert.ok(!page.messages.some((m) => m.id === first.message.id));
  assert.ok(!JSON.stringify(page).includes('this one gets hidden'));
});

test('item 31 review: bad cursors are refused, a failed archive read is a 503, and an archived post can still be withdrawn or hidden', async () => {
  const kv = memoryKv();
  const first = await (await post(kv, { to: '#deep3', from: alice, body: 'the author will take this back' })).json();
  const second = await (await post(kv, { to: '#deep3', from: alice, body: 'a moderator will hide this' })).json();
  const key = `loom:log:${first.address.split('#')[0].slice(5)}`;
  const stored = JSON.parse(kv.map.get(key));
  for (let i = 3; i <= MAX_OPS + 10; i += 1) stored.ops.push({ op: 'append', id: `m_fill${i}`, from: alice, kind: 'note', body: `post ${i}`, seq: i, at: '2026-11-18T00:00:00.000Z' });
  stored.seq = MAX_OPS + 10;
  kv.map.set(key, JSON.stringify(stored));
  assert.equal((await post(kv, { to: '#deep3', from: alice, body: 'trigger the trim' })).status, 201);
  const live = await get(kv, '?to=%23deep3');
  const edge = live.log.trimmedBefore;
  assert.ok(edge > 2);

  // Bad cursors and limits are refused, not coerced.
  for (const q of ['before=abc', 'before=0', 'before=-5', 'before=1.5', 'before=', `before=${edge}&limit=0`, `before=${edge}&limit=41`, `before=${edge}&limit=x`]) {
    const res = await handleLoom(new Request(`${base}?to=%23deep3&${q}`), { kv });
    assert.equal(res.status, 400, q);
  }

  // One archive record unreadable: the whole page fails with 503 and no cursor, instead of a short page.
  const broken = { map: kv.map, put: kv.put, get: async (k) => { if (k.endsWith(':5') && k.startsWith('loom:arch:')) throw new Error('kv read failed'); return kv.get(k); } };
  const failed = await handleLoom(new Request(`${base}?to=%23deep3&before=${edge}`), { kv: broken });
  assert.equal(failed.status, 503);
  const failedBody = await failed.json();
  assert.equal(failedBody.error, 'archive_unavailable');
  assert.equal(failedBody.archive, undefined);

  // Both posts are in the archive to begin with.
  let page = (await get(kv, `?to=%23deep3&before=${edge}`)).archive;
  assert.ok(page.messages.some((m) => m.id === first.message.id));
  assert.ok(page.messages.some((m) => m.id === second.message.id));

  // The author withdraws an archived post: wrong token refused, right token leaves a tombstone.
  assert.equal((await post(kv, { action: 'withdraw', to: first.address, token: 'not-the-token' })).status, 403);
  const withdrawn = await post(kv, { action: 'withdraw', to: first.address, token: first.editToken });
  assert.equal(withdrawn.status, 200);
  assert.equal((await withdrawn.json()).archived, true);

  // A moderator hides an archived post; without the admin key it is refused.
  assert.equal((await post(kv, { action: 'hide', to: second.address })).status, 403);
  const hide = (headers) => handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ action: 'hide', to: second.address }) }), { kv, adminKey: 'k', firstHelloEnabled: false });
  assert.equal((await hide({ 'X-Loom-Admin': 'wrong' })).status, 403);
  assert.equal((await hide({ 'X-Loom-Admin': 'k' })).status, 200);

  page = (await get(kv, `?to=%23deep3&before=${edge}`)).archive;
  assert.ok(!page.messages.some((m) => m.id === first.message.id || m.id === second.message.id));
  const dump = JSON.stringify([...kv.map.entries()].filter(([k]) => k.startsWith('loom:arch:')));
  assert.ok(!dump.includes('the author will take this back') && !dump.includes('a moderator will hide this'), 'the text is gone from storage, not only from the read');
  // Editing an archived post is still refused.
  assert.equal((await post(kv, { action: 'edit', to: first.address, token: first.editToken, body: 'too late' })).status, 404);
});

test('item 31 review: an archive backlog drains in bounded batches', async () => {
  const kv = memoryKv();
  const first = await (await post(kv, { to: '#deep4', from: alice, body: 'post 1' })).json();
  const key = `loom:log:${first.address.split('#')[0].slice(5)}`;
  const stored = JSON.parse(kv.map.get(key));
  for (let i = 2; i <= MAX_OPS + 130; i += 1) stored.ops.push({ op: 'append', id: `m_fill${i}`, from: alice, kind: 'note', body: `post ${i}`, seq: i, at: '2026-11-18T00:00:00.000Z' });
  stored.seq = MAX_OPS + 130;
  kv.map.set(key, JSON.stringify(stored));
  await post(kv, { to: '#deep4', from: alice, body: 'first save after the backlog' });
  let live = await get(kv, '?to=%23deep4');
  assert.equal(live.log.trimmedBefore, 51, 'one save archives at most 50 messages');
  assert.equal(live.ops.length, MAX_OPS + 131 - 50);
  await post(kv, { to: '#deep4', from: alice, body: 'second' });
  await post(kv, { to: '#deep4', from: alice, body: 'third' });
  live = await get(kv, '?to=%23deep4');
  assert.equal(live.ops.length, MAX_OPS, 'the backlog is gone after three saves');
  assert.equal([...kv.map.keys()].filter((k) => k.startsWith('loom:arch:')).length, 133);
});
