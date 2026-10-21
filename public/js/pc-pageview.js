// pc-pageview.js — the pageview beacon for pages that do not use the shared
// layouts (the static /chain/* pages: the Block Yard, First Mints, the
// Sanctuary, Mixtape). The same code as src/components/PageviewBeacon.astro,
// which BlockLayout mounts everywhere else (tests/chain-visits.test.mjs keeps
// the two in step).
//
// One path-only event per page load to /api/analytics on this site:
// { event: 'pageview', meta: { path } } and nothing else. No referrer, no
// user-agent, no id, no cookie, no storage, no third party. The endpoint
// samples one in ten and keeps events 90 days, for the project scoreboard
// (/register). Skips obvious bots and any host that is not pointcast.xyz.
(function () {
  try {
    if (!location.hostname.endsWith('pointcast.xyz')) return;
    if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse/i.test(navigator.userAgent)) return;
    var path = location.pathname.replace(/\/+$/, '') || '/';
    var body = JSON.stringify({ event: 'pageview', meta: { path: path.slice(0, 120) } });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }));
    else fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
  } catch (e) {}
})();
