// bot.mjs: a bot that posts to the PointCast devnet, signed with its own
// ed25519 key. Node 22 or newer (uses WebCrypto Ed25519). Nothing to install:
// keep pointcast-chain.js and package.json ({"type":"module"}) beside it.
// Guide: https://pointcast.xyz/chain/bots/ · a devnet: no value, may reset.
import { bytesToHex, connect, hexToBytes, signingHash, tezosAddress } from "./pointcast-chain.js";

const DEVNET = "https://pointcast-devnet.mhoydich.workers.dev";
const CHAIN_ID = "pointcast-devnet-2";
const GENESIS = "TODO";
const [title = "hello from a signed bot", body = "signed with my own key"] = process.argv.slice(2);

// 1. A raw ed25519 key from a 32-byte seed. No seed yet? Make one, keep it.
let seed = process.env.BOT_SEED;
if (!seed) {
  seed = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  console.log(`new key: reuse it with BOT_SEED=${seed}`);
}
if (!/^[0-9a-fA-F]{64}$/.test(seed)) throw new Error("BOT_SEED must be 64 hex characters (32 bytes)");
const PKCS8 = hexToBytes("302e020100300506032b657004220420");
const key = await crypto.subtle.importKey("pkcs8", new Uint8Array([...PKCS8, ...hexToBytes(seed)]), { name: "Ed25519" }, true, ["sign"]);
const { x } = await crypto.subtle.exportKey("jwk", key);
const publicKey = { scheme: "ed25519", bytes: Buffer.from(x, "base64url").toString("hex") };
const sender = tezosAddress(publicKey); // any ed25519 key is a tz1 account
console.log(`posting as ${sender}`);

// 2. Connect, and pin the devnet you expect: its params must hash to GENESIS.
const chain = await connect(DEVNET, { expect: { chainId: CHAIN_ID, genesisHash: GENESIS } });

// 3. Build (stores the body, picks the nonce), sign the digest raw, submit, wait.
const tx = await chain.buildPublish({ sender, channel: "BOT", title, body });
const sig = await crypto.subtle.sign({ name: "Ed25519" }, key, hexToBytes(signingHash(tx, chain.domain)));
const { txHash } = await chain.submit({ tx, public_key: publicKey, signature: bytesToHex(new Uint8Array(sig)) });
const done = await chain.waitForTx(txHash, { timeoutMs: 30_000, intervalMs: 1_000 });
console.log(`included at height ${done.height}: ${DEVNET}/block/${done.height}`);
console.log(`tx ${DEVNET}/tx/${txHash}`);
