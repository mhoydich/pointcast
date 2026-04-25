# BLOCKS.md

**PointCast v2.1 — the Blocks pivot, live edition**

Author: Mike Hoydich × Claude
Revision: **v2.1** (2026-04-17) — live on `main`, serving pointcast.xyz.

Previous revisions:
- **v2.1** (2026-04-17 evening) — adds 9th channel BTL (Battler),
  `media.thumbnail` + `media.ipfsFallback` schema fields, agent-layer
  surfaces (/manifesto, /glossary, /agents.json, /llms-full.txt),
  home-page majors strip (inline /drum + /cast), stronger per-type
  variants + scroll rhythm via `:nth-child`, BreadcrumbList + ItemList
  JSON-LD coverage.
- **v2.0** (2026-04-17) — mainnet origination of Visit Nouns FA2 at
  KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh, 10 starter mints, TZIP-21
  metadata endpoint live, /collection page.
- **v2.0-rebuild** (earlier April 2026) — initial Blocks pivot off v1.
  8 channels, 8 types, monotonic IDs, Astro content collections.
- **v1** (2025 → April 2026) — markdown-doc era; retired at commit
  7fea01c, preserved for rollback. Original dispatches, drum room,
  Noun Bells instrument, /collect inventory.

---

## Why this document exists

pointcast.xyz v1 works but its visual language reads as "well-considered content site" — markdown-doc rhythm, generous whitespace, understated type. Not distinctive enough. v2 rebuilds around a single primitive (the Block) with a grammar dense enough to own a visual niche, agent-native structure, and Tezos-native mint/faucet mechanics.

Do not preserve v1's layout. Do preserve: Nouns IP usage via noun.pics, the visit log concept, the dispatch archive, the content itself.

---

## The Primitive — Block

Every piece of content on PointCast is a Block. One primitive, stable grammar, varied content.

### Block schema

```ts
type Block = {
  id: string              // "0205" — monotonically increasing, zero-padded to 4 digits
  channel: Channel        // see Channels below
  type: BlockType         // see Types below
  title: string           // short, sentence case
  body?: string           // markdown, optional
  timestamp: ISO8601      // when published
  size: "1x1" | "2x1" | "1x2" | "2x2" | "3x2"  // desktop grid footprint; default "1x1"
  noun?: number           // Nouns seed ID for the block's icon
  edition?: {
    supply: number | "open"
    minted: number
    price: { tez?: number; usd?: number } | "free"
    chain: "tezos"                 // Tezos-only in v2; Ethereum optional later
    contract: string               // KT1... address
    tokenId: number
    marketplace?: "objkt" | "fxhash" | "teia"
  }
  media?: { kind: "image" | "audio" | "video" | "embed"; src: string }
  external?: { label: string; url: string }
  meta?: Record<string, string>  // free-form agent-readable tags
}
```

Every field except `id`, `channel`, `type`, `title`, and `timestamp` is optional. Blocks are JSON files in `/content/blocks/{id}.json` — no database, git is the database.

### Channels

Ten channels. Each has a code, a color, and a purpose. Do not add an eleventh without Mike's decision.

| Code  | Name            | Color (hex / ramp)       | Purpose                                    |
|-------|-----------------|--------------------------|--------------------------------------------|
| FD    | Front Door      | `#185FA5` / blue-600     | AI, interfaces, agent-era thinking         |
| CRT   | Court           | `#3B6D11` / green-600    | Pickleball — matches, paddles, drills      |
| SPN   | Spinning        | `#993C1D` / coral-800    | Music, playlists, listening notes          |
| GF    | Good Feels      | `#993556` / pink-800     | Cannabis/hemp, product drops, brand ops    |
| GDN   | Garden          | `#0F6E56` / teal-600     | Balcony, birds, wildlife, quiet noticing   |
| ESC   | El Segundo      | `#534AB7` / purple-600   | ESCU fiction, local, community             |
| FCT   | Faucet          | `#BA7517` / amber-600    | Free daily claims, giveaways               |
| VST   | Visit           | `#5F5E5A` / gray-600     | Human/agent visit log entries              |
| BTL   | Battler         | `#8A2432` / oxblood-600  | Nouns Battler — deterministic Nouns duels  |
| BDY   | Birthday        | `#D86440` / coral-600    | Birthdays celebrated on PointCast (indexed at /cake) |

Channel code appears in monospace as `CH.{CODE} · {ID}` at the top of every block.

### Block types

Types govern internal treatment. Not about-ness (that's channel), but form.

| Type     | What it is                           | Footer shows               |
|----------|--------------------------------------|----------------------------|
| READ     | Long-form text, essay, dispatch      | Reading time · ED count    |
| LISTEN   | Spotify/SoundCloud/audio embed       | External link              |
| WATCH    | Video embed                          | External link · duration   |
| MINT     | Paid edition, collectible on Tezos   | Price in tez · supply · button |
| FAUCET   | Free claim, daily reset on Tezos     | Claimed · cap · button     |
| NOTE     | Short observation, tweet-sized       | Location tag               |
| VISIT    | Someone stopped by and signed log    | Agent vendor or geo        |
| LINK     | External link with context           | Destination domain         |
| TALK     | Voice Dispatch — 10-60 sec audio (RFC 0001) | Duration            |
| BIRTHDAY | Open-edition card, one person per year, free FA2 | Recipient · Noun · claimed |

Ten channels × ten types = 100 combinations. Most will never appear. That's fine.

---

## URL structure

Agent-legible, human-legible, permanent.

```
/                         # home — block grid, most recent first
/b/{id}                   # single block page (e.g. /b/0205)
/b/{id}.json              # machine-readable block
/c/{channel}              # all blocks in a channel (e.g. /c/front-door)
/c/{channel}.rss          # RSS feed per channel
/c/{channel}.json         # JSON feed per channel
/blocks.json              # full archive, paginated
/sitemap-blocks.xml       # every block, for crawlers
/for-agents               # manifest page — who this site is, how to read it
/visits                   # the log, as before
/visits.json              # structured visit log
```

Block IDs are immutable. Never reuse, never renumber. If a block is retired, it 404s — the ID does not get handed to something else.

---

## Visual language

### What to pull from

- **Bloomberg Terminal** — channel color as primary navigation, monospace metadata, density without clutter, hard-edged panels
- **Nouns.wtf** — numbered-forever discipline, Noun as first-class visual identity per block
- **Warpcast / Farcaster** — card primitive with embeds and edition metadata, mint buttons inline with content
- **objkt / fxhash** — edition counts visible as primary metadata, not hidden in a modal
- **Teletext / Prestel / CEEFAX** — numbered pages as an addressing system, tight type, agent-native by accident
- **Vintage trading cards** — the block feels like an artifact you could hold

### What to avoid

- Generous whitespace for its own sake
- Understated greys and muted palette
- Serif blog aesthetic (Medium, Substack default)
- Notion-esque doc rhythm
- Anything that reads as "minimal SaaS"
- Navigation sidebars (the channel colors ARE the navigation)

### Typography

- **Monospace for metadata** — channel codes, IDs, timestamps, edition counts. Use `JetBrains Mono`, `IBM Plex Mono`, or `Berkeley Mono` via self-hosted fonts. Never system mono — it reads as code, not as broadcast signature.
- **Sans for titles and body** — `Inter` as default. Consider `Neue Haas Grotesk Display` for dispatch titles if the licensing budget allows later (deferred).
- **Letterspace all-caps monospace metadata at 0.08–0.12em**. That wide-tracked small-caps look is half the signature.
- **Two weights only**: 400 and 500. No 600/700 — too heavy for this density.
- **Sentence case** for titles. Caps-lock only for metadata.

### Color application

- Block background: white or very light tint of the channel color
- Block border: 1.5px solid in the channel's 600-stop
- Left accent bar: optional 6px solid channel color for reading-type blocks
- Channel code text: channel's 800-stop for contrast
- Never mix more than two ramps in one block. Visual noise kills density.

### Spacing and structure

- Grid gap: 8px (tight — blocks should feel like a wall of signal, not a gallery)
- Block internal padding: 14–16px
- Border radius: 0 or 2px maximum. Hard corners are part of the language. No rounded pills anywhere except inline badges.

---

## Layout behavior

### Desktop (≥1024px)

- CSS Grid, `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`, `grid-auto-flow: dense`
- Blocks claim their footprint via `size`: `1x1` is the default; `2x1`, `1x2`, `2x2`, `3x2` as needed
- Header: wordmark + block count + current time, one line
- Footer: channel legend + endpoint list
- No sidebar. No top nav. The grid is the navigation.

### Mobile (<768px)

- Single column, full-bleed
- Every block gets equal horizontal space regardless of `size`
- Gap becomes 12px vertical
- Swipe-scrolling, not pagination
- Channel filter as a sticky horizontal chip bar at top — tap to filter

### Tablet (768–1023px)

- Two columns. `size` downgrades: `2x1` becomes `1x1`, `2x2` becomes `2x1`.

### Agent mode

- When `User-Agent` matches known agent patterns (GPTBot, Claude-Web, Perplexity, Atlas, etc.), serve a stripped HTML version: no CSS, no JS, pure semantic markup with rich JSON-LD blobs
- Also serve `/for-agents` as a human-readable manifest explaining the site structure, endpoint list, and preferred citation format

---

## Faucet and mint — Tezos-first implementation

**Why Tezos first**: the existing objkt / fxhash / Teia culture is the audience PointCast is built for — artist-run publications, cc0 gen-art, thoughtful curated drops. Ethereum NFT culture in 2026 is speculation-heavy; Tezos is where taste-meets-machine actually lives. Mike is already present on objkt as `mhoydich`, so the audience doesn't need to be rebuilt. Mint costs on Tezos are a fraction of a tez (pennies), making the daily faucet economically viable in a way Ethereum L1 never was.

### Technical stack

- **Token standard**: FA2 (Tezos-native multi-token standard)
- **Contract language**: SmartPy (preferred) or LIGO — whichever the contract-in-progress uses. Stay consistent.
- **Wallet protocol**: Beacon (Tezos standard)
- **Supported wallets**: Temple, Kukai, Umami at minimum. Beacon handles all three.
- **RPC provider**: Tezos public nodes (SmartPy, ECAD, TzKT) or dedicated provider if rate limits bite
- **Indexer**: TzKT API for reading mint counts, holder lists, marketplace listings
- **Marketplace surfaces**: objkt primary, fxhash for gen-art drops, Teia optional

### Faucet (ship first)

- **Mechanic**: one tokenId per day, resets at 00:00 PDT, supply cap per day (start at 50 or 100)
- **Claim cost**: gas only (~0.01 tez, effectively free)
- **Limit**: one claim per wallet per day (enforced in contract)
- **Metadata**: each day's noun is the token artwork, stored on IPFS via a pinning service (Pinata or NFT.Storage)
- **Block surface**: `claim()` button on Faucet-type block, reads live `minted/supply` from TzKT, disables if user already claimed today or supply exhausted
- **No wallet required to browse** — only to claim

### Mint (ship second)

- **Same contract structure**, paid editions
- **Dispatches** can mint as collectible editions (optional, not every dispatch needs this — Mike's call per dispatch)
- **Good Feels drops** are phygital — mint returns a redemption code (off-chain, served by Good Feels backend) for in-store or DTC pickup
- **Marketplace mirror**: minted tokens automatically appear on objkt and fxhash (FA2 standard, indexed natively). Block footer surfaces objkt link for secondary trading.
- **Pricing**: denominated in tez, with live USD equivalent shown via TzKT price feed

### Ethereum path (deferred, optional)

Not in v2. Ship Tezos clean, prove the mechanic works, watch the reception. If later there's clear demand from a specific audience segment that lives on Base or Zora, mirror specific drops cross-chain. Do not split the primary flow. Tezos is the home chain.

---

## Implementation phases

### Phase 1 — Visual rebuild (weekend 1)

- New branch `blocks-rebuild`
- Implement Block schema and rendering
- Migrate existing v1 content into `/content/blocks/*.json` (preserve IDs where possible — assign sequential IDs otherwise)
- Build the home grid and single-block pages
- Ship to a preview URL, not production, until ready

### Phase 2 — Agent layer (half-day)

- `/for-agents` manifest
- JSON and RSS feeds per channel
- JSON-LD on every block
- `sitemap-blocks.xml`
- Agent-detection middleware for stripped-HTML mode

### Phase 3 — Tezos faucet (timing depends on in-progress contract work)

- Finish / deploy FA2 contract on Tezos mainnet (currently in progress — coordinate with whichever agent is leading this)
- Beacon wallet connect on the frontend
- Daily claim mechanic with per-wallet rate limit
- Faucet block type wired to contract + TzKT indexer
- IPFS pinning pipeline for daily noun metadata

### Phase 4 — Paid mints

- Extend FA2 contract (or deploy companion) for paid editions
- Good Feels phygital redemption flow (redemption code lives in Good Feels backend; PointCast block displays it after mint verification)
- objkt listing automation

### Phase 5 — Cutover

- Migrate pointcast.xyz to v2
- v1 archived at a subdomain if sentimental value warrants it

---

## Out of scope

- Comments, likes, social features of any kind
- User accounts beyond wallet connect
- Templating for other people to use PointCast
- Email newsletter (RSS + JSON feeds are the newsletter)
- Mobile app
- Analytics beyond simple visit counts
- Ethereum / Base minting in v2 (deferred)

---

## Open questions for Mike

1. **Contract status** — how close is the current Tezos contract to deployable? SmartPy or LIGO? Who's leading the contract work currently (Claude Code, or parallel Manus/Codex effort)?
2. **Nouns IP** — keep pulling from noun.pics for block imagery, or commission a custom PointCast-specific noun set?
3. **Typography budget** — Inter free works for v1; defer Söhne / Neue Haas to v2.1?
4. **Good Feels drops** — contract lives on PointCast's FA2 or a separate Good Feels collection?
5. **Daily faucet noun selection** — random pull from noun.pics, curated rotation, or custom daily drops?
6. **Marketplace strategy** — objkt only, or also fxhash and Teia from day one?

---

*The PRD from January 5 described the thesis. This document describes the execution. Every design decision must serve the Block primitive. When in doubt, make it denser, more numbered, more agent-legible, and more visually distinct from a default Notion page. Tezos is the home chain.*
