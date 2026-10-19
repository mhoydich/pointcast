import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {initialState,normalizeState,readyForBrief,specimenId,noteSVG,briefText,workshopDesign,workshopURL,titleLines,applyWorkshopDesign,verifiedNounsData,importedArt} from '../public/assets/ues-currency-lab/lab-core.mjs';
import {seal,verify,importDesign,decodeDesign,DEFAULT,CAST} from '../public/assets/ues-currency-lab/workshop-model.mjs';

test('untrusted saved state is bounded and cannot select arbitrary assets or colors',()=>{
  const s=normalizeState({version:1,theme:'../../secret',palette:'url(https://example.org)',composition:'<script>',title:'\u0000'+('A'.repeat(100)),story:'B'.repeat(500),copies:10000,step:9,completed:[0,0,-1,2,9],checks:[true,'yes',1]});
  assert.equal(s.theme,'place');assert.equal(s.palette,'grove');assert.equal(s.composition,'portrait');
  assert.equal(s.title.length,36);assert.equal(s.story.length,160);assert.equal(s.copies,24);assert.equal(s.step,0);assert.deepEqual(s.completed,[0,2]);assert.deepEqual(s.checks,[true,false,false]);
  for(const raw of [null,{},[],{version:2},{version:1,copies:NaN}]) assert.equal(normalizeState(raw).copies,6);
});
test('readiness requires learning answers, a copy experiment, a story, and three observations',()=>{
  const s={...initialState(),story:'A familiar walk.',meaningAnswer:'collectible',copyAnswer:'no',duplicated:true,checks:[true,true,true]};
  assert.equal(readyForBrief(s),true);
  for(const change of [{story:''},{meaningAnswer:'money'},{copyAnswer:'yes'},{duplicated:false},{checks:[true,false,true]}])assert.equal(readyForBrief({...s,...change}),false);
});
test('the local label copies, ignores side and copy plan, and varies with design choices',()=>{
  const s=initialState(), id=specimenId(s);
  assert.match(id,/^UES-[A-F0-9]{8}$/);
  assert.equal(specimenId({...s,side:'back',copies:24,duplicated:true}),id);
  assert.notEqual(specimenId({...s,composition:'field'}),id);
  assert.notEqual(specimenId({...s,theme:'craft'}),id);
});
test('all 36 faces retain the visible art boundary and escaped SVG labels',()=>{
  for(const theme of ['place','memory','craft'])for(const palette of ['grove','clay'])for(const composition of ['portrait','typographic','field'])for(const side of ['front','back']){
    const svg=noteSVG({...initialState(),theme,palette,composition,side,title:'<svg onload="evil()"> & test'});
    assert.ok(svg.includes('ART SPECIMEN · NO MONETARY VALUE'));
    assert.ok(svg.includes('aria-labelledby='));assert.ok(!svg.includes('<svg onload='));
    if(side==='front')assert.ok(svg.includes('/assets/ues-currency-lab/'));
    else assert.ok(svg.includes('No payment, redemption, ownership, or financial rights.'));
  }
});
test('long words and long titles are split into at most two lines without losing 36 characters',()=>{
  for(const title of ['W'.repeat(36),'A remarkable little neighborhood note','<onload> & "quoted" title']){
    const lines=titleLines(title,21);assert.ok(lines.length<=2);assert.ok(lines.every(l=>l.length<=21));assert.equal(lines.join('').replaceAll(' ',''),title.replaceAll(' ',''));
  }
});
test('print/text draft does not claim completion or enforce an edition',()=>{
  const text=briefText(initialState());assert.ok(text.includes('DRAFT'));assert.ok(text.includes('not an enforced limit'));assert.ok(text.includes('No payment, redemption, ownership, accreditation, or financial rights'));
});
test('portable design follows shared schema order and SHA-256 identity contract',async()=>{
  const s={...initialState(),title:'<a> & Pacific afternoons in El Segundo'};
  const design=await workshopDesign(s);const {specimen,...canonical}=design;
  assert.deepEqual(Object.keys(design),['schemaVersion','theme','asset','colors','edition','specimen']);
  assert.equal(design.schemaVersion,'nmw-design/1');assert.equal(design.theme,'el-segundo');assert.equal(design.asset.seed.head,182);
  assert.ok(design.edition.label.length<=28);assert.match(design.edition.label,/^[A-Z0-9 .&-]+$/);
  assert.equal(specimen.id,'NMW1-'+createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0,12).toUpperCase());
  assert.equal(specimen.algorithm,'sha256-canonical-v1-48');
  const encoded=workshopURL(design).split('#design=')[1];
  assert.deepEqual(JSON.parse(Buffer.from(encoded,'base64url').toString()),design);
  assert.equal(design.edition.number,1);assert.ok(!('story' in design));assert.ok(!('copies' in design));
});
test('all three asset geometries match generator hashes',async()=>{
  for(const name of ['sailboat','sunset','pencil']){
    const base=new URL('../public/assets/ues-currency-lab/',import.meta.url);
    const manifest=JSON.parse(await readFile(new URL(name+'-manifest.json',base),'utf8'));
    const svg=await readFile(new URL(name+'.svg',base));
    assert.equal(createHash('sha256').update(svg).digest('hex'),manifest.items[0].svg_sha256);
    assert.equal(manifest.source.asset_sha256,'a03f22b7838b35fdf0332617c9b8e2b032eb26cf1632afbefb200fec64c4bc20');
  }
});
test('an arbitrary Workshop Noun, colors and edition survive verified import and export',async()=>{
  const original=await seal({...DEFAULT,asset:{...DEFAULT.asset,seed:CAST[3].seed},colors:{paper:'#e9eade',ink:'#274c60',accent:'#bb602f'},edition:{label:'A CRT IN EL SEGUNDO',number:37}});
  const imported=await importDesign(JSON.stringify(original));
  const state=applyWorkshopDesign(initialState(),imported);
  const roundtrip=await workshopDesign(state);assert.deepEqual(roundtrip,original);await verify(roundtrip);
  const data=await verifiedNounsData(await readFile(new URL('../public/assets/ues-currency-lab/image-data.json',import.meta.url),'utf8'));
  const art=importedArt(state,data);assert.equal(art.name,'crt bsod');assert.match(art.href,/^data:image\/svg\+xml;base64,/);
  const svg=noteSVG(state,{assetHref:art.href,assetName:art.name});assert.match(svg,/#274c60/);assert.match(svg,/Original Nouns crt/);
});
test('tampering, malformed payloads, invalid seed/source and changed asset data are rejected',async()=>{
  const original=await seal(DEFAULT);
  await assert.rejects(importDesign(JSON.stringify({...original,edition:{label:'CHANGED',number:1}})),/fingerprint/);
  await assert.rejects(importDesign('x'.repeat(6001)),/too large/);
  await assert.rejects(decodeDesign('<script>'),/invalid/);
  await assert.rejects(seal({...DEFAULT,asset:{...DEFAULT.asset,seed:{...DEFAULT.asset.seed,head:999}}}),/trait/);
  await assert.rejects(seal({...DEFAULT,asset:{...DEFAULT.asset,sourceCommit:'unknown'}}),/source/);
  await assert.rejects(verifiedNounsData('{}'),/checksum/);
});


test('verified imported edition labels retain exact edge spaces through reload and lab controls',async()=>{
  for(const label of [' FIRST IMPRESSIONS ','A  B',' X','X ']){
    const original=await seal({...DEFAULT,edition:{label,number:7}});
    let state=applyWorkshopDesign(initialState(),original);
    assert.equal(state.title,label);
    state=normalizeState(JSON.parse(JSON.stringify(state)));
    state={...state,composition:'field',side:'back',copies:12};
    assert.deepEqual(await workshopDesign(state),original);
    const edited=await workshopDesign({...state,title:'A NEW TITLE'});
    assert.notEqual(edited.specimen.id,original.specimen.id);
    await verify(edited);
  }
  assert.throws(()=>applyWorkshopDesign(initialState(),{...DEFAULT,edition:{label:'   ',number:1}}));
});
