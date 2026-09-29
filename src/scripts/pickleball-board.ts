/**
 * THE PICKLEBALL BOARD client (/pickleball) — build spec §9, §10.
 *
 * One GET /api/air/board every 30 s while the tab is visible, painted into
 * the static shell src/pages/pickleball.astro and src/components/courts/*
 * rendered at build time. Reuses src/scripts/air-client.ts for the device id,
 * a spot's remembered on-site code and the shared count labels — it
 * never calls codeFor() (that reads ?c= and would store a code under the
 * wrong spot on a page that answers for eleven of them).
 *
 * Two things the board can do beyond reading:
 *   - Still true? (Yes / Changed) on a live `wait` or `parking` reading,
 *     POST /api/air/confirm. Yes answers right away (+N, "Already counted",
 *     "Counted from away") and paints the reading the endpoint returns — the
 *     board's own poll is edge-cached for 30 s. Changed sends `wait` to
 *     /r/<id> to re-ask (the board has no four-button ask) and opens
 *     `parking`'s TapRow in place, and it stays open across polls.
 *   - TapRow (parking, vibe): one tap, POST /api/air/<id>. Vibe's chips
 *     (spec §4: up to two) re-file the same tap-time report with extras
 *     added, same pattern as the Friday spot's detail chips.
 */
import { agentUrl, spotUrl } from '../lib/air';
import type { CallView, DeskFact } from '../lib/air';
import type { Block, BoardBest, BoardCourt, BoardLast, BoardPayload, BoardReading, BoardVibe, Conditions } from '../lib/courts';
import { STALE_DAYS, daysBetween, provenanceText } from '../lib/court-format';
import { agoLabel, deviceId, laClock, paintCallLines, storedCode, supportLabel } from './air-client';

const POLL_MS = 30_000;
const LA = 'America/Los_Angeles';
const REASON_LABEL: Record<string, string> = { live: 'LIVE REPORT', dropin: 'DROP-IN RUNNING', open: 'OPEN COURT', next: 'NEXT UP' };
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const UNAVAILABLE = 'Live board unavailable right now. The schedules below are from the sources.';

type SourceLabels = Record<string, { label: string; url: boolean }>;
type Provenance = { src: string; checked: string; confidence: string };

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { headers: { accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}
type Failed = { ok: false; reason?: string };
type Posted<T> = { status: number; json: (T & { ok: true }) | Failed | null };
async function postJson<T>(path: string, body: unknown, opts: { keepalive?: boolean } = {}): Promise<Posted<T>> {
  try {
    const res = await fetch(path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', accept: 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify(body), keepalive: Boolean(opts.keepalive),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  } catch { return { status: 0, json: null }; }
}

/** A reading as POST /api/air/confirm and POST /api/air/<id> return it (GET /api/air/[spot]'s shape), trimmed to BoardReading; null for 'none'. */
type SpotReading = Omit<Partial<BoardReading>, 'status' | 'value'> & { status?: string; value?: string | null };
function toBoardReading(r: SpotReading | null | undefined, kind: 'wait' | 'parking'): BoardReading | null {
  if (!r || r.status === 'none' || r.value == null || r.label == null) return null;
  return {
    value: r.value, label: r.label, status: r.status === 'agree' ? 'agree' : 'single', support: Number(r.support ?? 0),
    reportId: r.reportId ?? null, ageMin: Number(r.ageMin ?? 0), bars: Number(r.bars ?? 0), liveUntil: r.liveUntil ?? '',
    bylines: [], crew: kind === 'parking' ? null : r.crew ?? null,
  };
}

/** "5:12 PM", LA time. */
function clock12(when: number | string | Date): string {
  const d = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: LA, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
}
/** "Mon 5:12 PM" for the masthead. */
function stamp12(when: Date = new Date()): string {
  return `${new Intl.DateTimeFormat('en-US', { timeZone: LA, weekday: 'short' }).format(when)} ${clock12(when)}`;
}
/** Today's LA day, 'YYYY-MM-DD'. */
function laToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
/** "6:41" from an ISO instant, LA time, no AM/PM (sunset reads unambiguously as evening). */
function shortClock(iso: string): string {
  const hhmm = laClock(iso, true); // "18:41"
  const [hh, mm = '00'] = hhmm.split(':');
  return `${Number(hh) % 12 || 12}:${mm}`; // "6:05", never "6:5"
}
function compass(deg: number): string {
  return COMPASS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}
function blockLine(block: Block, tail: string): string {
  return `${block.label} · ${tail}${block.fee ? ` · ${block.fee}` : ''}`;
}
/** "Still 1–4 waiting?" from a reading label, lowercasing only a leading capital word. */
function stillQuestion(label: string): string {
  const lower = /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
  return `Still ${lower}?`;
}

export function mountPickleballBoard(): void {
  const root = document.querySelector<HTMLElement>('[data-pb-board]');
  if (!root) return;

  const device = deviceId();
  const cardsEl = root.querySelector<HTMLElement>('[data-pb-cards]');
  const q = <T extends HTMLElement = HTMLElement>(sel: string, scope: ParentNode = root): T | null => scope.querySelector<T>(sel);
  let sources: SourceLabels = {};
  try { sources = JSON.parse(root.dataset.pbSources || '{}') as SourceLabels; } catch { /* no labels: lines read "checked Sep 28" */ }

  // This visit's live readings and last lines, keyed "spotId:kind", so a tap on Still true?
  // knows the reportId it is confirming (and can repaint) without re-parsing the DOM.
  const readings = new Map<string, BoardReading>();
  const lasts = new Map<string, BoardLast | null>();
  // A tap row's own last send, so a vibe chip can re-file the same report with extras added.
  const ownTaps = new Map<string, { value: string; extras: string[]; observedAt: number }>();
  // Reports this visit must not ask "Still true?" about, so a 30 s poll never brings the
  // strip back: marked Changed, this phone's own report, or answered 410 (expired).
  const changedIds = new Set<string>();
  const ownIds = new Set<string>();
  const expiredIds = new Set<string>();
  // Reports this visit confirmed (or was told it already had): the strip stays, answered.
  const confirmNotes = new Map<string, { text: string; grey: boolean }>();
  // Reports this visit confirmed from away (the confirm answered onsite: false), so the grey
  // "Counted from away" note survives every repaint.
  const fromAway = new Set<string>();
  const sending = new Set<string>();
  let lastBest: string | null = null;
  let loaded = false;

  function cardFor(spotId: string): HTMLElement | null {
    return root!.querySelector<HTMLElement>(`[data-pb-card="${CSS.escape(spotId)}"]`);
  }
  function stripFor(spotId: string, kind: string): HTMLElement | null {
    const card = cardFor(spotId);
    return card ? q(`[data-pb-confirm="${CSS.escape(`${spotId}:${kind}`)}"]`, card) : null;
  }

  /** "from rec.us, checked Sep 28", plus "may have changed" at 45+ days (the tag for partial is its own element). */
  function provLine(p: Provenance): string {
    const stale = p.confidence !== 'partial' && daysBetween(p.checked, laToday()) >= STALE_DAYS;
    return `${provenanceText(p, sources)}${stale ? ' · may have changed' : ''}`;
  }

  // --- masthead ---
  function tickClock(): void {
    const clock = q('[data-pb-clock]');
    if (clock) clock.textContent = stamp12();
  }

  function paintMasthead(data: BoardPayload): void {
    const live = data.courts.some((c) => c.readings.wait || c.readings.parking);
    const dot = q('[data-pb-live]');
    if (dot) dot.hidden = !live;
    const validators = q('[data-pb-validators]');
    if (validators) {
      const { phones, courts } = data.validatorsToday;
      if (phones > 0) {
        validators.textContent = `${phones} validator${phones === 1 ? '' : 's'} today across ${courts} court${courts === 1 ? '' : 's'}`;
        validators.hidden = false;
      } else validators.hidden = true;
    }
  }

  // --- NOW hero ---
  function paintHero(best: BoardBest | null, emptyLine = 'No live reports. Check a court below.'): void {
    const hero = q('[data-pb-hero]');
    if (!hero) return;
    const line = q('[data-pb-hero-line]', hero);
    const reasonLabel = q('[data-pb-hero-reason-label]', hero);
    const prov = q('[data-pb-hero-prov]', hero);
    const link = q<HTMLAnchorElement>('[data-pb-hero-link]', hero);
    if (best) {
      hero.setAttribute('data-pb-hero-reason', best.reason);
      if (line) line.textContent = best.line;
      if (reasonLabel) { reasonLabel.textContent = REASON_LABEL[best.reason] ?? ''; reasonLabel.hidden = false; }
      if (prov) { prov.textContent = best.prov ? provLine(best.prov) : ''; prov.hidden = !best.prov; }
      if (link) { link.href = spotUrl(best.court); link.hidden = false; }
    } else {
      hero.setAttribute('data-pb-hero-reason', '');
      if (line) line.textContent = emptyLine;
      if (reasonLabel) reasonLabel.hidden = true;
      if (prov) prov.hidden = true;
      if (link) link.hidden = true;
    }
  }

  // --- conditions strip ---
  function paintConditions(c: Conditions): void {
    const wind = q('[data-pb-cond-wind]');
    if (wind) {
      if (c.wind) {
        const dir = c.wind.dir === 'VRB' ? 'VRB' : typeof c.wind.dir === 'number' ? compass(c.wind.dir) : '';
        const gust = c.wind.gustMph != null ? ` · G ${Math.round(c.wind.gustMph)}` : '';
        wind.textContent = `WIND ${Math.round(c.wind.mph)}${dir ? ` ${dir}` : ''}${gust}`;
        wind.hidden = false;
      } else wind.hidden = true;
    }
    const temp = q('[data-pb-cond-temp]');
    if (temp) { if (c.tempF != null) { temp.textContent = `${Math.round(c.tempF)}°F`; temp.hidden = false; } else temp.hidden = true; }
    const marine = q('[data-pb-cond-marine]');
    if (marine) {
      // "no marine layer today" already names it; "burned off 10:40" needs the prefix.
      if (c.marine) { marine.textContent = /marine layer/i.test(c.marine.label) ? c.marine.label : `MARINE LAYER ${c.marine.label}`; marine.hidden = false; } else marine.hidden = true;
    }
    const sunset = q('[data-pb-cond-sunset]');
    if (sunset) { if (c.sunset) { sunset.textContent = `SUNSET ${shortClock(c.sunset)}`; sunset.hidden = false; } else sunset.hidden = true; }
    const next3h = q('[data-pb-cond-next3h]');
    if (next3h) {
      const bits = c.next3h ? [c.next3h.short, c.next3h.maxPop != null && c.next3h.maxPop >= 30 ? `${c.next3h.maxPop}% rain` : null].filter(Boolean) : [];
      if (bits.length) { next3h.textContent = `NEXT 3H ${bits.join(' · ')}`; next3h.hidden = false; } else next3h.hidden = true;
    }
    const words = q('[data-pb-cond-words]');
    if (words) {
      const bits = [c.wind?.words, c.heat, c.wet].filter(Boolean) as string[];
      if (bits.length) { words.textContent = bits.join(' · '); words.hidden = false; } else words.hidden = true;
    }
  }

  // --- the Desk's second strip row: tides, swell, sun, air (BoardPayload.desk) ---
  /** "HIGH 7:12 AM" / "LOW 1:40 PM" for the next tide event a Tides fact's detail carries. */
  function tideLabel(fact: DeskFact): string {
    const next = (fact.detail as { next?: { type: string; at: string; ft: number }[] }).next ?? [];
    const arrow = fact.value === 'rising' ? '↑' : '↓';
    const e = next[0];
    if (!e) return `TIDE ${arrow}`;
    return `TIDE ${arrow} ${e.type === 'H' ? 'HIGH' : 'LOW'} ${clock12(e.at)} ${e.ft.toFixed(1)} FT`;
  }
  function swellLabel(fact: DeskFact): string {
    const d = fact.detail as { periodS?: number | null };
    return `SWELL ${fact.label.toUpperCase()}${d.periodS != null ? ` ${Math.round(d.periodS)} S` : ''}`;
  }
  function airLabel(fact: DeskFact): string {
    const d = fact.detail as { aqi?: number };
    return `AIR ${d.aqi ?? fact.label.toUpperCase()}`;
  }
  function sunLabel(fact: DeskFact): string {
    const d = fact.detail as { sunrise?: string };
    return d.sunrise ? `SUNRISE ${shortClock(d.sunrise)}` : 'SUNRISE —';
  }
  const DESK_LABEL: Record<string, (f: DeskFact) => string> = { tides: tideLabel, swell: swellLabel, sun: sunLabel, air: airLabel };

  function paintDesk(desk: BoardPayload['desk']): void {
    const row = q('[data-pb-desk]');
    const facts: DeskFact[] = [desk.tides, desk.swell, desk.sun, desk.air].filter((f): f is DeskFact => f != null);
    if (row) {
      for (const feed of ['tides', 'swell', 'sun', 'air'] as const) {
        const el = q(`[data-pb-desk-fact="${feed}"]`, row);
        if (!el) continue;
        const fact = desk[feed];
        if (fact) { el.textContent = DESK_LABEL[feed](fact); el.hidden = false; } else el.hidden = true;
      }
      row.hidden = facts.length === 0;
    }
    const bylines = q('[data-pb-desk-bylines]');
    if (bylines) {
      bylines.replaceChildren();
      // One byline per feed that filed (never per agent — Sol keeps two feeds and reads two bylines).
      facts.forEach((f, i) => {
        if (i > 0) bylines.append(' · ');
        const a = document.createElement('a');
        a.href = agentUrl(f.agent);
        a.textContent = f.byline;
        bylines.append(a);
      });
      bylines.hidden = facts.length === 0;
    }
  }

  // --- one court card ---
  /** The strip's buttons and note for one report: answered (note, buttons off) or open (buttons on). */
  function paintStripState(strip: HTMLElement, reportId: string): void {
    if (sending.has(reportId)) return; // mid-send: onConfirm owns the buttons
    const answered = confirmNotes.get(reportId);
    for (const btn of strip.querySelectorAll<HTMLButtonElement>('[data-pb-confirm-verdict]')) {
      btn.disabled = Boolean(answered);
      if (!answered) btn.removeAttribute('data-pressed');
    }
    const note = q('[data-pb-confirm-note]', strip);
    if (note) {
      note.hidden = !answered || fromAway.has(reportId); // from away has its own grey line
      if (answered) { note.textContent = answered.text; note.dataset.tone = answered.grey ? 'grey' : ''; }
    }
    const remote = q('[data-pb-confirm-remote]', strip);
    if (remote) remote.hidden = !fromAway.has(reportId);
  }

  function paintReading(card: HTMLElement, spotId: string, kind: 'wait' | 'parking', reading: BoardReading | null, last: BoardLast | null): void {
    const key = `${spotId}:${kind}`;
    const readingEl = q(`[data-pb-reading="${CSS.escape(key)}"]`, card);
    const quietEl = q(`[data-pb-quiet="${CSS.escape(key)}"]`, card);
    const confirmEl = q(`[data-pb-confirm="${CSS.escape(key)}"]`, card);
    const reaskEl = q(`[data-pb-reask="${CSS.escape(key)}"]`, card);
    const tap = q(`[data-pb-tap="${CSS.escape(key)}"]`, card);

    if (reading) readings.set(key, reading); else readings.delete(key);
    lasts.set(key, last);
    const rid = reading?.reportId ?? null;
    const closed = !!rid && (changedIds.has(rid) || ownIds.has(rid) || expiredIds.has(rid));
    const offerConfirm = !!reading && !!rid && reading.value !== 'cant' && !closed;

    if (readingEl) {
      readingEl.hidden = !reading;
      if (reading) {
        const label = q('[data-pb-reading-label]', readingEl);
        if (label) label.textContent = reading.label;
        const bars = q('[data-pb-reading-bars]', readingEl);
        if (bars) bars.setAttribute('data-bars', String(Math.min(5, reading.bars)));
        const validated = q('[data-pb-reading-validated]', readingEl);
        if (validated) validated.textContent = supportLabel(reading.support);
        const age = q('[data-pb-reading-age]', readingEl);
        if (age) age.textContent = agoLabel(reading.ageMin);
      }
    }
    if (quietEl) {
      quietEl.hidden = !!reading;
      if (!reading) quietEl.textContent = last ? `Last report ${clock12(last.observedAt)}: ${last.label}` : (kind === 'wait' ? 'Quiet. No live report yet.' : 'Quiet.');
    }
    if (confirmEl) {
      confirmEl.hidden = !offerConfirm;
      if (offerConfirm && reading && rid) {
        const qEl = q('[data-pb-confirm-q]', confirmEl);
        if (qEl) qEl.textContent = stillQuestion(reading.label);
        const meta = q('[data-pb-confirm-meta]', confirmEl);
        if (meta) meta.textContent = [supportLabel(reading.support), agoLabel(reading.ageMin)].filter(Boolean).join(' · ');
        paintStripState(confirmEl, rid);
      }
    }
    // build spec §10: an expired reading shows Report instead of Still true (parking's TapRow is its Report).
    if (reaskEl) reaskEl.hidden = !(reading && rid && expiredIds.has(rid));
    // The strip or the ask, never both (only parking has a TapRow to guard here).
    if (tap) tap.hidden = offerConfirm;
  }

  function paintVibe(card: HTMLElement, spotId: string, vibe: BoardVibe | null): void {
    const el = q(`[data-pb-vibe="${CSS.escape(spotId)}:vibe"]`, card);
    if (!el) return;
    if (vibe) {
      const chip = vibe.chips[0];
      const parts = [`Mostly ${vibe.label}`, vibe.runnerUp ? `some ${vibe.runnerUp}` : null].filter(Boolean).join(', ');
      el.textContent = `${parts} · ${vibe.n} rating${vibe.n === 1 ? '' : 's'}${chip ? ` · ${chip.v.replace(/-/g, ' ')} ×${chip.n}` : ''}`;
    } else el.textContent = 'Be the first to rate.';
  }

  /** One live schedule line: its words, the "unconfirmed" tag for a partial block, and where it came from (build spec §9). */
  function paintSchedLine(el: HTMLElement | null, blocks: Block[], text: string | null): void {
    if (!el) return;
    if (!text || blocks.length === 0) { el.hidden = true; return; }
    const words = q('[data-pb-sched-text]', el);
    if (words) words.textContent = text;
    const tag = q('[data-pb-sched-tag]', el);
    if (tag) tag.hidden = !blocks.some((b) => b.confidence === 'partial');
    const prov = q('[data-pb-sched-prov]', el);
    if (prov) prov.textContent = [...new Set(blocks.map((b) => provLine(b)))].join(' · ');
    el.hidden = false;
  }

  function paintSchedule(card: HTMLElement, boardCourt: BoardCourt): void {
    const now = q('[data-pb-sched-now]', card);
    const next = q('[data-pb-sched-next]', card);
    const running = boardCourt.now;
    paintSchedLine(now, running.map((s) => s.block), running.length ? running.map((s) => blockLine(s.block, `NOW until ${s.until}`)).join(' · ') : null);
    const upcoming = running.length === 0 ? boardCourt.next : null;
    paintSchedLine(next, upcoming ? [upcoming.block] : [], upcoming ? `Next: ${blockLine(upcoming.block, upcoming.when)}` : null);
  }

  /** "no on-site code yet" under a TapRow while this phone holds no code for the spot (build spec §10). */
  function paintTapHints(card: HTMLElement, spotId: string): void {
    const hasCode = storedCode(spotId) != null;
    for (const hint of card.querySelectorAll<HTMLElement>('[data-pb-tap-hint]')) hint.hidden = hasCode;
  }

  /** A court's call from the desk (DeskCall.astro), or hidden without one. The answer buttons are TapRow, unchanged. */
  function paintCall(card: HTMLElement, call: CallView | null): void {
    const shell = q('[data-pb-call]', card);
    if (!shell) return;
    if (!call) { shell.hidden = true; return; }
    paintCallLines(q('[data-pb-call-head]', shell), q('[data-pb-call-belief]', shell), call);
    shell.hidden = false;
  }

  function paintCourt(boardCourt: BoardCourt): void {
    const card = cardFor(boardCourt.id);
    if (!card) return;
    card.setAttribute('data-pb-status', boardCourt.status);
    paintSchedule(card, boardCourt);
    paintReading(card, boardCourt.id, 'wait', boardCourt.readings.wait, boardCourt.last.wait);
    paintReading(card, boardCourt.id, 'parking', boardCourt.readings.parking, boardCourt.last.parking);
    paintVibe(card, boardCourt.id, boardCourt.vibe);
    paintTapHints(card, boardCourt.id);
    paintCall(card, boardCourt.call);
  }

  /** Best bet first: the one card GET /api/air/board names moves to the top. */
  function reorder(best: string | null): void {
    if (!cardsEl || best === lastBest) return;
    const previous = lastBest ? cardFor(lastBest) : null;
    previous?.removeAttribute('data-pb-best');
    if (best) {
      const card = cardFor(best);
      if (card) { card.setAttribute('data-pb-best', ''); cardsEl.prepend(card); }
    }
    lastBest = best;
  }

  /** No board yet (503, offline, a 5xx): say so, rather than "Checking the board…" forever. The schedules are static and still true. */
  function paintUnavailable(): void {
    paintHero(null, UNAVAILABLE);
    for (const el of root!.querySelectorAll<HTMLElement>('[data-pb-quiet]')) {
      if (!el.dataset.pbQuiet) continue;
      el.textContent = 'Live reading unavailable.';
      el.hidden = false;
    }
  }

  async function refresh(): Promise<void> {
    const data = await getJson<BoardPayload>('/api/air/board');
    if (!data) {
      // After a good poll the last paint stays up (every reading carries its age); before one, say the board is down.
      if (!loaded) paintUnavailable();
      return;
    }
    loaded = true;
    paintMasthead(data);
    paintHero(data.best);
    paintConditions(data.conditions);
    paintDesk(data.desk);
    for (const c of data.courts) paintCourt(c);
    reorder(data.best?.court ?? null);
  }

  function repaint(spotId: string, kind: 'wait' | 'parking', reading: BoardReading | null): void {
    const card = cardFor(spotId);
    if (card) paintReading(card, spotId, kind, reading, lasts.get(`${spotId}:${kind}`) ?? null);
  }

  // --- Still true? (wait, parking) ---
  async function onConfirm(spotId: string, kind: 'wait' | 'parking', verdict: 'still' | 'changed', btn: HTMLElement): Promise<void> {
    const key = `${spotId}:${kind}`;
    const reading = readings.get(key);
    if (!reading?.reportId) return;
    const rid = reading.reportId;
    if (sending.has(rid)) return;
    const code = storedCode(spotId);
    if (verdict === 'changed') {
      changedIds.add(rid);
      // keepalive: `wait` navigates away at once, and a plain fetch can die with the page.
      void postJson('/api/air/confirm', { reportId: reading.reportId, verdict: 'changed', device, code }, { keepalive: true });
      if (kind === 'wait') { location.href = spotUrl(spotId); return; }
      // parking: the strip goes, the TapRow opens, and changedIds keeps it that way across polls.
      repaint(spotId, kind, reading);
      return;
    }

    const strip = stripFor(spotId, kind);
    const buttons = strip ? [...strip.querySelectorAll<HTMLButtonElement>('[data-pb-confirm-verdict]')] : [];
    const note = strip ? q('[data-pb-confirm-note]', strip) : null;
    sending.add(rid);
    btn.setAttribute('data-pressed', '');
    for (const b of buttons) b.disabled = true;
    if (note) note.hidden = true;
    const res = await postJson<{ onsite?: boolean; award?: { points?: number }; reading?: SpotReading }>(
      '/api/air/confirm', { reportId: reading.reportId, verdict: 'still', device, code },
    );
    sending.delete(rid);
    const json = res.json;
    if (json && json.ok === true) {
      if (json.onsite === false) fromAway.add(rid);
      const points = json.award?.points ?? 0;
      confirmNotes.set(rid, { text: json.onsite === false ? '' : points > 0 ? `+${points} · counted` : 'Counted.', grey: false });
      // The endpoint answers with the reading as it stands after this confirm; the poll would lag up to 30 s behind it.
      repaint(spotId, kind, toBoardReading(json.reading, kind) ?? reading);
      return;
    }
    const reason = json && json.ok === false ? json.reason : null;
    if (res.status === 409 || reason === 'already-confirmed') {
      confirmNotes.set(rid, { text: 'Already counted.', grey: true });
      repaint(spotId, kind, reading);
    } else if (res.status === 410 || reason === 'expired') {
      expiredIds.add(rid);
      repaint(spotId, kind, reading);
    } else if (reason === 'own-report') {
      ownIds.add(rid);
      repaint(spotId, kind, reading);
    } else {
      btn.removeAttribute('data-pressed');
      for (const b of buttons) b.disabled = false;
      if (note) { note.textContent = 'Didn’t send. Tap again.'; note.dataset.tone = 'grey'; note.hidden = false; }
    }
  }

  // --- TapRow (parking, vibe) ---
  async function onTapValue(spotId: string, kind: string, value: string, btn: HTMLElement): Promise<void> {
    const row = btn.closest<HTMLElement>('[data-pb-tap]');
    if (!row || row.dataset.pbTapState === 'sending') return;
    row.dataset.pbTapState = 'sending';
    const note = q('[data-pb-tap-note]', row);
    const chips = q('[data-pb-tap-chips]', row);
    const observedAt = Date.now();
    const code = storedCode(spotId);
    const res = await postJson<{ award?: { points: number }; report?: { id?: string; onsite?: boolean }; reading?: SpotReading }>(
      `/api/air/${encodeURIComponent(spotId)}`, { kind, value, device, code, extras: [], asGuest: false, observedAt },
    );
    if (res.json && res.json.ok === true) {
      row.dataset.pbTapState = 'sent';
      ownTaps.set(`${spotId}:${kind}`, { value, extras: [], observedAt });
      // Never ask this phone "Still true?" about its own report.
      if (res.json.report?.id) ownIds.add(res.json.report.id);
      const away = res.json.report?.onsite === false;
      const points = res.json.award?.points ?? 0;
      if (note) {
        // A remote row is kept but never counts toward a reading or a vibe line: say so, not "Counted."
        note.textContent = away ? 'Filed from away · open your group link at the court to count.' : points > 0 ? `+${points}` : 'Counted.';
        note.dataset.tone = away ? 'grey' : '';
        note.hidden = false;
      }
      if (chips) chips.hidden = false;
      if (kind === 'parking') repaint(spotId, 'parking', toBoardReading(res.json.reading, 'parking') ?? readings.get(`${spotId}:parking`) ?? null);
    } else if (res.json && res.json.ok === false && res.json.reason === 'no-open-call') {
      // A call from the desk someone already answered (the board is up to 30 s behind):
      // done, not "tap again" — the buttons stay off and the next poll drops the call.
      row.dataset.pbTapState = 'sent';
      if (note) { note.textContent = 'Already answered.'; note.dataset.tone = 'grey'; note.hidden = false; }
      void refresh();
    } else {
      row.dataset.pbTapState = 'idle';
      if (note) { note.textContent = 'Didn’t send. Tap again.'; note.dataset.tone = 'grey'; note.hidden = false; }
    }
  }

  async function onTapExtra(spotId: string, kind: string, chip: HTMLElement): Promise<void> {
    const key = `${spotId}:${kind}`;
    const own = ownTaps.get(key);
    if (!own) return;
    const on = chip.getAttribute('aria-pressed') === 'true';
    chip.setAttribute('aria-pressed', on ? 'false' : 'true');
    const extras = on ? own.extras.filter((x) => x !== chip.dataset.pbTapExtra) : [...own.extras, chip.dataset.pbTapExtra || ''];
    if (!on && extras.length > 2) { chip.setAttribute('aria-pressed', 'false'); return; }
    own.extras = extras;
    const code = storedCode(spotId);
    void postJson(`/api/air/${encodeURIComponent(spotId)}`, { kind, value: own.value, device, code, extras, asGuest: false, observedAt: own.observedAt });
  }

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const confirmBtn = target.closest<HTMLElement>('[data-pb-confirm-verdict]');
    if (confirmBtn) {
      const strip = confirmBtn.closest<HTMLElement>('[data-pb-confirm]');
      const [spotId, kind] = (strip?.dataset.pbConfirm || '').split(':');
      if (spotId && (kind === 'wait' || kind === 'parking')) void onConfirm(spotId, kind, (confirmBtn.dataset.pbConfirmVerdict as 'still' | 'changed') || 'still', confirmBtn);
      return;
    }
    const valueBtn = target.closest<HTMLElement>('[data-pb-tap-value]');
    if (valueBtn) {
      const row = valueBtn.closest<HTMLElement>('[data-pb-tap]');
      const [spotId, kind] = (row?.dataset.pbTap || '').split(':');
      if (spotId && kind) void onTapValue(spotId, kind, valueBtn.dataset.pbTapValue || '', valueBtn);
      return;
    }
    const extraBtn = target.closest<HTMLElement>('[data-pb-tap-extra]');
    if (extraBtn) {
      const row = extraBtn.closest<HTMLElement>('[data-pb-tap]');
      const [spotId, kind] = (row?.dataset.pbTap || '').split(':');
      if (spotId && kind) void onTapExtra(spotId, kind, extraBtn);
    }
  });

  // --- polling, paused while hidden ---
  let timer: number | undefined;
  const schedule = () => { clearTimeout(timer); if (!document.hidden) timer = window.setTimeout(() => { void refresh().then(schedule); }, POLL_MS); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else { tickClock(); void refresh().then(schedule); } });

  tickClock();
  window.setInterval(tickClock, 30_000);
  void refresh().then(schedule);
}
