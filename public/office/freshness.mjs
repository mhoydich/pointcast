/** Local projection only: never fetches, changes source times, or creates activity. */
export const OFFICE_END = Date.parse('2026-11-18T17:24:00.000Z');
export const POST_FRESHNESS_MS = 15 * 60_000;
const EVIDENCE_FRESHNESS_MS = 120_000;
const instant = value => typeof value === 'string' ? Date.parse(value) : NaN;
const cutoff = data => Math.min(OFFICE_END, Number.isFinite(instant(data?.expiresAt)) ? instant(data.expiresAt) : OFFICE_END);
const empty = () => ({schema:'pointcast.office-view/v1',observedAt:null,desks:[],events:[],edges:[],merges:[],blocked:[],errors:[]});

export function projectFreshness(data, now) {
  if (data && (data.schema !== 'pointcast.office-view/v1' || !Array.isArray(data.desks) || data.desks.length > 25 || !Array.isArray(data.events) || !Array.isArray(data.edges))) throw new Error('invalid_snapshot');
  const ended = now >= cutoff(data) || data?.state === 'ended';
  if (!data && !ended) return null;
  const source = data || empty();
  let aged = false;
  const desks = source.desks.map(desk => {
    const posted = instant(desk.facts?.lastPostAt);
    const expired = Number.isFinite(posted) && (posted > now || now >= posted + POST_FRESHNESS_MS);
    aged ||= expired;
    return {...desk, ...(ended ? {eligible:false} : {}), facts:{...desk.facts, stale:ended || expired || desk.facts?.stale === true}};
  });
  const observed = instant(source.observedAt);
  const evidenceOld = !Number.isFinite(observed) || observed > now || now >= observed + EVIDENCE_FRESHNESS_MS;
  const edges = source.edges.filter(edge => {
    const at = instant(edge.at);
    return !Number.isFinite(at) || (at <= now && now < at + POST_FRESHNESS_MS);
  });
  return {...source, desks, edges,
    state:ended ? 'ended' : (aged || evidenceOld) && !['degraded','error'].includes(source.state) ? 'stale' : source.state,
    evidenceFresh:!ended && !evidenceOld && source.evidenceFresh === true,
    ...(ended ? {events:[],edges:[],merges:[],blocked:[]} : {})};
}

/** One alarm for the next deadline, never a polling interval or a network callback. */
export function createFreshnessGuard({onChange,clock=Date.now,schedule=setTimeout,cancel=clearTimeout}) {
  let source = null, timer, lastNow = -Infinity, closed = false;
  const now = () => (lastNow = Math.max(lastNow, clock()));
  function arm(at) {
    cancel(timer); timer = undefined;
    const end = cutoff(source);
    if (closed || at >= end || source?.state === 'ended') return;
    const deadlines = [end];
    for (const desk of source?.desks || []) {
      const expires = instant(desk.facts?.lastPostAt) + POST_FRESHNESS_MS;
      if (desk.facts?.stale !== true && Number.isFinite(expires) && expires > at) deadlines.push(expires);
    }
    for (const edge of source?.edges || []) {
      const expires = instant(edge.at) + POST_FRESHNESS_MS;
      if (Number.isFinite(expires) && expires > at) deadlines.push(expires);
    }
    const evidenceEnd = instant(source?.observedAt) + EVIDENCE_FRESHNESS_MS;
    if (source?.evidenceFresh && Number.isFinite(evidenceEnd) && evidenceEnd > at) deadlines.push(evidenceEnd);
    timer = schedule(() => recheck('age'), Math.min(...deadlines) - at);
  }
  function recheck(reason='resume') {
    const at = now();
    closed ||= at >= cutoff(source) || source?.state === 'ended';
    const projected = projectFreshness(closed ? {...(source || empty()),state:'ended'} : source, at);
    if (projected) onChange(projected, reason);
    arm(at);
  }
  arm(now()); // The hard end also applies while the first read is still pending.
  return {
    accept(data) { const at=now(); projectFreshness(data, at); closed ||= at >= cutoff(source) || source?.state === 'ended'; source=data; recheck('read'); },
    recheck,
    expired() { closed ||= now() >= cutoff(source) || source?.state === 'ended'; return closed; },
    forget() { source=null; arm(now()); },
    destroy() { cancel(timer); source=null; }
  };
}
