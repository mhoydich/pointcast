#!/usr/bin/env node
/** Read-only, bounded production discovery audit. No POST, credentials, payments,
 * verified-crawler claims, or private repository data enter the public report.
 * Run: node scripts/audit-discovery.mjs --output public/audits/discovery-YYYY-MM-DD.json
 * Optional: --site https://pointcast.xyz --max-links 36 --references path/to/standards.json
 * Requires Node 22+; redirects are followed only on the audited origin. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRobots, robotsDecision, parseSitemap, inspectHtml, normalizedUrl, collectJsonSignals, classifyHttp, representativeSample, validateSnapshot } from './lib/discovery-audit.mjs';

export const HTML_PATHS = ['/', '/about/', '/manifesto/', '/for-agents/', '/capabilities/', '/connectors/', '/archive/', '/local/', '/areas/', '/agent-field-guide/', '/agent-native-publishing/', '/paddles/', '/paddles/legal/', '/books/', '/shop/', '/shop/front/', '/x402/', '/post-office/', '/lucky-cat/agents/', '/25/magazine/sorority-row/', '/b/0560/', '/b/0655/', '/b/0659/', '/reviews/ai-plans/', '/manufacturing/', '/tonight/', '/morning/', '/town/', '/meetups/', '/messages/', '/meditate/', '/mesh/', '/menlo-park/', '/brick-choir/join/', '/nouns/drum-club/bandmates/launch/', '/rewards/start/'];
export const MACHINE_ROUTES = [
  ['/llms.txt', 'text'], ['/llms-full.txt', 'text'], ['/agent-kit.md', 'text'],
  ['/agents.json', 'json'], ['/.well-known/agents.json', 'json'], ['/.well-known/ai.json', 'json'], ['/.well-known/ai-plugin.json', 'plugin'],
  ['/blocks.json', 'json'], ['/feed.json', 'feed'], ['/feed.xml', 'xml'], ['/rss.xml', 'xml'], ['/api/blocks.jsonl', 'jsonl'],
  ['/b/0560.json', 'json'], ['/b/0655.json', 'json'], ['/b/0659.json', 'json'], ['/connectors.json', 'json'],
  ['/api/mcp', 'mcp'], ['/api/mcp-v2', 'mcp'], ['/lucky-cat/openapi.json', 'openapi'], ['/nouns-money/openapi.json', 'openapi'],
  ['/manufacturing.json', 'json'], ['/paddles.json', 'json'], ['/town.json', 'json'], ['/tonight.json', 'json'], ['/api/capabilities', 'json'],
  ['/api/lucky-cat', 'json'], ['/api/lucky-cat/profile', 'gate', [401], 'Signed agent proof required; anonymous GET is expected to be denied.'],
  ['/api/x402/receipt', 'gate', [402], 'Bare GET is a payment quote; no payment is submitted.'],
  ['/api/x402/verify', 'gate', [400, 405], 'Receipt input is absent; this request cannot verify a receipt.'],
  ['/api/agent/bench', 'gate', [404, 405], 'Published action is POST-only; GET is a method mismatch, not a participation test.'],
  ['/api/lucky-cat/actions', 'gate', [404, 405], 'Published action is POST-only; GET is a method mismatch, not an action test.'],
  ['/api/agent-cabinet/status', 'gate', [200, 503], 'Public status may return 200 or a documented 503 preview/availability gate; phase and reason are checked.'],
];
export const BOTS = [
  ['Googlebot', 'Search index crawler'], ['bingbot', 'Search index crawler'], ['OAI-SearchBot', 'OpenAI search crawler'], ['GPTBot', 'OpenAI model-training crawler'], ['ChatGPT-User', 'OpenAI user-triggered retrieval'],
  ['ClaudeBot', 'Anthropic model-training crawler'], ['Claude-SearchBot', 'Anthropic search crawler'], ['Claude-User', 'Anthropic user-triggered retrieval'], ['PerplexityBot', 'Perplexity search crawler'], ['Perplexity-User', 'Perplexity user-triggered retrieval'],
  ['Google-Extended', 'Robots policy token; not a distinct HTTP User-Agent'], ['Applebot-Extended', 'Robots policy token; not a distinct HTTP User-Agent'], ['CCBot', 'Common Crawl crawler'], ['Amazonbot', 'Amazon crawler'],
];
const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
const auditUA = 'PointCast-Discovery-Audit/1.0 (+https://pointcast.xyz/for-agents; read-only snapshot)';
const selectedHeaders = ['content-type', 'x-robots-tag', 'x-agent-mode', 'last-modified', 'etag', 'cache-control'];
const check = (id, label, status, observed) => ({ id, label, status, observed });
const evidence = (route, observed) => ({ url: route.url, checkedAt: route.checkedAt, observed });
const publicPath = url => `${new URL(url).pathname}${new URL(url).search}`;
const slimResponse = result => ({ httpStatus: result.httpStatus, checkedAt: result.checkedAt, finalUrl: result.finalUrl, redirects: result.redirects, contentType: result.headers['content-type'] ?? '', responseHeaders: result.headers, ...(result.error ? { error: result.error } : {}) });

/** Each request has a byte ceiling and timeout. No mutation or automatic retry. */
export async function request(url, { origin, userAgent = auditUA, method = 'GET', maxBytes = 8_000_000, timeoutMs = 15000 } = {}) {
  const checkedAt = new Date().toISOString(); const redirects = []; let target = url;
  for (let hops = 0; hops < 6; hops++) {
    if (new URL(target).origin !== origin) return { url, checkedAt, finalUrl: target, httpStatus: redirects.at(-1)?.status ?? 0, redirects, headers: {}, body: '', error: 'Cross-origin redirect not fetched' };
    let response;
    try { response = await fetch(target, { method, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': userAgent, Accept: '*/*' } }); }
    catch (error) { return { url, checkedAt, finalUrl: target, httpStatus: 0, redirects, headers: {}, body: '', error: `Transport failure (${error.name})` }; }
    const headers = Object.fromEntries(selectedHeaders.map(key => [key, response.headers.get(key)]).filter(([, value]) => value !== null));
    if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.get('location')) {
      const next = new URL(response.headers.get('location'), target).href;
      redirects.push({ from: target, to: next, status: response.status });
      await response.body?.cancel(); target = next; continue;
    }
    const reader = response.body?.getReader(); const chunks = []; let size = 0; let truncated = false;
    try { if (reader) for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { truncated = true; await reader.cancel(); break; }
      chunks.push(value);
    } } catch (error) { return { url, checkedAt, finalUrl: target, httpStatus: response.status, redirects, headers, body: '', error: `Response stream failed (${error.name})` }; }
    const bytes = Buffer.concat(chunks);
    return { url, checkedAt, finalUrl: target, httpStatus: response.status, redirects, headers, body: bytes.toString('utf8'), bodyBytes: size, ...(truncated ? { error: `Body exceeded ${maxBytes} byte audit limit` } : {}) };
  }
  return { url, checkedAt, finalUrl: target, httpStatus: 0, redirects, headers: {}, body: '', error: 'Redirect hop limit reached' };
}
async function boundedMap(values, concurrency, callback) {
  const output = Array(values.length); let index = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => { for (;;) { const cursor = index++; if (cursor >= values.length) break; output[cursor] = await callback(values[cursor], cursor); } }));
  return output;
}
function safeLinks(urls, origin) {
  return urls.filter(value => { try { const url = new URL(value); return url.origin === origin && !url.search && !/^\/(api|admin|_|me)(\/|$)/.test(url.pathname) && !/\.(zip|png|jpg|jpeg|webp|gif|svg|mp3|mp4|pdf|woff2?|ico|css|js)$/i.test(url.pathname); } catch { return false; } });
}
function worst(checks, fallback = 'pass') { return checks.some(item => item.status === 'fail') ? 'fail' : checks.some(item => item.status === 'warn') ? 'warn' : checks.some(item => item.status === 'unmeasured') ? 'unmeasured' : fallback; }
export async function audit({ site = 'https://pointcast.xyz', maxLinks = 36, references = [], sourceRef = '', requestImpl = request } = {}) {
  const origin = new URL(site).origin; const startedAt = new Date().toISOString();
  const findings = []; const routes = []; const bodies = new Map(); const httpCache = new Map();
  const fetchUrl = async (path, options = {}) => {
    const url = new URL(path, origin).href; const key = `${options.userAgent ?? auditUA} ${options.method ?? 'GET'} ${url}`;
    if (!httpCache.has(key)) httpCache.set(key, requestImpl(url, { origin, ...options }));
    return httpCache.get(key);
  };
  const addFinding = (id, category, status, severity, title, summary, impact, recommendation, evidenceItems) => findings.push({ id, category, status, severity, title, summary, impact, recommendation, evidence: evidenceItems });
  const robotsResponse = await fetchUrl('/robots.txt');
  const robots = parseRobots(robotsResponse.body);
  const robotsKnown = robotsResponse.httpStatus === 200 && !robotsResponse.error && !/^\s*(?:<!doctype html|<html)/i.test(robotsResponse.body);
  const policyFor = (agent, target) => robotsKnown ? robotsDecision(robots, agent, target) : { allowed: null, group: '(unmeasured robots policy)', matchedRule: null, rules: [] };
  const robotsRouteStatus = robotsResponse.error || !robotsResponse.httpStatus ? 'unmeasured' : robotsKnown ? 'pass' : 'fail';
  const robotsRoute = { path: '/robots.txt', url: `${origin}/robots.txt`, category: 'bots', kind: 'robots', status: robotsRouteStatus, ...slimResponse(robotsResponse), checks: [check('robots-readable', 'Crawl directives readable', robotsRouteStatus, `${robots.groups.length} groups and ${robots.sitemaps.length} sitemap declarations${robotsKnown && !robots.groups.length ? '; complete empty policy defaults to access permission' : !robotsKnown ? '; complete valid robots policy not observed' : ''}`)], evidence: [evidence(robotsResponse, `${robotsResponse.httpStatus}; ${robots.groups.length} user-agent groups`)] };
  routes.push(robotsRoute);

  const sitemapQueue = robotsKnown ? [...robots.sitemaps] : []; const sitemapSeen = new Set(); const sitemapFamilies = []; const sitemapRecords = [];
  while (sitemapQueue.length && sitemapSeen.size < 32) {
    const url = sitemapQueue.shift(); if (sitemapSeen.has(url)) continue; sitemapSeen.add(url);
    if (new URL(url).origin !== origin) { sitemapFamilies.push({ url, status: 'unmeasured', kind: 'external', urlCount: 0, note: 'External sitemap not fetched' }); continue; }
    const response = await fetchUrl(url); const parsed = parseSitemap(response.body);
    const validUrls = parsed.urls.filter(value => { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } });
    const lastmods = [...new Set(parsed.records.map(record => record.lastmod).filter(Boolean))];
    const status = response.httpStatus === 200 && parsed.kind !== 'invalid' && !response.error && validUrls.length === parsed.urls.length ? 'pass' : response.error ? 'unmeasured' : 'fail';
    sitemapFamilies.push({ url, checkedAt: response.checkedAt, httpStatus: response.httpStatus, status, kind: parsed.kind, urlCount: validUrls.length, uniqueUrlCount: new Set(validUrls).size, lastmodCount: parsed.records.filter(record => record.lastmod).length, uniqueLastmodCount: lastmods.length, lastmodExamples: lastmods.slice(0, 3) });
    routes.push({ path: publicPath(url), url, category: 'seo', kind: 'sitemap', status, ...slimResponse(response), checks: [check('sitemap-valid', 'Sitemap document readable', status, `${parsed.kind}: ${validUrls.length} entries`)], evidence: [evidence(response, `HTTP ${response.httpStatus}; ${parsed.kind}; ${validUrls.length} entries`)] });
    if (parsed.kind === 'index') sitemapQueue.push(...validUrls);
    else if (parsed.kind === 'urlset') sitemapRecords.push(...parsed.records.filter(record => validUrls.includes(record.url)).map(record => ({ ...record, family: url })));
  }
  const uniqueSitemapUrls = [...new Set(sitemapRecords.map(record => record.url))];
  const normalizedSitemapUrls = new Set(uniqueSitemapUrls.map(url => normalizedUrl(url)));
  const sitemapBlocked = uniqueSitemapUrls.filter(url => new URL(url).origin === origin && policyFor('Googlebot', url).allowed === false);
  const publicPrefixBlocked = sitemapBlocked.filter(url => policyFor('Googlebot', url).matchedRule?.pattern === '/me' && !/^\/me(?:\/|\.json$|$)/.test(new URL(url).pathname));
  const sitemapHttpRoute = routes.filter(route => route.kind === 'sitemap');
  addFinding('seo-sitemaps-readable', 'seo', sitemapFamilies.every(item => item.status === 'pass') && !sitemapQueue.length && robots.sitemaps.length ? 'pass' : 'warn', 'info', 'Declared sitemap families are inventoried', `${sitemapFamilies.length} documents contain ${sitemapRecords.length} URL entries and ${uniqueSitemapUrls.length} unique exact URLs.`, 'This measures sitemap discovery and parsing, not index submission or index coverage.', 'Keep preferred canonical URLs in sitemaps and verify provider submission separately.', sitemapHttpRoute.map(route => evidence(route, route.checks[0].observed)));
  const normalizedDuplicates = sitemapRecords.length - normalizedSitemapUrls.size;
  if (normalizedDuplicates) addFinding('seo-sitemap-overlap', 'seo', 'warn', 'low', 'Sitemap families overlap', `${sitemapRecords.length} entries reduce to ${normalizedSitemapUrls.size} URLs after normalizing trailing slashes (${normalizedDuplicates} repeated ${normalizedDuplicates === 1 ? 'entry' : 'entries'}).`, 'Repeated sitemap entries add noise to crawl inventories; repetition alone does not prove an indexing problem.', 'Keep a consistent preferred URL form and remove avoidable cross-family duplication.', sitemapHttpRoute.map(route => evidence(route, route.checks[0].observed)));
  const blanket = sitemapFamilies.find(item => item.url.endsWith('/sitemap-discovery.xml') && item.lastmodCount > 1 && item.uniqueLastmodCount === 1);
  if (blanket) addFinding('seo-sitemap-lastmod', 'seo', 'warn', 'medium', 'Discovery lastmod is a blanket date', `All ${blanket.lastmodCount} dated discovery entries share ${blanket.lastmodExamples[0]}.${sourceRef ? ' The separately reviewed source generator assigns the build date.' : ' This observation alone cannot establish individual page change dates.'}`, 'A blanket date does not establish that each page changed significantly; freshness hints lose precision.', 'Emit lastmod only from verifiable page content changes, or omit it when a reliable date is unavailable.', [{ url: blanket.url, checkedAt: blanket.checkedAt, observed: `${blanket.lastmodCount} entries, one lastmod value: ${blanket.lastmodExamples[0]}` }, ...(sourceRef ? [{ url: `https://github.com/mhoydich/pointcast/blob/${sourceRef}/src/pages/sitemap-discovery.xml.ts`, observed: 'Source-informed as of this audit: generator assigns today once and applies it to every listed route; not inferred solely from equal live dates' }] : [])]);

  const htmlResults = await boundedMap(HTML_PATHS, 4, async path => {
    const response = await fetchUrl(path); bodies.set(path, response.body);
    const metadata = inspectHtml(response.body, response.finalUrl);
    const { internalLinks, ...publicMetadata } = metadata;
    const http = classifyHttp(response); const xRobots = response.headers['x-robots-tag'] ?? '';
    const checks = [check('http', 'Public HTML response', http, `HTTP ${response.httpStatus}${response.error ? `; ${response.error}` : ''}`)];
    if (http === 'pass') {
      checks.push(check('html-type', 'HTML content type', /text\/html/i.test(response.headers['content-type'] ?? '') ? 'pass' : 'fail', response.headers['content-type'] ?? '(missing)'));
      checks.push(check('title', 'One nonempty document title', metadata.titleCount === 1 && metadata.title ? 'pass' : 'fail', `${metadata.titleCount} title(s); ${metadata.title || '(empty)'}`));
      checks.push(check('description', 'One nonempty description', metadata.descriptionCount === 1 && metadata.description ? 'pass' : 'warn', `${metadata.descriptionCount} description(s)`));
      let canonicalStatus = 'fail'; try { canonicalStatus = metadata.canonicalCount === 1 && new URL(metadata.canonical).origin === origin && normalizedUrl(metadata.canonical) === normalizedUrl(response.finalUrl) ? 'pass' : metadata.canonicalCount === 1 ? 'warn' : 'fail'; } catch { /* invalid canonical fails */ }
      checks.push(check('canonical', 'Preferred canonical URL', canonicalStatus, metadata.canonical || '(missing)'));
      const noindex = metadata.noindex || /\bnoindex\b/i.test(xRobots);
      checks.push(check('index-directives', 'Index directives', noindex ? 'expected' : 'pass', `${metadata.robots.join('; ') || 'No restricting meta directive'}${xRobots ? `; X-Robots-Tag: ${xRobots}` : ''}${noindex ? '; deliberate noindex is not an outage' : ''}`));
      if (noindex) checks.push(check('noindex-sitemap', 'Noindex omitted from sitemap', normalizedSitemapUrls.has(normalizedUrl(`${origin}${path}`)) ? 'warn' : 'pass', normalizedSitemapUrls.has(normalizedUrl(`${origin}${path}`)) ? 'Noindex page appears in declared sitemap' : 'Noindex page is absent from declared sitemap'));
      const pathPolicy = policyFor('Googlebot', path);
      checks.push(check('robots-policy', 'Googlebot path permitted', pathPolicy.allowed === null ? 'unmeasured' : pathPolicy.allowed ? 'pass' : 'fail', pathPolicy.allowed === null ? 'Robots policy could not be read completely' : pathPolicy.matchedRule?.pattern ?? '(default allowed)'));
      checks.push(check('jsonld', 'Structured JSON parses', metadata.jsonLdErrors.length ? 'fail' : metadata.jsonLdCount ? 'pass' : 'warn', `${metadata.jsonLdCount} JSON-LD block(s); types: ${metadata.jsonLdTypes.join(', ') || '(none)'}`));
      checks.push(check('server-text', 'Server text candidates', metadata.textWordCount >= 50 ? 'pass' : 'warn', `${metadata.textWordCount} words after removing script/style/template/SVG; computed CSS/JS visibility not measured`));
      checks.push(check('lang', 'HTML language', metadata.lang ? 'pass' : 'warn', metadata.lang || '(missing)'));
      checks.push(check('h1', 'Primary heading', metadata.h1Count === 1 ? 'pass' : 'warn', `${metadata.h1Count} h1 element(s); editorial structure check, not a ranking rule`));
    }
    const route = { path, url: `${origin}${path}`, category: 'seo', kind: 'html', status: worst(checks, http), ...slimResponse(response), metadata: { ...publicMetadata, inSitemap: normalizedSitemapUrls.has(normalizedUrl(`${origin}${path}`)) }, checks, evidence: [evidence(response, `HTTP ${response.httpStatus}; title ${metadata.title || '(missing)'}; canonical ${metadata.canonical || '(missing)'}`)] };
    routes.push(route); return { route, internalLinks };
  });
  if (publicPrefixBlocked.length) {
    const confirmed = htmlResults.map(item => item.route).filter(route => route.httpStatus === 200 && publicPrefixBlocked.some(url => normalizedUrl(url) === normalizedUrl(route.url)));
    addFinding('bots-sitemap-prefix-block', 'bots', confirmed.length ? 'fail' : 'warn', confirmed.length ? 'high' : 'medium', 'The /me crawl exclusion reaches public routes', `${publicPrefixBlocked.length} unique public-name sitemap URLs match the /me prefix. ${confirmed.length} selected HTML examples returned 200 with self canonicals and no noindex directive.`, 'Compliant search crawlers may skip this public content. This is a crawl-policy collision, not proof of index removal or a noindex response. User-triggered retrieval providers may apply different rules.', 'Review intended /me scope and explicitly preserve crawl access for public /me-prefixed routes. Validate private-route intent before changing policy.', [evidence(robotsResponse, 'Disallow: /me is repeated for wildcard and named AI groups; prefix also matches public names'), ...confirmed.map(route => evidence(route, `HTTP ${route.httpStatus}; canonical ${route.metadata.canonical}; noindex ${route.metadata.noindex}; listed in sitemap; effective rule /me`)), ...publicPrefixBlocked.filter(url => !confirmed.some(route => normalizedUrl(route.url) === normalizedUrl(url))).slice(0, 4).map(url => ({ url, checkedAt: robotsResponse.checkedAt, observed: 'Inventoried sitemap URL; effective rule /me; response not fetched in HTML cohort' }))]);
  }
  const noindexListed = htmlResults.map(item => item.route).filter(route => route.checks.some(item => item.id === 'noindex-sitemap' && item.status === 'warn'));
  if (noindexListed.length) addFinding('seo-noindex-sitemap', 'seo', 'warn', 'medium', 'Noindex pages are advertised in sitemaps', `${noindexListed.length} selected public pages returned 200 with deliberate noindex and appeared in declared sitemaps.`, 'This sends inconsistent discovery signals; noindex pages and join/redirect steps are not public-content outages.', 'Remove intentionally noindex steps from preferred-URL sitemaps while preserving their intended visitor behavior.', noindexListed.map(route => evidence(route, `HTTP 200; noindex; canonical ${route.metadata.canonical}; in sitemap`)));
  const productRoute = htmlResults.find(item => item.route.path === '/shop/front/')?.route;
  if (productRoute && !productRoute.error && productRoute.httpStatus === 200) {
    const products = productRoute.metadata.products;
    const incomplete = products.filter(product => !product.name || !(product.hasReview || product.hasAggregateRating || product.offers.some(offer => offer.type === 'Offer' && offer.hasPrice || offer.type === 'AggregateOffer' && offer.hasLowPrice && offer.hasPriceCurrency)));
    productRoute.checks.push(check('product-properties', 'Product required-property paths (partial)', !products.length ? 'unmeasured' : incomplete.length ? 'warn' : 'pass', `${incomplete.length} of ${products.length} Product nodes lack name or an Offer/AggregateOffer/review/aggregateRating candidate path; partial price check only, nested review/rating validity and full Google eligibility unmeasured`));
    productRoute.status = worst(productRoute.checks);
    if (incomplete.length) addFinding('seo-product-properties', 'seo', 'warn', 'medium', 'Selected Product markup is incomplete for rich results', `${incomplete.length} of ${products.length} Product nodes on the selected shop front lack Google's documented minimum name/offer/review/rating candidate path. Full rich-result eligibility remains unmeasured.`, 'This limits a possible enhanced appearance; it does not establish crawl/index exclusion or measured search performance. Mixed catalog pages are not the preferred Product snippet target. Availability is recommended rather than a universal required property.', 'Use truthful, visible product data on suitable individual product pages and validate it with Google tools. Do not invent prices, reviews, ratings or stock status.', [evidence(productRoute, productRoute.checks.at(-1).observed), { url: 'https://developers.google.com/search/docs/appearance/structured-data/product-snippet', observed: 'Required Product name plus at least one valid offers/review/aggregateRating path; Offer needs price or priceSpecification.price; AggregateOffer needs lowPrice and priceCurrency; availability is recommended' }]);
  }
  for (const [id, title, severity, impact, recommendation] of [
    ['title', 'Document titles need attention', 'medium', 'Titles identify pages in search and retrieval.', 'Give each affected public page one descriptive head title.'],
    ['canonical', 'Canonical URLs need review', 'medium', 'Ambiguous preferred URLs can split discovery signals.', 'Confirm intended canonical targets and one absolute canonical per indexable page.'],
    ['description', 'Description coverage is uneven', 'low', 'Descriptions help explain pages when used for snippets; search providers may rewrite them.', 'Add concise page-specific descriptions where missing or duplicated.'],
    ['jsonld', 'Structured-data coverage needs review', 'low', 'Parsing failures block consumers; absence alone is not a technical SEO failure.', 'Repair invalid JSON-LD and add only relevant, accurate types where useful.'],
    ['server-text', 'Some pages deliver little server text', 'medium', 'Agents without rendering may receive little context.', 'Expose useful explanatory text or link the structured machine twin.'],
    ['h1', 'Heading structure varies', 'low', 'A clear primary heading improves page orientation; one h1 is not a search-engine requirement.', 'Review primary headings on the affected route cohort.'],
  ]) {
    const affected = htmlResults.map(item => item.route).filter(route => route.checks.some(item => item.id === id && ['fail', 'warn'].includes(item.status)));
    if (affected.length) addFinding(`seo-${id}-coverage`, 'seo', affected.some(route => route.checks.some(item => item.id === id && item.status === 'fail')) ? 'fail' : 'warn', severity, title, `${affected.length} of ${HTML_PATHS.length} selected HTML routes need review for this check.`, impact, recommendation, affected.map(route => evidence(route, route.checks.find(item => item.id === id).observed)));
  }
  const failedHtml = htmlResults.map(item => item.route).filter(route => route.httpStatus >= 400);
  if (failedHtml.length) addFinding('seo-html-responses', 'seo', 'fail', 'high', 'Selected public pages returned errors', `${failedHtml.length} of ${HTML_PATHS.length} selected HTML routes returned 4xx/5xx. These are public content GETs, not payment or POST-only actions.`, 'Visitors and retrieval clients cannot read those selected pages through these requests.', 'Validate intended routes and repair unavailable public content or stale discovery links.', failedHtml.map(route => evidence(route, `HTTP ${route.httpStatus}`)));

  const machineResults = await boundedMap(MACHINE_ROUTES, 4, async ([path, kind, expected = [], expectedNote = '']) => {
    const response = await fetchUrl(path); bodies.set(path, response.body);
    let status = classifyHttp({ ...response, expected }); let parsed; let parseError = false; const checks = [check('http', expected.length ? 'Published method/audience contract' : 'Public discovery response', status, `HTTP ${response.httpStatus}${expectedNote ? `; ${expectedNote}` : ''}${response.error ? `; ${response.error}` : ''}`)];
    const summary = { byteCount: response.bodyBytes ?? 0 };
    if (!response.error && response.httpStatus === 200 && ['json', 'plugin', 'feed', 'openapi'].includes(kind)) {
      try { parsed = JSON.parse(response.body); } catch { parseError = true; }
      checks.push(check('json', 'JSON response parses', parseError ? 'fail' : 'pass', parseError ? 'Response is not valid JSON' : 'Valid JSON'));
      checks.push(check('content-type', 'Machine response media type', /\b(?:application\/(?:[\w.-]+\+)?json)/i.test(response.headers['content-type'] ?? '') ? 'pass' : 'warn', response.headers['content-type'] ?? '(missing)'));
      if (parsed) { summary.topLevelKeys = Object.keys(parsed).slice(0, 18); summary.itemCount = Array.isArray(parsed) ? parsed.length : Array.isArray(parsed.items) ? parsed.items.length : Array.isArray(parsed.blocks) ? parsed.blocks.length : undefined; summary.provenance = collectJsonSignals(parsed); }
      if (kind === 'openapi') checks.push(check('openapi-contract', 'OpenAPI version and paths', parsed?.openapi && parsed?.paths && typeof parsed.paths === 'object' ? 'pass' : 'fail', `${parsed?.openapi ?? '(missing version)'}; ${Object.keys(parsed?.paths ?? {}).length} paths`));
      if (kind === 'feed') checks.push(check('feed-contract', 'JSON Feed version and items', /https:\/\/jsonfeed.org\/version\//.test(parsed?.version ?? '') && Array.isArray(parsed?.items) ? 'pass' : 'fail', `${parsed?.version ?? '(missing version)'}; ${parsed?.items?.length ?? 0} items`));
    } else if (!response.error && response.httpStatus === 200 && kind === 'jsonl') {
      const lines = response.body.split(/\r?\n/).filter(line => line.trim()); let invalid = 0; lines.forEach(line => { try { JSON.parse(line); } catch { invalid++; } }); summary.itemCount = lines.length; checks.push(check('jsonl', 'JSON lines parse', lines.length && !invalid ? 'pass' : 'fail', `${lines.length} lines, ${invalid} invalid`));
    } else if (!response.error && response.httpStatus === 200 && kind === 'xml') {
      checks.push(check('feed-xml', 'Feed XML root', /<(rss|feed)\b/i.test(response.body) ? 'pass' : 'fail', /<(rss|feed)\b/i.test(response.body) ? 'RSS/Atom root present; full XML schema validity not tested' : 'No RSS/Atom root')); summary.itemCount = [...response.body.matchAll(/<(?:item|entry)\b/g)].length;
    } else if (!response.error && response.httpStatus === 200 && kind === 'text') {
      checks.push(check('text', 'Readable orientation text', response.body.trim().length > 100 && !/^\s*<!doctype html/i.test(response.body) ? 'pass' : 'fail', `${response.body.length} characters`)); summary.linkCount = [...response.body.matchAll(/https:\/\/pointcast\.xyz[^\s)<>]+/g)].length;
    } else if (!response.error && response.httpStatus === 200 && kind === 'mcp') {
      checks.push(check('mcp-get', 'MCP GET discovery page', /text\/html/i.test(response.headers['content-type'] ?? '') && /MCP|Model Context Protocol/i.test(response.body) ? 'pass' : 'warn', 'GET discovery only; JSON-RPC catalog/session calls require POST and were not sent'));
    }
    if (kind === 'gate' && !response.error && response.httpStatus >= 400) {
      try { const gate = JSON.parse(response.body); summary.gateReason = String(gate.error ?? gate.reason ?? gate.phase ?? '').slice(0, 140); summary.phase = gate.phase; } catch { /* method fallbacks may be plain text */ }
      if (path === '/api/agent-cabinet/status' && response.httpStatus === 503 && !/preview|unavailable|blocked|gate|not-ready|not-live/i.test(`${summary.gateReason} ${summary.phase} ${response.body.slice(0, 1000)}`)) checks[0].status = status = 'warn';
    }
    if (kind === 'gate' && !response.error && response.httpStatus === 200 && !expected.includes(200)) checks[0].observed += `; unexpected success for anonymous contract (expected ${expected.join('/')})`;
    const route = { path, url: `${origin}${path}`, category: 'agents', kind, status: status === 'expected' ? status : worst(checks, status), ...slimResponse(response), summary, ...(expectedNote ? { expectedNote, expectedHttpStatuses: expected } : {}), checks, evidence: [evidence(response, checks.map(item => item.observed).join('; '))] };
    routes.push(route); return { route, parsed };
  });
  const plugin = machineResults.find(item => item.route.kind === 'plugin');
  if (plugin?.parsed?.api?.type === 'openapi') {
    const target = plugin.parsed.api.url; const targetResult = machineResults.find(item => normalizedUrl(item.route.url) === normalizedUrl(target, origin));
    if (targetResult?.parsed && (!targetResult.parsed.openapi || !targetResult.parsed.paths)) {
      plugin.route.checks.push(check('plugin-target-contract', 'Advertised OpenAPI target', 'fail', `${target} is a custom discovery manifest without openapi or paths`)); plugin.route.status = 'fail';
      addFinding('agents-plugin-contract', 'agents', 'fail', 'medium', 'Legacy plugin advertises a non-OpenAPI document', `The live legacy plugin manifest declares api.type=openapi but its target ${target} has no OpenAPI version or paths.`, 'This affects clients that still interpret the legacy manifest as an OpenAPI plugin. Modern MCP/JSON discovery and the two scoped OpenAPI specifications passed separate checks.', 'Replace the target with an appropriate genuine OpenAPI document, or retire the legacy manifest while preserving current documented integrations.', [evidence(plugin.route, `api.type=${plugin.parsed.api.type}; api.url=${target}`), evidence(targetResult.route, 'JSON discovery manifest, without openapi or paths')]);
    }
  }
  const manifestForConsistency = machineResults.find(item => item.route.path === '/agents.json');
  const liveChannels = manifestForConsistency?.parsed?.channels;
  const channelCount = Array.isArray(liveChannels) ? liveChannels.length : liveChannels && typeof liveChannels === 'object' ? Object.keys(liveChannels).length : null;
  const fullOrientation = bodies.get('/llms-full.txt') ?? '';
  const oldChannelClaim = fullOrientation.match(/(?:all\s+|the\s+)?(?:nine|9)\s+channels\b/i);
  if (channelCount && channelCount !== 9 && oldChannelClaim) addFinding('agents-orientation-consistency', 'agents', 'warn', 'low', 'Orientation channel count differs from the manifest', `The live llms-full.txt says “${oldChannelClaim[0]}”; live agents.json enumerates ${channelCount} channels. The text guide also designates agents.json as current and preserves historical context.`, 'Clients reading the text channel section alone may miss a current channel; this does not imply broken links or treat explicitly dated historical block counts as current.', 'Reconcile the channel section with the current registry, or clearly date and label that section as historical.', [evidence(machineResults.find(item => item.route.path === '/llms-full.txt').route, `${oldChannelClaim[0]}; agents.json designated current elsewhere in the document`), evidence(manifestForConsistency.route, `${channelCount} channels enumerated`)]);
  const discovery = machineResults.filter(item => item.route.kind !== 'gate'); const failures = discovery.filter(item => ['fail', 'unmeasured'].includes(item.route.status));
  addFinding('agents-readable-doors', 'agents', discovery.every(item => item.route.status === 'pass') ? 'pass' : 'warn', 'info', 'Machine discovery doors are inventoried', `${discovery.filter(item => item.route.status === 'pass').length} of ${discovery.length} selected discovery surfaces passed availability, format and advertised-contract checks; ${MACHINE_ROUTES.filter(item => item[1] === 'gate').length} audience/method probes are classified separately.`, 'Machine-readable interfaces reduce parsing work but do not establish search ranking or AI citations. A readable JSON response can still advertise an incorrect integration contract.', 'Maintain manifest links, typed formats and audience/method contracts together.', discovery.filter(item => ['agents.json', 'llms.txt', 'agent-kit.md', 'feed.json'].some(name => item.route.path.endsWith(`/${name}`))).map(item => evidence(item.route, item.route.checks.map(check => check.observed).join('; '))));
  const remainingFailures = failures.filter(item => item.route.kind !== 'plugin');
  if (remainingFailures.length) addFinding('agents-unreadable-doors', 'agents', remainingFailures.some(item => item.route.status === 'fail') ? 'fail' : 'warn', 'medium', 'Selected machine response contracts need review', `${remainingFailures.length} of ${discovery.length} selected discovery surfaces failed availability/contract checks or remained unmeasured, beyond the separately listed legacy plugin contract.`, 'Clients may fail to read the content or interpret the advertised integration contract. Specific evidence distinguishes HTTP errors from readable-but-invalid contracts.', 'Repair the specific response contract or update stale discovery advertisements.', remainingFailures.map(item => evidence(item.route, item.route.checks.filter(check => check.status !== 'pass').map(check => check.observed).join('; '))));
  const gates = machineResults.filter(item => item.route.kind === 'gate'); const expectedGates = gates.filter(item => item.route.status === 'expected');
  addFinding('agents-expected-gates', 'agents', gates.every(item => item.route.status === 'expected') ? 'expected' : 'warn', 'info', 'Gated actions are not public-content outages', `${expectedGates.length} of ${gates.length} audience/method probes matched published contracts (${expectedGates.filter(item => item.route.httpStatus >= 400).length} denial/preview responses and ${expectedGates.filter(item => item.route.httpStatus === 200).length} documented public status responses); ${gates.filter(item => item.route.status === 'unmeasured').length} probes remained unmeasured.`, 'Anonymous read probes do not exercise authorized actions, payments, signed identity or receipts. An unexpected 200 on a denied-by-contract route is reviewed separately from a documented public status 200.', 'Keep expected gates separate from public read failures; exercise authorized actions only in their dedicated test lane.', gates.map(item => evidence(item.route, `${item.route.checks[0].observed}${item.route.summary.gateReason ? `; ${item.route.summary.gateReason}` : ''}`)));

  // Validate contributor evidence on two public blocks, without exporting bodies.
  for (const id of ['0655', '0659']) {
    const json = machineResults.find(item => item.route.path === `/b/${id}.json`);
    const html = htmlResults.find(item => item.route.path === `/b/${id}/`);
    if (!json?.parsed || !html || html.route.httpStatus !== 200) continue;
    const block = json.parsed.block ?? json.parsed; const author = block.author ?? block.data?.author;
    const raw = bodies.get(`/b/${id}/`) ?? '';
    if (author && author !== 'mike' && /"author"\s*:\s*\{\s*"@id"\s*:\s*"https:\/\/pointcast\.xyz\/#person"/.test(raw)) addFinding(`geo-author-${id}`, 'geo', 'warn', 'medium', 'Article attribution differs from the block record', `Block ${id} JSON reports contributor “${String(author).slice(0, 40)}”; the HTML Article JSON-LD points author to the site-wide person identity.`, 'Attribution inconsistency reduces clarity for systems assessing authorship and provenance.', 'Represent the actual contributor(s) consistently in visible credits, HTML metadata and JSON-LD; keep publisher identity separate.', [evidence(json.route, `author: ${String(author).slice(0, 40)}`), evidence(html.route, 'Article JSON-LD author @id is https://pointcast.xyz/#person')]);
  }

  const allLinks = safeLinks(htmlResults.flatMap(item => item.internalLinks), origin); const uniqueLinks = [...new Set(allLinks)]; const sampledLinks = representativeSample(uniqueLinks, maxLinks);
  const linkResults = await boundedMap(sampledLinks, 4, async url => {
    const response = await fetchUrl(url); const status = classifyHttp(response);
    routes.push({ path: publicPath(url), url, category: 'seo', kind: 'link', status, ...slimResponse(response), checks: [check('internal-link', 'Selected internal href responds', status, `HTTP ${response.httpStatus}${response.redirects.length ? `; ${response.redirects.length} redirect(s)` : ''}${response.error ? `; ${response.error}` : ''}`)], evidence: [evidence(response, `HTTP ${response.httpStatus}`)] });
    return response;
  });
  const brokenLinks = linkResults.filter(item => item.httpStatus >= 400);
  const unmeasuredLinks = linkResults.filter(item => item.error || !item.httpStatus);
  addFinding('seo-internal-link-sample', 'seo', !sampledLinks.length ? 'unmeasured' : brokenLinks.length ? 'fail' : unmeasuredLinks.length ? 'warn' : 'pass', brokenLinks.length ? 'medium' : 'info', 'Internal link sample is checked', `${sampledLinks.length} deterministic on-origin hrefs selected from ${uniqueLinks.length} eligible unique links; ${brokenLinks.length} returned 4xx/5xx; ${unmeasuredLinks.length} remained unmeasured.`, 'This bounded sample does not certify every link on the site. Transport failures are unmeasured checks, not proof of an outage; a zero-length cohort is unmeasured.', 'Repair failed destinations or stale hrefs; expand this cohort when new route families publish.', (brokenLinks.length ? brokenLinks : unmeasuredLinks.length ? unmeasuredLinks : linkResults.slice(0, 4)).map(item => evidence(item, `HTTP ${item.httpStatus}${item.error ? `; ${item.error}` : ''}`)));

  const botChecks = await boundedMap(BOTS, 3, async ([name, purpose]) => {
    const policy = policyFor(name, '/');
    if (name.endsWith('-Extended')) return { name, userAgent: null, path: '/', purpose, status: policy.allowed === null ? 'unmeasured' : policy.allowed ? 'pass' : 'warn', robots: policy, httpStatus: null, checkedAt: robotsResponse.checkedAt, observed: `Root policy ${policy.allowed === null ? 'unmeasured' : policy.allowed ? 'allows' : 'disallows'}; HTTP probe not applicable to this policy token`, note: 'Policy token only. No distinct User-Agent request or real crawler verification.' };
    const userAgent = `${name}/1.0`; const response = await fetchUrl('/', { userAgent, maxBytes: 2_000_000 });
    const markup = inspectHtml(response.body, response.finalUrl);
    const nonLdScriptCount = [...response.body.matchAll(/<script\b([^>]*)>/gi)].filter(match => !/type\s*=\s*["']application\/(?:ld\+json|json\+ld)["']/i.test(match[1])).length;
    const styleCount = [...response.body.matchAll(/<style\b|<link\b[^>]*rel\s*=\s*["']stylesheet["']/gi)].length;
    return { name, userAgent, path: '/', purpose, status: response.error || policy.allowed === null ? 'unmeasured' : policy.allowed && response.httpStatus === 200 ? 'pass' : 'warn', robots: policy, httpStatus: response.httpStatus, checkedAt: response.checkedAt, observed: `Synthetic ${userAgent} GET / returned ${response.httpStatus}; robots root ${policy.allowed === null ? 'unmeasured' : policy.allowed ? 'allowed' : 'disallowed'}; ${markup.textWordCount} server text words; X-Agent-Mode ${response.headers['x-agent-mode'] ?? '(absent)'}${response.error ? `; ${response.error}` : ''}`, ...(response.error ? { error: response.error } : {}), serverTextWordCount: markup.textWordCount, bodyBytes: response.bodyBytes, agentMode: response.headers['x-agent-mode'] ?? null, nonLdScriptCount, styleCount, note: 'Synthetic User-Agent from the audit network. Does not prove verified crawler access, a crawler visit, indexing, ranking or citation.' };
  });
  const manifest = machineResults.find(item => item.route.path === '/agents.json');
  const advertisedBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot'].filter(name => manifest?.parsed?.agentMode?.trigger?.includes(name));
  const modeMismatch = botChecks.filter(item => advertisedBots.includes(item.name) && !item.error && item.httpStatus === 200 && (!item.agentMode?.startsWith('stripped') || item.nonLdScriptCount || item.styleCount));
  if (modeMismatch.length) addFinding('agents-html-mode-drift', 'agents', 'warn', 'medium', 'Advertised stripped HTML differs by User-Agent', `${modeMismatch.length} of ${advertisedBots.length} advertised named synthetic root requests retained runtime markup or lacked the promised X-Agent-Mode header. Full HTML remained HTTP 200.`, 'This is a discovery-documentation/runtime mismatch, not an access or indexing failure. Historical payload savings in the manifest are not current performance measurements.', 'Reconcile the advertised trigger list, classifier and response treatment, and describe Extended tokens as robots controls rather than distinct HTTP User-Agents.', [evidence(manifest.route, `agentMode.trigger: ${manifest.parsed.agentMode.trigger}`), ...modeMismatch.map(item => ({ url: `${origin}/`, checkedAt: item.checkedAt, observed: `${item.userAgent}; HTTP ${item.httpStatus}; X-Agent-Mode ${item.agentMode ?? '(absent)'}; ${item.nonLdScriptCount} non-JSON-LD scripts; ${item.styleCount} style/stylesheet tags` })), ...(sourceRef ? [{ url: `https://github.com/mhoydich/pointcast/blob/${sourceRef}/functions/api/visit.ts`, observed: 'Separately reviewed classifier does not explicitly match OAI-SearchBot; live synthetic requests are the response evidence' }] : [])]);
  addFinding('bots-synthetic-access', 'bots', botChecks.filter(item => item.userAgent).every(item => item.status === 'pass') ? 'pass' : 'warn', 'info', 'Synthetic bot entry requests are separate from indexing', `${botChecks.filter(item => item.userAgent && item.status === 'pass').length} of ${botChecks.filter(item => item.userAgent).length} named synthetic root requests completed with 200 and root policy permission; ${botChecks.filter(item => item.userAgent && item.status === 'unmeasured').length} remained unmeasured. Two Extended policy tokens were evaluated only in robots.`, 'Responses from this audit network cannot verify provider IP access, WAF treatment, actual crawling, rendering or indexing.', 'Use verified crawler logs and provider tools to measure real bot activity; review the public-path robots mismatch separately.', [{ url: `${origin}/`, observed: 'Named synthetic root requests only; no verified crawler source' }, evidence(robotsResponse, `${robots.groups.length} parsed robot groups`)]);
  addFinding('geo-readiness-boundary', 'geo', 'unmeasured', 'info', 'Search visibility and AI citations remain unmeasured', 'This snapshot measures technical discovery readiness. It contains no provider index coverage, ranking, traffic, search-query study or AI citation measurement.', 'Available machine formats and crawl permission can support retrieval but cannot establish real search or generative-engine outcomes.', 'Add authorized Search Console/Bing evidence, verified crawler logs, and a disclosed repeatable AI citation study as separate measured datasets.', [{ url: `${origin}/for-agents/`, observed: 'Public participation/discovery documentation; not provider visibility evidence' }]);
  const textPass = htmlResults.filter(item => !item.route.error && item.route.httpStatus === 200 && item.route.metadata.textWordCount >= 50).length;
  addFinding('geo-server-text', 'geo', textPass === HTML_PATHS.length ? 'pass' : 'warn', 'info', 'Server text is available across the selected cohort', `${textPass} of ${HTML_PATHS.length} selected HTML pages delivered at least 50 candidate text words outside script/style/template/SVG.`, 'Initial HTML improves readability for clients that do not run page scripts; semantic and factual quality require separate editorial review.', 'Keep meaningful content and contributor/source context in initial HTML or a linked machine twin.', htmlResults.slice(0, 4).map(item => evidence(item.route, `${item.route.metadata.textWordCount} candidate server-text words`)));

  const coverage = [
    { id: 'robots', label: 'Robots policy', checked: robotsKnown ? 1 : 0, total: 1, unit: 'file', note: `${robotsKnown ? robots.groups.length : 0} groups accepted from a complete response; path matching tested independently; failed retrieval does not imply access permission` },
    { id: 'sitemaps', label: 'Declared sitemap documents', checked: sitemapFamilies.filter(item => item.status === 'pass').length, total: robotsKnown ? sitemapFamilies.length + sitemapQueue.length : null, unit: 'documents', note: `${robotsKnown ? 'Recursively follows robots declarations and sitemap indexes' : 'Robots declarations unavailable; complete declared denominator unmeasured'}; ${sitemapRecords.length} URL entries, ${uniqueSitemapUrls.length} unique exact URLs` },
    { id: 'sitemap-urls', label: 'Sitemap URL inventory', checked: uniqueSitemapUrls.length, total: robotsKnown && sitemapFamilies.every(item => item.status === 'pass') && !sitemapQueue.length ? uniqueSitemapUrls.length : null, unit: 'unique URLs', note: `${robotsKnown && sitemapFamilies.every(item => item.status === 'pass') && !sitemapQueue.length ? 'All declared URLs inventoried' : 'Only available complete sitemap records inventoried; complete denominator unmeasured'}; HTTP responses measured only in bounded cohorts, not all sitemap URLs` },
    { id: 'html', label: 'Selected public HTML', checked: htmlResults.filter(item => item.route.httpStatus && !item.route.error).length, total: HTML_PATHS.length, unit: 'selected routes', note: `Purposive cohort spans identity, publishing, agents, local, articles and interactive pages; not a random sample of ${uniqueSitemapUrls.length} sitemap URLs` },
    { id: 'machine', label: 'Selected machine discovery', checked: discovery.filter(item => item.route.httpStatus && !item.route.error).length, total: discovery.length, unit: 'selected surfaces', note: 'Curated discovery/feeds/JSON/OpenAPI/MCP GET cohort; complete machine endpoint universe not enumerated' },
    { id: 'gates', label: 'Method and audience checks', checked: gates.filter(item => item.route.httpStatus && !item.route.error).length, total: gates.length, unit: 'selected probes', note: 'Unauthenticated GET only; no POST, signing, wallet, payment, action or receipt verification' },
    { id: 'links', label: 'Internal href sample', checked: linkResults.filter(item => item.httpStatus && !item.error).length, total: uniqueLinks.length, unit: 'eligible unique links', note: `${sampledLinks.length} deterministic spread sample from selected HTML; query, action/admin/account and asset hrefs excluded` },
    { id: 'bots', label: 'Named bot root requests', checked: botChecks.filter(item => item.userAgent && item.httpStatus && !item.error).length, total: BOTS.filter(item => !item[0].endsWith('-Extended')).length, unit: 'synthetic User-Agents', note: 'Root GET only, audit network; 2 additional Extended policy tokens evaluated without HTTP requests' },
    { id: 'visibility', label: 'Real search / AI visibility', checked: 0, total: null, unit: 'provider outcomes', note: 'No authorized provider analytics, verified crawler logs or repeatable query/citation study in this snapshot' },
  ];
  const completedAt = new Date().toISOString();
  const command = 'node scripts/audit-discovery.mjs --output public/audits/discovery-YYYY-MM-DD.json --references public/audits/discovery-standards.json';
  const methodology = { command, readOnly: true, methods: ['GET'], credentials: false, concurrency: 4, requestCount: httpCache.size, htmlSelection: 'Fixed purposive cohort listed in the script', internalLinkSelection: 'Unique eligible on-origin hrefs sorted and evenly sampled', maxInternalLinks: maxLinks, requestTimeoutMs: 15000, maxResponseBytes: 8000000, script: 'scripts/audit-discovery.mjs', reproduction: command, ...(sourceRef ? { sourceReviewedRef: sourceRef, sourceReviewNote: 'Source-informed rationale belongs to this reviewed public revision. Future reruns omit it unless --source-ref is supplied after a fresh source review.' } : {}) };
  const snapshot = { schemaVersion: 1, title: 'PointCast discovery audit', startedAt, completedAt, site: origin, interpretation: { geo: 'Generative-engine optimization / AI-search discoverability', type: 'Dated production snapshot captured before dashboard publication', staleness: 'Not live monitoring. Manual regeneration replaces this frozen snapshot after site changes.', referenceSummaries: 'Audit interpretations of primary documentation, rather than direct quotations or claims about measured PointCast visibility.' }, methodology, method: methodology, coverage, sitemapFamilies, sitemapInventory: { entries: sitemapRecords.length, uniqueExactUrls: uniqueSitemapUrls.length, uniqueNormalizedUrls: normalizedSitemapUrls.size, blockedByGooglebotCount: robotsKnown ? sitemapBlocked.length : null, publicPrefixCollisionCount: robotsKnown ? publicPrefixBlocked.length : null, intentionalExclusionCount: robotsKnown ? sitemapBlocked.length - publicPrefixBlocked.length : null, blockedExamples: publicPrefixBlocked, urlsets: sitemapFamilies.filter(item => item.kind === 'urlset').length }, routes: routes.sort((a, b) => a.kind.localeCompare(b.kind) || a.path.localeCompare(b.path)), findings: findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.id.localeCompare(b.id)), botChecks, limitations: [
    'A dated snapshot of public responses. No monitoring schedule, search-provider index/ranking/traffic data, verified crawler visits, or AI citation study is included.',
    'Synthetic User-Agents come from the audit network, not verified provider IPs. A successful request does not prove real crawler access, indexing, ranking or citation.',
    'All declared sitemap families are parsed and counted, but only selected route and link cohorts are fetched. Counts are explicit denominators, not an SEO/GEO performance score.',
    'HTML inspection uses dependency-free bounded markup parsing. Candidate server text is not computed CSS visibility or browser rendering; JavaScript interactions, screenshots, schema.org rich-result eligibility and accessibility are not tested here.',
    'No credentials, cookies, authorization headers, wallet signing, payments, mutations or POST requests. Expected authentication/payment/method/preview gates do not certify their authorized runtime behavior.',
    'Source-informed findings use public repository file URLs for rationale. Runtime public observations are timestamped; generation timestamps and sitemap lastmod are not assumed to prove editorial freshness.',
    'HTTP/XML/JSON syntax and contract checks do not establish factual truth, rights, editorial quality, full endpoint coverage or provider support for custom agents.json/llms formats.',
  ], references };
  const errors = validateSnapshot(snapshot); if (errors.length) throw new Error(errors.join('\n'));
  return snapshot;
}

async function main() {
  const args = process.argv.slice(2); const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
  if (args.includes('--help') || args.includes('-h')) { console.log('Read-only public discovery audit (Node 22+).\nUsage: node scripts/audit-discovery.mjs [--site https://pointcast.xyz] [--output public/audits/discovery-YYYY-MM-DD.json] [--max-links 0..100] [--references public/audits/discovery-standards.json] [--source-ref reviewed-public-40-char-SHA]\nGET only. No credentials, POSTs, payments or real crawler/index/ranking claims. --source-ref attaches source-informed rationale only after separate review.'); return; }
  const site = option('--site', 'https://pointcast.xyz'); const url = new URL(site);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('HTTPS required except local fixtures');
  const maxLinks = Number(option('--max-links', '36')); if (!Number.isInteger(maxLinks) || maxLinks < 0 || maxLinks > 100) throw new Error('--max-links must be 0–100');
  const output = resolve(option('--output', `public/audits/discovery-${new Date().toISOString().slice(0, 10)}.json`));
  let references = []; const referenceFile = option('--references', '');
  const sourceRef = option('--source-ref', ''); if (sourceRef && !/^[a-f0-9]{40}$/i.test(sourceRef)) throw new Error('--source-ref must be a reviewed public 40-character commit SHA');
  if (referenceFile) { const standards = JSON.parse(await readFile(referenceFile, 'utf8')); references = (standards.sources ?? []).map(source => ({ title: source.title, url: source.url, publisher: source.publisher, checkedAt: source.checkedAt ?? standards.checkedAt, summaryKind: 'Audit interpretation of official guidance', summary: `Audit interpretation: ${source.auditInference ?? ''}` })); }
  const snapshot = await audit({ site, maxLinks, references, sourceRef }); await mkdir(dirname(output), { recursive: true }); await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
  const count = status => snapshot.findings.filter(item => item.status === status).length;
  console.log(`Wrote ${output}\n${snapshot.startedAt} – ${snapshot.completedAt}\n${snapshot.routes.length} route observations; ${snapshot.sitemapInventory.uniqueExactUrls} unique sitemap URLs; ${count('fail')} failing, ${count('warn')} warning, ${count('expected')} expected, ${count('unmeasured')} unmeasured findings.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
