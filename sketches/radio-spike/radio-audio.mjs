/**
 * Browser audio adapter for Layers Radio. One AudioContext at the device's
 * native rate; ggwave runs at a fixed 48 kHz operating rate and resamples at the
 * edges (see radio-codec.mjs). Nothing here runs at import time, so the module is
 * safe to import anywhere; the codec is fetched only on first use.
 *
 * Privacy: the mic feeds a silent graph (capture node -> gain 0 -> destination),
 * is never routed to the speakers, and samples are only held long enough to
 * decode. Nothing is recorded, stored or uploaded.
 */
import { callSign } from './radio-callsign.mjs';
import { motifPlan } from './radio-motifs.mjs';
import { createReblocker, peak } from './radio-reblock.mjs';
import { encodeWave as codecEncode, createDecoder, inputBlock, resample } from './radio-codec.mjs';

const VENDOR_URL = new URL('vendor/ggwave-0.4.0/ggwave.js', import.meta.url).href;
const WORKLET_URL = new URL('radio-capture.worklet.js', import.meta.url).href;

export function createRadioAudio({ log = () => {}, volume = () => 0.9, onTrackEnded = () => {} } = {}) {
  let ctx = null, g = null, codecP = null, workletP = null, workletOk = false;
  let mic = null, lvl = 0, noiseBuf = null;

  function ensureCtx() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      ctx = new C();
      log('audio context', ctx.sampleRate, 'Hz');
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function loadCodec() {
    if (g) return Promise.resolve(g);
    if (!codecP) {
      codecP = (async () => {
        if (typeof globalThis.ggwave_factory !== 'function') {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = VENDOR_URL; s.async = true;
            s.onload = resolve;
            s.onerror = () => reject(new Error('the sound codec failed to load'));
            document.head.append(s);
          });
        }
        const inst = await globalThis.ggwave_factory();
        inst.disableLog();
        g = inst;
        log('ggwave 0.4.0 ready');
        return inst;
      })().catch(e => { codecP = null; throw e; });
    }
    return codecP;
  }

  const clamp = v => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

  function tone(c, dest, f, at, d, type = 'sine', gain = 0.4, bendTo) {
    const o = c.createOscillator(), e = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, at);
    if (bendTo) o.frequency.exponentialRampToValueAtTime(bendTo, at + d);
    e.gain.setValueAtTime(0, at);
    e.gain.linearRampToValueAtTime(gain, at + 0.015);
    e.gain.setValueAtTime(gain, at + Math.max(0.02, d - 0.05));
    e.gain.linearRampToValueAtTime(0, at + d);
    o.connect(e); e.connect(dest);
    o.start(at); o.stop(at + d + 0.03);
    return o;
  }

  function encodeWave(bytes, protocolName) {
    if (!g) throw new Error('codec not loaded');
    const c = ensureCtx();
    const id = g.ProtocolId[protocolName];
    if (id === undefined) throw new Error(`unknown protocol ${protocolName}`);
    return codecEncode(g, c.sampleRate, bytes, id);
  }

  /** Call-sign melody, a short breath, then the data burst. Reports the total length. */
  function playTransmission(wave, { alias }) {
    const c = ensureCtx();
    const cs = callSign(alias);
    const out = c.createGain(); out.gain.value = clamp(volume()); out.connect(c.destination);
    const t0 = c.currentTime + 0.05;
    const nodes = cs.notes.map(n => tone(c, out, n.f, t0 + n.t, n.d, 'triangle', 0.3));
    const burstAt = t0 + cs.seconds + 0.18;
    const buf = c.createBuffer(1, wave.length, c.sampleRate);
    buf.copyToChannel(wave, 0);
    const src = c.createBufferSource(); src.buffer = buf; src.connect(out); src.start(burstAt);
    const seconds = (burstAt - c.currentTime) + wave.length / c.sampleRate;
    const done = new Promise(res => { src.onended = res; });
    return {
      done, seconds, callSign: cs,
      stop() { for (const n of [...nodes, src]) { try { n.stop(); } catch {} } try { out.disconnect(); } catch {} },
    };
  }

  function playCallSign(alias, gain = 0.8) {
    const c = ensureCtx();
    const cs = callSign(alias);
    const out = c.createGain(); out.gain.value = clamp(volume() * gain); out.connect(c.destination);
    const t0 = c.currentTime + 0.03;
    const nodes = cs.notes.map(n => tone(c, out, n.f, t0 + n.t, n.d, 'triangle', 0.3));
    const done = new Promise(res => setTimeout(res, (cs.seconds + 0.1) * 1000));
    return { done, seconds: cs.seconds, stop() { nodes.forEach(n => { try { n.stop(); } catch {} }); try { out.disconnect(); } catch {} } };
  }

  function playMotif(moodId, { gain = 0.7 } = {}) {
    const c = ensureCtx();
    const plan = motifPlan(moodId);
    const out = c.createGain(); out.gain.value = clamp(gain); out.connect(c.destination);
    const t0 = c.currentTime + 0.03;
    const nodes = [];
    for (const n of plan.notes) {
      if (n.type === 'noise') {
        if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
          noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
          const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
        const e = c.createGain(); e.gain.setValueAtTime(0, t0 + n.t);
        e.gain.linearRampToValueAtTime(n.g, t0 + n.t + n.d * 0.6);
        e.gain.linearRampToValueAtTime(0, t0 + n.t + n.d);
        src.connect(lp); lp.connect(e); e.connect(out);
        src.start(t0 + n.t); src.stop(t0 + n.t + n.d + 0.05); nodes.push(src);
      } else {
        nodes.push(tone(c, out, n.f, t0 + n.t, n.d, n.type, n.g, n.bendTo));
      }
    }
    const done = new Promise(res => setTimeout(res, (plan.seconds + 0.08) * 1000));
    return { done, seconds: plan.seconds, stop() { nodes.forEach(n => { try { n.stop(); } catch {} }); try { out.disconnect(); } catch {} } };
  }

  // ---------- capture ----------
  async function prepareCapture() {
    const c = ensureCtx();
    if (!workletP) {
      workletP = (c.audioWorklet ? c.audioWorklet.addModule(WORKLET_URL).then(() => true) : Promise.resolve(false))
        .catch(e => { log('worklet unavailable, using fallback capture:', e.message); return false; });
    }
    workletOk = await workletP;
  }

  async function requestMic() {
    await prepareCapture();
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
      video: false,
    });
  }

  function attachMic(stream, onFrame) {
    if (!g) throw new Error('codec not loaded');
    const c = ensureCtx();
    const track = stream.getAudioTracks()[0];
    const st = track && track.getSettings ? track.getSettings() : {};
    const m = mic = { track, onEnded: null, capCtx: null, source: null, node: null, sink: null, decoder: null };
    let cc = c;
    try { m.source = c.createMediaStreamSource(stream); }
    catch (e) {
      // Firefox refuses a mic stream whose rate differs from the context; capture in a context at the mic's rate.
      if (!st.sampleRate) throw e;
      m.capCtx = cc = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: st.sampleRate });
      m.source = cc.createMediaStreamSource(stream);
    }
    const rate = cc.sampleRate;
    const block = inputBlock(rate);
    m.decoder = createDecoder(g, rate);
    const reb = createReblocker(block, onFrame);
    const useWorklet = workletOk && cc === c;
    if (useWorklet) {
      m.node = new AudioWorkletNode(cc, 'pc-radio-capture', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      m.node.port.onmessage = e => { const a = e.data; lvl = peak(a); reb.push(a); };
    } else {
      m.node = cc.createScriptProcessor(4096, 1, 1);
      m.node.onaudioprocess = e => {
        const a = e.inputBuffer.getChannelData(0);
        lvl = peak(a); reb.push(a);
        e.outputBuffer.getChannelData(0).fill(0);
      };
    }
    m.sink = cc.createGain(); m.sink.gain.value = 0;   // keeps the graph running; nothing is audible
    m.source.connect(m.node); m.node.connect(m.sink); m.sink.connect(cc.destination);
    if (track) { m.onEnded = () => onTrackEnded(); track.addEventListener('ended', m.onEnded); }
    log('listening', JSON.stringify({
      rate, block, capture: useWorklet ? 'worklet' : 'script-processor',
      trackRate: st.sampleRate ?? null, echoCancellation: st.echoCancellation ?? null,
      noiseSuppression: st.noiseSuppression ?? null, autoGainControl: st.autoGainControl ?? null,
    }));
  }

  /** Idempotent: safe after a partial attach, after a full attach, or with nothing attached. */
  function detachMic() {
    const m = mic; mic = null; lvl = 0;
    if (!m) return;
    try { if (m.track && m.onEnded) m.track.removeEventListener('ended', m.onEnded); } catch {}
    try { if (m.node) { if (m.node.port) { m.node.port.postMessage({ stop: true }); m.node.port.onmessage = null; } m.node.onaudioprocess = null; m.node.disconnect(); } } catch {}
    try { m.source && m.source.disconnect(); } catch {}
    try { m.sink && m.sink.disconnect(); } catch {}
    try { m.decoder && m.decoder.free(); } catch {}
    try { m.capCtx && m.capCtx.close(); } catch {}
  }

  function decodeSamples(frame) { return mic && mic.decoder ? mic.decoder.decode(frame) : null; }

  /** Software loopback on this device: encode, "hear" at this rate, decode. Codec evidence only. */
  function softwareLoopback(bytes, protocolName) {
    const c = ensureCtx();
    const wave = encodeWave(bytes, protocolName);
    const rate = c.sampleRate;
    const heard = resample(wave, rate, rate);
    const padded = new Float32Array(Math.round(rate * 0.2) + heard.length + Math.round(rate * 0.6));
    padded.set(heard, Math.round(rate * 0.2));
    const dec = createDecoder(g, rate);
    const found = [];
    const reb = createReblocker(inputBlock(rate), f => { const o = dec.decode(f); if (o) found.push(o); });
    try { for (let s = 0; s < padded.length; s += 128) reb.push(padded.subarray(s, Math.min(s + 128, padded.length))); reb.flush(); }
    finally { dec.free(); }
    return { found, seconds: wave.length / rate, rate };
  }

  return {
    ensureCtx, loadCodec, encodeWave, playTransmission, playCallSign, playMotif,
    requestMic, attachMic, detachMic, decodeSamples, softwareLoopback,
    level: () => lvl,
    get codecReady() { return !!g; },
    get sampleRate() { return ctx ? ctx.sampleRate : null; },
  };
}
