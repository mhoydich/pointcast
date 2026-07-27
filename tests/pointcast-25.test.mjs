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
  assert.match(thanks, /Stripe will send the payment receipt/);
  assert.match(thanks, /noindex=\{true\}/);
  assert.match(layout, /noindex, nofollow/);
});

test('Board 000 social card is a 1200 by 630 PNG', async () => {
  const card = new URL('../public/images/pointcast-25/board-000.png', import.meta.url);
  await access(card);
  assert.deepEqual(pngSize(await readFile(card)), { width: 1200, height: 630 });
});
