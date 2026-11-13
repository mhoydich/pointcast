/**
 * Pure helpers for the shapes the Loom keeps: a log (meta + op list) and a
 * capped list (the directory index, an outbox), shared by service.mjs and the
 * stores in store.mjs.
 */
export const MAX_OPS = 600;

/**
 * Strip the private parts of an op before it leaves the server.
 */
export const publicOp = ({ tokenHash, ...op }) => op;

/**
 * The address an append is filed under in its sender's outbox: their declared
 * address, or an @handle made from their display name.
 */
export const senderAddress = (from) => from.address || `@${String(from.name ?? '').toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'anon'}`;

/** One line of a message, for the directory and outboxes. */
export const excerpt = (s, n = 140) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

/** A log as it exists before its first write. */
export function emptyLog(address, key, describe) {
  return { v: 1, address, key, ...describe, title: null, createdAt: null, updatedAt: null, seq: 0, ops: [] };
}

/**
 * Stamp ops onto a log in order (seq, at), trim to the newest MAX_OPS and
 * return the stamped ops. Mutates `log`. A title is only taken by a log that
 * has never been written to.
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
 * with the same key is replaced (the directory); without it the list is a
 * plain newest-first feed (an outbox).
 */
export function upsertFront(list, entry, { keyField = null, cap = 300 } = {}) {
  const rest = keyField ? (list ?? []).filter((e) => e?.[keyField] !== entry[keyField]) : (list ?? []);
  return [entry, ...rest].slice(0, cap);
}
