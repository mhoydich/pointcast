import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
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

function pointcastUrls(value, output = [], key = '') {
  if (typeof value === 'string' && value.startsWith('https://pointcast.xyz') && key !== 'metadataBase') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => pointcastUrls(item, output));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([name, item]) => pointcastUrls(item, output, name));
  return output;
}

function replaceTemplate(pathname) {
  const id = pathname.startsWith('/yee/') ? '0236' : pathname.startsWith('/verify/spend/') ? '0412' : '0159';
  return pathname
    .replaceAll('{id}', id)
    .replaceAll('{handle}', 'mike')
    .replaceAll('{name}', 'field-agent')
    .replaceAll('{slug}', pathname.startsWith('/products/') ? 'grapefruit' : pathname.startsWith('/mood/') ? 'matins' : 'front-door')
    .replaceAll('{team-slug}', 'ohio-state')
    .replaceAll('{station}', 'los-angeles')
    .replaceAll('{tokenId}', '0')
    .replaceAll('{query}', 'town');
}

async function functionRoutes(directory = 'functions', prefix = '') {
  const routes = [];
  for (const entry of await readdir(new URL(`../${directory}/`, import.meta.url), { withFileTypes: true })) {
    const relative = `${prefix}/${entry.name}`;
    if (entry.name.startsWith('_') || entry.name === 'cloudflare-env.d.ts') continue;
    if (entry.isDirectory()) routes.push(...await functionRoutes(`${directory}/${entry.name}`, relative));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.bak.ts')) {
      const route = relative.replace(/\.ts$/, '').replace(/\/index$/, '').replace(/\[\.\.\.([^\]]+)\]/g, '**').replace(/\[([^\]]+)\]/g, '*');
      routes.push(new RegExp(`^${route.split('/').map((part) => part === '*' ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/')}/?$`));
    }
  }
  return routes;
}

function staticExists(pathname) {
  const clean = pathname.replace(/^\/+/, '').replace(/\/$/, '');
  return exists(`dist/${clean}`) || exists(`dist/${clean}/index.html`) || (!clean && exists('dist/index.html'));
}

function advertisedRouteExists(url, routes) {
  const parsed = new URL(url);
  const pathname = replaceTemplate(decodeURIComponent(parsed.pathname));
  return staticExists(pathname) || routes.some((route) => route.test(pathname));
}

function parseRobots(text) {
  const groups = [];
  let current = null;
  const sitemaps = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(User-agent|Allow|Disallow|Sitemap):\s*(.*)$/i);
    assert.ok(match, `unrecognised robots line: ${line}`);
    const key = match[1].toLowerCase();
    if (key === 'user-agent') {
      current = { agent: match[2].trim(), rules: [] };
      groups.push(current);
    } else if (key === 'sitemap') sitemaps.push(match[2].trim());
    else {
      assert.ok(current, `${line} appears before a User-agent line`);
      current.rules.push({ type: key, path: match[2].trim() });
    }
  }
  return { groups, sitemaps };
}

function markdownLinks(text) {
  return [...text.matchAll(/\[[^\]]+\]\((https:\/\/pointcast\.xyz[^)]+)\)/g)].map((match) => match[1]);
}

test('agent surface inventory is buildable and does not advertise 301 sources', async () => {
  assert.ok(exists('dist'), 'run npm run build:bare before this dist-dependent test');
  const routes = await functionRoutes();
  const llms = await read('public/llms.txt');
  assert.ok(llms.split('\n').length < 150, 'llms.txt should remain a short index');
  const llmsLinks = markdownLinks(llms);
  assert.ok(llmsLinks.length >= 40, `expected at least 40 llms links, saw ${llmsLinks.length}`);
  assert.ok(!/\]\((?!https:\/\/)/.test(llms), 'llms.txt contains a non-absolute Markdown link');

  const agents = JSON.parse(await read('dist/agents.json'));
  assert.equal(agents.name, 'PointCast');
  assert.ok(agents.endpoints?.current, 'current September surface registry missing');
  assert.ok(agents.endpoints?.retired?.some((item) => item.path === '/profile' && item.status === 'retired-301'));
  for (const key of ['profileObjects', 'sealSoulbound', 'kennelClub']) assert.ok(agents.contracts?.[key], `missing contract ${key}`);
  for (const item of Object.values(agents.contracts)) {
    if (item && typeof item === 'object' && 'status' in item) assert.equal(typeof item.status, 'string');
    if (item?.metadataBase) assert.ok(advertisedRouteExists(`${item.metadataBase}/{tokenId}`, routes), `metadata base has no Function route: ${item.metadataBase}`);
  }

  for (const alias of ['dist/.well-known/agents.json', 'dist/.well-known/ai.json']) {
    const aliased = JSON.parse(await read(alias));
    assert.equal(aliased.name, 'PointCast', `${alias} is not a PointCast manifest`);
    assert.ok(aliased.endpoints?.current, `${alias} lacks the current surface registry`);
    for (const url of [...new Set(pointcastUrls(aliased))]) {
      assert.ok(advertisedRouteExists(url, routes), `${alias} advertises an unresolved route: ${url}`);
    }
  }

  const urls = [...new Set([...llmsLinks, ...pointcastUrls(agents)])];
  for (const url of urls) assert.ok(advertisedRouteExists(url, routes), `advertised route is not in dist or Functions: ${url}`);

  const redirects = (await read('public/_redirects')).split('\n').map((line) => line.trim().split(/\s+/)).filter((parts) => parts[2] === '301');
  const redirectedSources = new Set(redirects.map((parts) => parts[0]));
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    assert.ok(!redirectedSources.has(pathname), `advertised URL points at a 301 source: ${url}`);
  }

  const discoverySource = await read('src/lib/seo.ts');
  const discoveryLinks = [...discoverySource.matchAll(/href:\s*'([^']+)'/g)].map((match) => `https://pointcast.xyz${match[1]}`);
  for (const url of discoveryLinks) assert.ok(advertisedRouteExists(url, routes), `DISCOVERY_LINKS route is not in dist or Functions: ${url}`);
  const robotsUrls = [...new Set((await read('public/robots.txt')).match(/https:\/\/pointcast\.xyz\/[^\s#]+/g) ?? [])];
  for (const url of robotsUrls) assert.ok(advertisedRouteExists(url, routes), `robots entry-point route is not in dist or Functions: ${url}`);
  assert.ok(!exists('src/pages/robots.txt.ts'), 'robots should have one static source of truth');
  assert.ok(!exists('src/pages/llms.txt.ts'), 'llms should have one static source of truth');
  assert.ok(!exists('src/pages/llms-full.txt.ts'), 'llms-full should have one static source of truth');
});

test('robots names the requested AI crawlers, keeps private exceptions, and lists the three sitemaps', async () => {
  const { groups, sitemaps } = parseRobots(await read('public/robots.txt'));
  assert.deepEqual(sitemaps, [
    'https://pointcast.xyz/sitemap-index.xml',
    'https://pointcast.xyz/sitemap-discovery.xml',
    'https://pointcast.xyz/sitemap-blocks.xml',
  ]);
  for (const agent of ['*', ...AI_AGENTS]) {
    const group = groups.find((item) => item.agent === agent);
    assert.ok(group, `missing User-agent: ${agent}`);
    assert.ok(group.rules.some((rule) => rule.type === 'allow' && rule.path === '/'), `${agent} must Allow: /`);
    for (const path of PRIVATE_RULES) assert.ok(group.rules.some((rule) => rule.type === 'disallow' && rule.path === path), `${agent} missing private rule ${path}`);
  }
});
