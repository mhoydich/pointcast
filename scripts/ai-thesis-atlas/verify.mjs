import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const base=new URL('../../public/ai-thesis-atlas/',import.meta.url);
const data=JSON.parse(fs.readFileSync(new URL('assets/atlas-data.json',base),'utf8'));
const {renderVisual,visualIds}=await import(new URL('assets/visuals.js',base));
assert.equal(data.entries.length,25);assert.equal(new Set(data.entries.map(x=>x.id)).size,25);assert.equal(visualIds.length,25);
const html=fs.readFileSync(new URL('index.html',base),'utf8');
for(const x of data.entries){for(const field of ['id','title','institution','date','sourceTitle','url','evidenceType','summary','mechanism','assumptions','counterargument','falsifier','implication','internExercise','proofOfWork','caveat'])assert.ok(typeof x[field]==='string'&&x[field].trim(),x.id+': '+field);assert.equal(new URL(x.url).protocol,'https:');assert.equal(x.skills.length,3);assert.ok(visualIds.includes(x.id));const v=renderVisual(x);assert.match(v,/data-viz-(choice|input)/);assert.ok(!/undefined|NaN/.test(v));assert.ok(html.includes('id="source-'+x.id+'"'));const r=data.sourceReview.entries.find(r=>r.id===x.id);assert.equal(r.verdict,'supported');assert.ok(r.quote.trim().split(/\s+/).length<=25);assert.equal(r.url,x.url)}
for(const file of ['atlas.js','atlas.css','visuals.js','visuals.css','atlas-share.png','atlas-data.json'])assert.ok(fs.statSync(new URL('assets/'+file,base)).size>100);
assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/prefers-reduced-motion|visuals.css/);assert.match(html,/property\/#internships/);assert.match(html,/Flatiron/);
console.log('AI atlas gate passed:25 sourced views,25 explainers,25 learning projects, supported independent reviews, static source archive and local assets.');
