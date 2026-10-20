/**
 * Facts and copy for /chain/verify-a-block ("Verify a block by hand"), the
 * interactive lesson in src/pages/chain/verify-a-block.astro. The logic is
 * public/chain/apps/verify.js (no DOM) and the DOM side is
 * public/chain/apps/verify-view.js; this file holds only the words and the
 * few constants of this app, so the page, the tests and the e2e script read
 * them from one place.
 *
 * The devnet pins (URL, genesis, chain id, reset date) are read from
 * src/data/chain-home.ts by the page, never typed here. The copy is honest:
 * devnet, no value, may reset; a signature or a witness is an accountable
 * claim, not proof of truth.
 */

import { readFileSync } from 'node:fs';

export const APP = {
  path: '/chain/verify-a-block',
  title: 'Verify a block by hand',
  /** The wire block for this page does not exist yet; the integrator sets it. ChainHeader links it. */
  block: '0660',
  description:
    'Pick any block on the PointCast devnet and check it yourself, in your browser: the hash link to its neighbours, the sequencer’s signature, every transaction id and the tx_root, every transaction signature. Then flip one byte and watch which check catches it. devnet: no value, may reset.',
} as const;

/** The honesty line the page carries verbatim (and a test looks for). */
export const HONESTY_LINE = 'devnet · no value · may reset';

/** The SDK file with blockHeaderHash, sealDigest and txRoot. /chain/sdk/pointcast-chain.js is the older v0.1 file without them. */
export const SDK_PATH = '/chain/first-mints/lib/pointcast-chain.js';

export const WASM_PATH = '/chain/yard/verifier/pointcast_chain.wasm';
/** The sha256 the Block Yard pins for the verifier wasm (its .sha256 file); read at build time, with this as the fallback. */
const WASM_SHA256_FALLBACK = '7467bfd9afb34a9a37a177d1f9236e529b2b827bb5dfa07f7e6e12263af4acd4';
export const WASM_SHA256: string = (() => {
  try {
    const m = readFileSync('public/chain/yard/verifier/pointcast_chain.wasm.sha256', 'utf8').match(/\b[0-9a-f]{64}\b/);
    return m ? m[0] : WASM_SHA256_FALLBACK;
  } catch {
    return WASM_SHA256_FALLBACK;
  }
})();

export type StepCopy = { id: string; n: number; title: string; what: string; tool: string };

/** The five steps, in the words the page prints under each heading. Titles match STEP_TITLES in verify.js. */
export const STEPS: StepCopy[] = [
  {
    id: 'fetch',
    n: 1,
    title: 'Fetch the block and its neighbours',
    what: 'The page asks the devnet for three blocks: the one you picked and the two beside it, plus the genesis parameters. A block is a header (its height, the previous block’s hash, a timestamp, a Merkle root over its transactions, the state root and the sequencer’s seal) and a list of signed transactions. Nothing is checked yet beyond this: the server answered with the heights you asked for. From here on the server is out of the picture. Every check below is arithmetic on bytes you already hold.',
    tool: 'Tool: your browser’s fetch, reading GET /raw/block/N−1, N and N+1, /params and /status.',
  },
  {
    id: 'link',
    n: 2,
    title: 'Recompute the header hash and check the links',
    what: 'A block’s hash is BLAKE2b-256 over one fixed byte string: the domain name pointcast-chain/header/v1, then the height, the previous block’s hash, the timestamp, the tx_root and the state_root. The seal is not part of it. The next block must carry this hash as its prev_hash, and this block must carry the hash of the one before it. Change a single byte of any field in any of the three headers and a hash changes, and a link no longer matches.',
    tool: 'Tool: blockHeaderHash from the PointCast Chain SDK, over the bytes shown here; blake2b is the SDK’s.',
  },
  {
    id: 'seal',
    n: 3,
    title: 'Check the sequencer’s seal',
    what: 'The sequencer signs one thing per block: BLAKE2b-256 over the domain pointcast-chain/seal/v2, the genesis hash and the header hash, with an ed25519 key. Binding in the genesis hash means a seal made for one chain cannot pass as another’s. The key comes from /params, so first the page hashes /params and compares the result with the genesis hash it trusts. Without that comparison the key could be anyone’s.',
    tool: 'Tool: paramsHash, sealDigest and verifyEd25519 (your browser’s WebCrypto) from the SDK.',
  },
  {
    id: 'txroot',
    n: 4,
    title: 'Recompute every transaction id and the tx_root',
    what: 'A transaction id is BLAKE2b-256 over the domain pointcast-chain/txid/v1 and the signed transaction’s canonical bytes: the transaction, then the key scheme, the key and the signature. Each id becomes a leaf, BLAKE2b-256 of 0x00 and the id. Two neighbours combine as BLAKE2b-256 of 0x01 and both; an odd one moves up unchanged; an empty block has one fixed root. The result must equal the tx_root in the header. That is how a sealed header commits to exactly these transactions, in exactly this order, signatures included.',
    tool: 'Tool: encodeTx, txHash and txRoot from the SDK. The tree drawn here is built with the SDK’s blake2b and compared with its txRoot.',
  },
  {
    id: 'sigs',
    n: 5,
    title: 'Check each signature and where the sender comes from',
    what: 'A sender signs BLAKE2b-256 over the domain pointcast-chain/tx/v2, the chain id, the genesis hash and the transaction’s canonical bytes. The page checks that ed25519 signature with the key carried in the transaction, then derives an address from the key (a BLAKE2b-160 hash of it, with the address prefix) and compares it with the sender field. A wallet-signed transaction signs a packed text message instead. A passkey transaction signs with P-256 and is not checked here. With the pinned wasm verifier loaded, the chain’s own Rust code computes the signing digest too.',
    tool: 'Tool: signingHash, verifyEd25519, tezosAddress and agentAddress from the SDK; optionally tx.wallet in the pinned wasm verifier.',
  },
];

export const PROVES: string[] = [
  'The header of the block you hold is exactly what the sequencer key named in the pinned genesis signed, with this chain’s genesis bound into the signature.',
  'Its header names the hash of the block before it, and the block after it names its hash, so the three headers hold together.',
  'Its transactions are the ones that header commits to through the tx_root, and each is signed by the key it carries, with the sender’s address derived from that key.',
  'After the walk below: every header from block 1 to this one links and is sealed, so the block sits on one unbroken chain from the genesis you pinned.',
];

export const NOT_PROVES: string[] = [
  'The state root is not recomputed. A balance, an owner or a count follows only from replaying every block through the chain’s rules. That is what VERIFY in the Block Yard does, in your browser, and what pcv.py and verify.mjs do from a terminal.',
  'No rule is checked: nonces, who may do what, mandates, limits. A correctly signed transaction can still be one the chain’s rules would refuse.',
  'A seal is one server’s accountable claim. A sequencer that wanted to could seal two different versions of a block for two readers, and this page sees only the one it was served. Witnesses compare notes on the Daily Net, and a witness is a claim, not proof.',
  'The seal is checked against the key in the genesis parameters. After a sequencer rotation takes effect, later blocks carry the new key’s seal, and following that needs the key schedule the Block Yard replays.',
  'A passkey (P-256) signature is not checked here, and a transaction kind this page cannot encode leaves its block’s tx_root unchecked. Both are named when they happen.',
  'Nothing is anchored to Tezos. This is a devnet.',
];

export const TAMPER_COPY = {
  legend: 'Tamper with your copy',
  toggle: 'TAMPER: flip one byte of the fetched block, in memory',
  kind: 'What to flip',
  note: 'Only the copy in this browser tab changes. The devnet is never written to. Switch it on and the steps run again at once, so you can watch which check catches the change.',
  empty: 'This block holds no transactions, so the transaction choices are off. “A block with transactions” finds one.',
} as const;

/**
 * The same steps in code, as a runnable file for Node 22 or newer. The page
 * shows exactly this text; tests/chain-app-verify.test.mjs runs it against the
 * live devnet and a local one. Plain strings, no template literals.
 */
export function snippet(devnet: string, genesis: string): string {
  return [
    '// verify-a-block.mjs · Node 22+ · keep pointcast-chain.js (the SDK) beside this file',
    'import * as pcc from "./pointcast-chain.js";',
    'const DEVNET = "' + devnet + '", GENESIS = "' + genesis + '";',
    'const N = Number(process.argv[2] ?? 100); // 2 or more, and at least one block behind the tip',
    'const get = async (path) => pcc.parseJsonExact(await (await fetch(DEVNET + path)).text());',
    'const params = await get("/params");',
    'if (pcc.paramsHash(params) !== GENESIS) throw new Error("params do not hash to the pinned genesis");',
    'const [prev, blk, next] = await Promise.all([N - 1, N, N + 1].map((n) => get("/raw/block/" + n)));',
    'const h = blk.header, check = (ok, what) => console.log(ok ? "ok  " : "FAIL", what);',
    'check(pcc.blockHeaderHash(prev.header) === h.prev_hash, "block " + N + " names the hash of block " + (N - 1));',
    'check(pcc.blockHeaderHash(h) === next.header.prev_hash, "block " + (N + 1) + " names the hash of block " + N);',
    'check(await pcc.verifyEd25519(params.sequencer.bytes, pcc.hexToBytes(pcc.sealDigest(h, GENESIS)), h.sequencer_sig), "sequencer seal");',
    'check(pcc.txRoot(blk.txs) === h.tx_root, "tx_root rebuilds from the " + blk.txs.length + " transactions");',
    'const domain = pcc.domainOf(params.chain_id, GENESIS); // raw ed25519 signatures; the page also reads wallet-signed ones',
    'for (const t of blk.txs) check(await pcc.verifyEd25519(t.public_key.bytes, pcc.hexToBytes(pcc.signingHash(t.tx, domain)), t.signature), "signature of tx " + pcc.txHash(t).slice(0, 12));',
  ].join('\n');
}
