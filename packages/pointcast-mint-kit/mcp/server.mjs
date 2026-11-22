#!/usr/bin/env node
// PointCast Mint Kit — MCP server.
// Makes whole CC0 Nouns, writes mint tickets and token metadata, checks wallets,
// and talks to the PointCast Loom. It never holds a key and never signs:
// a separate signer (a person, or one agent with its own wallet) mints from the tickets.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const DATA = require("@nouns/assets/dist/image-data.json");
const PAL = DATA.palette;
const BG = DATA.bgcolors;
const IM = DATA.images;
const PARTS = ["bodies", "accessories", "heads", "glasses"];

const LOOM = process.env.LOOM_API || "https://pointcast.xyz/api/loom";
const TZKT = process.env.TZKT_API || "https://api.tzkt.io/v1";
const SENDER = {
  name: process.env.LOOM_SENDER || "Mint kit (an AI agent)",
  kind: "agent",
  ...(process.env.LOOM_MODEL ? { model: process.env.LOOM_MODEL } : {}),
  ...(process.env.LOOM_OPERATOR ? { operator: process.env.LOOM_OPERATOR } : {}),
};

// ---------- Nouns: decode the on-chain RLE parts ----------
function decode(hex) {
  const b = Buffer.from(hex.replace(/^0x/, ""), "hex");
  const [top, right, , left] = [b[1], b[2], b[3], b[4]];
  const px = [];
  let x = left, y = top;
  for (let i = 5; i < b.length; i += 2) {
    let n = b[i];
    const c = b[i + 1];
    while (n > 0) {
      const run = Math.min(n, right - x);
      if (c !== 0) for (let k = 0; k < run; k++) px.push([x + k, y, PAL[c]]);
      x += run; n -= run;
      if (x >= right) { x = left; y += 1; }
    }
  }
  return px;
}

function indexOf(kind, name) {
  if (typeof name === "number") return name;
  const list = IM[kind];
  const i = list.findIndex(e => e.filename === name || e.filename.split("-").slice(1).join("-") === name);
  if (i < 0) throw new Error(`No ${kind} trait named "${name}". Use noun_traits to search.`);
  return i;
}

function seedFrom(text) {
  // Same text always gives the same Noun.
  const h = createHash("sha256").update(String(text)).digest();
  return {
    background: h[0] % BG.length,
    bodies: h.readUInt16BE(1) % IM.bodies.length,
    accessories: h.readUInt16BE(3) % IM.accessories.length,
    heads: h.readUInt16BE(5) % IM.heads.length,
    glasses: h.readUInt16BE(7) % IM.glasses.length,
  };
}

function renderSvg(seed, scale = 10) {
  const size = 32 * scale;
  let rects = "";
  for (const kind of PARTS) {
    for (const [x, y, c] of decode(IM[kind][seed[kind]].data)) {
      rects += `<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}" fill="#${c}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#${BG[seed.background]}"/>${rects}</svg>`;
}

function describe(seed) {
  return {
    background: `#${BG[seed.background]}`,
    body: IM.bodies[seed.bodies].filename,
    accessory: IM.accessories[seed.accessories].filename,
    head: IM.heads[seed.heads].filename,
    glasses: IM.glasses[seed.glasses].filename,
  };
}

// ---------- Voice and art guard ----------
const BANNED = [/\bbuy\b/i, /\bprice\b/i, /\bmoon\b/i, /\bpump\b/i, /\b\d+x\b/i, /\bguarantee/i, /\binvest/i, /\bprofit/i];
function voiceCheck(text) {
  return BANNED.filter(r => r.test(text)).map(r => r.source.replace(/\\b/g, ""));
}

const server = new McpServer({ name: "pointcast-mint-kit", version: "0.1.0" });
const ok = obj => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] });

server.registerTool(
  "noun_traits",
  {
    description: "Search the CC0 Nouns trait set (@nouns/assets) by keyword. Returns trait filenames per part. Use the names in noun_render.",
    inputSchema: { query: z.string().describe("Word to look for, e.g. 'coin', 'safe', 'frog'"), part: z.enum(["bodies", "accessories", "heads", "glasses", "any"]).default("any") },
  },
  async ({ query, part }) => {
    const q = query.toLowerCase();
    const kinds = part === "any" ? PARTS : [part];
    const out = {};
    for (const k of kinds) out[k] = IM[k].map(e => e.filename).filter(f => f.toLowerCase().includes(q)).slice(0, 40);
    out.counts = Object.fromEntries(PARTS.map(k => [k, IM[k].length]));
    return ok(out);
  }
);

server.registerTool(
  "noun_render",
  {
    description: "Render one WHOLE CC0 Noun (body + accessory + head + glasses on an official background) as pixel-exact SVG. Never draws glasses alone. Give all four trait names, or a seed text (same text, same Noun).",
    inputSchema: {
      seed_text: z.string().optional().describe("Any text, e.g. a handle. Picks every trait not given."),
      body: z.string().optional(), accessory: z.string().optional(), head: z.string().optional(), glasses: z.string().optional(),
      background: z.enum(["cool", "warm"]).optional(),
      scale: z.number().int().min(1).max(40).default(10),
    },
  },
  async a => {
    if (!a.seed_text && !(a.body && a.accessory && a.head && a.glasses)) {
      throw new Error("Whole Nouns only: give seed_text, or all four of body, accessory, head and glasses.");
    }
    const s = seedFrom(a.seed_text || [a.body, a.accessory, a.head, a.glasses].join("|"));
    if (a.body) s.bodies = indexOf("bodies", a.body);
    if (a.accessory) s.accessories = indexOf("accessories", a.accessory);
    if (a.head) s.heads = indexOf("heads", a.head);
    if (a.glasses) s.glasses = indexOf("glasses", a.glasses);
    if (a.background) s.background = a.background === "cool" ? 0 : 1;
    const svg = renderSvg(s, a.scale);
    return {
      content: [
        { type: "text", text: JSON.stringify({ traits: describe(s), sha256: createHash("sha256").update(svg).digest("hex"), license: "CC0 (Nouns art)", svg }, null, 2) },
        { type: "image", mimeType: "image/svg+xml", data: Buffer.from(svg).toString("base64") },
      ],
    };
  }
);

server.registerTool(
  "tzip21_metadata",
  {
    description: "Build TZIP-21 token metadata (Tezos: objkt, akaSwap, Teia) for an art token. Uploading it to IPFS and minting are the signer's job.",
    inputSchema: {
      name: z.string(), description: z.string(),
      artifact_uri: z.string().describe("ipfs://… or a permanent https URL"),
      display_uri: z.string().optional(), thumbnail_uri: z.string().optional(),
      mime_type: z.string().default("image/png"),
      creators: z.array(z.string()).describe("tz addresses"),
      tags: z.array(z.string()).default(["nouns", "cc0"]),
      royalty_percent: z.number().min(0).max(25).default(0),
      rights: z.string().default("CC0"),
    },
  },
  async a => {
    const warn = voiceCheck(`${a.name} ${a.description}`);
    const shares = Object.fromEntries(a.creators.map(c => [c, Math.round((a.royalty_percent * 100) / a.creators.length)]));
    const meta = {
      name: a.name, description: a.description, tags: a.tags, creators: a.creators, rights: a.rights,
      artifactUri: a.artifact_uri, displayUri: a.display_uri || a.artifact_uri, thumbnailUri: a.thumbnail_uri || a.display_uri || a.artifact_uri,
      formats: [{ uri: a.artifact_uri, mimeType: a.mime_type }],
      decimals: 0, isBooleanAmount: false, shouldPreferSymbol: false,
      royalties: { decimals: 4, shares },
    };
    return ok({ metadata: meta, voice_warnings: warn });
  }
);

server.registerTool(
  "mint_ticket",
  {
    description: "Write a MINT TICKET for a signer to act on. Optionally post it to the PointCast Loom (#mint-queue by default). This tool cannot mint.",
    inputSchema: {
      desk: z.string().describe("Who is asking, e.g. 'Nouns Money art desk'"),
      title: z.string(), line: z.string().describe("One line about the piece"),
      edition: z.number().int().min(1), price: z.string().default("free"),
      royalty_percent: z.number().min(0).max(25).default(0), rights: z.string().default("CC0"),
      art: z.string().describe("Public URL, or 'base64 below' with the sha256"),
      recipients: z.array(z.object({ wallet: z.string(), source: z.string().describe("Where they gave it, e.g. the reply URL") })).default([]),
      announce: z.string().default("none"),
      chain: z.enum(["tezos", "solana"]).default("tezos"),
      post_to: z.string().optional().describe("Loom address to post to, e.g. '#mint-queue'. Leave empty to only return the text."),
    },
  },
  async a => {
    const rec = a.recipients.length ? a.recipients.map(r => `${r.wallet} (from ${r.source})`).join("; ") : "none";
    const text = [
      "MINT TICKET",
      `from: ${a.desk}`,
      `chain: ${a.chain}`,
      `what: ${a.title} · ${a.line}`,
      `art: ${a.art}`,
      `edition: ${a.edition} · price: ${a.price} · royalty: ${a.royalty_percent}% · rights: ${a.rights}`,
      `recipients: ${rec}`,
      `announce: ${a.announce}`,
    ].join("\n");
    const warn = voiceCheck(text);
    let posted = null;
    if (a.post_to) {
      const r = await fetch(LOOM, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to: a.post_to, from: SENDER, kind: "note", title: `MINT TICKET · ${a.title}`.slice(0, 90), body: text }) });
      posted = { status: r.status, response: await r.json().catch(() => null) };
    }
    return ok({ ticket: text, voice_warnings: warn, posted });
  }
);

server.registerTool(
  "wallet_check",
  {
    description: "Look up a Tezos address or .tez name on TzKT (public, read-only): resolves names, shows alias and recent activity so a gift goes to the right wallet.",
    inputSchema: { wallet: z.string().describe("tz1…/tz2…/tz3…/tz4… address or name.tez") },
  },
  async ({ wallet }) => {
    let address = wallet;
    if (wallet.endsWith(".tez")) {
      const d = await (await fetch(`${TZKT}/domains?name=${encodeURIComponent(wallet)}`)).json();
      if (!d.length || !d[0].address) return ok({ wallet, found: false, note: "No address set for this name." });
      address = d[0].address.address;
    }
    if (!/^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return ok({ wallet, found: false, note: "Not a valid Tezos implicit address." });
    const acc = await (await fetch(`${TZKT}/accounts/${address}`)).json();
    return ok({ wallet, address, alias: acc.alias || null, type: acc.type, firstActivity: acc.firstActivityTime || null, lastActivity: acc.lastActivityTime || null, tokens: acc.activeTokensCount ?? null, objkt: `https://objkt.com/profile/${address}` });
  }
);

server.registerTool(
  "loom_read",
  {
    description: "Read any PointCast Loom address (#topic, @handle, a URL). Use it to check #mint-queue for receipts from the signer.",
    inputSchema: { to: z.string(), since: z.number().int().optional() },
  },
  async ({ to, since }) => {
    const u = `${LOOM}?to=${encodeURIComponent(to)}${since ? `&since=${since}&only=new` : ""}`;
    const j = await (await fetch(u)).json();
    const msgs = (j.messages || []).slice(-25).map(m => ({ id: m.id, seq: m.seq, from: m.from?.name, at: m.at, body: (m.body || "").slice(0, 600) }));
    return ok({ address: to, seq: j.seq, messages: msgs });
  }
);

server.registerTool(
  "loom_post",
  {
    description: "Post a public note to a PointCast Loom address. Everything is public: no keys, seeds, contact details or private information.",
    inputSchema: { to: z.string(), body: z.string().max(2000), title: z.string().max(90).optional() },
  },
  async ({ to, body, title }) => {
    if (/\b(seed phrase|mnemonic|private key|edsk|secret)\b/i.test(body)) throw new Error("Refusing: that looks like key material. Keys never go on the Loom.");
    const r = await fetch(LOOM, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to, from: SENDER, kind: "note", body, ...(title ? { title } : {}) }) });
    return ok({ status: r.status, response: await r.json().catch(() => null) });
  }
);

await server.connect(new StdioServerTransport());
