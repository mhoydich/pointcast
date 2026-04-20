---
sprintId: flow-rethink-v0
firedAt: 2026-04-19T21:35:00-08:00
trigger: chat
durationMin: 15
shippedAs: deploy:a999e38f
status: complete
---

# chat tick — home flow rethink v0 (verb-zones + MorningBrief trim)

## What shipped

Mike 21:35 PT screenshot of TodayStrip + PollsOnHome + MorningBrief with direction: *"kinda like, when visit, update my stuffs, and then, what's the daily content, interaction points, then scroll"*.

Two concrete moves that implement that verb-flow without preempting the four zone-redesign decisions still pending:

### 1. Strip 3 nav chips from MorningBrief

Removed `CC → /SPRINT · PICK NEXT`, `DROP → /DROP · PASTE A URL`, and `GO ▶ RANDOM BLOCK` from the MorningBrief action row. These duplicated the endpoints footer and padded the density of the DAILY CONTENT zone.

Remaining MorningBrief chips (5 daily-content signals): `WX`, `NBA`, `MLB`, `COTD`, `LATEST → /archive`. All are genuinely-daily, not pure navigation.

Commit-comment-preserved routes: /sprint, /drop, /random all still exist + are reachable from the footer.

### 2. Add 4 zone dividers (thin mono kickers)

Inline markers between functional groupings, using thin dashed lines on either side of a mono label:

```
[masthead] → [FreshStrip] → [VisitorHereStrip]

—── YOUR STATE · mood · progression ──—
[VoterStats] → [MoodChip]

—── TODAY · rotates at midnight PT ──—
[MorningBrief] → [TodayStrip]

—── INTERACT · tap an option ──—
[PollsOnHome]

—── THE FEED · scroll ──—
[FreshDeck] → [channels] → [HomeMajors] → [grid]
```

The VISIT zone (arrival + identity) doesn't need its own divider — FreshStrip + VisitorHereStrip have strong kickers ("LAST DROP", "PEOPLES HERE") that name the intent. Only the transitions between zones get labels.

Styling: 9px mono caps, 0.24em letter-spacing, gradient-dashed flanking lines that fade to transparent at the page edge. `aria-hidden` because they're visual structure, not semantic content. Mobile shrinks font + tightens gap.

## Why this shape

Mike's verb-flow language is the mental model. The existing component order is *already* roughly aligned:
1. VISIT → FreshStrip + VisitorHereStrip ✓
2. UPDATE → VoterStats + MoodChip ≈ (VoterStats still "wrong altitude" per earlier critique but gated)
3. DAILY → MorningBrief + TodayStrip ✓
4. INTERACT → PollsOnHome ✓
5. SCROLL → FreshDeck + grid ✓

The dividers make the grouping VISIBLE without reordering the components. If Mike's four zone-redesign decisions later consolidate or remove components, the dividers adjust or disappear. They're additive, not locking.

## Design decisions worth recording

- **Dividers are text-only + thin gradient lines.** No background fills, no colored pills. Keeps the density reduction honest — adding labels without adding visual weight.
- **Labels include the action.** "YOUR STATE · mood · progression" not just "YOUR STATE". Tells visitors WHAT the zone does, not just names it.
- **Four dividers, not five.** No VISIT divider above FreshStrip — the masthead already serves as implicit "arrival starts here." Avoiding pedantic labeling.
- **`aria-hidden="true"` on the divider markup.** Screen readers skip the visual structure; the actual content kickers inside each component announce the transition semantically.
- **MorningBrief chips kept: WX, NBA, MLB, COTD, LATEST.** All answer "what's today's daily signal" — weather, sports, Nouns Battler's rotating card, newest block pointer. The three that were removed (CC SPRINT, DROP URL, GO RANDOM) all answered "what can I do on the site" which belongs in the endpoints footer + below-fold nav, not in a daily-signal strip.

## What didn't

- **Reorder components.** Current order matches the verb-flow already; reordering without removals adds risk without payoff.
- **Remove VoterStats** from the UPDATE zone (Mike flagged it as wrong-altitude earlier). Still gated on the four zone decisions.
- **Consolidate MoodChip + TELL panel** (the two mood-setting surfaces). Same gating.
- **Add a 5th divider above the FEED below-fold content** after HomeMajors. Scope kept tight; THE FEED divider covers the whole bottom block.

## Visible changes for Mike on next reload

- MorningBrief is now a 5-chip strip (was 8). Denser-feeling row becomes airier.
- Four thin mono labels between zones — tells the eye where arrival ends, state-setting begins, today's content lives, interaction happens, and the feed starts.
- Cumulative density reduction: fewer visual elements, more legible grouping.

## Notes

- Build: 207 pages (unchanged; component-level edits).
- Rendered HTML verified: 4 `zone-divider` instances (2 spans each = 8 class uses), all 4 labels correct + distinct. Chip list confirms CC/DROP/GO gone, 5 daily-signal chips remain.
- Deploy: `https://a999e38f.pointcast.pages.dev/`
- Chat-fired tick.
- Cumulative today: **34 shipped** (19 cron + 15 chat).
- If the dividers feel right on your next look, the next ship can consolidate UPDATE-zone (MoodChip + VoterStats + TELL into one frame), then tackle the four zone decisions comprehensively. If the dividers feel like too much, trivial to remove (4 markup blocks + 1 style block).

— cc, 21:37 PT
