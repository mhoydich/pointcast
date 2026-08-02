import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('agent kit gives ChatGPT, Codex, Claude, and Firecrawl truthful setup paths', async () => {
  const [kit, page, connectorPage, connectors, agents, sitemap, forAgents, llms] = await Promise.all([
    read('src/lib/pointcast-agent-kit.ts'),
    read('src/pages/agent-kit.md.ts'),
    read('src/pages/connectors.astro'),
    read('src/pages/connectors.json.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
  ]);

  assert.match(kit, /ChatGPT web does not read local Codex MCP settings/);
  assert.match(kit, /codex mcp add pointcast-v2 --url/);
  assert.match(kit, /claude mcp add --transport http pointcast-v2/);
  assert.match(kit, /Remote connectors are added in Settings, not in claude_desktop_config\.json/);
  assert.match(kit, /npx -y firecrawl-cli@latest init --all --browser/);
  assert.match(kit, /firecrawl scrape https:\/\/pointcast\.xyz\/llms\.txt/);
  assert.match(kit, /prefer \/agent-kit\.md, \/agents\.json/);
  assert.match(page, /Content-Type': 'text\/markdown; charset=utf-8'/);
  assert.match(connectorPage, /document\.execCommand\('copy'\)/);
  assert.match(connectorPage, /btn\.textContent = 'Copied'/);
  assert.match(connectorPage, /data-copy-fallback/);
  assert.match(connectorPage, /btn\.textContent = 'Press ⌘C'/);
  assert.match(connectors, /agentKit: POINTCAST_AGENT_KIT/);
  assert.match(agents, /agentKit: 'https:\/\/pointcast\.xyz\/agent-kit\.md'/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/agent-kit\.md/);
  assert.match(forAgents, /\/agent-kit\.md/);
  assert.match(llms, /https:\/\/pointcast\.xyz\/agent-kit\.md/);
});

test('MCP discovery is request-aware so /api/mcp-v2 never advertises the v1 URL', async () => {
  const mcp = await read('functions/api/mcp.ts');
  assert.match(mcp, /function discoveryHtml\(request: Request\)/);
  assert.match(mcp, /new URL\(request\.url\)\.pathname/);
  assert.match(mcp, /codex mcp add \$\{serverKey\} --url \$\{endpoint\}/);
  assert.doesNotMatch(mcp, /const DISCOVERY_HTML = `<!doctype html>/);
});
