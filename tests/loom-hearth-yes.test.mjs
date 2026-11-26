import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { buildPiles } from '../src/lib/loom/for-you.mjs';
import { ownerFromSearch, yesQueue, yesPosition, mountHearthYes } from '../src/lib/loom/hearth-yes.mjs';

const ORIGIN = 'https://pointcast.xyz';
const NOW = Date.parse('2026-11-25T18:00:00.000Z');
const KEY = 'a'.repeat(24);
const ROOM = '#hearth-test';
const SPEC = 'pointcast.loom/v1';
const ago = (minutes) => new Date(NOW - minutes * 60_000).toISOString();
const target = (message) => `loom:${KEY}#${message.id}`;

function fixture(owner = 'mike') {
  const from = { name: 'Design desk', kind: 'agent' };
  const newest = {
    id: 'm_newest01', seq: 3, at: ago(10), kind: 'note', from,
    body: `NEEDS ${owner.toUpperCase()} · May we publish this poster?\n${'The complete context belongs here. '.repeat(10)}<img src=x onerror="window.injected=true">`,
  };
  const older = { id: 'm_older001', seq: 1, at: ago(30), kind: 'note', from,
    body: `NEEDS ${owner.toUpperCase()} · Choose the second poster · reply here` };
  const receipt = { id: 'm_receipt1', seq: 4, at: ago(1), kind: 'note', from,
    body: 'DONE · The Needs your yes card is ready. A later release needs your yes.' };
  const messages = [older, receipt, newest];
  const feed = { ok: true, spec: SPEC, ...buildPiles({ owner, now: new Date(NOW),
    threads: [{ key: KEY, address: ROOM, label: ROOM, messages }] }) };
  // Exercise the screen's ordering independently of the server's ordering.
  feed.piles.needsYes.reverse();
  return { newest, older, receipt, messages, feed };
}

const windows = [];
test.afterEach(() => { while (windows.length) windows.pop().close(); });

async function screen({ owner = 'mike', data = fixture(owner), name = 'Mike', kind = 'human', postStatus = 201 } = {}) {
  const source = readFileSync(new URL('../src/pages/loom/hearth/yes.astro', import.meta.url), 'utf8');
  const markup = source.match(/<HearthLayout\b[^>]*>([\s\S]*?)<\/HearthLayout>/)?.[1];
  assert.ok(markup, 'the page uses the shared HearthLayout');
  const css = readFileSync(new URL('../src/styles/hearth.css', import.meta.url), 'utf8');
  const dom = new JSDOM(`<!doctype html><html><head><style>${css}</style></head><body class="hearth-page"><div class="hearth-wrap">${markup}</div></body></html>`, {
    url: `${ORIGIN}/loom/hearth/yes?for=${encodeURIComponent(owner)}`, pretendToBeVisual: true,
  });
  const { window } = dom;
  windows.push(window);
  if (name) window.localStorage.setItem('loom.name', name);
  if (kind) window.localStorage.setItem('loom.akind', kind);
  window.localStorage.setItem('loom:client', JSON.stringify('hearth-yes-test-client'));
  const requests = [], posted = [], navigated = [];
  const request = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, ORIGIN);
    const method = init.method || 'GET';
    requests.push({ url, method });
    if (url.pathname === `/loom/for/${owner}` && method === 'GET') {
      assert.equal(url.searchParams.get('format'), 'json');
      return Response.json(data.feed);
    }
    if (url.pathname === '/api/loom' && method === 'GET') {
      const address = url.searchParams.get('to');
      assert.ok(data.messages.some((message) => target(message) === address), 'full reads use an original ask address');
      return Response.json({ ok: true, spec: SPEC, seq: 4, log: { key: KEY, address: ROOM, label: ROOM, kind: 'topic' }, messages: data.messages });
    }
    if (url.pathname === '/api/loom' && method === 'POST') {
      const payload = JSON.parse(init.body);
      posted.push(payload);
      if (postStatus !== 201) return Response.json({ ok: false, spec: SPEC, error: 'rate_limited' }, { status: postStatus });
      const id = 'm_answer01';
      return Response.json({ ok: true, spec: SPEC, address: `loom:${KEY}#${id}`, editToken: 'test-edit-token',
        message: { id, at: new Date(NOW).toISOString(), parent: payload.to.split('#')[1], from: payload.from, kind: 'answer', body: payload.body } }, { status: 201 });
    }
    assert.fail(`Unexpected request: ${method} ${url.href}`);
  };
  const mounted = mountHearthYes(window.document, { request, now: () => NOW, navigate: (url) => navigated.push(url) });
  await mounted.ready;
  return { window, document: window.document, data, requests, posted, navigated };
}

const byId = (page, id) => page.document.getElementById(id);
const visible = (node) => !node.closest('[hidden]');
const visibleText = (page) => [...page.document.querySelectorAll('body *')]
  .filter((node) => !node.children.length && visible(node)).map((node) => node.textContent).join(' ');
async function until(check) {
  for (let i = 0; i < 30; i++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.ok(check(), 'screen reached the expected state');
}

test('owner comes from the query, defaults to mike, and rejects invalid handles', () => {
  assert.equal(ownerFromSearch(''), 'mike');
  assert.equal(ownerFromSearch('?for=%40Alex.Team'), 'alex.team');
  assert.throws(() => ownerFromSearch('?for=---'));
  assert.throws(() => ownerFromSearch(`?for=${'a'.repeat(33)}`));
});

test('real classifier excludes receipts; queue sorts newest first without mutating the feed', () => {
  const { feed, newest, older, receipt } = fixture();
  const original = feed.piles.needsYes.map(({ id }) => id);
  const asks = yesQueue(feed);
  assert.deepEqual(asks.map(({ id }) => id), [newest.id, older.id]);
  assert.ok(!asks.some(({ id }) => id === receipt.id));
  assert.deepEqual(feed.piles.needsYes.map(({ id }) => id), original);
  const tie = { ...asks[0], id: 'm_tied0001', link: `loom:${KEY}#m_tied0001`, seq: asks[0].seq + 1 };
  assert.equal(yesQueue({ ...feed, piles: { needsYes: [asks[0], tie] } })[0].id, tie.id);
  assert.throws(() => yesQueue({ ok: false, piles: { needsYes: [] } }));
  assert.throws(() => yesQueue({ ok: true, piles: {} }));
});

test('queue position reads 1 of N and has no zero-count empty state', () => {
  const asks = yesQueue(fixture().feed);
  assert.deepEqual(yesPosition(asks), { ask: asks[0], index: 0, waiting: '1 of 2 waiting', hasBack: false, hasNext: true });
  assert.deepEqual(yesPosition(asks, 1), { ask: asks[1], index: 1, waiting: '2 of 2 waiting', hasBack: true, hasNext: false });
  assert.deepEqual(yesPosition([]), { ask: null, index: 0, waiting: '', hasBack: false, hasNext: false });
});

test('one ask is visible; Next shows the second and Back restores the first', async () => {
  const page = await screen();
  const { newest, older } = page.data;
  const asks = () => [...page.document.querySelectorAll('article')].filter(visible);
  assert.equal(asks().length, 1);
  assert.equal(byId(page, 'yes-count').textContent, '1 of 2 waiting');
  assert.equal(byId(page, 'yes-body').textContent, newest.body);
  assert.equal(byId(page, 'yes-back').disabled, true);
  assert.equal(byId(page, 'yes-next').disabled, false);
  byId(page, 'yes-next').click();
  await until(() => byId(page, 'yes-body').textContent === older.body);
  assert.equal(asks().length, 1);
  assert.equal(byId(page, 'yes-count').textContent, '2 of 2 waiting');
  assert.equal(byId(page, 'yes-back').disabled, false);
  assert.equal(byId(page, 'yes-next').disabled, true);
  byId(page, 'yes-back').click();
  await until(() => byId(page, 'yes-body').textContent === newest.body);
  assert.equal(asks().length, 1);
  assert.equal(byId(page, 'yes-count').textContent, '1 of 2 waiting');
});

test('full ask, sender, room and age render as text without executing markup', async () => {
  const page = await screen();
  assert.ok(page.data.newest.body.length > 160);
  assert.equal(byId(page, 'yes-body').textContent, page.data.newest.body);
  assert.match(byId(page, 'yes-from').textContent, /Design desk/);
  assert.match(byId(page, 'yes-room').textContent, /#hearth-test/);
  assert.match(byId(page, 'yes-when').textContent, /10 minutes ago/);
  assert.equal(byId(page, 'yes-body').querySelector('img'), null);
  assert.equal(page.window.injected, undefined);
});

test('empty pile shows one calm sentence and a Hearth link, never a waiting zero', async () => {
  const data = fixture();
  data.feed.piles.needsYes = [];
  const page = await screen({ data });
  assert.equal(byId(page, 'yes-card').hidden, true);
  assert.equal(byId(page, 'yes-empty').hidden, false);
  assert.match(visibleText(page), /Nothing needs your yes right now\./);
  assert.doesNotMatch(visibleText(page), /\b0\b|\d of \d waiting/);
  assert.ok([...page.document.querySelectorAll('a[href]')].some((a) => visible(a) && /^\/loom\/hearth\/?(?:\?|$)/.test(a.getAttribute('href'))));
  assert.equal(page.requests.filter(({ url }) => url.pathname === '/api/loom').length, 0);
});

test('poll questions and their options are readable text on the same ask', async () => {
  const data = fixture();
  data.newest.kind = 'poll';
  data.newest.poll = { question: '@mike, which poster should we publish?', options: ['Blue', '<img src=x onerror="window.injected=true">'] };
  const page = await screen({ data });
  const text = byId(page, 'yes-card').textContent;
  assert.ok(text.includes(data.newest.poll.question));
  for (const option of data.newest.poll.options) assert.ok(text.includes(option));
  assert.equal(byId(page, 'yes-card').querySelector('img'), null);
});

test('Yes uses the For You answer payload and stored identity rather than the viewed owner', async () => {
  const page = await screen({ owner: 'alex', name: 'Casey', kind: 'agent' });
  byId(page, 'yes-approve').click();
  assert.equal(page.posted.length, 0, 'the first tap only confirms the public answer');
  byId(page, 'yes-approve').click();
  await until(() => page.posted.length === 1 && byId(page, 'yes-body').textContent === page.data.older.body);
  assert.deepEqual(page.posted[0], { to: target(page.data.newest), from: { name: 'Casey', kind: 'agent' },
    kind: 'answer', body: 'Yes, go ahead', clientId: 'hearth-yes-test-client' });
  assert.equal(byId(page, 'yes-count').textContent, '1 of 1 waiting');
  assert.equal(page.window.localStorage.getItem('loom.name'), 'Casey');
  assert.equal(page.window.localStorage.getItem('loom.akind'), 'agent');
});

test('Hold posts No, hold; a rejected answer retains the current ask', async () => {
  const page = await screen({ postStatus: 429 });
  byId(page, 'yes-hold').click();
  assert.equal(page.posted.length, 0);
  byId(page, 'yes-hold').click();
  await until(() => page.posted.length === 1 && !byId(page, 'yes-hold').disabled);
  assert.equal(page.posted[0].body, 'No, hold');
  assert.equal(page.posted[0].kind, 'answer');
  assert.equal(page.posted[0].to, target(page.data.newest));
  assert.equal(byId(page, 'yes-body').textContent, page.data.newest.body);
  assert.equal(byId(page, 'yes-count').textContent, '1 of 2 waiting');
  assert.ok(byId(page, 'yes-state').textContent.trim());
});

test('missing posting identity requires an explicit name and kind without borrowing the owner', async () => {
  const page = await screen({ owner: 'alex', name: '', kind: '' });
  byId(page, 'yes-approve').click();
  assert.equal(byId(page, 'yes-identity').hidden, false);
  assert.equal(byId(page, 'yes-name').value, '');
  assert.equal(byId(page, 'yes-kind').value, '');
  assert.equal(page.posted.length, 0);
  byId(page, 'yes-approve').click();
  assert.equal(page.posted.length, 0);
});

test('blank saved name and invalid saved kind can be replaced through the identity fields', async () => {
  const page = await screen({ owner: 'alex', name: '   ', kind: 'robot' });
  byId(page, 'yes-approve').click();
  assert.equal(byId(page, 'yes-identity').hidden, false);
  assert.equal(page.posted.length, 0);
  byId(page, 'yes-name').value = 'Jordan';
  byId(page, 'yes-kind').value = 'human';
  byId(page, 'yes-approve').click();
  assert.equal(page.posted.length, 0);
  byId(page, 'yes-approve').click();
  await until(() => page.posted.length === 1 && byId(page, 'yes-body').textContent === page.data.older.body);
  assert.deepEqual(page.posted[0].from, { name: 'Jordan', kind: 'human' });
  assert.equal(page.window.localStorage.getItem('loom.name'), 'Jordan');
  assert.equal(page.window.localStorage.getItem('loom.akind'), 'human');
});

test('Reply opens the existing Loom thread composer without posting', async () => {
  const page = await screen();
  byId(page, 'yes-reply').click();
  assert.deepEqual(page.navigated, ['/loom?to=' + encodeURIComponent(target(page.data.newest)) + '&compose=1']);
  assert.equal(page.posted.length, 0);
});
