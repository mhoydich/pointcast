/* PMM moods: the eight moods, their glyphs and motifs, what PMM does with them, and how they
   translate to the other mood vocabularies on pointcast.xyz.

   Pure data and pure functions, no DOM and no storage, so /pmm/moods/ draws from it and
   tests/pmm-moods.test.mjs drives it. The eight ids and colours must match MOODS in
   public/pmm/app.js; the test reads app.js and fails if they drift. This file does not change
   what app.js does. */

// Eight rows of eight pixels each, '#' on, '.' off. One C64 character cell per mood.
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
// The same fallback as validMood() in app.js: anything unknown reads as calm.
export const mood = (id) => byId.get(id) || byId.get('calm');

/* ---------- vocabulary map ----------
   PMM has eight moods. The site-wide chip (MoodChip.astro, stored as `pc:mood`) has six:
   chill, hype, focus, flow, curious, quiet. Breakwater reads and writes that same slug and
   has four labels of its own (DAWN, FLOW, RUSH, DRIFT, see src/lib/breakwater/mood.mjs).
   Nouns Messenger has no mood at all: each person carries a noggle colour, so the closest
   translation is a colour, and it is one way only. */
export const SITE_MOODS = Object.freeze(['chill', 'hype', 'focus', 'flow', 'curious', 'quiet']);
export const BREAKWATER_LABELS = Object.freeze(['DAWN', 'FLOW', 'RUSH', 'DRIFT']);
export const NOGGLE_COLORS = Object.freeze(['yellow', 'red', 'green', 'blue', 'pink', 'cool', 'warm', 'ink']);

const PMM_TO_SITE = Object.freeze({ calm: 'chill', hyped: 'hype', soft: 'flow', sunny: 'hype', salty: 'focus', tired: 'quiet', curious: 'curious', low: 'quiet' });
// Where two PMM moods share a site slug, the reverse picks the nearer one: hype is hyped, quiet is tired.
const SITE_TO_PMM = Object.freeze({ chill: 'calm', hype: 'hyped', focus: 'salty', flow: 'soft', curious: 'curious', quiet: 'tired' });
const PMM_TO_NOGGLE = Object.freeze({ calm: 'blue', hyped: 'red', soft: 'pink', sunny: 'yellow', salty: 'green', tired: 'cool', curious: 'warm', low: 'ink' });

export const toSiteMood = (id) => PMM_TO_SITE[mood(id).id];
export const fromSiteMood = (slug) => SITE_TO_PMM[slug] || 'calm';
export const toNoggle = (id) => PMM_TO_NOGGLE[mood(id).id];
// Breakwater only ever hands the town a site slug (siteMoodFromLabel), so its labels go through it.
const BREAKWATER_TO_SITE = Object.freeze({ DAWN: 'chill', FLOW: 'flow', RUSH: 'hype', DRIFT: 'quiet' });
export const fromBreakwater = (label) => fromSiteMood(BREAKWATER_TO_SITE[label] || 'chill');

/* ---------- the atmosphere line ----------
   What a chat shows: both people's mood and local hour on one line, over a left-to-right
   gradient from your mood to theirs. Mirrors renderAtmo() and .atmo in /pmm/. */
export function hourIn(tz, at = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(at);
  } catch {
    return '';
  }
}

export const placeOf = (tz) => (tz ? tz.split('/').pop().replace(/_/g, ' ') : 'somewhere');

export function atmosphere(me, them, at = new Date()) {
  const a = mood(me.mood), b = mood(them.mood);
  const side = (p, m) => `${p.name}: ${m.id} · ${p.tz ? `${hourIn(p.tz, at)} ${p.place || placeOf(p.tz)}` : 'somewhere'}`;
  return {
    line: `${side({ ...me, name: 'YOU' }, a)}   ·   ${side(them, b)}`,
    // .atmo mixes each mood 40% into the screen colour; the chat pane behind it mixes 14%.
    line_gradient: `linear-gradient(90deg, ${mix(a.color, FIELD, 0.4)}, ${mix(b.color, FIELD, 0.4)})`,
    pane_gradient: `linear-gradient(180deg, ${mix(b.color, FIELD, 0.14)}, ${FIELD} 40%, ${mix(a.color, FIELD, 0.14)})`,
  };
}

/* ---------- the world strip ----------
   One mood, 24 zones (UTC-11 to UTC+12), each cell its local hour now and the mood's colour
   dimmed toward the screen at night. Drawn from the visitor's choice and the clock only. PMM has
   no mood server to draw others from: in a chat a mood goes phone to phone. The one copy a server
   keeps is the SI line's: each SEND posts mood, hour, zone and place to /api/ping with the message. */
export const FIELD = '#40318D';
export const NIGHT = '#1A1440';
export const ZONES = Object.freeze(Array.from({ length: 24 }, (_, i) => i - 11));

// 1 at local noon, 0 from 9 pm to 5 am, a straight ramp between.
export function daylight(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h < 5 || h >= 21) return 0;
  return h <= 12 ? (h - 5) / 7 : (21 - h) / 9;
}

export function worldStrip(id, at = new Date()) {
  const m = mood(id);
  const utc = at.getUTCHours() + at.getUTCMinutes() / 60;
  return ZONES.map((off) => {
    const local = (((utc + off) % 24) + 24) % 24;
    const light = daylight(local);
    return { offset: off, hour: Math.floor(local), light: Number(light.toFixed(3)), color: mix(m.color, NIGHT, 0.25 + 0.75 * light) };
  });
}

/* ---------- colour ---------- */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
// The colour `a` mixed `t` of the way over `b` (t = 1 is all a), as CSS color-mix(in srgb) does.
export const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v * t + y[i] * (1 - t))); };
export function luminance(c) {
  return rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
}
export const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// Text that reads on a mood fill: the screen's white ink or a near-black indigo, whichever is higher.
export const DARK = '#0B0820';
export const inkOn = (c) => (contrast(c, '#F2F0FF') >= contrast(c, DARK) ? '#F2F0FF' : DARK);

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
