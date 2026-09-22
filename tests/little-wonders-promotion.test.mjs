import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const bundle = await build({
  entryPoints: ['src/lib/open-ad-network.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  plugins: [{
    name: 'astro-image-metadata',
    setup(builder) {
      builder.onLoad({ filter: /\.(?:png|jpe?g|webp)$/ }, ({ path }) => ({
        contents: `export default ${JSON.stringify({ src: `/test-assets/${basename(path)}` })};`,
        loader: 'js',
      }));
    },
  }],
});
const registry = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const { POINTCAST_ADS, OPEN_AD_PUBLISHERS, LITTLE_WONDERS_CAMPAIGN, A_LITTLE_MORE_LIGHT_CAMPAIGN, NOUNS_EVERYBODY_CAMPAIGN, selectAdsForPath, adDestination } = registry;
const ads = POINTCAST_ADS.filter((ad) => ad.campaign === LITTLE_WONDERS_CAMPAIGN.id);
const destination = 'https://wild-little-wonders.mhoydich.workers.dev/';
const widget = await readFile(new URL('public/open-ad-network.js', root), 'utf8');

test('three Little Wonders creatives advertise the preview with real assets and canonical URLs', async () => {
  assert.equal(ads.length, 3);
  assert.equal(LITTLE_WONDERS_CAMPAIGN.creativeCount, ads.length);
  assert.match(LITTLE_WONDERS_CAMPAIGN.note, /Collection preview only: no new acquisition/);
  assert.equal(new Set(ads.map((ad) => ad.id)).size, 3);
  for (const ad of ads) {
    assert.equal(ad.advertiser, 'The Wild');
    assert.equal(ad.href, destination);
    assert.equal(ad.status, 'house');
    assert.match(ad.copy, /preview/);
    assert.equal(ad.seriesIndex, undefined);
    assert.equal(ad.melody, undefined);
    await access(new URL(`public${ad.image}`, root));
    const click = new URL(adDestination(ad, '/gallery/today'));
    assert.equal(click.origin + click.pathname, destination);
    assert.equal(click.searchParams.get('utm_campaign'), LITTLE_WONDERS_CAMPAIGN.id.toLowerCase());
    assert.equal(click.searchParams.get('utm_medium'), 'open-ad-rail');
  }
});

test('native public rails visibly select exactly one Little Wonders creative without duplicates', () => {
  for (const path of ['/', '/today', '/ads', '/gallery/today', '/drum', '/drum-games', '/digital-pets/counsel', '/beach-commons/v8']) {
    const selected = selectAdsForPath(path, 3);
    assert.equal(selected.length, 3, path);
    assert.equal(selected.filter((ad) => ad.campaign === LITTLE_WONDERS_CAMPAIGN.id).length, 1, path);
    assert.equal(selected[0].campaign, A_LITTLE_MORE_LIGHT_CAMPAIGN.id, 'the uplifting companion remains first');
    assert.equal(new Set(selected.map((ad) => ad.id)).size, selected.length, path);
    assert.equal(selectAdsForPath(path, POINTCAST_ADS.length).filter((ad) => ad.campaign === LITTLE_WONDERS_CAMPAIGN.id).length, 1, path);
  }
});

test('only PointCast and Industry Next add Little Wonders while retaining both existing campaigns', () => {
  for (const publisher of OPEN_AD_PUBLISHERS) {
    assert.deepEqual(publisher.campaigns, ['pointcast', 'industrynext'].includes(publisher.id)
      ? [A_LITTLE_MORE_LIGHT_CAMPAIGN.id, NOUNS_EVERYBODY_CAMPAIGN.id, LITTLE_WONDERS_CAMPAIGN.id]
      : [A_LITTLE_MORE_LIGHT_CAMPAIGN.id], publisher.id);
  }
});

test('the existing Industry Next footer pin selects a Wild creative with portable attribution', () => {
  const window = { location: new URL('https://www.industrynext.xyz/') };
  const document = { currentScript: null, readyState: 'loading', addEventListener() {} };
  runInNewContext(widget.replace('  if (document.readyState', '  window.selection = { selectCreative, destinationFor };\n  if (document.readyState'), { window, document, URL });
  const mount = { dataset: { publisher: 'industrynext', placement: 'footer', campaign: 'PC-NETWORK-EL-SEGUNDO-2026', context: 'public development studio playable media local systems useful work enjoyable contribution tone bloom pointcast satellite picnic' } };
  const feed = { campaigns: POINTCAST_ADS, network: { publishers: OPEN_AD_PUBLISHERS } };
  const creative = window.selection.selectCreative(feed, mount, 'industrynext');
  assert.equal(creative.campaign, LITTLE_WONDERS_CAMPAIGN.id);
  assert.equal(mount.dataset.networkMigratedFrom, 'pc-network-el-segundo-2026');
  const click = new URL(window.selection.destinationFor(creative, 'industrynext', 'footer'));
  assert.equal(click.origin + click.pathname, destination);
  assert.equal(click.searchParams.get('utm_source'), 'industrynext');
  assert.equal(click.searchParams.get('utm_medium'), 'open-ad-network');
  assert.equal(click.searchParams.get('utm_content'), `footer:${creative.id.toLowerCase()}`);
  assert.match(creative.image, /\/images\/campaigns\/the-wild-little-wonders\//);
});
