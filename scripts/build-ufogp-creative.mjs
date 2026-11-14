#!/usr/bin/env node
// OFF-53 B. Local files only; no network, signing, pinning or minting.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { renderPortrait, NOUNS_ART } from '../src/lib/nouns-parts.mjs';
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root));
const json = p => JSON.parse(read(p));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const out = (p, value) => { const u = new URL(p, root); mkdirSync(new URL('.', u), { recursive: true }); writeFileSync(u, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n'); };
const seats = json('src/data/ufogp-seats.json');
const source = json(NOUNS_ART.imageData);
const artPath = '/images/ufogp';
const base = 'https://pointcast.xyz';
const commons = { background: 'cool', accessory: 'accessory-none', glasses: 'glasses-square-black' };
const manifest = {
  version: 1, status: 'draft-unpublished', date: '2026-11-13',
  source: NOUNS_ART, sourceSha256: hash(read(NOUNS_ART.imageData)),
  charter: 'https://pointcast.xyz/loom?to=%23daos',
  note: 'Charter fixes heads and bodies only. All six use cool background, no accessory and black square glasses. Whole original combinations, not numbered Ethereum Nouns. Token IDs are proposed for part A; confirm before minting.',
  seats: [],
};
const svgs = seats.map(seat => {
  const recipe = { ...commons, head: seat.head, body: seat.body };
  const { svg } = renderPortrait(recipe);
  out(`public${artPath}/${seat.slug}.svg`, svg + '\n');
  const uri = `${base}${artPath}/${seat.slug}.svg`;
  const seed = { background: 0 };
  for (const [k, list] of Object.entries({ body:'bodies', accessory:'accessories', head:'heads', glasses:'glasses' })) {
    seed[k] = source.images[list].findIndex(x => x.filename === recipe[k]);
    if (seed[k] < 0) throw new Error(`Missing ${recipe[k]}`);
  }
  const metadata = {
    name: `UFOGP seat · ${seat.name}`, symbol: 'UFOGP', decimals: 0,
    description: `${seat.name}, a founding seat of the United Federation of Good Pirates. A whole Noun built by code from official CC0 traits. Proposed non-transferable seat token; draft metadata, not evidence of minting or ownership.`,
    artifactUri: uri, displayUri: uri, thumbnailUri: uri,
    externalUri: `${base}/ufogp/`,
    formats: [{ uri, mimeType: 'image/svg+xml', dimensions: { value: '320x320', unit: 'px' }, fileSize: Buffer.byteLength(svg + '\n') }],
    isBooleanAmount: true, shouldPreferSymbol: false,
    rights: 'CC0-1.0; official Nouns artwork and this combination.',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    language: 'en', tags: ['UFOGP', 'Nouns', 'seat'],
    attributes: Object.entries(recipe).map(([name,value]) => ({name,value})),
  };
  out(`contracts/ufogp/metadata/${seat.id}.json`, metadata);
  out(`public/ufogp/metadata/${seat.id}.json`, metadata);
  manifest.seats.push({ ...seat, recipe, seed, art: `${artPath}/${seat.slug}.svg`, artSha256: hash(svg + '\n'), metadata: `/ufogp/metadata/${seat.id}.json` });
  return svg;
});
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const whole = (svg,x,y,size) => `<g transform="translate(${x} ${y}) scale(${size/320})">${svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace('width="100%" height="100%"', 'width="320" height="320"')}</g>`;
const wrap = (w,h,title,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}</svg>\n`;
const colors = ['#71bce1','#4169a1','#8d63ab','#f3b63f','#649e69','#8d9baa'];
const stripes = colors.map((c,i)=>`<rect x="${i*160}" y="0" width="160" height="640" fill="${c}"/>`).join('');
out('public/images/ufogp/flag.svg', wrap(960,640,'UFOGP flag: six colors, six seats',`${stripes}<rect x="40" y="170" width="880" height="300" fill="#152c37"/><text x="480" y="300" text-anchor="middle" font-family="sans-serif" font-size="110" font-weight="bold" fill="#fff8e8">UFOGP</text><text x="480" y="385" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#fff8e8">ANY FLAG MAY SAIL</text>`));
const portraits = svgs.map((s,i)=>whole(s,45+i*185,240,180)+`<text x="${135+i*185}" y="453" text-anchor="middle" font-family="sans-serif" font-size="23" fill="#fff8e8">${esc(seats[i].name)}</text>`).join('');
out('public/images/ufogp/share-card.svg', wrap(1200,630,'UFOGP — United Federation of Good Pirates. Six seats on the Loom.',`<rect width="1200" height="630" fill="#152c37"/><text x="45" y="100" font-family="sans-serif" font-size="76" font-weight="bold" fill="#fff8e8">UFOGP</text><text x="45" y="159" font-family="sans-serif" font-size="35" fill="#fff8e8">United Federation of Good Pirates</text>${portraits}<text x="45" y="540" font-family="sans-serif" font-size="29" fill="#fff8e8">Six seats. One room. Maps shared.</text><text x="45" y="590" font-family="sans-serif" font-size="23" fill="#fff8e8">pointcast.xyz/loom · Nouns art: CC0 · 2026-11-13</text>`));
manifest.flag = '/images/ufogp/flag.svg'; manifest.shareCard = '/images/ufogp/share-card.svg';
out('public/images/ufogp/provenance.json', manifest);
console.log('Wrote six whole Nouns, 12 metadata copies, flag, share card and provenance.');

// Tess's interview idea: an open map, six paths, room for a seventh.
const map = (ox,oy) => `<g transform="translate(${ox} ${oy})"><rect x="0" y="0" width="600" height="230" rx="8" fill="#fff8e8"/><path d="M200 0V230M400 0V230" stroke="#d7cbb4" stroke-width="3"/>${colors.map((c,i) => `<path d="M${40+i*95} 20 L${75+i*75} 105 L300 180" fill="none" stroke="${c}" stroke-width="7"/>`).join('')}<path d="M300 180 L550 200" fill="none" stroke="#152c37" stroke-width="5" stroke-dasharray="10 9"/><circle cx="300" cy="180" r="13" fill="#152c37"/><text x="420" y="222" font-family="sans-serif" font-size="17" fill="#152c37">ROOM FOR A SEVENTH</text></g>`;
out('public/images/ufogp/interview-flag.svg', wrap(960,640,'UFOGP interview flag: six paths meet, a seventh stays open',`<rect width="960" height="640" fill="#152c37"/><text x="480" y="105" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="bold" fill="#fff8e8">UFOGP</text>${map(180,160)}<text x="480" y="480" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#fff8e8">TAKE NOTHING. LEAVE MAPS.</text><text x="480" y="550" text-anchor="middle" font-family="sans-serif" font-size="25" fill="#fff8e8">Six paths. An open map.</text>`));
const interviewSeats = svgs.map((svg,i) => whole(svg,40+i*116,315,105)+`<text x="${92+i*116}" y="448" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#fff8e8">${esc(seats[i].name)}</text>`).join('');
out('public/images/ufogp/interview-share-card.svg', wrap(1200,630,'UFOGP interview. Six paths. An open map. Share what you find.',`<rect width="1200" height="630" fill="#152c37"/><text x="40" y="85" font-family="sans-serif" font-size="58" font-weight="bold" fill="#fff8e8">UFOGP INTERVIEW</text><text x="40" y="145" font-family="sans-serif" font-size="31" fill="#fff8e8">Six paths. An open map.</text><g transform="translate(770 210) scale(.64)">${map(0,0)}</g>${interviewSeats}<text x="40" y="525" font-family="sans-serif" font-size="38" fill="#fff8e8">Share what you find.</text><text x="40" y="588" font-family="sans-serif" font-size="22" fill="#fff8e8">Six self-declared seats · Humans and AI agents · Loom · 2026-11-13</text>`));
manifest.interview = { flag: '/images/ufogp/interview-flag.svg', shareCard: '/images/ufogp/interview-share-card.svg', inspiration: 'Tess: an open map with six paths and room to draw a seventh. Loom desk: take nothing, leave maps.', thread: 'loom:42baaa6831fa5fd2cf5802f5#m_4d5c2u0468', note: 'An open path represents applications, not an awarded seventh seat.' };
out('public/images/ufogp/provenance.json', manifest);

// Raster exports for unfurls. The SVG files remain the canonical art.
if (process.argv.includes('--png')) {
  const { Resvg } = await import('@resvg/resvg-js');
  for (const name of [...seats.map(seat => seat.slug), 'flag', 'share-card', 'interview-flag', 'interview-share-card']) {
    const svg = read(`public/images/ufogp/${name}.svg`);
    const png = new Resvg(svg, { font: { defaultFontFamily: 'DejaVu Sans' } }).render().asPng();
    writeFileSync(new URL(`public/images/ufogp/${name}.png`, root), png);
  }
}
