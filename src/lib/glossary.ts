/**
 * glossary — shared source of truth for PointCast's dictionary of
 * specific terms. Consumed by:
 *   - /glossary (human page with anchor links + DefinedTermSet JSON-LD)
 *   - TodayStrip component (seventh daily-rotating chip)
 *
 * Was inline in src/pages/glossary.astro until 2026-04-19 19:11 tick
 * when TodayStrip became the second consumer. Promoted to lib per the
 * rule-of-three (well, two — close enough; additional consumers queued
 * include a future /glossary.json machine mirror and potential LENS
 * integration).
 */

export interface Term {
  /** URL-safe slug used as the id attribute + DefinedTerm @id. */
  slug: string;
  /** Human-readable term. */
  term: string;
  /** 1-3 sentence canonical definition. Keep the first sentence
   *  self-contained — LLMs often excerpt the first sentence only. */
  definition: string;
  /** Optional related terms (slugs from this same list). */
  seeAlso?: string[];
  /** Optional canonical URL elsewhere on the site or the web. */
  canonicalUrl?: string;
  /** Optional category for visual grouping on the HTML page. */
  category: 'primitive' | 'channel' | 'type' | 'surface' | 'chain' | 'role' | 'mechanic';
}

export const GLOSSARY: Term[] = [
  // ── Primitives ────────────────────────────────────────────────────
  {
    slug: 'block',
    term: 'Block',
    definition: 'The atomic content primitive on PointCast. A typed JSON entity with exactly one channel (of 9), exactly one type (of 8), and a permanent immutable monotonic ID. Every piece of content on pointcast.xyz is a Block.',
    seeAlso: ['channel', 'type', 'block-id'],
    canonicalUrl: 'https://pointcast.xyz/manifesto#q2',
    category: 'primitive',
  },
  {
    slug: 'block-id',
    term: 'Block ID',
    definition: 'A 4-digit zero-padded string (e.g., "0205") that uniquely identifies a Block. IDs are assigned monotonically at authoring time and are permanent — a retired Block 404s rather than being renumbered.',
    seeAlso: ['block'],
    category: 'primitive',
  },
  {
    slug: 'channel',
    term: 'Channel',
    definition: 'An about-ness category every Block belongs to. PointCast defines 9 channels with stable two- or three-letter codes: FD (Front Door), CRT (Court), SPN (Spinning), GF (Good Feels), GDN (Garden), ESC (El Segundo), FCT (Faucet), VST (Visit), BTL (Battler).',
    seeAlso: ['block'],
    canonicalUrl: 'https://pointcast.xyz/manifesto#q9',
    category: 'primitive',
  },
  {
    slug: 'type',
    term: 'Type',
    definition: 'The form a Block takes (not its subject). PointCast defines 8 types: READ, LISTEN, WATCH, MINT, FAUCET, NOTE, VISIT, LINK. Channel answers "what is this about?"; type answers "what form does it take?"',
    seeAlso: ['block', 'channel'],
    category: 'primitive',
  },
  {
    slug: 'agent-native',
    term: 'Agent-native',
    definition: 'A design stance where every human HTML page has a machine-readable JSON counterpart at the same logical URL, plus a consolidated discovery manifest at /agents.json. Agents do not scrape — they read the endpoints. PointCast is agent-native by construction.',
    seeAlso: ['agents-json', 'stripped-html'],
    canonicalUrl: 'https://pointcast.xyz/manifesto#q3',
    category: 'primitive',
  },

  // ── Surfaces ──────────────────────────────────────────────────────
  {
    slug: 'agents-json',
    term: '/agents.json',
    definition: 'PointCast\'s consolidated discovery manifest. One request returns every endpoint, every contract address, the channel and type schemas, and the agent-mode spec. Aliased at /.well-known/agents.json and /.well-known/ai.json.',
    seeAlso: ['agent-native', 'llms-txt', 'stripped-html'],
    canonicalUrl: 'https://pointcast.xyz/agents.json',
    category: 'surface',
  },
  {
    slug: 'llms-txt',
    term: 'llms.txt',
    definition: 'The emerging-convention markdown summary of a site for LLMs. PointCast ships /llms.txt (summary) and /llms-full.txt (long-form) per the llmstxt.org spec.',
    seeAlso: ['agents-json', 'agent-native'],
    canonicalUrl: 'https://pointcast.xyz/llms.txt',
    category: 'surface',
  },
  {
    slug: 'stripped-html',
    term: 'Stripped HTML mode',
    definition: 'A Cloudflare Pages middleware that strips stylesheets, JavaScript, preload/preconnect links, and inline styles from the response when a known AI crawler User-Agent is detected. Returns semantic markup + JSON-LD only. Signaled via the response header X-Agent-Mode: stripped. Typical payload reduction: ~12%.',
    seeAlso: ['agent-native', 'agents-json'],
    canonicalUrl: 'https://pointcast.xyz/manifesto#q4',
    category: 'surface',
  },
  {
    slug: 'for-agents',
    term: '/for-agents',
    definition: 'The human-readable manifest page. Enumerates every endpoint, every channel, every block type, and the citation protocol. Sibling of /agents.json (which is the machine version).',
    canonicalUrl: 'https://pointcast.xyz/for-agents',
    category: 'surface',
  },
  {
    slug: 'manifesto',
    term: '/manifesto',
    definition: 'The canonical Q&A definition of PointCast. 12 frequently-asked questions with full answers. Carries FAQPage, DefinedTermSet, and WebSite JSON-LD — the preferred URL to cite for any claim about what PointCast is.',
    canonicalUrl: 'https://pointcast.xyz/manifesto',
    category: 'surface',
  },

  // ── Chain + mechanics ────────────────────────────────────────────
  {
    slug: 'visit-nouns',
    term: 'Visit Nouns',
    definition: 'An open-supply FA2 NFT collection on Tezos mainnet at contract KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh. Each tokenId from 0 through 1199 corresponds to one Nouns seed (CC0 per nouns.wtf, sourced via noun.pics). Mint price is free; gas only (~0.003 ꜩ). Originated 2026-04-17.',
    seeAlso: ['fa2', 'nouns', 'mint'],
    canonicalUrl: 'https://pointcast.xyz/collection/visit-nouns',
    category: 'chain',
  },
  {
    slug: 'drum-token',
    term: 'DRUM Token',
    definition: 'A planned FA1.2 fungible token on Tezos. Earned by drumming on /drum and claimed via a signed-voucher flow: the server issues a time-bounded signed claim, the user submits it on-chain to mint DRUM to their wallet. Contract written (contracts/v2/drum_token.py), pending ghostnet origination.',
    seeAlso: ['fa1-2', 'drum-room', 'signed-voucher'],
    category: 'chain',
  },
  {
    slug: 'prize-cast',
    term: 'Prize Cast',
    definition: 'A no-loss prize-linked savings pool on Tezos, PoolTogether-flavored and Tezos-native. Depositors keep principal liquid. The contract stakes the aggregate with a baker; weekly baking yield accumulates as the prize pool. Anyone can call draw() on Sunday 18:00 UTC — on-chain randomness picks one ticket and empties the prize to that wallet. Principal stays safe.',
    seeAlso: ['cast', 'no-loss'],
    canonicalUrl: 'https://pointcast.xyz/cast',
    category: 'chain',
  },
  {
    slug: 'fa2',
    term: 'FA2',
    definition: 'Tezos\'s multi-asset NFT standard (TZIP-12). Contrasts with FA1.2 (fungible token standard, TZIP-7). Visit Nouns uses FA2 so each tokenId can carry distinct metadata. Beacon-integrable, objkt-marketable.',
    seeAlso: ['fa1-2', 'visit-nouns'],
    category: 'chain',
  },
  {
    slug: 'fa1-2',
    term: 'FA1.2',
    definition: 'Tezos\'s fungible token standard (TZIP-7). One tokenId, balances per holder. DRUM Token uses FA1.2 since every DRUM is interchangeable.',
    seeAlso: ['fa2', 'drum-token'],
    category: 'chain',
  },
  {
    slug: 'signed-voucher',
    term: 'Signed voucher',
    definition: 'An off-chain-signed claim that the on-chain contract accepts as proof of eligibility. Server holds a private key, signs a payload (recipient, amount, nonce, expiry), user submits it. Used by DRUM Token to let the server gate claims (e.g., tap threshold on /drum) without trusting the client to not forge counts.',
    seeAlso: ['drum-token'],
    category: 'chain',
  },

  // ── Mechanics ─────────────────────────────────────────────────────
  {
    slug: 'card-of-the-day',
    term: 'Card of the Day',
    definition: 'The Nouns Battler fighter that rotates automatically every day. Deterministic by UTC date: dayIndex = floor(epoch_ms / 86,400,000), then modulo the 21-Noun curated roster. Same day → same card for every viewer, human or agent. Current card + metadata served at /battle.json.',
    seeAlso: ['nouns-battler', 'battler'],
    canonicalUrl: 'https://pointcast.xyz/battle.json',
    category: 'mechanic',
  },
  {
    slug: 'nouns-battler',
    term: 'Nouns Battler',
    definition: 'A deterministic turn-based battler where every Nouns seed (0-1199) is a fighter. Stats derive from the seed\'s trait bytes via a pure hash — no random number generation anywhere. Same seed produces the same stats forever; same match inputs produce the same outcome forever. Card of the Day rotates daily.',
    seeAlso: ['card-of-the-day', 'battler'],
    canonicalUrl: 'https://pointcast.xyz/battle',
    category: 'mechanic',
  },
  {
    slug: 'battler',
    term: 'CH.BTL · Battler',
    definition: 'The 9th PointCast channel (added v2.1). Houses Nouns Battler match blocks + Card of the Day entries. Oxblood color palette (#8A2432 primary).',
    seeAlso: ['nouns-battler', 'channel'],
    category: 'channel',
  },
  {
    slug: 'drum-room',
    term: 'Drum room',
    definition: 'The multiplayer cookie-clicker percussion surface at /drum. Five-drum rack (Low, Mid, High, Bell, Shaker) with progressive unlocks at personal tap milestones. Uses deterministic Web Audio synthesis — every tap you and every remote drummer makes is audible in real time. Feeds the DRUM Token claim flow.',
    seeAlso: ['drum-token', 'spinning'],
    canonicalUrl: 'https://pointcast.xyz/drum',
    category: 'mechanic',
  },
  {
    slug: 'cast',
    term: 'CH.CST · /cast',
    definition: 'The Prize Cast frontend at /cast. Bloomberg-terminal treatment with live TVL, prize pool, participant count, and a tick-every-second next-draw countdown. Deposit + withdraw flows land when the contract originates on mainnet.',
    seeAlso: ['prize-cast'],
    canonicalUrl: 'https://pointcast.xyz/cast',
    category: 'mechanic',
  },

  // ── Roles ─────────────────────────────────────────────────────────
  {
    slug: 'cc',
    term: 'CC (Claude Code)',
    definition: 'The primary engineering agent for PointCast. Handles schema, rendering, routing, contracts, and deploys. Built on Anthropic\'s Claude. Writes most commits on the main branch; reviewed by Codex before merges.',
    seeAlso: ['codex', 'manus'],
    category: 'role',
  },
  {
    slug: 'codex',
    term: 'Codex (X)',
    definition: 'The specialist reviewer agent. Handles code review before main merges, alternative UI passes, and spec enforcement. Built on OpenAI\'s Codex. Runs medium reasoning, serial only — concurrent xhigh runs hang silently (observed 2026-04-17).',
    seeAlso: ['cc', 'manus'],
    category: 'role',
  },
  {
    slug: 'manus',
    term: 'Manus (M)',
    definition: 'The operations and computer-use agent. Handles behind-login work: deploy settings, DNS, objkt admin, GSC/Bing registration, end-to-end mint testing as a real user. Logs each session to docs/manus-logs/.',
    seeAlso: ['cc', 'codex'],
    category: 'role',
  },
];
