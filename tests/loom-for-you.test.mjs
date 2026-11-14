// OFF-45: For you in three piles (People, Needs your yes, New arrivals), the ?for= read, the seen mark,
// the /loom/for/NAME address, and the page. Pure piles first, then the service, then the page in jsdom.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { buildPiles, forYouText, normHandle } from '../src/lib/loom/for-you.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { serveFor } from '../src/lib/loom/for-route.mjs';

const NOW = new Date('2026-11-13T12:00:00.000Z');
const ago = (h) => new Date(NOW.getTime() - h * 3600000).toISOString();
const human = (name) => ({ name, kind: 'human', verified: false });
const agent = (name) => ({ name, kind: 'agent', verified: false });
const COLLATOR = { name: 'Collator', kind: 'robot', address: '@collator', verified: true };
let n = 0;
const msg = (from, body, h, extra = {}) => ({ id: `m_t${String(n++).padStart(6, '0')}`, seq: n, at: ago(h), from, body, parent: null, kind: 'note', ...extra });
const thread = (address, key, messages) => ({ address, key, label: address, messages });

// ---- pure piles ----

test('owner handles normalise: @Mike, mike and " MIKE " are one name', () => {
  assert.equal(normHandle('@Mike'), 'mike');
  assert.equal(normHandle(' MIKE '), 'mike');
  assert.equal(normHandle('mi ke!'), 'mike');
});

test('People: humans only, never the owner, agents or the Collator; newest first; last 7 days', () => {
  const a = msg(human('Sam'), 'older hello', 30);
  const b = msg(human('Ana'), 'newer hello', 2);
  const own = msg(human('Mike'), 'my own post', 1);
  const ownAddr = msg({ name: 'M.', kind: 'human', address: '@mike' }, 'me by address', 1);
  const bot = msg(agent('Ledger desk'), 'DONE poster', 1);
  const col = msg(COLLATOR, 'Also threaded elsewhere', 1, { parent: own.id });
  const old = msg(human('Old'), 'last month', 24 * 9);
  const r = buildPiles({ owner: '@mike', threads: [thread('#court', 'k1', [a, b, own, ownAddr, bot, col, old])], now: NOW });
  assert.deepEqual(r.piles.people.map((x) => x.snippet), ['newer hello', 'older hello']);
  assert.equal(r.piles.people[0].link, `loom:k1#${b.id}`);
  assert.equal(r.piles.people[0].label, '#court');
  assert.equal(r.collatorCount, 1, 'the Collator reply under the owner is counted, not shown');
  assert.equal(r.rest.count, 3, 'own posts and the agent line are "everything else"; the Collator is not');
  assert.equal(r.owner, '@mike');
});

test('an echo is the same message as its original: one item, linked to where it was written', () => {
  const orig = msg(human('Sam'), 'hey @mike look', 3);
  const echo = msg(human('Sam'), 'hey @mike look', 3, { kind: 'link', via: { address: '#court', key: 'k1', id: orig.id, label: '#court' } });
  const both = buildPiles({ owner: 'mike', threads: [thread('@mike', 'kin', [echo]), thread('#court', 'k1', [orig])], now: NOW });
  assert.equal(both.piles.people.length, 1);
  assert.equal(both.piles.people[0].address, '#court');
  const onlyEcho = buildPiles({ owner: 'mike', threads: [thread('@mike', 'kin', [echo])], now: NOW });
  assert.equal(onlyEcho.piles.people[0].link, `loom:k1#${orig.id}`);
});

test('Needs your yes: open NEEDS MIKE lines; CLEARED by the same desk or the owner closes; anyone else does not', () => {
  const done = msg(agent('Build desk'), 'DONE three PRs', 5);
  const open1 = msg(agent('Build desk'), 'NEEDS MIKE · merge #12 · reply here', 5, { parent: done.id });
  const closedBySame = msg(agent('Build desk'), 'NEEDS MIKE · approve copy · here', 6, { parent: done.id });
  const clear1 = msg(agent('Build desk'), 'CLEARED copy approved', 4, { parent: closedBySame.id });
  const closedByOwner = msg(agent('Art desk'), 'NEEDS MIKE · pick a poster', 7);
  const mikeYes = msg(human('Mike'), 'yes the blue one', 6, { parent: closedByOwner.id });
  const clearDeep = msg(human('@Mike'), 'CLEARED done', 5, { parent: mikeYes.id });
  const notClosed = msg(agent('Ops desk'), 'NEEDS MIKE · sign off', 8);
  const strangerClear = msg(human('Stranger'), 'CLEARED lol', 7, { parent: notClosed.id });
  const alex = msg(agent('Ops desk'), 'NEEDS ALEX · something else', 3);
  const midLine = msg(agent('Ops desk'), 'status: NEEDS MIKE later', 3);
  const r = buildPiles({ owner: 'mike', now: NOW, threads: [thread('#officenoun', 'k2',
    [done, open1, closedBySame, clear1, closedByOwner, mikeYes, clearDeep, notClosed, strangerClear, alex, midLine])] });
  assert.deepEqual(r.piles.needsYes.map((x) => x.id), [open1.id, notClosed.id], 'newest first; a stranger cannot clear it');
  assert.ok(!r.piles.needsYes.some((x) => x.id === alex.id), 'NEEDS ALEX is not in mike\'s pile');
  const forAlex = buildPiles({ owner: 'alex', now: NOW, threads: [thread('#officenoun', 'k2', [alex])] });
  assert.deepEqual(forAlex.piles.needsYes.map((x) => x.id), [alex.id], 'any owner\'s name works');
});

test('New arrivals: first posts in the last 48h, not the owner, Collator or robots', () => {
  const first = msg(agent('Newbot'), 'hello, I am new', 3);
  const firstPosts = new Map([
    ['newbot', { name: 'Newbot', kind: 'agent', key: 'k3', address: '#loom', id: first.id, at: first.at, body: first.body }],
    ['sam', { name: 'Sam', kind: 'human', key: 'k9', address: '#court', id: 'm_x00001', at: ago(10), body: 'first from sam', label: '#court' }],
    ['old', { name: 'Old', kind: 'human', key: 'k9', address: '#court', id: 'm_x00002', at: ago(60), body: 'too old' }],
    ['mike', { name: 'Mike', kind: 'human', key: 'k9', address: '#court', id: 'm_x00003', at: ago(1), body: 'owner' }],
    ['collator', { name: 'Collator', kind: 'robot', key: 'k9', address: '#court', id: 'm_x00004', at: ago(1), body: 'robot' }],
  ]);
  const r = buildPiles({ owner: 'mike', now: NOW, threads: [thread('#loom', 'k3', [first])], firstPosts });
  assert.deepEqual(r.piles.arrivals.map((x) => x.from.name), ['Newbot', 'Sam']);
  assert.equal(r.piles.arrivals[1].snippet, 'first from sam', 'a first post outside the scan still shows from its outbox record');
});

test('isNew is at > seenAt; with no mark yet only the last 24 hours count as new', () => {
  const a = msg(human('Sam'), 'two hours ago', 2), b = msg(human('Ana'), 'two days ago', 48);
  const t = [thread('#court', 'k1', [a, b])];
  const marked = buildPiles({ owner: 'mike', now: NOW, threads: t, seenAt: ago(10) });
  assert.deepEqual(marked.piles.people.map((x) => x.isNew), [true, false]);
  assert.equal(marked.newCount, 1);
  assert.equal(marked.seenAt, ago(10));
  const first = buildPiles({ owner: 'mike', now: NOW, threads: t, seenAt: null });
  assert.deepEqual(first.piles.people.map((x) => x.isNew), [true, false]);
});

test('the text digest has the three piles, new marks, and the hidden counts', () => {
  const r = buildPiles({ owner: 'mike', now: NOW, threads: [thread('#court', 'k1', [msg(human('Sam'), 'hi\nthere', 1)])] });
  const text = forYouText(r, { generatedAt: NOW.toISOString() });
  assert.match(text, /^What needs @mike on the PointCast Loom/);
  assert.match(text, /PEOPLE \(1\)\n- Sam in #court: hi there \(2026-11-13 11:00 UTC\) https:\/\/pointcast\.xyz\/loom\?to=%23court#m_\S+ \(new\)/);
  assert.ok(text.indexOf('PEOPLE') < text.indexOf('NEEDS YOUR YES') && text.indexOf('NEEDS YOUR YES') < text.indexOf('NEW ARRIVALS'));
  assert.match(text, /- Nothing needs your yes\./);
  assert.match(text, /Everything else: 0 messages\nCollator lines hidden: 0/);
});

// ---- service ----

function memoryKv() {
  const map = new Map();
  const reads = [];
  return { map, reads, get: async (k) => { reads.push(k); return map.get(k) ?? null; }, put: async (k, v) => { map.set(k, v); } };
}
const base = 'https://pointcast.xyz/api/loom';
let ip = 0;
const post = async (kv, body, opts = {}) => (await handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `10.1.0.${ip++ % 250}` }, body: JSON.stringify(body) }), { kv, firstHelloEnabled: false, ...opts })).json();
const getFor = (kv, query, opts = {}) => handleLoom(new Request(`${base}?for=${query}`), { kv, ...opts });

async function board() {
  const kv = memoryKv();
  const done = await post(kv, { to: '#officenoun', from: agent('Build desk'), body: 'DONE OFF-45 drafted' });
  const needs = await post(kv, { to: `loom:${done.address.slice(5)}`, from: agent('Build desk'), body: 'NEEDS MIKE · merge the draft · reply here' });
  await post(kv, { to: '#court', from: human('Sam'), body: 'is anyone at the courts?' });
  await post(kv, { to: '@mike', from: human('Ana'), body: 'hello mike' });
  return { kv, needs };
}

test('GET ?for=mike answers the three piles as JSON, bounded, cached briefly, and writes nothing', async () => {
  const { kv, needs } = await board();
  const before = new Map(kv.map);
  const res = await getFor(kv, 'Mike');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Cache-Control'), 'public, max-age=30');
  const j = await res.json();
  assert.equal(j.ok, true);
  assert.equal(j.owner, '@mike');
  assert.equal(j.seenAt, null);
  assert.deepEqual(j.scanned, { logs: 3, window: '14d' });
  assert.deepEqual(j.piles.people.map((x) => x.snippet).sort(), ['hello mike', 'is anyone at the courts?']);
  assert.deepEqual(j.piles.needsYes.map((x) => x.link), [needs.address]);
  assert.deepEqual(j.piles.arrivals.map((x) => x.from.name).sort(), ['Ana', 'Build desk', 'Sam']);
  assert.equal(typeof j.generatedAt, 'string');
  assert.deepEqual([...kv.map.keys()].sort(), [...before.keys()].sort());
  for (const [k, v] of before) assert.equal(kv.map.get(k), v, `GET must not write ${k}`);
});

test('a CLEARED reply from the same desk closes the NEEDS line on the server too', async () => {
  const { kv, needs } = await board();
  await post(kv, { to: needs.address, from: agent('Build desk'), body: 'CLEARED merged by Mike' });
  const j = await (await getFor(kv, 'mike')).json();
  assert.equal(j.piles.needsYes.length, 0);
});

test('format=text and format=rss', async () => {
  const { kv } = await board();
  const t = await getFor(kv, 'mike&format=text');
  assert.match(t.headers.get('Content-Type'), /^text\/plain/);
  const text = await t.text();
  assert.match(text, /NEEDS YOUR YES \(1\)\n- Build desk \(agent\) in #officenoun: NEEDS MIKE · merge the draft/);
  assert.match(text, /Collator lines hidden: \d+/);
  const r = await getFor(kv, 'mike&format=rss');
  assert.match(r.headers.get('Content-Type'), /^application\/rss\+xml/);
  const rss = await r.text();
  assert.equal((rss.match(/<item>/g) ?? []).length, 3, 'one item per People and Needs-your-yes entry');
  assert.match(rss, /<title>Needs your yes · Build desk \(agent\) in #officenoun: NEEDS MIKE · merge the draft · reply here<\/title>/);
  assert.match(rss, /<link>https:\/\/pointcast\.xyz\/loom\?to=%23court#m_[0-9a-z]+<\/link>/);
  assert.match(rss, /<guid isPermaLink="false">loom:[0-9a-f]{24}#m_[0-9a-z]+<\/guid>/);
});

test('an empty or impossible owner is a clear 400', async () => {
  const kv = memoryKv();
  for (const q of ['', '%40', '!!!', 'x'.repeat(40)]) {
    const res = await getFor(kv, q);
    assert.equal(res.status, 400, q);
    const j = await res.json();
    assert.equal(j.ok, false);
    assert.match(j.error, /^for_name_(required|invalid)$/);
  }
});

test('log reads are bounded: at most 40 logs, the owner\'s inbox always among them', async () => {
  const kv = memoryKv();
  await post(kv, { to: '@mike', from: human('Ana'), body: 'oldest, in the inbox' });
  for (let i = 0; i < 50; i += 1) await post(kv, { to: `#t${i}`, from: agent('Spam desk'), body: `line ${i}` });
  kv.reads.length = 0;
  const j = await (await getFor(kv, 'mike')).json();
  assert.equal(j.scanned.logs, 40);
  assert.ok(j.piles.people.some((x) => x.snippet === 'oldest, in the inbox'));
  assert.ok(kv.reads.filter((k) => k.startsWith('loom:log:')).length <= 40);
  assert.ok(kv.reads.filter((k) => k.startsWith('loom:out:')).length <= 30);
});

test('POST seen moves the mark forward only, clamps the future, and uses the loom:seen bucket', async () => {
  const kv = memoryKv();
  const clock = () => NOW;
  const seen = (body, opts) => post(kv, { action: 'seen', ...body }, { clock, ...opts });
  let r = await seen({ name: '@Mike', at: ago(5) });
  assert.equal(r.ok, true);
  assert.equal(r.seenAt, ago(5));
  r = await seen({ name: 'mike', at: ago(9) });
  assert.equal(r.moved, false);
  assert.equal(r.seenAt, ago(5), 'an older time never moves it back');
  r = await seen({ name: 'mike', at: '2030-01-01T00:00:00.000Z' });
  assert.equal(r.seenAt, NOW.toISOString(), 'a future time is clamped to now');
  r = await seen({ name: 'mike' });
  assert.equal(r.moved, false);
  assert.equal((await seen({ name: 'mike', at: 'yesterday-ish' })).error, 'seen_at_invalid');
  assert.equal((await seen({ name: '' })).error, 'seen_name_required');
  const j = await (await getFor(kv, 'mike', { clock })).json();
  assert.equal(j.seenAt, NOW.toISOString());
  const buckets = [];
  const res = await handleLoom(new Request(base, { method: 'POST', body: JSON.stringify({ action: 'seen', name: 'mike' }) }),
    { kv, limit: async (b) => { buckets.push(b); return { allowed: b !== 'loom:seen', retryAfter: 30 }; } });
  assert.equal(res.status, 429);
  assert.deepEqual(buckets, ['loom:seen']);
  assert.match(readFileSync(new URL('../functions/api/loom.ts', import.meta.url), 'utf8'), /'loom:seen': \{ windowSec: 600, maxRequests: 30 \}/);
});

test('/loom/for/NAME: plain text by default, json and rss on ask, noindex', async () => {
  const { kv } = await board();
  const go = (path) => serveFor(new Request(`https://pointcast.xyz/loom/for/${path}`), kv, path.split('?')[0]);
  let res = await go('mike');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /^text\/plain/);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex');
  assert.match(await res.text(), /PEOPLE \(2\)/);
  res = await go('mike?format=json');
  assert.equal((await res.json()).owner, '@mike');
  res = await go('mike?format=rss');
  assert.match(res.headers.get('Content-Type'), /rss/);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex');
  res = await serveFor(new Request('https://pointcast.xyz/loom/for/%21%21'), kv, '!!');
  assert.equal(res.status, 400);
  assert.match(await res.text(), /Not a Loom name/);
  assert.equal((await serveFor(new Request('https://pointcast.xyz/loom/for/mike', { method: 'POST' }), kv, 'mike')).status, 405);
});

// ---- the page (harness copied from tests/loom-v3-page.test.mjs) ----

const SOURCE = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
const between = (s, a, b) => { const i = s.indexOf(a) + a.length; return s.slice(i, s.indexOf(b, i)); };
const CSS = between(SOURCE, '<style is:inline>', '</style>');
const BODY = between(SOURCE, '<body>', '<script is:inline>');
const JS = between(SOURCE, '<script is:inline>', '</script>');
const ORIGIN = 'https://pointcast.xyz';
const api = (kv, path, init) => handleLoom(new Request(new URL(path, ORIGIN), init), { kv });
const open = [];
test.afterEach(() => { while (open.length) open.pop().close(); });

async function page(kv, { name = 'tester', sent = null, path = '/loom' } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head><style>${CSS}</style></head><body>${BODY}</body></html>`, {
    url: ORIGIN + path, runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  open.push(w);
  if (name) w.localStorage.setItem('loom.name', name);
  if (sent) w.localStorage.setItem('loom.sent', JSON.stringify(sent));
  w.posts = [];
  w.fetch = async (url, init = {}) => {
    const { signal, cache, ...rest } = init;
    if (rest.method === 'POST') w.posts.push(JSON.parse(rest.body));
    return api(kv, new URL(url, ORIGIN).href, rest);
  };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // keep the page's own minute tick reachable, so a test can run it without waiting a minute
  const every = w.setInterval.bind(w);
  w.ticks = [];
  w.setInterval = (fn, ms) => { w.ticks.push({ fn, ms }); return every(fn, ms); };
  w.eval(JS);
  await settle(w);
  return w;
}
const settle = async (w, ms = 60) => { for (let i = 0; i < 6; i += 1) await new Promise((r) => w.setTimeout(r, ms / 6)); };
const fy = (w) => w.document.getElementById('fyDyn');

test('page: three piles in order, a human post under People, Collator hidden from Replies to you, one seen POST', async () => {
  const kv = memoryKv();
  // tester posts a link; someone already threaded it elsewhere, so the Collator replies under tester's post
  await post(kv, { to: '#one', from: human('Other'), body: 'see https://example.com/a' });
  const mine = await post(kv, { to: '#two', from: human('tester'), body: 'see https://example.com/a too' });
  await post(kv, { to: '#court', from: human('Sam'), body: 'court is open' });
  const w = await page(kv, { sent: { [mine.message.id]: mine.editToken } });
  await settle(w, 900);
  const heads = [...fy(w).querySelectorAll('h2.sect')].map((x) => x.textContent);
  assert.deepEqual(heads.slice(0, 7), ['Replies to you', 'Not answered yet', 'What got done', 'Start something', 'People', 'Needs your yes', 'New arrivals']);
  assert.ok(heads.indexOf('Waiting on you') > 2, 'the old lists are inside the fold');
  const more = fy(w).querySelector('details#fyMore');
  assert.ok(more && !more.open, 'Everything else is folded');
  assert.match(more.querySelector('summary').textContent, /^Everything else/);
  const people = [...fy(w).querySelectorAll('button[data-fy^="people|"]')].map((b) => b.textContent);
  assert.ok(people.some((t) => /Sam/.test(t) && /court is open/.test(t)), 'Sam is under People');
  assert.ok(!people.some((t) => /Collator/.test(t)));
  assert.equal(fy(w).querySelector('[data-pile="yes"] + p').textContent, 'Nothing needs your yes.');
  // the browser's own lists: the Collator reply to tester's post is counted, not listed
  assert.ok(!more.textContent.includes('Also threaded elsewhere'));
  assert.equal(w.document.getElementById('fyRobots').textContent, '1 house robot line hidden');
  assert.match(w.document.getElementById('fyNew').textContent, /^New since you last looked: \d+ · last looked never$/);
  assert.equal(fy(w).querySelector('[data-fyact="feed"]').getAttribute('href'), '/loom/for/tester?format=rss');
  const seen = () => w.posts.filter((p) => p.action === 'seen');
  assert.equal(seen().length, 1);
  assert.equal(seen()[0].name, 'tester');
  // re-renders do not post it again
  w.document.dispatchEvent(new w.Event('visibilitychange'));
  w.document.getElementById('welGot')?.click();
  await settle(w, 900);
  assert.equal(seen().length, 1);
  // the tab badge counts Needs your yes + new People
  assert.ok(Number(w.document.querySelector('#tabs [data-tab="for-you"] .pbadge').textContent) >= 1);
});

test('page: a NEEDS line shows under Needs your yes; untrusted text stays text', async () => {
  const kv = memoryKv();
  const done = await post(kv, { to: '#desk', from: agent('Build desk'), body: 'DONE things' });
  await post(kv, { to: done.address, from: agent('Build desk'), body: 'NEEDS TESTER · <img src=x onerror=alert(1)> · here' });
  const w = await page(kv);
  await settle(w, 300);
  const yes = [...fy(w).querySelectorAll('button[data-fy^="yes|"]')];
  assert.equal(yes.length, 1);
  assert.match(yes[0].textContent, /NEEDS TESTER · <img/);
  assert.equal(fy(w).querySelectorAll('img').length, 0);
});

test('page: if the for= read fails, today\'s lists show unfolded with no error noise', async () => {
  const kv = memoryKv();
  const dom = new JSDOM(`<!doctype html><html><body>${BODY}</body></html>`, { url: `${ORIGIN}/loom`, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  open.push(w);
  w.localStorage.setItem('loom.name', 'tester');
  w.fetch = async (url, init = {}) => {
    const { signal, cache, ...rest } = init;
    if (/[?&]for=/.test(url)) return new Response('{"ok":false}', { status: 500 });
    return api(kv, new URL(url, ORIGIN).href, rest);
  };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.eval(JS);
  await settle(w, 300);
  assert.equal(fy(w).querySelector('h2.sect').textContent, 'Waiting on you');
  assert.equal(fy(w).querySelector('details#fyMore'), null);
  assert.doesNotMatch(fy(w).textContent, /error|failed/i);
});

// ---- review fixes (OFF-45) ----

test('NEEDS word: @ and closing punctuation are fine, a longer handle is someone else', () => {
  const count = (body) => buildPiles({ owner: 'mike', now: NOW, threads: [thread('#d', 'kd', [msg(agent('Desk'), body, 1)])] }).piles.needsYes.length;
  for (const body of ['NEEDS MIKE. look here', 'NEEDS @MIKE · x · here', 'NEEDS MIKE: x', 'NEEDS MIKE']) assert.equal(count(body), 1, body);
  for (const body of ['NEEDS MIKEY · x', 'NEEDS MIKE-H · x', 'NEEDS MIKE.H x', 'NEEDS MIKE_2 x', 'NEEDSMIKE x']) assert.equal(count(body), 0, body);
});

test('an open NEEDS line 10 days old in a quiet thread is still read (14-day window), within the same 40 logs', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#quiet', from: agent('Build desk'), body: 'NEEDS MIKE · sign the form · here' }, { clock: () => new Date(NOW.getTime() - 10 * 86400000) });
  await post(kv, { to: '#stale', from: agent('Build desk'), body: 'NEEDS MIKE · too old · here' }, { clock: () => new Date(NOW.getTime() - 20 * 86400000) });
  const j = await (await getFor(kv, 'mike', { clock: () => NOW })).json();
  assert.deepEqual(j.piles.needsYes.map((x) => x.snippet), ['NEEDS MIKE · sign the form · here']);
  assert.equal(j.scanned.logs, 1);
});

test('seen: the name must be a string', async () => {
  const kv = memoryKv();
  for (const name of [{ a: 1 }, ['mike'], 7]) assert.equal((await post(kv, { action: 'seen', name })).error, 'seen_name_required');
  assert.ok(![...kv.map.keys()].some((k) => k.startsWith('loom:seen:')));
});

test('/loom/for/NAME: a storage failure is a 503 that is not cached, not "Not a Loom name"', async () => {
  const res = await serveFor(new Request('https://pointcast.xyz/loom/for/mike'), { get: async () => { throw new Error('down'); } }, 'mike');
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.doesNotMatch(await res.text(), /Not a Loom name/);
});

test('page: New tags stay for the page view after its own seen mark and a refresh', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#court', from: human('Sam'), body: 'court is open' });
  const w = await page(kv);
  await settle(w, 900);
  assert.equal(w.posts.filter((p) => p.action === 'seen').length, 1);
  const news = () => fy(w).querySelectorAll('button[data-fy^="people|"] .tag.new').length;
  assert.equal(news(), 1);
  const real = w.Date.now;
  w.Date.now = () => real() + 61000;  // a minute on: the page's tick refetches the piles
  w.ticks.filter((t) => t.ms === 60000).forEach((t) => t.fn());
  await settle(w, 300);
  assert.equal(news(), 1, 'still New after the refresh');
  assert.match(w.document.getElementById('fyNew').textContent, /^New since you last looked: 1 · last looked never$/);
  assert.equal(w.posts.filter((p) => p.action === 'seen').length, 1);
});

test('a ?as=NAME visit name never moves that name\'s server seen mark', async () => {
  const kv = memoryKv();
  const w = await page(kv, { name: null, path: '/loom?as=mike' });
  await settle(w, 900);
  assert.equal(w.posts.filter((p) => p.action === 'seen').length, 0);
});

test('recent top-level agent relays asking for a yes are open until a later owner reply or clearance', () => {
  const phrases = ["It needs Mike's yes", 'Needs your yes before release', 'Please get his yes', 'Relay not his signature'];
  const asks = phrases.map((body) => msg(agent('Desk'), body, 3));
  const old = msg(agent('Desk'), 'Needs your yes', 25);
  const reply = msg(agent('Desk'), 'Needs your yes', 2, { parent: asks[0].id });
  const humanAsk = msg(human('Sam'), 'Needs your yes', 2);
  const closed = msg(agent('Desk'), 'Needs your yes', 4);
  const owner = msg(human('Mike'), 'I saw this', 1, { parent: closed.id });
  const cleared = msg(agent('Desk'), 'Get his yes', 4);
  const clear = msg(agent('Other'), 'CLEARED', 1, { parent: cleared.id });
  const result = buildPiles({ owner: 'mike', now: NOW, threads: [thread('#work', 'k', [...asks, old, reply, humanAsk, closed, owner, cleared, clear])] });
  assert.deepEqual(new Set(result.piles.needsYes.map((x) => x.id)), new Set(asks.map((x) => x.id)));
});

test('new count includes unanswered inbox notes and deduplicates items also in a pile', () => {
  const a = msg(agent('Desk'), 'Please look', 1);
  const b = msg(human('Sam'), 'Hello', 2);
  const answered = msg(agent('Desk'), 'Already answered', 3);
  const answer = msg(human('Mike'), 'Done', 1, { parent: answered.id });
  const r = buildPiles({ owner: 'mike', now: NOW, threads: [thread('@mike', 'inbox', [a, b, answered, answer])] });
  assert.equal(r.newCount, 3, 'answered messages are still new inbox activity');
  assert.equal(r.newWaiting.length, 2);
  assert.match(forYouText(r, { generatedAt: NOW.toISOString() }), /New since then: 3/);
});


test('OFF-55: agent replies to old posts, unanswered posts, DONE media and counts', () => {
  const mine = msg(human('Mike'), 'old question', 100);
  const noAnswer = msg(human('Mike'), 'still waiting', 50);
  const agentReply = msg(agent('Desk'), 'Here is the answer', 1, { parent: mine.id });
  const nested = msg(agent('Other'), 'another answer', 0.5, { parent: agentReply.id });
  const robot = msg(COLLATOR, 'automated', 0.5, { parent: noAnswer.id });
  const done = msg(agent('Desk'), 'DONE draft https://example.com/pr/1 https://example.com/card.png', 2);
  const echo = msg(agent('Desk'), done.body, 2, { via: { key: 'room', address: '#room', id: done.id } });
  const inbox = msg(agent('Agent'), 'Hi Mike', 1);
  const r = buildPiles({ owner: 'mike', now: NOW, seenAt: ago(3), threads: [thread('#room', 'room', [mine, noAnswer, agentReply, nested, robot, done]), thread('@mike', 'inbox', [echo, inbox])] });
  assert.deepEqual(r.activity.replies.map((x) => x.id), [nested.id, agentReply.id]);
  assert.deepEqual(r.activity.unanswered.map((x) => x.id), [noAnswer.id]);
  assert.equal(r.activity.done.length, 1);
  assert.equal(r.activity.done[0].externalUrl, 'https://example.com/pr/1');
  assert.equal(r.activity.done[0].imageUrl, 'https://example.com/card.png');
  assert.equal(r.newCount, 4);
});
