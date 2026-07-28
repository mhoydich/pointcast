import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function loadCampaign() {
  const script = `
    import {
      DIGITAL_PETS_COUNSEL_CAMPAIGN,
      DIGITAL_PETS_COUNSEL_PINS,
      DIGITAL_PETS_COUNSEL_PROMO_DISPATCHES,
    } from './src/lib/digital-pets-counsel-promo.ts';
    process.stdout.write(JSON.stringify({
      campaign: DIGITAL_PETS_COUNSEL_CAMPAIGN,
      pins: DIGITAL_PETS_COUNSEL_PINS,
      dispatches: DIGITAL_PETS_COUNSEL_PROMO_DISPATCHES,
    }));
  `;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    { cwd: new URL('.', root), encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('household legal brief campaign is a bounded three-ad, five-pin system', async () => {
  const promo = loadCampaign();
  assert.equal(promo.campaign.id, 'PC-DIGITAL-PETS-COUNSEL-2026');
  assert.equal(promo.campaign.creativeCount, 3);
  assert.equal(promo.dispatches.length, 3);
  assert.equal(promo.pins.length, 5);
  assert.equal(new Set(promo.dispatches.map((item) => item.id)).size, 3);
  assert.equal(new Set(promo.pins.map((item) => item.id)).size, 5);

  const pdf = await readFile(new URL(`public${promo.campaign.pdfPath}`, root));
  assert.ok(pdf.length > 100_000, 'campaign PDF is unexpectedly small');
  assert.equal(pdf.subarray(0, 4).toString('ascii'), '%PDF');

  for (const pin of promo.pins) {
    const image = await stat(new URL(`public${pin.image}`, root));
    assert.ok(image.size > 50_000, `${pin.image} is unexpectedly small`);
    assert.match(pin.destination, /^\/digital-pets\/counsel/);
  }
});

test('comedy campaign is recorded across the contextual and reciprocal ad network', async () => {
  const [registry, desk, receipt, widget] = await Promise.all([
    read('src/lib/open-ad-network.ts'),
    read('src/pages/ads.astro'),
    read('src/pages/ads.json.ts'),
    read('public/open-ad-network.js'),
  ]);

  assert.match(registry, /DIGITAL_PETS_COUNSEL_PROMO_DISPATCHES\.map/);
  assert.match(registry, /isCounselSurface \? undefined : counselCreative/);
  assert.match(registry, /id: 'industrynext'[\s\S]*'PC-DIGITAL-PETS-COUNSEL-2026'/);
  assert.match(registry, /id: 'allworthy'[\s\S]*'PC-DIGITAL-PETS-COUNSEL-2026'/);
  assert.match(registry, /id: 'passportz'[\s\S]*'PC-DIGITAL-PETS-COUNSEL-2026'/);
  assert.match(registry, /id: 'rally'[\s\S]*'PC-DIGITAL-PETS-COUNSEL-2026'/);
  assert.match(registry, /id: 'common-hours'[\s\S]*'PC-DIGITAL-PETS-COUNSEL-2026'/);
  assert.match(desk, /LAUNCH-WEEK COMEDY CAMPAIGN/);
  assert.match(desk, /OPEN THE FIVE-PAGE BRIEF/);
  assert.match(receipt, /DIGITAL_PETS_COUNSEL_CAMPAIGN/);
  assert.match(widget, /preferredCampaigns/);
});

test('story, machine twin, and discovery surfaces expose the campaign artifact', async () => {
  const [story, json, sitemap, agents, forAgents, llms, llmsFull, tasks] = await Promise.all([
    read('src/pages/digital-pets/counsel.astro'),
    read('src/pages/digital-pets/counsel.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('TASKS.md'),
  ]);

  assert.match(story, /my-pet-has-retained-counsel-brief\.pdf/);
  assert.match(json, /DIGITAL_PETS_COUNSEL_PINS/);
  assert.match(json, /pdfUrl/);
  assert.match(sitemap, /my-pet-has-retained-counsel-brief\.pdf/);
  assert.match(agents, /digitalPetsComedyBrief/);
  assert.match(forAgents, /PC-DIGITAL-PETS-COUNSEL-2026/);
  assert.match(llms, /five-page campaign brief/);
  assert.match(llmsFull, /three-creative/);
  assert.match(tasks, /five Pinterest-ready campaign cards/);
});
