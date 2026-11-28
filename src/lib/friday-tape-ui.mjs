// /friday-tape — pure helpers for Duet's thermal-paper receipt.
// No DOM, no network, no storage: the page script and the tests both use this.
// Reads Shwa's RECEIPTLINE v1 shape (#friday-tape on the Loom, Nov 27 2026):
//   { version: 1, date, station, items: [{ qty, label, price, currency, kind, sourceUrl, verifiedAt }],
//     subtotalCC0, realShopLinks, dayDigestSha256, barcodeBits }
// Optional per-line extra the receipt prints when present: badge (display only, not in the fingerprint).
// Fingerprint: SHA-256 of the canonical JSON envelope, the same rule as Shwa's composer, so the
// receipt only prints a feed whose dayDigestSha256 and barcodeBits it can recompute.

export const KINDS = ['cc0', 'shop', 'loom', 'github', 'chess', 'yours'];
export const STORE_TZ = 'America/Los_Angeles';

const clean = (v, max = 80) =>
  String(v ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();

// Feed values are validated, never rewritten: what the receipt prints is exactly what was hashed.
const isText = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max && v.trim() === v && !/[\u0000-\u001f\u007f]/.test(v);
const isIso = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !Number.isNaN(Date.parse(v));
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));
const isMoney = (v) => typeof v === 'string' && /^(?:0|[1-9]\d{0,7})\.\d{2}$/.test(v);
const isHex64 = (v) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

function exactHttps(v) {
  if (typeof v !== 'string') return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && u.href === v && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** One ReceiptLine, or null when it can't be printed honestly (no source, no date, bad price). */
export function normalizeLine(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const { qty, label, price, kind, sourceUrl, verifiedAt } = raw;
  const currency = raw.currency == null ? 'USD' : raw.currency;
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > 999) return null;
  if (!isText(label, 160) || !isMoney(price) || !KINDS.includes(kind) || currency !== 'USD') return null;
  const yours = kind === 'yours';
  if (!yours && (!exactHttps(sourceUrl) || !isIso(verifiedAt))) return null;
  return {
    qty,
    label,
    price,
    currency: 'USD',
    kind,
    sourceUrl: yours ? '' : sourceUrl,
    verifiedAt: yours ? '' : verifiedAt,
    badge: clean(raw.badge, 32),
  };
}

/** A whole tape for printing, or null. `dropped` counts feed lines left off for lack of a source, date or price. */
export function normalizeTape(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== 1 || !isDay(raw.date) || !Array.isArray(raw.items)) return null;
  if (!isText(raw.station, 80)) return null;
  const items = [];
  let dropped = 0;
  for (const line of raw.items.slice(0, 32)) {
    const ok = normalizeLine(line);
    if (ok && ok.kind !== 'yours') items.push(ok);
    else dropped += 1;
  }
  dropped += Math.max(0, raw.items.length - 32);
  if (!items.length) return null;
  const realShopLinks = Array.isArray(raw.realShopLinks) && raw.realShopLinks.every(exactHttps) ? raw.realShopLinks.slice(0, 6) : [];
  return {
    version: 1,
    date: raw.date,
    station: raw.station,
    items,
    realShopLinks,
    dayDigestSha256: isHex64(raw.dayDigestSha256) ? raw.dayDigestSha256 : '',
    barcodeBits: typeof raw.barcodeBits === 'string' && /^[01]{256}$/.test(raw.barcodeBits) ? raw.barcodeBits : '',
    checkedAt: isIso(raw.checkedAt) ? raw.checkedAt : latest(items),
    dropped,
  };
}

const latest = (items) => items.map((l) => l.verifiedAt).filter(Boolean).sort().at(-1) || '';

/** Your one honest line. Stays in the browser; never sent anywhere. */
export function yoursLine(mode, text) {
  const words = clean(text, 48);
  if (!words) return null;
  const lead = mode === 'made' ? 'MADE TODAY:' : "DIDN'T BUY:";
  return normalizeLine({ qty: 1, label: `${lead} ${words}`, price: '0.00', currency: 'USD', kind: 'yours', badge: 'PERSONAL COPY' });
}

/**
 * RECEIPTLINE v1 canonical JSON, the same rule as Shwa's composer (PR #1976): object keys sorted
 * by code unit, no whitespace, arrays in printed order. Display-only fields (badge, checkedAt) are not in it.
 */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/** The exact envelope the receipt fingerprint covers, taken from the raw feed as published. */
export function receiptEnvelope(raw) {
  return {
    version: raw.version,
    date: raw.date,
    station: raw.station,
    items: raw.items.map(({ qty, label, price, currency, kind, sourceUrl, verifiedAt }) => ({
      qty,
      label,
      price,
      currency,
      kind,
      sourceUrl,
      verifiedAt,
    })),
    subtotalCC0: raw.subtotalCC0,
    realShopLinks: raw.realShopLinks,
  };
}

export async function sha256Hex(text) {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const bitsFromHex = (hex) =>
  String(hex)
    .split('')
    .map((c) => parseInt(c, 16).toString(2).padStart(4, '0'))
    .join('');

export const fingerprint = (raw) => sha256Hex(canonicalJson(receiptEnvelope(raw)));

/**
 * Check a receipt before printing it. It must parse, every line must print as published, and its
 * dayDigestSha256 and barcodeBits must equal the SHA-256 of its canonical envelope.
 * Returns { ok, tape, digest, reason }. A receipt that fails is never printed.
 */
export async function verifyTape(raw) {
  const tape = normalizeTape(raw);
  if (!tape) return { ok: false, tape: null, digest: '', reason: 'shape' };
  if (tape.dropped) return { ok: false, tape, digest: '', reason: 'lines' };
  if (!isText(raw.subtotalCC0, 12) || !Array.isArray(raw.realShopLinks)) return { ok: false, tape, digest: '', reason: 'shape' };
  const digest = await fingerprint(raw);
  if (raw.dayDigestSha256 !== digest) return { ok: false, tape, digest, reason: 'digest' };
  if (raw.barcodeBits !== bitsFromHex(digest)) return { ok: false, tape, digest, reason: 'bits' };
  return { ok: true, tape, digest, reason: '' };
}

/** Your copy gets its own hash, over the original fingerprint plus your line. The original stays as published. */
export function personalFingerprint(digest, yours) {
  const { qty, label, price, currency, kind } = yours;
  return sha256Hex(canonicalJson({ dayDigestSha256: digest, personalLine: { qty, label, price, currency, kind } }));
}

export function totals(tape, extra = []) {
  const lines = [...tape.items, ...extra.filter(Boolean)];
  const cents = (ls) => ls.reduce((sum, l) => sum + Math.round(Number(l.price) * 100) * l.qty, 0);
  const listed = lines.filter((l) => l.kind === 'shop');
  const made = lines.filter((l) => l.kind !== 'shop' && l.kind !== 'yours'); // the town's lines, not yours
  return {
    madeCount: made.length,
    madeSubtotal: (cents(made) / 100).toFixed(2),
    listedCount: listed.length,
    listedSubtotal: (cents(listed) / 100).toFixed(2),
    paid: '0.00', // the page has no checkout; nothing here can be bought
  };
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Store-local clock for a receipt: "8:25 AM PT". */
export function clock(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const t = new Intl.DateTimeFormat('en-US', { timeZone: STORE_TZ, hour: 'numeric', minute: '2-digit' }).format(d);
  return `${t} PT`;
}

export function longDate(day) {
  const d = new Date(`${day}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    .format(d)
    .replace(/,/g, '')
    .toUpperCase();
}

/**
 * Two stacked rows of bars, one bar per bit of the SHA-256: thick for 1, thin for 0.
 * A drawing of the digest, not a retail barcode; the hex under it is the thing to check.
 */
export function barcodeSvg(bits, { rows = 2, height = 34, gap = 6, label = '' } = {}) {
  const per = Math.ceil(bits.length / rows);
  const bars = [];
  let width = 0;
  for (let r = 0; r < rows; r += 1) {
    const chunk = `101${bits.slice(r * per, (r + 1) * per)}101`;
    let x = 0;
    const y = r * (height + gap);
    for (const b of chunk) {
      const w = b === '1' ? 2 : 1;
      bars.push(`<rect x="${x}" y="${y}" width="${w}" height="${height}"/>`);
      x += w + 1;
    }
    width = Math.max(width, x - 1);
  }
  const h = rows * height + (rows - 1) * gap;
  return `<svg class="ft-bars" viewBox="0 0 ${width} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(label || 'Bars drawn from the SHA-256 digest')}" fill="currentColor" shape-rendering="crispEdges">${bars.join('')}</svg>`;
}

const groupHex = (hex) => (String(hex).match(/.{1,8}/g) || []).join(' ');

const kindWord = { cc0: 'CC0', shop: 'SHOP', loom: 'LOOM', github: 'GITHUB', chess: 'CHESS', yours: 'YOURS' };

const sameAsBadge = (l) => !!l.badge && l.badge.toUpperCase().includes(kindWord[l.kind]);

function lineHtml(l, i) {
  const label = l.sourceUrl
    ? `<a class="ft-label" href="${esc(l.sourceUrl)}" rel="noopener">${esc(l.label)}</a>`
    : `<span class="ft-label">${esc(l.label)}</span>`;
  const sub = [
    l.badge ? `<b class="ft-badge">${esc(l.badge)}</b>` : '',
    sameAsBadge(l) ? '' : `<span>${kindWord[l.kind]}</span>`,
    l.verifiedAt ? `<span>checked <time datetime="${esc(l.verifiedAt)}">${esc(clock(l.verifiedAt))}</time></span>` : '<span>stays in this browser</span>',
  ]
    .filter(Boolean)
    .join('<span aria-hidden="true"> · </span>');
  return `<li class="ft-line ft-line--${esc(l.kind)}" style="--i:${i}"><span class="ft-qty">${l.qty}</span>${label}<span class="ft-price">${esc(l.price)}</span><span class="ft-sub">${sub}</span></li>`;
}

/**
 * Everything printed on the paper. The page script repaints it with the same function.
 * `digest` is the verified receipt fingerprint; `personalDigest` is set only when you added a line.
 */
export function receiptHtml(tape, { digest = '', source = 'snapshot', yours = null, personalDigest = '', torn = false } = {}) {
  const extra = yours ? [yours] : [];
  const t = totals(tape, extra);
  const printedFrom =
    source === 'live'
      ? `<span>FEED /friday-tape.json</span>`
      : `<span>SNAPSHOT ${esc(clock(tape.checkedAt))}</span>`;
  const lines = [...tape.items, ...extra].map(lineHtml).join('');
  const shop = tape.realShopLinks.length
    ? `<p class="ft-shop">Real shelf: ${tape.realShopLinks
        .map((u) => `<a href="${esc(u)}" rel="noopener">${esc(u.replace(/^https:\/\//, '').replace(/\/$/, ''))}</a>`)
        .join(' · ')}</p>`
    : '';
  const bits = tape.barcodeBits || bitsFromHex(digest);
  const personal = yours && personalDigest
    ? `<p class="ft-personal">PERSONAL COPY · YOUR LINE ADDED<br>SHA-256 <code>${esc(groupHex(personalDigest))}</code></p>`
    : '';
  return `
<header class="ft-head">
  ${yours ? '<p class="ft-stamp">PERSONAL COPY</p>' : ''}
  <p class="ft-store">POINTCAST GENERAL</p>
  <p>${esc(tape.station.toUpperCase())}</p>
  <p>BLACK FRIDAY · <time datetime="${esc(tape.date)}">${esc(longDate(tape.date))}</time></p>
  <p class="ft-big">ANTI-RECEIPT</p>
  <p class="ft-meta"><span>REG 01</span><span>CASHIER: THE TOWN</span></p>
  <p class="ft-meta"><span>PRINTED FROM</span>${printedFrom}</p>
</header>
<p class="ft-cols" aria-hidden="true"><span>QTY</span><span>ITEM</span><span>PRICE</span></p>
<ol class="ft-lines">${lines}</ol>
<dl class="ft-totals">
  <div><dt>MADE TODAY, CC0 + FREE (${t.madeCount})</dt><dd>${t.madeSubtotal}</dd></div>
  ${t.listedCount ? `<div><dt>LISTED, NOT BOUGHT (${t.listedCount})</dt><dd>${t.listedSubtotal}</dd></div>` : ''}
  <div class="ft-paid"><dt>AMOUNT PAID</dt><dd>${t.paid}</dd></div>
  <div><dt>CHANGE DUE</dt><dd>0.00</dd></div>
</dl>
${shop}
<figure class="ft-code">
  ${digest ? barcodeSvg(bits, { label: `Receipt fingerprint SHA-256 ${digest}` }) : ''}
  <figcaption>${yours ? 'ORIGINAL ' : ''}RECEIPT FINGERPRINT · SHA-256<br><code>${esc(groupHex(digest))}</code></figcaption>
</figure>
${personal}
<p class="ft-thanks">THANK YOU FOR NOT SHOPPING<br>CC0 · KEEP THE RECEIPT</p>
<div class="ft-perf${torn ? ' is-torn' : ''}">
  <button type="button" class="ft-tear" data-ft-tear aria-describedby="ft-tear-hint">${torn ? '✂ TORN · TEAR AGAIN' : '✂ TEAR RECEIPT'}</button>
</div>
<p class="ft-stub" id="ft-tear-hint">Tearing makes a keepsake image. Nothing is sent.</p>`;
}

function fit(left, right, cols) {
  const room = cols - right.length - 1;
  const l = left.length > room ? `${left.slice(0, Math.max(0, room - 1))}…` : left;
  return `${l}${' '.repeat(Math.max(1, cols - l.length - right.length))}${right}`;
}

function wrap(text, width, maxRows) {
  const rows = [];
  let row = '';
  for (const word of String(text).split(' ')) {
    const next = row ? `${row} ${word}` : word;
    if (next.length <= width) row = next;
    else {
      if (row) rows.push(row);
      row = word.length > width ? `${word.slice(0, width - 1)}…` : word;
    }
  }
  if (row) rows.push(row);
  if (rows.length > maxRows) {
    const kept = rows.slice(0, maxRows);
    kept[maxRows - 1] = `${kept[maxRows - 1].slice(0, width - 1)}…`;
    return kept;
  }
  return rows;
}

/** The torn-off keepsake: 1080×1350 (4:5), sized for an X post or a phone screenshot. */
export function keepsakeSvg(tape, { digest, yours = null, personalDigest = '', tornAt = new Date().toISOString() } = {}) {
  const W = 1080;
  const H = 1350;
  const COLS = 36;
  const FS = 25;
  const LH = 32;
  const extra = yours ? [yours] : [];
  const t = totals(tape, extra);
  const lines = [...tape.items, ...extra];

  const build = (badges, maxItems) => {
    const rows = [];
    const push = (text, opts = {}) => rows.push({ text, ...opts });
    if (yours) push('PERSONAL COPY', { center: true, size: 22, weight: 700, lh: 30 });
    push('POINTCAST GENERAL', { center: true, size: 32, weight: 700 });
    push(tape.station.toUpperCase(), { center: true });
    push(`BLACK FRIDAY · ${longDate(tape.date)}`, { center: true });
    push('ANTI-RECEIPT', { center: true, size: 42, weight: 700, gapBefore: 8, gapAfter: 4 });
    push('-'.repeat(COLS), { dim: true });
    // Your line is never the one cut: town lines give way first.
    const town = lines.filter((l) => l.kind !== 'yours');
    const shown = [...town.slice(0, Math.max(0, maxItems - extra.length)), ...extra];
    for (const l of shown) {
      const room = COLS - String(l.qty).length - 1 - l.price.length - 1;
      const parts = wrap(l.label, room, l.kind === 'yours' ? 3 : 2);
      const weight = l.kind === 'yours' ? 700 : 400;
      push(fit(`${l.qty} ${parts[0]}`, l.price, COLS), { weight });
      for (const part of parts.slice(1)) push(`  ${part}`, { weight });
      if (badges) push(`  ${l.badge || kindWord[l.kind]}`.slice(0, COLS), { dim: true, size: 20, lh: 26 });
    }
    if (lines.length > shown.length) push(`  + ${lines.length - shown.length} more on the page`, { dim: true, size: 20, lh: 26 });
    push('-'.repeat(COLS), { dim: true });
    push(fit(`MADE TODAY, CC0 + FREE (${t.madeCount})`, t.madeSubtotal, COLS));
    if (t.listedCount) push(fit(`LISTED, NOT BOUGHT (${t.listedCount})`, t.listedSubtotal, COLS));
    push(fit('AMOUNT PAID', t.paid, COLS), { weight: 700 });
    push('-'.repeat(COLS), { dim: true });
    return rows;
  };
  const rowsHeight = (rows) => rows.reduce((h, r) => h + (r.gapBefore || 0) + (r.lh || Math.max(LH, (r.size || FS) + 8)) + (r.gapAfter || 0), 0);
  const extraFoot = yours ? 34 : 0; // the personal-copy hash line
  const FIXED = 140 + 6 + 154 + 62 + 70 + extraFoot; // paper top + first baseline, bars, digest rows, footer, bottom pad
  let rows = build(true, lines.length);
  if (rowsHeight(rows) + FIXED > H - 60) rows = build(false, lines.length);
  for (let n = lines.length - 1; rowsHeight(rows) + FIXED > H - 60 && n > 1; n -= 1) rows = build(false, n);

  const paperX = 130;
  const paperW = W - paperX * 2;
  const top = 70;
  const textX = paperX + 52;
  const centerX = W / 2;
  let y = top + 70;
  const text = rows
    .map((r) => {
      y += r.gapBefore || 0;
      const size = r.size || FS;
      const out = `<text x="${r.center ? centerX : textX}" y="${y}" font-size="${size}" font-weight="${r.weight || 400}"${r.center ? ' text-anchor="middle"' : ''}${r.dim ? ' fill-opacity="0.72"' : ''} xml:space="preserve">${esc(r.text)}</text>`;
      y += (r.lh || Math.max(LH, size + 8)) + (r.gapAfter || 0);
      return out;
    })
    .join('');

  const barsY = y + 6;
  const bars = barcodeSvg(tape.barcodeBits || bitsFromHex(digest), { height: 53, gap: 10 })
    .replace('<svg class="ft-bars"', `<svg x="${textX}" y="${barsY}" width="${paperW - 104}" height="116"`);
  const hexY = barsY + 116 + 38;
  const hex = groupHex(digest).split(' ');
  const hexRows = [hex.slice(0, 4).join(' '), hex.slice(4).join(' ')];
  const footY = hexY + 30 + 32;
  const bottom = Math.min(H - 40, footY + 34 + extraFoot + 36);

  const teeth = 20;
  const tooth = paperW / (teeth * 2);
  const edge = [];
  for (let i = 0; i < teeth; i += 1) {
    const x = paperX + i * tooth * 2;
    edge.push(`L${x + tooth} ${top - tooth}`, `L${x + tooth * 2} ${top}`);
  }
  edge.push(`L${paperX + paperW} ${bottom}`);
  for (let i = 0; i < teeth; i += 1) {
    const x = paperX + paperW - i * tooth * 2;
    edge.push(`L${x - tooth} ${bottom + tooth}`, `L${x - tooth * 2} ${bottom}`);
  }
  const paper = `M${paperX} ${top} ${edge.join(' ')} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>PointCast anti-receipt, ${esc(tape.date)}</title>
<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="27"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.09 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="#24221f"/>
<path d="${paper}" fill="#000" opacity="0.35" transform="translate(10 16)"/>
<path d="${paper}" fill="#f6efdf"/>
<path d="${paper}" fill="#f6efdf" filter="url(#grain)"/>
<g fill="#1d1b18" font-family="'JetBrains Mono','DejaVu Sans Mono',Menlo,Consolas,monospace">
${text}
<g fill="#1d1b18">${bars}</g>
<text x="${centerX}" y="${hexY}" font-size="22" text-anchor="middle">${esc(hexRows[0])}</text>
<text x="${centerX}" y="${hexY + 32}" font-size="22" text-anchor="middle">${esc(hexRows[1])}</text>
<text x="${centerX}" y="${footY}" font-size="21" text-anchor="middle" fill-opacity="0.72">${yours ? 'ORIGINAL ' : ''}RECEIPT FINGERPRINT · SHA-256</text>
${yours && personalDigest ? `<text x="${centerX}" y="${footY + 34}" font-size="21" text-anchor="middle" font-weight="700">PERSONAL COPY ${esc(groupHex(personalDigest.slice(0, 16)))}…</text>` : ''}
<text x="${centerX}" y="${footY + 34 + extraFoot}" font-size="21" text-anchor="middle" fill-opacity="0.72">TORN ${esc(clock(tornAt))} · POINTCAST.XYZ/FRIDAY-TAPE</text>
</g>
</svg>`;
}
