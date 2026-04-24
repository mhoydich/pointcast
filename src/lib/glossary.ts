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
  {
    slug: 'beacon',
    term: 'Beacon (Tezos wallet protocol)',
    definition: 'A wallet-dapp communication protocol for Tezos. Dapps request signatures, permissions, and transactions without knowing which wallet the user has installed. Kukai, Temple, Umami, and Altme all speak Beacon, so PointCast ships one integration that works with every major Tezos wallet. Spec at walletbeacon.io.',
    seeAlso: ['kukai', 'temple-wallet', 'fa2'],
    canonicalUrl: 'https://walletbeacon.io',
    category: 'chain',
  },
  {
    slug: 'kukai',
    term: 'Kukai',
    definition: 'A browser-based Tezos wallet at kukai.app. Zero-install, social-login recovery option. Recommended default for first-time PointCast visitors — the path of least resistance from "I have no Tezos wallet" to "I just minted a Visit Noun."',
    seeAlso: ['beacon', 'temple-wallet'],
    canonicalUrl: 'https://kukai.app',
    category: 'chain',
  },
  {
    slug: 'temple-wallet',
    term: 'Temple Wallet',
    definition: 'A Chrome / Firefox / Edge browser extension plus iOS / Android mobile wallet for Tezos. Most popular Tezos wallet by install count. Speaks Beacon; integrates cleanly with PointCast\'s mint flow. templewallet.com.',
    seeAlso: ['beacon', 'kukai'],
    canonicalUrl: 'https://templewallet.com',
    category: 'chain',
  },
  {
    slug: 'taquito',
    term: 'Taquito',
    definition: 'The Tezos JavaScript / TypeScript library PointCast uses for contract reads, contract writes, and origination. Official library maintained by ECAD Labs. Docs at tezostaquito.io.',
    seeAlso: ['beacon', 'smartpy'],
    canonicalUrl: 'https://tezostaquito.io',
    category: 'chain',
  },
  {
    slug: 'smartpy',
    term: 'SmartPy',
    definition: 'A Python-like contract language for Tezos. All PointCast contracts — Visit Nouns, DRUM, Prize Cast, Passport Stamps, Kowloon Pastry — are written in SmartPy and compiled to Michelson. smartpy.io.',
    seeAlso: ['michelson', 'fa2'],
    canonicalUrl: 'https://smartpy.io',
    category: 'chain',
  },
  {
    slug: 'michelson',
    term: 'Michelson',
    definition: 'Tezos\'s stack-based smart-contract language. Typed, formally verifiable, no re-entrancy by default. PointCast contracts compile from SmartPy to Michelson before being originated to the chain.',
    seeAlso: ['smartpy'],
    canonicalUrl: 'https://tezos.gitlab.io/active/michelson.html',
    category: 'chain',
  },
  {
    slug: 'baking',
    term: 'Baking (Tezos)',
    definition: 'Tezos\'s proof-of-stake validation mechanism. Bakers stake XTZ to create blocks and earn ~5% annualized yield. No specialized hardware required — a laptop can bake. Prize Cast (pending) will pool depositor tez with a baker and distribute yield as a weekly no-loss lottery prize.',
    seeAlso: ['prize-cast'],
    canonicalUrl: 'https://tezos.gitlab.io/active/proof_of_stake.html',
    category: 'chain',
  },
  {
    slug: 'mutez',
    term: 'mutez',
    definition: 'The smallest Tezos unit. 1 ꜩ (tez) = 1,000,000 mutez. Contract storage and Taquito amount arguments use mutez; display values convert to tez. A typical PointCast mint costs ~3,000 mutez (0.003 ꜩ) in network fees.',
    seeAlso: ['fa2', 'visit-nouns'],
    category: 'chain',
  },
  {
    slug: 'originate',
    term: 'Originate (Tezos)',
    definition: 'The act of deploying a Tezos smart contract to mainnet or a testnet. Originated contracts receive a KT1-prefixed address. Visit Nouns was originated to mainnet at KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh on 2026-04-17.',
    seeAlso: ['fa2', 'visit-nouns'],
    category: 'chain',
  },
  {
    slug: 'tzkt',
    term: 'TzKT',
    definition: 'Tezos block explorer and indexer API at tzkt.io. PointCast uses api.tzkt.io to fetch live token counts per FA2 contract at build time. Visit Nouns: tzkt.io/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh.',
    seeAlso: ['fa2', 'objkt'],
    canonicalUrl: 'https://tzkt.io',
    category: 'chain',
  },
  {
    slug: 'objkt',
    term: 'objkt',
    definition: 'Primary Tezos NFT marketplace. Visit Nouns secondary trading happens here: objkt.com/collection/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh. Reads FA2 + TZIP-016 + TZIP-021 metadata automatically.',
    seeAlso: ['fa2', 'tzkt', 'visit-nouns'],
    canonicalUrl: 'https://objkt.com',
    category: 'chain',
  },
  {
    slug: 'fxhash',
    term: 'fxhash',
    definition: 'Tezos-native generative-art marketplace. Adjacent culture to PointCast\'s CC0 posture; many Nouns-proliferation experiments happen on fxhash. Not a PointCast integration, but the overlapping audience is relevant.',
    seeAlso: ['objkt'],
    canonicalUrl: 'https://fxhash.xyz',
    category: 'chain',
  },
  {
    slug: 'ghostnet',
    term: 'Ghostnet',
    definition: 'Tezos\'s long-lived public testnet. Faucet at faucet.ghostnet.teztnets.com. PointCast uses ghostnet to test new contracts before mainnet origination. The DRUM token is currently ghostnet-pending.',
    seeAlso: ['originate'],
    canonicalUrl: 'https://ghostnet.tzkt.io',
    category: 'chain',
  },
  {
    slug: 'tzip-012',
    term: 'TZIP-012 (FA2 spec)',
    definition: 'Tezos Improvement Proposal 012 — the canonical FA2 multi-asset token standard. Defines the interface PointCast\'s Visit Nouns contract implements.',
    seeAlso: ['fa2', 'tzip-021'],
    canonicalUrl: 'https://tzip.tezosagora.org/proposal/tzip-12/',
    category: 'chain',
  },
  {
    slug: 'tzip-021',
    term: 'TZIP-021 (token metadata)',
    definition: 'Tezos Improvement Proposal 021 — standard for per-token metadata (name, description, image, attributes, royalties). Consumed by objkt, Kukai, Temple, and other Tezos tooling to render NFT listings.',
    seeAlso: ['fa2', 'tzip-012'],
    canonicalUrl: 'https://tzip.tezosagora.org/proposal/tzip-21/',
    category: 'chain',
  },
  {
    slug: 'ethereum',
    term: 'Ethereum',
    definition: 'The canonical smart-contract blockchain — PoS since the Merge (2022), roughly 1M validators, home of canonical Nouns DAO. PointCast chose Tezos instead primarily for 1000× cheaper gas + simpler FA2 standard, but respects Ethereum\'s liquidity + proliferation ecosystem. See /ethereum-vs-tezos for the full side-by-side.',
    seeAlso: ['tezos', 'erc-721', 'gas'],
    canonicalUrl: 'https://en.wikipedia.org/wiki/Ethereum',
    category: 'chain',
  },
  {
    slug: 'erc-721',
    term: 'ERC-721',
    definition: 'Ethereum\'s canonical non-fungible token standard. One contract, one tokenId per unique NFT. The FA2 counterpart on Tezos covers NFT + fungible + semi-fungible in a single standard. Canonical Nouns DAO uses ERC-721; PointCast\'s Visit Nouns uses Tezos FA2.',
    seeAlso: ['fa2', 'ethereum', 'erc-1155'],
    canonicalUrl: 'https://eips.ethereum.org/EIPS/eip-721',
    category: 'chain',
  },
  {
    slug: 'erc-1155',
    term: 'ERC-1155',
    definition: 'Ethereum\'s multi-asset token standard. One contract can host multiple token types (fungible + semi-fungible + NFT). Designed by Enjin, 2018. Functionally equivalent scope to Tezos FA2 but split across ERC-721 + ERC-1155 + ERC-20 on the Ethereum side.',
    seeAlso: ['fa2', 'erc-721', 'erc-20'],
    canonicalUrl: 'https://eips.ethereum.org/EIPS/eip-1155',
    category: 'chain',
  },
  {
    slug: 'erc-20',
    term: 'ERC-20',
    definition: 'Ethereum\'s fungible token standard — USDC, WETH, most DeFi tokens follow it. Tezos counterpart is FA1.2 (TZIP-007). Simpler + older than FA1.2; differs primarily in approve/transfer event semantics.',
    seeAlso: ['fa1-2', 'ethereum'],
    canonicalUrl: 'https://eips.ethereum.org/EIPS/eip-20',
    category: 'chain',
  },
  {
    slug: 'gas',
    term: 'Gas',
    definition: 'The computational cost of executing a transaction on Ethereum (or other EVM chains). Priced in gwei; final fee = gas units used × gas price. Typical NFT mint on Ethereum L1 costs $2-$50 in gas; Tezos equivalent is ~0.003 ꜩ. L2s like Base + Arbitrum reduce Ethereum gas to ~$0.10-$1.00.',
    seeAlso: ['ethereum', 'mutez', 'l2'],
    canonicalUrl: 'https://ethereum.org/en/developers/docs/gas/',
    category: 'chain',
  },
  {
    slug: 'wei',
    term: 'wei / gwei',
    definition: 'Smallest Ethereum units. 1 ETH = 10^18 wei = 10^9 gwei. Gas prices are typically quoted in gwei (e.g. "25 gwei"). Tezos counterpart: mutez (1 ꜩ = 10^6 mutez).',
    seeAlso: ['gas', 'mutez'],
    canonicalUrl: 'https://ethereum.org/en/developers/docs/intro-to-ether/',
    category: 'chain',
  },
  {
    slug: 'l2',
    term: 'L2 (layer 2)',
    definition: 'Ethereum scaling chains that inherit L1 security via rollups. Major L2s as of 2026: Base (Coinbase), Arbitrum, Optimism, zkSync, Linea, Blast. Reduce gas 10-100× vs L1 Ethereum but fragment liquidity across chains. Tezos takes a different approach: stable low-fee L1 + experimental smart rollups.',
    seeAlso: ['gas', 'ethereum'],
    canonicalUrl: 'https://ethereum.org/en/layer-2/',
    category: 'chain',
  },
  {
    slug: 'walletconnect',
    term: 'WalletConnect',
    definition: 'A protocol for connecting dapps to wallets, used extensively on Ethereum + L2s. WalletConnect v2 is the current version. Tezos equivalent is Beacon — simpler, purpose-built for Tezos wallets (Kukai, Temple, Umami, Altme).',
    seeAlso: ['beacon', 'ethereum'],
    canonicalUrl: 'https://walletconnect.com',
    category: 'chain',
  },
  {
    slug: 'ens',
    term: 'ENS (Ethereum Name Service)',
    definition: 'Ethereum\'s decentralized DNS — human-readable names (vitalik.eth, mike.eth) that resolve to Ethereum addresses + content hashes. Tezos counterpart: Tezos Domains (.tez). Mike doesn\'t currently use either as primary; tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw is his canonical Tezos address.',
    seeAlso: ['ethereum'],
    canonicalUrl: 'https://ens.domains',
    category: 'chain',
  },
  {
    slug: 'base',
    term: 'Base (L2)',
    definition: 'Ethereum L2 built by Coinbase on the OP Stack. Optimistic rollup with fast bridging from mainnet. Hosts Farcaster-adjacent crypto culture + Friend.tech lineage projects. PointCast doesn\'t deploy on Base but the audience overlap (via Farcaster) is significant.',
    seeAlso: ['l2', 'ethereum', 'farcaster'],
    canonicalUrl: 'https://base.org',
    category: 'chain',
  },
  {
    slug: 'farcaster',
    term: 'Farcaster',
    definition: 'Decentralized social protocol built on Optimism. "Casts" are tweets; "Frames" are interactive cards that render from meta tags. PointCast ships Farcaster Frame meta on every Block — shared URLs become interactive action units in Warpcast + other Farcaster clients.',
    seeAlso: ['base', 'ethereum'],
    canonicalUrl: 'https://farcaster.xyz',
    category: 'surface',
  },
  {
    slug: 'solidity',
    term: 'Solidity',
    definition: 'Ethereum\'s dominant smart-contract language. JavaScript-family syntax. Mature tooling (Hardhat, Foundry). Tezos equivalents: SmartPy (Python-like) + LIGO (ML-family), both compiling to Michelson. PointCast does not write Solidity; all contracts are SmartPy.',
    seeAlso: ['smartpy', 'michelson'],
    canonicalUrl: 'https://soliditylang.org',
    category: 'chain',
  },
  {
    slug: 'evm',
    term: 'EVM (Ethereum Virtual Machine)',
    definition: 'The runtime every Ethereum + compatible chain executes. Gas-metered, stack-based, deterministic. Most L2s and sidechains (Base, Arbitrum, Optimism, Polygon, BNB Chain) are EVM-compatible. Tezos runs Michelson instead, with an Etherlink rollup providing EVM compatibility.',
    seeAlso: ['ethereum', 'michelson', 'l2'],
    canonicalUrl: 'https://ethereum.org/en/developers/docs/evm/',
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
