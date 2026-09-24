// node --test --test-timeout=60000 sketches/radio-spike/radio-v2.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { callSign, markSVG, CALLSIGN_MAX_SECONDS } from './radio-callsign.mjs';
import { createReblocker, peak } from './radio-reblock.mjs';
import { codecParams, encodeWave, createDecoder, resample, inputBlock, OPERATING_RATE, FRAME } from './radio-codec.mjs';
import { encodeFrame, decodeFrame, fromHex, hex } from './radio-frame.mjs';
import { MOOD_COLORS } from './radio-motifs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ---------- call signs ----------
test('call sign is deterministic and accepts bytes or hex', () => {
  const a = callSign(fromHex('a1b2c3d4')), b = callSign('a1b2c3d4');
  assert.deepEqual(a, b);
  assert.equal(a.label, 'A1B2');
  assert.equal(a.notes.length, 4);
  assert.throws(() => callSign('zz'), TypeError);
});

test('call sign melody: pentatonic, bounded, never one repeated note', () => {
  for (let i = 0; i < 500; i++) {
    const alias = new Uint8Array([i & 255, (i * 7) & 255, (i * 13) & 255, (i * 31) & 255]);
    const cs = callSign(alias);
    assert.ok(cs.seconds > 0 && cs.seconds <= CALLSIGN_MAX_SECONDS, `${cs.alias} ${cs.seconds}`);
    assert.ok(new Set(cs.notes.map(n => n.midi)).size > 1, `${cs.alias} is a single note`);
    for (const n of cs.notes) {
      assert.ok(n.f > 200 && n.f < 1100, `${n.f} Hz`); assert.ok(n.d > 0);
      assert.ok(n.midi >= 57 && n.midi <= 63 + 21, `midi ${n.midi}`);
    }
    // every note sits on the major pentatonic of some root in A3..D#4
    assert.ok([57, 58, 59, 60, 61, 62, 63].some(r => cs.notes.every(n => [0, 2, 4, 7, 9].includes(((n.midi - r) % 12 + 12) % 12))), `${cs.alias} off-scale`);
    assert.ok(cs.notes.every((n, j) => j === 0 || n.t > cs.notes[j - 1].t), 'onsets increase');
  }
});

test('call signs are distinguishable across many aliases', () => {
  const sigs = new Set(), marks = new Set();
  const N = 400;
  for (let i = 0; i < N; i++) {
    const alias = new Uint8Array(4); new DataView(alias.buffer).setUint32(0, Math.imul(i + 1, 2654435761) >>> 0);
    const cs = callSign(alias);
    sigs.add(cs.notes.map(n => `${n.midi}@${n.t}`).join(',') + '|' + cs.mark.flat().join(''));
    marks.add(cs.mark.flat().join(''));
  }
  assert.ok(sigs.size >= N * 0.98, `only ${sigs.size}/${N} distinct melody+mark signatures`);
  assert.ok(marks.size >= N * 0.9, `only ${marks.size}/${N} distinct marks`);
});

test('call sign mark is 5x5, mirrored, legible; SVG carries no alias text', () => {
  for (const a of ['00000000', 'ffffffff', 'a1b2c3d4', '12345678']) {
    const cs = callSign(a);
    assert.equal(cs.mark.length, 5);
    for (const row of cs.mark) { assert.equal(row.length, 5); assert.equal(row[0], row[4]); assert.equal(row[1], row[3]); }
    assert.ok(cs.mark.flat().filter(Boolean).length >= 6);
    const svg = markSVG(cs, 20);
    assert.match(svg, /^<svg class="pcr-mark"/);
    assert.ok(!svg.includes(a), 'no alias echoed into markup');
    assert.ok(cs.hue >= 0 && cs.hue < 360);
  }
});

test('mood colours cover all seven moods', () => {
  for (let id = 1; id <= 7; id++) { assert.match(MOOD_COLORS[id].hex, /^#[0-9a-f]{6}$/); assert.ok(MOOD_COLORS[id].hue >= 0); }
});

// ---------- reblocker ----------
test('reblocker: odd chunk sizes produce exact, ordered frames', () => {
  const src = Float32Array.from({ length: 5000 }, (_, i) => i);
  for (const chunk of [1, 128, 480, 1000, 1024, 4096]) {
    const frames = [];
    const r = createReblocker(1024, f => frames.push(Float32Array.from(f)));
    for (let s = 0; s < src.length; s += chunk) r.push(src.subarray(s, Math.min(s + chunk, src.length)));
    assert.equal(frames.length, 4, `chunk ${chunk}`);
    assert.equal(r.pending, 5000 - 4096);
    frames.forEach((f, k) => { assert.equal(f[0], k * 1024); assert.equal(f[1023], k * 1024 + 1023); });
    r.flush();
    assert.equal(frames.length, 5);
    assert.equal(frames[4][903], 4999); assert.equal(frames[4][904], 0, 'zero padded');
  }
  assert.equal(peak(Float32Array.from([0, -0.5, 0.2]), 1), 0.5);
  assert.throws(() => createReblocker(0, () => {}), RangeError);
});

// ---------- codec across device sample rates (pinned ggwave) ----------
const g = await require(join(here, 'vendor/ggwave-0.4.0/ggwave.js'))();
g.disableLog();
const FAST = g.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST;

function airDecode(wave, senderRate, receiverRate, chunk = 128, block) {
  const heard = resample(wave, senderRate, receiverRate);       // what the receiver's mic captures
  const lead = Math.round(receiverRate / 5), tail = Math.round(receiverRate * 0.6); // 200 ms lead, 600 ms tail (a live mic keeps streaming)
  const padded = new Float32Array(lead + heard.length + tail);
  padded.set(heard, lead);
  const dec = createDecoder(g, receiverRate);
  const found = [];
  const r = createReblocker(block ?? inputBlock(receiverRate), f => { const out = dec.decode(f); if (out) found.push(out); });
  try { for (let s = 0; s < padded.length; s += chunk) r.push(padded.subarray(s, Math.min(s + chunk, padded.length))); r.flush(); }
  finally { dec.free(); }
  return found;
}

test('decoder works when it is ggwave instance 0 (the first and usually only live instance), and free releases it', async () => {
  const fresh = await require(join(here, 'vendor/ggwave-0.4.0/ggwave.js'))();   // a new WASM module: ids start at 0
  fresh.disableLog();
  const dec = createDecoder(fresh, 48000);
  assert.equal(dec.id, 0, 'the first decoder really is instance 0');
  const frame = encodeFrame({ alias: fromHex('0badcafe'), messageId: 1, mood: 4 });
  const wave = encodeWave(fresh, 48000, frame, fresh.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST);
  const pad = new Float32Array(9600 + wave.length + 28800); pad.set(wave, 9600);
  const found = [];
  const r = createReblocker(inputBlock(48000), f => { const o = dec.decode(f); if (o) found.push(o); });
  r.push(pad);
  assert.equal(found.length, 1, 'instance 0 must decode');
  assert.equal(hex(found[0]), hex(frame));
  dec.free();
  assert.equal(dec.id, null);
  const again = createDecoder(fresh, 48000);
  assert.equal(again.id, 0, 'id 0 was released and reused (no leak)');
  again.free();
});

test('operating rate is fixed at 48 kHz; only device in/out rates vary', () => {
  const p = codecParams(g, 44100);
  assert.equal(p.sampleRate, OPERATING_RATE);
  assert.equal(p.sampleRateInp, 44100); assert.equal(p.sampleRateOut, 44100);
  assert.throws(() => codecParams(g, 0), RangeError);
});

test('input block rule: ceil(1024 × rate / 48000)', () => {
  assert.deepEqual([16000, 22050, 24000, 32000, 44100, 48000, 96000].map(inputBlock), [342, 471, 512, 683, 941, 1024, 2048]);
});

test('rounding the 44.1 kHz input block down loses the message (why the rule rounds up)', () => {
  const frame = encodeFrame({ alias: fromHex('a1b2c3d4'), messageId: 3, mood: 1 });
  const wave = encodeWave(g, 48000, frame, FAST);
  assert.equal(hex(airDecode(wave, 48000, 44100, 128, 941)[0]), hex(frame), 'ceil block decodes');
  assert.equal(airDecode(wave, 48000, 44100, 128, 940).length, 0, 'floor block with a working decoder does not');
  assert.equal(airDecode(wave, 48000, 44100, 128, 1024).length, 0, 'the 48 kHz block at 44.1 kHz does not either');
});

for (const [tx, rx] of [[48000, 48000], [44100, 48000], [48000, 44100], [44100, 44100], [48000, 16000], [44100, 32000], [48000, 96000]]) {
  test(`cross-device decode: sender ${tx} Hz → receiver ${rx} Hz (mood-only and 47-byte max)`, () => {
    for (const frame of [
      encodeFrame({ alias: fromHex('a1b2c3d4'), messageId: 7, mood: 1 }),
      encodeFrame({ alias: fromHex('a1b2c3d4'), messageId: 8, mood: 6, text: '01234567890123456789012345678901', noun: 1199 }),
    ]) {
      const wave = encodeWave(g, tx, frame, FAST);
      const heard = airDecode(wave, tx, rx);
      assert.equal(heard.length, 1, `${tx}→${rx} ${frame.length} B heard ${heard.length}`);
      assert.equal(hex(heard[0]), hex(frame));
      assert.equal(decodeFrame(heard[0]).mood, frame[10]);
    }
  });
}

test('why the operating rate must be shared: a device running ggwave at 44.1 kHz cannot hear a 48 kHz one', () => {
  // The naive native-rate config: sender operates at 44.1 kHz, receiver at 48 kHz.
  const p = g.getDefaultParameters();
  p.sampleRate = p.sampleRateInp = p.sampleRateOut = 44100; p.samplesPerFrame = FRAME;
  p.sampleFormatInp = p.sampleFormatOut = g.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32; p.operatingMode = g.GGWAVE_OPERATING_MODE_RX_AND_TX;
  const inst = g.init(p);
  const frame = encodeFrame({ alias: fromHex('a1b2c3d4'), messageId: 9, mood: 2 });
  let wave;
  try { const raw = new Uint8Array(g.encode(inst, frame, FAST, 25)); wave = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)); }
  finally { g.free(inst); }
  const heard = airDecode(wave, 44100, 48000);
  assert.ok(!heard.some(h => hex(h) === hex(frame)), 'mismatched operating rates should not decode');
});
