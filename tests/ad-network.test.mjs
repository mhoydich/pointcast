import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AD_CAMPAIGNS,
  AD_SLOTS,
  destinationWithAttribution,
  getAdCampaign,
  normalizePlacement,
  selectAdCampaign,
} from '../src/lib/ad-network.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the first flight has four standard slots and six active creatives', () => {
  assert.deepEqual(
    Object.values(AD_SLOTS).map(({ width, height }) => `${width}x${height}`),
    ['300x250', '728x90', '320x50', '300x600'],
  );
  assert.equal(AD_CAMPAIGNS.length, 6);
  assert.ok(AD_CAMPAIGNS.every((campaign) => campaign.status === 'active'));
  assert.ok(AD_CAMPAIGNS.every((campaign) => campaign.slots.length === 4));
});

test('selection respects a recent-view exclusion and remains deterministic', () => {
  const first = selectAdCampaign('medium-rectangle', 'same-request');
  const again = selectAdCampaign('medium-rectangle', 'same-request');
  assert.equal(first?.id, again?.id);

  const rotated = selectAdCampaign('medium-rectangle', 'same-request', [first.id]);
  assert.notEqual(rotated?.id, first.id);
});

test('placements are bounded and click attribution cannot accept a destination', () => {
  assert.equal(normalizePlacement(' Home-Town_Left '), 'home-town_left');
  assert.equal(normalizePlacement('https://attacker.example'), null);
  assert.equal(normalizePlacement('x'.repeat(65)), null);

  const campaign = getAdCampaign('nine-lives-001');
  assert.ok(campaign);
  const destination = new URL(destinationWithAttribution(campaign, 'home-town-wide'));
  assert.equal(destination.origin, 'https://allworthy.xyz');
  assert.equal(destination.searchParams.get('utm_campaign'), 'nine-lives-001');
  assert.equal(destination.searchParams.get('utm_content'), 'home-town-wide');
});

test('delivery endpoints validate registry ids and never take an arbitrary redirect URL', async () => {
  const [serve, view, click, component] = await Promise.all([
    read('functions/api/ads/serve.ts'),
    read('functions/api/ads/view.ts'),
    read('functions/api/ads/click.ts'),
    read('src/components/AdSlot.astro'),
  ]);
  assert.match(serve, /selectAdCampaign/);
  assert.match(view, /campaign\.creativeId !== creativeId/);
  assert.match(click, /destinationWithAttribution\(campaign, placement\)/);
  assert.doesNotMatch(click, /searchParams\.get\(['"](?:url|destination|redirect)['"]\)/);
  assert.match(component, /adRuntime\.served\.add\(ad\.campaign\.id\)/);
  assert.match(component, /adRuntime\.queue = adRuntime\.queue\.then/);
});

test('public discovery includes both human and machine-readable ad network routes', async () => {
  const [page, json, sitemap, agents, llms] = await Promise.all([
    read('src/pages/ad-network.astro'),
    read('src/pages/ad-network.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('public/llms.txt'),
  ]);
  assert.match(page, /HOUSE ALPHA/);
  assert.match(json, /billable: false/);
  assert.match(sitemap, /pointcast\.xyz\/ad-network\.json/);
  assert.match(agents, /adNetworkJson/);
  assert.match(llms, /PointCast Ads/);
});
