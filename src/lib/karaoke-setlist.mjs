/**
 * A same-screen, in-memory queue. Selecting the next turn only returns data;
 * the caller decides when to load a song and the singer starts playback.
 * Entry IDs are unique for this queue's lifetime, including after clear().
 */
export function createSetlist({ songIds, singers = 1, limit = 12 } = {}) {
  if (!Array.isArray(songIds) && !(songIds instanceof Set)) {
    throw new TypeError('Known song IDs must be an array or Set.');
  }
  const knownSongs = new Set();
  for (const songId of songIds) {
    if (typeof songId !== 'string' || !songId || songId.trim() !== songId) {
      throw new TypeError('Known song IDs must be non-empty, unpadded strings.');
    }
    knownSongs.add(songId);
  }
  const validSingerCount = count => Number.isInteger(count) && count >= 1 && count <= 8;
  if (!validSingerCount(singers)) throw new RangeError('Use between one and eight singers.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 12) {
    throw new RangeError('The queue limit must be between one and twelve.');
  }

  const entries = [];
  let sequence = 0;
  const copy = entry => ({ ...entry });

  return {
    /** Return the added entry, or false without changing the queue. */
    add(songId, singer = 0) {
      if (!knownSongs.has(songId) || !Number.isInteger(singer) || singer < 0 ||
          singer >= singers || entries.length >= limit ||
          !Number.isSafeInteger(sequence + 1)) return false;
      const entry = { id: `turn-${++sequence}`, songId, singer };
      entries.push(entry);
      return copy(entry);
    },

    remove(entryId) {
      const index = entries.findIndex(entry => entry.id === entryId);
      if (index === -1) return false;
      entries.splice(index, 1);
      return true;
    },

    /** Pop the oldest queued turn, with no playback or completion side effects. */
    next() {
      const entry = entries.shift();
      return entry ? copy(entry) : null;
    },

    /** Preserve valid slots; wrap removed singer slots into the remaining group. */
    setSingers(count) {
      if (!validSingerCount(count)) return false;
      singers = count;
      for (const entry of entries) {
        if (entry.singer >= count) entry.singer %= count;
      }
      return true;
    },

    clear() {
      const removed = entries.length;
      entries.length = 0;
      return removed;
    },

    snapshot() {
      return { entries: entries.map(copy), singers, limit };
    },
  };
}
