import { createHash } from 'node:crypto';

const ORIGINS = {
  cc0: 'https://pointcast.xyz',
  shop: 'https://www.lego.com',
  loom: 'https://pointcast.xyz',
  github: 'https://github.com',
  chess: 'https://pointcast.xyz',
};

function check(condition, message) {
  if (!condition) throw new TypeError(message);
}

// Canonical JSON for this fixed schema. Object keys sort by code unit;
// line order is intentional (it is the printed order).
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(
      key => JSON.stringify(key) + ':' + canonical(value[key]),
    ).join(',') + '}';
  }
  return JSON.stringify(value);
}

function dateTime(value) {
  check(typeof value === 'string', 'verifiedAt must be a UTC ISO timestamp');
  const date = new Date(value);
  check(Number.isFinite(date.valueOf()) && date.toISOString() === value,
    'verifiedAt must be a UTC ISO timestamp with milliseconds');
  return value;
}

function exactSource(raw, kind) {
  let url;
  try {
    check(typeof raw === 'string', 'missing URL');
    url = new URL(raw);
  } catch {
    throw new TypeError('Each line needs a valid sourceUrl');
  }
  check(raw === url.href && !url.username && !url.password && url.origin === ORIGINS[kind],
    'Invalid sourceUrl for receipt kind');
  let exact = false;
  if (kind === 'shop') exact = /^\/en-us\/product\/[a-z0-9-]+$/.test(url.pathname) && !url.search && !url.hash;
  if (kind === 'cc0') exact = url.pathname === '/nouns-money/coin-and-note/' && !url.search && !url.hash;
  if (kind === 'github') exact = /^\/mhoydich\/pointcast\/pull\/[1-9]\d*$/.test(url.pathname) && !url.search && !url.hash;
  if (kind === 'loom' || kind === 'chess') {
    const to = url.searchParams.get('to') ?? '';
    exact = url.pathname === '/loom' && [...url.searchParams.keys()].length === 1 &&
      /^loom:[a-f0-9]{23,24}#m_[a-z0-9]+$/.test(to) && !url.hash;
  }
  check(exact, 'sourceUrl must identify the exact source');
  return url.href;
}

function label(value, field, max) {
  check(typeof value === 'string' && value.trim() === value && value.length > 0 &&
    value.length <= max && !/[\u0000-\u001f\u007f]/.test(value), 'Invalid ' + field);
  return value;
}

export function encodeBarcode(digest) {
  check(typeof digest === 'string' && /^[0-9a-f]{64}$/.test(digest), 'Expected lowercase SHA-256 hex');
  return [...digest].map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('');
}

export function decodeBarcode(bits) {
  check(typeof bits === 'string' && /^[01]{256}$/.test(bits), 'Expected 256 barcode bits');
  return bits.match(/.{4}/g).map(nibble => parseInt(nibble, 2).toString(16)).join('');
}

// The caller supplies reviewed evidence. A correctly shaped link is not
// proof of its contents; the route never accepts visitor-supplied rows.
export function composeFridayTape({ version, date, station, items }) {
  check(version === 1, 'Unsupported receipt version');
  check(typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date), 'Invalid date');
  dateTime(date + 'T00:00:00.000Z');
  label(station, 'station', 80);
  check(Array.isArray(items) && items.length > 0 && items.length <= 32,
    'Expected 1 to 32 receipt lines');

  const lines = Array.from(items, line => {
    check(line && typeof line === 'object', 'Invalid receipt line');
    const { qty, label: name, price, currency, kind, sourceUrl, verifiedAt } = line;
    check(typeof kind === 'string' && Object.hasOwn(ORIGINS, kind), 'Unknown receipt kind');
    check(Number.isSafeInteger(qty) && qty > 0, 'Invalid qty');
    label(name, 'label', 160);
    check(currency === 'USD', 'Expected USD');
    check(typeof price === 'string' && (kind === 'shop'
      ? /^(?:0|[1-9]\d{0,7})\.\d{2}$/.test(price) : price === '0.00'),
    'Only shop lines may carry a nonzero price');
    return { qty, label: name, price, currency, kind,
      sourceUrl: exactSource(sourceUrl, kind), verifiedAt: dateTime(verifiedAt) };
  });

  const receipt = { version, date, station, items: lines, subtotalCC0: '0.00',
    realShopLinks: [...new Set(lines.filter(line => line.kind === 'shop').map(line => line.sourceUrl))] };
  const dayDigestSha256 = createHash('sha256').update(canonical(receipt), 'utf8').digest('hex');
  return { ...receipt, dayDigestSha256, barcodeBits: encodeBarcode(dayDigestSha256) };
}
