import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const dist = new URL('../dist/', import.meta.url);
const read = (path) => readFileSync(new URL(path, dist), 'utf8');
const features = [
  ['communicationsLab', 'communications-lab', '/communications-lab/', '/communications-lab/briefs.json'],
  ['mobility2030', 'mobility-2030', '/mobility-2030/', '/mobility-2030.json'],
  ['manufacturingAtlas', 'manufacturing', '/manufacturing/', '/manufacturing.json'],
];
test('three live features agree across built human and machine discovery', {
  skip: !existsSync(new URL('apps.json', dist)),
}, () => {
  const apps = JSON.parse(read('apps.json')).apps;
  const agents = JSON.parse(read('agents.json')).endpoints;
  const html = new JSDOM(read('apps/index.html')).window.document;
  const llms = read('llms.txt');
  const sitemap = new JSDOM(read('sitemap-discovery.xml'), { contentType: 'text/xml' }).window.document;
  const urls = [...sitemap.querySelectorAll('loc')].map((node) => node.textContent);
  for (const [key, slug, human, machine] of features) {
    const canonical = `https://pointcast.xyz${human}`;
    const json = `https://pointcast.xyz${machine}`;
    const matches = apps.filter((app) => app.slug === slug);
    assert.equal(matches.length, 1, `${slug} catalog entry is unique`);
    assert.equal(matches[0].canonicalUrl, canonical);
    assert.equal(matches[0].url, canonical);
    assert.ok(html.querySelector(`a[href="${human}"]`), `${slug} has a human catalog link`);
    for (const [category, expected] of [['human', canonical], ['json', json]]) {
      assert.equal(agents.current[category][key], expected);
      assert.equal(agents[category][key], expected);
      assert.ok(llms.includes(`](${expected})`));
      assert.ok(urls.includes(expected));
    }
    assert.ok(existsSync(new URL(`${human.slice(1)}index.html`, dist)));
    assert.doesNotThrow(() => JSON.parse(read(machine.slice(1))));
  }
});
