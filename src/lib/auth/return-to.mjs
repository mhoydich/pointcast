/** Keep universal sign-in on this site and return visitors to their starting room. */
export function authReturnTo(search, fallback = '/auth') {
  const value = new URLSearchParams(search).get('returnTo');
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const url = new URL(value, 'https://pointcast.invalid');
    if (url.origin !== 'https://pointcast.invalid') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}
