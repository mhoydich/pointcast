import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const pub = path.join(root, 'public');
const bandmates = JSON.parse(await fs.readFile('src/data/nouns-drum-club-bandmates.json', 'utf8'));
const ink = '#171717', cream = '#f5f0e7';
const font = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
const regular = '/System/Library/Fonts/Supplemental/Arial.ttf';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const text = (value, x, y, size, extra = '') => `<text x="${x}" y="${y}" fill="${ink}" font-family="Arial" font-weight="700" font-size="${size}" ${extra}>${esc(value)}</text>`;
const svg = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${esc(title)}</title>${body}</svg>`;
const rect = (x,y,w,h,color) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
const image = (data,x,y,w,h,fit='xMidYMid meet') => `<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${fit}" href="${data}"/>`;
const noggles = (x,y,s=1,color=ink) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}" fill-rule="evenodd"><path d="M0 0h22v7h7V0h22v25H29V14h-7v11H0Zm6 6v13h10V6Zm29 0v13h10V6Z"/></g>`;
async function renderSvg(source, width, height) {
  const raw = new Resvg(source, { font: { fontFiles: [font, regular], loadSystemFonts: false } }).render().asPng();
  const out = await sharp(raw).png({ palette: true, quality: 90, colours: 192, effort: 10 }).toBuffer();
  const meta = await sharp(out).metadata();
  if (meta.width !== width || meta.height !== height) throw new Error('Wrong rendered dimensions');
  return out;
}

await fs.mkdir(path.join(pub,'images/nouns-drum-club/bandmates'),{recursive:true});
const provenance=[];
for (const b of bandmates) {
  const original = await fs.readFile(path.join(pub,`games/nouns-nation-battler/assets/noun-${b.nounId}.svg`),'utf8');
  const body = original.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'').replace(/<rect width="100%" height="100%"[^>]*\/>/,'');
  const face = `<svg x="270" y="250" width="1080" height="1080" viewBox="0 0 320 320" shape-rendering="crispEdges">${body}</svg>`;
  const hits = Array.from({length:16},(_,i)=>Math.max(...b.score.lanes.map(l=>l.steps[i])));
  const bars = hits.map((v,i)=>rect(72+i*92,1115-v*155,66,18+v*155,v ? ink : '#ffffff66')).join('');
  const titleSize = b.name.length > 16 ? 85 : b.name.length > 12 ? 100 : 120;
  const graphic = svg(1600,1600,
    rect(0,0,1600,1600,b.color)+
    text('NOUNS DRUM CLUB',72,94,42,'letter-spacing="3"')+text('BANDMATES',1138,94,32,'letter-spacing="3"')+
    `<circle cx="800" cy="690" r="465" fill="${cream}"/>`+
    text(b.number,65,390,272,'opacity=".13"')+face+
    rect(0,1170,1600,430,cream)+bars+
    text(`${b.role.toUpperCase()} / ${b.tempo} BPM`,72,1267,35,'letter-spacing="2"')+
    text(b.name.toUpperCase(),65,1410,titleSize,'letter-spacing="-5"')+
    text('EVERYBODY’S IN THE BAND.',72,1518,34)+text(`${b.number} / 12`,1310,1518,34),
    `${b.number}. ${b.name}. A ${b.role} bandmate, ${b.tempo} beats per minute. The sixteen bars show its rhythm.`);
  const png = await renderSvg(graphic,1600,1600);
  const webp = await sharp(png).resize(800,800).webp({quality:90}).toBuffer();
  await fs.writeFile(path.join(pub,b.artwork.svg),graphic);
  await fs.writeFile(path.join(pub,b.artwork.png),png);
  await fs.writeFile(path.join(pub,b.artwork.webp),webp);
  provenance.push({id:b.id,number:b.number,name:b.name,sourceNoun:b.nounId,artwork:b.artwork,artifactSha256:hash(png),scoreSha256:hash(JSON.stringify(b.score)),width:1600,height:1600,status:'not-minted'});
}

const sizes = [[300,250],[336,280],[728,90],[970,250],[300,600],[160,600],[320,50],[320,100],[1080,1080],[1080,1920]];
const concepts = [
  {id:'everybody',art:'everybody-band',headline:['EVERYBODY’S','IN THE BAND.'],short:'EVERYBODY’S IN.',copy:'36 sounds. You belong here.',bg:cream,alt:'Four sculptural Noun musicians make a band around a giant keyboard key.'},
  {id:'no-audition',art:'no-audition',headline:['NO AUDITION.','JUST PRESS A KEY.'],short:'NO AUDITION.',copy:'Your first note is a good note.',bg:'#ff6c24',alt:'A joyful yellow Noun steps on a giant A key.'},
  {id:'one-more',art:'one-more',headline:['ROOM FOR','ONE MORE.'],short:'ROOM FOR ONE MORE.',copy:'Bring a friend. Find your sound.',bg:'#bd9ed9',alt:'An empty stool and red Noggles wait for you among the Noun band.'},
];
const adsDir=path.join(pub,'ads/nouns-drum-club');await fs.mkdir(adsDir,{recursive:true});
const assets=[];
for (const c of concepts) {
  const source=await fs.readFile(path.join(pub,`images/nouns-drum-club/campaign/${c.art}.png`));
  await fs.writeFile(path.join(pub,`images/nouns-drum-club/campaign/${c.art}.webp`),await sharp(source).webp({quality:88}).toBuffer());
  const picture=`data:image/png;base64,${source.toString('base64')}`;
  for (const [w,h] of sizes) {
    let body=rect(0,0,w,h,c.bg);
    const button=(x,y,width,height,size=14)=>rect(x,y,width,height,ink)+`<text x="${x+width/2}" y="${y+height/2+size*.35}" fill="${cream}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="${size}">PLAY FREE</text>`;
    if(h===50){
      body+=noggles(10,16,.65)+text(c.short,52,23,c.id==='one-more'?12:14)+text('NOUNS DRUM CLUB',52,39,9)+button(w-90,4,86,42,12);
    } else if(h<=100){
      const compact=w<400;
      if(compact){body+=noggles(12,12,.5)+text('NOUNS DRUM CLUB',47,22,10)+text(c.headline[0],12,49,22)+text(c.headline[1],12,73,c.id==='no-audition'?17:22)+button(w-99,34,91,56,12);}
      else {body+=image(picture,0,0,125,h,'xMidYMid meet')+text('NOUNS DRUM CLUB / POINTCAST',140,19,10)+text(c.headline[0]+' '+c.headline[1],140,49,c.id==='no-audition'?20:22)+text(c.copy,140,73,13)+button(w-132,23,120,44);}
    } else if(w>h*2){
      body+=image(picture,w*.56,0,w*.44,h,'xMidYMid meet')+text('NOUNS DRUM CLUB / POINTCAST',26,29,13)+text(c.headline[0],24,90,48)+text(c.headline[1],24,139,c.id==='no-audition'?40:48)+text(c.copy,26,173,16)+button(26,191,148,42,15);
    } else if(h>=w*1.5){
      const narrow=w<200, scale=w/300;
      if(narrow){
        body+=text('NOUNS',12,24,14)+text('DRUM CLUB',12,42,14)+noggles(12,68,.9);
        const lines=c.id==='everybody'?['EVERY','BODY’S','IN THE','BAND.']:c.id==='no-audition'?['NO','AUDITION.','JUST','PLAY.']:['ROOM','FOR ONE','MORE.'];
        lines.forEach((line,i)=>body+=text(line,10,140+i*35,line.length>7?25:31));
        body+=image(picture,0,292,w,212,'xMidYMid meet')+text('Free to play.',12,535,13)+button(12,551,w-24,37,13);
      } else {
        body+=text('NOUNS DRUM CLUB / POINTCAST',24*scale,38*scale,11*scale);
        c.headline.forEach((line,i)=>body+=text(line,22*scale,(106+i*41)*scale,(c.id==='no-audition'?30:36)*scale,'letter-spacing="-1"'));
        body+=image(picture,0,h*.31,w,h*.44,'xMidYMid meet')+text(c.copy,24*scale,h*.80,14*scale)+text('Free music. Good company.',24*scale,h*.84,12*scale)+button(24*scale,h-72*scale,w-48*scale,48*scale,16*scale);
      }
    } else if(w>=1000){
      body+=text('NOUNS DRUM CLUB / POINTCAST',48,61,23)+text(c.headline[0],42,189,103)+text(c.headline[1],42,297,c.id==='no-audition'?86:103)+image(picture,0,333,w,560,'xMidYMid meet')+text(c.copy,48,954,29)+button(w-310,932,262,84,28)+text('EVERYBODY’S IN THE BAND.',48,1036,21);
    } else {
      const s=w/300;
      body+=text('NOUNS DRUM CLUB / POINTCAST',13*s,18*s,9*s)+text(c.headline[0],11*s,49*s,27*s)+text(c.headline[1],11*s,78*s,(c.id==='no-audition'?24:27)*s)+image(picture,0,88*s,w,h-129*s,'xMidYMid meet')+text('Free to play.',13*s,h-17*s,12*s)+button(w-121*s,h-37*s,110*s,30*s,12*s);
    }
    body+=`<rect x=".5" y=".5" width="${w-1}" height="${h-1}" fill="none" stroke="${ink}" stroke-opacity=".4"/>`;
    const label=`Nouns Drum Club. ${c.headline.join(' ')} ${c.copy} Play free.`;
    const graphic=svg(w,h,body,label), png=await renderSvg(graphic,w,h),name=`${c.id}-${w}x${h}`;
    await fs.writeFile(path.join(adsDir,`${name}.svg`),graphic.replace(picture,`../../images/nouns-drum-club/campaign/${c.art}.png`));
    await fs.writeFile(path.join(adsDir,`${name}.png`),png);
    const href=`https://pointcast.xyz/nouns/drum-club/?utm_source=house-network&utm_medium=display&utm_campaign=everybody-in-the-band&utm_content=${name}`;
    await fs.writeFile(path.join(adsDir,`${name}.html`),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(label)}</title><style>*{box-sizing:border-box}html,body{margin:0}a{display:block;width:min(100%,${w}px);line-height:0}a:focus-visible{outline:3px solid #171717;outline-offset:-4px}img{display:block;width:100%;height:auto}</style><a href="${esc(href)}" target="_blank" rel="noopener" aria-label="Advertisement: ${esc(label)}"><img src="${name}.png" width="${w}" height="${h}" alt="${esc(label)}"></a></html>`);
    assets.push({id:name,concept:c.id,width:w,height:h,headline:c.headline.join(' '),alt:label,png:`/ads/nouns-drum-club/${name}.png`,svg:`/ads/nouns-drum-club/${name}.svg`,html:`/ads/nouns-drum-club/${name}.html`,href,bytes:png.length,sha256:hash(png)});
  }
}
await fs.writeFile(path.join(adsDir,'campaign.json'),JSON.stringify({id:'PC-NOUNS-EVERYBODY-2026',title:'Everybody’s in the band.',status:'house',adAudio:'none',animation:'none',concepts:concepts.map(({id,headline,copy,alt,art})=>({id,headline:headline.join(' '),copy,alt,image:`/images/nouns-drum-club/campaign/${art}.webp`})),assets},null,2));
await fs.writeFile(path.join(pub,'images/nouns-drum-club/bandmates/provenance.json'),JSON.stringify({collection:'Nouns Drum Club Bandmates',status:'not-minted',items:provenance},null,2));
console.log(JSON.stringify({bandmates:provenance.length,adSizes:sizes.length,adAssets:assets.length,maxStandardAdBytes:Math.max(...assets.filter(a=>a.width<1080).map(a=>a.bytes))},null,2));
