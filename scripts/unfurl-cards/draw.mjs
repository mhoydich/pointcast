// The drawings. One card system for three areas: words on the left, a drawn motif from the
// page on the right, the site mark and one line of small type along the foot. Each area wears
// the palette of its own pages. One card (Prayer Fire) embeds the page's own poster photograph; no outside fonts or images: type is the Inter and
// JetBrains Mono subsets already in the repo, set by build.mjs.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TOWNS } from '../coast-commons/data.mjs';
import { H, ROOT, STATUS, W, esc } from './cards.mjs';

const SANS = 'Inter, system-ui, sans-serif';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';

// Shared layout. BASE is the street in Baby Bonfire, the rule in Coast Commons, the floor in House Channel.
const TEXT_X = 72;
const TEXT_W = 612;
const MOTIF_X = 724;
const MOTIF_W = 420;
const MOTIF_CX = MOTIF_X + MOTIF_W / 2;
const BASE = 520;
const FOOT = 584;
const n = (v) => +Number(v).toFixed(1);

/**
 * One line of type. `weight` thickens it with a stroke of its own colour, because the font
 * subsets carry one weight each (the same trick as src/lib/unfurl/cards.mjs).
 */
export function type(t) {
  const { x, y, size, fill, family = SANS, weight = 0, spacing = 0, anchor = 'start' } = t;
  const bold = weight ? ` stroke="${fill}" stroke-width="${n(size * weight)}" stroke-linejoin="round" paint-order="stroke"` : '';
  const space = spacing ? ` letter-spacing="${n(spacing)}"` : '';
  const end = anchor === 'start' ? '' : ` text-anchor="${anchor}"`;
  return `<text x="${n(x)}" y="${n(y)}" font-family="${family}" font-size="${size}" fill="${fill}"${space}${end}${bold}>${esc(t.text)}</text>`;
}

// ---------------------------------------------------------------- palettes

const AREAS = {
  // Dusk street and ember: public/baby-bonfire/index.html
  'baby-bonfire': {
    head: '#f3e9d8', body: '#ece1d0', kick: '#ffd27a', mark: '#f3e9d8', small: '#c3b8cc', accent: '#ff9a4a',
    kicker: { family: MONO, spacing: 4 },
    back: () => `<defs>
<linearGradient id="bbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141230"/><stop offset=".42" stop-color="#2a2148"/><stop offset=".82" stop-color="#5a3558"/><stop offset="1" stop-color="#a8554a"/></linearGradient>
<radialGradient id="bbGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset=".45" stop-color="#ff9a4a" stop-opacity=".28"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${BASE}" fill="url(#bbSky)"/>
<g fill="#fff">${[[86, 58, 1.6], [212, 34, 1.2], [334, 92, 1.4], [468, 40, 1.8], [560, 108, 1.1], [652, 56, 1.3], [744, 30, 1.6], [838, 86, 1.2], [930, 44, 1.9], [1012, 98, 1.2], [1096, 38, 1.5], [1162, 120, 1.2], [152, 136, 1.1], [420, 152, 1.2], [702, 142, 1], [1066, 172, 1.1]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" opacity=".8"/>`).join('')}</g>
<rect y="${BASE}" width="${W}" height="${H - BASE}" fill="#17152e"/>
<rect y="${BASE - 2}" width="${W}" height="5" fill="#100e22"/>`,
  },
  // Fog, kelp, sandstone, terracotta: public/coast-commons/cc.css
  'coast-commons': {
    head: '#123240', body: '#1f2a25', kick: '#8a3a1c', mark: '#1f2a25', small: '#8a3a1c', accent: '#b5532f',
    kicker: { family: SANS, spacing: 2.6, weight: 0.035 },
    back: () => `<defs><pattern id="ccDots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#3d5a2c" fill-opacity=".11"/></pattern></defs>
<rect width="${W}" height="${H}" fill="#e9eeea"/><rect width="${W}" height="${H}" fill="url(#ccDots)"/>
<path d="M${TEXT_X} ${BASE + 22}H${W - 56}" stroke="#c9bfa6" stroke-width="2.5" stroke-dasharray="9 8"/>`,
  },
  // Night living room and hearth glow: public/house/house.css
  house: {
    head: '#f3ead9', body: '#cfc5b3', kick: '#c9873a', mark: '#f3ead9', small: '#9c9282', accent: '#ffb454',
    kicker: { family: MONO, spacing: 5 },
    back: () => `<defs><radialGradient id="hcRoom" cx="${MOTIF_CX}" cy="250" r="470" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff963c" stop-opacity=".36"/><stop offset=".5" stop-color="#ff963c" stop-opacity=".1"/><stop offset="1" stop-color="#ff963c" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="#14110e"/><rect width="${W}" height="${H}" fill="url(#hcRoom)"/>
<rect y="${BASE}" width="${W}" height="${H - BASE}" fill="#0c0a08"/><rect y="${BASE - 1}" width="${W}" height="2" fill="#3a3128"/>`,
  },
};

// ---------------------------------------------------------------- Baby Bonfire

let hubParts;
/** The houses and the beacon, lifted from the hub street so the cards wear the page's own drawings. */
function hub() {
  if (hubParts) return hubParts;
  const html = readFileSync(resolve(ROOT, 'public/baby-bonfire/index.html'), 'utf8');
  const houses = new Map([...html.matchAll(/<a class="house" href="\/baby-bonfire\/([a-z-]+)\/"[^>]*>\s*<svg viewBox="0 0 100 100"[^>]*>(.*?)<\/svg>/gs)].map((m) => [m[1], m[2]]));
  const beacon = html.match(/<svg class="beacon" viewBox="0 0 92 70"[^>]*>(.*?)<\/svg>/s);
  if (!houses.size || !beacon) throw new Error('unfurl cards: could not read the houses and the beacon out of public/baby-bonfire/index.html');
  hubParts = { houses, order: [...houses.keys()], beacon: beacon[1].replace(/class="fire" /g, '') };
  return hubParts;
}

/** One house from the street, standing on `base`. `x` is its left edge; it is 100 * s wide. */
function house(slug, x, s, { lit = true, base = BASE, strip = false } = {}) {
  let g = hub().houses.get(slug);
  if (!g) throw new Error(`unfurl cards: no house for ${slug} on the hub street`);
  if (!strip) g = g.replace(/<rect x="0" y="91" width="100" height="3"[^>]*\/>/, '');
  // The page's halo sits behind the walls. On a card the light also spills past the roof and over the pane.
  const [, wx, wy] = g.match(/class="halo" cx="([\d.]+)" cy="([\d.]+)"/);
  const spill = lit ? `<circle cx="${wx}" cy="${wy}" r="46" fill="url(#bbGlow)" opacity=".8"/>` : '';
  const bloom = lit ? `<circle cx="${wx}" cy="${wy}" r="27" fill="url(#bbGlow)" opacity=".85"/>` : '';
  g = g
    .replace('class="halo"', lit ? '' : 'opacity="0"')
    .replace('class="pane"', `fill="${lit ? '#ffd27a' : '#1c1934'}"`)
    .replace('class="bars"', `fill="none" stroke-width="1.6" stroke="${lit ? '#b0692c' : '#100e22'}"`);
  return `<g transform="translate(${n(x)} ${n(base - 92 * s)}) scale(${s})">${spill}${g}${bloom}</g>`;
}

/** Houses per row for a street of `count`, top row first: 4, 5, then sixes, trimmed from the top to fit. */
export function hillRows(count) {
  const rows = [4, 5];
  const sum = () => rows.reduce((a, b) => a + b, 0);
  while (sum() < count) rows.push(6);
  for (let i = 0, over = sum() - count; over > 0; i += 1) {
    const cut = Math.min(over, rows[i] - (i ? 1 : 0));
    rows[i] -= cut;
    over -= cut;
  }
  return rows.filter(Boolean);
}

/** The hub: every window on the street lit, on a hillside, so the beacon on the hill is burning. */
function street() {
  const { order, beacon } = hub();
  const rows = hillRows(order.length);
  // Four rows fit at full size; a longer street draws smaller.
  const k = Math.min(1, 4 / rows.length);
  const s = 0.7 * k;
  const pitch = 74 * k;
  const step = 92 * k;
  const top = BASE - (rows.length - 1) * step - 92 * s - 26 * k;
  const out = [`<path d="M${MOTIF_X - 60} ${BASE}C${MOTIF_X + 30} ${n(top + 70)} ${MOTIF_CX - 120} ${n(top)} ${MOTIF_CX} ${n(top)}S${MOTIF_X + MOTIF_W - 30} ${n(top + 70)} ${MOTIF_X + MOTIF_W + 60} ${BASE}Z" fill="#231d3f"/>`];
  out.push(`<g transform="translate(${n(MOTIF_CX - 92 * k)} ${n(top - 122 * k)}) scale(${n(2 * k)})">${beacon}</g>`);
  let next = 0;
  rows.forEach((size, r) => {
    const x0 = MOTIF_CX - ((size - 1) * pitch + 100 * s) / 2;
    for (let i = 0; i < size; i += 1, next += 1) out.push(house(order[next], x0 + i * pitch, s, { base: BASE - (rows.length - 1 - r) * step, strip: r < rows.length - 1 }));
  });
  return out.join('');
}

/** A scene: its own house from the street with the window lit, the neighbours on either side still dark. */
function sceneHouse(card) {
  const { order } = hub();
  const i = order.indexOf(card.scene);
  const before = order[(i + order.length - 1) % order.length];
  const after = order[(i + 1) % order.length];
  return `<g opacity=".7">${house(before, MOTIF_X - 4, 1.5, { lit: false })}${house(after, MOTIF_X + MOTIF_W - 146, 1.5, { lit: false })}</g>`
    + `<ellipse cx="${MOTIF_CX}" cy="${BASE + 4}" rx="190" ry="8" fill="#ff9a4a" opacity=".22"/>`
    + house(card.scene, MOTIF_CX - 175, 3.5);
}

// The Roaming Shelf: the plan on the page, in dusk colours. Seventeen places, eight pieces,
// and the stone on its way from the desk to the window sill ("Workday over" on the page).
const PLACES = [[48, 64], [92, 64], [136, 64], [49, 160], [138, 160], [236, 40], [300, 40], [226, 140], [319, 147], [62, 262], [62, 334], [62, 400], [240, 290], [206, 346], [274, 346], [170, 436], [306, 436]];
const PIECES = [[48, 64], [138, 160], [226, 140], [240, 290], [306, 436], [300, 40], [62, 334]];
function plan() {
  const k = 0.88;
  const lighter = 'fill="#f3e9d8" fill-opacity=".2"';
  const darker = 'fill="#100e22" fill-opacity=".34"';
  const piece = ([x, y], r = 10) => `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#bbGlow)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd27a" stroke="#ff9a4a" stroke-width="3.5"/>`;
  return `<g transform="translate(${n(MOTIF_CX - 180 * k)} 86) scale(${k})">
<rect width="360" height="470" rx="8" fill="#100e22"/>
<rect x="6" y="6" width="170" height="202" fill="#3f6b6a"/><rect x="184" y="6" width="170" height="202" fill="#7c4f48"/>
<rect x="6" y="216" width="112" height="248" fill="#56607a"/><rect x="126" y="216" width="228" height="248" fill="#8a6a58"/>
<rect x="18" y="34" width="148" height="62" rx="6" ${lighter}/><rect x="26" y="134" width="46" height="52" rx="14" ${lighter}/><rect x="110" y="134" width="56" height="52" rx="4" ${darker}/>
<rect x="206" y="6" width="126" height="10" fill="#cfe0ea"/><rect x="204" y="18" width="130" height="44" rx="3" ${lighter}/>
<circle cx="268" cy="132" r="50" fill="#f3e9d8" fill-opacity=".14"/><circle cx="268" cy="132" r="36" fill="none" stroke="#f3e9d8" stroke-opacity=".3" stroke-width="4"/>
<rect x="196" y="108" width="50" height="62" rx="16" ${darker}/><circle cx="319" cy="147" r="23" ${darker}/>
<rect x="20" y="244" width="84" height="12" rx="6" ${darker}/><rect x="22" y="310" width="80" height="44" rx="8" ${lighter}/><rect x="20" y="380" width="84" height="44" rx="4" ${lighter}/>
<rect x="34" y="456" width="56" height="8" fill="#ff9a4a"/>
<circle cx="240" cy="326" r="72" ${darker}/><rect x="134" y="414" width="212" height="44" rx="4" ${lighter}/>
<g fill="#17152e" fill-opacity=".3" stroke="#f3e9d8" stroke-opacity=".85" stroke-width="2" stroke-dasharray="4.5 4">${PLACES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15"/>`).join('')}</g>
${PIECES.map((p) => piece(p)).join('')}
<path d="M92 64Q150 -4 236 40" fill="none" stroke="#ffd27a" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 10"/>
${piece([170, 22], 12)}
<rect width="360" height="470" rx="8" fill="none" stroke="#f3e9d8" stroke-opacity=".55" stroke-width="2.5"/>
</g>`;
}

// Mesh Street: four houses from the street and the three ways a signal travels on the page:
// a near hop, a rooftop radio, and an internet relay. The last house is still waiting.
function mesh() {
  const s = 1.2;
  const pitch = (MOTIF_W - 100 * s) / 3;
  const slugs = ['mesh-street', 'paired-hearths', 'weather-in-the-house', 'five-levels'];
  const tops = [-2, 13, 19, 17].map((y) => n(BASE - 92 * s + y * s));
  const cx = slugs.map((_, i) => n(MOTIF_X + i * pitch + 50 * s));
  const mast = [n((cx[2] + cx[3]) / 2), 170];
  const dot = (x, y, r = 6) => `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="url(#bbGlow)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd27a"/>`;
  return `${slugs.map((slug, i) => house(slug, MOTIF_X + i * pitch, s, { lit: i < 3 })).join('')}
<ellipse cx="${cx[0]}" cy="${BASE + 5}" rx="58" ry="8" fill="none" stroke="#ffd27a" stroke-width="3"/>
<g fill="none" stroke-linecap="round">
<path d="M${cx[0]} ${tops[0]}Q${n((cx[0] + cx[1]) / 2)} ${tops[0] - 62} ${cx[1]} ${tops[1]}" stroke="#ff9a4a" stroke-width="4"/>
<path d="M${cx[1]} ${tops[1]}Q${n((cx[1] + cx[2]) / 2)} ${tops[1] - 150} ${cx[2]} ${tops[2]}" stroke="#ffd27a" stroke-width="4" stroke-dasharray="12 10"/>
<path d="M${cx[2]} ${tops[2]}L${mast[0]} ${mast[1]}L${cx[3]} ${tops[3]}" stroke="#c3b8cc" stroke-width="4" stroke-dasharray="1 10"/>
<path d="M${mast[0] - 15} ${mast[1] + 40}L${mast[0]} ${mast[1]}L${mast[0] + 15} ${mast[1] + 40}M${mast[0] - 9} ${mast[1] + 24}H${mast[0] + 9}" stroke="#c3b8cc" stroke-width="3"/>
</g>
${dot(n((cx[0] + cx[1]) / 2), n((tops[0] + tops[1]) / 2 - 31))}${dot(n((cx[1] + cx[2]) / 2), n((tops[1] + tops[2]) / 2 - 75))}${dot(mast[0], mast[1], 7)}`;
}

// ---------------------------------------------------------------- Coast Commons

const INK = '#1f2a25';
/** The hand-cut corners of the cards on the Coast Commons pages (cc.css .strip, .house). */
function corners(x, y, w, h) {
  const [a, b, c, d] = [26, 10, 28, 12];
  return `M${x + a} ${y}H${x + w - b}Q${x + w} ${y} ${x + w} ${y + b}V${y + h - c}Q${x + w} ${y + h} ${x + w - c} ${y + h}H${x + d}Q${x} ${y + h} ${x} ${y + h - d}V${y + a}Q${x} ${y} ${x + a} ${y}Z`;
}
/** A paper card with an ink edge and a sand shadow, holding a drawing `view` units big. */
function paper(w, h, view, inner) {
  const x = Math.round(MOTIF_CX - (w + 9) / 2);
  const y = Math.round((64 + BASE - 8) / 2 - (h + 9) / 2);
  return `<path d="${corners(x + 9, y + 9, w, h)}" fill="#b98f55"/>
<clipPath id="ccCard"><path d="${corners(x, y, w, h)}"/></clipPath>
<g clip-path="url(#ccCard)"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${view}" preserveAspectRatio="xMidYMid slice">${inner}</svg></g>
<path d="${corners(x, y, w, h)}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
}

/** The hub: the coast strip, north at the top, one stop per town, a house where El Segundo is. */
function coast() {
  const w = 300;
  const h = 432;
  const gap = (h - 64) / (TOWNS.length - 1);
  const pts = TOWNS.map((_, i) => [n(124 + 28 * Math.sin(i * 0.9) + (i > 9 ? (i - 9) * 7.5 : 0)), n(32 + i * gap)]);
  let shore = `M${pts[0][0]} 0L${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) shore += `C${pts[i - 1][0]} ${n(pts[i - 1][1] + gap * 0.42)} ${pts[i][0]} ${n(pts[i][1] - gap * 0.42)} ${pts[i][0]} ${pts[i][1]}`;
  shore += `L${pts[pts.length - 1][0]} ${h}`;
  const waves = Array.from({ length: 9 }, (_, k) => `<path d="M${12 + (k % 3) * 14} ${28 + k * 46}q8 -6 16 0t16 0t16 0"/>`).join('');
  const kelp = [3, 7, 11, 14].map((i) => `<path d="M${pts[i][0] - 40} ${n(pts[i][1] + 18)}q-6 -8 0 -16q6 -8 0 -16"/>`).join('');
  const stops = TOWNS.map((t, i) => {
    const [x, y] = pts[i];
    if (!t.flagship) return `<circle cx="${x}" cy="${y}" r="7.5" fill="#b5532f" stroke="${INK}" stroke-width="2.2"/>`;
    return `<path d="M${x - 14} ${y + 6}v-13l14 -12l14 12v13z" fill="#1d4a5c" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x - 4} ${y + 6}v-8h8v8" fill="#f7f1e3"/>`
      + type({ text: t.name, x: x + 24, y: y + 6, size: 19, fill: '#123240', weight: 0.045 });
  }).join('');
  return paper(w, h, `0 0 ${w} ${h}`, `<rect width="${w}" height="${h}" fill="#9fc0c4"/>
<g fill="none" stroke="#e9f3f1" stroke-width="1.8" stroke-linecap="round" opacity=".85">${waves}</g>
<path d="${shore}L${w} ${h}L${w} 0Z" fill="#dcbd8c"/><path d="${shore}" fill="none" stroke="#f7ecd2" stroke-width="9" stroke-linecap="round"/>
<g fill="none" stroke="#3d5a2c" stroke-width="3" stroke-linecap="round">${kelp}</g>
<g transform="translate(34 ${h - 40})"><circle r="17" fill="#f7f1e3" stroke="${INK}" stroke-width="1.8"/><path d="M0 -12L5 4L0 0L-5 4Z" fill="#b5532f"/></g>
${stops}`);
}

/** The El Segundo house: the page's own drawing. A gabled house on the bluff and ten seats in a ring. */
function tenSeats() {
  const seats = Array.from({ length: 10 }, (_, i) => `<circle cx="${n(160 + 62 * Math.sin(i * Math.PI / 5))}" cy="${n(196 - 30 * Math.cos(i * Math.PI / 5))}" r="7"/>`).join('');
  return paper(412, 322, '0 0 320 250', `<rect width="320" height="250" fill="#dfe7e2"/><circle cx="262" cy="52" r="22" fill="#e9b872"/>
<path d="M0 96q40 -14 80 0t80 0t80 0t80 0v24H0Z" fill="#f4f6f1" opacity=".9"/><path d="M0 118H320V150H0Z" fill="#6f9aa3"/>
<path d="M0 150q80 -16 160 -6t160 -4V250H0Z" fill="#dcbd8c"/>
<path d="M96 150V104L150 66L204 104V150Z" fill="#f7f1e3" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M88 108L150 62L212 108" fill="none" stroke="#b5532f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="140" y="118" width="20" height="32" fill="#1d4a5c" stroke="${INK}" stroke-width="2"/>
<g fill="#bcd3d8" stroke="${INK}" stroke-width="2"><rect x="108" y="114" width="20" height="16"/><rect x="172" y="114" width="20" height="16"/></g>
<path d="M222 150V100M246 150V100M222 112H246M222 132H246" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
<path d="M228 96q6 -30 12 0v52h-12Z" fill="#3d5a2c" stroke="${INK}" stroke-width="2"/>
<ellipse cx="160" cy="196" rx="62" ry="30" fill="none" stroke="#b98f55" stroke-width="2" stroke-dasharray="5 5"/>
<g fill="#b5532f" stroke="${INK}" stroke-width="2">${seats}</g>`);
}

/** The pattern: the six ingredients of the recipe, in the page's order. */
const INGREDIENTS = ['The first ten people', 'A rented weekend first', 'House rules', 'Open books', 'Use-rights, not ownership', 'A public-good share'];
function recipe() {
  const rows = INGREDIENTS.map((name, i) => {
    const y = 120 + i * 47;
    return `<circle cx="50" cy="${y}" r="17" fill="#b5532f" stroke="${INK}" stroke-width="2.4"/>`
      + type({ text: String(i + 1), x: 50, y: y + 7, size: 20, fill: '#fff8ec', weight: 0.05, anchor: 'middle' })
      + type({ text: name, x: 84, y: y + 7.5, size: 22, fill: INK });
  }).join('');
  return paper(404, 404, '0 0 404 404', `<rect width="404" height="404" fill="#f7f1e3"/>
<rect x="32" y="32" width="62" height="9" rx="4" fill="#b5532f"/>
${type({ text: 'Six ingredients', x: 32, y: 78, size: 28, fill: '#27401f', weight: 0.04 })}
<path d="M50 120V355" stroke="#b98f55" stroke-width="5"/>${rows}`);
}

/** SB Surf House: the page's hero drawing in Coast Commons colours, without the surfer. */
function surfHouse() {
  return paper(412, 300, '129 40 261 190', `<rect width="390" height="230" fill="#dfe7e2"/>
<path d="M0 96L28 78L60 88L96 62L128 80L170 54L214 76L250 60L300 82L340 66L390 84L390 140L0 140Z" fill="#b9c8c4"/>
<path d="M0 112L40 98L90 108L140 90L200 106L260 94L320 110L390 100L390 150L0 150Z" fill="#8fa8a4"/>
<g fill="#f4f6f1"><ellipse cx="110" cy="104" rx="150" ry="11" opacity=".85"/><ellipse cx="330" cy="92" rx="110" ry="8" opacity=".7"/><ellipse cx="250" cy="120" rx="190" ry="10" opacity=".9"/></g>
<rect y="130" width="390" height="100" fill="#6f9aa3"/>
<g fill="#3d5a2c" opacity=".8"><ellipse cx="70" cy="158" rx="34" ry="3"/><ellipse cx="120" cy="166" rx="26" ry="2.5"/><ellipse cx="44" cy="172" rx="22" ry="2.5"/><ellipse cx="170" cy="154" rx="18" ry="2"/></g>
<path d="M0 196C40 186 70 190 104 198C140 206 170 190 214 192C236 193 250 200 262 206L262 230L0 230Z" fill="#e9f3f1" opacity=".92"/>
<path d="M104 198C140 206 170 190 214 192" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
<path d="M236 230L250 170L262 150L286 138L390 132L390 230Z" fill="#dcbd8c"/>
<path d="M254 176L300 170M258 196L330 188M250 214L310 208" stroke="#b98f55" stroke-width="1.8"/>
<path d="M262 150L286 138L390 132L390 140L290 146L266 156Z" fill="#6f8f57"/>
<path d="M356 134L358 84M378 132L379 100" stroke="#c9bfa6" stroke-width="3" fill="none"/>
<ellipse cx="358" cy="80" rx="15" ry="20" fill="#6f8f57"/><ellipse cx="346" cy="92" rx="10" ry="14" fill="#3d5a2c"/><ellipse cx="371" cy="94" rx="10" ry="15" fill="#86a374"/><ellipse cx="380" cy="96" rx="9" ry="13" fill="#6f8f57"/>
<rect x="296" y="112" width="44" height="24" fill="#f7f1e3"/><path d="M290 113L318 98L346 113Z" fill="#b5532f"/><rect x="304" y="120" width="8" height="16" fill="#1d4a5c"/><rect x="320" y="118" width="12" height="8" fill="#bcd3d8"/>
<path d="M343 136L346 108" stroke="#f7ecd2" stroke-width="2.5" stroke-linecap="round"/><path d="M348 136L350 112" stroke="#b5532f" stroke-width="2.5" stroke-linecap="round"/>`);
}

/** Fresh Milk, Local: the page's hero drawing in Coast Commons colours. A cow, a barn, fog, a bottle. */
function freshMilk() {
  return paper(412, 309, '0 0 320 240', `<rect width="320" height="240" fill="#dfe7e2"/><circle cx="254" cy="42" r="21" fill="#e9b872"/>
<g fill="#f4f6f1"><rect x="-10" y="28" width="180" height="12" rx="6"/><rect x="118" y="50" width="220" height="12" rx="6"/><rect x="14" y="68" width="140" height="10" rx="5"/></g>
<rect y="86" width="320" height="42" fill="#6f9aa3"/>
<path d="M18 98h26M84 108h30M150 96h22M210 110h28M276 100h24" stroke="#e9f3f1" stroke-width="2" stroke-linecap="round"/>
<path d="M0 138C50 110 110 114 170 132S280 144 320 126V240H0Z" fill="#6f8f57"/><path d="M0 176C60 152 130 156 200 174S290 182 320 170V240H0Z" fill="#3d5a2c"/>
<g transform="translate(-12 14)" stroke="${INK}" stroke-width="2"><path d="M34 128v-22l17-13l17 13v22z" fill="#b5532f"/><rect x="45" y="112" width="12" height="16" fill="#f7f1e3"/><path d="M45 112l12 16M57 112l-12 16" stroke-width="1.5"/></g>
<g transform="translate(-46 24)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
<path d="M128 150v22M144 152v20M178 152v20M194 150v22" stroke-width="5" stroke-linecap="round"/>
<rect x="118" y="118" width="88" height="40" rx="16" fill="#f7f1e3"/>
<path d="M140 119c10 8 22 6 26 16s-12 16-22 10s-10-18-4-26z" fill="${INK}" stroke="none"/><path d="M186 140c6-4 12 0 12 6s-8 8-12 4z" fill="${INK}" stroke="none"/>
<rect x="196" y="104" width="34" height="30" rx="10" fill="#f7f1e3"/><rect x="212" y="122" width="22" height="14" rx="7" fill="#e7b9a5"/>
<path d="M198 106l-8-6M228 106l8-6" stroke-linecap="round"/><circle cx="208" cy="116" r="2" fill="${INK}"/><circle cx="222" cy="116" r="2" fill="${INK}"/>
<path d="M118 126c-8 4-10 14-8 22" fill="none" stroke-linecap="round"/><path d="M156 158c2 8 12 8 14 0" fill="#e7b9a5"/></g>
<g transform="translate(-52 42)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
<path d="M296 84h28v14c0 8 14 14 14 30v44a6 6 0 0 1-6 6h-44a6 6 0 0 1-6-6v-44c0-16 14-22 14-30z" fill="#bcd3d8"/>
<path d="M284 132h52v40a4 4 0 0 1-4 4h-44a4 4 0 0 1-4-4z" fill="#f7f1e3" stroke="none"/>
<rect x="292" y="76" width="36" height="9" rx="3" fill="#b5532f"/><path d="M292 142h36M296 152h28" stroke="#1d4a5c" stroke-width="3" stroke-linecap="round"/></g>`);
}

// ---------------------------------------------------------------- House Channel

const CREAM = '#f3ead9';
function flame(x, base, w, h, fill) {
  const [l, r] = [x - w / 2, x + w / 2];
  return `<path d="M${n(x)} ${n(base - h)}C${n(x + w * 0.18)} ${n(base - h * 0.62)} ${n(r)} ${n(base - h * 0.46)} ${n(r)} ${n(base - h * 0.2)}C${n(r)} ${n(base + h * 0.03)} ${n(l)} ${n(base + h * 0.03)} ${n(l)} ${n(base - h * 0.2)}C${n(l)} ${n(base - h * 0.46)} ${n(x - w * 0.18)} ${n(base - h * 0.62)} ${n(x)} ${n(base - h)}Z" fill="${fill}"/>`;
}
/** The hearth view as public/house/tv.js draws it: a stone, two logs along and one across, five flames. */
function hearth(cx, floor, u) {
  const logs = [[-8, -0.6, 21, 9], [8, -0.6, 21, -9], [0, -5, 20, 2]].map(([dx, dy, len, turn]) => `<g transform="translate(${n(cx + dx * u)} ${n(floor - 2.1 * u + dy * u)}) rotate(${turn})"><rect x="${n(-len * u / 2)}" y="${n(-2 * u)}" width="${n(len * u)}" height="${n(4 * u)}" fill="#3a2416"/><rect x="${n(-len * u / 2)}" y="${n(0.6 * u)}" width="${n(len * u)}" height="${n(1.4 * u)}" fill="#000" opacity=".35"/><rect x="${n(-len * u / 2)}" y="${n(-2 * u)}" width="${n(len * u)}" height="${n(0.9 * u)}" fill="#ff6e28" opacity=".4"/><circle cx="${n(len * u / 2)}" cy="0" r="${n(2 * u)}" fill="#6b4a30"/></g>`).join('');
  const w = 23 * u;
  const h = 36 * u;
  const base = floor - 2.5 * u;
  return `<rect x="${n(cx - 34 * u)}" y="${n(floor)}" width="${n(68 * u)}" height="${n(3.2 * u)}" fill="#1b1511"/>${logs}`
    + flame(cx, base, w * 1.25, h * 0.92, '#d23c14')
    + flame(cx - w * 0.28, base, w * 0.6, h * 0.7, '#ff781e')
    + flame(cx + w * 0.3, base, w * 0.55, h * 0.62, '#ff781e')
    + flame(cx, base, w * 0.8, h * 0.85, '#ffaa32')
    + flame(cx + w * 0.04, base, w * 0.42, h * 0.5, '#ffecaa');
}
/** A screen: dark glass, a cream edge, whatever is on. */
function screen(x, y, w, h, id, inner, edge = 3) {
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#060403"/><g clip-path="url(#${id})">${inner}</g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${CREAM}" stroke-width="${edge}"/>`;
}
const fireGlow = (id, cx, cy, r) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff963c" stop-opacity=".62"/><stop offset="1" stop-color="#ff963c" stop-opacity="0"/></radialGradient>`;

/** The TV page: a TV on a low cabinet showing the hearth, and a phone as its remote. */
function tv() {
  const [x, y, w, h] = [MOTIF_X + 14, 102, 392, 220];
  const cx = x + w / 2;
  const floor = y + h * 0.8;
  const phone = `<g transform="rotate(-9 1076 404)"><rect x="1026" y="312" width="100" height="184" rx="15" fill="#14110e" stroke="${CREAM}" stroke-width="3"/>
<circle cx="1042" cy="333" r="4" fill="#ffb454"/><rect x="1052" y="330" width="42" height="5" rx="2.5" fill="#9c9282"/>
<g fill="none" stroke="#3a3128" stroke-width="2"><rect x="1038" y="348" width="17" height="12" rx="2" stroke="#ffb454"/><rect x="1059" y="348" width="17" height="12" rx="2"/><rect x="1080" y="348" width="17" height="12" rx="2"/><rect x="1101" y="348" width="17" height="12" rx="2"/></g>
<circle cx="1076" cy="412" r="33" fill="#ffb454"/>${flame(1076, 432, 26, 44, '#1a1408')}
<rect x="1040" y="462" width="72" height="14" rx="3" fill="none" stroke="#3a3128" stroke-width="2"/></g>`;
  return `<defs>${fireGlow('hcFire', cx, floor - 20, 190)}</defs>
<rect x="${MOTIF_X}" y="${y + h + 34}" width="${MOTIF_W}" height="${BASE - 14 - (y + h + 34)}" fill="#1a1612" stroke="#3a3128" stroke-width="2"/>
<path d="M${MOTIF_CX} ${y + h + 44}V${BASE - 24}M${MOTIF_X + 20} ${BASE - 14}V${BASE}M${MOTIF_X + MOTIF_W - 20} ${BASE - 14}V${BASE}" stroke="#3a3128" stroke-width="2.5"/>
<path d="M${cx} ${y + h}V${y + h + 30}M${cx - 62} ${y + h + 31}H${cx + 62}" stroke="${CREAM}" stroke-width="4" stroke-linecap="round"/>
${screen(x, y, w, h, 'hcTv', `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#hcFire)"/><rect x="${x}" y="${n(floor + 10)}" width="${w}" height="${h}" fill="#0f0b08"/>${hearth(cx, floor, 3.7)}`, 4)}
${phone}`;
}

/** The about page: the four views, each on a small screen. */
function fourViews() {
  const [w, h, gx, gy] = [198, 112, 24, 62];
  const x0 = MOTIF_X;
  const y0 = 128;
  const tile = (i, name, inner) => {
    const x = x0 + (i % 2) * (w + gx);
    const y = y0 + Math.floor(i / 2) * (h + gy);
    return screen(x, y, w, h, `hcView${i}`, inner(x, y), 2.5) + type({ text: name, x: x + w / 2, y: y + h + 30, size: 17, fill: '#9c9282', family: MONO, spacing: 3.4, anchor: 'middle' });
  };
  const lights = [[26, 82, '#ffb454'], [60, 66, '#8fc7e8'], [96, 74, '#1c2029'], [130, 52, '#ffb454'], [166, 44, '#f08fb0'], [84, 98, '#f08fb0'], [148, 84, '#8fc7e8']];
  const pads = Array.from({ length: 8 }, (_, i) => [22 + (i % 4) * 40, 20 + Math.floor(i / 4) * 40, i === 1 || i === 6]);
  return `<defs>${fireGlow('hcFire', x0 + w / 2, y0 + h * 0.7, 96)}<linearGradient id="hcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101638"/><stop offset=".62" stop-color="#4a5488"/><stop offset="1" stop-color="#e39a5c"/></linearGradient></defs>
${tile(0, 'HEARTH', (x, y) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#hcFire)"/><rect x="${x}" y="${y + h * 0.82 + 5}" width="${w}" height="${h}" fill="#0f0b08"/>${hearth(x + w / 2, y + h * 0.82, 1.7)}`)}
${tile(1, 'WINDOW', (x, y) => `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.72}" fill="url(#hcSky)"/><circle cx="${x + 140}" cy="${y + 62}" r="9" fill="#ffecbe"/><rect x="${x}" y="${y + 18}" width="${w}" height="13" fill="#8c93a8" opacity=".5"/><rect x="${x}" y="${n(y + h * 0.72)}" width="${w}" height="${h}" fill="#0d1428"/><path d="M${x + 18} ${y + 92}h34M${x + 78} ${y + 100}h40M${x + 138} ${y + 91}h30" stroke="#5a6690" stroke-width="2.5" stroke-linecap="round"/>`)}
${tile(2, 'LIGHTS', (x, y) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#090c1c"/><path d="M${x} ${y + 100}Q${x + 104} ${y + 50} ${x + w} ${y + 34}V${y + h}H${x}Z" fill="#161b2b"/>${lights.map(([dx, dy, fill]) => `<rect x="${x + dx - 11}" y="${y + dy - 12}" width="22" height="24" fill="#0b0d14"/><rect x="${x + dx - 5.5}" y="${y + dy - 7}" width="11" height="12" fill="${fill}"/>`).join('')}`)}
${tile(3, 'DRUM', (x, y) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#080a12"/>${pads.map(([dx, dy, on]) => `<rect x="${x + dx}" y="${y + dy}" width="32" height="32" rx="4" fill="${on ? '#ffb454' : '#14110e'}" stroke="${on ? '#ffb454' : '#3a3128'}" stroke-width="2"/>`).join('')}`)}`;
}

// A Higher Purpose: the page's island of square tiles seen from above at an angle, in the page's
// own sixteen colours: a hearth at the centre, a pier, four white posts and a ring of stones.
function island() {
  const cx = MOTIF_CX, cy = 330, tw = 21, th = 10.5;
  const at = (gx, gz) => [cx + (gx - gz) * tw, cy + (gx + gz) * th];
  const out = [];
  // water: short strokes in rows, lighter near the shore
  for (let r = 0; r < 26; r++) for (let i = 0; i < 9; i++) {
    const y = 196 + r * 12, x = MOTIF_X - 20 + ((i * 53 + r * 29) % 460);
    out.push(`<rect x="${x}" y="${y}" width="${14 + ((i * r) % 3) * 8}" height="3" fill="${(i + r) % 4 ? '#3f86a0' : '#8fd3d0'}" opacity=".8"/>`);
  }
  const tiles = [];
  for (let gz = -6; gz <= 6; gz++) for (let gx = -6; gx <= 6; gx++) {
    const d = Math.hypot(gx, gz), edge = 5 + 0.5 * Math.sin(gx * 1.7 + gz * 0.9);
    if (d <= edge) tiles.push([gx, gz, d > edge - 1.1]);
  }
  tiles.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  for (const [gx, gz, shore] of tiles) {
    const [x, y] = at(gx, gz);
    const lift = gz <= -3 && gz >= -5 && Math.abs(gx) <= 1 ? 8 : 0;
    const top = lift ? '#b4c46a' : shore || ((gx === 0 || gz === 0) && Math.hypot(gx, gz) < 4) ? '#b08a5e' : (gx + gz) & 1 ? '#5f8f43' : '#4f7d3a';
    out.push(`<path d="M${x - tw} ${y - lift}L${x} ${y + th - lift}L${x + tw} ${y - lift}V${y + 12}L${x} ${y + th + 12}L${x - tw} ${y + 12}Z" fill="#6b4a38"/>`);
    out.push(`<path d="M${x} ${y - th - lift}L${x + tw} ${y - lift}L${x} ${y + th - lift}L${x - tw} ${y - lift}Z" fill="${top}"/>`);
  }
  const block = (x, y, w, h, fill) => `<rect x="${n(x - w / 2)}" y="${n(y - h)}" width="${w}" height="${h}" fill="${fill}"/>`;
  // the pier, east (down and right on the drawing)
  for (let i = 0; i < 5; i++) { const [x, y] = at(5 + i * 0.5, 0); out.push(block(x, y + 4, 24, 5, i % 2 ? '#b08a5e' : '#9c7a52')); }
  const [lx, ly] = at(7.3, 0); out.push(block(lx, ly, 5, 40, '#6b4a38'), `<circle cx="${lx}" cy="${ly - 46}" r="22" fill="url(#bbGlow)"/>`, block(lx, ly - 38, 12, 12, '#8fd3d0'));
  // the stones, west (up and left)
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.4; const [x, y] = at(-4 + Math.cos(a), Math.sin(a)); out.push(block(x, y, 15, 26 + (i * 7) % 14, '#5a3558'), block(x - 3.5, y, 7, 26 + (i * 7) % 14, '#7a4a6e')); }
  // the posts and floating cubes, north (up and right)
  for (const [gx, gz] of [[-0.8, -3.4], [0.8, -3.4], [-0.8, -5], [0.8, -5]]) { const [x, y] = at(gx, gz); out.push(block(x, y - 8, 7, 62, '#f3e9d8')); }
  const [ax, ay] = at(0, -4.2); out.push(block(ax, ay - 74, 12, 12, '#8fd3d0'), block(ax + 12, ay - 92, 8, 8, '#8fd3d0'));
  // trees
  for (const [gx, gz] of [[2.4, 2.6], [-2.6, 2.9], [3, -2.4], [-2.8, -2.6]]) { const [x, y] = at(gx, gz); out.push(block(x, y, 6, 16, '#6b4a38'), block(x, y - 14, 28, 18, '#2f5a3a'), block(x, y - 30, 18, 14, '#3f6e44')); }
  // the hearth and its fire, at the centre
  const [hx, hy] = at(0, 0);
  out.push(`<circle cx="${hx}" cy="${hy - 34}" r="64" fill="url(#bbGlow)"/>`, block(hx, hy + 6, 44, 12, '#a8554a'), block(hx, hy - 4, 26, 16, '#d23c14'), block(hx - 1, hy - 18, 18, 16, '#ff9a4a'), block(hx + 1, hy - 32, 12, 14, '#ffd27a'), block(hx, hy - 44, 6, 10, '#f3e9d8'));
  // motes
  for (const [x, y] of [[760, 150], [812, 108], [902, 134], [1010, 96], [1080, 160], [1120, 118], [954, 180], [850, 200]]) out.push(`<rect x="${x}" y="${y}" width="5" height="5" fill="#f3e9d8" opacity=".85"/>`);
  return out.join('');
}

const MOTIFS = { street, house: sceneHouse, island, plan, mesh, coast, tenSeats, recipe, surfHouse, freshMilk, tv, fourViews };


// ---------------------------------------------------------------- a card that is a photograph

/** Prayer Fire: the page's poster, cover-cropped so the hearth is in frame, words low on the right. */
function photoCard(card) {
  const jpeg = readFileSync(resolve(ROOT, card.photo)).toString('base64');
  const [pw, ph] = [720, 950]; // the poster's own size
  const k = W / pw;
  const top = -640; // puts the hearth, from its lid to its feet, inside the 630 rows
  const x = 668;
  const lines = [
    { text: card.headline[0], x, y: 448, size: 76, fill: '#f6ead6', weight: 0.04, spacing: -1 },
    ...card.line.map((text, i) => ({ text, x, y: 500 + i * 38, size: 29, fill: '#e6d7bf' })),
    { text: 'pointcast.xyz', x, y: FOOT, size: 24, fill: '#d9c6a6', family: MONO, spacing: 0.6 },
    { text: 'concept sketch', x: W - 56, y: FOOT, size: 20, fill: '#bfae90', family: MONO, spacing: 0.8, anchor: 'end' },
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="phLow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0805" stop-opacity="0"/><stop offset=".45" stop-color="#0d0805" stop-opacity=".55"/><stop offset="1" stop-color="#0d0805" stop-opacity=".92"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="#3a2d24"/>
<image x="0" y="${top}" width="${W}" height="${n(ph * k)}" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${jpeg}" xlink:href="data:image/jpeg;base64,${jpeg}"/>
<rect y="300" width="${W}" height="${H - 300}" fill="url(#phLow)"/>
${lines.map(type).join('\n')}
</svg>`;
  return { svg, lines, column: [x, W - 56], photo: true };
}

// ---------------------------------------------------------------- the card

/**
 * The words: a small kicker, the headline as large as its longest row allows, and the line
 * that says what you can do there, centred as a block above the foot. `measure` returns the
 * drawn width of one line of type. Returns the lines, so build.mjs can check that each fits.
 */
function words(card, a, measure) {
  const headline = (text, size, y = 0) => ({ text, x: TEXT_X - size * 0.05, y, size, fill: a.head, weight: 0.04, spacing: -size * 0.012 });
  // Every measure of a headline grows with its size, so one reading at 100 gives the fit.
  const at100 = Math.max(...card.headline.map((t) => measure(headline(t, 100))));
  const size = Math.min(108, Math.floor((100 * TEXT_W) / at100 / 2) * 2);
  const lead = Math.round(size * 1.04);
  const cap = size * 0.727;
  const rowSize = 36;
  const rowLead = 47;
  const tall = 16 + 30 + cap + (card.headline.length - 1) * lead + 34 + 26 + (card.line.length - 1) * rowLead;
  let y = 58 + (438 - tall) / 2;
  const out = [{ text: card.kicker, x: TEXT_X, y: y + 16, size: 22, fill: a.kick, ...a.kicker }];
  y += 16 + 30 + cap;
  card.headline.forEach((t, i) => out.push(headline(t, size, y + i * lead)));
  y += (card.headline.length - 1) * lead + 34 + 26;
  card.line.forEach((t, i) => out.push({ text: t, x: TEXT_X, y: y + i * rowLead, size: rowSize, fill: a.body }));
  return out;
}

/** The foot: the site mark on the left, the area's small type on the right. */
function foot(card, a) {
  return [
    { text: 'pointcast.xyz', x: TEXT_X + 27, y: FOOT, size: 27, fill: a.mark, family: MONO, spacing: 0.6 },
    { text: STATUS[card.area], x: W - 56, y: FOOT, size: 22, fill: a.small, family: MONO, spacing: 0.8, anchor: 'end' },
  ];
}

/** One card as an SVG string, and the lines of type on it with the column they must stay inside. */
export function cardSvg(card, measure) {
  if (card.motif === 'photo') return photoCard(card);
  const a = AREAS[card.area];
  const motif = MOTIFS[card.motif];
  if (!a || !motif) throw new Error(`unfurl cards: ${card.path} names an unknown area or motif`);
  const lines = [...words(card, a, measure), ...foot(card, a)];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${a.back()}
${motif(card)}
${lines.map(type).join('\n')}
<circle cx="${TEXT_X + 9}" cy="${FOOT - 9}" r="8" fill="${a.accent}"/>
</svg>`;
  return { svg, lines, column: [TEXT_X, TEXT_X + TEXT_W] };
}
