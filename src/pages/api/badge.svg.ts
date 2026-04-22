/**
 * /api/badge.svg — "Seen on PointCast" embed badge.
 *
 * 110×28 SVG. Friend nodes paste this via <img> to signal a PointCast
 * citation. Design: dark pill with an amber-to-crimson gradient dot at
 * left, monospace "SEEN ON" kicker, "POINTCAST" wordmark.
 *
 * Static. Cache-friendly. Degrades cleanly on non-SVG-supporting clients
 * because the alt text carries the citation.
 */
import type { APIRoute } from 'astro';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 28" width="110" height="28" role="img" aria-label="Seen on PointCast">
  <defs>
    <radialGradient id="pcDot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FBB040"/>
      <stop offset="100%" stop-color="#8A2432"/>
    </radialGradient>
    <linearGradient id="pcBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12110E"/>
      <stop offset="100%" stop-color="#2A2748"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="110" height="28" rx="3" fill="url(#pcBg)"/>
  <circle cx="10" cy="14" r="5" fill="url(#pcDot)" stroke="#FBB040" stroke-width="0.5"/>
  <text x="22" y="11" font-family="JetBrains Mono, Menlo, monospace" font-size="6" letter-spacing="0.14em" fill="#FBB040" font-weight="700">SEEN ON</text>
  <text x="22" y="21.5" font-family="JetBrains Mono, Menlo, monospace" font-size="9.5" letter-spacing="0.06em" fill="#F7F5EE" font-weight="700">POINTCAST</text>
</svg>`;

export const GET: APIRoute = async () => {
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      // CORS open so friend nodes can embed across origins without preflight.
      'Access-Control-Allow-Origin': '*',
    },
  });
};
