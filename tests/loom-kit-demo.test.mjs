import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountKit } from '../public/sketches/loom-kit/kit.mjs';

const page = new URL('../public/sketches/loom-kit/index.html', import.meta.url);
const preview = 'https://pointcast.xyz/sketches/loom-kit/';
const names = ['sound', 'motion', 'flame', 'card-stack'];

function openSketch(url = preview) {
  const { document } = new JSDOM(readFileSync(page, 'utf8'), { url }).window;
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

test('the motion slot keeps one heading and preserves distinct demo and dialog headings', async () => {
  for (const name of ['Motion', 'Try the spring']) {
    const { document, content } = openSketch();
    await mountKit(document, async path => {
      if (!path.endsWith('/motion.mjs')) throw new TypeError('Missing');
      return { mountDemo(target) {
        target.innerHTML = `<section class="lm-motion-demo"><h3 class="lm-motion-title">${name}</h3>
          <dialog><h3>Sheet details</h3></dialog></section>`;
      } };
    });
    assert.equal(document.getElementById('heading-motion').hidden, false);
    assert.equal(content('motion').querySelector('.lm-motion-title').hidden, name === 'Motion');
    assert.equal(content('motion').querySelector('dialog h3').hidden, false);
  }
});

test('only the same-repository phone preview loads the submitted component revisions', async () => {
  const raw = 'https://raw.githack.com/mhoydich/pointcast/';
  const route = '/public/sketches/loom-kit/index.html';
  const local = names.map(name => `../../loom/kit/${name}.mjs`);
  const submitted = [
    raw + 'fefc09da6210de06a87f4eff6b6eab892f0eade3/public/loom/kit/sound.mjs',
    raw + 'dd5bc90659b691543a73936da813ecbea250b263/public/loom/kit/motion.mjs',
    raw + 'fb24cd9c3f4b1607d62b58f7b30777f692fa28c0/public/loom/kit/flame.mjs',
    '../../loom/kit/card-stack.mjs',
  ];
  for (const [url, expected] of [
    [raw + 'shell-head' + route, submitted],
    [preview, local],
    ['http://localhost:8000/sketches/loom-kit/', local],
    ['https://raw.githack.com/other/pointcast/branch' + route, local],
    [raw + 'shell-head/public/other/', local],
  ]) {
    const { document } = openSketch(url);
    const loaded = [];
    await mountKit(document, path => {
      loaded.push(path);
      throw new TypeError('Missing');
    });
    assert.deepEqual(loaded.sort(), [...expected].sort());
  }
});

test('cached pages keep their demo; leaving cleans completed and pending mounts exactly once', async () => {
  const { document, content } = openSketch();
  const view = document.defaultView;
  const slowImport = Promise.withResolvers();
  const slowMount = Promise.withResolvers();
  const calls = [];
  const modules = {
    sound: slowImport.promise,
    motion: { mountDemo() { return () => calls.push('clean motion'); } },
    flame: { async mountDemo() { await slowMount.promise; return () => calls.push('clean flame'); } },
  };
  const mounting = mountKit(document, path => modules[path.split('/').at(-1).replace('.mjs', '')]);
  await new Promise(resolve => setImmediate(resolve));
  view.dispatchEvent(new view.PageTransitionEvent('pagehide', { persisted: true }));
  view.dispatchEvent(new view.PageTransitionEvent('pageshow', { persisted: true }));
  assert.equal(content('motion').hidden, false);
  assert.deepEqual(calls, []);

  view.dispatchEvent(new view.PageTransitionEvent('pagehide', { persisted: false }));
  assert.deepEqual(calls, ['clean motion']);
  slowImport.resolve({ mountDemo() { calls.push('mounted sound after leaving'); } });
  slowMount.resolve();
  await mounting;
  view.dispatchEvent(new view.PageTransitionEvent('pagehide', { persisted: false }));
  assert.deepEqual(calls, ['clean motion', 'clean flame']);
  assert.equal(content('sound').hidden, true);
  assert.equal(content('flame').hidden, true);
});
