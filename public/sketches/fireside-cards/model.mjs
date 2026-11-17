export const QUIET_MS = 30000;
export const nextIndex = (index, direction, length) => (index + direction + length) % length;
// Adapted from Shwa's PR 1728 pointer gate: one pointer, threshold and cancel.
export function swipe(start, end, cancelled = false) {
  if (!start || cancelled || start.id !== end.id) return 0;
  const dx = end.x - start.x, dy = end.y - start.y;
  return Math.abs(dx) >= 64 && Math.abs(dx) > Math.abs(dy) * 1.5 ? (dx < 0 ? 1 : -1) : 0;
}
// Adapted from Ada's PR 1713 flameView: a pure presentation state changes the
// existing film's brightness. Here the clock is reading time, never game authority.
export function flameView(elapsed, active) {
  const remaining = Math.max(0, Math.min(1, (QUIET_MS - elapsed) / QUIET_MS));
  return { ready: elapsed >= QUIET_MS, brightness: active ? .5 + remaining * .25 : .48 };
}
export function safeCard(c) {
  return c && ['coordination','cartography','daos'].includes(c.topic) &&
    typeof c.quote === 'string' && c.quote.length <= 160 && typeof c.author === 'string' &&
    /^https:\/\/pointcast\.xyz\/loom\?to=loom%3A[a-f0-9]{24}%23m_[a-z0-9]+$/.test(c.url);
}
