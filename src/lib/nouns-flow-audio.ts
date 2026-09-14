import { mountNounsFlowMedia } from './nouns-flow-media.ts';

/** Original STARJAM instruments. The game emits the beat clock; audio never runs its own. */
type PlaybackSession = EventTarget & { type: string; readonly state?: string };
const playbackOwners = new WeakMap<PlaybackSession, { previous: string; owners: Set<symbol> }>();

export function mountNounsFlowAudio(root: HTMLElement): () => void {
  if (root.querySelector('[data-flow-track]') && root.querySelector('[data-flow-speaker-test]')) return mountNounsFlowMedia(root);
  const doc = root.ownerDocument, win = doc.defaultView!;
  const lifetime = new win.AbortController(), options = { signal: lifetime.signal };
  const Audio = win.AudioContext ?? (win as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const sound = root.querySelector<HTMLButtonElement>('[data-flow-sound]');
  const volumeControl = root.querySelector<HTMLInputElement>('[data-flow-volume]');
  const haptics = root.querySelector<HTMLButtonElement>('[data-flow-haptics]');
  const testSound = root.querySelector<HTMLButtonElement>('[data-flow-test-sound]');
  type Pace = 'drift' | 'gentle' | 'playful';
  type World = 'garden' | 'rush' | 'shell' | 'storm';
  const bases: Record<World, number> = { garden: 48, rush: 50, shell: 53, storm: 45 };
  const isPace = (value: unknown): value is Pace => value === 'drift' || value === 'gentle' || value === 'playful';
  const isWorld = (value: unknown): value is World => typeof value === 'string' && Object.hasOwn(bases, value);
  let pace: Pace = 'gentle', world: World = 'garden';
  let enabled = true, volume = 35, unavailable = !Audio, closed = false;
  let running = false, ownedRun = false, pendingStart = false, gestureRequired = true;
  let hapticsOn = false, hapticsAvailable = typeof win.navigator.vibrate === 'function';
  let lastBeat = -1, epoch = 0;
  let context: AudioContext | null = null, master: GainNode | null = null, filter: BiquadFilterNode | null = null;
  let unlocking: Promise<boolean> | null = null;
  let unlockSerial = 0, unlockTimer: number | null = null, pendingUnlock = false;
  let startSerial = 0, startTimer: number | null = null, failureSerial = 0, failureTimer: number | null = null;
  const suspendingContexts = new WeakMap<AudioContext, number>();
  let preview = false, previewDialog: HTMLDialogElement | null = null, stoppingSources = false;
  let statusMessage = '', hadRunningContext = false;
  const sessionToken = Symbol('STARJAM playback');
  let ownedSession: PlaybackSession | null = null;
  const watchedSessions = new Set<PlaybackSession>();
  const voices = new Set<{ source: OscillatorNode; gain: GainNode }>();
  const pads = new Set<{ source: OscillatorNode; gain: GainNode }>();
  const hits = new Set<string>();
  const pendingLanes = new Map<number, number>();
  const hidden = () => doc.visibilityState === 'hidden';
  const audible = () => !closed && !hidden() && !gestureRequired && enabled && volume > 0 && context?.state === 'running';
  const pitch = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
  const persist = (key: string, value: string) => { try { win.localStorage.setItem(`pointcast:starjam:${key}`, value); } catch { /* Preferences are optional. */ } };
  try {
    enabled = win.localStorage.getItem('pointcast:starjam:sound') !== 'off';
    const saved = win.localStorage.getItem('pointcast:starjam:volume');
    if (saved !== null && saved.trim() && Number.isFinite(Number(saved))) volume = Math.round(Math.max(0, Math.min(100, Number(saved))));
  } catch { /* No storage is required to play. */ }

  function render() {
    root.dataset.flowAudioState = unavailable ? 'unavailable' : context?.state || 'locked';
    const output = unavailable ? 'unavailable' : !enabled ? 'muted' : !volume ? 'zero-volume' : pendingUnlock ? 'starting'
      : audible() && (voices.size || pads.size) ? preview ? 'test' : 'playing' : 'idle';
    root.dataset.flowAudioOutput = output;
    const status = root.querySelector('[data-flow-audio-status]');
    if (status) status.textContent = statusMessage || (output === 'unavailable' ? 'Audio is unavailable in this browser.'
      : output === 'muted' ? 'Sound is muted. Turn sound on, then tap Test sound.'
      : output === 'zero-volume' ? 'Volume is zero. Raise it, then tap Test sound.'
      : output === 'starting' ? 'Starting audio…'
      : output === 'test' ? 'Playing three test notes. Check your media volume and audio output if you hear nothing.'
      : output === 'playing' ? 'Game sound is active.' : 'No sound is playing. Tap Test sound to check this device.');
    if (testSound) testSound.disabled = unavailable || running || root.dataset.state === 'playing';
    root.dataset.flowAudioPace = pace; root.dataset.flowAudioWorld = world;
    root.dataset.flowHaptics = hapticsAvailable ? hapticsOn ? 'on' : 'off' : 'unavailable';
    if (sound) {
      sound.disabled = unavailable; sound.textContent = '♪';
      sound.setAttribute('aria-pressed', String(enabled && !unavailable));
      sound.setAttribute('aria-label', unavailable ? 'Sound unavailable' : enabled ? 'Mute STARJAM sound' : 'Enable STARJAM sound');
      sound.title = unavailable ? 'Sound unavailable in this browser' : enabled ? 'Sound on' : 'Sound off';
    }
    if (volumeControl) {
      volumeControl.disabled = unavailable; volumeControl.min = '0'; volumeControl.max = '100'; volumeControl.step = '1'; volumeControl.value = String(volume);
      volumeControl.setAttribute('aria-valuetext', `${volume} percent`);
    }
    const readout = root.querySelector('[data-flow-volume-value]'); if (readout) readout.textContent = `${volume}%`;
    if (haptics) {
      haptics.disabled = !hapticsAvailable;
      haptics.textContent = `Haptic taps · ${!hapticsAvailable ? 'unavailable' : hapticsOn ? 'on' : 'off'}`;
      haptics.setAttribute('aria-pressed', String(hapticsOn));
      haptics.setAttribute('aria-label', hapticsOn ? 'Disable haptic taps' : 'Enable haptic taps');
    }
    const note = root.querySelector('[data-flow-haptics-note]');
    if (note) note.textContent = !hapticsAvailable ? 'Haptics are unavailable in this browser or device.' : hapticsOn ? 'On for your hits. Requires device vibration hardware.' : 'Optional on devices with vibration hardware.';
  }
  function claimPlayback() {
    try {
      const session = (win.navigator as Navigator & { audioSession?: PlaybackSession }).audioSession;
      if (!session || typeof session.type !== 'string') return;
      if (!watchedSessions.has(session)) {
        session.addEventListener?.('statechange', () => {
          if (!closed && ownedSession === session && !gestureRequired && session.state === 'interrupted') audioFailed('interrupted');
        }, options);
        watchedSessions.add(session);
      }
      const currentType = session.type;
      const existing = playbackOwners.get(session);
      if (existing && currentType === 'playback') {
        existing.owners.add(sessionToken); ownedSession = session; return;
      }
      // Do not replace an explicit recording or other app's exclusive session.
      if (!['auto', 'ambient', 'playback'].includes(currentType)) return;
      session.type = 'playback';
      if (session.type !== 'playback') return; // Some browsers silently reject the assignment.
      playbackOwners.set(session, { previous: currentType, owners: new Set([sessionToken]) });
      ownedSession = session;
    } catch { /* Older browsers may expose an unusable Audio Session API. Web Audio can still work. */ }
  }
  function releasePlayback() {
    const session = ownedSession; ownedSession = null;
    if (!session) return;
    const lease = playbackOwners.get(session);
    if (!lease || !lease.owners.delete(sessionToken) || lease.owners.size) return;
    playbackOwners.delete(session);
    try { if (session.type === 'playback' && lease.previous !== 'playback') session.type = lease.previous; }
    catch { /* Never overwrite a newer type or fail cleanup on an unsupported setter. */ }
  }
  function clearUnlockTimer() { if (unlockTimer !== null) win.clearTimeout(unlockTimer); unlockTimer = null; }
  function clearStart() { ++startSerial; pendingStart = false; if (startTimer !== null) win.clearTimeout(startTimer); startTimer = null; }
  function clearFailure() { ++failureSerial; if (failureTimer !== null) win.clearTimeout(failureTimer); failureTimer = null; }
  function suspendContext(current: AudioContext) {
    suspendingContexts.set(current, (suspendingContexts.get(current) || 0) + 1);
    const settled = () => {
      const count = (suspendingContexts.get(current) || 1) - 1;
      if (count) suspendingContexts.set(current, count); else suspendingContexts.delete(current);
    };
    try { void current.suspend().then(settled, settled); } catch { settled(); }
  }
  function audioFailed(reason: 'interrupted' | 'resume-failed') {
    if (closed) return;
    const pauseGame = (running && ownedRun) || pendingStart || root.dataset.state === 'playing';
    stopRun();
    statusMessage = reason === 'interrupted' ? 'Sound was interrupted. Tap Test sound or Resume jam to try again.' : 'Audio could not start. Tap Test sound to try again.';
    render();
    if (pauseGame) {
      const failure = ++failureSerial;
      failureTimer = win.setTimeout(() => {
        if (failure !== failureSerial) return;
        failureTimer = null;
        if (!closed && root.dataset.state === 'playing') root.dispatchEvent(new win.CustomEvent('nouns-flow:audio-interrupted', { bubbles: true, detail: Object.freeze({ reason }) }));
      }, 0);
    }
  }
  function contextChanged(current: AudioContext) {
    if (closed || !context || context !== current) return;
    const state = String(context.state);
    if (state === 'running') hadRunningContext = true;
    const hasAudioIntent = (running && ownedRun) || preview || voices.size > 0 || pads.size > 0;
    if (hasAudioIntent && !gestureRequired && (state === 'interrupted' || (state === 'suspended' && hadRunningContext && !pendingUnlock))) audioFailed('interrupted');
    else render();
  }
  function sourcesEnded() {
    if (stoppingSources || voices.size || pads.size || running || closed) return;
    if (preview) { preview = false; previewDialog = null; statusMessage = 'Test finished. Tap Test sound to play it again.'; }
    releasePlayback(); render();
  }
  function stopHaptics() { if (typeof win.navigator.vibrate === 'function') { try { win.navigator.vibrate(0); } catch { /* Nothing left to stop. */ } } }
  function pulse(lane: number, perfect: boolean) {
    const at = pendingLanes.get(lane); pendingLanes.delete(lane);
    if (!hapticsOn || !hapticsAvailable || !running || !ownedRun || closed || hidden() || at === undefined || win.performance.now() - at > 500) return;
    try { if (win.navigator.vibrate(perfect ? 12 : 8) === false) { hapticsAvailable = false; hapticsOn = false; render(); } }
    catch { hapticsAvailable = false; hapticsOn = false; render(); }
  }
  function stopSource(voice: { source: OscillatorNode; gain: GainNode }) {
    try { voice.source.stop(); } catch { /* Already stopped. */ }
    voice.source.disconnect(); voice.gain.disconnect();
  }
  function stopPads() { for (const voice of pads) stopSource(voice); pads.clear(); }
  function stopAll() {
    ++epoch; stoppingSources = true; stopPads();
    for (const voice of [...voices]) stopSource(voice);
    voices.clear(); stoppingSources = false;
  }
  function applyVolume() {
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(enabled && !hidden() ? 1.2 * volume / 100 : 0, context.currentTime);
  }
  function suspendAudio() {
    ++unlockSerial; clearUnlockTimer(); clearStart(); clearFailure(); pendingUnlock = false; gestureRequired = true;
    preview = false; previewDialog = null; stopAll(); pendingLanes.clear(); stopHaptics(); releasePlayback();
    if (context && master) master.gain.setValueAtTime(0, context.currentTime);
    if (context) suspendContext(context);
  }
  function stopRun() { running = false; ownedRun = false; pendingStart = false; suspendAudio(); render(); }
  function startPads() {
    if (!running || !ownedRun || !audible() || !context || !master || pads.size) return;
    for (const offset of [0, 7]) {
      const source = context.createOscillator(), gain = context.createGain();
      source.type = 'sine'; source.frequency.setValueAtTime(pitch(bases[world] + offset), context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(pace === 'drift' ? 0.026 : 0.017, context.currentTime + 0.6);
      source.connect(gain); gain.connect(master); pads.add({ source, gain }); source.start();
    }
  }
  // Only callers handling trusted player gestures may invoke unlock().
  function unlock(): Promise<boolean> {
    if (closed || hidden() || unavailable || !Audio || !enabled || !volume) return Promise.resolve(false);
    const attempt = ++unlockSerial; clearUnlockTimer(); clearFailure();
    gestureRequired = false;
    try {
      claimPlayback(); // iOS media playback must be requested before creating or resuming Web Audio.
      if (attempt !== unlockSerial) return Promise.resolve(false);
      if (context && suspendingContexts.has(context)) {
        // A pending suspend may still report running. A fresh context keeps retry
        // wholly inside this trusted gesture instead of resuming asynchronously.
        const previous = context; context = null; stopAll();
        master?.disconnect(); filter?.disconnect(); master = null; filter = null;
        void previous.close().catch(() => {});
      }
      if (!context) {
        context = new Audio(); const created = context;
        hadRunningContext = false; context.addEventListener('statechange', () => contextChanged(created), options);
        master = context.createGain(); filter = context.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 2800; filter.Q.value = 0.3;
        master.connect(filter); filter.connect(context.destination);
      }
      const current = context;
      applyVolume();
      pendingUnlock = current.state !== 'running';
      const ready = current.state === 'running' ? Promise.resolve() : current.resume();
      if (pendingUnlock) unlockTimer = win.setTimeout(() => { if (attempt === unlockSerial) audioFailed('resume-failed'); }, 2000);
      unlocking = ready.then(() => {
        if (closed || current !== context) { if (current.state !== 'closed') void current.close().catch(() => {}); return false; }
        if (attempt !== unlockSerial) { if (gestureRequired || !enabled || hidden()) suspendContext(current); return false; }
        clearUnlockTimer(); pendingUnlock = false;
        if (!audible()) { audioFailed('resume-failed'); return false; }
        startPads(); render(); return true;
      }, () => { if (attempt === unlockSerial) audioFailed('resume-failed'); return false; });
      return unlocking;
    } catch {
      audioFailed('resume-failed');
      const failed = context; context = null; master?.disconnect(); filter?.disconnect(); master = null; filter = null;
      void failed?.close().catch(() => {}); render(); return Promise.resolve(false);
    }
  }
  function whenReady(effect: () => void) {
    const version = epoch, requestedAt = win.performance.now();
    if (audible()) effect();
    else if (unlocking) void unlocking.then(ready => { if (ready && version === epoch && audible() && win.performance.now() - requestedAt < 250) effect(); });
  }
  function note(midi: number, duration: number, level: number, delay = 0, wave: OscillatorType = 'triangle', hold = 0) {
    if (!audible() || !context || !master) return;
    while (voices.size >= 6) { const old = voices.values().next().value!; voices.delete(old); stopSource(old); }
    const source = context.createOscillator(), gain = context.createGain(), at = context.currentTime + delay;
    source.type = wave; source.frequency.setValueAtTime(pitch(midi), at);
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(Math.min(0.1, level), at + 0.008);
    if (hold) gain.gain.setValueAtTime(Math.min(0.1, level), at + Math.min(hold, duration - 0.02));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(gain); gain.connect(master);
    const voice = { source, gain }; voices.add(voice);
    source.addEventListener('ended', () => { const currentVoice = voices.delete(voice); source.disconnect(); gain.disconnect(); if (currentVoice) sourcesEnded(); }, { once: true });
    source.start(at); source.stop(at + duration + 0.01);
    render();
  }
  function detail(event: Event): Record<string, unknown> | null {
    const value = (event as CustomEvent<unknown>).detail;
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  }
  function theme(value: Record<string, unknown>) { if (isPace(value.pace)) pace = value.pace; if (isWorld(value.world)) world = value.world; }
  function laneGesture(lane: number) {
    if (closed || hidden()) return;
    if (running && ownedRun) pendingLanes.set(lane, win.performance.now());
    unlock();
  }
  function cancelPreview() {
    if (!preview) return;
    suspendAudio(); statusMessage = 'Test stopped. Tap Test sound to try again.'; render();
  }
  function playTest(target: HTMLButtonElement) {
    if (running || root.dataset.state === 'playing') { statusMessage = 'Pause the jam before testing sound.'; render(); return; }
    statusMessage = '';
    if (!enabled || !volume || unavailable) { render(); return; }
    stopAll(); preview = true; previewDialog = target.closest('dialog');
    // A cold iPhone audio route may need more than the 250ms allowed for game beat cues.
    const ready = unlock(), version = epoch; render();
    void ready.then(ok => {
      if (!ok || closed || !preview || version !== epoch || !audible()) return;
      for (const [index, midi] of [72, 76, 79].entries()) note(midi, 0.42, 0.09, index * 0.28, 'sine', 0.12);
      render();
    });
  }
  root.addEventListener('pointerdown', event => {
    const target = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('[data-flow-lane]') : null;
    if (!event.isTrusted || event.button !== 0 || !target || target.disabled || root.querySelector('dialog[open]')) return;
    const lane = Number(target.dataset.flowLane); if (Number.isInteger(lane) && lane >= 0 && lane < 3) laneGesture(lane);
  }, { ...options, capture: true });
  root.addEventListener('click', event => {
    const target = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!event.isTrusted || !target || target.disabled || closed || hidden()) return;
    if (target.matches('[data-flow-test-sound]')) playTest(target);
    else if (target.matches('[data-flow-start]')) {
      if (root.dataset.state === 'playing') return; // The main control is Pause while a run is active.
      statusMessage = ''; cancelPreview(); statusMessage = '';
      clearStart(); const start = startSerial; pendingStart = true;
      startTimer = win.setTimeout(() => {
        if (start !== startSerial) return;
        startTimer = null;
        if (pendingStart) { pendingStart = false; if (!running && !preview) suspendAudio(); }
      }, 0);
      unlock();
    } else if (target.matches('[data-flow-sound]') && !unavailable) {
      statusMessage = ''; enabled = !enabled; persist('sound', enabled ? 'on' : 'off');
      if (!enabled) suspendAudio(); else if (running && ownedRun) unlock();
      render();
    } else if (target.matches('[data-flow-haptics]') && hapticsAvailable) {
      hapticsOn = !hapticsOn; pendingLanes.clear(); if (!hapticsOn) stopHaptics(); render();
    }
  }, { ...options, capture: true });
  doc.addEventListener('keydown', event => {
    if (!event.isTrusted || event.repeat || event.altKey || event.ctrlKey || event.metaKey || closed || hidden() || root.querySelector('dialog[open]')) return;
    const target = event.target instanceof win.Element ? event.target : null;
    if (target?.closest('input,textarea,select,[contenteditable=true]')) return;
    const lane = ({ d: 0, f: 1, j: 2, '1': 0, '2': 1, '3': 2 } as Record<string, number>)[event.key.toLowerCase()];
    const pad = lane === undefined ? null : root.querySelector<HTMLButtonElement>(`[data-flow-lane="${lane}"]`);
    if (pad && !pad.disabled) laneGesture(lane);
  }, { ...options, capture: true });
  volumeControl?.addEventListener('input', () => {
    if (!Number.isFinite(Number(volumeControl.value))) { render(); return; }
    statusMessage = ''; volume = Math.round(Math.max(0, Math.min(100, Number(volumeControl.value)))); persist('volume', String(volume));
    applyVolume(); if (!volume) suspendAudio(); render();
  }, options);
  root.querySelector<HTMLSelectElement>('[data-flow-pace]')?.addEventListener('change', event => {
    const control = event.currentTarget as HTMLSelectElement;
    if (!control.disabled && isPace(control.value)) { pace = control.value; stopPads(); startPads(); render(); }
  }, options);
  root.addEventListener('nouns-flow:start', event => {
    const value = detail(event); if (!value || !pendingStart || closed || hidden()) return;
    theme(value); stopAll(); pendingLanes.clear();
    if (value.resumed !== true) { lastBeat = -1; hits.clear(); }
    clearStart(); running = true; ownedRun = true; whenReady(startPads); render();
  }, options);
  root.addEventListener('nouns-flow:beat', event => {
    const value = detail(event); if (!value || !running || !ownedRun || hidden()) return;
    const index = value.index;
    if (!Number.isInteger(index) || Number(index) < 0 || Number(index) > 256 || Number(index) <= lastBeat) return;
    lastBeat = Number(index); theme(value);
    whenReady(() => {
      if (Number(index) !== lastBeat) return; // Never catch up old beats after a delayed browser resume.
      startPads(); const base = bases[world];
      if (pace === 'drift') { if (lastBeat % 2 === 0) note(base + 12, 0.23, 0.027, 0, 'sine'); }
      else { note(base + (lastBeat % 4 === 0 ? 0 : 7), 0.11, pace === 'playful' ? 0.064 : 0.04); if (pace === 'playful') note(base + 31, 0.025, 0.012, 0, 'sine'); }
    });
  }, options);
  root.addEventListener('nouns-flow:hit', event => {
    const value = detail(event); if (!value || !running || !ownedRun || hidden()) return;
    const lane = value.lane, grade = value.grade, combo = value.combo, elapsed = value.elapsedMs;
    if (!Number.isInteger(lane) || Number(lane) < 0 || Number(lane) > 2 || !['perfect', 'good'].includes(String(grade))
      || !Number.isInteger(combo) || Number(combo) < 0 || Number(combo) > 256 || !Number.isFinite(elapsed) || Number(elapsed) < 0) return;
    const key = `${elapsed}:${lane}`; if (hits.has(key)) return;
    hits.add(key); if (hits.size > 64) hits.delete(hits.values().next().value!);
    theme(value); pulse(Number(lane), grade === 'perfect');
    whenReady(() => {
      const base = bases[world] + 12 + [0, 4, 7][Number(lane)];
      note(base, pace === 'drift' ? 0.35 : 0.22, pace === 'drift' ? 0.045 : 0.075, 0, pace === 'playful' ? 'triangle' : 'sine');
      if (grade === 'perfect') note(base + 12, 0.13, 0.025, 0.025, 'sine');
      if (Number(combo) > 0 && Number(combo) % 8 === 0) { note(base + 7, 0.16, 0.035, 0.07, 'sine'); note(base + 12, 0.22, 0.03, 0.14, 'sine'); }
    });
  }, options);
  root.addEventListener('nouns-flow:miss', event => {
    const value = detail(event); if (!value || !running || !ownedRun) return;
    pendingLanes.delete(Number(value.lane)); theme(value);
    whenReady(() => note(bases[world], 0.1, 0.022, 0, 'sine'));
  }, options);
  root.addEventListener('nouns-flow:pause', stopRun, options);
  root.addEventListener('nouns-flow:finish', event => {
    const value = detail(event); if (!value || !running || !ownedRun || !['won', 'lost'].includes(String(value.status))) return;
    theme(value); running = false; ownedRun = false; pendingLanes.clear(); stopHaptics(); stopAll();
    whenReady(() => {
      const base = bases[world] + 12;
      for (const [index, offset] of (value.status === 'won' ? [0, 4, 7, 12] : [7, 4, 0]).entries()) note(base + offset, 0.23, 0.044, index * 0.12, 'sine');
    }); render();
  }, options);
  root.addEventListener('nouns-flow:world', event => { const value = detail(event); stopRun(); if (value) theme(value); lastBeat = -1; hits.clear(); render(); }, options);
  const dialogs = new win.MutationObserver(() => { if (preview && previewDialog && !previewDialog.open) cancelPreview(); });
  root.querySelectorAll('dialog').forEach(dialog => {
    dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    dialog.addEventListener('close', cancelPreview, options);
    dialog.addEventListener('cancel', cancelPreview, options);
  });
  doc.addEventListener('visibilitychange', () => { if (hidden()) stopRun(); render(); }, options);
  win.addEventListener('pagehide', stopRun, options);
  render();
  return () => {
    if (closed) return;
    closed = true; lifetime.abort(); dialogs.disconnect(); ++unlockSerial; clearUnlockTimer(); clearStart(); clearFailure(); pendingUnlock = false;
    preview = false; previewDialog = null; stopAll(); pendingLanes.clear(); stopHaptics(); releasePlayback();
    master?.disconnect(); filter?.disconnect(); const previous = context;
    context = null; master = null; filter = null; void previous?.close().catch(() => {}); render();
  };
}
