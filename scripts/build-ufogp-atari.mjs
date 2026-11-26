// R6 NOUNS: style around the whole official Noun; never recolor its pixels.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const seats=JSON.parse(readFileSync(new URL('src/data/ufogp-seats.json',root)));
const dir=new URL('public/images/ufogp/',root);mkdirSync(dir,{recursive:true});
const c={silver:'#d4dae0',ink:'#192434',blue:'#344b92',pink:'#a33579',teal:'#3d8a91'};
const text=(x,y,s,size=24,fill=c.ink)=>`<text x="${x}" y="${y}" font-family="monospace" font-size="${size}" fill="${fill}">${s}</text>`;
const wrap=(w,h,title,b)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${title}</title><rect width="${w}" height="${h}" fill="${c.silver}"/>${b}</svg>\n`;
const noun=(s,x,y,z)=>`<svg x="${x}" y="${y}" width="${z}" height="${z}" viewBox="0 0 320 320">${readFileSync(new URL(s.slug+'.svg',dir),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace('width="100%" height="100%"','width="320" height="320"')}</svg>`;
const stripe=(w,y)=>`<rect y="${y}" width="${w}" height="9" fill="${c.blue}"/><rect y="${y+9}" width="${w}" height="4" fill="${c.pink}"/><rect y="${y+13}" width="${w}" height="3" fill="${c.teal}"/>`;
for(const s of seats){
 const b=text(35,55,'UFOGP / SEAT '+String(s.id).padStart(2,'0'),25)+stripe(640,78)+noun(s,80,125,480)+text(35,665,s.name.toUpperCase(),42)+text(35,707,s.kind==='agent'?'AI AGENT / '+s.model:'HUMAN / FOUNDER',18)+text(35,754,'OFFICIAL NOUNS TRAITS / CC0',17);
 writeFileSync(new URL(s.slug+'-card.svg',dir),wrap(640,800,s.name+' seat card',b));
}
writeFileSync(new URL('flag.svg',dir),wrap(960,640,'UFOGP flag / six seats',stripe(960,40)+text(45,205,'UFOGP',130)+text(50,280,'UNITED FEDERATION',40)+text(50,335,'OF GOOD PIRATES',40)+text(50,535,'TAKE NOTHING. LEAVE MAPS.',34)+stripe(960,580)));
const b=stripe(1200,40)+text(40,145,'UFOGP / SIX SEATS',54)+seats.map((s,i)=>noun(s,40+i*190,205,175)+text(40+i*190,415,s.name,20)).join('')+text(40,510,'TAKE NOTHING. LEAVE MAPS.',38)+text(40,580,'Whole Nouns / CC0 / AI agents and a human',21);
writeFileSync(new URL('share-card.svg',dir),wrap(1200,630,'UFOGP six seat share card',b));
const p=JSON.parse(readFileSync(new URL('provenance.json',dir)));p.style={reference:'Atari 130XE-inspired silver case, blue/magenta/teal rule, monospaced labels; no Atari logo or product artwork',palette:c,note:'Official Nouns palette unchanged. New combinations, not numbered Ethereum Nouns.',cards:seats.map(s=>'/images/ufogp/'+s.slug+'-card.svg')};writeFileSync(new URL('provenance.json',dir),JSON.stringify(p,null,2)+'\n');
console.log('Wrote six Atari-inspired cards, flag, share card and style provenance.');
