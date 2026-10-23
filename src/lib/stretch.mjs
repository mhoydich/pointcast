/**
 * Stretch with Claude: sessions, poses, timing, and the pixel figure.
 *
 * Pure data and pure functions only, shared by /stretch (browser),
 * /stretch.json (agents), and tests/stretch.test.mjs. The guide copy is
 * written by Claude in the PointCast house voice; it is not Mike's voice.
 */

export const STORAGE_KEY = 'stretch:v1';

// PMM moods, same ids and colors as public/pmm/app.js.
export const MOODS = [
  { id: 'calm', color: '#2F86D8' },
  { id: 'hyped', color: '#E8453C' },
  { id: 'soft', color: '#7E57B5' },
  { id: 'sunny', color: '#F5D142' },
  { id: 'salty', color: '#58B947' },
  { id: 'tired', color: '#8A86A8' },
  { id: 'curious', color: '#F28C28' },
  { id: 'low', color: '#4B5BA6' },
];

// The site-wide pc:mood set is different (chill, hype, focus, flow,
// curious, quiet). Only carry a PMM mood across when the match is plain.
const SITE_MOOD = { calm: 'chill', hyped: 'hype', curious: 'curious', tired: 'quiet', low: 'quiet' };

export const SAFETY =
  'Not medical advice. Stop if anything hurts. If you have an injury, or you are pregnant, check with a clinician first.';

/*
 * Breath patterns are [inhale, hold, exhale, hold] in seconds.
 * Frames are joint positions on a 48 x 48 grid, y down. Frame a is the
 * inhale shape, frame b the exhale shape; the figure moves between them.
 */
const SEATED = {
  head: [24, 10], neck: [24, 15], lSh: [20, 16], rSh: [28, 16],
  lEl: [18, 23], rEl: [30, 23], lHa: [20, 29], rHa: [28, 29],
  hip: [24, 29], lKn: [19, 33], rKn: [29, 33], lFt: [19, 42], rFt: [29, 42],
};
const SIDE_SEATED = {
  head: [23, 10], neck: [22, 15], lSh: [22, 16], rSh: [22, 16],
  lEl: [23, 23], rEl: [23, 23], lHa: [28, 27], rHa: [28, 27],
  hip: [21, 30], lKn: [31, 30], rKn: [31, 30], lFt: [31, 42], rFt: [31, 42],
};
const STANDING_SIDE = {
  head: [23, 7], neck: [22, 12], lSh: [22, 13], rSh: [22, 13],
  lEl: [22, 20], rEl: [22, 20], lHa: [23, 27], rHa: [23, 27],
  hip: [22, 28], lKn: [22, 36], rKn: [22, 36], lFt: [23, 44], rFt: [23, 44],
};
const pose = (base, over) => ({ ...base, ...over });

export const POSES = [
  {
    id: 'neck-tilt',
    name: 'Neck tilt',
    setting: 'chair',
    instruction: 'Sit tall. Let your right ear drift toward your right shoulder, then switch sides. Shoulders stay low.',
    breath: 'Breathe in at the middle. Breathe out as you tilt.',
    easeOff: 'Ease off if you feel tingling or a sharp pull down your arm.',
    pattern: [4, 0, 4, 0],
    sides: true,
    frames: [SEATED, pose(SEATED, { head: [20, 11] })],
  },
  {
    id: 'chin-tuck',
    name: 'Chin tuck',
    setting: 'chair',
    view: 'side',
    instruction: 'Eyes level. Slide your chin straight back, like a small double chin, then let it go.',
    breath: 'Breathe out as you tuck. Breathe in as you release.',
    easeOff: 'Ease off if it makes you dizzy or pinches at the base of the skull.',
    pattern: [3, 0, 3, 0],
    frames: [pose(SIDE_SEATED, { head: [25, 10] }), pose(SIDE_SEATED, { head: [21, 10] })],
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder rolls',
    setting: 'chair',
    instruction: 'Lift both shoulders toward your ears, roll them back, and let them drop. Slow circles.',
    breath: 'Breathe in on the way up. Breathe out as they fall.',
    easeOff: 'Ease off if a shoulder clicks with pain or will not move freely.',
    pattern: [3, 0, 4, 0],
    frames: [
      pose(SEATED, { lSh: [20, 13], rSh: [28, 13], lEl: [18, 20], rEl: [30, 20], lHa: [18, 27], rHa: [30, 27] }),
      pose(SEATED, { lSh: [19, 17], rSh: [29, 17], lEl: [17, 24], rEl: [31, 24], lHa: [19, 30], rHa: [29, 30] }),
    ],
  },
  {
    id: 'wrist-fingers',
    name: 'Wrists and thumbs',
    setting: 'chair',
    instruction: 'Arms out, palms forward. Gently draw the fingers back with the other hand, then fold the thumb into a soft fist and tip it down.',
    breath: 'Breathe easy. Hold each side for a few slow breaths.',
    easeOff: 'Ease off if you feel numbness, tingling, or pain in the wrist.',
    pattern: [4, 0, 4, 0],
    frames: [
      pose(SEATED, { lEl: [13, 16], rEl: [35, 16], lHa: [7, 12], rHa: [41, 12] }),
      pose(SEATED, { lEl: [13, 16], rEl: [35, 16], lHa: [7, 20], rHa: [41, 20] }),
    ],
  },
  {
    id: 'seated-twist',
    name: 'Seated twist',
    setting: 'chair',
    instruction: 'Feet flat. Grow tall, then turn your chest to the right, one hand on the opposite knee. Come back and turn left.',
    breath: 'Breathe in to get taller. Breathe out to turn a little more.',
    easeOff: 'Ease off if your lower back pinches. Turn from the ribs, not the neck.',
    pattern: [4, 0, 5, 0],
    sides: true,
    frames: [
      pose(SEATED, { head: [24, 9], neck: [24, 14] }),
      pose(SEATED, { head: [22, 10], neck: [23, 15], lSh: [21, 16], rSh: [27, 16], lEl: [17, 22], lHa: [19, 29], rEl: [25, 23], rHa: [20, 31] }),
    ],
  },
  {
    id: 'chest-opener',
    name: 'Chest opener',
    setting: 'chair',
    instruction: 'Raise your arms like goalposts, elbows at shoulder height. Squeeze the shoulder blades gently and lift the chest.',
    breath: 'Breathe in to open. Breathe out to soften, keep the shape.',
    easeOff: 'Ease off if the front of a shoulder aches. Lower the elbows a little.',
    pattern: [4, 1, 5, 0],
    frames: [
      pose(SEATED, { lEl: [13, 16], rEl: [35, 16], lHa: [13, 8], rHa: [35, 8], head: [24, 9] }),
      pose(SEATED, { lEl: [14, 17], rEl: [34, 17], lHa: [15, 10], rHa: [33, 10] }),
    ],
  },
  {
    id: 'forward-fold',
    name: 'Standing forward fold',
    setting: 'stand',
    view: 'side',
    instruction: 'Stand, knees soft. Fold forward from the hips and let your head and arms hang. Roll up slowly.',
    breath: 'Breathe out to hang. Let each breath out take you a little lower.',
    easeOff: 'Ease off if you feel lightheaded, or if your back hurts. Bend the knees more, or stay seated.',
    pattern: [4, 0, 6, 0],
    frames: [
      pose(STANDING_SIDE, { lKn: [24, 36], rKn: [24, 36], neck: [29, 36], head: [31, 40], lSh: [29, 35], rSh: [29, 35], lEl: [29, 40], rEl: [29, 40], lHa: [29, 44], rHa: [29, 44] }),
      pose(STANDING_SIDE, { lKn: [24, 36], rKn: [24, 36], neck: [27, 38], head: [28, 43], lSh: [27, 37], rSh: [27, 37], lEl: [27, 42], rEl: [27, 42], lHa: [27, 46], rHa: [27, 46] }),
    ],
  },
  {
    id: 'cat-cow',
    name: 'Cat-cow',
    setting: 'floor',
    view: 'side',
    optional: 'If you can get to the floor. Otherwise do it seated, hands on knees.',
    instruction: 'Hands under shoulders, knees under hips. Drop the belly and look up, then round the back and tuck the chin.',
    breath: 'Breathe in as the belly drops. Breathe out as the back rounds.',
    easeOff: 'Ease off if your knees or wrists complain. Fold a towel under them.',
    pattern: [4, 0, 4, 0],
    frames: [
      {
        head: [36, 27], neck: [32, 31], lSh: [32, 31], rSh: [32, 31], lEl: [32, 37], rEl: [32, 37], lHa: [32, 43], rHa: [32, 43],
        mid: [24, 35], hip: [16, 31], lKn: [16, 43], rKn: [16, 43], lFt: [8, 43], rFt: [8, 43],
      },
      {
        head: [35, 37], neck: [32, 32], lSh: [32, 32], rSh: [32, 32], lEl: [32, 38], rEl: [32, 38], lHa: [32, 43], rHa: [32, 43],
        mid: [24, 26], hip: [16, 32], lKn: [16, 43], rKn: [16, 43], lFt: [8, 43], rFt: [8, 43],
      },
    ],
  },
  {
    id: 'childs-pose',
    name: "Child's pose",
    setting: 'floor',
    view: 'side',
    optional: 'If you can get to the floor. Otherwise fold forward in your chair, arms on your thighs.',
    instruction: 'Knees wide, sit back toward your heels, and walk your hands forward. Rest your forehead down.',
    breath: 'Breathe into your back. Feel it widen on every breath in.',
    easeOff: 'Ease off if your knees hurt. Put a cushion between heels and hips.',
    pattern: [4, 0, 6, 0],
    frames: [
      {
        head: [32, 40], neck: [28, 37], lSh: [28, 37], rSh: [28, 37], lEl: [35, 40], rEl: [35, 40], lHa: [41, 43], rHa: [41, 43],
        mid: [21, 33], hip: [14, 37], lKn: [21, 43], rKn: [21, 43], lFt: [10, 43], rFt: [10, 43],
      },
      {
        head: [32, 41], neck: [28, 38], lSh: [28, 38], rSh: [28, 38], lEl: [35, 41], rEl: [35, 41], lHa: [41, 43], rHa: [41, 43],
        mid: [21, 35], hip: [14, 38], lKn: [21, 43], rKn: [21, 43], lFt: [10, 43], rFt: [10, 43],
      },
    ],
  },
  {
    id: 'box-breath',
    name: 'Box breathing',
    setting: 'chair',
    instruction: 'Hands on your knees. In for four, hold for four, out for four, hold for four. That is one box.',
    breath: 'Follow the count. If the holds feel tight, shorten them.',
    easeOff: 'Ease off if you feel short of breath or lightheaded. Breathe normally.',
    pattern: [4, 4, 4, 4],
    frames: [
      pose(SEATED, { lSh: [20, 15], rSh: [28, 15], head: [24, 9], neck: [24, 14], lHa: [19, 32], rHa: [29, 32], lEl: [17, 24], rEl: [31, 24] }),
      pose(SEATED, { lHa: [19, 32], rHa: [29, 32], lEl: [17, 25], rEl: [31, 25] }),
    ],
  },
];

export const SESSIONS = [
  {
    id: 'phone-neck',
    name: 'Phone neck',
    minutes: 2,
    for: 'For the head-down scroll. Neck, thumbs, and one box of breath.',
    steps: [['neck-tilt', 20], ['chin-tuck', 20], ['shoulder-rolls', 20], ['wrist-fingers', 24], ['chest-opener', 20], ['box-breath', 16]],
  },
  {
    id: 'desk-reset',
    name: 'Desk reset',
    minutes: 5,
    for: 'For the long sit. Shoulders, wrists, a twist, and one stand-up fold.',
    steps: [
      ['shoulder-rolls', 30], ['neck-tilt', 40], ['chin-tuck', 30], ['wrist-fingers', 40],
      ['seated-twist', 48], ['chest-opener', 40], ['forward-fold', 40], ['box-breath', 32],
    ],
  },
  {
    id: 'evening-unwind',
    name: 'Evening unwind',
    minutes: 8,
    for: 'For the end of the day. Slower holds, and the floor if you have it.',
    steps: [
      ['neck-tilt', 45], ['shoulder-rolls', 40], ['seated-twist', 60], ['chest-opener', 45],
      ['forward-fold', 60], ['cat-cow', 70], ['childs-pose', 96], ['box-breath', 64],
    ],
  },
];

export const GUIDE = {
  name: 'Claude',
  hello: 'Hi, I am Claude. I will keep time and keep it gentle. Move only as far as feels good.',
  pick: 'How are you coming in? Pick one, or skip it.',
  after: 'How are you leaving?',
  thanks: 'That is the whole thing. Thanks for taking the break.',
};

export const getPose = (id) => POSES.find((p) => p.id === id) || null;
export const getSession = (id) => SESSIONS.find((s) => s.id === id) || null;
export const validMood = (id) => (MOODS.some((m) => m.id === id) ? id : null);
export const moodColor = (id) => (MOODS.find((m) => m.id === id) || MOODS[0]).color;
export const siteMoodFor = (id) => SITE_MOOD[id] || null;

/** The session the guide suggests for a mood: slower when low, a reset when wound up. */
export function suggestFor(mood) {
  if (mood === 'tired' || mood === 'low' || mood === 'soft') return 'evening-unwind';
  if (mood === 'hyped' || mood === 'salty' || mood === 'curious') return 'desk-reset';
  return 'phone-neck';
}

/** Steps with absolute start and end seconds. */
export function buildTimeline(session) {
  let t = 0;
  const steps = session.steps.map(([poseId, seconds], index) => {
    const step = { index, poseId, seconds, start: t, end: t + seconds };
    t += seconds;
    return step;
  });
  return { sessionId: session.id, steps, total: t };
}

/** Where the session is at `elapsed` seconds. Clamps at both ends. */
export function locate(timeline, elapsed) {
  const e = Math.max(0, Math.min(Number(elapsed) || 0, timeline.total));
  const done = e >= timeline.total;
  const index = done ? timeline.steps.length - 1 : timeline.steps.findIndex((s) => e < s.end);
  const step = timeline.steps[index];
  const inStep = e - step.start;
  return { index, step, inStep, stepLeft: step.end - e, left: timeline.total - e, done };
}

/** Elapsed seconds at the start of step `index`, clamped to the session. */
export function startOf(timeline, index) {
  const i = Math.max(0, Math.min(index, timeline.steps.length - 1));
  return timeline.steps[i].start;
}

/**
 * Breath phase `t` seconds into a pose. `mix` runs 0 -> 1 while breathing
 * in (toward frame a) and 1 -> 0 breathing out, so the figure follows it.
 */
export function breathAt(pattern, t) {
  const [inh, h1, exh, h2] = pattern;
  const cycle = inh + h1 + exh + h2;
  let x = ((Number(t) || 0) % cycle + cycle) % cycle;
  const count = (len) => Math.min(len, Math.floor(x) + 1);
  if (x < inh) return { phase: 'in', label: 'BREATHE IN', count: count(inh), progress: x / inh, mix: x / inh };
  x -= inh;
  if (x < h1) return { phase: 'hold', label: 'HOLD', count: count(h1), progress: x / h1, mix: 1 };
  x -= h1;
  if (x < exh) return { phase: 'out', label: 'BREATHE OUT', count: count(exh), progress: x / exh, mix: 1 - x / exh };
  x -= exh;
  return { phase: 'rest', label: 'HOLD', count: count(h2), progress: x / h2, mix: 0 };
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(Number(seconds) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function moodLine(before, after) {
  const a = validMood(before);
  const b = validMood(after);
  if (a && b) return a === b ? `You came in ${a}, and you leave ${b}. Steady counts.` : `You came in ${a}, you leave ${b}.`;
  if (b) return `You leave ${b}.`;
  if (a) return `You came in ${a}.`;
  return 'You finished. That is enough.';
}

/** Read stretch:v1 defensively: anything malformed becomes a fresh record. */
export function parseStore(raw) {
  const fresh = { v: 1, sound: true, sessions: 0, seconds: 0, log: [] };
  let d;
  try { d = JSON.parse(raw); } catch { return fresh; }
  if (!d || typeof d !== 'object' || d.v !== 1) return fresh;
  const n = (x) => (Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
  const log = Array.isArray(d.log)
    ? d.log
        .filter((e) => e && getSession(e.session))
        .map((e) => ({ session: e.session, before: validMood(e.before), after: validMood(e.after), at: typeof e.at === 'string' ? e.at.slice(0, 30) : '' }))
        .slice(-10)
    : [];
  return { v: 1, sound: d.sound !== false, sessions: n(d.sessions), seconds: n(d.seconds), log };
}

/** A finished session, appended to the record (keeps the last ten). */
export function recordSession(store, { session, before, after, seconds, at }) {
  const s = parseStore(JSON.stringify(store));
  s.sessions += 1;
  s.seconds += Math.max(0, Math.floor(seconds || 0));
  s.log = [...s.log, { session, before: validMood(before), after: validMood(after), at: at || '' }].slice(-10);
  return s;
}

/** Sessions shorter than this, in seconds actually run, are not logged. */
export const MIN_LOGGED_SECONDS = 30;
export const countable = (ranSeconds) => (Number(ranSeconds) || 0) >= MIN_LOGGED_SECONDS;

/** Two-sided poses do the first side, then mirror for the second half of the step. */
export const secondSide = (p, inStep, seconds) => !!p.sides && inStep >= seconds / 2;

/** The still frame under reduced motion: the stretch shape for one-sided poses, the inhale shape otherwise. */
export const stillMix = (p) => (p.sides ? 0 : 1);

/* ---------- colour: mood surfaces and the ink that reads on them ---------- */

export const FIELD = '#40318D';
export const INK_LIGHT = '#F2F0FF';
export const INK_DARK = '#140f33';
export const KEY_MIX = 0.3; // .key.primary: mood over the field
export const CHIP_MIX = 0.3; // a selected mood chip
export const WHO = '#F5D142'; // the fixed CLAUDE> label colour

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
/** Same arithmetic as CSS color-mix(in srgb, a k, b). */
export const mixHex = (a, b, k) => toHex(rgb(a).map((v, i) => v * k + rgb(b)[i] * (1 - k)));
function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/** Light or dark ink, whichever reads better on `bg`. */
export const inkOn = (bg) => (contrast(INK_LIGHT, bg) >= contrast(INK_DARK, bg) ? INK_LIGHT : INK_DARK);

/* ---------- the pixel figure ---------- */

const lerp = (a, b, k) => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k)];

/**
 * Joint positions for a pose at breath `mix` (1 = frame a, 0 = frame b).
 * `mirror` flips the figure left to right, for the second side.
 */
export function frameAt(p, mix, mirror = false) {
  const [a, b] = p.frames;
  const out = {};
  for (const k of Object.keys(a)) {
    const [x, y] = lerp(b[k] || a[k], a[k], Math.max(0, Math.min(1, mix)));
    out[k] = mirror ? [48 - x, y] : [x, y];
  }
  return out;
}

function line([x0, y0], [x1, y1], plot) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    plot(x0, y0);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/**
 * Rasterize a frame into cells on a 48 x 48 grid. Returns a Map of
 * "x,y" -> layer, where layer is 'prop' (chair or mat), 'body', or 'head'.
 */
export function rasterize(j, setting) {
  const cells = new Map();
  const put = (layer) => (x, y) => {
    if (x < 0 || y < 0 || x > 47 || y > 47) return;
    const key = `${x},${y}`;
    if (layer === 'prop' && cells.has(key)) return;
    cells.set(key, layer);
  };
  const thick = (layer) => (x, y) => { put(layer)(x, y); put(layer)(x + 1, y); put(layer)(x, y + 1); put(layer)(x + 1, y + 1); };
  const body = thick('body');

  if (setting === 'chair') {
    line([j.hip[0] - 7, j.hip[1] + 2], [j.hip[0] + 7, j.hip[1] + 2], put('prop'));
    line([j.hip[0] - 6, j.hip[1] + 3], [j.hip[0] - 6, 44], put('prop'));
    line([j.hip[0] + 6, j.hip[1] + 3], [j.hip[0] + 6, 44], put('prop'));
  }
  if (setting === 'floor') line([2, 45], [45, 45], thick('prop'));
  if (setting === 'stand') line([6, 45], [40, 45], put('prop'));

  const mid = j.mid || lerp(j.neck, j.hip, 0.5);
  line(j.hip, mid, body);
  line(mid, j.neck, body);
  line(j.lSh, j.rSh, body);
  for (const s of ['l', 'r']) {
    line(j[`${s}Sh`], j[`${s}El`], body);
    line(j[`${s}El`], j[`${s}Ha`], body);
    const hipSide = [j.hip[0] + (s === 'l' ? -2 : 2) * (j.lKn[0] === j.rKn[0] ? 0 : 1), j.hip[1]];
    line(hipSide, j[`${s}Kn`], body);
    line(j[`${s}Kn`], j[`${s}Ft`], body);
  }
  line(j.neck, j.head, body);
  const [hx, hy] = j.head;
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) put('head')(hx + x, hy + y);
  return cells;
}
