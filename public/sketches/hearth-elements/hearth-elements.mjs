// Hearth cues synthesize locally. Call setEnabled(true) from a deliberate tap or key press.
const D = 293.6647679;
const A = 440;
const F_SHARP = 369.9944227;
const B = 493.8833013;
const E = 329.6275569;
const MASTER = 0.4;
const MAX_VOICES = 10;

const sounds = {
  // Frequency, level, decay duration, delay and optional ending frequency.
  gong: [
    [93, 0.15, 1.30, 0],
    [147, 0.12, 1.16, 0.009],
    [218, 0.08, 0.95, 0.014],
    [343, 0.06, 0.68, 0.018],
    [551, 0.045, 0.43, 0.006],
  ],
  // D and A are scale tones of D major pentatonic.
  bell: [[D * 2, 0.16, 0.42, 0], [A * 2, 0.055, 0.27, 0.006]],
  chime: [[F_SHARP * 2, 0.11, 0.31, 0], [B * 2, 0.09, 0.36, 0.06], [E * 4, 0.065, 0.29, 0.12]],
  drop: [[860, 0.12, 0.19, 0, 330], [510, 0.025, 0.11, 0.012, 240]],
};

/** Accept a Loom message or a +1 operation. Unknown senders and house robots are quiet. */
export function hearthCue(event) {
  const from = event?.from;
  if (from?.kind === 'robot' || /^@?collator$/i.test(String(from?.name ?? '').trim())
      || /^@collator$/i.test(String(from?.address ?? '').trim())) return null;
  if (event?.op === 'plus' || event?.action === 'plus') return 'drop';
  if (from?.kind !== 'human' && from?.kind !== 'agent') return null;
  if (typeof event.body === 'string' && /^\s*(?:DONE|MINTED)(?=$|\s|[·:.,—–-])/i.test(event.body)) return 'gong';
  return from.kind === 'human' ? 'bell' : 'chime';
}

export function createHearthAudio({
  createContext = () => {
    const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    return Audio ? new Audio() : null;
  },
  page = globalThis.document,
} = {}) {
  let context, output;
  let enabled = false, disposed = false, revision = 0;
  const voices = new Map();

  function release(source) {
    const gain = voices.get(source);
    if (!gain) return;
    voices.delete(source);
    source.disconnect();
    gain.disconnect();
  }

  function silence() {
    if (output) output.gain.value = 0;
    for (const source of voices.keys()) {
      source.stop();
      release(source);
    }
  }

  function syncVisibility() {
    if (page?.hidden) silence();
    else if (enabled && output) output.gain.value = MASTER;
  }

  async function setEnabled(wanted) {
    const request = ++revision;
    if (!wanted || disposed) {
      enabled = false;
      silence();
      return false;
    }
    if (page?.hidden) return false;
    try {
      if (!context || context.state === 'closed') {
        context = createContext();
        if (!context) return false;
        output = context.createGain();
        output.gain.value = 0;
        output.connect(context.destination);
      }
      // Invoke resume within the caller's gesture, before yielding to the browser.
      if (context.state !== 'running') await context.resume();
      if (request !== revision) return false;
      enabled = !page?.hidden && context.state === 'running';
      output.gain.value = enabled ? MASTER : 0;
      return enabled;
    } catch {
      if (request === revision) {
        enabled = false;
        silence();
      }
      return false;
    }
  }

  function play(event) {
    const cue = hearthCue(event);
    if (!cue || !enabled || disposed || page?.hidden || context?.state !== 'running') return false;
    if (voices.size + sounds[cue].length > MAX_VOICES) return false;
    const now = context.currentTime + 0.005;
    for (const [frequency, level, duration, delay, fall] of sounds[cue]) {
      const start = now + delay;
      const source = context.createOscillator(), gain = context.createGain();
      source.frequency.setValueAtTime(frequency, start);
      if (fall) source.frequency.exponentialRampToValueAtTime(fall, start + duration * 0.65);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(level, start + (cue === 'gong' ? 0.028 : 0.006));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(gain);
      gain.connect(output);
      voices.set(source, gain);
      source.onended = () => release(source);
      source.start(start);
      source.stop(start + duration);
    }
    return true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    enabled = false;
    revision++;
    page?.removeEventListener('visibilitychange', syncVisibility);
    silence();
    if (context && context.state !== 'closed') context.close().catch(() => {});
  }

  page?.addEventListener('visibilitychange', syncVisibility);
  return { get enabled() { return enabled; }, setEnabled, play, dispose };
}
