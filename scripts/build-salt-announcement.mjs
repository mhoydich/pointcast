// Layout only, Ada's approved-for-drafting source copy retained verbatim in JSON.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root=new URL('../',import.meta.url),dir=new URL('public/images/salt-announcement/',root);mkdirSync(dir,{recursive:true});
const ads=JSON.parse(readFileSync(new URL('src/data/salt-announcement-copy.json',root)));
const limit=Number(process.argv.find(x=>x.startsWith('--limit='))?.split('=')[1]||8);
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const text=(x,y,t,size=38,c='#292b2a',font='sans-serif')=>`<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${c}">${esc(t)}</text>`;
function block(s,x,y,width,size,lh,font='sans-serif',color='#292b2a'){
 const max=Math.floor(width/(size*(font==='monospace'?.61:.54)));let lines=[];
 for(const para of s.split('\n')){let row='';for(const w of para.split(' ')){if((row+' '+w).trim().length>max){lines.push(row);row=w;}else row=(row+' '+w).trim();}if(row)lines.push(row);}
 return {svg:lines.map((s,i)=>text(x,y+i*lh,s,size,color,font)).join(''),bottom:y+(lines.length-1)*lh};
}
const manifest={status:'draft-human-review-pending',layoutBy:'Sid, an AI agent',copyBy:'Ada, an AI agent',room:'#ufogp',dimensionsNote:'Illustrative 6×8 inch full and 6×4 inch half pages at 300 pixels/inch. Not a purchased placement or a magazine mechanical specification.',ads:[]};
for(const a of ads.slice(0,limit)){
 const w=1800,h=a.format==='full'?2400:1200;let b='',bg='#faf8f0',ink='#292b2a',headlineY=320,bodyY=650,bodySize=40,bodyW=1450,font='sans-serif';
 if([1,3,6].includes(a.id)){
  bg='#efcf75';b+=rect(45,45,1710,h-90,'#c84e36')+rect(85,85,1630,h-170,'#fff3ce');
  b+=text(140,180,'SALT',65,'#a13c2d','serif');headlineY=350;bodyY=650;
  if(a.id===3){b+=`<circle cx="1370" cy="650" r="180" fill="#e7af32"/>`;bodyY=1100;bodyW=1400;}
  if(a.id===6){headlineY=260;bodyY=440;bodySize=34;}
 }else if(a.id===2){headlineY=420;bodyY=810;bodySize=30;b+=text(140,180,'SALT',46);}
 else if(a.id===4||a.id===8){font='monospace';bg='#f4f0df';headlineY=300;bodyY=a.id===8?470:800;bodySize=a.id===8?31:42;for(let x=100;x<1750;x+=100)b+=`<path d="M${x} 100V${h-140}" stroke="#dcd7c3" stroke-width="1"/>`;b+=text(140,160,'SALT / FIELD INSTRUCTIONS',35,ink,'monospace');}
 else if(a.id===5){bg='#e6e7df';headlineY=300;bodyY=1250;font='monospace';bodySize=36;b+=text(140,150,'SALT / INSPECTION SHEET',34,ink,'monospace')+rect(480,570,800,460,'#c1c8c5')+rect(530,520,800,460,'#fff')+text(605,680,'BRIEF',65)+text(605,775,'AUDIENCE / PURPOSE / LIMITS',28);}
 else {bg='#fff';headlineY=420;bodyY=1100;b+=text(140,160,'SALT',55);for(let i=0;i<18;i++)b+=rect(105+i*90,180,1,h-390,'#ededeb');}
 const head=block(a.headline,140,headlineY,1500,a.id===2?84:82,95,[1,3,6].includes(a.id)?'serif':font,ink);b+=head.svg;
 const body=block(a.body,140,Math.max(bodyY,head.bottom+150),bodyW,bodySize,Math.round(bodySize*1.48),font,ink);b+=body.svg;
 const sign=block(a.signoff,140,h-215,1480,30,42,'sans-serif',ink);b+=sign.svg;
 b+=text(140,h-70,'DRAFT / COPY: ADA · LAYOUT: SID / AI AGENTS / HUMAN REVIEW PENDING',20,ink,'monospace');
 if(body.bottom>h-300)throw new Error('Copy overlaps signoff '+a.id+' at '+body.bottom);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${esc(a.headline)}</title>${rect(0,0,w,h,bg)}${b}</svg>\n`;
 const name='salt-'+String(a.id).padStart(2,'0');writeFileSync(new URL(name+'.svg',dir),svg);manifest.ads.push({...a,svg:'/images/salt-announcement/'+name+'.svg',png:'/images/salt-announcement/'+name+'.png',dimensions:[w,h],bodyBottom:body.bottom,signoffTop:h-215});
}
writeFileSync(new URL('manifest.json',dir),JSON.stringify(manifest,null,2)+'\n');console.log('Wrote '+manifest.ads.length+' SALT layouts.');
