import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const catalog = JSON.parse(read('src/data/everyday.json'));
test('the original concept catalog has twelve distinct useful products and honest target prices', () => {
  assert.equal(catalog.products.length, 12);
  assert.equal(new Set(catalog.products.map(p=>p.id)).size, 12);
  assert.deepEqual([...new Set(catalog.products.map(p=>p.category))].sort(), ['carry','home','wear']);
  for(const p of catalog.products){
    assert.ok(p.targetRetailUsd >= 3 && p.targetRetailUsd <= 29, p.name);
    assert.ok(p.name && p.use && p.material && p.construction && p.dimensions && p.colors.length);
  }
  const source = JSON.parse(read('src/data/everyday-creative-source.json'));
  for (const original of source.products) {
    const item = catalog.products.find(p => p.code === original.id);
    assert.equal(item.targetRetailUsd, original.target_retail_usd);
    assert.equal(item.feasibility, original.feasibility_note);
    assert.equal(item.material, original.material_construction);
    assert.equal(item.dimensions, original.design_dimensions);
  }
  assert.equal(catalog.status, 'concept');
  assert.equal(catalog.availableForPurchase, false);
  assert.match(catalog.priceDisclaimer, /target/i);
});
test('homepage selects existing live routes, local visuals and keeps all previous lower sections', () => {
  const home=read('src/pages/index.astro');
  const start=home.indexOf('<HomeEverydayLead />');
  assert.ok(start < home.indexOf('<HomeNounsMoney />'));
  assert.ok(home.indexOf('<HomeNounsMoney />') < home.indexOf('<HomeLatestProjects />'));
  assert.ok(home.indexOf('<HomeLatestProjects />') < home.indexOf('<HomeLatestShelf'));
  for(const component of ['HomeShortwaveHero','HomeNewToday','HomeShopShelf','HomeV2SignalDeck','HomeContourField','HomeSoundGarden','HomeMagazineRack','HomeRoomsShelf','HomeAgentDesk','HomeShipLog','HomeWire','HomeBackCatalog']) assert.ok(home.includes('<'+component), component);
  for(const p of JSON.parse(read('src/data/home-latest-projects.json'))) assert.ok(existsSync(new URL('public'+p.image,root)),p.image);
});
test('built utility catalog and homepage remain navigable without JavaScript, with no sales flow', {skip:!existsSync(new URL('dist/everyday/index.html',root))}, () => {
  const doc=new JSDOM(read('dist/everyday/index.html')).window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.equal(doc.querySelectorAll('[data-everyday-product]').length,12);
  assert.equal(doc.querySelectorAll('form,input,select').length,0);
  for(const p of catalog.products){
    const card=doc.getElementById(p.id); assert.ok(card,p.id);
    assert.match(card.textContent,/target retail/i);
    assert.ok(card.querySelector('details summary'));
  }
  const home=new JSDOM(read('dist/index.html')).window.document;
  assert.equal(home.querySelectorAll('h1').length,1);
  assert.ok(home.querySelector('[data-everyday-lead] a[href="/everyday/"]'));
  assert.ok(home.querySelector('[data-home-latest-projects] a[href="/intern/"]'));
  for(const a of [...home.querySelectorAll('[data-home-latest-projects] a,[data-home-nouns-money] a')]){
    const path=a.getAttribute('href').split('#')[0]; if(!path)continue;
    assert.ok(existsSync(new URL('dist'+path.replace(/\/$/,'')+'/index.html',root)),path);
  }
  for(const img of doc.querySelectorAll('img')) assert.ok(existsSync(new URL('dist'+img.getAttribute('src'),root)));
});
test('built machine catalog agrees with all public discovery surfaces', {skip:!existsSync(new URL('dist/everyday.json',root))}, () => {
  assert.deepEqual(JSON.parse(read('dist/everyday.json')),catalog);
  const agents=JSON.parse(read('dist/agents.json')).endpoints;
  const apps=JSON.parse(read('dist/apps.json')).apps.filter(p=>p.slug==='everyday'); assert.equal(apps.length,1);
  for(const [kind,path] of [['human','/everyday/'],['json','/everyday.json']]){
    const url='https://pointcast.xyz'+path;
    assert.equal(agents.current[kind].everyday,url); assert.equal(agents[kind].everyday,url);
    assert.ok(read('dist/llms.txt').includes(']('+url+')'));
    assert.ok(read('dist/sitemap-discovery.xml').includes('<loc>'+url+'</loc>'));
  }
});
