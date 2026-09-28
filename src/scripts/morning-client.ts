/**
 * Morning Edition client — the reader side of /morning.
 *
 * The page (src/pages/morning.astro) is a static shell: masthead, seven
 * slot rows with skeleton lines, the footer. This module reads ?d=, fetches
 * /morning.json (JSON Feed 1.1 from functions/morning.json.ts), and fills
 * the masthead, the status line, the reporters line, the seven slots and the
 * prev/next links. Every line is the server's: the edition is never composed
 * here, so what a reader sees is what froze. The live strip above the slots
 * comes from GET /api/air and is never frozen. Nothing is stored on the phone.
 *
 * Dates (which edition is current, No. from a date, a day back or forward)
 * come from functions/_lib/morning.mjs so the page and the server agree,
 * including across the DST change.
 */
import { SLOTS, addDays, editionDate, editionNumber } from '../../functions/_lib/morning.mjs';
import { spotUrl } from '../lib/air';

type Slot = { id: string; label: string; line: string; source: string; reportIds: string[]; bylines: string[]; fallback: boolean };
type Extension = {
  number: number; frozen: boolean; provisional: boolean; missing: string[]; masthead: string;
  reporters: string[]; more: number; reporterLine: string; footer: string; disclosure: string; slots: Slot[];
};
type Item = { id: string; url: string; title: string; content_text: string; date_published: string; date_modified?: string; _pointcast: Extension };
type Feed = { version: string; title: string; items: Item[] };
type Station = { id: string; short: string; reading: { label: string; status: string; ageMin: number; bars: number } | null };
type AirIndex = { spots: Station[]; courtCall: { live: boolean; minutesUntil: number; minutesLeft: number } | null };
type State = 'loading' | 'ready' | 'error';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** The live strip refreshes once a minute while the tab is visible; it is a glance, not a desk. */
const LIVE_POLL_MS = 60_000;
/** One automatic retry for a phone that woke up mid-fetch; after that, the Try again button. */
const RETRY_MS = 3_000;
const TIMEOUT_MS = 8_000;

/** What each slot's source id means to a reader, in the mono meta row. */
const SOURCE_NAMES: Record<string, string> = {
  'klax-asos+air': 'KLAX ASOS + Field Reports',
  'klax-asos': 'KLAX ASOS',
  air: 'Field Reports',
  'air+template': 'Field Reports',
  template: 'standing line',
  'paddle-calendar': 'paddle calendar',
  'paddle-register': 'paddle register',
  'front-door-news': 'front door',
  shortwave: 'Shortwave',
  almanac: 'almanac',
  'band-net': 'the band',
  'today-json': 'today’s block',
};
const MISSING_NAMES: Record<string, string> = { klax: 'KLAX', reports: 'the report store' };

const q = <T extends HTMLElement = HTMLElement>(root: ParentNode, sel: string): T | null => root.querySelector<T>(sel);
const show = (el: HTMLElement | null, on: boolean): void => { if (el) el.hidden = !on; };
const text = (el: HTMLElement | null, s: string): void => { if (el) el.textContent = s; };
const agoLabel = (min: number): string => (min < 1 ? 'just now' : min === 1 ? '1 min ago' : `${min} min ago`);

/** "6:47 AM" in El Segundo, or '' for an unreadable time. */
function laClock(iso: string | undefined): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' }).format(t);
}

/** Today's LA date, YYYY-MM-DD. */
function laToday(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  try { return AbortSignal.timeout(ms); } catch { return undefined; }
}

async function getJson<T>(url: string): Promise<{ status: number; body: T | null }> {
  const res = await fetch(url, { headers: { Accept: 'application/feed+json, application/json' }, credentials: 'same-origin', signal: timeoutSignal(TIMEOUT_MS) });
  let body: T | null = null;
  try { body = (await res.json()) as T; } catch { body = null; }
  return { status: res.status, body };
}

/** ?d= as the page received it: a date-shaped value, else null (the current edition). */
function editionParam(): string | null {
  try {
    const d = new URLSearchParams(location.search).get('d');
    return d && DATE_RE.test(d) ? d : null;
  } catch { return null; }
}

/** Where a slot's meta row points. The shop slot never links: "No link, no commission." */
function sourceHref(slot: Slot): string | null {
  const spot = SLOTS.find((s) => s.id === slot.id)?.spot;
  if (spot) return spotUrl(spot);
  switch (slot.id) {
    case 'price': return '/paddles';
    case 'town': return slot.source === 'shortwave' ? '/shortwave' : slot.source === 'front-door-news' ? '/' : '/almanac';
    case 'ritual': return '/band';
    case 'pick': { const m = /^Block (\d{3,5})\b/.exec(slot.line); return m ? `/b/${m[1]}` : '/today'; }
    default: return null; // shop: no link, no commission
  }
}

/**
 * The line under the masthead: frozen when, or provisional on what. Empty for
 * a preview: the masthead says PREVIEW and the banner already says when No. 1
 * is and that nothing freezes, so the status line would only say it again.
 */
function statusLine(item: Item, now = Date.now()): string {
  const p = item._pointcast;
  const date = item.id.replace(/^morning:/, '');
  const parts: string[] = [];
  if (p.number === 0) return '';
  if (p.frozen) parts.push(`Frozen ${laClock(item.date_modified)}`.trim());
  else if (p.provisional) parts.push(`Provisional · waiting on ${(p.missing.length ? p.missing : ['a source']).map((m) => MISSING_NAMES[m] ?? m).join(' and ')} · composes again on the next read`);
  else parts.push('Composing · freezes on the next read');
  // Before 6:45 the current edition is yesterday's; say when the next one is due.
  const nextNo = editionNumber(addDays(date, 1));
  if (date === editionDate(now) && date !== laToday(now) && nextNo >= 1) parts.push(`No. ${nextNo} at 6:45 AM`);
  return parts.join(' · ');
}

function renderMasthead(root: HTMLElement, item: Item): void {
  const parts = item._pointcast.masthead.split(' · ');
  const no = q(root, '[data-me-mast-no]');
  const day = q(root, '[data-me-mast-day]');
  if (parts.length === 4 && no && day) {
    text(no, parts[1]);
    text(day, parts[2]);
    show(no, true);
    show(day, true);
  } else {
    text(q(root, '[data-me-mast]'), item._pointcast.masthead);
  }
  document.title = `${item.title} — PointCast`;
}

function renderSlots(root: HTMLElement, slots: Slot[]): void {
  for (const slot of slots) {
    const li = q(root, `[data-me-slot="${slot.id}"]`);
    if (!li) continue;
    li.setAttribute('data-me-fallback', slot.fallback ? 'yes' : 'no');
    li.setAttribute('data-me-source', slot.source);
    text(q(li, '[data-me-line]'), slot.line);
    // Names print in one place only: a line that is already signed ("— @jen, Guest 4471 +1")
    // keeps its meta row to the source, so no reader sees a "+1" and then the hidden name under it.
    const by = q(li, '[data-me-by]');
    const names = (slot.bylines || []).filter((b) => typeof b === 'string');
    const signed = names.some((n) => slot.line.includes(n));
    text(by, signed ? '' : names.join(', '));
    show(by, !signed && names.length > 0);
    const src = q<HTMLAnchorElement>(li, '[data-me-src]');
    if (src) {
      text(src, SOURCE_NAMES[slot.source] ?? slot.source);
      const href = sourceHref(slot);
      if (href) src.setAttribute('href', href); else src.removeAttribute('href');
    }
    show(q(li, '[data-me-meta]'), true);
  }
}

function renderNav(root: HTMLElement, date: string, now = Date.now()): void {
  const n = editionNumber(date);
  const current = editionDate(now);
  const prev = q<HTMLAnchorElement>(root, '[data-me-prev]');
  const next = q<HTMLAnchorElement>(root, '[data-me-next]');
  if (prev) {
    const ok = n >= 2;
    if (ok) { prev.href = `/morning?d=${addDays(date, -1)}`; text(prev, `← No. ${n - 1}`); }
    show(prev, ok);
  }
  if (next) {
    const d = addDays(date, 1);
    const ok = n >= 1 && d <= current;
    if (ok) { next.href = d === current ? '/morning' : `/morning?d=${d}`; text(next, d === current ? 'Today’s edition →' : `No. ${n + 1} →`); }
    show(next, ok);
  }
  show(q(root, '[data-me-nav]'), (n >= 2) || (n >= 1 && addDays(date, 1) <= current));
}

function render(root: HTMLElement, item: Item): void {
  const p = item._pointcast;
  const date = item.id.replace(/^morning:/, '');
  renderMasthead(root, item);
  show(q(root, '[data-me-preview]'), p.number === 0);
  const status = q(root, '[data-me-status]');
  const said = statusLine(item);
  text(status, said);
  show(status, Boolean(said));
  const reporters = q(root, '[data-me-reporters]');
  text(reporters, p.reporterLine || '');
  show(reporters, Boolean(p.reporterLine));
  renderSlots(root, p.slots || []);
  if (DATE_RE.test(date)) renderNav(root, date);
  root.setAttribute('data-me-date', date);
  root.setAttribute('data-me-frozen', p.frozen ? 'yes' : 'no');
  root.setAttribute('data-me-provisional', p.provisional ? 'yes' : 'no');
  setState(root, 'ready');
}

function setState(root: HTMLElement, state: State): void {
  root.setAttribute('data-me-state', state);
}

function fail(root: HTMLElement, why: 'bad-date' | 'offline'): void {
  const msg = why === 'bad-date'
    ? 'No edition for that date. Editions run from No. 1, Sat 3 Oct 2026, to today’s.'
    : 'The edition didn’t load. It is also at /morning.json.';
  text(q(root, '[data-me-error-text]'), msg);
  show(q(root, '[data-me-error]'), true);
  show(q(root, '[data-me-error-retry]'), why !== 'bad-date');
  const status = q(root, '[data-me-status]');
  text(status, why === 'bad-date' ? 'Not an edition' : 'Not loaded');
  show(status, true);
  setState(root, 'error');
}

async function loadEdition(root: HTMLElement, attempt = 0): Promise<void> {
  const d = editionParam();
  show(q(root, '[data-me-error]'), false);
  setState(root, 'loading');
  try {
    const { status, body } = await getJson<Feed>(d ? `/morning.json?d=${encodeURIComponent(d)}` : '/morning.json');
    if (status === 400 || status === 404) return fail(root, 'bad-date');
    const items = Array.isArray(body?.items) ? body!.items : [];
    const item = d ? items.find((it) => it && it.id === `morning:${d}`) : items[0];
    if (status !== 200 || !item || !item._pointcast || !Array.isArray(item._pointcast.slots)) throw new Error(`morning.json ${status}`);
    render(root, item);
  } catch {
    if (attempt === 0) { window.setTimeout(() => { void loadEdition(root, 1); }, RETRY_MS); return; }
    fail(root, 'offline');
  }
}

// ---------------------------------------------------------------------------
// The live strip: what is on the air right now, from GET /api/air. Hidden
// when nothing is live. Never frozen, never part of the edition.
// ---------------------------------------------------------------------------
function mountLive(root: HTMLElement): void {
  const strip = q(root, '[data-me-live]');
  const list = q(root, '[data-me-live-text]');
  if (!strip || !list) return;
  let timer = 0;

  const supportOf = async (s: Station): Promise<string> => {
    if (!s.reading) return '';
    if (s.reading.status !== 'agree') return '1 reporter';
    try {
      const { body } = await getJson<{ reading: { support: number } | null }>(`/api/air/${encodeURIComponent(s.id)}`);
      const n = body?.reading?.support;
      return typeof n === 'number' && n >= 2 ? `${n} agree` : 'agree';
    } catch { return 'agree'; }
  };

  const refresh = async (): Promise<void> => {
    try {
      const { status, body } = await getJson<AirIndex>('/api/air');
      if (status !== 200 || !body || !Array.isArray(body.spots)) { show(strip, false); return; }
      const live = body.spots.filter((s) => s && s.reading);
      const items = await Promise.all(live.map(async (s) => `${s.short.toLowerCase()} ${s.reading!.label.toLowerCase()} · ${agoLabel(s.reading!.ageMin)} · ${await supportOf(s)}`));
      if (body.courtCall?.live) items.unshift('Court Call is on now');
      if (!items.length) { show(strip, false); return; }
      list.replaceChildren(...items.map((t) => { const el = document.createElement('span'); el.className = 'me__live-item'; el.textContent = t; return el; }));
      show(strip, true);
    } catch {
      // Keep whatever was showing; the strip is a glance.
    }
  };

  const schedule = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { if (document.visibilityState === 'visible') void refresh().then(schedule); else schedule(); }, LIVE_POLL_MS);
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void refresh(); });
  void refresh().then(schedule);
}

export function mountMorning(root: HTMLElement): void {
  q<HTMLButtonElement>(root, '[data-me-error-retry]')?.addEventListener('click', () => { void loadEdition(root, 1); });
  void loadEdition(root);
  mountLive(root);
}

export function mountMorningPage(): void {
  document.querySelectorAll<HTMLElement>('[data-me]').forEach(mountMorning);
}
