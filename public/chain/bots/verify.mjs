// verify.mjs: replay the PointCast devnet from genesis with the Block Yard's
// verifier. Node 22 or newer. It only reads. Keep verify.js and
// pointcast_chain.wasm (from https://pointcast.xyz/chain/yard/verifier/) and
// package.json ({"type":"module"}) beside it.
// Guide: https://pointcast.xyz/chain/bots/#trust · a devnet: no value, may reset.
import { readFile } from "node:fs/promises";
import { PointcastVerifier, parseJson } from "./verify.js";

const DEVNET = "https://pointcast-devnet.mhoydich.workers.dev";
const GENESIS = "a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280";
const get = async (path) => {
  const r = await fetch(DEVNET + path);
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return parseJson(await r.text()); // lossless for u64s
};

const v = await PointcastVerifier.load(await readFile(new URL("./pointcast_chain.wasm", import.meta.url)));
v.call("verifier.new", { params: await get("/params"), genesis: GENESIS }); // refuses other params
for (let from = 1; ; ) {
  const page = await get(`/raw/blocks?from=${from}&limit=500`);
  if (!page.blocks.length) break;
  const out = v.call("verifier.push", { blocks: page.blocks });
  if (out.fault) throw new Error(`FAULT at height ${out.at_height}: ${out.fault} (${out.reason})`);
  console.log(`replayed to height ${out.height} · state root ${out.state_root} · no faults`);
  from = Number(out.height) + 1;
  if (from > Number(page.tip)) break;
}
