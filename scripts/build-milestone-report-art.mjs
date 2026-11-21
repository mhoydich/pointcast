// Milestone Report: original geometric draft, not a copy of any reference logo/art.
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
const dir=new URL('../public/images/milestone-report/',import.meta.url);mkdirSync(dir,{recursive:true});
const c={paper:'#f4ead8',ink:'#17212b',signal:'#e34e35'};
const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const text=(x,y,s,size,fill=c.ink)=>`<text x="${x}" y="${y}" font-family="sans-serif" font-weight="bold" font-size="${size}" fill="${fill}">${s}</text>`;
const svg=(w,h,title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${title}</title>${rect(0,0,w,h,c.paper)}${body}</svg>\n`;
const masthead=text(70,125,'MILESTONE REPORT',100)+rect(70,160,1460,18,c.signal)+text(70,250,'CAPABILITY / EVIDENCE / LIMITS',45);
writeFileSync(new URL('masthead.svg',dir),svg(1600,320,'Milestone Report masthead draft',masthead+text(1140,300,'DRAFT / SID, AI',23)));
const logo=rect(0,0,300,150,c.ink)+rect(0,150,30,150,c.signal)+text(40,115,'MR',112,c.paper)+text(48,205,'MILESTONE',35)+text(48,250,'REPORT',35)+text(48,285,'DRAFT / SID, AI',14);
writeFileSync(new URL('logo.svg',dir),svg(300,300,'Milestone Report logo draft',logo));
const cover=masthead+rect(70,340,1460,360,c.ink)+text(105,640,'01',300,c.paper)+rect(850,400,80,240,c.signal)+rect(930,480,80,160,c.signal)+rect(1010,560,80,80,c.signal)+text(70,780,'A NUMBERED TECHNICAL REPORT',52)+text(70,850,'DRAFT / AI AGENT SID / HUMAN REVIEW PENDING',32);
writeFileSync(new URL('cover.svg',dir),svg(1600,900,'Milestone Report cover draft: proposed issue 01, no results claimed',cover));
writeFileSync(new URL('manifest.json',dir),JSON.stringify({status:'draft-human-review-pending',author:'Sid, AI agent, gpt-6.1-sol',palette:c,source:'LinkedIn room m_6m0h2m2v1e',numeral:'01 is a proposed issue number, not a milestone count or published edition.',files:[{name:'logo',size:[300,300]},{name:'masthead',size:[1600,320]},{name:'cover',size:[1600,900]}],note:'No wallet, post, page or PR statistics are invented in this artwork. All text is editable SVG; review labels remain until actual human approval.'},null,2)+'\n');
if(process.argv.includes('--png')){const {Resvg}=await import('@resvg/resvg-js');for(const n of readdirSync(dir).filter(n=>n.endsWith('.svg')))writeFileSync(new URL(n.replace(/\.svg$/,'.png'),dir),new Resvg(readFileSync(new URL(n,dir)),{font:{defaultFontFamily:'DejaVu Sans'}}).render().asPng());}
console.log('Wrote Milestone Report logo, masthead, cover and provenance.');
