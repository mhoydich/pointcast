import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const tick = () => new Promise((resolve) => setImmediate(resolve));

const members = {
  0: ['Pocket Captain', 'drum', 108, '#ff5c35', '/images/pocket.webp'],
  1: ['Parade Marshal', 'drum', 124, '#ff9861', '/images/parade.webp'],
  3: ['Low & Slow', 'bass', 88, '#168a91', '/images/low.webp'],
  4: ['Sidewalk Bassline', 'bass', 112, '#17a6a2', '/images/sidewalk.webp'],
  6: ['Soft Signal', 'mallet', 106, '#3988f5', '/images/soft.webp'],
  7: ['Glass Garden', 'mallet', 96, '#5c9dfa', '/images/glass.webp'],
  9: ['Cloud Nine', 'chord', 100, '#7256bd', '/images/cloud.webp'],
  10: ['Purple Parade', 'chord', 116, '#987def', '/images/purple.webp'],
};
let serial = 0;

async function fixture(t) {
  const dom = new JSDOM(`
    <section data-band-builder data-date="2026-09-21" data-default-band="0,3,6,9" data-play-url="/nouns/drum-club/?beat=TODAY&band=0%2C3%2C6%2C9">
      <p><span data-band-label>STARTER BAND</span> · <span data-band-date>2026-09-21</span></p>
      <p data-band-prompt>old prompt</p>
      <div data-band-slot="drum"><img data-band-image><strong data-band-name></strong></div>
      <div data-band-slot="bass"><img data-band-image><strong data-band-name></strong></div>
      <div data-band-slot="mallet"><img data-band-image><strong data-band-name></strong></div>
      <div data-band-slot="chord"><img data-band-image><strong data-band-name></strong></div>
      <select data-band-select="drum" disabled>
        <option value="0" data-name="Pocket Captain" data-tempo="108" data-color="#ff5c35" data-webp="/images/pocket.webp">Pocket Captain</option>
        <option value="1" data-name="Parade Marshal" data-tempo="124" data-color="#ff9861" data-webp="/images/parade.webp">Parade Marshal</option>
      </select>
      <select data-band-select="bass" disabled><option value="3" data-name="Low &amp; Slow" data-tempo="88" data-color="#168a91" data-webp="/images/low.webp">Low &amp; Slow</option><option value="4" data-name="Sidewalk Bassline" data-tempo="112" data-color="#17a6a2" data-webp="/images/sidewalk.webp">Sidewalk Bassline</option></select>
      <select data-band-select="mallet" disabled><option value="6" data-name="Soft Signal" data-tempo="106" data-color="#3988f5" data-webp="/images/soft.webp">Soft Signal</option><option value="7" data-name="Glass Garden" data-tempo="96" data-color="#5c9dfa" data-webp="/images/glass.webp">Glass Garden</option></select>
      <select data-band-select="chord" disabled><option value="9" data-name="Cloud Nine" data-tempo="100" data-color="#7256bd" data-webp="/images/cloud.webp">Cloud Nine</option><option value="10" data-name="Purple Parade" data-tempo="116" data-color="#987def" data-webp="/images/purple.webp">Purple Parade</option></select>
      <a data-band-play href="/nouns/drum-club/?beat=TODAY&amp;band=0%2C3%2C6%2C9">Play &amp; remix</a>
      <button data-band-shuffle disabled>Shuffle</button><button data-band-reset disabled>Today’s band</button>
      <p data-band-tempo-summary></p><p data-band-status role="status"></p>
    </section>`, { url: 'https://pointcast.test/nouns/drum-club/bandmates/' });
  const previous = new Map();
  const globals = { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, HTMLSelectElement: dom.window.HTMLSelectElement };
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const sourceUrl = new URL('../src/lib/nouns-band-builder-ui.ts', import.meta.url);
  let source = ts.transpileModule(await readFile(sourceUrl, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const arrangement = `data:text/javascript;base64,${Buffer.from(`
    export const BANDMATE_QUARTET_ROLES = ['drum','bass','mallet','chord'];
    export function nounsDrumClubBandmateArrangement() { return { dateKey: '2026-09-22', quartet: [0,3,6,9], score: { tempo: 100, name: '2026-09-22 · Today’s Band' }, prompt: 'Pocket Captain sets the pocket. Leave one step empty, then add your sound.' }; }
    export function composeBandmateScore(quartet, name) { return { tempo: 123, name, quartet }; }
    export function nounsDrumClubArrangementPlayUrl(quartet, score) { return 'https://pointcast.test/nouns/drum-club/?beat=' + encodeURIComponent(score.name) + '&band=' + quartet.join(','); }
  `).toString('base64')}`;
  source = source.replaceAll("'./nouns-drum-club-arrangements'", JSON.stringify(arrangement));
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#fixture-${++serial}`);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  await tick();
  t.after(() => { dom.window.close(); for (const [key, descriptor] of previous) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]; });
  return { dom, root: dom.window.document.querySelector('[data-band-builder]') };
}

test('stale static fallback becomes the current UTC band without starting audio', async (t) => {
  const { root } = await fixture(t);
  assert.equal(root.querySelector('[data-band-label]').textContent, 'TODAY’S BAND');
  assert.equal(root.querySelector('[data-band-date]').textContent, '2026-09-22');
  assert.equal(root.querySelector('[data-band-prompt]').textContent, 'Leave one step empty, then add your sound.');
  assert.equal(root.querySelector('[data-band-play]').getAttribute('href'), '/nouns/drum-club/?beat=2026-09-22%20%C2%B7%20Today%E2%80%99s%20Band&band=0,3,6,9');
  assert.equal(root.querySelector('[data-band-shuffle]').disabled, false);
  assert.equal(root.querySelector('[data-band-reset]').disabled, false);
  assert.equal(root.querySelector('[data-band-select="drum"]').disabled, false);
});

test('selection composes a custom band and updates portrait, tempo, and local remix link', async (t) => {
  const { dom, root } = await fixture(t);
  const drum = root.querySelector('[data-band-select="drum"]');
  drum.value = '1'; drum.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(root.querySelector('[data-band-name]').textContent, 'Parade Marshal');
  assert.equal(root.querySelector('[data-band-tempo-summary]').textContent, 'Combined feel · 123 BPM');
  assert.equal(new URL(root.querySelector('[data-band-play]').href).searchParams.get('band'), '1,3,6,9');
  assert.match(new URL(root.querySelector('[data-band-play]').href).searchParams.get('beat'), /Encore/);
  assert.match(root.querySelector('[data-band-status]').textContent, /Band updated/);
});

test('shuffle always changes the quartet and Today’s band restores the daily quartet', async (t) => {
  const { dom, root } = await fixture(t);
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    root.querySelector('[data-band-shuffle]').click();
  } finally { Math.random = originalRandom; }
  assert.notEqual(Array.from(root.querySelectorAll('select')).map((select) => select.value).join(','), '0,3,6,9');
  root.querySelector('[data-band-reset]').click();
  assert.equal(Array.from(root.querySelectorAll('select')).map((select) => select.value).join(','), '0,3,6,9');
  assert.equal(new URL(root.querySelector('[data-band-play]').href).searchParams.get('band'), '0,3,6,9');
});
