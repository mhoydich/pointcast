/* PMM motion: how each moment in PMM moves, flavoured by the moods of the two people in it.
   plan() is pure, so tests/pmm-motion.test.mjs drives it in Node. play() runs a plan with the Web
   Animations API plus at most two small canvases. Keyframes only touch transform and opacity: colour
   comes from a mood-coloured layer whose opacity moves. DURATION_MS is shared with the sound sprint
   (/pmm/sound/); change it through the PMM coordinator, never here alone. */
import { MOODS, mood, mix, luminance, FIELD } from './moods.temp.js'; // TEMP: ../moods/moods.js once #1533 merges

export const EVENTS = Object.freeze(['boot', 'found', 'connect', 'fail', 'hangup', 'send', 'receive', 'unverified', 'react', 'file-done', 'mood', 'their-mood', 'tab', 'settle', 'join', 'leave']);
export const DURATION_MS = Object.freeze({ boot: 1200, found: 600, connect: 900, fail: 500, hangup: 400, send: 180, receive: 240, unverified: 400, react: 300, 'file-done': 400, mood: 600, 'their-mood': 600, tab: 300, settle: 900, join: 400, leave: 300 });
// What each event animates in PMM, so phase 2 knows which element to hand play().
export const TARGET = Object.freeze({ boot: 'screen', found: 'sigil', connect: 'screen', fail: 'screen', hangup: 'screen', send: 'bubble', receive: 'bubble', unverified: 'bubble', react: 'bubble', 'file-done': 'bubble', mood: 'chip', 'their-mood': 'atmo', tab: 'bubble', settle: 'bubble', join: 'row', leave: 'row' });
export const CHOSEN = 'pmm';
export const MOOD_IDS = Object.freeze(MOODS.map((m) => m.id));
export const BORDER = '#7869C4', FIELD_2 = '#352577', RED = '#E8453C', GREEN = '#58B947';
export const RAINBOW = Object.freeze(['#E8453C', '#F28C28', '#F5D142', '#58B947', '#2F86D8', '#7E57B5']);
export const MAX_FLASHES = 3; // WCAG 2.3.1: no more than three flashes in any one second
export const EMOTE_FPS = 6; // six frame swaps a second is at most three on-off pairs

/* ---------- keyframes ---------- */
const S = (n) => `steps(${n}, end)`;
// One keyframe: offset, x and y in px, rotation in deg, scale (a number or [sx, sy]), opacity.
const k = (offset, x = 0, y = 0, r = 0, s = 1, a = 1) => {
  const [sx, sy] = Array.isArray(s) ? s : [s, s], t = [], n = (v) => +v.toFixed(2);
  if (x || y) t.push(`translate(${n(x)}px,${n(y)}px)`);
  if (r) t.push(`rotate(${n(r)}deg)`);
  if (sx !== 1 || sy !== 1) t.push(sx === sy ? `scale(${n(sx)})` : `scale(${n(sx)},${n(sy)})`);
  return { offset, transform: t.join(' ') || 'none', opacity: a };
};
const fade = (from, to) => [{ offset: 0, opacity: from }, { offset: 1, opacity: to }];
const fadeAt = (hold, from, to) => [{ offset: 0, opacity: from }, { offset: hold, opacity: from }, { offset: 1, opacity: to }];

/* ---------- mood flavour for entrances ----------
   Each mood is a short path into place, as k() rows, and an easing. Stepped, as the brand book
   asks; calm and soft get six steps and read as eased. `late` is when the mood shows up, and is
   all the reduced-motion entrance keeps: tired still arrives late, hyped still snaps in. */
const FLAVOUR = {
  calm: { ease: S(6), late: 0, rows: [[0, 0, 6, 0, 1, 0], [1]] },
  hyped: { ease: S(2), late: 0, rows: [[0, 0, 4, 0, 1, 0], [0.25, -3], [0.5, 3], [0.75, -2], [1]] },
  soft: { ease: S(6), late: 0.1, rows: [[0, 0, 10, 0, 0.98, 0], [0.7, 0, -1], [1]] },
  sunny: { ease: S(3), late: 0, sparks: 4, rows: [[0, 0, 4, 0, 0.92, 0], [0.6, 0, 0, 0, 1.04], [1]] },
  salty: { ease: S(1), late: 0, rows: [[0, -6, 0, 0, 1, 0], [0.34, 4], [0.67, -2], [1]] },
  tired: { ease: S(4), late: 0.45, rows: [[0, 0, -8, 0, 1, 0], [0.45, 0, -8, 0, 1, 0.5], [1]] },
  curious: { ease: S(3), late: 0, origin: '0% 100%', rows: [[0, 0, 4, -6, 1, 0], [0.6, 0, 0, 3], [1]] },
  low: { ease: S(4), late: 0.2, rows: [[0, 0, -6, 0, 1, 0.3], [0.7, 0, 3], [1]] },
};
const flavourKeys = (id, amp) => FLAVOUR[mood(id).id].rows.map(([o, x = 0, y = 0, r = 0, s = 1, a = 1]) => k(o, x * amp, y * amp, r * amp, 1 + (s - 1) * amp, a));
const lateFade = (id) => { const f = FLAVOUR[mood(id).id]; return f.late ? fadeAt(f.late, 0, 1) : fade(0, 1); };

/* ---------- emotes ----------
   Each mood's 8x8 Mood Atlas glyph as a two to four frame loop of small pixel moves, so a glyph
   change in moods.js carries through. */
const W = 8;
const on = (g, x, y) => x >= 0 && x < W && y >= 0 && y < W && g[y][x] === '#';
const map = (g, f) => g.map((row, y) => [...row].map((c, x) => (f(x, y, c === '#') ? '#' : '.')).join(''));
// Rows from..to move by dx, dy; with wrap, what leaves one side comes back on the other.
const shift = (g, dx, dy, wrap = false, from = 0, to = W - 1) => {
  const h = to - from + 1, w = (v, lo, n) => lo + ((((v - lo) % n) + n) % n);
  return map(g, (x, y, c) => { if (y < from || y > to) return c; let sx = x - dx, sy = y - dy; if (wrap) { sx = w(sx, 0, W); sy = w(sy, from, h); } return sy >= from && sy <= to && on(g, sx, sy); });
};
const erode = (g) => map(g, (x, y, c) => c && on(g, x + 1, y) && on(g, x - 1, y) && on(g, x, y + 1) && on(g, x, y - 1));
const core = (g, r) => { let sx = 0, sy = 0, n = 0; map(g, (x, y, c) => { if (c) { sx += x; sy += y; n++; } }); const cx = Math.round(sx / n), cy = Math.round(sy / n); return map(g, (x, y, c) => c && Math.max(Math.abs(x - cx), Math.abs(y - cy)) <= r); };
const FRAMES = {
  calm: (g) => [g, shift(g, 1, 0, true)], // the waves drift
  hyped: (g) => [g, shift(g, 1, 0), g, shift(g, -1, 0)], // the bolt buzzes
  soft: (g) => [g, erode(g)], // the heart beats
  sunny: (g) => [g, core(g, 1)], // the rays twinkle
  salty: (g) => [g, map(g, (x, y, c) => (y % 2 ? on(g, x - 1, y) : c))], // a glitch on every other line
  tired: (g) => [g, shift(g, 0, 1)], // a slow nod
  curious: (g) => [g, shift(g, 1, 0, false, 0, 3), g, shift(g, -1, 0, false, 0, 3)], // the question tilts
  low: (g) => [g, shift(g, 0, 1, true, 5, 7)], // the rain falls
};
export function emoteFrames(id) {
  const out = FRAMES[mood(id).id](mood(id).glyph);
  return Object.freeze(out.filter((f, i) => i === 0 || f.join() !== out[i - 1].join()).map((f) => Object.freeze([...f])));
}
export function drawGlyph(ctx, rows, color) {
  ctx.clearRect(0, 0, W, W); ctx.fillStyle = color;
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') ctx.fillRect(x, y, 1, 1); }));
}

/* ---------- layers ----------
   self: keyframes on the element. tint: a span over it, filled, as an outline, or a 6px left edge;
   `crossfade` shows the previous state fading to the new one, `keep` stays until clear(). ring: the
   tape border on one canvas, bands scrolling or one band sweeping down. sprite: an emote. sparks:
   a few 4px squares flying out. */
const self = (keys, ease, extra) => ({ kind: 'self', keys, ease, ...extra });
const tint = (color, keys, extra) => ({ kind: 'tint', color, keys, ease: 'linear', ...extra });
const sparks = (color, n, reach) => ({ kind: 'sparks', color, n, reach, ease: S(4), keys: fade(1, 0) });
const sprite = (id, fps, keys, ease = S(4), extra) => ({ kind: 'sprite', mood: mood(id).id, color: mood(id).color, frames: fps ? emoteFrames(id) : [emoteFrames(id)[0]], fps, keys, ease, ...extra });
const KEEP = { keep: true }; // a reaction stays on the bubble after it lands
const grad = (a, b) => `linear-gradient(90deg, ${a}, ${b})`;
const stripes = `linear-gradient(90deg, ${RAINBOW.map((c, i) => `${c} ${(i * 50) / 3}% ${((i + 1) * 50) / 3}%`).join(', ')})`;
// Tape-loader bands: the mood colour stepped toward the border, so neighbours sit close in brightness.
const tape = (id) => { const c = mood(id).color; return [c, mix(c, BORDER, 0.7), mix(c, BORDER, 0.45), mix(c, BORDER, 0.7)]; };
// The governor slows the bands until the border flashes no more than three times a second.
function ring(bands, speed, dur) {
  const r = { kind: 'ring', bands, band: 6, speed, thick: 8, keys: fade(1, 1), ease: 'linear' };
  while (r.speed > 1 && ringFlashes(r, dur) > MAX_FLASHES) r.speed = Math.round(r.speed * 0.75);
  return r;
}
const sweep = (color) => ({ kind: 'ring', sweep: true, bands: [color], band: 48, thick: 8, keys: fade(1, 1), ease: 'linear' });
const c = (id) => mood(id).color;

/* ---------- the chosen system ---------- */
const D = {};
const entrance = (ev, o) => {
  const id = ev === 'send' ? o.mood : o.theirMood, f = FLAVOUR[id];
  if (o.reduced) return [self(lateFade(id), f.ease)];
  const out = [self(flavourKeys(id, ev === 'send' ? 0.6 : 1), f.ease, { origin: f.origin })];
  if (f.sparks && ev === 'receive') out.push(sparks(c(id), f.sparks, 12));
  return out;
};
const shake = (...xs) => self([k(0), ...xs.map((x, i) => k((i + 1) / (xs.length + 1), x)), k(1)], S(1));
const redLine = (to) => tint(RED, fade(0, to), { style: 'outline', keep: true, ease: S(3) });
D.pmm = {
  boot: (o) => (o.reduced ? [tint(FIELD_2, fade(1, 0), { crossfade: true, ease: S(4) })] : [ring(tape(o.mood), 160, 1200)]),
  found: (o) => (o.reduced ? [self(fade(0, 1), S(3))] : [self([k(0, 0, 0, 0, 0.4, 0), k(0.6, 0, 0, 0, 1.15), k(1)], S(3)), sparks(GREEN, 4, 18)]),
  connect: (o) => (o.reduced ? [tint(FIELD, fade(1, 0), { crossfade: true, ease: S(6) })] : [sweep(c(o.theirMood)), tint(grad(c(o.mood), c(o.theirMood)), fadeAt(0.5, 0.35, 0))]),
  fail: (o) => (o.reduced ? [redLine(0.35)] : [shake(-4, 4, -3, 2), redLine(0.6)]),
  hangup: (o) => (o.reduced ? [tint(GREEN, fade(1, 0), { crossfade: true, style: 'edge', ease: S(4) })] : [self([k(0), k(0.5, 0, 0, 0, [1, 0.04]), k(1)], S(4))]),
  send: (o) => entrance('send', o),
  receive: (o) => entrance('receive', o),
  unverified: (o) => (o.reduced ? [redLine(1)] : [shake(2, -2, 1), redLine(1)]),
  react: (o) => (o.reduced ? [sprite(o.mood, 0, fade(0, 1), S(3), KEEP)] : [sprite(o.mood, EMOTE_FPS, [k(0, 0, 4, 0, 0, 0), k(0.5, 0, -2, 0, 1.3), k(1)], S(4), KEEP), sparks(c(o.mood), 4, 14)]),
  'file-done': (o) => (o.reduced ? [self(fade(0, 1), S(3))] : [self([k(0, 0, 0, 0, 1.06), k(1)], S(2)), tint(GREEN, fade(0.4, 0), { ease: S(4) })]),
  mood: (o) => (o.reduced ? [tint(c(o.was), fade(0.85, 0), { crossfade: true, ease: S(6) })] : [self([k(0, 0, 0, 0, 0.9), k(0.4, 0, 0, 0, 1.08), k(1)], S(3)), sprite(o.mood, EMOTE_FPS, fadeAt(0.8, 1, 0), S(2))]),
  'their-mood': (o) => (o.reduced ? [tint(grad(c(o.mood), c(o.was)), fade(0.85, 0), { crossfade: true, ease: S(6) })]
    : [tint(grad(c(o.mood), c(o.theirMood)), fadeAt(0.6, 0.5, 0), { scale: [0, 1], origin: '100% 50%', ease: S(6) })]),
  tab: (o) => (o.reduced ? [self(fade(0, 1), S(2))] : [self([k(0, 0, 0, -4, 1.25, 0), k(1)], S(3))]),
  settle: (o) => [...(o.reduced ? [] : [tint(stripes, fade(0.7, 0.7), { slide: true, ease: S(9) })]), tint(stripes, fade(0, 1), { style: 'edge', keep: true, ease: S(3) })],
  join: (o) => [self(o.reduced ? fade(0, 1) : [k(0, -12, 0, 0, 1, 0), k(1)], S(4))],
  leave: (o) => [self(o.reduced ? fade(1, 0.4) : [k(0), k(1, 8, 0, 0, 1, 0.4)], S(3), { fill: 'forwards' })],
};
// The three sketches the sprint compared live in sketches.js, which registers them here. The app never loads them.
export function register(name, table) { if (name !== CHOSEN) D[name] = table; }
export const directions = () => Object.keys(D);
export const kit = Object.freeze({ S, k, fade, fadeAt, self, tint, sparks, sprite, KEEP, grad, tape, ring, sweep, flavourKeys, lateFade, FLAVOUR });

/* ---------- the planner ---------- */
// opts: mood (mine), theirMood, was (the mood before a mood change), reduced, direction.
export function plan(event, opts = {}) {
  if (!EVENTS.includes(event)) throw new Error(`unknown motion event: ${event}`);
  const o = { mood: mood(opts.mood).id, theirMood: mood(opts.theirMood).id, reduced: Boolean(opts.reduced) };
  o.was = mood(opts.was || (event === 'their-mood' ? o.theirMood : o.mood)).id;
  // The sketches had no reduced story of their own: with reduced motion on, they play the chosen one.
  const d = !o.reduced && D[opts.direction]?.[event] ? opts.direction : CHOSEN;
  const p = { event, direction: d, on: TARGET[event], duration: DURATION_MS[event], reduced: o.reduced, mood: o.mood, theirMood: o.theirMood, layers: D[d][event](o) };
  p.flashes = flashes(p);
  return p;
}

/* ---------- flash check ----------
   A flash is a pair of opposing luminance changes of 0.1 or more (WCAG 2.3.1). Opacity stands in for
   luminance on every layer, which overstates it; the tape border uses its bands' real luminance.
   Counted per layer over the worst one-second window, then summed. */
const T = 0.1, HZ = 240;
function changes(s) {
  const out = []; let ext = s[0], dir = 0;
  s.forEach((v, i) => {
    if (dir === 0 ? Math.abs(v - s[0]) >= T : dir * (ext - v) >= T) { dir = Math.sign(v - ext) || Math.sign(v - s[0]); out.push((i * 1000) / HZ); ext = v; }
    else if (dir * (v - ext) > 0) ext = v;
  });
  return out;
}
const worst = (ts) => { let n = 0; for (let i = 0, j = 0; i < ts.length; i++) { while (ts[i] - ts[j] >= 1000) j++; n = Math.max(n, i - j + 1); } return Math.floor(n / 2); };
const opAt = (keys, p) => { // linear between keyframes; stepped easing reaches the same extremes
  for (let i = 1; i < keys.length; i++) if (p <= keys[i].offset) { const a = keys[i - 1], b = keys[i]; return a.opacity + (b.opacity - a.opacity) * ((p - a.offset) / (b.offset - a.offset || 1)); }
  return keys[keys.length - 1].opacity;
};
export function layerSeries(l, duration) {
  const n = Math.max(2, Math.round((duration * HZ) / 1000)), s = [];
  for (let i = 0; i <= n; i++) s.push(opAt(l.keys, i / n));
  // An added layer is dark before and after, unless it shows a state that was already there or stays.
  if (l.kind !== 'self') { if (!l.crossfade) s.unshift(0); if (!l.keep) s.push(0); }
  return s;
}
// Luminance halfway down a 400px border edge, before, during and after.
function ringFlashes(r, duration, H = 400) {
  const base = luminance(BORDER), s = [base];
  for (let t = 0; t <= duration; t += 1000 / HZ) {
    if (r.sweep) { const y = -r.band + ((H + r.band) * t) / duration; s.push(H / 2 >= y && H / 2 < y + r.band ? luminance(r.bands[0]) : base); }
    else s.push(luminance(r.bands[Math.floor((H / 2 + (r.speed * t) / 1000) / r.band) % r.bands.length]));
  }
  s.push(base);
  return worst(changes(s));
}
export function flashes(p) {
  let total = 0;
  for (const l of p.layers) {
    total += l.kind === 'ring' ? ringFlashes(l, p.duration) : worst(changes(layerSeries(l, p.duration)));
    // Each frame swap of an emote counts as a change.
    if (l.kind === 'sprite' && l.frames.length > 1) total += Math.floor(Math.min(l.fps, (l.fps * p.duration) / 1000) / 2);
  }
  return total;
}

/* ---------- the runner ---------- */
const hasDoc = () => typeof document !== 'undefined';
const prefersReduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } };
// A canvas timeline shaped like an Animation, so the runner finishes both alike.
function ticker(duration, draw) {
  let raf = 0, t0 = 0, done; const finished = new Promise((r) => { done = r; });
  const step = (t) => { t0 = t0 || t; const q = Math.min(1, (t - t0) / duration); draw(q); if (q < 1) raf = requestAnimationFrame(step); else done(); };
  raf = requestAnimationFrame(step);
  return { finished, finish() { cancelAnimationFrame(raf); draw(1); done(); } };
}
function paintRing(cv, r, q, duration) {
  const ctx = cv.getContext('2d'), w = cv.width, h = cv.height, th = r.thick;
  ctx.clearRect(0, 0, w, h);
  if (q >= 1) return;
  if (r.sweep) { ctx.fillStyle = r.bands[0]; ctx.fillRect(0, -r.band + (h + r.band) * q, w, r.band); }
  else { const off = (r.speed * q * duration) / 1000; for (let y = -(off % r.band), i = Math.floor(off / r.band); y < h; y += r.band, i++) { ctx.fillStyle = r.bands[i % r.bands.length]; ctx.fillRect(0, y, w, r.band); } }
  ctx.clearRect(th, th, w - th * 2, h - th * 2);
}
// Remove what play() left on an element: every layer, or one event's.
export function clear(el, event) { el?.querySelectorAll?.(event ? `:scope > [data-motion="${event}"]` : ':scope > [data-motion]').forEach((n) => n.remove()); }
export function play(event, el, opts = {}) {
  if (!hasDoc() || document.hidden || typeof el?.animate !== 'function') return Promise.resolve(null);
  const p = plan(event, { ...opts, reduced: opts.reduced ?? prefersReduced() });
  clear(el, event);
  const was = { o: el.style.transformOrigin, v: el.style.overflow, i: el.style.isolation }, made = [], runs = [];
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const timing = (l) => ({ duration: p.duration, easing: l.ease, fill: l.fill || (l.keep ? 'forwards' : 'none') });
  const add = (tag, l, style) => {
    const n = document.createElement(tag);
    Object.assign(n.style, { position: 'absolute', pointerEvents: 'none', ...style }); n.dataset.motion = event; n.setAttribute('aria-hidden', 'true');
    el.append(n); if (!l.keep) made.push(n); return n;
  };
  for (const l of p.layers) {
    if (l.kind === 'self') { if (l.origin) el.style.transformOrigin = l.origin; runs.push(el.animate(l.keys, timing(l))); }
    else if (l.kind === 'tint') {
      // A fill sits under the element's text (z-index -1 inside an isolated element), so words stay readable.
      const look = l.style === 'outline' ? { inset: 0, border: `3px solid ${l.color}` } : { inset: 0, background: l.color, ...(l.style === 'edge' ? { width: '6px' } : { zIndex: -1 }) };
      if (!l.style) el.style.isolation = 'isolate';
      const n = add('span', l, { ...look, transformOrigin: l.origin || '' });
      const tf = l.scale ? (i) => `scaleX(${l.scale[i]})` : l.slide ? (i) => `translateX(${i ? 100 : -100}%)` : null;
      if (l.slide) el.style.overflow = 'hidden';
      runs.push(n.animate(tf ? l.keys.map((kf, i) => ({ ...kf, transform: tf(i ? 1 : 0) })) : l.keys, timing(l)));
    } else if (l.kind === 'sparks') {
      for (let i = 0; i < l.n; i++) {
        const a = (i / l.n) * Math.PI * 2 + 0.4, n = add('i', l, { left: '50%', top: '50%', width: '4px', height: '4px', background: l.color });
        runs.push(n.animate([{ transform: 'translate(-2px,-2px)', opacity: 1 }, { transform: `translate(${Math.round(Math.cos(a) * l.reach) - 2}px,${Math.round(Math.sin(a) * l.reach) - 2}px)`, opacity: 0 }], timing(l)));
      }
    } else if (l.kind === 'sprite') {
      const cv = add('canvas', l, { right: '-10px', top: '-14px', width: '24px', height: '24px', imageRendering: 'pixelated' }), ctx = (cv.width = cv.height = W, cv.getContext('2d'));
      drawGlyph(ctx, l.frames[0], l.color); runs.push(cv.animate(l.keys, timing(l)));
      let last = 0;
      if (l.frames.length > 1) runs.push(ticker(p.duration, (q) => { const i = q >= 1 ? 0 : Math.floor((q * p.duration * l.fps) / 1000) % l.frames.length; if (i !== last) drawGlyph(ctx, l.frames[(last = i)], l.color); }));
    } else if (l.kind === 'ring') {
      // Half resolution: the bands are chunky anyway, and it is a quarter of the pixels.
      const cv = add('canvas', l, { inset: '0', width: '100%', height: '100%', imageRendering: 'pixelated' });
      cv.width = Math.ceil(el.clientWidth / 2); cv.height = Math.ceil(el.clientHeight / 2);
      const r = { ...l, thick: l.thick / 2, band: l.band / 2, speed: l.speed / 2 };
      runs.push(ticker(p.duration, (q) => paintRing(cv, r, q, p.duration)));
    }
  }
  // Hidden mid-play: jump to the end rather than animate for nobody.
  const hide = () => { if (document.hidden) runs.forEach((a) => a.finish()); };
  document.addEventListener('visibilitychange', hide);
  return Promise.all(runs.map((a) => a.finished.catch(() => {}))).then(() => {
    document.removeEventListener('visibilitychange', hide);
    made.forEach((n) => n.remove()); el.style.transformOrigin = was.o; el.style.overflow = was.v; el.style.isolation = was.i;
    return p;
  });
}
// An emote that loops until stopped, for a reaction badge or the lab. A timer at the emote's own
// frame rate, not a 60 Hz loop, and it skips frames while the page is hidden.
export function loopEmote(canvas, id, { reduced = prefersReduced(), fps = EMOTE_FPS } = {}) {
  const frames = emoteFrames(id), ctx = canvas.getContext('2d'); let i = 0;
  canvas.width = canvas.height = W; drawGlyph(ctx, frames[0], c(id));
  if (reduced || frames.length < 2 || !hasDoc()) return () => {};
  const t = setInterval(() => { if (!document.hidden) drawGlyph(ctx, frames[(i = (i + 1) % frames.length)], c(id)); }, 1000 / fps);
  return () => clearInterval(t);
}
