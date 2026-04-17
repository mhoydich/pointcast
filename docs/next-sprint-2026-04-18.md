# PointCast — Next Sprint (starting 2026-04-18)

**Author:** CC (Claude Code, acting PM)
**Date:** 2026-04-17 evening PT, post-mainnet cascade, revised after MH input
**Horizon:** 3-5 days of executable work. Ordered by **user-visible leverage + unblock chain**, with explicit CC / Codex / Manus lanes so no agent sits idle.

---

## Sprint goal

Ship the product that the blocks primitive promised — **differentiated per-type visual treatments ("flair")** that make LISTEN feel like music, READ feel like a dispatch, CRT feel like sports, LINK feel like a catalog card, etc. On top: clean up the proto-mint liability, finish the Prize Cast frontend, kick Battler Phase 3 (commemorative mint), tighten the drum internals.

---

## The re-prioritization (after MH: "prioritize again")

The earlier cut started with proto-mint cleanup because I was thinking about "correctness on objkt". Mike's new inputs — "visualization, like spotify, the jacket from noah, articles, have a tad of flair for each, also the sports blocks" — shift the center of gravity to **visible polish across block types**. Moved that up the stack.

Proto-mint cleanup still happens but is a background kick-off, not the headline.

---

## Lane 1 — Block-type visual flair (CC primary)

**Biggest lift on felt product quality.** Currently every block, regardless of type, uses the same generic BlockCard treatment. Mike's right that LISTEN should look like music, READ should look like a dispatch, LINK with product imagery should look like a catalog card, CRT/sports should have a scoreboard rhythm.

### 1.1 Per-type BlockCard variants *(CC, ~1 day)*

Extend `src/components/BlockCard.astro` with type-specific internal treatments, preserving the grammar (channel color, ID, timestamp, footer meta) while giving each type its own flair:

- **LISTEN** — vinyl-disc icon overlay on the media frame, prominent duration chip in the mono kicker row, "playlist" badge on Spotify embeds, album/artist line pulled from block's `meta.artist` if present.
- **READ** — dispatch kicker ("DISPATCH Nº {id}") above title, italic serif dek, drop-cap on first body paragraph (detail mode), reading-time pill in the footer. Existing 6px left accent bar stays.
- **WATCH** — 16:9 aspect-ratio cover with play-triangle overlay, runtime chip in the kicker row, external host surfaced in the footer.
- **MINT** — edition counter in large sans numerals ("ED 0/1600"), price in channel-colored mono, objkt logo + deep-link as the CTA.
- **FAUCET** — same counter, but "CLAIMED 1/50 TODAY" phrasing + countdown to next reset in the footer.
- **NOTE** — postcard-style card: ✳︎-prefix location, timestamp prominent, body in larger-than-usual mono for the tweet-sized feel.
- **VISIT** — log-book card: small visitor-noun avatar inline with the byline, geo pill, "visit stamp" mono timestamp.
- **LINK** — catalog-card rhythm: destination-host icon by the footer URL (favicon or host glyph via Google S2 service), price chip if `meta.price` exists, product-sheet field list when `meta` has kv pairs.

### 1.2 Channel-specific layered accents *(CC, ~0.5 day)*

Channels already get the 1.5px border + 800-stop text via CSS custom props. Add:

- **CRT (sports)** — courtside chalk line at the bottom of the card (1px dashed in channel-600), score-line treatment for NOTE blocks with `meta.score`.
- **GDN (garden)** — quieter cards: soft 50-stop bg tint, italic serif dek variant, no accent bar.
- **BTL (battler)** — card appears as a "match stub" when type is NOTE + channel is BTL: fighter IDs side-by-side in the header.

**Verification:** visual before/after screenshots via Chrome-MCP (if available) or curl scrape. Build stays at 95+ pages.

---

## Lane 2 — Finish Prize Cast frontend (Codex, tight prompt)

**Status:** PrizeCastPanel.astro + cast.json.ts + prize-cast.ts lib are *already in the repo* from Codex session 2. The main `src/pages/cast.astro` is the missing piece (Codex hung at xhigh while writing it).

**Remediation:** single-file, single-concern prompt at **medium reasoning** (not xhigh), serial (no other Codex runs concurrent).

**Codex brief** (runs next; see `docs/codex-prompts/cast-page-2026-04-18.md` for the canonical text):

> Write `src/pages/cast.astro`. Use `BlockLayout` for the shell. Import `PrizeCastPanel.astro` (already exists), fetch live data from `/cast.json` at build time, import `src/lib/prize-cast.ts` for helper math (draw cadence). Render: TVL card, prize-pool card, deposit/withdraw panel (the imported component), countdown to next Sunday 18:00 UTC, past-winners list. Mobile-first. No deposit flow if `contracts.json.prize_cast.mainnet === ""` — show "Not yet originated" placeholder. ~200 LOC total. No new deps.

---

## Lane 3 — Proto-mint fix (CC, kick off then idle)

**Path (b) re-originate**, selected by CC as the recommended path since today's sprint session. ~4 ꜩ of 14.80 ꜩ in the throwaway; clean objkt presence from day 1.

### Execution
1. Patch `scripts/deploy-visit-nouns-mainnet.mjs` to accept `metadata_base_cid` at origination time (default to `https://pointcast.xyz/api/tezos-metadata`).
2. Originate v2: new KT1.
3. Batch-mint the same 10 seeds [1, 42, 99, 137, 205, 417, 420, 777, 808, 1111] on the new contract. Metadata URIs bake correctly at mint.
4. Rerun `scripts/post-mainnet-wire.mjs` variant to point `contracts.json.visit_nouns.mainnet` at the new KT1. Block 0229 updates automatically.
5. Rerun `scripts/import-visit-nouns.mjs` to regenerate Blocks 0230-0239 with new token IDs.
6. Rebuild + redeploy.
7. Document `KT1LP1oT…` as "v1 proto-mints, deprecated" in `contracts.json._visit_nouns_v1`.

**MH approval needed before origination fires.** ~2 minute ceremony.

---

## Lane 4 — Admin transfer (MH ceremony, 2 min)

After Lane 3 lands (v2 contract live), Mike runs:
```
cd ~/pointcast && node scripts/transfer-admin.mjs
```

That signs `set_administrator(tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw)` on the v2 contract. Irreversible.

---

## Lane 5 — Battler Phase 3 (commemorative mint)

**Gated on:** Lane 3 (clean contract) + Lane 4 (admin is Mike's main wallet). ~0.5 day of CC once gates clear.

**MH decisions still outstanding** (from Codex Phase 1 design doc — 2026-04-17):
- Card-of-Day selector: today's Nouns auction winner / yesterday's / curated?
- Match-NOTE ID scheme: `BTL-NNNN` prefix or main monotonic sequence?
- Commemorative economics: free gas faucet (~0.01 ꜩ) or paid edition (1-5 ꜩ)?

**30 second call, unblocks the whole lane.**

---

## Lane 6 — /drum internal UI rewrite (Codex, boilerplate)

**Status:** shell is v2 (DrumLayout shipped today). Internal classes still reference v1 Tailwind warm palette. 71KB of utility-class swaps.

**Codex brief** (follows Lane 2 completion; medium reasoning, ~1 day):

> Rewrite `src/pages/drum.astro` internal Tailwind classes. Swap every `text-warm`, `bg-card`, `border-rule`, `text-ink-soft` → v2 equivalents using `--pc-*` tokens via inline `style=""` or new utility classes. Mechanics unchanged. Build passes. Visual: matches v2 aesthetic (hard corners, mono metadata, no rounded pills).

---

## Lane 7 — Manus QA + objkt curation

**Parallel dispatch from Mike (manus.im):** the brief exists at `docs/next-agent-briefs-2026-04-17.md` — Mike can paste it into a fresh Manus session.

Will produce:
- `docs/manus-logs/2026-04-18-mainnet-qa.md` — 10-step walkthrough with screenshots, including WalletChip Kukai connect, deliberately-failing mint on proto contract (or v2 post-origination), mobile pass on /battle, /drum, /collection.
- objkt collection page polish for the v2 contract after Lane 3.

**Not blocking anything above.** Runs parallel.

---

## Lane 8 — GTM drumbeat (MH writes, M cross-posts)

One launch dispatch this sprint (FD READ), one block per day cadence, ~20 seed-list hand-notifies at launch day. Manus cross-posts to Farcaster / X / Nextdoor / objkt. Not blocking engineering lanes.

---

## Parking lot (post-sprint)

- Presence DO companion Worker (for /status live visitors)
- Plausible/Fathom analytics (Manus ops task)
- DRUM token contract (Phase C; after drum v2 internals)
- Good Feels phygital drops (after Prize Cast pattern proves out)
- Stripped-HTML mode for more UAs (already works for `ai:*`, could extend to `bot:seo`)
- More SPN (music) content variety

---

## MH decision matrix (close-outs)

| Decision | Lane | Urgency |
|---|---|---|
| Proto-mint path: execute (b) re-originate? | 3 | Monday |
| Admin transfer: immediately after Lane 3? | 4 | Monday |
| Battler Card-of-Day selector | 5 | This week |
| Battler match-NOTE ID scheme | 5 | This week |
| Battler commemorative economics | 5 | This week |
| Numbering gaps 0160-0204 — fill or sparse? | — | Low priority |
| Good Feels contract: same FA2 or separate? | Post-sprint | Post-sprint |

Lane 1 (block flair) + Lane 2 (Prize Cast frontend) have no MH decisions — CC + Codex can ship those without gating.

---

## Daily shape (rough)

- **Fri eve (now)**: plan + Codex cast-page firing + CC starts block flair
- **Sat**: CC ships block flair per-type pass. Codex (serial) on /drum internals.
- **Sun**: MH closes decisions matrix. Lane 3 re-originate ceremony.
- **Mon**: MH admin transfer → CC ships Battler Phase 3. Launch dispatch.
- **Tue**: Manus full QA → CC addresses. Cross-post.
- **Wed+**: content cadence + parking lot items.

---

*Plan drafted 2026-04-17 evening PT. Lane 1 starts immediately (no MH gate). MH's decision matrix unblocks Lanes 3-5. Lanes 2, 6, 7, 8 are parallel / non-blocking.*
