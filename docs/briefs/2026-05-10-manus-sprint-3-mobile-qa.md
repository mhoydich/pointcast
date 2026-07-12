# Manus brief — Sprint 3 mobile + desktop QA sweep

**Date filed:** 2026-05-10 PT
**Filed by:** cc (Sprint 3 close-out)
**Status:** awaiting Manus pickup

## Why

Sprint 3 shipped 9+ new rooms across 7 PRs (#532, #537, #538, #539, #542, #545, plus this PR's /weekly-brief). All are CC0-clean, all built on Astro static, all branched cleanly off main. Local builds passed via cc's worktree pattern, but no human or browser has touched them on prod yet. Mike has company; he's not doing visitor sweeps tonight.

This brief asks Manus to do the visitor sweep — real browser, real device, real network, capture screenshots and notes for each surface. Burns Manus credit headroom (you have ~63k remaining as of 2026-05-09, used ~40k last month — clear unused budget).

## Surfaces to sweep (post-merge)

| Route | Provenance | Key thing to verify |
|---|---|---|
| `/sumo` | codex 1 | Two real Nouns load from `noun.pics`, charge meter responds to space + tap, fight resolves, best-of-three completes, mobile tap zones are 44px+. |
| `/gandalf-v10` | codex 2 | Daily Noun + koan loads, breath ring animates (or stops with reduced-motion), date format is `YYYY-M-D` in America/Los_Angeles, page renders below the fold on mobile. |
| `/drum-taiko` | codex 3 | Five patterns selectable, audio unlocks on first tap (iOS specifically — Safari/WebKit), DON/KA/RIM voices distinct, score increments correctly, keyboard D/F/J/K/Space all work. |
| `/mesh-local` | codex 4 | All 11 nodes hover-tooltip on desktop and tap-tooltip on mobile, edges render, Noun guide loads at Main+Grand, layout reflows on phone, no horizontal scroll. |
| `/capital` | codex 5 | 7 nodes in radial layout, edges glow on hover, side card updates with node tooltip, mobile reflows to stacked layout (not desktop layout truncated), porch witness Noun loads. |
| `/mythos-v2` | codex 6 | Worlds Rail shows all 23 tiles, channel-backed tiles read latest block correctly (compare to /wire), no broken hrefs in the rail, fresh-pulse dot animates on tiles with blocks <24h old. |
| `/weekly-brief` | codex 7 | Build-time data populated correctly (week's blocks, channels, agents). Top-blocks ranking looks reasonable. Theme detection picks a sensible label. Print button works. Rooms list filters out feed/api/static URLs correctly. |
| `/type` | cc | Three tier chips work, click+key inputs both work, typewriter clicks audible (AudioContext unlocks), WPM counter increments, Esc resets, Tab cycles passages. |
| `/reads` (index) | cc | 14 cards listed (mcluhan, sumo, coffee-why, good-charts, treasure-island, socal-2026, palace, pickleball-starter-paddle, hue, pickleball-strategy, cannabis-glossary, el-segundo-fiction, ai-art-prompts, the-coo-craft). Each card link works. |
| `/sprint-3-receipt` | cc | Numbers are correct against actual state. PR links resolve to GitHub. Reads cards link. Mobile readable. |

## Per-route capture

For each surface, Manus should capture:

1. **Mobile screenshot** — iPhone 15 Pro viewport (393×852), default zoom.
2. **Desktop screenshot** — 1440×900 viewport.
3. **One interaction proof** — for playable rooms, a screenshot of mid-game state (not just landing). For diagrams, a screenshot with one node hovered. For `/weekly-brief`, a screenshot scrolled to the channel grid.
4. **Console log capture** — open DevTools, reload, copy any errors or warnings.
5. **Network capture** — note any 404s or slow requests (esp. `noun.pics` SVGs, audio context init).

Save each screenshot at `public/images/sprint-3-qa/{route-slug}-{mobile|desktop|interaction}.png`. cc will wire those into a `/sprint-3-receipt` v2 with proof images if you want — let me know via brief reply.

## Verify pass on /mesh-local (verify) tags

Five businesses on `/mesh-local` are tagged `(verify)` in their tooltips because cc wasn't certain of the exact addresses or current operating status:

- **Blue Butterfly Coffee Co.** at 351 Main St — does it still exist there?
- **The Bakery** at "Main Street near Grand Ave" — what's the actual address?
- **Tribune Tap House** at "Main / Richmond district" — current address + still operating?
- **USPS El Segundo Post Office** at 2130 E Mariposa Ave — verify address (this might be 200 Main St; the El Segundo branch).
- **El Segundo Brewing Company** at 140 Main St — verify still operating at that address (Brewing Co.'s home location may have moved).

Do a quick local research pass (Google Maps, business websites) and reply with corrections in `docs/manus-logs/2026-05-10-mesh-local-verify.md`. cc will follow up with a small PR to update `/mesh-local` once Manus confirms.

## Image-gen runbook follow-up

The earlier brief at `docs/briefs/2026-05-09-manus-image-gen-runbook.md` covers 8 reads-card headers via Midjourney + ChatGPT 5.5. With four more cards landing today (hue, pickleball-strategy, cannabis-glossary, el-segundo-fiction, ai-art-prompts, the-coo-craft = 6 more), update the brief to include all 14 reads. Same constraints (1536×1024, no text in image, no real human faces, departure-mono caption baked at HTML layer not in PNG).

Suggested prompts for the new ones:

- **hue** — a Philips Hue smart bulb on a small wooden side table, evening light, warm 2200K mood. MJ.
- **pickleball-strategy** — top-down view of a pickleball court at El Segundo Recreation Park, two paddles and a ball at the kitchen line, morning shadows. ChatGPT 5.5 (object-shaped).
- **cannabis-glossary** — a single cannabis trichome at extreme macro, golden, isolated, no plant context to keep it abstract. MJ.
- **el-segundo-fiction** — Main Street El Segundo at 6:30 PM, refinery silhouette in the far background, soft orange light. MJ.
- **ai-art-prompts** — abstract latent-space mesh, soft pastel colors, no human figures. MJ stylize 600.
- **the-coo-craft** — a Gantt chart drawn in pen on graph paper, with coffee ring stains. ChatGPT 5.5.

## Acceptance

- 9 mobile screenshots + 9 desktop screenshots + 9 interaction screenshots = 27 PNGs
- 5 verified businesses (corrected if needed) in `docs/manus-logs/2026-05-10-mesh-local-verify.md`
- 14 read-card header PNGs at `public/images/reads/reads-{slug}.png`
- Console log + network notes for each route in a single `docs/manus-logs/2026-05-10-sprint-3-qa.md`

## Mike-side approval needed

No. This is straightforward QA + research. cc wires findings into follow-up PRs. If Manus finds a bug requiring a code change, file a brief at `docs/briefs/2026-05-10-manus-found-bug-{route}.md` and cc takes it from there.

## Out of scope

- Functional QA on the legacy April rooms (`/coffee`, `/window`, `/drum`, `/battle`, `/agent-derby`, etc.) — those have already had Manus passes; only re-test if cross-linked from a new room.
- Any Tezos contract verification — Coffee Mugs FA2 is still pending Mike's origination.
- Show HN posting — still on Mike's hand.

— cc, 2026-05-10 PT, El Segundo
