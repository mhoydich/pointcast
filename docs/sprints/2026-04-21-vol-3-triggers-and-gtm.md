---
sprintId: vol-3-triggers-and-gtm
firedAt: 2026-04-21T11:18:00-08:00
trigger: chat
durationMin: 20
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — Vol. III triggers + Manus GTM brief (follow-ups to Vol. II)

## What shipped

Mike 2026-04-21 ~11:00 PT: *"keep going"* — approving the two follow-ups cc queued in the Vol. II handoff message. Two artifacts landed: a block publicly naming the Vol. III trigger conditions, and a Manus brief routing the Vol. II deck through the existing 7-day launch cadence.

### Files staged

- **`src/content/blocks/0361.json`** (new) — CH.FD · NOTE · 2x2 · author `cc` · mood `primitive`. Names four Vol. III triggers: (1) DRUM mainnet origination + first voucher redeem, (2) first external /compute.json peer registers, (3) first field-node client reaches TestFlight or beta distribution (Magpie macOS, iOS Sparrow, browser ext, CLI on npm), (4) first guest-authored block via /for-nodes. Explicit non-triggers: dense iteration (that's /sprints cadence) + traffic spikes (engagement layer). Purpose: keep versioned-deck cadence honest by making the commitment public. Sparrow v0.1 ship this morning (pointcast.xyz/sparrow) cited as Trigger-3 context.

- **`docs/briefs/2026-04-21-manus-vol-2-gtm.md`** (new) — five numbered ops tasks (V-1..V-5) amending the existing `docs/gtm/2026-04-19-draft.md` 7-day launch cadence with Vol. II distribution:
  - V-1 Warpcast frame cast · Wed 2026-04-22 · /design, /build, /nouns, /frames
  - V-2 X/Twitter · Thu 2026-04-23 · Vol. II tweet 0 pinned, 10-tweet thesis thread as reply
  - V-3 objkt + Tezos/Nouns · Sat 2026-04-25 · Visit Nouns collection page pin + prop.house/nouns.camp/Tezos Discord cross-posts
  - V-4 Resend blast · Sun/Mon · gated on M-3 (Resend outbound live). Subject: "Vol. II — the network shape."
  - V-5 Week-one retro · Mon 2026-04-27 · three numbers (Warpcast recasts, X impressions, Resend opens) handed to cc by Sun EOD

- **`src/lib/compute-ledger.ts`** — 2 new entries prepended: block 0361 ship (modest) + Manus GTM brief (modest). Both above the Vol. II deck entries from the 10:12 PT ship.

### Why this shape

Vol. II landed this morning as the canonical narrative artifact. Without follow-ups, it sits on disk and nothing distributes it. Two complementary moves:

1. **Publicly commit to Vol. III's triggers.** Internal-only trigger criteria let cc drift into making decks on feel. Naming the four triggers in a feed-readable block locks the cadence to milestone changes, not cc's enthusiasm. The block is `author: 'cc'` (not `mh+cc`) because the editorial framing is cc's, not Mike's directive; Mike approved the follow-up queue but the list of four triggers is cc's proposal.

2. **Route the deck through the existing GTM cadence.** Manus already has `docs/gtm/2026-04-19-draft.md` drafted for Wed 04-22 → Mon 04-27. The clean move is to amend — not replace — with Vol. II as the lead story on Warpcast (Wed) + X (Thu) + Tezos/Nouns (Sat), and inaugurate Resend with a "Vol. II" newsletter on Sun/Mon once M-3 completes. Brief-first, post-second keeps Mike in the approval loop on exact wording (guardrail respected: no Mike-voice posts without signoff).

### Voice + author

Block 0361 is `author: 'cc'` per VOICE.md — editorial NOTE about the network's own cadence, proposed by cc, not literal Mike words or a Mike-directed topic. Source field points at the 10:12 PT ship (block 0360) as context and cites Sparrow + DRUM scaffold + /for-nodes as reference surfaces.

Manus brief is internal documentation, not a content block, so no author field applies. Filed at the top per existing brief naming pattern (`YYYY-MM-DD-{actor}-{topic}.md`).

### What did NOT ship

- **No Twitter/Farcaster posts yet.** Those fire on their scheduled days through Manus, with Mike approval on copy before each goes live. Today's ship stops at the brief.
- **No Resend list seeding.** V-4 is gated on M-3 (Resend DNS) completing first. If the subscriber list is empty when V-4 fires, a test-only send + log note is acceptable.
- **No Vol. II poster image.** V-2 calls for a 1200×630 `public/posters/vol-2.png` crop of the Vol. II cover slide. Manus can capture this manually; if not, a follow-up cc ship can generate it via Playwright + the existing OG-image script pattern in `scripts/`.
- **No commit or deploy.** Everything staged alongside the 10:12 PT Vol. II files. Mike commits when ready.

### Guardrail check

- **Schema changes?** No. Block 0361 conforms to existing v2 schema.
- **Brand claims?** None — Vol. III triggers are structural, not market-facing.
- **Mike-voice content?** No — block 0361 is `cc`, brief is internal ops.
- **Real money / DAO?** No.
- **Contract origination?** No (Trigger 1 *describes* DRUM origination as a Vol. III trigger; it doesn't originate anything).

Safe to commit.

## Deploy (pending)

Files to add on top of the 10:12 PT Vol. II commit:

- `src/content/blocks/0361.json`
- `docs/briefs/2026-04-21-manus-vol-2-gtm.md`
- `src/lib/compute-ledger.ts` (modified — 2 more entries on top of the 2 from Vol. II)
- `docs/sprints/2026-04-21-vol-3-triggers-and-gtm.md` (this file)

Recommended commit message: `feat(decks): block 0361 Vol. III triggers + Manus GTM brief + ledger`.

Post-deploy verification: `curl https://pointcast.xyz/b/0361.json | jq '.author'` → `"cc"`. Confirm ComputeStrip on home surfaces the new entries.

## Follow-ups

- (a) **Generate the Vol. II poster** (`public/posters/vol-2.png`) — Playwright script or manual crop. Unblocks V-2.
- (b) **Register a first federated peer.** Good Feels is the fastest: ~2h of cc work to stand up `getgoodfeels.com/compute.json` with a minimal seeded ledger. Fires Trigger 2.
- (c) **File Trigger-1 pre-work.** When Mike is ready to originate DRUM on ghostnet, cc needs ~30 min to verify the SmartPy compile + dry-run the voucher flow. Not urgent; triggered by Mike readiness.
- (d) **Sparrow → macOS native.** The hosted Sparrow reader at /sparrow is a strong template for a desktop client. A Tauri or Electron wrapper with push + offline cache would qualify as Trigger 3 in the "field-node reaches distribution" sense.

---

— filed by cc, 2026-04-21 11:18 PT, sprint `vol-3-triggers-and-gtm`. Follow-up to `2026-04-21-vol-2-deck.md`. Blocks 0360 + 0361 ship in the same deploy as this sprint recap.
