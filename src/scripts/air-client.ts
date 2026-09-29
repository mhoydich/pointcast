/**
 * Field Reports client — the phone side of /r, /r/[spot] (and /court) and /r/me.
 *
 * One module so the storage keys, the device id and the sound live in one
 * place. Three mounts:
 *   mountAirSpot(root)  the Friday court moment: ask → confirm → receipt → stamp → crew
 *   mountAirHome(root)  the band plan on /r, live readings from GET /api/air
 *   mountAirCard(root)  your card on /r/me, GET /api/air/me + the claim
 *
 * Everything the server needs travels in the POST body; the device id never
 * goes in a query string. The animation starts on the tap and never blocks
 * the POST (build spec §7). Sound only ever follows a user gesture.
 */
import { AIR_CONFIG, AIR_SPOTS, agentUrl, deskAgent, labelFor, type AirSpot } from '../lib/air';
import { beliefParts, callHead } from '../../functions/_lib/air-desk.mjs';
import * as shortwave from '../lib/shortwave-client';
// The spot header's open-now line runs the Pickleball Board's own schedule rules
// (openState/sessionsNow/nextSession) against this court's facts, which the page
// embeds at build time; sunset for a 'dusk' close is today's, from the same math
// the board's conditions use (court-conditions.ts sunsetAt). No courts JSON here.
import { nextSession, openState, sessionsNow } from '../../functions/_lib/court-board.mjs';
import { laParts } from '../../functions/_lib/air-reading.mjs';
import { priorDayWord } from '../../functions/_lib/air-spot-stats.mjs';
import { timeText } from '../lib/court-format';
import { sunTimes } from '../lib/sky';
import { EL_SEGUNDO } from '../lib/burnoff';

// ---------------------------------------------------------------------------
// Storage. Every access is wrapped: private windows, blocked storage and
// thumbnail captures all throw or come back empty, and the page still works.
// ---------------------------------------------------------------------------
const KEYS = {
  device: 'pc_air_device',
  code: 'pc_air_code:', // + spot id
  queue: 'pc_air_queue',
  seenCrew: 'pc_air_seen_crew',
  mute: 'pc_air_mute',
} as const;
const CODE_TTL_MS = 12 * 3_600_000;
const QUEUE_MAX_AGE_MS = 15 * 60_000;
const FAST_POLL_MS = 5_000;
const SLOW_POLL_MS = 30_000;
const FAST_FOR_MS = 30 * 60_000;
const RETRY_MS = [1_000, 3_000, 9_000];
/** One bar at the fence can hold a request open for a minute: give up on a POST after 4 s. */
const POST_TIMEOUT_MS = 4_000;
/** Bus bursts are only a hint to refetch (anyone can burst), so at most one refetch per 5 s. */
const BUS_GAP_MS = 5_000;
const CREW_WINDOW_MS = 30 * 60_000;
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const lsGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* no storage */ } };
const lsDel = (k: string): void => { try { localStorage.removeItem(k); } catch { /* no storage */ } };
const ssGet = (k: string): string | null => { try { return sessionStorage.getItem(k); } catch { return null; } };
const ssSet = (k: string, v: string): void => { try { sessionStorage.setItem(k, v); } catch { /* no storage */ } };
const readJson = <T>(raw: string | null, fallback: T): T => { if (!raw) return fallback; try { return JSON.parse(raw) as T; } catch { return fallback; } };

function uuidV4(): string {
  try { if (typeof crypto.randomUUID === 'function') return crypto.randomUUID(); } catch { /* insecure context */ }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

let memDevice = '';
/** The phone's random id. Falls back to an in-memory id when storage is blocked. */
export function deviceId(): string {
  const have = lsGet(KEYS.device);
  if (have && UUID_V4_RE.test(have)) return have;
  if (!memDevice) memDevice = uuidV4();
  lsSet(KEYS.device, memDevice);
  return memDevice;
}

/** The spot code from ?c= (remembered 12 h), else the remembered one, else null. */
export function codeFor(spot: string): string | null {
  let fromUrl: string | null = null;
  try { fromUrl = new URLSearchParams(location.search).get('c'); } catch { /* no location */ }
  if (fromUrl && /^[A-Za-z0-9]{2,16}$/.test(fromUrl)) {
    lsSet(KEYS.code + spot, JSON.stringify({ code: fromUrl.toUpperCase(), at: Date.now() }));
    return fromUrl.toUpperCase();
  }
  const kept = readJson<{ code?: string; at?: number }>(lsGet(KEYS.code + spot), {});
  if (kept.code && typeof kept.at === 'number' && Date.now() - kept.at < CODE_TTL_MS) return kept.code;
  if (kept.code) lsDel(KEYS.code + spot);
  return null;
}

/**
 * The code this phone already holds for a spot (remembered 12 h), or null.
 * Never reads ?c=: a page that isn't the spot's own (the board) must not
 * store a URL code under the wrong spot, the way codeFor() would.
 */
export function storedCode(spot: string): string | null {
  const kept = readJson<{ code?: string; at?: number }>(lsGet(KEYS.code + spot), {});
  return kept.code && typeof kept.at === 'number' && Date.now() - kept.at < CODE_TTL_MS && /^[A-Za-z0-9]{2,16}$/.test(kept.code) ? kept.code : null;
}

export const isMuted = (): boolean => lsGet(KEYS.mute) === '1';
export function setMuted(on: boolean): void { if (on) lsSet(KEYS.mute, '1'); else lsDel(KEYS.mute); }

// The send queue: a report is saved here before its first POST and leaves on a
// 2xx or 4xx, so a phone locked mid-send still has it. `at` is the tap time.
// Mirrored in memory for when storage is blocked.
type Queued = { spot: string; body: ReportBody; at: number };
let memQueue: Queued[] = [];
const readQueue = (): Queued[] => { const raw = lsGet(KEYS.queue); return (raw == null ? memQueue : readJson<Queued[]>(raw, [])).filter((q) => q && typeof q.at === 'number'); };
const writeQueue = (q: Queued[]): void => { memQueue = q.slice(-10); if (q.length) lsSet(KEYS.queue, JSON.stringify(memQueue)); else lsDel(KEYS.queue); };
/** Latest per spot and question: a newer tap replaces a saved one. */
const enqueue = (item: Queued): void => writeQueue([...readQueue().filter((x) => !(x.spot === item.spot && x.body.kind === item.body.kind)), item]);
const dequeue = (at: number): void => writeQueue(readQueue().filter((x) => x.at !== at));

// Crews this phone has had the reveal for. The in-memory set covers blocked storage,
// where the list never persists and every poll would replay the reveal.
const memSeenCrew = new Set<string>();
const seenCrews = (): string[] => [...new Set([...readJson<string[]>(lsGet(KEYS.seenCrew), []), ...memSeenCrew])];
const markCrewSeen = (id: string): void => {
  memSeenCrew.add(id);
  const s = readJson<string[]>(lsGet(KEYS.seenCrew), []);
  if (!s.includes(id)) lsSet(KEYS.seenCrew, JSON.stringify([...s, id].slice(-20)));
};

// This phone's own actions this visit (session-scoped), so the confirm strip never
// asks you to confirm yourself and a reload still knows you were in the crew window.
const OWN_KEY = 'pc_air_own';
type OwnAction = { id: string; at: number; onsite: boolean };
const ownActions = (): OwnAction[] => readJson<OwnAction[]>(ssGet(OWN_KEY), []).filter((x) => x && typeof x.id === 'string');
const ownIds = (): string[] => ownActions().map((x) => x.id);
const rememberOwn = (id: string, onsite: boolean): void => { const s = ownActions().filter((x) => x.id !== id); ssSet(OWN_KEY, JSON.stringify([...s, { id, at: Date.now(), onsite }].slice(-20))); };
const lastOwnOnsiteAt = (): number => ownActions().reduce((m, x) => (x.onsite && x.at > m ? x.at : m), 0);

// The three field stamps on /passport (PASSPORT_STAMPS in src/lib/play-layer.ts), kept
// in the same map /passport reads: a spot's stamp on an on-site stamp, the crew's on the reveal.
const PASSPORT_KEY = 'pc:passport:stamps';
const PASSPORT_FOR: Record<string, string> = { courts: 'field-courts', beach: 'field-beach' };
function stampPassport(id: string | undefined): void {
  if (!id) return;
  const map = readJson<Record<string, unknown>>(lsGet(PASSPORT_KEY), {});
  if (!map || typeof map !== 'object' || Array.isArray(map) || map[id]) return;
  lsSet(PASSPORT_KEY, JSON.stringify({ ...map, [id]: { id, at: new Date().toISOString(), via: 'field-reports' } }));
  try { window.dispatchEvent(new CustomEvent('pc:me-state-legacy-write', { detail: { key: PASSPORT_KEY } })); } catch { /* no window */ }
}

// ---------------------------------------------------------------------------
// Time and labels, El Segundo's clock.
// ---------------------------------------------------------------------------
const LA = 'America/Los_Angeles';
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "7:38" (pad → "07:38") in LA time. */
export function laClock(when: number | string | Date, pad = false): string {
  const d = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: LA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value || 0) % 24;
  const m = parts.find((p) => p.type === 'minute')?.value || '00';
  return `${pad ? String(h).padStart(2, '0') : h}:${m}`;
}

/** "Mon 3:46 PM" for the top line (2026-09-28: 12-hour, mixed-case weekday — h23 read like a European rail board on a US phone). */
export function laStamp(when: number | Date = new Date()): string {
  const d = when instanceof Date ? when : new Date(when);
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: LA, weekday: 'short' }).format(d);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: LA, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
  return `${wd} ${time}`;
}

/** "3:46 PM" in LA time: the spot header's clock (laClock stays 24-hour for the Today list until it is restyled). */
export function laClock12(when: number | string | Date): string {
  const d = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: LA, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
}

/**
 * An assignment's LA day: "Today", "Tomorrow", else "Mon 5 Oct". Calls go up
 * to a week out, so a bare weekday would read a call seven days away as today.
 */
function laDayWord(when: number | string | Date, now: number = Date.now()): string {
  const d = when instanceof Date ? when : new Date(when);
  const [y, m, day] = laDay(d).split('-').map(Number);
  const [ny, nm, nd] = laDay(now).split('-').map(Number);
  const ahead = Math.round((Date.UTC(y, m - 1, day) - Date.UTC(ny, nm - 1, nd)) / 86_400_000);
  if (ahead === 0) return 'Today';
  if (ahead === 1) return 'Tomorrow';
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: LA, weekday: 'short' }).format(d);
  return `${wd} ${day} ${MON[m - 1].charAt(0)}${MON[m - 1].slice(1).toLowerCase()}`;
}

/** "Tomorrow 6:00 AM", "Mon 5 Oct 5:00 PM": when an assignment ahead opens, LA time. The strip and the spot badge both print this. */
function laWhen(when: number | string | Date, now: number = Date.now()): string {
  const d = when instanceof Date ? when : new Date(when);
  return `${laDayWord(d, now)} ${new Intl.DateTimeFormat('en-US', { timeZone: LA, hour: 'numeric', minute: '2-digit', hour12: true }).format(d)}`;
}

/** "2 seats open", "1 of 2 seats open": the seats left, never the seats taken, so a fresh call never reads as full. */
function seatsOpenText(seatsLeft: number, seats: number): string {
  if (seatsLeft >= seats) return `${seats} ${seats === 1 ? 'seat' : 'seats'} open`;
  return `${Math.max(0, seatsLeft)} of ${seats} seats open`;
}

/** The LA day "YYYY-MM-DD" of a moment. */
export function laDay(when: number | Date = new Date()): string {
  const d = when instanceof Date ? when : new Date(when);
  const p: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat('en-US', { timeZone: LA, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}`;
}

/** "FRI 02 OCT 2026" for '2026-10-02'. Mirrors dayStamp() in functions/_lib/air-points.mjs. */
export function dayStamp(day: string): string {
  const [y, m, d] = String(day).split('-').map(Number);
  if (!y || !m || !d) return String(day).toUpperCase();
  return `${DOW[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()]} ${String(d).padStart(2, '0')} ${MON[m - 1]} ${y}`;
}

/** The labels a stamp prints. Same words as BADGES in functions/_lib/air-points.mjs. */
/** Badges with block-print art in public/images/air/badges/ (the v2 collectible set). */
const BADGE_ART = new Set(['first-light', 'morning-crew', 'still-true', 'byline', 'called-it', 'three-fridays', 'weeks-running', 'fog-eye', 'sunset-shift', 'dead-air', 'first-rain', 'eyeball', 'regular', 'night-editor', 'clockwork']);
const BADGE_LABEL: Record<string, string> = {
  'first-light': 'FIRST LIGHT',
  'morning-crew': 'MORNING CREW',
  'still-true': 'STILL TRUE',
  byline: 'BYLINE',
};

export const supportLabel = (n: number): string => (n >= 2 ? `${n} agree` : n === 1 ? '1 reporter' : '');
/** "no-shade" -> "no shade": the vibe chips' words, same rule as the detail chip labels in AirSpot.astro. */
const extraLabel = (x: string): string => x.replace(/-/g, ' ');
export const agoLabel = (min: number | null | undefined): string => (min == null ? '' : min < 1 ? 'just now' : min === 1 ? '1 min ago' : `${min} min ago`);
const spotById = (id: string): AirSpot | undefined => AIR_SPOTS.find((s) => s.id === id);
const shortOf = (id: string): string => spotById(id)?.short ?? id.toUpperCase();

type StampLike = { kind: string; ref: string; day: string; text?: string; meta?: unknown; traits?: unknown; meta_json?: unknown };

/** What a stamp prints. Uses the server's `text` when it sent one. */
export function stampLine(s: StampLike): string {
  if (s.text) return s.text;
  if (s.kind === 'badge') return BADGE_LABEL[s.ref] ?? String(s.ref).toUpperCase();
  const place = `${shortOf(s.ref)} · ${dayStamp(s.day)}`;
  return s.kind === 'crew' ? `${BADGE_LABEL['morning-crew']} · ${place}` : place;
}

type Traits = { spot?: string; kind?: string; weekday?: number; hour?: number; crewSize?: number | null; firstLight?: boolean; deadAirHours?: number | null; geo?: boolean; answer?: string };

/**
 * The trait line under a stamp on your card: "FRI · 7 AM · 1–4 WAITING · FIRST LIGHT · DEAD AIR 14H".
 * Traits are what air_stamps.meta_json records for the future rarity rating.
 * `answer` (the reporter's own bucket) prints here and is never rated.
 */
export function traitLine(s: StampLike): string {
  const raw = s.traits ?? s.meta ?? s.meta_json;
  const t: Traits = typeof raw === 'string' ? readJson<Traits>(raw, {}) : (raw && typeof raw === 'object' ? (raw as Traits) : {});
  const out: string[] = [];
  if (typeof t.weekday === 'number' && DOW[t.weekday]) out.push(DOW[t.weekday]);
  if (typeof t.hour === 'number') out.push(`${t.hour % 12 || 12} ${t.hour < 12 ? 'AM' : 'PM'}`);
  if (t.spot && t.kind && t.answer) { const l = labelFor(t.spot, t.kind, t.answer); if (l) out.push(l.toUpperCase()); }
  if (typeof t.crewSize === 'number' && t.crewSize > 0) out.push(`CREW ${t.crewSize}`);
  if (t.firstLight) out.push('FIRST LIGHT');
  if (t.deadAirHours == null && t.spot) out.push('FIRST AT SPOT');
  else if (typeof t.deadAirHours === 'number' && t.deadAirHours >= 1) out.push(`DEAD AIR ${t.deadAirHours}H`);
  return out.join(' · ');
}

// ---------------------------------------------------------------------------
// Motion, sound, haptics.
// ---------------------------------------------------------------------------
const reducedMotion = (): boolean => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const emit = (name: string, detail: Record<string, unknown> = {}): void => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch { /* no window */ } };
function buzz(pattern: number[]): void { try { if ('vibrate' in navigator && typeof navigator.vibrate === 'function') navigator.vibrate(pattern); } catch { /* no haptics */ } }

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (isMuted()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}
/** The hero's static blip (playBlip in src/lib/shortwave-client.ts, on the page's one AudioContext); the same bandpass burst when it is missing. */
function blip(): void {
  const a = audio(); if (!a) return;
  try {
    const fn = (shortwave as { playBlip?: (audio: AudioContext | null) => AudioContext | null }).playBlip;
    if (typeof fn === 'function') { ctx = fn(a) ?? a; return; }
  } catch { /* fall through to the local burst */ }
  try {
    const len = Math.floor(a.sampleRate * 0.14), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1400 + Math.random() * 1600; bp.Q.value = 1.4; g.gain.value = 0.07;
    src.buffer = buf; src.connect(bp).connect(g).connect(a.destination); src.start();
  } catch { /* no sound */ }
}
/** The stamp's 90 Hz thump. */
function thump(): void {
  const a = audio(); if (!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.14);
    g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.18);
  } catch { /* no sound */ }
}
/** The crew's C-E-G. */
function chord(): void {
  const a = audio(); if (!a) return;
  try {
    [261.63, 329.63, 392.0].forEach((hz, i) => {
      const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + i * 0.06;
      o.type = 'triangle'; o.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.95);
    });
  } catch { /* no sound */ }
}

/** Confetti through the BirthdayCelebrate classes. Nothing under reduced motion. */
function confetti(): void {
  if (reducedMotion()) return;
  const overlay = document.createElement('div');
  overlay.className = 'confetti-overlay';
  document.body.appendChild(overlay);
  const colors = ['#D42A1E', '#12110E', '#3B6D11', '#534AB7', '#185FA5', '#F7F5EF'];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 240}px`);
    p.style.setProperty('--rot', `${Math.random() * 720}deg`);
    p.style.animationDuration = `${1400 + Math.random() * 1600}ms`;
    p.style.animationDelay = `${Math.random() * 220}ms`;
    overlay.appendChild(p);
  }
  setTimeout(() => overlay.remove(), 4200);
}

/** The receipt line types in, stepped, over `ms`. Appears at once under reduced motion. */
function typeIn(el: HTMLElement, text: string, ms = 300): Promise<void> {
  el.textContent = '';
  if (reducedMotion() || !text) { el.textContent = text; return Promise.resolve(); }
  el.setAttribute('data-typing', '');
  const chars = Array.from(text);
  const ticks = Math.max(1, Math.min(chars.length, Math.floor(ms / 16))); // ~16 ms a step, like a print head
  const per = ms / ticks, chunk = chars.length / ticks;
  return new Promise((done) => {
    let shown = 0;
    const tick = () => {
      shown = Math.min(chars.length, shown + chunk);
      el.textContent = chars.slice(0, Math.round(shown)).join('');
      if (shown < chars.length) setTimeout(tick, per); else { el.removeAttribute('data-typing'); done(); }
    };
    tick();
  });
}

/** A stamp node. `slam` runs the 120 ms slam + 80 ms ink bleed (a 150 ms fade under reduced motion). */
function makeStamp(text: string, kind: 'place' | 'crew' | 'badge' | 'assignment' | 'queued' | 'mini' = 'place', slam = false): HTMLElement {
  const s = document.createElement('span');
  s.className = `air-stamp air-stamp--${kind}`;
  s.setAttribute('role', 'img');
  s.setAttribute('aria-label', text);
  const inner = document.createElement('span');
  inner.className = 'air-stamp__text';
  inner.textContent = text;
  s.append(inner);
  if (slam) { s.setAttribute('data-slam', ''); requestAnimationFrame(() => s.setAttribute('data-landed', '')); }
  return s;
}

// ---------------------------------------------------------------------------
// The API, as spec §4 describes it.
// ---------------------------------------------------------------------------
type Reading = {
  value: string | null; label: string | null; status: 'none' | 'single' | 'agree'; support: number; reportId: string | null;
  observedAt: string | null; ageMin: number | null; bars: number; liveUntil: string | null; bylines: string[];
  crew: { id: string; n: number; at: string } | null;
  last?: { value: string; label: string; observedAt: string; byline: string } | null;
};
/**
 * `desk` is set on an agent's row (the beach's Sky row from the early shift):
 * its call sign and the desk byline ("cc read KLAX at 6:02"), so the list never
 * prints an agent's bare name as if a person filed it "from away".
 */
type TodayRow = { id: string; at: string; byline: string; value: string; onsite: boolean; confirms: number; live: boolean; agent?: boolean; desk?: { call: string; byline: string } | null };
/** What this phone did today, from GET with the X-PC-Device header. */
type You = { reportId: string | null; confirmed: string[]; crewMember: boolean };
/** The spot's next unvoided assignment (build spec §3.4 spotPayload.assignment), or none at all. */
type AssignBadge = { id: string; spot: string; label: string; question: string | null; startsAt: string; endsAt: string; seats: number; seatsLeft: number; reward: number; live: boolean };
/**
 * The spot page header (functions/_lib/air-spot-stats.mjs, docs: spot header
 * design 2026-09-28): everything that moves, filled in beside the sourced
 * facts that render at build time from src/lib/courts.ts. `null` (the whole
 * header, or any one field) means "nothing to say yet", never a zero.
 */
type HeaderToday = { reports: number; validators: number; crew: boolean; lastAt: string | null; lastAgeMin: number | null };
/** One PRIOR line: the day's last on-site reading. No byline — a name next to a past time is a log this header never keeps. */
type HeaderPrior = { day: string; daysAgo: number; at: string; value: string; label: string; support: number } | null;
type HeaderOverride = { value: string; label: string; at: string; support: number; live: boolean } | null;
type HeaderLeader = { handle: string; days: number; house: boolean };
type HeaderWeek = { from: string; to: string; leaders: HeaderLeader[]; guests: number };
type HeaderParking = { value: string; label: string; day: string; at: string } | null;
type HeaderVibe = { label: string; n: number; runnerUp: string | null; chips: string[] } | null;
/** This court's shown hours and blocks, embedded by AirSpot.astro (`script[data-air-court]`); each block carries its provenance words. */
type CourtBlock = { kind: string; label: string; days: number[]; start: string; end: string; from: string | null; until: string | null; fee: string | null; confidence: string; prov: string; tag: 'unconfirmed' | 'stale' | null };
type CourtData = {
  status: 'open' | 'closed';
  hours: { rules: { days: number[]; open: string; close: string }[]; else: 'closed' | 'unknown'; conflict: { text: string; rules: { days: number[]; open: string; close: string }[] } | null; confidence: string; checked: string; src: string } | null;
  blocks: CourtBlock[];
};
type SpotHeader = {
  today: HeaderToday;
  override: HeaderOverride;
  prior: { last: HeaderPrior; sameWeekday: HeaderPrior; typical: { label: string } | null };
  week: HeaderWeek;
  parking: HeaderParking;
  vibe: HeaderVibe;
} | null;
/**
 * GET /api/air/[spot]'s `desk` (functions/_lib/air-store.ts, group M): an
 * early-shift agent's reading, sent only while `reading.status` is 'none'.
 * Only the beach's Sky feed (kind 'fog') is ever confirmable this way — its
 * tide/swell/sun/aqi kinds are agent-only "fact" kinds nobody can report or
 * confirm (functions/_lib/air-kinds.mjs's confirmable()). `reportId` is a
 * normal air_reports id: POST /api/air/confirm takes it exactly like any
 * other report's.
 */
type DeskReadingView = { feed: string; agent: string; value: string; label: string; byline: string; reportId: string };
/**
 * GET /api/air/[spot]'s `call` (functions/_lib/air-store.ts, group M): the
 * spot's one live call from the desk, on its one desk kind (a court's sign,
 * closes or lights question) — sent for every visitor, but this client only
 * shows it inside the receipt, once this visit has its own (build spec §9
 * item 4: "the call after the receipt").
 */
type CallResultView = {
  id: string; agent: string; asker: string; belief: { value: string; label: string }; sourceHost: string;
  options: { v: string; label: string }[]; status: string;
};
/**
 * A call's head and belief line, from config.desk.templates (callHead() and
 * beliefParts() in functions/_lib/air-desk.mjs): "CALL FROM THE DESK · SOL"
 * and "Sol read *Weekends and school breaks* on citymb.info." with the
 * belief label in italics. Shared by the spot page and the board's cards.
 */
export function paintCallLines(head: HTMLElement | null, belief: HTMLElement | null, call: { agent: string; asker: string; belief: { value: string; label: string }; sourceHost: string }): void {
  if (head) head.textContent = callHead(AIR_CONFIG, call);
  if (!belief) return;
  belief.replaceChildren(...(beliefParts(AIR_CONFIG, call) as { text: string; key?: string }[]).map((part) => {
    if (part.key !== 'label') return document.createTextNode(part.text);
    const em = document.createElement('em');
    em.textContent = part.text;
    return em;
  }));
}
type SpotPayload = {
  spot: { id: string; name: string; short: string; kind: string; question: string; options: { v: string; label: string }[]; decayMin: number; courtCall?: { weekday: number; time: string } | null };
  reading: Reading;
  today: TodayRow[];
  yesterday: { at: string; label: string; support: number; bylines: string[]; more: number } | null;
  lastWeek: { date: string; at: string; label: string; support: number } | null;
  serverTime: string;
  you?: You | null;
  assignment?: AssignBadge | null;
  header?: SpotHeader;
  desk?: DeskReadingView | null;
  call?: CallResultView | null;
};
/**
 * `stamps` is the receipt, two at most with the server's text: the place stamp and
 * the highest new badge (receiptStamps() in functions/_lib/air-points.mjs). `more`
 * counts the other new stamps, already in the book; `badges` is every new badge id.
 */
type Award = {
  points: number; pointsToday: number; cap: number; streakWeeks: number; firstLight: boolean; stamps: StampLike[]; more?: number; badges: string[]; crew: { id: string; n: number; at: string } | null;
  /** The assignment seat this report filled (build spec §3.4 viewAward.assignment); its ASSIGNMENT stamp is in `stamps`. */
  assignment?: { id: string; label: string; reward: number; text: string } | null;
};
type ReportBody = { kind: string; value: string; device: string; code: string | null; extras: string[]; asGuest: boolean; observedAt: number };
type Claim = { until: string } | null;
/** A report that answered a live call from the desk (functions/_lib/air-store.ts's answerCall(), group M): the holder and how the judge read it. */
type CallResult = { id: string; agent: string; verdict: 'checked' | 'overruled' | 'pending' | 'unjudged' | 'no-check' };
type ReportResult = { ok: true; replaced: boolean; report: { id: string; value: string; label: string; observedAt: string; byline: string; onsite: boolean; code?: 'none' | 'ok' | 'unknown' }; reading: Reading; today?: TodayRow[]; award: Award; claim?: Claim; call?: CallResult | null };
type ConfirmResult = { ok: true; onsite?: boolean; reading: Reading; today?: TodayRow[]; award: Award; claim?: Claim; next: 'report' | null };
type ApiError = { ok: false; reason: string; retryAfter?: number; reading?: Reading };
type Sent<T> = { status: number; json: T | ApiError | null; network: boolean };

/** Aborts a hung request; undefined where AbortController is missing (the request then just waits). */
function timeoutSignal(ms: number): AbortSignal | undefined {
  try {
    if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  } catch { return undefined; }
}

/** One POST, given up after POST_TIMEOUT_MS; a timeout reads as a network error. */
async function postJson<T>(path: string, body: unknown): Promise<Sent<T>> {
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', accept: 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body), signal: timeoutSignal(POST_TIMEOUT_MS) });
    const json = await res.json().catch(() => null);
    return { status: res.status, json, network: false };
  } catch { return { status: 0, json: null, network: true }; }
}

/** POST with retries at 1 s, 3 s and 9 s on network errors and 5xx. 4xx answers come straight back. */
async function postWithRetry<T>(path: string, body: unknown): Promise<Sent<T>> {
  let last: Sent<T> = { status: 0, json: null, network: true };
  for (let i = 0; i <= RETRY_MS.length; i++) {
    if (i > 0) await wait(RETRY_MS[i - 1]);
    last = await postJson<T>(path, body);
    if (!last.network && last.status < 500) return last;
  }
  return last;
}

async function getJson<T>(path: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(path, { headers: { accept: 'application/json', ...headers }, credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

const ERROR_COPY: Record<string, string> = {
  'rate-limited': 'Too many reports from this phone. Try again in a few minutes.',
  'stale-observation': 'That report is older than 15 minutes. Tap again.',
  'bad-observed-at': 'Your phone’s clock looks off. Tap again.',
  'own-report': 'That one is yours. Pick an answer below.',
  'already-confirmed': 'You already confirmed this one.',
  expired: 'That report expired. Tap what you see now.',
  'not-found': 'That report is gone. Tap what you see now.',
  'store-unavailable': 'The desk is offline. Saved on this phone.',
};

/** Reasons POST /api/air/assign can answer with (ASSIGN_REASONS in functions/_lib/air-assign.mjs). */
const ASSIGN_ERROR_COPY: Record<string, string> = {
  'bad-json': 'That did not go through. Try again.',
  'bad-action': 'That did not go through. Try again.',
  'bad-template': 'Pick a template.',
  'bad-day': 'Pick a day within the next week.',
  'bad-start': 'That start time is outside the spot’s hours, or the window has already ended.',
  'bad-seats': 'Seats must be 1 to 3.',
  'too-many-open': 'Too many open assignments already: 3 at this spot, or 20 today.',
  forbidden: 'House only.',
  'not-found': 'That assignment is gone.',
};

// ---------------------------------------------------------------------------
// The spot page.
// ---------------------------------------------------------------------------
type State = 'idle' | 'sending' | 'stamped' | 'queued' | 'crew';

/** Mount the Friday court moment on a `[data-air-spot]` root rendered by AirSpot.astro. */
export function mountAirSpot(root: HTMLElement): void {
  const spot = root.dataset.airSpot || '';
  const kind = root.dataset.airKind || '';
  const cfg = spotById(spot);
  if (!cfg || !kind) return;
  const q = <T extends HTMLElement = HTMLElement>(sel: string): T | null => root.querySelector<T>(sel);
  const all = <T extends HTMLElement = HTMLElement>(sel: string): T[] => Array.from(root.querySelectorAll<T>(sel));
  const show = (el: HTMLElement | null, on: boolean) => { if (el) el.hidden = !on; };
  const text = (el: HTMLElement | null, s: string) => { if (el) el.textContent = s; };

  const els = {
    clock: q('[data-air-clock]'), live: q('[data-air-dot]'), needle: q('[data-air-needle]'),
    last: q('[data-air-last]'), lastText: q('[data-air-last-text]'),
    assign: q('[data-air-assign]'),
    confirm: q('[data-air-confirm]'), confirmQ: q('[data-air-confirm-q]'), confirmMeta: q('[data-air-confirm-meta]'),
    ask: q('[data-air-ask]'), receipt: q('[data-air-receipt]'), receiptLine: q('[data-air-receipt-line]'), stampSlot: q('[data-air-stamp-slot]'),
    more: q('[data-air-more]'), moreLink: q('[data-air-more-link]'),
    remoteNote: q('[data-air-remote]'), queuedNote: q('[data-air-queued]'),
    tally: q('[data-air-tally]'), count: q('[data-air-count]'), bars: q('[data-air-bars]'), rows: q('[data-air-rows]'), points: q('[data-air-points]'), first: q('[data-air-first]'),
    crewLine: q('[data-air-crew-line]'), crewRing: q('[data-air-crew-ring]'),
    actions: q('[data-air-actions]'), share: q<HTMLButtonElement>('[data-air-share]'), chips: q('[data-air-chips]'), extras: all<HTMLButtonElement>('[data-air-extra]'), signin: q('[data-air-signin]'),
    again: q('[data-air-again]'), today: q('[data-air-today]'), todayList: q('[data-air-today-list]'),
    history: q('[data-air-history]'), note: q('[data-air-note]'), mute: q<HTMLButtonElement>('[data-air-mute]'),
    override: q('[data-air-override]'),
    todayStrip: q('[data-air-today-strip]'), priorStrip: q('[data-air-prior-strip]'), week: q('[data-air-week]'), weekText: q('[data-air-week-text]'),
    parking: q('[data-air-parking]'), parkingText: q('[data-air-parking-text]'), vibe: q('[data-air-vibe]'), vibeText: q('[data-air-vibe-text]'),
    lastWeek: q('[data-air-lastweek]'), lastWeekWhen: q('[data-air-lastweek-when]'), lastWeekText: q('[data-air-lastweek-text]'),
    openState: q('[data-air-open-state]'),
    now: q('[data-air-now]'), nowText: q('[data-air-now-text]'), nowTag: q('[data-air-now-tag]'), nowProv: q('[data-air-now-prov]'),
    next: q('[data-air-next]'), nextText: q('[data-air-next-text]'), nextTag: q('[data-air-next-tag]'), nextProv: q('[data-air-next-prov]'),
    deskNote: q('[data-air-desk-note]'),
    // DeskCall.astro's own markup (shared with pickleball-board.ts's CourtCard wiring):
    // this spot's one desk kind, if it has one, shown inside the receipt only.
    callShell: q('[data-pb-call]'), callHead: q('[data-pb-call-head]'), callBelief: q('[data-pb-call-belief]'),
  };
  // This court's facts for the open-now line (AirSpot.astro embeds them at build time).
  const courtData = ((): CourtData | null => {
    const el = root.querySelector('script[data-air-court]');
    if (!el?.textContent) return null;
    try { return JSON.parse(el.textContent) as CourtData; } catch { return null; }
  })();

  const device = deviceId();
  const code = codeFor(spot);
  root.setAttribute('data-air-code', code ? 'yes' : 'no');
  if (reducedMotion()) root.setAttribute('data-air-motion', 'reduced');

  let state: State = 'idle';
  let current: SpotPayload | null = null;
  let lastSupport = -1;
  // A reload inside the fast-poll window keeps polling fast.
  let lastOwnAction = ownActions().reduce((m, x) => Math.max(m, x.at), 0);
  let myOnsiteAt = 0;
  let myValue: string | null = null;
  // The tap time sent with this visit's report: detail chips re-send it so they land in the same slot.
  let myObservedAt = 0;
  let myExtras: string[] = [];
  // New stamps on this receipt that were counted, not slammed.
  let moreCount = 0;
  // An ASSIGNMENT stamp outranked this receipt's crew stamp, so the server already counted the crew in `more`.
  let crewInMore = false;
  // The confirm strip is standing in for the beach's Sky agent row (`current.desk`), not a
  // human `reading` — set by paintReading(), read by confirmReport() so it knows which
  // report id and label it is confirming. Only ever true on the beach's fog page.
  let usingDesk = false;
  // A "Changed" tap on the desk reading captured before the new report lands (settleReport
  // judges it): the agent and the value it read, so the receipt can say CHECKED/OVERRULED.
  // `changedOnsite` turns true once the server took the "Changed" itself on site: judgeRow()
  // takes the earliest judgment, so that confirm (not the report after it) decides: OVERRULED.
  let deskConfirmContext: { agent: string; value: string; changedOnsite: boolean } | null = null;
  let pollTimer: number | undefined;
  let extrasTimer: number | undefined;
  let refreshing: Promise<void> | null = null;
  // Reports the server called expired or gone: never offered on the strip again this visit.
  const deadReports = new Set<string>();

  const setState = (s: State) => { state = s; root.setAttribute('data-air-state', s); };
  const note = (msg: string) => { text(els.note, msg); show(els.note, !!msg); };
  // The open-now line turns over with the clock (paintOpen is hoisted; it reads only build-time facts).
  const setClock = () => { text(els.clock, laStamp()); paintOpen(); };

  // --- mute toggle (remembered) ---
  const paintMute = () => { if (els.mute) { const m = isMuted(); els.mute.setAttribute('aria-pressed', m ? 'true' : 'false'); els.mute.textContent = m ? 'Sound off' : 'Sound on'; } };
  els.mute?.addEventListener('click', () => { setMuted(!isMuted()); paintMute(); if (!isMuted()) blip(); });
  paintMute();

  // --- the reading on the page ---
  function showAsk(on: boolean) { show(els.ask, on); }
  /**
   * The assignment badge above the question (build spec §3.8): "ASSIGNMENT ·
   * Rack at open · until 7:00 · 1 of 2 seats open · +10" while live and open
   * (the seats left, so a fresh call reads "2 seats open", never "0 of 2"),
   * "Assignment filled" while live with no seats left, else "Next assignment
   * Tomorrow 6:00 AM · +10" for the next one ahead (dated past tomorrow).
   */
  function assignBadgeText(a: AssignBadge): string {
    if (a.live) {
      if (a.seatsLeft <= 0) return 'Assignment filled';
      return `ASSIGNMENT · ${a.label} · until ${laClock(a.endsAt)} · ${seatsOpenText(a.seatsLeft, a.seats)} · +${a.reward}`;
    }
    return `Next assignment ${laWhen(a.startsAt)} · +${a.reward}`;
  }
  function paintAssign(a: AssignBadge | null | undefined) {
    if (!els.assign) return;
    if (!a) { show(els.assign, false); return; }
    text(els.assign, assignBadgeText(a));
    show(els.assign, true);
  }
  /**
   * "CALL FROM THE DESK · SOL" and its belief line, inside the receipt only
   * (build spec §9 item 4) — the shell itself (DeskCall.astro) is physically
   * inside `.air__receipt`, so it can never show before a receipt does. Its
   * buttons are TapRow, unchanged: answering is a normal on-site report.
   */
  function paintCall(call: SpotPayload['call']): void {
    if (!els.callShell) return;
    if (!call) { show(els.callShell, false); return; }
    paintCallLines(els.callHead, els.callBelief, call);
    // TapRow's own "no on-site code yet" hint (build spec §10), same rule as the board's.
    const hint = els.callShell.querySelector<HTMLElement>('[data-pb-tap-hint]');
    if (hint) hint.hidden = !!code;
    show(els.callShell, true);
  }

  function paintReading(data: SpotPayload, opts: { fromOwnAction?: boolean } = {}) {
    current = data;
    const r = data.reading;
    setClock();
    paintAssign(data.assignment);
    paintCall(data.call ?? null);
    show(els.live, r.status !== 'none');
    root.setAttribute('data-air-live', r.status !== 'none' ? 'yes' : 'no');

    // Silence stays quiet: the last expired report, never a zero count. Not today's? Say which day.
    if (r.status === 'none' && r.last?.label) {
      const wd = laDay(new Date(r.last.observedAt)) !== laDay() ? `${weekdayOf(laDay(new Date(r.last.observedAt))).slice(0, 3)} ` : '';
      text(els.lastText, `Last report ${wd}${laClock12(r.last.observedAt)}: ${r.last.label}`);
      show(els.last, true);
    } else show(els.last, false);

    // Confirm strip: a live reading that is not this phone's own and not one it
    // already confirmed (the server's `you`, or this visit's memory). Nothing to confirm in "Can't say".
    const you = data.you ?? null;
    const own = !!r.reportId && (you?.reportId === r.reportId || ownIds().includes(r.reportId));
    const done = !!r.reportId && (you?.confirmed?.includes(r.reportId) || ownIds().includes(`confirm:${r.reportId}`) || deadReports.has(r.reportId));
    // Someone else's newer report can lead a reading this phone already gave; don't ask it to agree with itself.
    const ownRow = you?.reportId ? data.today.find((t) => t.id === you.reportId) : undefined;
    const said = !!ownRow && ownRow.live && ownRow.value === r.value;
    const askable = state === 'idle' || state === 'queued';
    const offer = askable && r.status !== 'none' && !!r.label && r.value !== 'cant' && !own && !done && !said;
    // The beach's Sky agent row (build spec §4, §9): while nobody has reported fog today,
    // `data.desk` is cc's own KLAX-based reading — a normal confirmable report (only the
    // beach's tide/swell/sun/aqi kinds are agent-only "fact" kinds nobody can confirm).
    // Offered exactly like a single-reporter live reading, never alongside one of a person's own.
    usingDesk = !offer && askable && r.status === 'none' && !!data.desk
      && !ownIds().includes(data.desk.reportId) && !deadReports.has(data.desk.reportId);
    if (offer || usingDesk) {
      const l = (offer ? r.label : data.desk!.label)!;
      text(els.confirmQ, `Still ${/^[A-Z][a-z]/.test(l) ? l.charAt(0).toLowerCase() + l.slice(1) : l}?`);
      text(els.confirmMeta, offer ? [supportLabel(r.support), agoLabel(r.ageMin)].filter(Boolean).join(' · ') : data.desk!.byline);
      show(els.confirm, true);
    } else show(els.confirm, false);
    // The strip or the four buttons, never both (spec §7 step 2): "Changed" brings the buttons back.
    if (askable) showAsk(!offer && !usingDesk);

    // Tally, only once there is something to count.
    const live = r.status !== 'none';
    show(els.tally, live);
    if (live) {
      const count = els.count;
      const label = supportLabel(r.support);
      if (count && lastSupport >= 0 && lastSupport !== r.support) {
        emit('air:agree', { spot, support: r.support, was: lastSupport });
        count.setAttribute('data-roll', '');
        setTimeout(() => count.removeAttribute('data-roll'), 220);
      }
      text(count, label);
      if (els.bars) {
        const n = Math.min(12, r.support);
        els.bars.replaceChildren(...Array.from({ length: n }, (_, i) => { const b = document.createElement('i'); b.style.setProperty('--i', String(i)); return b; }));
        els.bars.setAttribute('aria-label', label);
      }
      if (els.rows) {
        const reporters = new Set(data.today.filter((t) => t.live).map((t) => t.byline));
        els.rows.replaceChildren(...r.bylines.map((b) => {
          const li = document.createElement('li');
          const who = document.createElement('b'); who.textContent = b;
          const what = document.createElement('span'); what.textContent = reporters.has(b) ? (r.label || '') : 'still true';
          li.append(who, what);
          return li;
        }));
      }
    }
    lastSupport = r.support;

    // Today's rows, this LA day only.
    if (els.todayList) {
      const rows = data.today.slice(0, 20);
      show(els.today, rows.length > 0);
      els.todayList.replaceChildren(...rows.map((t) => {
        const li = document.createElement('li');
        if (!t.live) li.setAttribute('data-expired', '');
        // An agent's row reads as the desk's ("cc read KLAX at 6:02", linked to its card), never as a person from away.
        const desk = t.desk ?? null;
        if (desk) li.setAttribute('data-agent', '');
        else if (!t.onsite) li.setAttribute('data-remote', '');
        const at = document.createElement('span'); at.className = 'air-mono'; at.textContent = t.at;
        const who = document.createElement('b');
        if (desk) {
          const a = document.createElement('a');
          a.className = 'air-mono';
          a.href = agentUrl(desk.call);
          a.textContent = desk.byline;
          who.append(a);
        } else who.textContent = t.byline;
        const what = document.createElement('span'); what.textContent = labelFor(spot, kind, t.value) ?? t.value;
        const meta = document.createElement('small'); meta.className = 'air-mono';
        meta.textContent = [t.onsite || desk ? '' : 'from away', t.confirms > 0 ? `${t.confirms} still true` : ''].filter(Boolean).join(' · ');
        li.append(at, who, what, meta);
        return li;
      }));
    }

    // Yesterday and last week, plain.
    if (els.history) {
      const lines: string[] = [];
      if (data.yesterday?.label) lines.push(`Yesterday ${data.yesterday.at}: ${data.yesterday.label}${data.yesterday.support >= 2 ? `, ${data.yesterday.support} agree` : ''}${data.yesterday.bylines?.length ? ` — ${data.yesterday.bylines.join(', ')}${data.yesterday.more > 0 ? ` +${data.yesterday.more}` : ''}` : ''}`);
      if (data.lastWeek?.label) lines.push(`Last ${weekdayOf(data.lastWeek.date)} ${data.lastWeek.at}: ${data.lastWeek.label}${data.lastWeek.support >= 2 ? `, ${data.lastWeek.support} agree` : ''}`);
      els.history.replaceChildren(...lines.map((l) => { const p = document.createElement('p'); p.textContent = l; return p; }));
      // The header's PRIOR strip carries these two readings now (12-hour, no names); this
      // older block only shows for a payload without `header`, so nothing prints twice.
      show(els.history, lines.length > 0 && !data.header);
    }

    // The crew: members get the reveal once, everyone else the line. Membership is
    // the server's word (`you.crewMember`, or the crew in our own response), else
    // our last on-site action inside the window.
    // The crew is the day's first one (the server keeps it), so the line names its time.
    if (r.crew) {
      const mine = Math.max(myOnsiteAt, lastOwnOnsiteAt());
      const member = opts.fromOwnAction || (you ? you.crewMember : mine > 0 && Math.abs(new Date(r.crew.at).getTime() - mine) <= CREW_WINDOW_MS);
      if (member && !seenCrews().includes(r.crew.id)) void crewReveal(r.crew, r.bylines);
      else if (!member) { text(els.crewLine, `Morning crew: ${r.crew.n} on the air at ${laClock12(r.crew.at)}.`); show(els.crewLine, true); }
    } else show(els.crewLine, false);

    paintHeader(data);
  }

  function weekdayOf(day: string): string {
    const [y, m, d] = day.split('-').map(Number);
    if (!y || !m || !d) return 'week';
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()];
  }

  // --- the header (spot header design 2026-09-28) ---
  // The moving parts read GET /api/air/[spot]'s `header` (air-store.ts viewHeader,
  // functions/_lib/air-spot-stats.mjs). Every element starts `hidden` in AirSpot.astro
  // and a null field keeps it hidden: nothing here prints a made-up stat. A payload
  // without `header` (a response from before it shipped) leaves the strips as they are.
  // The open-now line needs no API at all: build-time facts plus the clock.
  /** Today's El Segundo sunset as an LA minute-of-day, for a 'dusk' close; null if the math can't say. */
  function sunsetMinute(now: number): number | null {
    try {
      const [y, m, d] = laDay(now).split('-').map(Number);
      const { sunset } = sunTimes(new Date(Date.UTC(y, m - 1, d)), EL_SEGUNDO.lat, EL_SEGUNDO.lon, new Date(now));
      return sunset ? laParts(sunset.getTime()).minuteOfDay : null;
    } catch { return null; }
  }
  /** One schedule line: its words, the "unconfirmed" tag for a partial block, and where each block came from. */
  function paintSched(el: HTMLElement | null, words: HTMLElement | null, tag: HTMLElement | null, prov: HTMLElement | null, blocks: CourtBlock[], line: string | null, provSep = '') {
    if (!el) return;
    if (!line || !blocks.length) { show(el, false); return; }
    text(words, line);
    show(tag, blocks.some((b) => b.tag === 'unconfirmed'));
    text(prov, `${provSep}${[...new Set(blocks.map((b) => b.prov))].join(' · ')}`);
    show(el, true);
  }
  /**
   * "Open ·" / "Closed ·" / "Hours not listed for Mon ·" ahead of the sourced hours
   * line, a drop-in running now ("Advanced drop-in now until 7 PM · $5"), and the
   * next session under About. Repainted with the clock, so it turns over on time.
   */
  function paintOpen() {
    if (!courtData) return;
    const now = Date.now();
    const sunset = sunsetMinute(now);
    const state = openState(courtData, now, sunset);
    let word: string;
    if (state === 'open') word = 'Open';
    else if (state === 'closed') word = 'Closed';
    else if (!courtData.hours) word = 'Hours not listed';
    else if (!courtData.hours.rules.some((r) => r.days.includes(laParts(now).weekday))) word = `Hours not listed for ${weekdayOf(laDay(now)).slice(0, 3)}`;
    else word = 'Hours unclear right now';
    text(els.openState, word);

    const running = sessionsNow(courtData, now, sunset) as { block: CourtBlock; until: string }[];
    paintSched(els.now, els.nowText, els.nowTag, els.nowProv, running.map((r) => r.block),
      running.length ? running.map((r) => `${r.block.label} now until ${r.until}${r.block.fee ? ` · ${r.block.fee}` : ''}`).join(' · ') : null, ' · ');
    const next = running.length ? null : (nextSession(courtData, now, sunset) as { block: CourtBlock; when: string } | null);
    paintSched(els.next, els.nextText, els.nextTag, els.nextProv, next ? [next.block] : [],
      next ? `${next.block.label} ${next.when}–${timeText(next.block.end)}${next.block.fee ? ` · ${next.block.fee}` : ''}` : null);
  }

  const agoLong = (min: number | null): string => (min == null ? '' : min < 1 ? 'just now' : min < 60 ? `${min} min ago` : `${Math.round(min / 60)} h ago`);
  /**
   * "Yesterday 6:12 PM: 1–4 in the rack, 3 agree". The day words come from priorDayWord
   * (air-spot-stats.mjs): "Yesterday", "Sat", "Last Mon" for exactly a week, "Wed Sep 3"
   * past that — the server looks back 90 days, so an old reading never reads as last week's.
   * Never a byline beside a past time.
   */
  const priorWhen = (p: NonNullable<HeaderPrior>): string => priorDayWord(p.day, p.daysAgo) as string;
  const priorRest = (p: NonNullable<HeaderPrior>): string => `${p.at}: ${p.label}${p.support >= 2 ? `, ${p.support} agree` : ''}`;
  /** A strip's lead word ("TODAY", "PRIOR", "ON THE AIR THIS WEEK") in bold, then the text. */
  const lead = (el: HTMLElement, word: string) => { const b = document.createElement('b'); b.textContent = word; el.append(b, document.createTextNode(' · ')); };

  /** One strip bit that never breaks inside itself, so a narrow phone wraps between bits, not mid-entry. */
  const bit = (words: string, cls = 'air__bit'): HTMLSpanElement => { const span = document.createElement('span'); span.className = cls; span.textContent = words; return span; };
  /** Append bits with " · " between them (the separator can break; a bit cannot). */
  const bits = (el: HTMLElement, parts: HTMLElement[]) => parts.forEach((b, i) => { if (i > 0) el.append(document.createTextNode(' · ')); el.append(b); });
  function paintOverride(h: NonNullable<SpotHeader>, data: SpotPayload) {
    if (!els.override) return;
    const o = h.override;
    // Once it has decayed, the silence strip under the header already says "Last report …" for the same report.
    const silence = data.reading.status === 'none' && !!data.reading.last?.label;
    if (!o || (!o.live && silence)) { show(els.override, false); return; }
    els.override.setAttribute('data-live', o.live ? 'yes' : 'no');
    // "Gate locked · reported 7:41 AM · 2 agree": one flex item (the square is ::before), wrapping between bits.
    const line = document.createElement('span');
    bits(line, [`${o.live ? '' : 'Last: '}${o.label}`, `reported ${o.at}`, ...(o.support >= 2 ? [`${o.support} agree`] : [])].map((w) => bit(w)));
    els.override.replaceChildren(line);
    show(els.override, true);
  }
  function paintTodayStrip(t: HeaderToday) {
    const el = els.todayStrip;
    if (!el) return;
    // Silence stays quiet: a day with no reports yet shows no strip, never a row of zeros.
    if (t.reports <= 0) { show(el, false); return; }
    el.replaceChildren();
    lead(el, 'TODAY');
    // Short enough for one line on a 375 px phone: "3 reports · 2 on site · no crew · 8 h ago".
    // "on site" = distinct phones at the court today (reports + "still" confirms).
    const parts = [`${t.reports} ${t.reports === 1 ? 'report' : 'reports'}`, `${t.validators} on site`, t.crew ? 'crew' : 'no crew'];
    if (t.lastAgeMin != null) parts.push(agoLong(t.lastAgeMin));
    bits(el, parts.map((w) => bit(w)));
    show(el, true);
  }
  /** The header's PRIOR strip is the newest earlier day only; the same weekday last week lives under About. */
  function paintPriorStrip(p: NonNullable<SpotHeader>['prior']) {
    const el = els.priorStrip;
    if (el) {
      if (!p.last) show(el, false);
      else {
        el.replaceChildren();
        lead(el, 'PRIOR');
        el.append(bit(`${priorWhen(p.last)} ${p.last.at}:`), document.createTextNode(' '), bit(`${p.last.label}${p.last.support >= 2 ? `, ${p.last.support} agree` : ''}`));
        show(el, true);
      }
    }
    const w = p.sameWeekday;
    if (!els.lastWeek) return;
    // Same day as the PRIOR line (the newest earlier day was a week ago): say it once.
    if (!w || (p.last && p.last.day === w.day)) { show(els.lastWeek, false); return; }
    text(els.lastWeekWhen, priorWhen(w));
    text(els.lastWeekText, priorRest(w));
    show(els.lastWeek, true);
  }
  /** Named on the strip on a narrow phone; the rest fold into "+N more" (CSS shows every one from 421 px up). */
  const WEEK_NARROW_NAMES = 3;
  /** "@mike 4 days · @claire 3 · @pointcast 2 HOUSE · +6 guests": days on air, never a time. */
  function paintWeek(w: HeaderWeek) {
    const el = els.weekText;
    if (!el || !els.week) return;
    const leaders = (w.leaders ?? []).slice(0, 5);
    const guests = Math.max(0, w.guests ?? 0);
    if (!leaders.length && guests <= 0) { show(els.week, false); return; }
    el.replaceChildren();
    lead(el, 'ON THE AIR THIS WEEK');
    const parts: HTMLElement[] = leaders.map((l, i) => {
      const span = bit(`@${l.handle} ${i === 0 ? `${l.days} ${l.days === 1 ? 'day' : 'days'}` : l.days}`, i < WEEK_NARROW_NAMES ? 'air__bit' : 'air__bit air__bit--wide');
      if (l.house) { const tag = document.createElement('b'); tag.className = 'air__tag'; tag.textContent = 'HOUSE'; span.append(tag); }
      return span;
    });
    const extra = leaders.length - WEEK_NARROW_NAMES;
    if (extra > 0) parts.push(bit(`+${extra} more`, 'air__bit air__bit--narrow'));
    if (guests > 0) parts.push(bit(`+${guests} ${guests === 1 ? 'guest' : 'guests'}`));
    // The separator before a wide-only name hides with it, so a narrow line never shows " ·  · ".
    parts.forEach((b, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = b.classList.contains('air__bit--wide') ? 'air__sep-wide' : b.classList.contains('air__bit--narrow') ? 'air__sep-narrow' : '';
        sep.textContent = ' · ';
        el.append(sep);
      }
      el.append(b);
    });
    show(els.week, true);
  }
  /**
   * Parking lives under About, hidden until a header lands: an offline phone or a failed
   * fetch never claims "no report". The server keeps the newest report of the last
   * PARKING_DAYS (7) days, so an empty answer says exactly that.
   */
  function paintParking(p: HeaderParking) {
    if (!els.parkingText || !els.parking) return;
    text(els.parkingText, p?.label ? `${p.label} · ${p.at}` : 'No parking report in the last 7 days');
    show(els.parking, true);
  }
  function paintVibe(v: HeaderVibe) {
    if (!els.vibe) return;
    if (!v?.label || v.n < 3) { show(els.vibe, false); return; }
    const chips = v.chips?.length ? ` (${v.chips.map(extraLabel).join(', ')})` : '';
    text(els.vibeText, `${v.label}${v.runnerUp ? ` · also ${v.runnerUp}` : ''}${chips} · ${v.n} rated`);
    show(els.vibe, true);
  }
  function paintHeader(data: SpotPayload) {
    paintOpen();
    const h = data.header;
    if (!h) return;
    paintOverride(h, data);
    paintTodayStrip(h.today);
    paintPriorStrip(h.prior);
    paintWeek(h.week);
    paintParking(h.parking);
    paintVibe(h.vibe);
  }

  async function refresh(): Promise<void> {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      const data = await getJson<SpotPayload>(`/api/air/${encodeURIComponent(spot)}`, { 'X-PC-Device': device });
      if (data && data.reading) paintReading(data);
      else if (!current) note('');
    })().finally(() => { refreshing = null; });
    return refreshing;
  }

  // --- polling: 5 s for 30 min after our own action, else 30 s; paused while hidden.
  // Every tick, waking up and getting signal back also resend the queue. ---
  function schedule() {
    clearTimeout(pollTimer);
    if (document.hidden) return;
    const fast = Date.now() - lastOwnAction < FAST_FOR_MS;
    pollTimer = window.setTimeout(async () => { void drain(); await refresh(); schedule(); }, fast ? FAST_POLL_MS : SLOW_POLL_MS);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(pollTimer);
    else { setClock(); void drain(); void refresh().then(schedule); }
  });
  window.addEventListener('online', () => { void drain(); });
  // A station post on the bus is only a hint (anyone can burst): refetch, at most once per BUS_GAP_MS.
  let busTimer = 0;
  let busAt = 0;
  window.addEventListener('pc:shortwave:post', (e: Event) => {
    const d = (e as CustomEvent).detail as { via?: string; spot?: string; post?: { via?: string; spot?: string } } | undefined;
    const via = d?.via ?? d?.post?.via;
    const s = d?.spot ?? d?.post?.spot;
    if (via !== 'air' || (s && s !== spot) || busTimer) return;
    busTimer = window.setTimeout(() => { busTimer = 0; busAt = Date.now(); void refresh(); }, Math.max(0, busAt + BUS_GAP_MS - Date.now()));
  });

  // --- the tap ---
  function inkFill(btn: HTMLElement) {
    all('[data-air-value], [data-air-verdict]').forEach((b) => b.removeAttribute('data-pressed'));
    btn.setAttribute('data-pressed', '');
  }
  function swingNeedle() {
    if (!els.needle) return;
    emit('air:needle', { spot, mhz: cfg!.mhz });
    els.needle.removeAttribute('data-swing');
    void els.needle.offsetWidth; // restart the spring
    els.needle.setAttribute('data-swing', '');
  }
  function receiptText(valueLabel: string, how: 'air' | 'remote' | 'queued', verdict?: string, at = Date.now()): string {
    const what = verdict === 'still' ? `STILL ${valueLabel}` : valueLabel;
    const tail = how === 'air' ? 'ON THE AIR' : how === 'remote' ? 'FROM AWAY' : 'SAVED ON THIS PHONE';
    return `${laClock(at, true)} · ${cfg!.short} · ${what.toUpperCase()} · ${tail}`;
  }
  /** The shared start of every tap: ink, buzz, blip, print, needle. Resolves at the 420 ms floor. */
  function begin(btn: HTMLElement, line: string): Promise<void> {
    emit('air:tap', { spot });
    inkFill(btn);
    buzz([30, 40, 30]);
    setState('sending');
    show(els.confirm, false);
    showAsk(false);
    show(els.receipt, true);
    show(els.remoteNote, false); show(els.queuedNote, false);
    els.stampSlot?.replaceChildren(); paintMore(0); crewInMore = false;
    els.crewRing?.replaceChildren(); show(els.crewRing, false);
    note('');
    lastOwnAction = Date.now();
    schedule(); // fast polling starts at the tap, so a crew that forms next reaches this phone within 5 s
    const printed = wait(120).then(() => {
      emit('air:blip', { spot }); blip();
      emit('air:print', { spot, line });
      swingNeedle();
      return els.receiptLine ? typeIn(els.receiptLine, line, 300) : undefined;
    });
    return Promise.all([printed, wait(420)]).then(() => undefined);
  }
  /** "+2 more in your book": new stamps the receipt counts instead of slamming. */
  function paintMore(n: number) {
    moreCount = Math.max(0, n || 0);
    text(els.moreLink, moreCount > 0 ? `+${moreCount} more in your book` : '');
    show(els.more, moreCount > 0);
  }
  /**
   * Two stamps at most: the place stamp slams at max(420 ms, 2xx), then the server's
   * highest new badge 300 ms later; the rest print as "+2 more in your book". A
   * replaced answer re-stamps today's place. A new crew stamp is the crew reveal's
   * to slam (ring, chord, confetti) unless this phone has already seen that crew.
   */
  function landStamps(award: Award, onsite: boolean) {
    const slot = els.stampSlot;
    const slams = (award.stamps || []).filter((s) => s && s.kind).slice(0, 2);
    const place = slams.find((s) => s.kind === 'place');
    const top = slams.find((s) => s.kind !== 'place');
    crewInMore = !!award.crew && top?.kind === 'assignment';
    emit('air:stamp', { spot, stamps: slams.map(stampLine), badges: award.badges || [], more: award.more ?? 0 });
    if (place && slot) { slot.append(makeStamp(stampLine(place), 'place', true)); thump(); }
    else if (onsite && slot) { slot.append(makeStamp(`${cfg!.short} · ${dayStamp(laDay())}`, 'place', true)); thump(); }
    if (onsite) stampPassport(PASSPORT_FOR[spot]);
    paintMore(award.more ?? 0);
    const first = award.firstLight || (award.badges || []).includes('first-light');
    const revealing = top?.kind === 'crew' && !!award.crew && !seenCrews().includes(award.crew.id);
    const second = top && !revealing ? top : null;
    if (first || second) {
      setTimeout(() => {
        if (first) {
          emit('air:first-light', { spot });
          text(els.first, 'First light — you opened the day here.');
          show(els.first, true);
        }
        if (second && slot) slot.append(makeStamp(stampLine(second), second.kind === 'crew' ? 'crew' : second.kind === 'assignment' ? 'assignment' : 'badge', true));
      }, 300);
    }
    if (!first) show(els.first, false);
  }
  function paintPoints(award: Award) {
    const bits: string[] = [];
    if (award.points > 0) bits.push(`+${award.points} points`);
    else if (award.pointsToday >= award.cap && award.cap > 0) bits.push('Daily cap reached');
    if (award.streakWeeks > 0) bits.push(award.streakWeeks === 1 ? '1 week running' : `${award.streakWeeks} weeks running`);
    text(els.points, bits.join(' · '));
    show(els.points, bits.length > 0);
  }
  function afterOwnAction(reading: Reading, today: TodayRow[] | undefined, award: Award, onsite: boolean, claim: Claim, what: 'report' | 'confirm') {
    if (onsite) myOnsiteAt = Date.now();
    setState('stamped');
    show(els.actions, true);
    show(els.again, true);
    // Details go on a report of yours; after a confirm there is nothing to add them to.
    show(els.chips, what === 'report' && !!myValue);
    // Only an anonymous on-site stamp has anything to keep.
    show(els.signin, !!claim && onsite);
    paintPoints(award);
    if (current) paintReading({ ...current, reading, today: today ?? current.today }, { fromOwnAction: !!award.crew });
    if (award.crew && !seenCrews().includes(award.crew.id)) void crewReveal(award.crew, reading.bylines);
    void refresh();
  }

  const CALL_VERDICT_WORD: Record<string, string> = { checked: 'CHECKED', overruled: 'OVERRULED', pending: 'pending', unjudged: 'unjudged', 'no-check': 'no check' };
  /** "Sol's call: CHECKED" / "cc's read: OVERRULED" (build spec §9 item 4): a report that either
   * answered a live call from the desk (`j.call`) or judged the beach's Sky agent row after a
   * "Changed" tap on it (deskConfirmContext). Mutually exclusive: a call only lives on a court's
   * desk kind, and the Sky desk reading only lives on the beach's fog kind. */
  function paintDeskOutcome(j: ReportResult): void {
    if (!els.deskNote) return;
    if (j.call) {
      const name = deskAgent(j.call.agent)?.name ?? j.call.agent;
      text(els.deskNote, `${name}'s call: ${CALL_VERDICT_WORD[j.call.verdict] ?? j.call.verdict}`);
      show(els.deskNote, true);
    } else if (deskConfirmContext) {
      const { agent, value, changedOnsite } = deskConfirmContext;
      // Same rule as judgeRow(): an on-site "Changed" came first and overrules; only
      // when it did not land on site does the report decide (same value checks).
      const verdict = changedOnsite || j.report.value !== value ? 'OVERRULED' : 'CHECKED';
      text(els.deskNote, `${deskAgent(agent)?.name ?? agent}'s read: ${verdict}`);
      show(els.deskNote, true);
    }
    deskConfirmContext = null;
  }

  /** A report the server took: stamp, receipt, tally. Shared by the tap and the queue. */
  function settleReport(j: ReportResult, at: number) {
    const label = labelFor(spot, kind, j.report.value) ?? j.report.value;
    rememberOwn(j.report.id, j.report.onsite);
    if (j.report.onsite) {
      landStamps(j.award, true);
      // "ON THE AIR · ASSIGNMENT +10" (build spec §3.8): this report filled a seat.
      const a = j.award.assignment;
      if (a && els.receiptLine) els.receiptLine.textContent = `${receiptText(label, 'air', undefined, at)} · ASSIGNMENT +${a.reward}`;
      paintDeskOutcome(j);
    } else {
      // The optimistic line said ON THE AIR when the phone had a code; the server says otherwise.
      if (els.receiptLine) els.receiptLine.textContent = receiptText(label, 'remote', undefined, at);
      if (els.remoteNote) els.remoteNote.textContent = j.report.code === 'unknown' ? 'That code is not this spot’s. Filed from away; open the link the group shared to go on the air.' : 'Filed from away. Open this spot’s link with its code to go on the air.';
      show(els.remoteNote, true);
      // Neither a call nor the Sky judge reads a report from away (both need an on-site row).
      deskConfirmContext = null;
    }
    afterOwnAction(j.reading, j.today, j.award, j.report.onsite, j.claim ?? null, 'report');
  }

  // --- the queue: reports saved on this phone, resent until they get an answer ---
  const inflight = new Set<number>(); // tap times being sent right now
  let draining = false;
  let drainTimer: number | undefined;
  let drainStep = 0;
  /** Resend saved reports (any spot, 15 minutes at most). 2xx or 4xx takes one off the queue; no answer stops the pass. */
  async function drain(): Promise<void> {
    if (draining) return;
    const queue = readQueue();
    const fresh = queue.filter((x) => Date.now() - x.at < QUEUE_MAX_AGE_MS);
    if (fresh.length !== queue.length) writeQueue(fresh);
    const due = fresh.filter((x) => !inflight.has(x.at));
    if (!due.length) { drainStep = 0; return; }
    draining = true;
    let stalled = false;
    try {
      for (const item of due) {
        inflight.add(item.at);
        const res = await postJson<ReportResult>(`/api/air/${encodeURIComponent(item.spot)}`, item.body);
        inflight.delete(item.at);
        if (res.network || res.status === 0 || res.status >= 500) { stalled = true; break; }
        dequeue(item.at);
        const j = res.json;
        if (item.spot === spot && item.body.kind === kind && j && j.ok === true && 'report' in j) landQueued(item, j);
      }
    } finally { draining = false; }
    clearTimeout(drainTimer);
    // 1 s, 3 s, 9 s; after that the poll, 'online' and waking up keep trying.
    if (stalled && drainStep < RETRY_MS.length) drainTimer = window.setTimeout(() => void drain(), RETRY_MS[drainStep++]);
    if (!stalled) drainStep = 0;
  }
  /** A saved report went through: its receipt and stamp land now, unless the phone is mid-tap. */
  function landQueued(item: Queued, j: ReportResult) {
    lastOwnAction = Date.now();
    if (state === 'sending') { rememberOwn(j.report.id, j.report.onsite); note('Your saved report went out.'); return; }
    myValue = j.report.value; myObservedAt = item.body.observedAt; myExtras = item.body.extras;
    const label = labelFor(spot, kind, j.report.value) ?? j.report.value;
    show(els.confirm, false); showAsk(false);
    show(els.receipt, true); show(els.queuedNote, false); show(els.remoteNote, false);
    els.stampSlot?.replaceChildren(); paintMore(0);
    if (els.receiptLine) els.receiptLine.textContent = receiptText(label, j.report.onsite ? 'air' : 'remote', undefined, item.at);
    settleReport(j, item.at);
    note('Your saved report went out.');
  }

  async function fileReport(btn: HTMLElement, value: string, extras: string[] = [], observedAt = Date.now()): Promise<void> {
    const label = labelFor(spot, kind, value) ?? value;
    const body: ReportBody = { kind, value, device, code, extras, asGuest: false, observedAt };
    myValue = value; myExtras = extras; myObservedAt = observedAt;
    // Saved before it is sent: a phone locked or closed mid-send still has it.
    enqueue({ spot, body, at: observedAt });
    inflight.add(observedAt);
    const floor = begin(btn, receiptText(label, code ? 'air' : 'remote'));
    const sent = postJson<ReportResult>(`/api/air/${encodeURIComponent(spot)}`, body);
    const [, res] = await Promise.all([floor, sent]);
    inflight.delete(observedAt);
    const j = res.json;
    const reason = j && j.ok === false ? j.reason : '';
    if (res.network || res.status >= 500 || res.status === 0) {
      // No answer: the dashed stamp, the buttons back, and the queue retries (1 s, 3 s, 9 s, then every poll).
      if (els.receiptLine) els.receiptLine.textContent = receiptText(label, 'queued');
      els.stampSlot?.replaceChildren(makeStamp('Saved on this phone. Sending when you have signal.', 'queued', true)); paintMore(0);
      show(els.queuedNote, true);
      setState('queued');
      showAsk(true);
      clearTimeout(drainTimer);
      drainStep = 0;
      drainTimer = window.setTimeout(() => void drain(), RETRY_MS[drainStep++]);
      return;
    }
    dequeue(observedAt);
    if (j && j.ok === true && 'report' in j) {
      settleReport(j, observedAt);
      if (j.replaced) note('Answer updated.');
      return;
    }
    if (res.status === 429) { const s = (j as ApiError | null)?.retryAfter; note(s ? `Too many reports from this phone. Try again in ${Math.ceil(s / 60)} min.` : ERROR_COPY['rate-limited']); }
    else note(ERROR_COPY[reason] || 'That did not go through. Tap again.');
    setState('idle');
    show(els.receipt, false);
    showAsk(true);
    if (current) paintReading(current);
  }

  async function confirmReport(btn: HTMLElement, verdict: 'still' | 'changed' | 'cant'): Promise<void> {
    // usingDesk (set by paintReading()): this strip stands for the beach's Sky agent row,
    // not a human `reading` — the report id and label come from `current.desk` instead.
    const desk = usingDesk ? current?.desk : null;
    const reportId = desk ? desk.reportId : current?.reading?.reportId;
    const label = desk ? desk.label : current?.reading?.label;
    if (!reportId || !label) { showAsk(true); return; }
    if (verdict === 'changed') {
      // "Changed" is a report, so it goes straight to the four buttons. The verdict
      // still goes on the record (the server answers next: 'report'), without waiting.
      inkFill(btn); buzz([30]);
      show(els.confirm, false); showAsk(true);
      els.ask?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      rememberOwn(`confirm:${reportId}`, false);
      // The desk fact's own judge (functions/_lib/air-desk.mjs's judgeRow()) takes the earliest
      // on-site judgment: this "Changed" if the server takes it on site, else the report that
      // follows. The note that names the verdict waits for that report to land.
      const ctx = desk ? { agent: desk.agent, value: desk.value, changedOnsite: false } : null;
      deskConfirmContext = ctx;
      void postJson<ConfirmResult>('/api/air/confirm', { reportId, verdict, device, code }).then((res) => {
        const cj = res.json;
        if (ctx && cj && cj.ok === true && cj.onsite === true) ctx.changedOnsite = true;
      });
      return;
    }
    const floor = begin(btn, receiptText(label, code ? 'air' : 'remote', verdict));
    const sent = postWithRetry<ConfirmResult>('/api/air/confirm', { reportId, verdict, device, code });
    const [, res] = await Promise.all([floor, sent]);
    const j = res.json;
    if (j && j.ok === true && 'next' in j) {
      const onsite = typeof j.onsite === 'boolean' ? j.onsite : !!code && (j.award.points > 0 || (j.award.stamps || []).length > 0);
      rememberOwn(`confirm:${reportId}`, onsite);
      // A confirm is not a report of yours: nothing for the detail chips to go on.
      myValue = null; myObservedAt = 0; myExtras = [];
      els.extras.forEach((chip) => chip.setAttribute('aria-pressed', 'false'));
      if (onsite) {
        landStamps(j.award, true);
        // "Still true" on-site is a definitive same-value judge (judgeRow()): checked, at once.
        if (desk && els.deskNote) { text(els.deskNote, `${deskAgent(desk.agent)?.name ?? desk.agent}'s read: CHECKED`); show(els.deskNote, true); }
      } else {
        if (els.receiptLine) els.receiptLine.textContent = receiptText(label, 'remote', verdict);
        if (els.remoteNote) els.remoteNote.textContent = code ? 'Noted from away: this confirm does not add to the count.' : 'Filed from away. Open this spot’s link with its code to go on the air.';
        show(els.remoteNote, true);
      }
      afterOwnAction(j.reading, j.today, j.award, onsite, j.claim ?? null, 'confirm');
      return;
    }
    const reason = j && j.ok === false ? j.reason : '';
    if (res.network || res.status >= 500 || res.status === 0) note('No signal. Tap again when you have some.');
    else note(ERROR_COPY[reason] || 'That did not go through. Tap again.');
    setState('idle');
    show(els.receipt, false);
    if (reason === 'expired' || reason === 'not-found') deadReports.add(reportId);
    if ((j as ApiError | null)?.reading && current) current = { ...current, reading: (j as ApiError).reading! };
    if (reason === 'own-report' || reason === 'expired' || reason === 'not-found') { show(els.confirm, false); showAsk(true); }
    else if (current) paintReading(current);
    if (reason === 'already-confirmed') show(els.confirm, false);
  }

  // --- the crew reveal ---
  async function crewReveal(crew: { id: string; n: number; at: string }, bylines: string[]): Promise<void> {
    markCrewSeen(crew.id);
    stampPassport('field-crew');
    emit('air:crew', { spot, id: crew.id, n: crew.n });
    setState('crew');
    show(els.crewLine, false);
    buzz([40, 60, 40, 60, 120]);
    const reduced = reducedMotion();
    // Bars count up over 600 ms.
    if (els.bars) { els.bars.setAttribute('data-count', ''); setTimeout(() => els.bars?.removeAttribute('data-count'), 700); }
    // Three small stamps ring in, 120 ms apart.
    const ring = els.crewRing;
    if (ring) {
      ring.replaceChildren();
      show(ring, true);
      const names = (bylines.length ? bylines : ['crew']).slice(0, 3);
      for (let i = 0; i < names.length; i++) {
        await wait(reduced ? 0 : 120);
        ring.append(makeStamp(names[i], 'mini', true));
      }
    }
    await wait(reduced ? 150 : 240);
    const crewText = `MORNING CREW · ${cfg!.short} · ${dayStamp(laDay(new Date(crew.at)))}`;
    // A reopened phone has an empty receipt: print the crew line so the stamp lands on
    // paper, and bring the paper into view since the ask still sits above it.
    const reopened = !!els.receipt?.hidden;
    if (els.receiptLine && !els.receiptLine.textContent) els.receiptLine.textContent = `${laClock(Date.now(), true)} · ${cfg!.short} · ${crew.n} ON THE AIR · MORNING CREW`;
    show(els.receipt, true);
    if (reopened) els.receipt?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    // Still two stamps at most: a crew that forms after this receipt outranks the badge on it, which moves to the count.
    // An ASSIGNMENT stamp outranks the crew (RECEIPT_ORDER): it stays, and the crew stamp is counted instead.
    // crewInMore is set synchronously by landStamps, whose ASSIGNMENT stamp only lands 300 ms later: under
    // reduced motion this runs at ~150 ms, before that stamp is in the slot, so the flag decides, not the DOM.
    if (crewInMore || els.stampSlot?.querySelector('.air-stamp--assignment')) {
      if (!crewInMore) paintMore(moreCount + 1);
      crewInMore = true;
    } else {
      const bumped = els.stampSlot?.querySelector('.air-stamp--badge');
      if (bumped) { bumped.remove(); paintMore(moreCount + 1); }
      els.stampSlot?.append(makeStamp(crewText, 'crew', true));
    }
    thump();
    chord();
    confetti();
    if (state === 'crew') setTimeout(() => { if (state === 'crew') setState('stamped'); }, 2500);
  }

  // --- wiring ---
  /**
   * The call from the desk's own TapRow (DeskCall.astro, embedded in the
   * receipt): answering it is a normal on-site report on this spot's desk
   * kind. Wired here rather than through pickleball-board.ts's delegated
   * listener (this page has no `[data-pb-board]` root of its own).
   */
  els.callShell?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-pb-tap-value]');
    if (!btn) return;
    const row = btn.closest<HTMLElement>('[data-pb-tap]');
    const [callSpot, callKind] = (row?.dataset.pbTap || '').split(':');
    if (!row || row.dataset.pbTapState === 'sending' || !callSpot || !callKind) return;
    row.dataset.pbTapState = 'sending';
    const tapNote = row.querySelector<HTMLElement>('[data-pb-tap-note]');
    void postJson<ReportResult>(`/api/air/${encodeURIComponent(callSpot)}`, {
      kind: callKind, value: btn.dataset.pbTapValue || '', device, code, extras: [], asGuest: false, observedAt: Date.now(),
    }).then((res) => {
      const j = res.json;
      if (j && j.ok === true && 'report' in j) {
        // "Answered." only when the server says this report closed the call (`j.call`):
        // "Can't say" on site leaves it open for the next person, and says so.
        const cant = j.report.value === 'cant';
        row.dataset.pbTapState = j.report.onsite && !j.call && cant ? 'idle' : 'sent';
        if (tapNote) {
          tapNote.textContent = !j.report.onsite ? 'Filed from away · open your group link at the court to answer.'
            : j.call ? 'Answered.'
            : cant ? 'Noted. The call stays open for someone who can say.'
            : 'Noted.';
          tapNote.hidden = false;
        }
        paintDeskOutcome(j);
        void refresh();
      } else if (j && j.ok === false && j.reason === 'no-open-call') {
        // Someone answered it (or it expired) since this page last looked: done, not "tap again".
        row.dataset.pbTapState = 'sent';
        if (tapNote) { tapNote.textContent = 'Already answered.'; tapNote.hidden = false; }
        void refresh();
      } else {
        row.dataset.pbTapState = 'idle';
        if (tapNote) { tapNote.textContent = 'Didn’t send. Tap again.'; tapNote.hidden = false; }
      }
    });
  });

  all('[data-air-value]').forEach((btn) => btn.addEventListener('click', () => {
    if (state === 'sending') return;
    void fileReport(btn, btn.dataset.airValue || '', myExtras);
  }));
  all('[data-air-verdict]').forEach((btn) => btn.addEventListener('click', () => {
    if (state === 'sending') return;
    void confirmReport(btn, (btn.dataset.airVerdict as 'still' | 'changed' | 'cant') || 'still');
  }));
  els.again?.addEventListener('click', () => { show(els.receipt, false); setState('idle'); showAsk(true); els.ask?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); });
  // Detail chips re-file the same answer with extras at the report's own tap time, so the
  // server replaces that slot's row (never a new one in the next slot) and pays nothing twice.
  els.extras.forEach((chip) => chip.addEventListener('click', () => {
    if (!myValue || !myObservedAt) return;
    const v = chip.dataset.airExtra || '';
    const on = chip.getAttribute('aria-pressed') === 'true';
    if (!on && myExtras.length >= 3) { note('Three details at most.'); return; }
    chip.setAttribute('aria-pressed', on ? 'false' : 'true');
    myExtras = on ? myExtras.filter((x) => x !== v) : [...myExtras, v];
    clearTimeout(extrasTimer);
    extrasTimer = window.setTimeout(() => {
      const body: ReportBody = { kind, value: myValue!, device, code, extras: myExtras, asGuest: false, observedAt: myObservedAt };
      void postJson<ReportResult>(`/api/air/${encodeURIComponent(spot)}`, body).then((res) => {
        if (res.json && res.json.ok === true) note('Details added.');
        else if (res.json && res.json.ok === false && res.json.reason === 'stale-observation') note('Details only go on a report from the last 15 minutes.');
      });
    }, 600);
  }));
  els.share?.addEventListener('click', async () => {
    const url = `${location.origin}/r/${spot}${code ? `?c=${encodeURIComponent(code)}` : ''}`;
    const r = current?.reading;
    const line = r?.label ? `${cfg.name} · ${r.label}${r.support ? ` · ${supportLabel(r.support)}` : ''} · ${laClock(r.observedAt || Date.now())}` : `${cfg.name} · ${cfg.kinds[kind]?.question ?? ''}`;
    try {
      if (typeof navigator.share === 'function') { await navigator.share({ title: `${cfg.name} · PointCast`, text: line, url }); return; }
    } catch { /* cancelled or unsupported: copy instead */ }
    try { await navigator.clipboard.writeText(`${line} ${url}`); note('Link copied. Paste it to the group.'); } catch { note(url); }
  });

  // First paint: the clock, the reading and the queue together. The buttons stay
  // invisible (data-air-wait) until the reading says whether the strip goes there
  // instead, or 1.2 s passes, so nothing moves under a thumb.
  setClock();
  window.setInterval(setClock, 30_000);
  const ready = () => root.removeAttribute('data-air-wait');
  window.setTimeout(ready, 1_200);
  void drain();
  void refresh().finally(ready).then(schedule);
}

// ---------------------------------------------------------------------------
// The band plan on /r.
// ---------------------------------------------------------------------------
type AirIndex = { spots: { id: string; name: string; short: string; mhz: number; channel: string; reading: { label: string; status: string; ageMin: number; bars: number } | null; lastAt: string | null }[]; courtCall: { live: boolean; minutesUntil: number } | null };
/** One open assignment as GET /api/air/assign lists it. */
type AssignItem = { id: string; spot: string; label: string; question: string | null; startsAt: string; endsAt: string; seats: number; seatsLeft: number; reward: number; live: boolean };
/** The directors-only `recent` row: the last 14 days, voided ones too, with fillers and a WITNESSED count. */
type RecentAssign = AssignItem & { filled: number; witnessed: number; fillers: string[]; voidedAt: string | null; voidReason: string | null; createdAt: string };
type AssignIndex = { open: AssignItem[]; canCreate: boolean; serverTime: string; recent?: RecentAssign[] };

export function mountAirHome(root: HTMLElement): void {
  const callText = root.querySelector<HTMLElement>('[data-air-call-text]');
  const callDot = root.querySelector<HTMLElement>('[data-air-call-live]');
  const assignStrip = root.querySelector<HTMLElement>('[data-air-assign-strip]');
  const assignList = root.querySelector<HTMLElement>('[data-air-assign-strip-list]');
  const paintAssignStrip = (data: AssignIndex | null) => {
    if (!assignStrip || !assignList) return;
    // Calls with a seat left: live ones ("until 7:00"), then the next ones ahead ("Tomorrow 6:00 AM"), soonest first as GET lists them.
    const open = (data?.open ?? []).filter((a) => a.seatsLeft > 0);
    assignStrip.hidden = open.length === 0;
    if (open.length === 0) return;
    assignList.replaceChildren(...open.slice(0, 5).map((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `/r/${a.spot}`;
      link.textContent = a.label;
      const meta = document.createElement('span');
      meta.className = 'air-mono';
      meta.textContent = a.live ? `until ${laClock(a.endsAt)} · +${a.reward}` : `${laWhen(a.startsAt)} · +${a.reward}`;
      li.append(link, meta);
      return li;
    }));
  };
  const paint = (data: AirIndex) => {
    for (const s of data.spots || []) {
      const row = root.querySelector<HTMLElement>(`[data-air-row="${CSS.escape(s.id)}"]`);
      if (!row) continue;
      const reading = row.querySelector<HTMLElement>('[data-air-row-reading]');
      const meta = row.querySelector<HTMLElement>('[data-air-row-meta]');
      const bars = row.querySelector<HTMLElement>('[data-air-row-bars]');
      const dot = row.querySelector<HTMLElement>('[data-air-row-live]');
      if (s.reading?.label) {
        row.setAttribute('data-live', 'yes');
        if (reading) reading.textContent = s.reading.label;
        if (meta) meta.textContent = [s.reading.status === 'agree' ? 'agree' : '', agoLabel(s.reading.ageMin)].filter(Boolean).join(' · ');
        if (bars) { bars.setAttribute('data-bars', String(s.reading.bars)); bars.hidden = false; }
        if (dot) dot.hidden = false;
      } else {
        row.setAttribute('data-live', 'no');
        if (reading) reading.textContent = s.lastAt ? `Last report ${laClock(s.lastAt)}` : 'Quiet';
        if (meta) meta.textContent = s.lastAt && laDay(new Date(s.lastAt)) !== laDay() ? laStamp(new Date(s.lastAt)).split(' ')[0] : '';
        if (bars) bars.hidden = true;
        if (dot) dot.hidden = true;
      }
    }
    if (callText && data.courtCall) {
      if (data.courtCall.live) { callText.textContent = 'Court Call is on now.'; if (callDot) callDot.hidden = false; }
      else {
        const m = data.courtCall.minutesUntil;
        const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
        const inText = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${String(mm).padStart(2, '0')}m` : `${mm} min`;
        callText.textContent = `Next Court Call in ${inText}.`;
        if (callDot) callDot.hidden = true;
      }
    }
  };
  let timer: number | undefined;
  const tick = async () => {
    const [data, assignData] = await Promise.all([
      getJson<AirIndex>('/api/air'),
      assignStrip ? getJson<AssignIndex>('/api/air/assign') : Promise.resolve(null),
    ]);
    if (data) paint(data);
    if (assignStrip) paintAssignStrip(assignData);
    clearTimeout(timer);
    if (!document.hidden) timer = window.setTimeout(tick, SLOW_POLL_MS);
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else void tick(); });
  // A station post on the bus is only a hint to refetch, at most once per BUS_GAP_MS.
  let busTimer = 0;
  let busAt = 0;
  window.addEventListener('pc:shortwave:post', (e: Event) => {
    const d = (e as CustomEvent).detail as { via?: string; post?: { via?: string } } | undefined;
    if ((d?.via ?? d?.post?.via) !== 'air' || busTimer) return;
    busTimer = window.setTimeout(() => { busTimer = 0; busAt = Date.now(); void tick(); }, Math.max(0, busAt + BUS_GAP_MS - Date.now()));
  });
  void tick();
}

// ---------------------------------------------------------------------------
// Your card on /r/me.
// ---------------------------------------------------------------------------
/** One filled seat in /api/air/me's `assignments` (fillView in functions/_lib/air-assign.mjs). */
type MeAssign = { id: string; label: string; spot: string; day: string; reward: number; witnessed: boolean; text: string };
type Me = {
  /** 'user' with a session, else 'device'. */
  owner: string; byline: string | null; points: { today: number; total: number; assigned?: number }; streakWeeks: number;
  stamps: StampLike[]; badges: string[];
  reports: { id: string; spot: string; kind?: string; value: string; label?: string; at?: string; observedAt?: string; onsite: boolean; day?: string }[];
  /** Filled assignment seats, 50 at most, newest first. */
  assignments?: MeAssign[];
  /** Rows still on this phone that a signed-in claim would move, or null. */
  claimable?: { reports: number; points: number; stamps: number } | null;
};
const signedIn = (me: Me): boolean => me.owner === 'user' || String(me.owner || '').startsWith('user:');
const claimableRows = (me: Me): number => (me.claimable ? Number(me.claimable.reports || 0) + Number(me.claimable.stamps || 0) + Number(me.claimable.points || 0) : 0);

export function mountAirCard(root: HTMLElement): void {
  const q = <T extends HTMLElement = HTMLElement>(sel: string): T | null => root.querySelector<T>(sel);
  const byline = q('[data-air-me-byline]'), owner = q('[data-air-me-owner]');
  const pointsToday = q('[data-air-me-today]'), pointsTotal = q('[data-air-me-total]'), streak = q('[data-air-me-streak]');
  const pointsAssigned = q('[data-air-me-assigned]');
  const stamps = q('[data-air-me-stamps]'), badges = q('[data-air-me-badges]'), reports = q('[data-air-me-reports]');
  const assignSection = q('[data-air-me-assign-section]'), assigns = q('[data-air-me-assigns]');
  const empty = q('[data-air-me-empty]'), signin = q('[data-air-me-signin]'), note = q('[data-air-me-note]'), claimBtn = q<HTMLButtonElement>('[data-air-me-claim]');
  const device = deviceId();
  const headers = { 'X-PC-Device': device };
  const say = (s: string) => { if (note) { note.textContent = s; note.hidden = !s; } };

  const paint = (me: Me) => {
    root.setAttribute('data-air-me', signedIn(me) ? 'user' : 'device');
    if (byline) byline.textContent = me.byline || 'Guest';
    if (owner) owner.textContent = signedIn(me) ? 'on your town card' : 'on this phone';
    if (pointsToday) pointsToday.textContent = String(me.points?.today ?? 0);
    if (pointsTotal) pointsTotal.textContent = String(me.points?.total ?? 0);
    const assignedPts = me.points?.assigned ?? 0;
    if (pointsAssigned) { pointsAssigned.textContent = assignedPts > 0 ? `+${assignedPts} from assignments` : ''; pointsAssigned.hidden = assignedPts <= 0; }
    if (streak) streak.textContent = me.streakWeeks > 0 ? (me.streakWeeks === 1 ? '1 week running' : `${me.streakWeeks} weeks running`) : 'No week yet';
    const list = (me.stamps || []).filter((s) => s && s.kind);
    const places = list.filter((s) => s.kind !== 'badge');
    const earned = new Set([...(me.badges || []), ...list.filter((s) => s.kind === 'badge').map((s) => s.ref)]);
    if (stamps) {
      stamps.replaceChildren(...places.map((s, i) => {
        const li = document.createElement('li');
        li.style.setProperty('--i', String(i));
        const st = makeStamp(stampLine(s), s.kind === 'crew' ? 'crew' : 'place');
        const tr = document.createElement('small'); tr.className = 'air-mono air-trait'; tr.textContent = traitLine(s);
        li.append(st); if (tr.textContent) li.append(tr);
        return li;
      }));
    }
    if (badges) {
      badges.replaceChildren(...Array.from(earned).map((b) => {
        const li = document.createElement('li');
        // Badge art lives at /images/air/badges/<id>.webp (block-print collectibles); the stamp label stays as the caption.
        if (BADGE_ART.has(b)) {
          const img = document.createElement('img');
          img.className = 'air-badge-art'; img.src = `/images/air/badges/${b}.webp`; img.alt = ''; img.width = 96; img.height = 96; img.loading = 'lazy';
          li.append(img);
        }
        li.append(makeStamp(BADGE_LABEL[b] ?? String(b).toUpperCase(), 'badge'));
        return li;
      }));
    }
    if (reports) {
      reports.replaceChildren(...(me.reports || []).slice(0, 20).map((r) => {
        const li = document.createElement('li');
        if (!r.onsite) li.setAttribute('data-remote', '');
        const when = r.observedAt || r.at || '';
        const at = document.createElement('span'); at.className = 'air-mono'; at.textContent = when ? `${laStamp(new Date(when))}` : (r.day || '');
        const where = document.createElement('b'); where.textContent = spotById(r.spot)?.name ?? r.spot;
        const what = document.createElement('span'); what.textContent = r.label || labelFor(r.spot, r.kind || Object.keys(spotById(r.spot)?.kinds ?? {})[0] || '', r.value) || r.value;
        const how = document.createElement('small'); how.className = 'air-mono'; how.textContent = r.onsite ? 'on site' : 'from away';
        li.append(at, where, what, how);
        return li;
      }));
    }
    const assignRows = me.assignments || [];
    if (assigns) {
      assigns.replaceChildren(...assignRows.slice(0, 50).map((a) => {
        const li = document.createElement('li');
        // "MON 28 SEP", as the stamps print a day (dayStamp without the year).
        const day = document.createElement('span'); day.className = 'air-mono'; day.textContent = dayStamp(a.day).replace(/ \d{4}$/, '');
        const where = document.createElement('b'); where.textContent = a.label;
        const what = document.createElement('span'); what.textContent = `${spotById(a.spot)?.name ?? a.spot} · +${a.reward}`;
        li.append(day, where, what);
        // The WITNESSED mark only when there is one: no empty cell, no blank row.
        if (a.witnessed) { const status = document.createElement('small'); status.textContent = 'WITNESSED'; li.append(status); }
        return li;
      }));
    }
    if (assignSection) assignSection.hidden = assignRows.length === 0;
    const nothing = places.length === 0 && earned.size === 0 && (me.reports || []).length === 0;
    if (empty) empty.hidden = !nothing;
    if (signin) signin.hidden = signedIn(me) || nothing;
    if (claimBtn) claimBtn.hidden = !(signedIn(me) && claimableRows(me) > 0);
  };

  const load = async (): Promise<Me | null> => {
    const me = await getJson<Me>('/api/air/me', headers);
    if (me) { paint(me); say(''); } else say('Could not reach the desk. Your stamps are still yours.');
    return me;
  };

  // Signed in with rows still on this phone: move the last 24 h to the card.
  // The server counts what is claimable, so this fires only while there is something to move.
  let claiming = false;
  const claim = async (): Promise<void> => {
    if (claiming) return;
    claiming = true;
    const res = await postJson<{ ok: true; moved: { reports: number; confirms: number; points: number; stamps: number }; byline: string }>('/api/air/claim', { device });
    const j = res.json;
    if (j && j.ok === true && 'moved' in j) {
      const m = j.moved || { reports: 0, confirms: 0, points: 0, stamps: 0 };
      await load();
      if (m.stamps > 0 || m.reports > 0 || m.confirms > 0) say(`${m.stamps > 0 ? `${m.stamps} stamp${m.stamps === 1 ? '' : 's'}` : 'This phone’s reports'} moved to your card.`);
    } else if (res.status === 429) say('Claimed too many times this hour. Try later.');
    else if (res.status === 401 || res.status === 403) say('Sign in first, then come back here.');
    claiming = false;
  };
  claimBtn?.addEventListener('click', () => void claim());

  void load().then((me) => { if (me && signedIn(me) && claimableRows(me) > 0) void claim(); });
}

// ---------------------------------------------------------------------------
// The Desk on /r/assign — the house-only create form and void, GET-gated.
// canCreate (from the director session, hasDirectorDeskAccess) is the only
// thing that decides which half of the page shows; nothing is read from the
// page source.
// ---------------------------------------------------------------------------
export function mountAirAssign(root: HTMLElement): void {
  const q = <T extends HTMLElement = HTMLElement>(sel: string): T | null => root.querySelector<T>(sel);
  const note = q('[data-air-assign-note]');
  const house = q('[data-air-assign-house]');
  const director = q('[data-air-assign-director]');
  const form = q<HTMLFormElement>('[data-air-assign-form]');
  const templateSel = q<HTMLSelectElement>('[data-air-assign-template]');
  const dayInput = q<HTMLInputElement>('[data-air-assign-day]');
  const startInput = q<HTMLInputElement>('[data-air-assign-start]');
  const seatsInput = q<HTMLInputElement>('[data-air-assign-seats]');
  const list = q('[data-air-assign-list]');
  const listTitle = q('[data-air-assign-list-title]');
  const empty = q('[data-air-assign-empty]');
  const submitBtn = q<HTMLButtonElement>('[data-air-assign-submit]');
  const formNote = q('[data-air-assign-form-note]');
  const say = (s: string) => { if (note) { note.textContent = s; note.hidden = !s; } };
  /** The create result, printed beside the button that was tapped (the page note is off-screen by then). */
  const sayForm = (s: string) => { if (formNote) { formNote.textContent = s; formNote.hidden = !s; } };

  // The day field defaults to today (LA) so a director need only pick a template.
  if (dayInput && !dayInput.value) dayInput.value = laDay();

  function applyTemplateDefaults() {
    const opt = templateSel?.selectedOptions?.[0];
    if (!opt) return;
    if (startInput) startInput.value = opt.dataset.start || '';
    if (seatsInput) seatsInput.value = opt.dataset.seats || '';
  }
  templateSel?.addEventListener('change', applyTemplateDefaults);
  applyTemplateDefaults();

  /** One call. Everyone gets the open ones (`open`); a director's rows (`recent`) add fillers, the void note and a Void button. */
  function rowNode(item: AssignItem | RecentAssign): HTMLElement {
    const li = document.createElement('li');
    const head = document.createElement('div'); head.className = 'ra__row-head';
    const label = document.createElement('a'); label.className = 'ra__row-label'; label.href = `/r/${item.spot}`; label.textContent = item.label;
    const spotName = spotById(item.spot)?.name ?? item.spot;
    const a = 'createdAt' in item ? item : null;
    const filled = a ? a.filled : Math.max(0, item.seats - item.seatsLeft);
    const state = a?.voidedAt ? 'VOIDED' : item.live ? 'LIVE' : new Date(item.startsAt).getTime() > Date.now() ? 'UPCOMING' : 'ENDED';
    // A call still taking fills says what is left ("2 seats open"); a closed one says what it got ("1 of 2 filled").
    const seatText = (state === 'LIVE' || state === 'UPCOMING') && item.seatsLeft > 0 ? seatsOpenText(item.seatsLeft, item.seats) : `${filled} of ${item.seats} filled`;
    const meta = document.createElement('span'); meta.className = 'ra__row-meta air-mono';
    meta.textContent = `${spotName} · ${laDayWord(item.startsAt)} ${laClock(item.startsAt)}–${laClock(item.endsAt)} · ${seatText} · +${item.reward} · ${state}`;
    head.append(label, meta);
    li.append(head);
    if (!a) return li;
    if (a.voidedAt) li.setAttribute('data-voided', '');
    if (a.fillers.length) {
      const fillers = document.createElement('p'); fillers.className = 'ra__row-fillers';
      fillers.textContent = `Filled by ${a.fillers.join(', ')}${a.witnessed > 0 ? ` · ${a.witnessed} witnessed` : ''}`;
      li.append(fillers);
    }
    if (a.voidedAt) {
      const why = document.createElement('p'); why.className = 'ra__row-fillers';
      why.textContent = a.voidReason ? `Voided: ${a.voidReason}` : 'Voided.';
      li.append(why);
    } else {
      const row = document.createElement('div'); row.className = 'ra__row-void';
      const reason = document.createElement('input'); reason.type = 'text'; reason.maxLength = 80; reason.placeholder = 'Void note (optional)';
      const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Void';
      // Two taps: a void cannot be undone, so a stray thumb on a live call only arms it for four seconds.
      let armed: number | undefined;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        if (armed === undefined) {
          btn.textContent = 'Void? Tap again';
          armed = window.setTimeout(() => { armed = undefined; btn.textContent = 'Void'; }, 4000);
          return;
        }
        clearTimeout(armed); armed = undefined;
        void voidOne(a.id, reason.value, btn);
      });
      row.append(reason, btn);
      li.append(row);
    }
    return li;
  }

  function paintList(data: AssignIndex) {
    // Everyone sees the open calls (build spec §3.8); directors get `recent` instead (§3.5: the last
    // 14 days, voided too); an empty list is safe if it is ever missing.
    const rows: (AssignItem | RecentAssign)[] = data.canCreate ? data.recent ?? [] : data.open ?? [];
    if (listTitle) listTitle.textContent = data.canCreate ? 'Last 14 days' : 'Open calls';
    if (list) list.replaceChildren(...rows.map(rowNode));
    if (empty) empty.hidden = rows.length > 0;
  }

  /** `keepNote`: a refresh after a create or void leaves its result on screen. */
  async function load(keepNote = false): Promise<void> {
    const data = await getJson<AssignIndex>('/api/air/assign');
    if (!data) { say('Could not reach the desk.'); return; }
    if (!keepNote) say('');
    if (house) house.hidden = data.canCreate;
    if (director) director.hidden = !data.canCreate;
    paintList(data);
  }

  let posting = false;
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    // One call per tap: the button stays down until the desk answers, so a second tap on a slow line never posts a duplicate.
    if (posting) return;
    const template = templateSel?.value;
    const day = dayInput?.value;
    const start = startInput?.value || undefined;
    const seatsRaw = seatsInput?.value;
    const seats = seatsRaw ? Number(seatsRaw) : undefined;
    posting = true;
    const label = submitBtn?.textContent || '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Posting…'; }
    sayForm('');
    void (async () => {
      try {
        const res = await postJson<{ ok: true; assignment: AssignItem }>('/api/air/assign', { action: 'create', template, day, start, seats });
        const j = res.json;
        if (j && j.ok === true) {
          sayForm(`Call posted: ${j.assignment.label}, ${laWhen(j.assignment.startsAt)}. It is at the top of the list below.`);
          await load(true);
        } else if (res.network || res.status === 0) sayForm('No answer from the desk. Check the list below before posting again.');
        else sayForm(ASSIGN_ERROR_COPY[(j as ApiError | null)?.reason || ''] || 'That did not go through.');
      } finally {
        posting = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = label; }
      }
    })();
  });

  async function voidOne(id: string, reason: string, btn: HTMLButtonElement): Promise<void> {
    btn.disabled = true;
    btn.textContent = 'Voiding…';
    const res = await postJson<{ ok: true }>('/api/air/assign', { action: 'void', id, reason: reason || undefined });
    const j = res.json;
    // The refreshed row reads VOIDED in place, where the tap was; the page note keeps the result too.
    if (j && j.ok === true) { say('Voided.'); void load(true); }
    else { btn.disabled = false; btn.textContent = 'Void'; say(ASSIGN_ERROR_COPY[(j as ApiError | null)?.reason || ''] || 'That did not go through.'); }
  }

  void load();
}

// Auto-mount whatever this page rendered.
export function mountAir(): void {
  document.querySelectorAll<HTMLElement>('[data-air-spot]').forEach(mountAirSpot);
  document.querySelectorAll<HTMLElement>('[data-air-home]').forEach(mountAirHome);
  document.querySelectorAll<HTMLElement>('[data-air-card]').forEach(mountAirCard);
  document.querySelectorAll<HTMLElement>('[data-air-assign-page]').forEach(mountAirAssign);
}
