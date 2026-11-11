import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { initializeProjectShowcase } from '../src/lib/home-project-showcase.mjs';
import { getPublishedProjects } from '../src/lib/home-published-projects.mjs';

function setup({ reduced = false, left = 0 } = {}) {
  const dom = new JSDOM(`<section data-project-showcase><button data-showcase-previous></button><button data-showcase-next></button><span data-showcase-counter></span><ol data-showcase-rail tabindex="0">${Array.from({ length: 8 }, (_, i) => `<li data-showcase-item><a href="/project-${i}/"><h3>Project ${i + 1}</h3></a></li>`).join('')}</ol><p data-showcase-status></p></section>`);
  const { window } = dom;
  window.matchMedia = () => ({ matches: reduced });
  const root = window.document.querySelector('section');
  const rail = root.querySelector('ol');
  const calls = [];
  let viewportWidth = 620;
  Object.defineProperties(rail, { scrollWidth: { get: () => 2560 }, clientWidth: { get: () => viewportWidth } });
  rail.scrollLeft = left;
  rail.getBoundingClientRect = () => ({ left: 0, right: viewportWidth });
  [...rail.children].forEach((item, index) => {
    item.getBoundingClientRect = () => ({ left: 4 + index * 320 - rail.scrollLeft, right: 304 + index * 320 - rail.scrollLeft });
  });
  rail.scrollTo = args => { calls.push(args); rail.scrollLeft = args.left; rail.dispatchEvent(new window.Event('scroll')); };
  const controller = initializeProjectShowcase(root);
  const key = (value, target = rail) => {
    const event = new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  return { window, root, rail, calls, controller, key, resize(width) { viewportWidth = width; window.dispatchEvent(new window.Event('resize')); }, previous: root.querySelector('[data-showcase-previous]'), next: root.querySelector('[data-showcase-next]') };
}

test('controls stay bounded and do not wrap at either end, including between snap points', () => {
  const { root, rail, calls, previous, next, key } = setup();
  assert.equal(previous.getAttribute('aria-disabled'), 'true');
  previous.click();
  assert.equal(calls.length, 0);
  next.click();
  assert.equal(rail.scrollLeft, 320);
  rail.scrollLeft = 450;
  previous.click();
  assert.equal(rail.scrollLeft, 320);
  key('End');
  assert.equal(rail.scrollLeft, 1940);
  assert.equal(next.getAttribute('aria-disabled'), 'true');
  const count = calls.length;
  next.click();
  assert.equal(calls.length, count);
  assert.match(root.querySelector('[data-showcase-status]').textContent, /Project 8, 8 of 8/);
  previous.click();
  assert.equal(rail.scrollLeft, 1920);
  key('Home');
  assert.equal(rail.scrollLeft, 0);
});

test('rail keys navigate; links, Tab and vertical scrolling keep their native behavior', () => {
  const { key, rail } = setup();
  assert.equal(key('ArrowRight'), true);
  assert.equal(rail.scrollLeft, 320);
  for (const value of ['Tab', 'ArrowDown', 'ArrowUp', 'PageDown', ' ']) assert.equal(key(value), false);
  assert.equal(key('ArrowRight', rail.querySelector('a')), false);
});

test('reduced motion uses immediate movement and offscreen keyboard focus is revealed within the rail', () => {
  const { rail, next, calls } = setup({ reduced: true });
  next.click();
  assert.equal(calls.at(-1).behavior, 'instant');
  rail.querySelectorAll('a')[7].focus();
  assert.ok(rail.lastElementChild.getBoundingClientRect().right <= rail.clientWidth - 3);
  assert.equal(calls.at(-1).behavior, 'instant');
});

test('restored scroll state and resizing update boundaries; mounting is idempotent and cleans up', () => {
  const { window, root, rail, next, previous, calls, controller, resize } = setup({ left: 1940 });
  assert.equal(next.getAttribute('aria-disabled'), 'true');
  assert.equal(previous.getAttribute('aria-disabled'), 'false');
  assert.equal(initializeProjectShowcase(root), null);
  resize(300);
  assert.equal(next.getAttribute('aria-disabled'), 'false');
  controller.destroy();
  const count = calls.length;
  next.click();
  assert.equal(calls.length, count);
  assert.equal(root.hasAttribute('data-showcase-ready'), false);
  assert.ok(initializeProjectShowcase(root));
  rail.scrollLeft = 0;
  window.dispatchEvent(new window.Event('resize'));
  assert.equal(previous.getAttribute('aria-disabled'), 'true');
});

test('curated visuals resolve to existing verified catalog routes and original local assets', () => {
  const component = readFileSync(new URL('../src/components/HomeProjectShowcase.astro', import.meta.url), 'utf8');
  const catalog = JSON.parse(readFileSync(new URL('../src/data/home-latest-projects.json', import.meta.url), 'utf8'));
  const published = new Map(getPublishedProjects(catalog).map(project => [project.id, project]));
  const ids = [...component.matchAll(/\{ id: '([^']+)'/g)].map(match => match[1]);
  assert.equal(ids.length, 8);
  for (const id of ids) assert.ok(published.has(id), `${id} needs publication evidence`);
  for (const [, path] of component.matchAll(/from '\.\.\/\.\.\/(public\/[^']+)'/g)) assert.ok(existsSync(new URL('../' + path, import.meta.url)), path);
  assert.ok(new Set(ids.map(id => published.get(id).group)).size >= 4);
  assert.doesNotMatch(component, /href="\/chain/);
});
