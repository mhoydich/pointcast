/**
 * Root service-worker tombstone.
 *
 * PointCast used to ship a root-scoped offline worker. It cached `/` and
 * generic navigations, which means Chrome can keep serving old Astro HTML
 * after deploys. The worker file was later removed, leaving existing browsers
 * unable to update because `/sw.js` returned the HTML 404 page instead of
 * JavaScript.
 *
 * Keep this file served as valid JS so those browsers can install this
 * no-fetch replacement, clear the old pointcast caches, and unregister the
 * root worker. Sparrow keeps its own scoped worker at `/sparrow/sw.js`.
 */

const ROOT_SW_TOMBSTONE = 'pc-root-sw-tombstone-2026-04-29b';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => /^pointcast-/.test(name) || /^pc-root-/.test(name))
          .map((name) => caches.delete(name)),
      );

      await self.clients.claim();

      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({
          type: 'PC_ROOT_SW_TOMBSTONED',
          version: ROOT_SW_TOMBSTONE,
        });
      }

      await self.registration.unregister();
    })(),
  );
});
