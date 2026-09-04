#!/usr/bin/env node
/**
 * Audits rendered PointCast HTML without adding a parser dependency. It is
 * deliberately conservative: only same-origin OG assets are checked locally,
 * and machine endpoints are not treated as HTML pages.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_ORIGIN = 'https://pointcast.xyz';
const root = fileURLToPath(new URL('..', import.meta.url));
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? '';
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
const normalize = (value) => value.replace(/\s+/g, ' ').trim();

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}

export function pathForHtml(file, distDir) {
  const local = relative(distDir, file).replace(/\\/g, '/');
  if (local === 'index.html') return '/';
  if (local.endsWith('/index.html')) return `/${local.slice(0, -'index.html'.length)}`;
  return `/${local.slice(0, -'.html'.length)}`;
}

function assetsExist(href, distDir, publicDir) {
  if (!href || href.startsWith('data:')) return Boolean(href);
  let url;
  try { url = new URL(href, SITE_ORIGIN); } catch { return false; }
  if (url.origin !== SITE_ORIGIN) return true;
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  return existsSync(join(distDir, pathname)) || existsSync(join(publicDir, pathname));
}

function sitemapUrls(distDir) {
  const urls = new Set();
  for (const name of ['sitemap-index.xml', 'sitemap-discovery.xml', 'sitemap-blocks.xml']) {
    const file = join(distDir, name);
    if (!existsSync(file)) continue;
    for (const match of readFileSync(file, 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)) urls.add(match[1]);
  }
  return urls;
}

export function scan({ distDir = join(root, 'dist'), publicDir = join(root, 'public') } = {}) {
  if (!existsSync(distDir)) return { skipped: true, reason: `dist directory not found: ${distDir}`, pages: [], defects: {} };
  const sitemap = sitemapUrls(distDir);
  const pages = walk(distDir).map((file) => {
    const html = readFileSync(file, 'utf8');
    const path = pathForHtml(file, distDir);
    const expectedCanonical = `${SITE_ORIGIN}${path}`;
    const titleTags = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    const title = titleTags.length === 1 ? normalize(titleTags[0][1]) : '';
    const descriptions = tags(html, 'meta').filter((tag) => attr(tag, 'name').toLowerCase() === 'description').map((tag) => attr(tag, 'content'));
    const canonicals = tags(html, 'link').filter((tag) => attr(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical')).map((tag) => attr(tag, 'href'));
    const ogImages = tags(html, 'meta').filter((tag) => attr(tag, 'property').toLowerCase() === 'og:image').map((tag) => attr(tag, 'content'));
    const robots = tags(html, 'meta').filter((tag) => attr(tag, 'name').toLowerCase() === 'robots').map((tag) => attr(tag, 'content').toLowerCase());
    const jsonLd = [...html.matchAll(/<script\b[^>]*type=(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[2].trim());
    const jsonLdErrors = jsonLd.flatMap((value, i) => { try { JSON.parse(value); return []; } catch (error) { return [`JSON-LD ${i + 1}: ${error.message}`]; } });
    return {
      file: relative(distDir, file), path, url: expectedCanonical, title, titleCount: titleTags.length,
      description: descriptions[0] ?? '', descriptionCount: descriptions.length,
      canonical: canonicals[0] ?? '', canonicalCount: canonicals.length,
      h1Count: tags(html, 'h1').length, ogImage: ogImages[0] ?? '', ogImageCount: ogImages.length,
      noindex: robots.some((value) => value.includes('noindex')), lang: attr(tags(html, 'html')[0] ?? '', 'lang'),
      jsonLdCount: jsonLd.length, jsonLdErrors, inSitemap: sitemap.has(expectedCanonical),
    };
  });
  const defectMap = new Map();
  const add = (kind, page, detail = '') => { const list = defectMap.get(kind) ?? []; list.push({ path: page.path, detail }); defectMap.set(kind, list); };
  const byTitle = new Map(); const byDescription = new Map();
  for (const page of pages) {
    if (page.title) (byTitle.get(page.title) ?? byTitle.set(page.title, []).get(page.title)).push(page);
    if (page.description) (byDescription.get(page.description) ?? byDescription.set(page.description, []).get(page.description)).push(page);
    if (page.titleCount !== 1) add('title: count is not one', page, String(page.titleCount));
    if (page.title.length > 60) add('title: over 60 characters', page, `${page.title.length}: ${page.title}`);
    if (/— PointCast — PointCast|\| PointCast \| PointCast/i.test(page.title)) add('title: doubled PointCast branding', page, page.title);
    if (page.descriptionCount !== 1) add('description: count is not one', page, String(page.descriptionCount));
    if (page.description && (page.description.length < 50 || page.description.length > 160)) add('description: outside 50–160 characters', page, `${page.description.length}: ${page.description}`);
    if (page.canonicalCount !== 1) add('canonical: count is not one', page, String(page.canonicalCount));
    if (page.canonical && page.canonical !== page.url) add('canonical: not self', page, page.canonical);
    if (page.canonical.includes('://www.')) add('canonical: www host', page, page.canonical);
    if (page.h1Count !== 1) add('h1: count is not one', page, String(page.h1Count));
    if (page.ogImageCount !== 1) add('og:image: count is not one', page, String(page.ogImageCount));
    if (page.ogImage && !assetsExist(page.ogImage, distDir, publicDir)) add('og:image: missing local asset', page, page.ogImage);
    if (page.noindex && page.inSitemap) add('noindex page appears in sitemap', page);
    if (!page.lang) add('html: missing lang', page);
    if (!page.jsonLdCount) add('JSON-LD: missing', page);
    for (const error of page.jsonLdErrors) add('JSON-LD: invalid', page, error);
  }
  for (const [value, matches] of byTitle) if (matches.length > 1) for (const page of matches) add('title: duplicate', page, value);
  for (const [value, matches] of byDescription) if (matches.length > 1) for (const page of matches) add('description: duplicate', page, value);
  return { skipped: false, pages, defects: Object.fromEntries([...defectMap].sort(([a], [b]) => a.localeCompare(b))) };
}

export function report(result) {
  if (result.skipped) return `# PointCast on-page SEO scan\n\nSkipped: ${result.reason}\n`;
  const lines = ['# PointCast on-page SEO scan', '', `Pages scanned: ${result.pages.length}`, '', '## Defect summary', '', '| Defect class | Count |', '| --- | ---: |'];
  const entries = Object.entries(result.defects);
  if (!entries.length) lines.push('| None | 0 |');
  for (const [kind, examples] of entries) lines.push(`| ${kind} | ${examples.length} |`);
  for (const [kind, examples] of entries) {
    lines.push('', `## ${kind} (${examples.length})`, '');
    for (const { path, detail } of examples.slice(0, 20)) lines.push(`- \`${path}\`${detail ? ` — ${detail}` : ''}`);
    if (examples.length > 20) lines.push(`- … ${examples.length - 20} more`);
  }
  return `${lines.join('\n')}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(report(scan()));
