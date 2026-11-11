import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const root = path.resolve('public');
const file = path.join(root, 'images/saturday-worlds/2026-10-24/manifest.json');
const raw = fs.readFileSync(file, 'utf8');
const {images} = JSON.parse(raw);

test('exactly the two authorized batches: 360 originals in 90 complete jobs, with 40 selected ads', () => {
 assert.equal(images.length,360);
 assert.equal(new Set(images.map(x=>x.sourceSha256)).size,360);
 assert.equal(new Set(images.map(x=>x.id)).size,360);
 assert.deepEqual(Object.fromEntries(['coastal','scene','ad-selected','ad-alternate'].map(c=>[c,images.filter(x=>x.category===c).length])),{coastal:100,scene:100,'ad-selected':40,'ad-alternate':120});
 const groups=Map.groupBy(images,x=>x.groupId);
 assert.equal(groups.size,90);
 for(const [id,group] of groups){
  assert.deepEqual(group.map(x=>x.variant).sort(),[1,2,3,4]);
  assert.equal(new Set(group.map(x=>x.jobId)).size,1);
  if(id.startsWith('a')) {assert.equal(group.filter(x=>x.selected).length,1);for(const x of group)assert.ok(x.headline && x.shortCopy);}
 }
 for(const x of images)assert.equal(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}).format(new Date(x.createdAt)),'2026-10-24');
});
test('public manifest has no private file paths, prompts, account data or remote image services',()=>{
 assert.doesNotMatch(raw,/\/Users\/|file:\/\/|source_filename|native_description|source_zip|authorization_evidence|account_check|Fast|allowance|plan_evidence|prompt|api[_-]?key|https?:\/\//i);
 for(const x of images)for(const k of ['thumb','src'])assert.match(x[k],/^\/images\/saturday-worlds\/2026-10-24\/[csa]\d{2}-v[1-4](?:-thumb)?\.webp$/);
});
test('all 720 linked derivatives decode with stripped metadata, exact dimensions and bounded bytes',async()=>{
 let total=0;
 for(const x of images)for(const kind of ['src','thumb']){
  const f=path.join(root,x[kind]);const bytes=fs.statSync(f).size;total+=bytes;
  assert.ok(bytes<(kind==='thumb'?60000:500000),`${x.id} ${kind}: ${bytes}`);
  const m=await sharp(f).metadata();assert.equal(m.format,'webp');
  assert.equal(m.width,kind==='thumb'?x.thumbWidth:x.width);assert.equal(m.height,kind==='thumb'?x.thumbHeight:x.height);
  assert.equal(m.exif,undefined);assert.equal(m.xmp,undefined);await sharp(f).raw().toBuffer();
 }
 assert.ok(total<75_000_000);
 const actual=fs.readdirSync(path.dirname(file)).filter(x=>x.endsWith('.webp'));assert.equal(actual.length,720);
});
test('curated edit uses exactly 24 existing images and selected ad representatives',()=>{
 const j=JSON.parse(fs.readFileSync('src/data/saturday-worlds-journey.json','utf8'));
 assert.equal(j.chapters.length,6);const picks=j.chapters.flatMap(c=>c.images);assert.equal(picks.length,24);assert.equal(new Set(picks.map(p=>p.id)).size,24);
 for(const p of picks){const x=images.find(x=>x.id===p.id);assert.ok(x);assert.ok(p.alt);if(x.category.startsWith('ad'))assert.equal(x.selected,true);}
});
