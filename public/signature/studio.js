/**
 * Signature Studio, the logic with no DOM.
 *
 * The page at /signature and node tests import this same module. It lays out
 * a typed signature from glyph contours (y-up font units), turns a drawing
 * into stroked paths, builds the SVG, the email snippet, the SHA-256
 * statement an ed25519 key signs, and the signature/v1 post a devnet key
 * records on channel ART.
 *
 * A private key never enters a post body. Signing uses the key object from
 * chain-kit (WebCrypto, in the browser). The devnet has no value and may reset.
 * This is not a legally binding e-signature service.
 */

import { pcc, isHex64, isObj, KitError, sha256Hex, signAndSend } from '../chain/apps/chain-kit.js';

export const FORMAT = 'signature/v1';
export const STATEMENT_FORMAT = 'pointcast-signature/statement/v1';
export const CHANNEL = 'ART';
export const KEY_SLOT = 'pointcast-signature/key/v1';

export const LIMITS = Object.freeze({
  text: 80,
  label: 60,
  statement: 500,
  svgChars: 60000,
  media: 512,
  drawPoints: 8000,
});

const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DATA_IMG = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
const MEDIA = /^(https:|ipfs:|ar:)[^\s]+$/;
const PATH_D = /^[MLQCZ0-9eE.+\-\s]+$/;

function safeContour(d) {
  const s = String(d || '').trim();
  if (!s || s.length > 200000 || !PATH_D.test(s)) throw new KitError('a glyph outline was not a path', { code: 'bad_font' });
  return s;
}

export const xmlEscape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

export function clamp(n, lo, hi, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(hi, Math.max(lo, v));
}

export function inkColor(v, fallback = '#1c140f') {
  return HEX_COLOR.test(String(v || '')) ? String(v) : fallback;
}

/** One line, no control characters, cut to `max` characters. Empty becomes ''. */
export function oneLine(v, max) {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  if (CONTROL.test(s)) throw new KitError('that text has a control character', { code: 'bad_text' });
  const chars = Array.from(s);
  return chars.length <= max ? s : chars.slice(0, max).join('');
}

function num(n) {
  return Math.round(n * 100) / 100;
}

/** A baseline swash in screen pixels, from x0 to x1 at y. */
export function flourishPath(x0, x1, y) {
  const w = Math.max(24, x1 - x0);
  const a = x0;
  const b = x0 + w * 0.72;
  const c = x0 + w * 0.86;
  const d = x0 + w;
  return `M ${num(a)} ${num(y)} C ${num(a + w * 0.25)} ${num(y + 6)} ${num(a + w * 0.45)} ${num(y - 5)} ${num(b)} ${num(y + 1)} C ${num(c)} ${num(y + 10)} ${num(c + w * 0.04)} ${num(y + 22)} ${num(d - w * 0.08)} ${num(y + 8)}`;
}

/**
 * Lay out `text` with a path-JSON font (the files in /signature/paths).
 * Contours are y-up font units. Slant is extra degrees of rightward lean,
 * on top of whatever slant the face already has.
 */
export function layoutTyped({ font, text, size = 96, slant = 0, weight = 0, color = '#1c140f', flourish = true }) {
  if (!font || !font.glyphs || !font.unitsPerEm) throw new KitError('that font has no outlines', { code: 'bad_font' });
  const raw = oneLine(text, LIMITS.text);
  if (!raw) throw new KitError('type a name first', { code: 'empty' });
  const px = clamp(size, 28, 220, 96);
  const deg = clamp(slant, -25, 40, 0);
  const stroke = clamp(weight, 0, 14, 0);
  const ink = inkColor(color);
  const scale = px / font.unitsPerEm;
  const missing = [];
  let advance = 0;
  const runs = [];
  for (const ch of Array.from(raw)) {
    if (ch === ' ') {
      advance += font.space || font.unitsPerEm / 4;
      continue;
    }
    const g = font.glyphs[ch];
    if (!g || !Array.isArray(g.contours) || !g.contours.length) {
      missing.push(ch);
      continue;
    }
    runs.push({ ch, g, x: advance });
    advance += g.advance || font.unitsPerEm / 2;
  }
  if (!runs.length) throw new KitError('none of those characters are in this face', { code: 'missing', missing });
  const pad = 18;
  const asc = (font.ascender || font.unitsPerEm * 0.8) * scale;
  const desc = Math.abs(font.descender || font.unitsPerEm * 0.2) * scale;
  const lean = Math.tan((deg * Math.PI) / 180);
  const extra = Math.abs(lean) * (asc + desc) + stroke;
  const shift = lean < 0 ? extra : stroke;
  const width = Math.ceil(pad * 2 + shift + advance * scale + extra + stroke);
  const flourishH = flourish ? 36 : 8;
  const height = Math.ceil(pad + asc + desc + flourishH + stroke);
  const baseline = pad + asc;
  const parts = [];
  for (const run of runs) {
    const x = pad + shift + run.x * scale;
    parts.push(`<g transform="translate(${num(x)} ${num(baseline)}) scale(${num(scale)} ${num(-scale)}) skewX(${num(deg)})">`);
    for (const c of run.g.contours) parts.push(`<path d="${safeContour(c)}"/>`);
    parts.push('</g>');
  }
  if (flourish) {
    const y = baseline + Math.min(28, desc * 0.35) + 16;
    parts.push(`<path d="${flourishPath(pad, pad + shift + advance * scale, y)}" fill="none" stroke="${ink}" stroke-width="${num(Math.max(1.25, px / 48))}" stroke-linecap="round"/>`);
  }
  const sw = stroke > 0 ? ` stroke="${ink}" stroke-width="${num(stroke)}" stroke-linejoin="round" stroke-linecap="round"` : '';
  const svg = svgDoc({
    width,
    height,
    title: raw,
    body: `<g fill="${ink}"${sw}>${parts.join('')}</g>`,
  });
  return { svg, width, height, missing, text: raw, color: ink };
}

function svgDoc({ width, height, title, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${xmlEscape(title)}</title>${body}</svg>`;
}

/** Refuse an SVG this module did not build: no scripts, no handlers, a single root. */
export function assertSafeSvg(svg) {
  const s = String(svg || '');
  if (!s.startsWith('<svg xmlns="http://www.w3.org/2000/svg" ') || !s.endsWith('</svg>')) throw new KitError('not a signature SVG', { code: 'bad_svg' });
  if (/<\s*script|javascript:|\son[a-z]+\s*=|data:text/i.test(s)) throw new KitError('the SVG is not safe to show', { code: 'bad_svg' });
  return s;
}

function simplify(points) {
  const out = [];
  for (const p of points) {
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const prev = out[out.length - 1];
    if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) < 0.6) continue;
    out.push({ x: p.x, y: p.y, t: Number.isFinite(p.t) ? p.t : out.length, pressure: Number.isFinite(p.pressure) ? p.pressure : null });
    if (out.length >= LIMITS.drawPoints) break;
  }
  return out;
}

function widthAt(points, i, minW, maxW, usePressure) {
  const p = points[i];
  const prev = points[Math.max(0, i - 1)];
  if (usePressure && p.pressure !== null && p.pressure > 0) return minW + Math.min(1, p.pressure) * (maxW - minW);
  const dt = Math.max(8, (p.t || 0) - (prev.t || 0));
  const speed = Math.hypot(p.x - prev.x, p.y - prev.y) / dt;
  const t = Math.min(1, speed / 1.4);
  return maxW - t * (maxW - minW);
}

function smoothSlice(slice) {
  if (slice.length === 1) return `M ${num(slice[0].x)} ${num(slice[0].y)}`;
  let d = `M ${num(slice[0].x)} ${num(slice[0].y)}`;
  for (let i = 1; i < slice.length - 1; i++) {
    const mx = (slice[i].x + slice[i + 1].x) / 2;
    const my = (slice[i].y + slice[i + 1].y) / 2;
    d += ` Q ${num(slice[i].x)} ${num(slice[i].y)} ${num(mx)} ${num(my)}`;
  }
  const last = slice[slice.length - 1];
  const prev = slice[slice.length - 2];
  d += ` Q ${num(prev.x)} ${num(prev.y)} ${num(last.x)} ${num(last.y)}`;
  return d;
}

/**
 * A drawing: points are `{x, y, t, pressure}` in CSS pixels. Speed thickens
 * a slow stroke. Real pointer pressure is used only when `usePressure` is set
 * (a mouse that always reports 0.5 should leave it off).
 */
export function layoutDrawn(points, { minWidth = 1.4, maxWidth = 7, color = '#1c140f', flourish = false } = {}) {
  const pts = simplify(points);
  if (pts.length < 2) throw new KitError('draw a stroke first', { code: 'empty' });
  const minW = clamp(minWidth, 0.6, 18, 1.4);
  const maxW = clamp(maxWidth, minW, 28, 7);
  const ink = inkColor(color);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = 18 + maxW;
  const width = Math.ceil(maxX - minX + pad * 2);
  const flourishH = flourish ? 36 : 0;
  const height = Math.ceil(maxY - minY + pad * 2 + flourishH);
  const parts = [];
  const step = 3;
  const pressures = pts.map((p) => p.pressure).filter((p) => p !== null);
  const varied = pressures.length > 4 && Math.max(...pressures) - Math.min(...pressures) > 0.15;
  for (let i = 0; i < pts.length - 1; i += step) {
    const slice = pts.slice(i, Math.min(pts.length, i + step + 1)).map((p) => ({ x: p.x - minX + pad, y: p.y - minY + pad }));
    const w = widthAt(pts, Math.min(pts.length - 1, i + 1), minW, maxW, varied);
    parts.push(`<path d="${smoothSlice(slice)}" fill="none" stroke="${ink}" stroke-width="${num(w)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  if (flourish) parts.push(`<path d="${flourishPath(pad, width - pad, height - 28)}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`);
  const svg = svgDoc({ width, height, title: 'Drawn signature', body: parts.join('') });
  return { svg, width, height, color: ink, points: pts.length };
}

/** An uploaded picture, wrapped in an SVG. The pixels stay pixels; this is not a vector trace. */
export function layoutUpload({ dataUrl, width, height }) {
  const href = String(dataUrl || '').replace(/\s+/g, '');
  if (!DATA_IMG.test(href)) throw new KitError('upload a PNG, JPEG, GIF or WebP', { code: 'bad_file' });
  if (href.length > 2_500_000) throw new KitError('that image is too large to embed (about 1.8 MB of base64)', { code: 'too_big' });
  const w = Math.round(clamp(width, 1, 2000, 0));
  const h = Math.round(clamp(height, 1, 1200, 0));
  if (!w || !h) throw new KitError('that image has no size', { code: 'bad_file' });
  const svg = svgDoc({
    width: w,
    height: h,
    title: 'Uploaded signature',
    body: `<image href="${href}" width="${w}" height="${h}" />`,
  });
  return { svg, width: w, height: h, vector: false };
}

export async function hashBytes(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return sha256Hex(u8);
}

export function emailSnippet({ fileName = 'signature.png', width = 280, alt = 'Signature' } = {}) {
  const w = Math.round(clamp(width, 80, 560, 280));
  const name = String(fileName || 'signature.png').replace(/[^A-Za-z0-9._-]/g, '') || 'signature.png';
  return [
    '<!-- Many mail clients strip data-URI images. Attach the PNG and keep this filename, or host it at https and put that URL in src. -->',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
    '  <tr>',
    `    <td><img src="${xmlEscape(name)}" alt="${xmlEscape(oneLine(alt, 80))}" width="${w}" style="display:block;border:0;max-width:${w}px;height:auto;" /></td>`,
    '  </tr>',
    '</table>',
  ].join('\n');
}

export function inlineSvgSnippet(svg) {
  const safe = assertSafeSvg(svg);
  return `<!-- Inline SVG. Some webmail will remove it. The PNG attachment is the reliable copy. -->\n${safe}`;
}

/** The bytes an ed25519 key signs: a header, the PNG hash, then the statement exactly. */
export function canonicalStatement({ statement, pngSha256 }) {
  if (!isHex64(pngSha256)) throw new KitError('the PNG hash is 64 hex characters', { code: 'bad_hash' });
  const text = String(statement ?? '').replace(/\r\n/g, '\n');
  if (CONTROL.test(text)) throw new KitError('the statement has a control character', { code: 'bad_text' });
  if (Array.from(text).length > LIMITS.statement) throw new KitError('the statement is too long', { code: 'bad_text' });
  if (!text.trim()) throw new KitError('write a statement to sign', { code: 'empty' });
  return `${STATEMENT_FORMAT}\npng-sha256:${pngSha256}\n${text}`;
}

export async function signStatement({ key, statement, pngSha256 }) {
  if (!key || typeof key.sign !== 'function' || !key.publicKey) throw new KitError('make a key first', { code: 'no_key' });
  const canonical = canonicalStatement({ statement, pngSha256 });
  const bytes = new TextEncoder().encode(canonical);
  const signature = await key.sign(pcc.bytesToHex(bytes));
  return {
    canonical,
    signature,
    publicKey: key.publicKey.bytes,
    address: key.sender,
  };
}

export async function verifyStatement({ canonical, publicKey, signature }) {
  const text = String(canonical ?? '');
  if (!text.startsWith(STATEMENT_FORMAT + '\n')) return { ok: false, reason: 'The text does not start with ' + STATEMENT_FORMAT + '.' };
  if (!isHex64(publicKey)) return { ok: false, reason: 'The public key is 64 hex characters.' };
  if (!/^[0-9a-fA-F]{128}$/.test(String(signature || ''))) return { ok: false, reason: 'The signature is 128 hex characters.' };
  const msg = new TextEncoder().encode(text);
  const ok = await pcc.verifyEd25519(String(publicKey).toLowerCase(), msg, String(signature).toLowerCase());
  if (ok === null) return { ok: false, reason: 'This browser cannot verify ed25519.' };
  return ok ? { ok: true, reason: 'The signature matches this text and this public key.' } : { ok: false, reason: 'The signature does not match this text and this public key.' };
}

export function cleanMedia(v) {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (s.length > LIMITS.media || CONTROL.test(s) || !MEDIA.test(s)) throw new KitError('a media URI must be https, ipfs or ar, with no spaces', { code: 'bad_media' });
  return s;
}

/**
 * The post body. `svg` is included only when the whole body stays small
 * enough to store; otherwise the line is `svg:omitted` and the hash still is.
 */
export function signatureBody({ sha256, kind, font = '', bytes, label = '', svg = '', media = null }) {
  if (!isHex64(sha256)) throw new KitError('a SHA-256 is 64 lowercase hex characters', { code: 'bad_hash' });
  if (!['typed', 'drawn', 'upload'].includes(kind)) throw new KitError('kind is typed, drawn or upload', { code: 'bad_kind' });
  if (!Number.isSafeInteger(bytes) || bytes < 1) throw new KitError('the PNG size is a whole number of bytes', { code: 'bad_size' });
  const face = font ? oneLine(font, 40) : '';
  const name = label ? oneLine(label, LIMITS.label) : '';
  const lines = [FORMAT, `sha256:${sha256}`, `kind:${kind}`, `bytes:${bytes}`];
  if (face) lines.push(`font:${face}`);
  if (name) lines.push(`label:${name}`);
  if (media) lines.push(`media:${cleanMedia(media)}`);
  const picture = typeof svg === 'string' ? svg.replace(/\s+/g, ' ').trim() : '';
  const withSvg = picture ? [...lines, `svg:${picture}`] : lines;
  if (picture && withSvg.join('\n').length <= LIMITS.svgChars && !CONTROL.test(picture)) return withSvg.join('\n');
  if (picture) lines.push('svg:omitted');
  return lines.join('\n');
}

export function signatureTitle(sha256) {
  if (!isHex64(sha256)) throw new KitError('a SHA-256 is 64 lowercase hex characters', { code: 'bad_hash' });
  return `${FORMAT} ${sha256}`;
}

export function parseSignature(body) {
  if (typeof body !== 'string' || body.length > LIMITS.svgChars) return null;
  const lines = body.split('\n');
  if (lines[0] !== FORMAT) return null;
  const got = {};
  for (const line of lines.slice(1)) {
    const i = line.indexOf(':');
    if (i < 1) return null;
    const k = line.slice(0, i);
    const v = line.slice(i + 1);
    if (got[k] !== undefined) return null;
    got[k] = v;
  }
  if (!isHex64(got.sha256)) return null;
  if (!['typed', 'drawn', 'upload'].includes(got.kind)) return null;
  if (!/^(0|[1-9][0-9]{0,9})$/.test(got.bytes || '')) return null;
  return {
    sha256: got.sha256,
    kind: got.kind,
    bytes: Number(got.bytes),
    font: typeof got.font === 'string' ? got.font.slice(0, 40) : '',
    label: typeof got.label === 'string' ? got.label.slice(0, LIMITS.label) : '',
    media: typeof got.media === 'string' ? got.media.slice(0, LIMITS.media) : '',
    svg: got.svg && got.svg !== 'omitted' ? got.svg : '',
    svgOmitted: got.svg === 'omitted',
  };
}

export function planRecord({ sha256, kind, font, bytes, label, svg, media }) {
  const body = signatureBody({ sha256, kind, font, bytes, label, svg, media });
  return { channel: CHANNEL, title: signatureTitle(sha256), body, mediaUri: cleanMedia(media) };
}

/**
 * Store the body (the SDK's buildPublish posts it and checks the hash), sign
 * with the browser key, submit, and wait for the block.
 */
export async function recordSignature({ chain, key, plan, onStage }) {
  if (!key || !key.sender) throw new KitError('make a key first', { code: 'no_key' });
  if (!plan || plan.channel !== CHANNEL || !plan.body || !plan.title) throw new KitError('nothing to record', { code: 'empty' });
  const tx = await chain.buildPublish({
    sender: key.sender,
    channel: plan.channel,
    title: plan.title,
    body: plan.body,
    mediaUri: plan.mediaUri,
  });
  const done = await signAndSend(chain, key, tx, { onStage: onStage || (() => {}) });
  return { txHash: done.txHash, height: done.height, bodyHash: tx.body_hash, sender: key.sender };
}

export function txLinks(api, txHash) {
  const base = String(api || '').replace(/\/$/, '');
  return {
    tx: `${base}/tx/${txHash}`,
    feed: `${base}/feed`,
    verify: '/chain/verify-a-block',
  };
}

export function editionsSummary(json) {
  if (!isObj(json) || !Array.isArray(json.editions)) return { ok: false, lines: ['The devnet’s /editions did not come back in the shape this page reads.'] };
  if (!json.editions.length) return { ok: true, lines: ['No editions are open on this devnet.'] };
  return {
    ok: true,
    lines: json.editions.map((e) => {
      const id = typeof e.id === 'string' ? e.id.slice(0, 40) : 'edition';
      const minted = Number.isFinite(e.minted) ? e.minted : '?';
      const left = Number.isFinite(e.remaining) ? e.remaining : '?';
      const attestor = e.terms && e.terms.attestor ? 'house attestor required' : 'no attestor on the terms';
      return `${id}: minted ${minted}, remaining ${left}, ${attestor}.`;
    }),
  };
}
