// Pure parts of /api/paddles/wear — validation and aggregation — kept in a
// plain module so tests run them under node without the Pages runtime.

export const MIN_SHOWN = 3;
const RATINGS = [2.5, 3, 3.5, 4, 4.5, 5];
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10;
};

/** Pure: aggregates from a list of reports, or null under the floor. */
export function aggregate(reports) {
  if (reports.length < MIN_SHOWN) return null;
  const fades = reports.filter((r) => r.fadeAt != null).map((r) => r.fadeAt);
  const deads = reports.filter((r) => r.deadAt != null).map((r) => r.deadAt);
  const ratings = {};
  for (const r of reports) if (r.rating != null) ratings[r.rating.toFixed(1)] = (ratings[r.rating.toFixed(1)] ?? 0) + 1;
  return {
    n: reports.length,
    medianHours: median(reports.map((r) => r.hours)),
    medianSessions: median(reports.map((r) => r.sessions)),
    medianMonths: median(reports.map((r) => r.months)),
    fade: fades.length >= MIN_SHOWN ? { n: fades.length, medianHours: median(fades) } : null,
    dead: { n: deads.length, medianHours: deads.length ? median(deads) : 0, share: Math.round((deads.length / reports.length) * 100) / 100 },
    ratings,
    updated: Math.max(...reports.map((r) => r.t)),
  };
}

/** Pure: parse and validate a report body, or return a reason. Never repairs. */
export function parseReport(body) {
  const paddleId = typeof body.paddleId === 'string' ? body.paddleId : '';
  if (!ID_RE.test(paddleId) || paddleId.length > 64) return { reason: 'bad-paddle' };
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
  const hours = num(body.hours), sessions = num(body.sessions), months = num(body.months);
  if (!(hours >= 1 && hours <= 3000)) return { reason: 'bad-hours' };
  if (!(Number.isInteger(sessions) && sessions >= 1 && sessions <= 2000)) return { reason: 'bad-sessions' };
  if (!(months >= 0 && months <= 60)) return { reason: 'bad-months' };
  if (hours / sessions > 12) return { reason: 'bad-hours' };
  const opt = (v, cap) => (v == null ? null : num(v) >= 0.5 && num(v) <= cap ? num(v) : NaN);
  const fadeAt = opt(body.fadeAt, hours), deadAt = opt(body.deadAt, hours);
  if (Number.isNaN(fadeAt)) return { reason: 'bad-fade' };
  if (Number.isNaN(deadAt)) return { reason: 'bad-dead' };
  const rating = body.rating == null ? null : RATINGS.includes(num(body.rating)) ? num(body.rating) : NaN;
  if (Number.isNaN(rating)) return { reason: 'bad-rating' };
  const round = (v) => (v == null ? null : Math.round(v * 2) / 2);
  return { paddleId, report: { hours: round(hours), sessions, months: Math.round(months), fadeAt: round(fadeAt), deadAt: round(deadAt), rating } };
}

