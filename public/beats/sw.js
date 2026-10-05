/* Noun Beats service worker. Scope: /beats/
 * - App shell: precached on install, network-first for navigations (fresh when online,
 *   cached when offline), stale-while-revalidate for the other shell files.
 * - Noun art from noun.pics: cache-first at runtime (opaque responses are fine for <img>).
 * - /api/*: never cached (drum counts, rooms, the Beat Wall and Floor presence must be live; the page keeps
 *   its own last-seen copy of the Wall in localStorage for offline viewing).
 * v2: the version bump makes installed v1 apps fetch the v2 shell on their next visit and drop nb-shell-nb-v1;
 *   noun art (nb-nouns-v1) is kept across the update. */
var VERSION = 'nb-v2';
var SHELL = 'nb-shell-' + VERSION;
var NOUNS = 'nb-nouns-v1';
var MAX_NOUNS = 400;
var SHELL_FILES = [
  '/beats/',
  '/beats/manifest.webmanifest',
  '/beats/icons/icon-192.png',
  '/beats/icons/icon-512.png',
  '/beats/icons/maskable-512.png',
  '/beats/icons/apple-touch-icon.png',
  '/beats/icons/icon-32.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL)
      .then(function (cache) { return cache.addAll(SHELL_FILES.map(function (u) { return new Request(u, { cache: 'reload' }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('nb-') === 0 && k !== SHELL && k !== NOUNS; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function trimNouns() {
  return caches.open(NOUNS).then(function (cache) {
    return cache.keys().then(function (keys) {
      var extra = keys.length - MAX_NOUNS;
      return extra > 0 ? Promise.all(keys.slice(0, extra).map(function (k) { return cache.delete(k); })) : null;
    });
  });
}

function nounArt(request) {
  return caches.open(NOUNS).then(function (cache) {
    return cache.match(request, { ignoreVary: true }).then(function (hit) {
      if (hit) return hit;
      // A slow noun.pics must not hang the UI: give up after 6 s so the page draws its local pixel Noun.
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 6000) : null;
      return fetch(request, ctrl ? { signal: ctrl.signal } : undefined).then(function (res) {
        clearTimeout(timer);
        // Opaque (no-cors <img>) responses have status 0; cache them too.
        if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()).then(trimNouns).catch(function () {});
        return res;
      });
    });
  });
}

function shellPage(request) {
  var timeout = new Promise(function (resolve) { setTimeout(resolve, 3500, null); });
  var network = fetch(request).then(function (res) {
    if (res && res.ok) {
      var copy = res.clone();
      caches.open(SHELL).then(function (c) { return c.put('/beats/', copy); }).catch(function () {});
    }
    return res;
  });
  return Promise.race([network.catch(function () { return null; }), timeout]).then(function (res) {
    if (res && res.ok) return res;
    return caches.match('/beats/').then(function (hit) { return hit || network; });
  });
}

function shellAsset(request) {
  return caches.open(SHELL).then(function (cache) {
    return cache.match(request).then(function (hit) {
      var net = fetch(request).then(function (res) { if (res && res.ok) cache.put(request, res.clone()).catch(function () {}); return res; });
      return hit ? (net.catch(function () {}), hit) : net;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.hostname === 'noun.pics') { event.respondWith(nounArt(req)); return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/api/') === 0) return;
  if (req.mode === 'navigate' && (url.pathname === '/beats' || url.pathname.indexOf('/beats/') === 0)) { event.respondWith(shellPage(req)); return; }
  if (url.pathname.indexOf('/beats/') === 0 && url.pathname !== '/beats/sw.js') { event.respondWith(shellAsset(req)); return; }
});
