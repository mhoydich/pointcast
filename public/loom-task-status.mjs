/** Reported task state, not proof of completion, identity, or permission.
 * Pure projection of visible root posts and direct replies in one retained log. */
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const who = m => ({ name: clean(m.from?.name || 'anonymous').slice(0, 80), address: m.from?.address || null, verified: m.from?.verified === true });
const label = person => person?.address || person?.name || 'unclaimed';
const receipt = m => ({ id: m.id, at: m.editedAt || m.at, by: who(m) });
const stamp = m => Date.parse(m.editedAt || m.at) || 0;
function report(message, task) {
  const first = String(message.body ?? '').split('\n').find(line => line.trim()) || '';
  if (/\b(?:TEMPLATE|EXAMPLE|PARTIAL)\b/i.test(first)) return null;
  const match = first.match(/(?:^|[·|—])\s*(MINE|DONE|BLOCKED|REOPEN)\b(.*)/i);
  if (!match) return null;
  const command = match[1].toUpperCase(); let tail = match[2].trim(); let whole = false;
  const taskId = tail.match(/^OFF-\d{1,5}\b/i)?.[0].toUpperCase();
  if (taskId) {
    if (taskId !== task) return null;
    tail = tail.slice(taskId.length).replace(/^\s*[/:\-]?\s*/, '');
    whole = !tail || /^[.·]/.test(tail);
  }
  if (/^ALL\b/i.test(tail)) whole = true;
  const tags = tail.match(/^((?:S\d{1,2}|[A-Z]|\d{1,2})(?:\s*[\/,&+]\s*(?:S\d{1,2}|[A-Z]|\d{1,2}))*)(?=\s|[.,:·]|$)/i)?.[1];
  return { command, whole, tags: tags ? tags.toUpperCase().split(/\s*[\/,&+]\s*/) : [], source: receipt(message) };
}
function apply(state, report) {
  if (report.command === 'MINE') {
    if (state.status === 'done') return;
    const claimant = state.claimedBy?.address || state.claimedBy?.name?.toLowerCase();
    const incoming = report.source.by.address || report.source.by.name.toLowerCase();
    if (claimant && claimant !== incoming) return;
    state.claimedBy ??= report.source.by;
    state.source = report.source;
  } else {
    state.status = report.command === 'DONE' ? 'done' : 'open';
    state.blocked = report.command === 'BLOCKED';
    state.source = report.source;
  }
}
export function taskSummaries(messages = []) {
  const visible = messages.filter(m => !m.hidden && !m.withdrawn && !m.via);
  const result = new Map();
  const children = new Map();
  for (const m of visible) if (m.parent) {
    if (!children.has(m.parent)) children.set(m.parent, []);
    children.get(m.parent).push(m);
  }
  for (const root of visible) {
    if (root.parent || !['note', 'question', 'claim'].includes(root.kind)) continue;
    const task = String(root.body ?? '').trim().match(/^(?:TASK\s+)?(OFF-\d{1,5})\b/i)?.[1].toUpperCase();
    if (!task) continue;
    const partKeys = [...new Set([...String(root.body).matchAll(/^\s*(?:\*\*)?(S\d{1,2}|[A-Z]|\d{1,2})(?:\*\*)?\s*[·.)]\s+\S/gm)].map(m => m[1]))];
    const base = () => ({ status: 'open', blocked: false, claimedBy: null, source: receipt(root) });
    const state = base(), parts = new Map(partKeys.map(key => [key, base()]));
    let ambiguousReports = 0;
    const events = [...(children.get(root.id) || [])];
    if (/^\s*status\s*:\s*done(?:\s*[·—|].*)?\s*$/im.test(String(root.body))) events.push({ ...root, body: 'DONE ALL' });
    for (const m of events.sort((a,b) => stamp(a) - stamp(b) || (a.seq || 0) - (b.seq || 0))) {
      if (m.from?.address === '@collator' || clean(m.from?.name).toLowerCase() === 'collator') continue;
      const r = report(m, task); if (!r) continue;
      if (!parts.size) {
        if (r.tags.length && !r.whole) { ambiguousReports++; continue; }
        apply(state, r);
      } else if (r.whole) {
        for (const part of parts.values()) apply(part, r);
      } else if (r.tags.length && r.tags.every(tag => parts.has(tag))) {
        for (const tag of r.tags) apply(parts.get(tag), r);
      } else { ambiguousReports++; }
    }
    const list = [...parts].map(([part, value]) => ({ part, ...value }));
    const status = list.length ? (list.every(p => p.status === 'done') ? 'done' : 'open') : state.status;
    const latest = list.length ? [...list].sort((a,b) => Date.parse(b.source.at || 0) - Date.parse(a.source.at || 0))[0].source : state.source;
    const assignedTo = clean(String(root.body).match(/^\s*owner\s*:\s*(.+)$/im)?.[1] || '').slice(0, 80) || null;
    const owner = state.claimedBy ? label(state.claimedBy) : assignedTo;
    const suffix = list.length
      ? list.map(p => `${p.part} ${p.status}${p.blocked ? '/blocked' : ''} ${p.status === 'done' ? 'by ' + label(p.source.by) : p.claimedBy ? 'owner ' + label(p.claimedBy) : 'unclaimed'}`).join('; ')
      : `${state.blocked ? 'blocked; ' : ''}${state.status === 'open' ? 'owner ' + (owner || 'unclaimed') + '; ' : ''}by ${label(state.source.by)}`;
    result.set(root.id, { task, status, reported: true, by: latest.by, source: latest, claimedBy: state.claimedBy, assignedTo, owner, blocked: list.length ? list.some(p => p.blocked) : state.blocked, parts: list, ambiguousReports,
      line: `${task} ${status.toUpperCase()} · ${suffix} (reported)` });
  }
  return result;
}
