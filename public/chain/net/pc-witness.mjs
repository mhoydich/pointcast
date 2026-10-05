#!/usr/bin/env node
// pc-witness.mjs: witness the PointCast devnet. Replays the chain from its
// pinned genesis with the Block Yard's pinned verifier (exactly what
// https://pointcast.xyz/chain/bots/verify.mjs does), refuses to sign on any
// fault, then signs one checkpoint with YOUR key and posts it on channel WIT
// (and, with --checkin, a NET check-in). Node 22 or newer; one file.
//
//   node pc-witness.mjs --name <you> --checkin     attest, then check in
//   node pc-witness.mjs --dry-run                  print the posts, send nothing
//   node pc-witness.mjs --help
//
// Keep beside it (all from https://pointcast.xyz/chain/net/): witness.js,
// pointcast-chain.js and package.json ({"type":"module"}). The verifier
// (verify.js, pointcast_chain.wasm) is downloaded from
// https://pointcast.xyz/chain/yard/verifier/ into .pc-witness/verifier/ and
// checked against the sha256 pins below before any of it runs.
//
// Your key: BOT_SEED (64 hex) from the environment, else
// .pc-witness/key-<epoch12>.json, created once with mode 600. It is never
// printed and never logged; only your address is. Any ed25519 key is a tz1
// account on the devnet: no faucet, no registration, nothing to pay.
//
// What your post means, and nothing more: a public claim, tied to a free key,
// "I replayed this chain from genesis with the pinned verifier and got this
// block hash and state root at height h". It is NOT proof that you replayed:
// strikes only catch disagreement with this server, so a /status copier never
// gets one, and everything passes through the server it checks, so a hostile
// sequencer can censor it. The journal (.pc-witness/journal-*.json) keeps
// every claim you signed, with its signature: portable evidence.
// Devnet: no value, may reset. Guide: https://pointcast.xyz/chain/net

import { createHash, webcrypto } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, mkdir, open, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TOOL = "pc-witness.mjs/1";
const DEVNET = "https://pointcast-devnet.mhoydich.workers.dev";
const CHAIN_ID = "pointcast-devnet-1";
const GENESIS = "132faa1c08769a871c53547db3499b6c031459e6606b3c4999ffd0ead0a56f08";
const VERIFIER_URL = "https://pointcast.xyz/chain/yard/verifier/";
/** sha256 of every verifier build this script will run (pointcast-chain commits named). */
const VERIFIER_PINS = Object.freeze({
  "verify.js": ["74255711f5b8988eb18c30d5138ef0dc5ff4612566f0d70ac5b9fea6f81dc3cc"],
  "pointcast_chain.wasm": [
    "5491621602ecfa6afa4e8a88a20775243b717774393332e8b3437b690d39746d", // 3774071, batch 5: pointcast.xyz/chain/yard/verifier
    "16395976817554ca5cfdc82b75feb7db559e6c18d49ad8a7fd9023c619c6a45f", // 1a13850, polish-d: crates/explorer/static/verifier
  ],
});
const WAIT_BLOCKS = 20; // warn when a post is not in a block 20 blocks after it was sent

const USAGE = `pc-witness.mjs: replay the PointCast devnet, then sign and post one witness attestation.

  node pc-witness.mjs [--name NAME] [--checkin [--note TEXT]] [--dry-run]

  --name NAME        a name for your key (2-24 of a-z 0-9 -): a claim, first come on the server
  --checkin          also post today's NET check-in, if you have none today
  --note TEXT        the check-in's note (up to 140 characters)
  --dry-run          replay and sign, print the posts, send nothing
  --height H         attest this sealed checkpoint (default: today's day checkpoint, else the latest)
  --devnet URL       the chain to witness (default ${DEVNET})
  --genesis HEX      pin another genesis (a local devnet; default the devnet's ${GENESIS.slice(0, 12)}...)
  --verifier DIR     use verify.js + pointcast_chain.wasm from DIR (still sha256-pinned)
  --verifier-url URL download the verifier from URL (default ${VERIFIER_URL})
  --dir DIR          key, journal and verifier cache (default ./.pc-witness, or $PC_WITNESS_DIR)
  --key-file PATH    your key file (created once, mode 600, if missing)
  --wait SECONDS     how long to wait for each post to land (default 90)

  BOT_SEED=<64 hex>  sign with this seed instead of a key file (throwaway sandboxes:
                     keep it in a secret store; it is never printed)

Exit: 0 done (or nothing to do), 1 error or not included yet, 2 refused (fault, pin,
journal conflict), 3 too close to midnight UTC (23:59-00:01; try again after 00:01).
A witness is a public claim, not proof of replay. Devnet: no value, may reset.`;

class Refusal extends Error {}
class Usage extends Error {}

const say = (s = "") => process.stdout.write(`${s}\n`);
const warn = (s) => process.stderr.write(`pc-witness: ${s}\n`);
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const HEX64 = /^[0-9a-f]{64}$/;

// ---------------------------------------------------------------- modules

const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  warn(`needs Node 22 or newer (this is ${process.versions.node})`);
  process.exit(1);
}
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const here = (p) => new URL(p, import.meta.url);
/** witness.js and pointcast-chain.js from beside this file, else the repo's sdk/. */
async function loadSdk() {
  for (const dir of ["./", "../sdk/"]) {
    if (existsSync(fileURLToPath(here(`${dir}witness.js`))) && existsSync(fileURLToPath(here(`${dir}pointcast-chain.js`)))) {
      try {
        return { w: await import(here(`${dir}witness.js`).href), pcc: await import(here(`${dir}pointcast-chain.js`).href) };
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Usage(`witness.js and pointcast-chain.js do not match (${e.message}): download both again from https://pointcast.xyz/chain/net/ (an older pointcast-chain.js lacks what witness.js needs)`);
        }
        throw e;
      }
    }
  }
  throw new Usage("witness.js and pointcast-chain.js are missing: download them from https://pointcast.xyz/chain/net/ into this folder");
}

// ---------------------------------------------------------------- options

function parseArgs(argv) {
  const o = { checkin: false, dryRun: false, help: false };
  const takes = { "--name": "name", "--note": "note", "--height": "height", "--devnet": "devnet", "--genesis": "genesis",
    "--verifier": "verifier", "--verifier-url": "verifierUrl", "--dir": "dir", "--key-file": "keyFile", "--wait": "wait" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.indexOf("=");
    const flag = a.startsWith("--") && eq > 0 ? a.slice(0, eq) : a;
    if (flag === "-h" || flag === "--help") o.help = true;
    else if (flag === "--checkin") o.checkin = true;
    else if (flag === "--dry-run") o.dryRun = true;
    else if (Object.hasOwn(takes, flag)) {
      const v = eq > 0 && flag !== a ? a.slice(eq + 1) : argv[++i];
      if (v === undefined) throw new Usage(`${flag} needs a value`);
      o[takes[flag]] = v;
    } else throw new Usage(`unknown option ${a.slice(0, 40)} (see --help)`);
  }
  return o;
}

// ---------------------------------------------------------------- verifier

/** Check the verifier bytes against the pins, then load verify.js from those exact bytes. */
async function pinned({ js, wasm, sums, label }) {
  const jsSha = sha256(js);
  const wasmSha = sha256(wasm);
  if (!VERIFIER_PINS["verify.js"].includes(jsSha)) throw new Refusal(`verifier (${label}): verify.js sha256 ${jsSha} is not one this script pins`);
  if (!VERIFIER_PINS["pointcast_chain.wasm"].includes(wasmSha)) {
    throw new Refusal(`verifier (${label}): pointcast_chain.wasm sha256 ${wasmSha} is not one this script pins`);
  }
  if (sums !== null && sums !== undefined) {
    const listed = String(sums).trim().split(/\s+/)[0];
    if (listed !== wasmSha) throw new Refusal(`verifier (${label}): pointcast_chain.wasm.sha256 lists ${listed.slice(0, 64)}, the wasm is ${wasmSha}`);
  }
  // Import the bytes that were hashed, not the file again (nothing can swap it in between).
  const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  if (typeof mod.PointcastVerifier !== "function" || typeof mod.parseJson !== "function") throw new Refusal(`verifier (${label}): verify.js has no PointcastVerifier`);
  return { PointcastVerifier: mod.PointcastVerifier, parseJson: mod.parseJson, wasm, wasmSha, label };
}

async function fromDir(dir, label) {
  const js = await readFile(join(dir, "verify.js"));
  const wasm = await readFile(join(dir, "pointcast_chain.wasm"));
  const sums = await readFile(join(dir, "pointcast_chain.wasm.sha256"), "utf8").catch(() => null);
  return pinned({ js, wasm, sums, label });
}

const hasVerifier = (dir) => existsSync(join(dir, "verify.js")) && existsSync(join(dir, "pointcast_chain.wasm"));

async function download(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

/** --verifier DIR, else the repo copy, else the cache, else a fresh download (always pinned). */
async function loadVerifier(opt, dir) {
  if (opt.verifier) return fromDir(resolve(opt.verifier), `--verifier ${opt.verifier}`);
  const repo = fileURLToPath(here("../crates/explorer/static/verifier/"));
  if (hasVerifier(repo)) return fromDir(repo, "the repo's copy");
  const cache = join(dir, "verifier");
  if (hasVerifier(cache)) {
    try {
      return await fromDir(cache, `cached in ${cache}`);
    } catch (e) {
      if (!(e instanceof Refusal)) throw e;
      warn(`${e.message}; downloading it again`);
    }
  }
  const base = String(opt.verifierUrl || VERIFIER_URL).replace(/\/*$/, "/");
  const [js, wasm, sums] = await Promise.all(["verify.js", "pointcast_chain.wasm", "pointcast_chain.wasm.sha256"].map((n) => download(base + n)));
  const v = await pinned({ js, wasm, sums: sums.toString("utf8"), label: `downloaded from ${base}` });
  await mkdir(cache, { recursive: true, mode: 0o700 });
  await writeFile(join(cache, "verify.js"), js);
  await writeFile(join(cache, "pointcast_chain.wasm"), wasm);
  await writeFile(join(cache, "pointcast_chain.wasm.sha256"), sums);
  return v;
}

// ---------------------------------------------------------------- replay

/**
 * Replay /raw/blocks from height 1 through the verifier, the way verify.mjs
 * does. Returns checkpoints (height 1 and every tenth block, from the
 * verifier's own replay), every block's timestamp, and the WIT and NET
 * posts it saw. Throws Refusal on any fault.
 */
async function replay({ get, verifier, params, genesis }) {
  const v = await verifier.PointcastVerifier.load(verifier.wasm);
  v.call("verifier.new", { params, genesis }); // refuses params that do not hash to the pinned genesis
  const cps = new Map();
  const ts = [];
  const posts = [];
  let tip = null;
  for (let from = 1; ;) {
    const page = await get(`/raw/blocks?from=${from}&limit=500`);
    if (!page.blocks.length) break;
    const out = v.call("verifier.push", { blocks: page.blocks });
    if (out.fault) {
      throw new Refusal(`FAULT at height ${out.at_height}: ${out.fault} (${out.reason})${out.sequencer_fault ? ", a sequencer fault" : ""}; refusing to sign`);
    }
    out.checkpoints.forEach((c, i) => {
      const h = Number(c.height);
      const hdr = page.blocks[i] && page.blocks[i].header;
      if (!hdr || Number(hdr.height) !== h) throw new Refusal(`the replay and the page disagree at height ${h}; refusing to sign`);
      ts[h] = Number(hdr.timestamp);
      if (h === 1 || h % 10 === 0) cps.set(h, { block_hash: c.block_hash, state_root: c.state_root });
      tip = { height: h, block_hash: c.block_hash, state_root: c.state_root };
    });
    for (const b of out.blocks || []) {
      for (const t of b.txs || []) {
        const p = t.payload || {};
        if (t.kind === "publish_block" && (p.channel === "WIT" || p.channel === "NET")) {
          posts.push({ height: Number(b.height), tx: t.hash, sender: t.sender, channel: p.channel, title: p.title, body_hash: p.body_hash });
        }
      }
    }
    from = Number(out.height) + 1;
    if (from > Number(page.tip)) break;
  }
  return { tip, cps, ts, posts };
}

// ---------------------------------------------------------------- key and journal

const SEED_RE = /^[0-9a-fA-F]{64}$/;

/** BOT_SEED, else the key file (created once, mode 600). The seed is never printed. */
async function loadKey({ w, dir, epoch, keyFile, env }) {
  if (env !== undefined && env !== "") {
    if (!SEED_RE.test(env)) throw new Usage("BOT_SEED must be 64 hex characters (its value is not shown)");
    const k = await w.ed25519FromSeed(env);
    return { seed: env, address: k.address, publicKeyHex: k.publicKeyHex, source: "BOT_SEED" };
  }
  const path = resolve(keyFile || join(dir, `key-${epoch.slice(0, 12)}.json`));
  let created = false;
  if (!existsSync(path)) {
    const seed = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex");
    const k = await w.ed25519FromSeed(seed);
    const doc = {
      schema: "pointcast-devnet/witness-key/v1",
      note: "A devnet witness key: no value. Keep it private; anyone with this file can sign as you.",
      address: k.address,
      public_key: k.publicKeyHex,
      epoch,
      created_at: new Date().toISOString(),
      seed,
    };
    await mkdir(resolve(path, ".."), { recursive: true, mode: 0o700 });
    let fh;
    try {
      fh = await open(path, "wx", 0o600); // never overwrites a key
      await fh.writeFile(`${JSON.stringify(doc, null, 2)}\n`);
      created = true;
    } catch (e) {
      if (e.code !== "EEXIST") throw new Error(`could not create the key file ${path} (${e.code || "error"})`);
    } finally {
      await fh?.close();
    }
  }
  const st = await stat(path);
  if ((st.mode & 0o077) !== 0) {
    await chmod(path, 0o600);
    warn(`${path} was readable by others; it is mode 600 now`);
  }
  let doc;
  try {
    doc = JSON.parse(await readFile(path, "utf8"));
  } catch {
    throw new Usage(`${path} is not a pc-witness key file (its contents are not shown)`);
  }
  if (!doc || typeof doc.seed !== "string" || !SEED_RE.test(doc.seed)) throw new Usage(`${path} has no 64-hex seed (its contents are not shown)`);
  const k = await w.ed25519FromSeed(doc.seed);
  return { seed: doc.seed, address: k.address, publicKeyHex: k.publicKeyHex, source: path, created };
}

async function readJournal(path, head) {
  if (!existsSync(path)) return { schema: "pointcast-devnet/witness-journal/v1", ...head, entries: [] };
  let j;
  try {
    j = JSON.parse(await readFile(path, "utf8"));
  } catch {
    throw new Refusal(`${path} is not a readable journal; move it aside to start a new one (it holds the claims you signed)`);
  }
  if (!j || !Array.isArray(j.entries) || j.genesis !== head.genesis || j.epoch !== head.epoch) throw new Refusal(`${path} belongs to another chain or epoch`);
  return j;
}

async function saveJournal(path, j) {
  await mkdir(resolve(path, ".."), { recursive: true, mode: 0o700 });
  const tmp = `${path}.tmp-${process.pid}`;
  await writeFile(tmp, `${JSON.stringify(j, null, 2)}\n`, { mode: 0o600 });
  await rename(tmp, path);
}

// ---------------------------------------------------------------- posting

function nowMs() {
  const t = process.env.PC_WITNESS_NOW; // tests only: pretend the wall clock says this
  const v = t ? Date.parse(t) : Date.now();
  if (!Number.isFinite(v)) throw new Usage("PC_WITNESS_NOW is not a time");
  return v;
}

/** True from 23:59:00 to 00:00:59 UTC, when a post could land on either day. */
function nearMidnight(ms) {
  const minute = Math.floor((ms % 86_400_000) / 60_000);
  return minute >= 1439 || minute < 1;
}

async function txSigner(seed) {
  const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed, "hex")]);
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]);
  pkcs8.fill(0);
  return key;
}

const utc = (ms) => new Date(ms).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

// ---------------------------------------------------------------- main

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) {
    say(USAGE);
    return 0;
  }
  const { w, pcc } = await loadSdk();
  if (opt.name !== undefined) {
    if (!w.NAME_RE.test(opt.name)) throw new Usage("--name: 2 to 24 of a-z, 0-9 and -");
    if (w.RESERVED_NAMES.includes(opt.name)) throw new Usage(`--name ${opt.name} is reserved for the house`);
  }
  if (opt.note !== undefined && !opt.checkin) throw new Usage("--note goes with --checkin");
  if (opt.note !== undefined) w.buildNetBody("checkin", { note: opt.note }, "2026-01-01"); // the note's own checks, early
  const waitMs = opt.wait === undefined ? 90_000 : Number(opt.wait) * 1000;
  if (!Number.isFinite(waitMs) || waitMs < 0) throw new Usage("--wait: seconds");
  const api = String(opt.devnet || DEVNET).replace(/\/+$/, "");
  const genesis = String(opt.genesis || GENESIS).toLowerCase();
  if (!HEX64.test(genesis)) throw new Usage("--genesis: 64 hex characters");
  const dir = resolve(opt.dir || process.env.PC_WITNESS_DIR || ".pc-witness");

  say(`pc-witness · ${TOOL} · ${api} · devnet: no value, may reset`);
  const verifier = await loadVerifier(opt, dir);
  say(`verifier: ${verifier.label} · wasm sha256 ${verifier.wasmSha.slice(0, 16)}… (pinned)`);

  const get = async (path) => {
    const r = await fetch(api + path, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(60_000) });
    if (!r.ok) throw new Error(`${r.status} ${path}`);
    return verifier.parseJson(await r.text()); // exact for u64s
  };
  let chain;
  try {
    chain = await pcc.connect(api, { expect: { chainId: CHAIN_ID, genesisHash: genesis } });
  } catch (e) {
    if (e && e.name === "PointcastChainError") throw new Refusal(`${api}: ${e.message}`);
    throw e;
  }

  // ---- replay from genesis: epoch, day and target all come from here, never from /status or /duties
  const r = await replay({ get, verifier, params: await get("/params"), genesis });
  if (!r.tip) {
    say("no blocks yet: nothing to attest");
    return 0;
  }
  const epoch = r.cps.get(1).block_hash;
  const day = w.utcDay(r.ts[r.tip.height]);
  const headers = [];
  r.ts.forEach((t, h) => headers.push({ height: h, timestamp: t }));
  const dayCp = w.dayCheckpoint(headers);
  let target = dayCp ?? w.checkpointAt(r.tip.height);
  if (opt.height !== undefined) {
    const h = Number(opt.height);
    if (!w.isCheckpoint(h) || h > r.tip.height) throw new Usage(`--height ${opt.height}: not a sealed checkpoint (h ≥ 10, h % 10 = 0, h ≤ ${r.tip.height})`);
    target = h;
  }
  say(`replayed ${r.tip.height} blocks from genesis ${genesis.slice(0, 12)}… · no faults · state root ${r.tip.state_root.slice(0, 12)}…`);
  say(`epoch ${epoch.slice(0, 12)}… · day ${day} (UTC; resets 00:00 UTC) · day checkpoint ${dayCp ?? "not sealed yet"}`);
  if (target === null) {
    say("no checkpoint is sealed yet (the first is height 10): nothing to attest");
    return 0;
  }
  const claim = r.cps.get(target);

  // ---- key and journal
  const key = await loadKey({ w, dir, epoch, keyFile: opt.keyFile, env: process.env.BOT_SEED });
  if (key.created) say(`created your key file ${key.source} (mode 600; keep it private; it holds no value)`);
  say(`you are ${key.address}${opt.name ? ` · name ${opt.name} (a claim)` : ""} · key from ${key.source === "BOT_SEED" ? "BOT_SEED" : "your key file"}`);
  const jpath = join(dir, `journal-${genesis.slice(0, 12)}-${epoch.slice(0, 12)}.json`);
  const journal = await readJournal(jpath, { chain_id: chain.chainId, genesis, epoch });
  for (const e of journal.entries) {
    const now = r.cps.get(e.height);
    if (now && (now.block_hash !== e.block_hash || now.state_root !== e.state_root)) {
      throw new Refusal(`your journal holds a different claim at №${e.height} (signed ${e.signed_at}${e.tx ? `, tx ${e.tx}` : ""}) than this replay: refusing to sign. Something changed (your verifier, or the chain this server shows you); a second claim would be public evidence against your key.`);
    }
  }

  const mine = r.posts.filter((p) => p.sender === key.address);
  const prefix = `witness · h${target} · root ${claim.state_root.slice(0, 12)}`;
  const onChain = mine.find((p) => p.channel === "WIT" && (p.title === prefix || p.title.startsWith(`${prefix} · `)));
  const checkedIn = mine.find((p) => p.channel === "NET" && /^net · checkin( · |$)/.test(p.title) && w.utcDay(r.ts[p.height]) === day);

  const s = await w.signWitness(key.seed, { chain_id: chain.chainId, genesis, epoch, height: target, ...claim, tool: TOOL, name: opt.name });
  const human = `I replayed ${chain.chainId} from genesis with the pinned verifier (wasm ${verifier.wasmSha.slice(0, 12)}) and got this block hash and state root at height ${target}. A public claim tied to this key, not proof of replay. Devnet: no value, may reset.`;
  const wit = { channel: "WIT", title: s.title, body: `${s.line}\n${human}` };
  const checkin = opt.checkin
    ? { channel: "NET", title: `net · checkin${opt.name ? ` · ${opt.name}` : ""}`, body: w.buildNetBody("checkin", { note: opt.note, name: opt.name }, day) }
    : null;

  if (opt.dryRun) {
    say("");
    say("--dry-run: nothing was sent. The posts would be:");
    for (const p of [onChain ? null : wit, checkin && !checkedIn ? checkin : null]) {
      if (!p) continue;
      say(`  ${p.channel} · ${p.title}`);
      for (const l of p.body.split("\n")) say(`    ${l}`);
    }
    if (onChain) say(`  (no WIT: you attested №${target} already, tx ${onChain.tx} in block №${onChain.height})`);
    if (checkin && checkedIn) say(`  (no check-in: you checked in today already, tx ${checkedIn.tx})`);
    say("");
    say(w.WITNESS_MEANING);
    return 0;
  }

  // ---- send
  const now = nowMs();
  if (nearMidnight(now)) {
    warn(`it is ${utc(now)}: a post sent between 23:59 and 00:01 UTC could land on either day. Nothing was sent; try again after 00:01 UTC.`);
    return 3;
  }
  const signKey = await txSigner(key.seed);
  const send = async (p) => {
    let tx = await chain.buildPublish({ sender: key.address, channel: p.channel, title: p.title, body: p.body });
    for (let attempt = 0; ; attempt++) {
      const digest = pcc.signingHash(tx, chain.domain);
      const signature = pcc.bytesToHex(new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, signKey, pcc.hexToBytes(digest))));
      const stx = { tx, public_key: { scheme: "ed25519", bytes: key.publicKeyHex }, signature };
      try {
        const sent = await chain.submit(stx);
        return { hash: sent.txHash, nonce: tx.nonce };
      } catch (e) {
        const m = String(e && e.message);
        if (attempt === 0 && /nonce mismatch/i.test(m) && !/already included/i.test(m)) {
          warn(`stale nonce (${m}); reading it again and retrying once`);
          tx = { ...tx, nonce: await chain.nextNonce(key.address) };
          continue;
        }
        throw e;
      }
    }
  };
  const sendOrExplain = async (p) => {
    try {
      return await send(p);
    } catch (e) {
      if (/word filter/i.test(String(e && e.message))) {
        throw new Error(`${p.channel} refused: ${e.message}. A devnet whose word filter predates the Daily Net reads hex as words, so a few witness bodies in a hundred trip it; the same claim is refused again until the Daily Net door (which filters only text fields) is live there. Nothing else was sent.`);
      }
      throw e;
    }
  };
  /** Wait for a block; warn after WAIT_BLOCKS blocks or the --wait time. */
  const land = async (hash, label) => {
    const startTip = Number((await chain.status()).height);
    const end = Date.now() + waitMs;
    for (let i = 0; ; i++) {
      const st = await get(`/tx/${hash}`);
      if (st.status === "included") {
        const blk = await get(`/raw/block/${st.height}`);
        return { height: Number(st.height), timestamp: Number(blk.header.timestamp) };
      }
      if (st.status === "rejected") throw new Error(`${label} ${hash} was rejected: ${st.reason}`);
      const tipNow = Number((await chain.status()).height);
      if (tipNow - startTip >= WAIT_BLOCKS || Date.now() >= end) {
        warn(`${label} ${hash} is not in a block after ${tipNow - startTip} blocks and ${Math.round((Date.now() - end + waitMs) / 1000)} s: it may still land; check ${api}/tx/${hash}`);
        return null;
      }
      await new Promise((ok) => setTimeout(ok, i < 3 ? 400 : 1500));
    }
  };

  let witnessLanded = Boolean(onChain);
  // The same claim from this key, sent before but not in the replay: landed since, still pending, or lost.
  let entry = journal.entries.find((e) => e.height === target && e.address === key.address);
  let earlier = null;
  if (!onChain && entry && entry.tx) {
    earlier = await get(`/tx/${entry.tx}`).catch(() => null);
    if (earlier && earlier.status === "included") {
      say(`WIT: you attested №${target} already (tx ${entry.tx}, block №${earlier.height}): nothing new to sign`);
      witnessLanded = true;
    } else if (earlier && earlier.status === "pending") {
      say(`WIT: your attestation of №${target} (tx ${entry.tx}) is still waiting for a block: not sending another`);
    }
  }
  if (onChain) {
    say(`WIT: you attested №${target} already (tx ${onChain.tx}, block №${onChain.height}): nothing new to sign`);
  } else if (!(earlier && (earlier.status === "included" || earlier.status === "pending"))) {
    if (!entry) {
      entry = {
        height: target, block_hash: claim.block_hash, state_root: claim.state_root, digest: s.digest,
        public_key: s.public_key, signature: s.signature, address: key.address, name: opt.name ?? null,
        tool: TOOL, verifier_wasm_sha256: verifier.wasmSha, signed_at: new Date(now).toISOString(), tx: null,
      };
      journal.entries.push(entry);
    }
    await saveJournal(jpath, journal); // before sending: a crash after the send still leaves the claim on record
    const sent = await sendOrExplain(wit);
    entry.tx = sent.hash;
    await saveJournal(jpath, journal);
    say(`WIT sent: ${s.title} · tx ${sent.hash}`);
    const got = await land(sent.hash, "WIT");
    if (got) {
      entry.included_height = got.height;
      entry.included_at = new Date(got.timestamp).toISOString();
      await saveJournal(jpath, journal);
      say(`WIT included in block №${got.height} (${utc(got.timestamp)}) · counts for ${w.countedDay({ kind: "witness", blockTimestamp: got.timestamp })} (an attestation counts on its block's UTC day; the server decides whether it matches)`);
      witnessLanded = true;
    }
  }

  let code = witnessLanded ? 0 : 1;
  if (checkin) {
    if (checkedIn) say(`NET: you checked in today already (tx ${checkedIn.tx}, block №${checkedIn.height})`);
    else if (!witnessLanded) warn("skipping the check-in until the WIT post lands (it would queue behind it)");
    else {
      const sent = await sendOrExplain(checkin);
      say(`NET sent: ${checkin.title} · tx ${sent.hash}`);
      const got = await land(sent.hash, "NET check-in");
      if (got) {
        const counted = w.countedDay({ kind: "net", bodyDay: day, blockTimestamp: got.timestamp });
        say(`NET included in block №${got.height} (${utc(got.timestamp)}) · ${counted === "wrong_day" ? `counts for no day: its day ${day} is not the block's UTC day (wrong_day)` : `counts for ${counted}`}`);
      } else code = 1;
    }
  }
  say("");
  say(w.WITNESS_MEANING);
  say(`Journal (portable evidence of what you signed): ${jpath}`);
  return code;
}

/** Exit once stdout and stderr have flushed (pipes are asynchronous on macOS). */
function finish(code) {
  let open = 2;
  const done = () => --open === 0 && process.exit(code);
  process.stdout.write("", done);
  process.stderr.write("", done);
}

main().then(finish, (e) => {
  if (e instanceof Refusal) {
    warn(`refused: ${e.message}`);
    return finish(2);
  }
  if (e instanceof Usage || (e && e.name === "WitnessFormatError")) {
    warn(e.message);
    return finish(1);
  }
  warn(`error: ${e && e.message ? e.message : e}`);
  return finish(1);
});
