import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

import { FREEZE_LINE, KILL_TEST, KILL_TEST_RULES, countLine, readLine } from '../functions/_lib/air-killtest.mjs';

// The honest count's pages (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §7.4-7.6, §7.11):
// /r/how, the /r/me house button, the /r footer link, and the two client
// scripts, which run here under jsdom with a fake fetch.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const how = await read('src/pages/r/how.astro');
const me = await read('src/pages/r/me.astro');
const index = await read('src/pages/r/index.astro');
const houseSrc = await read('src/scripts/air-house.ts');
const howSrc = await read('src/scripts/air-how.ts');

/* ---------- /r/how ---------- */

test('/r/how: indexable, titled and described, with the rules and the freeze line printed from the one list', () => {
  assert.doesNotMatch(how, /noindex/);
  assert.match(how, /const title = 'How we count · Field Reports'/);
  assert.match(how, /const description = 'How Field Reports counts on-site reports, who is left out, and the live count for the Oct 23 kill test: 10 reports from 3 people\.'/);
  assert.match(how, /<BlockLayout title=\{title\} description=\{description\} jsonLd=\{jsonLd\} hideAds>/);
  assert.match(how, /'@type': 'WebPage'/);
  assert.match(how, /import \{ FREEZE_LINE, KILL_TEST, KILL_TEST_RULES \} from '\.\.\/\.\.\/\.\.\/functions\/_lib\/air-killtest\.mjs'/);
  assert.match(how, /<ol class="rw__rules">\s*\{KILL_TEST_RULES\.map\(\(rule: string\) => <li>\{rule\}<\/li>\)\}\s*<\/ol>/, 'every rule, in order, rendered at build time');
  assert.match(how, /If not, \{FREEZE_LINE\.charAt\(0\)\.toLowerCase\(\) \+ FREEZE_LINE\.slice\(1\)\}<\/p>/, 'the Oct 24 paragraph ends with the freeze line');
  assert.equal(KILL_TEST_RULES.length, 12);
  assert.ok(KILL_TEST_RULES.some((r) => r.toLowerCase().includes(FREEZE_LINE.toLowerCase())), 'the same sentence closes rule 11');
});

test('/r/how: the count starts as a dash, is announced politely, and has a noscript pointer to the API', () => {
  assert.match(how, /<div class="rw__count" data-air-how-count aria-live="polite">/);
  assert.match(how, /<p class="rw__line" data-air-how-line>—<\/p>/, 'never made-up zeros');
  assert.match(how, /<p class="rw__read" data-air-how-read hidden><\/p>/, 'the read-out sits above the count line');
  assert.ok(how.indexOf('data-air-how-read') < how.indexOf('data-air-how-line'));
  assert.match(how, /<noscript><p class="rw__note">The live count is at <a href="\/api\/air\/killtest">\/api\/air\/killtest<\/a>\.<\/p><\/noscript>/);
});

test('/r/how: sections in order, what we never count, and the three links', () => {
  const order = ['The count', 'The rules', 'What happens', 'What we never count or show'].map((h) => how.indexOf(`>${h}`));
  assert.ok(order.every((i) => i > 0), 'every section heading is there');
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.match(how, /<h1 class="rw__title">How we count<\/h1>/);
  assert.match(how, /<a href="\/r">Field Reports<\/a> <span aria-hidden="true">·<\/span> how we count/);
  assert.match(how, /On \{readDay\} this page reads the result\. If it passes, the game layer stays open\./);
  assert.equal(KILL_TEST.readOn, '2026-10-24');
  for (const never of ['Agents', 'House phones and house accounts', 'Reports filed from away', 'Side questions', 'The count is numbers only']) assert.ok(how.includes(never), never);
  for (const href of ['/r', '/morning', '/api/air/killtest']) assert.ok(how.includes(`<a href="${href}">`), href);
  assert.match(how, /import \{ mountAirHow \} from '\.\.\/\.\.\/scripts\/air-how';\s+mountAirHow\(\);/);
  const markup = how.slice(how.indexOf('</BlockLayout>') > 0 ? how.indexOf('<BlockLayout') : 0, how.indexOf('</BlockLayout>'));
  assert.doesNotMatch(markup, />[^<>{}]*![^<>{}]*</, 'no exclamation marks in the copy');
});

test('/r/how: the built page, when there is one, lists all twelve rules and the freeze line', { skip: !existsSync(new URL('dist/r/how/index.html', root)) }, async () => {
  const html = await read('dist/r/how/index.html');
  for (const rule of KILL_TEST_RULES) assert.ok(html.includes(rule), rule.slice(0, 40));
  assert.ok(html.includes(FREEZE_LINE));
  assert.doesNotMatch(html, /name="robots"[^>]*noindex/);
});

/* ---------- /r/me and /r ---------- */

test('/r/me: a hidden house section, the director only, with the copy from the spec and a link to /r/how', () => {
  const section = me.match(/<section class="rm__section" data-air-house hidden>[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'data-air-house section');
  assert.match(section, /<h2 class="rm__h2 air-mono">House phone<\/h2>/);
  assert.match(section, /<button type="button" class="rm__go" data-air-house-mark hidden>This is a house phone<\/button>/);
  assert.match(section, /<p class="rm__house-marked" data-air-house-marked hidden>House phone\. Its reports never count\. <button type="button" class="rm__link" data-air-house-undo>Undo<\/button><\/p>/);
  assert.match(section, /House phones are left out of the kill test and the paper's busiest-court pick\. Marking also takes this phone's earlier reports out of the count\./);
  assert.match(section, /<a href="\/r\/how">How we count<\/a>/);
  assert.ok(me.indexOf('data-air-me-claim') < me.indexOf('data-air-house'), 'after the claim paragraph');
  assert.ok(me.indexOf('data-air-house') < me.indexOf('<footer class="rm__foot">'), 'before the footer');
  assert.match(me, /import \{ mountAirHouse \} from '\.\.\/\.\.\/scripts\/air-house';[\s\S]*mountAir\(\);\s+mountAirHouse\(\);/);
  assert.match(me, /noindex/, '/r/me stays noindex');
});

test('/r: How we count is the first link in the footer row', () => {
  const row = index.match(/<footer class="rh__foot">[\s\S]*?<\/footer>/)?.[0];
  assert.ok(row);
  assert.match(row, /<p class="air-mono"><a href="\/r\/how">How we count<\/a> <span aria-hidden="true">·<\/span> <a href="\/api\/air">/);
});

test('air-house.ts: the device rides in a header for GET and in the body for POST, never in a URL', () => {
  assert.match(houseSrc, /import \{ deviceId \} from '\.\/air-client'/);
  assert.match(houseSrc, /fetch\('\/api\/air\/house', \{\s+headers: \{ 'X-PC-Device': deviceId\(\)/);
  assert.match(houseSrc, /body: JSON\.stringify\(\{ action, device: deviceId\(\) \}\)/);
  assert.doesNotMatch(houseSrc, /\/api\/air\/house\?|device=|\?device|searchParams|location\.search/);
  assert.match(houseSrc, /That didn't go through\. Try again\./);
  assert.match(houseSrc, /body\.canMark !== true\) return;/, 'the section shows only when the API says canMark');
  assert.doesNotMatch(houseSrc, /localStorage|document\.cookie/);
});

/* ---------- the client scripts, run under jsdom ---------- */

/** Bundles a client script for node, with ./air-client replaced by a stub deviceId. */
async function load(entry) {
  const stub = { name: 'stub-air-client', setup(b) {
    b.onResolve({ filter: /air-client$/ }, () => ({ path: 'air-client-stub', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: "export const deviceId = () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';", loader: 'js' }));
  } };
  const out = await build({ entryPoints: [fileURLToPath(new URL(entry, root))], bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022', plugins: [stub] });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
}
const { mountAirHouse } = await load('src/scripts/air-house.ts');
const { mountAirHow } = await load('src/scripts/air-how.ts');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const flush = async () => { for (let i = 0; i < 6; i += 1) await tick(); };
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

/** Runs `fn` with a jsdom document as the globals and a fake fetch; restores them after. */
async function withDom(markup, routes, fn) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/r/me' });
  const saved = { document: globalThis.document, fetch: globalThis.fetch };
  const calls = [];
  globalThis.document = dom.window.document;
  globalThis.fetch = async (url, init = {}) => { calls.push({ url: String(url), init }); return routes(String(url), init, calls); };
  try { await fn({ doc: dom.window.document, calls }); } finally {
    globalThis.document = saved.document;
    globalThis.fetch = saved.fetch;
    dom.window.close();
  }
}
const houseMarkup = `<div class="rm">${me.match(/<section class="rm__section" data-air-house hidden>[\s\S]*?<\/section>/)[0]}</div>`;
const howMarkup = `<div>${how.match(/<div class="rw__count"[\s\S]*?<\/div>/)[0]}</div>`;

test('air-house.ts: shown only for the director; Mark, Undo and a failed post repaint the section', async () => {
  let marked = false;
  let failNext = false;
  await withDom(houseMarkup, (url, init) => {
    if (!init.method) return reply(200, { ok: true, canMark: true, marked });
    if (failNext) return reply(503, { ok: false, reason: 'store-unavailable' });
    marked = JSON.parse(init.body).action === 'mark';
    return reply(200, { ok: true, marked });
  }, async ({ doc, calls }) => {
    const section = doc.querySelector('[data-air-house]');
    const markBtn = doc.querySelector('[data-air-house-mark]');
    const markedLine = doc.querySelector('[data-air-house-marked]');
    const note = doc.querySelector('[data-air-house-note]');
    mountAirHouse();
    assert.equal(section.hidden, true, 'hidden until the API answers');
    await flush();
    assert.equal(calls[0].url, '/api/air/house', 'no query string');
    assert.equal(calls[0].init.headers['X-PC-Device'], 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    assert.equal(section.hidden, false);
    assert.deepEqual([markBtn.hidden, markedLine.hidden], [false, true]);

    markBtn.click();
    await flush();
    assert.equal(calls[1].init.method, 'POST');
    assert.deepEqual(JSON.parse(calls[1].init.body), { action: 'mark', device: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
    assert.equal(calls[1].url, '/api/air/house');
    assert.deepEqual([markBtn.hidden, markedLine.hidden], [true, false]);
    assert.match(markedLine.textContent, /House phone\. Its reports never count\./);

    failNext = true;
    doc.querySelector('[data-air-house-undo]').click();
    await flush();
    assert.equal(note.hidden, false);
    assert.equal(note.textContent, "That didn't go through. Try again.");
    assert.deepEqual([markBtn.hidden, markedLine.hidden], [true, false], 'a failed undo leaves the phone marked');

    failNext = false;
    doc.querySelector('[data-air-house-undo]').click();
    await flush();
    assert.deepEqual(JSON.parse(calls.at(-1).init.body).action, 'unmark');
    assert.deepEqual([markBtn.hidden, markedLine.hidden, note.hidden], [false, true, true]);
  });
});

test('air-house.ts: a non-director, a 503 and a network failure all leave the section hidden', async () => {
  for (const answer of [() => reply(200, { ok: true, canMark: false }), () => reply(503, { ok: false }), () => { throw new Error('offline'); }]) {
    await withDom(houseMarkup, answer, async ({ doc }) => {
      mountAirHouse();
      await flush();
      assert.equal(doc.querySelector('[data-air-house]').hidden, true);
    });
  }
});

test('air-how.ts: a dash until the API answers, then the count line; final puts the read-out above it', async () => {
  const live = { ok: true, window: { from: '2026-09-28', to: '2026-10-23' }, needs: { reports: 10, people: 3 }, reports: 1, people: 1, pass: false, final: false, asOf: '2026-10-20T13:00:00-07:00' };
  await withDom(howMarkup, () => reply(200, live), async ({ doc, calls }) => {
    const line = doc.querySelector('[data-air-how-line]');
    const readout = doc.querySelector('[data-air-how-read]');
    assert.equal(line.textContent, '—');
    mountAirHow();
    assert.equal(line.textContent, '—', 'still a dash before the answer');
    await flush();
    assert.equal(calls[0].url, '/api/air/killtest');
    assert.equal(line.textContent, countLine(live));
    assert.equal(line.textContent, '1 report from 1 person so far. The test needs 10 reports from 3 people, Sep 28 to Oct 23.');
    assert.equal(readout.hidden, true);
  });
  const final = { ...live, reports: 12, people: 4, pass: true, final: true };
  await withDom(howMarkup, () => reply(200, final), async ({ doc }) => {
    mountAirHow();
    await flush();
    const readout = doc.querySelector('[data-air-how-read]');
    assert.equal(readout.hidden, false);
    assert.equal(readout.textContent, readLine(final));
    assert.equal(readout.textContent, 'The read, Sat Oct 24: passed, with 12 reports from 4 people.');
    assert.equal(doc.querySelector('[data-air-how-line]').textContent, countLine(final));
  });
  const failed = { ...live, reports: 1, people: 1, pass: false, final: true };
  await withDom(howMarkup, () => reply(200, failed), async ({ doc }) => {
    mountAirHow();
    await flush();
    assert.ok(doc.querySelector('[data-air-how-read]').textContent.endsWith(FREEZE_LINE));
  });
});

test('air-how.ts: an error, a bad body or a 503 reads "The count is not available right now."', async () => {
  for (const answer of [() => reply(503, { ok: false, reason: 'store-unavailable' }), () => reply(200, { ok: true }), () => reply(200, { ok: true, reports: 'many' }), () => { throw new Error('offline'); }]) {
    await withDom(howMarkup, answer, async ({ doc }) => {
      mountAirHow();
      await flush();
      assert.equal(doc.querySelector('[data-air-how-line]').textContent, 'The count is not available right now.');
      assert.equal(doc.querySelector('[data-air-how-read]').hidden, true);
    });
  }
  assert.match(howSrc, /\/api\/air\/killtest/);
});
