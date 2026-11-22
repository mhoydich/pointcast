/**
 * PointCast Mint Kit — MCP tools for minting whole CC0 Nouns art through a public ticket queue.
 *
 * Pattern: many desks make, one signer signs. These tools render art, build token metadata,
 * write mint tickets and check wallets. None of them holds a key or signs. Tickets are posted
 * with the existing `loom_append` tool to #mint-queue, where a signer mints and replies.
 *
 * Art: renderPortrait() from nouns-parts.mjs, the official CC0 trait bytes. Whole Nouns only.
 */
import { createHash } from 'node:crypto';
import { renderPortrait } from './nouns-parts.mjs';
import { NOUN_BODIES, NOUN_ACCESSORIES, NOUN_HEADS, NOUN_GLASSES } from './loom/noun-traits.mjs';

const TZKT = 'https://api.tzkt.io/v1';
const PARTS = { body: NOUN_BODIES, accessory: NOUN_ACCESSORIES, head: NOUN_HEADS, glasses: NOUN_GLASSES };
const VOICE = [/\bbuy\b/i, /\bprice\b/i, /\bmoon\b/i, /\bpump\b/i, /\b\d+x\b/i, /\bguarantee/i, /\binvest/i, /\bprofit/i];

export const MINT_KIT_TOOL_NAMES = ['mint_noun_traits', 'mint_noun_render', 'mint_metadata', 'mint_ticket', 'mint_wallet_check'];

export const MINT_KIT_TOOLS = [
  {
    name: 'mint_noun_traits',
    description: 'PointCast Mint Kit. Search the CC0 Nouns trait set by keyword (bodies, accessories, heads, glasses). Use the filenames in mint_noun_render.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: "A word to look for, e.g. 'coin', 'safe', 'frog'." },
        part: { type: 'string', enum: ['body', 'accessory', 'head', 'glasses', 'any'], default: 'any' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'mint_noun_render',
    description: 'PointCast Mint Kit. Render one WHOLE CC0 Noun (body, accessory, head and glasses on an official background) as pixel-exact SVG from the official trait bytes. Never draws glasses alone. Give seed_text (same text, same Noun) or all four trait filenames.',
    inputSchema: {
      type: 'object',
      properties: {
        seed_text: { type: 'string', description: 'Any text, e.g. a handle. Picks every trait you do not give.' },
        body: { type: 'string' }, accessory: { type: 'string' }, head: { type: 'string' }, glasses: { type: 'string' },
        background: { type: 'string', enum: ['cool', 'warm'] },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mint_metadata',
    description: 'PointCast Mint Kit. Build TZIP-21 token metadata for a Tezos art token (objkt, akaSwap, Teia). Pinning and minting are the signer\'s job. Flags price talk.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' }, description: { type: 'string' },
        artifact_uri: { type: 'string', description: 'ipfs://… or a permanent https URL' },
        display_uri: { type: 'string' }, thumbnail_uri: { type: 'string' },
        mime_type: { type: 'string', default: 'image/png' },
        creators: { type: 'array', items: { type: 'string' }, description: 'tz addresses' },
        tags: { type: 'array', items: { type: 'string' } },
        royalty_percent: { type: 'number', minimum: 0, maximum: 25, default: 0 },
        rights: { type: 'string', default: 'CC0' },
      },
      required: ['name', 'description', 'artifact_uri', 'creators'],
      additionalProperties: false,
    },
  },
  {
    name: 'mint_ticket',
    description: 'PointCast Mint Kit. Write a MINT TICKET for the signer. Post the returned text with loom_append to #mint-queue; the signer mints and replies there with token links. This tool cannot mint.',
    inputSchema: {
      type: 'object',
      properties: {
        desk: { type: 'string', description: "Who is asking, e.g. 'Nouns Money art desk'." },
        title: { type: 'string' }, line: { type: 'string', description: 'One line about the piece.' },
        chain: { type: 'string', enum: ['tezos', 'solana'], default: 'tezos' },
        edition: { type: 'integer', minimum: 1 },
        price: { type: 'string', default: 'free' },
        royalty_percent: { type: 'number', minimum: 0, maximum: 25, default: 0 },
        rights: { type: 'string', default: 'CC0' },
        art: { type: 'string', description: 'A public URL, or "base64 below" plus its sha256.' },
        recipients: {
          type: 'array',
          items: {
            type: 'object',
            properties: { wallet: { type: 'string' }, source: { type: 'string', description: 'Where the person gave it, e.g. their reply URL.' } },
            required: ['wallet', 'source'],
            additionalProperties: false,
          },
        },
        announce: { type: 'string', default: 'none' },
      },
      required: ['desk', 'title', 'line', 'edition', 'art'],
      additionalProperties: false,
    },
  },
  {
    name: 'mint_wallet_check',
    description: 'PointCast Mint Kit. Look up a Tezos address or .tez name on TzKT (public, read-only) so a gift goes to the right wallet: resolved address, alias, activity, objkt profile link.',
    inputSchema: {
      type: 'object',
      properties: { wallet: { type: 'string', description: 'tz1…/tz2…/tz3…/tz4… address or name.tez' } },
      required: ['wallet'],
      additionalProperties: false,
    },
  },
];

function voiceWarnings(text) {
  return VOICE.filter((r) => r.test(text)).map((r) => r.source.replace(/\\b/g, ''));
}

function pick(list, bytes) {
  return list[bytes.readUInt16BE(0) % list.length];
}

function seedParts(text) {
  const h = createHash('sha256').update(String(text)).digest();
  return {
    background: h[0] % 2 ? 'warm' : 'cool',
    body: pick(NOUN_BODIES.filter((f) => f.startsWith('body-')), h.subarray(1, 3)),
    accessory: pick(NOUN_ACCESSORIES.filter((f) => f.startsWith('accessory-')), h.subarray(3, 5)),
    head: pick(NOUN_HEADS, h.subarray(5, 7)),
    glasses: pick(NOUN_GLASSES, h.subarray(7, 9)),
  };
}

function exact(kind, name) {
  const list = PARTS[kind];
  const full = name.startsWith(`${kind}-`) ? name : `${kind}-${name}`;
  if (!list.includes(full)) throw new Error(`No ${kind} named "${name}". Use mint_noun_traits to search.`);
  return full;
}

export async function runMintKitTool(name, args = {}, { fetchJson = async (url) => (await fetch(url)).json() } = {}) {
  switch (name) {
    case 'mint_noun_traits': {
      const q = String(args.query || '').toLowerCase();
      if (!q) throw new Error('query is required');
      const kinds = !args.part || args.part === 'any' ? Object.keys(PARTS) : [args.part];
      const matches = Object.fromEntries(kinds.map((k) => [k, PARTS[k].filter((f) => f.toLowerCase().includes(q)).slice(0, 40)]));
      return { matches, counts: Object.fromEntries(Object.entries(PARTS).map(([k, v]) => [k, v.length])), license: 'CC0 (Nouns art)' };
    }
    case 'mint_noun_render': {
      const given = ['body', 'accessory', 'head', 'glasses'].filter((k) => args[k]);
      if (!args.seed_text && given.length < 4) {
        throw new Error('Whole Nouns only: give seed_text, or all four of body, accessory, head and glasses.');
      }
      const parts = seedParts(args.seed_text || given.map((k) => args[k]).join('|'));
      for (const k of given) parts[k] = exact(k, String(args[k]));
      if (args.background) parts.background = args.background;
      const { svg, traits } = renderPortrait(parts);
      return { traits, filenames: parts, sha256: createHash('sha256').update(svg).digest('hex'), license: 'CC0 (Nouns art)', svg };
    }
    case 'mint_metadata': {
      const creators = Array.isArray(args.creators) ? args.creators : [];
      if (!creators.length) throw new Error('creators needs at least one tz address');
      const pct = Number(args.royalty_percent || 0);
      const shares = Object.fromEntries(creators.map((c) => [c, Math.round((pct * 100) / creators.length)]));
      const art = String(args.artifact_uri);
      return {
        metadata: {
          name: args.name, description: args.description, tags: args.tags || ['nouns', 'cc0'], creators, rights: args.rights || 'CC0',
          artifactUri: art, displayUri: args.display_uri || art, thumbnailUri: args.thumbnail_uri || args.display_uri || art,
          formats: [{ uri: art, mimeType: args.mime_type || 'image/png' }],
          decimals: 0, isBooleanAmount: false, shouldPreferSymbol: false,
          royalties: { decimals: 4, shares },
        },
        voice_warnings: voiceWarnings(`${args.name} ${args.description}`),
      };
    }
    case 'mint_ticket': {
      const rec = Array.isArray(args.recipients) && args.recipients.length
        ? args.recipients.map((r) => `${r.wallet} (from ${r.source})`).join('; ')
        : 'none';
      const ticket = [
        'MINT TICKET',
        `from: ${args.desk}`,
        `chain: ${args.chain || 'tezos'}`,
        `what: ${args.title} · ${args.line}`,
        `art: ${args.art}`,
        `edition: ${args.edition} · price: ${args.price || 'free'} · royalty: ${args.royalty_percent || 0}% · rights: ${args.rights || 'CC0'}`,
        `recipients: ${rec}`,
        `announce: ${args.announce || 'none'}`,
      ].join('\n');
      return { ticket, voice_warnings: voiceWarnings(ticket), next: 'Post with loom_append to #mint-queue, title "MINT TICKET · <title>". Art goes one image per message below it.' };
    }
    case 'mint_wallet_check': {
      const wallet = String(args.wallet || '').trim();
      let address = wallet;
      if (wallet.endsWith('.tez')) {
        const d = await fetchJson(`${TZKT}/domains?name=${encodeURIComponent(wallet)}`);
        if (!Array.isArray(d) || !d[0]?.address?.address) return { wallet, found: false, note: 'No address is set for this name.' };
        address = d[0].address.address;
      }
      if (!/^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return { wallet, found: false, note: 'Not a valid Tezos implicit address.' };
      const acc = await fetchJson(`${TZKT}/accounts/${address}`);
      return {
        wallet, address, found: true, alias: acc?.alias || null, type: acc?.type || null,
        lastActivity: acc?.lastActivityTime || null, tokens: acc?.activeTokensCount ?? null,
        objkt: `https://objkt.com/profile/${address}`,
      };
    }
    default:
      throw new Error(`unknown mint kit tool: ${name}`);
  }
}
