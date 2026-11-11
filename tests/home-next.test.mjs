// Front page prototype at /home-next/: static, self-contained, honest about live data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'public/home-next');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const css = readFileSync(join(dir, 'home-next.css'), 'utf8');
const js = readFileSync(join(dir, 'home-next.js'), 'utf8');

const isFile = (p) => existsSync(p) && statSync(p).isFile();

// A path is a route if Astro or Pages Functions or a public file can answer it.
function routeExists(path) {
  const clean = path.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  if (clean === '/') return isFile(join(root, 'src/pages/index.astro'));
  const rel = clean.slice(1);
  const candidates = [
    `src/pages/${rel}.astro`,
    `src/pages/${rel}/index.astro`,
    `src/pages/${rel}.ts`,
    `src/pages/${rel}.md`,
    `public/${rel}`,
    `public/${rel}/index.html`,
    `functions/${rel}.ts`,
    `functions/${rel}/index.ts`,
  ];
  return candidates.some((f) => isFile(join(root, f)));
}

const hrefs = [...html.matchAll(/\shref="([^"]+)"/g)].map((m) => m[1]);
const internal = hrefs.filter((h) => h.startsWith('/'));

test('every internal link in the prototype points to a route in the repo', () => {
  assert.ok(internal.length >= 20, `expected a real index, found ${internal.length} internal links`);
  const missing = internal.filter((h) => !routeExists(h));
  assert.deepEqual(missing, []);
});

test('links built by the script point to real routes', () => {
  assert.ok(isFile(join(root, 'src/pages/b/[id].astro')) || isFile(join(root, 'src/pages/b/[...id].astro')), 'block pages /b/{id}');
  for (const m of js.matchAll(/href="(\/[^"]*)"/g)) assert.ok(routeExists(m[1]), m[1]);
});

test('every endpoint the script reads is same-origin and exists in the repo', () => {
  const urls = [...js.matchAll(/get\('([^']+)'\)/g)].map((m) => m[1]);
  assert.equal(urls.length, 5);
  for (const u of urls) {
    assert.ok(u.startsWith('/') && !u.startsWith('//'), `relative only: ${u}`);
    assert.ok(routeExists(u), `missing endpoint ${u}`);
  }
});

test('no third-party requests: no external scripts, styles, images, fonts or fetches', () => {
  const loaded = [
    ...html.matchAll(/<(?:script|img|iframe|source|video|audio)\b[^>]*\ssrc="([^"]+)"/g),
    ...html.matchAll(/<link\b(?![^>]*rel="(?:canonical|alternate|help)")[^>]*\shref="([^"]+)"/g),
  ].map((m) => m[1]);
  assert.ok(loaded.length >= 2);
  for (const u of loaded) assert.ok(!/^(https?:)?\/\//.test(u), `external resource ${u}`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.equal(canonical?.[1], 'https://pointcast.xyz/home-next/');
  assert.doesNotMatch(css, /url\(\s*['"]?(https?:)?\/\//);
  assert.doesNotMatch(css, /@import|@font-face/);
  assert.doesNotMatch(js, /https?:\/\//);
  for (const h of hrefs) if (/^https?:/.test(h)) assert.match(h, /^https:\/\/pointcast\.xyz\//, `external link ${h}`);
});

test('HTML plus CSS stay under 50 KB, script under 8 KB', () => {
  const bytes = Buffer.byteLength(html) + Buffer.byteLength(css);
  assert.ok(bytes < 50 * 1024, `HTML+CSS is ${bytes} bytes`);
  assert.ok(Buffer.byteLength(js) < 8 * 1024);
});

test('document basics: lang, title, description, noindex, one h1, landmarks, skip link', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>[^<]{10,}<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{20,}">/);
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<main id="main"/);
  assert.match(html, /<header\b/);
  assert.match(html, /<footer\b/);
  assert.match(html, /<a class="skip" href="#main">/);
  assert.match(html, /Prototype of a new front page/);
});

test('copy has no em dashes and the panel never ships a number in the HTML', () => {
  assert.doesNotMatch(html, /—|&mdash;/);
  const panel = html.slice(html.indexOf('class="gauges"'), html.indexOf('</dl>'));
  assert.doesNotMatch(panel.replace(/<[^>]+>/g, ''), /\d/);
  assert.match(js, /unavailable/);
});

test('type and accessibility floor: no web fonts, body 16px or more, dark mode, reduced motion', () => {
  assert.match(css, /--sans: system-ui/);
  assert.match(css, /--mono: ui-monospace/);
  const sizes = [...css.matchAll(/font(?:-size)?:[^;]*?(\d*\.?\d+)rem/g)].map((m) => Number(m[1]));
  assert.ok(sizes.every((s) => s >= 0.875), `smallest size ${Math.min(...sizes)}rem`);
  assert.match(css, /body \{[^}]*font: 400 1\.0625rem/);
  assert.doesNotMatch(css, /font-size:\s*\d+px/);
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
