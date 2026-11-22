import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountKit } from '../public/sketches/loom-kit/kit.mjs';

const html = readFileSync(new URL('../public/sketches/loom-kit/index.html', import.meta.url), 'utf8');
const cues = ['tap', 'send', 'receive', 'yes', 'undo', 'error', 'stack-cleared'];
const settled = () => new Promise(resolve => setImmediate(resolve));

test('sound starts quiet, unlocks on gestures and restores preferences without autoplay', async () => {
  const { window } = new JSDOM(html, { url: 'https://pointcast.xyz/sketches/loom-kit/' });
  const { document } = window;
  const calls = [];
  const preferences = { enabled: false, fireBed: false };
  let unlockReady = true;
  const module = {
    SOUND_NAMES: [...cues, 'fire-bed'],
    createLoomSound() {
      calls.push('create');
      return {
        get enabled() { return preferences.enabled; },
        get fireBed() { return preferences.fireBed; },
        setEnabled(value) { calls.push(['enable', value]); preferences.enabled = value; return Promise.resolve(value); },
        setFireBed(value) { calls.push(['bed', value]); preferences.fireBed = value; return Promise.resolve(value); },
        unlock() { calls.push('unlock'); return Promise.resolve(unlockReady); },
        play(cue) { calls.push(['play', cue]); },
        dispose() { calls.push('dispose'); },
      };
    },
  };
  let stackSound;
  let soundImports = 0;
  await mountKit(document, path => {
    if (path.endsWith('/sound.mjs')) { soundImports++; return module; }
    if (path.endsWith('/card-stack.mjs')) return { mountDemo(container, options) {
      stackSound = options.sound;
      container.addEventListener('click', () => { if (stackSound.enabled) stackSound.play('tap'); });
    } };
    throw new TypeError('Missing');
  });
  const slot = document.querySelector('[data-kit-slot="sound"]');
  const toggle = slot.querySelector('[data-sound-toggle]');
  const options = slot.querySelector('[data-sound-options]');
  const play = slot.querySelector('[data-sound-play]');
  const bed = slot.querySelector('[data-sound-bed]');
  const select = slot.querySelector('select');
  const feedback = slot.querySelector('[data-sound-feedback]');

  const stack = document.querySelector('[data-kit-slot="card-stack"] [data-kit-content]');
  assert.equal(stackSound.enabled, false);
  stack.click();
  assert.equal(soundImports, 1);
  assert.deepEqual(calls, ['create']);
  assert.equal(toggle.getAttribute('aria-checked'), 'false');
  assert.equal(options.hidden, true);
  assert.equal(feedback.hidden, true);
  toggle.click();
  assert.deepEqual(calls.at(-1), ['enable', true]);
  assert.equal(stackSound.enabled, true);
  stack.dispatchEvent(new window.Event('pointerup', { bubbles: true }));
  assert.equal(calls.at(-1), 'unlock');
  stack.click();
  assert.deepEqual(calls.at(-1), ['play', 'tap']);
  assert.equal(toggle.getAttribute('aria-checked'), 'true');
  assert.equal(options.hidden, false);
  assert.equal(select.labels[0].firstChild.textContent.trim(), 'Audio cue');
  assert.deepEqual([...select.options].map(option => option.value), cues);
  select.value = 'yes';
  play.click();
  assert.equal(calls.at(-1), 'unlock');
  await settled();
  assert.deepEqual(calls.at(-1), ['play', 'yes']);
  bed.click();
  assert.deepEqual(calls.at(-1), ['bed', true]);
  assert.equal(bed.getAttribute('aria-checked'), 'true');
  window.dispatchEvent(new window.PageTransitionEvent('pagehide', { persisted: true }));
  window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true }));
  assert.equal(calls.filter(call => call === 'create').length, 1);
  assert.ok(!calls.includes('dispose'));
  stack.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(calls.at(-1), 'unlock');
  assert.equal(toggle.getAttribute('aria-checked'), 'true');
  assert.equal(bed.getAttribute('aria-checked'), 'true');

  unlockReady = false;
  play.click();
  await settled();
  assert.equal(calls.at(-1), 'unlock');
  assert.equal(feedback.hidden, false);
  unlockReady = true;
  play.click();
  await settled();
  assert.deepEqual(calls.at(-1), ['play', 'yes']);
  assert.equal(feedback.hidden, true);
  toggle.click();
  assert.deepEqual(calls.at(-1), ['enable', false]);
  assert.equal(options.hidden, true);
  assert.equal(stackSound.enabled, false);
  stack.click();
  assert.deepEqual(calls.at(-1), ['enable', false]);
  window.dispatchEvent(new window.PageTransitionEvent('pagehide', { persisted: false }));
  window.dispatchEvent(new window.PageTransitionEvent('pagehide', { persisted: false }));
  toggle.click();
  assert.deepEqual(calls.filter(call => call === 'create' || call === 'dispose'), ['create', 'dispose']);
  assert.equal(calls.at(-1), 'dispose');
  window.close();
});

test('missing sound and a broken factory leave the stack and both visual demos usable', async () => {
  for (const failedImport of [true, false]) {
    const { window } = new JSDOM(html, { url: 'https://pointcast.xyz/sketches/loom-kit/' });
    const { document } = window;
    let imports = 0;
    let stackSound;
    await mountKit(document, path => {
      if (path.endsWith('/sound.mjs')) {
        imports++;
        if (failedImport) throw new TypeError('Missing');
        return { createLoomSound() { throw new Error('Unavailable'); } };
      }
      return { mountDemo(container, options) {
        if (options) stackSound = options.sound;
        container.textContent = 'Ready';
      } };
    });
    assert.equal(imports, 1);
    assert.equal(stackSound.enabled, false);
    assert.equal(stackSound.play('tap'), false);
    const soundStatus = document.querySelector('[data-kit-slot="sound"] [data-kit-status]');
    assert.equal(soundStatus.textContent.trim(), failedImport ? 'Demo couldn’t load.' : 'Demo couldn’t start.');
    for (const name of ['card-stack', 'motion', 'flame']) {
      const content = document.querySelector(`[data-kit-slot="${name}"] [data-kit-content]`);
      assert.equal(content.hidden, false);
      assert.equal(content.textContent, 'Ready');
    }
    window.close();
  }
});
