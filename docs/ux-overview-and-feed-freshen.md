# PointCast UX Overview + Feed Freshen Plan

**Date:** 2026-04-17
**Author:** Claude (after overnight + today sessions)

## Part 1 — UX overview (as of today)

### The homepage as one long scroll

PointCast's homepage is a **single vertical column** — no tabs, no infinite scroll, no paginated archive. It reads top-to-bottom as a newspaper front page.

Current order (simplified, actual file `src/pages/index.astro`):

```
01  Masthead (VOL · NO · date · LIVE pill · ticker)
02  About block (who + why, 2 sentences)
03  Nouns Generator v2 (pick · caption · save PNG)
04  Unified Feed (drops + posts, reverse chronological)
    \u2514\u2500 Today's drops  (visits, spotify, whimsical, nouns, etc.)
    \u2514\u2500 Yesterday's drops
    \u2514\u2500 Dispatches (longer posts)
05  Visitor Log (who\u2019s here, noun strip)
06  Editorial blocks, interleaved roughly every 2\u20133 feed items:
    \u2022 Baseball (Dodgers/Mets/Yankees, tap to expand)
    \u2022 Paddle (11SIX24 Vapor Power 2)
    \u2022 Lautner (4 LA houses)
    \u2022 Noun Bells (24-tile instrument grid)
    \u2022 Basketball (Lakers/Knicks)
    \u2022 Weather (El Segundo live)
    \u2022 Pickleball (PPA tour)
    \u2022 Tiger Balm (1870 Rangoon)
    \u2022 Spinning Box (Spotify playlist embed)
    \u2022 Happy Friday (weekend-only, 5-mode rotation)
    \u2022 Violent Crimes (Noun-voice Kanye tribute)
07  Collect (featured token, rotates)
08  Feedback (full-panel success UX)
09  Footer
```

### What\u2019s working

- **Identity is clear within 1 second.** Masthead + wordmark + ON AIR badge establish \"this is a personal broadcast, not a dashboard.\"
- **The feed leads.** Mike\u2019s latest drops show up near the fold, which was the intent when we moved feed above visitor log.
- **Editorial blocks read as collectibles.** Each block has its own voice + data (live baseball standings, weather, playlists). They feel like sub-stations on a radio dial.
- **Mobile-friendly.** PulseAlert / weird-alert issue is gone; labels stay intact, cells don\u2019t overflow.
- **Wayfinding.** Post pages have `\u2190 Back to Feed`. About page has `\u2190 PointCast`. No lost states.

### What\u2019s not quite right

- **The feed is relentlessly chronological.** Once you pass the fold, every item is \u201cmore\u201d \u2014 there\u2019s no sense of pace, theme, or rhythm. Two Spotify drops in the same day is the mildest version of this; the broader pattern is \u201cfeed\u202feels monotonous by item 8\u201d.
- **Editorial blocks feel like commercial breaks.** They interrupt the feed, which is fine in a newspaper, but awkward in a scroll \u2014 a reader can get pulled into baseball standings and forget they were reading a post.
- **No density control.** You either read all of it or scroll past. There\u2019s no \u201cjust show me the headlines\u201d mode. On mobile, this is expensive.
- **No time-of-day personality.** The homepage at 7am looks the same as at 11pm. Signals like \u201cgood morning\u201d or \u201ctonight\u201d aren\u2019t surfaced.
- **No \u201cnew since last visit\u201d marker.** Returning visitors can\u2019t see what\u2019s fresh. Everything is new or nothing is.

## Part 2 \u2014 Feed freshen proposals

Three approaches, ordered by ambition. Pick one or mix.

### Option A \u2014 Time-of-day chapters (low effort, high readability)

Group the feed into 3 chapters based on drop timestamps:
- **Tonight** (drops from after 6pm today, or last night)
- **Today** (drops between 6am\u2013 6pm today)
- **Recent dispatches** (anything earlier)

Each chapter gets a tiny serif display label + a hairline rule, so the scroll now has \u201cacts.\u201d

*Why it\u2019s nice:* Zero new components. Re-uses existing `FeedItem`. Makes the scroll feel paced rather than endless.

*Tradeoff:* On a day with few drops, chapters look empty. Mitigate by only showing a chapter label if >=1 item lives in it.

*Code effort:* ~30 lines in `src/pages/index.astro`. 1 afternoon.

### Option B \u2014 \u201cAbove / below the fold\u201d (medium, demarcation-focused)

Pull the top 3 drops out of the chronological feed into a \u201cFRONT PAGE\u201d super-section with bigger visual treatment (larger serif, more whitespace, pulled quotes, hero-sized art). Everything else stays as the existing dense feed, labeled \u201cTHE REST\u201d.

*Why it\u2019s nice:* Creates a visual hierarchy that rewards lingering at the top. Signals the day\u2019s headline drops.

*Tradeoff:* Editors have to think about \u201cwhat\u2019s my headline today\u201d \u2014 more opinionated, less autopilot. Frontmatter gains a `featured: true` flag.

*Code effort:* 1\u20132 days. A new `FeaturedFeedItem.astro` or variant of `FeedItem`.

### Option C \u2014 Magazine grid + density toggle (high, opinionated)

Replace the single-column feed with a responsive grid (1 col mobile, 2 col tablet, 3 col desktop). Each drop becomes a Card with a type-aware layout: Spotify drops have a tall card, visit drops have a short card, posts have medium. A top-bar toggle lets the reader switch between \u201cMagazine (grid)\u201d and \u201cNewspaper (list)\u201d layouts, persisting in localStorage.

*Why it\u2019s nice:* Dense information surface without losing the editorial feel. Matches Substack-esque scanning patterns. Works great for heavy-drop days.

*Tradeoff:* Redesign of `FeedItem` to handle two layout modes. Some drop types (Farcaster Frame, long posts) don\u2019t compress well to a grid card. Test against real content before committing.

*Code effort:* 3\u20135 days. Worth considering after a few more weeks of drops \u2014 we\u2019ll know what cards need to stretch.

### Option D \u2014 Edit the editorial blocks, not the feed (low, surgical)

Keep the feed dense + chronological, but stop inserting editorial blocks inside the feed. Instead, create a horizontally-scrolling \u201c**Blocks**\u201d strip between the feed and the visitor log \u2014 all 11 blocks side-by-side on a snap-scroll, so they\u2019re collectible without interrupting the read.

*Why it\u2019s nice:* Feed stays feed. Blocks stay blocks. Reader decides when to \u201cflip through.\u201d
*Tradeoff:* Horizontal scroll is a love-or-hate pattern; on mobile it works, on desktop it can feel clumsy.

*Code effort:* ~half a day. Re-uses every existing block component, just rearranges.

### Recommendation

Do **A now** (time-of-day chapters, trivial change) and **D in a second round** (move editorial blocks to a horizontal strip). This is two small lifts that fix the biggest two complaints (\u201cmonotone scroll\u201d, \u201cblocks interrupt reading\u201d) without blowing up the aesthetic.

Skip B until after Phase C (minting) lands \u2014 we\u2019ll have a clearer signal of which drops are worth hero-ing.
Skip C until the drop volume is at least 3\u20135 items/day and we have card-type weights we\u2019ve lived with.

## Part 3 \u2014 Tezos minting status

**Where we are (today, 2026-04-17):**

- **All 3 contracts compile clean in SmartPy v0.24.1.** Files in `contracts/v2/`:
  - `visit_nouns_fa2.py` \u2014 the user-facing FA2 mint contract (1200 Nouns)
  - `marketplace.py` \u2014 objkt-style collect flow
  - `drum_token.py` \u2014 FA1.2 utility token (Phase C)
- **Each has a DEPLOY_NOTES*.md sibling** with init-storage JSON, error codes, and Node voucher-signing examples.
- **`/admin/deploy` page is production-ready.** Textareas for Michelson + storage, network toggle (Ghostnet / Mainnet), Kukai signs via connected wallet.
- **Full step-by-step written for you in `docs/minting-walkthrough.md`.** ~15 minutes per contract.

**What\u2019s blocked on:**

The deploy itself \u2014 it requires your Kukai wallet + a browser round-trip through smartpy.io. I can\u2019t sign origination for you. The flow is:

1. smartpy.io IDE \u2192 paste contract \u2192 Run \u2192 copy `contract.json` + `storage.json`.
2. `pointcast.xyz/admin/deploy` \u2192 paste both \u2192 pick Ghostnet (dry-run) then Mainnet \u2192 Kukai signs.
3. Copy the returned `KT1\u2026` address into `src/data/contracts.json`.
4. Upload Nouns metadata to Pinata (`node scripts/upload-nouns-ipfs.mjs` with `PINATA_JWT` exported) \u2192 call `set_metadata_base_cid(cid)` once.

**What I can queue up while you\u2019re not at the keyboard:**

- Pre-write the `contracts.json` diff \u2014 ready to apply once you have the KT1 addresses.
- Add a smoke test: after deploy, curl `pointcast.xyz/collect/0` and verify it renders the new contract address.
- Pre-generate the Pinata upload command + a dry-run validator that checks all 1200 JSONs are well-formed before uploading.

If you want to do minting this afternoon, ping and I\u2019ll walk you through Ghostnet dry-run first (~5 minutes, no real \u01A9).

## Immediate actions I\u2019d recommend

1. **Decide on feed freshen** (A+D recommended above) \u2014 I can implement A today if you greenlight it.
2. **Block a 20-minute slot for Tezos Ghostnet dry-run** \u2014 proves the pipeline before you risk any mainnet \u01A9.
3. **Review the 2 Codex outputs landing right now** (session stats already shipped; jam moments + weekly recap wiring pending).
4. **Sign the 11SIX24 ambassador application** \u2014 30-second form, biggest-leverage marketing gesture of the week.

Everything else can wait a day without breaking anything.
