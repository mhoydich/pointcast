import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const bundle = await build({
  entryPoints: [new URL('src/lib/open-ad-network.ts', root).pathname],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  plugins: [{
    name: 'astro-image-metadata',
    setup(builder) {
      builder.onResolve({ filter: /\.(?:png|jpe?g|webp)$/ }, ({ path }) => ({ path, namespace: 'asset' }));
      builder.onLoad({ filter: /.*/, namespace: 'asset' }, () => ({
        contents: 'export default { src: "/test-campaign-asset" };',
        loader: 'js',
      }));
    },
  }],
});
const registry = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const { POINTCAST_ADS, OPEN_AD_PUBLISHERS, MICRO_CLUB_CAMPAIGN, A_LITTLE_MORE_LIGHT_CAMPAIGN, LITTLE_WONDERS_CAMPAIGN, NOUNS_EVERYBODY_CAMPAIGN, selectAdsForPath, adDestination } = registry;
const creatives = POINTCAST_ADS.filter(ad => ad.campaign === MICRO_CLUB_CAMPAIGN.id);
const origin = 'https://pointcast-micro-club.mhoydich.workers.dev';
const widget = await readFile(new URL('public/open-ad-network.js', root), 'utf8');

function portableSelector(location) {
  const window = { location: new URL(location) };
  const document = { currentScript: null, readyState: 'loading', addEventListener() {} };
  class SnapshotDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-09-29T12:00:00Z'])); }
  }
  runInNewContext(widget.replace('  if (document.readyState', '  window.selection = { selectCreative, destinationFor };\n  if (document.readyState'), { window, document, URL, Date: SnapshotDate });
  return window.selection;
}

test('three Micro creatives have canonical destinations, distinct artwork, and truthful capabilities', () => {
  assert.equal(MICRO_CLUB_CAMPAIGN.id, 'PC-MICRO-CLUB-2026');
  assert.equal(MICRO_CLUB_CAMPAIGN.creativeCount, 3);
  assert.equal(creatives.length, 3);
  assert.deepEqual(creatives.map(ad => ad.headline), ['Small keys. Big detour.', 'Say it in color.', 'Your desk has a nightlife.']);
  assert.deepEqual(creatives.map(ad => ad.href), [`${origin}/v2/`, `${origin}/signals/`, `${origin}/v2/?game=pulse`]);
  assert.deepEqual(creatives.map(ad => ad.image), ['small-keys', 'say-it', 'after-hours'].map(slug => `${origin}/ads/art/${slug}.png`));
  assert.equal(new Set(creatives.map(ad => ad.id)).size, 3);
  assert.match(MICRO_CLUB_CAMPAIGN.note, /separately configured local bridge/);
  for (const ad of creatives) {
    assert.equal(ad.advertiser, 'PointCast Micro Club');
    assert.equal(ad.status, 'house');
    assert.equal(ad.seriesIndex, undefined, 'image creatives must not invoke unrelated Drum Compendium art');
    assert.equal(ad.melody, undefined, 'house card must not automatically play sound');
    const tracked = new URL(adDestination(ad, '/keyboard'));
    assert.equal(tracked.origin, origin);
    assert.equal(tracked.searchParams.get('utm_campaign'), MICRO_CLUB_CAMPAIGN.id.toLowerCase());
    assert.equal(tracked.searchParams.get('game'), new URL(ad.href).searchParams.get('game'));
  }
});

test('normal two-card rail actually shows Micro second, after uplift, on each intended route family', () => {
  for (const family of ['keyboard', 'games', 'play', 'studio', 'connectors', 'agents']) {
    for (const path of [`/${family}`, `/${family}/`, `/${family}/example`, `/${family}-example`]) {
      const selected = selectAdsForPath(path);
      assert.equal(selected.length, 2, path);
      assert.equal(selected[0].campaign, A_LITTLE_MORE_LIGHT_CAMPAIGN.id, path);
      assert.equal(selected[1].campaign, MICRO_CLUB_CAMPAIGN.id, path);
      assert.equal(selectAdsForPath(path, 1)[0].campaign, A_LITTLE_MORE_LIGHT_CAMPAIGN.id, path);
      assert.equal(selectAdsForPath(path, POINTCAST_ADS.length).filter(ad => ad.campaign === MICRO_CLUB_CAMPAIGN.id).length, 1, path);
    }
  }
  assert.equal(selectAdsForPath('/agents')[1].id, 'PC-MICRO-CLUB-002');
  assert.equal(selectAdsForPath('/connectors')[1].id, 'PC-MICRO-CLUB-002');
  assert.equal(selectAdsForPath('/studio')[1].id, 'PC-MICRO-CLUB-003');
});

test('other routes keep their existing music or Little Wonders placement and never select Micro', () => {
  for (const path of ['/', '/today', '/ads', '/gallery/today', '/digital-pets/counsel', '/beach-commons/v8', '/drum', '/drum-games', '/nouns/drum-club/']) {
    assert.equal(selectAdsForPath(path)[1].campaign, LITTLE_WONDERS_CAMPAIGN.id, path);
    assert.ok(!selectAdsForPath(path, POINTCAST_ADS.length).some(ad => ad.campaign === MICRO_CLUB_CAMPAIGN.id), path);
  }
  for (const path of ['/nouns/', '/station/party/', '/now', '/radio', '/playlist/', '/playlists/wednesday']) {
    assert.equal(selectAdsForPath(path)[1].campaign, NOUNS_EVERYBODY_CAMPAIGN.id, path);
    assert.ok(!selectAdsForPath(path, POINTCAST_ADS.length).some(ad => ad.campaign === MICRO_CLUB_CAMPAIGN.id), path);
  }
  for (const path of ['/game', '/keyboardist', '/playground', '/agentsmith']) {
    assert.ok(!selectAdsForPath(path, POINTCAST_ADS.length).some(ad => ad.campaign === MICRO_CLUB_CAMPAIGN.id), path);
  }
});

test('PointCast and Industry Next append Micro preference while retaining all existing preferences', () => {
  for (const publisher of OPEN_AD_PUBLISHERS) {
    assert.deepEqual(publisher.campaigns, ['pointcast', 'industrynext'].includes(publisher.id)
      ? [A_LITTLE_MORE_LIGHT_CAMPAIGN.id, NOUNS_EVERYBODY_CAMPAIGN.id, LITTLE_WONDERS_CAMPAIGN.id, MICRO_CLUB_CAMPAIGN.id]
      : [A_LITTLE_MORE_LIGHT_CAMPAIGN.id], publisher.id);
  }
});

test('actual portable selector chooses Micro in matching contexts and preserves destination attribution', () => {
  const feed = { campaigns: POINTCAST_ADS, network: { publishers: OPEN_AD_PUBLISHERS } };
  for (const publisher of ['pointcast', 'industrynext']) {
    const selector = portableSelector(publisher === 'pointcast' ? 'https://pointcast.xyz/keyboard' : 'https://www.industrynext.xyz/agents');
    const mount = { dataset: { publisher, placement: 'site-footer', context: 'micro keyboard controller games agents connectors signals' } };
    const ad = selector.selectCreative(feed, mount, publisher);
    assert.equal(ad.campaign, MICRO_CLUB_CAMPAIGN.id, publisher);
    const tracked = new URL(selector.destinationFor(ad, publisher, 'site-footer'));
    assert.equal(tracked.origin, origin);
    assert.equal(tracked.searchParams.get('utm_source'), publisher);
    assert.equal(tracked.searchParams.get('utm_medium'), 'open-ad-network');
    assert.equal(tracked.searchParams.get('utm_campaign'), MICRO_CLUB_CAMPAIGN.id.toLowerCase());
    for (const creative of creatives) {
      const pinned = selector.selectCreative(feed, { dataset: { ...mount.dataset, campaign: creative.id } }, publisher);
      assert.equal(pinned.id, creative.id, `${publisher} must not suppress Micro as an advertiser alias`);
    }
  }
});

test('public inventory includes Micro campaign metadata and the shared creative registry', async () => {
  const source = await readFile(new URL('src/pages/ads.json.ts', root), 'utf8');
  assert.match(source, /houseSeries:\s*\[[^\]]*MICRO_CLUB_CAMPAIGN/);
  assert.match(source, /campaigns:\s*POINTCAST_ADS/);
});
