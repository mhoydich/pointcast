# PointCast

> A living broadcast from El Segundo, California. Dispatches, faucets,
> visits, and mints on Tezos. Every piece of content is a **Block** — a
> stable JSON schema with 9 channels, 8 types, and a permanent monotonic
> ID. Built by Mike Hoydich with Claude (Anthropic), Codex (OpenAI), and
> Manus. Agent-native by design. CC0-flavored.

**Live:** [pointcast.xyz](https://pointcast.xyz) · **Canonical:** [/manifesto](https://pointcast.xyz/manifesto) · **Agents:** [/agents.json](https://pointcast.xyz/agents.json) · **LLMs:** [/llms.txt](https://pointcast.xyz/llms.txt) · **Share:** [/share](https://pointcast.xyz/share) · **Resources:** [/resources](https://pointcast.xyz/resources)

---

## What this repo is

PointCast is a real website. The homepage is a living feed of Blocks;
every sub-route is a room. The site makes no distinction between human
and agent audiences in access — both get the same content. It does
distinguish in presentation: AI crawlers trigger stripped HTML mode at
the edge (`functions/_middleware.ts`), humans get the full styled page.

Every human HTML route has a machine-readable JSON counterpart at the
same logical URL. Agents don't scrape — they read the endpoints.

Jump to the explainer: **[/manifesto](https://pointcast.xyz/manifesto)**.

---

## The three pillars

PointCast has grown from a single site into a small ecosystem. Same
primitive (the Block), three surfaces tuned to different readers:

| Pillar        | Surface                                              | Role                                    |
|---------------|------------------------------------------------------|-----------------------------------------|
| **PointCast** | [pointcast.xyz](https://pointcast.xyz)               | Canonical broadcast — 164 Blocks, 9 channels, mood-aware home grid |
| **Magpie**    | [pointcast.xyz/magpie](https://pointcast.xyz/magpie) | Publisher — hosted UI + macOS companion, pc-ping-v1 schema |
| **Sparrow**   | [pointcast.xyz/sparrow](https://pointcast.xyz/sparrow) | Reader — keyboard-first PWA, works offline, blue-hour chrome |

Sparrow is installable as an app (scoped service worker at
`/sparrow/sw.js`), keyboard-driven (J/K glide, 1–9 channel jump, ⌘K
palette), and themed deliberately apart from PointCast to feel like a
reader, not a republisher. See `/sparrow/about` and `/sparrow/deck` for
the v0.4 memo.

---

## Stack

- **Framework:** [Astro 6.1](https://astro.build) (static site + islands)
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com) + Pages Functions + Durable Objects (presence)
- **Chain:** [Tezos](https://tezos.com) mainnet, integrated via
  [Taquito 24.2](https://tezostaquito.io) + [Beacon SDK 24.2](https://walletbeacon.io)
- **Contracts:** [SmartPy](https://smartpy.io) (FA2 for Visit Nouns + Passport Stamps, FA1.2 for DRUM, custom for Prize Cast + Marketplace)
- **Indexing:** [TzKT](https://tzkt.io) for on-chain reads
- **Typography:** Self-hosted Inter + JetBrains Mono on PointCast; Gloock + Inter Tight + Departure Mono on Sparrow
- **Analytics:** none

See [/stack](https://pointcast.xyz/stack) for the full technical
disclosure — including what we deliberately didn't use.

---

## The Block primitive

```ts
type Block = {
  id: string              // "0205" — 4-digit zero-padded, immutable
  channel: Channel        // one of 9 (FD, CRT, SPN, GF, GDN, ESC, FCT, VST, BTL)
  type: BlockType         // one of 8 (READ, LISTEN, WATCH, MINT, FAUCET, NOTE, VISIT, LINK)
  title: string
  timestamp: Date
  body?: string           // markdown
  dek?: string            // one-line editorial subtitle
  size?: '1x1' | '2x1' | '1x2' | '2x2' | '3x2'   // home grid span
  noun?: number           // Nouns seed 0-1199 (CC0 via noun.pics)
  edition?: {...}         // Tezos FA2/FA1.2 mint metadata
  media?: {...}           // image/audio/video/embed
  external?: {...}        // outbound link with label
  meta?: Record<string,string>
  visitor?: {...}         // human/agent visit metadata
}
```

Full Zod schema: [`src/content.config.ts`](./src/content.config.ts)
Full spec: [`BLOCKS.md`](./BLOCKS.md)

IDs are assigned monotonically at authoring time. A retired Block 404s
rather than being renumbered — the ID is permanent. Every Block is
addressable at `/b/{id}` (HTML) and `/b/{id}.json` (machine-readable).

---

## Key surfaces

| Route                  | Purpose                                                                   |
|------------------------|---------------------------------------------------------------------------|
| [/](https://pointcast.xyz/)                       | Home feed — drag-to-arrange, mood-persistent, daily-drop strip |
| [/manifesto](https://pointcast.xyz/manifesto)     | Canonical Q&A, FAQPage + DefinedTerm JSON-LD                  |
| [/glossary](https://pointcast.xyz/glossary)       | Dictionary of PointCast-specific terms with stable anchors    |
| [/archive](https://pointcast.xyz/archive)         | Chronological index with channel + type + search filters      |
| [/editions](https://pointcast.xyz/editions)       | Mintable dashboard: live supply + listed market + planned     |
| [/clock](https://pointcast.xyz/clock)             | Sky clock — per-zone facts, rituals, sun position, landmarks  |
| [/moods](https://pointcast.xyz/moods)             | Mood system + soundtracks powering the persistent conavigator |
| [/here](https://pointcast.xyz/here)               | Live presence — beat pad, polls, meditative pulse             |
| [/now](https://pointcast.xyz/now)                 | Live system snapshot: CotD + next draw + latest 4 blocks      |
| [/mesh](https://pointcast.xyz/mesh)               | LOCAL / ONLINE / AGENT mesh view                              |
| [/beacon](https://pointcast.xyz/beacon)           | 25-mile El Segundo beacon                                     |
| [/battle](https://pointcast.xyz/battle)           | Nouns Battler — deterministic duels, Card of the Day rotates  |
| [/cast](https://pointcast.xyz/cast)               | Prize Cast — no-loss prize savings on Tezos (pending compile) |
| [/drum](https://pointcast.xyz/drum)               | Multiplayer drum room, DRUM token claim (pending compile)     |
| [/magpie](https://pointcast.xyz/magpie)           | Magpie publisher — hosted UI, pc-ping-v1 schema               |
| [/sparrow](https://pointcast.xyz/sparrow)         | Sparrow reader — keyboard-first PWA (v0.4)                    |
| [/workbench](https://pointcast.xyz/workbench)     | Network workbench for node operators                          |
| [/for-agents](https://pointcast.xyz/for-agents)   | Human-readable manifest                                       |
| [/agents.json](https://pointcast.xyz/agents.json) | Machine-readable discovery manifest                           |
| [/llms.txt](https://pointcast.xyz/llms.txt)       | LLM summary (llmstxt.org convention)                          |
| [/feed.xml](https://pointcast.xyz/feed.xml)       | Unified RSS 2.0 (every block)                                 |
| [/feed.json](https://pointcast.xyz/feed.json)     | JSON Feed v1.1                                                |
| [/api/mesh.jsonl](https://pointcast.xyz/api/mesh.jsonl) | Mesh presence stream (JSONL)                            |
| [/api/soundtracks.jsonl](https://pointcast.xyz/api/soundtracks.jsonl) | Soundtrack catalog (JSONL)                |

---

## On-chain

| Contract            | Address / path                                | Status                     |
|---------------------|-----------------------------------------------|----------------------------|
| Visit Nouns (FA2)   | `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`        | **LIVE mainnet**           |
| Passport Stamps (FA2) | `contracts/v2/passport_stamps_fa2.py`       | Written; pending ghostnet  |
| Marketplace         | `contracts/v2/marketplace.py`                 | Written; pending ghostnet  |
| DRUM Token (FA1.2)  | `contracts/v2/drum_token.py`                  | Written; pending ghostnet  |
| Prize Cast          | `contracts/v2/prize_cast.py`                  | Written; pending mainnet   |

Deploy notes per contract live in `contracts/v2/DEPLOY_NOTES*.md`.

---

## Agent mode (stripped HTML)

Send a `User-Agent` starting with `ai:` or matching `GPTBot`, `ClaudeBot`,
`PerplexityBot`, `OAI-SearchBot`, `Atlas`, `Google-Extended`, or
`Meta-ExternalAgent`, and the Cloudflare Pages middleware returns
stripped HTML: no stylesheets, no JS (JSON-LD preserved), no
preload/preconnect/icon/manifest. Response header:
`X-Agent-Mode: stripped · ai:<vendor>`. Typical payload savings: ~12%.

Source: [`functions/_middleware.ts`](./functions/_middleware.ts)

---

## Currently shipping

Recent sprints, newest first. Full commit log in `git log`, narrative
changelog at [/changelog](https://pointcast.xyz/changelog).

- **Sparrow v0.1 → v0.4** — hosted reader client, then PWA + offline, then v0.4 technical memorandum deck (`/sparrow/deck`). Keyboard-first, installable, scoped service worker.
- **Magpie hosted UI** — publisher surface at `/magpie` with tour, pitch, press, launch, FAQ. Ships `pc-ping-v1` v0.5 schema.
- **Conavigator** — persistent footer bar: mood + soundtrack survive navigation across the entire site.
- **Drag-to-arrange home** — reorder Blocks on the grid; mood persists site-wide; sports redesign; broadcast favicon.
- **Sky clock** — per-zone facts, rituals, seasonal notes, 12/24h, sun plotted where it actually is, landmarks strip, 14+ rituals.
- **Home strips** — daily-drop, sports, BTC trend poll, mood soundtracks, post-vote followup.
- **Network presence** — Durable Object for online presence, `/here`, `/for-nodes`, `/workbench`, `/start`, MCP-driven Codex libs.

---

## Local development

```sh
npm install
npm run audit:publishing
npm run dev    # Astro dev server at http://localhost:4321
npm run build  # Static build + OG card generation
```

Codex/GitHub/publishing rules live at
[`docs/setup/codex-github-publishing.md`](./docs/setup/codex-github-publishing.md).

The build script runs `scripts/generate-og-images.mjs` first (sharp
rasterizes SVG → PNG per Block and per first-class page) then
`astro build`.

Adding a Block: drop a new file in `src/content/blocks/` named
`NNNN.json` (next monotonic ID), fill the schema, run `npm run build`.
The sitemap, per-channel feeds, archive, and OG card regenerate
automatically.

---

## Contributing

This is Mike Hoydich's site, not a general-purpose template — but the
Block primitive, BLOCKS.md spec, pc-ping-v1 schema, and agent-layer
patterns are CC0-flavored. Fork and reuse freely. Cite `/manifesto` if
you want credit traced back.

If you've found a bug in an agent surface (`/*.json`, `/for-agents`,
stripped HTML mode), file an issue with the request URL and observed
response.

Multi-agent workflow (Claude Code, Codex, Manus, Mike) is documented in
[`AGENTS.md`](./AGENTS.md).

---

## Citation

```
PointCast · CH.{CODE} · № {ID} — "{TITLE}" · {YYYY-MM-DD}
https://pointcast.xyz/b/{ID}
```

Or for the project as a whole:

```
PointCast — Mike Hoydich · https://pointcast.xyz/manifesto
```

---

## License

Content: **CC0-flavored**. Nouns IP via [noun.pics](https://noun.pics)
is CC0 per [nouns.wtf](https://nouns.wtf).

Code: **MIT-flavored** — reuse freely with attribution.

See the [/manifesto](https://pointcast.xyz/manifesto) and
[/glossary](https://pointcast.xyz/glossary) for canonical definitions.

---

## Contact

- Mike Hoydich — [@mhoydich on X](https://x.com/mhoydich) · [@mhoydich on Farcaster](https://warpcast.com/mhoydich)
- Email: hello@pointcast.xyz
- Tezos: `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`

---

*Built by a team of agents. Mike's the eyes.*
