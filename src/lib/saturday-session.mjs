export const movements = [
  { title: 'Arrive', cue: 'For this small interval, nothing needs finishing. Feel the chair or the ground. Let the first note meet you where you are.', invitation: 'Notice one place where your body is supported.' },
  { title: 'Listen', cue: 'Follow one phrase until it leaves the air. Notice the space it opens. When your attention wanders, another sound will be there to meet it.', invitation: 'Choose one sound. Stay with it for a moment.' },
  { title: 'Widen', cue: 'This room sits inside a larger world. If it feels welcome, offer a quiet wish for people facing a difficult day. Then return to the sound closest to you.', invitation: 'Let care be a small gesture, without needing an answer.' },
  { title: 'Carry', cue: 'The music can continue. Notice one ordinary thing you want to give your attention to today: a glass of water, a person, the light on a wall.', invitation: 'Take one unhurried moment into the rest of Saturday.' },
];

/** A monotonic clock. Pausing preserves elapsed time; a hidden tab cannot silently finish. */
export function createSession(seconds = 300) {
  if (![180, 300, 480].includes(seconds)) throw new RangeError('Choose 3, 5, or 8 minutes.');
  const total = seconds * 1000;
  let state = 'idle';
  let elapsed = 0;
  let anchor = null;
  function snapshot(now) {
    const current = Math.min(total, elapsed + (state === 'running' ? Math.max(0, now - anchor) : 0));
    if (current === total && state === 'running') { elapsed = total; anchor = null; state = 'complete'; }
    return { state, elapsed: current, remaining: Math.ceil((total - current) / 1000), progress: current / total, movement: Math.min(3, Math.floor(current / total * 4)) };
  }
  return {
    snapshot,
    start(now) {
      if (state === 'idle' || state === 'paused') { anchor = now; state = 'running'; }
      return snapshot(now);
    },
    pause(now) {
      const view = snapshot(now);
      if (state === 'running') { elapsed = view.elapsed; anchor = null; state = 'paused'; }
      return snapshot(now);
    },
    reset(now) { elapsed = 0; anchor = null; state = 'idle'; return snapshot(now); },
  };
}

export function breathAt(elapsed) {
  const position = (elapsed % 10000) / 1000;
  return position < 4
    ? { label: 'Breathe in', scale: 1 + position / 4 * .16 }
    : { label: 'Breathe out', scale: 1.16 - (position - 4) / 6 * .16 };
}
