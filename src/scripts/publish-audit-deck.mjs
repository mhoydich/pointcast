/** Keyboard and index helpers for the Oct 19 publish-audit deck. */

export function clampIndex(index, count) {
  const total = Number(count) || 0;
  if (total <= 0) return 0;
  const value = Number(index);
  if (!Number.isFinite(value)) return 0;
  return Math.min(total - 1, Math.max(0, value));
}

/**
 * @returns {1 | -1 | 'start' | 'end' | 0}
 */
export function keyToDelta(key) {
  if (key === 'ArrowDown' || key === 'ArrowRight' || key === 'PageDown' || key === ' ') return 1;
  if (key === 'ArrowUp' || key === 'ArrowLeft' || key === 'PageUp') return -1;
  if (key === 'Home') return 'start';
  if (key === 'End') return 'end';
  return 0;
}

export function indexAfterKey(index, count, key) {
  const delta = keyToDelta(key);
  if (delta === 0) return clampIndex(index, count);
  if (delta === 'start') return 0;
  if (delta === 'end') return clampIndex(count - 1, count);
  return clampIndex(index + delta, count);
}
