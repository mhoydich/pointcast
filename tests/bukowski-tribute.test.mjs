import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import ts from 'typescript';

const page = readFileSync(new URL('../src/pages/bukowski.astro', import.meta.url), 'utf8');
const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];
const compiled = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
function mount({ reduced = false, storageDenied = false, preference = null } = {}) {
  const dom = new JSDOM('<html data-motion="off"><body><button id="motion-toggle" aria-pressed="false" hidden>Motion off</button><a data-chapter-link="room"></a><a data-chapter-link="street"></a><section id="room" data-chapter></section><section id="street" data-chapter></section><span id="story-progress"></span></body></html>', { url: 'https://pointcast.xyz/bukowski/', runScripts: 'outside-only' });
  const { window } = dom;
  const changes = [];
  const media = { matches: reduced, addEventListener: (name, fn) => changes.push(fn) };
  window.matchMedia = () => media;
  if (preference) window.localStorage.setItem('pointcast-bukowski-motion', preference);
  if (storageDenied) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } });
  let observe;
  window.IntersectionObserver = class { constructor(fn) { observe = fn; } observe() {} };
  window.eval(compiled);
  return { window, document: window.document, media, changes, intersect: id => observe([{ isIntersecting: true, target: window.document.getElementById(id) }]) };
}
test('keyboard-equivalent control turns finite chapter motion off and retains preference', () => {
  const state = mount();
  const button = state.document.getElementById('motion-toggle');
  assert.equal(button.hidden, false);
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  button.click();
  assert.equal(state.document.documentElement.dataset.motion, 'off');
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  assert.equal(state.window.localStorage.getItem('pointcast-bukowski-motion'), 'off');
  assert.equal(mount({ preference: 'off' }).document.documentElement.dataset.motion, 'off');
});
test('OS reduced motion is honored initially and when changed during reading', () => {
  const reduced = mount({ reduced: true });
  const button = reduced.document.getElementById('motion-toggle');
  assert.equal(reduced.document.documentElement.dataset.motion, 'off');
  assert.equal(button.disabled, true);
  assert.equal(button.textContent, 'Reduced motion');
  const live = mount();
  live.media.matches = true;
  live.changes.forEach(fn => fn());
  assert.equal(live.document.documentElement.dataset.motion, 'off');
  assert.equal(live.document.getElementById('motion-toggle').disabled, true);
});
test('denied storage preserves a working pause control', () => {
  const state = mount({ storageDenied: true });
  state.document.getElementById('motion-toggle').click();
  assert.equal(state.document.documentElement.dataset.motion, 'off');
});
test('scroll progress identifies the visible chapter without hiding or replacing its text', () => {
  const state = mount();
  state.intersect('room');
  assert.equal(state.document.querySelector('[data-chapter-link="room"]').getAttribute('aria-current'), 'location');
  state.intersect('street');
  assert.equal(state.document.querySelector('[data-chapter-link="room"]').hasAttribute('aria-current'), false);
  assert.equal(state.document.querySelector('[data-chapter-link="street"]').getAttribute('aria-current'), 'location');
  assert.equal(state.document.getElementById('story-progress').style.width, '100%');
  assert.equal(state.document.getElementById('street').classList.contains('arrived'), true);
});
test('static reading begins still and animation contains no hidden text, flashes, or infinite cycles', () => {
  assert.match(page, /<html lang="en" data-motion="off">/);
  assert.match(page, /prefers-reduced-motion:reduce/);
  assert.match(page, /href="\/bukowski.txt"/);
  const css = page.split('<style is:global>')[1];
  assert.doesNotMatch(css, /opacity:\s*0|visibility:\s*hidden|infinite/);
  assert.doesNotMatch(page, /<audio|<video|autoplay/);
});
