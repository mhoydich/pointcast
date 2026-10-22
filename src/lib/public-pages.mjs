import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isNoindexPath, isRedirectPath } from './seo-rules.mjs';

/**
 * Static pages shipped from public/ as <dir>/index.html. @astrojs/sitemap only
 * knows Astro routes, so without this list they never reach a sitemap.
 * Pages that say noindex themselves, redirect stubs, and ad creatives (which
 * are not index.html) are left out.
 */
export function listPublicIndexPages(publicDir) {
  const pages = [];
  const walk = (dir, route) => {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name);
      if (statSync(file).isDirectory()) { walk(file, `${route}${name}/`); continue; }
      if (name !== 'index.html' || route === '/') continue;
      const html = readFileSync(file, 'utf8');
      if (/<meta\s[^>]*name=["']robots["'][^>]*noindex/i.test(html)) continue;
      if (/http-equiv=["']refresh["']/i.test(html)) continue;
      if (isNoindexPath(route) || isRedirectPath(route)) continue;
      pages.push(route);
    }
  };
  walk(publicDir, '/');
  return pages.sort();
}
