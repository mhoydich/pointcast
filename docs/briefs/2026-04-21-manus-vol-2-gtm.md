# Manus brief — Vol. II deck into the launch cadence

**Audience:** Manus. One new ops workstream that slots into the existing 7-day launch cadence at `docs/gtm/2026-04-19-draft.md`. Vol. II of PointCast (the deck) shipped this morning; it's the first versioned-narrative artifact the site has and it's the strongest single piece of cross-post fodder we've ever had. This brief is the distribution plan.

**Prereq:** M-2 (CF Email Routing) and M-3 (Resend) from `docs/briefs/2026-04-19-manus-launch-ops.md` must be live before task V-4 fires. If they aren't, escalate to Mike before starting V-4.

**Files you'll reference:**
- `/decks/vol-2.html` — the deck, live after next deploy, 15 slides, ~53kb
- `/b/0360` — the cover-letter block explaining the deck
- `/b/0361` — the Vol. III trigger note (published same day)
- `docs/gtm/2026-04-19-draft.md` — the 7-day cadence this plugs into

---

## V-1 — Warpcast frame cast (Wed 04-22 slot)

**Execute:**

1. On Wed 2026-04-22 09:00 PT, open Warpcast (Mike's account `@mhoydich`).
2. Cast text (verbatim):

   > vol. ii of pointcast just dropped — the network shape. 15 slides.
   > compute is the currency. the ledger is the receipt.
   > pointcast.xyz/decks/vol-2.html

3. Attach the link as a Frame (the existing BaseLayout Farcaster frame scaffold covers /b/{id} and arbitrary links; if /decks/vol-2.html doesn't render a Frame card natively, fall back to casting /b/0360 and linking to /decks/vol-2.html in the post body).
4. Cross-post to channels: `/design`, `/build`, `/nouns`, `/frames`.

**Deliverable:** `docs/manus-logs/2026-04-22-warpcast-vol-2.md` with cast URL, screenshot of the Frame card, recast/quote/reply counts at T+2h and T+24h.

**Success:** 50+ recasts, 10+ wallet-connected referrals inbound to /profile, top-of-feed in `/build` for 2+ hours.

**Due:** Wednesday 2026-04-22 EOD PT.

---

## V-2 — X / Twitter launch thread (Thu 04-23 slot, amended)

**Execute:**

The existing GTM draft (`docs/gtm/2026-04-19-draft.md`) had a 10-tweet thread slotted for 04-23. Amend it to open with the Vol. II deck as tweet 0, then run the 10-tweet thesis thread after.

1. Tweet 0 (pinned, runs solo 08:00 PT):

   > we shipped PointCast vol. II this morning.
   > 15 slides. 100 commits. 14 days.
   > compute is the currency. the ledger is the receipt.
   > pointcast.xyz/decks/vol-2.html

2. Attach: a 1200×630 screenshot of the Vol. II cover slide. If no poster exists yet, take one manually (Vol. II slide 1 at 1440×900 → crop to 1200×630). File at `public/posters/vol-2.png`, commit, link in tweet.
3. At 10:00 PT, begin the 10-tweet thesis thread (already in the 04-19 draft) as a reply to tweet 0.
4. Thread sign-off: link /decks/vol-2.html and /b/0360.

**Deliverable:** `docs/manus-logs/2026-04-23-x-vol-2.md` with tweet URLs, impressions/RT/reply counts at T+6h and T+24h.

**Success:** 2000+ impressions on tweet 0, 100+ RTs, 25+ quote-tweets from AI builders or Web3 devs. 500+ impressions average on thesis-thread tweets.

**Due:** Thursday 2026-04-23 EOD PT.

---

## V-3 — objkt collection + Tezos community post (Sat 04-25 slot, amended)

**Execute:**

1. On the existing Visit Nouns FA2 objkt collection page (see `docs/briefs/2026-04-19-manus-launch-ops.md` M-4 for the URL when it lands), add a pinned note linking to /decks/vol-2.html with caption: "the wider story — PointCast vol. II."
2. Cross-post to prop.house, nouns.camp, the Tezos Discord (#showcase channel).
3. Framing: Visit Nouns FA2 is the concrete on-chain footprint; Vol. II explains the network shape it sits inside. Lead with the deck, land on the collection.

**Deliverable:** `docs/manus-logs/2026-04-25-nouns-vol-2.md` with all cross-post URLs + screenshots.

**Success:** 30+ mints inbound to Visit Nouns in 24h, 5+ Tezos-native replies, 1+ Nouns-community quote or recast.

**Due:** Saturday 2026-04-25 EOD PT.

---

## V-4 — Resend blast (Sun 04-26 OR Mon 04-27, gated on M-3)

**Prereq:** Resend outbound DNS verified + `RESEND_API_KEY` bound in Cloudflare Pages production env. If M-3 isn't complete, skip this task and re-queue for the following week.

**Execute:**

1. Confirm Resend is live: hit the test endpoint from `docs/setup/email-pointcast.md`.
2. Draft the inaugural PointCast newsletter in Resend's composer. Subject: **"Vol. II — the network shape."** Preheader: "15 slides. 100 commits. 14 days. Compute is the currency."
3. Body (short, HTML): one paragraph framing Vol. II, a single CTA button → /decks/vol-2.html, a three-bullet recap (compute ledger, field nodes, federation), a footer linking /sprints + /compute + /b/0360 + /b/0361.
4. Send to the existing subscriber list (Mike → if list is empty, send a test to `mhoydich@gmail.com` only and note that in the log as "no list yet").
5. Reply-to: `hello@pointcast.xyz`.

**Deliverable:** `docs/manus-logs/2026-04-26-resend-vol-2.md` with the Resend send ID, recipient count, subject/preheader copy, open/click rates at T+24h if subscriber count > 0.

**Success:** Send lands without bounce. If subscriber list exists: >35% open rate, >10% click-through on the CTA.

**Due:** Sunday 2026-04-26 or Monday 2026-04-27 EOD PT, whichever comes first after M-3 completes.

---

## V-5 — Week-one retro tie-in (Mon 04-27)

**Execute:**

The existing GTM draft already slots a week-one retro block on 04-27. Add to that block:

1. A single line noting Vol. II's ship + three numbers: Warpcast recasts (V-1), X thread impressions (V-2), newsletter opens if V-4 fired.
2. Link /decks/vol-2.html in the retro's body so any reader of the feed can jump to the deck.

**Deliverable:** numbers handed to cc as plain-text by Sun 2026-04-26 22:00 PT so the retro block ships Mon morning. Drop them in `docs/manus-logs/2026-04-27-week-one-numbers.md`.

**Success:** three numbers land on time, retro ships Mon 2026-04-27.

**Due:** Sunday 2026-04-26 22:00 PT (numbers) → Monday 2026-04-27 (retro block ships).

---

## Notes + guardrails

- **No paid promotion.** All five tasks are organic. Paid amplification is a Mike call, not a Manus call.
- **No link-shorteners.** Full `pointcast.xyz/decks/vol-2.html` URLs in every cast/tweet/post. The canonical link is load-bearing for the story.
- **No analytics pixels.** Consistent with /stack's "analytics: none" policy. Use native platform counts (Warpcast recasts, X impressions, Resend opens) only.
- **No Mike-voice impersonation.** Drafts above are in a Mike-voice register since he'll be the one posting. Manus does the scheduling, composing, and tracking; Mike signs off on exact wording before any post fires. If Mike is unreachable, queue the task to the next day rather than posting without approval.
- **Record everything.** Every V-N task gets a `docs/manus-logs/YYYY-MM-DD-{task}.md` entry. Empty logs with just a timestamp + note are fine; silence is not.

---

— filed by cc, 2026-04-21 11:18 PT, alongside blocks 0360 (Vol. II cover letter) and 0361 (Vol. III triggers). Source: Mike chat 2026-04-21 PT "ok go" approving the block-0360 ship + "keep going" approving the follow-up queue (block 0361 + this brief). Routes through the existing `docs/gtm/2026-04-19-draft.md` cadence; does not replace it, amends it.
