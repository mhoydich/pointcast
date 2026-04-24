#!/usr/bin/env node
/**
 * pagespeed.mjs — run Google PageSpeed Insights against a list of URLs
 * and print a compact summary table.
 *
 * Requires a Google API key with the PageSpeed Insights API enabled.
 * The unauthenticated quota is small and usually exhausted by other
 * users on the shared pool, so in practice you need your own key:
 *
 *   https://developers.google.com/speed/docs/insights/v5/get-started
 *
 * Usage:
 *   PSI_KEY=... node scripts/pagespeed.mjs             # default URL list
 *   PSI_KEY=... node scripts/pagespeed.mjs https://pointcast.xyz/drum
 *   PSI_KEY=... node scripts/pagespeed.mjs --strategy=desktop
 *
 * Exits 0 even on partial failures so it can be wired into CI as a
 * reporting-only step.
 */

const DEFAULT_URLS = [
  'https://pointcast.xyz/',
  'https://pointcast.xyz/el-segundo',
  'https://pointcast.xyz/agent-native',
  'https://pointcast.xyz/nouns',
  'https://pointcast.xyz/manifesto',
  'https://pointcast.xyz/b/0205',
  'https://pointcast.xyz/c/front-door',
  'https://pointcast.xyz/drum',
  'https://pointcast.xyz/cast',
  'https://pointcast.xyz/collect',
];

const argv = process.argv.slice(2);
const strategyArg = argv.find((a) => a.startsWith('--strategy='));
const strategy = strategyArg ? strategyArg.split('=')[1] : 'mobile';
const urlArgs = argv.filter((a) => !a.startsWith('--'));
const urls = urlArgs.length > 0 ? urlArgs : DEFAULT_URLS;
const key = process.env.PSI_KEY;

if (!key) {
  console.error('[psi] PSI_KEY env var not set. Get one at:');
  console.error('      https://developers.google.com/speed/docs/insights/v5/get-started');
  console.error('      Without a key, the shared quota is usually exhausted.');
  process.exit(1);
}

async function run(url) {
  const params = new URLSearchParams({
    url,
    strategy,
    key,
  });
  for (const cat of ['performance', 'accessibility', 'best-practices', 'seo']) {
    params.append('category', cat);
  }
  const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
  if (!r.ok) return { url, error: `HTTP ${r.status}` };
  const data = await r.json();
  if (data.error) return { url, error: data.error.message };

  const cats = data.lighthouseResult?.categories ?? {};
  const audits = data.lighthouseResult?.audits ?? {};
  const pick = (k) => audits[k]?.displayValue ?? '—';

  return {
    url,
    perf: Math.round((cats.performance?.score ?? 0) * 100),
    a11y: Math.round((cats.accessibility?.score ?? 0) * 100),
    bp: Math.round((cats['best-practices']?.score ?? 0) * 100),
    seo: Math.round((cats.seo?.score ?? 0) * 100),
    lcp: pick('largest-contentful-paint'),
    cls: pick('cumulative-layout-shift'),
    tbt: pick('total-blocking-time'),
    tti: pick('interactive'),
    fcp: pick('first-contentful-paint'),
    wins: Object.values(audits)
      .filter((a) => typeof a.score === 'number' && a.score < 0.9 && (a.details?.overallSavingsMs ?? 0) > 100)
      .sort((a, b) => (b.details.overallSavingsMs ?? 0) - (a.details.overallSavingsMs ?? 0))
      .slice(0, 3)
      .map((a) => `${a.title} (~${Math.round(a.details.overallSavingsMs)}ms)`),
  };
}

console.log(`[psi] strategy=${strategy} · ${urls.length} URLs`);
for (const url of urls) {
  const r = await run(url);
  if (r.error) {
    console.log(`  ✗ ${url}  ${r.error}`);
    continue;
  }
  console.log(`  ${url}`);
  console.log(`    perf=${r.perf} a11y=${r.a11y} bp=${r.bp} seo=${r.seo}  ·  LCP=${r.lcp} CLS=${r.cls} TBT=${r.tbt} TTI=${r.tti}`);
  for (const w of r.wins) console.log(`    · ${w}`);
}
console.log('[psi] done');
