import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Board 000 publishes exactly 25 consecutive, unique teams with receipts', async () => {
  const data = await read('src/lib/pointcast-25.ts');
  const ranks = [...data.matchAll(/^\s{6}rank: (\d+),$/gm)].map((match) => Number(match[1]));
  const schools = [...data.matchAll(/^\s{6}school: '([^']+)',$/gm)].map((match) => match[1]);

  assert.deepEqual(ranks, Array.from({ length: 25 }, (_, index) => index + 1));
  assert.equal(schools.length, 25);
  assert.equal(new Set(schools).size, 25);
  assert.equal((data.match(/^\s{6}case: /gm) || []).length, 25);
  assert.equal((data.match(/^\s{6}doubt: /gm) || []).length, 25);
  assert.equal((data.match(/^\s{6}proof: /gm) || []).length, 25);
  assert.match(data, /pointcast\.25-for-reasons\/v1/);
  assert.match(data, /recurring: false/);
  assert.match(data, /pointCastCardCapture: false/);
});

test('25 FOR REASONS is an interactive public board with a local-only watchlist', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/25/index.astro'),
    read('src/lib/pointcast-25.ts'),
  ]);

  assert.match(data, /If everybody played next Saturday/);
  assert.match(page, /POINTCAST_25\.question/);
  assert.match(page, /data-filter="title-weather"/);
  assert.match(page, /data-filter="saved"/);
  assert.match(page, /data-pin=/);
  assert.match(page, /CASE/);
  assert.match(page, /DOUBT/);
  assert.match(page, /NEXT PROOF/);
  assert.match(page, /pointcast:25:watchlist:v1/);
  assert.match(page, /localStorage/);
  assert.match(page, /Nothing is transmitted/);
  assert.match(page, /href="\/api\/25\/checkout"/);
  assert.match(page, /rel="noopener sponsored"/);
  assert.match(page, /prefers-reduced-motion/);
});

test('the board has machine, Block, discovery, and subscription surfaces', async () => {
  const [endpoint, seasonEndpoint, board000Endpoint, blockText, sitemap, agents, forAgents, llms, llmsFull, home, agentPayments] =
    await Promise.all([
      read('src/pages/25.json.ts'),
      read('src/pages/25/season.json.ts'),
      read('src/pages/25/boards/000.json.ts'),
      read('src/content/blocks/0510.json'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/agents.json.ts'),
      read('src/pages/for-agents.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/index.astro'),
      read('src/pages/.well-known/agent-payments.json.ts'),
    ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /machineEdition/);
  assert.match(seasonEndpoint, /pointcast\.25-season-ledger\/v1/);
  assert.match(seasonEndpoint, /POINTCAST_25_EDITIONS/);
  assert.match(board000Endpoint, /max-age=31536000, immutable/);
  assert.match(board000Endpoint, /immutable: true/);
  assert.equal(block.id, '0510');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'READ');
  assert.equal(block.author, 'codex');
  assert.equal(block.external.url, 'https://pointcast.xyz/25');
  assert.equal(block.meta.priceUsd, 25);
  assert.equal(block.meta.recurring, false);
  assert.equal(block.meta.pointCastCardCapture, false);
  assert.match(sitemap, /pointcast\.xyz\/25'/);
  assert.match(sitemap, /pointcast\.xyz\/25\.json'/);
  assert.match(sitemap, /pointcast\.xyz\/25\/season'/);
  assert.match(sitemap, /pointcast\.xyz\/25\/boards\/000\.json'/);
  assert.match(agents, /pointcast25Json/);
  assert.match(forAgents, /25 FOR REASONS/);
  assert.match(llms, /## 25 FOR REASONS/);
  assert.match(llmsFull, /25 FOR REASONS — Board 000/);
  assert.match(home, /POINTCAST_25/);
  assert.match(agentPayments, /sku: 'PC-25-2026'/);
  assert.match(agentPayments, /stripe-hosted-redirect/);
  assert.match(agentPayments, /private-preview-eligibility-pending/);
  assert.match(agentPayments, /Purchase completion requires the buyer-authorized/);
});

test('checkout is a narrow redirect to Stripe-hosted HTTPS pages', async () => {
  const [checkout, terms, thanks, layout] = await Promise.all([
    read('functions/api/25/checkout.ts'),
    read('src/pages/25/terms.astro'),
    read('src/pages/25/thanks.astro'),
    read('src/layouts/BlockLayout.astro'),
  ]);

  assert.match(checkout, /POINTCAST_25_CHECKOUT_URL/);
  assert.match(checkout, /target\.protocol !== 'https:'/);
  assert.match(checkout, /buy\.stripe\.com/);
  assert.match(checkout, /checkout\.stripe\.com/);
  assert.match(checkout, /pay\.stripe\.com/);
  assert.match(checkout, /Response\.redirect\(target\.toString\(\), 302\)/);
  assert.match(checkout, /checkout-not-configured/);
  assert.match(checkout, /Cache-Control': 'no-store'/);
  assert.match(terms, /not a recurring/);
  assert.match(terms, /does not renew automatically/);
  assert.match(terms, /does not receive or store/);
  assert.match(terms, /hello@pointcast\.xyz/);
  assert.match(thanks, /Stripe sends the payment receipt/);
  assert.match(thanks, /noindex=\{true\}/);
  assert.match(layout, /noindex, nofollow/);
});

test('Board 000 social card is a 1200 by 630 PNG', async () => {
  const card = new URL('../public/images/pointcast-25/board-000.png', import.meta.url);
  await access(card);
  assert.deepEqual(pngSize(await readFile(card)), { width: 1200, height: 630 });
});

test('every PointCast 25 team has an indexable human case and adjacent JSON receipt', async () => {
  const [audience, teamPage, teamJson, currentJson, sitemap] = await Promise.all([
    read('src/lib/pointcast-25-audience.ts'),
    read('src/pages/25/teams/[slug].astro'),
    read('src/pages/25/teams/[slug].json.ts'),
    read('src/pages/25.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
  ]);

  assert.match(audience, /POINTCAST_25_TEAMS = POINTCAST_25\.teams\.map/);
  assert.match(teamPage, /getStaticPaths/);
  assert.match(teamPage, /SportsTeam/);
  assert.match(teamPage, /THE DIFFERENCE/);
  assert.match(teamPage, /THE RECEIPTS/);
  assert.match(teamJson, /pointcast\.25-team-receipt\/v1/);
  assert.match(teamJson, /Access-Control-Allow-Origin/);
  assert.match(currentJson, /teamCases: POINTCAST_25_TEAMS\.map/);
  assert.match(sitemap, /25\/teams\/\$\{team\.slug\}/);
});

test('the Disagreement Index is a sourced, bounded comparison rather than fake consensus', async () => {
  const [audience, page, endpoint, block] = await Promise.all([
    read('src/lib/pointcast-25-audience.ts'),
    read('src/pages/25/disagreements.astro'),
    read('src/pages/25/disagreements.json.ts'),
    read('src/content/blocks/0517.json'),
  ]);
  const release = JSON.parse(block);

  assert.match(audience, /dissentSchools = \['Penn State', 'BYU', 'Utah', 'Washington', 'Boise State'\]/);
  assert.match(audience, /one legible reference board, not as a universal consensus/);
  assert.match(page, /Not anti-model/);
  assert.match(page, /data-copy-team/);
  assert.match(endpoint, /pointcast\.25-disagreement-index\/v1/);
  assert.match(endpoint, /not a claim of universal consensus/);
  assert.equal(release.id, '0517');
  assert.equal(release.channel, 'SPN');
  assert.equal(release.meta.disagreements, 5);
  assert.equal(release.external.url, 'https://pointcast.xyz/25/disagreements');
});

test('the public receipt book opens every preseason claim and defines durable grades', async () => {
  const [audience, page, endpoint, boardPage] = await Promise.all([
    read('src/lib/pointcast-25-audience.ts'),
    read('src/pages/25/receipts.astro'),
    read('src/pages/25/receipts.json.ts'),
    read('src/pages/25/boards/000.astro'),
  ]);

  assert.match(audience, /POINTCAST_25_RECEIPTS = POINTCAST_25_TEAMS\.map/);
  assert.match(page, /KEEP/);
  assert.match(page, /Revision is allowed/);
  assert.match(endpoint, /OPEN/);
  assert.match(endpoint, /ALIVE/);
  assert.match(endpoint, /COMPLICATED/);
  assert.match(endpoint, /PROVEN/);
  assert.match(endpoint, /DEAD/);
  assert.match(boardPage, /IMMUTABLE EDITION/);
  assert.match(boardPage, /POINTCAST_25_TEAMS\.map/);
});

test('the audience desk is advertised across human, machine, LLM, and homepage discovery', async () => {
  const [home, current, season, agents, forAgents, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/pages/25/index.astro'),
    read('src/pages/25/season.astro'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const text of [home, current, season, agents, forAgents, sitemap, llms, llmsFull]) {
    assert.match(text, /25\/disagreements/);
    assert.match(text, /25\/receipts/);
  }
  assert.match(home, /25 permanent team pages/);
  assert.match(current, /POINTCAST_25_DISSENTS/);
  assert.match(forAgents, /25\/teams/);
  assert.match(llms, /https:\/\/pointcast\.xyz\/b\/0510/);
  assert.doesNotMatch(llms, /Permanent release: https:\/\/pointcast\.xyz\/b\/0512/);
});

test('Disagreement Index social card is a 1200 by 630 PNG', async () => {
  const card = new URL('../public/images/pointcast-25/disagreement-000.png', import.meta.url);
  await access(card);
  assert.deepEqual(pngSize(await readFile(card)), { width: 1200, height: 630 });
});
