import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountPelicanPost } from '../src/lib/ten-doors/pelican-post.mjs';

const COUNT_KEY = 'pelican-post:count';

// Exercise the production controller against the actual room markup, not a
// second hand-written version of its controls. Astro's wrapper is irrelevant
// to this island; its frontmatter, styles and entry script do not run here.
function setup(t, options = {}) {
  const markup = readFileSync(new URL('../src/pages/pelican-post.astro', import.meta.url), 'utf8')
    .replace(/^---[\s\S]*?---/, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/pelican-post/', pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  const root = document.querySelector('[data-pelican-post]');
  assert.ok(root, 'the production room exposes its mount root');

  let now = 0;
  let nextFrame = 0;
  const frames = new Map();
  window.requestAnimationFrame = (callback) => { frames.set(++nextFrame, callback); return nextFrame; };
  window.cancelAnimationFrame = (id) => frames.delete(id);
  Object.defineProperty(window.performance, 'now', { value: () => now });
  const media = new window.EventTarget();
  media.matches = Boolean(options.reducedMotion);
  media.media = '(prefers-reduced-motion: reduce)';
  window.matchMedia = () => media;

  // Drawing is incidental to the interaction. Null covers unsupported canvas;
  // a small drawing stub also lets the timing test run the animated path.
  const drawing = new Proxy({}, {
    get(target, name) {
      if (name in target) return target[name];
      if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
  });
  window.HTMLCanvasElement.prototype.getContext = () => options.canvas === false ? null : drawing;

  if (options.stored !== undefined) window.localStorage.setItem(COUNT_KEY, options.stored);
  if (options.blockStorage) {
    Object.defineProperty(window, 'localStorage', { get() { throw new window.DOMException('Storage blocked', 'SecurityError'); } });
  }
  const audio = { created: 0, closed: 0, started: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  window.AudioContext = class {
    constructor() {
      if (options.brokenAudio) throw new Error('Audio unavailable');
      audio.created += 1;
      this.currentTime = 0;
      this.state = 'running';
      this.destination = {};
    }
    createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
    createOscillator() { return { frequency: param(), detune: param(), connect() {}, disconnect() {}, start() { audio.started += 1; }, stop() {} }; }
    resume() { return Promise.resolve(); }
    close() { this.state = 'closed'; audio.closed += 1; return Promise.resolve(); }
  };
  const cleanup = mountPelicanPost(root);
  assert.equal(typeof cleanup, 'function');
  t.after(() => { cleanup(); window.close(); });

  const get = (id) => {
    const element = root.querySelector(`#pp-${id}`);
    assert.ok(element, `production #pp-${id} exists`);
    return element;
  };
  return {
    window, document, root, get, frames, audio, cleanup,
    type(value) {
      get('text').value = value;
      get('text').dispatchEvent(new window.Event('input', { bubbles: true }));
    },
    submit() { get('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); },
    click(id) { get(id).click(); },
    storedCount() { return JSON.parse(window.localStorage.getItem(COUNT_KEY) || '0'); },
    frame(time) {
      now = time;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(time));
    },
    reduceMotion(value) {
      media.matches = value;
      const event = new window.Event('change');
      Object.defineProperty(event, 'matches', { value });
      media.dispatchEvent(event);
    },
  };
}

test('empty and whitespace-only postcards cannot start a journey', (t) => {
  const room = setup(t);
  assert.equal(room.root.dataset.state, 'composing');
  assert.equal(room.get('send').disabled, true);
  room.type(' \n\t ');
  assert.equal(room.get('send').disabled, true);
  room.submit();
  assert.equal(room.root.dataset.state, 'composing');
  assert.equal(room.storedCount(), 0);
  assert.equal(room.audio.created, 0, 'the room starts silently');
});

test('sending clears the words immediately and gives keyboard users a complete repeat path', (t) => {
  const room = setup(t);
  const words = 'A private test postcard that must not survive dispatch.';
  room.type(words);
  assert.equal(room.get('send').disabled, false);
  room.submit();
  assert.equal(room.root.dataset.state, 'flying');
  assert.equal(room.get('text').value, '');
  assert.equal(room.get('form').hidden, true);
  assert.equal(room.get('journey').hidden, false);
  assert.equal(room.document.activeElement, room.get('skip'));
  assert.equal(room.root.textContent.includes(words), false);
  assert.equal(room.storedCount(), 0, 'dispatch has not yet completed');

  room.click('skip');
  assert.equal(room.root.dataset.state, 'released');
  assert.equal(room.get('journey').hidden, true);
  assert.equal(room.get('complete').hidden, false);
  assert.equal(room.document.activeElement, room.get('again'));
  assert.equal(room.storedCount(), 1);
  assert.ok(room.get('status').textContent.trim(), 'completion has a text equivalent');
  assert.equal(room.audio.created, 0, 'a silent send does not create audio');
  for (let i = 0; i < room.window.localStorage.length; i += 1) {
    assert.equal(room.window.localStorage.getItem(room.window.localStorage.key(i)).includes(words), false);
  }

  room.click('again');
  assert.equal(room.root.dataset.state, 'composing');
  assert.equal(room.get('form').hidden, false);
  assert.equal(room.get('complete').hidden, true);
  assert.equal(room.document.activeElement, room.get('text'));
  assert.equal(room.get('send').disabled, true);
});

test('rapid repeated submissions and completion clicks count one card per journey', (t) => {
  const room = setup(t);
  room.type('First card');
  room.submit();
  room.submit();
  room.click('skip');
  room.click('skip');
  room.submit();
  room.frame(10000);
  assert.equal(room.storedCount(), 1);
  assert.equal(room.root.dataset.state, 'released');

  room.click('again');
  room.type('Second card');
  room.submit();
  room.click('skip');
  assert.equal(room.storedCount(), 2);
  assert.equal(room.audio.created, 0);
});

test('reduced motion releases immediately with no animation frames left running', (t) => {
  const room = setup(t, { reducedMotion: true });
  assert.equal(room.frames.size, 0, 'the resting bay is static');
  room.type('Quiet release');
  room.submit();
  assert.equal(room.root.dataset.state, 'released');
  assert.equal(room.get('text').value, '');
  assert.equal(room.storedCount(), 1);
  assert.equal(room.document.activeElement, room.get('again'));
  assert.equal(room.frames.size, 0);
});

test('turning reduced motion on during a flight finishes once and cancels its animation', (t) => {
  const room = setup(t);
  room.type('Change the setting while this flies');
  room.submit();
  room.frame(500);
  room.reduceMotion(true);
  assert.equal(room.root.dataset.state, 'released');
  assert.equal(room.storedCount(), 1);
  assert.equal(room.frames.size, 0);
  room.reduceMotion(true);
  room.frame(10000);
  assert.equal(room.storedCount(), 1);
});

test('journey completion follows elapsed time at both ordinary and high frame rates', (t) => {
  for (const interval of [1000 / 60, 1000 / 120]) {
    const room = setup(t);
    room.type('The same length of journey on either display');
    room.submit();
    for (let time = 0; time < 4000; time += interval) room.frame(time);
    assert.equal(room.root.dataset.state, 'flying', `still flying at 4s with ${interval}ms frames`);
    room.frame(4300);
    assert.equal(room.root.dataset.state, 'released');
    assert.equal(room.storedCount(), 1);
    assert.equal(room.frames.size, 0, 'drawing stops after the journey');
  }
});

test('malformed saved counts are repaired, and storage or canvas failure does not block release', (t) => {
  for (const stored of ['garbage', 'null', '"12"', '{}', '-3', '1.5', '9007199254740992']) {
    const room = setup(t, { stored, reducedMotion: true, canvas: false });
    room.type('Start from a valid count');
    room.submit();
    assert.equal(room.root.dataset.state, 'released');
    assert.equal(room.storedCount(), 1, `invalid saved count ${stored}`);
  }
  const blocked = setup(t, { blockStorage: true, canvas: false, reducedMotion: true });
  blocked.type('Private browsing still works');
  blocked.submit();
  assert.equal(blocked.root.dataset.state, 'released');
  assert.equal(blocked.get('text').value, '');
  blocked.click('again');
  assert.equal(blocked.root.dataset.state, 'composing');
});

test('cleanup scrubs unfinished words, cancels a flight, and removes event handlers', (t) => {
  const composing = setup(t);
  composing.type('An unfinished private draft');
  composing.cleanup();
  assert.equal(composing.get('text').value, '');

  const flying = setup(t);
  flying.type('A flight abandoned by navigation');
  flying.submit();
  assert.ok(flying.frames.size > 0);
  flying.cleanup();
  assert.equal(flying.frames.size, 0);
  flying.click('skip');
  flying.frame(10000);
  assert.equal(flying.storedCount(), 0, 'leaving cannot complete the abandoned journey later');
  assert.equal(flying.get('text').value, '');
});

test('sound needs explicit opt-in, closes on cleanup, and unavailable audio keeps the ritual usable', (t) => {
  const room = setup(t);
  assert.equal(room.audio.created, 0);
  room.click('sound');
  room.type('An audible journey');
  room.submit();
  assert.ok(room.audio.created > 0);
  assert.ok(room.audio.started > 0);
  room.cleanup();
  assert.ok(room.audio.closed > 0, 'leaving stops this room’s audio');

  const unavailable = setup(t, { brokenAudio: true, reducedMotion: true });
  unavailable.click('sound');
  unavailable.type('A quiet fallback');
  unavailable.submit();
  assert.equal(unavailable.root.dataset.state, 'released');
  assert.equal(unavailable.storedCount(), 1);
});

test('remounting after browser Back restores an empty postcard and truthful sound controls', (t) => {
  const room = setup(t);
  room.click('sound');
  room.type('An unfinished draft before leaving');
  room.cleanup();
  const cleanup = mountPelicanPost(room.root);
  assert.equal(room.get('text').value, '');
  assert.equal(room.root.dataset.state, 'composing');
  assert.equal(room.get('sound').textContent, 'Sound off');
  assert.equal(room.get('sound').getAttribute('aria-pressed'), 'false');
  room.click('sound');
  assert.equal(room.get('sound').textContent, 'Sound on');
  assert.equal(room.get('sound').getAttribute('aria-pressed'), 'true');
  cleanup();
});
