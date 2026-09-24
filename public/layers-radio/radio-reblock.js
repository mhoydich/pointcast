/**
 * Collects arbitrary-length Float32 chunks (128-sample worklet quanta, 480- or
 * 4096-sample callbacks) into fixed codec frames. onFrame receives the same
 * reusable buffer each time and must consume it synchronously.
 */
export function createReblocker(size, onFrame) {
  if (!Number.isInteger(size) || size <= 0) throw new RangeError('size must be a positive integer');
  const frame = new Float32Array(size);
  let filled = 0;
  return {
    push(chunk) {
      let pos = 0;
      while (pos < chunk.length) {
        const take = Math.min(size - filled, chunk.length - pos);
        frame.set(chunk.subarray(pos, pos + take), filled);
        pos += take; filled += take;
        if (filled === size) { filled = 0; onFrame(frame); }
      }
    },
    /** Zero-pad and emit a partial frame, if any. */
    flush() { if (filled) { frame.fill(0, filled); filled = 0; onFrame(frame); } },
    reset() { filled = 0; },
    get pending() { return filled; },
  };
}

/** Peak absolute value, sampled every `stride` samples (for a cheap level meter). */
export function peak(chunk, stride = 8) {
  let p = 0;
  for (let i = 0; i < chunk.length; i += stride) { const v = Math.abs(chunk[i]); if (v > p) p = v; }
  return p;
}
