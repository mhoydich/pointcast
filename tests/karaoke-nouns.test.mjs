import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initNounCompanions, NOUN_COMPANIONS } from '../src/scripts/karaoke-nouns.mjs';

function setup({ reducedMotion = false } = {}) {
  const dom = new JSDOM('<section id="companions"></section>');
  const previous = { document: globalThis.document, Element: globalThis.Element, matchMedia: globalThis.matchMedia };
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.matchMedia = () => ({ matches: reducedMotion });
  return {
    container: dom.window.document.querySelector('#companions'),
    restore() {
      globalThis.document = previous.document;
      globalThis.Element = previous.Element;
      globalThis.matchMedia = previous.matchMedia;
      dom.window.close();
    },
  };
}

test('uses a bounded subset of existing Drum Club companion assets', () => {
  assert.equal(NOUN_COMPANIONS.length, 6);
  for (const companion of NOUN_COMPANIONS) {
    assert.match(companion.image, /^\/games\/nouns-nation-battler\/assets\/noun-\d+\.svg$/);
    assert.ok(companion.name);
  }
});

test('renders one to eight local singer companions and cycles choices', () => {
  const env = setup();
  try {
    const api = initNounCompanions(env.container);
    assert.equal(env.container.querySelectorAll('.noun-companion').length, 1);
    api.setSingers(12);
    assert.equal(env.container.querySelectorAll('.noun-companion').length, 8);
    const first = env.container.querySelector('.noun-companion__choice');
    assert.match(first.getAttribute('aria-label'), /Singer 1 companion: Pocket Captain/);
    first.click();
    const cycled = env.container.querySelector('.noun-companion__choice');
    assert.match(cycled.getAttribute('aria-label'), /Moon Rim/);
    assert.equal(env.container.ownerDocument.activeElement, cycled, 'cycling preserves keyboard focus');
    assert.match(env.container.querySelector('[role="status"]').textContent, /Singer 1 chose Moon Rim/);
    api.setSingers(0);
    assert.equal(env.container.querySelectorAll('.noun-companion').length, 1);
  } finally { env.restore(); }
});

test('cheers only on direct calls and reset preserves chosen local avatars', () => {
  const env = setup({ reducedMotion: true });
  try {
    const api = initNounCompanions(env.container);
    api.setSingers(3);
    api.cheer('Flowers');
    assert.equal(env.container.dataset.cheer, 'Flowers');
    assert.match(env.container.querySelector('[role="status"]').textContent, /Flowers for the singers on this screen/);
    env.container.querySelector('.noun-companion__choice').click();
    api.reset();
    assert.equal(env.container.dataset.cheer, undefined);
    assert.match(env.container.querySelector('.noun-companion__choice').getAttribute('aria-label'), /Moon Rim/);
    assert.equal(env.container.querySelectorAll('.noun-companion').length, 3);
  } finally { env.restore(); }
});

test('requires a real container element', () => {
  const env = setup();
  try { assert.throws(() => initNounCompanions(null), TypeError); }
  finally { env.restore(); }
});
