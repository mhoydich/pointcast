/** Original Web Audio soundscapes. Audio unlock and haptic opt-in require trusted gestures. */
export function mountCoGamesAudio(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const lifetime = new win.AbortController();
  const options = { signal: lifetime.signal };
  const AudioContextClass = win.AudioContext ?? (win as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const button = root.querySelector<HTMLButtonElement>('[data-sound]');
  const moodSelect = root.querySelector<HTMLSelectElement>('[data-sound-mood]');
  const volumeInput = root.querySelector<HTMLInputElement>('[data-volume]');
  const hapticsButton = root.querySelector<HTMLButtonElement>('[data-haptics]');
  const hapticsNote = root.querySelector<HTMLElement>('[data-haptics-note]');
  type Mood = 'drift' | 'gentle' | 'playful';
  type World = 'garden' | 'rush' | 'shell' | 'storm';
  type Turn = { human: 'ember' | 'root' | 'focus'; support: 'echo' | 'ward' | 'mend'; round: number; taken: number; healing: number; status: 'playing' | 'won' | 'lost'; combo?: { name: string } | null };
  const palettes: Record<World, { midi: number; name: string }> = {
    garden: { midi: 48, name: 'forest' }, rush: { midi: 50, name: 'diner' },
    shell: { midi: 53, name: 'tide' }, storm: { midi: 45, name: 'moon' },
  };
  const worldId = (value: unknown): World => typeof value === 'string' && Object.hasOwn(palettes, value) ? value as World : 'garden';
  let world = worldId(root.dataset.encounter);
  let mood: Mood = 'gentle';
  let volume = 35;
  let enabled = true;
  let unavailable = !AudioContextClass;
  let closed = false;
  let gestureRequired = true;
  let epoch = 0;
  let lastRound = 0;
  let ownedRound: number | null = null;
  let hapticsEnabled = false;
  let hapticsAvailable = typeof win.navigator.vibrate === 'function';
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let noise: AudioBuffer | null = null;
  let unlocking: Promise<boolean> | null = null;
  const timers = new Set<number>();
  const voices = new Set<{ source: AudioScheduledSourceNode; gain: GainNode }>();
  const pads = new Set<{ source: OscillatorNode; gain: GainNode; lfo: OscillatorNode; depth: GainNode }>();
  const pitch = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
  const hidden = () => doc.visibilityState === 'hidden';
  const audible = () => !closed && !hidden() && !gestureRequired && enabled && volume > 0 && context?.state === 'running';
  const persist = (key: string, value: string) => { try { win.localStorage.setItem(`pointcast:co-games:${key}`, value); } catch { /* Optional persistence. */ } };
  try {
    enabled = win.localStorage.getItem('pointcast:co-games:sound') !== 'off';
    const savedMood = win.localStorage.getItem('pointcast:co-games:sound-mood');
    if (savedMood === 'drift' || savedMood === 'gentle' || savedMood === 'playful') mood = savedMood;
    const savedVolume = win.localStorage.getItem('pointcast:co-games:volume');
    if (savedVolume !== null && savedVolume.trim() && Number.isFinite(Number(savedVolume))) volume = Math.round(Math.max(0, Math.min(100, Number(savedVolume))));
  } catch { /* Sound works without storage. */ }

  function render() {
    root.dataset.audioState = unavailable ? 'unavailable' : context?.state || 'locked';
    root.dataset.soundMood = mood;
    root.dataset.audioWorld = palettes[world].name;
    root.dataset.haptics = hapticsAvailable ? hapticsEnabled ? 'on' : 'off' : 'unavailable';
    if (button) {
      button.disabled = unavailable;
      button.setAttribute('aria-pressed', String(enabled && !unavailable));
      button.textContent = '♪';
      button.setAttribute('aria-label', unavailable ? 'Sound is unavailable in this browser' : enabled ? 'Sound on. Mute game sounds' : 'Sound off. Enable game sounds');
      button.title = unavailable ? 'Sound is unavailable in this browser' : enabled ? 'Mute game sounds' : 'Enable game sounds';
    }
    if (moodSelect) { moodSelect.value = mood; moodSelect.disabled = unavailable; }
    if (volumeInput) {
      volumeInput.min = '0'; volumeInput.max = '100'; volumeInput.step = '1'; volumeInput.value = String(volume); volumeInput.disabled = unavailable;
      volumeInput.setAttribute('aria-valuetext', `${volume} percent`);
    }
    const readout = root.querySelector('[data-volume-value]'); if (readout) readout.textContent = `${volume}%`;
    if (hapticsButton) {
      hapticsButton.disabled = !hapticsAvailable;
      hapticsButton.textContent = `Haptic taps · ${!hapticsAvailable ? 'unavailable' : hapticsEnabled ? 'on' : 'off'}`;
      hapticsButton.setAttribute('aria-pressed', String(hapticsEnabled));
      hapticsButton.setAttribute('aria-label', hapticsEnabled ? 'Disable gentle haptics' : 'Enable gentle haptics');
    }
    if (hapticsNote) hapticsNote.textContent = !hapticsAvailable ? 'Haptics are unavailable in this browser or device.'
      : hapticsEnabled ? 'Gentle haptics on. Requires device vibration hardware.' : 'Haptics off. Optional on devices with vibration hardware.';
  }
  function stopHaptics() { if (typeof win.navigator.vibrate === 'function') { try { win.navigator.vibrate(0); } catch { /* No vibration to stop. */ } } }
  function pulse(pattern: number | number[]) {
    if (!hapticsEnabled || !hapticsAvailable || closed || hidden()) return;
    try {
      if (win.navigator.vibrate(pattern) === false) { hapticsAvailable = false; hapticsEnabled = false; render(); }
    } catch { hapticsAvailable = false; hapticsEnabled = false; render(); }
  }
  function stopVoice(voice: { source: AudioScheduledSourceNode; gain: GainNode }) {
    voices.delete(voice);
    try { voice.source.stop(); } catch { /* Already ended. */ }
    voice.source.disconnect(); voice.gain.disconnect();
  }
  function stopEffects() {
    ++epoch;
    for (const timer of timers) win.clearTimeout(timer);
    timers.clear();
    for (const voice of [...voices]) stopVoice(voice);
  }
  function stopAmbient() {
    for (const pad of pads) {
      try { pad.source.stop(); pad.lfo.stop(); } catch { /* Already silent. */ }
      pad.source.disconnect(); pad.lfo.disconnect(); pad.gain.disconnect(); pad.depth.disconnect();
    }
    pads.clear();
  }
  function stopAll() { stopEffects(); stopAmbient(); }
  function applyVolume() {
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(enabled && !hidden() ? 0.28 * volume / 100 : 0, context.currentTime);
  }
  function suspend() {
    gestureRequired = true; stopAll(); ownedRound = null; stopHaptics();
    if (master && context) master.gain.setValueAtTime(0, context.currentTime);
    void context?.suspend().catch(() => {});
  }
  function startAmbient() {
    if (!audible() || !context || !master || pads.size) return;
    const base = palettes[world].midi;
    for (let index = 0; index < 2; index++) {
      const source = context.createOscillator(), gain = context.createGain();
      const lfo = context.createOscillator(), depth = context.createGain();
      source.type = mood === 'playful' && index === 1 ? 'triangle' : 'sine';
      source.frequency.setValueAtTime(pitch(base + (index ? 7 : 0)), context.currentTime);
      lfo.type = 'sine'; lfo.frequency.setValueAtTime(index ? 0.061 : 0.043, context.currentTime);
      const level = (mood === 'drift' ? 0.035 : mood === 'gentle' ? 0.022 : 0.015) * (index ? 0.7 : 1);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(level, context.currentTime + 1.4);
      depth.gain.setValueAtTime(level * 0.15, context.currentTime);
      source.connect(gain); gain.connect(master); lfo.connect(depth); depth.connect(gain.gain);
      pads.add({ source, gain, lfo, depth });
      source.start(); lfo.start();
    }
  }
  // resume() is invoked synchronously only from a trusted click, key, or audio-control change.
  function unlock(): Promise<boolean> {
    if (closed || hidden() || !enabled || volume === 0 || unavailable || !AudioContextClass) return Promise.resolve(false);
    gestureRequired = false;
    try {
      if (!context) {
        context = new AudioContextClass();
        context.addEventListener('statechange', render, options);
        master = context.createGain();
        filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2300; filter.Q.value = 0.35;
        master.connect(filter); filter.connect(context.destination);
      }
      applyVolume();
      const current = context;
      const ready = current.state === 'running' ? Promise.resolve() : current.resume();
      unlocking = ready.then(() => {
        if (closed || current !== context) {
          if (current.state !== 'closed') void current.close().catch(() => {});
          return false;
        }
        if (!audible()) { void current.suspend().catch(() => {}); return false; }
        startAmbient(); render(); return true;
      }, () => false);
      return unlocking;
    } catch { unavailable = true; stopAll(); render(); return Promise.resolve(false); }
  }
  function afterUnlock(effect: () => void) {
    const version = epoch;
    if (audible()) effect();
    else if (unlocking) void unlocking.then(ready => { if (ready && version === epoch && audible()) effect(); });
  }
  function later(delay: number, effect: () => void) {
    const version = epoch;
    const timer = win.setTimeout(() => { timers.delete(timer); if (version === epoch && audible()) effect(); }, delay);
    timers.add(timer);
  }
  function connectVoice(source: AudioScheduledSourceNode, duration: number, volume: number) {
    if (!context || !master) return;
    while (voices.size >= 6) stopVoice(voices.values().next().value!);
    const gain = context.createGain(), now = context.currentTime;
    const peak = Math.max(0, Math.min(0.11, volume));
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.012);
    gain.gain.setValueAtTime(peak, now + Math.max(0.015, duration * 0.55));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(gain); gain.connect(master);
    const voice = { source, gain }; voices.add(voice);
    source.addEventListener('ended', () => { voices.delete(voice); source.disconnect(); gain.disconnect(); }, { once: true });
    source.start(now); source.stop(now + duration + 0.015);
  }
  function tone(frequency: number, duration = 0.1, wave: OscillatorType = 'triangle', volume = 0.045, endFrequency?: number) {
    if (!audible() || !context) return;
    const source = context.createOscillator(); source.type = wave;
    source.frequency.setValueAtTime(Math.max(40, Math.min(1600, frequency)), context.currentTime);
    if (endFrequency) source.frequency.exponentialRampToValueAtTime(Math.max(40, Math.min(1600, endFrequency)), context.currentTime + duration);
    connectVoice(source, duration, volume);
  }
  function softNoise(duration = 0.055, volume = 0.025) {
    if (!audible() || !context) return;
    if (!noise) {
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.12), context.sampleRate);
      const channel = noise.getChannelData(0);
      for (let index = 0; index < channel.length; index++) channel[index] = (Math.random() * 2 - 1) * 0.65;
    }
    const source = context.createBufferSource(); source.buffer = noise; connectVoice(source, duration, volume);
  }
  function melody(notes: readonly [number, number, number][], wave: OscillatorType = 'triangle', volume = 0.045) {
    for (const [delay, midi, duration] of notes) later(delay, () => tone(pitch(midi), duration, wave, volume));
  }
  function turnSound(turn: Turn) {
    const base = palettes[world].midi;
    if (mood === 'drift') { tone(pitch(base + (turn.status === 'won' ? 19 : 12)), 0.18, 'sine', 0.012); return; }
    if (mood === 'gentle') {
      const note = turn.human === 'ember' ? base + 12 : turn.human === 'root' ? base + 7 : base + 16;
      melody([[0, note, 0.16], [110, note + (turn.human === 'focus' ? 3 : 7), 0.2]], 'sine', 0.03);
      later(260, () => tone(pitch(base + (turn.support === 'mend' ? 16 : turn.support === 'echo' ? 24 : 7)), 0.23, 'sine', 0.027));
      if (turn.combo) melody([[380, base + 19, 0.16], [490, base + 24, 0.22]], 'sine', 0.025);
      if (turn.status === 'won') melody([[650, base + 12, 0.18], [830, base + 16, 0.18], [1010, base + 19, 0.35]], 'sine', 0.033);
      else if (turn.status === 'lost') melody([[650, base + 7, 0.2], [870, base, 0.3]], 'sine', 0.023);
      return;
    }
    if (turn.human === 'ember') { tone(196, 0.14, 'square', 0.06, 784); later(35, () => softNoise()); }
    else if (turn.human === 'root') { tone(98, 0.16, 'square', 0.055, 82); later(40, () => tone(196, 0.09, 'triangle', 0.065)); }
    else melody([[0, 69, 0.085], [55, 72, 0.09], [110, 76, 0.12]], 'triangle', 0.075);
    later(175, () => {
      if (turn.support === 'echo') melody([[0, 72, 0.08], [85, 79, 0.1]], 'square', 0.045);
      else if (turn.support === 'ward') { tone(196, 0.16, 'triangle', 0.085); later(45, () => tone(294, 0.12, 'triangle', 0.05)); }
      else melody([[0, 64, 0.09], [55, 67, 0.09], [110, 72, 0.12]], 'sine', 0.08);
    });
    if (turn.combo) later(330, () => melody([[0, 79, 0.08], [65, 84, 0.12], [135, 88, 0.16]], 'triangle', 0.055));
    later(550, () => { if (turn.taken > 0) { tone(110, 0.14, 'triangle', 0.07, 55); softNoise(); } else tone(311, 0.09, 'sine', 0.05); });
    if (turn.status === 'won') later(730, () => melody([[0, 72, 0.09], [110, 76, 0.09], [220, 79, 0.12], [360, 84, 0.2]], 'triangle', 0.075));
    else if (turn.status === 'lost') later(720, () => melody([[0, 64, 0.14], [120, 62, 0.14], [240, 57, 0.2]], 'triangle', 0.05));
  }
  function gameGesture(target: HTMLButtonElement) {
    if (root.classList.contains('cg-animating')) return;
    if (target.matches('[data-cast],[data-request]')) ownedRound = lastRound + 1;
    if (target.matches('[data-card]') && target.getAttribute('aria-pressed') !== 'true') pulse(8);
    if (!enabled || unavailable) return;
    void unlock();
    if (target.matches('[data-card]') && target.getAttribute('aria-pressed') !== 'true') {
      const offsets: Record<string, number> = { ember: 12, root: 7, focus: 16 };
      const offset = offsets[target.dataset.card || ''];
      if (offset !== undefined) afterUnlock(() => tone(pitch(palettes[world].midi + offset), 0.06, 'sine', mood === 'drift' ? 0.009 : 0.025));
    }
  }
  root.addEventListener('click', event => {
    const target = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!target || !root.contains(target) || !event.isTrusted || target.disabled || closed || hidden()) return;
    if (target.matches('[data-haptics]')) {
      if (!hapticsAvailable) return;
      hapticsEnabled = !hapticsEnabled; ownedRound = null;
      if (hapticsEnabled) pulse(8); else stopHaptics();
      render(); return;
    }
    if (target.matches('[data-sound]')) {
      if (unavailable) return;
      enabled = !enabled; persist('sound', enabled ? 'on' : 'off');
      if (!enabled) suspend(); else { void unlock(); afterUnlock(() => tone(523, 0.07, 'sine', 0.012)); }
      render(); return;
    }
    if (target.matches('[data-cancel],[data-replay]')) ownedRound = null;
    if (target.matches('[data-cast],[data-request],[data-card],[data-replay]')) gameGesture(target);
  }, { ...options, capture: true });
  doc.addEventListener('keydown', event => {
    if (!event.isTrusted || event.repeat || event.altKey || event.ctrlKey || event.metaKey || closed || hidden()
      || root.classList.contains('cg-animating') || root.querySelector('dialog[open]')) return;
    const target = event.target instanceof win.Element ? event.target : null;
    if (target?.closest('input,textarea,select,[contenteditable=true]')) return;
    const cards: Record<string, string> = { '1': 'ember', '2': 'root', '3': 'focus' };
    const card = cards[event.key];
    const action = card ? root.querySelector<HTMLButtonElement>(`[data-card="${card}"]`)
      : event.code === 'Space' && (!target?.closest('button,a') || target?.closest('[data-card]'))
        ? root.querySelector<HTMLButtonElement>(root.dataset.status !== 'playing' ? '[data-replay]' : root.dataset.mode === 'native' ? '[data-request]' : '[data-cast]') : null;
    if (action && !action.disabled) gameGesture(action);
  }, { ...options, capture: true });
  moodSelect?.addEventListener('change', event => {
    const next = moodSelect.value;
    if (!['drift', 'gentle', 'playful'].includes(next)) { render(); return; }
    mood = next as Mood; persist('sound-mood', mood); stopAll();
    if (enabled) { if (event.isTrusted) void unlock(); else startAmbient(); } render();
  }, options);
  volumeInput?.addEventListener('input', event => {
    if (!Number.isFinite(Number(volumeInput.value))) { render(); return; }
    volume = Math.round(Math.max(0, Math.min(100, Number(volumeInput.value)))); persist('volume', String(volume));
    applyVolume(); if (!volume) suspend(); else if (enabled) { if (event.isTrusted) void unlock(); else startAmbient(); } render();
  }, options);
  root.addEventListener('co-games:turn', event => {
    const value = (event as CustomEvent<unknown>).detail;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const turn = value as Turn;
    if (!['ember', 'root', 'focus'].includes(turn.human) || !['echo', 'ward', 'mend'].includes(turn.support)
      || !['playing', 'won', 'lost'].includes(turn.status) || !Number.isInteger(turn.round) || turn.round < 1 || turn.round > 4
      || !Number.isFinite(turn.taken) || turn.taken < 0 || turn.taken > 14
      || !Number.isFinite(turn.healing) || turn.healing < 0 || turn.healing > 14 || turn.round <= lastRound) return;
    lastRound = turn.round;
    if (ownedRound === turn.round) pulse(turn.status !== 'playing' ? [12, 35, 12] : turn.combo ? [8, 30, 8] : 10);
    ownedRound = null;
    if (!enabled || closed || hidden() || gestureRequired) return;
    stopEffects(); afterUnlock(() => turnSound(turn));
  }, options);
  root.addEventListener('co-games:match', event => {
    const detail = (event as CustomEvent<{ encounter?: unknown }>).detail;
    world = worldId(detail?.encounter); lastRound = 0; ownedRound = null; stopAll(); stopHaptics();
    if (audible()) startAmbient(); render();
  }, options);
  doc.addEventListener('visibilitychange', () => { if (hidden()) suspend(); render(); }, options);
  win.addEventListener('pagehide', suspend, options);
  win.addEventListener('pc:auth-change', () => { ownedRound = null; stopHaptics(); }, options);
  win.addEventListener('pc:auth-refresh', () => { ownedRound = null; stopHaptics(); }, options);
  render();
  return () => {
    if (closed) return;
    closed = true; lifetime.abort(); stopAll(); stopHaptics(); ownedRound = null;
    master?.disconnect(); filter?.disconnect(); noise = null;
    const previous = context; void previous?.close().catch(() => {});
    context = null; master = null; filter = null; render();
  };
}
