import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

const AI_AGENTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User',
  'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'Amazonbot',
  'meta-externalagent', 'DuckAssistBot', 'cohere-ai', 'YouBot', 'MistralAI-User',
];
const PRIVATE_RULES = ['/api/auth/', '/api/me/', '/me', '/_/', '/admin/', '/search?q=', '/api/spotify/search?q=', '/api/collect/confirm', '/api/collect/unsubscribe', '/api/shopify/auth', '/api/shopify/callback', '/api/spotify/auth', '/api/spotify/callback'];

const SITEMAPS = [
  'https://pointcast.xyz/sitemap-index.xml',
  'https://pointcast.xyz/sitemap-discovery.xml',
  'https://pointcast.xyz/sitemap-blocks.xml',
];

function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(User-agent|Allow|Disallow|Sitemap):\s*(.*)$/i);
    assert.ok(match, `unrecognised robots line: ${line}`);
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === 'user-agent') {
      current = { agent: value, rules: [] };
      groups.push(current);
      continue;
    }
    if (key === 'sitemap') {
      sitemaps.push(value);
      continue;
    }
    assert.ok(current, `${line} appears before any User-agent line`);
    current.rules.push({ type: key, path: value });
  }
  return { groups, sitemaps };
}

function parseRedirects(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/);
      return { from, to, status };
    });
}

test('robots.txt route serves public/robots.txt verbatim', async () => {
  assert.ok(!exists('src/pages/robots.txt.ts'), 'robots.txt should have one static source of truth');

  // The build writes the same bytes to dist/. Only checkable after a build.
  if (exists('dist/robots.txt')) {
    const [built, source] = await Promise.all([read('dist/robots.txt'), read('public/robots.txt')]);
    assert.equal(built, source);
  }
});

test('named AI User-agent groups allow public crawling and retain private exceptions', async () => {
  const { groups } = parseRobots(await read('public/robots.txt'));
  const agents = groups.map((group) => group.agent);

  assert.ok(groups.length >= 20, `expected wildcard plus named AI blocks, saw ${groups.length}`);
  for (const agent of ['*', ...AI_AGENTS]) {
    assert.ok(agents.includes(agent), `missing User-agent block for ${agent}`);
  }

  for (const { agent, rules } of groups) {
    const allowed = rules.filter((rule) => rule.type === 'allow').map((rule) => rule.path);
    const disallowed = rules.filter((rule) => rule.type === 'disallow').map((rule) => rule.path);

    assert.ok(allowed.includes('/'), `${agent}: missing Allow: /`);
    assert.deepEqual(disallowed, PRIVATE_RULES, `${agent}: unexpected Disallow set`);

    const lastAllow = rules.map((rule) => rule.type).lastIndexOf('allow');
    const firstDisallow = rules.map((rule) => rule.type).indexOf('disallow');
    assert.ok(
      lastAllow < firstDisallow,
      `${agent}: an Allow line follows a Disallow line (last Allow at ${lastAllow}, first Disallow at ${firstDisallow})`,
    );
  }
});

test('robots.txt names the sitemap index plus both custom sitemaps', async () => {
  const { sitemaps } = parseRobots(await read('public/robots.txt'));
  assert.deepEqual(sitemaps, SITEMAPS);
});

test('robots.txt header lists both MCP entry points', async () => {
  const robots = await read('public/robots.txt');
  const header = robots.split('\n').filter((line) => line.startsWith('#')).join('\n');
  assert.match(header, /https:\/\/pointcast\.xyz\/api\/mcp\b/);
  assert.match(header, /https:\/\/pointcast\.xyz\/api\/mcp-v2\b/);
});

test('/sitemap.xml redirects to /sitemap-index.xml with a 301', async () => {
  const rules = parseRedirects(await read('public/_redirects'));
  const sitemapRules = rules.filter((rule) => rule.from === '/sitemap.xml');
  assert.equal(sitemapRules.length, 1, 'expected exactly one /sitemap.xml rule in public/_redirects');
  assert.deepEqual(sitemapRules[0], { from: '/sitemap.xml', to: '/sitemap-index.xml', status: '301' });

  // The target is real: @astrojs/sitemap writes sitemap-index.xml at build.
  const config = await read('astro.config.mjs');
  assert.match(config, /integrations:\s*\[[^\]]*\bsitemap\(/);

  // A static file at /sitemap.xml would shadow the redirect. Astro has no
  // adapter here, so a src/pages/sitemap.xml.ts returning a 3xx would be
  // written to dist/ as a meta-refresh HTML page under an .xml name — a
  // 200 with a broken body, not a redirect. Neither may exist.
  assert.ok(!exists('src/pages/sitemap.xml.ts'), 'src/pages/sitemap.xml.ts would shadow the _redirects rule');
  assert.ok(!exists('public/sitemap.xml'), 'public/sitemap.xml would shadow the _redirects rule');

  // The rule only fires if the middleware hands .xml paths to next() instead
  // of the trailing-slash rewrite branch.
  const middleware = await read('functions/_middleware.ts');
  assert.match(middleware, /STATIC_ASSET_REGEX = \/\\\.\([^)]*\bxml\b[^)]*\)/);

  // Only checkable after a build.
  if (exists('dist/_redirects')) {
    const built = parseRedirects(await read('dist/_redirects'));
    assert.ok(built.some((rule) => rule.from === '/sitemap.xml' && rule.to === '/sitemap-index.xml' && rule.status === '301'));
    assert.ok(exists('dist/sitemap-index.xml'), 'dist/sitemap-index.xml missing after build');
    assert.ok(!exists('dist/sitemap.xml'), 'dist/sitemap.xml exists and would shadow the redirect');
  }
});
