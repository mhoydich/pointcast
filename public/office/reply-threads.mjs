/** Render only caller-supplied, genuine reply edges; never infer relationships. */
export function renderReplyThreads(document, edges = [], positions = {}) {
  const root = document.createElement('section');
  root.className = 'office-reply-threads';
  root.setAttribute('aria-label', 'Loom reply threads');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('office-reply-threads__lines');
  const list = document.createElement('ul');
  list.className = 'office-reply-threads__sources';
  const seen = new Set();
  const point = handle => {
    const value = positions instanceof Map ? positions.get(handle) : Object.hasOwn(positions, handle) ? positions[handle] : null;
    return value && Number.isFinite(value.x) && Number.isFinite(value.y) ? value : null;
  };
  for (const edge of Array.isArray(edges) ? edges : []) {
    if (!edge || typeof edge.id !== 'string' || !edge.id || seen.has(edge.id) ||
        typeof edge.parentId !== 'string' || !edge.parentId ||
        typeof edge.fromHandle !== 'string' || !edge.fromHandle ||
        typeof edge.toHandle !== 'string' || !edge.toHandle) continue;
    seen.add(edge.id);
    let url;
    try { url = new URL(edge.sourceUrl); } catch { continue; }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue;
    const from = point(edge.fromHandle), to = point(edge.toHandle);
    const self = edge.fromHandle === edge.toHandle;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent = `${edge.fromHandle} replied to ${edge.toHandle}${self ? ' (self reply)' : ''}${!from || !to ? ' (desk unavailable)' : ''}`;
    item.append(link);
    list.append(item);
    if (!from || !to || self) continue;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    for (const [key, value] of Object.entries({ x1: from.x, y1: from.y, x2: to.x, y2: to.y })) line.setAttribute(key, String(value));
    line.setAttribute('data-reply-id', edge.id);
    svg.append(line);
  }
  root.append(svg, list);
  return root;
}
