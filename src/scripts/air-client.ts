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
import { AIR_SPOTS, labelFor, type AirSpot } from '../lib/air';
import * as shortwave from '../lib/shortwave-client';

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

/** "FRI 7:38" for the top line. */
export function laStamp(when: number | Date = new Date()): string {
  const d = when instanceof Date ? when : new Date(when);
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: LA, weekday: 'short' }).format(d).toUpperCase();
  return `${wd} ${laClock(d)}`;
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
const BADGE_LABEL: Record<string, string> = {
  'first-light': 'FIRST LIGHT',
  'morning-crew': 'MORNING CREW',
  'still-true': 'STILL TRUE',
  byline: 'BYLINE',
};

export const supportLabel = (n: number): string => (n >= 2 ? `${n} agree` : n === 1 ? '1 reporter' : '');
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

type Traits = { spot?: string; kind?: string; weekday?: number; hour?: number; crewSize?: number | null; firstLight?: boolean; deadAirHours?: number | null; value?: string };

/**
 * The trait line under a stamp on your card: "FRI · 7 AM · 1–4 WAITING · FIRST LIGHT · DEAD AIR 14H".
 * Traits are what air_stamps.meta_json records for the future rarity rating.
 */
export function traitLine(s: StampLike): string {
  const raw = s.traits ?? s.meta ?? s.meta_json;
  const t: Traits = typeof raw === 'string' ? readJson<Traits>(raw, {}) : (raw && typeof raw === 'object' ? (raw as Traits) : {});
  const out: string[] = [];
  if (typeof t.weekday === 'number' && DOW[t.weekday]) out.push(DOW[t.weekday]);
  if (typeof t.hour === 'number') out.push(`${t.hour % 12 || 12} ${t.hour < 12 ? 'AM' : 'PM'}`);
  if (t.spot && t.kind && t.value) { const l = labelFor(t.spot, t.kind, t.value); if (l) out.push(l.toUpperCase()); }
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
function makeStamp(text: string, kind: 'place' | 'crew' | 'badge' | 'queued' | 'mini' = 'place', slam = false): HTMLElement {
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
type TodayRow = { id: string; at: string; byline: string; value: string; onsite: boolean; confirms: number; live: boolean };
/** What this phone did today, from GET with the X-PC-Device header. */
type You = { reportId: string | null; confirmed: string[]; crewMember: boolean };
type SpotPayload = {
  spot: { id: string; name: string; short: string; kind: string; question: string; options: { v: string; label: string }[]; decayMin: number; courtCall?: { weekday: number; time: string } | null };
  reading: Reading;
  today: TodayRow[];
  yesterday: { at: string; label: string; support: number; bylines: string[]; more: number } | null;
  lastWeek: { date: string; at: string; label: string; support: number } | null;
  serverTime: string;
  you?: You | null;
};
/** Stamps here are place and crew only (with the server's text); badges come as ids. */
type Award = { points: number; pointsToday: number; cap: number; streakWeeks: number; firstLight: boolean; stamps: StampLike[]; badges: string[]; crew: { id: string; n: number; at: string } | null };
type ReportBody = { kind: string; value: string; device: string; code: string | null; extras: string[]; asGuest: boolean; observedAt: number };
type Claim = { until: string } | null;
type ReportResult = { ok: true; replaced: boolean; report: { id: string; value: string; label: string; observedAt: string; byline: string; onsite: boolean; code?: 'none' | 'ok' | 'unknown' }; reading: Reading; today?: TodayRow[]; award: Award; claim?: Claim };
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
    confirm: q('[data-air-confirm]'), confirmQ: q('[data-air-confirm-q]'), confirmMeta: q('[data-air-confirm-meta]'),
    ask: q('[data-air-ask]'), receipt: q('[data-air-receipt]'), receiptLine: q('[data-air-receipt-line]'), stampSlot: q('[data-air-stamp-slot]'),
    remoteNote: q('[data-air-remote]'), queuedNote: q('[data-air-queued]'),
    tally: q('[data-air-tally]'), count: q('[data-air-count]'), bars: q('[data-air-bars]'), rows: q('[data-air-rows]'), points: q('[data-air-points]'), first: q('[data-air-first]'),
    crewLine: q('[data-air-crew-line]'), crewRing: q('[data-air-crew-ring]'),
    actions: q('[data-air-actions]'), share: q<HTMLButtonElement>('[data-air-share]'), chips: q('[data-air-chips]'), extras: all<HTMLButtonElement>('[data-air-extra]'), signin: q('[data-air-signin]'),
    again: q('[data-air-again]'), today: q('[data-air-today]'), todayList: q('[data-air-today-list]'),
    history: q('[data-air-history]'), note: q('[data-air-note]'), mute: q<HTMLButtonElement>('[data-air-mute]'),
  };

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
  let pollTimer: number | undefined;
  let extrasTimer: number | undefined;
  let refreshing: Promise<void> | null = null;
  // Reports the server called expired or gone: never offered on the strip again this visit.
  const deadReports = new Set<string>();

  const setState = (s: State) => { state = s; root.setAttribute('data-air-state', s); };
  const note = (msg: string) => { text(els.note, msg); show(els.note, !!msg); };
  const setClock = () => text(els.clock, laStamp());

  // --- mute toggle (remembered) ---
  const paintMute = () => { if (els.mute) { const m = isMuted(); els.mute.setAttribute('aria-pressed', m ? 'true' : 'false'); els.mute.textContent = m ? 'Sound off' : 'Sound on'; } };
  els.mute?.addEventListener('click', () => { setMuted(!isMuted()); paintMute(); if (!isMuted()) blip(); });
  paintMute();

  // --- the reading on the page ---
  function showAsk(on: boolean) { show(els.ask, on); }
  function paintReading(data: SpotPayload, opts: { fromOwnAction?: boolean } = {}) {
    current = data;
    const r = data.reading;
    setClock();
    show(els.live, r.status !== 'none');
    root.setAttribute('data-air-live', r.status !== 'none' ? 'yes' : 'no');

    // Silence stays quiet: the last expired report, never a zero count. Not today's? Say which day.
    if (r.status === 'none' && r.last?.label) {
      const wd = laDay(new Date(r.last.observedAt)) !== laDay() ? `${weekdayOf(laDay(new Date(r.last.observedAt))).slice(0, 3)} ` : '';
      text(els.lastText, `Last report ${wd}${laClock(r.last.observedAt)}: ${r.last.label}`);
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
    if (offer) {
      const l = r.label!;
      text(els.confirmQ, `Still ${/^[A-Z][a-z]/.test(l) ? l.charAt(0).toLowerCase() + l.slice(1) : l}?`);
      text(els.confirmMeta, [supportLabel(r.support), agoLabel(r.ageMin)].filter(Boolean).join(' · '));
      show(els.confirm, true);
    } else show(els.confirm, false);
    // The strip or the four buttons, never both (spec §7 step 2): "Changed" brings the buttons back.
    if (askable) showAsk(!offer);

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
        if (!t.onsite) li.setAttribute('data-remote', '');
        const at = document.createElement('span'); at.className = 'air-mono'; at.textContent = t.at;
        const who = document.createElement('b'); who.textContent = t.byline;
        const what = document.createElement('span'); what.textContent = labelFor(spot, kind, t.value) ?? t.value;
        const meta = document.createElement('small'); meta.className = 'air-mono';
        meta.textContent = [t.onsite ? '' : 'from away', t.confirms > 0 ? `${t.confirms} still true` : ''].filter(Boolean).join(' · ');
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
      show(els.history, lines.length > 0);
    }

    // The crew: members get the reveal once, everyone else the line. Membership is
    // the server's word (`you.crewMember`, or the crew in our own response), else
    // our last on-site action inside the window.
    // The crew is the day's first one (the server keeps it), so the line names its time.
    if (r.crew) {
      const mine = Math.max(myOnsiteAt, lastOwnOnsiteAt());
      const member = opts.fromOwnAction || (you ? you.crewMember : mine > 0 && Math.abs(new Date(r.crew.at).getTime() - mine) <= CREW_WINDOW_MS);
      if (member && !seenCrews().includes(r.crew.id)) void crewReveal(r.crew, r.bylines);
      else if (!member) { text(els.crewLine, `Morning crew: ${r.crew.n} on the air at ${laClock(r.crew.at)}.`); show(els.crewLine, true); }
    } else show(els.crewLine, false);
  }

  function weekdayOf(day: string): string {
    const [y, m, d] = day.split('-').map(Number);
    if (!y || !m || !d) return 'week';
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()];
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
    els.stampSlot?.replaceChildren();
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
  /** The place stamp slams at max(420 ms, 2xx); badges follow. A replaced answer re-stamps today's place. */
  function landStamps(award: Award, onsite: boolean) {
    const slot = els.stampSlot;
    const place = (award.stamps || []).find((s) => s && s.kind === 'place');
    const badges = (award.badges || []).filter((b) => b !== 'morning-crew');
    emit('air:stamp', { spot, stamps: (award.stamps || []).map(stampLine), badges });
    if (place && slot) { slot.append(makeStamp(stampLine(place), 'place', true)); thump(); }
    else if (onsite && slot) { slot.append(makeStamp(`${cfg!.short} · ${dayStamp(laDay())}`, 'place', true)); thump(); }
    if (onsite) stampPassport(PASSPORT_FOR[spot]);
    if (award.firstLight || badges.includes('first-light')) {
      setTimeout(() => {
        emit('air:first-light', { spot });
        text(els.first, 'First light — you opened the day here.');
        show(els.first, true);
        if (slot) slot.append(makeStamp(BADGE_LABEL['first-light'], 'badge', true));
      }, 300);
    } else show(els.first, false);
    for (const b of badges) if (b !== 'first-light' && slot) setTimeout(() => slot.append(makeStamp(BADGE_LABEL[b] ?? b.toUpperCase(), 'badge', true)), 420);
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

  /** A report the server took: stamp, receipt, tally. Shared by the tap and the queue. */
  function settleReport(j: ReportResult, at: number) {
    const label = labelFor(spot, kind, j.report.value) ?? j.report.value;
    rememberOwn(j.report.id, j.report.onsite);
    if (j.report.onsite) landStamps(j.award, true);
    else {
      // The optimistic line said ON THE AIR when the phone had a code; the server says otherwise.
      if (els.receiptLine) els.receiptLine.textContent = receiptText(label, 'remote', undefined, at);
      if (els.remoteNote) els.remoteNote.textContent = j.report.code === 'unknown' ? 'That code is not this spot’s. Filed from away; open the link the group shared to go on the air.' : 'Filed from away. Open this spot’s link with its code to go on the air.';
      show(els.remoteNote, true);
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
    els.stampSlot?.replaceChildren();
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
      els.stampSlot?.replaceChildren(makeStamp('Saved on this phone. Sending when you have signal.', 'queued', true));
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
    const r = current?.reading;
    if (!r?.reportId || !r.label) { showAsk(true); return; }
    if (verdict === 'changed') {
      // "Changed" is a report, so it goes straight to the four buttons. The verdict
      // still goes on the record (the server answers next: 'report'), without waiting.
      inkFill(btn); buzz([30]);
      show(els.confirm, false); showAsk(true);
      els.ask?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      rememberOwn(`confirm:${r.reportId}`, false);
      void postJson<ConfirmResult>('/api/air/confirm', { reportId: r.reportId, verdict, device, code });
      return;
    }
    const floor = begin(btn, receiptText(r.label, code ? 'air' : 'remote', verdict));
    const sent = postWithRetry<ConfirmResult>('/api/air/confirm', { reportId: r.reportId, verdict, device, code });
    const [, res] = await Promise.all([floor, sent]);
    const j = res.json;
    if (j && j.ok === true && 'next' in j) {
      const onsite = typeof j.onsite === 'boolean' ? j.onsite : !!code && (j.award.points > 0 || (j.award.stamps || []).length > 0);
      rememberOwn(`confirm:${r.reportId}`, onsite);
      // A confirm is not a report of yours: nothing for the detail chips to go on.
      myValue = null; myObservedAt = 0; myExtras = [];
      els.extras.forEach((chip) => chip.setAttribute('aria-pressed', 'false'));
      if (onsite) landStamps(j.award, true);
      else {
        if (els.receiptLine) els.receiptLine.textContent = receiptText(r.label, 'remote', verdict);
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
    if (reason === 'expired' || reason === 'not-found') deadReports.add(r.reportId);
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
    els.stampSlot?.append(makeStamp(crewText, 'crew', true));
    thump();
    chord();
    confetti();
    if (state === 'crew') setTimeout(() => { if (state === 'crew') setState('stamped'); }, 2500);
  }

  // --- wiring ---
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

export function mountAirHome(root: HTMLElement): void {
  const callText = root.querySelector<HTMLElement>('[data-air-call-text]');
  const callDot = root.querySelector<HTMLElement>('[data-air-call-live]');
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
    const data = await getJson<AirIndex>('/api/air');
    if (data) paint(data);
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
type Me = {
  /** 'user' with a session, else 'device'. */
  owner: string; byline: string | null; points: { today: number; total: number }; streakWeeks: number;
  stamps: StampLike[]; badges: string[];
  reports: { id: string; spot: string; kind?: string; value: string; label?: string; at?: string; observedAt?: string; onsite: boolean; day?: string }[];
  /** Rows still on this phone that a signed-in claim would move, or null. */
  claimable?: { reports: number; points: number; stamps: number } | null;
};
const signedIn = (me: Me): boolean => me.owner === 'user' || String(me.owner || '').startsWith('user:');
const claimableRows = (me: Me): number => (me.claimable ? Number(me.claimable.reports || 0) + Number(me.claimable.stamps || 0) + Number(me.claimable.points || 0) : 0);

export function mountAirCard(root: HTMLElement): void {
  const q = <T extends HTMLElement = HTMLElement>(sel: string): T | null => root.querySelector<T>(sel);
  const byline = q('[data-air-me-byline]'), owner = q('[data-air-me-owner]');
  const pointsToday = q('[data-air-me-today]'), pointsTotal = q('[data-air-me-total]'), streak = q('[data-air-me-streak]');
  const stamps = q('[data-air-me-stamps]'), badges = q('[data-air-me-badges]'), reports = q('[data-air-me-reports]');
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
      badges.replaceChildren(...Array.from(earned).map((b) => { const li = document.createElement('li'); li.append(makeStamp(BADGE_LABEL[b] ?? String(b).toUpperCase(), 'badge')); return li; }));
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

// Auto-mount whatever this page rendered.
export function mountAir(): void {
  document.querySelectorAll<HTMLElement>('[data-air-spot]').forEach(mountAirSpot);
  document.querySelectorAll<HTMLElement>('[data-air-home]').forEach(mountAirHome);
  document.querySelectorAll<HTMLElement>('[data-air-card]').forEach(mountAirCard);
}
