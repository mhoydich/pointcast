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
  await mountKit(document, path => {
    if (path.endsWith('/sound.mjs')) return module;
    throw new TypeError('Missing');
  });
  const slot = document.querySelector('[data-kit-slot="sound"]');
  const toggle = slot.querySelector('[data-sound-toggle]');
  const options = slot.querySelector('[data-sound-options]');
  const play = slot.querySelector('[data-sound-play]');
  const bed = slot.querySelector('[data-sound-bed]');
  const select = slot.querySelector('select');
  const feedback = slot.querySelector('[data-sound-feedback]');

  assert.deepEqual(calls, ['create']);
  assert.equal(toggle.getAttribute('aria-checked'), 'false');
  assert.equal(options.hidden, true);
  assert.equal(feedback.hidden, true);
  toggle.click();
  assert.deepEqual(calls.at(-1), ['enable', true]);
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
  assert.deepEqual(calls.slice(-2), ['dispose', 'create']);
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
  window.close();
});
