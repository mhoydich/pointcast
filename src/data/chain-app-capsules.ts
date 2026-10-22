/**
 * Facts and copy for /chain/capsules ("Time Capsules"), the page in
 * src/pages/chain/capsules.astro. The logic is public/chain/apps/capsules.js (no
 * DOM), the DOM side public/chain/apps/capsules-view.js, the shared key panel
 * public/chain/apps/key-panel.js; this file holds the words and the few
 * constants, so the page, the tests and the e2e script read them from one place.
 * The devnet pins come from src/data/chain-home.ts.
 *
 * A capsule is a commit and reveal (pointcast-chain crates/chain-core
 * capsule.rs, launch record 13): seal_capsule stores a commitment and a block
 * height; open_capsule, from anyone, at or after that height, reveals the salt
 * and the post. The author keeps the capsule file; lose it and the capsule never
 * opens. The wait is blocks, not minutes. devnet: no value, may reset.
 */

import { APPS_BLOCK, HONESTY } from './chain-apps.ts';

export const APP = {
  path: '/chain/capsules',
  key: 'capsules',
  title: 'Time Capsules',
  block: APPS_BLOCK,
  description:
    'Seal a message on the PointCast devnet and open it at a block you pick. The chain holds only a commitment until you reveal the message; lose the capsule file and it never opens. The wait is counted in blocks, which are seconds apart when the devnet is busy and five minutes apart when it is quiet. devnet: no value, may reset.',
} as const;

export const HONESTY_LINE = HONESTY;

export const HOW_STEPS: { title: string; text: string }[] = [
  {
    title: 'You seal',
    text: 'The page hashes your message with a random salt into one commitment and signs a seal_capsule transaction with your key. On chain go only the commitment, the channel, the block it may open at, and a short label for the wax seal. Not the message, and not the salt.',
  },
  {
    title: 'You keep the capsule file',
    text: 'The message and the salt stay in a small file the page hands you. Without it the capsule never opens. With it, anyone can read the message early, and anyone can open the capsule once its block comes.',
  },
  {
    title: 'The block comes',
    text: 'From the block you chose until the capsule lapses, anyone holding the file may open it. The devnet will not take an open before its block, so a message cannot be forced out early by the chain; but an open you send yourself too early would sit in the mempool in the clear, so the page refuses to send one.',
  },
  {
    title: 'It airs',
    text: 'Opening stores the message and reveals the salt in a signed open_capsule transaction. The chain checks they hash to the commitment, and the post airs as its author’s, on the channel you chose. A capsule opens once, and then it is public.',
  },
];

export const KEEP_COPY = {
  lose: 'Lose the capsule file and the capsule never opens: the chain holds only the commitment, and nothing else can bring the message back.',
  leak: 'Anyone who holds the file can read your message before it opens. Treat it as the message itself.',
  open: 'Opening is public and permanent on this devnet, until a reset. A message you would not want read by everyone should not be sealed here.',
  reset: 'A reset erases every sealed capsule, sealed or not. It is dated and recorded, never silent, and it takes the commitments with it; your file would then name a capsule the devnet no longer has.',
} as const;

export const WAIT_COPY =
  'A capsule waits in blocks, not minutes. The devnet seals a block within a few seconds when something is posted and otherwise one every five minutes, so 100 blocks is anywhere from five minutes to eight hours. The page says what that looks like at the rate the devnet has been keeping, and at both extremes.';

export const NOT_LIST: string[] = [
  'It is not encryption. The chain does not hide your message with a key; it holds a commitment that cannot be matched to the message without the salt, and the salt is 32 random bytes. Whoever has the file has the message.',
  'It does not choose the moment. It chooses a block height, and the devnet decides how long a block takes.',
  'It does not make anyone open it. A capsule nobody opens before it lapses is never revealed, and the chain forgets it.',
  'It is not a promise. One server runs the devnet, it has no value, and it may reset. A reset is dated and recorded, and the capsules do not survive it.',
];

/**
 * The same steps in code, as a file for Node 22 or newer with the SDK beside it.
 * The page prints exactly this text; tests/chain-app-capsules.test.mjs runs it
 * against a local devnet. It checks the capsule is due from GET /capsules and
 * posts the signed open to POST /tx itself, so it needs nothing beyond the routes
 * the devnet has always had. Plain strings, no template literals.
 */
export function codeSnippet(devnet: string, genesis: string): string {
  return [
    '// capsule.mjs · Node 22+ · keep pointcast-chain.js (the SDK) beside this file',
    '// usage: SEED=<64 hex> node capsule.mjs seal "a title" "the message" 20    (opens 20 blocks on)',
    '//        SEED=<64 hex> node capsule.mjs open capsule.json',
    'import { readFileSync, writeFileSync } from "node:fs";',
    'import * as pcc from "./pointcast-chain.js";',
    'const DEVNET = "' + devnet + '", GENESIS = "' + genesis + '"; // any ed25519 seed is a tz1 account',
    'const key = await crypto.subtle.importKey("pkcs8", new Uint8Array([...pcc.hexToBytes("302e020100300506032b657004220420"), ...pcc.hexToBytes(process.env.SEED)]), { name: "Ed25519" }, true, ["sign"]);',
    'const pub = { scheme: "ed25519", bytes: Buffer.from((await crypto.subtle.exportKey("jwk", key)).x, "base64url").toString("hex") };',
    'const me = pcc.tezosAddress(pub), chain = await pcc.connect(DEVNET, { expect: { genesisHash: GENESIS } });',
    'const post = (path, body) => fetch(DEVNET + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());',
    'const send = async (tx) => post("/tx", { tx, public_key: pub, signature: pcc.bytesToHex(new Uint8Array(await crypto.subtle.sign("Ed25519", key, pcc.hexToBytes(pcc.signingHash(tx, chain.domain))))) });',
    'const [cmd, a, b, c] = process.argv.slice(2);',
    'if (cmd === "seal") {',
    '  const open_at = (await chain.status()).height + Number(c), cm = pcc.capsuleCommitment(chain.domain, { author: me, channel: "BOT", title: a, body_hash: pcc.bodyHash(b), media_uri: null });',
    '  console.log("sealed:", (await send(pcc.buildTx("seal_capsule", { sender: me, nonce: await chain.nextNonce(me), channel: "BOT", commitment: cm.commitment, open_at, label: "sealed from a script" }))).tx_hash);',
    '  writeFileSync("capsule.json", JSON.stringify({ capsule: cm.capsule, salt: cm.salt, title: a, body: b, open_at }, null, 2)); // keep it: without the salt it never opens',
    '} else {',
    '  const f = JSON.parse(readFileSync(a, "utf8")), row = (await (await fetch(DEVNET + "/capsules")).json()).capsules.find((x) => x.id === f.capsule);',
    '  if (!row || !row.due) throw new Error("not open yet (or not listed): it opens at block " + f.open_at); // sending early would burn the salt',
    '  await post("/body", { body: f.body });',
    '  const tx = pcc.buildTx("open_capsule", { sender: me, nonce: await chain.nextNonce(me), capsule: f.capsule, salt: f.salt, title: f.title, body_hash: pcc.bodyHash(f.body) });',
    '  console.log("opened:", (await send(tx)).tx_hash);',
    '}',
  ].join('\n');
}
