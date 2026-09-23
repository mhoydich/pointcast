import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

// Bar v2 phase 1: the Town Line deck. Pins the anti-jump contract — tiles are
// keyed by Noun and reused, you are always first, the lane is capped, and
// folding the deck is remembered.
const fixture = `<!doctype html><html><body>
  <img data-pc-ref="fb-noun" src="https://noun.pics/357.svg">
  <section class="town" data-town-line data-open="true" data-crowd="empty">
    <div class="town__deck">
      <button data-pc-ref="town-status"><span data-pc-ref="town-count">1</span><span data-pc-ref="town-here"></span><span data-pc-ref="town-sub"></span></button>
      <div data-pc-ref="town-lane"></div>
      <button data-town-pad="kick"></button><button data-town-pad="bloom"></button><button data-town-pad="dew"></button><button data-town-pad="thorn"></button>
      <div data-pc-ref="town-bubbles"></div>
    </div>
    <button data-pc-ref="town-toggle" aria-expanded="true"></button>
  </section>
</body></html>`;

test('town line: keyed tiles, you first, capped lane, remembered fold', async () => {
  const dom = new JSDOM(fixture, { url: 'https://pointcast.xyz/drum', pretendToBeVisual: true });
  const w = dom.window;
  for (const k of ['window', 'document', 'localStorage', 'CustomEvent', 'HTMLElement']) {
    Object.defineProperty(globalThis, k, { configurable: true, writable: true, value: k === 'window' ? w : w[k] });
  }
  Object.defineProperty(globalThis, 'location', { configurable: true, writable: true, value: w.location });
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.fetch = w.fetch = async () => ({ json: async () => ({ posts: [{ noun: 12, who: 'visitor', text: 'yah', at: new Date().toISOString() }] }) });

  const ac = new w.AbortController();
  const scope = {
    on: (t, type, fn, o) => t.addEventListener(type, fn, { ...(typeof o === 'object' ? o : {}), signal: ac.signal }),
    setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout, setInterval: () => 0, clearInterval,
  };
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const { mountTownLine } = await server.ssrLoadModule('/src/scripts/chrome/town-line.ts');
    const root = document.querySelector('[data-town-line]');
    mountTownLine(root, scope);
    const lane = document.querySelector('[data-pc-ref="town-lane"]');
    const tiles = () => [...lane.querySelectorAll('.town-tile')];
    assert.equal(tiles()[0].dataset.key, 'you', 'you are on the line even when alone');
    assert.equal(document.documentElement.dataset.deck, 'on');

    const send = (nouns, humans) => w.dispatchEvent(new w.CustomEvent('pc:presence', { detail: {
      humans, agents: 0, myNoun: 357, myPath: '/drum', waves: [], vibes: [], signals: [],
      sessions: [{ nounId: 357, kind: 'human', currentPath: '/drum' }].concat(nouns.map((n) => ({ nounId: n, kind: n % 7 === 0 ? 'agent' : 'human', currentPath: n % 2 ? '/drum' : '/' }))),
    } }));

    send([1, 2, 3], 4);
    const img2 = lane.querySelector('[data-key="n2"] img');
    assert.equal(document.querySelector('[data-pc-ref="town-count"]').textContent, '4');
    for (let i = 0; i < 50; i++) send(Array.from({ length: (i * 7) % 20 }, (_, j) => (j * 13 + i) % 40).concat([2]), 40);
    assert.equal(lane.querySelector('[data-key="n2"] img'), img2, 'a Noun that stays keeps its node (no image refetch)');
    const keys = tiles().map((t) => t.dataset.key);
    assert.equal(keys[0], 'you');
    assert.equal(new Set(keys).size, keys.length, 'one tile per Noun');
    assert.ok(tiles().filter((t) => !t.dataset.leaving).length <= 12, 'lane capped at 12 on desktop');

    send([5, 5, 5], 4);
    assert.equal(lane.querySelectorAll('[data-key="n5"]').length, 1, 'two tabs of one Noun collapse to one tile');

    document.querySelector('[data-pc-ref="town-toggle"]').click();
    assert.equal(root.dataset.open, 'false');
    assert.equal(document.documentElement.dataset.deck, 'off');
    assert.equal(localStorage.getItem('pc:deck'), 'off', 'fold is remembered');
    w.dispatchEvent(new w.CustomEvent('pc:presence', { detail: { humans: 2, agents: 0, myNoun: 357, myPath: '/drum', sessions: [{ nounId: 357, kind: 'human', currentPath: '/drum' }, { nounId: 9, kind: 'human', currentPath: '/' }], signals: [], vibes: [], waves: [{ fromNoun: 9, toNoun: 357, at: Date.now() }] } }));
    w.dispatchEvent(new w.CustomEvent('pc:presence', { detail: { humans: 2, agents: 0, myNoun: 357, myPath: '/drum', sessions: [{ nounId: 357, kind: 'human', currentPath: '/drum' }, { nounId: 9, kind: 'human', currentPath: '/' }], signals: [], vibes: [], waves: [{ fromNoun: 9, toNoun: 357, at: Date.now() + 1 }] } }));
    assert.equal(root.dataset.open, 'true', 'a wave at you opens the folded deck');
    assert.equal(localStorage.getItem('pc:deck'), 'off', '…without overriding your saved choice');
  } finally {
    ac.abort();
    await server.close();
  }
});
