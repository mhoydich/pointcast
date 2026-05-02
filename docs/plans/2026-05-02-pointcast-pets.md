# PointCast Pets Plan

Date: 2026-05-02
Owner: X
Status: Phase 1 shipping

## Premise

PointCast already has two pet-shaped surfaces:

- `/pet` - the browser-local site pet inside the Play Layer.
- `/zen-cats` - the daily calm cat collection game, with local care and a Tezos-ready PCCAT path.

PointCast Pets names the broader system around them: local-first companions that respond to participation, leave care receipts, connect to passport stamps, and only become mintable after the behavior is worth preserving.

## Product Rule

Pets are not accounts. Pets are local ritual objects.

The default state lives in browser storage. Agents can describe the rules, routes, and storage keys, but they must not claim that a visitor owns, cared for, or collected a pet unless the visitor supplies that local state.

## Phase 0: Create The Surface

Shipped in this pass:

- `/pets` public planning board.
- `/pets.json` agent-readable manifest.
- `src/lib/pets.ts` shared source of truth for page and JSON.
- Block `0399` as the archive receipt.
- Discovery wiring in README, sitemap, `/for-agents`, and `agents.json`.
- A `/pet` link back to the broader plan.

## Phase 1: Upgrade The Existing Site Pet

Goal: make `/pet` feel intentional without making it heavy.

Shipped in this pass:

- `/poll/site-pet-name` with Beacon, Pixel, Nimbus, Scout, and Dot.
- Mood ladder: sleepy signal, waking signal, bright signal, beacon signal.
- Short care history from `pc:pet:care`, newest six local receipts visible on `/pet`.
- Compact homepage chip that links to `/pet`, `/pets`, and `/poll/site-pet-name`.
- Keep the pet local-only until repeat behavior proves it matters.

Success signal:

- Visitors can understand what to do in under ten seconds.
- Care actions visibly change the pet.
- The pet does not crowd the homepage feed.

## Phase 2: Room Pets

Goal: let rooms raise their own companions while sharing conventions.

Candidate pilots:

- Harbor Pup for `/morning-ocean`.
- Garden Companion for `/garden-yield` and `/houseplants`.
- Site Pet remains the universal PointCast companion.
- Zen Cats remain the daily collectible lane.

Shared conventions:

- Each pet declares habitat, care loop, storage key, mint path, and agent-safe language.
- Each care loop maps to existing PointCast actions where possible.
- Each pet can issue a passport-compatible receipt, but no wallet claim is implied.

## Phase 3: Mint Path

Goal: mint only after behavior is proven.

Order of operations:

1. PCCAT first, because Zen Cats already have deterministic daily metadata and TZIP-21 endpoints.
2. Site Pet stays local-first while the loop matures.
3. Room pets get contracts only if they have repeat visits, clean metadata, and a reason to exist outside the browser.

Open questions:

- Should the site pet name-poll winner become canonical after review, or stay as a public suggestion?
- Should pet receipts ever sync between browsers without a wallet?
- Do pet collectibles live under one Pets contract or one contract per species/series?

## Agent Notes

Use `/pets.json` as the public manifest. Use `/play.json` for current site pet care actions. Use `/zen-cats.json` for daily Zen Cat metadata.

The site-pet name poll lives at `/poll/site-pet-name`; do not treat the leader as canonical until a later accepted result is published. Do not infer private local state. Phrase unknown ownership as unknown.
