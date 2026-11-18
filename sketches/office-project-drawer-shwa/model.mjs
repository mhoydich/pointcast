// Display adapter only. Report parsing remains owned by public/loom-task-status.mjs (#1722).
export function time(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value.replace(/Z$/, value.includes('.') ? 'Z' : '.000Z') ? ms : null;
}
export function freshness(at, now, hours = 24) {
  const ms = time(at); const current = time(now);
  if (ms === null || current === null || ms > current || !Number.isFinite(hours) || hours <= 0) return 'unknown';
  return current - ms > hours * 3600000 ? 'stale' : 'checked';
}
export function safeUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    if (u.hostname === 'github.com' && /^\/mhoydich\/pointcast\/(pull\/\d+|commit\/[a-f0-9]{40}|actions\/runs\/\d+)$/.test(u.pathname) && !u.search && !u.hash) return u.href;
    if (u.hostname === 'pointcast.xyz' && u.pathname === '/loom' && [...u.searchParams.keys()].every(k => k === 'to') && /^loom:[a-f0-9]+#m_[a-z0-9]+$/.test(u.searchParams.get('to') || '') && !u.hash) return u.href;
  } catch {}
  return null;
}
export function selectReport(payload, project) {
  if (payload?.ok !== true || payload.log?.key !== project.roomKey || !Array.isArray(payload.messages)) return null;
  const root = payload.messages.find(m => m.id === project.rootId);
  const summary = root?.taskStatus;
  if (summary?.reported !== true || !Array.isArray(summary.parts)) return null;
  const part = summary.parts.find(p => p.part === project.part);
  if (!part || !['done', 'open'].includes(part.status) || !/^m_[a-z0-9]+$/.test(part.source?.id || '')) return null;
  // Explicit allowlist: do not persist root/reply bodies, edit tokens or arbitrary API fields.
  return {status:part.status, blocked:part.blocked === true, source:{id:part.source.id,at:part.source.at,by:{name:String(part.source.by?.name || 'Unknown reporter').slice(0,100)}},claimedBy:part.claimedBy ? {name:String(part.claimedBy.name || '').slice(0,100)} : null};
}
export function view(data, report, now) {
  const e = data.evidence || {};
  const state = freshness(e.checkedAt, now, e.maxAgeHours);
  const usable = state === 'checked' && safeUrl(e.pr?.url) && /^[a-f0-9]{40}$/.test(e.pr?.head || '');
  return {
    reported: report ? (report.blocked ? 'Blocked · reported' : report.status === 'done' ? 'Done · reported' : 'Open · reported') : 'Unknown · no report',
    reportFreshness: freshness(report?.source?.at, now),
    evidenceFreshness: state,
    merge: usable ? (e.pr.merged === true ? 'Merged · checked' : 'Not merged · checked') : 'Unknown · recheck needed',
    // This pilot has no verified CI/deployment collector. Reports cannot populate these fields.
    tests: 'Unknown · not checked here',
    deployment: 'Unknown · no release proof',
    approval: 'Not an approval',
  };
}
