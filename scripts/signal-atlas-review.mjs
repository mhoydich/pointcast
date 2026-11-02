/** Export-only review UI. These helpers do not alter the source application. */
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const editionLabel = config => config.variantId === 'ues' ? 'UES · PointCast' : config.variantId === 'el-segundo-university' ? 'UES · El Segundo' : config.brand;
export const reviewStyles = `
.review-home{margin:0;background:#f4f1e7;color:#18352d;font:16px/1.55 Arial,Helvetica,sans-serif}.review-home *{box-sizing:border-box}.review-home main{max-width:1100px;margin:auto;padding:48px 28px 72px}.review-home h1{font:500 clamp(40px,7vw,76px)/1.05 Georgia,serif;letter-spacing:-.04em;margin:18px 0}.review-home h2{font-size:24px;line-height:1.15;margin:12px 0}.review-home p{margin:0 0 18px;max-width:680px}.review-kicker{font:12px/1.5 monospace;letter-spacing:.06em;text-transform:uppercase}.review-home .review-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:32px 0}.review-home .review-card{display:flex;flex-direction:column;align-items:flex-start;border:1px solid #a9b8a9;padding:22px;background:#fffcf2;min-width:0}.review-home .review-card p{font-size:14px}.review-home .review-card a{display:inline-flex;align-items:center;min-height:48px;background:#18352d;color:#fffcf2;padding:10px 16px;margin-top:auto;text-decoration:none;font-weight:600}.review-home a:focus-visible,.edition-review a:focus-visible{outline:3px solid #144fff;outline-offset:4px}.review-home .review-note{border-top:1px solid #a9b8a9;padding-top:22px;font-size:14px}.edition-review{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin:0;padding:14px 32px;background:#18352d;color:#fffcf2;font:14px/1.5 Arial,Helvetica,sans-serif}.edition-review p{margin:0}.edition-review strong{display:block;font-size:16px}.edition-review small{font-size:12px}.edition-review a{display:inline-flex;align-items:center;min-height:44px;padding:8px 14px;border:1px solid #fffcf2;color:inherit;text-decoration:none;white-space:nowrap}.edition-review a:hover{background:#29483e}@media(max-width:760px){.review-home .review-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.review-home main{padding:28px 20px 48px}.review-home .review-grid{grid-template-columns:1fr}.review-home h1{font-size:44px}.edition-review{padding:12px 20px;gap:8px}.edition-review a{width:100%;justify-content:center}}@media(prefers-reduced-motion:reduce){.review-home{scroll-behavior:auto}}
`;

export function renderReviewIndex(configs) {
  const parents = new Map(configs.map(config => [config.variantId, config.brand]));
  const cards = configs.map(config => {
    const university = config.variantId !== config.homeSiteId;
    const href = './' + config.variantId + '/public' + config.canonicalPath;
    return '<article class="review-card"><span class="review-kicker">' + (university ? 'University edition' : 'Site edition') + '</span><h2>' + escape(editionLabel(config)) + '</h2><p>Parent collection: <strong>' + escape(parents.get(config.homeSiteId)) + '</strong>.<br>' + (university ? 'A learning view, with no separate visit count or league score.' : 'A local preview of this site’s collection.') + '</p><a href="' + href + '" aria-label="Open ' + escape(editionLabel(config)) + ' preview">Open this preview <span aria-hidden="true">↗</span></a></article>';
  }).join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Five local Signal Atlas review editions. No live traffic or public league results."><title>Signal Atlas — five local previews</title><link rel="stylesheet" href="./review.css"></head><body class="review-home"><main><p class="review-kicker">Signal Atlas / local review</p><h1>Five windows.<br>One curious atlas.</h1><p>Choose an edition to explore. These pages are local previews, with fictional encounters available to try. No live traffic is connected here.</p><p>There are three parent sites. The two university editions belong to their parents and never add another league score.</p><section class="review-grid" aria-label="Choose a local edition">' + cards + '</section><p class="review-note">No account or signup is needed. Nothing is published by opening a preview or checking a practice answer. The local review bar brings you back here from any edition.</p></main></body></html>\n';
}

export const reviewNavigationSource = `
import { SITE_CONFIG, SITE_VARIANTS } from './site-config.mjs';
export function reviewContext(locationHref, moduleHref = import.meta.url) {
  let page, asset;
  try { page = new URL(locationHref); asset = new URL(moduleHref); } catch { return null; }
  if (!['http:', 'https:'].includes(page.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(page.hostname) || page.username || page.password) return null;
  const directory = page.pathname.endsWith('/index.html') ? page.pathname.slice(0, -10) : page.pathname;
  const expected = '/' + SITE_CONFIG.variantId + '/public' + SITE_CONFIG.canonicalPath;
  if (!directory.endsWith(expected) || asset.origin !== page.origin || asset.pathname !== directory + 'review-nav.mjs') return null;
  const depth = SITE_CONFIG.canonicalPath.split('/').filter(Boolean).length + 2;
  return { launcherUrl: new URL('../'.repeat(depth) + 'index.html', asset).href,
    label: SITE_CONFIG.variantId === 'ues' ? 'UES · PointCast' : SITE_CONFIG.variantId === 'el-segundo-university' ? 'UES · El Segundo' : SITE_CONFIG.brand,
    parent: SITE_VARIANTS[SITE_CONFIG.homeSiteId].brand };
}
const context = reviewContext(globalThis.location?.href);
if (context && typeof document !== 'undefined') {
  const nav = document.createElement('nav'); nav.className = 'edition-review'; nav.setAttribute('aria-label', 'Local preview editions');
  const copy = document.createElement('p'); const label = document.createElement('strong'); label.textContent = context.label;
  const note = document.createElement('small'); note.textContent = 'Local preview · parent: ' + context.parent + ' · no live traffic'; copy.append(label, note);
  const back = document.createElement('a'); back.href = context.launcherUrl; back.textContent = 'All five editions →';
  nav.append(copy, back); document.body.prepend(nav);
}
`;
