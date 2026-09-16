#!/usr/bin/env node
/**
 * Reproduce Chime's software-only acoustic HELLO / ACK experiment.
 * Requires Node.js 20+ and ggwave exactly 0.4.0 (MIT licensed upstream).
 * https://github.com/ggerganov/ggwave
 *
 * Copy this file and chime-packet.mjs into a separate scratch directory, then
 * run these commands from that directory:
 *   npm install --ignore-scripts --no-audit --no-fund ggwave@0.4.0
 *   node chime-experiment.mjs --out ./results
 *
 * This creates chime-demo.wav and chime-checks.json. Existing output files are
 * refused unless --overwrite is explicitly supplied. With no --out argument,
 * the output directory is ./work/chime-experiment relative to the current cwd.
 * Delete the scratch directory when finished. No audio is played or recorded;
 * no microphone, network service, or endpoint connection is accessed at runtime.
 *
 * The public tags below are demonstration fixtures, never live session tags.
 * An echoed tag and CRC provide correlation/integrity, not authentication.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import {
  PACKET_BYTES, FIXTURES, crc16, encodePacket, decodePacket, validateAck,
  createSessionTag, createSenderTag,
} from './chime-packet.mjs';

const help = `Usage: node chime-experiment.mjs [--out DIRECTORY] [--overwrite]
Requires ggwave@0.4.0 installed beside this script.
Default directory: ./work/chime-experiment
Writes chime-demo.wav and chime-checks.json; never plays or records audio.`;
let outputDirectory = resolve('work/chime-experiment');
let overwrite = false;
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index++) {
  const arg = args[index];
  if (arg === '--help' || arg === '-h') { console.log(help); process.exit(0); }
  if (arg === '--overwrite') { overwrite = true; continue; }
  if (arg === '--out' && args[index + 1] && !args[index + 1].startsWith('--')) {
    outputDirectory = resolve(args[++index]);
    continue;
  }
  throw new Error(`Unknown or incomplete argument: ${arg}\n${help}`);
}
const wavPath = resolve(outputDirectory, 'chime-demo.wav');
const reportPath = resolve(outputDirectory, 'chime-checks.json');
if (!overwrite && [wavPath, reportPath].some(path => existsSync(path))) {
  throw new Error(`Output already exists in ${outputDirectory}; choose another --out directory or explicitly use --overwrite.`);
}
const require = createRequire(import.meta.url);
const packageInfo = JSON.parse(readFileSync(require.resolve('ggwave/package.json'), 'utf8'));
assert.equal(packageInfo.version, '0.4.0', 'This reproducible experiment requires ggwave exactly 0.4.0');
const { default: factory } = await import('ggwave');
const g = await factory();
g.disableLog();

const SAMPLE_RATE = 48000;
const FRAME_SAMPLES = 1024;
const NOISE_SEED = 0x4348494d;
const NOISE_SNR_DB = 24;
const PUBLISHED_WAV_SHA256 = '3e1909f930c0562793c95eba8ce509089e853edf14d30f9e6f4ef4b5d1f3527f';
const p = g.getDefaultParameters();
p.sampleRateInp = p.sampleRateOut = p.sampleRate = SAMPLE_RATE;
p.sampleFormatInp = p.sampleFormatOut = g.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
p.operatingMode = g.GGWAVE_OPERATING_MODE_RX_AND_TX; // Optional DSS is disabled.
const hello = encodePacket(FIXTURES.hello);
const ack = encodePacket(FIXTURES.ack);
const passed = [];
const failed = [];

async function check(name, body) {
  await test(name, () => {
    try { body(); passed.push(name); }
    catch (error) { failed.push({ name, message: error.message }); throw error; }
  });
}

function encode(bytes) {
  const instance = g.init(p);
  try {
    // Copy immediately: ggwave returns a view into reusable WASM memory.
    const encoded = new Uint8Array(g.encode(instance, bytes, g.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST, 20));
    return new Float32Array(encoded.buffer);
  } finally { g.free(instance); }
}

function decode(samples) {
  const instance = g.init(p);
  const found = [];
  try {
    for (let start = 0; start < samples.length; start += FRAME_SAMPLES) {
      const chunk = samples.subarray(start, Math.min(start + FRAME_SAMPLES, samples.length));
      const bytes = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      const result = new Uint8Array(g.decode(instance, bytes));
      if (result.length) found.push(result);
    }
  } finally { g.free(instance); }
  return found;
}

function decodeReblocked(samples, inputChunkSamples) {
  // A real audio callback may provide variable lengths. Buffer into codec frames.
  const instance = g.init(p);
  const found = [];
  const frame = new Float32Array(FRAME_SAMPLES);
  let filled = 0;
  function consumeFrame() {
    const result = new Uint8Array(g.decode(instance, new Uint8Array(frame.buffer)));
    if (result.length) found.push(result);
  }
  try {
    for (let start = 0; start < samples.length; start += inputChunkSamples) {
      const chunk = samples.subarray(start, Math.min(start + inputChunkSamples, samples.length));
      let position = 0;
      while (position < chunk.length) {
        const take = Math.min(frame.length - filled, chunk.length - position);
        frame.set(chunk.subarray(position, position + take), filled);
        position += take;
        filled += take;
        if (filled === frame.length) { consumeFrame(); filled = 0; }
      }
    }
    if (filled) { frame.fill(0, filled); consumeFrame(); }
  } finally { g.free(instance); }
  return found;
}

const helloWave = encode(hello);
const ackWave = encode(ack);
const silence = seconds => new Float32Array(Math.round(seconds * SAMPLE_RATE));
const segments = [silence(0.2), helloWave, silence(0.7), ackWave, silence(0.4)];
const combined = new Float32Array(segments.reduce((sum, segment) => sum + segment.length, 0));
let offset = 0;
for (const segment of segments) { combined.set(segment, offset); offset += segment.length; }

const wav = Buffer.alloc(44 + combined.length * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(SAMPLE_RATE, 24); wav.writeUInt32LE(SAMPLE_RATE * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(combined.length * 2, 40);
for (let i = 0; i < combined.length; i++) {
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, combined[i])) * 32767), 44 + i * 2);
}
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(wavPath, wav, { flag: overwrite ? 'w' : 'wx' });

await check('CRC16-CCITT-FALSE standard vector 123456789 equals 0x29B1', () => {
  assert.equal(crc16(new TextEncoder().encode('123456789')), 0x29b1);
});
await check('HELLO and ACK are exactly 20 bytes and decode without loss', () => {
  assert.equal(hello.length, PACKET_BYTES); assert.equal(ack.length, PACKET_BYTES);
  assert.deepEqual(decodePacket(hello), FIXTURES.hello); assert.deepEqual(decodePacket(ack), FIXTURES.ack);
  assert.equal(Buffer.from(hello).toString('hex').toUpperCase(), '434801013A71C94B2056D8E2010203040007DDAC');
  assert.equal(Buffer.from(ack).toString('hex').toUpperCase(), '434801023A71C94B2056D8E20506070800070EBE');
});
await check('Packet respects big-endian capability and CRC fields', () => {
  const bytes = encodePacket({ ...FIXTURES.hello, capabilities: 0x1234 });
  assert.equal(bytes[16], 0x12); assert.equal(bytes[17], 0x34);
  assert.equal(new DataView(bytes.buffer).getUint16(18, false), crc16(bytes.subarray(0, 18)));
});
await check('Decoder accepts a packet view with a nonzero byte offset', () => {
  const wrapped = new Uint8Array(42); wrapped.set(hello, 7);
  assert.deepEqual(decodePacket(wrapped.subarray(7, 27)), FIXTURES.hello);
});
await check('Every one-bit packet corruption is rejected', () => {
  for (let bit = 0; bit < 160; bit++) {
    const bytes = hello.slice(); bytes[bit >> 3] ^= 1 << (bit % 8);
    assert.throws(() => decodePacket(bytes));
  }
});
await check('Wrong lengths and non-byte input are rejected', () => {
  for (const value of [[], new Uint8Array(0), new Uint8Array(19), new Uint8Array(21), null]) {
    assert.throws(() => decodePacket(value));
  }
});
await check('Unknown version and packet types are rejected even with valid CRC', () => {
  for (const [position, value] of [[2, 2], [3, 0], [3, 3]]) {
    const bytes = hello.slice(); bytes[position] = value;
    new DataView(bytes.buffer).setUint16(18, crc16(bytes.subarray(0, 18)), false);
    assert.throws(() => decodePacket(bytes), /Unsupported/);
  }
});
await check('Encoder rejects malformed tags, capabilities and types', () => {
  for (const change of [{ sessionTag: 'abc' }, { senderTag: 'zzzzzzzz' }, { capabilities: -1 },
    { capabilities: 65536 }, { capabilities: 1.5 }, { type: 3 }]) {
    assert.throws(() => encodePacket({ ...FIXTURES.hello, ...change }));
  }
});
await check('ACK echoes pending HELLO session and wrong session is rejected', () => {
  assert.deepEqual(validateAck(hello, ack), FIXTURES.ack);
  const wrong = encodePacket({ ...FIXTURES.ack, sessionTag: '3A71C94B2056D8E3' });
  assert.throws(() => validateAck(hello, wrong), /session mismatch/);
});
await check('HELLO cannot be accepted as ACK and reversed order is rejected', () => {
  assert.throws(() => validateAck(hello, hello), /Expected/);
  assert.throws(() => validateAck(ack, hello), /Expected/);
});
await check('Random live tags use secure random API and correct lengths', () => {
  assert.match(createSessionTag(), /^[0-9A-F]{16}$/); assert.match(createSenderTag(), /^[0-9A-F]{8}$/);
});
await check('ggwave Uint8Array accepts zero and non-ASCII bytes without an ASCII envelope', () => {
  const bytes = Uint8Array.of(0, 1, 2, 3, 128, 255, 0, 192);
  assert.deepEqual(decode(encode(bytes)), [bytes]);
});
await check('Audible HELLO and ACK decode exactly from generated 48 kHz PCM', () => {
  assert.deepEqual(decode(helloWave), [hello]); assert.deepEqual(decode(ackWave), [ack]);
});
await check('Two messages separated by 0.7 seconds decode from one streamed recording', () => {
  assert.deepEqual(decode(combined), [hello, ack]);
});
await check('Variable audio callback chunks decode after buffering into 1024-sample codec frames', () => {
  assert.deepEqual(decodeReblocked(combined, 777), [hello, ack]);
});

// Exact original noise model: xorshift32, seed 0x4348494D, uniform [-sqrt(3),
// sqrt(3)] scaled to nominal 24 dB SNR relative to generated packet RMS.
// Noise is added across the entire combined recording, including silence.
const active = new Float32Array(helloWave.length + ackWave.length);
active.set(helloWave); active.set(ackWave, helloWave.length);
const signalRms = Math.sqrt(active.reduce((sum, value) => sum + value * value, 0) / active.length);
const noiseRms = signalRms / Math.pow(10, NOISE_SNR_DB / 20);
let seed = NOISE_SEED;
const noisy = Float32Array.from(combined, value => {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return value + (((seed >>> 0) / 4294967296) * 2 - 1) * Math.sqrt(3) * noiseRms;
});
await check('Both packets decode with deterministic uniform noise at nominal 24 dB SNR', () => {
  assert.deepEqual(decode(noisy), [hello, ack]);
});
await check('Published 16-bit mono WAV is below 2 MB and decodes to exact HELLO and ACK', () => {
  const saved = readFileSync(wavPath);
  assert(saved.length < 2000000);
  assert.equal(saved.toString('ascii', 0, 4), 'RIFF');
  assert.equal(saved.readUInt32LE(24), SAMPLE_RATE);
  const floats = new Float32Array((saved.length - 44) / 2);
  for (let i = 0; i < floats.length; i++) floats[i] = saved.readInt16LE(44 + i * 2) / 32768;
  assert.deepEqual(decode(floats), [hello, ack]);
});
await check('Generated WAV is byte-for-byte identical to the published demonstration', () => {
  assert.equal(createHash('sha256').update(wav).digest('hex'), PUBLISHED_WAV_SHA256);
});

const report = {
  experiment: 'Chime v0.1 software-only acoustic discovery handshake',
  generatedAt: new Date().toISOString(),
  library: {
    name: 'ggwave', version: packageInfo.version, protocol: 'GGWAVE_PROTOCOL_AUDIBLE_FAST',
    protocolId: 1, volume: 20, dss: false, binaryPayload: true, source: 'https://github.com/ggerganov/ggwave',
  },
  packet: {
    bytes: 20, byteOrder: 'big-endian', crc: 'CRC16-CCITT-FALSE',
    helloHex: Buffer.from(hello).toString('hex').toUpperCase(), ackHex: Buffer.from(ack).toString('hex').toUpperCase(),
    hello: decodePacket(hello), ack: decodePacket(ack),
  },
  audio: {
    file: 'chime-demo.wav', sampleRate: SAMPLE_RATE, channels: 1, bitsPerSample: 16,
    encoding: 'PCM signed little-endian', samples: combined.length, durationSeconds: combined.length / SAMPLE_RATE,
    helloDurationSeconds: helloWave.length / SAMPLE_RATE, ackDurationSeconds: ackWave.length / SAMPLE_RATE,
    interPacketSilenceSeconds: 0.7, leadingSilenceSeconds: 0.2, trailingSilenceSeconds: 0.4,
    bytes: wav.length, sha256: createHash('sha256').update(wav).digest('hex'),
  },
  tests: {
    runner: 'node:test', passed: passed.length, failed: failed.length, checks: passed, failures: failed,
    frameSamples: FRAME_SAMPLES,
    noise: {
      kind: 'deterministic uniform additive noise', nominalSnrDb: NOISE_SNR_DB,
      reference: 'RMS of concatenated generated packet waveforms', signalRms, noiseRms,
      seedHex: '4348494D', generator: 'xorshift32 shifts 13,17,5',
    },
  },
  limitations: [
    'Generated PCM and serialized WAV decoded in software; no speaker-to-microphone or room test performed.',
    'No microphone access, network pairing, endpoint connection, device control, latency synchronization, or authentication implemented.',
    'CRC detects corruption and echoed session tag correlates replies; neither proves identity or physical proximity.',
    'Public demonstration tags are deterministic fixtures and must not be reused for live sessions.',
    'Optional ggwave DSS disabled: an earlier exploratory binary fixture with null bytes did not round-trip when DSS was enabled.',
    'Direct 777-sample decoding failed in an earlier exploratory test. Buffering callback input to 1024-sample codec frames passes; a live receiver needs such buffering.',
  ],
};
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: overwrite ? 'w' : 'wx' });
console.log(`${passed.length} passed, ${failed.length} failed. Results: ${outputDirectory}`);
if (failed.length) process.exitCode = 1;
