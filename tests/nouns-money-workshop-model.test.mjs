import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DEFAULT,CAST,THEMES,PALETTES,ASSET_SHA,normalize,canonical,seal,verify,importDesign,encodeDesign,decodeDesign,nounRects,nounSvg,readTray,addToTray,TRAY_LIMIT} from '../public/nouns-money/workshop/model.mjs';
import {compose} from '../public/nouns-money/workshop/art.mjs';
const assetBytes=await readFile(new URL('../public/nouns-money/workshop/assets/image-data.json',import.meta.url));
const data=JSON.parse(assetBytes);
const sample=await seal(DEFAULT);
test('original asset data matches the pinned full SHA-256',()=>assert.equal(createHash('sha256').update(assetBytes).digest('hex'),ASSET_SHA));
test('every trait choice and 24 mixed seeds match the verified Python geometry',async()=>{
  const fixtures=JSON.parse(await readFile(new URL('./nouns-money-workshop-reference-geometry.json',import.meta.url)));
  assert.equal(fixtures.cases.length,476);
  for(const item of fixtures.cases){
    const rects=nounRects(item.seed,data).map(r=>[r.x,r.y,r.width,r.height,r.fill]);
    assert.equal(createHash('sha256').update(JSON.stringify(rects)).digest('hex'),item.rectsSha256,JSON.stringify(item.seed));
  }
});
test('canonical field order is independent of input insertion order',async()=>{
  const reversed=Object.fromEntries(Object.entries(DEFAULT).reverse());
  assert.equal(canonical(reversed),canonical(DEFAULT));assert.deepEqual(await seal(reversed),sample);
});
test('specimen fingerprint is derived exactly from the canonical design',()=>{
  assert.equal(sample.specimen.id,'NMW1-'+createHash('sha256').update(canonical(DEFAULT)).digest('hex').slice(0,12).toUpperCase());
});
test('each identity-bearing field changes the fingerprint',async()=>{
  const variations=[{...DEFAULT,theme:'workshop'},{...DEFAULT,asset:{...DEFAULT.asset,seed:CAST[1].seed}},{...DEFAULT,colors:{...DEFAULT.colors,paper:'#ffffff'}},{...DEFAULT,edition:{...DEFAULT.edition,label:'STUDY & PLAY'}},{...DEFAULT,edition:{...DEFAULT.edition,number:2}}];
  for(const d of variations)assert.notEqual((await seal(d)).specimen.id,sample.specimen.id);
});
test('front and back share the same fingerprint and carry collectible status',()=>{
  for(const side of ['front','back']){const svg=compose(sample,data,side);assert.ok(svg.includes(sample.specimen.id));assert.ok(svg.includes('COLLECTIBLE ART · NO CASH VALUE'));assert.ok(svg.includes('not a registered serial'));assert.ok(svg.includes('width="180mm" height="84mm"'));}
});
test('JSON and URL fragment recipes round trip exactly',async()=>{
  assert.deepEqual(await importDesign(JSON.stringify(sample)),sample);assert.deepEqual(await decodeDesign(encodeDesign(sample)),sample);
});
test('tampered contents, missing fingerprints, and unsupported versions fail closed',async()=>{
  await assert.rejects(verify({...sample,theme:'workshop'}),/fingerprint/);
  await assert.rejects(importDesign(JSON.stringify(DEFAULT)),/structure/);
  await assert.rejects(importDesign(JSON.stringify({...sample,schemaVersion:'nmw-design/2'})),/version/);
});
test('untrusted recipe structures, traits and markup are rejected',async()=>{
  const invalid=[null,[],{...sample,url:'https://evil.invalid'}, {...sample,theme:'constructor'}, {...sample,asset:{...sample.asset,sourceCommit:'fake'}},{...sample,asset:{...sample.asset,seed:{...sample.asset.seed,head:254}}},{...sample,asset:{...sample.asset,seed:{...sample.asset.seed,body:1.5}}},{...sample,colors:{...sample.colors,paper:'url(https://evil.invalid)'}},{...sample,edition:{label:'<script>',number:1}},{...sample,edition:{label:'  ',number:1}}];
  for(const input of invalid)assert.throws(()=>normalize(input));
  await assert.rejects(importDesign('x'.repeat(6001)),/large/);
  await assert.rejects(decodeDesign('%<>'),/invalid/);
});
test('ampersands in a legal label are XML-escaped',async()=>{
  const d=await seal({...DEFAULT,edition:{label:'ART & IDEAS',number:5}});const svg=compose(d,data);assert.ok(svg.includes('ART &amp; IDEAS'));assert.ok(!svg.includes('ART & IDEAS'));
});
test('all themes and palettes render complete self-contained vector faces',async()=>{
  for(const theme of Object.keys(THEMES))for(const palette of PALETTES){
    const {paper,ink,accent}=palette;const d=await seal({...DEFAULT,theme,colors:{paper,ink,accent}});
    for(const side of ['front','back']){const svg=compose(d,data,side);assert.ok(svg.endsWith('</svg>'));assert.ok(!/<script|<image|<foreignObject|href=/i.test(svg));assert.ok(svg.includes('CC0 NOUNS'));assert.ok(svg.includes('<metadata>'));}
  }
});
test('noun SVG has an explicit native viewport inside the note composition',()=>{
  assert.ok(nounSvg(DEFAULT.asset.seed,data).includes('width="320" height="320" viewBox="0 0 320 320"'));
});
test('tray preserves exact designs, deduplicates canonical recipes and enforces capacity',async()=>{
  let tray=addToTray([],sample);assert.equal(addToTray(tray,sample).length,1);
  assert.deepEqual(await readTray(JSON.stringify(tray)),tray);
  for(let i=2;i<=TRAY_LIMIT;i++)tray=addToTray(tray,await seal({...DEFAULT,edition:{...DEFAULT.edition,number:i}}));
  assert.equal(tray.length,24);assert.throws(()=>addToTray(tray,{...sample,edition:{...sample.edition,number:25}}),/24/);
});
test('corrupt or oversized saved trays are never accepted as valid designs',async()=>{
  await assert.rejects(readTray('{broken'));await assert.rejects(readTray('{}'));await assert.rejects(readTray(JSON.stringify([{...sample,theme:'workshop'}])));await assert.rejects(readTray(' '.repeat(180001)));assert.deepEqual(await readTray(null),[]);
});
test('page has an additive link structure and all direct dependencies are local',async()=>{
  const html=await readFile(new URL('../public/nouns-money/workshop/index.html',import.meta.url),'utf8');
  assert.ok(html.includes('href="/nouns-money/"'));assert.ok(html.includes('href="/nouns-money/gallery/"'));assert.ok(html.includes('<noscript>'));
  assert.ok(!/<(?:script|img)[^>]+src="https?:/i.test(html));
  assert.ok(!/<link(?=[^>]*rel="(?:stylesheet|preload|modulepreload|icon)")[^>]+href="https?:/i.test(html));
  assert.equal(html.split('<link rel="canonical" href="https://pointcast.xyz/nouns-money/workshop/">').length,2);
  const app=await readFile(new URL('../public/nouns-money/workshop/app.mjs',import.meta.url),'utf8');
  assert.equal((app.match(/fetch\(/g)||[]).length,1);assert.ok(app.includes("fetch('./assets/image-data.json')"));assert.ok(!/sendBeacon|WebSocket|indexedDB|document\.cookie/.test(app));
});
