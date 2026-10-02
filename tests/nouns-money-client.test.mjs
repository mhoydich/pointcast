import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { initNounsMoney } from '../src/scripts/nouns-money-client.mjs';

const source = readFileSync(new URL('../src/lib/nouns-money.ts', import.meta.url), 'utf8');
const catalog = JSON.parse(source.split('export const NOTE_DESIGNS = ')[1].split(' as const;')[0]);
const key = 'pointcast:nouns-money:design-set:v1';
function fixture() {
  const dom = new JSDOM(`<main data-nouns-money><p data-set-count></p><p data-set-storage></p><button data-set-export>Export</button>${catalog.map(n=>`<article data-note-card="${n.id}"><button data-save-design="${n.id}"></button></article>`).join('')}<script id="nouns-money-catalog" type="application/json">${JSON.stringify(catalog)}</script></main>`, {url:'https://pointcast.xyz/nouns-money/'});
  Object.assign(globalThis, {document:dom.window.document, window:dom.window, localStorage:dom.window.localStorage});
  return dom;
}
const click = id => document.querySelector(`[data-save-design="${id}"]`).click();

test('real collection client saves a full set, reloads it, and removes a design', () => {
  const dom = fixture(); initNounsMoney();
  catalog.forEach(n=>click(n.id));
  assert.equal(JSON.parse(localStorage.getItem(key)).length, 10);
  assert.match(document.querySelector('[data-set-count]').textContent, /10 \/ 10.*complete/);
  initNounsMoney();
  assert.equal(document.querySelectorAll('[aria-pressed="true"]').length, 10);
  click(catalog[2].id);
  assert.equal(JSON.parse(localStorage.getItem(key)).length, 9);
  assert.equal(document.querySelector(`[data-save-design="${catalog[2].id}"]`).getAttribute('aria-pressed'), 'false');
  dom.window.close();
});

test('forged and duplicate IDs cannot enter the saved set; malformed storage recovers', () => {
  const dom=fixture();
  localStorage.setItem(key, JSON.stringify([catalog[0].id,catalog[0].id,'foreign-note',null,{}]));
  initNounsMoney();
  assert.equal(document.querySelector('[data-set-count]').textContent,'1 / 10 saved');
  click(catalog[1].id);
  assert.deepEqual(JSON.parse(localStorage.getItem(key)),[catalog[0].id,catalog[1].id]);
  localStorage.setItem(key,'invalid-json'); initNounsMoney(); click(catalog[2].id);
  assert.deepEqual(JSON.parse(localStorage.getItem(key)),[catalog[2].id]);
  dom.window.close();
});

test('cross-tab changes reconcile and a click retains another tab’s newer selection', () => {
  const dom=fixture();initNounsMoney();click(catalog[0].id);
  localStorage.setItem(key,JSON.stringify([catalog[0].id,catalog[1].id]));
  click(catalog[2].id);
  assert.deepEqual(JSON.parse(localStorage.getItem(key)),catalog.slice(0,3).map(n=>n.id));
  window.dispatchEvent(new window.StorageEvent('storage',{key,newValue:JSON.stringify([catalog[4].id])}));
  assert.equal(document.querySelector('[data-set-count]').textContent,'1 / 10 saved');
  assert.equal(document.querySelector(`[data-save-design="${catalog[4].id}"]`).getAttribute('aria-pressed'),'true');
  window.dispatchEvent(new window.StorageEvent('storage',{key:null,newValue:null}));
  assert.equal(document.querySelector('[data-set-count]').textContent,'0 / 10 saved');
  dom.window.close();
});

test('denied browser storage keeps an honest in-memory set', () => {
  const dom=fixture();
  globalThis.localStorage={getItem(){throw Error('unavailable');},setItem(){throw Error('unavailable');}};
  initNounsMoney();click(catalog[0].id);click(catalog[1].id);
  assert.equal(document.querySelector('[data-set-count]').textContent,'2 / 10 saved');
  assert.match(document.querySelector('[data-set-storage]').textContent,/this visit only/);
  click(catalog[0].id);
  assert.equal(document.querySelector('[data-set-count]').textContent,'1 / 10 saved');
  dom.window.close();
});

test('export is a local design preference list with honest ownership meaning', async () => {
  const dom=fixture();let exported;
  const create=URL.createObjectURL; const revoke=URL.revokeObjectURL;
  URL.createObjectURL=blob=>{exported=blob;return 'blob:local-test';};URL.revokeObjectURL=()=>{};
  dom.window.HTMLAnchorElement.prototype.click=function(){assert.equal(this.download,'nouns-money-my-design-set.json');};
  try {
    initNounsMoney();click(catalog[1].id);document.querySelector('[data-set-export]').click();
    const data=JSON.parse(await exported.text());
    assert.equal(data.schema,'pointcast.nouns-money.design-set/v1');
    assert.equal(data.designs[0].name,catalog[1].name);
    assert.match(data.meaning,/no physical possession, NFT ownership or transfer/);
    assert.equal(data.designs.length,1);
  } finally {URL.createObjectURL=create;URL.revokeObjectURL=revoke;dom.window.close();}
});
