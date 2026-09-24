// node --test sketches/radio-spike/radio-controller.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRadioController } from './radio-controller.mjs';
import { createSequence, encodeFrame, fromHex } from './radio-frame.mjs';
import { MOTIFS, motifPlan, MOTIF_MAX_SECONDS, STORM_GAIN_CAP } from './radio-motifs.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; };
const fakeStream = name => { const tracks = [{ name, stopped: 0, stop() { this.stopped++; } }]; return { name, getTracks: () => tracks, tracks }; };
const settle = () => new Promise(r => setImmediate(r));

function harness(over = {}) {
  const calls = { encodeWave: [], playWave: [], playMotif: [], attach: 0, detach: 0, requests: 0 };
  const states = [];
  let clock = 0;
  const mics = [];
  const ctrl = createRadioController({
    seq: createSequence({ get: () => null, set: () => {} }),
    encodeWave: (bytes, proto) => { calls.encodeWave.push({ bytes, proto }); return new Float32Array(48000); },
    playWave: wave => { calls.playWave.push(wave); return { done: Promise.resolve(), stop() {} }; },
    playMotif: mood => { calls.playMotif.push(mood); return { done: Promise.resolve(), stop() {} }; },
    requestMic: () => { calls.requests++; const d = deferred(); mics.push(d); return d.promise; },
    attachMic: () => { calls.attach++; },
    detachMic: () => { calls.detach++; },
    decodeSamples: () => null,
    now: () => clock,
    setTimeout: fn => { fn(); return 1; }, clearTimeout: () => {},
    onState: (k, t) => states.push(`${k}:${t}`),
    ...over,
  });
  return { ctrl, calls, states, mics, tick: ms => { clock += ms; } };
}

test('Stop while permission is pending: late grant is discarded and its tracks stopped', async () => {
  const h = harness();
  const p = h.ctrl.startListen();
  assert.equal(h.ctrl.state.pending, true);
  h.ctrl.stopRadio('stop');                         // user pressed Stop before the prompt resolved
  const s = fakeStream('late');
  h.mics[0].resolve(s);
  const r = await p;
  assert.equal(r.reason, 'stale');
  assert.equal(s.tracks[0].stopped, 1, 'late stream tracks stopped');
  assert.equal(h.calls.attach, 0, 'never attached');
  assert.equal(h.ctrl.state.listening, false);
  assert.equal(h.ctrl.state.pending, false);
});

test('permission requests are serialized: a second Listen while pending makes no new request', async () => {
  const h = harness();
  const p1 = h.ctrl.startListen();
  const r2 = await h.ctrl.startListen();
  assert.equal(r2.reason, 'pending');
  assert.equal(h.calls.requests, 1);
  h.mics[0].resolve(fakeStream('a'));
  assert.equal((await p1).ok, true);
  assert.equal(h.calls.attach, 1);
  assert.equal(h.ctrl.state.listening, true);
  assert.equal((await h.ctrl.startListen()).reason, 'already');
  assert.equal(h.calls.requests, 1);
});

test('stop → restart while the first prompt is still open: first grant discarded, second attaches', async () => {
  const h = harness();
  const p1 = h.ctrl.startListen();
  h.ctrl.stopListen('escape');
  const p2 = h.ctrl.startListen();                  // new generation, new request
  assert.equal(h.calls.requests, 2);
  const s1 = fakeStream('first'), s2 = fakeStream('second');
  h.mics[1].resolve(s2);
  assert.equal((await p2).ok, true);
  h.mics[0].resolve(s1);                            // the stale one resolves late
  assert.equal((await p1).reason, 'stale');
  assert.equal(s1.tracks[0].stopped, 1);
  assert.equal(s2.tracks[0].stopped, 0);
  assert.equal(h.calls.attach, 1);
  assert.equal(h.ctrl.state.listening, true);
  h.ctrl.stopRadio('stop');
  assert.equal(s2.tracks[0].stopped, 1);
  assert.equal(h.calls.detach, 1);
  assert.equal(h.ctrl.state.listening, false);
});

test('denied permission reports an actionable state and leaves nothing open', async () => {
  const h = harness();
  const p = h.ctrl.startListen();
  h.mics[0].reject(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
  const r = await p;
  assert.equal(r.reason, 'NotAllowedError');
  assert.ok(h.states.at(-1).includes('permission denied'));
  assert.equal(h.ctrl.state.pending, false);
  const retry = h.ctrl.startListen();               // a fresh request is possible after denial
  assert.equal(h.calls.requests, 2);
  h.mics[1].resolve(fakeStream('retry'));
  assert.equal((await retry).ok, true);
});

test('page hidden while pending behaves like Stop (same teardown path)', async () => {
  const h = harness();
  const p = h.ctrl.startListen();
  h.ctrl.stopRadio('page hidden');
  const s = fakeStream('hidden');
  h.mics[0].resolve(s);
  await p;
  assert.equal(s.tracks[0].stopped, 1);
  assert.equal(h.calls.attach, 0);
});

test('preview plays only the local motif: no frame encoded, no modem waveform, no playback bus', async () => {
  const h = harness();
  const r = await h.ctrl.preview({ mood: 3 });
  assert.equal(r.ok, true);
  assert.deepEqual(h.calls.playMotif, [3]);
  assert.equal(h.calls.encodeWave.length, 0, 'encodeWave never called by preview');
  assert.equal(h.calls.playWave.length, 0, 'modem playback never called by preview');
  assert.equal(h.ctrl.state.transmitting, false, 'preview does not arm the self-echo guard');
  assert.ok(h.states.some(s => s.startsWith('preview:Preview done (local only')));
  assert.ok(!h.states.some(s => s.includes('Broadcast played')), 'preview never claims a broadcast');
});

test('send encodes a frame and plays the modem waveform with honest states', async () => {
  const h = harness();
  const r = await h.ctrl.send({ mood: 1, text: 'game on', protocol: 'GGWAVE_PROTOCOL_AUDIBLE_FAST' });
  assert.equal(r.ok, true);
  assert.equal(h.calls.encodeWave.length, 1);
  assert.equal(h.calls.playWave.length, 1);
  assert.equal(h.calls.playMotif.length, 0);
  assert.deepEqual(h.states.filter(s => s.startsWith('send:')).map(s => s.split(' ')[0]), ['send:Preparing', 'send:Playing', 'send:Broadcast']);
  assert.ok(h.states.filter(s => s.startsWith('send:')).at(-1).includes('no acknowledgement'));
  assert.equal(h.states.at(-1), 'idle:', 'idle follows once the send is fully over');
});

test('sends and previews are mutually exclusive while one is playing', async () => {
  const h = harness();
  let release; const done = new Promise(r => { release = r; });
  h.ctrl = createRadioController({ ...h.ctrlDeps, seq: createSequence({ get: () => null, set: () => {} }), encodeWave: () => new Float32Array(48000), playWave: () => ({ done, stop() {} }), playMotif: () => ({ done: Promise.resolve(), stop() {} }), requestMic: () => new Promise(() => {}), attachMic() {}, detachMic() {}, decodeSamples: () => null, setTimeout: fn => { fn(); return 1; }, clearTimeout() {} });
  const p = h.ctrl.send({ mood: 2, protocol: 'x' });
  assert.equal((await h.ctrl.send({ mood: 2, protocol: 'x' })).reason, 'busy');
  assert.equal((await h.ctrl.preview({ mood: 2 })).reason, 'busy');
  release(); await p;
  assert.equal((await h.ctrl.preview({ mood: 2 })).ok, true);
});

// ---- second-round findings ----

const controllable = () => { const calls = { plays: 0, stops: 0 }; const handles = []; const play = () => { calls.plays++; const d = deferred(); const h = { done: d.promise, stop() { calls.stops++; d.resolve(); } }; handles.push(h); return h; }; return { calls, handles, play }; };

test('P1 send A → Stop → send B → A resumes: A cannot emit Broadcast played or clear B; second Stop reaches B', async () => {
  const waves = controllable();
  const h = harness({ playWave: waves.play, setTimeout: fn => { fn(); return 1; } });
  const pA = h.ctrl.send({ mood: 1, protocol: 'x' });
  assert.equal(h.ctrl.state.sending, true);
  h.ctrl.stopRadio('stop');                                    // resolves A.done via stop()
  assert.equal(waves.calls.stops, 1);
  const pB = h.ctrl.send({ mood: 2, protocol: 'x' });
  assert.equal(h.ctrl.state.sending, true, 'B is the current operation');
  const rA = await pA;                                         // A resumes after its await
  assert.equal(rA.reason, 'cancelled');
  assert.equal(h.states.filter(s => s.includes('Broadcast played')).length, 0, 'A emitted no played state');
  assert.equal(h.ctrl.state.sending, true, 'A did not clear B\'s flag');
  assert.equal(h.ctrl.state.activeToken, 2, 'active still references B');
  h.ctrl.stopRadio('stop');
  assert.equal(waves.calls.stops, 2, 'second Stop stopped B');
  assert.equal((await pB).reason, 'cancelled');
  assert.equal(h.ctrl.state.sending, false);
  assert.equal(h.states.filter(s => s.includes('Broadcast played')).length, 0);
  const pC = h.ctrl.send({ mood: 3, protocol: 'x' });          // a fresh op is accepted after Stop
  assert.equal(h.ctrl.state.activeToken, 3);
  waves.handles[2].stop();                                     // the stub's stop() just ends playback; C is still live
  assert.equal((await pC).ok, true, 'C completes normally and is the only op to report played');
  assert.equal(h.states.filter(s => s.includes('Broadcast played')).length, 1);
});

test('P1 Stop during cooldown settles the send promise instead of leaving it pending', async () => {
  const h = harness({ setTimeout: () => 99, clearTimeout: () => {} }); // a cooldown timer that never fires
  const p = h.ctrl.send({ mood: 1, protocol: 'x' });
  await settle(); await settle();
  assert.ok(h.states.some(s => s.includes('Broadcast played')), 'in cooldown');
  let settled = false; p.then(() => { settled = true; });
  await settle();
  assert.equal(settled, false, 'still in cooldown');
  h.ctrl.stopRadio('stop');
  const r = await p;
  assert.equal(r.reason, 'cancelled');
  assert.equal(h.ctrl.state.sending, false);
  assert.equal((await h.ctrl.preview({ mood: 1 })).ok, true, 'controller is usable right after');
});

test('P1 preview A → Stop → preview B → A resumes: A cannot finish B', async () => {
  const motifs = controllable();
  const h = harness({ playMotif: motifs.play });
  const pA = h.ctrl.preview({ mood: 1 });
  h.ctrl.stopRadio('stop');
  const pB = h.ctrl.preview({ mood: 2 });
  assert.equal((await pA).reason, 'cancelled');
  assert.equal(h.ctrl.state.previewing, true);
  assert.equal(h.states.filter(s => s.includes('Preview done')).length, 0);
  motifs.handles[1].stop();                                    // B finishes normally
  assert.equal((await pB).ok, true);
  assert.equal(h.states.filter(s => s.includes('Preview done')).length, 1);
});

test('P2 pending: stale A resolving while B is pending does not clear B (both grant orders)', async () => {
  // order 1: A resolves late while B still pending
  let h = harness();
  const pA = h.ctrl.startListen();
  h.ctrl.stopListen('stop');
  const pB = h.ctrl.startListen();
  const sA = fakeStream('A'); h.mics[0].resolve(sA);
  assert.equal((await pA).reason, 'stale');
  assert.equal(sA.tracks[0].stopped, 1);
  assert.equal(h.ctrl.state.pending, true, 'B is still pending');
  assert.equal((await h.ctrl.startListen()).reason, 'pending', 'Listen C is refused');
  assert.equal(h.calls.requests, 2);
  const sB = fakeStream('B'); h.mics[1].resolve(sB);
  assert.equal((await pB).ok, true);
  assert.equal(h.ctrl.state.listening, true); assert.equal(sB.tracks[0].stopped, 0);
  // order 2: B resolves first, then A
  h = harness();
  const qA = h.ctrl.startListen();
  h.ctrl.stopListen('stop');
  const qB = h.ctrl.startListen();
  const tB = fakeStream('B2'); h.mics[1].resolve(tB);
  assert.equal((await qB).ok, true);
  const tA = fakeStream('A2'); h.mics[0].resolve(tA);
  assert.equal((await qA).reason, 'stale');
  assert.equal(tA.tracks[0].stopped, 1);
  assert.equal(h.ctrl.state.pending, false);
  assert.equal(h.ctrl.state.listening, true, 'B stays attached');
  assert.equal(h.calls.attach, 1);
});

test('P2 partial attach failure is torn down and Listen can restart', async () => {
  let fail = true;
  const h = harness({ attachMic: () => { if (fail) throw new Error('worklet load failed'); } });
  const p = h.ctrl.startListen();
  const s = fakeStream('x'); h.mics[0].resolve(s);
  const r = await p;
  assert.equal(r.reason, 'attach');
  assert.equal(h.calls.detach, 1, 'detachMic ran to release partial allocations');
  assert.equal(s.tracks[0].stopped, 1);
  assert.equal(h.ctrl.state.listening, false);
  assert.ok(h.states.at(-1).startsWith('listen:Audio setup failed'));
  assert.equal(h.ctrl.stopListen('stop'), false, 'nothing left to stop');
  fail = false;
  const p2 = h.ctrl.startListen();
  assert.equal(h.calls.requests, 2);
  h.mics[1].resolve(fakeStream('y'));
  assert.equal((await p2).ok, true);
  assert.equal(h.ctrl.state.listening, true);
});

test('an idle state is emitted only after the busy flag has cleared', async () => {
  const seen = [];
  let ctrl;
  ctrl = createRadioController({ seq: createSequence({ get: () => null, set: () => {} }), encodeWave: () => new Float32Array(48000), playWave: () => ({ done: Promise.resolve(), stop() {} }), playMotif: () => ({ done: Promise.resolve(), stop() {} }), requestMic: () => new Promise(() => {}), attachMic() {}, detachMic() {}, decodeSamples: () => null, setTimeout: fn => { fn(); return 1; }, clearTimeout() {}, onState: k => seen.push([k, ctrl ? ctrl.state.sending || ctrl.state.previewing : null]) });
  await ctrl.send({ mood: 1, protocol: 'x' });
  await ctrl.preview({ mood: 1 });
  const idles = seen.filter(([k]) => k === 'idle');
  assert.equal(idles.length, 2);
  assert.ok(idles.every(([, busy]) => busy === false), 'idle fires with busy flags already false');
  assert.equal(seen.filter(([k, busy]) => k !== 'idle' && k !== 'listen').every(([, busy]) => busy === true), true, 'other states fire while busy');
});

test('self-echo guard ignores frames until playback completes plus the guard window', async () => {
  const received = [];
  const h = harness({ onReceive: d => received.push(d), decodeSamples: () => encodeFrame({ alias: fromHex('01020304'), messageId: 1, mood: 1 }) });
  let release; const done = new Promise(r => { release = r; });
  h.ctrl = createRadioController({ seq: createSequence({ get: () => null, set: () => {} }), encodeWave: () => new Float32Array(48000), playWave: () => ({ done, stop() {} }), playMotif: () => ({ done: Promise.resolve(), stop() {} }), requestMic: () => Promise.resolve(fakeStream('m')), attachMic: (s, onFrame) => { h.onFrame = onFrame; }, detachMic() {}, decodeSamples: () => encodeFrame({ alias: fromHex('01020304'), messageId: 1, mood: 1 }), now: () => h.clock, setTimeout: fn => { fn(); return 1; }, clearTimeout() {}, onReceive: d => received.push(d) });
  h.clock = 0;
  await h.ctrl.startListen();
  const p = h.ctrl.send({ mood: 1, protocol: 'x' });      // 1 s wave → guard until 1250 ms
  h.onFrame(new Float32Array(1024));
  assert.equal(received.length, 0, 'own burst ignored while transmitting');
  h.clock = 1300;
  h.onFrame(new Float32Array(1024));
  assert.equal(received.length, 1, 'accepted after the guard');
  release(); await p;
});

test('receive pipeline: validate, dedup, then rate limits', () => {
  const received = [];
  const h = harness({ onReceive: d => received.push(d) });
  const f = id => encodeFrame({ alias: fromHex('0a0b0c0d'), messageId: id, mood: 5 });
  assert.equal(h.ctrl.handleDecoded(new Uint8Array([1, 2, 3])).reason, 'length');
  assert.equal(h.ctrl.handleDecoded(f(1)).accepted, true);
  assert.equal(h.ctrl.handleDecoded(f(1)).reason, 'duplicate');
  assert.equal(h.ctrl.handleDecoded(f(2)).accepted, true);
  assert.equal(h.ctrl.handleDecoded(f(3)).accepted, true);
  assert.equal(h.ctrl.handleDecoded(f(4)).reason, 'alias_limit');   // per-alias burst of 3 spent
  assert.equal(received.length, 3);
});

test('motifs: all seven moods, bounded length, Storm capped at 0.5, no modem fields', () => {
  assert.deepEqual(Object.keys(MOTIFS).map(Number), [1, 2, 3, 4, 5, 6, 7]);
  for (let id = 1; id <= 7; id++) {
    const plan = motifPlan(id);
    assert.ok(plan.notes.length >= 1, plan.name);
    assert.ok(plan.seconds > 0 && plan.seconds <= MOTIF_MAX_SECONDS, `${plan.name} ${plan.seconds}s`);
    for (const n of plan.notes) { assert.ok(n.g <= 1 && n.g > 0); assert.ok(!('bytes' in n) && !('frame' in n)); }
  }
  assert.ok(motifPlan(6).notes.every(n => n.g <= STORM_GAIN_CAP));
  assert.throws(() => motifPlan(8), RangeError);
});
