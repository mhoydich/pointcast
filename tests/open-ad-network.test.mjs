import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('all public layout families render the shared open-ad rail', async () => {
  const layouts = await Promise.all([
    'BaseLayout.astro',
    'BlockLayout.astro',
    'DrumLayout.astro',
    'SparrowLayout.astro',
  ].map((name) => readFile(new URL(`src/layouts/${name}`, root), 'utf8')));

  for (const layout of layouts) {
    assert.match(layout, /import OpenAdRail/);
    assert.match(layout, /<OpenAdRail\s*\/>/);
  }
});

test('all public layout families carry the live first-100 Tezos signal above the fold', async () => {
  const [layouts, strip] = await Promise.all([
    Promise.all([
      'BaseLayout.astro',
      'BlockLayout.astro',
      'DrumLayout.astro',
      'SparrowLayout.astro',
    ].map((name) => readFile(new URL(`src/layouts/${name}`, root), 'utf8'))),
    readFile(new URL('src/components/NetworkFirst100Strip.astro', root), 'utf8'),
  ]);

  for (const layout of layouts) {
    assert.match(layout, /import NetworkFirst100Strip/);
    assert.match(layout, /<NetworkFirst100Strip\s*\/>/);
  }

  assert.match(strip, /data-network-first100/);
  assert.match(strip, /PC-NETWORK-EL-SEGUNDO-SIGNAL/);
  assert.match(strip, /data-first100-metric/);
  assert.match(strip, /intersectionRatio >= 0\.5/);
  assert.match(strip, /pc:first100-impression/);
  assert.match(strip, /navigator\.doNotTrack/);
  assert.match(strip, /\/api\/network-el-segundo\/participants/);
  assert.match(strip, /pc:wallet-active/);
  assert.match(strip, /pc:wallet-change/);
  assert.match(strip, /TURN ON LIGHT/);
  assert.match(strip, /Light \$\{nextSeat\} is open/);
  assert.match(strip, /one free signature · zero tez/);
  assert.match(strip, /pathname\.startsWith\('\/admin'\)/);
  assert.match(strip, /pathname\.startsWith\('\/network-el-segundo'\)/);
});

test('ad inventory is contextual, transparent, and does not claim live settlement', async () => {
  const [registry, component, receipt, report, endpoint] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/components/OpenAdRail.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
    readFile(new URL('src/pages/ads/report.astro', root), 'utf8'),
    readFile(new URL('functions/api/ad-metrics.ts', root), 'utf8'),
  ]);

  assert.equal((registry.match(/id: 'PC-HOUSE-/g) || []).length, 9);
  assert.equal((registry.match(/id: 'PC-INDUSTRY-NEXT-001'/g) || []).length, 1);
  assert.equal((registry.match(/id: 'PC-DRUM-\d{3}'/g) || []).length, 6);
  assert.equal((registry.match(/id: 'PC-DRUM-UNIVERSE-001'/g) || []).length, 1);
  assert.equal((registry.match(/id: 'PC-NOUNS-ABOUT-\d{3}'/g) || []).length, 3);
  assert.equal((registry.match(/id: 'PC-PERMISSION-LAB-\d{3}'/g) || []).length, 3);
  assert.equal((registry.match(/id: 'PC-ART-KITTY-\d{3}'/g) || []).length, 3);
  assert.equal((registry.match(/id: 'PC-NETWORK-EL-SEGUNDO-\d{3}'/g) || []).length, 3);
  assert.equal((registry.match(/id: 'PC-HOLDERS-CUT-001'/g) || []).length, 1);
  assert.equal((registry.match(/sourceTool: 'Reve'/g) || []).length, 3);
  assert.equal((registry.match(/image: reve[A-Z][A-Za-z]+\.src/g) || []).length, 3);
  assert.match(registry, /tracking: 'aggregate impressions \+ clicks'/);
  assert.match(registry, /settlement: 'prototype'/);
  assert.match(component, /NO VISITOR PROFILE/);
  assert.match(component, /SETTLEMENT IS NOT LIVE YET/);
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /intersectionRatio >= 0\.5/);
  assert.match(component, /sessionStorage/);
  assert.match(receipt, /OPEN_AD_PLACEMENT/);
  assert.match(receipt, /DRUM_COMPENDIUM_CAMPAIGN/);
  assert.match(receipt, /DRUM_NOUN_UNIVERSE_CAMPAIGN/);
  assert.match(receipt, /NETWORK_EL_SEGUNDO_CAMPAIGN/);
  assert.match(receipt, /NETWORK_FIRST_100_SIGNAL/);
  assert.match(receipt, /ownedSignals/);
  assert.match(receipt, /NOUNS_ABOUT_CAMPAIGN/);
  assert.match(receipt, /PERMISSION_LAB_CAMPAIGN/);
  assert.match(receipt, /HOLDERS_CUT_CAMPAIGN/);
  assert.match(receipt, /OPEN_AD_NETWORK/);
  assert.match(receipt, /OPEN_AD_PUBLISHERS/);
  assert.match(receipt, /aggregateEventTelemetry: true/);
  assert.match(receipt, /visitorIdentifiers: false/);
  assert.match(report, /LIVE PUBLISHING REPORT/);
  assert.match(report, /These are browser events, not unique people/);
  assert.match(endpoint, /No IP, user agent, cookie, wallet, or visitor identifier/);
  assert.match(endpoint, /expirationTtl: RETENTION_DAYS/);
  assert.match(endpoint, /TRUSTED_PUBLISHER_ORIGINS/);
  assert.match(endpoint, /publisher is the public property mounting the unit/i);
});

test('portable network unit is reciprocal, contextual, and privacy bounded', async () => {
  const [registry, receipt, widget, report] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
    readFile(new URL('public/open-ad-network.js', root), 'utf8'),
    readFile(new URL('src/pages/ads/report.astro', root), 'utf8'),
  ]);

  for (const publisher of ['pointcast', 'industrynext', 'allworthy', 'passportz', 'common-hours']) {
    assert.match(registry, new RegExp(`id: '${publisher}'`));
  }
  assert.match(registry, /PC-OPEN-NETWORK-2026/);
  assert.match(registry, /No cookies, fingerprinting, wallet data, cross-site visitor identifiers, or behavioral profiles/);
  assert.match(receipt, /open-ad-network\.js/);
  assert.match(receipt, /data-pointcast-network/);
  assert.match(widget, /data-pointcast-network/);
  assert.match(widget, /credentials: 'omit'/);
  assert.match(widget, /navigator\.doNotTrack/);
  assert.match(widget, /IntersectionObserver/);
  assert.match(widget, /intersectionRatio >= 0\.5/);
  assert.match(widget, /advertiserAliases/);
  assert.match(widget, /utm_medium', 'open-ad-network'/);
  assert.match(report, /RECIPROCAL PUBLISHERS/);
  assert.match(report, /data-publisher-id/);
});

test('Industry Next has a direct PointCast house ad in addition to its project series', async () => {
  const [registry, desk, receipt] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/pages/ads.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
  ]);

  assert.match(registry, /PC-INDUSTRY-NEXT-2026/);
  assert.match(registry, /PC-INDUSTRY-NEXT-001/);
  assert.match(registry, /Culture is a building material\./);
  assert.match(registry, /href: 'https:\/\/www\.industrynext\.xyz\/'/);
  assert.match(desk, /DIRECT HOUSE AD · \{INDUSTRY_NEXT_CAMPAIGN\.id\}/);
  assert.match(receipt, /INDUSTRY_NEXT_CAMPAIGN/);
});

test('portable network transparently pins the first-100 campaign across owned publishers', async () => {
  const [registry, receipt, widget, route, endpoint] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
    readFile(new URL('public/open-ad-network.js', root), 'utf8'),
    readFile(new URL('src/pages/open-ad-network.js.ts', root), 'utf8'),
    readFile(new URL('functions/api/ad-metrics.ts', root), 'utf8'),
  ]);

  assert.match(registry, /id: 'industrynext'[\s\S]*campaigns: \['PC-NETWORK-EL-SEGUNDO-2026'\]/);
  assert.match(registry, /id: 'allworthy'[\s\S]*campaigns: \['PC-NETWORK-EL-SEGUNDO-2026'\]/);
  assert.match(registry, /id: 'passportz'[\s\S]*campaigns: \['PC-NETWORK-EL-SEGUNDO-2026'\]/);
  assert.match(registry, /id: 'rally'/);
  assert.match(registry, /id: 'rally'[\s\S]*campaigns: \['PC-NETWORK-EL-SEGUNDO-2026'\]/);
  assert.match(registry, /id: 'common-hours'[\s\S]*campaigns: \['PC-NETWORK-EL-SEGUNDO-2026'\]/);
  assert.match(registry, /PC-HOLDERS-CUT-2026/);
  assert.match(registry, /44 plates\. No finish line\./);
  assert.match(registry, /no Mainnet mint is active yet/i);
  assert.match(receipt, /open-ad-network\.js/);
  assert.match(widget, /configured === 'common-hours'/);
  assert.match(widget, /publisher\.id === 'rally'/);
  assert.match(widget, /preferredCampaigns/);
  assert.match(widget, /IntersectionObserver/);
  assert.match(widget, /utm_medium', 'open-ad-network'/);
  assert.match(route, /open-ad-network\.js\?raw/);
  assert.match(route, /text\/javascript/);
  assert.match(route, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /TRUSTED_PUBLISHER_ORIGINS/);
  assert.match(endpoint, /Publisher is the public property mounting the unit/);
});

test('portable publishers can transparently pin a single house campaign', async () => {
  const [receipt, widget] = await Promise.all([
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
    readFile(new URL('public/open-ad-network.js', root), 'utf8'),
  ]);

  assert.match(receipt, /'data-campaign'/);
  assert.match(widget, /mount\.dataset\.campaign/);
  assert.match(widget, /\[ad\.campaign, ad\.id\]/);
  assert.match(widget, /networkCampaign/);
  assert.match(widget, /campaign-unavailable/);
});

test('Network El Segundo runs sitewide as a three-creative first-100 wallet campaign', async () => {
  const [registry, desk, receipt] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/pages/ads.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
  ]);

  assert.match(registry, /PC-NETWORK-EL-SEGUNDO-2026/);
  assert.equal((registry.match(/href: '\/network-el-segundo'/g) || []).length, 3);
  assert.equal((registry.match(/image: network[A-Z][A-Za-z]+\.src/g) || []).length, 3);
  assert.match(registry, /No sale, token, payout contract, or yield system is live/);
  assert.match(registry, /Every wallet turns on one light/);
  assert.match(registry, /One hundred positions\. One live signal/);
  assert.match(registry, /Transmit the First 100 Signal/);
  assert.match(registry, /networkCreative/);
  assert.match(desk, /SITEWIDE HOUSE CAMPAIGN/);
  assert.match(desk, /ENTER THE FIRST 100 SIGNAL/);
  assert.match(desk, /OPEN THE RELAY KIT/);
  assert.match(receipt, /NETWORK_EL_SEGUNDO_CAMPAIGN/);
});

test('Art Kitty runs as a three-creative contextual house campaign with public proof', async () => {
  const [registry, desk, receipt] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/pages/ads.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
  ]);

  assert.match(registry, /PC-ART-KITTY-2026/);
  assert.equal((registry.match(/href: 'https:\/\/art-kitty-editions\.mhoydich\.chatgpt\.site/g) || []).length, 3);
  assert.equal((registry.match(/image: artKitty[A-Z][A-Za-z]+\.src/g) || []).length, 3);
  assert.match(registry, /Half for the art\. Half for what comes next\./);
  assert.match(registry, /Bright signals\. Same generous circuit\./);
  assert.match(registry, /Make one\. Fund the next one\./);
  assert.match(desk, /NEW HOUSE CAMPAIGN · \{ART_KITTY_CAMPAIGN\.id\}/);
  assert.match(desk, /home-art-kitty-opens-31-one-tez-collector-editions/);
  assert.match(receipt, /ART_KITTY_CAMPAIGN/);
});

test('Nouns About runs as a three-creative house campaign to the canonical field note', async () => {
  const [registry, desk] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/pages/ads.astro', root), 'utf8'),
  ]);

  assert.match(registry, /PC-NOUNS-ABOUT-2026/);
  assert.equal((registry.match(/href: 'https:\/\/www\.industrynext\.xyz\/about\/'/g) || []).length, 3);
  assert.match(registry, /Permission is the starting point\./);
  assert.match(registry, /CC0 makes the work movable\./);
  assert.match(registry, /A Noun is a beginning, not a boundary\./);
  assert.match(desk, /NEW HOUSE CAMPAIGN/);
  assert.match(desk, /SEE CAMPAIGN COUNTS/);
});

test('Permission Lab runs as a measured three-creative make and Made campaign', async () => {
  const [registry, rail, desk, receipt] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/components/OpenAdRail.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
  ]);

  assert.match(registry, /PC-PERMISSION-LAB-2026/);
  assert.equal((registry.match(/href: 'https:\/\/www\.industrynext\.xyz\/make\/'/g) || []).length, 2);
  assert.equal((registry.match(/href: 'https:\/\/www\.industrynext\.xyz\/made\/'/g) || []).length, 1);
  assert.match(registry, /Make first\. Ask never\./);
  assert.match(registry, /One Noun\. Six possible beginnings\./);
  assert.match(registry, /Made by whoever arrived\./);
  assert.match(rail, /const \{ count = 3 \}/);
  assert.match(desk, /NEW HOUSE CAMPAIGN · \{PERMISSION_LAB_CAMPAIGN\.id\}/);
  assert.match(desk, /SEE CAMPAIGN COUNTS/);
  assert.match(receipt, /PERMISSION_LAB_CAMPAIGN/);
});

test('Drum Noun Universe is featured on home and guaranteed across other public pages', async () => {
  const [registry, home, homeAd, rail] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/pages/index.astro', root), 'utf8'),
    readFile(new URL('src/components/DrumNounUniverseAd.astro', root), 'utf8'),
    readFile(new URL('src/components/OpenAdRail.astro', root), 'utf8'),
  ]);

  assert.match(registry, /PC-DRUM-NOUN-UNIVERSE-2026/);
  assert.match(registry, /Featured homepage unit and contextual placement across public non-Drum pages/);
  assert.match(registry, /return \[universeCreative, networkCreative, \.\.\.companionAds\]/);
  assert.match(home, /<DrumNounUniverseAd\s*\/>/);
  assert.match(homeAd, /data-ad-record=\{ad\.id\}/);
  assert.match(homeAd, /NO VISITOR PROFILE · NO PAID MEDIA/);
  assert.match(rail, /DRUM_NOUN_UNIVERSE_CAMPAIGN/);
});

test('Drum Compendium gets one coherent PointCast house series across every route', async () => {
  const [registry, component, desk] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/components/OpenAdRail.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.astro', root), 'utf8'),
  ]);

  assert.match(registry, /PC-DRUM-COMPENDIUM-2026/);
  assert.match(registry, /A six-part PointCast house campaign distributed by URL context/);
  assert.match(registry, /const isDrumSurface/);
  assert.match(registry, /ad\.campaign === DRUM_COMPENDIUM_CAMPAIGN\.id/);
  assert.match(component, /DrumCompendiumAdArt/);
  assert.match(component, /POINTCAST HOUSE SERIES · DRUM COMPENDIUM/);
  assert.match(desk, /One compendium\./);

  const pagesDir = new URL('src/pages/', root);
  const drumPages = (await readdir(pagesDir))
    .filter((name) => /^drum.*\.astro$/.test(name));
  assert.ok(drumPages.length >= 100, `expected the full drum compendium, found ${drumPages.length} routes`);

  for (const name of drumPages) {
    const source = await readFile(new URL(name, pagesDir), 'utf8');
    const inheritsSharedRail = /import (?:Base|Block|Drum|Sparrow)Layout from '\.\.\/layouts\//.test(source);
    const rendersRailDirectly = /import OpenAdRail/.test(source) && /<OpenAdRail\s*\/>/.test(source);
    assert.ok(inheritsSharedRail || rendersRailDirectly, `${name} does not render the shared ad rail`);
  }
});

test('Post Office opens with a flowing latest-across-the-wire strip', async () => {
  const press = await readFile(new URL('src/pages/press.astro', root), 'utf8');
  assert.match(press, /POST OFFICE · SIGNAL DESK/);
  assert.match(press, /post-office-wire-flow/);
  assert.match(press, /wireLatest/);
  assert.match(press, /prefers-reduced-motion/);
});
