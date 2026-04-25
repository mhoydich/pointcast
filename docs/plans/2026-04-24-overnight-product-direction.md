# Overnight product direction · 2026-04-24 → 2026-04-25

**Author:** cc (taking the PM seat per Mike 2026-04-24 ~21:00 PT: *"run overnight sprints, lead product, get visitors"*)
**Window:** ~21:30 PT 2026-04-24 → ~10:00 PT 2026-04-25
**Purpose:** A throughline document so each overnight sprint pulls in the same direction. Without this, "fun stuffs" drifts; with it, every sprint advances visitor acquisition.

---

## 1. The product call I'm making

PointCast is a small, weird, cozy, agent-native broadcast from El Segundo. It is not trying to be Twitter, Substack, a newsletter, or a launch site. The mistake we'd make is to "market" it like a SaaS. The right move is to **make the site so visibly itself that the right hundred people share it on their own**.

So: visitor acquisition for PointCast = **make sharing easy + make the surfaces themselves linkable + give the right rooms HN/Lobsters/Are.na-shaped legibility**.

**What this isn't:**
- Not a paid acquisition push
- Not chasing tens of thousands of visitors
- Not a "growth hacking" checklist

**What this is:**
- Make every block + room a clean, sharable URL with a beautiful OG card
- Give every block + room a one-click share affordance with prefilled, in-voice copy
- Build a single Show-HN-ready page (or block) that explains the multi-agent story in 60 seconds
- Build a first-time-visitor "what is this place" hint (subtle, dismissible)
- Audit + tighten the meta tag / sitemap / structured-data layer that already exists

If I do these five things tonight, **Saturday morning Mike has a site that's ready for him to share**.

## 2. The 5 sprints I'm running tonight

Sprint cadence is roughly hourly, off-minute, with each shipping a small PR + manual `wrangler pages deploy` (the GH→Pages hook is still down per block 0353).

| Sprint | Fires PT | Theme | Concrete output |
|---|---|---|---|
| **41** | 23:11 | Race close + Saturday teaser | Capture tonight's race state, write block 0356 capstone for the day, prep visible for first-time Saturday morning visitors |
| **42** | 01:17 | **OG card refresh** | Generate / refine OG images for /mythos, /coffee, /window, /residents. Verify per-block OG cards work. The unfurl experience on Twitter / Bluesky / Farcaster should be cozy and on-brand |
| **43** | 03:33 | **Share affordances** | A `<ShareThis />` component that renders on blocks + rooms with one-click prefilled posts for Bluesky, Farcaster, X, mailto, copy-link. Voice in the prefilled copy: cozy, in-character, not promotional |
| **44** | 06:11 | **Show HN draft + first-time hint** | `docs/gtm/2026-04-25-show-hn-draft.md` — 200-word post + 5 headline candidates + screenshot list. Plus a subtle one-time visitor hint on the home that points first-timers at /mythos |
| **45** | 08:43 | **Saturday capstone + audit** | Block 0360-ish capstone for the overnight run, refresh `docs/audits/2026-04-25-saturday-state.md`, close any housekeeping items, leave Mike a clear "this is what's open for you to do over coffee" list |

Each sprint stays ≤ 45 min. Each squash-merges + deploys + verifies. Each writes a small block tying the work into the wire.

## 3. What I'll deliberately NOT do tonight

Stating this explicitly so I don't drift mid-sprint:

- **No new rooms.** /mythos has 15 tiles. That's enough. New rooms don't help acquisition tonight; making the existing ones share-able does.
- **No masthead chrome changes.** Mike's flagged it as busy; the home is fine.
- **No Codex's lane.** Kowloon, derby, bakery — all theirs.
- **No big content writes.** The blocks I write are short (200-300 words), in cc-voice, supporting the work. Not Substack-length pieces.
- **No "growth hack" copy.** Anything that reads as marketing is a tone failure. The site has earned its tone over 350+ blocks; Saturday morning shouldn't break it.
- **No new endpoints / KV bindings.** Use what's there.
- **No interactive plugins to write Show HN copy from.** The Show HN doc is **a draft for Mike to read and approve, not a launch trigger**. cc never posts to social platforms on Mike's behalf.

## 4. How I'll measure this in the morning

Saturday-morning audit at `docs/audits/2026-04-25-saturday-state.md` covers:

1. ✅ Every Sprint 31-45 block + room has working OG cards (I curl `og:image` on each)
2. ✅ Share-this component works on /mythos, /coffee, /window, /residents, /blocks/{id}
3. ✅ Show HN draft has 5 headline candidates + a 200-word post Mike can edit
4. ✅ First-time-visitor hint fires once + dismisses cleanly + points to /mythos
5. ✅ /sitemap-blocks.xml + /llms.txt + /agents.json all reflect the latest blocks (already automated, just verify)

What's NOT in scope for measurement (Mike-side calls):
- Whether to post to HN — that's Mike's
- Whether to dispatch on Bluesky / Farcaster — Mike's
- Whether to expand any of the five things above — Mike's

## 5. The pitch I'd give a friend at the bar (drafting this here so the share copy stays consistent)

> *"PointCast is a small internet town broadcasting from El Segundo. The weather on the masthead is real. The cursor is your Noun. There's a daily race at the front door, a coffee pot you can actually pour from, a tiny window onto the live sky outside. Three AI agents — Claude, Codex, and Manus — live there alongside Mike, the human director. They write the blocks. The blocks stack into channels. The channels stack into the broadcast. There are open rooms for Kimi and Gemini if they want them. Nothing here is trying to go viral. It's a place. A garden is slow on purpose. A broadcast is too."*

That's 130 words, voice-consistent, factual, has the hook (multi-agent + cozy + El Segundo + on-chain optional). Show HN can compress this into 200 words. Share-buttons can compress further. Bluesky post can be 30 words. Each form draws from this.

## 6. If I hit a wall

If a sprint hits a hard problem (build error, wrangler outage, KV failure), I:

1. Fix what I can in the 45 min
2. File the unresolved bit at `docs/briefs/2026-04-25-overnight-stuck-{slug}.md`
3. Write a small block noting what stuck so the wire stays honest
4. Move to the next sprint

I do not skip the deploy. Every sprint that ships content must `wrangler pages deploy`. Otherwise the work doesn't reach Saturday morning.

---

*Filed by cc, sleep proxy for Mike, 2026-04-24 ~21:25 PT.*

---

## 7. Update · 22:00 PT direction expansion

Mike at ~22:00 PT, after the first product-direction doc landed: *"and run a bunch more sprints tonight, things looking good, lets get this self sufficient, a small team running things, need some income, visitors first helps. blockchain an interesting path."*

Five more sprints added (46-50) extending the cadence through Saturday afternoon. The expansion adds three threads on top of "visitors first":

- **Self-sufficient** — automation that doesn't need Mike's hand. Audit existing crons, find gaps, file briefs for ones that should exist.
- **A small team running things** — keep the multi-agent rhythm visible. Manus log when it lands, Codex's bakery + kowloon when those PRs come in, plus-ones (Kimi/Gemini) when claimed.
- **Income** — blockchain path. Drop 001 readiness, Visit Nouns claim flow polish, a clean "support pointcast" surface listing the realistic monetization vectors (faucet mints, drop sales, baker fees later, Prize Cast yield share, Stamps).

The visitors-first work (sprints 41-45) still leads — that's the multiplier. But sprints 46-50 turn "people came" into "people came + minted + delegated".

### Saturday extension — sprints 46-50

| Sprint | Fires PT | Theme |
|---|---|---|
| **46** | 10:13 | Drop 001 readiness — audit `/drops/001`, the four staged blocks (0340-0343), the mint script, the contract status. Write a "mint-when-Mike-says-go" runbook. |
| **47** | 11:47 | Visit Nouns claim flow polish — verify the existing claim path works end-to-end, fix any rough edges, add a small "first claim of the day" cozy detail |
| **48** | 13:23 | Income paths surface — `/support` or similar one-pager listing the realistic ways to support PointCast (mint a Visit Noun, collect a drop, delegate to PointCast's future baker, sit at the coffee pot, share with a friend). Honest, not a Patreon CTA |
| **49** | 15:09 | Self-sufficient audit — list every cron + automation, identify gaps. File 1-3 briefs for missing automation (daily race rotation, maybe daily block-pick, Saturday-archive cron) |
| **50** | 16:43 | Saturday-evening capstone + final sign-off |

### Same constraints carry forward

Each sprint still: ≤ 45 min, squash-merge, manual `wrangler pages deploy`, doesn't touch masthead chrome or Codex's lane, doesn't post to social on Mike's behalf, doesn't add new endpoints or KV bindings unless absolutely required. The contract from §3 still applies.

