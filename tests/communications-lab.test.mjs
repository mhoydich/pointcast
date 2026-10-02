import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const pointcast=fs.existsSync('src/data/communications-lab.json');
const raw=JSON.parse(fs.readFileSync(pointcast?'src/data/communications-lab.json':'scripts/communications-lab/content.json'));
const {normalizeLab}=await import(pointcast?'./../src/lib/communications-lab-normalize.mjs':'./../scripts/communications-lab/normalize.mjs');
const lab=normalizeLab(raw);
const publicDir=pointcast?'dist':'public';
const origin=pointcast?'https://pointcast.xyz':'https://www.industrynext.xyz';
const htmlFile=p=>path.join(publicDir,p,'index.html');
const html=p=>fs.readFileSync(htmlFile(p),'utf8');
const routes=['communications-lab',...lab.projects.map(p=>'communications-lab/projects/'+p.slug),...(pointcast?['intern']:[])];
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
test('all 12 proposed briefs preserve the experiment, result, budget and human-review qualifications',()=>{
 assert.equal(lab.projects.length,12);assert.equal(new Set(lab.projects.map(p=>p.slug)).size,12);
 assert.equal(lab.applicationsOpen,false);assert.deepEqual(lab.opportunities,[]);assert.deepEqual(lab.work,[]);
 for(let i=0;i<12;i++){const p=lab.projects[i],source=raw.projects[i];for(const [a,b] of [['question','question'],['week','oneWeek'],['stretch','fourWeek'],['success','successMeasure'],['deliverable','deliverable'],['review','approvalBoundary']])assert.equal(p[a],source[b]);assert.equal(p.materials[0],source.materialsBudget);assert.ok(p.privacy.length>30);}
 assert.match(lab.projects[7].materials[0],/human review must be separately budgeted/);
 assert.match(lab.boundaries.join(' '),/exclude labor, tax and shipping/);
 assert.match(lab.projects[10].privacy,/Physical venues, partners and installations remain unconfirmed/);
});
test('each built educational page exposes all sections without forms, job offers or ad-network scripts',()=>{
 for(const route of routes){const text=html(route);assert.match(text,/applications closed/);assert.doesNotMatch(text,/<form\b|JobPosting|open-ad-network|PageviewBeacon|api\/market-applications/i);assert.equal((text.match(/<main\b/g)||[]).length,1,'one main landmark on '+route);assert.match(text,/rel="canonical"/);assert.match(text,/no affiliation/);}
 for(const p of lab.projects){const text=decode(html('communications-lab/projects/'+p.slug));for(const field of ['question','week','stretch','success','deliverable','review'])assert.ok(text.includes(p[field]),p.slug+' missing '+field);assert.ok(text.includes(p.materials[0]));assert.match(text,/Privacy \+ boundaries/i);}
});
test('lab child links, anchors, downloads and mirror-relative navigation resolve',()=>{
 for(const route of routes){const text=html(route);const localURL=new URL(origin+'/'+route+'/');for(const m of text.matchAll(/(?:href|src)="([^"]+)"/g)){const ref=decode(m[1]);const url=new URL(ref,localURL);if(url.origin!==origin)continue;if(!url.pathname.startsWith('/communications-lab/')&&!url.pathname.startsWith('/intern'))continue;const target=path.join(publicDir,url.pathname);const file=url.pathname.endsWith('/')?path.join(target,'index.html'):target;assert.ok(fs.existsSync(file),'missing '+url.pathname+' from '+route);if(url.hash&&file.endsWith('.html'))assert.ok(fs.readFileSync(file,'utf8').includes('id="'+url.hash.slice(1)+'"'),'missing anchor '+url.hash);}}
 if(!pointcast){for(const route of routes)assert.doesNotMatch(html(route),/(?:href|src)="\/communications-lab\//,'portable mirror on '+route);}
});
test('JSON twin is closed, same twelve projects, and downloads are intact',()=>{
 const j=JSON.parse(fs.readFileSync(path.join(publicDir,'communications-lab/briefs.json')));assert.equal(j.applicationsOpen,false);assert.equal(j.projects.length,12);assert.equal(j.url,origin+'/communications-lab/');for(const p of j.projects)assert.equal(p.url,origin+'/communications-lab/projects/'+p.slug+'/');
 for(const n of ['brand-kit.zip','brand-guide.pdf','signal-mark.svg','wordmark.svg','social-card.png'])assert.ok(fs.statSync(path.join(publicDir,'communications-lab/assets',n)).size>100);
 const zip=fs.readFileSync(path.join(publicDir,'communications-lab/assets/brand-kit.zip'));assert.equal(zip.subarray(0,2).toString(),'PK');
 const pdf=fs.readFileSync(path.join(publicDir,'communications-lab/assets/brand-guide.pdf'));assert.equal(pdf.subarray(0,4).toString(),'%PDF');
});
