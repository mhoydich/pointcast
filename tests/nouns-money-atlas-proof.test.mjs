import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const publicDir = new URL('../public/', import.meta.url);
const desk = '/nouns-money/atlas-proof/';
const read = url => readFile(new URL(url.slice(1), publicDir));
const html = await read(desk + 'index.html');
const manifest = JSON.parse(await read(desk + 'proofs.json'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// jsdom has no image decoder or canvas backend. Use Sharp for the page's two drawImage calls.
function enableCanvas(window) {
  const decoded = new WeakMap();
  window.HTMLImageElement.prototype.decode = async function () {
    const bytes = Buffer.from(await (await fetch(this.src)).arrayBuffer());
    const { width, height } = await sharp(bytes).metadata();
    Object.defineProperties(this, { naturalWidth: { value: width }, naturalHeight: { value: height } });
    decoded.set(this, bytes);
  };
  window.HTMLCanvasElement.prototype.getContext = function () {
    this.layers = [];
    return { drawImage: (image, left, top) => this.layers.push({ input: decoded.get(image), left, top }) };
  };
  window.HTMLCanvasElement.prototype.toBlob = async function (callback, type) {
    const create = { width: this.width, height: this.height, channels: 3, background: 'white' };
    const bytes = await sharp({ create }).composite(this.layers).png().toBuffer();
    callback(new Blob([bytes], { type }));
  };
}

async function until(fn) {
  for (let i = 0; i < 300; i++) {
    if (fn()) return;
    await delay(10);
  }
  assert.fail('Proof page did not reach the expected state');
}

async function openDesk(t, { intercept = (_, bytes) => bytes, query = '' } = {}) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://pointcast.xyz' + desk + query });
  t.after(() => dom.window.close());
  const { window } = dom;
  const { document } = window;
  const byId = id => document.getElementById(id);
  Object.defineProperty(window, 'crypto', { value: webcrypto });
  window.Blob = Blob;
  window.URL.createObjectURL = URL.createObjectURL;
  window.URL.revokeObjectURL = URL.revokeObjectURL;
  window.fetch = async path => new Response(await intercept(path, await read(path)));
  enableCanvas(window);
  window.eval(document.querySelector('script').textContent);
  await until(() => !byId('review').hidden);
  return { window, byId, change(control) { control.dispatchEvent(new window.Event('change', { bubbles: true })); } };
}

test('all 24 two-sided candidates reference the released source and reconstruct the recorded PDF bytes', async () => {
  const catalog = JSON.parse(await read('/nouns-money/collected/manifest.json'));
  const published = catalog.entries.filter(e => e.collection === 'many-worlds-atlas');
  assert.equal(published.length, 24);
  assert.deepEqual(manifest.editions.map(e => e.id), published.map(e => e.id));
  for (const [index, item] of manifest.editions.entries()) {
    for (const side of ['front', 'back']) {
      const face = item[side];
      assert.equal(face.source, side === 'front' ? published[index].image : published[index].back);
      assert.equal(hash(await read(face.source)), face.sourceSha256);
      const patch = await read(desk + face.patch);
      assert.equal(hash(patch), face.patchSha256);
      const { width, height } = await sharp(patch).metadata();
      assert.deepEqual([width, height], [face.width, face.height]);
      assert.ok(face.x >= 0 && face.y >= 0 && face.x + width <= 1200 && face.y + height <= 600);
    }
    const pdf = item.pdf;
    assert.equal(pdf.source, published[index].download);
    const source = await read(pdf.source);
    const patch = await read(desk + pdf.patch);
    assert.equal(hash(source), pdf.sourceSha256);
    assert.equal(hash(patch), pdf.patchSha256);
    assert.equal(source.length, pdf.sourceBytes);
    assert.equal(source.length + patch.length, pdf.resultBytes);
    assert.equal(hash(Buffer.concat([source, patch])), pdf.resultSha256);
  }
});

test('deep links, side switching and real PNG/PDF downloads follow the visible selection', async t => {
  const item = manifest.editions.at(-1);
  const { window, byId, change } = await openDesk(t, { query: `?edition=${item.id}&side=back` });
  assert.equal(byId('edition').length, 24);
  assert.equal(byId('title').textContent, item.title);
  assert.equal(byId('source-art').querySelector('img').getAttribute('src'), item.back.source);
  assert.equal(byId('source-pdf').getAttribute('href'), item.pdf.source);
  const png = byId('candidate-png');
  await until(() => !png.hidden);
  assert.equal(png.download, item.id + '-back.png');
  const exported = Buffer.from(await (await fetch(png.href)).arrayBuffer());
  const metadata = await sharp(exported).metadata();
  assert.deepEqual([metadata.format, metadata.width, metadata.height], ['png', 1200, 600]);
  const { x: left, y: top, width, height } = item.back;
  const actual = await sharp(exported).extract({ left, top, width, height }).removeAlpha().raw().toBuffer();
  const expected = await sharp(await read(desk + item.back.patch)).removeAlpha().raw().toBuffer();
  assert.deepEqual(actual, expected);

  window.document.querySelector('[value="front"]').click();
  await until(() => !png.hidden && png.download === item.id + '-front.png');
  byId('prepare-pdf').click();
  const pdf = byId('candidate-pdf');
  await until(() => !pdf.hidden);
  assert.equal(hash(Buffer.from(await (await fetch(pdf.href)).arrayBuffer())), item.pdf.resultSha256);
  byId('edition').selectedIndex = 0;
  change(byId('edition'));
  assert.equal(pdf.hidden, true);
  assert.equal(pdf.hasAttribute('href'), false);
  await until(() => !png.hidden && png.download === manifest.editions[0].id + '-front.png');
});

test('a corrupted image or PDF patch cannot create a download', async t => {
  const item = manifest.editions[0];
  const damaged = new Set([desk + item.front.patch, desk + item.pdf.patch]);
  const { byId } = await openDesk(t, { intercept(path, bytes) {
    if (damaged.has(path)) bytes[bytes.length - 1] ^= 1;
    return bytes;
  } });
  byId('prepare-pdf').click();
  await until(() => /checksum/.test(byId('candidate-art').textContent) && /checksum/.test(byId('pdf-status').textContent));
  for (const id of ['candidate-png', 'candidate-pdf']) {
    assert.equal(byId(id).hidden, true);
    assert.equal(byId(id).hasAttribute('href'), false);
  }
  assert.equal(byId('prepare-pdf').disabled, false, 'the master can be retried');
});

test('an older PDF request cannot replace the selected edition after its fetch returns late', async t => {
  const [first, second] = manifest.editions;
  const gate = Promise.withResolvers();
  const started = Promise.withResolvers();
  const { window, byId, change } = await openDesk(t, { async intercept(path, bytes) {
    if (path === first.pdf.source) { started.resolve(); await gate.promise; }
    return bytes;
  } });
  const older = window.preparePDF();
  await started.promise;
  byId('edition').selectedIndex = 1;
  change(byId('edition'));
  await window.preparePDF();
  const link = byId('candidate-pdf');
  const verified = link.href;
  gate.resolve();
  await older;
  assert.equal(link.href, verified);
  assert.equal(link.download, second.id + '-candidate.pdf');
  await until(() => !byId('candidate-png').hidden);
});
