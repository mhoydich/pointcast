import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const data = JSON.parse(await readFile('src/data/home-visit-views.json', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');
const dom = new JSDOM(html); // Scripts stay disabled: inspect the actual no-JS output.
const document = dom.window.document;
const root = document.querySelector('[data-home-visit]');
assert.ok(root);
assert.equal(root.dataset.view, 'signal-atlas');
assert.equal(root.hasAttribute('data-ready'), false);
assert.equal(root.querySelector('[data-home-visit-next]').hidden, true);
assert.match(root.querySelector('noscript').textContent, /All its doors work without JavaScript/);
assert.equal(root.querySelector('[data-home-visit-status]').textContent, '');
const views = [...root.querySelectorAll('[data-home-visit-view]')];
assert.equal(views.length, 6);
assert.equal(views.filter(view => view.dataset.active === 'true').length, 1);
const projects = new Map(data.projects.map(project => [project.id, project]));
const assetResults = [];
for (const [index, view] of views.entries()) {
  assert.equal(view.dataset.viewId, data.views[index].id);
  assert.equal(view.hasAttribute('inert'), index !== 0);
  assert.equal(view.getAttribute('aria-hidden'), index === 0 ? null : 'true');
  const links = [...view.querySelectorAll('ol a')];
  assert.equal(links.length, 3);
  for (const [projectIndex, link] of links.entries()) {
    const project = projects.get(data.views[index].projects[projectIndex]);
    assert.equal(link.getAttribute('href'), project.href);
    assert.ok(project.source.startsWith('https://pointcast.xyz/'));
    assert.equal(link.getAttribute('tabindex'), index === 0 ? null : '-1');
    assert.equal(link.querySelector('.home-visit__kind').textContent, project.kind);
    assert.equal(link.querySelector('.home-visit__description').textContent, project.description);
  }
  const image = view.querySelector('img');
  assert.equal(image.width, 1200);
  assert.equal(image.height, 630);
  assert.ok(image.alt.length > 30);
  const bytes = await readFile(path.join('dist', image.getAttribute('src')));
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.ok(bytes.length < 250000);
  assetResults.push({ id: view.dataset.viewId, bytes: bytes.length, width: metadata.width, height: metadata.height, sha256: createHash('sha256').update(bytes).digest('hex') });
}
assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://pointcast.xyz/');
assert.equal(document.querySelector('meta[property="og:url"]').content, 'https://pointcast.xyz/');
assert.match(document.querySelector('meta[property="og:image"]').content, /\/images\/home-share\/2026-10\/01-signal-atlas\.png/);
assert.equal(document.querySelector('meta[property="og:image"]').content, document.querySelector('meta[name="twitter:image"]').content);
assert.ok(document.querySelector('[data-home-latest-projects]'));
assert.ok(document.querySelector('[data-home-share]'));
dom.window.close();
console.log(JSON.stringify({ noJavaScriptFallback: 'passed', stableHomeMetadata: 'passed', qualifiedProjectLinks: 18, publicDestinations: data.projects.length, visitorAssets: assetResults }, null, 2));
