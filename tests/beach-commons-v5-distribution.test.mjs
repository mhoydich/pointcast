import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Beach Commons V5 has a disclosed three-creative reciprocal house campaign', async () => {
  const [registry, desk, receipt, widget] = await Promise.all([
    read('src/lib/open-ad-network.ts'),
    read('src/pages/ads.astro'),
    read('src/pages/ads.json.ts'),
    read('public/open-ad-network.js'),
  ]);

  assert.match(registry, /PC-BEACH-COMMONS-V5-2026/);
  assert.equal((registry.match(/id: 'PC-BEACH-COMMONS-V5-\d{3}'/g) || []).length, 3);
  assert.match(registry, /What if weather were the curriculum\?/);
  assert.match(registry, /Account for every cup\./);
  assert.match(registry, /The school closes as a parliament\./);
  assert.match(registry, /not an operating event, school, parliament, installation, scientific authority, or invitation to build/i);
  assert.equal((registry.match(/'PC-BEACH-COMMONS-V5-2026'/g) || []).length >= 6, true);
  assert.match(registry, /isBeachCommonsV5Surface/);
  assert.match(desk, /NEW RECIPROCAL HOUSE CAMPAIGN/);
  assert.match(desk, /PRESS FILING/);
  assert.match(receipt, /BEACH_COMMONS_V5_CAMPAIGN/);
  assert.match(widget, /preferredCampaigns/);
  assert.match(widget, /utm_medium', 'open-ad-network'/);
});

test('Beach Commons V5 press filing is reachable from the Block, campaign desk, and public wire data', async () => {
  const [blockText, pressText, desk] = await Promise.all([
    read('src/content/blocks/0513.json'),
    read('src/data/press-releases.json'),
    read('src/pages/ads.astro'),
  ]);
  const block = JSON.parse(blockText);
  const press = JSON.parse(pressText);
  const release = press.find((item) => item.id === 'PCPW-2026-0014');

  assert.ok(release);
  assert.equal(release.productUrl, 'https://pointcast.xyz/beach-commons/v5');
  assert.match(release.disclosure, /owned announcement/i);
  assert.match(release.body.join(' '), /conceptual and unpermitted/i);
  assert.ok(block.companions.some((item) => item.id.endsWith(release.slug)));
  assert.match(desk, new RegExp(release.slug));
});
