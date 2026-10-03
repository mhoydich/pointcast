/** Dependency-free parsers and classifications for a bounded public discovery audit.
 * HTML checks describe server-delivered markup; they do not simulate a browser. */
export const STATUS = ['pass', 'fail', 'warn', 'expected', 'unmeasured'];
export const normalizeSpace = value => String(value ?? '').replace(/\s+/g, ' ').trim();
export function decodeEntities(value) {
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (all, entity) => {
    if (entity[0] === '#') {
      const point = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : all;
    }
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[entity.toLowerCase()] ?? all;
  });
}
export function attrs(tag) {
  const found = {};
  const attributes = tag.replace(/^<\/?[\w:-]+/, '').replace(/\/?\s*>$/, '');
  for (const match of attributes.matchAll(/([^\s=<>"']+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const key = match[1].toLowerCase();
    if (!(key in found)) found[key] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return found;
}
export function normalizedUrl(value, base) {
  const url = new URL(value, base);
  url.hash = '';
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href;
}
export function parseRobots(text) {
  const groups = []; const sitemaps = []; let group = null; let hasRules = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const colon = line.indexOf(':'); if (colon < 0) continue;
    const name = line.slice(0, colon).trim().toLowerCase(); const value = line.slice(colon + 1).trim();
    if (name === 'sitemap') { if (value) sitemaps.push(value); continue; }
    if (name === 'user-agent') {
      if (!group || hasRules) { group = { agents: [], rules: [] }; groups.push(group); hasRules = false; }
      group.agents.push(value.toLowerCase());
    } else if (group && (name === 'allow' || name === 'disallow')) {
      hasRules = true; if (value) group.rules.push({ directive: name, pattern: value });
    }
  }
  return { groups, sitemaps: [...new Set(sitemaps)] };
}
function robotsPattern(pattern) {
  const anchored = pattern.endsWith('$');
  const raw = anchored ? pattern.slice(0, -1) : pattern;
  const escaped = raw.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${escaped}${anchored ? '$' : ''}`);
}
/** Named groups replace *, longest matching pattern wins, and Allow wins a tie. */
export function robotsDecision(parsed, agent, target) {
  const token = agent.toLowerCase();
  let specificity = -1; let selected = [];
  for (const group of parsed.groups) {
    const matches = group.agents.filter(name => name !== '*' && token.includes(name));
    const size = matches.length ? Math.max(...matches.map(name => name.length)) : (group.agents.includes('*') ? 0 : -1);
    if (size > specificity) { specificity = size; selected = [group]; }
    else if (size >= 0 && size === specificity) selected.push(group);
  }
  const url = new URL(target, 'https://example.test');
  const path = `${url.pathname}${url.search}`;
  const matching = selected.flatMap(group => group.rules).filter(rule => robotsPattern(rule.pattern).test(path));
  matching.sort((a, b) => b.pattern.replace(/[\*$]/g, '').length - a.pattern.replace(/[\*$]/g, '').length || Number(b.directive === 'allow') - Number(a.directive === 'allow'));
  return { allowed: matching[0]?.directive !== 'disallow', group: selected.flatMap(group => group.agents).join(', ') || '(no group)', matchedRule: matching[0] ?? null, rules: selected.flatMap(group => group.rules) };
}
export function parseSitemap(text) {
  const kind = /<(?:\w+:)?sitemapindex\b/i.test(text) ? 'index' : /<(?:\w+:)?urlset\b/i.test(text) ? 'urlset' : 'invalid';
  const tag = kind === 'index' ? 'sitemap' : 'url';
  const records = [...text.matchAll(new RegExp(`<(?:(?:\\w+):)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w+):)?${tag}>`, 'gi'))].map(match => {
    const loc = match[1].match(/<(?:\w+:)?loc\b[^>]*>([\s\S]*?)<\/(?:\w+:)?loc>/i)?.[1] ?? '';
    const lastmod = match[1].match(/<(?:\w+:)?lastmod\b[^>]*>([\s\S]*?)<\/(?:\w+:)?lastmod>/i)?.[1] ?? null;
    return { url: decodeEntities(loc.replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/, '$1').trim()), lastmod: lastmod && decodeEntities(lastmod.trim()) };
  });
  return { kind, records, urls: records.map(record => record.url).filter(Boolean) };
}
export function collectJsonSignals(value) {
  const types = new Set(); const dates = []; const sourceUrls = new Set(); let authorSignals = 0; let visited = 0;
  function visit(node, key = '', depth = 0) {
    if (++visited > 40000 || depth > 24 || node == null) return;
    if (typeof node === 'string') {
      if (/^(generatedAt|updatedAt|reviewedAt|publishedAt|timestamp|datePublished|dateModified|lastUpdated|lastmod)$/i.test(key) && /^\d{4}-\d{2}-\d{2}/.test(node)) dates.push({ field: key, value: node });
      if (/^(source|sources|citation|reference|references|sourceUrl)$/i.test(key) && /^https?:\/\//.test(node)) sourceUrls.add(node);
      return;
    }
    if (Array.isArray(node)) { node.forEach(item => visit(item, key, depth + 1)); return; }
    if (typeof node !== 'object') return;
    if (node['@type']) for (const type of [node['@type']].flat()) if (typeof type === 'string') types.add(type);
    if (node.author || node.creator) authorSignals++;
    if (/^(source|sources|citation|reference|references)$/i.test(key) && typeof node.url === 'string' && /^https?:\/\//.test(node.url)) sourceUrls.add(node.url);
    for (const [childKey, child] of Object.entries(node)) visit(child, childKey, depth + 1);
  }
  visit(value);
  return { types: [...types].sort(), dates: dates.slice(0, 12), dateCount: dates.length, sourceUrlCount: sourceUrls.size, authorSignals };
}
export function productSignals(value) {
  const products = []; let visited = 0;
  const pricePresent = value => ['number', 'string'].includes(typeof value) && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  function visit(node, depth = 0) {
    if (++visited > 40000 || depth > 24 || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(item => visit(item, depth + 1)); return; }
    if ([node['@type']].flat().includes('Product')) {
      const offers = [node.offers].flat().filter(item => item && typeof item === 'object').map(offer => ({ type: offer['@type'] ?? null, hasPrice: pricePresent(offer.price) || pricePresent(offer.priceSpecification?.price), hasLowPrice: pricePresent(offer.lowPrice), hasPriceCurrency: Boolean(offer.priceCurrency ?? offer.priceSpecification?.priceCurrency), hasAvailability: Boolean(offer.availability) }));
      products.push({ name: typeof node.name === 'string' ? node.name.slice(0, 120) : '', hasOffers: offers.length > 0, hasReview: Boolean(node.review), hasAggregateRating: Boolean(node.aggregateRating), offers });
    }
    Object.values(node).forEach(child => visit(child, depth + 1));
  }
  visit(value); return products;
}
export function inspectHtml(html, url) {
  const pageHead = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const titleTags = [...pageHead.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(match => normalizeSpace(decodeEntities(match[1].replace(/<[^>]+>/g, ''))));
  const meta = [...pageHead.matchAll(/<meta\b[^>]*>/gi)].map(match => attrs(match[0]));
  const links = [...pageHead.matchAll(/<link\b[^>]*>/gi)].map(match => attrs(match[0]));
  const descriptionTags = meta.filter(tag => tag.name?.toLowerCase() === 'description').map(tag => tag.content ?? '');
  const canonicalTags = links.filter(tag => tag.rel?.toLowerCase().split(/\s+/).includes('canonical')).map(tag => tag.href ?? '');
  const robotTags = meta.filter(tag => /^(robots|googlebot)$/i.test(tag.name ?? '')).map(tag => tag.content ?? '');
  const jsonLd = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match => attrs(`<script${match[1]}>`).type?.toLowerCase() === 'application/ld+json');
  const errors = []; const types = new Set(); const products = []; let authorSignals = 0; let dateCount = 0;
  jsonLd.forEach((match, index) => {
    try { const parsed = JSON.parse(match[2]); const signals = collectJsonSignals(parsed); signals.types.forEach(type => types.add(type)); authorSignals += signals.authorSignals; dateCount += signals.dateCount; products.push(...productSignals(parsed)); }
    catch { errors.push(`JSON-LD block ${index + 1} is not valid JSON`); }
  });
  let text = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  text = text.replace(/<!--([\s\S]*?)-->/g, '').replace(/<(script|style|template|svg|head)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  // A conservative markup approximation, not computed CSS visibility or JS rendering.
  text = text.replace(/<([\w-]+)\b[^>]*(?:\shidden(?:\s|=|>)|aria-hidden\s*=\s*["']true["'])[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  text = normalizeSpace(decodeEntities(text.replace(/<[^>]+>/g, ' ')));
  const internalLinks = []; let externalLinkCount = 0;
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attrs(match[0]).href; if (!href) continue;
    try { const link = new URL(href, url); if (!['http:', 'https:'].includes(link.protocol)) continue; link.hash = ''; if (link.origin === new URL(url).origin) internalLinks.push(link.href); else externalLinkCount++; } catch { /* invalid href counted separately only if needed */ }
  }
  return {
    title: titleTags[0] ?? '', titleCount: titleTags.length, description: descriptionTags[0] ?? '', descriptionCount: descriptionTags.length,
    canonical: canonicalTags[0] ?? '', canonicalCount: canonicalTags.length,
    noindex: robotTags.some(value => /(?:^|[,\s])noindex(?:$|[,\s])/i.test(value)), robots: robotTags,
    lang: attrs(html.match(/<html\b[^>]*>/i)?.[0] ?? '<html>').lang ?? '', h1Count: [...html.matchAll(/<h1\b[^>]*>/gi)].length,
    jsonLdCount: jsonLd.length, jsonLdTypes: [...types].sort(), jsonLdErrors: errors, authorSignals, structuredDateCount: dateCount, productCount: products.length, products,
    textWordCount: text.split(/\s+/).filter(Boolean).length, serverTextExcerpt: text.slice(0, 240),
    internalLinks: [...new Set(internalLinks)], internalLinkCount: new Set(internalLinks).size, externalLinkCount,
    ogImage: meta.find(tag => tag.property?.toLowerCase() === 'og:image')?.content ?? '',
    ogTitle: meta.find(tag => tag.property?.toLowerCase() === 'og:title')?.content ?? '',
  };
}
export function classifyHttp({ httpStatus, error, expected = [], redirects = [] }) {
  if (error || !httpStatus) return 'unmeasured';
  if (expected.includes(httpStatus)) return 'expected';
  if (expected.length && httpStatus >= 200 && httpStatus < 300) return 'warn';
  if (httpStatus >= 200 && httpStatus < 300) return 'pass';
  if (httpStatus >= 300 && httpStatus < 400) return 'warn';
  return 'fail';
}
export function representativeSample(values, limit) {
  const sorted = [...new Set(values)].sort();
  if (sorted.length <= limit) return sorted;
  if (limit <= 0) return [];
  if (limit === 1) return [sorted[0]];
  return Array.from({ length: limit }, (_, index) => sorted[Math.floor(index * (sorted.length - 1) / (limit - 1))]);
}
export function validateSnapshot(snapshot) {
  const failures = [];
  for (const field of ['schemaVersion', 'startedAt', 'completedAt', 'site', 'coverage', 'routes', 'findings', 'botChecks', 'limitations']) if (!(field in snapshot)) failures.push(`Missing ${field}`);
  for (const collection of ['routes', 'findings', 'botChecks']) for (const entry of snapshot[collection] ?? []) {
    if (!STATUS.includes(entry.status)) failures.push(`${collection}: invalid status ${entry.status}`);
    if (collection !== 'botChecks' && !['seo', 'agents', 'bots', 'geo'].includes(entry.category)) failures.push(`${collection}: invalid category`);
  }
  for (const item of snapshot.coverage ?? []) if (!(Number.isInteger(item.checked) && item.checked >= 0 && (item.total === null || Number.isInteger(item.total) && item.total >= item.checked))) failures.push(`Invalid coverage denominator: ${item.id}`);
  const ids = (snapshot.findings ?? []).map(item => item.id);
  if (new Set(ids).size !== ids.length) failures.push('Duplicate finding ids');
  return failures;
}
