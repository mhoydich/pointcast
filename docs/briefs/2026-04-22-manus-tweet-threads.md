# Manus · manus-03 · Five tweet threads

**Priority:** runs AFTER codex-03 delivers the five screen recordings.

## The ask

Write five distinct tweet threads, each with a different angle, each leading with one of the five recordings from codex-03. Queue them with specific post times spread across 10-14 days so the account doesn't look spammy and each thread has room to breathe.

## Why five, not one

Different audiences live on X under different hashtags and keywords. One thread covers at most one intersection. Five threads ≈ five shots at finding the audience that's actually present. Also: if one misfires, the others still ship.

## The five angles

### Thread 1 · Nostr angle

- **Hook:** "I built a reader that publishes reading lists as replaceable Nostr events. No server, no account, no central feed — just a d-tag and a relay pool."
- **Video:** `02-activity-splice.mp4` — showing the timeline splice-in.
- **Thread body (5-6 tweets):** brief intro to the three d-tags pattern (reader-state-v1 / public-saved-v1 / presence), why kind-30078 was the right primitive, link to the RFC draft (codex-05) and `/sparrow/federation.json`.
- **CTA:** "Paste a hex pubkey at pointcast.xyz/sparrow/friends — if they've opted in, you'll see what they save."

### Thread 2 · Astro / 0-kB-runtime angle

- **Hook:** "800 static pages, 0 kB of framework runtime, streaming Nostr WebSockets on the client. You can do a lot with a static site in 2026."
- **Video:** `01-dashboard-lane.mp4` — showing the dashboard fluidity despite being fully static.
- **Thread body (4-5 tweets):** Astro SSG posture, view transitions, service worker shell, where the interactivity actually lives (just inline script tags with `sparrow:*` localStorage contracts), the trade-offs.
- **CTA:** `pointcast.xyz/sparrow.json` has the full manifest; source is on GitHub.

### Thread 3 · Agentic-coding angle

- **Hook:** "I pointed a Claude loop at `/loop 15m ship-the-next-sprint` and it shipped 33 sparrow releases in an afternoon, each with tests / commits / roadmap updates. Here's what 8 hours looked like."
- **Video:** A fresh capture showing the `git log --oneline` scroll of v0.1 → v0.33 + `/sparrow/about` roadmap. (codex-03 produces this as a bonus sixth recording if easy.)
- **Thread body (5-6 tweets):** the contract of each sprint (read manifest → implement next roadmap item → bump version → commit → push), what went well, what broke (the @tailwindcss/node prerender flake, the branch confusion, the eventual distribution-vs-engineering pivot that ended the loop).
- **CTA:** "If you're experimenting with long-running Claude loops, the prompt shape + memory pattern is at `https://pointcast.xyz/…`". (Manus: build this page if it doesn't exist yet — a single page showing the `/loop` prompt Mike used + the resulting commit graph.)

### Thread 4 · Ambient / presence aesthetic angle

- **Hook:** "Your friends' tabs are online. A 90-second window. A moss-green pulse when someone saves something. Reading as a room."
- **Video:** `03-ambient-strip.mp4` — the bottom-left "✦ here now" strip lighting up.
- **Thread body (3-4 tweets):** the idea that reading can be social without being a "feed," the NIP-16 ephemeral event posture ("never stored on relays"), the privacy story (off by default, opt-in, no history).
- **CTA:** "Two opt-in boxes at pointcast.xyz/sparrow/friends. One to publish a public list. One to broadcast presence. You can have either or both or neither."

### Thread 5 · "Living broadcast" cultural angle

- **Hook:** "PointCast is a living broadcast from El Segundo. Every post is a Block on one of nine channels. The reader federates over Nostr, the publisher is a macOS app, the site has 800 pages, there's no feed algorithm — just the current moment, and whatever your friends are reading."
- **Video:** `04-signals-recap.mp4` — the three-panel federation recap.
- **Thread body (4 tweets):** the editorial framing — a publication that's also a protocol; channel identity (Front Door / Court / Spinning / …); how this differs from both "blog" and "social feed"; the El Segundo-ness.
- **CTA:** `pointcast.xyz` — just go look.

## Rules for every thread

- **Lead with the video, always.** X weights threads with native video.
- **No link in the first tweet.** Drop it in tweet 2 or later — X deprioritizes first-tweet links.
- **One topic per thread.** Resist cross-linking.
- **Tag sparingly.** Tag only accounts that are actually likely to engage (founders of the projects you reference). Never tag stadium accounts (@elonmusk, @a16z) — those get suppressed.
- **5-7 tweets max per thread.** Longer thread = higher drop-off.

## Posting schedule

- Thread 1 (Nostr) → Day 0 · 10 AM PT · highest leverage from the RFC cross-post.
- Thread 2 (Astro) → Day 2 · 11 AM PT.
- Thread 3 (Agentic) → Day 5 · 9 AM PT · weekday morning for maker audience.
- Thread 4 (Ambient aesthetic) → Day 8 · 3 PM PT · afternoon-scroll aesthetic.
- Thread 5 (Cultural) → Day 12 · 10 AM PT.

## Deliverables

1. `docs/outreach/2026-04-22-five-tweet-threads.md` with all five threads written out, tweet-by-tweet, each labeled "tweet 1", "tweet 2", etc., with character counts.
2. A small `post-schedule` section at the bottom with concrete dates/times.
3. Thumbnail image choices per thread (point at the codex-03 MP4 + the PNG poster).

## Done when

- All five threads drafted.
- Schedule in place.
- File committed.
- Update `docs/plans/2026-04-22-10-assignments.md` row for manus-03 to `shipped`.
