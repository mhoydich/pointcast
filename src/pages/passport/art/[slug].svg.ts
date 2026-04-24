import type { APIRoute } from 'astro';
import { PASSPORT_STAMPS } from '../../../lib/passport';
import { passportCompanionNounId } from '../../../lib/passport-mint';

export function getStaticPaths() {
  return PASSPORT_STAMPS.map((stamp) => ({ params: { slug: stamp.slug } }));
}

function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapWords(value: string, max = 14): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length <= max) {
      line = (line + ' ' + word).trim();
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export const GET: APIRoute = async ({ params }) => {
  const stamp = PASSPORT_STAMPS.find((item) => item.slug === params.slug);
  if (!stamp) return new Response('not found', { status: 404 });

  const nameLines = wrapWords(stamp.name.toUpperCase(), 15);
  const nounId = passportCompanionNounId(stamp);
  const ringId = `stamp-${stamp.slug}`;
  const lineTs = nameLines
    .map((line, index) => `<text x="512" y="${430 + index * 78}" class="name">${escapeXml(line)}</text>`)
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-labelledby="${ringId}-title ${ringId}-desc">
  <title id="${ringId}-title">PointCast Passport Stamp ${escapeXml(stamp.code)} ${escapeXml(stamp.name)}</title>
  <desc id="${ringId}-desc">A Tezos-ready collectible passport stamp for ${escapeXml(stamp.name)}.</desc>
  <defs>
    <filter id="paper" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.08"/>
      </feComponentTransfer>
      <feBlend mode="multiply" in2="SourceGraphic"/>
    </filter>
    <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse">
      <path d="M 52 0 L 0 0 0 52" fill="none" stroke="${escapeXml(stamp.color)}" stroke-opacity="0.1" stroke-width="2"/>
    </pattern>
    <style>
      .mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; }
      .sans { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
      .name { font-family: Inter, ui-sans-serif, system-ui, sans-serif; text-anchor: middle; font-size: 70px; font-weight: 800; letter-spacing: 0.03em; fill: ${escapeXml(stamp.color)}; }
    </style>
  </defs>
  <rect width="1024" height="1024" fill="#f8f3e8"/>
  <rect width="1024" height="1024" fill="url(#grid)"/>
  <rect width="1024" height="1024" filter="url(#paper)" opacity="0.92"/>

  <rect x="92" y="92" width="840" height="840" rx="24" fill="none" stroke="${escapeXml(stamp.color)}" stroke-width="24" stroke-dasharray="18 22"/>
  <rect x="132" y="132" width="760" height="760" rx="18" fill="#fffdf7" stroke="#15120d" stroke-width="4"/>
  <rect x="168" y="168" width="688" height="688" rx="10" fill="none" stroke="${escapeXml(stamp.color)}" stroke-width="8"/>

  <circle cx="512" cy="512" r="286" fill="none" stroke="${escapeXml(stamp.color)}" stroke-width="18"/>
  <circle cx="512" cy="512" r="236" fill="none" stroke="#15120d" stroke-width="4" stroke-dasharray="10 16"/>
  <path d="M274 334 C370 238 654 238 750 334" fill="none" stroke="${escapeXml(stamp.color)}" stroke-width="10"/>
  <path d="M274 690 C370 786 654 786 750 690" fill="none" stroke="${escapeXml(stamp.color)}" stroke-width="10"/>

  <text x="512" y="245" class="mono" text-anchor="middle" font-size="34" font-weight="700" fill="#15120d">POINTCAST PASSPORT</text>
  <text x="512" y="296" class="mono" text-anchor="middle" font-size="22" fill="${escapeXml(stamp.color)}">${escapeXml(stamp.band.toUpperCase())} / ${escapeXml(stamp.direction)} / ${escapeXml(stamp.miles)} MI</text>
  ${lineTs}
  <text x="512" y="657" class="mono" text-anchor="middle" font-size="26" fill="#15120d">TEZOS PROOF NOUN ${nounId}</text>
  <text x="512" y="710" class="mono" text-anchor="middle" font-size="24" fill="${escapeXml(stamp.color)}">${escapeXml(stamp.code)} / ${escapeXml(stamp.localAction.toUpperCase())}</text>

  <g transform="translate(512 812)">
    <rect x="-160" y="-44" width="320" height="88" rx="44" fill="${escapeXml(stamp.color)}"/>
    <text x="0" y="10" class="mono" text-anchor="middle" font-size="30" font-weight="800" fill="#fffdf7">MINT READY</text>
  </g>
  <text x="512" y="910" class="mono" text-anchor="middle" font-size="18" fill="#15120d">ART PROMPT: GPT-IMAGE-2 / METADATA: /PASSPORT/STAMPS/${escapeXml(stamp.slug).toUpperCase()}.JSON</text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
