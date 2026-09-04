/** Rendered-page SEO normalizer. Head metadata is deliberately scoped to the
 * document head: SVG titles are accessible labels, not page titles. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ogAssetExists, routeExists } from './seo-paths.mjs';

const ORIGIN = 'https://pointcast.xyz';
const FALLBACK_IMAGE = `${ORIGIN}/images/og/og-home-v5.png`;
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
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

function headParts(html) {
  const match = html.match(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i);
  return match ? { match, open: match[1], content: match[2], close: match[3] } : null;
}

function titleFor(head, html) {
  const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titles.length) {
    const raw = text(titles[0][1]);
    // This is the sole existing-title edit: repair a literal accidental double.
    return { title: raw.replace(/ — PointCast — PointCast$/i, ' — PointCast'), existing: true };
  }
  const h1 = tag(html, 'h1')[0]?.[0] ?? '';
  const raw = text(h1.replace(/^<h1[^>]*>|<\/h1>$/gi, '')) || 'PointCast';
  const plain = raw.replace(/(?:\s*[—|·]\s*PointCast(?:\s+reader)?)+$/i, '').trim() || 'PointCast';
  const suffix = plain === 'PointCast' ? '' : ' — PointCast';
  return { title: `${clip(plain, 60 - suffix.length)}${suffix}`, existing: false };
}

function descriptionFor(head, html, path, title) {
  const existing = tag(head, 'meta').find((entry) => attr(entry[0], 'name').toLowerCase() === 'description');
  const candidate = existing ? attr(existing[0], 'content') : lead(html, title);
  // A previous normalizer run has already bounded this metadata. Preserve it
  // byte-for-byte rather than clipping an ellipsis or re-appending a suffix.
  if (existing && candidate.length >= 50 && candidate.length <= 160) return candidate;
  const suffix = path.startsWith('/sparrow/') ? ' Read in Sparrow, the PointCast reader.' : '';
  const base = clip(candidate, 160 - suffix.length);
  if (base.length >= 50) return `${base}${suffix}`;
  const fromLead = clip(lead(html, title), 160 - suffix.length);
  return `${fromLead.length >= 50 ? fromLead : `${title} is a PointCast directory of links, notes, and useful routes.`}${suffix}`;
}

function removeMeta(head, predicate) {
  return head.replace(/<meta\b[^>]*>/gi, (value) => predicate(value) ? '' : value);
}

function routeLabel(path) {
  const bits = path.split('/').filter(Boolean);
  if (bits[0] === 'sparrow' && bits[1] === 'b') return `Sparrow block ${bits.at(-1)}`;
  if (bits[0] === 'b') return `Block ${bits.at(-1)}`;
  return bits.at(-1)?.replace(/[-_]/g, ' ') || 'PointCast';
}

function uniqueDescription(description, path) {
  const suffix = ` (${routeLabel(path)})`;
  return `${clip(description, 160 - suffix.length)}${suffix}`;
}

function breadcrumb(path, title, roots) {
  const bits = path.split('/').filter(Boolean);
  if (bits.length < 2) return null;
  const list = [{ '@type': 'ListItem', position: 1, name: 'PointCast', item: ORIGIN }];
  let current = '';
  for (const [index, bit] of bits.entries()) {
    current += `/${bit}`;
    const itemPath = `${current}${index === bits.length - 1 && path.endsWith('/') ? '/' : ''}`;
    if (!routeExists(`${ORIGIN}${itemPath}`, roots)) continue;
    list.push({ '@type': 'ListItem', position: list.length + 1, name: index === bits.length - 1 ? title.replace(/ — PointCast$/, '') : bit.replace(/-/g, ' '), item: `${ORIGIN}${itemPath}` });
  }
  return list.length > 1 ? { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list } : null;
}

export function countSvgTitles(html) {
  return [...html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi)].reduce((total, match) => total + [...match[0].matchAll(/<title\b[^>]*>[\s\S]*?<\/title>/gi)].length, 0);
}

function normalizePage(html, path, roots) {
  const parts = headParts(html);
  if (!parts) return html;
  let head = parts.content;
  const canonical = `${ORIGIN}${path}`;
  const titleInfo = titleFor(head, html);
  const description = descriptionFor(head, html, path, titleInfo.title);
  const titleTags = [...head.matchAll(/<title\b[^>]*>[\s\S]*?<\/title>/gi)];
  if (!titleInfo.existing) head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
  else if (titleTags.length === 1 && text(titleTags[0][0]) !== titleInfo.title) head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${titleInfo.title}</title>`);
  head = head.replace(/<meta\b[^>]*name=(["'])description\1[^>]*>/gi, '').replace(/<link\b[^>]*rel=(["'])canonical\1[^>]*>/gi, '');

  const og = tag(head, 'meta').filter((entry) => attr(entry[0], 'property').toLowerCase() === 'og:image');
  const validOg = og.length === 1 && ogAssetExists(attr(og[0][0], 'content'), roots);
  if (!validOg) {
    head = removeMeta(head, (value) => {
      const property = attr(value, 'property').toLowerCase();
      const name = attr(value, 'name').toLowerCase();
      return property === 'og:image' || property.startsWith('og:image:') || name === 'twitter:image' || name.startsWith('twitter:image:');
    });
  }
  const inserted = `${titleInfo.existing ? '' : `<title>${titleInfo.title}</title>`}<meta name="description" content="${description.replace(/"/g, '&quot;')}"><link rel="canonical" href="${canonical}">`;
  head = `${inserted}${head}`;
  if (!validOg) head += `<meta property="og:image" content="${FALLBACK_IMAGE}"><meta property="og:image:type" content="image/png">`;
  html = html.replace(parts.match[0], `${parts.open}${head}${parts.close}`);

  if (!/\blang=/i.test(tag(html, 'html')[0]?.[0] ?? '')) html = html.replace(/<html(\b[^>]*)>/i, '<html$1 lang="en">');
  // Never demote authored H1s: intentional secondary H1s carry JS/style hooks.
  if (!tag(html, 'h1').length) html = html.replace(/<body(\b[^>]*)>/i, `<body$1><h1 class="pc-seo-heading">${titleInfo.title.replace(/ — PointCast$/, '')}</h1>`);
  if (!/application\/ld\+json/i.test(html)) {
    const data = breadcrumb(path, titleInfo.title, roots) ?? { '@context': 'https://schema.org', '@type': 'WebPage', name: titleInfo.title.replace(/ — PointCast$/, ''), url: canonical, description, inLanguage: 'en' };
    html = html.replace(/<\/head>/i, `<script type="application/ld+json">${JSON.stringify(data)}</script></head>`);
  }
  if (!html.includes('.pc-seo-heading')) html = html.replace(/<\/head>/i, '<style>.pc-seo-heading{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}</style></head>');
  return html;
}

export function normalizeGeneratedSeo(outDir, logger = console) {
  outDir = outDir instanceof URL ? fileURLToPath(outDir) : outDir;
  const roots = { distDir: outDir, publicDir: join(ROOT, 'public'), functionsDir: join(ROOT, 'functions') };
  let changed = 0;
  const files = walk(outDir);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const next = normalizePage(source, pathFor(file, outDir), roots);
    if (next !== source) { writeFileSync(file, next); changed += 1; }
  }
  const descriptions = new Map();
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const head = headParts(html)?.content ?? '';
    const description = attr(tag(head, 'meta').find((entry) => attr(entry[0], 'name').toLowerCase() === 'description')?.[0] ?? '', 'content');
    if (description) (descriptions.get(description) ?? descriptions.set(description, []).get(description)).push(file);
  }
  for (const [description, matches] of descriptions) {
    if (matches.length < 2) continue;
    for (const file of matches) {
      const route = pathFor(file, outDir);
      const html = readFileSync(file, 'utf8');
      writeFileSync(file, html.replace(/(<meta\b[^>]*name=(["'])description\2[^>]*content=")[^"]*(")/i, (_match, prefix, _quote, suffix) => `${prefix}${uniqueDescription(description, route).replace(/"/g, '&quot;')}${suffix}`));
    }
  }
  logger.info?.(`[seo] normalized metadata for ${changed} generated HTML pages`);
}
