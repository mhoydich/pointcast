// sparrow/sw.js — service worker for /sparrow/*
//
// Scope: /sparrow/ (enforced by file location; a SW only controls paths
// at or below its own URL). The rest of pointcast.xyz is untouched.
//
// Strategy:
//   · precache the shell pages on install (home, about, saved, 9 channels,
//     manifest, feed)
//   · runtime cache for block readers (/sparrow/b/<id>) — cache-first with
//     background revalidate, capped at 48 entries
//   · runtime cache for static Astro assets (/_astro/*), Google Fonts,
//     and per-block OG images — cache-first, long-lived
//   · everything else: network-only (don't shadow pointcast's other
//     routes, APIs, etc.)
//
// Versioning: bump SW_VERSION on any shape change so activate() can sweep
// stale caches. Astro bumps asset hashes on its own, so we don't touch
// those entries — they age out when their URLs change.

const SW_VERSION = 'sparrow-v0.39.0';
const SHELL_CACHE = `${SW_VERSION}-shell`;
const BLOCK_CACHE = `${SW_VERSION}-blocks`;
const ASSET_CACHE = `${SW_VERSION}-assets`;

const SHELL_URLS = [
  '/sparrow',
  '/sparrow/',
  '/sparrow/about',
  '/sparrow/deck',
  '/sparrow/connect',
  '/sparrow/saved',
  '/sparrow/friends',
  '/sparrow/friends/activity',
  '/sparrow/signals',
  '/sparrow/tv',
  '/sparrow/tv/friends',
  '/sparrow/tv/saved',
  '/sparrow/federation.json',
  '/sparrow.json',
  '/sparrow/feed.xml',
  '/sparrow/api/latest.json',
  '/sparrow/manifest.webmanifest',
  '/sparrow/ch/front-door',
  '/sparrow/ch/court',
  '/sparrow/ch/spinning',
  '/sparrow/ch/good-feels',
  '/sparrow/ch/garden',
  '/sparrow/ch/el-segundo',
  '/sparrow/ch/faucet',
  '/sparrow/ch/visit',
  '/sparrow/ch/battler',
];

// Cap the block-reader cache so heavy readers don't balloon storage.
const BLOCK_CACHE_MAX = 48;

// MARK: - Install / activate

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Race-tolerant precache: don't fail the install if one URL 404s.
      await Promise.allSettled(
        SHELL_URLS.map((u) => cache.add(u).catch(() => null)),
      );
      // Take over open tabs as soon as we're activated.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('sparrow-') && !n.startsWith(SW_VERSION))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

// MARK: - Fetch strategies

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Only handle same-origin + Google Fonts (the three @font-face hosts).
  const sameOrigin = url.origin === self.location.origin;
  const isFontsGstatic = url.origin === 'https://fonts.gstatic.com';
  const isFontsGoogleapis = url.origin === 'https://fonts.googleapis.com';
  if (!sameOrigin && !isFontsGstatic && !isFontsGoogleapis) return;

  // Route logic — only respond if we actually handle the URL. Falling
  // through (no event.respondWith) defers to network-only, which is the
  // safe default for non-Sparrow paths.

  if (sameOrigin) {
    // Block reader: /sparrow/b/<id>
    if (/^\/sparrow\/b\//.test(url.pathname)) {
      event.respondWith(cacheFirstWithLimit(req, BLOCK_CACHE, BLOCK_CACHE_MAX));
      return;
    }

    // Sparrow shell pages + json + feed: stale-while-revalidate
    if (
      url.pathname === '/sparrow' ||
      url.pathname.startsWith('/sparrow/') ||
      url.pathname === '/sparrow.json'
    ) {
      event.respondWith(staleWhileRevalidate(req, SHELL_CACHE));
      return;
    }

    // Astro hashed assets (immutable by URL) + public OG images
    if (
      url.pathname.startsWith('/_astro/') ||
      /^\/images\/og\/b\/\d+\.png$/.test(url.pathname)
    ) {
      event.respondWith(cacheFirstWithLimit(req, ASSET_CACHE, 120));
      return;
    }
  } else {
    // Google Fonts — cache-first, long-lived.
    event.respondWith(cacheFirstWithLimit(req, ASSET_CACHE, 120));
    return;
  }

  // Everything else: default network handling.
});

// MARK: - Strategy helpers

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((resp) => {
      if (resp && resp.ok) cache.put(request, resp.clone());
      return resp;
    })
    .catch(() => null);
  return cached || (await networkPromise) || fallback(request);
}

async function cacheFirstWithLimit(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const resp = await fetch(request);
    if (resp && resp.ok) {
      cache.put(request, resp.clone()).then(() => trim(cacheName, max));
    }
    return resp;
  } catch {
    return cached || fallback(request);
  }
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  const excess = keys.length - max;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

function fallback(request) {
  // Minimal offline HTML fallback for navigation requests so the user
  // sees "you're offline" rather than the browser's default error.
  if (request.mode === 'navigate') {
    return new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sparrow · offline</title>
<style>
  body { margin:0; background:oklch(14% 0.03 260); color:oklch(95% 0.02 75);
         font:15px/1.5 system-ui,sans-serif; min-height:100vh;
         display:grid; place-items:center; padding:24px; }
  .card { max-width:480px; text-align:center;
          border:1px solid oklch(30% 0.03 255); border-radius:3px; padding:32px; }
  h1 { font-family:'Gloock',Georgia,serif; font-weight:400; font-size:40px;
       letter-spacing:-0.015em; margin:0 0 12px; line-height:1; }
  em { color:oklch(74% 0.16 72); font-style:italic; }
  p { color:oklch(72% 0.02 260); margin:0 0 14px; }
  a { color:oklch(74% 0.16 72); text-decoration:underline; text-underline-offset:3px; }
  code { font-family:ui-monospace,Menlo,monospace; font-size:12px;
         color:oklch(95% 0.02 75); }
</style></head><body>
<div class="card">
  <h1>Offline, <em>for now.</em></h1>
  <p>Sparrow couldn't reach the broadcast. The last pages you visited
     are still readable — try the <a href="/sparrow">home dial</a>,
     <a href="/sparrow/saved">your reading list</a>, or a recent
     <code>/sparrow/b/&lt;id&gt;</code>.</p>
  <p>When the network returns, everything flows again.</p>
</div></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
  return new Response('', { status: 504, statusText: 'offline' });
}

// MARK: - Message bridge — so the page can ping the SW for state.

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SPARROW_PING') {
    event.source?.postMessage({ type: 'SPARROW_PONG', version: SW_VERSION });
  }
});
