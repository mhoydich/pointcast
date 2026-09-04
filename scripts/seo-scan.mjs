#!/usr/bin/env node
/** Rendered HTML audit. It independently inspects document heads and sitemap
 * output; it does not reuse the normalizer's HTML matching. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ogAssetExists, routeExists } from '../src/lib/seo-paths.mjs';
import { isRedirectPath } from '../src/lib/seo-rules.mjs';

export const SITE_ORIGIN = 'https://pointcast.xyz';
const root = fileURLToPath(new URL('..', import.meta.url));
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? '';
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
const normalize = (value) => value.replace(/\s+/g, ' ').trim();
const head = (html) => html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    if (/^google[a-z0-9]+\.html$/i.test(entry.name)) return [];
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

export function pathForHtml(file, distDir) {
  const local = relative(distDir, file).replace(/\\/g, '/');
  if (local === 'index.html') return '/';
  if (local.endsWith('/index.html')) return `/${local.slice(0, -'index.html'.length)}`;
  return `/${local.slice(0, -'.html'.length)}`;
}

function svgTitleCount(html) {
  return [...html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi)].reduce((count, svg) => count + [...svg[0].matchAll(/<title\b[^>]*>[\s\S]*?<\/title>/gi)].length, 0);
}

function imageType(url) {
  const extension = new URL(url, SITE_ORIGIN).pathname.split('.').pop()?.toLowerCase();
  return ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' })[extension] ?? '';
}

function jsonLdValues(html) {
  return [...html.matchAll(/<script\b[^>]*type=(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[2].trim());
}

function breadcrumbItems(value) {
  const found = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'BreadcrumbList') for (const item of node.itemListElement ?? []) found.push(typeof item.item === 'string' ? item.item : item.item?.['@id']);
    if (Array.isArray(node)) node.forEach(visit);
    else Object.values(node).forEach(visit);
  };
  visit(value);
  return found.filter(Boolean);
}

function sitemapRecords(distDir) {
  const records = [];
  for (const name of ['sitemap-0.xml', 'sitemap-discovery.xml', 'sitemap-blocks.xml']) {
    const file = join(distDir, name);
    if (!existsSync(file)) continue;
    for (const match of readFileSync(file, 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)) records.push({ name, url: match[1] });
  }
  return records;
}

function normalizedSitemapUrl(value) {
  const url = new URL(value);
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href;
}

export function scan({ distDir = join(root, 'dist'), publicDir = join(root, 'public'), functionsDir = join(root, 'functions') } = {}) {
  if (!existsSync(distDir)) return { skipped: true, reason: `dist directory not found: ${distDir}`, pages: [], defects: {} };
  const roots = { distDir, publicDir, functionsDir };
  const sitemap = sitemapRecords(distDir);
  const sitemapUrls = new Set(sitemap.map(({ url }) => url));
  const pages = walk(distDir).map((file) => {
    const html = readFileSync(file, 'utf8');
    const pageHead = head(html);
    const path = pathForHtml(file, distDir);
    const expectedCanonical = `${SITE_ORIGIN}${path}`;
    const titleTags = [...pageHead.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    const title = titleTags.length === 1 ? normalize(titleTags[0][1]) : '';
    const descriptions = tags(pageHead, 'meta').filter((tag) => attr(tag, 'name').toLowerCase() === 'description').map((tag) => attr(tag, 'content'));
    const canonicals = tags(pageHead, 'link').filter((tag) => attr(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical')).map((tag) => attr(tag, 'href'));
    const ogImages = tags(pageHead, 'meta').filter((tag) => attr(tag, 'property').toLowerCase() === 'og:image').map((tag) => attr(tag, 'content'));
    const ogTypes = tags(pageHead, 'meta').filter((tag) => attr(tag, 'property').toLowerCase() === 'og:image:type').map((tag) => attr(tag, 'content'));
    const robots = tags(pageHead, 'meta').filter((tag) => attr(tag, 'name').toLowerCase() === 'robots').map((tag) => attr(tag, 'content').toLowerCase());
    const jsonLd = jsonLdValues(html);
    const jsonLdErrors = jsonLd.flatMap((value, i) => { try { JSON.parse(value); return []; } catch (error) { return [`JSON-LD ${i + 1}: ${error.message}`]; } });
    return {
      file: relative(distDir, file), path, url: expectedCanonical, title, titleCount: titleTags.length,
      description: descriptions[0] ?? '', descriptionCount: descriptions.length,
      canonical: canonicals[0] ?? '', canonicalCount: canonicals.length,
      h1Count: tags(html, 'h1').length, ogImage: ogImages[0] ?? '', ogImageCount: ogImages.length, ogType: ogTypes[0] ?? '',
      noindex: robots.some((value) => value.includes('noindex')), lang: attr(tags(html, 'html')[0] ?? '', 'lang'), svgTitleCount: svgTitleCount(html),
      jsonLdCount: jsonLd.length, jsonLdErrors, jsonLd, inSitemap: sitemapUrls.has(expectedCanonical),
    };
  });
  const defectMap = new Map();
  const add = (kind, page, detail = '') => { const list = defectMap.get(kind) ?? []; list.push({ path: page.path, detail }); defectMap.set(kind, list); };
  const byDescription = new Map();
  for (const page of pages) {
    if (page.description) (byDescription.get(page.description) ?? byDescription.set(page.description, []).get(page.description)).push(page);
    if (page.titleCount !== 1) add('title: head count is not one', page, String(page.titleCount));
    if (/— PointCast — PointCast$/i.test(page.title)) add('title: doubled PointCast branding', page, page.title);
    if (page.descriptionCount !== 1) add('description: count is not one', page, String(page.descriptionCount));
    if (page.description && (page.description.length < 50 || page.description.length > 160)) add('description: outside 50–160 characters', page, `${page.description.length}: ${page.description}`);
    if (page.canonicalCount !== 1) add('canonical: count is not one', page, String(page.canonicalCount));
    if (page.canonical && page.canonical !== page.url) add('canonical: not self', page, page.canonical);
    if (page.canonical.includes('://www.')) add('canonical: www host', page, page.canonical);
    if (page.h1Count !== 1) add('h1: count is not one', page, String(page.h1Count));
    if (page.ogImageCount !== 1) add('og:image: count is not one', page, String(page.ogImageCount));
    if (page.ogImage && !ogAssetExists(page.ogImage, roots)) add('og:image: missing local or Pages Function asset', page, page.ogImage);
    if (page.ogImage && page.ogType && imageType(page.ogImage) && page.ogType !== imageType(page.ogImage)) add('og:image:type does not match image', page, `${page.ogType} for ${page.ogImage}`);
    if (page.noindex && sitemap.some(({ url }) => normalizedSitemapUrl(url) === normalizedSitemapUrl(page.url))) add('noindex page appears in sitemap', page);
    if (!page.lang) add('html: missing lang', page);
    if (!page.jsonLdCount) add('JSON-LD: missing', page);
    for (const error of page.jsonLdErrors) add('JSON-LD: invalid', page, error);
    for (const value of page.jsonLd) {
      try {
        for (const item of breadcrumbItems(JSON.parse(value))) if (!routeExists(item, roots)) add('BreadcrumbList: item does not exist', page, item);
      } catch { /* reported as JSON-LD invalid above */ }
    }
  }
  for (const [value, matches] of byDescription) if (matches.length > 1) for (const page of matches) add('description: duplicate', page, value);
  const sitemapByNormalized = new Map();
  for (const entry of sitemap) {
    const normalized = normalizedSitemapUrl(entry.url);
    (sitemapByNormalized.get(normalized) ?? sitemapByNormalized.set(normalized, []).get(normalized)).push(entry);
    if (isRedirectPath(new URL(entry.url).pathname)) add('sitemap: redirect source', { path: entry.name }, entry.url);
    const page = pages.find((candidate) => normalizedSitemapUrl(candidate.url) === normalized);
    if (page && entry.url !== page.canonical) add('sitemap: non-canonical form', { path: entry.name }, `${entry.url} (canonical ${page.canonical})`);
  }
  for (const [url, entries] of sitemapByNormalized) if (new Set(entries.map(({ name }) => name)).size > 1) for (const entry of entries) add('sitemap: cross-file duplicate', { path: entry.name }, url);
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
