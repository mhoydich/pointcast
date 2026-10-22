/* PMM service worker. Scope: /pmm/ (a worker only controls its own path and below;
   the rest of pointcast.xyz never sees it).

   Why: the brief calls it "easy load". A phone that has opened PMM once must open it
   again with no signal, because a paste-mode handshake on a bad connection needs the
   app itself before it needs anything else.

   How: the app's own files are precached on install and served from the cache first,
   with a background refresh of each file on every use (stale while revalidate), so a
   new deploy reaches an installed phone on its second open without a VERSION bump.
   Anything under /api/ and /now.json is never handled here, so the handshake note,
   the SI packet and the ticker always go to the network and are never served stale.

   VERSION: bump it when FILES changes shape (a file added or removed). The cache is
   keyed by it and activate() drops every older PMM cache. */
'use strict';

const VERSION = 'pmm-2026-10-22c';
// Hash of the files in FILES, kept current by tests/pmm-offline-digest.test.mjs. Any change to it
// changes this file's bytes, so browsers reinstall the worker and re-precache at once. No VERSION bump needed.
const DIGEST = '52259552b25bbdb2';
const FILES = [
  '/pmm/',
  '/pmm/style.css',
  '/pmm/app.js',
  '/pmm/manifest.webmanifest',
  '/pmm/icon.svg',
  '/pmm/icon-192.png',
  '/pmm/icon-512.png',
  '/pmm/apple-touch-icon.png',
  '/pmm/brand/',
  '/pmm/brand/wordmark.svg',
  '/pmm/vendor/qrcode.js',
  '/pmm/settle.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(FILES.map((u) => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('pmm-') && n !== VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// A navigation to /pmm/, /pmm/index.html or /pmm/brand/ (with any query string) is
// served from the one cached copy of that page; anything else is not ours.
function pageKey(pathname) {
  const p = pathname.replace(/index\.html$/, '');
  if (p === '/pmm/') return '/pmm/';
  if (p === '/pmm/brand' || p === '/pmm/brand/') return '/pmm/brand/';
  return null;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Network only, never cached: the signal note, the SI packet, the ticker.
  if (url.pathname.startsWith('/api/') || url.pathname === '/now.json') return;
  const key = req.mode === 'navigate' ? pageKey(url.pathname) : (FILES.includes(url.pathname) ? url.pathname : null);
  if (!key) return; // card images, sw.js itself, anything else: the browser's own handling
  event.respondWith(cacheFirst(key, req));
});

// Stale while revalidate: answer from the cache at once, then refresh that one file in the
// background so the next open has the newer copy. VERSION still drops whole old caches.
async function cacheFirst(key, req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(key);
  const refresh = fetch(req).then((res) => {
    // A redirected response cannot be replayed to a navigation, so only keep direct hits.
    if (res && res.ok && !res.redirected) cache.put(key, res.clone()).catch(() => {});
    return res;
  });
  if (hit) { refresh.catch(() => {}); return hit; }
  return refresh;
}
