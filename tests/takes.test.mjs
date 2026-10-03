import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  parseDoc, serializeDoc, blockTokens, flatTakes, setTakeActive, addTakeOption, removeTakeOption, flattenTake,
  promoteTake, wrapTake, wrapDim, unwrapDimAt, cutRange, sentenceBounds, rangeIsClean, docStats, cleanMarkdown, SAMPLE_DOC,
} from '../src/scripts/takes-core.mjs';
import { TakesAudio, SCALES } from '../src/scripts/takes-audio.mjs';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Takes Markdown round-trips the sample exactly', () => {
  const doc = parseDoc(SAMPLE_DOC);
  assert.equal(serializeDoc(doc), SAMPLE_DOC);
  assert.equal(doc.overflow.length, 2);
  const para = doc.blocks.find(b => b.versions.length > 1);
  assert.equal(para.versions.length, 3);
  assert.equal(para.active, 1);
});

test('inline takes cycle, return to original and keep the chosen one', () => {
  const src = 'The sand was {{shining | glassy | >wet}} today.';
  const [tok] = flatTakes(blockTokens(src).tokens);
  assert.deepEqual(tok.options, ['shining', 'glassy', 'wet']);
  assert.equal(tok.active, 2);
  assert.equal(setTakeActive(src, 0, 0), 'The sand was {{shining | glassy | wet}} today.');
  assert.equal(setTakeActive(src, 0, 3), 'The sand was {{shining | glassy | wet}} today.', 'wraps around');
  assert.equal(addTakeOption(src, 0, 'bright | {x}'), 'The sand was {{shining | glassy | wet | >bright x}} today.');
  assert.equal(removeTakeOption(src, 0, 2), 'The sand was {{shining | glassy}} today.');
  assert.equal(removeTakeOption('a {{b | >c}} d', 0, 1), 'a b d');
  assert.equal(flattenTake(src, 0), 'The sand was wet today.');
  assert.equal(promoteTake(src, 0), 'The sand was {{wet | shining | glassy}} today.');
});

test('selections wrap only when they do not cut through tokens', () => {
  const src = 'One two ((three four)) five {{six | seven}}.';
  assert.equal(wrapTake(src, 0, 3, 'Uno'), '{{One | >Uno}} two ((three four)) five {{six | seven}}.');
  assert.equal(rangeIsClean(src, 4, 12), false, 'cuts into the dim');
  assert.equal(rangeIsClean(src, 10, 15), true, 'inside the dim is fine');
  assert.equal(wrapDim(src, 0, 7), '((One two)) ((three four)) five {{six | seven}}.');
  assert.equal(unwrapDimAt(src, 10), 'One two three four five {{six | seven}}.');
  assert.deepEqual(cutRange('Keep this, drop that.', 10, 20), { src: 'Keep this,.', cut: 'drop that' });
});

test('sentence bounds treat takes as opaque', () => {
  const src = 'First one. {{A take. | Another.}} still going. Last.';
  const [a, b] = sentenceBounds(src, src.indexOf('still'));
  assert.equal(src.slice(a, b), '{{A take. | Another.}} still going.');
  const [c, d] = sentenceBounds(src, src.indexOf('Last'));
  assert.equal(src.slice(c, d), 'Last.');
});

test('stats and clean export use only the chosen takes', () => {
  const doc = parseDoc('# T\n\nA {{b | >c}} d ((e)).\n\n--- overflow ---\n\ncut');
  const st = docStats(doc);
  assert.equal(st.takes, 1);
  assert.equal(st.overflow, 1);
  assert.equal(cleanMarkdown(doc), '# T\n\nA c d e.\n');
  assert.equal(cleanMarkdown(doc, { keepDim: false }), '# T\n\nA c d .\n');
});

test('alternates ring higher than the original', () => {
  const audio = new TakesAudio({ scale: 'pentatonic', root: 0, octave: 0 });
  const original = audio.takeFreq(0);
  for (let i = 1; i <= 8; i++) assert.ok(audio.takeFreq(i) > original * 2);
  assert.ok(audio.takeFreq(2) > audio.takeFreq(1));
  assert.ok(Object.keys(SCALES).length >= 5);
});

test('page is wired, isolated and honest about storage', async () => {
  const page = await read('src/pages/takes.astro');
  assert.match(page, /immersive isolated/);
  assert.match(page, /Not affiliated/);
  assert.match(page, /Nothing is uploaded/);
  const json = await read('src/pages/takes.json.ts');
  assert.match(json, /ai: false/);
  for (const file of ['src/lib/pointcast-apps.ts', 'src/data/agent-surfaces.ts', 'src/pages/sitemap-discovery.xml.ts', 'public/llms.txt', 'src/pages/for-agents.astro']) {
    assert.match(await read(file), /pointcast\.xyz\/takes\/|href="\/takes\/"/, file);
  }
});

test('the desk boots in a DOM and auditions a take with the keyboard', async () => {
  const html = await read('src/pages/takes.astro');
  const markup = html.slice(html.indexOf('<div class="tk"'), html.lastIndexOf('<script>'));
  // strip Astro expressions that need the build
  const plain = markup.replace(/\{[A-Za-z][^{}]*?\.map\([\s\S]*?\)\}/g, '').replace(/\{'([^']*)'\}/g, '$1').replace(/\{`[\s\S]*?`\}/g, '');
  const dom = new JSDOM(`<!doctype html><body>${plain}</body>`, { pretendToBeVisual: true, url: 'https://pointcast.xyz/takes/' });
  const { window } = dom;
  Object.assign(globalThis, { window, document: window.document, localStorage: window.localStorage, getComputedStyle: window.getComputedStyle, requestAnimationFrame: fn => setTimeout(fn, 0), Element: window.Element, confirm: () => true });
  const { initTakes } = await import('../src/scripts/takes.mjs');
  const app = initTakes(window.document.querySelector('[data-takes]'));
  const takes = window.document.querySelectorAll('.tk-take');
  assert.equal(takes.length, 3);
  takes[0].focus();
  takes[0].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  const first = flatTakes(blockTokens(app.state.doc.blocks[1].versions[0]).tokens)[0];
  assert.equal(first.active, 0, 'wet and bright (take 3) wraps to the original');
  assert.match(window.document.querySelector('[data-source]').value, /\{\{shining \| glassy \| wet and bright\}\}/);
});
