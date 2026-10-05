/**
 * Browser visit-deck selection only. The caller supplies one entropy sample
 * per visit or explicit shuffle; this module never changes social metadata.
 * Persist IDs rather than positions so reordering a curated deck remains safe.
 */
export const HOME_VISIT_DECK_VERSION = 1;
export const HOME_VISIT_DECK_STORAGE_KEY = 'pc:home-visit-deck:v1';
export const HOME_VISIT_DECK_MAX_COUNT = 64;
const MAX_ID_LENGTH = 96;
const MAX_STORED_LENGTH = 512;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validCount(count) {
  return Number.isInteger(count) && count > 0 && count <= HOME_VISIT_DECK_MAX_COUNT;
}

function validIds(ids) {
  return Array.isArray(ids)
    && validCount(ids.length)
    && ids.every((id) => typeof id === 'string' && id.length <= MAX_ID_LENGTH && ID_PATTERN.test(id))
    && new Set(ids).size === ids.length;
}

function boundedEntropy(entropy) {
  if (typeof entropy !== 'number' || !Number.isFinite(entropy)) return 0;
  return Math.min(1 - Number.EPSILON, Math.max(0, entropy));
}

/**
 * Choose uniformly from all eligible slots when entropy is uniform in [0,1).
 * A valid previous index is excluded whenever at least two decks exist.
 * Invalid counts return null; invalid previous indexes are ignored. Supplying
 * no entropy keeps the first eligible deck as a predictable fallback.
 */
export function chooseHomeDeckIndex(options = {}) {
  const { count, previousIndex, entropy = 0 } = options ?? {};
  if (!validCount(count)) return null;
  if (count === 1) return 0;
  const hasPrevious = Number.isInteger(previousIndex) && previousIndex >= 0 && previousIndex < count;
  const eligibleCount = count - (hasPrevious ? 1 : 0);
  const slot = Math.floor(boundedEntropy(entropy) * eligibleCount);
  return hasPrevious && slot >= previousIndex ? slot + 1 : slot;
}

function storedPreviousId(raw, ids) {
  if (typeof raw !== 'string' || raw.length > MAX_STORED_LENGTH) return null;
  try {
    const record = JSON.parse(raw);
    return record !== null && typeof record === 'object'
      && record.version === HOME_VISIT_DECK_VERSION
      && typeof record.id === 'string' && ids.includes(record.id)
      ? record.id : null;
  } catch {
    return null;
  }
}

/**
 * Select once and try to remember the ID. Storage access (including throwing
 * getItem/setItem getters) never prevents selection. The caller should also
 * catch access to window.localStorage itself before passing it here.
 * A valid previousId wins over persisted history for an in-session shuffle.
 * Without readable, writable persistence, separate visits may repeat; callers
 * can still pass the current ID to avoid repeats within the visible page.
 */
export function chooseAndSaveHomeDeck(options = {}) {
  const { ids, storage = null, previousId, entropy = 0 } = options ?? {};
  if (!validIds(ids)) return null;
  let storedId = null;
  let storageRead = false;
  try {
    if (storage && typeof storage.getItem === 'function') {
      storedId = storedPreviousId(storage.getItem(HOME_VISIT_DECK_STORAGE_KEY), ids);
      storageRead = true;
    }
  } catch { /* Local presentation remains usable with blocked storage. */ }
  const priorId = typeof previousId === 'string' && ids.includes(previousId) ? previousId : storedId;
  const index = chooseHomeDeckIndex({ count: ids.length, previousIndex: ids.indexOf(priorId), entropy });
  const id = ids[index];
  let storageSaved = false;
  try {
    if (storage && typeof storage.setItem === 'function') {
      storage.setItem(HOME_VISIT_DECK_STORAGE_KEY, JSON.stringify({ version: HOME_VISIT_DECK_VERSION, id }));
      storageSaved = true;
    }
  } catch { /* The caller's current ID can still support a no-repeat shuffle. */ }
  return { index, id, storageRead, storageSaved };
}
