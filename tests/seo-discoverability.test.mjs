import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { STANDARDS_COPY } from '../src/lib/standards-seo.mjs';
import { cardSeo, isFutureAlmanacCard, almanacCardPath } from '../src/lib/almanac-seo.mjs';
import { isNoindexPath } from '../src/lib/seo-rules.mjs';
import { ogAssetExists } from '../src/lib/seo-paths.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const SITEMAP_HTML = [
  '/grok/',
  '/sky-calls',
  '/prices',
  '/weather/world/',
  '/case-studies/a-bots-visit/',
  '/front-desk/agents/',
  '/almanac/2026-10-05',
];

function addDays(iso, days) {
  return new Date(Date.parse(`${iso}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

test('dynamic OG functions count as real images', () => {
  const roots = {
    distDir: fileURLToPath(new URL('dist/', root)),
    publicDir: fileURLToPath(new URL('public/', root)),
    functionsDir: fileURLToPath(new URL('functions/', root)),
  };
  assert.equal(ogAssetExists('https://pointcast.xyz/og/almanac/2026-10-05.png', roots), true);
  assert.equal(ogAssetExists('https://pointcast.xyz/og/page.png', roots), true);
});

test('future almanac cards are noindex and today is not', () => {
  const today = '2026-10-05';
  const now = new Date(`${today}T20:00:00.000Z`);
  assert.equal(isFutureAlmanacCard('/almanac/2026-10-05', now), false);
  assert.equal(isFutureAlmanacCard('/almanac/2026-10-06/', now), true);
  assert.equal(isNoindexPath('/almanac/2026-10-06'), true);
  assert.equal(isFutureAlmanacCard('/almanac/el-segundo', now), false);
  assert.equal(almanacCardPath(now), '/almanac/2026-10-05');
  assert.equal(cardSeo(today, now).upcoming, false);
  assert.equal(cardSeo('2026-10-06', now).upcoming, true);
});

test('every almanac card title and description fits the SEO window', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (let iso = '2026-10-05'; iso <= '2026-12-31'; iso = addDays(iso, 1)) {
    const seo = cardSeo(iso, new Date('2026-10-05T20:00:00.000Z'));
    const full = `${seo.title} — PointCast`;
    assert.ok(full.length < 60, `${iso} title ${full.length}: ${full}`);
    assert.ok(seo.description.length >= 120 && seo.description.length <= 160, `${iso} description ${seo.description.length}`);
    assert.ok(!titles.has(full), `duplicate title ${full}`);
    assert.ok(!descriptions.has(seo.description), `duplicate description ${seo.description}`);
    titles.add(full);
    descriptions.add(seo.description);
  }
});

test('standards copy is unique, titled, and described', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const [key, copy] of Object.entries(STANDARDS_COPY)) {
    const full = `${copy.title} — PointCast`;
    assert.ok(full.length < 60, `${key} title ${full.length}`);
    assert.ok(copy.description.length >= 120 && copy.description.length <= 160, `${key} description ${copy.description.length}: ${copy.description}`);
    assert.ok(!titles.has(full) && !descriptions.has(copy.description));
    titles.add(full);
    descriptions.add(copy.description);
  }
});

test('sitemap-0 owns the live HTML routes and discovery keeps the JSON twins', async () => {
  const [discovery, config] = await Promise.all([
    read('src/pages/sitemap-discovery.xml.ts'),
    read('astro.config.mjs'),
  ]);
  for (const path of SITEMAP_HTML) {
    assert.equal(discovery.includes(`'https://pointcast.xyz${path}'`), false, `${path} still listed in sitemap-discovery`);
  }
  assert.match(discovery, /sky-calls\.json/);
  assert.match(discovery, /prices\.json/);
  assert.match(discovery, /front-desk\/agents\.json/);
  assert.match(config, /serialize\(item\)/);
  assert.match(config, /\/front-desk\/agents/);
  assert.match(config, /isNoindexPath/);
});

test('llms, agents manifest, feeds, and the front door name the new surfaces', async () => {
  const [llms, full, agents, feedXml, feedJson, home, desk, passport] = await Promise.all([
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/agents.json.ts'),
    read('src/pages/feed.xml.ts'),
    read('src/pages/feed.json.ts'),
    read('src/pages/index.astro'),
    read('src/components/HomeFrontDoorDesk.astro'),
    read('src/pages/standards/agent-identity/index.astro'),
  ]);
  for (const path of ['/standards/', '/standards/agent-identity/', '/standards/check/', '/standards/registry/', '/standards/machine-offers/', '/front-desk/agents/', '/almanac/2026-10-05']) {
    assert.match(llms, new RegExp(path.replaceAll('/', '\\/')));
  }
  assert.match(full, /## PointCast Standards/);
  assert.match(full, /standards\/agent-identity\/schema\.json/);
  assert.match(agents, /standards: \{/);
  assert.match(agents, /standardsPassportSchema/);
  assert.match(agents, /registryJson/);
  assert.match(feedXml, /STANDARDS_FEED/);
  assert.match(feedJson, /STANDARDS_FEED/);
  assert.match(home, /\/front-desk\/agents\//);
  assert.match(home, /almanacCardPath\(\)/);
  assert.match(desk, /\/front-desk\/agents\//);
  assert.match(desk, /almanacCardPath\(\)/);
  assert.match(passport, /https:\/\/x\.com\/nikitabier\/status\/2107157904168239416/);
  assert.match(passport, /ScholarlyArticle/);
});
