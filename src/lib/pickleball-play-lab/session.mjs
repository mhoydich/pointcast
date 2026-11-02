export const SESSION = Object.freeze([
  { title: 'Find your rhythm', duration: 120, range: '0–2 min', cue: 'Easy cooperative dinks. Agree on a comfortable pace, a lane, and targets.', short: 'Settle in', game: null },
  { title: 'Backhand Builder', duration: 300, range: '2–7 min', cue: 'Can you earn three team points? Six controlled backhand dinks make one.', short: 'Build control', game: 'backhand' },
  { title: 'Drop-and-Go', duration: 300, range: '7–12 min', cue: 'A low reply, then a controlled arrival. Split this block equally between roles.', short: 'Move with purpose', game: 'drop' },
  { title: 'Green-Light Dinks', duration: 300, range: '12–17 min', cue: 'Earn the attack. Stay balanced and use the agreed above-net decision gate.', short: 'Choose your moment', game: 'green' },
  { title: 'Play the favorite', duration: 120, range: '17–19 min', cue: 'Replay the game you both enjoyed most, or play a short live rally round.', short: 'Finish with fun', game: null },
  { title: 'Keep one thing', duration: 60, range: '19–20 min', cue: 'Each player names one observation and one experiment for next time.', short: 'Notice & repeat', game: null },
]);
export const TOTAL_SECONDS = SESSION.reduce((sum, phase) => sum + phase.duration, 0);
export const phaseStart = index => SESSION.slice(0, index).reduce((sum, phase) => sum + phase.duration, 0);
export function phaseAt(elapsed) {
  let end = 0;
  const index = SESSION.findIndex(phase => { end += phase.duration; return elapsed < end; });
  return index < 0 ? SESSION.length - 1 : index;
}
export const clockText = seconds => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`;
