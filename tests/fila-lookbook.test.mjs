import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { initFilaLookbooks } from '../src/scripts/fila-lookbook.mjs';

const html = readFileSync(new URL('../dist/fila/2027/index.html', import.meta.url), 'utf8');
function fixture(reduced = false) {
  const dom = new JSDOM(html, { url:'https://pointcast.xyz/fila/2027/', pretendToBeVisual:true });
  const { window } = dom;
  const scrolls = [];
  window.matchMedia = () => ({matches:reduced});
  window.HTMLElement.prototype.scrollTo = function(args) { this.scrollLeft = args.left ?? 0; scrolls.push(args); };
  window.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  window.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new window.Event('close')); };
  const q = selector => window.document.querySelector(selector);
  initFilaLookbooks(window.document);
  return { dom, window, q, scrolls, visible:() => [...window.document.querySelectorAll('[data-look]')].filter(card=>!card.hidden) };
}
test('the built collection has twelve complete paired views, real assets and visible provenance', async () => {
  const dom = new JSDOM(html);
  const cards = [...dom.window.document.querySelectorAll('[data-look]')];
  assert.equal(cards.length,12);
  for (const card of cards) {
    assert.match(card.textContent,/AI-generated concept/);
    const image = card.querySelector('[data-look-image]');
    for(const view of ['front','back','detail']) {
      const path = join(import.meta.dirname,'..','public',image.dataset[view]);
      assert.ok(existsSync(path),`${card.dataset.lookId} ${view} exists`);
      const meta = await sharp(path).metadata();
      assert.ok(meta.width > 200 && meta.height > 200);
    }
    assert.equal(card.querySelectorAll('dl dd').length,3,'material, fit and function are present');
  }
  const data = JSON.parse(readFileSync(new URL('../dist/fila.json',import.meta.url),'utf8'));
  assert.equal(data.looks.length,12);
  assert.equal(data.imageCredits.length,4);
  assert.ok(data.looks.every(look=>look.availableForPurchase === false));
  assert.ok(data.imageCredits.every(image=>image.licenseUrl.startsWith('https://creativecommons.org/')));
  assert.ok(data.imageCredits.every(image=>!image.localPath));
  dom.window.close();
});
test('palette and garment filters change the actual visible outfits and handle empty intersections', () => {
  const f=fixture();
  f.q('[data-palette="coast"]').click();
  assert.deepEqual(f.visible().map(card=>card.dataset.lookId),['09','10','11','12']);
  assert.match(f.visible()[0].querySelector('img').src,/look-09-front/);
  assert.equal(f.q('[data-result-count]').textContent,'4 looks');
  f.q('[data-garment]').value='dresses';
  f.q('[data-garment]').dispatchEvent(new f.window.Event('change'));
  assert.deepEqual(f.visible().map(card=>card.dataset.lookId),['12']);
  assert.equal(f.q('[data-next]').disabled,true);
  f.q('[data-palette="club"]').click();
  assert.equal(f.visible().length,0);
  assert.equal(f.q('[data-empty]').hidden,false);
  assert.equal(f.q('[data-look-track]').hidden,true);
  f.q('[data-reset]').click();
  assert.equal(f.visible().length,12);
  assert.equal(f.q('[data-empty]').hidden,true);
  assert.equal(f.q('[data-palette="all"]').getAttribute('aria-pressed'),'true');
  f.dom.window.close();
});
test('front, back and detail switches use distinct imagery; modal magnifies and returns keyboard focus', () => {
  const f=fixture();
  const card=f.q('[data-look-id="01"]');
  card.querySelector('[data-view="back"]').click();
  assert.match(card.querySelector('img').src,/look-01-back/);
  assert.match(card.querySelector('img').alt,/back view/);
  const opener=card.querySelector('[data-enlarge]');
  opener.click();
  assert.equal(f.q('[data-look-dialog]').open,true);
  assert.equal(f.window.document.activeElement,f.q('[data-close]'));
  assert.match(f.q('[data-dialog-image]').src,/look-01-back/);
  f.q('[data-dialog-view="detail"]').click();
  assert.match(f.q('[data-dialog-image]').src,/look-01-detail/);
  assert.match(f.q('[data-dialog-caption]').textContent,/not a physical fabric sample/);
  f.q('[data-magnify]').click();
  assert.equal(f.q('[data-magnify]').getAttribute('aria-pressed'),'true');
  assert.ok(f.q('[data-dialog-stage]').classList.contains('magnified'));
  f.q('[data-close]').click();
  assert.equal(f.q('[data-look-dialog]').open,false);
  assert.equal(f.window.document.activeElement,opener);
  f.dom.window.close();
});
test('keyboard gallery navigation respects reduced motion and leaves image buttons alone', () => {
  const f=fixture(true);
  const track=f.q('[data-look-track]');
  f.q('[data-palette="court"]').click();
  track.dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
  assert.equal(f.q('[data-page]').textContent,'02 / 04');
  assert.equal(f.scrolls.at(-1).behavior,'instant');
  f.q('[data-look-id="02"] [data-view="front"]').dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert.equal(f.q('[data-page]').textContent,'02 / 04');
  f.q('[data-next]').click();
  assert.equal(f.q('[data-page]').textContent,'03 / 04');
  f.dom.window.close();
});
