const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../../public/pointcast-effects/v0.1.0/pointcast-effects.js'), 'utf8');
class Target {
  constructor() { this.listeners = {}; }
  addEventListener(name, fn) { (this.listeners[name] ||= new Set()).add(fn); }
  removeEventListener(name, fn) { this.listeners[name]?.delete(fn); }
  emit(name, event = {}) { for (const fn of [...(this.listeners[name] || [])]) fn({ type: name, ...event }); }
}
function fixture(timers = { setTimeout, clearTimeout }) {
  const win = new Target(), doc = new Target(); doc.defaultView = win; doc.visibilityState = 'visible'; win.document = doc;
  vm.runInNewContext(source, { window: win, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout, Promise, Set });
  return { api: win.PointCastEffects, win, doc };
}
function param() { return { value: 0, calls: [], setValueAtTime(v, t) { this.value = v; this.calls.push(['set', v, t]); }, setTargetAtTime(v, t, c) { this.value = v; this.calls.push(['target', v, t, c]); }, cancelScheduledValues() {}, linearRampToValueAtTime(v, t) { this.calls.push(['ramp', v, t]); }, exponentialRampToValueAtTime() {} }; }
function context(resume) {
  const oscillators = [], gains = [];
  const node = () => ({ connect() {}, disconnect() { this.disconnected = true; } });
  const ctx = { state: 'suspended', currentTime: 0, destination: {}, oscillators, gains,
    createGain() { const g = { ...node(), gain: param() }; gains.push(g); return g; },
    createDynamicsCompressor() { return { ...node(), threshold: {}, knee: {}, ratio: {}, attack: {}, release: {} }; },
    createOscillator() { const o = Object.assign(new Target(), node(), { frequency: param(), start() {}, stop() { this.stops = (this.stops || 0) + 1; } }); oscillators.push(o); return o; },
    resume() { return resume ? resume(ctx) : (ctx.state = 'running', Promise.resolve()); },
    close() { ctx.state = 'closed'; return Promise.resolve(); }
  }; return ctx;
}
test('consent, mute, bounds, background and disposal', async () => {
  const { api, doc, win } = fixture(); let calls = 0; const ctx = context();
  const audio = api.createAudio({ document: doc, contextFactory: () => (calls++, ctx) });
  assert.equal(calls, 0); assert.equal(audio.ring('bell'), false);
  assert.equal(await audio.enable(), true); assert.equal(calls, 1);
  for (let i = 0; i < 4; i++) assert.equal(audio.ring('bell'), true);
  assert.equal(ctx.oscillators.length, 12); assert.ok(ctx.oscillators.slice(0, 3).every(o => o.stops === 2));
  audio.mute(); assert.equal(audio.ring('bowl'), false); audio.setMuted(false);
  doc.visibilityState = 'hidden'; doc.emit('visibilitychange'); assert.equal(ctx.state, 'closed'); assert.equal(audio.ring('gong'), false);
  win.emit('pagehide'); assert.equal(await audio.enable(), false);
});
test('late resume cannot revive a stopped session', async () => {
  const { api, doc } = fixture(); let resume; const ctx = context(c => new Promise(r => { resume = () => { c.state = 'running'; r(); }; }));
  const audio = api.createAudio({ document: doc, contextFactory: () => ctx });
  const pending = audio.enable(); audio.stop(); assert.equal(await pending, false); resume(); await Promise.resolve();
  assert.equal(audio.ring('chime'), false); audio.dispose();
});
test('ripple origins, cap, reduced motion and cleanup', () => {
  const { api } = fixture(); let reduced = false; const points = [], surface = new Target();
  surface.children = []; surface.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 60 });
  surface.appendChild = n => surface.children.push(n);
  surface.ownerDocument = { createElement() { const n = new Target(); n.style = {}; n.setAttribute = () => {}; n.remove = () => { surface.children = surface.children.filter(x => x !== n); }; return n; } };
  const ripple = api.createRipple(surface, { reducedMotion: () => reduced, onRipple: p => points.push([p.x, p.y]) });
  surface.emit('pointerdown', { clientX: 30, clientY: 50, button: 0 }); surface.emit('keydown', { key: 'Enter' });
  assert.deepEqual(points, [[20, 30], [50, 30]]);
  ripple.trigger(); ripple.trigger(); assert.equal(surface.children.length, 3);
  const n = surface.children[0]; n.emit('animationend', { target: n }); assert.equal(surface.children.length, 2);
  reduced = true; ripple.trigger(); assert.equal(surface.children.length, 0);
  ripple.dispose(); assert.equal(surface.children.length, 0); assert.equal(ripple.trigger(), false);
});

test('failed graph construction closes context', async () => {
  const { api, doc } = fixture(); const ctx = context();
  ctx.createGain = () => { throw new Error('allocation failure'); };
  const audio = api.createAudio({ document: doc, contextFactory: () => ctx });
  assert.equal(await audio.enable(), false); assert.equal(ctx.state, 'closed'); audio.dispose();
});
test('background cancellation never resumes and pagehide permits a later gesture', async () => {
  const { api, doc, win } = fixture(); let resolve; let calls = 0;
  const first = context(c => new Promise(r => { resolve = () => { c.state = 'running'; r(); }; }));
  const second = context(); const audio = api.createAudio({ document: doc, contextFactory: () => (++calls === 1 ? first : second) });
  const pending = audio.enable(); doc.visibilityState = 'hidden'; doc.emit('visibilitychange');
  assert.equal(await pending, false); resolve(); await Promise.resolve();
  doc.visibilityState = 'visible'; doc.emit('visibilitychange'); assert.equal(calls, 1); assert.equal(audio.ring('bell'), false);
  assert.equal(await audio.enable(), true); win.emit('pagehide'); assert.equal(second.state, 'closed');
  assert.equal(calls, 2); audio.dispose();
});
test('interruption clears the graph and reports an error', async () => {
  const { api, doc } = fixture(); const ctx = context(); Object.setPrototypeOf(ctx, Target.prototype); ctx.listeners = {}; const states = [];
  const audio = api.createAudio({ document: doc, contextFactory: () => ctx, onState: s => states.push(s.status) });
  await audio.enable(); audio.ring('gong'); ctx.state = 'interrupted'; ctx.emit('statechange');
  assert.equal(ctx.state, 'closed'); assert.equal(audio.ring('gong'), false); assert.equal(states.at(-1), 'error'); audio.dispose();
});
test('system reduced motion is respected without a custom callback', () => {
  const { api } = fixture(); const surface = new Target(); let created = 0;
  surface.ownerDocument = { defaultView: { matchMedia: () => ({ matches: true }) }, createElement: () => { created++; } };
  surface.getBoundingClientRect = () => ({ left: 0, top: 0, width: 10, height: 10 });
  const ripple = api.createRipple(surface); assert.equal(ripple.trigger(), true); assert.equal(created, 0); ripple.dispose();
});

function fakeTimers() {
  let id = 0; const tasks = new Map();
  return { tasks, setTimeout(fn, ms) { tasks.set(++id, {fn, ms}); return id; }, clearTimeout(n) { tasks.delete(n); }, run(ms) { for (const [key, task] of [...tasks]) if (task.ms === ms) { tasks.delete(key); task.fn(); } } };
}
test('mute fades before teardown, rapid unmute cannot revive old voices', async () => {
  const timers = fakeTimers(), { api, doc } = fixture(timers), ctx = context();
  const audio = api.createAudio({ document: doc, contextFactory: () => ctx });
  await audio.enable(); audio.ring('bell'); audio.mute();
  assert.deepEqual(ctx.gains[0].gain.calls.at(-1), ['ramp', 0, .03]);
  assert.equal(ctx.oscillators[0].stops, 1); assert.equal(ctx.gains[1].disconnected, undefined);
  audio.setMuted(false); assert.equal(audio.ring('bowl'), false);
  timers.run(40); assert.equal(ctx.oscillators[0].stops, 2); assert.equal(ctx.gains[1].disconnected, true);
  assert.equal(audio.ring('bowl'), true); audio.dispose(); assert.equal(timers.tasks.size, 0);
});
test('stop fades and retires only old session; background flushes immediately', async () => {
  const timers = fakeTimers(), { api, doc } = fixture(timers), first = context(), second = context(); let count = 0;
  const audio = api.createAudio({ document: doc, contextFactory: () => count++ ? second : first });
  await audio.enable(); audio.ring('gong'); audio.stop();
  assert.equal(first.state, 'running'); assert.deepEqual(first.gains[0].gain.calls.at(-1), ['ramp', 0, .03]);
  await audio.enable(); assert.equal(first.state, 'closed'); audio.ring('bell');
  timers.run(40); assert.equal(second.state, 'running');
  audio.stop(); assert.equal(second.state, 'running'); doc.visibilityState = 'hidden'; doc.emit('visibilitychange');
  assert.equal(second.state, 'closed'); assert.equal(timers.tasks.size, 0); audio.dispose();
});
test('ripple clamps pointer and prevents space scrolling', () => {
  const { api } = fixture(); const surface = new Target(), points = []; let prevented = false;
  surface.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 60 });
  surface.ownerDocument = {}; const ripple = api.createRipple(surface, { reducedMotion: () => true, onRipple: p => points.push([p.x, p.y]) });
  surface.emit('pointerdown', { button: 0, clientX: -50, clientY: 500 });
  surface.emit('keydown', { key: ' ', preventDefault() { prevented = true; } });
  assert.deepEqual(points, [[0, 60], [50, 30]]); assert.equal(prevented, true); ripple.dispose();
});
