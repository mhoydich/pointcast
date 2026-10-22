import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
test('/sister-sites lists every property once with an absolute https url and a one-line description', () => {
  const data = JSON.parse(read('src/data/sister-sites.json'));
  assert.equal(data.schema, 'pointcast.sites/v1');
  assert.ok(data.sites.length >= 5);
  const slugs = new Set(data.sites.map((s) => s.slug)); assert.equal(slugs.size, data.sites.length);
  for (const s of data.sites) { assert.match(s.url, /^https:\/\//); assert.ok(s.line.length > 40 && s.line.length < 200, s.slug); if (s.machine) assert.match(s.machine, /^https:\/\//); }
  assert.ok(data.sites.some((s) => s.url === 'https://pointcast.xyz/'));
});
test('the hub is reachable from the dock, the sitemap, llms.txt and has a CORS JSON twin', () => {
  assert.match(read('src/components/FooterBar.astro'), /href="\/sister-sites"/);
  assert.match(read('src/pages/sitemap-discovery.xml.ts'), /pointcast\.xyz\/sister-sites\//);
  assert.match(read('public/llms.txt'), /https:\/\/pointcast\.xyz\/sister-sites\//);
  assert.match(read('public/_headers'), /\/sister-sites\.json\n\s+Access-Control-Allow-Origin: \*/);
  assert.ok(read('public/llms.txt').split('\n').length < 320, 'llms.txt stays under the index cap');
});
