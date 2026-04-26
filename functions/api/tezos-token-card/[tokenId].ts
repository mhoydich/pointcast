/**
 * /api/tezos-token-card/[tokenId].svg — marketplace display art for PCVN.
 *
 * OBJKT/Kukai read NFT media from token metadata, not from our HTML card pages.
 * This SVG gives every Visit Noun a stable PointCast preview while preserving
 * the canonical CC0 Noun artwork from noun.pics.
 */

interface Env {}

const PLACES = [
  'Brutalist Plaza',
  'Repair Shop',
  'Skate Park',
  'Forest Park',
  'Rec Court',
  'Basketball Hoops',
  'Rothko Wall',
  'Warhol Press',
  'Mondrian Yard',
  'Miro Lot',
  'Degas Room',
  'Monet Pond',
  'Picasso Alley',
  'Train Underpass',
  'Beach Ramp',
  'Civic Garage',
];

const TONES = [
  ['Charcoal', '#171717', '#f1eee7', '#8c8a84'],
  ['Bone', '#f5f0e5', '#171717', '#b9afa1'],
  ['Faded Red', '#7e2f2f', '#fff7ed', '#e6b0a0'],
  ['Oxide Blue', '#223d5b', '#f4f8fb', '#8fb0c9'],
  ['Park Green', '#28483a', '#f4f1df', '#92b88f'],
  ['Old Gold', '#6f5520', '#fff7d7', '#d9bd64'],
  ['Ink Black', '#080808', '#f7f7f2', '#777'],
  ['Dust Pink', '#d8aaa7', '#1f1c1c', '#8d6665'],
  ['Teal Gray', '#36585b', '#f0f5f3', '#8eb5b5'],
  ['Concrete Lilac', '#7b7492', '#f4f1fa', '#bbb5d0'],
];

function parseTokenId(raw: string) {
  const m = raw.match(/^(\d+)(?:\.svg)?$/);
  if (!m) return null;
  const tokenId = Number(m[1]);
  if (tokenId < 0 || tokenId > 1199) return null;
  return tokenId;
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}

function svgForToken(tokenId: number) {
  const place = PLACES[tokenId % PLACES.length];
  const [tone, bg, fg, accent] = TONES[tokenId % TONES.length];
  const nounUri = `https://noun.pics/${tokenId}.svg`;
  const serial = String(tokenId).padStart(4, '0');
  const gridOffset = (tokenId % 9) * 54;
  const title = `PointCast Visit Noun #${tokenId}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(`A PointCast Tezos card for Noun ${tokenId}, staged as ${place} with ${tone} print treatment.`)}</desc>
  <defs>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse" patternTransform="translate(${gridOffset} ${gridOffset}) rotate(-2)">
      <path d="M 72 0 L 0 0 0 72" fill="none" stroke="${accent}" stroke-width="3" opacity="0.32"/>
    </pattern>
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="4" seed="${tokenId + 17}" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.16"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
    <filter id="nounShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="16" dy="20" stdDeviation="0" flood-color="#000" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1200" height="1200" fill="${bg}"/>
  <rect x="42" y="42" width="1116" height="1116" fill="url(#grid)" opacity="0.9"/>
  <rect x="72" y="72" width="1056" height="1056" fill="none" stroke="${fg}" stroke-width="5"/>
  <rect x="92" y="92" width="1016" height="72" fill="${fg}"/>
  <text x="120" y="139" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="10" fill="${bg}">POINTCAST VISIT NOUNS</text>
  <text x="958" y="139" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="6" fill="${bg}">PCVN-${serial}</text>
  <g transform="translate(230 235)" filter="url(#nounShadow)">
    <rect x="0" y="0" width="740" height="650" fill="${fg}" opacity="0.08"/>
    <image href="${nounUri}" x="70" y="28" width="600" height="600" preserveAspectRatio="xMidYMid meet" style="image-rendering:pixelated"/>
  </g>
  <rect x="92" y="928" width="1016" height="180" fill="${fg}"/>
  <text x="120" y="988" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800" fill="${bg}">${escapeXml(`Noun #${tokenId}`)}</text>
  <text x="120" y="1044" font-family="Arial, Helvetica, sans-serif" font-size="28" letter-spacing="4" fill="${bg}" opacity="0.86">${escapeXml(`${place} / ${tone} / Tezos mint`)}</text>
  <text x="1080" y="1044" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="24" letter-spacing="5" fill="${bg}" opacity="0.76">POINTCAST.XYZ</text>
  <rect x="0" y="0" width="1200" height="1200" fill="transparent" filter="url(#paper)"/>
</svg>`;
}

function headers() {
  return {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  };
}

async function handleCard(params: Record<string, unknown>, includeBody: boolean) {
  const tokenId = parseTokenId((params.tokenId as string) ?? '');
  if (tokenId === null) {
    return new Response(includeBody ? 'invalid tokenId' : null, {
      status: 400,
      headers: headers(),
    });
  }
  return new Response(includeBody ? svgForToken(tokenId) : null, {
    status: 200,
    headers: headers(),
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ params }) => handleCard(params, true);

export const onRequestHead: PagesFunction<Env> = async ({ params }) => handleCard(params, false);

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 204,
    headers: headers(),
  });
