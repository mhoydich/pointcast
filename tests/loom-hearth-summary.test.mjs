import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { transform } from '@astrojs/compiler';
import { experimental_AstroContainer } from 'astro/container';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import { roomSummary } from '../src/lib/loom/hearth-summary.mjs';
import { esc, flameSvg, roomView, personHref, isPerson, ago } from '../src/lib/loom/hearth.mjs';
import { hearthActivity } from '../src/lib/loom/hearth-day.mjs';

const NOW = Date.parse('2026-11-25T20:00:00Z');
const log = { address: '#fixture', key: 'fixture', label: '#fixture', kind: 'topic' };
const human = name => ({ name, kind: 'human' });
const bot = name => ({ name, kind: 'agent', address: '@' + name.toLowerCase() });
const post = (id, hours, from, body, extra = {}) => ({ id, at: new Date(NOW - hours * 3600000).toISOString(), from, body, ...extra });
const summary = messages => roomSummary(messages, { log, now: NOW });
const lines = messages => summary(messages).map(line => line.text);
const busy = [
  post('old', 25, human('Old voice'), 'From yesterday'),
  post('hello', 4, human('Bea'), 'Good morning'),
  post('done', 3, bot('Sol'), 'DONE · Room summary · https://example.com/summary'),
  post('mine', 2, bot('Astra'), 'MINE · Phone layout'),
  post('ask', 1, human('Mike'), 'Can we choose the next room?'),
];

test('busy room has people first, a linked receipt and at most two open items', () => {
  assert.deepEqual(lines(busy), [
    'Mike, Bea and 2 bots spoke.',
    'Done: Room summary',
    'Open: Can we choose the next room?; Phone layout',
  ]);
  assert.equal(summary(busy)[1].items[0].href, 'https://example.com/summary');
  assert.equal(summary(busy)[2].items[0].href, '/loom?to=%23fixture#ask');
  assert.deepEqual(roomView(busy, { log, now: NOW }).summary, summary(busy));
  assert.deepEqual(summary([...busy].reverse()), summary(busy), 'API nesting order is not recency');
  assert.equal(summary([...busy, post('older-ask', 5, human('Bea'), 'Which color?')])[2].items.length, 2);
});

test('quiet room falls back to the last twenty direct posts, or one quiet line', () => {
  assert.deepEqual(lines([]), ['Quiet in the last day.']);
  const old = Array.from({ length: 21 }, (_, i) => post('old' + i, 25 + i, human(i === 20 ? 'Outside' : 'Mike'), 'Hello'));
  old[1].body = 'SHIPPED: Garden page';
  old[2].body = 'MINE: Porch sketch';
  assert.deepEqual(lines(old), ['Mike spoke.', 'Done: Garden page', 'Open: Porch sketch']);
  assert.equal(summary(old)[1].items[0].href, '/loom?to=%23fixture#old1', 'receipts without external links point to their post');
  assert.deepEqual(lines([...old, post('fresh', 1, human('Bea'), 'Hello')]), ['Bea spoke.']);
});

test('bots-only rooms count distinct senders and omit empty lines', () => {
  assert.deepEqual(lines([
    post('a', 1, bot('Sol'), 'Hello'), post('b', 2, bot('Sol'), 'Hello again'), post('c', 3, bot('Astra'), 'Hello'),
  ]), ['2 bots spoke.']);
  assert.deepEqual(lines([post('a', 1, bot('Sol'), 'Hello')]), ['1 bot spoke.']);
  assert.deepEqual(lines([post('a', 1, human('Mike'), 'Hello')]), ['Mike spoke.']);
  assert.deepEqual(lines([post('a', 1, { ...human('Mike'), address: '@mike' }, 'Hello'), post('b', 2, human('Mike'), 'Earlier')]), ['Mike spoke.']);
});

test('only the last day counts, including its boundary; invisible, mirrored and future posts do not', () => {
  const ignored = [
    post('hidden', 1, human('Hidden'), 'DONE', { hidden: true }),
    post('withdrawn', 1, human('Withdrawn'), 'MINE', { withdrawn: true }),
    post('copy', 1, human('Copy'), 'Hello', { via: { key: 'elsewhere' } }),
    post('collator', 1, { name: 'Collator', kind: 'robot' }, 'Hello'),
    post('future', -1, human('Future'), 'Hello'),
  ];
  assert.deepEqual(lines(ignored), ['Quiet in the last day.']);
  assert.deepEqual(lines([...ignored, post('edge', 24, human('Mike'), 'Hello'), post('outside', 24.001, human('Old'), 'Hello')]), ['Mike spoke.']);
});

test('receipt markers, stamps and reported merged PR links produce the two newest receipts', () => {
  for (const marker of ['DONE', 'SHIPPED', 'MERGED', 'RELEASE RECEIPT', '**DONE**', 'Nov 25 · Sol, AI agent · DONE']) {
    const result = summary([post('r', 1, bot('Sol'), `${marker}: Room search #loom-v2 a3c123deadbeef. https://example.com/result`)]);
    assert.equal(result[1].text, 'Done: Room search loom-v2', marker);
    assert.equal(result[1].items[0].href, 'https://example.com/result');
  }
  const merged = post('pr', 1, bot('Sol'), 'The room update was merged: https://github.com/mhoydich/pointcast/pull/42');
  assert.equal(summary([merged])[1].items[0].href, 'https://github.com/mhoydich/pointcast/pull/42');
  for (const body of ['Review https://github.com/mhoydich/pointcast/pull/42', 'When this is merged: https://github.com/mhoydich/pointcast/pull/42', 'This was not merged: https://github.com/mhoydich/pointcast/pull/42', '> DONE: quoted receipt', '```\nDONE: code example\n```']) {
    assert.deepEqual(lines([post('r', 1, bot('Sol'), body)]), ['1 bot spoke.']);
  }
  assert.deepEqual(summary([merged, post('older', 2, bot('Sol'), 'DONE: Older'), post('oldest', 3, bot('Sol'), 'DONE: Oldest')])[1].items.map(item => item.text), ['The room update was merged', 'Older']);
});

test('MINE closes only after a later DONE from the same sender, even outside its reply chain', () => {
  const claim = post('mine', 3, bot('Sol'), 'MINE · Room summary');
  const other = post('other', 1, bot('Astra'), 'DONE · Something else');
  const before = post('before', 4, bot('Sol'), 'DONE · Previous task');
  assert.equal(summary([claim, other, before]).at(-1).text, 'Open: Room summary');
  const done = post('done', 2, { ...bot('Sol'), name: 'Sol renamed' }, 'DONE · Room summary');
  assert.ok(!summary([claim, other, before, done]).some(line => line.kind === 'open'));
  assert.equal(summary([claim, { ...done, hidden: true }]).at(-1).text, 'Open: Room summary');
  const next = post('next', .5, bot('Sol'), 'MINE · Next task');
  assert.equal(summary([claim, done, next]).at(-1).text, 'Open: Next task');
  assert.equal(summary([{ ...claim, seq: 2 }, { ...done, at: claim.at, seq: 1 }]).at(-1).kind, 'open');
  assert.ok(!summary([{ ...claim, seq: 2 }, { ...done, at: claim.at, seq: 3 }]).some(line => line.kind === 'open'));
  assert.ok(!summary([{ ...claim, from: { name: 'Sol', kind: 'agent' } }, { ...done, from: bot('Sol') }]).some(line => line.kind === 'open'), 'an added sender address does not strand an older claim');
});

test('real asks reuse For You protections, including names, polls, quotes and status receipts', () => {
  for (const body of ['NEEDS MIKE · Choose the room', '@alex, should we publish the poster?', 'Hi Mike, can you approve the poster?', 'Please approve the poster, Mike.', 'The poster needs your yes.', 'The poster needs Alex’s yes.', 'Which room should we open?']) {
    assert.equal(summary([post('ask', 1, bot('Sol'), body)]).at(-1).kind, 'open', body);
  }
  const poll = post('poll', 1, human('Mike'), '', { kind: 'poll', poll: { question: 'Which room?', options: [] } });
  assert.equal(summary([poll]).at(-1).text, 'Open: Which room?');
  for (const body of ['FIXED: The page is ready. Next release needs your yes.', 'The needs your yes card looks good.', 'Needs your yes cards now show names.', 'Needs Mike’s yes cards now show names.', 'Previous question: @mike, should we publish?', '“Mike, please approve the poster.”', '> NEEDS MIKE · Choose the room', '```\nMike, please approve the poster.\n```', 'The release no longer needs your yes.']) {
    assert.deepEqual(lines([post('report', 1, bot('Sol'), body)]), ['1 bot spoke.'], body);
  }
});

test('asks answered by their addressee or cleared by their author no longer appear open', () => {
  const ask = post('ask', 3, bot('Sol'), 'NEEDS MIKE · Choose the room');
  const answer = post('answer', 1, human('Mike'), 'The garden', { parent: 'ask' });
  assert.ok(!summary([ask, answer]).some(line => line.kind === 'open'));
  const clear = post('clear', 1, bot('Sol'), 'CLEARED · Chosen', { parent: 'ask' });
  assert.ok(!summary([ask, clear]).some(line => line.kind === 'open'));
  assert.equal(summary([ask, { ...clear, from: bot('Other') }]).at(-1).kind, 'open');
});

// Compile the real route and layout in memory using copied dependencies only.
const require = createRequire(import.meta.url);
const runtime = pathToFileURL(require.resolve('astro/runtime/server/index.js')).href;
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
async function compile(source, filename) {
  const compiled = await transform(source, { filename, internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href, resultScopedSlot: true });
  assert.deepEqual(compiled.diagnostics.filter(d => d.severity === 1), []);
  const code = ts.transpileModule(compiled.code.replace(/,\s*createMetadata as \$\$createMetadata/, '').replace(/['"]astro\/runtime\/server\/index\.js['"]/g, JSON.stringify(runtime)), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    transformers: { before: [() => sf => ts.factory.updateSourceFile(sf, sf.statements.filter(s => {
      if (ts.isImportDeclaration(s) && /\.css$|\?astro&type=style&/.test(s.moduleSpecifier.text)) return false;
      if (ts.isVariableStatement(s) && s.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === '$$metadata')) return false;
      return true;
    }))] },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}

test('JSDOM renders the actual summary above people posts with safe working links', async () => {
  const layout = await compile(await read('src/layouts/HearthLayout.astro'), 'HearthLayout.astro');
  const source = await read('src/pages/loom/hearth/room.astro');
  const route = await compile(source.replace("'../../../layouts/HearthLayout.astro'", JSON.stringify(layout)), 'room.astro');
  const { default: Page } = await import(route);
  const container = await experimental_AstroContainer.create();
  const html = await container.renderToString(Page, { request: new Request('https://pointcast.xyz/loom/hearth/room?to=%23fixture') });
  const dom = new JSDOM(html, { url: 'https://pointcast.xyz/loom/hearth/room?to=%23fixture', runScripts: 'outside-only' });
  const { window } = dom;
  try {
    let messages = busy;
    Object.assign(window, { esc, flameSvg, roomView, personHref, isPerson, ago, hearthActivity });
    window.Date.now = () => NOW;
    window.fetch = async (url, options) => {
      assert.equal(url, '/api/loom?to=%23fixture');
      assert.equal(options.method, undefined, 'render never writes to Loom');
      return { ok: true, json: async () => ({ ok: true, log, messages }) };
    };
    const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;$/gm, '');
    await window.eval(script.replace(/\bload\(\);\s*$/, 'load();'));
    const { document, Node } = window;
    const card = document.querySelector('#summary-card');
    assert.equal(card.hidden, false);
    assert.deepEqual([...card.querySelectorAll('#summary p')].map(p => p.textContent), lines(busy));
    assert.ok(card.compareDocumentPosition(document.querySelector('#people .hearth-post')) & Node.DOCUMENT_POSITION_FOLLOWING);
    assert.equal(card.querySelector('a').href, 'https://example.com/summary');
    assert.equal(card.querySelectorAll('a').length, 3);
    assert.equal(document.querySelector('#bots').open, false);

    messages = [post('unsafe', 1, human('<img src=x onerror=alert(1)>'), 'DONE · <svg onload=alert(1)> · javascript:alert(1)', { links: ['javascript:alert(1)'] })];
    await window.eval('load()');
    assert.equal(card.querySelectorAll('img,svg,script').length, 0);
    assert.equal(card.querySelector('a').href, 'https://pointcast.xyz/loom?to=%23fixture#unsafe');
    messages = [];
    await window.eval('load()');
    assert.deepEqual([...card.querySelectorAll('#summary p')].map(p => p.textContent), ['Quiet in the last day.']);
    assert.equal(document.querySelector('#voices').hidden, true);
  } finally { window.close(); }
});
