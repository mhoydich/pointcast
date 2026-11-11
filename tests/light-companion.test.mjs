/**
 * Light Companion (/light/): a circle of people, one light each.
 * src/lib/light-signal.mjs, functions/_lib/light-store.mjs, functions/api/light.ts,
 * functions/light/c/[[path]].ts and the static pages under public/light/.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  LIGHT_MAX_LIT_MS,
  LIGHT_SIGNAL_MAX_BYTES,
  decodeLightSignal,
  encodeLightSignal,
  isLightSignal,
  lightSignal,
  reduceLightSignals,
  signalIsLit,
} from '../src/lib/light-signal.mjs';
import {
  BURST_MAX,
  CIRCLE_TTL_MS,
  HOUR_MS,
  MEMBER_CAP,
  NAME_MAX,
  NOTICE,
  actOnCircle,
  cleanName,
  createCircle,
  d1Store,
  drumRoom,
  isCircleId,
  memoryStore,
  putOutCircle,
  readCircle,
  signalRef,
  storageKey,
} from '../functions/_lib/light-store.mjs';
import { onRequestGet, onRequestPost } from '../functions/api/light.ts';
import { onRequestGet as circlePage } from '../functions/light/c/[[path]].ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const T0 = Date.parse('2026-11-11T15:12:00Z');
const MIDNIGHT = T0 + 9 * HOUR_MS;

function d1() {
  const db = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args) }; },
    async run() {
      const r = db.prepare(sql).run(...args);
      return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    },
  });
  return { raw: db, prepare: (sql) => statement(sql) };
}

const STORES = [
  ['memory', () => memoryStore()],
  ['d1', () => d1Store(d1())],
];

async function circleWith(store, names, now = T0) {
  const made = await createCircle(store, now);
  const ids = [];
  for (const name of names) {
    const joined = await actOnCircle(store, made.id, 'join', { name, colour: 'amber' }, now);
    assert.equal(joined.ok, true);
    ids.push(joined.member);
  }
  return { id: made.id, ids };
}

// ── the signal ───────────────────────────────────────────────────────

test('a light signal is six fields and nothing else', () => {
  const circle = `lc_${'a'.repeat(32)}`;
  const lit = lightSignal({ kind: 'lit', circle, member: 'k3m9x2pa', at: T0, expires: MIDNIGHT });
  assert.deepEqual(Object.keys(lit), ['v', 'kind', 'circle', 'member', 'at', 'expires']);
  assert.equal(isLightSignal(lit), true);
  assert.equal(Object.isFrozen(lit), true);
  const snuffed = lightSignal({ kind: 'snuffed', circle, member: 'k3m9x2pa', at: T0 + 5, expires: MIDNIGHT });
  assert.equal(snuffed.expires, null, 'a snuffed signal never carries an expiry');

  assert.equal(isLightSignal({ ...lit, name: 'Mum' }), false, 'no extra fields ride along');
  assert.equal(isLightSignal({ ...lit, kind: 'help' }), false);
  assert.equal(isLightSignal({ ...lit, circle: 'a'.repeat(32) }), false, 'the circle field is a derived reference, not a link id');
  assert.equal(isLightSignal({ ...lit, expires: T0 + LIGHT_MAX_LIT_MS + 1 }), false, 'no light outlasts 26 hours');
  assert.equal(isLightSignal({ ...lit, expires: T0 }), false);
  assert.throws(() => lightSignal({ kind: 'lit', circle, member: 'short', at: T0, expires: MIDNIGHT }));
});

test('a signal survives any carrier as canonical text under 200 bytes', () => {
  const lit = lightSignal({ kind: 'lit', circle: `lc_${'0123456789abcdef'.repeat(2)}`, member: 'k3m9x2pa', at: T0, expires: MIDNIGHT });
  const text = encodeLightSignal(lit);
  assert.ok(new TextEncoder().encode(text).length <= LIGHT_SIGNAL_MAX_BYTES);
  assert.equal(text.startsWith('{"v":0,"kind":"lit","circle":"lc_'), true);
  assert.deepEqual(decodeLightSignal(text), lit);
  assert.equal(decodeLightSignal('{"v":0}'), null);
  assert.equal(decodeLightSignal('not json'), null);
  assert.equal(decodeLightSignal(`${text}${' '.repeat(300)}`), null, 'oversized frames are dropped');
});

test('signals fold in any order: latest wins, ties go to snuffed, lit fades at expiry', () => {
  const circle = `lc_${'b'.repeat(32)}`;
  const other = `lc_${'c'.repeat(32)}`;
  const a = 'aaaaaaaa';
  const b = 'bbbbbbbb';
  const signals = [
    lightSignal({ kind: 'snuffed', circle, member: a, at: T0 + 10 }),
    lightSignal({ kind: 'lit', circle, member: a, at: T0, expires: MIDNIGHT }),
    lightSignal({ kind: 'lit', circle, member: b, at: T0 + 1, expires: T0 + HOUR_MS }),
    lightSignal({ kind: 'lit', circle: other, member: a, at: T0 + 99, expires: MIDNIGHT }),
    { junk: true },
  ];
  const now = reduceLightSignals(signals, { circle, now: T0 + 20 });
  assert.equal(now.get(a).lit, false);
  assert.equal(now.get(b).lit, true);
  assert.equal(reduceLightSignals(signals, { circle, now: T0 + HOUR_MS + 1 }).get(b).lit, false, 'no expired event is needed');
  const tie = reduceLightSignals([
    lightSignal({ kind: 'lit', circle, member: a, at: T0, expires: MIDNIGHT }),
    lightSignal({ kind: 'snuffed', circle, member: a, at: T0 }),
  ], { circle, now: T0 + 1 });
  assert.equal(tie.get(a).lit, false);
  assert.equal(signalIsLit(signals[1], T0 + 1), true);
});

// ── names and ids ────────────────────────────────────────────────────

test('names are one line of plain text, capped, with control characters removed', () => {
  assert.equal(cleanName('  Mum  '), 'Mum');
  assert.equal(cleanName('a\nb\tc'), 'a b c');
  assert.equal(cleanName('x\u202Ey\u0000z'), 'x y z');
  assert.equal(Array.from(cleanName('é'.repeat(60))).length, NAME_MAX);
  assert.equal(cleanName('<script>alert(1)</script>'), '<script>alert(1)</script>'.slice(0, NAME_MAX), 'markup is kept as text; the page writes it with textContent');
  assert.equal(cleanName('   '), '');
  assert.equal(cleanName(42), '');
});

test('the circle link is hashed three separate ways and none gives the link back', async () => {
  const id = 'abcdefghjkmnpqrstvwxyz0123456789';
  assert.equal(isCircleId(id), true);
  assert.equal(isCircleId(`${id}x`), false);
  const [key, ref, room] = await Promise.all([storageKey(id), signalRef(id), drumRoom(id)]);
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.match(ref, /^lc_[0-9a-f]{32}$/);
  assert.match(room, /^light-[0-9a-f]{20}$/);
  assert.match(room, /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/, 'a valid /api/drum/room code');
  for (const derived of [key, ref, room]) assert.equal(derived.includes(id), false);
  assert.equal(key.startsWith(ref.slice(3)), false, 'the three hashes are domain-separated');
});

// ── circles, against both stores ─────────────────────────────────────

for (const [label, makeStore] of STORES) {
  test(`[${label}] create, join, light, see it, snuff`, async () => {
    const store = makeStore();
    const made = await createCircle(store, T0);
    assert.equal(made.status, 201);
    assert.equal(isCircleId(made.id), true);
    assert.deepEqual(made.state.circle.members, []);

    const mum = await actOnCircle(store, made.id, 'join', { name: 'Mum', colour: 'rose' }, T0);
    const sam = await actOnCircle(store, made.id, 'join', { name: 'Sam', colour: 'sky' }, T0 + 1);
    assert.equal(mum.ok && sam.ok, true);
    assert.deepEqual(sam.circle.members.map((m) => m.name), ['Mum', 'Sam'], 'members keep the order they joined in');

    const lit = await actOnCircle(store, made.id, 'light', { member: mum.member, until: MIDNIGHT }, T0 + 2);
    assert.equal(lit.ok, true);

    const seen = await readCircle(store, made.id, T0 + 3000);
    const m = seen.circle.members[0];
    assert.equal(m.lit, true);
    assert.equal(m.litAt, T0 + 2, 'lit time is the server time of the act');
    assert.equal(m.expiresAt, MIDNIGHT);
    assert.equal(seen.circle.members[1].lit, false);
    assert.equal(seen.signals.length, 1);
    assert.equal(isLightSignal(seen.signals[0]), true);
    assert.equal(seen.signals[0].kind, 'lit');
    assert.equal(seen.signals[0].circle, await signalRef(made.id));
    assert.equal(seen.notice, NOTICE);
    assert.equal(JSON.stringify(seen).includes(made.id), false, 'a read never echoes the link');
    assert.match(seen.drum.page, /^\/drum-room-v2\?room=light-[0-9a-f]{20}$/);

    const out = await actOnCircle(store, made.id, 'snuff', { member: mum.member }, T0 + 4000);
    assert.equal(out.circle.members[0].lit, false);
    assert.equal(out.circle.members[0].litAt, null);
    assert.equal(out.signals[0].kind, 'snuffed');
    assert.equal(out.signals[0].at, T0 + 4000);
  });

  test(`[${label}] a light fades on its own: one hour, or the lighter's midnight`, async () => {
    const store = makeStore();
    const { id, ids } = await circleWith(store, ['A', 'B']);
    await actOnCircle(store, id, 'light', { member: ids[0], mode: 'hour', until: MIDNIGHT }, T0);
    await actOnCircle(store, id, 'light', { member: ids[1], mode: 'tonight', until: MIDNIGHT }, T0);

    const before = await readCircle(store, id, T0 + HOUR_MS - 1);
    assert.deepEqual(before.circle.members.map((m) => m.lit), [true, true]);
    assert.equal(before.circle.members[0].expiresAt, T0 + HOUR_MS, 'an hour is the server\'s hour, whatever until says');

    const after = await readCircle(store, id, T0 + HOUR_MS);
    assert.deepEqual(after.circle.members.map((m) => m.lit), [false, true]);
    assert.equal(after.signals.length, 1, 'a faded light sends no signal at all');

    const night = await readCircle(store, id, MIDNIGHT);
    assert.deepEqual(night.circle.members.map((m) => m.lit), [false, false]);
    assert.equal(night.circle.members[0].mode, 'hour', 'the chosen duration is remembered');
  });

  test(`[${label}] until must be a sane time; modes and colours are closed lists`, async () => {
    const store = makeStore();
    const { id, ids } = await circleWith(store, ['A']);
    for (const until of [undefined, 'soon', T0, T0 - 1, T0 + LIGHT_MAX_LIT_MS + 1, 1.5]) {
      const r = await actOnCircle(store, id, 'light', { member: ids[0], until }, T0);
      assert.equal(r.ok, false, `until ${until}`);
      assert.equal(r.status, 400);
    }
    assert.equal((await actOnCircle(store, id, 'light', { member: ids[0], mode: 'forever', until: MIDNIGHT }, T0)).status, 400);
    assert.equal((await actOnCircle(store, id, 'update', { member: ids[0], colour: 'url(x)' }, T0)).status, 400);
    assert.equal((await actOnCircle(store, id, 'join', { name: 'B', colour: '#fff' }, T0)).status, 400);
    assert.equal((await actOnCircle(store, id, 'join', { name: '  ', colour: 'moss' }, T0)).status, 400);
    assert.equal((await actOnCircle(store, id, 'light', { member: 'zzzzzzzz', until: MIDNIGHT }, T0)).status, 404);
    assert.equal((await actOnCircle(store, id, 'explode', { member: ids[0] }, T0)).status, 400);
    assert.equal((await readCircle(store, id, T0)).circle.members[0].lit, false, 'nothing above lit a light');
  });

  test(`[${label}] rename, recolour, change duration, take one light out`, async () => {
    const store = makeStore();
    const { id, ids } = await circleWith(store, ['A', 'B']);
    const r = await actOnCircle(store, id, 'update', { member: ids[0], name: ' Ada\n', colour: 'lilac', mode: 'hour' }, T0);
    assert.deepEqual([r.circle.members[0].name, r.circle.members[0].colour, r.circle.members[0].mode], ['Ada', 'lilac', 'hour']);
    const gone = await actOnCircle(store, id, 'remove', { member: ids[0] }, T0);
    assert.deepEqual(gone.circle.members.map((m) => m.name), ['B']);
    assert.equal(gone.member, null);
  });

  test(`[${label}] a circle holds ${MEMBER_CAP} lights and ${BURST_MAX} changes a minute`, async () => {
    const store = makeStore();
    const made = await createCircle(store, T0);
    for (let i = 0; i < MEMBER_CAP; i += 1) {
      assert.equal((await actOnCircle(store, made.id, 'join', { name: `P${i}`, colour: 'gold' }, T0)).ok, true);
    }
    const extra = await actOnCircle(store, made.id, 'join', { name: 'One more', colour: 'gold' }, T0);
    assert.equal(extra.status, 409);
    assert.equal((await readCircle(store, made.id, T0)).circle.members.length, MEMBER_CAP);

    const { id, ids } = await circleWith(store, ['A'], T0);
    let last;
    for (let i = 0; i < BURST_MAX + 2; i += 1) last = await actOnCircle(store, id, 'snuff', { member: ids[0] }, T0 + 1);
    assert.equal(last.status, 429);
    assert.equal((await actOnCircle(store, id, 'snuff', { member: ids[0] }, T0 + 61_000)).ok, true, 'the budget refills after a minute');
  });

  test(`[${label}] put out deletes everything; untouched circles expire after 90 days`, async () => {
    const store = makeStore();
    const { id, ids } = await circleWith(store, ['A']);
    assert.equal((await putOutCircle(store, id, T0)).gone, true);
    assert.equal((await readCircle(store, id, T0)).status, 404);
    assert.equal((await actOnCircle(store, id, 'light', { member: ids[0], until: MIDNIGHT }, T0)).status, 404);
    assert.equal((await putOutCircle(store, id, T0)).status, 404);

    const old = await circleWith(store, ['B']);
    const kept = await circleWith(store, ['C']);
    const later = T0 + CIRCLE_TTL_MS - 1000;
    assert.equal((await readCircle(store, kept.id, later)).ok, true, 'a read inside the window keeps a circle alive');
    assert.equal((await readCircle(store, old.id, T0 + CIRCLE_TTL_MS + 1)).status, 404);
    assert.equal((await readCircle(store, kept.id, T0 + CIRCLE_TTL_MS + 1)).ok, true);
    await createCircle(store, T0 + 3 * CIRCLE_TTL_MS);
    assert.equal((await readCircle(store, kept.id, T0 + 3 * CIRCLE_TTL_MS)).status, 404, 'making a circle sweeps expired ones');
  });

  test(`[${label}] unknown and malformed links read as no circle`, async () => {
    const store = makeStore();
    for (const id of ['', 'short', 'A'.repeat(32), `${'a'.repeat(31)}!`, 'a'.repeat(32)]) {
      assert.equal((await readCircle(store, id, T0)).status, 404);
    }
  });
}

test('[d1] the table holds a hash and the document, never the link; two writers cannot lose a light', async () => {
  const db = d1();
  const store = d1Store(db);
  const { id, ids } = await circleWith(store, ['A', 'B']);
  const rows = db.raw.prepare('SELECT * FROM light_circles').all();
  assert.equal(rows.length, 1);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['doc', 'id_hash', 'touched_at', 'version']);
  assert.equal(JSON.stringify(rows[0]).includes(id), false);
  assert.equal(rows[0].id_hash, await storageKey(id));
  const doc = JSON.parse(rows[0].doc);
  assert.deepEqual(Object.keys(doc).sort(), ['burst', 'createdAt', 'members', 'v']);
  assert.deepEqual(Object.keys(doc.members[0]).sort(), ['colour', 'expiresAt', 'id', 'litAt', 'mode', 'name', 'snuffedAt']);

  const stale = await store.get(rows[0].id_hash);
  assert.equal(await store.replace(rows[0].id_hash, stale.doc, stale.version - 1, T0), false, 'a stale version is refused');
  await Promise.all([
    actOnCircle(store, id, 'light', { member: ids[0], until: MIDNIGHT }, T0 + 1),
    actOnCircle(store, id, 'light', { member: ids[1], until: MIDNIGHT }, T0 + 1),
  ]);
  assert.deepEqual((await readCircle(store, id, T0 + 2)).circle.members.map((m) => m.lit), [true, true]);
});

// ── the endpoint ─────────────────────────────────────────────────────

const post = (body, env = {}, headers = {}) => onRequestPost({
  env,
  request: new Request('https://pointcast.xyz/api/light', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }),
});
const get = (circle, env = {}) => onRequestGet({
  env,
  request: new Request('https://pointcast.xyz/api/light', { headers: circle ? { 'X-Light-Circle': circle } : {} }),
});

test('POST /api/light walks a circle from made to put out, on D1 and on the in-memory fallback', async () => {
  for (const env of [{ AUTH_DB: d1() }, {}]) {
    const made = await post({ action: 'create' }, env);
    assert.equal(made.status, 201);
    assert.equal(made.headers.get('cache-control'), 'no-store');
    assert.match(made.headers.get('x-robots-tag'), /noindex/);
    const { id, path, store } = await made.json();
    assert.equal(path, `/light/c/${id}`);
    assert.equal(store, env.AUTH_DB ? 'd1' : 'memory', 'the response says which store answered');

    const joined = await (await post({ action: 'join', circle: id, name: 'Mum', colour: 'amber' }, env)).json();
    assert.match(joined.member, /^[a-z0-9]{8}$/);
    const until = Date.now() + 2 * HOUR_MS;
    const lit = await post({ action: 'light', circle: id, member: joined.member, until }, env);
    assert.equal(lit.status, 200);

    const seen = await (await get(id, env)).json();
    assert.equal(seen.circle.members[0].lit, true);
    assert.equal(seen.status, undefined);

    assert.equal((await post({ action: 'put_out', circle: id }, env)).status, 400, 'deleting needs the confirm phrase');
    assert.equal((await get(id, env)).status, 200);
    assert.equal((await post({ action: 'put_out', circle: id, confirm: 'put out' }, env)).status, 200);
    assert.equal((await get(id, env)).status, 404);
  }
});

test('the endpoint refuses big bodies, bad JSON and unknown actions, and explains itself with no circle', async () => {
  assert.equal((await post('x'.repeat(3000))).status, 413);
  assert.equal((await post('{nope')).status, 400);
  assert.equal((await post('[1]')).status, 400);
  assert.equal((await post({ action: 'haunt' })).status, 400);
  assert.equal((await post({ action: 'join', circle: 'nope', name: 'A', colour: 'amber' })).status, 404);
  const about = await (await get('')).json();
  assert.equal(about.notice, NOTICE);
  assert.equal((await get('a'.repeat(32))).status, 404);
});

test('making circles is limited to six an hour, keyed by a daily hash and never the address', async () => {
  const writes = [];
  const kv = new Map();
  const env = {
    PC_RATES_KV: {
      async get(k) { return kv.get(k) ?? null; },
      async put(k, v) { writes.push(k); kv.set(k, v); },
    },
  };
  const from = { 'CF-Connecting-IP': '203.0.113.77' };
  for (let i = 0; i < 6; i += 1) assert.equal((await post({ action: 'create' }, env, from)).status, 201);
  const refused = await post({ action: 'create' }, env, from);
  assert.equal(refused.status, 429);
  assert.ok(Number(refused.headers.get('retry-after')) > 0);
  assert.ok(writes.length >= 6);
  for (const key of writes) {
    assert.match(key, /^rl:light:create:light:[0-9a-f]{24}:\d+$/);
    assert.equal(key.includes('203.0.113'), false);
  }
  assert.equal((await post({ action: 'create' }, env, { 'CF-Connecting-IP': '198.51.100.9' })).status, 201, 'another caller is unaffected');
});

test('reads and lights spend no KV writes', async () => {
  let puts = 0;
  const env = { PC_RATES_KV: { async get() { return null; }, async put() { puts += 1; } } };
  const { id } = await (await post({ action: 'create' }, env)).json();
  const before = puts;
  const { member } = await (await post({ action: 'join', circle: id, name: 'A', colour: 'sky' }, env)).json();
  await post({ action: 'light', circle: id, member, mode: 'hour' }, env);
  for (let i = 0; i < 5; i += 1) await get(id, env);
  assert.equal(puts, before);
});

// ── the circle page function ─────────────────────────────────────────

test('/light/c/<id> serves the shell privately, with a manifest that opens that circle', async () => {
  const id = 'abcdefghjkmnpqrstvwxyz0123456789';
  const asked = [];
  const env = { ASSETS: { async fetch(u) { asked.push(String(u)); return new Response('<!DOCTYPE html><title>shell</title>', { headers: { 'content-type': 'text/html' } }); } } };
  const page = await circlePage({ env, params: { path: [id] }, request: new Request(`https://pointcast.xyz/light/c/${id}`) });
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.match(page.headers.get('x-robots-tag'), /noindex/);
  assert.equal(page.headers.get('referrer-policy'), 'no-referrer');
  assert.deepEqual(asked, ['https://pointcast.xyz/light/circle/'], 'the asset fetch never carries the circle id');

  const manifest = await circlePage({ env, params: { path: [id, 'manifest.webmanifest'] }, request: new Request(`https://pointcast.xyz/light/c/${id}/manifest.webmanifest`) });
  assert.match(manifest.headers.get('content-type'), /manifest\+json/);
  const m = await manifest.json();
  assert.equal(m.start_url, `/light/c/${id}`);
  assert.equal(m.display, 'standalone');

  for (const path of [['nope'], [id.toUpperCase()], [id, 'x', 'y'], []]) {
    const r = await circlePage({ env, params: { path }, request: new Request('https://pointcast.xyz/light/c/x') });
    assert.equal(r.status, 302);
    assert.equal(r.headers.get('location'), 'https://pointcast.xyz/light/');
  }
});

test('the middleware hands circle links straight to their function', () => {
  const mw = read('functions/_middleware.ts');
  const pass = mw.indexOf("if (url.pathname.startsWith('/light/c/')) return next();");
  assert.ok(pass > 0);
  assert.ok(pass < mw.indexOf('recordVisit({'), 'before the visit log');
  assert.ok(pass < mw.indexOf('injectUnfurlCards(injectHomeShareMetadata'), 'before unfurl cards are built from the path');
});

// ── the pages and their words ────────────────────────────────────────

const PAGES = ['public/light/index.html', 'public/light/circle/index.html'];
const WORDS = [...PAGES, 'public/light/light.js', 'public/light/landing.js', 'public/light.json', 'docs/light-signal.md', 'src/content/blocks/0783.json'];

test('both pages carry the plain not-an-emergency line and the mobile meta', () => {
  for (const p of PAGES) {
    const html = read(p);
    assert.ok(html.includes('This is not an emergency or monitoring service. It cannot call for help.'), p);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
    assert.match(html, /apple-mobile-web-app-capable/);
    assert.match(html, /apple-touch-icon/);
    // The JSON-LD block names schema.org as its vocabulary; that is a label, not a request.
    assert.doesNotMatch(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ''), /https?:\/\/(?!pointcast\.xyz)/, `${p} makes no third-party request`);
  }
  assert.match(read(PAGES[0]), /<link rel="manifest" href="\/light\/manifest\.webmanifest">/);
  assert.match(read(PAGES[1]), /<meta name="robots" content="noindex, nofollow, noarchive">/);
  assert.match(read(PAGES[1]), /<meta name="referrer" content="no-referrer">/);
  const manifest = JSON.parse(read('public/light/manifest.webmanifest'));
  assert.equal(manifest.start_url, '/light/');
  assert.equal(manifest.display, 'standalone');
});

test('copy rules: no health or safety claims, no brand or family references', () => {
  const banned = [
    /good\s*feels/i, /cannabis/i, /\bhemp\b/i, /\bTHC\b/, /\bweed\b/i,
    /peace of mind/i, /keeps? (?:you|them|her|him|mum|mom|people) safe/i, /\bsafety\b/i, /\bwellness\b/i, /well-?being/i,
    /\bfall(?:s|en)? detect/i, /\bmedical\b/i, /\bhealth/i, /\bcaregiv/i, /\bcheck(?:s|ing)? (?:in )?on\b/i,
    /mike'?s (?:mother|mom|mum|family)/i, /\bhoydich\b/i, /\bmorgan\b/i,
  ];
  for (const p of WORDS) {
    const text = read(p);
    for (const re of banned) assert.doesNotMatch(text, re, `${p} must not match ${re}`);
  }
});

test('the client writes names as text, keeps its memory in try/catch, and tells dark from disconnected', () => {
  const js = read('public/light/light.js');
  assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|document\.write|outerHTML/);
  assert.match(js, /try \{ var v = localStorage\.getItem\(key\)/);
  assert.match(js, /try \{ localStorage\.setItem\(key, JSON\.stringify\(value\)\)/);
  assert.match(js, /known \? \(lit \? 'lit' : 'dark'\) : 'unknown'/);
  assert.doesNotMatch(js, /\/api\/light\?/, 'the circle id never goes in a query string');
  const css = read('public/light/light.css');
  assert.match(css, /\[data-state="unknown"\] \.win \{[^}]*border-style: dashed/);
  assert.match(css, /\.status\[data-conn="on"\] \.ember/);
  assert.doesNotMatch(css, /@import|url\(http/);
});

// ── registration ─────────────────────────────────────────────────────

test('the JSON twin, the block and the registries agree', () => {
  const twin = JSON.parse(read('public/light.json'));
  assert.equal(twin.schema, 'pointcast.light/v0');
  assert.equal(twin.url, 'https://pointcast.xyz/light/');
  assert.equal(twin.notice, NOTICE);
  assert.equal(twin.limits.lightsPerCircle, MEMBER_CAP);
  assert.equal(twin.limits.nameCharacters, NAME_MAX);
  assert.equal(twin.limits.circleDeletedAfterDaysUntouched, CIRCLE_TTL_MS / 86_400_000);
  assert.deepEqual(twin.signal.fields.map((f) => f.name), ['v', 'kind', 'circle', 'member', 'at', 'expires']);
  assert.equal(JSON.stringify(twin).includes('/light/c/a'), false, 'no real-looking circle link is published');

  const block = JSON.parse(read('src/content/blocks/0783.json'));
  assert.equal(block.id, '0783');
  assert.equal(block.author, 'cc');
  assert.ok(block.source.length > 20);
  assert.equal(block.external.url, 'https://pointcast.xyz/light/');

  const surfaces = read('src/data/agent-surfaces.ts');
  assert.match(surfaces, /lightCompanion: 'https:\/\/pointcast\.xyz\/light\/',/);
  assert.match(surfaces, /lightCompanion: 'https:\/\/pointcast\.xyz\/light\.json',/);
  const sitemap = read('src/pages/sitemap-discovery.xml.ts');
  assert.match(sitemap, /\['https:\/\/pointcast\.xyz\/light\/', /);
  assert.match(sitemap, /\['https:\/\/pointcast\.xyz\/light\.json', /);
  assert.doesNotMatch(sitemap, /light\/c\//, 'circle links never enter a sitemap');
  assert.match(read('public/llms.txt'), /https:\/\/pointcast\.xyz\/light\//);
  assert.match(read('public/llms-full.txt'), /https:\/\/pointcast\.xyz\/light\.json/);
});

test('light_read is the only MCP tool for a circle, and it only reads', () => {
  const mcp = read('functions/api/mcp.ts');
  assert.match(mcp, /^ {4}name: 'light_read',$/m);
  assert.doesNotMatch(mcp, /name: 'light_(?!read')[a-z_]+'/);
  const writes = mcp.slice(mcp.indexOf('const WRITE_TOOL_NAMES = new Set(['), mcp.indexOf('function', mcp.indexOf('const WRITE_TOOL_NAMES = new Set([')));
  assert.equal(writes.includes('light_read'), false);
  assert.match(mcp, /if \(name === 'light_read'\) \{\s*return rpcResult\(id, await lightReadCall\(args, env\)\);/);
});
