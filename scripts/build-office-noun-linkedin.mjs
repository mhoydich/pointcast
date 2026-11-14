// All Nouns use official RLE traits. Scenes and furniture are vector code, no generated pixels.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderPortrait,NOUNS_ART} from '../src/lib/nouns-parts.mjs';
const root=new URL('../',import.meta.url),out=new URL('public/images/office-noun-linkedin/',root);mkdirSync(out,{recursive:true});
const rows=JSON.parse(readFileSync(new URL('src/data/office-noun-linkedin.json',root)));
const limit=Number(process.argv.find(a=>a.startsWith('--limit='))?.split('=')[1]||20);
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const line=(x,y,x2,y2,c='#263b46',w=5)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${c}" stroke-width="${w}" fill="none"/>`;
const text=(x,y,s,size=24,c='#263b46',family='sans-serif')=>`<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${c}">${esc(s)}</text>`;
const wrap=(w,h,title,b,bg='#f5f1e6')=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${esc(title)}</title>${rect(0,0,w,h,bg)}${b}</svg>\n`;
const noun=(recipe,x,y,z)=>{const svg=renderPortrait(recipe).svg;return `<svg x="${x}" y="${y}" width="${z}" height="${z}" viewBox="0 0 320 320">${svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace('width="100%" height="100%"','width="320" height="320"')}</svg>`;};
const recipe=(head,i)=>({head,body:['body-blue-sky','body-green','body-orange-yellow','body-purple'][i%4],accessory:['accessory-id','accessory-pocket-pencil','accessory-tie-red','accessory-none'][i%4],glasses:'glasses-square-black',background:i%2?'cool':'warm'});
const desk=(x,y)=>rect(x,y,290,25,'#a7734d')+rect(x+18,y+25,15,150,'#263b46')+rect(x+257,y+25,15,150,'#263b46')+rect(x+65,y-100,145,95,'#263b46')+rect(x+74,y-91,127,74,'#b9d4db');
const window=(x,y)=>rect(x,y,280,220,'#b9d4db')+line(x+140,y,x+140,y+220,'#fff',7)+line(x,y+110,x+280,y+110,'#fff',7);
const plant=(x,y)=>rect(x,y,70,65,'#b65b3d')+line(x+35,y,x+35,y-120,'#426e58',10)+`<ellipse cx="${x+10}" cy="${y-65}" rx="35" ry="16" fill="#426e58"/><ellipse cx="${x+65}" cy="${y-100}" rx="35" ry="16" fill="#426e58"/>`;
const notes=(x,y)=>rect(x,y,325,210,'#d1a87d')+[0,1,2,3,4,5].map(i=>rect(x+15+(i%3)*100,y+20+Math.floor(i/3)*90,80,65,i%2?'#fff8de':'#f2cb5c')).join('');
const manifest={date:'2026-11-13',status:'draft-human-review-pending',author:'Sid, an AI agent (gpt-6.1-sol)',source:NOUNS_ART,sourceSha256:createHash('sha256').update(readFileSync(new URL(NOUNS_ART.imageData,root))).digest('hex'),publicationCredit:'made on the Loom by Sid, approved by a human.',creditRule:'Use publicationCredit only after actual human approval; drafts are labelled review pending. No claim of publication.',posts:[]};
for(const r of rows.slice(0,limit)){
 const p=recipe(r.head,r.id),buddy=recipe('head-mailbox',r.id+1);
 let b=text(55,75,'OFFICE NOUN / '+String(r.id).padStart(2,'0'),28)+rect(45,120,1110,650,'#e8e7de')+rect(45,640,1110,130,'#c8c4b9');
 for(let x=45;x<1155;x+=110)b+=line(x,640,x+30,770,'#b6b5ad',2);
 let actorX=140,actorY=360;
 switch(r.scene){
 case 'arrival':case 'exit':b+=rect(770,190,240,450,'#b98a68')+rect(790,210,200,410,'#e8d7bb')+rect(960,420,15,15,'#263b46')+text(785,165,r.scene==='exit'?'SEE YOU':'THE OFFICE',25)+plant(570,575);break;
 case 'meeting':b+=window(770,200)+rect(470,550,250,25,'#a7734d')+rect(495,575,15,120,'#263b46')+rect(680,575,15,120,'#263b46')+noun(buddy,760,360,270);break;
 case 'printer':b+=rect(715,405,310,205,'#879ca4')+rect(735,375,270,35,'#263b46')+rect(780,310,180,70,'#fff')+rect(755,465,230,40,'#263b46')+rect(780,490,180,95,'#fff')+text(780,540,'READY',20)+line(800,555,935,555,'#879ca4',3);break;
 case 'memo':b+=notes(710,230)+rect(600,550,440,20,'#a7734d')+text(715,210,'MEMOS',24);break;
 case 'coffee':b+=rect(650,520,410,30,'#a7734d')+rect(730,300,170,210,'#263b46')+rect(755,330,120,80,'#a8c2cc')+rect(770,460,60,55,'#fff')+rect(945,460,55,55,'#b65b3d')+text(730,270,'COFFEE',24);break;
 case 'plant':b+=window(700,200)+plant(800,560)+plant(600,560);break;
 case 'whiteboard':b+=rect(650,220,410,290,'#fff', 'stroke="#263b46" stroke-width="5"')+line(690,430,980,430,'#b9d4db',3)+rect(945,480,65,20,'#263b46');break;
 case 'filing':b+=rect(720,270,290,370,'#879ca4')+[0,1,2].map(i=>rect(735,290+i*115,260,100,'#b4c2c6')+rect(825,320+i*115,80,16,'#263b46')).join('');break;
 case 'clock':b+=`<circle cx="855" cy="300" r="100" fill="#fff" stroke="#263b46" stroke-width="8"/>`+line(855,300,855,230)+line(855,300,915,335)+desk(700,525);break;
 case 'window':b+=window(680,230)+plant(990,570);break;
 default:b+=desk(700,525)+plant(600,570);
 }
 b+=noun(p,actorX,actorY,300);
 const words=r.caption.split(' ');let lines=[],s='';for(const word of words){if((s+' '+word).trim().length>49){lines.push(s);s=word;}else s=(s+' '+word).trim();}if(s)lines.push(s);
 b+=lines.map((s,i)=>text(55,865+i*46,s,34)).join('')+text(55,1090,'DRAFT / AI AGENT SID / HUMAN REVIEW PENDING',20)+text(55,1140,'Whole Nouns: official CC0 traits. Scene drawn by code.',18);
 const slug='office-'+String(r.id).padStart(2,'0');writeFileSync(new URL(slug+'.svg',out),wrap(1200,1200,r.caption,b));
 manifest.posts.push({...r,recipe:p,buddyRecipe:r.scene==='meeting'?buddy:null,svg:'/images/office-noun-linkedin/'+slug+'.svg',png:'/images/office-noun-linkedin/'+slug+'.png',alt:`Whole Noun in an illustrated office ${r.scene} scene. ${r.caption}`,captionSource:r.id<=5?'LinkedIn desk m_4q5b5v6707':'Sid, AI agent; fictional office vignette'});
}
const p=recipe('head-mailbox',0);
writeFileSync(new URL('office-noun-logo.svg',out),wrap(300,300,'Office Noun draft logo',noun(p,70,20,160)+text(45,225,'Office Noun',32)+text(60,270,'DRAFT / SID · AI',14)));
writeFileSync(new URL('office-noun-banner.svg',out),wrap(1128,191,'Office Noun draft page banner',text(300,75,'another day at the office.',40)+text(300,125,'Office Noun',25)+text(300,166,'DRAFT / AI AGENT SID / REVIEW PENDING',14)));
const inNote='Industry Next look read from https://www.industrynext.xyz/homepage/studio.css: paper #f3f0e7, ink #252b25, red #ba3b25, green #263f31, Arial and Georgia. Homepage masthead uses a rising arrow.';
writeFileSync(new URL('industry-next-logo.svg',out),wrap(300,300,'Industry Next draft logo',text(35,110,'Industry',45,'#252b25')+text(35,165,'Next',55,'#252b25')+text(216,167,'↗',52,'#ba3b25')+text(35,270,'DRAFT / SID · AI',14,'#263f31'),'#f3f0e7'));
writeFileSync(new URL('industry-next-banner.svg',out),wrap(1128,191,'Industry Next draft page banner',text(300,70,'Industry Next',45,'#252b25')+text(300,119,'A studio for what comes next.',30,'#252b25','serif')+text(300,163,'DRAFT / AI AGENT SID / REVIEW PENDING',14,'#263f31')+text(1010,110,'↗',75,'#ba3b25'),'#f3f0e7'));
manifest.branding={officeLogo:[300,300],industryNextLogo:[300,300],banners:[1128,191],industryNextSource:inNote};
writeFileSync(new URL('manifest.json',out),JSON.stringify(manifest,null,2)+'\n');console.log('Wrote '+manifest.posts.length+' scenes and four page-brand assets.');
