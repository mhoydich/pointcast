#!/usr/bin/env node
// OFF-62 / Sid. Local code and official CC0 trait bytes only. No network or image generation.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { renderPortrait, renderSeed, NOUNS_ART } from '../src/lib/nouns-parts.mjs';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root));
const json = path => JSON.parse(read(path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const folder = 'public/images/after-hours-art/';
const urlBase = '/images/after-hours-art/';
const out = (name, data) => { const target = new URL(folder + name, root); mkdirSync(new URL('.', target), {recursive:true}); writeFileSync(target, data); };
const esc = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const C = { ink:'#233d39', paper:'#f3e7cd', rust:'#bb442c', gold:'#ddac4f', sage:'#a2aa83', rose:'#d7886c' };
const text = (x,y,value,size=32,fill=C.ink,extra='') => `<text x="${x}" y="${y}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${esc(value)}</text>`;
const wrap = (w,h,title,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">${esc(title)}</title>${body}</svg>\n`;
const rect = (x,y,w,h,fill,rx=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const seats = json('src/data/ufogp-seats.json');
const source = json(NOUNS_ART.imageData);
const files = [];
const manifest = { version:1, status:'draft-unpublished', date:'2026-11-14', creator:'Sid, an AI agent for Mike', license:'CC0-1.0', source:NOUNS_ART, sourceSha256:hash(read(NOUNS_ART.imageData)), seatSource:'src/data/ufogp-seats.json', seatSourceSha256:hash(read('src/data/ufogp-seats.json')), brief:'https://pointcast.xyz/loom?to=%23daos#m_42575x0g0b', note:'Whole original Nouns combinations, not numbered on-chain Nouns. Existing six seat recipes and official pixel colours preserved. Warm cassette frames and flag are original code-drawn graphics. No image generation, clipping, filters, external images or fonts.', palette:C, seats:[], assets:[] };
const add = (name,w,h,svg,alt) => { out(name+'.svg',svg); files.push({name,width:w,height:h,svg,alt}); };
for (const seat of seats) {
  const recipe = Object.fromEntries(['background','body','accessory','head','glasses'].map(key => [key,seat[key]]));
  const seed = {background:recipe.background === 'cool' ? 0 : 1};
  for (const [key,list] of Object.entries({body:'bodies',accessory:'accessories',head:'heads',glasses:'glasses'})) {
    seed[key] = source.images[list].findIndex(part=>part.filename===recipe[key]);
    if (seed[key]<0) throw Error('Missing official trait: '+recipe[key]);
  }
  const svg = renderPortrait(recipe).svg+'\n';
  if (renderSeed(seed).svg+'\n' !== svg) throw Error('Official numeric seed differs: '+seat.slug);
  const existing = read(`public/images/ufogp/${seat.slug}.svg`);
  if (hash(existing)!==hash(svg)) throw Error('Seat art drift: '+seat.slug);
  const alt = `${seat.name}, ${seat.kind === 'human' ? 'human seat' : 'AI agent seat'}: whole official-trait Noun with ${recipe.head.replace('head-','').replaceAll('-',' ')} head.`;
  add('portraits/'+seat.slug,320,320,svg,alt);
  manifest.seats.push({name:seat.name,slug:seat.slug,kind:seat.kind,recipe,seed,svg:urlBase+'portraits/'+seat.slug+'.svg',png:urlBase+'portraits/'+seat.slug+'.png',svgSha256:hash(svg),existingArt:`/images/ufogp/${seat.slug}.svg`,alt});
}
// A cassette sleeve: large letterforms, restrained geometry, warm stock, no brand imitation.
const spokes = (cx,cy) => Array.from({length:6},(_,i)=>`<path d="M${cx} ${cy-32}v-66" stroke="${C.paper}" stroke-width="20" transform="rotate(${i*60} ${cx} ${cy})"/>`).join('');
const reel = (cx,cy) => `<circle cx="${cx}" cy="${cy}" r="120" fill="${C.ink}"/>${spokes(cx,cy)}<circle cx="${cx}" cy="${cy}" r="27" fill="${C.gold}"/>`;
const sleeve = wrap(1600,1600,'After Hours — Saturday night reading tape. Take nothing, leave maps.',
  rect(0,0,1600,1600,C.paper)+rect(0,0,32,1600,C.rust)+
  text(96,115,'UFOGP / SATURDAY NIGHT',32,C.ink,'font-weight="700" letter-spacing="3"')+text(1504,115,'01 / A + B',28,C.ink,'text-anchor="end"')+
  text(82,385,'AFTER',300,C.ink,'font-weight="900" letter-spacing="-17"')+text(80,650,'HOURS',300,C.rust,'font-weight="900" letter-spacing="-17"')+
  `<path d="M1040 700a390 390 0 0 1 464 400v160h-464z" fill="${C.sage}"/>`+
  rect(96,746,1408,602,C.gold,40)+rect(128,778,1344,538,C.ink,20)+rect(153,803,1294,488,C.paper,13)+
  text(204,874,'THE ROOM GETS QUIET.',38,C.ink,'font-weight="700"')+text(204,927,'THEN THE ROOM WAKES UP.',38,C.ink,'font-weight="700"')+
  rect(204,974,1192,242,C.rust,121)+rect(483,1068,636,58,C.ink)+reel(404,1095)+reel(1196,1095)+
  text(96,1447,'take nothing, leave maps',64,C.ink,'font-weight="700" letter-spacing="-2"')+
  text(96,1525,'SIDE A / A LITTLE QUIET',26)+text(1504,1525,'SIDE B / A LITTLE NOISE',26,C.ink,'text-anchor="end"'));
add('cassette-sleeve',1600,1600,sleeve,'After Hours cassette sleeve in cream, rust, gold and deep green; two tape reels under large After Hours type. The line reads take nothing, leave maps.');
// A warm edition of the established open-map flag: six paths, with an open seventh route.
const colors=[C.rust,C.gold,C.sage,C.rose,C.ink,'#8a6953'];
const map = `<path d="M280 220l340-50 360 70 340-50v500l-340 50-360-70-340 50z" fill="${C.paper}"/><path d="M620 170v500m360-430v500" stroke="${C.gold}" stroke-width="5"/>`+
 colors.map((color,i)=>`<path d="M${350+i*175} ${290+(i%2)*80} Q${420+i*130} 500 800 575" fill="none" stroke="${color}" stroke-width="13"/>`).join('')+
 `<circle cx="800" cy="575" r="23" fill="${C.ink}"/><path d="M825 575q200-15 390 65" fill="none" stroke="${C.ink}" stroke-width="9" stroke-dasharray="16 15"/>`;
add('flag',1600,1000,wrap(1600,1000,'UFOGP open-map flag — take nothing, leave maps',rect(0,0,1600,1000,C.ink)+text(100,125,'UFOGP',84,C.paper,'font-weight="900"')+text(1500,115,'AFTER HOURS',30,C.paper,'text-anchor="end" letter-spacing="4"')+map+text(800,884,'take nothing, leave maps',68,C.paper,'text-anchor="middle" font-weight="700" letter-spacing="-2"')), 'Warm UFOGP flag: six coloured paths meet on an open folded map; a dotted seventh path stays open. Take nothing, leave maps.');
// Native 320px portraits, not cropped faces. Use individual portraits beside live HTML words.
const whole = (svg,x,y) => `<g data-whole-noun="true" transform="translate(${x} ${y})">${svg.trim().replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace('width="100%" height="100%"','width="320" height="320"')}</g>`;
let crew = rect(0,0,1200,840,C.paper)+text(40,44,'SIX SEATS / ONE ROOM',34,C.ink,'font-weight="700" letter-spacing="2"');
seats.forEach((seat,i)=>{const x=40+(i%3)*400,y=i<3?70:455;crew+=whole(files[i].svg,x,y)+text(x+160,y+357,seat.name,30,C.ink,'text-anchor="middle" font-weight="700"')+text(x+160,y+380,seat.kind==='human'?'HUMAN':'AI AGENT',16,C.ink,'text-anchor="middle" letter-spacing="2"');});
add('crew-sheet',1200,840,wrap(1200,840,'UFOGP tribute portraits: Mike, Loom desk, Ada, Sid, Tess and Lou. One human and five AI agents.',crew),'Six whole Nouns in two rows: Mike, Loom desk, Ada, Sid, Tess and Lou. One human seat and five AI agent seats.');
// PNG is a deterministic fallback. Set AFTER_HOURS_SVG_ONLY=1 for dependency-free SVG rebuilding.
let Resvg;
if (process.env.AFTER_HOURS_SVG_ONLY !== '1') ({Resvg}=process.env.UFOGP_RESVG_MODULE ? await import(pathToFileURL(process.env.UFOGP_RESVG_MODULE).href) : await import('@resvg/resvg-js'));
for (const file of files) {
  const pngPath = folder+file.name+'.png';
  if (Resvg) out(file.name+'.png',new Resvg(file.svg,{font:{defaultFontFamily:'DejaVu Sans'}}).render().asPng());
  const png=read(pngPath);
  manifest.assets.push({name:file.name,svg:urlBase+file.name+'.svg',png:urlBase+file.name+'.png',width:file.width,height:file.height,alt:file.alt,svgSha256:hash(file.svg),pngSha256:hash(png),bytes:{svg:Buffer.byteLength(file.svg),png:png.length}});
}
manifest.flagInspiration = json('public/images/ufogp/provenance.json').interview;
manifest.proof = urlBase+'proof.html';
const portraitFigures = manifest.seats.map(seat => `<figure><img src="portraits/${seat.slug}.svg" width="320" height="320" alt="${esc(seat.alt)}"><figcaption><strong>${esc(seat.name)}</strong><span>${seat.kind==='human'?'Human seat':'AI agent seat'}</span><a href="portraits/${seat.slug}.svg">SVG</a> / <a href="portraits/${seat.slug}.png">PNG</a></figcaption></figure>`).join('');
out('proof.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>After Hours — art proof</title><style>
*{box-sizing:border-box}body{margin:0;background:${C.paper};color:${C.ink};font:18px/1.5 Arial,sans-serif}main{max-width:1100px;margin:auto;padding:24px}h1{font-size:clamp(48px,9vw,100px);line-height:.95;letter-spacing:-.05em;margin:25px 0}h2{font-size:30px;margin-top:40px}a{color:inherit;text-underline-offset:4px}a:focus-visible{outline:3px solid ${C.rust};outline-offset:4px}img{display:block;width:100%;height:auto}figure{margin:0}figcaption{margin-top:12px}figcaption span{display:block}strong{font-size:24px}.hero{max-width:800px}.portraits{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}.portraits img{image-rendering:pixelated}.label{font-size:14px;letter-spacing:.1em;text-transform:uppercase}.note{max-width:65ch}footer{border-top:2px solid;margin-top:40px;padding-top:20px;font-size:16px}@media(max-width:600px){main{padding:16px}.portraits{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}strong{font-size:22px}}@media print{main{padding:0}figure{break-inside:avoid}.hero{max-width:140mm}.portraits{grid-template-columns:repeat(3,1fr)}}
</style></head><body><main><p class="label">Draft art / OFF-62 / 14 Nov 2026 PT</p><h1>After Hours</h1><p class="note">Cassette sleeve, open-map flag and six whole Nouns. Art by Sid, an AI agent for Mike. This is an asset proof for Tess’s page draft, not the finished page.</p><section class="hero"><h2>The sleeve</h2><img src="cassette-sleeve.svg" width="1600" height="1600" alt="${esc(manifest.assets.find(a=>a.name==='cassette-sleeve').alt)}"><p><a href="cassette-sleeve.svg">Sleeve SVG</a> / <a href="cassette-sleeve.png">PNG</a></p></section><section><h2>The six seats</h2><p>Use the individual portraits beside live text from Ada. Each portrait keeps the complete official-trait canvas and original colours.</p><div class="portraits">${portraitFigures}</div></section><section><h2>The flag</h2><img src="flag.svg" width="1600" height="1000" alt="${esc(manifest.assets.find(a=>a.name==='flag').alt)}"><p><a href="flag.svg">Flag SVG</a> / <a href="flag.png">PNG</a></p></section><section><h2>Crew contact sheet</h2><img src="crew-sheet.svg" width="1200" height="840" alt="Six whole Nouns: Mike, Loom desk, Ada, Sid, Tess and Lou."></section><footer><p>take nothing, leave maps</p><p>Official Nouns traits: CC0. Original code-drawn sleeve and flag: CC0. No image generation.</p><a href="manifest.json">Trait recipes, hashes and alt text</a> · <a href="crew-sheet.png">Crew contact sheet</a></footer></main></body></html>\n`);
out('manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Wrote 6 exact whole seat portraits, cassette sleeve, open-map flag, crew sheet and provenance (SVG + PNG).');
