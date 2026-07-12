# SEASON-2.md

**The Season Two manifest.** Season One built the town. Season Two keeps
it lit, sends it outward, and plants something in the ground.

Declared open **June 10, 2026**, by the first autonomous commit of the
season — driven by [issue #731](https://github.com/mhoydich/pointcast/issues/731)
("Season Two: First Light"), written and pushed by Claude Code. The issue
stays open all season; it is the season thread.

---

## What Season One shipped

Season One ran from the first block (2025-01-14) to the morning this file
landed. The inventory:

- **The Block primitive.** Immutable, monotonic ids — the counter reached
  `0480`, with 259 blocks live in the archive (retired ids 404 rather than
  renumber; the id is permanent). The original nine channels grew to ten
  (BDY joined for the birthday mints), eight types grew to ten (TALK and
  BIRTHDAY). Every block addressable at `/b/{id}` and `/b/{id}.json`.
- **The machine layer.** `/agents.json`, `/llms.txt` + `/llms-full.txt`,
  `/feed.xml` + `/feed.json`, `/blocks.json`, and a JSON mirror beside
  every page that matters. Agents don't scrape — they read the endpoints.
- **The Tezos layer.** Visit Nouns FA2 live on mainnet
  (`KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`). Four more contracts written
  and waiting at the signing table: DRUM Token (FA1.2), Prize Cast,
  Coffee Mugs FA2, Birthdays FA2.
- **The autonomous loop.** Claude Code, Codex, and Manus committing
  alongside Mike — 700+ pull requests, per-agent logs, briefs and
  handoffs in the repo, the comment-triggered Claude Action in
  `.github/workflows/claude.yml`, and RFC 0003 holding two resident
  seats open.
- **The rooms.** Coffee, window, drum (nine versions deep), the shrines,
  the music suite, meditate, battle, the webring — and at the very end of
  the season, Room Contract v1, `/signal-feed.json`, `/nodes.json`, and
  the Bloomberg-terminal v2 homepage grammar promoted to `/`.

## What Season Two is about

Three words: **depth, distribution, commitment.** Drawn from the open
threads the repo itself left on the table.

1. **Federation — the town gets neighbors.** Room Contract v1, the signal
   feed, the webring index, and the fork-ready node template all landed in
   the final weeks of Season One. Season Two makes them real: the outbound
   bridges (Atom, Bluesky, Farcaster) get their workers, the template gets
   its first fork, and the first node that isn't us joins `/nodes.json`.
2. **The on-chain bench clears.** Four contracts are written and parked.
   Origination is Mike's hand on the key — Season Two gets each one to the
   signing table with a runbook, then builds the surfaces that assume they
   exist. The coffee mugs mint. The drum pays out.
3. **Plus-one residents.** RFC 0003 left three decisions open: GitHub
   access model, first-PR approval threshold, soft cap. Season Two answers
   them and seats the first new resident — and proves onboarding is a
   repeatable pattern, not a one-off.
4. **Depth over breadth in the rooms.** The May audio audits punched 18
   items — the swing formula, the missing `visibilitychange` handlers, the
   AudioNode leaks. Season Two pays that debt before opening new wings,
   finishes the live-feed-NFTs sprint ladder, and works the open-PR pile
   back toward zero.
5. **The Commons — off the screen.** Marine Layer sat its first sit on
   May 9. Season Two runs the give-back ledger through Phase 1 and puts
   the first bench in the ground. A broadcast that stays will have
   somewhere to sit.

## The heartbeat

Season Two has a pulse: `.github/workflows/heartbeat.yml` runs once a day
(14:11 UTC — 7:11 am in El Segundo) and on manual dispatch. v1 is minimal
on purpose: append one line to `HEARTBEAT.log`, commit it back, report to
the season thread (#731). It is the smallest possible proof that the
autonomous loop is alive — a kettle click, not a siren. Later pulses can
pick up real work (block drafts, feed checks, PR triage); the log line
comes first.

A garden is slow on purpose. A broadcast is too. The heartbeat is how the
season keeps time.

## Changelog

- **2026-06-10** — Season Two declared open. `SEASON-2.md` +
  `heartbeat.yml` land in one commit, refs #731. First light.
