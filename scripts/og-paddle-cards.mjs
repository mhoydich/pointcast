/**
 * Unfurl cards for the Court channel's paddle pages:
 *   /images/og/paddles/<id>.png   one per paddle in the register
 *   /images/og/paddles.png        the register index
 *   /images/og/paddle-calendar.png
 *
 * Each paddle card carries the paddle's own to-scale drawing
 * (src/lib/paddle-drawing.mjs), so a link pasted into a chat shows the
 * outline, the core cutaway, the price, the launch date and where it is
 * legal. Rasterised by scripts/generate-og-images.mjs.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { paddlePlate } from '../src/lib/paddle-drawing.mjs';

const W = 1200;
const H = 630;
const INK = '#12110E';
const BODY = '#38373A';
const FAINT = '#5F5E5A';
const RULE = '#C4C2BC';
const C50 = '#F0F5E9';
const C600 = '#3B6D11';
const C800 = '#24460A';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';
const SANS = 'Inter, system-ui, sans-serif';

// Must match BUILDS in src/lib/paddle-calendar.ts.
const BUILDS = {
  foam: { short: 'FULL FOAM', color: '#3B6D11' },
  hybrid: { short: 'GEN 3 · HONEYCOMB + FOAM', color: '#185FA5' },
  poly: { short: 'POLYMER HONEYCOMB', color: '#B5651D' },
  rib: { short: 'CARBON RIB', color: '#993556' },
  unknown: { short: 'BUILD NOT STATED', color: '#8A8883' },
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars && line) { lines.push(line); line = word; } else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,.;:·]+\S*$/, '') + '…'; }
  return lines;
}

/** Load the register the same way src/lib/paddle-register.ts does, minus the types. */
export function loadPaddles(root = process.cwd()) {
  const calendar = JSON.parse(readFileSync(path.join(root, 'src/data/paddle-calendar.json'), 'utf8'));
  const register = JSON.parse(readFileSync(path.join(root, 'src/data/paddle-register.json'), 'utf8'));
  const paddles = [...(register.backfill ?? []), ...calendar.releases].map((raw) => {
    const e = register.enrich?.[raw.id] ?? { ...raw, status: raw.statusInfo };
    const variants = (e.variants ?? []).filter(Boolean);
    const pick = (list, key) => (e.status?.[key] && e.status[key] !== 'unknown' ? e.status[key] : raw[key] ?? 'unknown');
    return {
      ...raw,
      short: raw.short || `${raw.brand} ${raw.model}`,
      year: Number(raw.date.slice(0, 4)),
      lead: variants.find((v) => typeof v.lengthIn === 'number' && typeof v.widthIn === 'number') ?? variants[0] ?? { shape: raw.shapes, thicknessMm: Number.parseFloat(raw.thickness) || null },
      layers: (e.core?.layers ?? []).filter(Boolean),
      usap: pick(e, 'usap'),
      upaa: pick(e, 'upaa'),
      quiet: Boolean(e.status?.quiet),
    };
  });
  return { paddles, calendar };
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const when = (p) => {
  const y = p.date.slice(0, 4), m = Number(p.date.slice(5, 7)), d = Number(p.date.slice(8, 10));
  return p.precision === 'day' ? `${MON[m - 1]} ${d}, ${y}` : p.precision === 'month' ? `${MON[m - 1]} ${y}` : `Q${Math.ceil(m / 3)} ${y}`;
};
const price = (p) => p.msrpLabel || (p.msrp == null ? 'price n/a' : `$${Number.isInteger(p.msrp) ? p.msrp : p.msrp.toFixed(2)}`);

function plateAt(p, x, y, w, h, id, dims) {
  const build = BUILDS[p.build] ?? BUILDS.unknown;
  const plate = paddlePlate({ variant: p.lead, shapes: p.shapes, build: p.build, layers: p.layers, color: build.color, id, dims, mono: MONO });
  const [vx, vy, vw, vh] = plate.viewBox;
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet">${inner(plate.svg)}</svg>`;
}

function chips(items, x, y) {
  let cx = x;
  return items
    .map(({ text, fill, color, stroke }) => {
      const w = Math.round(text.length * 10.2 + 26);
      const out = `<rect x="${cx}" y="${y}" width="${w}" height="34" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><text x="${cx + 13}" y="${y + 23}" font-family="${MONO}" font-size="16" font-weight="500" letter-spacing="1" fill="${color}">${esc(text)}</text>`;
      cx += w + 10;
      return out;
    })
    .join('');
}

export function paddleCard(p) {
  const build = BUILDS[p.build] ?? BUILDS.unknown;
  const title = wrap(p.model, 19, 3);
  const size = title.length > 2 ? 58 : title.some((l) => l.length > 15) ? 66 : 78;
  const titleY = 208;
  const afterTitle = titleY + (title.length - 1) * (size + 4);
  const cert = [
    p.usap === 'yes' && { text: 'USAP ✓', fill: C50, color: C800, stroke: C600 },
    p.usap === 'no' && { text: 'NOT USAP', fill: '#fff', color: '#8A2432', stroke: '#8A2432' },
    p.usap === 'split' && { text: 'USAP: SOME', fill: '#fff', color: '#8A4B00', stroke: '#8A4B00' },
    p.upaa === 'yes' && { text: 'UPA-A ✓', fill: C50, color: C800, stroke: C600 },
    p.quiet && { text: 'QUIET LIST', fill: C50, color: C800, stroke: C600 },
    p.status === 'upcoming' && { text: 'NOT OUT YET', fill: '#fff', color: INK, stroke: INK },
  ].filter(Boolean);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="12" fill="${build.color}"/>
  <rect x="770" y="12" width="430" height="${H - 12}" fill="${C50}"/>
  <line x1="770" y1="12" x2="770" y2="${H}" stroke="${C600}" stroke-width="2"/>
  ${plateAt(p, 790, 40, 390, 560, 'og', true)}
  <text x="64" y="84" font-family="${MONO}" font-size="18" font-weight="500" letter-spacing="2.4" fill="${C800}">THE PADDLE REGISTER · ${esc(p.year)}</text>
  <text x="64" y="${titleY - size + 4}" font-family="${SANS}" font-size="34" font-weight="500" fill="${FAINT}">${esc(p.brand)}</text>
  ${title.map((line, i) => `<text x="62" y="${titleY + i * (size + 4)}" font-family="${SANS}" font-size="${size}" font-weight="500" letter-spacing="-2.4" fill="${INK}">${esc(line)}</text>`).join('')}
  <line x1="64" y1="${afterTitle + 34}" x2="706" y2="${afterTitle + 34}" stroke="${C600}" stroke-width="2"/>
  <text x="64" y="${afterTitle + 96}" font-family="${SANS}" font-size="54" font-weight="500" letter-spacing="-1.4" fill="${INK}">${esc(price(p).split(' ')[0])}</text>
  <text x="64" y="${afterTitle + 130}" font-family="${MONO}" font-size="16" letter-spacing="1.6" fill="${FAINT}">LIST PRICE</text>
  <text x="330" y="${afterTitle + 92}" font-family="${SANS}" font-size="34" font-weight="500" letter-spacing="-0.6" fill="${INK}">${esc(when(p))}</text>
  <text x="330" y="${afterTitle + 130}" font-family="${MONO}" font-size="16" letter-spacing="1.6" fill="${FAINT}">${p.status === 'upcoming' ? 'ON SALE' : 'LAUNCHED'}</text>
  ${chips([{ text: build.short, fill: build.color, color: '#fff', stroke: build.color }, ...cert], 64, Math.min(afterTitle + 168, 500))}
  <text x="64" y="586" font-family="${MONO}" font-size="17" letter-spacing="1" fill="${BODY}">pointcast.xyz/paddles/${esc(p.id)}</text>
</svg>`;
}

export function registerCard(paddles) {
  // One drawing per build type and shape, newest first, so the row shows the range.
  const seen = new Set();
  const row = [];
  for (const p of [...paddles].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = `${p.build}|${String(p.lead?.shape || p.shapes).toLowerCase().slice(0, 4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    row.push(p);
    if (row.length === 7) break;
  }
  const brands = new Set(paddles.map((p) => p.brand)).size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="12" fill="${C600}"/>
  <text x="64" y="84" font-family="${MONO}" font-size="18" font-weight="500" letter-spacing="2.4" fill="${C800}">POINTCAST · CH.CRT · OPEN DATA</text>
  <text x="62" y="164" font-family="${SANS}" font-size="76" font-weight="500" letter-spacing="-3" fill="${INK}">The Paddle Register</text>
  <text x="64" y="212" font-family="${SANS}" font-size="28" fill="${BODY}">The labs measure paddles. This keeps the record.</text>
  <rect x="0" y="250" width="${W}" height="290" fill="${C50}"/>
  <line x1="0" y1="250" x2="${W}" y2="250" stroke="${C600}" stroke-width="2"/><line x1="0" y1="540" x2="${W}" y2="540" stroke="${C600}" stroke-width="2"/>
  ${row.map((p, i) => plateAt(p, 64 + i * 156, 266, 136, 258, `r${i}`, false)).join('')}
  <text x="64" y="590" font-family="${MONO}" font-size="18" letter-spacing="1.2" fill="${BODY}">${paddles.length} PADDLES · ${brands} BRANDS · RELEASE DATES · LEGAL STATUS · CONSTRUCTION · EVERY FACT SOURCED</text>
</svg>`;
}

export function calendarCard(calendar) {
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const counts = months.map((_, i) => calendar.releases.filter((r) => r.date.startsWith(`2026-${String(i + 1).padStart(2, '0')}`)));
  const max = Math.max(...counts.map((c) => c.length));
  const now = Number(calendar.meta.asOf.slice(5, 7)) - 1;
  const colW = 84, x0 = 96, base = 520, unit = 30;
  const bars = counts
    .map((list, i) => {
      const x = x0 + i * colW;
      const stack = list
        .map((r, k) => `<rect x="${x}" y="${base - (k + 1) * unit + 3}" width="56" height="${unit - 5}" fill="${r.status === 'upcoming' ? '#fff' : (BUILDS[r.build] ?? BUILDS.unknown).color}" stroke="${(BUILDS[r.build] ?? BUILDS.unknown).color}" stroke-width="2"/>`)
        .join('');
      return `${i === now ? `<rect x="${x - 14}" y="${base - max * unit - 16}" width="84" height="${max * unit + 62}" fill="${C50}"/>` : ''}${stack}<text x="${x + 28}" y="${base + 30}" text-anchor="middle" font-family="${MONO}" font-size="18" fill="${i === now ? C800 : FAINT}">${months[i]}</text>`;
    })
    .join('');
  const brands = new Set(calendar.releases.map((r) => r.brand)).size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="12" fill="${C600}"/>
  <text x="64" y="84" font-family="${MONO}" font-size="18" font-weight="500" letter-spacing="2.4" fill="${C800}">POINTCAST · CH.CRT · AS OF ${esc(calendar.meta.asOf)}</text>
  <text x="62" y="160" font-family="${SANS}" font-size="70" font-weight="500" letter-spacing="-2.8" fill="${INK}">Every paddle of 2026,</text>
  <text x="62" y="232" font-family="${SANS}" font-size="70" font-weight="500" letter-spacing="-2.8" fill="${INK}">on one calendar.</text>
  <line x1="64" y1="${base}" x2="1136" y2="${base}" stroke="${RULE}" stroke-width="2"/>
  ${bars}
  <text x="64" y="596" font-family="${MONO}" font-size="18" letter-spacing="1.2" fill="${BODY}">${calendar.releases.length} RELEASES · ${brands} BRANDS · DATED · PRICED · SOURCED · FORECAST TO SPRING 2027</text>
</svg>`;
}
