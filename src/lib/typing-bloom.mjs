export const lessons = [
  { name: '01 · Find home', hint: 'Rest your index fingers on F and J. Feel the little bumps.', text: 'fff jjj fj fj dd kk ss ll aa ;; sad lad flask' },
  { name: '02 · Reach up', hint: 'Reach to the top row, then return to home.', text: 'red tree quiet power we grow little flowers' },
  { name: '03 · Roots below', hint: 'Let your fingers reach down. Keep your hands relaxed.', text: 'zip zoom mix calm waves bloom across a meadow' },
  { name: '04 · Little stories', hint: 'Find a comfortable rhythm. Speed can come later.', text: 'a tiny frog plays jazz while the moon makes tea' },
  { name: '05 · Shift & sparkle', hint: 'Hold the opposite Shift key for capitals. Leave room to breathe.', text: 'Hello, little garden. Let us grow! Nice work?' },
  { name: '06 · Number picnic', hint: 'Explore the number row. One careful press at a time.', text: '2 frogs, 3 cups, 5 bees. Meet at 10:45 for tea!' },
];
export function createRound(text) {
  return { text, position: 0, attempts: 0, streak: 0, bestStreak: 0, elapsed: 0, since: null, started: false, touch: false };
}
export function pause(round, now) {
  if (round.since !== null) round.elapsed += Math.max(0, now - round.since);
  round.since = null;
}
export function resume(round, now) {
  if (round.started && round.position < round.text.length && round.since === null) round.since = now;
}
export function enter(round, character, now, touch = false) {
  if (round.position >= round.text.length) return false;
  if (!round.started) { round.started = true; round.since = now; }
  round.touch ||= touch;
  round.attempts++;
  const correct = character === round.text[round.position];
  if (correct) { round.position++; round.streak++; round.bestStreak = Math.max(round.bestStreak, round.streak); }
  else round.streak = 0;
  if (round.position === round.text.length) pause(round, now);
  return correct;
}
export function metrics(round, now) {
  const milliseconds = round.elapsed + (round.since === null ? 0 : Math.max(0, now - round.since));
  return { accuracy: round.attempts ? Math.round(round.position / round.attempts * 100) : null,
    wpm: milliseconds >= 3000 && !round.touch ? Math.round(round.position / 5 / (milliseconds / 60000)) : null };
}
export function fingerFor(character) {
  if (character === ' ') return 'Either thumb · Space';
  const key = baseKey(character);
  const groups = [['1qaz', 'Left pinky'], ['2wsx', 'Left ring'], ['3edc', 'Left middle'], ['45rtfgvb', 'Left index'], ['67yuhjnm', 'Right index'], ['8ik,', 'Right middle'], ['9ol.', 'Right ring'], ["0p;/'", 'Right pinky']];
  const finger = groups.find(([keys]) => keys.includes(key))?.[1] || 'Follow the highlighted key';
  return finger + (/[A-Z:!?]/.test(character) ? ' + opposite Shift' : '');
}
export function baseKey(character) {
  return ({ '!': '1', '?': '/', ':': ';' })[character] || character?.toLowerCase();
}
