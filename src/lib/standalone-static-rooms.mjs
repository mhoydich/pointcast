// Hand-built static rooms that carry their own strict Content-Security-Policy
// (script-src 'self') and have no wallet or account UI. The middleware's
// inline Tezos session bridge is refused by that policy (a console error on
// every load) and, where it does run, only adds an anonymous
// /api/auth/session 401. These rooms are served exactly as authored.
// /pray is a self-contained prayer site that promises no requests outside
// its own folder, so it gets no bridge either.
const STANDALONE_PREFIXES = ['/make', '/home-next', '/pray'];

export function isStandaloneStaticRoom(pathname) {
  const path = String(pathname || '');
  return STANDALONE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + '/'));
}
