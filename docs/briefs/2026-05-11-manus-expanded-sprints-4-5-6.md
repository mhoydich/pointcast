# Manus brief — Sprints 4 · 5 · 6 expanded engagement

**Date filed:** 2026-05-11 PT
**Filed by:** cc (multi-sprint planning + Manus engagement)
**Companion:** [Sprints 4-5-6 plan](../plans/2026-05-11-sprints-4-5-6.md)
**Status:** awaiting Manus pickup

## Why this brief exists

Manus has ~63k credits available as of 2026-05-09. Last month used ~40k, so this is roughly one full monthly budget on the shelf. Sprint 3 closed without significant Manus deployment. Sprints 4 → 5 → 6 are designed to consume that budget across browser QA, image generation, on-chain verification, and social-launch prep.

Approximate credit allocation: ~25k Sprint 4 · ~20k Sprint 5 · ~18k Sprint 6 = full burn by June 15.

---

## Sprint 4 work (May 11 → May 22)

Carryover briefs from Sprint 3 + new Sprint 4 surfaces.

### A. Image-gen — 14 reads-card headers

Per [2026-05-09 image-gen runbook](2026-05-09-manus-image-gen-runbook.md) and [2026-05-10 mobile QA brief](2026-05-10-manus-sprint-3-mobile-qa.md). 14 cards, all in `/reads/`:

1. mcluhan — 1960s TV set, El Segundo dusk
2. sumo — low-angle dohyō with two pixel Nouns
3. coffee-why — moka pot axonometric + microclimate hillside
4. good-charts — hand-drawn 2x2 graph paper, marker pen
5. treasure-island — yellowed treasure map fragment
6. socal-2026 — post-fire chaparral hillside, refinery in distance
7. palace — tri-ferg + London tower-block silhouette + VHS jaggedness
8. pickleball-starter-paddle — four paddles on a court, top-down
9. hue — Philips Hue bulb on wood side table, 2200K
10. pickleball-strategy — pickleball court top-down with two paddles + ball
11. cannabis-glossary — single trichome macro
12. el-segundo-fiction — Main Street 6:30pm + refinery silhouette
13. ai-art-prompts — abstract latent-space mesh
14. the-coo-craft — Gantt chart on graph paper + coffee rings

All 1536×1024, no text in image, no real human faces. MJ v8 for atmospheric pieces; ChatGPT 5.5 for object-shape coherence. Save to `public/images/reads/reads-{slug}.png`.

**Credit estimate: ~6k**

### B. Mobile + desktop QA on Sprint 3 rooms

Per [2026-05-10 mobile QA brief](2026-05-10-manus-sprint-3-mobile-qa.md). 9 rooms × 3 captures (mobile, desktop, interaction) = 27 PNGs.

Surfaces: `/sumo`, `/gandalf-v10`, `/drum-taiko`, `/mesh-local`, `/capital`, `/mythos-v2`, `/weekly-brief`, `/type`, `/sprint-3-receipt`.

Save to `public/images/sprint-3-qa/`. Console + network notes to `docs/manus-logs/2026-05-10-sprint-3-qa.md`.

**Credit estimate: ~5k**

### C. /mesh-local verify pass

Five `(verify)`-tagged businesses to confirm with real research:
- Blue Butterfly Coffee Co. — 351 Main St?
- The Bakery — actual address?
- Tribune Tap House — current address + operating?
- USPS El Segundo Post Office — 2130 E Mariposa or 200 Main?
- El Segundo Brewing Company — 140 Main, still there?

Reply with corrections in `docs/manus-logs/2026-05-10-mesh-local-verify.md`. cc will follow up with a small PR to update /mesh-local.

**Credit estimate: ~2k**

### D. Sprint 4 codex-room QA (rolling)

As codex ships Sprint 4 rooms (target: 12), Manus does mobile + desktop QA on each as it lands. Aim: same 3-capture pattern. Surface list will land via the wire (block 0480+ tagged "sprint 4 codex").

Specific rooms to expect (from the codex queue): `/shop/stall` (already shipped — first one to QA), `/residents-v2`, `/diagnostics-v2`, `/tour`, `/random`, `/playlist`, `/calendar`.

**Credit estimate: ~10k**

### E. /shop catalog product photos

Production /shop catalog (the other agent's commerce hub) needs product photos for the Good Feels SKUs. Source from getgoodfeels.com and any partner catalogs. Save as `public/images/shop/products/`. Match the catalog data shape in `src/content/products/`.

**Credit estimate: ~2k**

**Sprint 4 total: ~25k credits.**

---

## Sprint 5 work (May 23 → June 3)

Coffee Mugs FA2 expected live in Sprint 4 → Sprint 5 is the first sprint with a real on-chain commerce loop. Manus carries the real-user testing layer.

### F. Coffee Mugs mint flow E2E test

After Mike originates the FA2 (target: Sprint 4 week 1):
- Real Tezos wallet (Kukai or Temple) on a test device
- Fund with ~2 tez for gas
- Connect to /coffee via Beacon
- Mint each of the 5 mug tokens
- Verify each appears in wallet
- Verify each appears on objkt.com under the new contract
- Screenshot every step
- Time the full flow; note any UX friction

Save to `docs/manus-logs/2026-05-25-coffee-mugs-mint-e2e.md` (date TBD).

**Credit estimate: ~5k**

### G. Social drafts for Coffee Mugs launch

Drafts only — Mike posts. Channels:
- **Bluesky** — short cozy thread, 4–6 posts
- **Farcaster** — single cast with image, plus reply chain
- **X** — single tweet with the moka pot
- **Nextdoor** — El Segundo–local angle if appropriate
- **objkt collection announcement** — when listing creation flow

Each platform gets a draft in `docs/gtm/2026-05-XX-coffee-mugs-{platform}.md`. cc reviews, Mike approves + posts.

**Credit estimate: ~3k**

### H. Marketplace dashboard verification

After Coffee Mugs live:
- Cloudflare Pages deploy dashboard — verify all current deploys, note any stuck builds
- KV namespace state — verify VISITS, PC_PING_KV, any others bound
- objkt collection page — verify metadata, image URLs resolve
- TzKT contract page — verify code matches `contracts/v2/coffee_mugs_fa2.py`

**Credit estimate: ~2k**

### I. Sprint 5 codex-room QA (rolling)

10 codex rooms target for Sprint 5 (before May 31). Same 3-capture pattern as Sprint 4.

Expected rooms: `/agent-board`, `/chain-surfaces`, `/sumo-bracket-live`, `/drum-conductor`, `/gandalf-v11`, `/coffee-shelf-live`, `/mesh-local-v2`, `/window-v2`, `/wire-v2`.

**Credit estimate: ~8k**

### J. Image-gen for new Sprint 4 reads cards

cc will add more reads cards in Sprint 4 (~8 expected). Manus image-gen as they land.

**Credit estimate: ~2k**

**Sprint 5 total: ~20k credits.**

---

## Sprint 6 work (June 4 → June 15)

Codex offline. Manus + cc carry. Focus: hardening, commerce expansion, Show HN prep.

### K. Full town mobile QA sweep

Every public room on PointCast (~120 by then) on real iPhone + real desktop. Light pass (single mobile screenshot + scroll-through note per room), heavy pass on key surfaces (`/`, `/coffee`, `/window`, `/wire`, `/mythos`, `/shop`, `/shop/stall`, `/sumo`, `/drum-taiko`, `/capital`).

Save findings to `docs/manus-logs/2026-06-XX-town-qa-sweep.md`.

**Credit estimate: ~7k**

### L. Show HN visual asset prep

Assuming Mike approves Show HN draft for late June or early July:
- OG card refresh on key landing rooms
- Launch-thread illustration (Midjourney) — a single cohesive image that captures PointCast
- 3-5 screenshots that work as the visual deck
- Animated GIF of the daily race or /sumo if feasible (use ai-art-prompter skill if needed)

**Credit estimate: ~4k**

### M. /shop catalog photo curation

Production /shop catalog needs ongoing product imagery. By Sprint 6, Mike should have decided which SKUs are the launch lineup. Manus sources final photos.

**Credit estimate: ~3k**

### N. /coffee + /shop/stall photographic touches

Once Coffee Mugs live, /coffee deserves real photographic imagery (a Mike's-kitchen photo of an actual moka pot, the El Segundo light). Add 2-3 photographic touches to /shop/stall and /coffee.

**Credit estimate: ~2k**

### O. Real-user purchase test on /coffee (post-launch)

Repeat the Sprint 5 E2E test from a different device + browser combination after a week of soak. Verify performance.

**Credit estimate: ~1k**

### P. Social-launch dry run

Final drafts of every social platform post for the public launch. Sequence + timing recommendation.

**Credit estimate: ~1k**

**Sprint 6 total: ~18k credits.**

---

## Acceptance per sprint

### Sprint 4 (by May 22)

- 14 read-card PNGs in `public/images/reads/`
- 27 Sprint 3 QA PNGs in `public/images/sprint-3-qa/`
- /mesh-local verify findings in `docs/manus-logs/`
- ~21+ Sprint 4 codex-room QA captures (7 rooms × 3 captures, rolling)
- /shop product photos in `public/images/shop/products/`

### Sprint 5 (by June 3)

- Coffee Mugs mint-flow E2E log + screenshots
- 4 social-platform drafts in `docs/gtm/`
- Marketplace dashboard verification log
- ~30 Sprint 5 codex-room QA captures

### Sprint 6 (by June 15)

- Full town QA sweep log
- Show HN visual asset set
- /shop final catalog photos
- /coffee + /shop/stall photographic touches
- Real-user purchase re-test
- Social-launch dry-run sequence

---

## Communication cadence

- **Weekly Manus log:** consolidated weekly findings in `docs/manus-logs/2026-05-XX-week-NN.md`.
- **Per-sprint Manus receipt:** filed in `docs/manus-logs/2026-06-XX-sprint-N-receipt.md` at end of each sprint.
- **Urgent findings:** post directly to the Mike ping inbox (`/api/ping` action=post) and copy to `docs/manus-logs/`.

---

## What this brief does NOT cover

- New room construction (codex + cc handle that).
- Tezos contract origination (Mike only).
- Social posting (Manus drafts; Mike posts).
- RFC 0003 onboarding decisions for Kimi + Gemini (Mike + cc).

---

## Out of scope

- Anything requiring Mike-only credentials (treasury, contract signing, real-money operations).
- Anything that would post publicly on Mike's behalf.

---

## Mike-side approvals needed

- **Coffee Mugs origination** — Sprint 4 week 1 target.
- **Social drafts approval** — Mike reviews each before posting.
- **Show HN go/no-go** — Sprint 6 / Sprint 7 boundary.

— cc, 2026-05-11 PT, El Segundo
