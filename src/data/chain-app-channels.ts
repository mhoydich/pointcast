/**
 * Facts and copy for /chain/channels ("Channels"), the page in
 * src/pages/chain/channels.astro. The logic is public/chain/apps/channels.js
 * (no DOM), the DOM side public/chain/apps/channels-view.js, the shared key
 * panel public/chain/apps/key-panel.js; this file holds the words and the few
 * constants, so the page, the tests and the e2e script read them from one place.
 * The devnet pins come from src/data/chain-home.ts.
 *
 * A channel is a code ([A-Z0-9]{1,16}) that posts are filed under. Launch
 * record 13 (pointcast-chain DESIGN.md section 4.6) lets a key claim a code as a
 * STATION: first come, first served. The owner chooses the mode (open: anyone
 * may post; crew: only the owner and a crew of up to 16 addresses) and the
 * crew. The house holds six codes from block 0. Nothing here moves value, and
 * the devnet may reset; a reset takes every claim with it.
 */

import { APPS_2_BLOCK, HONESTY } from './chain-apps.ts';
import { DEVNET_2_PROFILE } from './chain-home.ts';

export const APP = {
  path: '/chain/channels',
  key: 'channels',
  title: 'Channels',
  block: APPS_2_BLOCK,
  description:
    'Every broadcast channel on the PointCast devnet as an app: see who holds each code and what is on air, claim a free code, set it open or crew-only, add crew, and broadcast to a channel you own or crew. First come, first served. devnet: no value, may reset.',
} as const;

export const HONESTY_LINE = HONESTY;

/** Facts the page repeats. The live numbers are read from the devnet; these are the profile's, for the copy. */
export const STATION_FACTS = {
  maxPerAccount: DEVNET_2_PROFILE.maxStationsPerAccount,
  houseCodes: [...DEVNET_2_PROFILE.houseStations],
  nameBytes: 32,
  crewMax: 16,
  codeMax: 16,
} as const;

/** Codes the page does not offer for a claim, and why (public/chain/apps/channels.js RESERVED holds the same list; the tests compare). */
export const RESERVED_LANES: { codes: string[]; why: string }[] = [
  { codes: ['BOT'], why: 'the bots’ lane: keyless bot posts, and the sealed capsules, go here' },
  { codes: ['DLY'], why: 'the Daily Mint’s lane' },
  { codes: ['NET', 'OBS', 'WIT'], why: 'the Daily Net’s lanes: duties, observers and witness attestations' },
  { codes: ['NOTARY'], why: 'the Notary’s lane' },
  { codes: ['NM'], why: 'the Nouns Money station, which the house claims' },
  { codes: ['CRT', 'SPN', 'ESC', 'FCT', 'VST', 'BTL', 'BDY'], why: 'PointCast website channel codes (FD, GF and GDN are house codes already)' },
];

export const HOW_STEPS: { title: string; text: string }[] = [
  {
    title: 'You claim a code',
    text: 'claim_station names a channel code (capital letters and digits, up to 16), a name for the station (up to 32 bytes) and a mode. The first claim the devnet seals wins; every later claim on that code is refused with “someone else holds this station”. The page checks the rules before it signs and says in words what would be refused.',
  },
  {
    title: 'You choose who may post',
    text: 'Open mode lets anyone post on the channel: the station is then a name and a roster. Crew mode lets only you and the crew you list post, and seal time capsules. set_station replaces the crew, the pin and any standing offer all at once, so the page sends back the pin and the offer the station already has.',
  },
  {
    title: 'You broadcast',
    text: 'A post is a publish_block on your channel: a title that goes on chain and a body stored by its hash, where the devnet’s word filter reads it. In crew mode the chain refuses a post from anyone not on the list. The post shows in the channel’s feed here a few seconds after you send it.',
  },
  {
    title: 'The chain keeps the receipt',
    text: 'Each write returns a transaction hash and the block that holds it. The page then reads the station back and shows what the chain now says, so a receipt is a claim you can check against the chain, not a promise.',
  },
];

/** The two modes in words, for the explainer cards. The page’s own live sentence (channels.js modeWords) says the same about one channel. */
export const MODE_CARDS: { mode: 'open' | 'crew'; title: string; text: string }[] = [
  {
    mode: 'open',
    title: 'Open',
    text: 'Anyone with a devnet key can post on the channel. The station carries your name, and the crew list is only a roster. You still own the code: you can switch it to crew at any time.',
  },
  {
    mode: 'crew',
    title: 'Crew',
    text: 'Only you and the crew you list can post, and seal time capsules, on the channel. Anyone else is refused by the chain within a second, with “only this station’s owner and crew post or seal here”. Everyone can still read it.',
  },
];

export const RULES: { title: string; text: string }[] = [
  {
    title: 'First come, first served',
    text: 'The first claim the devnet seals for a code wins it. Nobody reviews a claim, and nobody can take a code back from its owner, the house included. The only way to let one go is to offer it to another person with set_station, which this page does not do for you.',
  },
  {
    title: 'A reset takes every claim',
    text: 'The devnet may reset. A reset starts a new chain from a new genesis: every claim, crew list and post goes with the old one, and the new chain does not promise anyone their code back. The house codes are claimed again by the new chain’s treasury. A reset is dated and recorded, never silent.',
  },
  {
    title: 'No value, no endorsement',
    text: 'A station is worth nothing and pays nothing: it is a code and a crew list on a play chain. Names carry no endorsement. PointCast does not vouch for any station, any name or anything broadcast on it, and a code that looks like a brand, a person or a place says nothing about them.',
  },
  {
    title: 'A channel is a code, not a trademark',
    text: 'Holding FOO on the devnet does not make you FOO anywhere else, and it does not stop anyone else being FOO. The page does not check a code against anyone’s name. Codes the website, the house and the devnet’s own lanes use are not offered for a claim here; that is this page’s rule, not the chain’s.',
  },
  {
    title: 'Limits the chain sets',
    text: 'A code is 1 to 16 capital letters and digits. A name is 1 to 32 bytes with no control or invisible formatting characters. A crew lists at most 16 addresses and never the owner. One account may hold a few stations at once (the house’s own codes count against nobody), and the devnet holds a fixed number in all. The page reads both limits from the devnet and says how many you hold.',
  },
  {
    title: 'Limits the devnet sets on sending',
    text: 'A post body is stored by its hash, at most 8 KiB on the devnet (this page stops at 4,000 bytes), and a title is at most 200 bytes (this page stops at 120 characters). One network address may send about 60 signed transactions a minute and store about 30 bodies a minute, and the devnet has a daily budget for everyone together. When a limit is hit the devnet says so in its own words and the page shows them.',
  },
];

/** What moderation exists on the devnet, exactly. Each line is from docs/DEVNET.md and the Worker’s source, and the tests pin the wording. */
export const MODERATION: { title: string; text: string }[] = [
  {
    title: 'The word filter',
    text: 'The devnet reads the body of a post when it is stored (POST /body) and refuses what matches a small, best-effort list, answering “kept off the devnet by its word filter”. Expect misses and the odd false alarm. The page shows that answer word for word and sends nothing else.',
  },
  {
    title: 'What the word filter does not read',
    text: 'It does not read a post’s title, a station’s code or a station’s name: those go onto the chain exactly as you sign them. A title or a name that would have been refused in a body can still be sealed.',
  },
  {
    title: 'What this page does about names and titles',
    text: 'Because the devnet does not read them, this page keeps a short word list of its own (the same one as the first-mints handle filter). It will not seal a station name or a post title that is on it, and it shows a name or a title it reads from the devnet that is on it as “[held back by this page’s word list]”. That is the page’s rule, not the chain’s: the chain still holds the real text, the devnet’s own views show it, and anyone who calls the chain directly can still seal one. The list is short and best-effort: expect a miss, and the odd harmless name held back.',
  },
  {
    title: 'The house can hide a post',
    text: 'The devnet’s keeper can hide a post. The devnet’s own views then show “[hidden by the devnet admin]” and hold back the body and any media link. The block is unchanged and still verifies, and anyone who replays the chain still sees the post. A hidden post is marked in the feed here.',
  },
  {
    title: 'The house can pause a keyless bot',
    text: 'That is the other tool: pausing one of the keyless bots. It does not touch a key you hold.',
  },
  {
    title: 'What the house cannot do',
    text: 'There is no route that takes a station back, renames it or hides its name, and none that removes a crew member for the owner. A crew-mode owner decides who posts on the channel, for as long as this chain lasts. The devnet’s own label, devnet-2 · bot · unmoderated, means what it says.',
  },
  {
    title: 'The page’s own guards',
    text: 'The page broadcasts only to a channel you own or crew, never to a house code or a code the house holds, and does not offer a claim on a code the devnet’s own lanes use. These are guards in the page. The chain, called directly, allows more.',
  },
];

export const NOT_LIST: string[] = [
  'It is not ownership of a name. A channel is a code one key holds on one server’s devnet: not a domain, not a trademark, and not a channel of the PointCast website.',
  'It is not moderated. Nobody reviews a claim, a name or a post before it is sealed, and the filter that exists reads only stored bodies.',
  'It is not private. Every claim, crew list, title and body is public on the devnet, and a crew-mode channel is still readable by everyone.',
  'It is not permanent. One server runs the devnet, it has no value, and it may reset. A reset is dated and recorded, and the claims do not survive it.',
];

/**
 * The same steps in code, as a file for Node 22 or newer with the SDK beside it.
 * The page prints exactly this text; scripts/e2e-chain-app-channels.mjs runs it
 * against a local devnet. It reads the station before it changes the crew, so a
 * pin or a standing offer already on the station is sent back unchanged, and it
 * stores a body by its hash before it posts. It refuses to claim a code that
 * something else posts to (RESERVED_LANES), as the page does, before it reads or
 * sends anything: the chain would take such a claim, and a crew-mode claim would
 * lock that lane out for good. Plain strings, no template literals.
 */
export function codeSnippet(devnet: string, genesis: string): string {
  return [
    '// channel.mjs · Node 22+ · keep pointcast-chain.js (the SDK) beside this file',
    '// usage: SEED=<64 hex> node channel.mjs claim MYCODE "My station" crew      (or open)',
    '//        SEED=<64 hex> node channel.mjs crew MYCODE tz1…,tz1…              (replaces the crew)',
    '//        SEED=<64 hex> node channel.mjs post MYCODE "a title" "the body"',
    '//                      node channel.mjs read MYCODE                         (the station, then its newest posts)',
    'import * as pcc from "./pointcast-chain.js";',
    'const DEVNET = "' + devnet + '", GENESIS = "' + genesis + '"; // any ed25519 seed is a tz1 account',
    'const [cmd, code, a, b] = process.argv.slice(2);',
    'const LANES = ' + JSON.stringify(RESERVED_LANES.flatMap((l) => l.codes)) + '; // codes something else posts to: the page never claims them',
    'if (cmd === "claim" && LANES.includes(code)) throw new Error(code + " is a code something else posts to: a crew-mode claim would lock it out for good. Pick another code.");',
    'const get = (p) => fetch(DEVNET + p).then((r) => r.json());',
    'const post = (p, body) => fetch(DEVNET + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());',
    'if (cmd === "read") {',
    '  console.log(await get("/station/" + code));',
    '  for (const blk of (await get("/feed?limit=100")).blocks) for (const t of blk.txs) if (t.kind === "publish_block" && t.payload.channel === code) console.log(blk.height, t.sender, t.payload.title);',
    '} else {',
    '  const key = await crypto.subtle.importKey("pkcs8", new Uint8Array([...pcc.hexToBytes("302e020100300506032b657004220420"), ...pcc.hexToBytes(process.env.SEED)]), { name: "Ed25519" }, true, ["sign"]);',
    '  const pub = { scheme: "ed25519", bytes: Buffer.from((await crypto.subtle.exportKey("jwk", key)).x, "base64url").toString("hex") };',
    '  const me = pcc.tezosAddress(pub), chain = await pcc.connect(DEVNET, { expect: { genesisHash: GENESIS } });',
    '  const send = async (tx) => post("/tx", { tx, public_key: pub, signature: pcc.bytesToHex(new Uint8Array(await crypto.subtle.sign("Ed25519", key, pcc.hexToBytes(pcc.signingHash(tx, chain.domain))))) });',
    '  const nonce = () => chain.nextNonce(me);',
    '  if (cmd === "claim") console.log(await send(pcc.buildTx("claim_station", { sender: me, nonce: await nonce(), code, name: a, mode: b })));',
    '  else if (cmd === "crew") { const st = await get("/station/" + code); console.log(await send(pcc.buildTx("set_station", { sender: me, nonce: await nonce(), code, crew: a.split(","), pinned: st.pinned, owner_to: st.offer }))); }',
    '  else if (cmd === "post") { const h = (await post("/body", { body: b })).body_hash; console.log(await send(pcc.buildTx("publish_block", { sender: me, nonce: await nonce(), channel: code, title: a, body_hash: h }))); }',
    '}',
  ].join('\n');
}
