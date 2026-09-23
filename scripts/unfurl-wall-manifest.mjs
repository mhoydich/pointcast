#!/usr/bin/env node
/**
 * The Unfurl Wall manifest — every built page's own unfurl, read from dist.
 *
 * Runs after `astro build` (see the `build` script). Walks dist/**\/index.html,
 * reads each page's og:title and og:image exactly as shipped, and writes
 * dist/unfurl-wall.json for /unfurl-wall to scroll. The page applies the same
 * request-time plan the middleware does (src/lib/unfurl/plan.mjs), so what it
 * shows is what a crawler would get right now.
 *
 * Skipped: noindex pages, meta-refresh redirect stubs, and pages without a
 * title. Paths are stored without the origin to keep the file small.
 *
 *   node scripts/unfurl-wall-manifest.mjs [distDir]
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(process.argv[2] ?? 'dist');
const ORIGIN = 'https://pointcast.xyz';

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_') || entry.name === 'images' || entry.name === 'assets') continue;
      yield* htmlFiles(full);
    } else if (entry.name === 'index.html') {
      yield full;
    }
  }
}

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

function meta(head, attr, name) {
  const re = new RegExp(`<meta[^>]+${attr}="${name}"[^>]*>`, 'i');
  const tag = head.match(re)?.[0];
  return tag ? decode(tag.match(/content="([^"]*)"/i)?.[1] ?? '') : '';
}

function stripOrigin(url) {
  return url.startsWith(ORIGIN) ? url.slice(ORIGIN.length) || '/' : url;
}

export async function buildManifest(dist = DIST) {
  const cards = [];
  for await (const file of htmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    const head = html.slice(0, html.search(/<\/head>/i) + 1 || 20000);
    if (/<meta[^>]+http-equiv="refresh"/i.test(head)) continue;
    if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(head)) continue;
    const rel = path.relative(dist, path.dirname(file)).split(path.sep).join('/');
    const p = rel ? `/${rel}` : '/';
    if (p === '/unfurl-wall') continue;
    const title = (meta(head, 'property', 'og:title') || decode(head.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ''))
      .replace(/\s+[—|–·:-]\s+PointCast$/i, '').trim();
    if (!title) continue;
    const card = { p, t: title.slice(0, 140) };
    const image = meta(head, 'property', 'og:image') || meta(head, 'name', 'twitter:image');
    if (image) card.i = stripOrigin(image);
    cards.push(card);
  }
  cards.sort((a, b) => a.p.localeCompare(b.p));
  return { spec: 'pointcast.unfurl-wall/v1', generatedAt: new Date().toISOString(), count: cards.length, cards };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifest = await buildManifest();
  await writeFile(path.join(DIST, 'unfurl-wall.json'), JSON.stringify(manifest));
  console.log(`[unfurl-wall] ${manifest.count} unfurls → dist/unfurl-wall.json`);
}
