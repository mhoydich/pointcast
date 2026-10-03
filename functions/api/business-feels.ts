import { handleBusinessFeels } from '../../src/lib/business-feels.mjs';

// Uses the existing best-effort Cache API; concurrent misses can duplicate reads.
// No hard rate cap, new bindings, credentials or scheduled work.
export const onRequest: PagesFunction = async (context) => handleBusinessFeels(context.request, {
  cache: typeof caches === 'undefined' ? undefined : caches.default,
});
