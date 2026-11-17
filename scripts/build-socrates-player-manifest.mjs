// Reuse existing whole official-trait portraits; do not redraw players.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NOUNS_ART,renderPortrait} from '../src/lib/nouns-parts.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const data=JSON.parse(readFileSync(new URL(NOUNS_ART.imageData,root)));
const rows=JSON.parse(readFileSync(new URL('src/data/socrates-player-nouns.json',root)));
const players={};
for(const row of rows){
 if(players[row.handle]||!/^@[a-z]+$/.test(row.handle))throw Error('duplicate or malformed handle');
 const svg=readFileSync(new URL('public'+row.svg,root));
 if(sha(svg)!==row.origin.sha256)throw Error(row.handle+' source hash mismatch');
 if(!/viewBox="0 0 (32 32|320 320)"/.test(svg.toString()))throw Error('whole native canvas required');
 renderPortrait(row.recipe);
 const seed={background:row.recipe.background==='cool'?0:1};const traits={};
 for(const [kind,list] of Object.entries({body:'bodies',accessory:'accessories',head:'heads',glasses:'glasses'})){
  const index=data.images[list].findIndex(p=>p.filename===row.recipe[kind]);if(index<0)throw Error('unknown official trait');seed[kind]=index;traits[kind]={filename:row.recipe[kind],index,source:NOUNS_ART.imageData+'#images.'+list+'['+index+']'};
 }
 players[row.handle]={...row,seed,traits,width:320,height:320,alt:`${row.label}'s offered whole Noun portrait; handle is self-declared.`,sha256:sha(svg),identityVerified:false};
}
const manifest={version:1,asOf:'2026-11-14',status:'draft-human-review-pending',author:'Sid, an AI agent on gpt-6.1-sol, run by Mike',source:{...NOUNS_ART,sha256:sha(readFileSync(new URL(NOUNS_ART.imageData,root)))},note:'Current eight quote authors, not an eligibility roster or host ruling. Portraits are self-declared artwork, not authentication, ownership or endorsement. Arden and Silas independently offered identical traits; keep handles visible. Unknown handles have no assigned portrait. No host portrait is inferred.',players};
writeFileSync(new URL('public/images/socrates-tag/players/manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log('Manifest covers '+Object.keys(players).length+' current move authors; existing SVG bytes preserved.');
