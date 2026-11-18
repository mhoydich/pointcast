import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountKit } from '../public/sketches/loom-kit/kit.mjs';

const page = new URL('../public/sketches/loom-kit/index.html', import.meta.url);
const preview = 'https://pointcast.xyz/sketches/loom-kit/';
const names = ['sound', 'motion', 'flame', 'card-stack'];

function openSketch() {
  const { document } = new JSDOM(readFileSync(page, 'utf8'), { url: preview }).window;
  const slot = name => document.querySelector(`[data-kit-slot="${name}"]`);
  return {
    document,
    content: name => slot(name).querySelector('[data-kit-content]'),
    status: name => slot(name).querySelector('[data-kit-status]'),
  };
}

test('the static sketch labels four slots and keeps every missing demo readable', async () => {
  const { document, content, status } = openSketch();
  const slots = [...document.querySelectorAll('[data-kit-slot]')];
  assert.deepEqual(slots.map(slot => slot.dataset.kitSlot).sort(), [...names].sort());
  assert.ok([...document.querySelectorAll('script[type="module"][src]')].some(script => script.src === preview + 'kit.mjs'));
  const requested = [];
  await mountKit(document, async path => {
    requested.push(path);
    throw new TypeError('Module unavailable');
  });
  assert.deepEqual(requested.sort(), names.map(name => `../../loom/kit/${name}.mjs`).sort());
  for (const name of names) {
    assert.equal(status(name).textContent.trim(), 'not built yet');
    assert.equal(status(name).hidden, false);
    assert.equal(content(name).hidden, true);
  }
});

test('a pending or broken demo only affects its own slot', async () => {
  const { document, content, status } = openSketch();
  const sound = Promise.withResolvers();
  const modules = {
    sound: { async mountDemo(container) {
      container.textContent = 'Sound controls';
      await sound.promise;
    } },
    motion: { mountDemo(container) {
      container.textContent = 'Motion controls';
    } },
    flame: { async mountDemo(container) {
      container.textContent = 'Partial controls';
      throw new Error('Mount failed');
    } },
    'card-stack': {},
  };
  const mounting = mountKit(document, path => modules[path.split('/').at(-1).replace('.mjs', '')]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(content('motion').hidden, false);
  assert.equal(status('motion').hidden, true);
  assert.equal(content('sound').hidden, true);
  assert.equal(status('sound').hidden, false);
  sound.resolve();
  await mounting;
  for (const name of ['sound', 'motion']) {
    assert.equal(status(name).hidden, true);
    assert.equal(content(name).hidden, false);
    assert.match(content(name).textContent, /controls/);
  }
  for (const name of ['flame', 'card-stack']) {
    assert.equal(content(name).textContent, '');
    assert.equal(content(name).hidden, true);
    assert.equal(status(name).hidden, false);
    assert.equal(status(name).textContent, 'Demo couldn’t start.');
  }
});
