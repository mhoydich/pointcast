/**
 * Cloudflare Web Analytics beacon gate.
 * The token is public (it ships in the page) but the tag stays out until
 * PUBLIC_CF_BEACON_TOKEN is set at build time. Our own browsers skip it.
 */

export const CF_BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

export function shouldLoadCfBeacon({ webdriver = false, userAgent = '', search = '', stored = null } = {}) {
  if (webdriver) return false;
  if (/HeadlessChrome/i.test(String(userAgent || ''))) return false;
  const query = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  if (query.get('nobeacon') === '1') return false;
  if (stored != null) return false;
  return true;
}

/** Read the build-injected meta tag and append the beacon once, or do nothing. */
export function mountCfBeacon(doc = document) {
  const token = doc.querySelector('meta[name="pc-cf-beacon"]')?.getAttribute('content')?.trim() || '';
  if (!token) return false;
  let stored = null;
  try { stored = doc.defaultView?.localStorage?.getItem('nobeacon') ?? null; } catch { stored = 'blocked'; }
  const view = doc.defaultView;
  if (!shouldLoadCfBeacon({
    webdriver: Boolean(view?.navigator?.webdriver),
    userAgent: view?.navigator?.userAgent || '',
    search: view?.location?.search || '',
    stored,
  })) return false;
  if (doc.querySelector('script[data-cf-beacon]')) return false;
  const script = doc.createElement('script');
  script.defer = true;
  script.src = CF_BEACON_SRC;
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  doc.head?.appendChild(script);
  return true;
}
