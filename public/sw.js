/**
 * sw.js — PointCast service worker.
 *
 * Caches READ block pages + their JSON twins + canonical assets so the
 * site remains readable offline. Scoped to the root origin. Sparrow has
 * its own scoped SW under /sparrow/; this one handles the main site.
 *
 * Strategy:
 *   - PRECACHE: home, manifesto, glossary, for-agents, llms.txt, 3 pillars,
 *     /blocks, /archive, /press — the canonical navigation spine.
 *   - RUNTIME:
 *     · /b/* and /b/*.json → stale-while-revalidate with 30-day TTL
 *     · /c/* and /c/*.json → stale-while-revalidate with 1-day TTL
 *     · everything else → network-first, fall back to cache
 *   - NAVIGATE requests that fail network + cache → offline fallback HTML.
 *
 * Versioned cache name — bump PC_CACHE_VERSION to invalidate on deploy
 * when the service worker logic changes. Content-layer invalidation is
 * handled by stale-while-revalidate per-request.
 */

const PC_CACHE_VERSION = 'v1-2026-04-21';
const PRECACHE = `pointcast-precache-${PC_CACHE_VERSION}`;
const RUNTIME = `pointcast-runtime-${PC_CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifesto',
  '/glossary',
  '/for-agents',
  '/llms.txt',
  '/el-segundo',
  '/agent-native',
  '/nouns',
  '/blocks',
  '/archive',
  '/press',
  '/resources',
  '/subscribe',
  '/favicon.svg',
  '/images/og-home-v3.png',
  '/manifest.webmanifest',
];

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline — PointCast</title>
<style>
  body {
    font-family: Inter, system-ui, sans-serif;
    background: #f5efe4; color: #12110e;
    padding: 40px 20px; max-width: 520px; margin: 0 auto;
    line-height: 1.55;
  }
  h1 { font-size: 28px; margin: 0 0 12px; }
  code { font-family: ui-monospace, 'JetBrains Mono', monospace; background: #e9e3d4; padding: 1px 6px; border-radius: 2px; }
  ul { padding-left: 20px; }
  a { color: #185FA5; }
</style>
</head>
<body>
  <h1>Offline.</h1>
  <p>You don't have a connection right now, and this particular PointCast URL isn't cached on your device yet.</p>
  <p>Here's what <em>is</em> cached:</p>
  <ul>
    <li><a href="/">/ (home feed)</a></li>
    <li><a href="/manifesto">/manifesto</a></li>
    <li><a href="/el-segundo">/el-segundo</a></li>
    <li><a href="/agent-native">/agent-native</a></li>
    <li><a href="/nouns">/nouns</a></li>
    <li><a href="/archive">/archive</a></li>
  </ul>
  <p>Individual block pages (<code>/b/{id}</code>) you've already visited should also work offline.</p>
  <p>Retry when you're back: <a href="javascript:location.reload()">reload this page</a>.</p>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n !== PRECACHE && n !== RUNTIME && n.startsWith('pointcast-'))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Stale-while-revalidate with per-bucket TTL. */
async function staleWhileRevalidate(request, ttlMs) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const isFresh = (() => {
    if (!cached) return false;
    const dateHeader = cached.headers.get('date');
    if (!dateHeader) return false;
    const age = Date.now() - new Date(dateHeader).getTime();
    return age < ttlMs;
  })();

  const fetchPromise = fetch(request)
    .then((res) => {
      if (res && res.status === 200) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  if (cached && isFresh) return cached;
  if (cached) {
    // Fire-and-forget revalidation; return stale immediately.
    fetchPromise;
    return cached;
  }
  const net = await fetchPromise;
  return net || new Response('offline', { status: 503 });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle our origin; Sparrow's SW scope is separate.
  if (url.origin !== self.location.origin) return;

  // Don't touch the Sparrow scope — its own SW owns that.
  if (url.pathname.startsWith('/sparrow/')) return;

  // Skip dev-only or admin paths.
  if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/api/')) return;

  // /b/{id} and /b/{id}.json → 30-day SWR (immutable content).
  if (/^\/b\/\d{3,5}(\/|\.json)?$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, 30 * 24 * 60 * 60 * 1000));
    return;
  }

  // /c/{slug} and /c/{slug}.json/rss → 1-day SWR (channels update daily).
  if (/^\/c\/[a-z-]+(\/|\.json|\.rss)?$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, 24 * 60 * 60 * 1000));
    return;
  }

  // Precached navigation → cache-first, then network.
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res && res.status === 200) {
            caches.open(PRECACHE).then((c) => c.put(request, res.clone()));
          }
          return res;
        }),
      ),
    );
    return;
  }

  // Navigations: try network, fall back to cache, fall back to offline HTML.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            caches.open(RUNTIME).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }),
    );
    return;
  }

  // Everything else: network-first with cache fallback.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          caches.open(RUNTIME).then((c) => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(request).then((c) => c || new Response('offline', { status: 503 }))),
  );
});
