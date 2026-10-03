import { SaxesParser } from 'saxes';
import { parseFragment } from 'parse5';

export const LIMITS = Object.freeze({ bytes: 2 * 1024 * 1024, items: 1000, depth: 32, rawField: 4096, title: 512, author: 256, id: 18, timeoutMs: 15000 });
const publicMessages = Object.freeze({ SOURCE_NOT_ALLOWED: 'The private source must be an HTTPS Goodreads all-shelf RSS URL.', LIMIT_BYTES: 'The feed exceeded the 2 MiB limit.', LIMIT_RECORDS: 'The feed exceeded the record limit.', LIMIT_DEPTH: 'The feed exceeded the XML depth limit.', LIMIT_FIELD: 'A book field exceeded the length limit.', DTD_FORBIDDEN: 'DTD and entity declarations are not accepted.', XML_INVALID: 'The feed was not valid supported RSS XML.', RECORD_INVALID: 'A book record did not have a valid ID, title, and author.', SNAPSHOT_INVALID: 'The previous snapshot did not have the expected public record shape.', DATE_INVALID: 'The check date must be a valid YYYY-MM-DD date.', REDIRECT_REJECTED: 'The feed redirected; the refresh was stopped.', HTTP_ERROR: 'The source did not return a successful RSS response.', CONTENT_TYPE: 'The source did not return an XML feed.', TIMEOUT: 'The source did not finish within 15 seconds.', FETCH_ERROR: 'The feed could not be fetched.', INPUT_ERROR: 'The private input could not be read.', OUTPUT_ERROR: 'The draft output could not be written.' });
export class FeedImportError extends Error {
  constructor(code) { super(publicMessages[code] || publicMessages.FETCH_ERROR); this.name = 'FeedImportError'; this.code = code; }
}
const fail = (code) => { throw new FeedImportError(code); };
export function safeError(error, fallback = 'FETCH_ERROR') {
  const code = error instanceof FeedImportError && Object.hasOwn(publicMessages, error.code) ? error.code : fallback;
  return { code, message: publicMessages[code] || publicMessages.FETCH_ERROR };
}
export function validateCheckDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('DATE_INVALID');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) fail('DATE_INVALID');
  return value;
}

/** Only this Goodreads RSS endpoint is fetched. The private URL is never returned in public output. */
export function validateSourceUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || value !== value.trim() || /[\u0000-\u0020\u007f\\]/.test(value)) fail('SOURCE_NOT_ALLOWED');
  let url;
  try { url = new URL(value); } catch { fail('SOURCE_NOT_ALLOWED'); }
  if (url.protocol !== 'https:' || !['www.goodreads.com', 'goodreads.com'].includes(url.hostname) || url.username || url.password || url.port || url.hash || !/^\/review\/list_rss\/[1-9]\d{0,17}$/.test(url.pathname)) fail('SOURCE_NOT_ALLOWED');
  const params = [...url.searchParams];
  const allowed = new Set(['shelf', 'per_page', 'page', 'sort', 'order']);
  if (params.some(([key]) => !allowed.has(key)) || new Set(params.map(([key]) => key)).size !== params.length || !['all', '#all#'].includes(url.searchParams.get('shelf')?.toLowerCase())) fail('SOURCE_NOT_ALLOWED');
  const constraints = { per_page: /^(?:[1-9]\d{0,2}|1000)$/, page: /^(?:[1-9]\d{0,2}|1000)$/, sort: /^(?:title|author|date_added|date_read|date_updated|rating|avg_rating|num_ratings|num_pages|position)$/, order: /^(?:a|d)$/ };
  for (const [key, value] of params) if (key !== 'shelf' && !constraints[key]?.test(value)) fail('SOURCE_NOT_ALLOWED');
  return url;
}

/** Inert HTML parsing: attributes, script/style bodies, and nontext nodes are never emitted. */
export function plainBookText(value, maxLength) {
  if (typeof value !== 'string') fail('RECORD_INVALID');
  if (value.length > LIMITS.rawField) fail('LIMIT_FIELD');
  const fragment = parseFragment(value);
  const excluded = new Set(['script', 'style', 'template', 'noscript', 'iframe', 'object', 'embed', 'svg', 'math']);
  const block = new Set(['p', 'div', 'br', 'li', 'ul', 'ol', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'hr']);
  const collect = (node, depth = 0) => {
    if (depth > LIMITS.depth) fail('LIMIT_DEPTH');
    if (excluded.has(node.tagName)) return '';
    if (node.nodeName === '#text') return node.value;
    const text = (node.childNodes || []).map((child) => collect(child, depth + 1)).join('');
    return block.has(node.tagName) ? ` ${text} ` : text;
  };
  const text = collect(fragment).normalize('NFC').replace(/[\u202a-\u202e\u2066-\u2069]/g, '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/gu, ' ').trim();
  if (!text || text.length > maxLength) fail(text.length > maxLength ? 'LIMIT_FIELD' : 'RECORD_INVALID');
  return text;
}
const canonicalBookUrl = (id) => `https://www.goodreads.com/book/show/${id}`;
const validateId = (id) => {
  if (typeof id !== 'string' || !new RegExp(`^[1-9]\\d{0,${LIMITS.id - 1}}$`).test(id)) fail('RECORD_INVALID');
  return id;
};
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const exactCompare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export const compareRecords = (a, b) => collator.compare(a.title, b.title) || collator.compare(a.author, b.author) || exactCompare(a.title, b.title) || exactCompare(a.author, b.author) || exactCompare(a.id, b.id);
const duplicateKey = (record) => `${record.title}\u0000${record.author}`;
const uniqueSorted = (records) => {
  const byId = new Map();
  for (const record of records) {
    const old = byId.get(record.id);
    if (!old || exactCompare(duplicateKey(record), duplicateKey(old)) < 0) byId.set(record.id, record);
  }
  return [...byId.values()].sort(compareRecords);
};

/** Parse only direct item book_id, title, and author_name fields; ignore every other RSS field. */
export function parseGoodreadsRss(input) {
  const bytes = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  if (!(bytes instanceof Uint8Array)) fail('XML_INVALID');
  if (bytes.byteLength > LIMITS.bytes) fail('LIMIT_BYTES');
  let xml;
  try { xml = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { fail('XML_INVALID'); }
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/iu.test(xml)) fail('DTD_FORBIDDEN');
  const parser = new SaxesParser({ xmlns: false });
  const stack = [];
  const records = [];
  const fields = new Set(['book_id', 'title', 'author_name']);
  let item = null;
  let captured = null;
  let itemCount = 0;
  let channelCount = 0;
  let rootSeen = false;
  const append = (value) => {
    if (!captured) return;
    captured.text += value;
    if (captured.text.length > LIMITS.rawField) fail('LIMIT_FIELD');
  };
  parser.on('doctype', () => fail('DTD_FORBIDDEN'));
  parser.on('error', () => fail('XML_INVALID'));
  parser.on('opentag', (node) => {
    stack.push(node.name);
    if (stack.length > LIMITS.depth) fail('LIMIT_DEPTH');
    if (stack.length === 1) { if (node.name !== 'rss' || rootSeen) fail('XML_INVALID'); rootSeen = true; }
    if (stack.join('/') === 'rss/channel') channelCount += 1;
    if (stack.join('/') === 'rss/channel/item') { itemCount += 1; if (itemCount > LIMITS.items) fail('LIMIT_RECORDS'); item = {}; }
    else if (item && stack.length === 4 && fields.has(node.name)) {
      if (Object.hasOwn(item, node.name)) fail('RECORD_INVALID');
      captured = { name: node.name, text: '' };
    } else if (captured && stack.length > 4) append(`<${node.name}>`);
  });
  parser.on('text', append);
  parser.on('cdata', append);
  parser.on('closetag', (node) => {
    if (captured && stack.length > 4) append(`</${node.name}>`);
    if (captured && stack.length === 4 && node.name === captured.name) { item[captured.name] = captured.text; captured = null; }
    if (stack.join('/') === 'rss/channel/item') {
      if (!item || typeof item.book_id !== 'string') fail('RECORD_INVALID');
      const id = validateId(item.book_id.trim());
      const title = plainBookText(item.title, LIMITS.title);
      const author = plainBookText(item.author_name, LIMITS.author);
      records.push({ id, title, author, bookUrl: canonicalBookUrl(id) });
      item = null;
    }
    stack.pop();
  });
  try { parser.write(xml).close(); } catch (error) { if (error instanceof FeedImportError) throw error; fail('XML_INVALID'); }
  if (!rootSeen || channelCount !== 1 || !itemCount || stack.length) fail('XML_INVALID');
  return uniqueSorted(records);
}

export function createSnapshot(records, checkedAt, reviewed = false) {
  validateCheckDate(checkedAt);
  const clean = sanitizeRecords(records);
  return { provider: 'Goodreads', checkedAt, status: reviewed ? 'manually-reviewed-snapshot' : 'draft-pending-review', scope: reviewed ? 'Manually reviewed RSS snapshot; not a complete account scan.' : 'Manually imported RSS draft; review required; not a complete account scan.', recordCount: clean.length, records: clean };
}
function sanitizeRecords(records) {
  if (!Array.isArray(records) || !records.length || records.length > LIMITS.items) fail('SNAPSHOT_INVALID');
  const result = records.map((record) => {
    if (!record || typeof record !== 'object') fail('SNAPSHOT_INVALID');
    const id = validateId(record.id);
    const title = plainBookText(record.title, LIMITS.title);
    const author = plainBookText(record.author, LIMITS.author);
    return { id, title, author, bookUrl: canonicalBookUrl(id) };
  });
  return uniqueSorted(result);
}
export function sanitizeSnapshot(snapshot) {
  if (!snapshot || snapshot.provider !== 'Goodreads' || !['manually-reviewed-snapshot', 'draft-pending-review'].includes(snapshot.status)) fail('SNAPSHOT_INVALID');
  return createSnapshot(snapshot.records, snapshot.checkedAt, snapshot.status === 'manually-reviewed-snapshot');
}
export function diffSnapshots(previous, current) {
  const before = previous ? sanitizeSnapshot(previous) : null;
  const after = sanitizeSnapshot(current);
  const oldRecords = new Map((before?.records || []).map((record) => [record.id, record]));
  const newRecords = new Map(after.records.map((record) => [record.id, record]));
  const added = after.records.filter((record) => !oldRecords.has(record.id));
  const removed = (before?.records || []).filter((record) => !newRecords.has(record.id));
  const changed = after.records.filter((record) => oldRecords.has(record.id) && (oldRecords.get(record.id).title !== record.title || oldRecords.get(record.id).author !== record.author)).map((record) => ({ id: record.id, before: oldRecords.get(record.id), after: record }));
  return { provider: 'Goodreads', checkedAt: after.checkedAt, comparedAgainst: before?.checkedAt || null, counts: { added: added.length, removed: removed.length, changed: changed.length }, added, removed, changed };
}

/** No redirects, credentials, arbitrary hosts, or raw error/body logging. Timeout covers the entire body. */
export async function fetchGoodreadsRss(privateSourceUrl, { fetchImpl = globalThis.fetch, timeoutMs = LIMITS.timeoutMs } = {}) {
  const url = validateSourceUrl(privateSourceUrl);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > LIMITS.timeoutMs) fail('TIMEOUT');
  const controller = new AbortController();
  let reader;
  let expire;
  const deadline = new Promise((resolve, reject) => { expire = reject; });
  const timer = setTimeout(() => { controller.abort(); expire(new FeedImportError('TIMEOUT')); }, timeoutMs);
  try {
    const response = await Promise.race([fetchImpl(url.href, { redirect: 'manual', credentials: 'omit', signal: controller.signal, headers: { Accept: 'application/rss+xml, application/xml, text/xml' } }), deadline]);
    if (response.status >= 300 && response.status < 400 || response.redirected || response.url && response.url !== url.href) fail('REDIRECT_REJECTED');
    if (!response.ok) fail('HTTP_ERROR');
    if (!/^(?:application\/(?:rss\+xml|xml)|text\/xml)(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) fail('CONTENT_TYPE');
    const declaredLength = response.headers.get('content-length');
    if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > LIMITS.bytes)) fail('LIMIT_BYTES');
    if (!response.body) fail('XML_INVALID');
    reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      if (controller.signal.aborted) fail('TIMEOUT');
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > LIMITS.bytes) fail('LIMIT_BYTES');
      chunks.push(value);
    }
    if (controller.signal.aborted) fail('TIMEOUT');
    return Buffer.concat(chunks, size);
  } catch (error) {
    if (error instanceof FeedImportError) throw error;
    fail(controller.signal.aborted ? 'TIMEOUT' : 'FETCH_ERROR');
  } finally {
    clearTimeout(timer);
    if (reader) { try { void reader.cancel().catch(() => {}); } catch {} try { reader.releaseLock(); } catch {} }
  }
}

/** Refresh returns a draft and a deterministic public-only diff; failure keeps the previous snapshot. */
export async function refreshReadingFeed({ privateSourceUrl, input, previous = null, checkedAt, fetchImpl, timeoutMs }) {
  let safePrevious = null;
  try {
    validateCheckDate(checkedAt);
    if (previous) safePrevious = sanitizeSnapshot(previous);
    const xml = input !== undefined ? input : await fetchGoodreadsRss(privateSourceUrl, { fetchImpl, timeoutMs });
    const snapshot = createSnapshot(parseGoodreadsRss(xml), checkedAt, false);
    return { status: 'draft-ready', checkedAt, snapshot, diff: diffSnapshots(safePrevious, snapshot), error: null };
  } catch (error) {
    return { status: safePrevious ? 'stale' : 'error', checkedAt: /^\d{4}-\d{2}-\d{2}$/.test(checkedAt || '') ? checkedAt : null, lastSuccessfulCheck: safePrevious?.checkedAt || null, snapshot: safePrevious, diff: null, error: safeError(error) };
  }
}
