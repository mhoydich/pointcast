// Verify Desk worker: replays a pointcast-chain node's blocks with the real
// consensus code (verify.js + pointcast_chain.wasm) and reports what it finds.
// Module worker.
//
// The PAGE fetches this file, verify.js and the wasm, checks each against the
// sha256 pinned in index.html, and starts the worker from those checked bytes:
//   postMessage({ api, genesis?, verifyJsUrl, wasm: ArrayBuffer, wasmSha256 })
// The worker never loads code from the node it is checking.
//
// Messages out:
//   { type: "ready", genesis_hash, chain_id, wasm_sha256 }
//   { type: "progress", height, block_hash, state_root, tip,
//     verified: [[height, block_hash, state_root, tx_count], ...],
//     blocks: [{ height, block_hash, txs: [card fields from the replay] }] }
//   { type: "fault", fault, height, reason, evidence, verdict }
//                                                        sequencer fault with evidence checked against
//                                                        this genesis (verdict.genesis); the worker stops
//   { type: "node_fault", fault, height, reason }         the node served something wrong; retried
//   { type: "anchors", match, total, ahead, bad_sig, foreign, mismatch: [heights] }
//   { type: "error", message, transient? }

const PAGE = 500;
const POLL_MS = 3000;
// At most this many pages per sync pass, so a node that keeps answering with
// full pages (or ignores `from`) cannot keep the worker spinning.
const MAX_PAGES_PER_SYNC = 40;
let api = "", v = null, params = null, stopped = false, tipSeen = 0;

const say = (m) => postMessage(m);

async function getJson(path) {
  const r = await fetch(api + path, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

// Push one batch. Returns "ok", "stop" (sequencer fault: reported, worker
// stops) or a node-fault reply (not yet reported; the caller retries).
function push(blocks) {
  if (!blocks.length) return "ok";
  const r = v.call("verifier.push", { blocks });
  if (r.checkpoints.length) {
    const last = r.checkpoints[r.checkpoints.length - 1];
    // Tx counts of the accepted blocks (accepted means the body is the sealed one).
    const ntx = new Map(blocks.map((b) => [b && b.header && b.header.height, b && Array.isArray(b.txs) ? b.txs.length : 0]));
    say({
      type: "progress",
      height: r.height,
      block_hash: last.block_hash,
      state_root: last.state_root,
      verified: r.checkpoints.map((c) => [c.height, c.block_hash, c.state_root, ntx.get(c.height) ?? 0]),
      blocks: r.blocks || [],
      tip: tipSeen,
    });
  }
  if (!r.fault) return "ok";
  if (r.sequencer_fault && r.evidence) {
    // Check the evidence exactly as `pointcast-node evidence check` would.
    let check = null;
    try { check = v.call("evidence.check", { evidence: r.evidence, params }); } catch {}
    if (check && check.valid) {
      stopped = true;
      say({ type: "fault", fault: r.fault, height: r.at_height, reason: r.reason, evidence: r.evidence, verdict: check.verdict });
      return "stop";
    }
  }
  return r;
}

// The node served something that does not extend the replay (unsealed or
// edited body, a gap, another branch). Ask once for exactly the next height;
// if that fails too, report it and try again next poll.
async function recover(fault) {
  const want = v.call("verifier.status").height + 1;
  try {
    const block = await getJson(`/raw/block/${want}`);
    const r = push([block]);
    if (r === "ok" || r === "stop") return r;
    fault = r;
  } catch (e) {
    if (fault.fault === "out_of_order") fault = { ...fault, reason: `${fault.reason}; /raw/block/${want}: ${e.message || e}` };
  }
  say({ type: "node_fault", fault: fault.fault, height: fault.at_height, reason: fault.reason });
  return "retry";
}

async function syncOnce() {
  let height = v.call("verifier.status").height;
  // Overlap one block so a re-sealed tip (equivocation) is noticed.
  let from = Math.max(1, height);
  for (let pages = 0; pages < MAX_PAGES_PER_SYNC; pages++) {
    const page = await getJson(`/raw/blocks?from=${from}&limit=${PAGE}`);
    tipSeen = Number(page.tip) || 0;
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];
    let r = push(blocks);
    if (r !== "ok" && r !== "stop") r = await recover(r);
    if (r !== "ok") return;
    const before = height;
    height = v.call("verifier.status").height;
    if (blocks.length < PAGE || height >= tipSeen) return;
    if (height <= before) {
      // A full page that did not advance the replay: the node is not
      // honouring `from`. Stop this pass; the next poll tries again.
      say({ type: "node_fault", fault: "no_progress", height: height + 1, reason: `the node answered from=${from} with ${blocks.length} blocks that do not advance the replay` });
      return;
    }
    from = height + 1;
  }
}

async function checkAnchors() {
  let list;
  try { list = (await getJson("/anchors")).anchors || []; } catch { return; }
  const out = { type: "anchors", match: 0, total: 0, ahead: 0, bad_sig: 0, foreign: 0, mismatch: [] };
  for (const a of list) {
    if (!a.seq_sig || !a.payload) continue;
    const input = a.cast_body ? { body_hex: a.cast_body } : { payload: a.payload, seq_sig: a.seq_sig };
    let r;
    try { r = v.call("anchor.check", input); } catch { out.bad_sig++; continue; }
    if (r.result === "ahead") { out.ahead++; continue; }
    if (r.result === "bad_sig") { out.bad_sig++; continue; }
    if (r.result === "foreign") { out.foreign++; continue; }
    out.total++;
    if (r.result === "match") out.match++;
    else out.mismatch.push(r.height);
  }
  say(out);
}

async function loop() {
  let lastAnchors = 0;
  while (!stopped) {
    try {
      await syncOnce();
      if (!stopped && Date.now() - lastAnchors > 15000) {
        lastAnchors = Date.now();
        await checkAnchors();
      }
    } catch (e) {
      say({ type: "error", message: `sync: ${e.message || e}`, transient: true });
    }
    if (stopped) {
      // Still report the anchor tally once, for the status strip.
      await checkAnchors().catch(() => {});
      break;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

onmessage = async (ev) => {
  const msg = ev.data || {};
  if (msg.stop) { stopped = true; return; }
  if (v) return; // already running
  try {
    api = String(msg.api || "").replace(/\/$/, "");
    if (!msg.verifyJsUrl || !(msg.wasm instanceof ArrayBuffer) || !msg.wasmSha256) {
      throw new Error("start the worker with the page's pinned verify.js and wasm");
    }
    const { PointcastVerifier, sha256Hex } = await import(msg.verifyJsUrl);
    const bytes = new Uint8Array(msg.wasm);
    // Defence in depth: the page already checked these bytes against its pin.
    const wasm_sha256 = await sha256Hex(bytes);
    if (wasm_sha256 !== msg.wasmSha256) throw new Error("verifier wasm does not match the pinned sha256");
    v = await PointcastVerifier.load(bytes);
    let status;
    [params, status] = await Promise.all([getJson("/params"), getJson("/status")]);
    tipSeen = status.height;
    const init = v.call("verifier.new", { params, genesis: msg.genesis || null });
    say({ type: "ready", genesis_hash: init.genesis_hash, chain_id: init.chain_id, wasm_sha256 });
    loop();
  } catch (e) {
    stopped = true;
    say({ type: "error", message: e.message || String(e) });
  }
};
