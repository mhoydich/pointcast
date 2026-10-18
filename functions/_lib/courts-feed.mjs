// How sure /courts.json is about a court's hours, as one word an agent can
// branch on (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §7.8).
// Pure and import-free so the Pages function and the tests share it.
//
//   verified     a page we read says so
//   posted-sign  a sign at the court says so (Hours.evidence)
//   reported     partial: a source says so but it conflicts, or someone reported it (Hours.evidence)
//   unknown      no hours in the file, or hours we do not stand behind

export const HOURS_CONFIDENCE = Object.freeze(['verified', 'posted-sign', 'reported', 'unknown']);

const EVIDENCE = Object.freeze(['posted-sign', 'reported']);
const has = (obj, key) => obj != null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key);

/** Days after which a checked fact "may have changed" (the board's showable() and src/lib/court-format.ts STALE_DAYS). */
export const STALE_DAYS = 45;
const LA_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayNum = (day) => { const [y, m, d] = String(day).split('-').map(Number); return Date.UTC(y, m - 1, d) / 86_400_000; };

/**
 * court.hours, sources[, nowMs] → {url, checked, confidence[, stale]}:
 *  no hours → {url: null, checked: null, confidence: 'unknown'};
 *  confidence 'unverified' → url/checked as sourced, 'unknown';
 *  hours.evidence set → that value; 'verified' → 'verified'; 'partial' → 'reported'.
 *  url = sources[hours.src].url, or null when the source is missing or a label.
 *  With nowMs, hours we stand behind that were checked STALE_DAYS+ LA days
 *  before it also carry stale: true, the same line the board's "may have
 *  changed" tag draws, so an agent never reads them as freshly verified.
 */
export function hoursSourceOf(court, sources, nowMs) {
  const hours = court?.hours;
  if (hours == null || typeof hours !== 'object') return { url: null, checked: null, confidence: 'unknown' };
  const url = has(sources, hours.src) && typeof sources[hours.src]?.url === 'string' ? sources[hours.src].url : null;
  const checked = typeof hours.checked === 'string' ? hours.checked : null;
  let confidence = 'unknown';
  if (hours.confidence === 'unverified') confidence = 'unknown';
  else if (EVIDENCE.includes(hours.evidence)) confidence = hours.evidence;
  else if (hours.confidence === 'verified') confidence = 'verified';
  else if (hours.confidence === 'partial') confidence = 'reported';
  if (Number.isFinite(nowMs) && confidence !== 'unknown' && checked && /^\d{4}-\d{2}-\d{2}$/.test(checked)
    && dayNum(LA_DAY.format(new Date(nowMs))) - dayNum(checked) >= STALE_DAYS) {
    return { url, checked, confidence, stale: true };
  }
  return { url, checked, confidence };
}

/* ---------- dated drop-in occurrences, for the /pickleball JSON-LD (§7.9) ---------- */

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (day, n) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
};
const weekdayOf = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
};
/** The date of the n-th Sunday (1-based) of a month (monthIndex 0-11). */
function nthSunday(year, monthIndex, n) {
  const first = new Date(Date.UTC(year, monthIndex, 1, 12)).getUTCDay();
  return 1 + ((7 - first) % 7) + (n - 1) * 7;
}

/**
 * Los Angeles UTC offset on an LA day, for a session that starts after 2 AM:
 * '-07:00' from the second Sunday of March up to the first Sunday of November,
 * '-08:00' from that Sunday on. (2026: -07:00 through Oct 31, -08:00 from Nov 1.)
 */
export function laOffset(day) {
  if (typeof day !== 'string' || !DAY_RE.test(day)) throw new RangeError(`bad day: ${day}`);
  const [y, m, d] = day.split('-').map(Number);
  const dst = (m > 3 && m < 11)
    || (m === 3 && d >= nthSunday(y, 2, 2))
    || (m === 11 && d < nthSunday(y, 10, 1));
  return dst ? '-07:00' : '-08:00';
}

/**
 * A weekly block's dated sessions in the `horizon` LA days starting at
 * `fromDay` (the build day, inclusive): every date whose weekday is in
 * block.days and that sits inside block.from..block.until (a null bound is
 * open). → [{date, start, end}] with ISO local times carrying that date's LA
 * offset: {date: '2026-10-24', start: '2026-10-24T09:00:00-07:00', end: '2026-10-24T12:00:00-07:00'}.
 * A block whose until is before fromDay, or whose times do not read, → [].
 */
export function dropinOccurrences(block, fromDay, horizon = 14) {
  if (!block || typeof fromDay !== 'string' || !DAY_RE.test(fromDay)) return [];
  if (!Array.isArray(block.days) || !HHMM_RE.test(block.start ?? '') || !HHMM_RE.test(block.end ?? '')) return [];
  const out = [];
  for (let i = 0; i < horizon; i += 1) {
    const date = addDays(fromDay, i);
    if (!block.days.includes(weekdayOf(date))) continue;
    if (block.from && date < block.from) continue;
    if (block.until && date > block.until) continue;
    const off = laOffset(date);
    out.push({ date, start: `${date}T${block.start}:00${off}`, end: `${date}T${block.end}:00${off}` });
  }
  return out;
}
