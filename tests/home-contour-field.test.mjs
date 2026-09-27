import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the Contour Field sits on the front door right after the drop deck', async () => {
  const home = await read('src/pages/index.astro');
  assert.match(home, /import HomeContourField from '\.\.\/components\/HomeContourField\.astro'/);
  const deck = home.indexOf('<HomeV2SignalDeck');
  const field = home.indexOf('<HomeContourField />');
  assert.ok(deck > 0 && field > deck, 'after the drop deck');
  assert.ok(field < home.indexOf('<StillHourSitting'), 'before the still hour');
});

test('three.js loads lazily and the module degrades without WebGL or motion', async () => {
  const [component, engine] = await Promise.all([
    read('src/components/HomeContourField.astro'),
    read('src/lib/contour-field.ts'),
  ]);
  assert.match(component, /await import\('\.\.\/lib\/contour-field'\)/, 'engine is a dynamic import');
  assert.doesNotMatch(component, /<script>[\s\S]*import \{[^}]*\} from '\.\.\/lib\/contour-field'/, 'no eager runtime import in the client script');
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(component, /supportsWebGL\(\)/);
  assert.match(component, /cf__plate/, 'printed stand-in plate');
  assert.match(component, /astro:before-swap/);
  assert.match(component, /role="status"/);
  assert.doesNotMatch(component, /innerHTML/);
  assert.match(engine, /from 'three'/);
  assert.match(engine, /dispose\(\)/);
  assert.match(engine, /uCalm/, 'reduced motion holds the field still');
});

test('the day seed matches between build and client', async () => {
  const component = await read('src/components/HomeContourField.astro');
  const bodies = [...component.matchAll(/function fieldNumberFor\(day: string\) \{([\s\S]*?return[^;]*;)/g)].map((m) => m[1].replace(/\s+/g, ' ').trim());
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0], bodies[1]);
});
