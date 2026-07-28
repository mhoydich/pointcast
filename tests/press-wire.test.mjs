import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const releases = JSON.parse(await readFile(new URL('src/data/press-releases.json', root), 'utf8'));

test('press wire seeds seventeen product filings across every public kind', () => {
  assert.equal(releases.length, 17);
  assert.equal(new Set(releases.map((release) => release.id)).size, releases.length);
  assert.equal(new Set(releases.map((release) => release.slug)).size, releases.length);
  assert.deepEqual(
    new Set(releases.map((release) => release.kind)),
    new Set(['product', 'data', 'archive', 'game', 'engineering']),
  );

  const excludedAdRoutes = new Set([
    'https://pointcast.xyz/bell-and-signal',
    'https://pointcast.xyz/last-tag',
    'https://allworthy.xyz/nine-lives',
  ]);
  releases.forEach((release) => assert.equal(excludedAdRoutes.has(release.productUrl), false));
});

test('The Battle Record filing promotes the annual without inventing official or wagered results', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0015');
  assert.ok(release);
  assert.equal(release.slug, 'noun-battler-annual-publishes-browser-league-history');
  assert.match(release.body.join(' '), /Strike, Guard, and Focus/);
  assert.match(release.body.join(' '), /eight gangs, fourteen league days/);
  assert.match(release.body.join(' '), /not written into the browser-local league table/i);
  assert.match(release.body.join(' '), /no odds, wagering, or betting product/i);
  assert.match(release.body.join(' '), /first-party house campaign selected by page context/i);
  assert.equal(release.productUrl, 'https://pointcast.xyz/noun-battler-annual');
  assert.equal(release.actionUrl, 'https://pointcast.xyz/noun-battler-annual#lab');
  assert.ok(release.proofs.some((proof) => proof.url === 'https://pointcast.xyz/noun-battler-annual/share'));
  assert.ok(release.proofs.some((proof) => proof.url === 'https://pointcast.xyz/ads.json'));
});

test('Beach Commons V5 filing announces the study without implying a live institution or event', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0014');
  assert.ok(release);
  assert.equal(release.slug, 'beach-commons-v5-opens-weather-school-and-tide-parliament');
  assert.match(release.body.join(' '), /eight-plate speculative field study/i);
  assert.match(release.body.join(' '), /not an operating school, government, regulator, forecast service, scientific authority/i);
  assert.match(release.body.join(' '), /conceptual and unpermitted/i);
  assert.match(release.body.join(' '), /three-creative contextual house campaign/i);
  assert.equal(release.productUrl, 'https://pointcast.xyz/beach-commons/v5');
  assert.ok(release.proofs.some((proof) => proof.url === 'https://pointcast.xyz/ads.json'));
});

test('Mesh Commons filing publishes a low-cost plan without claiming active coverage', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0012');
  assert.ok(release);
  assert.equal(release.slug, 'network-el-segundo-publishes-mesh-commons-two-year-plan');
  assert.match(release.body.join(' '), /\$295–\$395/);
  assert.match(release.body.join(' '), /three consented rooftops/i);
  assert.match(release.body.join(' '), /hello\.mesh/);
  assert.match(release.body.join(' '), /25-mile radius is a planning horizon/i);
  assert.match(release.body.join(' '), /not an active physical mesh/i);
  assert.equal(release.productUrl, 'https://pointcast.xyz/network-el-segundo/mesh-commons');
  assert.equal(release.actionUrl, 'https://network-el-segundo.mhoydich.chatgpt.site/mesh-commons');
});

test('LOCAL STAR COMMONS filing publishes the product family and keeps governance off-chain', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0013');
  assert.ok(release);
  assert.equal(release.slug, 'local-star-commons-opens-contribution-governed-quality-of-life-movement');
  assert.match(release.body.join(' '), /LOCAL STAR, AIR, WATER, LIGHT, CARE, and POWER/i);
  assert.match(release.body.join(' '), /25-mile El Segundo pilot ring/i);
  assert.match(release.body.join(' '), /not a legal entity/i);
  assert.match(release.body.join(' '), /no token, treasury, fundraising/i);
  assert.match(release.body.join(' '), /visitor's device/i);
  assert.equal(release.productUrl, 'https://pointcast.xyz/local-star-commons');
  assert.equal(release.actionUrl, 'https://local-objects-tezos.mhoydich.chatgpt.site/commons');
});

test('Local Signal Field Kit filing publishes the signed product set and concept boundary', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0011');
  assert.ok(release);
  assert.equal(release.slug, 'network-el-segundo-opens-local-signal-field-kit');
  assert.match(release.body.join(' '), /Porch Beam, Window Flag, Corner Chime, Microburst/);
  assert.match(release.body.join(' '), /no flame, smoke, explosive material, projectile, or debris/i);
  assert.match(release.body.join(' '), /signed MH/i);
  assert.match(release.body.join(' '), /not certified hardware, emergency infrastructure, a municipal program, or an active physical mesh/i);
  assert.equal(release.productUrl, 'https://pointcast.xyz/network-el-segundo/field-kit');
  assert.equal(release.actionUrl, 'https://network-el-segundo.mhoydich.chatgpt.site/field-kit');
});

test('The First 100 Signal filing publishes the living artwork without exposing wallets or activating settlement', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0010');
  assert.ok(release);
  assert.equal(release.slug, 'network-el-segundo-turns-first-100-wallets-into-living-signal');
  assert.match(release.body.join(' '), /one hundred light positions/i);
  assert.match(release.body.join(' '), /does not display an address/i);
  assert.match(release.body.join(' '), /PointCast now carries the Signal/i);
  assert.match(release.body.join(' '), /remain inactive prototypes/i);
  assert.equal(release.productUrl, 'https://pointcast.xyz/network-el-segundo');
  assert.match(release.actionUrl, /\/auth\/project\?target=network-el-segundo/);
  assert.match(release.actionUrl, /source=press/);
  assert.equal(release.actionLabel, 'Claim the next light — free');
});

test('The Holders Cut filing keeps the public preview separate from a live Mainnet offer', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0009');
  assert.ok(release);
  assert.equal(release.slug, 'the-holders-cut-opens-44-plate-unlimited-edition-preview');
  assert.match(release.body.join(' '), /unlimited and priced at 10 tez/i);
  assert.match(release.body.join(' '), /50 percent of defined net primary proceeds/i);
  assert.match(release.body.join(' '), /does not originate a Tezos contract/i);
  assert.match(release.body.join(' '), /Rally carries the same contextual creative in its footer/i);
  assert.equal(release.productUrl, 'https://the-holders-cut.mhoydich.chatgpt.site/');
});

test('Network El Segundo filing separates the live roster from prototype sale and payout rules', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0008');
  assert.ok(release);
  assert.equal(release.slug, 'network-el-segundo-opens-first-100-tezos-wallet-roster');
  assert.match(release.body.join(' '), /free message signature/i);
  assert.match(release.body.join(' '), /50 percent of proceeds/i);
  assert.match(release.body.join(' '), /does not deploy a sale contract, payout contract, token, or automated yield system/i);
  assert.match(release.body.join(' '), /does not promise profit or a return/i);
  assert.equal(release.productUrl, 'https://pointcast.xyz/network-el-segundo');
  assert.match(release.actionUrl, /\/auth\/project\?target=network-el-segundo/);
  assert.match(release.actionUrl, /source=press/);
});

test('Art Kitty filing discloses the equal split, earmarked ledger, and approval boundary', () => {
  const release = releases.find((item) => item.id === 'PCPW-2026-0007');
  assert.ok(release);
  assert.equal(release.slug, 'home-art-kitty-opens-31-one-tez-collector-editions');
  assert.match(release.headline, /31 one-tez collector editions/i);
  assert.match(release.body.join(' '), /0\.5 tez to the artist/i);
  assert.match(release.body.join(' '), /0\.5 tez earmarked for the Art Kitty/i);
  assert.match(release.body.join(' '), /same PointCast treasury address/i);
  assert.match(release.body.join(' '), /does not sign or submit a Tezos transaction/i);
  assert.equal(release.productUrl, 'https://art-kitty-editions.mhoydich.chatgpt.site/series/02');
});

test('every filing has disclosure, primary evidence, and complete body copy', () => {
  for (const release of releases) {
    assert.match(release.id, /^PCPW-2026-\d{4}$/);
    assert.equal(release.status, 'published');
    assert.match(release.disclosure, /owned announcement/i);
    assert.match(release.disclosure, /not independent reporting/i);
    assert.ok(Date.parse(release.publishedAt));
    assert.ok(release.headline.length >= 30);
    assert.ok(release.summary.length >= 80);
    assert.ok(Array.isArray(release.body) && release.body.length >= 3);
    assert.ok(Array.isArray(release.proofs) && release.proofs.length >= 2);
    assert.ok(release.proofs.every((proof) => proof.url.startsWith('https://')));
  }
});

test('filings are stored newest first', () => {
  const timestamps = releases.map((release) => Date.parse(release.publishedAt));
  assert.deepEqual(timestamps, timestamps.slice().sort((a, b) => b - a));
});

test('home and discovery surfaces expose the press wire', async () => {
  const [home, agents, sitemap, llms] = await Promise.all([
    readFile(new URL('src/pages/index.astro', root), 'utf8'),
    readFile(new URL('src/pages/agents.json.ts', root), 'utf8'),
    readFile(new URL('src/pages/sitemap-discovery.xml.ts', root), 'utf8'),
    readFile(new URL('public/llms.txt', root), 'utf8'),
  ]);

  assert.match(home, /href="\/press"/);
  assert.match(home, /Editorial and machine-readable endpoints/);
  assert.match(agents, /press: 'https:\/\/pointcast\.xyz\/press'/);
  assert.match(agents, /press: 'https:\/\/pointcast\.xyz\/press\.json'/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/press\.xml/);
  assert.match(llms, /PointCast Press Wire/);
  assert.match(llms, /HOME \/ Art Kitty/);
  assert.match(llms, /Network El Segundo/);
  assert.match(llms, /LOCAL STAR COMMONS/);
});

test('press CTAs can enter a measured action path without changing the canonical product URL', async () => {
  const [types, page] = await Promise.all([
    readFile(new URL('src/lib/press-wire.ts', root), 'utf8'),
    readFile(new URL('src/pages/press/[slug].astro', root), 'utf8'),
  ]);
  assert.match(types, /actionUrl\?: string/);
  assert.match(types, /actionLabel\?: string/);
  assert.match(page, /release\.actionUrl \|\| release\.productUrl/);
  assert.match(page, /release\.actionLabel \|\| release\.productLabel/);
  assert.match(page, /about: \{ '@type': 'SoftwareApplication', name: release\.product, url: release\.productUrl \}/);
});
