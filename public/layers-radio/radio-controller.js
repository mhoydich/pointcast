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
 *   attachMic(stream, onFrame) / detachMic()            (audio graph; detachMic must be idempotent)
 *   decodeSamples(frame) -> Uint8Array|null             (ggwave decode, one 1024-sample frame)
 *   now(), setTimeout, clearTimeout, log(), onState(kind, text)
 *
 * Every send/preview is an operation with its own token. Stop bumps the token,
 * so an old operation that resumes after an await can neither emit states nor
 * clear the flags of the operation that replaced it. Every Listen request is
 * tagged with a generation the same way.
 */
import { encodeFrame, decodeFrame, createDedup, createLimiter } from '/layers-radio/radio-frame.js';

export const SENDER_STATES = Object.freeze({ PREPARING: 'Preparing', PLAYING: 'Playing', PLAYED: 'Broadcast played' });

export function createRadioController(deps) {
  const {
    seq, encodeWave, playWave, playMotif, requestMic, attachMic, detachMic, decodeSamples,
    now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    setTimeout: st = globalThis.setTimeout, clearTimeout: ct = globalThis.clearTimeout,
    log = () => {}, onState = () => {}, onReceive = () => {},
    sampleRate = 48000, cooldownMs = 800, echoGuardMs = 250,
  } = deps;

  // ---- operations (send / preview) ----
  let nextToken = 0;          // monotonic; a token is never reused, even after Stop
  let op = 0;                 // token of the current operation; 0 = none
  let opKind = null;          // 'send' | 'preview'
  let active = null;          // { token, handle }
  let cooldown = null;        // { token, timer, settle }
  let transmitUntil = 0;

  const busy = () => op !== 0;
  const live = token => token === op;
  const finish = token => { if (live(token)) { op = 0; opKind = null; onState('idle', ''); } };

  function stopOperation() {
    const stale = op;
    op = 0; opKind = null;
    if (active) { try { active.handle.stop(); } catch {} active = null; }
    if (cooldown) { ct(cooldown.timer); const s = cooldown.settle; cooldown = null; s(); }  // settle, never leave pending
    transmitUntil = 0;
    return stale;
  }

  async function send({ mood, text = '', protocol }) {
    if (busy()) return { ok: false, reason: 'busy' };
    const token = ++nextToken; op = token; opKind = 'send';
    try {
      onState('send', SENDER_STATES.PREPARING);
      const bytes = encodeFrame({ alias: seq.alias, messageId: seq.take(), mood, text });
      const wave = encodeWave(bytes, protocol);
      const seconds = wave.length / sampleRate;
      transmitUntil = now() + seconds * 1000 + echoGuardMs; // self-echo guard relative to playback completion
      onState('send', `${SENDER_STATES.PLAYING} ${seconds.toFixed(2)} s`);
      log('send', protocol, `${bytes.length} B`, `${seconds.toFixed(3)} s`, `id ${(bytes[8] << 8) | bytes[9]}`);
      const handle = playWave(wave);
      active = { token, handle };
      await handle.done;
      if (!live(token)) return { ok: false, reason: 'cancelled' };          // Stop happened while playing
      active = null;
      onState('send', `${SENDER_STATES.PLAYED} — no acknowledgement exists`);
      await new Promise(settle => { cooldown = { token, settle, timer: st(settle, cooldownMs) }; });
      if (!live(token)) return { ok: false, reason: 'cancelled' };          // Stop happened during cooldown
      cooldown = null;
      return { ok: true, bytes, seconds };
    } catch (e) {
      if (!live(token)) return { ok: false, reason: 'cancelled' };
      active = null;
      onState('send', 'Send failed: ' + e.message); log('send error', e.message);
      return { ok: false, reason: e.message };
    } finally { finish(token); }
  }

  /** Local only: motif + visual. Never encodes a frame, never touches the modem. */
  async function preview({ mood }) {
    if (busy()) return { ok: false, reason: 'busy' };
    const token = ++nextToken; op = token; opKind = 'preview';
    try {
      onState('preview', 'Preview playing (local only)');
      const handle = playMotif(mood);
      active = { token, handle };
      await handle.done;
      if (!live(token)) return { ok: false, reason: 'cancelled' };
      active = null;
      onState('preview', 'Preview done (local only, nothing was broadcast)');
      return { ok: true };
    } catch (e) {
      if (!live(token)) return { ok: false, reason: 'cancelled' };
      active = null;
      onState('preview', 'Preview failed: ' + e.message);
      return { ok: false, reason: e.message };
    } finally { finish(token); }
  }

  // ---- listen ----
  let gen = 0, pending = null, stream = null, listening = false;
  const dedup = createDedup(256), perAlias = new Map(), global = createLimiter({ rate: 1, burst: 4 });
  const stopTracks = s => { try { s && s.getTracks().forEach(t => { try { t.stop(); } catch {} }); } catch {} };

  async function startListen() {
    if (listening) return { ok: true, reason: 'already' };
    if (pending) return { ok: false, reason: 'pending' };           // serialize permission requests
    const myGen = ++gen;
    onState('listen', 'Asking for the microphone…');
    let s, request;
    try {
      request = requestMic();
      pending = request;
      s = await request;
    } catch (e) {
      if (myGen === gen) onState('listen', micError(e));
      log('mic error', e.name || '', e.message || '');
      return { ok: false, reason: e.name || 'error' };
    } finally { if (pending === request) pending = null; }          // only this request may clear the slot
    if (myGen !== gen) {                                             // Stop/Escape/hidden happened while pending
      stopTracks(s);
      log('late mic grant discarded (generation', myGen, '≠', gen + ')');
      return { ok: false, reason: 'stale' };
    }
    stream = s;
    try { attachMic(s, onFrame); }
    catch (e) {
      try { detachMic(); } catch {}                                  // tear down whatever attach allocated before throwing
      stopTracks(s); stream = null;
      onState('listen', 'Audio setup failed: ' + e.message); log('attach error', e.message);
      return { ok: false, reason: 'attach' };
    }
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
    const hadOp = stopOperation();
    stopListen(reason);
    onState('send', 'Stopped.');
    if (hadOp) onState('idle', '');
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
    get state() {
      return { sending: opKind === 'send', previewing: opKind === 'preview', op, listening, pending: !!pending, gen, transmitting: now() < transmitUntil, activeToken: active ? active.token : 0 };
    },
  };
}

function micError(e) {
  if (e && e.name === 'NotAllowedError') return 'Microphone permission denied. Allow it in the browser and press Listen again.';
  if (e && e.name === 'NotFoundError') return 'No microphone found.';
  return 'Microphone failed: ' + (e && e.message ? e.message : String(e));
}
