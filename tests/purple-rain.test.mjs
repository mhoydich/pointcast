import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const data=JSON.parse(readFileSync(new URL('src/data/purple-rain.json',root)));
const asset=(src)=>new URL('public'+src,root);
test('Every editorial claim and timeline citation resolves to a unique source',()=>{
 const ids=data.sources.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
 for(const record of [...data.lenses.flatMap(x=>x.sections),...data.facts,...data.timeline])for(const id of record.sourceIds)assert.ok(ids.includes(id),id);
 for(const source of data.sources)assert.equal(new URL(source.url).protocol,'https:');
});
test('Each lens has editorial content and accessible gallery/timeline entries',()=>{
 assert.deepEqual(data.lenses.map(x=>x.id),['fashion','energy','results','time']);
 for(const lens of data.lenses){assert.ok(lens.sections.length>=3);assert.ok(data.images.some(x=>x.lenses.includes(lens.id)));assert.ok(data.timeline.some(x=>x.lenses.includes(lens.id)));}
});
test('Restricted archive references cannot become image hotlinks or local files',()=>{
 for(const image of data.images.filter(x=>x.kind==='reference')){
  for(const field of ['src','fullSrc','fileUrl','originalFileUrl','localPath'])assert.ok(!image[field],`${image.id}: ${field}`);
  assert.equal(new URL(image.sourceUrl).protocol,'https:');
 }
});
test('Hosted photographs have explicit licenses and unchanged downloaded hashes',()=>{
 for(const image of data.images.filter(x=>x.kind==='reuse')){
  assert.match(image.license,/^(CC BY|Public domain dedication)/);
  assert.ok(image.licenseUrl&&image.creator&&image.sourceUrl&&image.caption&&image.alt&&image.date);
  assert.ok(image.src.startsWith('/images/purple-rain/'));assert.ok(!image.src.includes('..'));
  const buffer=readFileSync(asset(image.src));assert.equal(createHash('sha256').update(buffer).digest('hex'),image.sha256,image.id);
 }
});
test('Original art has full prompt, non-archival labels, and preserved originals',()=>{
 for(const image of data.images.filter(x=>x.kind==='original')){
  assert.match(image.caption,/Original AI-generated/);assert.equal(image.provenance.endorsed,false);assert.ok(image.provenance.prompt);
  assert.ok(existsSync(asset(image.src)));assert.ok(existsSync(asset(image.originalSrc)));assert.ok(image.width&&image.height);
 }
});
test('Inventory is portable and contains no host paths or audio/video files',()=>{
 const text=JSON.stringify(data);assert.ok(!text.includes('/Users/'));assert.ok(!text.includes('/tmp/'));
 for(const image of data.images){assert.ok(image.title&&image.alt&&image.caption&&image.creator&&image.license&&image.date);if(image.src)assert.match(image.src,/\.(png|jpe?g|webp)$/);}
 for(const item of data.listening)assert.match(item.url,/^https:\/\/(www\.youtube\.com|discography\.prince\.com|www\.warnerbros\.com)\//);
});
test('Approved feature remains within its isolated routes with indexable HTML',()=>{
 const page=readFileSync(new URL('src/pages/purple-rain/index.astro',root),'utf8');assert.match(page,/<meta name="robots" content="index, follow"/);assert.ok(!page.includes('BaseLayout'));assert.ok(!page.includes('<iframe'));assert.equal(data.status,'publication-approved');
});
