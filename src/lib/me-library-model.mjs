/** Pure presentation/import helpers. No network access and no unrelated browser keys. */
export function safeKeepUrl(value) {
  try {
    const input = String(value).trim();
    const native = input.startsWith('/') && !input.startsWith('//') && !input.includes('\\');
    const url = new URL(native ? `https://pointcast.xyz${input}` : input);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (!url.hostname || url.href.length > 600) return null;
    return url.href;
  } catch { return null; }
}

export function moveItem(items, from, direction) {
  const to = from + direction;
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return [...items];
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function legacyImportGroups(read, shoppingItems = []) {
  const parse = key => { try { const x = JSON.parse(read(key) || '[]'); return Array.isArray(x) ? x : []; } catch { return []; } };
  const link = (url, title, site, description = '') => ({ kind: 'link', source: 'web', url, title, site, description });
  const pocket = parse('pointcast:shopping-pocket:v1').flatMap(id => {
    const item = shoppingItems.find(x => x.id === id);
    const url = item && safeKeepUrl(item.url);
    return url ? [link(url, `${item.maker} · ${item.name}`, 'ShoppingPocket', `Saved from the ${item.role || 'PointCast shopping'} study. ${item.description || ''}`.slice(0, 500))] : [];
  });
  const sparrow = parse('sparrow:saved').flatMap(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)
    ? [link(`https://pointcast.xyz/b/${encodeURIComponent(id)}`, `PointCast block ${id}`, 'Sparrow', `Imported from Sparrow. Original block ID: ${id}.`)] : []);
  const dock = parse('pc:dock:saved:v1').flatMap(path => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /^\/(?:api|auth|login)(?:\/|\?|$)/.test(path)) return [];
    const url = safeKeepUrl(`https://pointcast.xyz${path}`);
    return url ? [link(url, path, 'PointCast dock', 'Imported from your PointCast dock library.')] : [];
  });
  return [ ['ShoppingPocket', pocket], ['Sparrow', sparrow], ['Dock library', dock] ].map(([label, items]) => ({ label, items: [...new Map(items.map(item => [item.url, item])).values()] }));
}

/** The explicit allowlist used by visitor preview, never spreads a private Keep. */
export function publicCard(keep, caption = '') {
  const url = safeKeepUrl(keep.url);
  return { title: keep.title || (keep.kind === 'post' ? keep.text || 'Shortwave post' : url || 'Saved link'), url, caption: String(caption || '') };
}
