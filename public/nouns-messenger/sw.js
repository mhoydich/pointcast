/* Nouns Messenger service worker. Scope: /nouns-messenger/ (a worker only controls
   its own path and below; the rest of pointcast.xyz never sees it).

   Why: the app is local-first, so it should open with no signal once it has been
   opened once. The chats already live on the phone; now the app does too.

   How: the app's own files are precached on install and served from the cache first,
   with a background refresh of each file on every use (stale while revalidate), so a
   new deploy reaches an installed phone on its second open without a VERSION bump.
   Anything under /api/ and /now.json is never handled here and always goes to the
   network.

   VERSION: bump it when FILES changes shape (a file added or removed). The cache is
   keyed by it and activate() drops every older Nouns Messenger cache. */
'use strict';

const VERSION = 'nouns-messenger-2026-10-22b';
// Hash of the files in FILES, kept current by tests/pmm-offline-digest.test.mjs. Any change to it
// changes this file's bytes, so browsers reinstall the worker and re-precache at once. No VERSION bump needed.
const DIGEST = '48d02b8b2c6af41d';
const FILES = [
  '/nouns-messenger/',
  '/nouns-messenger/style.css',
  '/nouns-messenger/app.js',
  '/nouns-messenger/manifest.webmanifest',
  '/nouns-messenger/icon.svg',
  '/nouns-messenger/icon-192.png',
  '/nouns-messenger/icon-512.png',
  '/nouns-messenger/apple-touch-icon.png',
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
    await Promise.all(names.filter((n) => n.startsWith('nouns-messenger-') && n !== VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// A navigation to /nouns-messenger/ or /nouns-messenger/index.html (with any query
// string; a passed note rides in the hash, which never reaches the worker) is served
// from the one cached copy of the page; anything else is not ours.
function pageKey(pathname) {
  const p = pathname.replace(/index\.html$/, '');
  return p === '/nouns-messenger/' ? '/nouns-messenger/' : null;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Network only, never cached.
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
