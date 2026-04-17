/**
 * /api/frame/drum-image — dynamic OG-style image for the Farcaster Frame.
 *
 * Farcaster Frames v1 want a 1.91:1 aspect-ratio image (standard OG shape).
 * We generate an SVG at edge render time, which Warpcast's image-fetch
 * handles natively (SVG preview supported since 2024). That's faster than
 * rasterizing to PNG on every request + avoids pulling resvg into the
 * Workers bundle.
 *
 * Query params:
 *   ?c=<count>  — current global drum total (falls back to KV read)
 *   ?t=<ms>     — cache-bust timestamp (ignored; just forces refresh)
 *
 * Output:
 *   Content-Type: image/svg+xml
 *   Cache-Control: public, max-age=5   (short — the count changes fast)
 */

export interface Env {
  VISITS?: KVNamespace;
}

const DRUM_COUNT_KEY = 'drum:total';

async function loadCount(env: Env): Promise<number> {
  if (!env.VISITS) return 0;
  const raw = await env.VISITS.get(DRUM_COUNT_KEY);
  return raw ? Number(raw) || 0 : 0;
}

function renderSVG(count: number): string {
  // 1200 x 628 ≈ 1.91:1 (Warpcast recommended). Dark field, big serif
  // count, PointCast byline. Warm broadcast arcs behind the number so
  // it reads as a live-signal card rather than a static OG dump.
  const safeCount = Math.max(0, Math.floor(count));
  const formatted = safeCount.toLocaleString('en-US');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628" shape-rendering="crispEdges">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#1f1712"/>
      <stop offset="100%" stop-color="#0a0806"/>
    </radialGradient>
    <linearGradient id="num" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f7ecd4"/>
      <stop offset="100%" stop-color="#e7c79a"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="628" fill="url(#bg)"/>

  <!-- Broadcast arcs -->
  <g stroke="#c26a4a" fill="none" stroke-linecap="round">
    <circle cx="600" cy="314" r="200" stroke-width="1.2" opacity="0.22"/>
    <circle cx="600" cy="314" r="270" stroke-width="1.0" opacity="0.18"/>
    <circle cx="600" cy="314" r="350" stroke-width="0.8" opacity="0.14"/>
    <circle cx="600" cy="314" r="440" stroke-width="0.6" opacity="0.10"/>
  </g>

  <!-- Top kicker -->
  <text x="600" y="140" text-anchor="middle"
        font-family="JetBrains Mono, ui-monospace, Menlo, monospace"
        font-size="22" font-weight="700" letter-spacing="8" fill="#c26a4a">
    POINTCAST \u00b7 DRUM ROOM
  </text>

  <!-- Big count -->
  <text x="600" y="340" text-anchor="middle"
        font-family="Lora, Georgia, serif" font-size="168" font-weight="700"
        fill="url(#num)" letter-spacing="-2">
    ${formatted}
  </text>

  <!-- Subtitle -->
  <text x="600" y="400" text-anchor="middle"
        font-family="Lora, Georgia, serif" font-style="italic"
        font-size="34" font-weight="500" fill="#e7c79a">
    drums tapped together \u00b7 tap below to add yours
  </text>

  <!-- Bottom brand strip -->
  <rect x="0" y="555" width="1200" height="2" fill="#c26a4a" opacity="0.4"/>
  <text x="600" y="600" text-anchor="middle"
        font-family="JetBrains Mono, ui-monospace, monospace"
        font-size="16" font-weight="600" letter-spacing="6" fill="#e7c79a">
    POINTCAST.XYZ / DRUM
  </text>

  <!-- ON AIR badge -->
  <g transform="translate(1020, 52)">
    <rect width="128" height="32" rx="16" fill="#1f1712" stroke="#c26a4a" stroke-width="1"/>
    <circle cx="18" cy="16" r="6" fill="#ff4b2a"/>
    <text x="36" y="21" font-family="JetBrains Mono, ui-monospace, monospace"
          font-size="14" font-weight="700" letter-spacing="4" fill="#f5efe4">ON AIR</text>
  </g>

  <!-- Corner dots -->
  <rect x="0" y="0" width="16" height="16" fill="#c26a4a"/>
  <rect x="1184" y="612" width="16" height="16" fill="#c26a4a"/>
</svg>`;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const cParam = url.searchParams.get('c');
  // Prefer the explicit `?c=` param (set by the Frame handler so the image
  // always reflects the *just-bumped* count without a KV read). Fall back
  // to KV for direct hits / previews.
  let count: number;
  if (cParam != null && Number.isFinite(Number(cParam))) {
    count = Math.max(0, Math.floor(Number(cParam)));
  } else {
    count = await loadCount(env);
  }

  const svg = renderSVG(count);
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=5',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
