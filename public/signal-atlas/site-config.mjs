/** Build-selected edition. Never selected by query strings or untrusted data. */
export const SITE_VARIANTS = Object.freeze({
  pointcast: Object.freeze({ variantId: 'pointcast', homeSiteId: 'pointcast', canonicalPath: '/signal-atlas/', origin: 'https://pointcast.xyz', brand: 'PointCast', homeHref: '/', evidenceEndpoint: '/api/signal-atlas', storageScope: 'pointcast:signal-atlas', disconnectedNote: 'This preview has no available traffic source. Visits and collection totals are unknown.' }),
  'el-segundo': Object.freeze({ variantId: 'el-segundo', homeSiteId: 'el-segundo', canonicalPath: '/signal-atlas/', origin: 'https://elsegundo.xyz', brand: 'El Segundo', homeHref: '/', evidenceEndpoint: null, storageScope: 'el-segundo:signal-atlas', disconnectedNote: 'El Segundo’s traffic source is not connected. Its Visitor Center is a separate, self-declared guestbook.' }),
  industrynext: Object.freeze({ variantId: 'industrynext', homeSiteId: 'industrynext', canonicalPath: '/communications-lab/signal-atlas/', origin: 'https://www.industrynext.xyz', brand: 'IndustryNext', homeHref: '/', evidenceEndpoint: null, storageScope: 'industrynext:signal-atlas', disconnectedNote: 'IndustryNext’s traffic source is not connected. Visits and collection totals are unknown.' }),
  ues: Object.freeze({ variantId: 'ues', homeSiteId: 'pointcast', canonicalPath: '/ues/signal-atlas/', origin: 'https://pointcast.xyz', brand: 'UES', homeHref: '/ues/', evidenceEndpoint: null, storageScope: 'ues:signal-atlas', disconnectedNote: 'UES is a PointCast learning subcollection. The retained source cannot identify UES visits; no separate count or score is inferred.' }),
  'el-segundo-university': Object.freeze({ variantId: 'el-segundo-university', homeSiteId: 'el-segundo', canonicalPath: '/university/signal-atlas/', origin: 'https://elsegundo.xyz', brand: 'University of El Segundo', homeHref: '/university/', evidenceEndpoint: null, storageScope: 'el-segundo-university:signal-atlas', disconnectedNote: 'This university collection belongs to El Segundo. No route-specific traffic source is connected; no separate count or league score is inferred.' }),
});
export function getSiteConfig(id) {
  if (typeof id !== 'string' || !Object.hasOwn(SITE_VARIANTS, id)) throw new TypeError('Unknown Signal Atlas edition');
  return SITE_VARIANTS[id];
}
// Export tooling replaces only this exact build-time selection.
export const SITE_CONFIG = getSiteConfig('pointcast');

/** Fail closed outside the PointCast edition, origin and preview namespace. */
export function observationEndpoint(siteId, href = globalThis.location?.href, config = SITE_CONFIG) {
  if (config !== SITE_VARIANTS.pointcast || siteId !== 'pointcast' || typeof href !== 'string') return null;
  let url;
  try { url = new URL(href); } catch { return null; }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && ['http:', 'https:'].includes(url.protocol);
  if ((!local && url.origin !== config.origin) || url.username || url.password) return null;
  if (url.pathname !== '/signal-atlas' && !url.pathname.startsWith('/signal-atlas/')) return null;
  return config.evidenceEndpoint;
}
