/* TEMP: a verbatim copy of the motif half of public/pmm/moods/moods.js from PR #1533
   (origin/cc/pmm-moods-20261023). sound.js imports from here only until that PR merges;
   then delete this file and change the one import in sound.js to '../moods/moods.js'.
   Do not edit the motifs here: change them in moods.js. */
export const MOODS = Object.freeze([
  { id: 'calm', color: '#2F86D8', signal: 'Steady. Talk whenever. Nothing is on fire here.',
    glyph: ['........', '........', '.##..##.', '#..##..#', '........', '.##..##.', '#..##..#', '........'],
    motif: { wave: 'triangle', bpm: 84, notes: [['C4', 1], ['E4', 1], ['G4', 2], ['E4', 1], ['C4', 3]] } },
  { id: 'hyped', color: '#E8453C', signal: 'Something good just happened. Ask me what.',
    glyph: ['....###.', '...###..', '..###...', '.######.', '...###..', '..###...', '.##.....', '#.......'],
    motif: { wave: 'square', bpm: 168, notes: [['C5', 1], ['C5', 1], ['G5', 1], ['C6', 1], ['G5', 1], ['C6', 3]] } },
  { id: 'soft', color: '#7E57B5', signal: 'Go gently with me. Kind words land well today.',
    glyph: ['........', '.##..##.', '########', '########', '.######.', '..####..', '...##...', '........'],
    motif: { wave: 'sine', bpm: 96, notes: [['A4', 2], ['F4', 1], ['C5', 2], ['A4', 3]] } },
  { id: 'sunny', color: '#F5D142', signal: 'Good day, open door. Send me the dumb idea.',
    glyph: ['...#....', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '...#....', '........'],
    motif: { wave: 'square', bpm: 132, notes: [['G4', 1], ['B4', 1], ['D5', 1], ['G5', 2], ['D5', 1], ['G5', 2]] } },
  { id: 'salty', color: '#58B947', signal: 'A little bitter about something. Not about you.',
    glyph: ['.######.', '#......#', '#.#..#.#', '#......#', '#.#.#.##', '##.#.#.#', '#......#', '.######.'],
    motif: { wave: 'square', bpm: 120, notes: [['E4', 1], ['F4', 1], ['E4', 1], ['B3', 2], ['A#3', 3]] } },
  { id: 'tired', color: '#8A86A8', signal: 'Running low. Short replies are not a mood about you.',
    glyph: ['..###...', '.##..###', '##.....#', '##...##.', '##......', '.##...#.', '..####..', '........'],
    motif: { wave: 'triangle', bpm: 120, notes: [['E4', 2], ['D4', 2], ['B3', 2], ['G3', 4]] } },
  { id: 'curious', color: '#F28C28', signal: 'Asking a lot of questions today. Tell me a thing.',
    glyph: ['..####..', '.#....#.', '......#.', '....##..', '...#....', '...#....', '........', '...#....'],
    motif: { wave: 'square', bpm: 112, notes: [['C5', 1], ['D5', 1], ['F5', 1], ['A5', 1], ['G5', 2], ['A5', 1], ['B5', 3]] } },
  { id: 'low', color: '#4B5BA6', signal: 'A heavy day. Company helps more than advice.',
    glyph: ['..###...', '.#####..', '#######.', '########', '........', '.#..#..#', '#..#..#.', '........'],
    motif: { wave: 'triangle', bpm: 120, notes: [['A3', 2], ['C4', 2], ['B3', 2], ['G#3', 4]] } },
]);

export const MOOD_IDS = Object.freeze(MOODS.map((m) => m.id));
const byId = new Map(MOODS.map((m) => [m.id, m]));
export const mood = (id) => byId.get(id) || byId.get('calm');
/* ---------- motif ---------- */
const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
export function freq(note) {
  const [, n, o] = /^([A-G]#?)(\d)$/.exec(note) || [];
  if (n === undefined) throw new Error(`not a note: ${note}`);
  return 440 * 2 ** ((SEMI[n] + (Number(o) + 1) * 12 - 69) / 12);
}
// The motif as timed events, in seconds from the start. A beat is an eighth note at the motif's bpm.
export function schedule(id) {
  const { motif } = mood(id);
  const beat = 30 / motif.bpm;
  let t = 0;
  return motif.notes.map(([n, len]) => { const e = { at: Number(t.toFixed(4)), dur: Number((len * beat).toFixed(4)), hz: Number(freq(n).toFixed(2)) }; t += len * beat; return e; });
}
