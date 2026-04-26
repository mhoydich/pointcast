/**
 * /api/zen-cat-svg/[tokenId] - deterministic SVG art for PCCAT metadata.
 */

interface Env {}

const CATS = [
  ['Soba', '#eef4fa', '#fffef7', '#2c2b28', '#59534c', '#d6b14a', '#14120f'],
  ['Miso', '#f6efe4', '#ffffff', '#c76b32', '#efb36b', '#24746b', '#191513'],
  ['Nori', '#e8f0ef', '#fffdf7', '#7b8589', '#b4bec0', '#2f6f95', '#101517'],
  ['Yuzu', '#f8f6de', '#ffffff', '#ead3a0', '#b98643', '#2d8a59', '#1b1710'],
  ['Plum', '#f3edf2', '#fffefa', '#f4e5cf', '#7a3f34', '#b52f45', '#161111'],
  ['Mochi', '#edf3fb', '#ffffff', '#f7f4eb', '#ccd4dd', '#315cbe', '#11151e'],
  ['Sesame', '#f1eee7', '#fffdf8', '#4f3f35', '#ba8554', '#8b4ec7', '#18120f'],
  ['Taro', '#eef0f7', '#ffffff', '#d9d4e6', '#746982', '#1d6f72', '#12131b'],
] as const;

function parseTokenId(raw: string) {
  const match = raw.match(/^(\d{8})(?:\.svg)?$/);
  if (!match) return null;
  const text = match[1];
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6));
  const day = Number(text.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return {
    tokenId: Number(text),
    date: `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`,
    seed: year * 1000 + month * 37 + day * 17,
  };
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ params }) => {
  const parsed = parseTokenId((params.tokenId as string) ?? '');
  if (!parsed) {
    return new Response('invalid tokenId; expected YYYYMMDD', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const cat = CATS[Math.abs(parsed.seed) % CATS.length];
  const [name, ground, paper, fur, furAlt, accent, ink] = cat;
  const stripe = parsed.seed % 2 === 0 ? furAlt : accent;
  const moon = parsed.seed % 29 === 0;
  const title = `PointCast Zen Cat #${parsed.tokenId} - ${name}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(`${name}, the PointCast Zen Cat for ${parsed.date}.`)}</desc>
  <rect width="1200" height="1200" rx="56" fill="${ground}"/>
  <path d="M120 955h960" stroke="${ink}" stroke-width="18" stroke-linecap="round" opacity="0.22"/>
  <path d="M0 0h1200v1200H0z" fill="none"/>
  <g opacity="0.18" stroke="${ink}" stroke-width="4">
    <path d="M172 130h856M172 214h856M172 298h856M172 382h856"/>
    <path d="M172 818h856M172 902h856M172 986h856"/>
  </g>
  ${moon ? `<circle cx="928" cy="238" r="78" fill="${paper}" stroke="${ink}" stroke-width="14"/>` : `<circle cx="928" cy="238" r="54" fill="${accent}" stroke="${ink}" stroke-width="14"/>`}
  <path d="M250 825c112 74 588 74 700 0v138c-138 82-562 82-700 0z" fill="${paper}" stroke="${ink}" stroke-width="20"/>
  <path d="M344 545c0-188 128-326 276-326s276 138 276 326v168c0 154-116 258-276 258S344 867 344 713z" fill="${fur}" stroke="${ink}" stroke-width="22"/>
  <path d="M402 278l-10-168 128 118z" fill="${fur}" stroke="${ink}" stroke-width="22" stroke-linejoin="round"/>
  <path d="M838 278l10-168-128 118z" fill="${fur}" stroke="${ink}" stroke-width="22" stroke-linejoin="round"/>
  <path d="M468 322c92-56 220-60 316 0v140c-108-58-222-58-316 0z" fill="${stripe}" opacity="0.44"/>
  <path d="M506 562c34 30 76 30 110 0M684 562c34 30 76 30 110 0" fill="none" stroke="${paper}" stroke-width="24" stroke-linecap="round"/>
  <path d="M633 622l-31 32h62z" fill="${accent}" stroke="${ink}" stroke-width="16" stroke-linejoin="round"/>
  <path d="M570 706c32 36 78 44 124 0" fill="none" stroke="${paper}" stroke-width="20" stroke-linecap="round"/>
  <path d="M372 665c-82-34-148-36-212-10M378 726c-86 6-152 34-204 76M868 665c82-34 148-36 212-10M862 726c86 6 152 34 204 76" stroke="${ink}" stroke-width="16" stroke-linecap="round" opacity="0.58"/>
  <circle cx="620" cy="838" r="54" fill="${accent}" stroke="${ink}" stroke-width="18"/>
  <path d="M620 892v72" stroke="${ink}" stroke-width="16" stroke-linecap="round"/>
  <text x="600" y="1090" text-anchor="middle" fill="${ink}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="48">${escapeXml(name)} #${parsed.tokenId}</text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
