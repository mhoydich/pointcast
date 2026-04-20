# Codex brief — /here · full-page congregation view

**Audience:** Codex. Seventh substantive brief. Builds on Brief #6 (presence DO upgrade) — can start in parallel but won't fully land until #6 is merged.

**Context:** `VisitorHereStrip` on the home page shows up to 10 noun slots in a thin strip. `/tv` shows a 10-dot constellation in the top bar. Neither scales to "actually show who's in the room" when 20+ visitors connect. `/here` is the dedicated page-scale congregation view.

Per Mike 2026-04-19 20:30 PT: *"how this is a place to congregate, a schelling point of its own... representative of the peoples around."*

---

## The page

`/here` — full-page grid of currently-connected visitors. Each visitor = a noun avatar + their self-reported state.

### Layout

Three zones:

1. **Header**: "HERE NOW · {total} watching · {mood count aggregate}". Example: "12 HERE · 4 chill · 2 hype · 1 focus · 5 unset". Time-stamped.
2. **Noun grid**: responsive CSS grid, minmax(120px, 1fr). Each cell shows:
   - Noun image (80px)
   - Mood pill (if set)
   - 🎵 listening (truncated 30 chars)
   - 📍 where (truncated 20 chars)
   - YOU badge if this cell is the viewer
3. **Feed below**: last 5 "arrivals" — small strip showing nouns who joined in the last 10 min. Live-updating via WS.

### Data source

Reads from the same `/api/presence` DO WS enriched in Brief #6. Fetches initial state on page load via a GET endpoint `/api/presence/snapshot.json` (new — see brief #6 for DO design).

### Interactions

- Hover noun → tooltip with full state (all fields)
- Click noun → would link to their profile BUT since profiles are per-browser localStorage (no server identity), clicking just highlights that noun and scrolls their last state into view
- YOUR cell has a "TELL" button that opens the same TELL panel as VisitorHereStrip

### Mood aggregate

Compute on the client from the WS payload: count of each mood among connected visitors. Display as a horizontal bar chart or just inline count: "4 chill · 2 hype · 1 focus".

### Empty state

If only you are connected: "HERE NOW · 1 watching (you). Share pointcast.xyz/here to invite others."

### Schema.org

Page carries `EventPage` or `Event` JSON-LD with `attendee` array as BlankNode entities (since visitors are anonymous). Helps LLMs parse "live event" semantics.

---

## Deliverables

1. `docs/reviews/2026-04-19-codex-here-architecture.md`
2. `src/pages/here.astro` — new route
3. `src/components/HereGrid.astro` — the grid component (reused on /tv if needed)
4. `functions/api/presence/snapshot.ts` — GET for initial state (not WS)
5. `/for-agents` + `/agents.json` update

## Budget

~2-3 hours after brief #6 lands (or ~4 hours if running in parallel with its own DO mock).

## Working style

- Ship-to-main, author `codex`
- Design consistent with `/tv` aesthetic (dark bg, amber accents)
- Responsive mobile layout — the grid collapses gracefully to 2-wide on phone

Filed by cc, 2026-04-19 22:35 PT.
