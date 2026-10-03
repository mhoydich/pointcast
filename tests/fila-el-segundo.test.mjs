import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { initElSegundoCollection } from '../src/scripts/fila-el-segundo.mjs';

// Run from the real PointCast checkout after build:bare; there is no synthetic page fixture.
const repoRoot = process.cwd();
const require = createRequire(join(repoRoot, 'package.json'));
const { JSDOM } = require('jsdom');
const sharp = require('sharp');
const html = readFileSync(join(repoRoot, 'dist/fila/el-segundo/index.html'), 'utf8');
const collection = JSON.parse(readFileSync(join(repoRoot, 'dist/fila/el-segundo.json'), 'utf8'));
const artwork = JSON.parse(readFileSync(join(repoRoot, 'docs/research/fila-el-segundo-artwork.json'), 'utf8'));
const CANONICAL = 'https://pointcast.xyz/fila/el-segundo/';
const STORAGE_KEY = 'pointcast:fila-el-segundo:afternoon-edit:v1';
const IDS = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture(t, {
  reduced = false, url = CANONICAL, stored, blockedStorage = false,
  blockedWrites = false, clipboard, modal = true,
} = {}) {
  const dom = new JSDOM(html, { url, pretendToBeVisual: true });
  const { window } = dom;
  const doc = window.document;
  t.after(() => window.close());
  const root = doc.querySelector('[data-fila-el-segundo]');
  assert.ok(root, 'the built page contains the real collection');
  const q = selector => root.querySelector(selector);
  const cards = [...root.querySelectorAll('[data-es-look][data-look-id]')];
  const visible = () => cards.filter(card => !card.hidden);
  const scrolls = [];
  // jsdom lacks layout, scrolling, media-query evaluation and a native modal stack.
  window.matchMedia = query => ({ matches: reduced, media: query });
  window.HTMLElement.prototype.scrollTo = function(options) {
    this.scrollLeft = options.left ?? 0;
    this.scrollTop = options.top ?? 0;
    scrolls.push({ element: this, ...options });
  };
  cards.forEach(card => Object.defineProperty(card, 'offsetLeft', {
    configurable: true,
    get: () => Math.max(0, visible().indexOf(card)) * 900,
  }));
  if (modal) {
    window.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
    window.HTMLDialogElement.prototype.close = function() {
      this.open = false;
      this.dispatchEvent(new window.Event('close'));
    };
  } else {
    Object.defineProperty(window.HTMLDialogElement.prototype, 'showModal', { value: undefined, configurable: true });
  }
  if (stored !== undefined) window.localStorage.setItem(STORAGE_KEY, stored);
  if (blockedStorage) Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() { throw new window.DOMException('Storage blocked', 'SecurityError'); },
  });
  if (blockedWrites) window.Storage.prototype.setItem = function() {
    throw new window.DOMException('Storage full', 'QuotaExceededError');
  };
  if (clipboard !== undefined) Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: clipboard },
  });
  initElSegundoCollection(doc);
  return {
    dom, window, doc, root, q, cards, visible, scrolls,
    card: id => cards.find(card => card.dataset.lookId === id),
    save: id => cards.find(card => card.dataset.lookId === id).querySelector('[data-es-save]'),
  };
}
const visibleIds = f => f.visible().map(card => card.dataset.lookId);
const savedIds = f => f.cards.filter(card =>
  card.querySelector('[data-es-save]').getAttribute('aria-pressed') === 'true'
).map(card => card.dataset.lookId);

test('built v2 publishes nine original looks, honest place/art labels and verified image provenance', async t => {
  const dom = new JSDOM(html, { url: CANONICAL });
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  const cards = [...doc.querySelectorAll('[data-es-look][data-look-id]')];
  assert.deepEqual(cards.map(card => card.dataset.lookId), IDS);
  assert.deepEqual(collection.looks.map(look => look.id), IDS);
  assert.equal(collection.version, 2);
  assert.equal(collection.url, CANONICAL);
  assert.equal(collection.independentEditorial, true);
  assert.equal(collection.affiliation, null);
  assert.equal(collection.availableInventory, false);
  assert.match(collection.conceptLabel, /independent/i);
  assert.match(collection.conceptLabel, /no FILA affiliation|no.*endorsement/i);
  assert.deepEqual(collection.previous, ['https://pointcast.xyz/fila/', 'https://pointcast.xyz/fila/2027/']);
  assert.deepEqual(collection.imageProvenance, artwork, 'endpoint publishes the source provenance contract');
  assert.match(doc.querySelector('.campaign img').alt, /AI-generated.*fictional.*imaginary/i);
  assert.match(doc.querySelector('.campaign figcaption').textContent, /no real venue or event/i);
  assert.match(doc.querySelector('#credits').textContent, /detail views.*crops.*not physical material samples/i);
  assert.match(doc.querySelector('#credits').textContent, /no historical FILA photograph.*used as an image input/i);
  const sourceById = new Map(collection.sources.map(source => [source.id, source]));
  assert.ok(sourceById.size >= 6, 'local references publish facts alongside interpretation');
  for (const source of collection.sources) {
    assert.equal(new URL(source.url).protocol, 'https:');
    assert.ok(source.fact.length > 30);
    assert.ok(source.inference.length > 30);
    assert.notEqual(source.fact, source.inference);
    assert.ok([...doc.querySelectorAll('#sources a')].some(link => link.href === source.url));
  }
  assert.equal(artwork.method, 'built-in imagegen');
  assert.match(artwork.label, /generated|concept/i);
  assert.equal(artwork.originals.length, 10);
  assert.equal(artwork.assets.length, 38, 'nine four-view sets, campaign and cover');
  assert.deepEqual(artwork.originals.map(original => original.id).sort(),
    ['es01', 'es02', 'es03', 'es04', 'es05', 'es06', 'es07', 'es08', 'es09', 'hero']);
  const originalHashes = new Set(artwork.originals.map(original => original.sha256));
  assert.equal(originalHashes.size, 10, 'each look is a distinct new paired original');
  for (const original of artwork.originals) {
    assert.match(original.sha256, /^[a-f0-9]{64}$/);
    assert.ok(original.fileName.length > 4 && !original.fileName.includes('/'));
    if (original.id !== 'hero') {
      assert.equal(original.width, 1536);
      assert.equal(original.height, 1024);
    }
  }
  assert.doesNotMatch(JSON.stringify(collection.imageProvenance),
    /\/Users\/|\/tmp\/|file:\/\/|generated_images\/|art-assets\/|sediment:\/\/|library:\/\/|file_[A-Za-z0-9]/,
    'public provenance omits local paths and private Library identities');
  const byPath = new Map(artwork.assets.map(asset => [asset.path, asset]));
  assert.equal(byPath.size, artwork.assets.length);
  for (const asset of artwork.assets) {
    assert.ok(asset.path.startsWith('/images/fila-el-segundo/'));
    assert.ok(!asset.path.includes('..'));
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    assert.ok(originalHashes.has(asset.sourceSha256), asset.path + ' identifies its original');
    assert.ok(asset.transform, asset.path + ' explains the derivative');
    const path = resolve(repoRoot, 'public', '.' + asset.path);
    assert.ok(path.startsWith(resolve(repoRoot, 'public') + '/'));
    const bytes = readFileSync(path);
    assert.equal(bytes.length, asset.bytes, asset.path + ' byte length');
    assert.equal(sha256(bytes), asset.sha256, asset.path + ' actual checksum');
    const meta = await sharp(bytes).metadata();
    assert.equal(meta.width, asset.width, asset.path + ' actual width');
    assert.equal(meta.height, asset.height, asset.path + ' actual height');
    assert.ok(meta.width > 200 && meta.height > 200, 'real imagery rather than tiny placeholders');
  }
  for (const look of collection.looks) {
    const card = cards.find(card => card.dataset.lookId === look.id);
    const image = card.querySelector('[data-es-image]');
    assert.equal(look.availableForPurchase, false);
    assert.ok(sourceById.has(look.reference));
    assert.equal(card.dataset.chapter, look.chapter);
    assert.equal(card.dataset.category, look.category);
    assert.match(card.querySelector('figcaption').textContent, /original AI-generated concept/i);
    assert.match(card.querySelector('.es-proposal-note').textContent, /not.*physical fabric sample/i);
    assert.match(look.detailNote, /crop.*not a physical fabric sample/i);
    assert.equal(card.querySelectorAll('dl dd').length, 3);
    for (const note of card.querySelectorAll('dl dd')) assert.ok(note.textContent.trim().length > 25);
    assert.match(card.querySelector('.es-reference').textContent, /Source:.*Interpretation:/s);
    assert.equal(card.querySelector('.es-reference a').href, sourceById.get(look.reference).url);
    const viewHashes = [];
    for (const view of ['front', 'back', 'detail']) {
      const asset = byPath.get(look.images[view]);
      assert.ok(asset, look.id + ' ' + view + ' in manifest');
      assert.equal(asset.lookId, look.id);
      assert.equal(asset.view, view);
      assert.equal(image.dataset[view], look.images[view]);
      if (view !== 'detail') {
        assert.equal(asset.width, 768);
        assert.equal(asset.height, 1024);
      }
      viewHashes.push(asset.sha256);
      assert.ok([...card.querySelectorAll('.es-static-views a')].some(link =>
        new URL(link.href).pathname === look.images[view]), 'unenhanced direct view link');
    }
    assert.equal(new Set(viewHashes).size, 3, look.id + ' views contain distinct image bytes');
    const paired = byPath.get(look.images.paired);
    assert.equal(paired.view, 'pair');
    assert.equal(paired.width, 1536);
    assert.equal(paired.height, 1024);
  }
  assert.equal(artwork.assets.find(asset => asset.view === 'hero').width, 1672);
  assert.equal(artwork.assets.find(asset => asset.view === 'hero').height, 941);
  assert.equal(artwork.assets.find(asset => asset.view === 'cover').width, 768);
  assert.ok([...doc.querySelectorAll('[data-es-js]')].every(control => control.hidden),
    'server-rendered direct links work before enhancement');
});

test('real filters change cards, expose empty results and reset all controls', t => {
  const f = fixture(t);
  assert.equal(f.root.dataset.esInitialized, 'true');
  assert.ok([...f.root.querySelectorAll('[data-es-js]')].every(control => !control.hidden));
  for (const [chapter, ids] of [['coast', ['01', '02', '03']], ['works', ['04', '05', '06']], ['court', ['07', '08', '09']]]) {
    f.q('[data-es-chapter="' + chapter + '"]').click();
    assert.deepEqual(visibleIds(f), ids);
    assert.equal(f.q('[data-es-chapter="' + chapter + '"]').getAttribute('aria-pressed'), 'true');
    assert.equal(f.q('[data-es-result-count]').textContent, '3 looks');
    assert.equal(f.q('[data-es-page]').textContent, '01 / 03');
  }
  f.q('[data-es-chapter="coast"]').click();
  f.q('[data-es-garment]').value = 'tops';
  f.q('[data-es-garment]').dispatchEvent(new f.window.Event('change'));
  assert.deepEqual(visibleIds(f), ['01', '02']);
  assert.match(f.visible()[0].querySelector('[data-es-image]').src, /es01-front\.webp$/);
  f.q('[data-es-chapter="works"]').click();
  assert.deepEqual(visibleIds(f), []);
  assert.equal(f.q('[data-es-empty]').hidden, false);
  assert.equal(f.q('[data-es-track]').hidden, true);
  assert.equal(f.q('[data-es-page]').textContent, '00 / 00');
  assert.equal(f.q('[data-es-prev]').disabled, true);
  assert.equal(f.q('[data-es-next]').disabled, true);
  f.q('[data-es-reset]').click();
  assert.deepEqual(visibleIds(f), IDS);
  assert.equal(f.q('[data-es-empty]').hidden, true);
  assert.equal(f.q('[data-es-track]').hidden, false);
  assert.equal(f.q('[data-es-garment]').value, 'all');
  assert.equal(f.q('[data-es-chapter="all"]').getAttribute('aria-pressed'), 'true');
  for (const [category, ids] of [['tops', ['01', '02', '07']], ['outerwear', ['03', '04', '06']], ['knits', ['05']], ['skirts', ['08']], ['dresses', ['09']]]) {
    f.q('[data-es-garment]').value = category;
    f.q('[data-es-garment]').dispatchEvent(new f.window.Event('change'));
    assert.deepEqual(visibleIds(f), ids);
  }
});

test('all nine cards change actual view images, link targets, labels and pressed state', t => {
  const f = fixture(t);
  for (const look of collection.looks) {
    const card = f.card(look.id);
    const image = card.querySelector('[data-es-image]');
    let previous = image.src;
    for (const view of ['back', 'detail', 'front']) {
      card.querySelector('[data-es-view="' + view + '"]').click();
      assert.equal(image.src, new URL(look.images[view], CANONICAL).href);
      assert.notEqual(image.src, previous);
      assert.equal(card.querySelector('[data-es-enlarge]').href, image.src);
      assert.equal(image.dataset.currentView, view);
      assert.match(image.alt, /original AI-generated independent concept/i);
      const label = view === 'detail' ? 'detail crop' : view + ' view';
      assert.ok(image.alt.endsWith(label + '.'));
      assert.equal(card.querySelector('[data-es-view-label]').textContent, label);
      assert.equal(card.querySelectorAll('[data-es-view][aria-pressed="true"]').length, 1);
      assert.equal(card.querySelector('[data-es-view="' + view + '"]').getAttribute('aria-pressed'), 'true');
      previous = image.src;
    }
  }
});

test('native-dialog enhancement changes views, magnifies, resets fit and restores focus', t => {
  const f = fixture(t);
  const card = f.card('05');
  const opener = card.querySelector('[data-es-enlarge]');
  const dialog = f.q('[data-es-dialog]');
  assert.equal(dialog.tagName, 'DIALOG');
  card.querySelector('[data-es-view="back"]').click();
  opener.focus(); opener.click();
  assert.equal(dialog.open, true);
  assert.equal(f.doc.activeElement, f.q('[data-es-close]'));
  assert.equal(f.q('[data-es-dialog-image]').src, card.querySelector('[data-es-image]').src);
  for (const view of ['front', 'back', 'detail']) {
    f.q('[data-es-dialog-view="' + view + '"]').click();
    assert.equal(f.q('[data-es-dialog-image]').src, new URL(card.querySelector('[data-es-image]').dataset[view], CANONICAL).href);
    assert.equal(f.q('[data-es-dialog-view="' + view + '"]').getAttribute('aria-pressed'), 'true');
    assert.equal(f.q('[data-es-magnify]').getAttribute('aria-pressed'), 'false');
  }
  assert.match(f.q('[data-es-dialog-caption]').textContent, /crop.*not a physical fabric sample/i);
  f.q('[data-es-magnify]').click();
  assert.ok(f.q('[data-es-dialog-stage]').classList.contains('is-magnified'));
  assert.equal(f.q('[data-es-magnify]').getAttribute('aria-pressed'), 'true');
  f.q('[data-es-dialog-view="front"]').click();
  assert.equal(f.q('[data-es-dialog-stage]').classList.contains('is-magnified'), false);
  f.q('[data-es-close]').click();
  assert.equal(dialog.open, false);
  assert.equal(f.doc.activeElement, opener);
  opener.click();
  const cancel = new f.window.Event('cancel', { cancelable: true });
  dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented, true);
  assert.equal(dialog.open, false);
  assert.equal(f.doc.activeElement, opener);
  opener.click();
  dialog.dispatchEvent(new f.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(dialog.open, false);
  assert.equal(f.doc.activeElement, opener);
  opener.click();
  f.q('[data-es-chapter="court"]').click();
  assert.equal(card.hidden, true);
  f.q('[data-es-close]').click();
  assert.equal(f.doc.activeElement, f.q('[data-es-saved-only]'));
  assert.equal(f.doc.activeElement.closest('[hidden]'), null);
});

test('without modal support the actual image link and other controls remain usable', t => {
  const f = fixture(t, { modal: false });
  const card = f.card('04');
  card.querySelector('[data-es-view="back"]').click();
  assert.equal(card.querySelector('[data-es-enlarge]').href, new URL(collection.looks[3].images.back, CANONICAL).href);
  assert.equal(f.root.dataset.esInitialized, 'true');
  f.q('[data-es-chapter="works"]').click();
  assert.deepEqual(visibleIds(f), ['04', '05', '06']);
});

test('shortlist persists three canonical IDs and rejects a fourth without changing the edit', t => {
  const f = fixture(t);
  assert.equal(f.q('[data-es-copy]').disabled, true);
  for (const id of ['03', '01', '02']) f.save(id).click();
  assert.deepEqual(savedIds(f), ['01', '02', '03']);
  assert.equal(f.q('[data-es-saved-count]').textContent, '3 / 3');
  assert.deepEqual(JSON.parse(f.window.localStorage.getItem(STORAGE_KEY)), ['01', '02', '03']);
  assert.equal(f.q('[data-es-saved-list]').children.length, 3);
  f.save('04').click();
  assert.deepEqual(savedIds(f), ['01', '02', '03']);
  assert.equal(f.save('04').getAttribute('aria-pressed'), 'false');
  assert.match(f.q('[data-es-status]').textContent, /three looks.*remove one/i);
  f.q('[data-es-clear]').click();
  assert.deepEqual(savedIds(f), []);
  assert.deepEqual(JSON.parse(f.window.localStorage.getItem(STORAGE_KEY)), []);
  assert.equal(f.q('[data-es-saved-list]').children.length, 0);
  assert.equal(f.q('[data-es-edit-empty]').hidden, false);
  assert.equal(f.q('[data-es-copy]').disabled, true);
  assert.equal(f.doc.activeElement, f.q('[data-es-saved-only]'));
  initElSegundoCollection(f.doc);
  f.save('01').click();
  assert.deepEqual(savedIds(f), ['01'], 'repeat initialization does not duplicate listeners');
});

test('blocked storage leaves a working visit edit with visible feedback', t => {
  for (const options of [{ blockedStorage: true }, { blockedWrites: true }]) {
    const f = fixture(t, options);
    for (const id of ['01', '02', '03', '04']) f.save(id).click();
    assert.deepEqual(savedIds(f), ['01', '02', '03']);
    f.save('03').click();
    assert.deepEqual(savedIds(f), ['01', '02']);
    assert.match(f.q('[data-es-status]').textContent, /saved for this visit/i);
    f.q('[data-es-saved-only]').click();
    assert.deepEqual(visibleIds(f), ['01', '02']);
    f.q('[data-es-clear]').click();
    assert.deepEqual(visibleIds(f), []);
    assert.equal(f.q('[data-es-empty]').hidden, false);
  }
});

test('malformed storage is ignored and untrusted duplicate/non-string IDs are bounded', t => {
  for (const stored of ['not-json', 'null', '{}', '"01"']) {
    const f = fixture(t, { stored });
    assert.deepEqual(savedIds(f), []);
    f.save('02').click();
    assert.deepEqual(savedIds(f), ['02']);
  }
  const f = fixture(t, { stored: '["99","__proto__","01","01",{},null,"03",2,"02","04"]' });
  assert.deepEqual(savedIds(f), ['01', '02', '03']);
  assert.deepEqual(JSON.parse(f.window.localStorage.getItem(STORAGE_KEY)), ['01', '02', '03']);
  assert.equal(f.q('[data-es-saved-count]').textContent, '3 / 3');
});

test('saved-only removal and filtering move focus before its active card becomes hidden', t => {
  const f = fixture(t);
  f.save('01').click(); f.save('02').click();
  f.q('[data-es-saved-only]').click();
  f.save('01').focus(); f.save('01').click();
  assert.equal(f.card('01').hidden, true);
  assert.deepEqual(visibleIds(f), ['02']);
  assert.equal(f.doc.activeElement, f.q('[data-es-saved-only]'));
  assert.equal(f.doc.activeElement.closest('[hidden]'), null);
  f.save('02').focus(); f.save('02').click();
  assert.equal(f.q('[data-es-track]').hidden, true);
  assert.equal(f.q('[data-es-empty]').hidden, false);
  assert.equal(f.doc.activeElement, f.q('[data-es-saved-only]'));
  f.q('[data-es-reset]').click();
  f.save('01').focus();
  f.q('[data-es-chapter="works"]').click();
  assert.equal(f.card('01').hidden, true);
  assert.equal(f.doc.activeElement.closest('[hidden]'), null);
  assert.equal(f.doc.activeElement, f.q('[data-es-saved-only]'));
});

test('missing or rejected clipboard exposes a focused URL instead of claiming success', async t => {
  for (const clipboard of [undefined, async () => { throw new Error('Denied'); }]) {
    const f = fixture(t, { clipboard });
    f.save('09').click(); f.save('01').click();
    f.q('[data-es-copy]').click();
    await settle();
    assert.equal(f.q('[data-es-share-fallback]').hidden, false);
    assert.equal(f.q('[data-es-share-url]').value, CANONICAL + '?edit=01,09');
    assert.equal(f.q('[data-es-share-url]').readOnly, true);
    assert.equal(f.doc.activeElement, f.q('[data-es-share-url]'));
    assert.match(f.q('[data-es-share-status]').textContent, /select and copy/i);
    assert.doesNotMatch(f.q('[data-es-share-status]').textContent, /copied your/i);
  }
});

test('copy succeeds only after clipboard resolution and ignores an obsolete pending edit', async t => {
  let resolveCopy;
  const writes = [];
  const f = fixture(t, { clipboard: text => {
    writes.push(text);
    return new Promise(resolve => { resolveCopy = resolve; });
  } });
  f.save('03').click(); f.save('01').click();
  f.q('[data-es-copy]').click();
  assert.deepEqual(writes, [CANONICAL + '?edit=01,03']);
  assert.doesNotMatch(f.q('[data-es-share-status]').textContent, /copied/i);
  resolveCopy(); await settle();
  assert.match(f.q('[data-es-share-status]').textContent, /copied your afternoon edit link/i);
  assert.equal(f.q('[data-es-share-fallback]').hidden, true);
  f.q('[data-es-copy]').click();
  f.save('02').click();
  resolveCopy(); await settle();
  assert.equal(f.q('[data-es-share-status]').textContent, '');
  assert.deepEqual(savedIds(f), ['01', '02', '03']);
});

test('share queries accept only known IDs, override storage and produce a clean canonical link', async t => {
  const f = fixture(t, {
    url: CANONICAL + '?edit=09,untrusted,02,09,01,04&redirect=https://example.test/',
    stored: '["04","05"]',
  });
  assert.deepEqual(savedIds(f), ['01', '02', '09']);
  assert.deepEqual(JSON.parse(f.window.localStorage.getItem(STORAGE_KEY)), ['01', '02', '09']);
  f.q('[data-es-copy]').click(); await settle();
  const shared = new URL(f.q('[data-es-share-url]').value);
  assert.equal(shared.origin + shared.pathname, CANONICAL);
  assert.deepEqual([...shared.searchParams.keys()], ['edit']);
  assert.equal(shared.searchParams.get('edit'), '01,02,09');
  const unknown = fixture(t, { url: CANONICAL + '?edit=unknown,__proto__', stored: '["01"]' });
  assert.deepEqual(savedIds(unknown), []);
  assert.equal(unknown.q('[data-es-copy]').disabled, true);
});

test('gallery-only keys navigate pages, with instant scrolling under reduced motion', t => {
  for (const reduced of [true, false]) {
    const f = fixture(t, { reduced });
    f.q('[data-es-chapter="works"]').click();
    const track = f.q('[data-es-track]');
    track.focus();
    const right = new f.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    track.dispatchEvent(right);
    assert.equal(right.defaultPrevented, true);
    assert.equal(f.q('[data-es-page]').textContent, '02 / 03');
    assert.equal(f.scrolls.at(-1).element, track);
    assert.equal(f.scrolls.at(-1).left, 900);
    assert.equal(f.scrolls.at(-1).behavior, reduced ? 'instant' : 'smooth');
    for (const child of [f.card('05').querySelector('[data-es-view="back"]'), f.save('05')]) {
      const key = new f.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      child.dispatchEvent(key);
      assert.equal(key.defaultPrevented, false);
      assert.equal(f.q('[data-es-page]').textContent, '02 / 03');
    }
    for (const [key, page, left] of [['End', '03 / 03', 1800], ['Home', '01 / 03', 0], ['ArrowLeft', '01 / 03', 0]]) {
      track.dispatchEvent(new f.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      assert.equal(f.q('[data-es-page]').textContent, page);
      assert.equal(f.scrolls.at(-1).left, left);
    }
    f.q('[data-es-next]').click();
    assert.equal(f.q('[data-es-page]').textContent, '02 / 03');
  }
});
