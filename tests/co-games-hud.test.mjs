import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { nounRoster } from '../src/lib/co-games-roster.ts';

const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/lib/co-games-hud.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022',
});
const { mountCoGamesHud } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const page = readFileSync(new URL('../src/pages/co-games.astro', import.meta.url), 'utf8');
const markup = page.match(/<article class="co-games-page">[\s\S]*?<\/article>/)[0];
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture(t) {
  t.mock.method(Math, 'random', () => 0);
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games', pretendToBeVisual: true });
  const win = dom.window;
  const motion = new win.EventTarget();
  motion.matches = true;
  motion.media = '(prefers-reduced-motion: reduce)';
  win.matchMedia = () => motion;
  // JSDOM has dialog elements but does not implement their browser methods.
  win.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  win.HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new win.Event('close'));
  };
  const root = win.document.getElementById('pointcast-co-games');
  let unmount = mountCoGamesHud(root), mounted = true;
  const cleanup = () => { if (mounted) { mounted = false; unmount(); } };
  const remount = () => { cleanup(); unmount = mountCoGamesHud(root); mounted = true; };
  t.after(() => { cleanup(); win.close(); });
  const q = selector => root.querySelector(selector);
  const crew = () => Array.from({ length: 4 }, (_, slot) => {
    const source = new URL(q(`[data-noun-slot="${slot}"]`).src).pathname;
    const noun = nounRoster.find(item => item.src === source);
    assert.ok(noun, `slot ${slot} uses a real roster asset`);
    return noun.id;
  });
  const match = retry => root.dispatchEvent(new win.CustomEvent('co-games:match', { detail: { retry } }));
  return { dom, win, root, q, crew, match, cleanup, remount };
}

test('the board has four unique Nouns and both buddy portraits and rival labels agree', t => {
  const f = fixture(t);
  assert.equal(new Set(f.crew()).size, 4);
  assert.equal(f.root.querySelectorAll('[data-noun-choice]').length, nounRoster.length);
  const buddies = [...f.root.querySelectorAll('[data-noun-slot="1"]')];
  assert.ok(buddies.length > 1, 'scene and support panel both show the buddy');
  assert.ok(buddies.every(image => image.src === buddies[0].src));
  for (const slot of [2, 3]) {
    const noun = nounRoster.find(item => item.id === f.crew()[slot]);
    assert.equal(f.q(`[data-noun-name="${slot}"]`).textContent, noun.name);
  }
  assert.equal(f.root.querySelectorAll('[data-noun-choice][aria-pressed="true"]').length, 1);
  assert.equal(f.q('[data-noun-choice][aria-pressed="true"]').dataset.nounChoice, f.crew()[0]);
});

test('choosing a rival swaps it with the hero without duplicates and pins that hero for the next match', t => {
  const f = fixture(t);
  const before = f.crew();
  f.q('[data-dialog="cg-roster"]').click();
  assert.equal(f.q('#cg-roster').open, true);
  f.q(`[data-noun-choice="${before[2]}"]`).click();
  const selected = f.crew();
  assert.deepEqual(selected, [before[2], before[1], before[0], before[3]]);
  assert.equal(new Set(selected).size, 4);
  assert.equal(f.q('#cg-roster').open, false);
  assert.equal(f.win.document.activeElement, f.q('[data-dialog="cg-roster"]'));
  f.match(false);
  const next = f.crew();
  assert.equal(next[0], selected[0], 'the chosen hero remains selected');
  assert.equal(new Set(next).size, 4);
  for (const slot of [1, 2, 3]) assert.notEqual(next[slot], selected[slot], `slot ${slot} gets a fresh Noun`);
  const hero = nounRoster.find(item => item.id === next[0]);
  assert.match(f.q('.cg-you').getAttribute('aria-label'), new RegExp(hero.name));
});

test('shuffle replaces every slot and clears the pinned hero for subsequent matches', t => {
  const f = fixture(t);
  f.q(`[data-noun-choice="${f.crew()[3]}"]`).click();
  const pinned = f.crew();
  f.q('[data-shuffle-nouns]').click();
  const shuffled = f.crew();
  assert.equal(new Set(shuffled).size, 4);
  for (let slot = 0; slot < 4; slot++) assert.notEqual(shuffled[slot], pinned[slot]);
  f.match(false);
  const following = f.crew();
  assert.notEqual(following[0], shuffled[0], 'shuffle does not leave the new hero pinned');
  assert.equal(new Set(following).size, 4);
});

test('retry retains the same crew and clears the previous turn animation', t => {
  const f = fixture(t);
  const original = f.crew();
  f.root.dispatchEvent(new f.win.CustomEvent('co-games:turn', { detail: {
    human: 'ember', support: 'echo', damage: 6, taken: 2, healing: 0,
    combo: { name: 'Fireworks', description: 'Ember + Echo adds 2 damage.' },
  } }));
  assert.equal(f.root.classList.contains('cg-animating'), true);
  assert.equal(f.q('[data-damage-rift]').textContent, '−6');
  assert.equal(f.q('[data-combo-name]').textContent, 'Fireworks');
  f.match(true);
  assert.deepEqual(f.crew(), original);
  assert.equal(f.root.classList.contains('cg-animating'), false);
  assert.equal(f.root.dataset.human, undefined);
  assert.equal(f.root.dataset.support, undefined);
  assert.equal(f.root.dataset.combo, undefined);
});

test('busy state prevents roster edits immediately and disables all roster controls', async t => {
  const f = fixture(t);
  const original = f.crew();
  f.root.dataset.busy = 'true';
  // Guard the interval before the MutationObserver has disabled the controls.
  f.q(`[data-noun-choice="${original[2]}"]`).click();
  f.q('[data-shuffle-nouns]').click();
  assert.deepEqual(f.crew(), original);
  await tick();
  const controls = [...f.root.querySelectorAll('[data-dialog="cg-roster"],[data-shuffle-nouns],[data-noun-choice]')];
  assert.ok(controls.every(button => button.disabled));
  f.q('[data-dialog="cg-roster"]').click();
  assert.equal(f.q('#cg-roster').open, false);
  f.root.dataset.busy = 'false'; await tick();
  assert.ok(controls.every(button => !button.disabled));
  f.q(`[data-noun-choice="${original[2]}"]`).click();
  assert.equal(f.crew()[0], original[2]);
});

test('rival health uses the active maximum and armor appears and disappears independently', async t => {
  const f = fixture(t);
  const fill = f.q('[data-rift-fill]');
  assert.equal(fill.style.width, '100%');
  f.q('[data-enemy-max]').textContent = '22';
  f.q('[data-enemy]').textContent = '11';
  f.q('[data-current-armor]').textContent = '2';
  await tick();
  assert.equal(fill.style.width, '50%');
  assert.equal(f.q('[data-armor-indicator]').hidden, false);
  assert.equal(f.root.dataset.armor, 'active');
  f.q('[data-enemy-max]').textContent = '20'; await tick();
  assert.ok(Math.abs(Number.parseFloat(fill.style.width) - 55) < 0.000001);
  f.q('[data-current-armor]').textContent = '0'; await tick();
  assert.equal(f.q('[data-armor-indicator]').hidden, true);
  assert.equal(f.root.dataset.armor, 'none');
  f.q('[data-enemy]').textContent = '30'; await tick();
  assert.equal(fill.style.width, '100%', 'health fill is bounded above');
  f.q('[data-enemy]').textContent = '-1'; await tick();
  assert.equal(fill.style.width, '0%', 'health fill is bounded below');
});

test('cleanup disconnects observers and input handlers, and remount produces one roster and one dialog action', async t => {
  const f = fixture(t);
  f.q('[data-dialog="cg-roster"]').click();
  f.cleanup();
  assert.equal(f.q('#cg-roster').open, false);
  assert.equal(f.root.querySelectorAll('[data-noun-choice]').length, 0);
  const crew = f.crew(), width = f.q('[data-rift-fill]').style.width;
  f.q('[data-shuffle-nouns]').click();
  f.q('[data-dialog="cg-roster"]').click();
  f.q('[data-enemy]').textContent = '9';
  f.root.dataset.busy = 'true';
  await tick();
  assert.deepEqual(f.crew(), crew);
  assert.equal(f.q('#cg-roster').open, false);
  assert.equal(f.q('[data-rift-fill]').style.width, width);
  f.root.dataset.busy = 'false';
  f.remount();
  assert.equal(f.root.querySelectorAll('[data-noun-choice]').length, nounRoster.length);
  assert.equal(new Set([...f.root.querySelectorAll('[data-noun-choice]')].map(button => button.dataset.nounChoice)).size, nounRoster.length);
  assert.equal(f.q('[data-rift-fill]').style.width, '50%');
  const dialog = f.q('#cg-roster');
  const open = t.mock.method(dialog, 'showModal', function () { this.open = true; });
  f.q('[data-dialog="cg-roster"]').click();
  assert.equal(open.mock.callCount(), 1);
  dialog.close();
  const before = f.crew();
  f.q('[data-shuffle-nouns]').click();
  assert.equal(new Set(f.crew()).size, 4);
  for (let slot = 0; slot < 4; slot++) assert.notEqual(f.crew()[slot], before[slot]);
});
