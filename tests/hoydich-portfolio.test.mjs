import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { PROJECTS, STUDIO, NATIVE, ROADMAP, LATEST_LINKS, RELEASED_STUDIES, portfolioPayload } from '../src/data/hoydich-portfolio.mjs';
import { initPortfolio } from '../src/scripts/hoydich-portfolio.mjs';
import { articles } from '../src/lib/pickleball-v2/articles.js';

const rootPath = new URL('../', import.meta.url);
function fixture() {
  const dom = new JSDOM(`<main data-hoydich-portfolio>
    <div data-portfolio-filters hidden><select data-family-filter><option value="all">All</option>${['design','reading','art','play','place','tools'].map(id => `<option value="${id}">${id}</option>`).join('')}</select>
    ${['all','open','building','redesign','delivered-native'].map(id => `<button data-status-filter="${id}" aria-pressed="${id === 'all'}">${id}</button>`).join('')}<button data-reset-filters>Reset</button></div>
    <p data-filter-result role="status"></p>
    ${PROJECTS.map(project => `<article data-project-card data-family="${project.family}" data-next-status="${project.next?.status ?? ''}"><a href="${project.href}">${project.title}</a>${project.next ? `<a data-show-studio href="#studio-${project.id}-next">Next</a>` : ''}</article>`).join('')}
    ${NATIVE.map(project => `<article data-native-card data-family="${project.family}">${project.title}</article>`).join('')}<p data-project-empty hidden><a data-show-studio href="#worktable">Studio</a></p>
    ${STUDIO.map(project => `<article id="studio-${project.id}" data-studio-card data-family="${project.family}" data-status="${project.status}">${project.title}</article>`).join('')}
    <p data-studio-empty hidden></p></main>`);
  const root = dom.window.document.querySelector('main');
  initPortfolio(root);
  return { root, dom, visible: selector => [...root.querySelectorAll(selector)].filter(card => !card.hidden), click: status => root.querySelector(`[data-status-filter="${status}"]`).click(), family: value => { const select = root.querySelector('select'); select.value = value; select.dispatchEvent(new dom.window.Event('change')); } };
}

test('published redesign editions leave the unfinished redesign view', () => {
  const f = fixture();
  f.click('redesign');
  assert.equal(f.visible('[data-project-card]').length, 0);
  assert.equal(f.visible('[data-studio-card]').length, 0);
  assert.equal(PROJECTS.find(project => project.id === 'fila').next, undefined);
  assert.ok(PROJECTS.find(project => project.id === 'fila').links.some(link => link.href === '/fila/el-segundo/'));
  assert.equal(f.root.querySelector('[data-status-filter="redesign"]').getAttribute('aria-pressed'), 'true');
});

test('family and stage combine, announce empty states, and reset to the complete snapshot', () => {
  const f = fixture();
  f.family('tools');
  f.click('open');
  assert.equal(f.visible('[data-project-card]').length, 0);
  assert.equal(f.visible('[data-studio-card]').length, 0);
  assert.equal(f.root.querySelector('[data-project-empty]').hidden, false);
  assert.equal(f.root.querySelector('[data-studio-empty]').hidden, false);
  f.click('building');
  assert.equal(f.visible('[data-studio-card]').length, 0);
  f.root.querySelector('[data-reset-filters]').click();
  assert.equal(f.root.querySelector('select').value, 'all');
  assert.equal(f.visible('[data-project-card]').length, PROJECTS.length);
  assert.equal(f.visible('[data-studio-card]').length, STUDIO.length);
  assert.equal(f.root.querySelector('[data-project-empty]').hidden, true);
  assert.equal(f.root.querySelector('[data-studio-empty]').hidden, true);
});

test('published reading expansion no longer appears as an unfinished studio thread', () => {
  const f = fixture();
  f.family('reading');
  f.click('building');
  assert.equal(f.visible('[data-project-card]').length, 0);
  assert.equal(f.visible('[data-studio-card]').length, 0);
  f.click('open');
  assert.equal(f.visible('[data-project-card]').length, 2);
  assert.equal(f.visible('[data-studio-card]').length, 0);
  assert.equal(PROJECTS.find(project => project.id === 'books').links.length, 11);
});

test('public snapshot has source artwork and only known destinations; unpublished builds have no route', () => {
  const payload = portfolioPayload();
  assert.ok(Number.isFinite(Date.parse(payload.capturedAt)));
  assert.equal(payload.comparisons.length, 0);
  assert.equal(ROADMAP.reduce((count, group) => count + group.lanes.length, 0), 11);
  for (const project of PROJECTS) {
    assert.ok(existsSync(new URL(`public${project.image}`, rootPath)), `artwork exists: ${project.image}`);
    for (const href of [project.href, ...project.links.map(link => link.href)].filter(href => href.startsWith('/'))) {
      const route = href.replace(/^\//, '').replace(/\/$/, '');
      const bookRoute = href.startsWith('/books/') && existsSync(new URL('src/pages/books/[slug]/index.astro', rootPath)) && JSON.parse(readFileSync(new URL('src/data/bookshelf-expansion.json', rootPath), 'utf8')).some(book => href === '/books/' + book.id + '/');
      const articleRoute = articles.some(article => article.url.replace(/\/$/, '') === `/${route}`) && existsSync(new URL('src/pages/pickleball/articles/[slug].astro', rootPath));
      assert.ok(existsSync(new URL(`src/pages/${route}.astro`, rootPath)) || existsSync(new URL(`src/pages/${route}/index.astro`, rootPath)) || articleRoute || bookRoute, `route exists: ${href}`);
    }
    assert.ok(project.boundary.length > 30);
  }
  for (const project of STUDIO) {
    assert.ok(['building', 'redesign'].includes(project.status));
    assert.equal('href' in project, false);
    assert.equal('route' in project, false);
    if (project.currentHref) assert.ok(PROJECTS.some(current => current.href === project.currentHref));
  }
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /linear\.app|completionPercent|percentComplete|liveSync|privateKey|seedPhrase|client confidential|private finances/i);
  const page = readFileSync(new URL('src/pages/hoydich.astro', rootPath), 'utf8');
  assert.doesNotMatch(page, /href=["']\/(fortune|discovery-audit|fila\/el-segundo|pickleball\/home\/v2)/);
});

test('setup is idempotent and keeps controls hidden until the working initializer runs', () => {
  const f = fixture();
  initPortfolio(f.root);
  assert.equal(f.root.querySelector('[data-portfolio-filters]').hidden, false);
  f.click('building');
  assert.equal(f.visible('[data-project-card]').length, 0);
  assert.equal(f.visible('[data-studio-card]').length, STUDIO.length);
});


test('verified concept and disabled status pages stay distinct from pending destinations', () => {
  const payload = portfolioPayload();
  assert.equal(payload.sourceRevision, 'acb659d89be755e46791e0fa935b788064811dc1');
  assert.ok(Number.isFinite(Date.parse(payload.capturedAt)));
  assert.match(payload.dateLabel, /UTC/);
  assert.ok(LATEST_LINKS.some(project => project.id === 'buildworks' && project.href === '/buildworks/'));
  assert.equal(STUDIO.some(project => project.id === 'buildworks'), false);
  const commerce = LATEST_LINKS.find(project => project.id === 'art-v2-commerce');
  assert.equal(commerce.href, '/art/v2/commerce/');
  assert.match(commerce.statusLabel, /^DISABLED PREVIEW$/);
  assert.match(commerce.summary, /purchases, preparation, minting and listings remain disabled/i);
  assert.equal(LATEST_LINKS.find(project => project.id === 'home-share-editions').links.length, 6);
  const destinations = LATEST_LINKS.flatMap(project => [project.href, ...project.links.map(link => link.href)]);
  for (const pending of ['/puzzles/', '/goodreads/', '/death/', '/ues/death.html']) assert.equal(destinations.includes(pending), false);
  assert.deepEqual(STUDIO.map(project => project.id), ['sunday', 'puzzles']);
  assert.equal(LATEST_LINKS.find(project => project.id === 'art-v2').href, '/art/v2/');
  assert.equal(LATEST_LINKS.find(project => project.id === 'visitor-homepage').href, '/#home-visit-title');
  assert.equal(LATEST_LINKS.find(project => project.id === 'ues-death').href, '/ues/death/');
  assert.ok(PROJECTS.find(project => project.id === 'books').links.some(link => link.href === '/books/map/'));
  assert.equal(STUDIO.some(project => project.id === 'art-v2'), false);
});

test('delivered native work stays distinct from public browser pages and unfinished builds', () => {
  const f = fixture();
  f.click('delivered-native');
  assert.equal(f.visible('[data-project-card]').length, 0);
  assert.equal(f.visible('[data-studio-card]').length, 0);
  assert.equal(f.visible('[data-native-card]').length, 1);
  assert.equal('href' in NATIVE[0], false);
  assert.equal(NATIVE[0].status, 'delivered-native');
});


test('the empty-view studio fallback reveals the held puzzle thread', () => {
  const f = fixture();
  f.family('design');
  f.click('delivered-native');
  assert.equal(f.visible('[data-studio-card]').length, 0);
  f.root.querySelector('[data-project-empty] a').click();
  assert.deepEqual(f.visible('[data-studio-card]').map(card => card.id), ['studio-puzzles']);
  assert.equal(f.root.querySelector('[data-status-filter="all"]').getAttribute('aria-pressed'), 'true');
});

test('latest links preserve published destinations while upcoming studios stay unlinked', () => {
  assert.deepEqual(LATEST_LINKS.slice(0, PROJECTS.length).map(project => project.href), PROJECTS.map(project => project.href));
  assert.equal(LATEST_LINKS.length, PROJECTS.length + RELEASED_STUDIES.length);
  assert.equal(new Set(LATEST_LINKS.map(project => project.id)).size, LATEST_LINKS.length);
  for (const project of LATEST_LINKS) {
    assert.ok(project.summary.length > 25);
    for (const link of project.links) assert.ok(link.summary.length > 20, `A short summary accompanies ${link.label}`);
  }
  const rally = PROJECTS.find(project => project.id === 'rally');
  assert.equal(rally.next, undefined);
  assert.equal(STUDIO.some(project => project.id === 'canterbury' || project.id === 'rally-next'), false);
  for (const id of ['puzzles']) {
    const project = STUDIO.find(project => project.id === id);
    assert.equal(project.status, 'building');
    assert.equal('href' in project, false);
  }
});
