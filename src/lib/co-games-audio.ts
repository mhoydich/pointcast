/** Original, quiet Web Audio cues. No audio is created before a trusted game-button gesture. */
export function mountCoGamesAudio(root: HTMLElement): () => void {
  const win = root.ownerDocument.defaultView!;
  const lifetime = new win.AbortController();
  const AudioContextClass = win.AudioContext ?? (win as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const button = root.querySelector<HTMLButtonElement>('[data-sound]');
  const storageKey = 'pointcast:co-games:sound';
  const masterVolume = 0.28;
  const maximumVoices = 6;
  let enabled = true;
  let unavailable = !AudioContextClass;
  let closed = false;
  let epoch = 0;
  let lastRound = 0;
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let noise: AudioBuffer | null = null;
  let unlocking: Promise<boolean> | null = null;
  const timers = new Set<number>();
  const voices = new Set<{ source: AudioScheduledSourceNode; gain: GainNode }>();
  try { enabled = win.localStorage.getItem(storageKey) !== 'off'; } catch { /* Sound works without storage. */ }

  function updateAudioState() { root.dataset.audioState = unavailable ? 'unavailable' : context?.state || 'locked'; }

  function renderToggle() {
    updateAudioState();
    if (!button) return;
    button.disabled = unavailable;
    button.setAttribute('aria-pressed', String(enabled && !unavailable));
    button.textContent = '♪';
    button.setAttribute('aria-label', unavailable ? 'Sound is unavailable in this browser' : enabled ? 'Sound on. Mute game sounds' : 'Sound off. Enable game sounds');
    button.title = unavailable ? 'Sound is unavailable in this browser' : enabled ? 'Mute game sounds' : 'Enable game sounds';
  }

  function stopVoice(voice: { source: AudioScheduledSourceNode; gain: GainNode }) {
    voices.delete(voice);
    try { voice.source.stop(); } catch { /* An ended source is already silent. */ }
    voice.source.disconnect(); voice.gain.disconnect();
  }

  function stopAll() {
    ++epoch;
    for (const timer of timers) win.clearTimeout(timer);
    timers.clear();
    for (const voice of [...voices]) stopVoice(voice);
  }

  function later(delay: number, effect: () => void) {
    const version = epoch;
    const timer = win.setTimeout(() => {
      timers.delete(timer);
      if (!closed && enabled && version === epoch && context?.state === 'running') effect();
    }, delay);
    timers.add(timer);
  }

  // Called only synchronously from an explicit trusted game gesture.
  function unlock(): Promise<boolean> {
    if (closed || !enabled || unavailable || !AudioContextClass) return Promise.resolve(false);
    try {
      if (!context) {
        context = new AudioContextClass();
        context.addEventListener('statechange', updateAudioState, { signal: lifetime.signal });
        updateAudioState();
        master = context.createGain(); master.gain.value = masterVolume;
        filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2500; filter.Q.value = 0.35;
        master.connect(filter); filter.connect(context.destination);
      }
      master!.gain.setValueAtTime(masterVolume, context.currentTime);
      const current = context;
      // resume() itself runs in the gesture handler, never in an AI response or timer.
      const ready = current.state === 'running' ? Promise.resolve() : current.resume();
      unlocking = ready.then(() => { if (!closed && current === context) updateAudioState(); return !closed && enabled && current === context && current.state === 'running'; }, () => false);
      return unlocking;
    } catch {
      unavailable = true; stopAll(); renderToggle(); return Promise.resolve(false);
    }
  }

  function afterUnlock(effect: () => void) {
    const version = epoch;
    if (closed || !enabled || unavailable) return;
    if (context?.state === 'running') effect();
    else if (unlocking) void unlocking.then(ready => {
      if (ready && !closed && enabled && version === epoch && context?.state === 'running') effect();
    });
  }

  function connectVoice(source: AudioScheduledSourceNode, duration: number, volume: number) {
    if (!context || !master) return;
    while (voices.size >= maximumVoices) stopVoice(voices.values().next().value!);
    const gain = context.createGain();
    const now = context.currentTime;
    const peak = Math.max(0, Math.min(0.11, volume));
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.006);
    gain.gain.setValueAtTime(peak, now + Math.max(0.008, duration * 0.55));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(gain); gain.connect(master);
    const voice = { source, gain };
    voices.add(voice);
    source.addEventListener('ended', () => { voices.delete(voice); source.disconnect(); gain.disconnect(); }, { once: true });
    source.start(now); source.stop(now + duration + 0.015);
  }

  function tone(frequency: number, duration = 0.1, wave: OscillatorType = 'triangle', volume = 0.075, endFrequency?: number) {
    if (!context || context.state !== 'running' || !enabled || closed) return;
    const oscillator = context.createOscillator(); oscillator.type = wave;
    oscillator.frequency.setValueAtTime(Math.max(40, Math.min(1600, frequency)), context.currentTime);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, Math.min(1600, endFrequency)), context.currentTime + duration);
    connectVoice(oscillator, duration, volume);
  }

  function softNoise(duration = 0.075, volume = 0.045) {
    if (!context || context.state !== 'running' || !enabled || closed) return;
    if (!noise) {
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.12), context.sampleRate);
      const channel = noise.getChannelData(0);
      for (let index = 0; index < channel.length; index++) channel[index] = (Math.random() * 2 - 1) * 0.65;
    }
    const source = context.createBufferSource(); source.buffer = noise;
    connectVoice(source, duration, volume);
  }

  const pitch = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
  function melody(notes: readonly [number, number, number][], wave: OscillatorType = 'triangle', volume = 0.075) {
    for (const [delay, midi, duration] of notes) later(delay, () => tone(pitch(midi), duration, wave, volume));
  }

  type Turn = { human: 'ember' | 'root' | 'focus'; support: 'echo' | 'ward' | 'mend'; round: number; taken: number; healing: number; status: 'playing' | 'won' | 'lost' };
  function turnSound(turn: Turn) {
    if (turn.human === 'ember') { tone(196, 0.14, 'square', 0.06, 784); later(35, () => softNoise(0.055, 0.025)); }
    else if (turn.human === 'root') { tone(98, 0.16, 'square', 0.055, 82); later(40, () => tone(196, 0.09, 'triangle', 0.065)); }
    else melody([[0, 69, 0.085], [55, 72, 0.09], [110, 76, 0.12]], 'triangle', 0.075);

    later(175, () => {
      if (turn.support === 'echo') melody([[0, 72, 0.08], [85, 79, 0.1]], 'square', 0.045);
      else if (turn.support === 'ward') { tone(196, 0.16, 'triangle', 0.085); later(45, () => tone(294, 0.12, 'triangle', 0.05)); }
      else melody([[0, 64, 0.09], [55, 67, 0.09], [110, 72, 0.12]], 'sine', 0.08);
    });
    later(550, () => {
      if (turn.taken > 0) { tone(110, 0.14, 'triangle', 0.085, 55); softNoise(0.07, 0.04); }
      else tone(311, 0.09, 'sine', 0.06);
    });
    if (turn.status === 'won') later(730, () => {
      melody([[0, 72, 0.09], [110, 76, 0.09], [220, 79, 0.12], [360, 84, 0.13], [520, 81, 0.11], [660, 84, 0.28]], 'triangle', 0.085);
      later(660, () => { tone(pitch(72), 0.28, 'sine', 0.045); tone(pitch(76), 0.28, 'sine', 0.035); });
    });
    else if (turn.status === 'lost') later(720, () => melody([[0, 64, 0.14], [120, 62, 0.14], [240, 57, 0.14], [360, 52, 0.26]], 'triangle', 0.06));
  }

  root.addEventListener('click', event => {
    const target = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!target || !root.contains(target)) return;
    // Reset bookkeeping even for the HUD's keyboard-driven .click(); it cannot unlock audio.
    if (target.matches('[data-replay]') && !target.disabled) { lastRound = 0; stopAll(); }
    if (!event.isTrusted || target.disabled || unavailable || closed) return;
    if (target.matches('[data-sound]')) {
      enabled = !enabled;
      try { win.localStorage.setItem(storageKey, enabled ? 'on' : 'off'); } catch { /* Preference persistence is optional. */ }
      renderToggle();
      if (!enabled) { stopAll(); if (master && context) master.gain.setValueAtTime(0, context.currentTime); void context?.suspend().catch(() => {}); }
      else { void unlock(); afterUnlock(() => tone(523, 0.055, 'sine', 0.045)); }
      return;
    }
    if (!enabled || root.classList.contains('cg-animating') || !target.matches('[data-cast],[data-request],[data-card]')) return;
    void unlock();
    if (target.matches('[data-card]') && target.getAttribute('aria-pressed') !== 'true') {
      const frequencies: Record<string, number> = { ember: 392, root: 294, focus: 440 };
      const frequency = frequencies[target.dataset.card || ''];
      if (frequency) afterUnlock(() => tone(frequency, 0.045, 'triangle', 0.04));
    }
  }, { signal: lifetime.signal, capture: true });

  // The HUD turns its trusted keyboard shortcuts into synthetic clicks. Unlock
  // in this original gesture before that dispatch, using the same exclusions.
  root.ownerDocument.addEventListener('keydown', event => {
    if (!event.isTrusted || event.repeat || event.altKey || event.ctrlKey || event.metaKey || !enabled || unavailable || closed
      || root.classList.contains('cg-animating') || root.querySelector('dialog[open]')) return;
    const target = event.target instanceof win.Element ? event.target : null;
    if (target?.closest('input,textarea,select,[contenteditable=true]')) return;
    const cards: Record<string, string> = { '1': 'ember', '2': 'root', '3': 'focus' };
    const card = cards[event.key];
    let action: HTMLButtonElement | null = null;
    if (card) action = root.querySelector<HTMLButtonElement>(`[data-card="${card}"]`);
    else if (event.code === 'Space' && (!target?.closest('button,a') || target?.closest('[data-card]'))) {
      action = root.querySelector<HTMLButtonElement>(root.dataset.status !== 'playing' ? '[data-replay]'
        : root.dataset.mode === 'native' ? '[data-request]' : '[data-cast]');
    }
    if (!action || action.disabled) return;
    void unlock();
    if (card && action.getAttribute('aria-pressed') !== 'true') {
      const frequencies: Record<string, number> = { ember: 392, root: 294, focus: 440 };
      afterUnlock(() => tone(frequencies[card], 0.045, 'triangle', 0.04));
    }
  }, { signal: lifetime.signal, capture: true });

  root.addEventListener('co-games:turn', event => {
    const value = (event as CustomEvent<unknown>).detail;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const turn = value as Turn;
    if (!['ember', 'root', 'focus'].includes(turn.human) || !['echo', 'ward', 'mend'].includes(turn.support)
      || !['playing', 'won', 'lost'].includes(turn.status) || !Number.isInteger(turn.round) || turn.round < 1 || turn.round > 4
      || !Number.isFinite(turn.taken) || turn.taken < 0 || turn.taken > 14
      || !Number.isFinite(turn.healing) || turn.healing < 0 || turn.healing > 14 || turn.round <= lastRound) return;
    lastRound = turn.round;
    if (!enabled || closed) return;
    stopAll();
    afterUnlock(() => turnSound(turn));
  }, { signal: lifetime.signal });

  renderToggle();
  return () => {
    if (closed) return;
    closed = true; lifetime.abort(); stopAll();
    master?.disconnect(); filter?.disconnect(); noise = null;
    const previous = context;
    void previous?.close().catch(() => {});
    updateAudioState();
    context = null; master = null; filter = null;
  };
}
