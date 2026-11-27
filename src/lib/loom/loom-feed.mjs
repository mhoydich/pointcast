/**
 * Open-web feeds for one Loom log.
 *
 * Pure serializers plus the read-only GET behind /api/loom/feed. Subscribers
 * (RSS readers, Atom readers, JSON Feed clients, outside bots) ask for a
 * #topic, an @handle, or any other Loom address and get a standards feed.
 * Nothing here writes: no kv.put, no append, no index update. A missing
 * binding or a missing log is an empty, valid feed.
 *
 * Message shape matches the Loom log: `loom:log:<addressKey>` holds the append
 * ops, folded so edits apply and hidden posts drop out.
 */
import { AddressError, SITE, addressKey, parseAddress } from './address.mjs';
import { fold } from './fold.mjs';

export const FEED_FORMATS = Object.freeze(['rss', 'atom', 'json']);
export const DEFAULT_ADDRESS = '#loom';
export const DEFAULT_FORMAT = 'rss';
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;
export const TITLE_MAX = 120;
export const CACHE_CONTROL = 'public, max-age=60, must-revalidate';
/** Stable stamp when a log has never been written, so an empty feed does not change between requests. */
export const EMPTY_STAMP = '1970-01-01T00:00:00.000Z';

const TYPES = {
  rss: 'application/rss+xml; charset=utf-8',
  atom: 'application/atom+xml; charset=utf-8',
  json: 'application/feed+json; charset=utf-8',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'If-None-Match',
  'Access-Control-Expose-Headers': 'ETag',
  'X-Content-Type-Options': 'nosniff',
};

/**
 * Drop characters XML 1.0 forbids (control chars other than tab, LF and CR,
 * lone surrogates, U+FFFE, U+FFFF). Valid pairs such as emoji stay. Untrusted
 * Loom posts must not be able to break the document.
 */
export function stripIllegalXml(value) {
  const s = String(value ?? '');
  let out = '';
  for (let i = 0; i < s.length; i += 1) {
    const code = s.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = s.charCodeAt(i + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        out += s[i] + s[i + 1];
        i += 1;
      }
      continue;
    }
    if (code >= 0xDC00 && code <= 0xDFFF) continue;
    const legal = code === 0x9 || code === 0xA || code === 0xD
      || (code >= 0x20 && code <= 0xD7FF)
      || (code >= 0xE000 && code <= 0xFFFD);
    if (legal) out += s[i];
  }
  return out;
}

/** Escape text for an XML element or attribute. Strips illegal characters first, then escapes. */
export function escapeXml(value) {
  return stripIllegalXml(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[c]));
}

const cleanLine = (value) => stripIllegalXml(value).replace(/\s+/g, ' ').trim();

function entryTitle(message) {
  const source = stripIllegalXml(message?.body ?? '') || stripIllegalXml(message?.media?.alt ?? '');
  const line = source.split('\n').map((part) => part.trim()).find(Boolean) ?? '';
  const collapsed = line.replace(/\s+/g, ' ').trim();
  if (!collapsed) return 'Untitled';
  if (collapsed.length <= TITLE_MAX) return collapsed;
  return `${collapsed.slice(0, TITLE_MAX - 1)}…`;
}

function authorName(from) {
  const name = cleanLine(from?.name) || 'anonymous';
  const operator = cleanLine(from?.operator);
  return operator ? `${name} (operator: ${operator})` : name;
}

function categoriesOf(message) {
  const out = [];
  const kind = cleanLine(message?.kind);
  if (kind) out.push(kind);
  for (const tag of message?.tags ?? []) {
    const clean = cleanLine(tag);
    if (clean && !out.includes(clean)) out.push(clean);
  }
  return out;
}

function contentText(message) {
  const parts = [];
  const body = stripIllegalXml(message?.body ?? '').replace(/\r\n?/g, '\n').trim();
  if (body) parts.push(body);
  if (message?.media?.url) {
    const url = stripIllegalXml(message.media.url).trim();
    const alt = cleanLine(message.media.alt);
    if (url) parts.push(`[image] ${url}${alt ? ` — ${alt}` : ''}`);
  }
  return parts.join('\n\n');
}

function stamp(value) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString();
}

function pageUrl(address) {
  return `${SITE}/loom?to=${encodeURIComponent(address)}`;
}

function permalink(address, id) {
  return `${pageUrl(address)}#${id}`;
}

function entryId(key, id) {
  return `loom:${key}#${id}`;
}

function feedSelfUrl(address, format, limit) {
  const params = new URLSearchParams();
  params.set('to', address);
  params.set('format', format);
  if (limit !== DEFAULT_LIMIT) params.set('limit', String(limit));
  return `${SITE}/api/loom/feed?${params.toString()}`;
}

function prepareItem(log, message) {
  const id = String(message?.id ?? '');
  const parent = message?.parent ? String(message.parent) : '';
  const published = stamp(message?.at);
  const modified = stamp(message?.editedAt);
  const authorAddress = stripIllegalXml(message?.from?.address ?? '');
  return {
    id: entryId(log.key, id),
    url: permalink(log.address, id),
    title: entryTitle(message),
    author: authorName(message?.from),
    authorUrl: /^https?:\/\//i.test(authorAddress) ? authorAddress : '',
    categories: categoriesOf(message),
    published,
    modified: modified && modified !== published ? modified : null,
    content: contentText(message),
    parentId: parent ? entryId(log.key, parent) : '',
    parentUrl: parent ? permalink(log.address, parent) : '',
  };
}

function channel(log) {
  const address = String(log?.address || DEFAULT_ADDRESS);
  const key = String(log?.key || '');
  const label = cleanLine(log?.title) || cleanLine(log?.label) || address;
  return {
    address,
    key,
    title: label.endsWith('the Loom') ? label : `${label} · the Loom`,
    description: `Everything appended to ${address} on the PointCast Loom.`,
    page: pageUrl(address),
    updated: stamp(log?.updatedAt) || EMPTY_STAMP,
    seq: Number.isFinite(Number(log?.seq)) ? Number(log.seq) : 0,
  };
}

function itemsOf(log, messages) {
  const view = channel(log);
  const items = (Array.isArray(messages) ? messages : []).filter((m) => m && m.id).map((m) => prepareItem(view, m));
  return { view, items };
}

/**
 * Deterministic validator for one rendered feed.
 * Strong by default (`"key|seq|updatedAt|format"`). Pass `{ weak: true }` for the weak form.
 * If-None-Match is compared weakly: `W/"…"` and `"…"` name the same representation.
 */
export function loomFeedEtag(log, format = DEFAULT_FORMAT, { weak = false } = {}) {
  const view = channel(log);
  const updatedAt = stamp(log?.updatedAt) || '';
  const opaque = `${view.key}|${view.seq}|${updatedAt}|${format}`;
  const quoted = `"${opaque.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return weak ? `W/${quoted}` : quoted;
}

export function loomFeedEtagMatches(header, etag) {
  if (!header || !etag) return false;
  const opaque = (value) => value.trim().replace(/^W\//i, '');
  const want = opaque(etag);
  return String(header).split(',').some((part) => {
    const token = part.trim();
    return token === '*' || opaque(token) === want;
  });
}

/** RSS 2.0. Names live in dc:creator because the RSS author element must be an email. */
export function buildLoomRss(log, messages = [], { limit = DEFAULT_LIMIT } = {}) {
  const { view, items } = itemsOf(log, messages);
  const self = feedSelfUrl(view.address, 'rss', limit);
  const rows = items.map((item) => ['    <item>',
    `      <title>${escapeXml(item.title)}</title>`,
    `      <link>${escapeXml(item.url)}</link>`,
    `      <guid isPermaLink="false">${escapeXml(item.id)}</guid>`,
    item.published ? `      <pubDate>${escapeXml(new Date(item.published).toUTCString())}</pubDate>` : '',
    `      <dc:creator>${escapeXml(item.author)}</dc:creator>`,
    ...item.categories.map((term) => `      <category>${escapeXml(term)}</category>`),
    `      <description>${escapeXml(item.content)}</description>`,
    item.parentId ? `      <thr:in-reply-to ref="${escapeXml(item.parentId)}" href="${escapeXml(item.parentUrl)}"/>` : '',
    '    </item>'].filter(Boolean).join('\n')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:thr="http://purl.org/syndication/thread/1.0">
  <channel>
    <title>${escapeXml(view.title)}</title>
    <link>${escapeXml(view.page)}</link>
    <description>${escapeXml(view.description)}</description>
    <language>en-US</language>
    <lastBuildDate>${escapeXml(new Date(view.updated).toUTCString())}</lastBuildDate>
    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml"/>
    <generator>PointCast Loom</generator>
${rows}
  </channel>
</rss>
`;
}

/** Atom 1.0. Entry ids are the stable Loom addresses `loom:<key>#<id>`. */
export function buildLoomAtom(log, messages = [], { limit = DEFAULT_LIMIT } = {}) {
  const { view, items } = itemsOf(log, messages);
  const self = feedSelfUrl(view.address, 'atom', limit);
  const rows = items.map((item) => ['  <entry>',
    `    <id>${escapeXml(item.id)}</id>`,
    `    <title type="text">${escapeXml(item.title)}</title>`,
    `    <link rel="alternate" type="text/html" href="${escapeXml(item.url)}"/>`,
    `    <updated>${escapeXml(item.modified || item.published || view.updated)}</updated>`,
    item.published ? `    <published>${escapeXml(item.published)}</published>` : '',
    '    <author>',
    `      <name>${escapeXml(item.author)}</name>`,
    item.authorUrl ? `      <uri>${escapeXml(item.authorUrl)}</uri>` : '',
    '    </author>',
    ...item.categories.map((term) => `    <category term="${escapeXml(term)}"/>`),
    `    <content type="text">${escapeXml(item.content)}</content>`,
    item.parentId ? `    <thr:in-reply-to ref="${escapeXml(item.parentId)}" href="${escapeXml(item.parentUrl)}"/>` : '',
    '  </entry>'].filter(Boolean).join('\n')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:thr="http://purl.org/syndication/thread/1.0">
  <id>${escapeXml(self)}</id>
  <title>${escapeXml(view.title)}</title>
  <subtitle>${escapeXml(view.description)}</subtitle>
  <updated>${escapeXml(view.updated)}</updated>
  <link rel="alternate" type="text/html" href="${escapeXml(view.page)}"/>
  <link rel="self" type="application/atom+xml" href="${escapeXml(self)}"/>
  <generator uri="https://pointcast.xyz/loom">PointCast Loom</generator>
  <author><name>PointCast Loom</name></author>
${rows}
</feed>
`;
}

/** JSON Feed 1.1. Extra Loom fields live under `_loom` and never replace the standard item. */
export function buildLoomJsonFeed(log, messages = [], { limit = DEFAULT_LIMIT } = {}) {
  const { view, items } = itemsOf(log, messages);
  const payload = {
    version: 'https://jsonfeed.org/version/1.1',
    title: view.title,
    description: view.description,
    home_page_url: view.page,
    feed_url: feedSelfUrl(view.address, 'json', limit),
    language: 'en-US',
    authors: [{ name: 'PointCast Loom', url: `${SITE}/loom` }],
    items: items.map((item) => {
      const row = {
        id: item.id,
        url: item.url,
        title: item.title,
        content_text: item.content,
        authors: [{ name: item.author, ...(item.authorUrl ? { url: item.authorUrl } : {}) }],
        tags: item.categories,
      };
      if (item.published) row.date_published = item.published;
      if (item.modified) row.date_modified = item.modified;
      if (item.parentId) row._loom = { in_reply_to: item.parentId, in_reply_to_url: item.parentUrl };
      return row;
    }),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

const BUILDERS = { rss: buildLoomRss, atom: buildLoomAtom, json: buildLoomJsonFeed };

function fail(error, status, extra = {}) {
  return new Response(JSON.stringify({ ok: false, error, ...extra }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function parseLimit(url) {
  if (!url.searchParams.has('limit')) return DEFAULT_LIMIT;
  const raw = url.searchParams.get('limit');
  if (raw == null || raw === '') return DEFAULT_LIMIT;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 1) return null;
  return Math.min(n, MAX_LIMIT);
}

/** One KV read. Any failure, including an unbound namespace, is "no log". Never writes. */
async function readStoredLog(kv, key) {
  if (!kv || typeof kv.get !== 'function') return null;
  try {
    const raw = await kv.get(`loom:log:${key}`);
    if (raw == null || raw === '') return null;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function describeAddress(parsed) {
  if (parsed.kind === 'reply') {
    return { address: parsed.address, key: parsed.logKey, kind: 'reply', label: parsed.label };
  }
  return { address: parsed.address, kind: parsed.kind, label: parsed.label };
}

async function resolveLog(kv, parsed) {
  const described = describeAddress(parsed);
  const key = described.key || await addressKey(described.address);
  const stored = await readStoredLog(kv, key);
  if (!stored) {
    return { address: described.address, key, kind: described.kind, label: described.label, title: null, createdAt: null, updatedAt: null, seq: 0, ops: [] };
  }
  const ops = Array.isArray(stored.ops) ? stored.ops : [];
  return {
    address: typeof stored.address === 'string' && stored.address ? stored.address : described.address,
    key: /^[0-9a-f]{24}$/.test(stored.key) ? stored.key : key,
    kind: stored.kind || described.kind,
    label: stored.label || described.label,
    title: stored.title ?? null,
    createdAt: stored.createdAt ?? null,
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : null,
    seq: Number.isFinite(Number(stored.seq)) ? Number(stored.seq) : ops.length,
    ops,
  };
}

function newestMessages(log, limit) {
  return fold(log.ops).messages
    .slice()
    .sort((a, b) => (b.seq ?? 0) - (a.seq ?? 0) || String(b.at ?? '').localeCompare(String(a.at ?? '')))
    .slice(0, limit);
}

/**
 * GET /api/loom/feed?to=<address>&format=rss|atom|json&limit=<n>
 * Defaults: to=#loom, format=rss, limit=50 (max 100).
 */
export async function handleLoomFeed(request, { kv = null } = {}) {
  const method = request.method;
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400', Allow: 'GET, HEAD, OPTIONS' } });
  }
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Allow: 'GET, HEAD, OPTIONS' },
    });
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get('format') || DEFAULT_FORMAT).toLowerCase();
  if (!FEED_FORMATS.includes(format)) return fail('format_invalid', 400, { formats: [...FEED_FORMATS] });
  const limit = parseLimit(url);
  if (limit == null) return fail('limit_invalid', 400, { limit: `1-${MAX_LIMIT}`, max: MAX_LIMIT });

  let parsed;
  try {
    parsed = parseAddress(url.searchParams.has('to') ? url.searchParams.get('to') : DEFAULT_ADDRESS);
  } catch (error) {
    if (error instanceof AddressError) return fail(error.message, 400);
    throw error;
  }

  const log = await resolveLog(kv, parsed);
  const body = BUILDERS[format](log, newestMessages(log, limit), { limit });
  const etag = loomFeedEtag(log, format);
  const status = loomFeedEtagMatches(request.headers.get('If-None-Match'), etag) ? 304 : 200;
  return new Response(status === 304 || method === 'HEAD' ? null : body, {
    status,
    headers: { ...CORS, 'Content-Type': TYPES[format], 'Cache-Control': CACHE_CONTROL, ETag: etag },
  });
}
