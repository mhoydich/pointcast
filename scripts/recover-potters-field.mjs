#!/usr/bin/env node
/**
 * scripts/recover-potters-field.mjs — the potter's field recovery.
 *
 * RUN ONCE BY HAND. Committed for provenance. NEVER invoked by the build.
 * PointCast is an all-Tezos codebase; this is the only Ethereum read in it,
 * and it stays at the script layer. Nothing here runs in the build or in a
 * request path. The output — public/potters-field/*.svg and
 * src/data/potters-field.json — is committed and served statically.
 *
 *   node scripts/recover-potters-field.mjs
 *
 * WHAT IT DOES
 *
 * Nouns are auctioned one at a time. Under the reserve price set by Prop 955,
 * an auction that closes below reserve is settled by burning the noun. The
 * token is gone: ownerOf reverts, dataURI reverts, and noun.pics answers 500.
 *
 * But `seeds(uint256)` is a plain storage mapping and ERC721 `_burn` does not
 * touch it. The five numbers that determine the face survive. The descriptor
 * is a pure function of those five numbers and will still draw them. So the
 * faces are recoverable, exactly, from mainnet — which is what this does.
 *
 * Steps:
 *   1. read the live auction id from the auction house — that is the top of
 *      the scan, so the field stays true as it grows.
 *   2. sweep ownerOf across [SCAN_FLOOR .. liveId]. A revert on an id at or
 *      below the live id means minted-then-burned. NOTHING IS HARDCODED to 26.
 *   3. for each burned id: seeds(id), then generateSVGImage(seed) on the
 *      descriptor. Decode the ABI string, then the base64, write the SVG.
 *   4. recover the burn (and mint) block for each id from Transfer logs.
 *      This is the fiddly part. No free public endpoint will serve a
 *      whole-chain eth_getLogs, so we bisect on mint logs to locate the era,
 *      then sweep forward in windows. If a date cannot be recovered cleanly
 *      we record null. We do not guess dates.
 *
 * CONTRACTS (Ethereum mainnet)
 *   token      0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03
 *   descriptor 0x33a9c445fb4fb21f2c030a6b2d3e2f12d017bfac
 *   auctions   0x830BD73E4184ceF73443C15111a1DF14e495C706
 *
 * THE RUN OF 2026-07-26 (the one whose output is committed)
 *   head block 25618024 · live auction noun 1974 · swept 1800..1974
 *   found 26 gone, one contiguous run: 1888–1913
 *   26/26 seeds read, 26/26 faces drawn, 26/26 burn blocks and mint blocks
 *   recovered from logs — no nulls
 *   burns ran 28 Apr 2026 19:15 UTC through 24 May 2026 13:44 UTC
 *   306 rpc calls, 103 seconds
 *
 * THE CHECK THAT MATTERS
 *   Run the same seeds → generateSVGImage path against a noun that still has
 *   an owner and compare to what noun.pics serves. Done for 1886, 1887 and
 *   1914 on 2026-07-26: byte-for-byte identical, all three. Same code path
 *   produced the 26 files here, so they are the faces, not lookalikes.
 *   Verified end to end on Noun 1900, seed (0, 26, 48, 159, 22).
 *
 * All Nouns art is CC0.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SVG_DIR = path.join(ROOT, 'public', 'potters-field');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'potters-field.json');

// ---------------------------------------------------------------- contracts

const TOKEN = '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03';
const DESCRIPTOR = '0x33a9c445fb4fb21f2c030a6b2d3e2f12d017bfac';
const AUCTION_HOUSE = '0x830BD73E4184ceF73443C15111a1DF14e495C706';

const SEL_SEEDS = '0xf0503e80'; // seeds(uint256)
const SEL_OWNER_OF = '0x6352211e'; // ownerOf(uint256)
const SEL_GENERATE_SVG = '0x2ea04300'; // generateSVGImage(Seed)
const SEL_AUCTION = '0x7d9f6db5'; // auction()

const TOPIC_TRANSFER =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO32 = '0x' + '0'.repeat(64);

// Floor of the ownerOf sweep. Comfortably below the known gap (which begins at
// 1888) with room to spare. Raise only if the sweep gets expensive.
const SCAN_FLOOR = 1800;

// ------------------------------------------------------------------ plumbing

// eth_call / eth_getBlockByNumber. publicnode serves historical *blocks* fine.
const CALL_RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.merkle.io',
  'https://eth.drpc.org',
];

// eth_getLogs over historical ranges. publicnode refuses ("archive requests
// require a personal token"); drpc serves them but caps the range at 10k.
const LOG_RPCS = ['https://eth.drpc.org'];
const LOG_WINDOW = 10_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let rpcCalls = 0;

async function rpcOnce(url, method, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcCalls, method, params }),
  });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

/**
 * JSON-RPC with rotation + backoff. Returns the raw envelope so callers can
 * inspect `error` — a revert is a legitimate answer here, not a failure.
 */
async function rpc(method, params, { pool = CALL_RPCS, tries = 6 } = {}) {
  let last;
  for (let attempt = 0; attempt < tries; attempt++) {
    const url = pool[attempt % pool.length];
    try {
      const body = await rpcOnce(url, method, params);
      // A contract revert comes back as error code 3 and is a real answer.
      if (body.error && body.error.code === 3) return body;
      if (body.error) {
        last = new Error(`${url}: ${body.error.message}`);
        await sleep(400 * (attempt + 1));
        continue;
      }
      return body;
    } catch (err) {
      last = err;
      await sleep(400 * (attempt + 1));
    }
  }
  throw last ?? new Error(`${method} failed`);
}

const word = (n) => BigInt(n).toString(16).padStart(64, '0');
const hexToNum = (h) => Number(BigInt(h));

async function ethCall(to, data, pool) {
  return rpc('eth_call', [{ to, data }, 'latest'], pool ? { pool } : undefined);
}

// ------------------------------------------------------------- chain reads

async function liveAuctionId() {
  const body = await ethCall(AUCTION_HOUSE, SEL_AUCTION);
  if (body.error) throw new Error(`auction() reverted: ${body.error.message}`);
  return hexToNum('0x' + body.result.slice(2, 66));
}

/** true = the token exists and has an owner; false = ownerOf reverts. */
async function isAlive(id) {
  const body = await ethCall(TOKEN, SEL_OWNER_OF + word(id));
  if (body.error) return false;
  return /^0x0*[1-9a-f]/i.test(body.result);
}

async function readSeed(id) {
  const body = await ethCall(TOKEN, SEL_SEEDS + word(id));
  if (body.error) throw new Error(`seeds(${id}) reverted: ${body.error.message}`);
  const hex = body.result.slice(2);
  if (hex.length < 320) throw new Error(`seeds(${id}) short return`);
  const parts = [];
  for (let i = 0; i < 5; i++) parts.push(hexToNum('0x' + hex.slice(i * 64, i * 64 + 64)));
  return {
    background: parts[0],
    body: parts[1],
    accessory: parts[2],
    head: parts[3],
    glasses: parts[4],
  };
}

/** ABI-decode a returned `string`, then base64-decode it. */
function decodeAbiString(result) {
  const hex = result.slice(2);
  const offset = hexToNum('0x' + hex.slice(0, 64));
  const lenAt = offset * 2;
  const len = hexToNum('0x' + hex.slice(lenAt, lenAt + 64));
  const bytes = hex.slice(lenAt + 64, lenAt + 64 + len * 2);
  return Buffer.from(bytes, 'hex').toString('utf8');
}

async function drawSeed(seed) {
  const data =
    SEL_GENERATE_SVG +
    [seed.background, seed.body, seed.accessory, seed.head, seed.glasses]
      .map(word)
      .join('');
  const body = await ethCall(DESCRIPTOR, data);
  if (body.error) throw new Error(`generateSVGImage reverted: ${body.error.message}`);
  const b64 = decodeAbiString(body.result);
  const svg = Buffer.from(b64, 'base64').toString('utf8');
  if (!svg.startsWith('<svg')) throw new Error('descriptor did not return an SVG');
  return svg;
}

// ------------------------------------------------------------------- logs

async function transferLogs(fromBlock, toBlock, { from = null, to = null } = {}) {
  const topics = [TOPIC_TRANSFER, from, to];
  while (topics.length && topics[topics.length - 1] === null) topics.pop();
  const body = await rpc(
    'eth_getLogs',
    [
      {
        fromBlock: '0x' + fromBlock.toString(16),
        toBlock: '0x' + toBlock.toString(16),
        address: TOKEN,
        topics,
      },
    ],
    { pool: LOG_RPCS, tries: 6 },
  );
  if (body.error) throw new Error(`eth_getLogs: ${body.error.message}`);
  return (body.result || []).map((log) => ({
    tokenId: hexToNum(log.topics[3]),
    from: '0x' + log.topics[1].slice(26),
    to: '0x' + log.topics[2].slice(26),
    block: hexToNum(log.blockNumber),
    tx: log.transactionHash,
  }));
}

const mintLogs = (a, b) => transferLogs(a, b, { from: ZERO32 });
const burnLogs = (a, b) => transferLogs(a, b, { to: ZERO32 });

/**
 * Locate roughly where `targetId` was minted. Mint ids increase monotonically
 * with block height, so a 10k-block probe window gives a usable compass and we
 * can bisect. Returns a block number at or slightly before the mint.
 */
async function locateMintEra(targetId, latest) {
  let lo = Math.max(1, latest - 4_000_000);
  let hi = latest;
  for (let guard = 0; guard < 48 && hi - lo > LOG_WINDOW; guard++) {
    const mid = Math.floor((lo + hi) / 2);
    let winFrom = mid;
    let winTo = Math.min(mid + LOG_WINDOW - 1, hi);
    let logs = await mintLogs(winFrom, winTo);
    // Mints are ~one a day; an empty window means we straddled a quiet stretch.
    for (let shift = 0; logs.length === 0 && shift < 4 && winTo < hi; shift++) {
      winFrom = winTo + 1;
      winTo = Math.min(winFrom + LOG_WINDOW - 1, hi);
      logs = await mintLogs(winFrom, winTo);
    }
    if (logs.length === 0) {
      hi = mid;
      continue;
    }
    const ids = logs.map((l) => l.tokenId);
    const minId = Math.min(...ids);
    const maxId = Math.max(...ids);
    if (maxId < targetId) {
      lo = winTo;
    } else if (minId > targetId) {
      hi = winFrom;
    } else {
      const exact = logs.find((l) => l.tokenId === targetId);
      return exact ? exact.block : winFrom;
    }
  }
  return lo;
}

const tsCache = new Map();
async function blockTimestamp(block) {
  if (tsCache.has(block)) return tsCache.get(block);
  const body = await rpc('eth_getBlockByNumber', ['0x' + block.toString(16), false]);
  if (body.error || !body.result) return null;
  const ts = hexToNum(body.result.timestamp);
  tsCache.set(block, ts);
  return ts;
}

// -------------------------------------------------------------------- main

async function main() {
  const startedAt = Date.now();
  console.log('potter\'s field — recovering burned Nouns from mainnet\n');

  const latest = hexToNum((await rpc('eth_blockNumber', [])).result);
  const liveId = await liveAuctionId();
  console.log(`head block   ${latest}`);
  console.log(`live auction noun ${liveId}`);
  console.log(`sweeping ownerOf across ${SCAN_FLOOR}..${liveId}\n`);

  // 1. Find the field. No count is assumed.
  const burned = [];
  for (let id = SCAN_FLOOR; id <= liveId; id++) {
    const alive = await isAlive(id);
    if (!alive) {
      burned.push(id);
      process.stdout.write(`  ${id} gone\n`);
    }
    if (id % 25 === 0) await sleep(120);
  }
  if (burned.length === 0) {
    console.log('no burned ids in range — nothing to recover');
    return;
  }

  // Report the shape of the field as contiguous runs.
  const runs = [];
  for (const id of burned) {
    const tail = runs[runs.length - 1];
    if (tail && id === tail[1] + 1) tail[1] = id;
    else runs.push([id, id]);
  }
  console.log(
    `\nfield: ${burned.length} burned — ` +
      runs.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ') +
      '\n',
  );

  // 2. Recover seeds and faces.
  await mkdir(SVG_DIR, { recursive: true });
  const records = [];
  for (const id of burned) {
    const seed = await readSeed(id);
    const svg = await drawSeed(seed);
    const rects = (svg.match(/<rect/g) || []).length;
    if (rects < 2) throw new Error(`noun ${id} drew an empty SVG`);
    await writeFile(path.join(SVG_DIR, `${id}.svg`), svg + '\n', 'utf8');
    records.push({
      id,
      seed,
      seedTuple: [seed.background, seed.body, seed.accessory, seed.head, seed.glasses],
      svgBytes: svg.length,
      rects,
      mintBlock: null,
      mintTimestamp: null,
      burnBlock: null,
      burnTimestamp: null,
      burnTx: null,
    });
    console.log(
      `  ${id}  seed(${records[records.length - 1].seedTuple.join(', ')})  ` +
        `${rects} rects  ${svg.length}b`,
    );
    await sleep(150);
  }

  // 3. Recover mint + burn blocks. Best effort; null over a guess.
  console.log('\nlocating the burn era in the log history…');
  const firstId = burned[0];
  const era = await locateMintEra(firstId, latest);
  console.log(`  bisected to block ~${era}`);

  const wanted = new Set(burned);
  const mintsFound = new Map();
  const burnsFound = new Map();
  let cursor = Math.max(1, era - LOG_WINDOW);
  const MAX_WINDOWS = 96;
  for (let w = 0; w < MAX_WINDOWS && cursor <= latest; w++) {
    const to = Math.min(cursor + LOG_WINDOW - 1, latest);
    const [mints, burns] = [await mintLogs(cursor, to), await burnLogs(cursor, to)];
    for (const l of mints) if (wanted.has(l.tokenId) && !mintsFound.has(l.tokenId)) mintsFound.set(l.tokenId, l);
    for (const l of burns) if (wanted.has(l.tokenId) && !burnsFound.has(l.tokenId)) burnsFound.set(l.tokenId, l);
    process.stdout.write(
      `  ${cursor}..${to}  mints ${mintsFound.size}/${wanted.size}  burns ${burnsFound.size}/${wanted.size}\r`,
    );
    if (burnsFound.size === wanted.size && mintsFound.size === wanted.size) break;
    cursor = to + 1;
    await sleep(120);
  }
  console.log('');

  for (const rec of records) {
    const m = mintsFound.get(rec.id);
    const b = burnsFound.get(rec.id);
    if (m) {
      rec.mintBlock = m.block;
      rec.mintTimestamp = await blockTimestamp(m.block);
    }
    if (b) {
      rec.burnBlock = b.block;
      rec.burnTx = b.tx;
      rec.burnTimestamp = await blockTimestamp(b.block);
    }
  }

  const missingDates = records.filter((r) => r.burnTimestamp == null).map((r) => r.id);
  if (missingDates.length) {
    console.log(`  burn date unrecovered (recorded null): ${missingDates.join(', ')}`);
  }

  // 4. Write the ledger.
  const payload = {
    generatedAt: new Date().toISOString(),
    note:
      'Recovered once by hand with scripts/recover-potters-field.mjs. ' +
      'No Ethereum call happens in the PointCast build or request path. ' +
      'Nouns art is CC0.',
    chain: 'ethereum-mainnet',
    contracts: { token: TOKEN, descriptor: DESCRIPTOR, auctionHouse: AUCTION_HOUSE },
    scan: {
      floor: SCAN_FLOOR,
      liveAuctionId: liveId,
      headBlock: latest,
      burnedCount: records.length,
      runs: runs.map(([a, b]) => ({ from: a, to: b })),
    },
    nouns: records.map((r) => ({
      id: r.id,
      seed: r.seed,
      seedTuple: r.seedTuple,
      mintBlock: r.mintBlock,
      mintTimestamp: r.mintTimestamp,
      burnBlock: r.burnBlock,
      burnTimestamp: r.burnTimestamp,
      burnTx: r.burnTx,
      svg: `/potters-field/${r.id}.svg`,
    })),
  };
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(
    `\nwrote ${records.length} svgs to public/potters-field/ and src/data/potters-field.json`,
  );
  console.log(`${rpcCalls} rpc calls · ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('\nrecovery failed:', err.message);
  process.exitCode = 1;
});
