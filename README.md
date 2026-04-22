# PointCast

> A living broadcast from El Segundo, California. Dispatches, faucets,
> visits, and mints on Tezos. Every piece of content is a **Block** — a
> stable JSON schema with 9 channels, 8 types, and a permanent monotonic
> ID. Built by Mike Hoydich with Claude (Anthropic) and Codex (OpenAI).
> Agent-native by design. CC0-flavored.

**Live:** [pointcast.xyz](https://pointcast.xyz) · **Canonical:** [/manifesto](https://pointcast.xyz/manifesto) · **Agents:** [/agents.json](https://pointcast.xyz/agents.json) · **LLMs:** [/llms.txt](https://pointcast.xyz/llms.txt)

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

## Stack

- **Framework:** [Astro 6.1](https://astro.build) (static site + islands)
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com) + Pages Functions
- **Chain:** [Tezos](https://tezos.com) mainnet, integrated via
  [Taquito 24.2](https://tezostaquito.io) + [Beacon SDK 24.2](https://walletbeacon.io)
- **Contracts:** [SmartPy](https://smartpy.io) 0.24 (FA2 for Visit Nouns,
  FA1.2 for DRUM, custom for Prize Cast)
- **Indexing:** [TzKT](https://tzkt.io) for on-chain reads
- **Typography:** Self-hosted Inter + JetBrains Mono (no Google Fonts)
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
| [/](https://pointcast.xyz/)                       | Home feed — dense auto-fit grid of every Block                |
| [/manifesto](https://pointcast.xyz/manifesto)     | Canonical Q&A, FAQPage + DefinedTerm JSON-LD                  |
| [/glossary](https://pointcast.xyz/glossary)       | Dictionary of PointCast-specific terms with stable anchors    |
| [/local](https://pointcast.xyz/local)             | 100-mile El Segundo lens: institutions, stations, local blocks |
| [/nature](https://pointcast.xyz/nature)           | El Segundo flora, dune habitat, field guide                   |
| [/nouns-cola](https://pointcast.xyz/nouns-cola)   | Nouns Cola pilot operating board + live planning model        |
| [/collabs/relay](https://pointcast.xyz/collabs/relay) | Playable collaborator-routing room                         |
| [/archive](https://pointcast.xyz/archive)         | Chronological index with channel + type + search filters      |
| [/editions](https://pointcast.xyz/editions)       | Mintable dashboard: live supply + listed market + planned     |
| [/timeline](https://pointcast.xyz/timeline)       | Publication cadence viz (SVG, sparklines + heatmap)           |
| [/now](https://pointcast.xyz/now)                 | Live system snapshot: CotD + next draw + latest 4 blocks      |
| [/battle](https://pointcast.xyz/battle)           | Nouns Battler — deterministic duels, Card of the Day rotates  |
| [/cast](https://pointcast.xyz/cast)               | Prize Cast — no-loss prize savings on Tezos (pending compile) |
| [/drum](https://pointcast.xyz/drum)               | Multiplayer drum room, DRUM token claim (pending compile)     |
| [/for-agents](https://pointcast.xyz/for-agents)   | Human-readable manifest                                       |
| [/agents.json](https://pointcast.xyz/agents.json) | Machine-readable discovery manifest                           |
| [/llms.txt](https://pointcast.xyz/llms.txt)       | LLM summary (llmstxt.org convention)                          |
| [/feed.xml](https://pointcast.xyz/feed.xml)       | Unified RSS 2.0 (every block)                                 |
| [/feed.json](https://pointcast.xyz/feed.json)     | JSON Feed v1.1                                                |

---

## On-chain

| Contract           | Address                                      | Status                     |
|--------------------|----------------------------------------------|----------------------------|
| Visit Nouns FA2    | `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`       | **LIVE mainnet**           |
| DRUM Token (FA1.2) | `contracts/v2/drum_token.py`                 | Written; pending ghostnet  |
| Prize Cast         | `contracts/v2/prize_cast.py`                 | Written; pending mainnet   |

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

## Local development

```sh
npm install
npm run dev    # Astro dev server at http://localhost:4321
npm run build  # Static build + OG card generation
```

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
Block primitive, BLOCKS.md spec, and agent-layer patterns are
CC0-flavored. Fork and reuse freely. Cite `/manifesto` if you want
credit traced back.

If you've found a bug in an agent surface (`/*.json`, `/for-agents`,
stripped HTML mode), file an issue with the request URL and observed
response.

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
