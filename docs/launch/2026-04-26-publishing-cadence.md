# Marketplace launch — 4-week publishing cadence

**Filed by:** cc · **Date:** 2026-04-26
**Frame:** Mike's note — "consistent publishing matters more than the launch itself." This document is the drumbeat plan, not the launch plan. Each week has one anchor Block on PointCast, one or two cross-posts, and a specific artifact (a listing, a contract, a card) that the writing references.

The matrix of channels lives in [`2026-04-26-free-publishing-channels.md`](./2026-04-26-free-publishing-channels.md). This document references those by name.

Block IDs below are the *next monotonic IDs* after `0370` (the last Block as of 2026-04-26). Real IDs may shift if other Blocks ship in between — assign at authoring time.

---

## Week 1 · Sun 2026-04-26 → Sat 2026-05-02 — *the marketplace press*

**Anchor Block:** `/b/0371` — Title: "PointCast Market — multi-collection FA2, live on mainnet" · Channel: VST · Type: NOTE or READ · Author: cc · Modeled on `0364` (Coffee Mugs FA2 release note).

**Body angles:**
- The technical contract design — single KT1, per-listing `fa2_contract`, multi-collection from day one
- Numbers: 2.5% platform fee, royalty cap 10000 bps (100%), one signature to list, one to buy
- The two existing collections live on it: Coffee Mugs `KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt`, Visit Nouns `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`
- The closed loop: list → fulfill in one signature each, payment splits in one Michelson op
- Honest call-out of the orphan KT1 (`KT1SLFv2uWkcd4STXKCsj7fmasi36MAksuhZ`) and why the patched contract was re-originated this morning

**Cross-posts (in order):**
1. **Farcaster cast** linking `/b/0371` (frame renders automatically). One sentence: "PointCast added a marketplace today — multi-collection FA2 on Tezos, 2.5% fee, royalty per listing." Link.
2. **Bluesky post** — same content, slightly tighter.
3. **X thread** (5 posts) anchored on the contract design, not the launch verb. Final post links to `/b/0371`. Mike's existing handle [@mhoydich](https://x.com/mhoydich).
4. **r/tezos text post** — title: "PointCast added a multi-collection FA2 marketplace on Tezos mainnet — one KT1 handles every collection, 2.5% fee." Body is a condensed version of `/b/0371`. Submit URL: https://www.reddit.com/r/tezos/submit
5. **Tezos Blockchain Discord** (https://discord.com/invite/yXaPy6s5Nr) — one short message in `#showcase` or `#nft-art` after lurking for room norms. No @everyone, no follow-up DMs.
6. **objkt.com community Twitter** ([@objktcom](https://x.com/objktcom)) — friendly tag/quote-reply on a relevant existing thread. Frame as peer/complement, not competition. Per the `AGENTS.md` note about @-bait being low-yield, do this only if there's a genuine thread to reply to.
7. **Seed-list email** to 20-30 specific people from `docs/briefs/2026-04-22-manus-outreach-list.md` (the Nostr / Astro / agentic-coding / indie-web list). Personal notes, one link per email.

**Friction flags / what to skip this week:**
- **Show HN** — wait. Save it for Week 2 or 3 when "first listing" data anchors the post.
- **Mirror.xyz** — wait until Week 3. Same reason.
- **r/CryptoCurrency** — skip entirely (mod removal risk).

**Done when:**
- `/b/0371` published, in feeds, OG card rendered
- Farcaster + Bluesky + X + r/tezos + Discord posts all live
- Seed-list emails sent (track in `docs/manus-logs/2026-04-26-launch-seedlist.md` or similar)
- The new marketplace KT1 is wired into `src/data/contracts.json`

---

## Week 2 · Sun 2026-05-03 → Sat 2026-05-09 — *first listing recap*

**Anchor Block:** `/b/0372` — Title: "First listing — a Ceramic Mug at 0.5 ꜩ" (or whatever the actual first sale was) · Channel: VST · Type: NOTE · Author: cc.

**Body angles — pick one specific Coffee Mug as the example:**
- The listing: token_id 0 (Ceramic Mug, edition cap 333), price 0.5 ꜩ, royalty 750 bps (7.5%), seller wallet (Mike's `tz2FjJh…` if it's the smoke-test listing per the runbook)
- The math: at 0.5 ꜩ a sale, the buyer pays 0.5 ꜩ; the seller gets ~0.4625 ꜩ; 0.0125 ꜩ to the platform fee receiver (`tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`); 0.0375 ꜩ to royalty. One Michelson op, three transfers.
- A walk-through of the Kukai signature flow with screenshots of the Beacon prompts (Manus can capture per `AGENTS.md` ops protocol)
- The first buyer (if there is one — if not, leave it as a listed-but-unsold-yet note; don't fabricate)

**Cross-posts (lighter than week 1):**
1. **Farcaster cast** — frame links to `/b/0372`
2. **Bluesky** — same
3. **X thread** (3 posts this time) — focus on the math + the screenshots
4. **Show HN submission** — ONLY if Mike has bandwidth to sit with the thread for the first 4 hours. Title: `Show HN: PointCast Market – multi-collection FA2 marketplace on Tezos`. Submit URL: https://news.ycombinator.com/submit. The product to demo is `/market` itself. Per the [Show HN guidelines](https://news.ycombinator.com/showhn.html), drop marketing language; lead with: "I built a multi-collection NFT marketplace on Tezos where every collection plugs into one originated contract via a per-listing fa2_contract field. Sellers list with one Kukai signature batching update_operators + list_ask. Buyers fulfill with one signature; payment splits seller / 2.5% / royalty in one Michelson op. Live mainnet, ~5 listings, MIT-licensed contract source in repo."
5. **objkt.com community Discord** — only if there's a genuine "what tools are people using" thread to reply to. Don't seed.

**Friction flags:**
- Show HN is one-shot. If Mike isn't around to engage with comments for 4 hours, defer to week 3.
- The "first listing" frame requires there actually to be a listing. If by Friday 2026-05-08 nothing has been listed besides Mike's smoke-test, reframe the Block as "What the marketplace looks like empty — the architecture, before the asks."

**Done when:**
- `/b/0372` published with at least one specific listing (real or smoke-test, named honestly as such)
- Show HN submitted (or deferred to week 3 with a note)
- Cross-posts live on Farcaster / Bluesky / X

---

## Week 3 · Sun 2026-05-10 → Sat 2026-05-16 — *Visit Nouns onto the marketplace*

**Anchor Block:** `/b/0373` — Title: "Visit Nouns are listable now" · Channel: VST · Type: NOTE · Author: cc.

**Body angles:**
- Visit Nouns FA2 (`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`) was the original PointCast on-chain artifact — every visitor to the site can mint one, free. Now they can be listed on `/market` too.
- The bridge: visitors who minted a Visit Noun in the first wave (early 2026) can list it. The collection's secondary market opens.
- A specific example: pick a Visit Noun token_id (e.g., the first one Mike minted, or one of the early visitor mints), suggested floor price, royalty share. Nouns IP is CC0 per [nouns.wtf](https://nouns.wtf), so resale royalties are honest-revenue, not IP rent.
- The multi-collection design proven: same KT1, second collection, no new contract, no migration. This is the structural payoff of the per-listing `fa2_contract` field.
- A cross-link to /editions dashboard which now shows live Visit Nouns supply + listed market

**Cross-posts:**
1. **Farcaster + Bluesky + X** — same shape as week 1 but tighter (1 thread + 1 cast + 1 skeet)
2. **Mirror.xyz post** — long-form essay anchored on the multi-collection design and what 3 weeks of operation look like. Title draft: "A small marketplace, three weeks in." Per the [Mirror help center](https://support.mirror.xyz/hc/en-us/articles/6798827689364-Step-by-step-guide-to-creating-Writing-NFTs), publish as free open-edition Writing NFT on Optimism. URL: https://mirror.xyz → connect wallet → New Entry.
3. **Tezos Agora forum thread** (https://forum.tezosagora.org/) in *Marketplace* category — link to the Mirror post and the Block.
4. **r/tezos follow-up** — one comment in the original launch thread saying "Visit Nouns are now listable, here's the link." Don't open a new top-level post; that's posting twice.

**Friction flags:**
- Don't post the Mirror essay before the marketplace has 2-3 weeks of operating data. Premature long-form reads as marketing.
- Tezos Agora threads stay indexed; treat as a permanent record. Write it accordingly.

**Done when:**
- `/b/0373` published
- At least one Visit Noun is actually listed on `/market` (Mike or a visitor)
- Mirror.xyz essay published with link back to PointCast
- Cross-posts live

---

## Week 4 · Sun 2026-05-17 → Sat 2026-05-23 — *Birthdays onto the marketplace*

**Anchor Block:** `/b/0374` — Title: "Birthdays now trade on the marketplace" · Channel: BDY · Type: NOTE · Author: cc.

**Pre-condition:** the Birthdays FA2 contract (`contracts/v2/birthdays_fa2.py`, scaffolded but not yet originated as of 2026-04-26) must be live on mainnet. If it isn't live by 2026-05-17, reframe Week 4 as "What's queued — Birthdays, Drum, Window Snapshots" and push the actual launch to week 5.

**Body angles:**
- The BDY channel was launched 2026-04-25 with `/b/0366` (Morgan's birthday block, Noun 888)
- Birthday cards are free-mint open-editions — but once minted, holders can list on `/market` if they want to
- A specific example: Morgan's card at token_id 366. Floor signal: a public birthday card has *commemorative* value, not investment value. The cadence is: come back in a year, mint another card, hold or list.
- The architectural point: the marketplace doesn't care that Birthdays are zero-royalty (`royalty_bps: 0` per `contracts.json`) — the per-listing royalty field handles it. Every collection, its own economics.

**Cross-posts:**
1. **Farcaster + Bluesky + X** — tight, frame-rendered, one each
2. **r/tezos top-level post** — "Birthdays on PointCast — a free open-edition FA2 channel, now listable on the multi-collection marketplace." This is the second top-level r/tezos post since launch; spacing of ~3 weeks between posts is the right tempo.
3. **Tezos Blockchain Discord** — second short post in `#showcase`. Same spacing rule: 3+ weeks between posts in the same channel.
4. **Optionally: Tezos Spotlight pitch via [@Tezos_Spotlight](https://twitter.com/Tezos_Spotlight) DM** — at this point there's 4 weeks of cadence to point to. Pitch a "Month at a Glance" mention. Don't expect it to land; it's free to ask.

**Friction flags:**
- Birthdays must be on-chain first. If the contract isn't originated by 2026-05-15, this week's beat is the *announcement* of what's queued, not the launch itself.
- BDY is the smallest of the three collections in cultural reach (most readers don't have a personal birthday block yet). Lead with the *architectural* point — "every PointCast collection plugs into one marketplace" — not with "Morgan turned 1 year older."

**Done when:**
- `/b/0374` published
- Birthdays FA2 KT1 wired into `src/data/contracts.json` (`birthdays.mainnet`)
- At least one birthday card is mintable AND listable on `/market`
- Cross-posts live

---

## Cadence rules that apply every week

- **One anchor Block per week, no exceptions.** This is the drumbeat.
- **Cross-posts always link back to the Block, never to each other.** PointCast is the canonical surface.
- **Don't post in the same Discord / subreddit twice within 3 weeks.** Burns goodwill fast.
- **Don't @-bait big accounts** (per Mike's note in `AGENTS.md`). Reply in genuine threads or skip.
- **Skip Show HN until the post can stand on technical specifics + actual usage data.** One shot, don't waste it.
- **Track every post + response in `docs/manus-logs/YYYY-MM-DD-*.md`** so we know what landed and what didn't. Future weeks recalibrate from those notes.

---

## What week 5+ looks like (sketch only)

Once the four weeks above are in place, the cadence is established. Subsequent weekly anchors flow from what actually shipped:

- A week the Drum FA1.2 token originates → Block on Drum's mechanics
- A week a Window Snapshots drop ships → Block on the photo-of-the-week + first listing
- A "month one" recap — total volume, total fees collected (both small numbers, named honestly), what listings looked like, what the next month adds
- Any week with no on-chain news → editorial Block from cc on something the marketplace touches (curation, royalties, the philosophy of a 2.5% fee, agent-readable trade infrastructure)

The drumbeat continues whether or not there's a launch. That's the point Mike asked for.

---

*Filed by cc, 2026-04-26. Updates this doc weekly with what actually shipped vs. what was planned, in `docs/launch/cadence-log/`.*
