#!/usr/bin/env node
// Readability audit for the static areas under public/: Baby Bonfire, Coast Commons, House
// Channel and Light Companion. Can a search engine, a link-preview bot and an AI agent each read
// every page? Reads the files in this checkout; it fetches nothing and needs no packages.
//
//   node scripts/audit-area-readability.mjs               print the table; exit 1 on any failure
//   node scripts/audit-area-readability.mjs --json=FILE   also save the result as JSON
//
// A page is every index.html under the four folders. Two are private on purpose (the phone
// remote, and the shell that serves every Light circle at /light/c/<id>). They are checked the
// other way round: noindex, and named in no sitemap, llms file, agents index or JSON twin.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://pointcast.xyz';
export const DESCRIPTION_MIN = 70;
export const DESCRIPTION_MAX = 160;

export const AREAS = [
  { id: 'baby-bonfire', name: 'Baby Bonfire', hub: '/baby-bonfire/', twin: '/baby-bonfire.json' },
  { id: 'coast-commons', name: 'Coast Commons', hub: '/coast-commons/', twin: '/coast-commons.json' },
  { id: 'house', name: 'House Channel', hub: '/house/', twin: '/house.json' },
  { id: 'light', name: 'Light Companion', hub: '/light/', twin: '/light.json' },
];
// file path (under public/) -> what it is. Circle pages are served at /light/c/<id>.
export const PRIVATE = {
  '/house/r/': 'the phone remote',
  '/light/circle/': 'the shell behind every /light/c/<id> circle page',
};
// URLs that must appear in no index. A template such as /light/c/{id} documents a link's shape
// and is not a listing.
export const PRIVATE_URL = /\/house\/r\/|\/light\/circle\/|\/light\/c\/(?![{<])/;
// Each area's main pages, which llms.txt must name (llms-full.txt names every public page).
export const MAIN = [
  '/baby-bonfire/', '/baby-bonfire/open-spec/', '/baby-bonfire/open-mesh/', '/baby-bonfire/barter-board/',
  '/baby-bonfire/make-a-piece/', '/baby-bonfire/first-place/', '/baby-bonfire/precedents/', '/baby-bonfire/prayer/', '/baby-bonfire/higher-purpose/', '/baby-bonfire/room/', '/baby-bonfire/ar/',
  '/coast-commons/', '/coast-commons/el-segundo/', '/coast-commons/pattern/', '/coast-commons/sb-surf-house/', '/coast-commons/fresh-milk/',
  '/house/', '/house/about/', '/light/',
];

const LD_OK = new Set(['WebPage', 'CollectionPage', 'CreativeWork']);
const LD_BANNED_TYPES = new Set(['Product', 'Offer', 'AggregateOffer', 'Review', 'AggregateRating', 'MedicalWebPage', 'MedicalCondition', 'HealthTopicContent']);
const LD_BANNED_KEYS = ['offers', 'price', 'priceCurrency', 'aggregateRating', 'review', 'ratingValue'];
// Words the head, the card text and the alt text must not use (the brief's rules for words).
const WORDS = [
  [/cannabis|\bthc\b|\bcbd\b|good feels/i, 'cannabis or company name'],
  [/[$£€]\s?\d|\b\d+\s?(?:usd|dollars)\b|\bbuy\b|add to cart|\bsale price\b/i, 'price or call to buy'],
  [/(?<!not |no |nothing is )for sale/i, 'for sale without a negation'],
  [/\b(?:i|my|me|mine)\b(?!\/)/i, 'first person'],
  [/\b(?:heals?|healing|therapy|therapeutic|cures?|wellness|anxiety|depression|treats?|treatment|relieves?)\b/i, 'health claim'],
  [/\b(?:lights? a real flame (?:remotely|from))\b|ignites? (?:a )?real/i, 'remote real flame'],
];

// ---------------------------------------------------------------- reading HTML

const decode = (s) => String(s ?? '').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i')); return m ? decode(m[1] ?? m[2]) : null; };
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);

/** What the audit reads from one HTML document. */
export function readPage(source) {
  const html = source.replace(/<!--[\s\S]*?-->/g, '');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const metas = tags(head, 'meta');
  const meta = (key, value) => { const all = metas.filter((m) => (attr(m, key) ?? '').toLowerCase() === value); return all.length ? attr(all[0], 'content') ?? '' : null; };
  const links = tags(head, 'link');
  const rel = (name) => links.filter((l) => (attr(l, 'rel') ?? '').toLowerCase() === name);
  const body = html.replace(/<head\b[\s\S]*?<\/head>|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, ' ');
  return {
    lang: attr(tags(html, 'html')[0] ?? '', 'lang'),
    viewport: meta('name', 'viewport'),
    title: decode((head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim()) || null,
    description: meta('name', 'description'),
    robots: meta('name', 'robots'),
    canonical: rel('canonical').length ? attr(rel('canonical')[0], 'href') : null,
    alternates: rel('alternate').filter((l) => attr(l, 'type') === 'application/json').map((l) => attr(l, 'href')),
    og: Object.fromEntries(['title', 'description', 'url', 'type', 'site_name', 'image', 'image:width', 'image:height', 'image:alt'].map((k) => [k, meta('property', `og:${k}`)])),
    twitter: Object.fromEntries(['card', 'title', 'description', 'image', 'image:alt'].map((k) => [k, meta('name', `twitter:${k}`)])),
    h1: tags(body, 'h1').length,
    images: tags(body, 'img').map((t) => ({ src: attr(t, 'src'), alt: attr(t, 'alt') })),
    ld: [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
      try { return { ok: true, data: JSON.parse(m[1]) }; } catch (error) { return { ok: false, error: error.message }; }
    }),
  };
}

function pngSize(file) {
  const b = readFileSync(file);
  return b.length >= 24 && b.readUInt32BE(0) === 0x89504e47 ? { width: b.readUInt32BE(16), height: b.readUInt32BE(20) } : null;
}
const keyIn = (value, keys) => {
  if (!value || typeof value !== 'object') return null;
  for (const [k, v] of Object.entries(value)) if (keys.includes(k) || keyIn(v, keys)) return k;
  return null;
};
const typesIn = (value) => {
  if (!value || typeof value !== 'object') return [];
  return [...[].concat(value['@type'] ?? []), ...Object.values(value).flatMap(typesIn)];
};
/** True where `text` names this exact URL or path, not a longer one that starts with it. */
export function names(text, path) {
  for (const needle of [`${SITE}${path}`, path]) {
    for (let i = text.indexOf(needle); i >= 0; i = text.indexOf(needle, i + 1)) {
      const next = text[i + needle.length] ?? '';
      const before = text[i - 1] ?? '';
      if (!/[\w%.-]/.test(next) && (needle.startsWith('http') || !/[\w.:/-]/.test(before))) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------- the pages

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name === 'index.html' ? [join(dir, e.name)] : []));

export function scopePages(root = ROOT) {
  return AREAS.flatMap((area) => walk(join(root, 'public', area.id)).sort().map((file) => {
    const path = `/${file.slice(join(root, 'public').length + 1).replace(/\\/g, '/').replace(/index\.html$/, '')}`;
    return { path, area, file, private: path in PRIVATE, hub: path === area.hub };
  }));
}

export function sitemapPaths(root = ROOT) {
  const source = readFileSync(join(root, 'src/pages/sitemap-discovery.xml.ts'), 'utf8');
  return new Set([...source.matchAll(/\['https:\/\/pointcast\.xyz([^']+)'/g)].map((m) => m[1]));
}

/** Every object in a JSON twin that carries a url, keyed by that url. */
function twinEntries(json) {
  const out = new Map();
  const visit = (v) => {
    if (Array.isArray(v)) return v.forEach(visit);
    if (!v || typeof v !== 'object') return;
    if (typeof v.url === 'string') out.set(v.url, v);
    Object.values(v).forEach(visit);
  };
  visit(json);
  return out;
}
const said = (entry, keys) => keys.map((k) => entry[k]).find((v) => typeof v === 'string' && v.trim().length > 0);

// ---------------------------------------------------------------- the checks

/** Failures of one public page, as [check, detail] pairs. */
function pageFailures(p, d, root) {
  const out = [];
  const fail = (check, detail) => out.push([check, detail]);
  const url = `${SITE}${p.path}`;
  if (d.lang !== 'en') fail('lang', d.lang ? `is ${d.lang}` : 'missing');
  if (!d.viewport) fail('viewport', 'missing');
  if (d.h1 !== 1) fail('h1', `${d.h1} h1 elements`);
  if (!d.title) fail('title', 'missing');
  if (!d.description) fail('description', 'missing');
  else if (d.description.length < DESCRIPTION_MIN || d.description.length > DESCRIPTION_MAX) fail('description', `${d.description.length} characters; aim for ${DESCRIPTION_MIN} to ${DESCRIPTION_MAX}`);
  if (d.canonical !== url) fail('canonical', d.canonical ? `is ${d.canonical}` : 'missing');
  if (d.robots && /noindex/i.test(d.robots)) fail('robots', `public page says ${d.robots}`);
  for (const k of ['title', 'description', 'url', 'type', 'site_name', 'image', 'image:width', 'image:height', 'image:alt']) if (!d.og[k]) fail('og', `og:${k} missing`);
  if (d.og.url && d.og.url !== url) fail('og', `og:url is ${d.og.url}`);
  if (d.og['image:width'] && d.og['image:width'] !== '1200') fail('og', `og:image:width is ${d.og['image:width']}`);
  if (d.og['image:height'] && d.og['image:height'] !== '630') fail('og', `og:image:height is ${d.og['image:height']}`);
  if (d.twitter.card !== 'summary_large_image') fail('twitter', `twitter:card is ${d.twitter.card ?? 'missing'}`);
  for (const k of ['title', 'description', 'image', 'image:alt']) if (!d.twitter[k]) fail('twitter', `twitter:${k} missing`);
  // The card: an absolute URL to a 1200x630 PNG that exists.
  for (const [label, value] of [['og:image', d.og.image], ['twitter:image', d.twitter.image]]) {
    if (!value) continue;
    let u;
    try { u = new URL(value); } catch { fail('card', `${label} is not an absolute URL`); continue; }
    if (u.origin !== SITE) { fail('card', `${label} is not on ${SITE}`); continue; }
    const file = join(root, 'public', decodeURIComponent(u.pathname));
    if (!existsSync(file)) { fail('card', `${u.pathname} is not in public/`); continue; }
    const size = pngSize(file);
    if (!size) fail('card', `${u.pathname} is not a PNG`);
    else if (size.width !== 1200 || size.height !== 630) fail('card', `${u.pathname} is ${size.width}x${size.height}`);
  }
  // Structured data: one block that parses, a plain page type, nothing that implies a sale.
  const blocks = d.ld;
  if (blocks.length !== 1) fail('json-ld', `${blocks.length} blocks; want one`);
  for (const b of blocks.filter((x) => !x.ok)) fail('json-ld', `does not parse: ${b.error}`);
  for (const b of blocks.filter((x) => x.ok)) {
    const n = b.data;
    if (!n['@context']) fail('json-ld', '@context missing');
    const types = [].concat(n['@type'] ?? []);
    if (!types.some((t) => LD_OK.has(t))) fail('json-ld', `@type is ${types.join(', ') || 'missing'}; want WebPage, CollectionPage or CreativeWork`);
    for (const t of typesIn(n)) if (LD_BANNED_TYPES.has(t)) fail('json-ld', `carries type ${t}`);
    const key = keyIn(n, LD_BANNED_KEYS);
    if (key) fail('json-ld', `carries ${key}`);
    if (!n.name) fail('json-ld', 'name missing');
    if (!n.description) fail('json-ld', 'description missing');
    if (n.url !== url) fail('json-ld', `url is ${n.url ?? 'missing'}`);
  }
  const twinHref = d.alternates.find((h) => h === p.area.twin || h === `${SITE}${p.area.twin}`);
  if (!twinHref) fail('twin-link', `no <link rel="alternate" type="application/json"> to ${p.area.twin}`);
  const noAlt = d.images.filter((i) => i.alt === null);
  if (noAlt.length) fail('img-alt', `${noAlt.length} img without alt`);
  // Words.
  const spoken = { title: d.title, description: d.description, 'og:title': d.og.title, 'og:description': d.og.description, 'og:image:alt': d.og['image:alt'], 'twitter:title': d.twitter.title, 'twitter:description': d.twitter.description, 'twitter:image:alt': d.twitter['image:alt'] };
  for (const b of blocks.filter((x) => x.ok)) { spoken['json-ld name'] = b.data.name; spoken['json-ld description'] = b.data.description; }
  for (const [where, text] of Object.entries(spoken)) for (const [re, why] of WORDS) if (text && re.test(text)) fail('words', `${where}: ${why} ("${text.match(re)[0]}")`);
  return out;
}

// ---------------------------------------------------------------- the audit

export function audit({ root = ROOT } = {}) {
  const pages = scopePages(root);
  const read = (rel) => (existsSync(join(root, rel)) ? readFileSync(join(root, rel), 'utf8') : '');
  const sitemap = sitemapPaths(root);
  const llms = read('public/llms.txt');
  const llmsFull = read('public/llms-full.txt');
  const surfaces = read('src/data/agent-surfaces.ts');
  const robotsTxt = read('public/robots.txt');
  const twinText = {};
  const twinJson = {};
  const failures = [];
  const rows = [];
  const fail = (path, check, detail) => failures.push({ path, check, detail });

  const docs = new Map(pages.map((p) => [p.path, readPage(readFileSync(p.file, 'utf8'))]));
  const publicPages = pages.filter((p) => !p.private);
  const seen = { title: new Map(), description: new Map() };
  for (const p of publicPages) for (const k of ['title', 'description']) {
    const v = docs.get(p.path)[k];
    if (v) seen[k].set(v, [...(seen[k].get(v) ?? []), p.path]);
  }

  for (const a of AREAS) {
    twinText[a.id] = read(`public${a.twin}`);
    try { twinJson[a.id] = JSON.parse(twinText[a.id]); } catch (error) { fail(a.twin, 'twin', `does not parse: ${error.message}`); }
  }

  for (const p of pages) {
    const d = docs.get(p.path);
    const own = failures.length;
    if (p.private) {
      if (!(d.robots && /noindex/i.test(d.robots))) fail(p.path, 'private', `robots meta is ${d.robots ?? 'missing'}; it must say noindex`);
    } else {
      for (const [check, detail] of pageFailures(p, d, root)) fail(p.path, check, detail);
      for (const k of ['title', 'description']) {
        const dup = seen[k].get(d[k]) ?? [];
        if (dup.length > 1) fail(p.path, k, `same as ${dup.filter((x) => x !== p.path).join(', ')}`);
      }
      if (!sitemap.has(p.path)) fail(p.path, 'sitemap', 'not in sitemap-discovery.xml');
      if (!names(llmsFull, p.path)) fail(p.path, 'llms-full', 'not in llms-full.txt');
      if (MAIN.includes(p.path) && !names(llms, p.path)) fail(p.path, 'llms', 'not in llms.txt');
      const entry = twinJson[p.area.id] && twinEntries(twinJson[p.area.id].pageIndex ?? []).get(`${SITE}${p.path}`);
      if (!entry) fail(p.path, 'twin', `not in the pageIndex of ${p.area.twin}`);
      else {
        if (!said(entry, ['title', 'name'])) fail(p.path, 'twin', 'entry has no title');
        if (!said(entry, ['summary', 'description'])) fail(p.path, 'twin', 'entry has no summary');
      }
      if (p.hub) {
        if (!names(surfaces, p.path)) fail(p.path, 'agents', 'hub is not in agent-surfaces.ts');
        if (!names(surfaces, p.area.twin)) fail(p.path, 'agents', `${p.area.twin} is not in agent-surfaces.ts`);
        if (!names(llms, p.area.twin)) fail(p.path, 'llms', `${p.area.twin} is not in llms.txt`);
        if (!sitemap.has(p.area.twin)) fail(p.path, 'sitemap', `${p.area.twin} is not in sitemap-discovery.xml`);
      }
    }
    rows.push({ path: p.path, area: p.area.id, private: p.private, title: d.title, description: d.description, failures: failures.slice(own).map((f) => f.check) });
  }

  // The private routes must be in no index at all.
  for (const [label, text] of [['llms.txt', llms], ['llms-full.txt', llmsFull], ['agent-surfaces.ts', surfaces], ...AREAS.map((a) => [`${a.twin.slice(1)}`, twinText[a.id]])]) {
    const hit = text.match(PRIVATE_URL);
    if (hit) fail(hit[0], 'private', `named in ${label}`);
  }
  for (const path of sitemap) if (PRIVATE_URL.test(path)) fail(path, 'private', 'named in sitemap-discovery.xml');
  for (const p of pages.filter((x) => x.private)) if (sitemap.has(p.path)) fail(p.path, 'private', 'named in sitemap-discovery.xml');

  // How a crawler finds the discovery sitemap.
  if (!/^Sitemap:\s*https:\/\/pointcast\.xyz\/sitemap-discovery\.xml\s*$/m.test(robotsTxt)) fail('/robots.txt', 'sitemap-index', 'no Sitemap line for sitemap-discovery.xml');
  return { pages: rows, failures };
}

// ---------------------------------------------------------------- output

export function counts(result) {
  const out = {};
  for (const f of result.failures) out[f.check] = (out[f.check] ?? 0) + 1;
  return out;
}

export function table(result) {
  const lines = [];
  const width = Math.max(...result.pages.map((r) => r.path.length));
  lines.push(`${'page'.padEnd(width)}  title  desc  status`);
  for (const r of result.pages) {
    const status = r.private ? (r.failures.length ? `PRIVATE FAIL: ${[...new Set(r.failures)].join(', ')}` : 'private, noindex') : r.failures.length ? `FAIL: ${[...new Set(r.failures)].join(', ')}` : 'ok';
    lines.push(`${r.path.padEnd(width)}  ${String(r.title?.length ?? 0).padStart(5)}  ${String(r.description?.length ?? 0).padStart(4)}  ${status}`);
  }
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = audit();
  console.log(table(result));
  const c = counts(result);
  const pub = result.pages.filter((r) => !r.private).length;
  if (result.failures.length) {
    console.log('\nfailures');
    for (const f of result.failures) console.log(`  [${f.check}] ${f.path}: ${f.detail}`);
    console.log('\nby check');
    for (const [k, v] of Object.entries(c).sort()) console.log(`  ${k.padEnd(14)} ${v}`);
  }
  const jsonArg = process.argv.find((a) => a.startsWith('--json='));
  if (jsonArg) writeFileSync(jsonArg.slice(7), JSON.stringify({ ...result, counts: c }, null, 2));
  console.log(`\narea readability: ${pub} public pages and ${result.pages.length - pub} private routes audited, ${result.failures.length} failures`);
  process.exit(result.failures.length ? 1 : 0);
}
