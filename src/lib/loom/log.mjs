/**
 * Pure helpers for the shapes the Loom keeps: a log (meta + op list), a capped
 * list (the directory index, an outbox, the peer roll) and a versioned record
 * (a sealed-inbox key set). Shared by the KV store (src/lib/loom/store.mjs) and
 * the Durable Object (workers/loom), so both stamp, trim and order the same way.
 */
export const MAX_OPS = 600;

/**
 * Strip the private parts of an op before it leaves the server.
 * @param {Record<string, any>} op
 */
export const publicOp = ({ tokenHash, ...op }) => op;

/** A log as it exists before its first write. */
export function emptyLog(address, key, describe) {
  return { v: 1, address, key, ...describe, title: null, createdAt: null, updatedAt: null, seq: 0, ops: [] };
}

/**
 * Stamp ops onto a log in order (seq, at), trim to the newest MAX_OPS and
 * return the stamped ops. Mutates `log`. A title is only taken by a log that
 * has never been written to.
 * @param {any} log
 * @param {Record<string, any>[]} ops
 * @param {string} now
 * @param {{ title?: string | null, maxOps?: number }} [options]
 * @returns {any[]}
 */
export function stampOps(log, ops, now, { title = null, maxOps = MAX_OPS } = {}) {
  if (title && !log.title && log.seq === 0) log.title = title;
  const stamped = [];
  for (const op of ops) {
    log.seq += 1;
    const next = { ...op, seq: log.seq, at: now };
    log.ops.push(next);
    stamped.push(next);
  }
  if (stamped.length) {
    log.createdAt ??= now;
    log.updatedAt = now;
  }
  if (log.ops.length > maxOps) {
    log.trimmedBefore = log.ops[log.ops.length - maxOps].seq;
    log.ops = log.ops.slice(-maxOps);
  }
  delete log.seed;
  delete log.archived;
  return stamped;
}

/**
 * Put `entry` at the front of a capped list. With `keyField`, an older entry
 * with the same key is replaced (the directory, the peer roll); without it the
 * list is a plain newest-first feed (an outbox).
 * @param {any[] | null | undefined} list
 * @param {any} entry
 * @param {{ keyField?: string | null, cap?: number }} [options]
 */
export function upsertFront(list, entry, { keyField = null, cap = 300 } = {}) {
  const rest = keyField ? (list ?? []).filter((e) => e?.[keyField] !== entry[keyField]) : (list ?? []);
  return [entry, ...rest].slice(0, cap);
}
