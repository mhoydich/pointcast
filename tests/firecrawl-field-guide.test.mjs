import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Firecrawl field guide ships human, machine, Block, history, and multi-lens surfaces', async () => {
  const [page, data, jsonRoute, block] = await Promise.all([
    read('src/pages/firecrawl.astro'),
    read('src/lib/firecrawl-field-guide.ts'),
    read('src/pages/firecrawl.json.ts'),
    read('src/content/blocks/0552.json'),
  ]);

  assert.match(page, /Who gets to<br \/><em>read the web\?<\/em>/);
  assert.match(page, /data-crawl-console/);
  assert.match(page, /data-lens-board/);
  assert.match(page, /NO NETWORK REQUEST/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /images\/firecrawl\/field-guide-og\.png/);
  assert.match(data, /The web was born linkable/);
  assert.match(data, /id: 'publisher'/);
  assert.match(data, /id: 'librarian'/);
  assert.match(data, /id: 'researcher'/);
  assert.match(data, /id: 'artist'/);
  assert.match(data, /id: 'agent'/);
  assert.match(data, /RFC 9309/);
  assert.match(data, /World Wide Web Wanderer/);
  assert.match(data, /Common Crawl/);
  assert.match(data, /hiQ Labs/);
  assert.match(jsonRoute, /Access-Control-Allow-Origin/);
  assert.match(jsonRoute, /sourceLedger: SOURCE_LEDGER/);
  assert.equal(JSON.parse(block).id, '0552');
  assert.equal(JSON.parse(block).author, 'mh+cc');
  assert.match(JSON.parse(block).source, /Michael Hoydich chat directive/);
});

test('Firecrawl field guide is wired into PointCast discovery and the current edition', async () => {
  const [home, agents, sitemap, forAgents, llms, llmsFull] = await Promise.all([
    read('src/components/HomeNewEdition.astro'),
    read('src/pages/agents.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const source of [home, agents, sitemap, forAgents, llms, llmsFull]) {
    assert.match(source, /\/firecrawl/);
  }
  assert.match(home, /0552/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/firecrawl\.json/);
  assert.match(agents, /firecrawlFieldGuide/);
});
