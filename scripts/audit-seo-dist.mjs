#!/usr/bin/env node
// Exhaustive on-page SEO/AEO report over a built dist/. Read-only, never fails the build:
//   npm run build:bare && npm run audit:seo
// Complements scripts/seo-scan.mjs (the test-enforced invariants) with the softer
// signals: social tags, Article fields, alt text, title length, thin pages,
// duplicate titles, sitemap coverage and internal links.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = process.argv[2] ?? join(ROOT, 'dist');
const PUB = process.argv[3] ?? join(ROOT, 'public');
const FN = join(ROOT, 'functions');
const ORIGIN = 'https://pointcast.xyz';
const noindexRules = await import(new URL('../src/lib/seo-rules.mjs', import.meta.url));
const walk = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); const s = statSync(p); s.isDirectory() ? walk(p, out) : f === 'index.html' && out.push(p); } return out; };
const pathFor = (f) => { let p = '/' + relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, ''); return p; };
const attr = (t, n) => t.match(new RegExp(`\\b${n}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? '';
const tags = (h, n) => [...h.matchAll(new RegExp(`<${n}\\b[^>]*>`, 'gi'))].map(m => m[0]);
const txt = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const assetExists = (u) => { if (!u.startsWith(ORIGIN + '/') && !u.startsWith('/')) return 'external'; const p = u.replace(ORIGIN, '').split('?')[0]; if (p.startsWith('/og/') || p.startsWith('/api/')) return 'function'; return existsSync(join(DIST, p)) || existsSync(join(PUB, p)) ? 'ok' : 'MISSING'; };
const issues = {};
const add = (k, p, extra = '') => (issues[k] ??= []).push(p + (extra ? `  ${extra}` : ''));
const files = walk(DIST);
let indexable = 0;
const sitemapUrls = new Set();
for (const f of readdirSync(DIST)) if (/^sitemap.*\.xml$/.test(f)) for (const m of readFileSync(join(DIST, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(m[1].replace(ORIGIN, '').replace(/\/$/, '') || '/');
const seenTitles = new Map(), seenDesc = new Map();
for (const f of files) {
  const p = pathFor(f); const html = readFileSync(f, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html) && /name=["']robots["'][^>]*noindex/i.test(html)) continue; // Astro redirect stub
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const robots = tags(head, 'meta').filter(t => attr(t, 'name').toLowerCase() === 'robots').map(t => attr(t, 'content')).join(' ');
  const noindex = /noindex/i.test(robots) || noindexRules.isNoindexPath(p);
  if (noindex) { if (sitemapUrls.has(p.replace(/\/$/, '') || '/')) add('noindex page listed in sitemap', p); continue; }
  indexable++;
  const title = txt(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const titles = (head.match(/<title\b/gi) || []).length;
  const desc = tags(head, 'meta').filter(t => attr(t, 'name').toLowerCase() === 'description').map(t => attr(t, 'content'));
  const canon = tags(head, 'link').filter(t => /\bcanonical\b/i.test(attr(t, 'rel'))).map(t => attr(t, 'href'));
  const og = Object.fromEntries(tags(head, 'meta').filter(t => attr(t, 'property').toLowerCase().startsWith('og:')).map(t => [attr(t, 'property').toLowerCase(), attr(t, 'content')]));
  const tw = Object.fromEntries(tags(head, 'meta').filter(t => attr(t, 'name').toLowerCase().startsWith('twitter:')).map(t => [attr(t, 'name').toLowerCase(), attr(t, 'content')]));
  const h1 = (html.match(/<h1\b/gi) || []).length;
  const lang = attr(tags(html, 'html')[0] ?? '', 'lang');
  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const imgs = tags(html, 'img'); const noAlt = imgs.filter(t => !/\balt\s*=/i.test(t)).length;
  const bodyText = txt(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<head[\s\S]*?<\/head>/gi, ' '));
  const words = bodyText.split(' ').filter(Boolean).length;
  if (titles !== 1) add('title count != 1', p, String(titles));
  if (!title) add('empty title', p); else if (title.length > 70) add('title > 70 chars', p, `${title.length}: ${title.slice(0,60)}…`); else if (title.length < 15) add('title < 15 chars', p, title);
  if (desc.length !== 1) add('description count != 1', p, String(desc.length)); else if (desc[0].length < 50) add('description < 50 chars', p, `${desc[0].length}`); else if (desc[0].length > 170) add('description > 170 chars', p, `${desc[0].length}`);
  if (canon.length !== 1) add('canonical count != 1', p, String(canon.length)); else { const want = ORIGIN + p; if (canon[0] !== want && canon[0] !== want.replace(/\/$/, '')) add('canonical mismatch', p, canon[0]); }
  if (!og['og:title']) add('no og:title', p); if (!og['og:description']) add('no og:description', p); if (!og['og:image']) add('no og:image', p); else { const r = assetExists(og['og:image']); if (r === 'MISSING') add('og:image asset missing', p, og['og:image']); }
  if (og['og:url'] && og['og:url'] !== ORIGIN + p && og['og:url'] !== (ORIGIN + p).replace(/\/$/, '')) add('og:url mismatch', p, og['og:url']);
  if (!tw['twitter:card']) add('no twitter:card', p);
  if (h1 !== 1) add('h1 count != 1', p, String(h1));
  if (!lang) add('no lang', p);
  if (!ld.length) add('no JSON-LD', p); else for (const j of ld) { try { const d = JSON.parse(j); const types = d['@graph'] ? d['@graph'].map(x => x['@type']) : [d['@type']]; if (types.includes('Article') || types.includes('BlogPosting')) { const a = (d['@graph'] || [d]).find(x => x['@type'] === 'Article' || x['@type'] === 'BlogPosting'); if (!a.datePublished) add('Article JSON-LD without datePublished', p); if (!a.image) add('Article JSON-LD without image', p); if (!a.author) add('Article JSON-LD without author', p); } } catch { add('invalid JSON-LD', p); } }
  if (noAlt) add('img without alt', p, `${noAlt}/${imgs.length}`);
  if (words < 60) add('thin content (<60 words)', p, String(words));
  if (!sitemapUrls.has(p.replace(/\/$/, '') || '/')) add('indexable page NOT in any sitemap', p);
  const tk = title.toLowerCase(); if (seenTitles.has(tk)) add('duplicate title', p, `same as ${seenTitles.get(tk)}`); else seenTitles.set(tk, p);
  if (desc[0]) { const dk = desc[0].toLowerCase(); if (seenDesc.has(dk)) add('duplicate description', p, `same as ${seenDesc.get(dk)}`); else seenDesc.set(dk, p); }
  // internal links to non-existent pages
  for (const a of tags(html, 'a')) { const href = attr(a, 'href'); if (!href.startsWith('/') || href.startsWith('//')) continue; const path = href.split('#')[0].split('?')[0]; if (!path || path === '/') continue; if (path.startsWith('/api/') || path.startsWith('/og/') || path.startsWith('/_/') || path.includes('${')) continue; const fnBase = path.replace(/\/$/, '').replace(/^\//, ''); if ([join(FN, fnBase + '.ts'), join(FN, fnBase), join(FN, fnBase + '/index.ts')].some(existsSync)) continue; const cands = [join(DIST, path), join(DIST, path, 'index.html'), join(DIST, path + '.html'), join(PUB, path), join(PUB, path, 'index.html')]; if (!cands.some(existsSync)) add('internal link to missing path', p, href); }
}
// sitemap entries with no page
for (const u of sitemapUrls) { const path = u === '/' ? '/' : u + '/'; if (path.endsWith('.json/') || path.endsWith('.xml/') || path.endsWith('.md/') || path.endsWith('.txt/')) continue; if (!existsSync(join(DIST, path, 'index.html')) && !existsSync(join(DIST, u)) && !existsSync(join(PUB, path, 'index.html'))) add('sitemap URL with no built page', u); }
console.log(`pages: ${files.length}  indexable: ${indexable}  sitemap urls: ${sitemapUrls.size}\n`);
for (const [k, v] of Object.entries(issues).sort((a, b) => b[1].length - a[1].length)) { console.log(`## ${k}  (${v.length})`); for (const x of v.slice(0, 25)) console.log('  ' + x); if (v.length > 25) console.log(`  … +${v.length - 25} more`); console.log(); }
