// The /loom v3 page, driven in jsdom against the real Loom service (src/lib/loom/service.mjs)
// over an in-memory KV. Checks the live paths the prototype only ran against mocks:
// read, append, reply as answer, +1, vote, edit, withdraw, ?to= links, and that
// untrusted message text never becomes HTML.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { confirmDb } from './helpers/loom-confirm-db.mjs';
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
const api = (kv, path, init) => handleLoom(new Request(new URL(path, ORIGIN), init), { kv, db: kv.confirmDb ?? null });
const post = async (kv, body) => (await api(kv, '/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
const read = async (kv, to) => (await api(kv, `/api/loom?to=${encodeURIComponent(to)}`)).json();

const open = [];
test.afterEach(() => { while (open.length) open.pop().close(); });

async function page(kv, { path = '/loom', name = 'tester', small = false } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head><style>${CSS}</style></head><body>${BODY}</body></html>`, {
    url: ORIGIN + path, runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  open.push(w);
  if (name) w.localStorage.setItem('loom.name', name);
  w.fetch = async (url, init = {}) => {
    const { signal, cache, ...rest } = init;
    return api(kv, new URL(url, ORIGIN).href, rest);
  };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (small) w.matchMedia = (q) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} });
  w.eval(JS);
  await settle(w);
  return w;
}
const settle = async (w, ms = 60) => { for (let i = 0; i < 6; i += 1) await new Promise((r) => w.setTimeout(r, ms / 6)); };
const texts = (w, sel) => [...w.document.querySelectorAll(sel)].map((n) => n.textContent);
const msgEl = (w, id) => w.document.getElementById(`msg-${id}`);
async function send(w, text) {
  w.document.getElementById('bodyInput').value = text;
  w.document.getElementById('composer').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await settle(w, 120);
}

test('boots live on #loom with the server seed, no sample data', async () => {
  const kv = memoryKv();
  const w = await page(kv);
  assert.equal(w.document.getElementById('statusText').textContent, 'Live');
  assert.ok(texts(w, '#dirList .row .label').includes('#loom'));
  assert.match(w.document.getElementById('threadTitle').textContent, /#loom/);
  assert.equal(w.document.querySelectorAll('#msgs .msg').length, 3);
  assert.doesNotMatch(SOURCE, /SNAPSHOT|Sample data|officenoun/);
});

test('shows Offline with a retry when the API cannot be reached', async () => {
  const kv = memoryKv();
  const dom = new JSDOM(`<!doctype html><html><body>${BODY}</body></html>`, { url: `${ORIGIN}/loom`, runScripts: 'outside-only' });
  open.push(dom.window);
  dom.window.fetch = async () => { throw new TypeError('network down'); };
  dom.window.eval(JS);
  await settle(dom.window);
  assert.equal(dom.window.document.getElementById('statusText').textContent, 'Offline');
  assert.ok(texts(dom.window, '#dirList button').includes('Try again'));
  dom.window.fetch = async (url, init = {}) => { const { signal, cache, ...rest } = init; return api(kv, new URL(url, ORIGIN).href, rest); };
  [...dom.window.document.querySelectorAll('#dirList button')].find((b) => b.textContent === 'Try again').click();
  await settle(dom.window);
  assert.equal(dom.window.document.getElementById('statusText').textContent, 'Live');
});

test('append, reply as the answer, +1, edit and withdraw reach the server', async () => {
  const kv = memoryKv();
  const q = await post(kv, { to: '@tester', from: { name: 'Ledger desk', kind: 'agent' }, kind: 'question', body: 'Mint day 1 today?' });
  const w = await page(kv, { path: '/loom?to=%40tester' });
  assert.equal(w.document.getElementById('threadTitle').textContent, '@tester');
  assert.ok(msgEl(w, q.message.id), 'question rendered');

  // plain append
  await send(w, 'hello from v3');
  let log = await read(kv, '@tester');
  const mine = log.messages.find((m) => m.body === 'hello from v3');
  assert.ok(mine, 'note posted');
  assert.equal(mine.from.name, 'tester');
  assert.match(w.document.getElementById('sendStatus').textContent, /Posted to @tester/);

  // reply to the open question: goes in as an answer under it
  msgEl(w, q.message.id).querySelector('[data-act="reply"]').click();
  await send(w, 'yes, go');
  log = await read(kv, '@tester');
  const ans = log.messages.find((m) => m.body === 'yes, go');
  assert.equal(ans.kind, 'answer');
  assert.equal(ans.parent, q.message.id);
  assert.ok(msgEl(w, ans.id).classList.contains('d1'), 'answer renders under its question');

  // +1
  msgEl(w, q.message.id).querySelector('[data-act="plus"]').click();
  await settle(w, 120);
  log = await read(kv, '@tester');
  assert.equal(log.messages.find((m) => m.id === q.message.id).plus, 1);

  // edit my note through the message sheet
  msgEl(w, mine.id).querySelector('[data-act="more"]').click();
  [...w.document.querySelectorAll('.sheet .opt')].find((b) => b.textContent === 'Edit').click();
  w.document.getElementById('editBody').value = 'hello again';
  [...w.document.querySelectorAll('.sheet .btn')].find((b) => b.textContent === 'Save edit').click();
  await settle(w, 120);
  log = await read(kv, '@tester');
  assert.equal(log.messages.find((m) => m.id === mine.id).body, 'hello again');

  // withdraw it
  msgEl(w, mine.id).querySelector('[data-act="more"]').click();
  [...w.document.querySelectorAll('.sheet .opt')].find((b) => b.textContent === 'Withdraw').click();
  [...w.document.querySelectorAll('.sheet .btn')].find((b) => b.textContent === 'Withdraw').click();
  await settle(w, 120);
  log = await read(kv, '@tester');
  assert.equal(log.messages.some((m) => m.id === mine.id), false, 'withdrawn message is hidden');
});

test('a vote is recorded once per browser', async () => {
  const kv = memoryKv();
  const p = await post(kv, { to: '#officedesk', from: { name: 'mike', kind: 'human' }, kind: 'poll', body: 'Which first?', poll: { question: 'Which first?', options: ['Mint', 'Ship'] } });
  const w = await page(kv, { path: '/loom?to=%23officedesk' });
  msgEl(w, p.message.id).querySelector('[data-vote="1"]').click();
  await settle(w, 120);
  const log = await read(kv, '#officedesk');
  assert.deepEqual(log.messages[0].poll.options.map((o) => o.votes), [0, 1]);
  assert.ok(msgEl(w, p.message.id).querySelector('[data-vote="0"]').disabled, 'poll locks after voting');
});

test('message text and names are rendered as text, never HTML', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#xss', from: { name: '<img src=x onerror=alert(1)>', kind: 'human' }, body: '<script>alert(1)</script><img src=x onerror=alert(2)> javascript:alert(3) https://example.com/ok' });
  const w = await page(kv, { path: '/loom?to=%23xss' });
  const box = w.document.getElementById('msgs');
  assert.equal(box.querySelectorAll('script, img').length, 0);
  assert.match(box.textContent, /<script>alert\(1\)<\/script>/);
  assert.deepEqual([...box.querySelectorAll('a')].map((a) => a.getAttribute('href')), ['https://example.com/ok']);
  assert.equal(w.document.querySelectorAll('#dirList img, #fy img').length, 0);
});

test('a link to one message opens its thread', async () => {
  const kv = memoryKv();
  const m = await post(kv, { to: '#court', from: { name: 'sam', kind: 'human' }, body: 'courts are dry' });
  const w = await page(kv, { path: `/loom?to=${encodeURIComponent(m.address)}` });
  assert.equal(w.document.getElementById('threadTitle').textContent, '#court');
  assert.ok(msgEl(w, m.message.id));
  assert.match(w.location.search, /to=%23court/);
});

test('addresses follow the server grammar: one spelling per thread', async () => {
  const kv = memoryKv();
  await post(kv, { to: 'https://www.example.com/page/?utm_source=x', from: { name: 'sam', kind: 'human' }, body: 'first' });
  const w = await page(kv, { path: `/loom?to=${encodeURIComponent('http://example.com/page')}` });
  assert.equal(w.document.getElementById('threadTitle').textContent, 'https://example.com/page');
  assert.equal(w.document.querySelectorAll('#msgs .msg').length, 1);
  assert.equal([...w.document.querySelectorAll('#dirList .row')].filter((r) => r.dataset.open.includes('example.com')).length, 1);
  // "#My Topic" becomes #my-topic, which the server accepts
  w.document.getElementById('addrInput').value = '#My_Topic';
  w.document.getElementById('addrForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await settle(w);
  assert.equal(w.document.getElementById('threadTitle').textContent, '#my-topic');
  assert.doesNotMatch(w.document.getElementById('msgs').textContent, /Couldn’t load/);
});

test('server refusals are explained, and the text stays in the box', async () => {
  const kv = memoryKv();
  const w = await page(kv, { path: '/loom?to=%23names', name: 'Collator' });
  await send(w, 'hi');
  assert.match(w.document.getElementById('sendStatus').textContent, /That name is reserved/);
  assert.equal(w.document.getElementById('bodyInput').value, 'hi');
});

test('a quick answer from For you takes a second tap', async () => {
  const kv = memoryKv();
  const q = await post(kv, { to: '@tester', from: { name: 'Ledger desk', kind: 'agent' }, kind: 'question', body: 'Go ahead with day 1?' });
  const w = await page(kv);
  await settle(w, 200);
  const yes = () => [...w.document.querySelectorAll('#fyDyn button')].find((b) => /Yes, go ahead|Tap again/.test(b.textContent));
  yes().click();
  await settle(w, 120);
  let log = await read(kv, '@tester');
  assert.equal(log.messages.length, 1, 'first tap posts nothing');
  yes().click();
  await settle(w, 150);
  log = await read(kv, '@tester');
  const ans = log.messages.find((m) => m.parent === q.message.id);
  assert.equal(ans?.body, 'Yes, go ahead');
  assert.equal(ans.kind, 'answer');
});

// ---- OFF-34: the top of the page on a phone ----
const fy = (w) => w.document.getElementById('fyDyn');

test('no name, plain visit: compact welcome card markup, one-line "Waiting on you" link', async () => {
  const w = await page(memoryKv(), { name: '' });
  const card = fy(w).querySelector('.card.wel');
  assert.ok(card, 'card shows for a new visitor');
  const tog = card.querySelector('#welToggle');
  assert.equal(tog.tagName, 'SPAN', 'inert plain heading text above 640px');
  assert.equal(tog.hasAttribute('aria-expanded'), false);
  const ws = await page(memoryKv(), { name: '', small: true });
  const t2 = fy(ws).querySelector('#welToggle');
  assert.equal(t2.tagName, 'BUTTON');
  assert.equal(t2.getAttribute('aria-expanded'), 'false');
  assert.equal(t2.getAttribute('aria-controls'), 'welBody');
  t2.click();
  assert.equal(fy(ws).querySelector('#welToggle').getAttribute('aria-expanded'), 'true');
  assert.ok(fy(ws).querySelector('.card.wel').hasAttribute('data-open'));
  assert.ok(card.querySelector('#welStart') && card.querySelector('#welBots'));
  assert.equal(fy(w).querySelector('h2.sect'), null, 'no heading + sentence + big button');
  const link = fy(w).querySelector('#fyName');
  assert.equal(link.className, 'linkbtn');
  assert.match(link.textContent, /Add your name to see what is waiting on you/);
  assert.match(CSS, /@media \(max-width: 640px\)[\s\S]*\.card\.wel:not\(\[data-open\]\) \.welbody/);
});

test('the welcome card never shows on a ?to= link or once there is a name', async () => {
  const onLink = await page(memoryKv(), { path: '/loom?to=%23court', name: '' });
  assert.equal(fy(onLink).querySelector('.card.wel'), null);
  const named = await page(memoryKv(), { name: 'sam' });
  assert.equal(fy(named).querySelector('.card.wel'), null);
});

test('"Got it" still stores the welcome flag for ordinary browsers', async () => {
  const w = await page(memoryKv(), { name: '' });
  w.document.getElementById('welGot').click();
  assert.equal(w.localStorage.getItem('loom.welcome'), '1');
  assert.equal(fy(w).querySelector('.card.wel'), null);
});

test('?as=NAME fills the name for this visit only, marked self-declared, never stored', async () => {
  const w = await page(memoryKv(), { path: '/loom?as=mike', name: '' });
  assert.equal(fy(w).querySelector('.card.wel'), null);
  assert.match(fy(w).querySelector('.visiting').textContent, /Visiting as mike \(self-declared, this visit only\)/);
  await settle(w, 120);
  // OFF-52: For you opens on Needs your yes; "Waiting on you" now lives inside "Everything else".
  assert.equal(fy(w).querySelector('h2.sect').textContent, 'NEEDS YOUR YES');
  assert.equal(w.document.getElementById('asBtn').textContent, 'mike');
  assert.equal(w.localStorage.getItem('loom.name'), null);
  assert.equal(w.localStorage.getItem('loom.akind'), null);
  fy(w).querySelector('#visitClear').click();
  assert.equal(fy(w).querySelector('.visiting'), null);
  assert.equal(w.document.getElementById('asBtn').textContent, 'Add a name');
});

test('?as= is sanitised, capped, and never injected as HTML; a stored name wins', async () => {
  const evil = '<img src=x onerror=alert(1)>' + 'z'.repeat(80);
  const w = await page(memoryKv(), { path: `/loom?as=${encodeURIComponent(evil)}`, name: '' });
  assert.equal(w.document.querySelectorAll('#fyDyn img').length, 0);
  assert.ok(w.document.getElementById('asBtn').textContent.length <= 48);
  const stored = await page(memoryKv(), { path: '/loom?as=mike', name: 'sam' });
  assert.equal(stored.document.getElementById('asBtn').textContent, 'sam');
  assert.equal(fy(stored).querySelector('.visiting'), null);
  assert.match(JS, /function cleanVisitName/);
});

test('posting while visiting via ?as= uses that self-declared name and persists nothing', async () => {
  const kv = memoryKv();
  const w = await page(kv, { path: '/loom?as=mike', name: '' });
  await send(w, 'hello from a visit');
  const log = await read(kv, '#loom');
  assert.ok(log.messages.some((m) => m.body === 'hello from a visit' && m.from.name === 'mike'));
  assert.equal(w.localStorage.getItem('loom.name'), null);
});

test('?as= is stripped from the address bar (other params kept); the name stays for the visit', async () => {
  const w = await page(memoryKv(), { path: '/loom?as=mike&to=%23court', name: '' });
  assert.doesNotMatch(w.location.search, /as=/);
  assert.match(w.location.search, /to=%23court/);
  assert.equal(w.document.getElementById('asBtn').textContent, 'mike');
});

test('saving a name in the sheet ends the visit banner and stores that name', async () => {
  const w = await page(memoryKv(), { path: '/loom?as=mike', name: '' });
  assert.ok(fy(w).querySelector('.visiting'));
  w.document.getElementById('asBtn').click();
  await settle(w);
  w.document.getElementById('nameInput').value = 'sam';
  [...w.document.querySelectorAll('button')].find((b) => b.textContent === 'Save name').click();
  await settle(w);
  assert.equal(fy(w).querySelector('.visiting'), null);
  assert.equal(w.localStorage.getItem('loom.name'), 'sam');
});

test('C8: the Links chip lists one-message link threads; the default list hides them', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#c8room', from: { name: 'a', kind: 'human' }, body: 'room' });
  await post(kv, { to: 'https://example.com/single', from: { name: 'a', kind: 'human' }, body: 'one' });
  await post(kv, { to: 'https://example.com/double', from: { name: 'a', kind: 'human' }, body: 'one' });
  await post(kv, { to: 'https://example.com/double', from: { name: 'b', kind: 'human' }, body: 'two' });
  const w = await page(kv);
  const labels = () => texts(w, '#dirList .row .label');
  assert.ok(labels().includes('#c8room'));
  assert.ok(!labels().some((l) => /single/.test(l)));
  assert.ok(labels().some((l) => /double/.test(l)));
  const chip = w.document.querySelector('[data-f="url"]');
  assert.match(chip.textContent, /^Links \d+/);
  chip.dispatchEvent(new w.Event('click', { bubbles: true }));
  await settle(w, 120);
  assert.ok(labels().some((l) => /single/.test(l)));
  assert.ok(!labels().includes('#c8room'));
});

for (const choice of ['Yes', 'No', 'Change']) test(`confirm card ${choice}: For You to saved inline unverified answer`, async (t) => {
  const kv = memoryKv(); kv.confirmDb = confirmDb(); t.after(() => kv.confirmDb.close());
  const made = await post(kv, { to: '@tester', from: { name: 'Desk', kind: 'agent', address: '@desk' }, kind: 'confirm',
    confirm: { actionType: 'start_draft', subject: '<img src=x onerror=alert(1)> Draft A\nKeep exact text.', risk: 'low', expiresAt: new Date(Date.now() + 3600000).toISOString() } });
  const w = await page(kv);
  let card = fy(w).querySelector('[data-confirm]');
  assert.ok(card); assert.equal(fy(w).querySelector('h2.sect').textContent, 'NEEDS YOUR YES');
  assert.match(card.textContent, /Asked by Desk/); assert.match(card.textContent, /Start a draft only/); assert.match(card.textContent, /Expires/);
  assert.equal(card.querySelector('img'), null);
  assert.deepEqual([...card.querySelectorAll('button')].map((b) => b.textContent), ['Yes', 'No', 'Change']);
  [...card.querySelectorAll('button')].find((b) => b.textContent === choice).click();
  await settle(w, 160);
  if (choice === 'Change') {
    assert.equal(w.document.getElementById('bodyInput').value, 'change: ');
    await send(w, 'change\nuse Friday\n  keep detail  ');
    card = msgEl(w, made.message.id).querySelector('[data-confirm]');
  }
  assert.match(card.textContent, /unverified/);
  assert.equal(card.querySelectorAll('button').length, 0);
  const saved = (await read(kv, '@tester')).messages.find((m) => m.id === made.message.id);
  assert.equal(saved.answer.value, choice === 'Change' ? 'change\nuse Friday\n  keep detail  ' : choice.toLowerCase());
  assert.equal(saved.answer.by, 'tester'); assert.equal(saved.answer.verified, false);
});


test('confirm commentary does not close a card and legacy cards offer no answer buttons', async (t) => {
  const kv = memoryKv(); kv.confirmDb = confirmDb(); t.after(()=>kv.confirmDb.close());
  const made = await post(kv,{to:'@tester',from:{name:'Desk',address:'@desk'},kind:'confirm',confirm:{actionType:'claim_task',subject:'OFF-52',risk:'low',expiresAt:new Date(Date.now()+3600000).toISOString()}});
  const w = await page(kv);
  [...fy(w).querySelector('[data-confirm]').querySelectorAll('button')].find(b=>b.textContent==='Change').click(); await settle(w,160);
  for (const text of ['changed my mind','change my mind',' yes']) {
    msgEl(w,made.message.id).querySelector('[data-act="reply"]').click();
    await send(w,text);
    const saved=(await read(kv,'@tester')).messages.find(m=>m.id===made.message.id);
    assert.equal(saved.answer,null);
  }
  const legacy={...made.message,confirm:{action:'mint',risk:'low',expiresAt:made.message.confirm.expiresAt,revision:1}};
  await kv.confirmDb.prepare('UPDATE loom_confirms SET message = ? WHERE id = ?').bind(JSON.stringify(legacy),made.message.id).run();
  const other = await page(kv,{path:'/loom?to=%40tester#thread'});
  const card=msgEl(other,made.message.id).querySelector('[data-confirm]');
  assert.equal(card.querySelectorAll('button').length,0);
  assert.match(card.textContent,/no supported action type/);
});
