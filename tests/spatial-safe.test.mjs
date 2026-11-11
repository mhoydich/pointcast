// The spatial kit's pure helpers (public/spatial/safe.mjs): which manifest URLs may become links.
// node --test site/spatial/test/safe.test.mjs   (no browser, no three.js, no import map)
import test from 'node:test';
import assert from 'node:assert/strict';
import { safeUrl, validateManifest, layoutPlaces } from '../public/spatial/safe.mjs';

const BASE = 'https://pointcast.xyz/vr/';

test('http and https pass and come back absolute', () => {
  assert.equal(safeUrl('https://pointcast.xyz/drum', BASE), 'https://pointcast.xyz/drum');
  assert.equal(safeUrl('http://example.org/a?b=1#c', BASE), 'http://example.org/a?b=1#c');
  assert.equal(safeUrl('HTTPS://Example.org/', BASE), 'https://example.org/');
});

test('same-site relative paths pass', () => {
  assert.equal(safeUrl('/drum', BASE), 'https://pointcast.xyz/drum');
  assert.equal(safeUrl('../ring/', BASE), 'https://pointcast.xyz/ring/');
  assert.equal(safeUrl('places.json', BASE), 'https://pointcast.xyz/vr/places.json');
  assert.equal(safeUrl('/pickleball/the-squeeze/', BASE), 'https://pointcast.xyz/pickleball/the-squeeze/');
});

test('script and non-web schemes are rejected', () => {
  for (const u of [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'blob:https://pointcast.xyz/0b5c5f1e-0000-0000-0000-000000000000',
    'file:///etc/passwd',
    'mailto:a@example.org',
  ]) assert.equal(safeUrl(u, BASE), null, u);
});

test('leading whitespace and control characters before javascript: are rejected', () => {
  for (const u of [' javascript:alert(1)', '\n\tjavascript:alert(1)', '\u0001\u0000javascript:alert(1)',
    '\u0000 \u001f javascript:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)']) {
    assert.equal(safeUrl(u, BASE), null, JSON.stringify(u));
  }
});

test('mixed case schemes are rejected', () => {
  assert.equal(safeUrl('JaVaScRiPt:alert(1)', BASE), null);
  assert.equal(safeUrl('DATA:text/html,x', BASE), null);
  assert.equal(safeUrl('  JaVaScRiPt:window.__pwned=1', BASE), null);
});

test('protocol-relative //host/ resolves to https on that host: accepted by default, rejected with sameOrigin', () => {
  // Documented behaviour: links to other sites are allowed (the list marks them rel="noopener").
  assert.equal(safeUrl('//evil.example/x', BASE), 'https://evil.example/x');
  assert.equal(safeUrl('//evil.example/x', BASE, { sameOrigin: true }), null);
  assert.equal(safeUrl('/drum', BASE, { sameOrigin: true }), 'https://pointcast.xyz/drum');
  assert.equal(safeUrl('https://elsegundo.xyz/', BASE, { sameOrigin: true }), null);
});

test('empty, non-string and unparsable input is rejected', () => {
  for (const u of ['', '   ', null, undefined, 42, {}, 'http://[::1', 'https://']) assert.equal(safeUrl(u, BASE), null, String(u));
  assert.equal(safeUrl('/drum'), null, 'relative with no base (Node has no location)');
});

test('validateManifest: errors and warnings', () => {
  assert.equal(validateManifest(null).ok, false);
  assert.equal(validateManifest({}).ok, false);
  const v = validateManifest({ places: [{ id: 'a', title: 'A', url: '/a' }, { id: 'a', title: 'B', url: 'javascript:x' }, { title: 'C' }],
    portals: [{ title: 'P', url: 'data:x' }] }, BASE);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => e.includes('duplicate id a')));
  assert.ok(v.errors.some((e) => e.includes('places[2] has no id')));
  assert.equal(v.warnings.length, 2);
  assert.equal(validateManifest({ places: [{ id: 'a', title: 'A', url: '/a' }] }, BASE).ok, true);
});

test('layoutPlaces: grid cells to metres, positions kept, no slot means no scene object', () => {
  const m = { layout: { type: 'grid', cols: 4, rows: 3, spacing: { x: 7, z: 6.5 } }, places: [
    { id: 'a', cell: { col: 0, row: 0 } }, { id: 'b', cell: { col: 3, row: 2 } }, { id: 'c', position: { x: 14.2, z: -1.8 } },
    { id: 'd', cell: { col: 9, row: 9 } }] };
  const s = layoutPlaces(m);
  assert.deepEqual([s.get('a').x, s.get('a').z], [-10.5, -6.5]);
  assert.deepEqual([s.get('b').x, s.get('b').z], [10.5, 6.5]);
  assert.deepEqual([s.get('c').x, s.get('c').z], [14.2, -1.8]);
  assert.equal(s.has('d'), false);
  const r = layoutPlaces({ layout: { type: 'ring', radius: 10 }, places: [{ id: 'n' }, { id: 'e' }] });
  assert.ok(Math.abs(r.get('n').x) < 1e-9 && Math.abs(r.get('n').z + 10) < 1e-9);
});
