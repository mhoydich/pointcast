// The shared El Segundo network check-in card: self-hosted, pointed at the shared
// service, kept off the self-contained /chain/ apps, and discoverable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the check-in card is self-hosted and pointed at the shared service', () => {
  const card = read('src/components/GeostampCard.astro');
  assert.match(card, /src="\/js\/geostamp\.js" data-site="pointcast" data-api="https:\/\/elsegundo\.xyz"/);
  assert.doesNotMatch(card, /<script[^>]+src="https?:/);
  assert.match(card, /startsWith\('\/chain\/'\)/);
  const js = read('public/js/geostamp.js');
  assert.match(js, /data-api/);
  assert.match(js, /if \(window\.__esGeostamp\) return/);
  assert.match(read('src/layouts/BlockLayout.astro'), /\{!isolated && <GeostampCard \/>\}/);
});

test('here.json points to the merged feeds and the format page', () => {
  const here = JSON.parse(read('public/.well-known/here.json'));
  assert.equal(here.here, 'here/0.1');
  assert.equal(here.site, 'pointcast');
  assert.equal(here.format, 'https://pointcast.xyz/check-in/format/');
  assert.ok(Object.values(here.feeds).every(url => url.startsWith('https://elsegundo.xyz/api/v1/stamps')));
  assert.equal(here.license, 'CC0-1.0');
  const page = read('src/pages/check-in/format/index.astro');
  assert.match(page, /CC0/);
  assert.match(page, /noindex=\{true\}/);
});
