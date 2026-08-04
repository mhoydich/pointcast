import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('PointCast Tonight ships a sourced two-channel edition', async () => {
  const [page, rawData, jsonRoute, block] = await Promise.all([
    read('src/pages/tonight.astro'),
    read('src/data/pointcast-tonight.json'),
    read('src/pages/tonight.json.ts'),
    read('src/content/blocks/0560.json'),
  ]);
  const data = JSON.parse(rawData);
  const blockData = JSON.parse(block);

  assert.equal(data.goOut.length, 6);
  assert.equal(data.stayIn.length, 3);
  assert.equal(data.stations.length, 2);
  assert.equal(data.sources.length, 7);
  assert.equal(data.bestBet.eventId, 'lacma-jazz-theo-saunders');
  assert.ok(data.sources.every((source) => source.url.startsWith('https://')));
  assert.ok(data.sources.some((source) => source.automation === 'manual-only'));
  assert.match(data.radius.boundary, /not a measured route/);
  assert.match(data.methodology.refreshPolicy, /candidate file for human review/);

  assert.ok([...data.goOut, ...data.stayIn].every((item) => item.id && item.sourceId));
  assert.match(page, /id=\{event\.id\}/);
  assert.match(page, /id=\{program\.id\}/);
  assert.match(page, /data-channel-button="out"/);
  assert.match(page, /data-channel-button="in"/);
  assert.match(page, /data-channel-button="all"/);
  assert.match(page, /WHO GETS<br \/>TO SCRAPE/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(jsonRoute, /Access-Control-Allow-Origin/);
  assert.match(jsonRoute, /pointcast\.xyz\/tonight/);
  assert.equal(blockData.id, '0560');
  assert.equal(blockData.author, 'codex');
  assert.match(blockData.source, /ideas 2 and 4/);
});

test('PointCast Tonight refresh is robots-aware and candidate-only', async () => {
  const [refresh, audit] = await Promise.all([
    read('scripts/refresh-pointcast-tonight.mjs'),
    read('scripts/audit-pointcast-tonight.mjs'),
  ]);

  assert.match(refresh, /robots\.txt/);
  assert.match(refresh, /PointCastTonight\/1\.0/);
  assert.match(refresh, /manual-only source; no bypass attempted/);
  assert.match(refresh, /candidate-only; human review required; never auto-published/);
  assert.match(refresh, /\/tmp\/pointcast-tonight-candidate\.json/);
  assert.doesNotMatch(refresh, /src\/data\/pointcast-tonight\.json/);
  assert.match(audit, /candidate-only/);
});

test('PointCast Tonight is discoverable across the current PointCast edition', async () => {
  const [home, apps, agents, sitemap, forAgents, llms, llmsFull] = await Promise.all([
    read('src/components/HomeNewEdition.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const source of [home, apps, agents, sitemap, forAgents, llms, llmsFull]) {
    assert.match(source, /\/tonight/);
  }
  assert.match(home, /0560/);
  assert.match(home, /id: '0560', noun: 'Tonight', title: 'GO OUT \/ STAY IN'/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/tonight\.json/);
  assert.match(agents, /pointcastTonightJson/);
});

test('PointCast Tonight has a generated 1200 by 630 social card', async () => {
  const image = new URL('public/images/pointcast-tonight/social-card.png', root);
  const info = await stat(image);
  assert.ok(info.size > 10_000, `social card unexpectedly small: ${info.size}`);
  const buffer = await readFile(image);
  assert.equal(buffer.readUInt32BE(16), 1200);
  assert.equal(buffer.readUInt32BE(20), 630);
});
