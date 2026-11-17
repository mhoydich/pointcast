// Gantt layout for the receipt timeline. Pure functions, no DOM: the page and
// the tests share them. Positions are percentages of the time window.
//
// Honesty rules carried into the layout:
// - A bar exists only when both ends are retained receipts in order
//   (claim → result, or claim → blocked partial). Nothing is guessed.
// - Missing or reversed timing gives a dot at the one receipt we have, or no
//   mark at all. Never a bar.
// - Spans are elapsed wall time between posts, not effort or compute.

const HOUR = 3600e3;
const TZ = 'America/Los_Angeles';
const ms = iso => (iso ? Date.parse(iso) : NaN);

// The window runs from the hour before the first receipt to the hour after the
// snapshot ("now"). PT offsets are whole hours, so UTC hour edges are PT hour edges.
export function ganttDomain(jobs, now) {
  const times = jobs.flatMap(j => [j.claim?.at, j.partial?.at, j.done?.at]).map(ms).filter(Number.isFinite);
  const nowMs = ms(now);
  if (Number.isFinite(nowMs)) times.push(nowMs);
  if (!times.length) return null;
  const start = Math.floor(Math.min(...times) / HOUR) * HOUR;
  let end = Math.ceil(Math.max(...times) / HOUR) * HOUR;
  if (end <= start) end = start + HOUR;
  return { start, end, now: Number.isFinite(nowMs) ? nowMs : null };
}

export const pct = (t, { start, end }) => Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100));

export function ganttRow(job, domain) {
  const base = { id: job.id, owner: job.owner, title: job.title, state: job.state, intervalMs: job.intervalMs, bar: null, dot: null, tail: null };
  const claim = ms(job.claim?.at), done = ms(job.done?.at), partial = ms(job.partial?.at);
  const span = (a, b, kind) => ({ kind, from: a, to: b, left: pct(a, domain), width: pct(b, domain) - pct(a, domain) });
  if (job.state === 'delivered' && job.intervalMs !== null && Number.isFinite(claim) && Number.isFinite(done) && done >= claim) {
    return { ...base, mark: 'bar', bar: span(claim, done, 'delivered') };
  }
  if (job.state === 'blocked' && Number.isFinite(partial)) {
    const tail = domain.now !== null && domain.now > partial ? span(partial, domain.now, 'waiting') : null;
    if (Number.isFinite(claim) && partial >= claim) return { ...base, mark: 'bar', bar: span(claim, partial, 'blocked'), tail };
    return { ...base, mark: 'dot', dot: { at: partial, left: pct(partial, domain), role: 'partial' }, tail };
  }
  const only = [[done, 'done'], [partial, 'partial'], [claim, 'claim']].find(([t]) => Number.isFinite(t));
  if (only) return { ...base, mark: 'dot', dot: { at: only[0], left: pct(only[0], domain), role: only[1] } };
  return { ...base, mark: 'none' };
}

// One group per person/seat, in first-seen order, rows sorted by start time.
export function ganttGroups(jobs, domain, seats = []) {
  const groups = new Map();
  for (const job of jobs) {
    if (!groups.has(job.owner)) groups.set(job.owner, { owner: job.owner, seat: seats.find(s => s.id === job.owner) || null, rows: [] });
    groups.get(job.owner).rows.push(ganttRow(job, domain));
  }
  const first = r => r.bar?.from ?? r.dot?.at ?? Infinity;
  for (const g of groups.values()) g.rows.sort((a, b) => first(a) - first(b));
  return [...groups.values()];
}

const ptHour = t => Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date(t)));
const hourLabel = t => new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric' }).format(new Date(t));
const dayLabel = t => new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(t));

// Hour ticks at PT hour boundaries, thinned to at most maxTicks. A tick at PT
// midnight, and the first tick, carry the day label.
export function ganttTicks(domain, maxTicks = 8) {
  const hours = (domain.end - domain.start) / HOUR;
  const step = [1, 2, 3, 6, 12, 24].find(s => hours / s <= maxTicks) || 24;
  const ticks = [];
  for (let t = domain.start; t <= domain.end; t += HOUR) {
    const h = ptHour(t);
    if (h % step) continue;
    ticks.push({ t, pct: pct(t, domain), hour: hourLabel(t), day: h === 0 || !ticks.length ? dayLabel(t) : null });
  }
  return ticks;
}
