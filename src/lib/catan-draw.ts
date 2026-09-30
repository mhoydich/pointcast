/**
 * Browser-side SVG renderer for a forged Hex & Harbor board. Shared by the
 * Board Forge (/catan) and the Daily Island (/catan/daily). The svg needs a
 * <defs> and a <g data-board> child; viewBox "-345 -314 690 628" fits the
 * island plus its sea ring at S = 56.
 */
import { hexCenter, RESOURCES, type ForgedBoard } from './catan';

export const BOARD_S = 56;
export const BOARD_VIEWBOX = '-345 -314 690 628';
const NS = 'http://www.w3.org/2000/svg';
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

export function hexPoints(cx: number, cy: number, s: number): string {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (60 * k - 30);
    return `${(cx + s * Math.cos(a)).toFixed(1)},${(cy + s * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

export function svgEl(tag: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const n = document.createElementNS(NS, tag) as SVGElement;
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text) n.textContent = text;
  return n;
}

export function drawBoard(svg: SVGSVGElement, b: ForgedBoard, S = BOARD_S): SVGGElement | null {
  const g = svg.querySelector<SVGGElement>('[data-board]');
  const defs = svg.querySelector('defs');
  if (!g || !defs) return null;
  g.replaceChildren();
  defs.replaceChildren();
  const uid = svg.id || 'b';
  for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) {
    if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) !== 3) continue;
    const c = hexCenter(q, r);
    g.append(svgEl('polygon', { points: hexPoints(c.x * S, c.y * S, S - 1), fill: '#1f5f6b', stroke: '#174a54', 'stroke-width': 2 }));
  }
  for (const h of b.hexes) {
    const c = hexCenter(h.q, h.r); const x = c.x * S; const y = c.y * S; const R = RESOURCES[h.resource];
    const cp = svgEl('clipPath', { id: `${uid}-hc${h.i}` }); cp.append(svgEl('polygon', { points: hexPoints(x, y, S - 1) })); defs.append(cp);
    g.append(svgEl('polygon', { points: hexPoints(x, y, S - 1), fill: R.color }));
    g.append(svgEl('image', { href: R.art.replace('.jpg', '-tile.jpg'), x: x - S * 1.25, y: y - S * 1.25, width: S * 2.5, height: S * 2.5, 'clip-path': `url(#${uid}-hc${h.i})`, preserveAspectRatio: 'xMidYMid slice' }));
    g.append(svgEl('polygon', { points: hexPoints(x, y, S - 1), fill: 'none', stroke: '#f3e8d2', 'stroke-width': 2.5 }));
    if (h.number !== null) {
      const red = h.number === 6 || h.number === 8;
      g.append(svgEl('circle', { cx: x, cy: y, r: 18, fill: '#f6eedb', stroke: '#1f1a14', 'stroke-width': 1.5 }));
      g.append(svgEl('text', { x, y: y + 4, 'text-anchor': 'middle', 'font-family': 'Georgia, serif', 'font-weight': 700, 'font-size': 17, fill: red ? '#b5532f' : '#1f1a14' }, String(h.number)));
      for (let k = 0; k < h.pips; k++) g.append(svgEl('circle', { cx: x + (k - (h.pips - 1) / 2) * 4.2, cy: y + 11, r: 1.4, fill: red ? '#b5532f' : '#1f1a14' }));
    } else {
      g.append(svgEl('path', { d: `M${x - 9} ${y + 16} Q${x} ${y + 10} ${x + 9} ${y + 16} L${x + 6} ${y + 2} Q${x + 10} ${y - 8} ${x} ${y - 16} Q${x - 10} ${y - 8} ${x - 6} ${y + 2} Z`, fill: '#1f1a14' }));
    }
  }
  for (const hb of b.harbors) {
    const h = b.hexes[hb.hex]; const [dq, dr] = DIRS[hb.dir];
    const a = hexCenter(h.q, h.r); const n = hexCenter(h.q + dq, h.r + dr);
    const mx = ((a.x + n.x) / 2) * S; const my = ((a.y + n.y) / 2) * S;
    const px = (a.x + (n.x - a.x) * 0.9) * S; const py = (a.y + (n.y - a.y) * 0.9) * S;
    g.append(svgEl('line', { x1: mx, y1: my, x2: px, y2: py, stroke: '#f3e8d2', 'stroke-width': 3, 'stroke-dasharray': '3 3' }));
    const fill = hb.kind === 'any' ? '#f6eedb' : RESOURCES[hb.kind].color;
    const dark = hb.kind === 'any' || hb.kind === 'wool' || hb.kind === 'grain';
    g.append(svgEl('circle', { cx: px, cy: py, r: 17, fill, stroke: '#f3e8d2', 'stroke-width': 2 }));
    g.append(svgEl('text', { x: px, y: py + 4, 'text-anchor': 'middle', 'font-family': 'ui-monospace, Menlo, monospace', 'font-weight': 700, 'font-size': 11, fill: dark ? '#1f1a14' : '#fff7ea' }, hb.ratio));
  }
  return g;
}

/** A small settlement token (peaked house) centred on (x, y). */
export function settlementPath(x: number, y: number, s = 13): string {
  return `M${x - s} ${y + s * 0.8} V${y - s * 0.1} L${x} ${y - s} L${x + s} ${y - s * 0.1} V${y + s * 0.8} Z`;
}
