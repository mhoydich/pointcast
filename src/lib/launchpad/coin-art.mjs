/**
 * Coin portraits for the launchpad case study: a round token carrying the
 * full, actual Noun (from the verified #0–99 seeds, never cropped) and a
 * SIMULATED ribbon. Deliberately not a Nouns Money note: those are art that
 * is never priced or traded, and these coins trade in a simulation.
 */
import { nounArt, placeNoun } from '../currency-builder/primitives.mjs';
import { text } from '../currency-builder/type.mjs';
import { CREDIT_WORD } from './config.mjs';

export const COIN_BASE = '/case-studies/launchpad/coins';

export const COIN_COLORS = Object.freeze({
  'quiet-launch': Object.freeze({ ring: '#7a3d1d', paper: '#f6efe2', accent: '#b4532a' }),
  'snipe-war': Object.freeze({ ring: '#14213d', paper: '#eef2f6', accent: '#c1272d' }),
  'dev-dump': Object.freeze({ ring: '#4a2357', paper: '#f4eff6', accent: '#7b2d8b' }),
  'graduation-run': Object.freeze({ ring: '#1f5233', paper: '#eef5ea', accent: '#2f7d4f' }),
});

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Largest size at which every Noun pixel, centered, sits inside a circle of `radius`. */
function fitInCircle(svg, radius, max) {
  let far = 0;
  for (const m of svg.matchAll(/<rect width="(\d+)" height="10" x="(\d+)" y="(\d+)"/g)) {
    const w = +m[1] / 10, x = +m[2] / 10, y = +m[3] / 10;
    const dy = Math.max(Math.abs(y - 16), Math.abs(y + 1 - 16));
    const dx = Math.max(Math.abs(x - 16), Math.abs(x + w - 16));
    far = Math.max(far, Math.hypot(dx, dy));
  }
  return far ? Math.min(max, Math.floor((32 * radius) / far)) : max;
}

export const coinSlug = (scenarioId, symbol) => `${scenarioId}-${symbol.toLowerCase()}`;
export const coinPath = (scenarioId, symbol) => `${COIN_BASE}/${coinSlug(scenarioId, symbol)}.svg`;

/** The portrait's accessible name: what the coin is, and that it has no value. */
export const coinLabel = ({ symbol, name, nounId }) => `${name} (${symbol}), a simulated coin showing actual Noun #${nounId}. ${CREDIT_WORD[0].toUpperCase()}${CREDIT_WORD.slice(1)} only; no value.`;

/** A 360 × 420 coin portrait. */
export function coinSVG({ scenarioId, symbol, name, nounId }) {
  const label = esc(coinLabel({ symbol, name, nounId }));
  const c = COIN_COLORS[scenarioId] ?? COIN_COLORS['quiet-launch'];
  const art = nounArt(nounId);
  const size = fitInCircle(art.svg, 128, 250);
  const noun = placeNoun(art, 180 - size / 2, 180 - size / 2, size).replace(/<rect width="100%" height="100%"[^>]*\/>/, '');
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r1 = 152, r2 = i % 6 ? 158 : 163;
    return `M${(180 + r1 * Math.cos(a)).toFixed(1)} ${(180 + r1 * Math.sin(a)).toFixed(1)}L${(180 + r2 * Math.cos(a)).toFixed(1)} ${(180 + r2 * Math.sin(a)).toFixed(1)}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 420" width="360" height="420" role="img" aria-label="${label}"><title>${label}</title>`
    + `<circle cx="180" cy="180" r="172" fill="${c.paper}" stroke="${c.ring}" stroke-width="4"/>`
    + `<path d="${ticks}" stroke="${c.ring}" stroke-width="1.6"/>`
    + `<circle cx="180" cy="180" r="144" fill="${c.ring}"/>`
    + `<circle cx="180" cy="180" r="139" fill="${art.background}"/>`
    + noun
    + `<rect x="40" y="356" width="280" height="48" rx="6" fill="${c.ring}"/>`
    + text('title', symbol, { x: 180, y: 380, size: 20, tracking: 3, anchor: 'middle', fill: '#ffffff', maxWidth: 250 })
    + text('caps', `SIMULATED · NOUN ${nounId}`, { x: 180, y: 396, size: 10, tracking: 2.4, anchor: 'middle', fill: '#ffffff', maxWidth: 250 })
    + `</svg>`;
}
