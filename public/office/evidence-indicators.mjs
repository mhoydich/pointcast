// Static ember motif inspired by Baby Bonfire's permission sketch; no media loaded.
const time = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const source = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
export function renderEvidence(document, { merges = [], blocked = [], asOf, stale = true } = {}) {
  const el = (tag, text, className) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
  const root = el('section', undefined, 'office-evidence');
  root.setAttribute('aria-label', 'Merge and blocker evidence');
  const fresh = stale === false && time(asOf);
  root.dataset.state = fresh ? 'current' : 'stale';
  root.append(el('h2', 'Evidence'), el('p', fresh ? `Snapshot as of ${asOf}` : `Stale or unknown snapshot · ${time(asOf) ? asOf : 'time unknown'}`));
  const mergeList = el('ul');
  root.append(el('h3', 'Merges'), mergeList);
  if (!merges.length) mergeList.append(el('li', 'No verified merge evidence supplied.'));
  for (const item of merges) {
    const url = source(item.url);
    const verified = item.verified === true && url && time(item.mergedAt);
    const lit = fresh && verified;
    const row = el('li', undefined, 'office-evidence__merge');
    row.dataset.state = lit ? 'verified-merged' : 'unknown';
    const ember = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ember.setAttribute('viewBox', '0 0 48 48');
    ember.setAttribute('class', `office-evidence__ember${lit ? ' is-lit' : ''}`);
    ember.setAttribute('aria-hidden', 'true');
    ember.setAttribute('focusable', 'false');
    ember.dataset.state = lit ? 'lit' : 'unlit';
    const shape = (d, fill) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d); path.setAttribute('fill', fill); ember.append(path);
    };
    // Original static drawing recalling the permission sketch's warm hearth/bowl.
    shape('M7 31H41C40 40 34 44 24 44S8 40 7 31Z', '#65564a');
    if (lit) {
      shape('M24 3C30 13 38 17 35 25C33 32 15 33 12 25C9 17 20 14 24 3Z', '#ad3e16');
      shape('M25 16C29 22 32 24 29 28C26 32 19 29 20 25C21 22 24 20 25 16Z', '#f6b779');
    }
    row.append(ember);
    row.append(el('span', `#${item.number ?? '?'} · ${lit ? 'Provider-verified merged' : verified ? 'Historical merge evidence · snapshot stale' : 'Merge unverified / unknown'} · ${time(item.mergedAt) ? item.mergedAt : 'merge time unknown'}`));
    if (url) { const a = el('a', 'Source'); a.href = url; row.append(a); }
    mergeList.append(row);
  }
  root.append(el('h3', 'Blocked work'));
  const blockedList = el('ul'); root.append(blockedList);
  if (!blocked.length) blockedList.append(el('li', 'No blocker evidence supplied; open drafts are not blockers.'));
  for (const item of blocked) {
    const url = source(item.url);
    const verified = fresh && item.verified === true && url && time(item.checkedAt) && typeof item.reason === 'string' && item.reason.trim();
    const row = el('li', `#${item.number ?? '?'} · ${verified ? 'Verified blocker' : 'Blocker unverified / stale'} · ${item.reason || 'reason unknown'} · ${time(item.checkedAt) ? item.checkedAt : 'check time unknown'}`);
    row.dataset.state = verified ? 'verified-blocked' : 'unknown';
    if (url) { const a = el('a', 'Source'); a.href = url; row.append(a); }
    blockedList.append(row);
  }
  root.append(el('small', 'Static ember motif inspired by Baby Bonfire · permission sketch. Merge evidence does not establish a live deployment.'));
  return root;
}
