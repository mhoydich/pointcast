import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { PROJECTS, STUDIO, ROADMAP, portfolioPayload } from '../src/data/hoydich-portfolio.mjs';
import { initPortfolio } from '../src/scripts/hoydich-portfolio.mjs';

const rootPath = new URL('../', import.meta.url);
function fixture() {
  const dom = new JSDOM(`<main data-hoydich-portfolio>
    <div data-portfolio-filters hidden><select data-family-filter><option value="all">All</option>${['design','reading','art','play','place','tools'].map(id => `<option value="${id}">${id}</option>`).join('')}</select>
    ${['all','open','building','redesign'].map(id => `<button data-status-filter="${id}" aria-pressed="${id === 'all'}">${id}</button>`).join('')}<button data-reset-filters>Reset</button></div>
    <p data-filter-result role="status"></p>
    ${PROJECTS.map(project => `<article data-project-card data-family="${project.family}" data-next-status="${project.next?.status ?? ''}"><a href="${project.href}">${project.title}</a>${project.next ? `<a data-show-studio href="#studio-${project.id}-next">Next</a>` : ''}</article>`).join('')}
    <p data-project-empty hidden></p>
    ${STUDIO.map(project => `<article id="studio-${project.id}" data-studio-card data-family="${project.family}" data-status="${project.status}">${project.title}</article>`).join('')}
    <p data-studio-empty hidden></p></main>`);
  const root = dom.window.document.querySelector('main');
  initPortfolio(root);
  return { root, dom, visible: selector => [...root.querySelectorAll(selector)].filter(card => !card.hidden), click: status => root.querySelector(`[data-status-filter="${status}"]`).click(), family: value => { const select = root.querySelector('select'); select.value = value; select.dispatchEvent(new dom.window.Event('change')); } };
}

test('status filters retain the published baseline for a redesign and hide unrelated projects', () => {
  const f = fixture();
  f.click('redesign');
  assert.equal(f.visible('[data-project-card]').length, 2);
  assert.equal(f.visible('[data-studio-card]').length, 2);
  assert.deepEqual(f.visible('[data-project-card]').map(card => card.querySelector('a').getAttribute('href')), ['/fila/', '/pickleball/home/']);
  assert.equal(f.root.querySelector('[data-status-filter="redesign"]').getAttribute('aria-pressed'), 'true');
  assert.equal(f.root.querySelector('[data-status-filter="all"]').getAttribute('aria-pressed'), 'false');
  assert.match(f.root.querySelector('[data-filter-result]').textContent, /2 open projects and 2 studio threads/);
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
  assert.equal(f.visible('[data-studio-card]').length, 2);
  f.root.querySelector('[data-reset-filters]').click();
  assert.equal(f.root.querySelector('select').value, 'all');
  assert.equal(f.visible('[data-project-card]').length, PROJECTS.length);
  assert.equal(f.visible('[data-studio-card]').length, STUDIO.length);
  assert.equal(f.root.querySelector('[data-project-empty]').hidden, true);
  assert.equal(f.root.querySelector('[data-studio-empty]').hidden, true);
});

test('building reading view keeps the open shelf and shows its expansion plus Canterbury', () => {
  const f = fixture();
  f.family('reading');
  f.click('building');
  assert.equal(f.visible('[data-project-card]').length, 1);
  assert.equal(f.visible('[data-studio-card]').length, 2);
  assert.match(f.root.querySelector('[data-filter-result]').textContent, /1 open project and 2 studio threads/);
  f.click('open');
  assert.equal(f.visible('[data-project-card]').length, 2);
  assert.equal(f.visible('[data-studio-card]').length, 0);
});

test('public snapshot has source artwork and only known destinations; unpublished builds have no route', () => {
  const payload = portfolioPayload();
  assert.ok(Number.isFinite(Date.parse(payload.capturedAt)));
  assert.equal(payload.comparisons.length, 0);
  assert.equal(ROADMAP.reduce((count, group) => count + group.lanes.length, 0), 11);
  for (const project of PROJECTS) {
    assert.ok(existsSync(new URL(`public${project.image}`, rootPath)), `artwork exists: ${project.image}`);
    const route = project.href.replace(/^\//, '').replace(/\/$/, '');
    assert.ok(existsSync(new URL(`src/pages/${route}.astro`, rootPath)) || existsSync(new URL(`src/pages/${route}/index.astro`, rootPath)), `route exists: ${project.href}`);
    assert.ok(project.boundary.length > 30);
  }
  for (const project of STUDIO) {
    assert.ok(['building', 'redesign'].includes(project.status));
    assert.equal('href' in project, false);
    assert.equal('route' in project, false);
    if (project.currentHref) assert.ok(PROJECTS.some(current => current.href === project.currentHref));
  }
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /linear\.app|completionPercent|percentComplete|liveSync|approval|wallet|security|private finances/i);
  const page = readFileSync(new URL('src/pages/hoydich.astro', rootPath), 'utf8');
  assert.doesNotMatch(page, /href=["']\/(canterbury|fortune|discovery-audit|fila\/el-segundo|pickleball\/home\/v2)/);
});

test('setup is idempotent and keeps controls hidden until the working initializer runs', () => {
  const f = fixture();
  initPortfolio(f.root);
  assert.equal(f.root.querySelector('[data-portfolio-filters]').hidden, false);
  f.click('redesign');
  assert.equal(f.visible('[data-project-card]').length, 2);
});


test('visiting a next-edition link from Open now reveals its studio destination before fragment navigation', () => {
  const f = fixture();
  f.click('open');
  const target = f.root.querySelector('#studio-fila-next');
  assert.equal(target.hidden, true);
  f.root.querySelector('[href="#studio-fila-next"]').click();
  assert.equal(target.hidden, false);
  assert.equal(f.root.querySelector('[data-status-filter="all"]').getAttribute('aria-pressed'), 'true');
});
