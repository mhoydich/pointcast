import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getAdCampaign } from '../src/lib/ad-network.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the PointCast homepage carries a rotating Nine Lives house signal', async () => {
  const [advert, home, registry] = await Promise.all([
    read('src/components/TownAdverts.astro'),
    read('src/pages/index.astro'),
    read('src/lib/ad-network.ts'),
  ]);

  assert.match(home, /<TownAdverts\s*\/>/);
  assert.match(advert, /fallbackCampaignId="nine-lives-001"/);
  assert.match(registry, /Allworthy Nine Lives house campaign/);
  assert.match(registry, /One tez\. Nine doors\. One giant kitty\./);
  assert.match(registry, /https:\/\/allworthy\.xyz\/nine-lives/);
  assert.match(registry, /destinationSurface: 'external'/);
});

test('the Nine Lives creative keeps the public simulation boundary visible', async () => {
  const registry = await read('src/lib/ad-network.ts');
  const campaign = getAdCampaign('nine-lives-001');
  assert.ok(campaign);
  const copy = [campaign.kicker, campaign.headline, campaign.body, campaign.cta, campaign.boundary].join(' ');

  assert.match(registry, /VIEW ONLY · NO WALLET · NO FUNDS MOVE/);
  assert.match(registry, /view-only simulation of a Tezos distribution experiment/i);
  assert.doesNotMatch(copy, /\b(?:earn|yield|return|dividend|jackpot)\b/i);
});

test('the shared ad renderer is responsive, accessible, and motion-safe', async () => {
  const component = await read('src/components/AdSlot.astro');

  assert.match(component, /aria-label={`\$\{spec\.label\} advertisement`}/);
  assert.match(component, /rel={fallback\.destinationSurface/);
  assert.match(component, /sponsored noopener noreferrer/);
  assert.match(component, /\.pc-ad:focus-visible/);
  assert.match(component, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /intersectionRatio >= 0\.5/);
});
