/**
 * ggwave wiring shared by the browser adapter and node tests.
 *
 * ggwave maps tones to FFT bins at its OPERATING rate. Two devices must share
 * that rate or they disagree on frequencies. So the operating rate is fixed at
 * 48 kHz everywhere, and each device only sets its own input/output rate
 * (its AudioContext rate); ggwave resamples at the edges.
 */
export const OPERATING_RATE = 48000;
export const FRAME = 1024;
export const VOLUME = 25;

export function codecParams(g, deviceRate) {
  if (!Number.isFinite(deviceRate) || deviceRate < 8000) throw new RangeError('deviceRate must be a sample rate in Hz');
  const p = g.getDefaultParameters();
  p.sampleRate = OPERATING_RATE;
  p.sampleRateInp = deviceRate;
  p.sampleRateOut = deviceRate;
  p.samplesPerFrame = FRAME;
  p.sampleFormatInp = p.sampleFormatOut = g.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
  p.operatingMode = g.GGWAVE_OPERATING_MODE_RX_AND_TX;
  return p;
}

/** Encode bytes to Float32 samples at deviceRate. Copies out of WASM memory immediately. */
export function encodeWave(g, deviceRate, bytes, protocolId, volume = VOLUME) {
  const inst = g.init(codecParams(g, deviceRate));
  try {
    const raw = new Uint8Array(g.encode(inst, bytes, protocolId, volume));
    return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  } finally { g.free(inst); }
}

/**
 * Input samples per decode() call at a device rate. ggwave 0.4.0 decodes one
 * operating frame per call and only when the call's input resamples to a full
 * frame: 1024 at 48 kHz, 941 at 44.1 kHz, 342 at 16 kHz. Rounding down loses
 * every message (measured; see radio-v2.test.mjs), so round up.
 */
export const inputBlock = deviceRate => Math.ceil(FRAME * deviceRate / OPERATING_RATE);

/** A long-lived decoder for one listening session. Feed it inputBlock(deviceRate)-sample blocks. */
// ggwave instance ids start at 0 and freed ids are reused, so 0 is the normal
// id of the first (often only) live instance. Never test an id for truthiness.
export function createDecoder(g, deviceRate) {
  let inst = g.init(codecParams(g, deviceRate));
  if (!Number.isInteger(inst) || inst < 0) throw new Error('ggwave could not start a decoder');
  return {
    decode(samples) {
      if (inst === null) return null;
      const r = new Uint8Array(g.decode(inst, new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength)));
      return r.length ? new Uint8Array(r) : null;
    },
    free() { if (inst !== null) { g.free(inst); inst = null; } },
    get id() { return inst; },
  };
}

/** Linear resampler, used only to simulate "through the air" between devices in tests and loopback. */
export function resample(samples, fromRate, toRate) {
  if (fromRate === toRate) return samples;
  const out = new Float32Array(Math.floor(samples.length * toRate / fromRate));
  const step = fromRate / toRate;
  for (let i = 0; i < out.length; i++) {
    const x = i * step, i0 = Math.floor(x), f = x - i0;
    const a = samples[i0] ?? 0, b = samples[i0 + 1] ?? a;
    out[i] = a + (b - a) * f;
  }
  return out;
}
