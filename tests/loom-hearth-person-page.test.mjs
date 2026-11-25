import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { transform } from '@astrojs/compiler';
import { experimental_AstroContainer } from 'astro/container';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import { esc, ago, roomHref, historyWarning } from '../src/lib/loom/hearth.mjs';

const require = createRequire(import.meta.url);
const runtime = pathToFileURL(require.resolve('astro/runtime/server/index.js')).href;
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('src/pages/loom/hearth/person.astro');
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;$/gm, '');

// Exercise the real Astro page and Hearth shell without a build or disk output.
async function compile(source, filename) {
  const compiled = await transform(source, {
    filename,
    internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href,
    resultScopedSlot: true,
  });
  assert.deepEqual(compiled.diagnostics.filter(d => d.severity === 1), []);
  const emitted = compiled.code
    .replace(/,\s*createMetadata as \$\$createMetadata/, '')
    .replace(/['"]astro\/runtime\/server\/index\.js['"]/g, JSON.stringify(runtime));
  const code = ts.transpileModule(emitted, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    transformers: { before: [() => sf => ts.factory.updateSourceFile(sf, sf.statements.filter(s => {
      if (ts.isImportDeclaration(s) && /\.css$|\?astro&type=style&/.test(s.moduleSpecifier.text)) return false;
      if (ts.isVariableStatement(s) && s.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === '$$metadata')) return false;
      return true;
    }))] },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}

const rendered = (async () => {
  const layout = await compile(await read('src/layouts/HearthLayout.astro'), 'HearthLayout.astro');
  const route = await compile(source.replace("'../../../layouts/HearthLayout.astro'", JSON.stringify(layout)), 'person.astro');
  const { default: Page } = await import(route);
  const container = await experimental_AstroContainer.create();
  return container.renderToString(Page, { request: new Request('https://pointcast.xyz/loom/hearth/person?name=mike') });
})();

const NOW = Date.parse('2026-11-23T19:00:00Z');
const at = hours => new Date(NOW - hours * 3600000).toISOString();
const fullBody = 'A long log should stay readable in full. '.repeat(20) + 'The final sentence is still here.';
const fixture = () => ({
  name: 'Mike', asOf: NOW, lastSeen: { room: '#music', at: at(1) },
  posts: [
    { id: 'p3', key: 'music-key', room: '#music', at: at(1), from: { name: 'Mike' }, body: fullBody },
    { id: 'p2', key: 'loom-key', room: '#loom', at: at(2), from: { name: 'Mike' }, body: 'The second log.' },
    { id: 'p1', key: 'loom-key', room: '#loom', at: at(3), from: { name: 'Mike' }, body: 'The third log.' },
  ],
  bots: [
    { name: 'Astra', lab: 'OpenAI', rooms: ['#music', '#loom'], lastSeen: { room: '#music', at: at(0.5) } },
    { name: 'Fable', lab: 'Anthropic', rooms: ['#loom'], lastSeen: { room: '#loom', at: at(2) } },
  ],
  lent: { tokens: 125000, approximate: true, tokenSource: { room: '#efficiency', key: 'efficiency-key', id: 'receipt', at: at(4) },
    closedCards: 2, cardSources: [] },
  unavailable: [], trimmed: [], incomplete: false,
});

async function page(t, { card = fixture(), query = '?name=%40MIKE', savedName, reader } = {}) {
  const dom = new JSDOM(await rendered, { url: 'https://pointcast.xyz/loom/hearth/person' + query, runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  if (savedName) dom.window.localStorage.setItem('loom.name', savedName);
  const calls = [];
  Object.assign(dom.window, {
    esc, ago, roomHref, historyWarning,
    readHearthPerson: async name => { calls.push(name); return reader ? reader(name) : card; },
  });
  dom.window.eval(script);
  await new Promise(resolve => setTimeout(resolve, 0));
  return { document: dom.window.document, calls };
}

test('the person route renders the Hearth shell, card sections and bottom actions', async t => {
  const dom = new JSDOM(await rendered);
  t.after(() => dom.window.close());
  const { document } = dom.window;
  assert.equal(document.title, 'Loom · Your card');
  assert.ok(document.body.classList.contains('hearth-page'));
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://pointcast.xyz/loom/hearth/person');
  assert.deepEqual([...document.querySelectorAll('main h2')].map(node => node.textContent), ['Latest logs', 'Their bots', 'What they’ve lent']);
  assert.equal(document.querySelector('.hearth-foot a.primary').textContent, 'Add a log');
  assert.ok(document.querySelector('.hearth-foot a[href="/loom/hearth/lend"]'));
  assert.ok(document.querySelector('a[aria-label="Back to the hearth"]'));
});

test('the person card fills full posts, bot labs and activity, and positive lending evidence', async t => {
  const { document, calls } = await page(t);
  assert.deepEqual(calls, ['MIKE']);
  assert.equal(document.title, 'Loom · Mike');
  assert.equal(document.querySelector('#person-name').textContent, 'Mike');
  assert.equal(document.querySelector('#last-seen').textContent, 'Last seen in #music, an hour ago.');
  assert.equal(document.querySelector('#last-seen a').getAttribute('href'), '/loom/hearth/room?to=%23music');
  assert.equal(document.querySelector('#person-card').getAttribute('aria-busy'), 'false');
  const posts = [...document.querySelectorAll('#posts article')];
  assert.equal(posts.length, 3);
  assert.equal(posts[0].querySelector('.hearth-post-body').textContent, fullBody);
  assert.ok(posts[0].querySelector('a[href="/loom?to=loom%3Amusic-key%23p3"]'));
  const bots = [...document.querySelectorAll('#bot-list article')];
  assert.deepEqual(bots.map(node => node.querySelector('h3').textContent), ['Astra', 'Fable']);
  assert.deepEqual(bots.map(node => node.querySelector('.hearth-tag').textContent), ['OpenAI', 'Anthropic']);
  assert.match(bots[0].textContent, /This week: #music, #loom\./);
  assert.match(bots[0].textContent, /Last seen in #music, 30 minutes ago\./);
  assert.equal(document.querySelector('#lent').hidden, false);
  assert.match(document.querySelector('#lent-line').textContent, /125,000 tokens/);
  assert.match(document.querySelector('#lent-line').textContent, /2 closed cards/);
  assert.equal(document.querySelector('#add-log').getAttribute('href'), '/loom/hearth/room?to=%23music#log');
  assert.equal(document.querySelector('#read-status').textContent, '');
  assert.equal(document.querySelector('#retry').hidden, true);
});

test('an empty person card uses plain empty states and hides zero lending counters', async t => {
  const { document } = await page(t, { card: { ...fixture(), posts: [], bots: [], lastSeen: null, lent: { tokens: 0, closedCards: 0 } } });
  assert.match(document.querySelector('#last-seen').textContent, /No logs/);
  assert.match(document.querySelector('#posts').textContent, /No logs/);
  assert.match(document.querySelector('#bot-list').textContent, /No bots/);
  assert.equal(document.querySelector('#latest').hidden, false);
  assert.equal(document.querySelector('#bots').hidden, false);
  assert.equal(document.querySelector('#lent').hidden, true);
  assert.equal(document.querySelector('#lent-line').textContent, '');
  assert.doesNotMatch(document.querySelector('#person-card').textContent, /\b0\b/);
  assert.equal(document.querySelector('#add-log').getAttribute('href'), '/loom/hearth/room?to=%23loom#log');
});

test('missing names do not request a card; a saved name can open one', async t => {
  const missing = await page(t, { query: '' });
  assert.deepEqual(missing.calls, []);
  assert.match(missing.document.querySelector('#read-status').textContent, /Open a person’s name/);
  assert.equal(missing.document.querySelector('#person-card').getAttribute('aria-busy'), 'false');
  const saved = await page(t, { query: '', savedName: '  @Mike  ' });
  assert.deepEqual(saved.calls, ['Mike']);
  assert.equal(saved.document.querySelector('#person-name').textContent, 'Mike');
});

test('unavailable history is visible and a failed read can retry', async t => {
  const partial = await page(t, { card: { ...fixture(), incomplete: true, unavailable: ['#missing'] } });
  assert.equal(partial.document.querySelector('#read-status').textContent,
    '1 room could not be read. This card may be missing logs or bots.');
  assert.equal(partial.document.querySelector('#retry').hidden, false);
  let fail = true;
  const failed = await page(t, { reader: () => { if (fail) throw new Error('offline'); return fixture(); } });
  assert.match(failed.document.querySelector('#read-status').textContent, /couldn’t read this card/);
  assert.equal(failed.document.querySelector('#retry').hidden, false);
  assert.equal(failed.document.querySelector('#person-card').getAttribute('aria-busy'), 'false');
  fail = false;
  failed.document.querySelector('#retry').click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(failed.document.querySelector('#read-status').textContent, '');
  assert.equal(failed.document.querySelectorAll('#posts article').length, 3);
});

test('person warnings count failed and trimmed rooms separately and keep readable posts', async t => {
  const trimmed = await page(t, { card: { ...fixture(), incomplete: true, trimmed: ['#trimmed'] } });
  assert.equal(trimmed.document.querySelector('#read-status').textContent,
    '1 room had trimmed history. This card may be missing logs or bots.');
  assert.equal(trimmed.document.querySelector('#retry').hidden, true);
  assert.equal(trimmed.document.querySelectorAll('#posts article').length, 3);
  const mixed = await page(t, { card: { ...fixture(), incomplete: true,
    unavailable: ['#missing-1', '#missing-2'], trimmed: ['#trimmed-1', '#trimmed-2'] } });
  assert.equal(mixed.document.querySelector('#read-status').textContent,
    '2 rooms could not be read. 2 rooms had trimmed history. This card may be missing logs or bots.');
  assert.equal(mixed.document.querySelector('#retry').hidden, false);
});

test('names, rooms and post contents render as text and unsafe media stays unlinked', async t => {
  const hostile = '<img src=x onerror="alert(1)">';
  const card = fixture();
  card.name = hostile;
  card.lastSeen.room = '#<script>bad()</script>';
  card.posts = [{ ...card.posts[0], from: { name: hostile }, body: hostile + ' https://example.com/a?b=1&c=2.',
    media: { url: 'javascript:alert(1)', alt: 'Unsafe image' } }];
  card.bots[0].name = hostile;
  card.bots[0].lab = hostile;
  card.bots[0].rooms = ['#<b>room</b>'];
  card.lent = null;
  const { document } = await page(t, { card });
  assert.equal(document.querySelector('#person-name').textContent, hostile);
  assert.equal(document.querySelector('#bot-list h3').textContent, hostile);
  assert.match(document.querySelector('#posts .hearth-post-body').textContent, /<img src=x onerror=/);
  assert.equal(document.querySelectorAll('#person-card img, #person-card script, #person-card [onerror]').length, 0);
  assert.ok(document.querySelector('#posts a[href="https://example.com/a?b=1&c=2"]'));
  assert.equal(document.querySelectorAll('#person-card a[href^="javascript:"]').length, 0);
  assert.equal(document.querySelector('#lent').hidden, true);
});
