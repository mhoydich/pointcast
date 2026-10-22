/** Shared, deterministic search and public destination index. */
export const SEARCH_KINDS = ['ALL', 'PROJECT', 'BLOCK', 'POLL', 'PRODUCT'];

export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function publicDestination(value) {
  try {
    const url = new URL(value, 'https://pointcast.xyz');
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    if (url.hostname === 'pointcast.xyz') return (url.pathname.replace(/\/$/, '') || '/') + url.search + url.hash;
    return url.href.replace(/\/$/, '');
  } catch { return null; }
}

/** Apps and the dated launch register enrich the top-level page directory. */
export function projectSearchRows(apps = [], launches = [], features = []) {
  const rows = new Map();
  const add = (url, title, dek, keywords = '', timestamp = '') => {
    const destination = publicDestination(url);
    if (!destination || !title) return;
    const previous = rows.get(destination);
    rows.set(destination, {
      kind: 'PROJECT', id: destination, url: destination,
      label: 'PROJECT', labelBg: '#eaf0fb', labelFg: '#185FA5', type: 'EXPLORE',
      title, dek: dek || previous?.dek || '', timestamp: timestamp || previous?.timestamp || '',
      haystack: [destination, title, dek, keywords, previous?.haystack || ''].join(' '),
    });
  };
  features.forEach(f => add(f.slug, f.title, f.description, f.category, f.mtime ? new Date(f.mtime * 1000).toISOString() : ''));
  apps.forEach(a => add(a.url || a.path, a.name, a.description, `${a.kicker} ${a.channel}`));
  [...launches].sort((a, b) => a.date.localeCompare(b.date))
    .forEach(l => add(l.link, l.title, '', l.kicker, `${l.date}T12:00:00Z`));
  return [...rows.values()];
}

export function searchRows(rows, query = '', kind = 'ALL') {
  const needle = normalizeSearch(query);
  const tokens = needle.split(' ').filter(Boolean);
  const validKind = SEARCH_KINDS.includes(kind) ? kind : 'ALL';
  return rows.flatMap((row) => {
    if (validKind !== 'ALL' && row.kind !== validKind) return [];
    const title = normalizeSearch(row.title);
    const id = normalizeSearch(row.id);
    const haystack = normalizeSearch(`${row.id} ${row.title} ${row.dek} ${row.label} ${row.kind} ${row.type} ${row.haystack}`);
    if (!tokens.every(token => haystack.includes(token))) return [];
    const score = !needle ? 0 : (id === needle ? 200 : 0) + (title === needle ? 150 : 0)
      + (title.startsWith(needle) ? 60 : 0) + (title.includes(needle) ? 30 : 0)
      + tokens.filter(token => title.includes(token)).length * 10;
    return [{ row, score, time: Date.parse(row.timestamp) || 0 }];
  }).sort((a, b) => b.score - a.score || b.time - a.time || a.row.title.localeCompare(b.row.title))
    .map(hit => hit.row);
}
