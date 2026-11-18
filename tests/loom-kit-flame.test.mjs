import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { mountFlame, mountDemo } from '../public/loom/kit/flame.mjs';

function fixture(reduced = false) {
  let time = 0;
  const timers = new Map();
  const frames = [];
  const particles = [];
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const ctx = { setTransform() { frames.push(time); }, fillRect(x, y, w) { if (w === 2.5) particles.push(x); } };
  for (const name of ['clearRect','save','restore','translate','scale','beginPath','moveTo','bezierCurveTo','fill']) ctx[name] = () => {};
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const win = {
    performance: { now: () => time }, matchMedia: () => media,
    setTimeout(fn, delay) { const id = Symbol(); timers.set(id, { fn, at: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const node = () => ({
    ownerDocument: doc, children: [], style: {}, dataset: {},
    append(n) { this.children.push(n); }, remove: mock.fn(), setAttribute() {}, getContext: () => ctx,
  });
  Object.assign(doc, { createElement: node, defaultView: win });
  function advance(ms) {
    const end = time + ms;
    for (;;) {
      const first = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!first || first[1].at > end) break;
      timers.delete(first[0]); time = first[1].at; first[1].fn();
    }
    time = end;
  }
  return { mount: node(), advance, frames, particles, doc };
}

test('600ms action returns to the previous resting state; an intervening action wins', () => {
  const { mount, advance } = fixture();
  const f = mountFlame(mount, 'bright');
  const state = () => mount.children[0].dataset.state;
  f.spark(); advance(599); assert.equal(state(), 'spark');
  advance(1); assert.equal(state(), 'bright');
  f.spark(); advance(350); f.spark(); advance(599); assert.equal(state(), 'spark');
  advance(1); assert.equal(state(), 'bright');
  f.spark(); f.setState('steady'); advance(600); assert.equal(state(), 'steady');
  f.setAvailable(false); f.spark(); assert.equal(state(), 'embers');
  assert.equal(mount.children[0].children[1].children[1].textContent, 'Board unavailable');
  f.setState('bright'); f.setAvailable(true); assert.equal(state(), 'bright');
});

test('frame cap, hidden-tab pause and cleanup', () => {
  const { mount, advance, frames, doc } = fixture();
  const f = mountFlame(mount);
  advance(900);
  assert.ok(frames.length > 15 && frames.every((t, i) => i === 0 || t - frames[i-1] >= 1000 / 30));
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  const before = frames.length;
  f.spark(); advance(1000); assert.equal(frames.length, before);
  assert.equal(mount.children[0].dataset.state, 'steady');
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange')); advance(100);
  assert.ok(frames.length > before);
  f.destroy(); const last = frames.length; advance(900); assert.equal(frames.length, last);
});

test('reduced motion fades then stops painting, emits no particles, and honors variant empty labels', () => {
  const { mount, advance, frames, particles } = fixture(true);
  const f = mountFlame(mount, 'embers', { emptyLabel: 'The hearth is quiet' });
  assert.equal(mount.children[0].children[1].children[1].textContent, 'The hearth is quiet');
  advance(300); assert.deepEqual(frames, [0]);
  f.spark(); advance(200); const last = frames.length; advance(360);
  assert.ok(last > 1); assert.equal(frames.length, last); assert.deepEqual(particles, []);
});

test('the reduced-motion fade settles at its deadline without exceeding the paint cap', () => {
  const { mount, advance, frames } = fixture(true);
  const f = mountFlame(mount);
  advance(13); f.setState('bright');
  advance(149); assert.ok(frames.at(-1) < 163);
  advance(1); assert.equal(frames.at(-1), 163);
  advance(100); assert.equal(frames.at(-1), 163);
  assert.ok(frames.slice(1).every((t, i) => t - frames[i] >= 1000 / 30));
});

test('demo exposes all four controls and disposes the flame', () => {
  const { mount } = fixture();
  const unmount = mountDemo(mount);
  const [panel, bar] = mount.children[0].children;
  const buttons = bar.children;
  assert.deepEqual(buttons.map(b => b.textContent), ['Embers', 'Steady', 'Bright', 'Spark']);
  for (const b of buttons) { b.onclick(); assert.equal(panel.dataset.state, b.textContent.toLowerCase()); }
  unmount(); assert.equal(panel.remove.mock.callCount(), 1);
});
