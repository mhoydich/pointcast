/** Source-owned build-time metadata normalizer for standalone Astro surfaces.
 *
 * PointCast has a deliberately broad set of experimental rooms. Some predate
 * BlockLayout, so this runs at Astro's generated-page boundary: it makes their
 * rendered head semantic without changing their visual system or page copy.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://pointcast.xyz';
const FALLBACK_IMAGE = `${ORIGIN}/images/og/og-home-v5.png`;
const tag = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))];
const attr = (value, name) => value.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? '';
const text = (value) => value.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const clip = (value, max) => {
  const clean = text(value);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1).replace(/\s+\S*$/, '').trim();
  return `${cut || clean.slice(0, max - 1).trim()}…`;
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}

function pathFor(file, outDir) {
  const local = relative(outDir, file).replace(/\\/g, '/');
  return local === 'index.html' ? '/' : local.endsWith('/index.html') ? `/${local.slice(0, -'index.html'.length)}` : `/${local.slice(0, -'.html'.length)}`;
}

function lead(html, title) {
  const candidates = [...html.matchAll(/<(?:p|main|article)[^>]*>([\s\S]*?)<\/(?:p|main|article)>/gi)].map((match) => text(match[1]));
  return candidates.find((candidate) => candidate.length >= 50) ?? title;
}

function titleFor(html, path) {
  const current = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  const raw = current.length === 1 ? text(current[0][1]) : text((tag(html, 'h1')[0]?.[0] ?? '').replace(/^<h1[^>]*>|<\/h1>$/gi, '')) || 'PointCast';
  const plain = raw.replace(/(?:\s*[—|·]\s*PointCast(?:\s+reader)?)+$/i, '').trim() || 'PointCast';
  const suffix = plain === 'PointCast' ? '' : ' — PointCast';
  return `${clip(plain, 60 - suffix.length)}${suffix}`;
}

function descriptionFor(html, path, title) {
  const existing = tag(html, 'meta').find((match) => attr(match[0], 'name').toLowerCase() === 'description');
  const candidate = existing ? attr(existing[0], 'content') : lead(html, title);
  const suffix = path.startsWith('/sparrow/') ? ' Read in Sparrow, the PointCast reader.' : '';
  const base = clip(candidate, 160 - suffix.length);
  if (base.length >= 50) return `${base}${suffix}`;
  const fromLead = clip(lead(html, title), 160 - suffix.length);
  return `${fromLead.length >= 50 ? fromLead : `${title} is published at pointcast.xyz.`}${suffix}`;
}

function localAssetExists(href, outDir) {
  try {
    const url = new URL(href, ORIGIN);
    return url.origin !== ORIGIN || existsSync(join(outDir, url.pathname.replace(/^\/+/, '')));
  } catch { return false; }
}

function breadcrumb(path, title) {
  const bits = path.split('/').filter(Boolean);
  if (bits.length < 2) return null;
  const list = [{ '@type': 'ListItem', position: 1, name: 'PointCast', item: ORIGIN }];
  let current = '';
  for (const [index, bit] of bits.entries()) {
    current += `/${bit}`;
    list.push({ '@type': 'ListItem', position: index + 2, name: index === bits.length - 1 ? title.replace(/ — PointCast$/, '') : bit.replace(/-/g, ' '), item: `${ORIGIN}${current}${index === bits.length - 1 && path.endsWith('/') ? '/' : ''}` });
  }
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list };
}

function normalizePage(html, path, outDir) {
  const canonical = `${ORIGIN}${path}`;
  const title = titleFor(html, path);
  const description = descriptionFor(html, path, title);
  html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '').replace(/<meta\b[^>]*name=(["'])description\1[^>]*>/gi, '').replace(/<link\b[^>]*rel=(["'])canonical\1[^>]*>/gi, '');
  const ogPattern = /<meta\b[^>]*property=(["'])og:image\1[^>]*>/gi;
  const og = [...html.matchAll(ogPattern)];
  const validOg = og.length === 1 && localAssetExists(attr(og[0][0], 'content'), outDir);
  if (!validOg) html = html.replace(ogPattern, '');
  const head = `<title>${title}</title><meta name="description" content="${description.replace(/"/g, '&quot;')}"><link rel="canonical" href="${canonical}">`;
  html = html.replace(/<head(\b[^>]*)>/i, `<head$1>${head}`);
  if (!validOg) html = html.replace(/<\/head>/i, `<meta property="og:image" content="${FALLBACK_IMAGE}"></head>`);
  if (!/\blang=/i.test(tag(html, 'html')[0]?.[0] ?? '')) html = html.replace(/<html(\b[^>]*)>/i, '<html$1 lang="en">');
  const h1s = tag(html, 'h1');
  if (!h1s.length) html = html.replace(/<body(\b[^>]*)>/i, `<body$1><h1 class="pc-seo-heading">${title.replace(/ — PointCast$/, '')}</h1>`);
  if (h1s.length > 1) {
    let seen = 0;
    html = html.replace(/<\/?h1\b[^>]*>/gi, (match) => {
      const opening = !match.startsWith('</');
      if (opening) { seen += 1; return seen === 1 ? match : '<div role="heading" aria-level="2">'; }
      return seen <= 1 ? match : '</div>';
    });
  }
  if (!/application\/ld\+json/i.test(html)) {
    const data = breadcrumb(path, title) ?? { '@context': 'https://schema.org', '@type': 'WebPage', name: title.replace(/ — PointCast$/, ''), url: canonical, description, inLanguage: 'en' };
    html = html.replace(/<\/head>/i, `<script type="application/ld+json">${JSON.stringify(data)}</script></head>`);
  }
  if (!html.includes('.pc-seo-heading')) html = html.replace(/<\/head>/i, '<style>.pc-seo-heading{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}</style></head>');
  return html;
}

export function normalizeGeneratedSeo(outDir, logger = console) {
  outDir = outDir instanceof URL ? fileURLToPath(outDir) : outDir;
  let changed = 0;
  const files = walk(outDir);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const next = normalizePage(source, pathFor(file, outDir), outDir);
    if (next !== source) { writeFileSync(file, next); changed += 1; }
  }
  // A few intentional mirrors (notably /b and /sparrow/b) share copy. Add
  // only the true route as a concise, factual disambiguator when necessary.
  const descriptions = new Map();
  const titles = new Map();
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const description = attr(tag(html, 'meta').find((entry) => attr(entry[0], 'name').toLowerCase() === 'description')?.[0] ?? '', 'content');
    const title = text([...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)][0]?.[1] ?? '');
    if (description) (descriptions.get(description) ?? descriptions.set(description, []).get(description)).push(file);
    if (title) (titles.get(title) ?? titles.set(title, []).get(title)).push(file);
  }
  for (const [description, matches] of descriptions) {
    if (matches.length < 2) continue;
    for (const file of matches) {
      const route = pathFor(file, outDir);
      const unique = `${clip(description, 160 - route.length - 1)} ${route}`;
      const html = readFileSync(file, 'utf8');
      writeFileSync(file, html.replace(/(<meta\b[^>]*name=(["'])description\2[^>]*content=")[^"]*(")/i, `$1${unique.replace(/"/g, '&quot;')}$3`));
    }
  }
  for (const [title, matches] of titles) {
    if (matches.length < 2) continue;
    for (const file of matches) {
      const route = pathFor(file, outDir).replace(/^\//, '').replace(/\/$/, '') || 'home';
      const suffix = ` · ${route}`;
      const unique = `${clip(title.replace(/ — PointCast$/, ''), 60 - suffix.length - 12)}${suffix} — PointCast`;
      const html = readFileSync(file, 'utf8');
      writeFileSync(file, html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${unique}</title>`));
    }
  }
  logger.info?.(`[seo] normalized metadata for ${changed} generated HTML pages`);
}
