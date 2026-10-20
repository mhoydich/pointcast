// witness-shim.js: a module worker that starts the Block Yard's pinned verifier
// worker (verify-worker.js) and passes on one thing it cannot say itself: the
// block headers it downloads.
//
// The pinned worker reports each block's hash and state root as it replays, but
// not the blocks' timestamps, and the page needs them to pick today's day
// checkpoint the way pc-witness.mjs does. So this shim wraps fetch in the
// worker's scope (the Block Yard's own snapshot mode does the same to answer the
// worker from a file) and, for each /raw/blocks page or /raw/block/N the worker
// reads, posts the headers it saw: { type: "witness-headers", rows: [[height,
// timestamp, prev_hash, tx_root, state_root], ...] }.
//
// The shim adds no trust. The worker still runs from the page's checked bytes
// (a blob: URL of verify-worker.js whose sha256 the page pinned), reads the same
// response the shim copied, and replays it through the wasm. The page re-hashes
// every header it gets from here and requires the hash to equal the block hash the
// verifier computed (witness.js, makeCollector): a header the verifier did not
// accept is never used. Nothing here decides anything.
//
// Start it with: postMessage({ workerUrl, start }) where `workerUrl` is a blob:
// URL of the checked verify-worker.js and `start` is the message that worker
// takes (api, genesis, verifyJsUrl, wasm, wasmSha256, ...). Every later message
// (stop) goes straight to the pinned worker.

let started = false;

function rowsOf(json, single) {
  const blocks = single ? [json] : json && Array.isArray(json.blocks) ? json.blocks : [];
  const rows = [];
  for (const b of blocks) {
    const h = b && b.header;
    if (h && typeof h === 'object') rows.push([Number(h.height), Number(h.timestamp), h.prev_hash, h.tx_root, h.state_root]);
  }
  return rows;
}

self.onmessage = async (ev) => {
  const d = ev.data || {};
  self.onmessage = null;
  if (started) return;
  started = true;
  try {
    if (typeof d.workerUrl !== 'string' || !d.start || typeof d.start !== 'object') throw new Error('start the shim with the page’s checked worker and its start message');
    const realFetch = self.fetch.bind(self);
    self.fetch = async (input, init) => {
      const res = await realFetch(input, init);
      try {
        const u = new URL(String(input && typeof input === 'object' && 'url' in input ? input.url : input));
        const page = u.pathname === '/raw/blocks';
        if (res.ok && (page || /^\/raw\/block\/\d+$/.test(u.pathname))) {
          const rows = rowsOf(JSON.parse(await res.clone().text()), !page);
          if (rows.length) self.postMessage({ type: 'witness-headers', rows });
        }
      } catch {
        // The worker reads its own copy; a header the page does not get is a header it will not use.
      }
      return res;
    };
    await import(d.workerUrl);
  } catch (e) {
    self.postMessage({ type: 'error', message: 'the verifier worker could not be loaded: ' + String((e && e.message) || e) });
    return;
  }
  if (typeof self.onmessage !== 'function') {
    self.postMessage({ type: 'error', message: 'the verifier worker did not start' });
    return;
  }
  self.onmessage({ data: d.start });
};
