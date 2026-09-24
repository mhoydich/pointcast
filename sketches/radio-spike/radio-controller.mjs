/**
 * Radio harness controller: send / preview / listen state machine with all
 * browser primitives injected, so it runs under node:test with stubs.
 *
 * deps:
 *   seq            createSequence(...) instance (alias + message ids)
 *   encodeWave(bytes, protocol) -> Float32Array        (modem; Send only)
 *   playWave(wave) -> { done: Promise, stop() }         (speakers)
 *   playMotif(moodId) -> { done: Promise, stop() }      (local motif; Preview only, no bytes)
 *   requestMic() -> Promise<stream>                     (getUserMedia)
 *   attachMic(stream, onFrame) / detachMic()            (audio graph)
 *   decodeSamples(frame) -> Uint8Array|null             (ggwave decode, one 1024-sample frame)
 *   now(), setTimeout, clearTimeout, log(), onState(kind, text)
 */
import { encodeFrame, decodeFrame, createDedup, createLimiter } from './radio-frame.mjs';

export const SENDER_STATES = Object.freeze({ PREPARING: 'Preparing', PLAYING: 'Playing', PLAYED: 'Broadcast played' });

export function createRadioController(deps) {
  const {
    seq, encodeWave, playWave, playMotif, requestMic, attachMic, detachMic, decodeSamples,
    now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    setTimeout: st = globalThis.setTimeout, clearTimeout: ct = globalThis.clearTimeout,
    log = () => {}, onState = () => {}, onReceive = () => {},
    sampleRate = 48000, cooldownMs = 800, echoGuardMs = 250,
  } = deps;

  let sending = false, previewing = false, active = null, cooldown = 0, transmitUntil = 0;
  let gen = 0, pending = null, stream = null, listening = false;
  const dedup = createDedup(256), perAlias = new Map(), global = createLimiter({ rate: 1, burst: 4 });

  const stopTracks = s => { try { s && s.getTracks().forEach(t => { try { t.stop(); } catch {} }); } catch {} };

  async function send({ mood, text = '', protocol }) {
    if (sending || previewing) return { ok: false, reason: 'busy' };
    sending = true;
    try {
      onState('send', SENDER_STATES.PREPARING);
      const bytes = encodeFrame({ alias: seq.alias, messageId: seq.take(), mood, text });
      const wave = encodeWave(bytes, protocol);
      const seconds = wave.length / sampleRate;
      transmitUntil = now() + seconds * 1000 + echoGuardMs; // self-echo guard relative to playback completion
      onState('send', `${SENDER_STATES.PLAYING} ${seconds.toFixed(2)} s`);
      log('send', protocol, `${bytes.length} B`, `${seconds.toFixed(3)} s`, `id ${(bytes[8] << 8) | bytes[9]}`);
      active = playWave(wave);
      await active.done;
      active = null;
      onState('send', `${SENDER_STATES.PLAYED} — no acknowledgement exists`);
      await new Promise(res => { cooldown = st(res, cooldownMs); });
      return { ok: true, bytes, seconds };
    } catch (e) {
      onState('send', 'Send failed: ' + e.message); log('send error', e.message);
      return { ok: false, reason: e.message };
    } finally { sending = false; cooldown = 0; onState('idle', ''); }
  }

  /** Local only: motif + visual. Never encodes a frame, never touches the modem. */
  async function preview({ mood }) {
    if (sending || previewing) return { ok: false, reason: 'busy' };
    previewing = true;
    try {
      onState('preview', 'Preview playing (local only)');
      active = playMotif(mood);
      await active.done;
      active = null;
      onState('preview', 'Preview done (local only, nothing was broadcast)');
      return { ok: true };
    } catch (e) {
      onState('preview', 'Preview failed: ' + e.message);
      return { ok: false, reason: e.message };
    } finally { previewing = false; onState('idle', ''); }
  }

  async function startListen() {
    if (listening) return { ok: true, reason: 'already' };
    if (pending) return { ok: false, reason: 'pending' };           // serialize permission requests
    const myGen = ++gen;
    onState('listen', 'Asking for the microphone…');
    let s;
    try {
      pending = requestMic();
      s = await pending;
    } catch (e) {
      if (myGen === gen) onState('listen', micError(e));
      log('mic error', e.name || '', e.message || '');
      return { ok: false, reason: e.name || 'error' };
    } finally { if (myGen === gen || pending) pending = null; }
    if (myGen !== gen) {                                             // Stop/Escape/hidden happened while pending
      stopTracks(s);
      log('late mic grant discarded (generation', myGen, '≠', gen + ')');
      return { ok: false, reason: 'stale' };
    }
    stream = s;
    try { attachMic(s, onFrame); }
    catch (e) { stopTracks(s); stream = null; onState('listen', 'Audio setup failed: ' + e.message); return { ok: false, reason: 'attach' }; }
    listening = true;
    onState('listen', 'Listening (mic open)');
    return { ok: true };
  }

  function stopListen(reason) {
    gen++;                                                           // invalidate any pending request
    pending = null;
    if (!listening && !stream) { return false; }
    try { detachMic(); } catch {}
    stopTracks(stream);
    stream = null; listening = false;
    onState('listen', `Mic closed${reason ? ' (' + reason + ')' : ''}.`);
    log('listen stopped', reason || '');
    return true;
  }

  function stopRadio(reason) {
    try { active && active.stop(); } catch {}
    active = null; transmitUntil = 0;
    if (cooldown) { ct(cooldown); cooldown = 0; }
    stopListen(reason);
    sending = false; previewing = false;
    onState('send', 'Stopped.');
  }

  function onFrame(frame) {
    if (now() < transmitUntil) return;                               // ignore our own burst
    let r;
    try { r = decodeSamples(frame); } catch (e) { log('decode error', e.message); return; }
    if (!r || !r.length) return;
    handleDecoded(new Uint8Array(r));
  }

  function handleDecoded(bytes) {
    let d;
    try { d = decodeFrame(bytes); } catch (e) { log('rejected frame', e.code); return { accepted: false, reason: e.code }; }
    if (!dedup.accept(d.alias, d.messageId)) { log('duplicate suppressed', d.alias, d.messageId); return { accepted: false, reason: 'duplicate' }; }
    if (!global.allow(now())) { log('global rate limit dropped'); return { accepted: false, reason: 'global_limit' }; }
    if (!perAlias.has(d.alias)) perAlias.set(d.alias, createLimiter({ rate: 0.5, burst: 3 }));
    if (!perAlias.get(d.alias).allow(now())) { log('alias rate limit dropped', d.alias); return { accepted: false, reason: 'alias_limit' }; }
    onReceive(d, bytes);
    return { accepted: true, frame: d };
  }

  return {
    send, preview, startListen, stopListen, stopRadio, handleDecoded,
    get state() { return { sending, previewing, listening, pending: !!pending, gen, transmitting: now() < transmitUntil }; },
  };
}

function micError(e) {
  if (e && e.name === 'NotAllowedError') return 'Microphone permission denied. Allow it in the browser and press Listen again.';
  if (e && e.name === 'NotFoundError') return 'No microphone found.';
  return 'Microphone failed: ' + (e && e.message ? e.message : String(e));
}
