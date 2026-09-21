// The paddle plate — an original, to-scale technical drawing of a paddle,
// generated from its published dimensions. Left half of the face shows the
// hitting surface, right half is cut away to the core, with each layer
// numbered from the center outward. A side profile shows thickness to scale.
//
// Plain .mjs on purpose: the Astro pages import it and so does
// scripts/og-paddle-cards.mjs, which runs outside Astro's module graph.
// These are drawings, not product photos: no brand graphics are reproduced.

/** Nominal outlines by shape, used only when a paddle's own dimensions are not published. */
export const NOMINAL = {
  elongated: { lengthIn: 16.5, widthIn: 7.5, handleIn: 5.5 },
  hybrid: { lengthIn: 16.25, widthIn: 7.7, handleIn: 5.5 },
  widebody: { lengthIn: 16, widthIn: 8, handleIn: 5.25 },
  standard: { lengthIn: 16, widthIn: 8, handleIn: 5.25 },
};

const TOP = {
  // corner radius (in) and vertical stretch of the top corners
  elongated: { r: 1.5, stretch: 1 },
  hybrid: { r: 2.5, stretch: 1.3 },
  widebody: { r: 2.1, stretch: 1.05 },
  standard: { r: 1.9, stretch: 1 },
};

const FALLBACK_LAYERS = {
  foam: ['Foam core'],
  hybrid: ['Polymer honeycomb', 'Foam perimeter'],
  poly: ['Polymer honeycomb'],
  rib: ['Carbon ribs and foam'],
  unknown: ['Core not published'],
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v) => Number(v.toFixed(2));

export function shapeOf(text) {
  const t = String(text || '').toLowerCase();
  if (/elong/.test(t)) return 'elongated';
  if (/hybrid|aero/.test(t)) return 'hybrid';
  if (/wide/.test(t)) return 'widebody';
  if (/standard|square/.test(t)) return 'standard';
  return null;
}

/** What kind of fill a core layer gets, read off its description. */
export function layerKind(text) {
  const t = String(text || '').toLowerCase();
  if (/rib|sst/.test(t)) return 'rib';
  if (/honeycomb|polymer|polypropylene|\bpp\b/.test(t) && !/foam/.test(t.replace(/polypropylene foam/, ''))) return 'hex';
  if (/honeycomb/.test(t)) return 'hex';
  if (/eva|tpu|ring|band|perimeter|edge|wall/.test(t)) return 'ring';
  return 'foam';
}

/** Resolve the geometry a plate is drawn from, and say whether it is the paddle's own. */
export function plateGeometry(variant, fallbackShape) {
  const shape = shapeOf(variant?.shape) || shapeOf(fallbackShape) || 'elongated';
  const nominal = NOMINAL[shape];
  // Published specs are sometimes ranges ("7.5-7.7"); only plain numbers are drawn.
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
  const length = num(variant?.lengthIn), width = num(variant?.widthIn), handle = num(variant?.handleIn);
  const own = Boolean(length && width);
  return {
    shape,
    own,
    lengthIn: own ? length : nominal.lengthIn,
    widthIn: own ? width : nominal.widthIn,
    handleIn: handle && handle < (own ? length : nominal.lengthIn) - 8 ? handle : nominal.handleIn,
    handleOwn: Boolean(handle),
    thicknessMm: Number.isFinite(Number(variant?.thicknessMm)) && Number(variant?.thicknessMm) > 0 ? Number(variant.thicknessMm) : null,
  };
}

function outline({ lengthIn: L, widthIn: W, handleIn: Hh, shape }) {
  const F = L - Hh; // where the face ends and the handle starts
  const hw = 1.3; // grip width
  const sh = Math.min(2.6, F * 0.24); // shoulder height
  const { r, stretch } = TOP[shape];
  const ry = r * stretch;
  const x = W / 2;
  return [
    `M${n(-hw / 2)} ${n(L)}`,
    `L${n(-hw / 2)} ${n(F)}`,
    `C${n(-hw / 2)} ${n(F - sh * 0.55)} ${n(-x)} ${n(F - sh * 0.4)} ${n(-x)} ${n(F - sh)}`,
    `L${n(-x)} ${n(ry)}`,
    `A${n(r)} ${n(ry)} 0 0 1 ${n(-x + r)} 0`,
    `L${n(x - r)} 0`,
    `A${n(r)} ${n(ry)} 0 0 1 ${n(x)} ${n(ry)}`,
    `L${n(x)} ${n(F - sh)}`,
    `C${n(x)} ${n(F - sh * 0.4)} ${n(hw / 2)} ${n(F - sh * 0.55)} ${n(hw / 2)} ${n(F)}`,
    `L${n(hw / 2)} ${n(L)}`,
    'Z',
  ].join(' ');
}

/**
 * @param {object} o
 * @param {object} [o.variant]   { shape, lengthIn, widthIn, handleIn, thicknessMm }
 * @param {string} [o.shapes]    free-text shapes line, used when the variant has no shape
 * @param {string} o.build       foam | hybrid | poly | rib | unknown
 * @param {string[]} [o.layers]  core layers, center outward
 * @param {string} o.color       build colour
 * @param {string} [o.id]        unique prefix for clip/pattern ids
 * @param {boolean} [o.dims]     draw dimension lines and the side profile
 * @param {string} [o.ink] @param {string} [o.muted] @param {string} [o.paper]
 * @returns {{ svg: string, layers: {n:number,text:string,kind:string}[], geometry: object, viewBox: number[] }}
 */
export function paddlePlate({ variant, shapes, build = 'unknown', layers, color = '#3B6D11', id = 'pl', dims = true, ink = '#12110E', muted = '#5F5E5A', paper = '#ffffff', mono = "'JetBrains Mono Variable','JetBrains Mono',ui-monospace,Menlo,monospace" }) {
  const g = plateGeometry(variant, shapes);
  const { lengthIn: L, widthIn: W, handleIn: Hh } = g;
  const F = L - Hh;
  const path = outline(g);
  const list = (layers && layers.length ? layers : FALLBACK_LAYERS[build] || FALLBACK_LAYERS.unknown).slice(0, 4);
  const zones = list.map((text, i) => ({ n: i + 1, text, kind: layerKind(text) }));
  const ringW = 0.62;
  const edge = 0.16;

  // Zones are rounded rects clipped to the outline, outermost first.
  const zoneSvg = zones
    .map((z, i) => ({ z, inset: edge + (zones.length - 1 - i) * ringW }))
    .reverse()
    .map(({ z, inset }) => {
      const through = /handle/i.test(z.text);
      const bottom = through ? L - 0.5 : F + 0.35 - inset * 0.4;
      const fill = z.kind === 'hex' ? `url(#${id}-hex)` : z.kind === 'rib' ? `url(#${id}-rib)` : z.kind === 'ring' ? color : `url(#${id}-foam${z.n % 2})`;
      const opacity = z.kind === 'ring' ? 0.32 : 1;
      return `<rect x="${n(-W / 2 + inset)}" y="${n(inset)}" width="${n(W - inset * 2)}" height="${n(bottom - inset)}" rx="${n(Math.max(0.3, TOP[g.shape].r - inset))}" fill="${paper}"/>` +
        `<rect x="${n(-W / 2 + inset)}" y="${n(inset)}" width="${n(W - inset * 2)}" height="${n(bottom - inset)}" rx="${n(Math.max(0.3, TOP[g.shape].r - inset))}" fill="${fill}" fill-opacity="${opacity}" stroke="${color}" stroke-width="0.035"/>`;
    })
    .join('');

  const markY = F * 0.5;
  const marks = zones
    .map((z, i) => {
      const inset = edge + (zones.length - 1 - i) * ringW;
      const cx = i === 0 ? Math.max(0.55, (W / 2 - inset) * 0.42) : W / 2 - inset - ringW / 2 + (zones.length - 1 === i ? 0.0 : 0);
      const x = i === 0 ? cx : W / 2 - (edge + (zones.length - 1 - i) * ringW) - ringW / 2;
      return `<circle cx="${n(x)}" cy="${n(markY + (i % 2 ? 0.9 : 0))}" r="0.27" fill="${paper}" stroke="${ink}" stroke-width="0.04"/><text x="${n(x)}" y="${n(markY + (i % 2 ? 0.9 : 0) + 0.11)}" text-anchor="middle" font-family="${mono}" font-size="0.32" font-weight="500" fill="${ink}">${z.n}</text>`;
    })
    .join('');

  const tIn = g.thicknessMm ? g.thicknessMm / 25.4 : null;
  const px = W / 2 + 1.7; // side profile x
  const profile = dims && tIn
    ? `<g><rect x="${n(px - tIn / 2)}" y="0" width="${n(tIn)}" height="${n(F + 0.2)}" rx="${n(tIn / 2.2)}" fill="${color}" fill-opacity="0.18" stroke="${ink}" stroke-width="0.045"/>` +
      `<rect x="${n(px - 0.55)}" y="${n(F)}" width="1.1" height="${n(Hh)}" rx="0.3" fill="${ink}" fill-opacity="0.08" stroke="${ink}" stroke-width="0.045"/>` +
      `<text x="${n(px)}" y="-0.35" text-anchor="middle" font-family="${mono}" font-size="0.36" fill="${muted}">${esc(g.thicknessMm)} mm</text></g>`
    : '';

  const dim = (x1, y1, x2, y2, label, lx, ly, rotate) =>
    `<g stroke="${muted}" stroke-width="0.03" fill="none"><path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}"/>` +
    (x1 === x2 ? `<path d="M${n(x1 - 0.14)} ${n(y1)}h0.28M${n(x2 - 0.14)} ${n(y2)}h0.28"/>` : `<path d="M${n(x1)} ${n(y1 - 0.14)}v0.28M${n(x2)} ${n(y2 - 0.14)}v0.28"/>`) +
    `</g><text x="${n(lx)}" y="${n(ly)}" text-anchor="middle" font-family="${mono}" font-size="0.36" fill="${muted}"${rotate ? ` transform="rotate(-90 ${n(lx)} ${n(ly)})"` : ''}>${esc(label)}</text>`;
  const fmt = (v) => `${Number(v.toFixed(2))} in`;
  const dimLines = dims
    ? dim(-W / 2 - 0.75, 0, -W / 2 - 0.75, L, fmt(L) + (g.own ? '' : ' nominal'), -W / 2 - 1.05, L / 2, true) +
      dim(-W / 2, -0.55, W / 2, -0.55, fmt(W), 0, -0.78, false) +
      dim(1.35, F, 1.35, L, fmt(Hh) + (g.handleOwn ? '' : ' nom.'), 1.75, F + Hh / 2, true)
    : '';

  const vb = dims ? [n(-W / 2 - 1.7), -1.3, n(W + 1.7 + (tIn ? 3.1 : 1.0)), n(L + 1.9)] : [n(-W / 2 - 0.3), -0.3, n(W + 0.6), n(L + 0.6)];

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="To-scale drawing: ${esc(g.shape)} paddle, ${fmt(L)} long by ${fmt(W)} wide${g.thicknessMm ? `, ${esc(g.thicknessMm)} mm thick` : ''}. Right half cut away to show ${zones.length} core layer${zones.length === 1 ? '' : 's'}.">` +
    `<defs>` +
    `<clipPath id="${id}-out"><path d="${path}"/></clipPath>` +
    `<clipPath id="${id}-right"><rect x="0" y="-1" width="${n(W)}" height="${n(L + 2)}"/></clipPath>` +
    `<clipPath id="${id}-left"><rect x="${n(-W)}" y="-1" width="${n(W)}" height="${n(L + 2)}"/></clipPath>` +
    `<pattern id="${id}-foam0" width="0.3" height="0.3" patternUnits="userSpaceOnUse"><circle cx="0.08" cy="0.08" r="0.045" fill="${color}"/><circle cx="0.23" cy="0.2" r="0.035" fill="${color}"/></pattern>` +
    `<pattern id="${id}-foam1" width="0.2" height="0.2" patternUnits="userSpaceOnUse"><circle cx="0.06" cy="0.06" r="0.04" fill="${color}"/><circle cx="0.16" cy="0.15" r="0.04" fill="${color}"/></pattern>` +
    `<pattern id="${id}-hex" width="0.6" height="0.346" patternUnits="userSpaceOnUse"><path d="M0 0.173L0.1 0h0.2l0.1 0.173l-0.1 0.173h-0.2zM0.4 0.173h0.2" fill="none" stroke="${color}" stroke-width="0.035"/></pattern>` +
    `<pattern id="${id}-rib" width="0.42" height="1" patternUnits="userSpaceOnUse"><rect x="0.14" y="0" width="0.1" height="1" fill="${color}"/></pattern>` +
    `<pattern id="${id}-weave" width="0.22" height="0.22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0.11h0.22" stroke="${ink}" stroke-width="0.02" opacity="0.28"/></pattern>` +
    `</defs>` +
    `<path d="${path}" fill="${paper}"/>` +
    // left half: the hitting surface
    `<g clip-path="url(#${id}-left)"><path d="${path}" fill="${ink}" fill-opacity="0.9"/><path d="${path}" fill="url(#${id}-weave)"/>` +
    `<rect x="${n(-0.65)}" y="${n(F)}" width="1.3" height="${n(Hh)}" fill="${paper}" fill-opacity="0.16"/></g>` +
    // right half: cut away to the core
    `<g clip-path="url(#${id}-right)"><g clip-path="url(#${id}-out)">${zoneSvg}` +
    `<rect x="0" y="${n(F + 0.4)}" width="0.65" height="${n(Hh)}" fill="${ink}" fill-opacity="0.08"/></g>${marks}</g>` +
    // handle wrap lines + butt cap
    `<g clip-path="url(#${id}-out)" stroke="${paper}" stroke-opacity="0.35" stroke-width="0.05">${Array.from({ length: Math.floor(Hh / 0.55) }, (_, i) => `<path d="M-0.65 ${n(F + 0.7 + i * 0.55)}L0 ${n(F + 0.45 + i * 0.55)}"/>`).join('')}</g>` +
    `<rect x="-0.78" y="${n(L - 0.42)}" width="1.56" height="0.42" rx="0.14" fill="${ink}"/>` +
    `<path d="${path}" fill="none" stroke="${ink}" stroke-width="0.09" stroke-linejoin="round"/>` +
    `<path d="M0 0.1V${n(F + 0.3)}" stroke="${paper}" stroke-width="0.09"/><path d="M0 0.1V${n(F + 0.3)}" stroke="${ink}" stroke-width="0.04" stroke-dasharray="0.22 0.16"/>` +
    dimLines +
    profile +
    `</svg>`;

  return { svg, layers: zones, geometry: g, viewBox: vb };
}
