#!/usr/bin/env node
/**
 * indexnow-submit.mjs — post-deploy IndexNow ping helper.
 *
 * Reads the sitemap (or a URL list argument) and POSTs URLs to the
 * PointCast IndexNow endpoint, which forwards to api.indexnow.org
 * once Manus binds INDEXNOW_KEY as a Cloudflare Pages secret.
 *
 * Usage:
 *   # Submit every /b/* URL from the sitemap:
 *   node scripts/indexnow-submit.mjs
 *
 *   # Submit a specific URL:
 *   node scripts/indexnow-submit.mjs https://pointcast.xyz/b/0230
 *
 *   # Submit several:
 *   node scripts/indexnow-submit.mjs https://pointcast.xyz/manifesto \
 *                                    https://pointcast.xyz/glossary
 *
 *   # Submit only the SEO-priority URLs (home + pillars + all 9 channels
 *   # + meta surfaces). Use this right after a deploy that touched any of
 *   # those pages — much faster than sending the whole archive.
 *   node scripts/indexnow-submit.mjs --priority
 *
 * Until INDEXNOW_KEY is bound, the endpoint returns 503 with
 * { reason: 'key-not-bound' } — this script logs the condition and
 * exits 0 (not a failure) so it can be wired into post-deploy CI today
 * and start working the moment the secret lands.
 */

const ENDPOINT = 'https://pointcast.xyz/api/indexnow';
const SITEMAP_URL = 'https://pointcast.xyz/sitemap-0.xml';
const HOST = 'pointcast.xyz';
const PRIORITY_URLS = [
  'https://pointcast.xyz/',
  'https://pointcast.xyz/start',
  'https://pointcast.xyz/share',
  'https://pointcast.xyz/share.json',
  'https://pointcast.xyz/for-agents',
  'https://pointcast.xyz/agents.json',
  'https://pointcast.xyz/collection/visit-nouns',
  'https://pointcast.xyz/local',
  'https://pointcast.xyz/battle',
  'https://pointcast.xyz/ai-stack',
];

/**
 * SEO-priority URLs: the pages where a faster index-refresh compounds
 * the most (home + keyword-targeted pillars + channel landings + meta
 * surfaces). Kept in sync with the footer endpoint list in
 * src/pages/index.astro and the llms.txt pillar section.
 */
const PRIORITY_URLS = [
  'https://pointcast.xyz/',
  'https://pointcast.xyz/start',
  'https://pointcast.xyz/share',
  'https://pointcast.xyz/el-segundo',
  'https://pointcast.xyz/agent-native',
  'https://pointcast.xyz/nouns',
  'https://pointcast.xyz/federated',
  'https://pointcast.xyz/federate',
  'https://pointcast.xyz/manifesto',
  'https://pointcast.xyz/glossary',
  'https://pointcast.xyz/for-agents',
  'https://pointcast.xyz/resources',
  'https://pointcast.xyz/ai-stack',
  'https://pointcast.xyz/beacon',
  'https://pointcast.xyz/local',
  'https://pointcast.xyz/mesh',
  'https://pointcast.xyz/archive',
  'https://pointcast.xyz/collection',
  'https://pointcast.xyz/collection/visit-nouns',
  'https://pointcast.xyz/battle',
  'https://pointcast.xyz/cast',
  'https://pointcast.xyz/drum',
  'https://pointcast.xyz/c/front-door',
  'https://pointcast.xyz/c/court',
  'https://pointcast.xyz/c/spinning',
  'https://pointcast.xyz/c/good-feels',
  'https://pointcast.xyz/c/garden',
  'https://pointcast.xyz/c/el-segundo',
  'https://pointcast.xyz/c/faucet',
  'https://pointcast.xyz/c/visit',
  'https://pointcast.xyz/c/battler',
];

async function fetchSitemapUrls() {
  const r = await fetch(SITEMAP_URL);
  if (!r.ok) throw new Error(`sitemap ${r.status}`);
  const xml = await r.text();
  const matches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g));
  return matches
    .map((m) => m[1])
    .filter((u) => {
      try { return new URL(u).host === HOST; } catch { return false; }
    });
}

async function submit(urls) {
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}

async function main() {
  const argv = process.argv.slice(2);
  let urls;

  const isPriority = argv.includes('--priority');

  if (isPriority) {
    urls = PRIORITY_URLS;
    console.log(`[indexnow] --priority · ${urls.length} SEO-priority URLs`);
  } else if (argv.length > 0) {
    urls = argv.filter((a) => !a.startsWith('--'));
  } else {
    console.log('[indexnow] no URLs specified — pulling priority URLs + all /b/* from sitemap');
    const all = await fetchSitemapUrls();
    urls = [...new Set([...PRIORITY_URLS, ...all.filter((u) => /\/b\/\d{4}\//.test(u))])];
    console.log(`[indexnow] found ${urls.length} URLs`);
  }

  if (urls.length === 0) {
    console.error('[indexnow] no URLs to submit');
    process.exit(1);
  }

  // IndexNow accepts up to 10,000 URLs per request; we're nowhere
  // close but chunk defensively at 500 anyway.
  const chunks = [];
  for (let i = 0; i < urls.length; i += 500) chunks.push(urls.slice(i, i + 500));

  let total = 0;
  for (const chunk of chunks) {
    const result = await submit(chunk);
    if (result.body?.ok) {
      total += chunk.length;
      console.log(`[indexnow] submitted ${chunk.length} URLs (status ${result.body.status ?? result.status})`);
    } else if (result.body?.reason === 'key-not-bound') {
      console.log('[indexnow] endpoint is live but INDEXNOW_KEY not bound — skipping ping');
      console.log('[indexnow]   (bind via Cloudflare Pages env + host the <key>.txt file on the site)');
      return;
    } else {
      console.error('[indexnow] submit failed:', result);
      process.exitCode = 2;
    }
  }

  console.log(`[indexnow] done · ${total} URLs submitted total`);
}

main().catch((err) => {
  console.error('[indexnow] FAILED:', err?.message || err);
  process.exit(1);
});
