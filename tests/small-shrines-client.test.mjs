import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { SHRINES } from '../src/data/small-shrines.ts';

const page = await readFile(new URL('../src/pages/small-shrines.astro', import.meta.url), 'utf8');
const controls = page.match(/<section class="ss-practice"[\s\S]*?<\/section>/)?.[0];
assert.ok(controls, 'use the real page controls, including initial disabled state and labels');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const markup = `<div id="small-shrines"><nav>${SHRINES.map(room => `<a href="#${room.id}" data-door="${room.id}">${room.title}</a>`).join('')}</nav>${SHRINES.map(room => `<section data-room="${room.id}" id="${room.id}"><h2 id="${room.id}-title" tabindex="-1">${room.title}</h2><div class="ss-cue"><span class="ss-phase">${escape(room.phases[0].label)}</span><p>${escape(room.phases[0].text)}</p></div></section>`).join('')}${controls}</div>`;

// Exercise the real bundled client with its real content and controls. The spy
// substitutes only the sound engine: its Web Audio resources and delayed-start
// behavior are covered by small-shrines-audio.test.mjs, without actual speakers.
const bundle = await build({
  entryPoints: [new URL('../src/lib/small-shrines-client.ts', import.meta.url).pathname],
  bundle: true, write: false, format: 'iife', globalName: 'ShrineClient', platform: 'browser',
  plugins: [{
    name: 'sound-spy',
    setup(builder) {
      builder.onResolve({ filter: /small-shrines-audio$/ }, () => ({ path: 'sound-spy', namespace: 'test' }));
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `
        export function createShrineAudio({onStateChange}) {
          const state = {status:'idle',mode:null,volume:.35,muted:false,error:null};
          const calls = {starts:[],stops:0,disposed:0};
          const publish = () => onStateChange({...state});
          const audio = {
            calls, getState:()=>({...state}),
            async start(mode) { calls.starts.push(mode); state.status='playing'; state.mode=mode; publish(); return true; },
            stop() { calls.stops++; state.status='idle'; state.mode=null; publish(); },
            setVolume(value) { state.volume=value; publish(); },
            setMuted(value) { state.muted=value; publish(); },
            dispose() { calls.disposed++; state.status='disposed'; publish(); }
          };
          window.__soundSpies.push(audio); return audio;
        }` }));
    },
  }],
});

function fixture(t, hash = '') {
  const dom = new JSDOM(markup, { url: `https://pointcast.test/small-shrines/${hash}`, pretendToBeVisual: true, runScripts: 'outside-only' });
  const { window: win } = dom, doc = win.document;
  let now = 0, hidden = false, serial = 0;
  const intervals = new Map();
  win.__soundSpies = [];
  win.performance.now = () => now;
  win.setInterval = callback => { intervals.set(++serial, callback); return serial; };
  win.clearInterval = id => intervals.delete(id);
  Object.defineProperty(doc, 'hidden', { get: () => hidden });
  Object.defineProperty(doc, 'visibilityState', { get: () => hidden ? 'hidden' : 'visible' });
  const init = win.eval(bundle.outputFiles[0].text + '\nShrineClient.initializeSmallShrines;');
  const q = id => doc.getElementById(`ss-${id}`);
  const click = id => q(id).click();
  const advance = seconds => { now += seconds * 1000; for (const callback of [...intervals.values()]) callback(); };
  const visible = value => { hidden = !value; doc.dispatchEvent(new win.Event('visibilitychange')); };
  const choose = id => { win.history.replaceState(null, '', `#${id}`); win.dispatchEvent(new win.HashChangeEvent('hashchange')); };
  const dispose = () => doc.dispatchEvent(new win.Event('astro:before-swap'));
  t.after(() => { dispose(); dom.window.close(); });
  init();
  return { win, doc, init, q, click, advance, visible, choose, dispose, intervals, sounds: win.__soundSpies };
}

test('initial and repeated setup are silent, retain deep links, and do not bind controls twice', t => {
  const f = fixture(t, '#memory');
  f.init(); f.init();
  assert.equal(f.sounds.length, 1);
  assert.deepEqual([...f.doc.querySelectorAll('[data-room]:not([hidden])')].map(el => el.id), ['memory']);
  assert.equal(f.doc.querySelector('[aria-current]').dataset.door, 'memory');
  assert.equal(f.q('sound-mode').value, 'pulse');
  assert.equal(f.q('time').value, '1:00');
  assert.equal(f.q('time').getAttribute('aria-live'), 'off');
  assert.equal(f.q('time').getAttribute('role'), 'timer');
  assert.equal(f.q('begin').disabled, false);
  assert.equal(f.q('end').disabled, true);
  assert.equal(f.q('stop').disabled, true);
  assert.equal(f.sounds[0].calls.starts.length, 0);
  assert.equal(f.intervals.size, 0);
  f.click('begin');
  assert.equal(f.intervals.size, 1, 'one click starts one clock instead of immediately pausing it');
  assert.equal(f.q('begin').textContent, 'Pause minute');
  assert.equal(f.sounds[0].calls.starts.length, 0, 'starting the minute never starts sound');
});

test('timer cues, pause/resume, completion and restart use elapsed active time', t => {
  const f = fixture(t);
  f.click('begin'); f.advance(15);
  assert.equal(f.q('time').value, '0:45');
  assert.equal(f.doc.querySelector('#ocean .ss-phase').textContent, 'Notice');
  assert.equal(f.doc.querySelector('#ocean .ss-cue p').textContent, SHRINES[0].phases[1].text);
  f.click('begin'); f.advance(20);
  assert.equal(f.q('time').value, '0:45', 'paused time is excluded');
  assert.equal(f.intervals.size, 0);
  f.click('begin'); f.advance(30);
  assert.equal(f.q('time').value, '0:15');
  assert.equal(f.doc.querySelector('#ocean .ss-phase').textContent, 'Return');
  f.click('listen'); f.advance(15);
  assert.equal(f.q('time').value, '0:00');
  assert.equal(f.q('progress').value, 60);
  assert.equal(f.intervals.size, 0);
  assert.equal(f.sounds[0].getState().status, 'idle');
  assert.equal(f.q('end').disabled, true);
  assert.match(f.q('timer-status').textContent, /minute is complete/);
  f.advance(120);
  assert.equal(f.q('time').value, '0:00');
  f.click('begin');
  assert.equal(f.q('time').value, '1:00');
  assert.equal(f.doc.querySelector('#ocean .ss-phase').textContent, 'Arrive');
  assert.equal(f.intervals.size, 1);
});

test('changing room ends sound and timing, changes cue and mode, and moves focus to the new heading', t => {
  const f = fixture(t);
  f.click('begin'); f.advance(22); f.click('listen');
  assert.equal(f.sounds[0].getState().status, 'playing');
  f.choose('garden');
  assert.equal(f.doc.getElementById('ocean').hidden, true);
  assert.equal(f.doc.getElementById('garden').hidden, false);
  assert.equal(f.doc.querySelector('[aria-current]').dataset.door, 'garden');
  assert.equal(f.doc.activeElement.id, 'garden-title');
  assert.equal(f.q('sound-mode').value, 'drone');
  assert.equal(f.q('time').value, '1:00');
  assert.equal(f.q('progress').value, 0);
  assert.equal(f.doc.querySelector('#garden .ss-cue p').textContent, SHRINES[1].phases[0].text);
  assert.equal(f.intervals.size, 0);
  assert.equal(f.sounds[0].getState().status, 'idle');
  assert.equal(f.sounds[0].calls.starts.length, 1, 'choosing another room never starts its sound');
});

test('hidden pages and pagehide pause the minute and sound; returning needs explicit activation', t => {
  const f = fixture(t);
  f.click('begin'); f.advance(17); f.click('listen');
  f.visible(false); f.advance(120); f.visible(true);
  assert.equal(f.q('time').value, '0:43');
  assert.match(f.q('begin').textContent, /Resume/);
  assert.equal(f.intervals.size, 0);
  assert.equal(f.sounds[0].getState().status, 'idle');
  assert.equal(f.sounds[0].calls.starts.length, 1);
  f.click('begin'); f.advance(3);
  assert.equal(f.q('time').value, '0:40');
  assert.equal(f.sounds[0].getState().status, 'idle');
  f.click('listen'); f.win.dispatchEvent(new f.win.Event('pagehide')); f.advance(60);
  assert.equal(f.q('time').value, '0:40');
  assert.equal(f.intervals.size, 0);
  assert.equal(f.sounds[0].getState().status, 'idle');
});

test('End pause resets a partial minute and sound; volume, mute and Stop have separate controls', t => {
  const f = fixture(t);
  f.q('volume').value = '37'; f.q('volume').dispatchEvent(new f.win.Event('input'));
  f.click('mute');
  assert.equal(f.sounds[0].getState().volume, .37);
  assert.equal(f.sounds[0].getState().muted, true);
  assert.equal(f.q('mute').getAttribute('aria-pressed'), 'true');
  assert.equal(f.sounds[0].calls.starts.length, 0);
  f.click('mute'); f.click('begin'); f.advance(31); f.click('listen');
  assert.equal(f.q('stop').disabled, false);
  f.click('stop');
  assert.equal(f.sounds[0].getState().status, 'idle');
  assert.equal(f.intervals.size, 1, 'Stop sound does not end the silent minute');
  f.click('listen'); f.click('end'); f.advance(90);
  assert.equal(f.q('time').value, '1:00');
  assert.equal(f.q('progress').value, 0);
  assert.equal(f.q('end').disabled, true);
  assert.equal(f.intervals.size, 0);
  assert.equal(f.sounds[0].getState().status, 'idle');
  assert.match(f.q('timer-status').textContent, /pause has ended/);
});

test('Astro cleanup removes old listeners and timers; reinitialization creates one fresh binding', t => {
  const f = fixture(t);
  f.click('begin'); f.advance(11); f.click('listen');
  const previous = f.sounds[0];
  f.dispose();
  assert.equal(previous.calls.disposed, 1);
  assert.equal(f.intervals.size, 0);
  assert.equal(f.doc.getElementById('small-shrines').dataset.bound, undefined);
  f.click('begin'); f.click('listen');
  assert.equal(f.intervals.size, 0);
  assert.equal(previous.calls.starts.length, 1, 'detached listeners cannot start sound');
  f.init(); f.init();
  assert.equal(f.sounds.length, 2);
  f.click('begin'); f.click('listen'); f.advance(9);
  assert.equal(f.intervals.size, 1);
  assert.equal(f.q('time').value, '0:51');
  assert.equal(previous.calls.starts.length, 1);
  assert.equal(f.sounds[1].calls.starts.length, 1);
  f.dispose();
  assert.equal(previous.calls.disposed, 1);
  assert.equal(f.sounds[1].calls.disposed, 1);
  assert.equal(f.intervals.size, 0);
});
