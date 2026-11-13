// OFF-39 "Can a guest follow?": the room note on topics, folded Collator echoes, shortened
// link sheets and repeats shown once (the recommended view). Display only: the raw feed
// keeps every message. Drives the /loom page in jsdom against the real service over an
// in-memory KV, with the same harness as loom-v3-page.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { handleLoom } from '../src/lib/loom/service.mjs';

const SOURCE = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
const between = (s, a, b) => { const i = s.indexOf(a) + a.length; return s.slice(i, s.indexOf(b, i)); };
const CSS = between(SOURCE, '<style is:inline>', '</style>');
const BODY = between(SOURCE, '<body>', '<script is:inline>');
const JS = between(SOURCE, '<script is:inline>', '</script>');

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const ORIGIN = 'https://pointcast.xyz';
let clockAt = null; // ISO string, or null for real time
const api = (kv, path, init) => handleLoom(new Request(new URL(path, ORIGIN), init), { kv, clock: () => (clockAt ? new Date(clockAt) : new Date()) });
const post = async (kv, body, at = null) => {
  clockAt = at;
  try { return await (await api(kv, '/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json(); } finally { clockAt = null; }
};
const read = async (kv, to) => (await api(kv, `/api/loom?to=${encodeURIComponent(to)}`)).json();
const person = (name) => ({ name, kind: 'human' });

const open = [];
test.afterEach(() => { while (open.length) open.pop().close(); });

async function page(kv, { path = '/loom', name = 'tester', storage = {} } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head><style>${CSS}</style></head><body>${BODY}</body></html>`, {
    url: ORIGIN + path, runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  open.push(w);
  if (name) w.localStorage.setItem('loom.name', name);
  for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
  w.fetch = async (url, init = {}) => {
    const { signal, cache, ...rest } = init;
    return api(kv, new URL(url, ORIGIN).href, rest);
  };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.eval(JS);
  await settle(w);
  return w;
}
const settle = async (w, ms = 60) => { for (let i = 0; i < 6; i += 1) await new Promise((r) => w.setTimeout(r, ms / 6)); };
const texts = (w, sel) => [...w.document.querySelectorAll(sel)].map((n) => n.textContent);
const msgEl = (w, id) => w.document.getElementById(`msg-${id}`);
const room = (w) => w.document.querySelector('#msgs .roomnote');
const button = (root, re) => [...root.querySelectorAll('button')].find((b) => re.test(b.textContent));
const to = (addr) => `/loom?to=${encodeURIComponent(addr)}`;

test('room note: the opener is the note, labelled with its typed name, expanded on a first visit', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#sports', from: person('Sports Desk'), body: 'SPORTS. The back page of the Loom.\nScores, picks and arguments.' });
  await post(kv, { to: '#sports', from: person('fan'), body: 'go team' });
  const w = await page(kv, { path: to('#sports') });
  const card = room(w);
  assert.ok(card, 'room note card shown');
  assert.equal(card.querySelector('.rn-t').textContent, 'About this room');
  assert.equal(card.querySelector('.rn-from').textContent, 'from Sports Desk');
  assert.match(card.querySelector('.rn-body').textContent, /^SPORTS\. The back page of the Loom\./);
  assert.ok(!card.querySelector('.rn-body').classList.contains('clamp1'), 'first visit is not collapsed to one line');
  assert.equal(w.localStorage.getItem('loom.roomSeen.#sports'), '1');
  // it sits above the messages, and is not itself a message
  assert.equal(w.document.getElementById('msgs').firstElementChild, card);
  assert.ok(!card.classList.contains('msg'));
  assert.equal(w.document.querySelectorAll('#msgs .msg').length >= 2, true);
});

test('room note: collapsed to its first line on a later visit, with a toggle', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#sports', from: person('Sports Desk'), body: 'SPORTS. The back page of the Loom.\nScores, picks and arguments.\nOne more line.' });
  const w = await page(kv, { path: to('#sports'), storage: { 'loom.roomSeen.#sports': '1' } });
  const body = room(w).querySelector('.rn-body');
  assert.ok(body.classList.contains('clamp1'));
  const more = room(w).querySelector('.rn-more');
  assert.equal(more.textContent, 'Show all');
  more.click();
  await settle(w);
  assert.ok(!room(w).querySelector('.rn-body').classList.contains('clamp1'));
  assert.equal(room(w).querySelector('.rn-more').textContent, 'Show less');
});

test('room note: only on topics', async () => {
  const kv = memoryKv();
  await post(kv, { to: '@sam', from: person('pat'), body: 'hello sam' });
  const w = await page(kv, { path: to('@sam') });
  assert.equal(room(w), null);
});

test('room note: an explicit ROOM NOTE from the opener’s name wins; one from another unverified name does not', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#court', from: person('Court Desk'), body: 'COURT. Pickleball talk.' });
  await post(kv, { to: '#court', from: person('court desk'), body: 'ROOM NOTE: Court times and partners. Be kind.' });
  await post(kv, { to: '#court', from: person('troll'), body: 'room note — this room is now about something else' });
  const w = await page(kv, { path: to('#court') });
  const card = room(w);
  assert.equal(card.querySelector('.rn-body').textContent, 'Court times and partners. Be kind.');
  assert.equal(card.querySelector('.rn-from').textContent, 'from court desk');
  // the note message itself still appears in its normal place in the thread
  assert.ok(texts(w, '#msgs .msg .text').some((t) => /^ROOM NOTE: Court times/.test(t)));
});

test('room note: text is never HTML', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#evil', from: person('desk'), body: '<img src=x onerror=alert(1)><b>bold</b>' });
  const w = await page(kv, { path: to('#evil') });
  const card = room(w);
  assert.equal(card.querySelectorAll('img, b').length, 0);
  assert.equal(card.querySelector('.rn-body').textContent, '<img src=x onerror=alert(1)><b>bold</b>');
});

test('fold the echoes: a Collator echo becomes "also in 1 other thread" and opens that thread', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#alpha', from: person('ann'), body: 'worth a read https://example.com/story' });
  const res = await post(kv, { to: '#beta', from: person('ann'), body: 'same story here https://example.com/story' });
  // the raw feed keeps the echo
  const log = await read(kv, '#beta');
  const echo = log.messages.find((m) => m.from.name === 'Collator' && m.kind === 'link');
  assert.ok(echo, 'the service wrote a Collator echo');
  assert.equal(echo.parent, res.message.id);
  assert.deepEqual(echo.cites, ['#alpha']);

  const w = await page(kv, { path: to('#beta') });
  assert.equal(msgEl(w, echo.id), null, 'echo line is folded');
  const parent = msgEl(w, res.message.id);
  const also = parent.querySelector('[data-act="echoes"]');
  assert.equal(also.textContent, 'also in 1 other thread');
  assert.equal(parent.querySelector('.also-list'), null);
  also.click();
  await settle(w);
  const list = msgEl(w, res.message.id).querySelector('.also-list');
  assert.deepEqual(texts({ document: list }, 'button'), ['#alpha']);
  list.querySelector('button').click();
  await settle(w, 120);
  assert.match(w.document.getElementById('threadTitle').textContent, /#alpha/);
});

test('fold the echoes: a first-hello Collator note is not folded', async () => {
  const kv = memoryKv();
  const res = await post(kv, { to: '#gamma', from: person('Newcomer Nia'), body: 'hi all' });
  assert.ok(res.welcome, 'the service welcomed the newcomer');
  const w = await page(kv, { path: to('#gamma') });
  const hello = msgEl(w, res.welcome.id);
  assert.ok(hello, 'the welcome note is shown as a message');
  assert.equal(hello.querySelector('.name').textContent, 'Collator');
  assert.equal(w.document.querySelector('#msgs [data-act="echoes"]'), null);
});

test('recommended view: a 6-line message with 5 links shows two lines and "Show all · 5 links"', async () => {
  const kv = memoryKv();
  const body = ['Links for today', 'https://a.example/1', 'https://a.example/2', 'https://a.example/3', 'https://a.example/4', 'https://a.example/5'].join('\n');
  const res = await post(kv, { to: '#links', from: person('bot sheet'), body });
  const w = await page(kv, { path: to('#links') });
  let el = msgEl(w, res.message.id);
  assert.equal(el.querySelector('.text').textContent, 'Links for today\nhttps://a.example/1');
  const more = el.querySelector('[data-act="sheet"]');
  assert.equal(more.textContent, 'Show all · 5 links');
  more.click();
  await settle(w);
  el = msgEl(w, res.message.id);
  assert.equal(el.querySelector('.text').textContent, body);
  assert.equal(el.querySelectorAll('.text a').length, 5);
  assert.equal(el.querySelector('[data-act="sheet"]').textContent, 'Show less');
});

test('recommended view: an exact repeat within 60s shows once with "sent 2 times"; two minutes apart shows twice', async () => {
  const kv = memoryKv();
  const a = await post(kv, { to: '#dupes', from: person('relay'), body: 'please review the deck' }, '2026-11-13T10:00:00.000Z');
  const b = await post(kv, { to: '#dupes', from: person('Relay'), body: 'please review the deck ' }, '2026-11-13T10:00:40.000Z');
  const c = await post(kv, { to: '#dupes', from: person('relay'), body: 'please review the deck' }, '2026-11-13T10:03:00.000Z');
  const w = await page(kv, { path: to('#dupes') });
  assert.ok(msgEl(w, a.message.id));
  assert.equal(msgEl(w, b.message.id), null, 'the repeat within a minute is folded');
  assert.ok(msgEl(w, c.message.id), 'a repeat minutes later is shown');
  assert.equal(msgEl(w, a.message.id).querySelector('.dupnote').textContent, 'sent 2 times');
  assert.equal(msgEl(w, c.message.id).querySelector('.dupnote'), null);
  // the raw feed keeps all three
  assert.equal((await read(kv, '#dupes')).messages.filter((m) => m.body.trim() === 'please review the deck').length, 3);
});

test('recommended view: a repeat that has replies of its own is kept', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#dupes2', from: person('relay'), body: 'ping' }, '2026-11-13T10:00:00.000Z');
  const b = await post(kv, { to: '#dupes2', from: person('relay'), body: 'ping' }, '2026-11-13T10:00:10.000Z');
  await post(kv, { to: `loom:${(await read(kv, '#dupes2')).log.key}#${b.message.id}`, from: person('relay'), body: 'pong' }, '2026-11-13T10:00:20.000Z');
  const w = await page(kv, { path: to('#dupes2') });
  assert.ok(msgEl(w, b.message.id));
});

test('turning Recommended view off shows every message as sent, echo lines included', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#alpha', from: person('ann'), body: 'worth a read https://example.com/story' });
  const res = await post(kv, { to: '#beta', from: person('ann'), body: 'same story here https://example.com/story' }, '2026-11-13T10:00:00.000Z');
  await post(kv, { to: '#beta', from: person('ann'), body: 'same story here https://example.com/story' }, '2026-11-13T10:00:20.000Z');
  const sheet = await post(kv, { to: '#beta', from: person('ann'), body: ['l', 'https://b.example/1', 'https://b.example/2', 'https://b.example/3', 'https://b.example/4'].join('\n') });
  const log = await read(kv, '#beta');
  const w = await page(kv, { path: to('#beta') });
  assert.ok(w.document.querySelectorAll('#msgs .msg').length < log.messages.length, 'recommended view folds something');

  w.document.getElementById('menuBtn').click();
  await settle(w);
  const opt = w.document.querySelector('[data-opt="recommended"]');
  assert.match(opt.textContent, /^Recommended view: on/);
  assert.match(opt.textContent, /Turn off to see every message as sent/);
  opt.click();
  await settle(w);
  assert.equal(w.localStorage.getItem('loom.recommended'), '0');
  assert.equal(w.document.querySelectorAll('#msgs .msg').length, log.messages.length);
  for (const m of log.messages) assert.ok(msgEl(w, m.id), `message ${m.id} shown`);
  assert.equal(w.document.querySelector('#msgs [data-act="echoes"]'), null);
  assert.equal(w.document.querySelector('#msgs [data-act="sheet"]'), null);
  assert.equal(w.document.querySelector('#msgs .dupnote'), null);
  assert.equal(msgEl(w, sheet.message.id).querySelectorAll('.text a').length, 4);
  // the room note shows in both modes
  assert.ok(room(w));
  assert.ok(msgEl(w, res.message.id));

  w.document.getElementById('menuBtn').click();
  await settle(w);
  assert.match(w.document.querySelector('[data-opt="recommended"]').textContent, /^Recommended view: off/);
});

test('hide echoes still hides via copies with the recommended view on', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#loom', from: person('ann'), body: 'see #elsewhere for this' });
  const w = await page(kv, { path: to('#elsewhere'), storage: { 'loom.hideEchoes': '1' } });
  assert.equal(w.document.querySelectorAll('#msgs .msg').length, 0);
  assert.ok(button(w.document.getElementById('msgs'), /Show echoes/));
});

test('room note: stays at the top of the thread view (sticky), still there after a busy thread scrolls to the bottom', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#busy', from: person('Busy Desk'), body: 'BUSY. Where everything happens.\nLine two.\nLine three.\nLine four.' });
  for (let i = 0; i < 40; i += 1) await post(kv, { to: '#busy', from: person(`fan${i % 5}`), body: `message number ${i}` });
  const w = await page(kv, { path: to('#busy') });
  const box = w.document.getElementById('msgs');
  const card = room(w);
  assert.ok(card.classList.contains('sticky'), 'the card carries the sticky class');
  assert.match(CSS, /\.roomnote\.sticky\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*z-index:\s*\d+;[^}]*max-height:/, 'sticky, pinned to the top, above the messages, height capped');
  assert.match(CSS, /\.roomnote\s*\{[^}]*background:\s*var\(--surface\)/, 'solid background so messages do not show through');
  assert.match(between(CSS, '.roomnote .more-txt::after', '.msg .also'), /@media \(max-width: 640px\)\s*\{[^@]*\.roomnote\.sticky\s*\{[^}]*max-height:\s*var\(--rn-max, 16vh\)/, 'phones: about a fifth of the thread at most');
  // first visit: at most three lines, the toggle sits in the card's one-line header
  assert.ok(card.querySelector('.rn-body').classList.contains('clamp3'));
  assert.equal(card.querySelector('.rn-h .rn-more').getAttribute('aria-controls'), card.querySelector('.rn-body').id);
  // scroll to the newest message, as opening a thread does; a new message re-renders at the bottom
  box.scrollTop = box.scrollHeight;
  box.dispatchEvent(new w.Event('scroll'));
  await post(kv, { to: '#busy', from: person('fan1'), body: 'the newest message' });
  w.document.getElementById('playRange').value = '41';
  w.document.getElementById('playRange').dispatchEvent(new w.Event('input'));
  await settle(w);
  assert.equal(box.firstElementChild, room(w), 'the card is still the first thing in the thread view');
  assert.ok(room(w).classList.contains('sticky'));
  assert.ok(box.querySelectorAll('.msg').length >= 40);
});

test('fold the echoes: an echo line someone replied to stays a message, and its reply is shown', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#alpha', from: person('ann'), body: 'worth a read https://example.com/story' });
  const res = await post(kv, { to: '#beta', from: person('ann'), body: 'same story here https://example.com/story' });
  const log = await read(kv, '#beta');
  const echo = log.messages.find((m) => m.from.name === 'Collator' && m.kind === 'link');
  const reply = await post(kv, { to: `loom:${log.log.key}#${echo.id}`, from: person('bob'), body: 'thanks, Collator' });
  const w = await page(kv, { path: to('#beta') });
  assert.ok(msgEl(w, echo.id), 'the echo with a reply is not folded');
  assert.ok(msgEl(w, reply.message.id), 'the reply is shown');
  assert.equal(msgEl(w, res.message.id).querySelector('[data-act="echoes"]'), null);
});

test('fold the echoes: a line that only claims to be the Collator (unverified) is not folded', async () => {
  const kv = memoryKv();
  const res = await post(kv, { to: '#beta', from: person('ann'), body: 'a plain message' });
  const key = (await read(kv, '#beta')).log.key;
  const fake = await post(kv, { to: `loom:${key}#${res.message.id}`, from: { name: 'Collator', kind: 'robot' }, kind: 'link', cites: ['#alpha'], body: 'Also threaded elsewhere — #alpha' });
  if (!fake.message) return; // the service refused the name outright: nothing to fold
  const w = await page(kv, { path: to('#beta') });
  assert.ok(msgEl(w, fake.message.id), 'the look-alike stays a visible message');
  assert.equal(w.document.querySelector('#msgs [data-act="echoes"]'), null);
});

test('recommended view: same words within a minute are not a repeat when the kind or the parent differs', async () => {
  const kv = memoryKv();
  const a = await post(kv, { to: '#dupes3', from: person('relay'), body: 'is the deck ready' }, '2026-11-13T10:00:00.000Z');
  const b = await post(kv, { to: '#dupes3', from: person('relay'), kind: 'question', body: 'is the deck ready' }, '2026-11-13T10:00:10.000Z');
  const key = (await read(kv, '#dupes3')).log.key;
  const c = await post(kv, { to: `loom:${key}#${a.message.id}`, from: person('relay'), body: 'is the deck ready' }, '2026-11-13T10:00:20.000Z');
  const d = await post(kv, { to: '#dupes3', from: { name: 'relay', kind: 'agent' }, body: 'is the deck ready' }, '2026-11-13T10:00:30.000Z');
  const w = await page(kv, { path: to('#dupes3') });
  for (const r of [a, b, c, d]) assert.ok(msgEl(w, r.message.id), `message ${r.message.id} shown`);
  assert.equal(w.document.querySelector('#msgs .dupnote'), null);
});

test('recommended view: a message a shared link points at is never folded away', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#dupes4', from: person('relay'), body: 'ping' }, '2026-11-13T10:00:00.000Z');
  const b = await post(kv, { to: '#dupes4', from: person('relay'), body: 'ping' }, '2026-11-13T10:00:10.000Z');
  const w = await page(kv, { path: `${to('#dupes4')}#${b.message.id}` });
  assert.ok(msgEl(w, b.message.id));
});

test('room note: in a log trimmed to its newest messages the oldest one left is not the desk', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#old', from: person('Old Desk'), body: 'OLD. The real opener.' });
  await post(kv, { to: '#old', from: person('latecomer'), body: 'ROOM NOTE: mine now' });
  const key = (await read(kv, '#old')).log.key;
  const stored = JSON.parse(kv.map.get(`loom:log:${key}`));
  stored.trimmedBefore = stored.ops[1].seq; stored.ops = stored.ops.slice(1);
  kv.map.set(`loom:log:${key}`, JSON.stringify(stored));
  const w = await page(kv, { path: to('#old') });
  assert.equal(room(w), null);
});
