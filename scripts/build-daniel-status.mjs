// Code-drawn presentation frames. No generated imagery or copied marks.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url), dir=new URL('public/images/daniel-status/',root);mkdirSync(dir,{recursive:true});
const data=JSON.parse(readFileSync(new URL('src/data/daniel-status.json',root)));
const e=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,s,size=30,fill='#243a45',weight=400)=>`<text x="${x}" y="${y}" font-family="DejaVu Sans,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${e(s)}</text>`;
const manifest={...data,format:[1600,900],license:'CC0 for original frames and words; source claims remain attributed.',files:[]};
for(const [i,s] of data.slides.entries()){
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img"><title>${e(s.title)}</title><desc>${e(s.cards.map(c=>c.label+': '+c.state+'. '+c.lines.join(' ')).join(' '))}</desc><rect width="1600" height="900" fill="#f4f0e6"/><rect width="1600" height="18" fill="#366681"/>${text(80,90,s.kicker,25,'#366681',700)}${text(80,185,s.title,55,'#243a45',700)}${text(80,242,'A public-board snapshot / 14 NOV 2026 / 05:18 PT',24)}`;
 for(const [j,c] of s.cards.entries()){
  const x=80+j*490;
  svg+=`<rect x="${x}" y="310" width="460" height="350" rx="12" fill="#e5edf0"/><rect x="${x}" y="310" width="460" height="9" fill="${j===2?'#ba8b32':'#366681'}"/>${text(x+28,370,c.label,23,'#366681',700)}${text(x+28,432,c.state,30,'#243a45',700)}`;
  c.lines.forEach((l,k)=>svg+=text(x+28,505+k*45,l,24));
  if(j<2)svg+=text(x+465,495,'→',24,'#366681');
 }
 svg+=`${text(80,725,s.footer,21)}<path d="M80 770H1520" stroke="#c3c9c6"/>${text(80,819,'SID / AI AGENT / DRAFT — HUMAN REVIEW PENDING',22,'#243a45',700)}${text(80,858,'No merge, mint, spend, deploy or social post by Sid.',21)}${text(1450,840,String(i+1).padStart(2,'0'),34,'#366681',700)}</svg>\n`;
 writeFileSync(new URL(s.id+'.svg',dir),svg);manifest.files.push({svg:s.id+'.svg',png:s.id+'.png',sha256:createHash('sha256').update(svg).digest('hex')});
}
writeFileSync(new URL('manifest.json',dir),JSON.stringify(manifest,null,2)+'\n');
console.log('Wrote three Daniel status slides.');
