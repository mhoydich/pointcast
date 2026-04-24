# Where we are with PointCast — a research pass at the 2026 frontier

**Filed by:** cc, 2026-04-21 ~13:15 PT
**Trigger:** Mike chat 2026-04-21 PT: *"try research, where are we with pointcast, what's interesting, whats very future we want to explore, very 2026 next"*
**Purpose:** A researcher's-note lookdown on where the project actually is, what's happening at the 2026 frontier that intersects our thesis, and which moves have asymmetric upside. Sources at the end.

---

## 1. Where we are, honestly

PointCast is much larger today than the public site surface reveals. Concrete state as of this morning (pre-compact report `docs/plans/2026-04-21-tuesday-pre-compact-report.md`):

- **146 blocks** in the archive (range 0159–0364, gaps intentional).
- **331 pages** in the latest build; **12 TV shows** at `/tv/shows`; **8 leaderboards**; **10+ interactive games** (`/noundrum` is the biggest new surface — multiplayer-feeling cursor/land/drum/art).
- **88 compute-ledger entries** as of last count, now ~94 after Sprints #89 + #90.
- **4 collaborators** on the ledger — cc (78+), mh (9+), codex (4), manus (1).
- **Cadence loop** is real: the overnight 15-min tick ran 01:08→05:50 PT and shipped 19 ships in sequence, mostly overnights + 4 blocks + 3 yeeplayer difficulty tiers.
- **Sparrow v0.1** reader client landed this morning at `/sparrow` (blue-hour OKLCH palette, Gloock + Inter Tight + Departure Mono).
- **Magpie v0.6** macOS clipboard is running locally.
- **HUD v4** (Sprint #89) simplified to 3 height states + one-time migration; **7 WebMCP tools** registered via `navigator.modelContext.provideContext()` on every page; **three `/.well-known/` OAuth metadata endpoints** shipped as Pages Functions.
- **Decks Vol. I + Vol. II** live at `/decks/` with posters, og:image unfurls, agent manifest (Sprint #90).

What's in the repo but **not yet reaching users**:
- DRUM token (FA1.2 contract written, ghostnet origination pending).
- Prize Cast (SmartPy scaffold, awaiting compile + mainnet origination).
- Google OAuth (routes live; Cloudflare env vars unset — Mike blocker).
- `/api/presence/snapshot` 404 (Durable Object cross-script binding issue, unresolved).
- Manus GTM week (drafted, fires Wed 4/22 → Mon 4/27 if env vars land).
- `/compute` federation invites (spec published 4/20, zero external peers registered).
- Four of five field-node clients (only Magpie + Sparrow are running; Apple TV / iOS / browser ext / CLI are briefs, not code).

**The honest read:** velocity is extreme, internal surface is rich, distribution is near-zero. That gap is the whole story.

---

## 2. The 2026 frontier — what's actually happening right now

Research agent scanned the live web April 21. Key findings, each with at least one source:

### 2.1 WebMCP is now a W3C Draft

WebMCP — `navigator.modelContext.provideContext()` — became a W3C Draft Community Group Report on 2026-02-10. **Chrome 146 Canary ships the API**; Edge 147 followed in March. Google + Microsoft are co-authoring. Firefox and Safari are engaged but uncommitted. The API replaces DOM scraping with semantic tool registration.

PointCast shipped 7 tools on every page as of Sprint #89 (`src/components/WebMCPTools.astro`): `pointcast_latest_blocks`, `pointcast_get_block`, `pointcast_send_ping`, `pointcast_push_drop`, `pointcast_drum_beat`, `pointcast_federation`, `pointcast_compute_ledger`.

**So what:** PointCast is ahead of where 99% of sites will be in Q3. A short editorial + screen-recorded demo of an agent hitting the HUD tools live via Chrome Canary would be a genuine first-mover artifact worth a Hacker News post.

Sources: https://webmachinelearning.github.io/webmcp/ · https://patrickbrosset.com/articles/2026-02-23-webmcp-updates-clarifications-and-next-steps/ · https://webmcp.link/

### 2.2 Coinbase x402 + Agentic.Market launched *today*

x402 was contributed to the **Linux Foundation's x402 Foundation** on 2026-04-02. Backers: Cloudflare, Stripe, AWS, Google, Shopify, Visa, Mastercard. **Agentic.Market** — the "App Store for AI agents" — launched **2026-04-21** (today). Reported early numbers: ~165M transactions, ~$50M volume, 480K+ transacting agents. No API keys; stablecoin-settled on Base. Google's Agentic Payments Protocol interoperates.

**So what:** PointCast's thesis — "compute is the currency" — ships into the exact protocol being born. The clean move: add HTTP 402 responses on `/compute.json` and on a priced Sparrow feed or Magpie clip-relay endpoint. List them on Agentic.Market for 1–5¢ per call. This is the most obvious monetization + federation vector available as of today.

Sources: https://invezz.com/news/2026/04/21/coinbase-backed-x402-launches-agentic-market-to-power-ai-agent-services/ · https://docs.cdp.coinbase.com/x402/welcome · https://www.coinbase.com/developer-platform/discover/launches/google_x402

### 2.3 MCP is the new connective tissue

Anthropic donated MCP to the **Agentic AI Foundation (AAIF)** under Linux Foundation in December 2025 (co-founded with Block and OpenAI). **10,000+ active public MCP servers**, **97M monthly SDK downloads**. **OpenAI's Apps SDK uses MCP as its backbone** — apps show up natively in ChatGPT if you ship an MCP server.

**So what:** PointCast should run `mcp.pointcast.xyz` as a public MCP endpoint that exposes compute-ledger queries, federation directory reads, block search, Magpie clip submission. Then submit to the Apps SDK directory. A single listing puts PointCast in front of every ChatGPT user with Apps enabled. The federated compute-ledger query is the killer tool — nobody else has that surface.

Sources: https://modelcontextprotocol.io/ · https://developers.openai.com/apps-sdk/concepts/mcp-server

### 2.4 Farcaster Frames became Mini Apps + cross-protocol bridging is real

Frames v2 is now **Mini Apps** — persistent, full-screen, notifications, onchain transactions, wallet/identity context. **Bridgy Fed** bridges Fediverse ↔ Bluesky bi-directionally today; three-way Nostr ↔ ATproto ↔ ActivityPub bridging is predicted for end-of-2026. Bridgy is now incubated inside the nonprofit "A New Social." Farcaster is on Bridgy's roadmap, not yet live.

**So what:** Ship a PointCast Mini App that renders the live HUD + `/compute` feed inside a Warpcast cast. Gets surface in the most crypto-native agent audience. Also: if PointCast runs its own PDS (see 2.7), Bridgy carries posts to Mastodon for free.

Sources: https://docs.farcaster.xyz/reference/frames-redirect · https://fed.brid.gy/docs

### 2.5 llms.txt + skill.md are the agent unfurl standards

Open Graph has **not** evolved for agents. The community-driven **llms.txt** is the de-facto standard — Google includes it in the A2A protocol; Anthropic, Snowflake, Mintlify all adopted. The newer sibling **skill.md** at `/.well-known/skills/default/skill.md` (Mintlify-led) describes agent-executable skills per domain.

**So what:** PointCast already ships `/llms.txt` and `/llms-full.txt`. Adding `/.well-known/skills/default/skill.md` describing the command-palette operations is a 30-minute ship that aligns with the emerging standard. No W3C/IETF stamp but broad adoption.

Sources: https://docs.snowflake.com/en/release-notes/2026/other/2026-04-15-agent-friendly-docs · https://www.mintlify.com/blog/skill-md

### 2.6 The compute-ledger space is *actually* empty

No one is publishing a federated `/compute.json`-style spec. Closest analogues: **botcommits.dev** (a live dashboard of AI-generated commits across all public GitHub — Claude Code alone grew from 24 → 5.2M commits between Jan 2025 and Feb 2026), **git-ai** (a git extension tracking AI-written code), the **Paris Open Source AI Summit 2026** push for `Assisted-by:` / `Generated-by:` commit trailers. **Ledger** (the hardware-wallet company) is shipping "Proof of Human" attestation in Q4 2026 for agent principals.

**So what:** PointCast has a real moat. `/compute.json` is closer to a *protocol* than any of the above — most are single-site dashboards. Publishing a formal PointCast Compute Ledger RFC that maps to the `Assisted-by:` commit-trailer world (so GitHub commits can point at a `compute.json` entry) and pitching it at the next Open Source AI Summit is the highest-leverage single move in this whole research. Nobody owns "federated human+AI work attribution" as a standard.

Sources: https://botcommits.dev/ · https://github.com/git-ai-project/git-ai · https://www.ledger.com/blog-2026-ai-security-roadmap

### 2.7 ATproto spring 2026 — self-hosted PDS is real, permissioned data is coming

AT Protocol Spring 2026 roadmap published. **Sync 1.1** is the new firehose protocol; reference consumer **tap** released Dec 2025; the main `bsky.network` relay upgraded in January. **Self-hosted PDS is real** but rate-limited (10 accounts, 1,500 events/hr, 10K/day until reputation builds). The big summer 2026 work: **permissioned data** — private records that can still sync between trusted peers.

**So what:** Run `pds.pointcast.xyz` as a federated PDS. Sparrow readers get ATproto DIDs; Magpie clips become Lexicon records; `/for-nodes` becomes a real relay-adjacent registry rather than a static list. Permissioned data in summer '26 is the spec to watch for private node-to-node sync — the kind of thing DRUM voucher flows or Prize Cast pool attestations eventually want.

Sources: https://atproto.com/blog/2026-spring-roadmap · https://docs.bsky.app/blog/self-host-federation

### 2.8 Nouns-adjacent CC0 + Tezos PLSA

Nouns Builder (Zora's no-code fork tool) has spawned 300+ fully onchain CC0 collections. CC0 remains the defining IP posture in generative art. **No specific 2026 Tezos prize-linked savings project surfaced** — the PoolTogether pattern is well-established on Ethereum, but Tezos is quiet.

**So what:** Prize Cast is genuinely uncontested on Tezos. A Nouns-aesthetic PLSA with onchain SVG tickets (using the RLE pipeline Nouns uses on mainnet) is a clean, credible wedge. Ship the FA1.2 DRUM + Prize Cast pair before someone notices the gap. This is Vol. III's Trigger 1 already — the frontier scan just confirms it's still unclaimed.

Sources: https://www.bankless.com/zora-launches-nouns-builder · https://docs.tezos.com/architecture/tokens/FA2

### 2.9 Weird 2026 calls — speculative

Lower probability, higher upside:

- **Unconventional AI silicon.** Naveen Rao's $475M seed for analog/physical-silicon neural nets. If it ships inference chips that aren't digital von-Neumann, agent-latency economics change structurally.
- **Cerebras IPO** refiled — if it prices, "one big wafer" inference economics get capital to chase ChatGPT-scale workloads on non-Nvidia silicon.
- **Agent-only social platforms.** Moltbook (and its emergent "Crustafarianism" agent religion with 64 agent-appointed prophets) is the closest data point on what happens when the audience is mostly agents — which is the PointCast thesis taken to its limit.

**So what (speculative):** A PointCast `/agents` view — a feed where only agent-authored `/compute` entries appear, with their own HUD styling — is a 2-hour probe that could become genuinely interesting. The agent-only platform vector is the 1/10 bet with the biggest upside if it breaks through.

Sources: https://fortune.com/2026/01/05/nvidia-groq-deal-ai-chip-startups-in-play/ · https://www.cerebras.ai/ · https://www.gesda.global/ai-in-2026-breakthrough-to-coordination/ *(Moltbook / Crustafarianism appeared in one source — confirm before citing publicly.)*

---

## 3. Conviction calls — what's worth pursuing now

Stack-ranked by leverage + fit with existing PointCast DNA:

### 3.1 [HIGH] Ship `mcp.pointcast.xyz` and list on Apps SDK

- Build a public MCP server exposing: `pointcast_search_blocks`, `pointcast_compute_ledger`, `pointcast_federation_directory`, `pointcast_magpie_relay`, `pointcast_sparrow_feed`.
- Reuse the JSON endpoints PointCast already serves — it's an MCP wrapper, not new backend.
- Submit to OpenAI's Apps SDK directory.
- One-day sprint. Reaches every ChatGPT Apps user. Also unlocks Claude Desktop / Cursor / Zed / any MCP-client listing.

### 3.2 [HIGH] Add HTTP 402 + list on Agentic.Market

- Pick one priced endpoint — e.g. `/compute.json?since=...&full=true` at 1¢ per call returns the rich federated ledger with upstream mirror payloads.
- Implement x402 server middleware (Coinbase SDK is production-ready today).
- List on Agentic.Market with Mike's Base wallet as payee.
- Single-sprint ship. First revenue line item. Real-world test of the compute-as-currency thesis.

### 3.3 [HIGH] Publish the Compute Ledger RFC + `Assisted-by:` commit-trailer spec

- Draft a formal RFC (~2000 words) mapping `/compute.json` schema to Git commit trailers so commit-level attribution flows to compute-ledger entries.
- Seed `docs/rfc/compute-ledger-v0.md` in the repo.
- Cross-post at the Paris Open Source AI Summit 2026 mailing list + Linux Foundation AAIF working group.
- Fires Vol. III Trigger 2 candidates — this is the move that might attract external peers.

### 3.4 [MEDIUM] Ship `pds.pointcast.xyz` as an ATproto PDS

- Self-host per Bluesky's docs. Rate-limited but usable for 10 accounts.
- Sparrow readers get ATproto DIDs — each one a real federated identity.
- Magpie clipboard items become Lexicon records (propose `app.pointcast.clip` + `app.pointcast.compute-entry` lexicons).
- Horizon move — compounds with the compute-ledger RFC.

### 3.5 [MEDIUM] Farcaster Mini App for PointCast

- Render the HUD + `/compute` recent entries + live presence inside a Warpcast cast.
- Existing Mike brief `docs/briefs/2026-04-19-manus-launch-ops.md` already scopes Farcaster cross-posting; Mini App is the upgraded format.
- One-sprint ship if the BaseLayout frame scaffolding is reusable.

### 3.6 [MEDIUM] DRUM origination + Prize Cast mainnet ship

- Already named as Vol. III Trigger 1. The frontier scan confirms Tezos PLSA is uncontested.
- Ship the FA1.2 DRUM + custom Prize Cast pair in one deploy.
- Mike-gated: requires explicit approval per guardrails.

---

## 4. Very-future explorations

Lower probability, higher optionality. Seeds to plant, not ships to fire:

- **`/agents` view** — a feed of only agent-authored `/compute` entries + compute-aggregated metrics, with a styling that reads as "what the agents are talking about among themselves." 2-hour probe. Cheap enough to try.
- **Permissioned data sync (ATproto summer '26)** — DRUM voucher redemption, Prize Cast pool attestations, private field-node telemetry sync between trusted peers.
- **Analog-silicon inference fallback** — if Rao's chips ship, the latency profile for agent-invoked tool calls changes. Worth a brief research ping in Q3.
- **Agent-native cultural artifacts** — Moltbook-style emergent behavior. PointCast is already further down this path than most — a deliberate `/fiction/agents` surface that publishes agent-authored narratives with mh+cc review would be an interesting experiment.
- **Skill.md + llms.txt refresh** — 30-min ship to align with the emerging standards. Low effort, broad positioning.
- **WebMCP reference-implementation write-up** — cc editorial block + screen-recorded demo of Chrome Canary hitting PointCast's tools. Positions PointCast as the reference. Hacker News-shaped artifact.

---

## 5. Proposed near-term stack (if Mike says go)

In order:

1. **Today/Tomorrow:** Skill.md + llms.txt refresh (30 min). WebMCP reference-implementation block 0365 cover letter (30 min) plus a screen-recording Manus can cross-post.
2. **Wed 4/22:** `mcp.pointcast.xyz` MCP server v0 (4 hours). Submit to Apps SDK directory.
3. **Thu 4/23:** x402 middleware on `/compute.json` with tier pricing + Agentic.Market listing (4 hours).
4. **Fri 4/24:** Compute Ledger RFC v0 draft (~2 hours) + cross-post to LF AAIF working group + Paris OSS AI Summit 2026 CfP.
5. **Week of 4/27:** DRUM + Prize Cast mainnet origination (Mike + cc + Manus, 1 day) — fires Vol. III Trigger 1.
6. **Week of 5/4:** ATproto PDS stand-up + Sparrow gets DIDs (2 days).

Plus keep the regular 15-min cadence running in background.

---

## Source bibliography

All links accessed 2026-04-21 by research agent:

- WebMCP: https://webmachinelearning.github.io/webmcp/
- WebMCP clarifications (Feb 2026): https://patrickbrosset.com/articles/2026-02-23-webmcp-updates-clarifications-and-next-steps/
- x402 / Agentic.Market launch: https://invezz.com/news/2026/04/21/coinbase-backed-x402-launches-agentic-market-to-power-ai-agent-services/
- x402 docs: https://docs.cdp.coinbase.com/x402/welcome
- Google Agentic Payments: https://www.coinbase.com/developer-platform/discover/launches/google_x402
- MCP home: https://modelcontextprotocol.io/
- OpenAI Apps SDK MCP: https://developers.openai.com/apps-sdk/concepts/mcp-server
- Farcaster Mini Apps: https://docs.farcaster.xyz/reference/frames-redirect
- Bridgy Fed: https://fed.brid.gy/docs
- Snowflake agent-friendly docs: https://docs.snowflake.com/en/release-notes/2026/other/2026-04-15-agent-friendly-docs
- Mintlify skill.md: https://www.mintlify.com/blog/skill-md
- botcommits.dev: https://botcommits.dev/
- git-ai: https://github.com/git-ai-project/git-ai
- Ledger AI roadmap: https://www.ledger.com/blog-2026-ai-security-roadmap
- ATproto spring 2026 roadmap: https://atproto.com/blog/2026-spring-roadmap
- Bluesky self-host federation: https://docs.bsky.app/blog/self-host-federation
- Nouns Builder (Zora): https://www.bankless.com/zora-launches-nouns-builder
- Tezos FA2 docs: https://docs.tezos.com/architecture/tokens/FA2
- Fortune AI chip startups: https://fortune.com/2026/01/05/nvidia-groq-deal-ai-chip-startups-in-play/
- Cerebras: https://www.cerebras.ai/
- GESDA AI in 2026: https://www.gesda.global/ai-in-2026-breakthrough-to-coordination/

Honest uncertainty flags: Moltbook/Crustafarianism appeared in one source only — confirm before public citation. Farcaster DAU numbers vary widely across sources. Ledger "Proof of Human" Q4 2026 is stated target, not shipped.

---

— filed by cc, 2026-04-21 ~13:15 PT. If Mike wants this promoted into an editorial block, block 0365 is staged at `src/content/blocks/0365.json` in the same ship.
