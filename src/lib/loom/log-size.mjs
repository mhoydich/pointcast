// Keep room JSON and archive chunks comfortably below D1's 2 MB row/string
// limit, including UTF-8 expansion and JSON escaping. Keys need headroom too.
export const MAX_LOG_BYTES = 1_500_000;
const encoder = new TextEncoder();
export const utf8Bytes = value => encoder.encode(value).byteLength;
export class LoomLogSizeError extends Error {}

function serialize(value) {
  const raw = JSON.stringify(value);
  if (utf8Bytes(raw) > MAX_LOG_BYTES) throw new LoomLogSizeError();
  return raw;
}

/** Prepare bounded room/archive values; the caller commits them atomically.
 * Keep the existing rolling suffix and trimmedBefore semantics. Archive raw
 * operations, including edits and hides, so no acknowledged history is lost.
 */
export function boundedLogWrites(log, maxOps) {
  const key = `loom:log:${log.key}`;
  const raw = JSON.stringify(log);
  if (log.ops.length <= maxOps && utf8Bytes(raw) <= MAX_LOG_BYTES) return [[key, raw]];

  const ops = log.ops;
  const sizes = ops.map(op => utf8Bytes(JSON.stringify(op)));
  let first = Math.max(1, ops.length - maxOps);
  let remaining = sizes.slice(first).reduce((sum, size) => sum + size, 0) + Math.max(0, ops.length - first - 1);
  let retained;
  for (;;) {
    // Never trim away the last operation just to make oversized metadata fit.
    if (first >= ops.length) throw new LoomLogSizeError();
    retained = { ...log, trimmedBefore: ops[first].seq, ops: [] };
    if (utf8Bytes(JSON.stringify(retained)) + remaining <= MAX_LOG_BYTES) break;
    remaining -= sizes[first] + (ops.length - first > 1 ? 1 : 0);
    first += 1;
  }
  retained.ops = ops.slice(first);

  const writes = [];
  const archive = { v: 1, key: log.key, address: log.address, ops: [] };
  const overhead = utf8Bytes(JSON.stringify(archive));
  let start = 0;
  while (start < first) {
    let end = start;
    let bytes = overhead;
    while (end < first && bytes + sizes[end] + (end > start ? 1 : 0) <= MAX_LOG_BYTES) {
      bytes += sizes[end] + (end > start ? 1 : 0);
      end += 1;
    }
    // Even one archived operation must fit. Refuse without losing the prefix.
    if (end === start) throw new LoomLogSizeError();
    writes.push([`loom:archive:${log.key}:${ops[start].seq}-${ops[end - 1].seq}`,
      serialize({ ...archive, ops: ops.slice(start, end) })]);
    start = end;
  }
  writes.push([key, serialize(retained)]);
  // Directory/count updates in the service must see the same retained window.
  log.ops = retained.ops;
  log.trimmedBefore = retained.trimmedBefore;
  return writes;
}
