// Morning Nouns: whole official CC0 Nouns, rendered by code. No generated pixels.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderPortrait,NOUNS_ART} from '../src/lib/nouns-parts.mjs';
const root=new URL('../',import.meta.url),dir=new URL('public/images/morning-nouns/',root);mkdirSync(dir,{recursive:true});
const rows=JSON.parse(readFileSync(new URL('src/data/morning-nouns.json',root)));
const limit=Number(process.argv.find(s=>s.startsWith('--limit='))?.split('=')[1]||6);
if(!Number.isInteger(limit)||limit<1||limit>6)throw new Error('limit must be 1–6');
const data=JSON.parse(readFileSync(new URL(NOUNS_ART.imageData,root)));
const sha=b=>createHash('sha256').update(b).digest('hex');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const txt=(x,y,s,size,fill)=>`<text x="${x}" y="${y}" font-family="sans-serif" font-size="${size}" fill="${fill}">${esc(s)}</text>`;
const manifest={title:'Morning Nouns',date:'2026-11-14',status:'draft-human-review-pending',author:'Sid, an AI agent on gpt-6.1-sol, run by Mike',source:NOUNS_ART,sourceSha256:sha(readFileSync(new URL(NOUNS_ART.imageData,root))),note:'Six new whole-Noun combinations for the morning brief. Not numbered Ethereum Nouns, minted tokens, seat assignments or claims about a person. Native trait colours are unchanged. Frames and words are original code-drawn drafts.',items:[]};
const outputs=[];
for(const row of rows.slice(0,limit)){
 const recipe=Object.fromEntries(['background','body','accessory','head','glasses'].map(k=>[k,row[k]]));
 const native=renderPortrait(recipe).svg+'\n';
 const seed={background:recipe.background==='cool'?0:1};
 const traits={};
 for(const [kind,list] of Object.entries({body:'bodies',accessory:'accessories',head:'heads',glasses:'glasses'})){
  const index=data.images[list].findIndex(p=>p.filename===recipe[kind]);if(index<0)throw new Error('Missing official trait '+recipe[kind]);seed[kind]=index;traits[kind]={filename:recipe[kind],index,source:NOUNS_ART.imageData+'#images.'+list+'['+index+']'};
 }
 const inner=native.trim().replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace('width="100%" height="100%"','width="320" height="320"');
 const card=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img"><title>${esc(row.title)} — Morning Noun draft</title><rect width="1200" height="1200" fill="${row.paper}"/><rect x="45" y="45" width="1110" height="1110" rx="6" fill="none" stroke="${row.ink}" stroke-width="3"/><circle cx="1030" cy="145" r="48" fill="${row.accent}"/>${txt(85,120,'MORNING NOUNS / '+String(row.id).padStart(2,'0'),26,row.ink)}${txt(85,205,row.title,66,row.ink)}<svg x="280" y="270" width="640" height="640" viewBox="0 0 320 320" shape-rendering="crispEdges">${inner}</svg><rect x="85" y="960" width="1030" height="8" fill="${row.accent}"/>${txt(85,1040,row.line,38,row.ink)}${txt(85,1100,'DRAFT / SID, AI AGENT / HUMAN REVIEW PENDING',22,row.ink)}${txt(85,1136,'Official Nouns traits · CC0 · pixels rendered by code',18,row.ink)}</svg>\n`;
 for(const [suffix,body] of [['',native],['-card',card]]){const name=row.slug+suffix;writeFileSync(new URL(name+'.svg',dir),body);outputs.push(name);}
 manifest.items.push({id:row.id,slug:row.slug,title:row.title,line:row.line,recipe,seed,traits,portrait:{svg:row.slug+'.svg',png:row.slug+'.png',size:[320,320],sha256:sha(native)},card:{svg:row.slug+'-card.svg',png:row.slug+'-card.png',size:[1200,1200],sha256:sha(card)},alt:`Whole Noun with ${row.head.replace('head-','')} head and ${row.body.replace('body-','')} body. ${row.title}.`});
}
writeFileSync(new URL('manifest.json',dir),JSON.stringify(manifest,null,2)+'\n');
if(process.argv.includes('--png')){const {Resvg}=await import('@resvg/resvg-js');for(const name of outputs)writeFileSync(new URL(name+'.png',dir),new Resvg(readFileSync(new URL(name+'.svg',dir)),{font:{defaultFontFamily:'DejaVu Sans'}}).render().asPng());}
console.log('Wrote '+manifest.items.length+' morning portraits and cards.');
