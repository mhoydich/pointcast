/** Original, sample-free sounds for Small Shrines. Call start only from a user gesture. */
export type ShrineSound = 'tide' | 'drone' | 'bowl' | 'pulse';
export type ShrineAudioMode = ShrineSound;
export type ShrineAudioState = {
  status: 'idle' | 'starting' | 'playing' | 'error' | 'disposed';
  mode: ShrineSound | null;
  volume: number;
  muted: boolean;
  error: string | null;
};
type AudioOptions = {
  onStateChange?: (state: ShrineAudioState) => void;
  /** Dependency injection also allows the lifecycle to be tested without speakers. */
  contextFactory?: () => AudioContext;
  document?: Document;
};
type Voice = { sources: AudioScheduledSourceNode[]; nodes: AudioNode[]; end: number };
type Session = {
  context: AudioContext;
  master: GainNode;
  nodes: Set<AudioNode>;
  voices: Set<Voice>;
  timer: ReturnType<typeof setInterval> | null;
  timeout: ReturnType<typeof setTimeout> | null;
  cancelStart: (() => void) | null;
  cleanupState: (() => void) | null;
};
const MODES: readonly ShrineSound[] = ['tide', 'drone', 'bowl', 'pulse'];
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function createShrineAudio(options: AudioOptions = {}) {
  const doc = options.document ?? (typeof document === 'undefined' ? undefined : document);
  const win = doc?.defaultView;
  let state: ShrineAudioState = { status: 'idle', mode: null, volume: 0.35, muted: false, error: null };
  let current: Session | null = null;
  let serial = 0;
  let disposed = false;
  const hidden = () => doc?.visibilityState === 'hidden';
  const getState = () => ({ ...state });
  function publish() { options.onStateChange?.(getState()); }
  function stopVoice(session: Session, voice: Voice) {
    session.voices.delete(voice);
    for (const source of voice.sources) { try { source.stop(); } catch { /* Already ended. */ } }
    for (const node of voice.nodes) node.disconnect();
  }
  function release(session: Session) {
    // Disconnect synchronously: a late browser resume can never reconnect this graph.
    session.cleanupState?.(); session.cleanupState = null;
    if (session.timer !== null) clearInterval(session.timer);
    if (session.timeout !== null) clearTimeout(session.timeout);
    session.cancelStart?.(); session.cancelStart = null;
    session.master.gain.cancelScheduledValues(session.context.currentTime);
    session.master.gain.setValueAtTime(0, session.context.currentTime);
    for (const voice of [...session.voices]) stopVoice(session, voice);
    for (const node of session.nodes) node.disconnect();
    session.nodes.clear();
    if (session.context.state !== 'closed') void session.context.close().catch(() => {});
  }
  function clear() {
    ++serial;
    const old = current; current = null;
    if (old) release(old);
  }
  function stop() {
    if (disposed) return;
    clear(); state = { ...state, status: 'idle', mode: null, error: null }; publish();
  }
  function fail(message: string) {
    clear(); state = { ...state, status: 'error', mode: null, error: message }; publish();
  }
  function applyVolume() {
    if (!current) return;
    const gain = current.master.gain, now = current.context.currentTime;
    gain.cancelScheduledValues(now);
    // Initial gain is zero, so the default GainNode gain of 1 never leaks.
    if (state.muted || hidden() || state.volume === 0) gain.setValueAtTime(0, now);
    else gain.setTargetAtTime(state.volume * 0.28, now, 0.025);
  }
  function addVoice(session: Session, sources: AudioScheduledSourceNode[], nodes: AudioNode[], end = Infinity) {
    while (session.voices.size >= 6) stopVoice(session, session.voices.values().next().value!);
    const voice = { sources, nodes, end }; session.voices.add(voice);
    sources[0].addEventListener('ended', () => {
      if (!session.voices.delete(voice)) return;
      for (const node of nodes) node.disconnect();
    }, { once: true });
    return voice;
  }
  function tone(session: Session, frequency: number, duration: number, level: number, glide?: number) {
    const ctx = session.context, now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(frequency, now);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain); gain.connect(session.master);
    addVoice(session, [osc], [osc, gain], now + duration + 0.05);
    osc.start(now); osc.stop(now + duration + 0.05);
  }
  function ambient(session: Session, mode: 'tide' | 'drone') {
    const ctx = session.context, now = ctx.currentTime;
    if (mode === 'tide') {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const data = buffer.getChannelData(0); let smooth = 0;
      for (let i = 0; i < data.length; i++) { smooth = smooth * 0.985 + (Math.random() * 2 - 1) * 0.015; data[i] = smooth * 2.5; }
      // Fade both loop edges to zero to avoid a discontinuity in the generated noise.
      const edge = Math.min(2048, data.length / 2);
      for (let i = 0; i < edge; i++) { data[i] *= i / edge; data[data.length - 1 - i] *= i / edge; }
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      source.buffer = buffer; source.loop = true;
      filter.type = 'lowpass'; filter.frequency.value = 850; filter.Q.value = 0.4;
      gain.gain.value = 0.36; lfo.frequency.value = 0.075; depth.gain.value = 0.20;
      source.connect(filter); filter.connect(gain); gain.connect(session.master);
      lfo.connect(depth); depth.connect(gain.gain);
      addVoice(session, [source, lfo], [source, filter, gain, lfo, depth]);
      source.start(now); lfo.start(now);
    } else {
      for (const [frequency, level, speed] of [[146.83, 0.10, 0.047], [220, 0.065, 0.061]]) {
        const osc = ctx.createOscillator(), gain = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
        osc.frequency.value = frequency; gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(level, now + 1.2);
        lfo.frequency.value = speed; depth.gain.value = level * 0.12;
        osc.connect(gain); gain.connect(session.master); lfo.connect(depth); depth.connect(gain.gain);
        addVoice(session, [osc, lfo], [osc, gain, lfo, depth]); osc.start(now); lfo.start(now);
      }
    }
  }
  function sequence(session: Session, mode: 'bowl' | 'pulse') {
    let next = 0, beat = 0;
    const tick = () => {
      if (current !== session || disposed || hidden() || session.context.state !== 'running') return;
      const now = session.context.currentTime;
      for (const voice of [...session.voices]) if (voice.end <= now) stopVoice(session, voice);
      if (now < next) return;
      // Schedule from now, never catch up missed beats after a background stall.
      next = now + (mode === 'bowl' ? 7.2 : 2.1);
      if (state.muted || state.volume === 0) return;
      if (mode === 'bowl') {
        for (const [frequency, duration, level] of [[220, 5, 0.10], [440.6, 3.8, 0.04], [661.1, 2.9, 0.018]]) tone(session, frequency, duration, level);
      } else {
        tone(session, beat++ % 2 ? 165 : 110, 0.48, 0.12, 65);
      }
    };
    tick(); session.timer = setInterval(tick, 200);
  }
  async function start(mode: ShrineSound): Promise<boolean> {
    if (disposed || hidden()) return false;
    if (!MODES.includes(mode)) { fail('Choose a sound and try again.'); return false; }
    clear(); const attempt = serial;
    state = { ...state, status: 'starting', mode, error: null }; publish();
    let session: Session | null = null;
    try {
      const Audio = win?.AudioContext ?? (win as (Window & { webkitAudioContext?: typeof AudioContext }) | undefined)?.webkitAudioContext;
      const context = options.contextFactory?.() ?? (Audio ? new Audio() : null);
      if (!context) { fail('Sound is unavailable in this browser. The shrine works in silence.'); return false; }
      const master = context.createGain(); master.gain.value = 0;
      session = { context, master, nodes: new Set([master]), voices: new Set(), timer: null, timeout: null, cancelStart: null, cleanupState: null };
      current = session;
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -18; compressor.knee.value = 12; compressor.ratio.value = 5;
      compressor.attack.value = 0.005; compressor.release.value = 0.25;
      session.nodes.add(compressor); master.connect(compressor); compressor.connect(context.destination);
      // Invoke resume synchronously within the activating click, before awaiting anything.
      const ready = context.state === 'running' ? Promise.resolve() : context.resume();
      const cancelled = new Promise<boolean>(resolve => { session!.cancelStart = () => resolve(false); });
      const timedOut = new Promise<boolean>(resolve => { session!.timeout = setTimeout(() => resolve(false), 2500); });
      const running = await Promise.race([ready.then(() => true), cancelled, timedOut]);
      if (session.timeout !== null) clearTimeout(session.timeout);
      session.timeout = null; session.cancelStart = null;
      if (attempt !== serial || current !== session || disposed) return false;
      if (hidden()) { stop(); return false; }
      if (!running || context.state !== 'running') { fail('Sound did not start. Tap Play sound to try again.'); return false; }
      const onState = () => {
        if (current === session && state.status === 'playing' && context.state !== 'running') fail('Sound was interrupted. Tap Play sound to try again.');
      };
      context.addEventListener('statechange', onState);
      session.cleanupState = () => context.removeEventListener('statechange', onState);
      if (mode === 'tide' || mode === 'drone') ambient(session, mode); else sequence(session, mode);
      applyVolume(); state = { ...state, status: 'playing' }; publish(); return true;
    } catch {
      if (attempt === serial && !disposed) fail('Sound did not start. Tap Play sound to try again.');
      else if (session && current !== session && session.context.state !== 'closed') void session.context.close().catch(() => {});
      return false;
    }
  }
  function setVolume(value: number) {
    if (disposed || !Number.isFinite(value)) return;
    state = { ...state, volume: clamp(value) }; applyVolume(); publish();
  }
  function setMuted(value: boolean) {
    if (disposed) return;
    state = { ...state, muted: Boolean(value) }; applyVolume(); publish();
  }
  const onVisibility = () => { if (hidden()) stop(); };
  doc?.addEventListener('visibilitychange', onVisibility);
  win?.addEventListener('pagehide', stop);
  doc?.addEventListener('astro:before-swap', stop);
  function dispose() {
    if (disposed) return;
    clear(); disposed = true;
    doc?.removeEventListener('visibilitychange', onVisibility);
    win?.removeEventListener('pagehide', stop);
    doc?.removeEventListener('astro:before-swap', stop);
    state = { ...state, status: 'disposed', mode: null, error: null }; publish();
  }
  return { start, stop, setVolume, setMuted, dispose, getState };
}
