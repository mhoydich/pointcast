import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots, robotsDecision, parseSitemap, attrs, inspectHtml, productSignals, classifyHttp, representativeSample, validateSnapshot } from '../scripts/lib/discovery-audit.mjs';
import { audit, MACHINE_ROUTES } from '../scripts/audit-discovery.mjs';

test('robots uses most specific named groups without inheriting wildcard rules', () => {
  const robots = parseRobots('User-agent: *\nDisallow: /private\nUser-agent: ExampleBot\nAllow: /\nUser-agent: ExampleBot\nDisallow: /one\nSitemap: https://example.test/sitemap.xml');
  assert.equal(robotsDecision(robots, 'ExampleBot/2', '/private').allowed, true);
  assert.equal(robotsDecision(robots, 'OtherBot', '/private').allowed, false);
  assert.equal(robotsDecision(robots, 'ExampleBot', '/one').allowed, false);
  assert.deepEqual(robots.sitemaps, ['https://example.test/sitemap.xml']);
});
test('robots /me prefix blocks public /meetups while longest Allow ties grant access', () => {
  const robots = parseRobots('User-agent: *\nAllow: /\nDisallow: /me\nAllow: /messages\nDisallow: /messages\nDisallow: /*?q=*\nAllow: /exact$');
  assert.equal(robotsDecision(robots, 'Googlebot', '/meetups/').allowed, false);
  assert.equal(robotsDecision(robots, 'Googlebot', '/messages/demo').allowed, true);
  assert.equal(robotsDecision(robots, 'Googlebot', '/search?q=town').allowed, false);
  assert.equal(robotsDecision(robots, 'Googlebot', '/').allowed, true);
});
test('consecutive user agents share a robots group and blank disallow means no restriction', () => {
  const robots = parseRobots('User-agent: a\nUser-agent: b\nDisallow:\nAllow: /\n\nUser-agent: c\nDisallow: /');
  assert.equal(robots.groups.length, 2);
  assert.equal(robotsDecision(robots, 'b', '/path').allowed, true);
  assert.equal(robotsDecision(robots, 'c', '/path').allowed, false);
});
test('sitemap distinguishes child sitemap documents from URL entries and handles entities/namespaces', () => {
  const index = parseSitemap('<sitemapindex><sitemap><loc>https://x.test/s.xml</loc></sitemap></sitemapindex>');
  assert.equal(index.kind, 'index'); assert.equal(index.urls.length, 1);
  const set = parseSitemap('<sm:urlset><sm:url><sm:loc><![CDATA[https://x.test/a?b=1&c=2]]></sm:loc><sm:lastmod>2026-10-01</sm:lastmod></sm:url><sm:url><sm:loc>https://x.test/b?x=1&amp;y=2</sm:loc></sm:url></sm:urlset>');
  assert.equal(set.kind, 'urlset'); assert.equal(set.records[0].lastmod, '2026-10-01');
  assert.equal(set.urls[1], 'https://x.test/b?x=1&y=2');
  assert.equal(parseSitemap('<html>fallback</html>').kind, 'invalid');
});
test('attributes do not confuse data-name with name; values can be quoted or unquoted', () => {
  assert.deepEqual(attrs('<meta data-name="wrong" name=description content="A &amp; B">'), { 'data-name': 'wrong', name: 'description', content: 'A & B' });
});
test('HTML checks head title, decoded metadata, reordered JSON-LD attributes and server text', () => {
  const html = `<html lang=en><head><title>Page &amp; title</title><meta data-name=description content=Wrong><meta content="Useful description" name=description><link href="https://example.test/a/" rel=canonical></head><body><svg><title>SVG title</title></svg><h1>Heading</h1><p>Public text</p><script data-x=x type='application/ld+json'>{"@type":"Article","author":{"name":"Writer"}}</script><script>SECRET</script><a href=/b>Next</a><a href="https://elsewhere.test/">Outside</a></body></html>`;
  const result = inspectHtml(html, 'https://example.test/a/');
  assert.equal(result.titleCount, 1); assert.equal(result.title, 'Page & title');
  assert.equal(result.descriptionCount, 1); assert.equal(result.description, 'Useful description');
  assert.equal(result.jsonLdCount, 1); assert.deepEqual(result.jsonLdTypes, ['Article']);
  assert.ok(!result.serverTextExcerpt.includes('SECRET')); assert.equal(result.internalLinkCount, 1); assert.equal(result.externalLinkCount, 1);
});
test('malformed JSON-LD and nonindex directives are preserved', () => {
  const result = inspectHtml('<head><title>A</title><meta name=robots content="noindex, follow"></head><body><script type="application/ld+json">{bad}</script></body>', 'https://example.test/');
  assert.equal(result.noindex, true); assert.equal(result.jsonLdErrors.length, 1);
});
test('classification distinguishes documented authentication/payment/method gates from public errors', () => {
  assert.equal(classifyHttp({ httpStatus: 401, expected: [401] }), 'expected');
  assert.equal(classifyHttp({ httpStatus: 402, expected: [402] }), 'expected');
  assert.equal(classifyHttp({ httpStatus: 405, expected: [404, 405] }), 'expected');
  assert.equal(classifyHttp({ httpStatus: 200, expected: [401] }), 'warn');
  assert.equal(classifyHttp({ httpStatus: 200, expected: [200, 503] }), 'expected');
  assert.equal(classifyHttp({ httpStatus: 404 }), 'fail');
  assert.equal(classifyHttp({ httpStatus: 0, error: 'timeout' }), 'unmeasured');
});
test('Product partial checks distinguish truthful zero from null/empty and support AggregateOffer', () => {
  const products = productSignals([{ '@type': 'Product', name: 'Free', offers: { '@type': 'Offer', price: 0 } }, { '@type': 'Product', name: 'Unknown', offers: { '@type': 'Offer', price: null } }, { '@type': 'Product', name: 'Empty', offers: { '@type': 'Offer', price: '' } }, { '@type': 'Product', name: 'Aggregate', offers: { '@type': 'AggregateOffer', lowPrice: 5, priceCurrency: 'USD' } }]);
  assert.equal(products[0].offers[0].hasPrice, true);
  assert.equal(products[1].offers[0].hasPrice, false);
  assert.equal(products[2].offers[0].hasPrice, false);
  assert.equal(products[3].offers[0].hasLowPrice, true);
  assert.equal(products[3].offers[0].hasPriceCurrency, true);
  assert.equal(productSignals({ '@type': 'Product', name: 'Boolean is not price', offers: { '@type': 'Offer', price: false } })[0].offers[0].hasPrice, false);
  assert.equal(productSignals(Array.from({ length: 154 }, (_, i) => ({ '@type': 'Product', name: `Product ${i}` }))).length, 154);
});

// Injected fixtures exercise aggregate honesty without network access, cookies or POSTs.
function fixture({ failedLink = false, profile200 = false, robotsError = false, robotsHtmlFallback = false, emptyRobots = false, partialBot = false, partialManifest = false } = {}) {
  return async (url, options) => {
    const path = new URL(url).pathname; let httpStatus = 200; let body = ''; let contentType = 'application/json'; let error;
    if (path === '/robots.txt') {
      contentType = 'text/plain'; body = `User-agent: *\nAllow: /\nDisallow: /me\nDisallow: /admin/\nSitemap: ${options.origin}/sitemap-index.xml\nSitemap: ${options.origin}/sitemap-discovery.xml\nSitemap: ${options.origin}/sitemap-blocks.xml`;
      if (robotsError) { httpStatus = 503; body = ''; error = 'Robots retrieval incomplete'; }
      if (robotsHtmlFallback) { body = '<!doctype html><html><body>Fallback page</body></html>'; contentType = 'text/html'; }
      if (emptyRobots) body = '';
    } else if (path === '/sitemap-index.xml') { contentType = 'application/xml'; body = `<sitemapindex><sitemap><loc>${options.origin}/sitemap-0.xml</loc></sitemap></sitemapindex>`; }
    else if (path.startsWith('/sitemap-')) {
      contentType = 'application/xml';
      const paths = path === '/sitemap-0.xml' ? ['/brick-choir/join/', '/', '/admin/private-fixture/'] : path === '/sitemap-discovery.xml' ? ['/meetups/', '/messages/'] : ['/b/0655/'];
      body = `<urlset>${paths.map(item => `<url><loc>${options.origin}${item}</loc><lastmod>2026-10-01</lastmod></url>`).join('')}</urlset>`;
    } else if (path === '/agents.json' || path === '/.well-known/agents.json' || path === '/.well-known/ai.json') {
      body = JSON.stringify({ name: 'PointCast fixture', channels: Array.from({ length: 10 }, (_, id) => ({ id })), agentMode: { trigger: 'GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot' } });
      if (partialManifest && path === '/agents.json') error = 'Body limit exceeded';
    } else if (path === '/.well-known/ai-plugin.json') body = JSON.stringify({ api: { type: 'openapi', url: `${options.origin}/agents.json` } });
    else if (path.endsWith('/openapi.json')) body = JSON.stringify({ openapi: '3.1.0', paths: { '/catalog': { get: {} } } });
    else if (path === '/feed.json') body = JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', items: [] });
    else if (path === '/api/blocks.jsonl') { contentType = 'application/x-ndjson'; body = '{"id":"1"}\n'; }
    else if (path.endsWith('.xml')) { contentType = 'application/xml'; body = '<rss><channel><item><title>Item</title></item></channel></rss>'; }
    else if (path === '/llms.txt' || path === '/llms-full.txt' || path === '/agent-kit.md') { contentType = 'text/plain'; body = `# PointCast\nThe 9 channels. agents.json is current. ${'Public orientation. '.repeat(20)}`; }
    else if (path === '/broken-link/' && failedLink) { httpStatus = 0; error = 'Transport failure'; }
    else if (MACHINE_ROUTES.some(item => item[0] === path && item[1] === 'gate')) {
      const [, , expected] = MACHINE_ROUTES.find(item => item[0] === path); httpStatus = path === '/api/agent-cabinet/status' ? 200 : path === '/api/lucky-cat/profile' && profile200 ? 200 : expected[0];
      body = JSON.stringify({ error: 'Expected gate', phase: 'preview' });
    } else if (path.endsWith('.json') || path.startsWith('/api/') && !path.startsWith('/api/mcp')) body = JSON.stringify({ author: 'codex' });
    else {
      contentType = 'text/html';
      const noindex = path === '/brick-choir/join/';
      const product = path === '/shop/front/' ? ',"products":{"@type":"Product","name":"Unknown price product","offers":{"@type":"Offer","price":null}}' : '';
      body = `<html lang="en"><head><title>MCP Fixture ${path}</title><meta name=description content="A public fixture with meaningful server text."><link rel=canonical href="${url}">${noindex ? '<meta name=robots content=noindex>' : ''}</head><body><h1>Fixture</h1><p>${'Useful public text '.repeat(30)}</p><a href="/broken-link/">Link</a><script type="application/ld+json">{"@type":"Article","author":{"@id":"https://pointcast.xyz/#person"}${product}}</script><script>runtime()</script></body></html>`;
      if (partialBot && options.userAgent === 'GPTBot/1.0') error = 'Response stream failed';
    }
    return { url, finalUrl: url, checkedAt: '2026-10-03T00:00:00Z', httpStatus, headers: { 'content-type': contentType }, body, bodyBytes: body.length, redirects: [], ...(error ? { error } : {}) };
  };
}
test('complete fixture report keeps failing plugin contract out of passing aggregates and excludes private paths', async () => {
  const report = await audit({ site: 'https://fixture.test', maxLinks: 1, requestImpl: fixture() });
  assert.equal(report.routes.find(route => route.kind === 'plugin').status, 'fail');
  assert.equal(report.findings.find(item => item.id === 'agents-readable-doors').status, 'warn');
  assert.match(report.findings.find(item => item.id === 'agents-readable-doors').summary, /25 of 26/);
  assert.equal(report.sitemapInventory.publicPrefixCollisionCount, 2);
  assert.ok(!JSON.stringify(report).includes('/admin/private-fixture/'));
  assert.equal(report.findings.find(item => item.id === 'seo-noindex-sitemap').status, 'warn');
  assert.equal(report.findings.find(item => item.id === 'seo-product-properties').status, 'warn');
  assert.deepEqual(validateSnapshot(report), []);
});
test('transport/body failures and unexpected gate success stay unmeasured or warnings', async () => {
  const report = await audit({ site: 'https://fixture.test', maxLinks: 1, requestImpl: fixture({ failedLink: true, profile200: true, partialBot: true, partialManifest: true }) });
  assert.equal(report.routes.find(route => route.kind === 'link').status, 'unmeasured');
  assert.equal(report.findings.find(item => item.id === 'seo-internal-link-sample').status, 'warn');
  assert.equal(report.routes.find(route => route.path === '/api/lucky-cat/profile').status, 'warn');
  assert.equal(report.findings.find(item => item.id === 'agents-expected-gates').status, 'warn');
  assert.equal(report.routes.find(route => route.path === '/api/agent-cabinet/status').status, 'expected');
  assert.equal(report.routes.find(route => route.path === '/agents.json').summary.topLevelKeys, undefined);
  assert.equal(report.botChecks.find(item => item.name === 'GPTBot').status, 'unmeasured');
  assert.equal(report.findings.find(item => item.id === 'bots-synthetic-access').status, 'warn');
});
test('failed robots and zero link cohort never imply crawl permission or complete inventories', async () => {
  const report = await audit({ site: 'https://fixture.test', maxLinks: 0, requestImpl: fixture({ robotsError: true }) });
  assert.equal(report.botChecks.find(item => item.name === 'Google-Extended').status, 'unmeasured');
  assert.equal(report.botChecks.find(item => item.name === 'Googlebot').robots.allowed, null);
  assert.equal(report.sitemapInventory.blockedByGooglebotCount, null);
  assert.equal(report.coverage.find(item => item.id === 'robots').checked, 0);
  assert.equal(report.coverage.find(item => item.id === 'sitemap-urls').total, null);
  assert.equal(report.findings.find(item => item.id === 'seo-internal-link-sample').status, 'unmeasured');
  assert.deepEqual(validateSnapshot(report), []);
});
test('robots 200 HTML fallback fails the composite route while an empty valid policy allows access', async () => {
  const fallback = await audit({ site: 'https://fixture.test', maxLinks: 0, requestImpl: fixture({ robotsHtmlFallback: true }) });
  const fallbackRoute = fallback.routes.find(route => route.path === '/robots.txt');
  assert.equal(fallbackRoute.httpStatus, 200);
  assert.equal(fallbackRoute.status, 'fail');
  assert.equal(fallbackRoute.checks[0].status, 'fail');
  assert.equal(fallback.botChecks.find(item => item.name === 'Google-Extended').status, 'unmeasured');
  assert.equal(fallback.botChecks.find(item => item.name === 'Googlebot').robots.allowed, null);
  const empty = await audit({ site: 'https://fixture.test', maxLinks: 0, requestImpl: fixture({ emptyRobots: true }) });
  const emptyRoute = empty.routes.find(route => route.path === '/robots.txt');
  assert.equal(emptyRoute.status, 'pass');
  assert.equal(emptyRoute.checks[0].status, 'pass');
  assert.equal(empty.botChecks.find(item => item.name === 'Googlebot').robots.allowed, true);
  assert.equal(empty.coverage.find(item => item.id === 'robots').checked, 1);
});
test('bounded selection has no duplicates and keeps a reproducible spread', () => {
  assert.deepEqual(representativeSample(['d', 'a', 'c', 'b', 'e', 'a'], 3), ['a', 'c', 'e']);
  assert.deepEqual(representativeSample(['a'], 0), []);
});
test('snapshot rejects invented coverage denominators and statuses', () => {
  const base = { schemaVersion: 1, startedAt: '2026-10-03T00:00:00Z', completedAt: '2026-10-03T00:01:00Z', site: 'https://example.test', coverage: [{ id: 'x', checked: 2, total: 1 }], routes: [], findings: [], botChecks: [], limitations: [] };
  assert.match(validateSnapshot(base).join(' '), /coverage denominator/);
  assert.deepEqual(validateSnapshot({ ...base, coverage: [{ id: 'x', checked: 0, total: null }] }), []);
});
