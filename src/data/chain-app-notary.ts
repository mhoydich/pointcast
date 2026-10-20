/**
 * Facts and copy for /chain/notary ("Notary"), the page in
 * src/pages/chain/notary.astro. The logic is public/chain/apps/notary.js (no
 * DOM), the DOM side public/chain/apps/notary-view.js, the shared key panel
 * public/chain/apps/key-panel.js; this file holds the words and the few
 * constants, so the page, the tests and the e2e script read them from one place.
 * The devnet pins come from src/data/chain-home.ts.
 *
 * A stamp is a signed post on channel NOTARY whose body is five plain lines
 * (notary/v1, sha256:, bytes:, optional name:, optional note:). Only the hash
 * goes on chain; the file is read in the browser and goes nowhere. A stamp is
 * one server's accountable claim on a chain that may reset: it is not anchored
 * anywhere, and it does not show who wrote the file.
 */

import { APPS_BLOCK, HONESTY } from './chain-apps.ts';

export const APP = {
  path: '/chain/notary',
  key: 'notary',
  title: 'Notary',
  block: APPS_BLOCK,
  description:
    'Stamp a file’s SHA-256 on the PointCast devnet and check a stamp later, in your browser. The file never leaves it: only its hash goes on chain, in a post you sign with a key you make here. A stamp is one server’s accountable claim on a chain that may reset. devnet: no value, may reset.',
} as const;

export const HONESTY_LINE = HONESTY;

export const CHANNEL = 'NOTARY';

export const PROVES: string[] = [
  'A transaction signed by one key, naming this exact SHA-256, was sealed into a block by this devnet’s sequencer.',
  'The block’s header names the hash of the block before it, is sealed under the genesis key, and commits to this transaction through its tx_root. The page checks all of that when you check a stamp.',
  'The sequencer put a time on that block. The file’s hash existed by then, or someone who held the file stamped a hash of it.',
];

export const NOT_PROVES: string[] = [
  'Who holds the key. A key is free and anonymous; a stamp from it is a claim by that key, not by a person.',
  'Who wrote the file, or that it is genuine. It shows only that someone with the file’s bytes stamped its hash by that time.',
  'That the time is true. It is the sequencer’s clock; one server runs this devnet and could seal whatever time it liked. A witness or a stamp is an accountable claim, not proof.',
  'That it will last. The devnet has no value and may reset, and a reset wipes every stamp: dated and recorded, never silent. Keep the receipt, and keep the block if it matters.',
  'Anything about the file’s content. Only its SHA-256 and its size go on chain, plus a name and a note if you chose to add them, and those are public.',
];

export const STAMP_LINES: { line: string; what: string }[] = [
  { line: 'notary/v1', what: 'the format, so a reader knows what the rest is' },
  { line: 'sha256:<64 hex>', what: 'the file’s SHA-256, lower case' },
  { line: 'bytes:<number>', what: 'the file’s size in bytes' },
  { line: 'name:<text>', what: 'optional, up to 60 characters, only if you tick the box' },
  { line: 'note:<text>', what: 'optional, up to 140 characters' },
];

export const NOT_ANCHORED =
  'A stamp is not anchored to Tezos or any other chain: the devnet does not anchor. Treat it as a rehearsal for stamps that are, and as a public, checkable note from one server.';

/**
 * The same check from a terminal, as a file for Node 22 or newer with the SDK
 * beside it. The page prints exactly this text; tests/chain-app-notary.test.mjs
 * runs it against a local devnet. Plain strings, no template literals.
 */
export function checkSnippet(devnet: string, genesis: string): string {
  return [
    '// notary-check.mjs · Node 22+ · keep pointcast-chain.js (the SDK) beside this file',
    '// usage: node notary-check.mjs <file> <block height> <tx id>',
    'import { readFileSync } from "node:fs";',
    'import { createHash } from "node:crypto";',
    'import * as pcc from "./pointcast-chain.js";',
    'const DEVNET = "' + devnet + '", GENESIS = "' + genesis + '";',
    'const [file, height, txid] = process.argv.slice(2);',
    'const get = async (p) => pcc.parseJsonExact(await (await fetch(DEVNET + p)).text());',
    'if (pcc.paramsHash(await get("/params")) !== GENESIS) throw new Error("not the pinned devnet");',
    'const sha = createHash("sha256").update(readFileSync(file)).digest("hex");',
    'const block = await get("/raw/block/" + height);',
    'const stx = block.txs.find((t) => pcc.txHash(t) === txid);',
    'const body = await (await fetch(DEVNET + "/body/" + stx.tx.body_hash)).text();',
    'console.log("in the block, committed by tx_root:", pcc.txRoot(block.txs) === block.header.tx_root);',
    'console.log("body hashes to the signed body_hash:", pcc.bodyHash(body) === stx.tx.body_hash);',
    'console.log("body names your file:", body.split("\\n")[1] === "sha256:" + sha);',
  ].join('\n');
}
