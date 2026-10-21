import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAddress, extractAddresses, addressKey } from '../src/lib/loom/address.mjs';
import { fold } from '../src/lib/loom/fold.mjs';
import { handleLoom, nodeCard } from '../src/lib/loom/service.mjs';
import { generateKeyPair, seal, open, checkEnvelope, fingerprint } from '../src/lib/loom/seal.mjs';
import { upsertFront, stampOps } from '../src/lib/loom/log.mjs';

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

// ── v2: sealed inboxes and peers ────────────────────────────────────────────

test('seal and open: each recipient key opens the envelope, any other key cannot, tampering fails', async () => {
  const bob = await generateKeyPair(), ana = await generateKeyPair(), eve = await generateKeyPair();
  const envelope = await seal('court 3 at 7 ✓', [{ kid: bob.kid, publicKey: bob.publicKey }, { kid: ana.kid, publicKey: ana.publicKey }]);
  assert.equal(await open(envelope, { kid: bob.kid, privateKey: bob.privateKey }), 'court 3 at 7 ✓');
  assert.equal(await open(envelope, { kid: ana.kid, privateKey: ana.privateKey }), 'court 3 at 7 ✓');
  await assert.rejects(open(envelope, { kid: eve.kid, privateKey: eve.privateKey }), /seal_not_for_this_key/);
  // A slot relabelled with another kid fails: the kid is bound into the wrap.
  const relabelled = { ...envelope, to: [{ ...envelope.to[0], kid: eve.kid }] };
  await assert.rejects(open(relabelled, { kid: eve.kid, privateKey: eve.privateKey }));
  const flipped = { ...envelope, ct: `${envelope.ct.slice(0, -2)}${envelope.ct.endsWith('A') ? 'B' : 'A'}${envelope.ct.slice(-1)}` };
  await assert.rejects(open(flipped, { kid: bob.kid, privateKey: bob.privateKey }));
  assert.deepEqual(checkEnvelope(envelope), envelope);
  assert.throws(() => checkEnvelope({ ...envelope, v: 2 }), /sealed_version/);
  assert.throws(() => checkEnvelope({ ...envelope, to: [] }), /sealed_recipients/);
  assert.match(fingerprint(bob.kid), /^[0-9a-f]{4}( [0-9a-f]{4}){3}$/);
});

test('inbox keys: first publish claims the inbox, only its token rotates it, agents need a signature', async () => {
  const kv = memoryKv();
  const one = await generateKeyPair(), two = await generateKeyPair(), squat = await generateKeyPair();
  const made = await post(kv, { action: 'key', address: '@Bob', publicKey: one.publicKey });
  assert.equal(made.status, 201);
  const claim = await made.json();
  assert.equal(claim.address, '@bob');
  assert.equal(claim.kid, one.kid);
  assert.ok(claim.keyToken);
  assert.equal(claim.keys.trust, 'first-use');
  assert.equal((await post(kv, { action: 'key', address: '@bob', publicKey: squat.publicKey })).status, 403);
  assert.equal((await post(kv, { action: 'key', address: '@bob', publicKey: two.publicKey, token: 'wrong' })).status, 403);
  const rotated = await (await post(kv, { action: 'key', address: '@bob', publicKey: two.publicKey, token: claim.keyToken })).json();
  assert.equal(rotated.keys.current.kid, two.kid);
  assert.deepEqual(rotated.keys.keys.map((k) => k.kid), [one.kid, two.kid]);
  const read = await get(kv, '?key=%40bob');
  assert.equal(read.keys.current.kid, two.kid);
  assert.ok(!JSON.stringify(read).includes('tokenHash'));
  assert.equal(read.sealable, true);

  assert.equal((await post(kv, { action: 'key', address: '#topic', publicKey: one.publicKey })).status, 400);
  assert.equal((await (await post(kv, { action: 'nope' })).json()).error, 'action_unknown');
  assert.equal((await post(kv, { action: 'key', address: '@carl', publicKey: { ...one.publicKey, d: 'secret' } })).status, 400);
  assert.equal((await post(kv, { action: 'key', address: '@carl', publicKey: { kty: 'EC', crv: 'P-256', x: 'A'.repeat(43), y: 'A'.repeat(43) } })).status, 400, 'not a point on the curve');
  const agent = 'agent:pci_0123456789abcdef0123456789abcdef';
  assert.equal((await post(kv, { action: 'key', address: agent, publicKey: one.publicKey })).status, 403);
  const signed = await (await post(kv, { action: 'key', address: agent, publicKey: one.publicKey }, { verifiedAgent: 'pci_0123456789abcdef0123456789abcdef' })).json();
  assert.equal(signed.keys.trust, 'verified-agent');
  assert.equal(signed.keyToken, undefined);
});

test('sealed DMs: ciphertext only, addressed to the inbox key, no ripple, no edits, sender copy allowed', async () => {
  const kv = memoryKv();
  const bob = await generateKeyPair(), ana = await generateKeyPair(), stranger = await generateKeyPair();
  await post(kv, { action: 'key', address: '@bob', publicKey: bob.publicKey });
  await post(kv, { action: 'key', address: '@ana', publicKey: ana.publicKey });
  const to = (...keys) => keys.map((k) => ({ kid: k.kid, publicKey: k.publicKey }));

  const envelope = await seal('see @carol about #secret https://example.com/x', to(bob, ana));
  const res = await post(kv, { to: '@bob', from: { name: 'Ana', kind: 'human', address: '@ana' }, sealed: envelope });
  assert.equal(res.status, 201);
  const made = await res.json();
  assert.deepEqual(made.reached, [], 'a sealed message never ripples');
  assert.equal(made.message.kind, 'sealed');
  const inbox = await get(kv, '?to=%40bob');
  assert.equal(inbox.log.sealable, true);
  assert.equal(inbox.messages[0].body, '');
  assert.equal(await open(inbox.messages[0].sealed, { kid: bob.kid, privateKey: bob.privateKey }), 'see @carol about #secret https://example.com/x');
  assert.equal(await open(inbox.messages[0].sealed, { kid: ana.kid, privateKey: ana.privateKey }), 'see @carol about #secret https://example.com/x');
  assert.equal((await get(kv, '?to=%40carol')).count, 0);
  const directory = await get(kv, '');
  assert.equal(directory.logs.find((e) => e.address === '@bob').last.body, 'sealed message');
  assert.equal((await get(kv, '?from=%40ana')).sent[0].body, 'sealed message');
  const as2 = await (await handleLoom(new Request(`${base}?to=%40bob&format=as2`), { kv })).json();
  assert.equal(as2.orderedItems[0].object.content, undefined);

  const status = async (body) => (await post(kv, body)).status;
  const from = { name: 'Ana', kind: 'human', address: '@ana' };
  assert.equal(await status({ to: '#open', from, sealed: envelope }), 400, 'only inboxes take sealed messages');
  assert.equal(await status({ to: '@nokey', from, sealed: envelope }), 400, 'the inbox needs a published key');
  assert.equal(await status({ to: '@bob', from, sealed: envelope, body: 'oops, plaintext' }), 400, 'plaintext alongside a seal is refused');
  assert.equal(await status({ to: '@bob', from, sealed: await seal('x', to(ana)) }), 400, 'must be readable by the inbox');
  assert.equal(await status({ to: '@bob', from, sealed: await seal('x', to(bob, stranger)) }), 400, 'every kid must be published');
  assert.equal(await status({ to: '@bob', from, sealed: { ...envelope, ct: 'not base64url!' } }), 400);
  assert.equal((await post(kv, { action: 'edit', to: made.address, token: made.editToken, body: 'plain' })).status, 400);
  assert.equal((await post(kv, { action: 'withdraw', to: made.address, token: made.editToken })).status, 200);
  assert.equal((await get(kv, '?to=%40bob')).count, 0);
});

test('peer handshake: fetch the card, check it names the same origin, list the peer', async () => {
  const kv = memoryKv();
  const cards = {
    'https://friend.example/.well-known/loom.json': { spec: 'pointcast.loom/v2', node: 'https://friend.example', name: 'Friend', api: 'https://friend.example/api/loom' },
    'https://liar.example/.well-known/loom.json': { spec: 'pointcast.loom/v2', node: 'https://friend.example', api: 'https://friend.example/api/loom' },
    'https://other.example/.well-known/loom.json': { spec: 'activitypub', node: 'https://other.example', api: '/api' },
  };
  const fetched = [];
  const fetcher = async (url, init) => {
    fetched.push(url);
    assert.equal(init.redirect, 'manual');
    return cards[url] ? new Response(JSON.stringify(cards[url]), { status: 200 }) : new Response('nope', { status: 404 });
  };
  const peer = (node) => post(kv, { action: 'peer', node }, { fetcher });
  const ok = await peer('https://Friend.example/some/path');
  assert.equal(ok.status, 201);
  const made = await ok.json();
  assert.equal(made.peer.node, 'https://friend.example');
  assert.equal(made.card.node, 'https://pointcast.xyz');
  assert.equal((await peer('https://friend.example')).status, 200, 'a repeat handshake refreshes');
  assert.equal((await peer('https://liar.example')).status, 502);
  assert.equal((await peer('https://other.example')).status, 502);
  assert.equal((await peer('https://missing.example')).status, 502);
  for (const bad of ['http://friend.example', 'https://127.0.0.1', 'https://localhost', 'https://box.local', 'https://friend.example:8443', 'https://pointcast.xyz', 'nonsense']) {
    assert.equal((await peer(bad)).status, 400, bad);
  }
  assert.ok(!fetched.some((u) => /127\.0\.0\.1|localhost|\.local\/|8443|pointcast\.xyz/.test(u)), 'refused nodes are never fetched');
  const listed = await get(kv, '?peers=1');
  assert.deepEqual(listed.peers.map((p) => p.node), ['https://friend.example']);
  const card = nodeCard({ peers: listed.peers });
  assert.equal(card.spec, 'pointcast.loom/v2');
  assert.equal(card.peers[0].name, 'Friend');
});

test('log helpers: stamping trims to the cap, lists upsert by key', () => {
  const log = { seq: 0, ops: [], title: null };
  stampOps(log, [{ op: 'append', id: 'a' }], 'now', { title: 'first' });
  stampOps(log, [{ op: 'append', id: 'b' }, { op: 'append', id: 'c' }], 'later', { title: 'ignored', maxOps: 2 });
  assert.equal(log.title, 'first');
  assert.deepEqual(log.ops.map((o) => o.seq), [2, 3]);
  assert.equal(log.trimmedBefore, 2);
  assert.deepEqual(upsertFront([{ k: 1 }, { k: 2 }], { k: 2, n: 'new' }, { keyField: 'k' }), [{ k: 2, n: 'new' }, { k: 1 }]);
  assert.deepEqual(upsertFront([1, 2, 3], 0, { cap: 3 }), [0, 1, 2]);
});
