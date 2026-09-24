// node sketches/radio-spike/measure.mjs
// Encodes the golden fixtures with the pinned ggwave build, measures waveform
// duration per protocol, and loopback-decodes each waveform in software.
// Loopback is codec evidence only. It is not a room test.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { encodeFrame, decodeFrame, fromHex, hex, MOODS } from './radio-frame.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const vendorPath = join(here, 'vendor/ggwave-0.4.0/ggwave.js');
const vendorSha = createHash('sha256').update(readFileSync(vendorPath)).digest('hex');
assert.equal(vendorSha, 'f3792b5c185345a35a935ca68a5064b97f979d13fbba0062ff16f6b3b31a6113', 'vendored ggwave.js changed; re-pin');
const g = await require(vendorPath)();
g.disableLog();

const SAMPLE_RATE = 48000, FRAME_SAMPLES = 1024, VOLUME = 25;
const p = g.getDefaultParameters();
p.sampleRateInp = p.sampleRateOut = p.sampleRate = SAMPLE_RATE;
p.samplesPerFrame = FRAME_SAMPLES;
p.sampleFormatInp = p.sampleFormatOut = g.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
p.operatingMode = g.GGWAVE_OPERATING_MODE_RX_AND_TX;

const PROTOCOLS = {
  audible_normal: g.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_NORMAL,
  audible_fast: g.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,
  audible_fastest: g.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FASTEST,
};

const alias = fromHex('a1b2c3d4');
const T32 = 'abcdefghijklmnopqrstuvwxyz012345';
const FIXTURES = [
  { name: 'mood_only_calm',        frame: { alias, messageId: 1, mood: 1 } },
  { name: 'mood_only_goodnight',   frame: { alias, messageId: 2, mood: 7 } },
  { name: 'mood_noun',             frame: { alias, messageId: 3, mood: 5, noun: 779 } },
  { name: 'text_ascii_short',      frame: { alias, messageId: 4, mood: 2, text: 'game on' } },
  { name: 'text_emoji',            frame: { alias, messageId: 5, mood: 3, text: 'love 💛🌊' } },
  { name: 'text_32_boundary',      frame: { alias, messageId: 6, mood: 4, text: T32 } },
  { name: 'text_32_noun_max_frame',frame: { alias, messageId: 7, mood: 6, text: T32, noun: 1199 } },
];

function encodeWave(bytes, protocol) {
  const inst = g.init(p);
  try {
    // Copy immediately: ggwave returns a view into reusable WASM memory (Chime lesson).
    const raw = new Uint8Array(g.encode(inst, bytes, protocol, VOLUME));
    return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  } finally { g.free(inst); }
}

function decodeWave(samples, chunkSamples = 480 /* a 10 ms callback, deliberately not frame-aligned */) {
  const inst = g.init(p);
  const found = [];
  const frame = new Float32Array(FRAME_SAMPLES);
  let filled = 0;
  const consume = () => {
    const r = new Uint8Array(g.decode(inst, new Uint8Array(frame.buffer)));
    if (r.length) found.push(new Uint8Array(r));
  };
  try {
    // lead-in silence so the decoder sees a clean start, then the burst, then tail silence
    const padded = new Float32Array(FRAME_SAMPLES * 4 + samples.length + FRAME_SAMPLES * 8);
    padded.set(samples, FRAME_SAMPLES * 4);
    for (let s = 0; s < padded.length; s += chunkSamples) {
      const chunk = padded.subarray(s, Math.min(s + chunkSamples, padded.length));
      let pos = 0;
      while (pos < chunk.length) {
        const take = Math.min(frame.length - filled, chunk.length - pos);
        frame.set(chunk.subarray(pos, pos + take), filled);
        pos += take; filled += take;
        if (filled === frame.length) { consume(); filled = 0; }
      }
    }
    if (filled) { frame.fill(0, filled); consume(); filled = 0; }
  } finally { g.free(inst); }
  return found;
}

const fixturesOut = [];
const measurements = [];
for (const fx of FIXTURES) {
  const bytes = encodeFrame(fx.frame);
  const decoded = decodeFrame(bytes);
  fixturesOut.push({ name: fx.name, input: { ...fx.frame, alias: hex(alias) }, bytes: bytes.length, hex: hex(bytes), decoded: { ...decoded, aliasBytes: undefined } });
  for (const [protoName, proto] of Object.entries(PROTOCOLS)) {
    const wave = encodeWave(bytes, proto);
    const seconds = wave.length / SAMPLE_RATE;
    let peak = 0; for (const v of wave) peak = Math.max(peak, Math.abs(v));
    const heard = decodeWave(wave);
    const ok = heard.length === 1 && hex(heard[0]) === hex(bytes);
    let roundTrip = null;
    if (ok) { const d = decodeFrame(heard[0]); roundTrip = d.text === decoded.text && d.mood === decoded.mood && d.messageId === decoded.messageId; }
    measurements.push({ fixture: fx.name, bytes: bytes.length, protocol: protoName, samples: wave.length, seconds: +seconds.toFixed(3), peak: +peak.toFixed(3), loopback_frames: heard.length, loopback_exact: ok, loopback_roundtrip: roundTrip, loopback_hex: heard.map(h => hex(h)) });
  }
}

const report = {
  generated: new Date().toISOString(),
  ggwave: { version: '0.4.0', sha256: vendorSha },
  params: { sampleRate: SAMPLE_RATE, samplesPerFrame: FRAME_SAMPLES, volume: VOLUME, decodeChunkSamples: 480 },
  note: 'Software loopback only: codec evidence, not a two-device room test. Durations are the raw ggwave burst; the product adds a call-sign melody before it.',
  moods: MOODS.map(m => ({ id: m.id, name: m.name })),
  measurements,
};
writeFileSync(join(here, 'fixtures/frames.json'), JSON.stringify({ generated: report.generated, fixtures: fixturesOut }, null, 2) + '\n');
writeFileSync(join(here, 'fixtures/measurements.json'), JSON.stringify(report, null, 2) + '\n');

const failed = measurements.filter(m => !m.loopback_exact);
console.log('fixture                     bytes  protocol          seconds  loopback');
for (const m of measurements) console.log(`${m.fixture.padEnd(27)} ${String(m.bytes).padStart(5)}  ${m.protocol.padEnd(17)} ${String(m.seconds).padStart(7)}  ${m.loopback_exact ? 'ok' : 'FAIL'}`);
console.log(failed.length ? `\n${failed.length} loopback failures` : '\nall loopbacks exact');
process.exitCode = failed.length ? 1 : 0;
