/**
 * Tiny shared Web Audio scheduler used by the /cast-* and /drum-school
 * music pages. Fixes the three bugs Codex caught in PR #531 review:
 *
 *   1. pause() suspended the AudioContext but left auto-advance setTimeout
 *      running, so it fired during pause and kept advancing tracks.
 *   2. stopAll() / clearScheduled() only cleared timers + RAF, never the
 *      already-scheduled OscillatorNodes/BufferSources. Hit Next mid-song
 *      and the old arrangement bled into the new one.
 *   3. Seek (cast-music-pro progress click) double-scheduled tracks.
 *
 * This file is the single source of truth for "stop everything currently
 * scheduled in the audio graph." Every page that sequences notes should
 * route through it.
 */

export interface ScheduledTimer {
  fn: () => void;
  /** When this should fire, expressed in AudioContext.currentTime seconds. */
  atCtxTime: number;
  /** Browser setTimeout handle while armed; null while paused. */
  handle: number | null;
}

export interface AudioScheduler {
  /** Wrap a started OscillatorNode/AudioBufferSourceNode so stopAll() can stop it. */
  trackSource: <T extends AudioScheduledSourceNode>(s: T) => T;

  /** Schedule a callback to fire at a specific AudioContext.currentTime. */
  schedule: (fn: () => void, atCtxTime: number) => void;

  /** Suspend audio AND park every pending timer. Pause means pause. */
  pause: () => Promise<void>;

  /** Resume audio AND re-arm every parked timer with its remaining ctx-time. */
  resume: () => Promise<void>;

  /** Stop every tracked source and cancel every pending timer immediately. */
  stopAll: () => void;

  /** Inspect: how many sources are currently tracked (test/debug). */
  readonly sourceCount: number;
  /** Inspect: how many timers are pending (test/debug). */
  readonly timerCount: number;
}

export function createAudioScheduler(ctx: AudioContext): AudioScheduler {
  const sources = new Set<AudioScheduledSourceNode>();
  const timers: ScheduledTimer[] = [];

  function arm(t: ScheduledTimer) {
    const remainingMs = Math.max(0, (t.atCtxTime - ctx.currentTime) * 1000);
    t.handle = window.setTimeout(() => {
      t.handle = null;
      // Remove BEFORE running fn so a re-entrant schedule() inside fn works.
      const i = timers.indexOf(t);
      if (i >= 0) timers.splice(i, 1);
      try { t.fn(); } catch (e) { /* swallow — caller errors shouldn't kill the scheduler */ }
    }, remainingMs);
  }

  return {
    trackSource<T extends AudioScheduledSourceNode>(s: T): T {
      sources.add(s);
      // When the source ends naturally, drop it from the set so we don't try
      // to .stop() an already-finished node (which throws InvalidStateError on
      // some implementations and at minimum is wasted work).
      try { s.addEventListener('ended', () => { sources.delete(s); }); } catch {}
      return s;
    },

    schedule(fn: () => void, atCtxTime: number) {
      const t: ScheduledTimer = { fn, atCtxTime, handle: null };
      timers.push(t);
      // If the AudioContext is currently suspended (i.e. user paused), don't
      // arm yet — resume() will arm us. This is the core of the pause fix.
      if (ctx.state !== 'suspended') arm(t);
    },

    async pause() {
      // Park timers FIRST so a fire racing with suspend() doesn't slip through.
      for (const t of timers) {
        if (t.handle != null) { clearTimeout(t.handle); t.handle = null; }
      }
      try { await ctx.suspend(); } catch {}
    },

    async resume() {
      try { await ctx.resume(); } catch {}
      for (const t of timers) { if (t.handle == null) arm(t); }
    },

    stopAll() {
      for (const s of sources) {
        try { s.stop(); } catch {}
        try { s.disconnect(); } catch {}
      }
      sources.clear();
      for (const t of timers) {
        if (t.handle != null) { clearTimeout(t.handle); t.handle = null; }
      }
      timers.length = 0;
    },

    get sourceCount() { return sources.size; },
    get timerCount() { return timers.length; },
  };
}
