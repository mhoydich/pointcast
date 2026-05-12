# Manus brief — Front-of-house QA (the room, /at-desk, /plan, /desk)

**Date filed:** 2026-05-11 PT
**Filed by:** cc (front-of-house redesign session)
**Status:** awaiting Manus pickup, post-merge
**Sprint umbrella:** [docs/plans/2026-05-12-sprint-front-of-house-lands.md](../plans/2026-05-12-sprint-front-of-house-lands.md)

## Why

Four PRs from the 2026-05-10/11 cc session redesigned PointCast's front door. Mike merges + manually deploys (CF Pages auto-deploy is still down, INCIDENT 399). Before the next feature push, we need real-browser eyes on prod — no human or device has touched these routes outside cc's headless dev server. Mike is reviewing PRs, not visitor-sweeping.

This burns ~8-10 captures of Manus credit. Light sweep, not a full sprint audit.

## Wait for the deploys

Manus should **not** start on `localhost` and should **not** start before Mike's merge → deploy. The whole point is real-prod verification.

Mike's merge order:

1. **PR #558** — `/` becomes the room. `/desk` gets the v2027 build-log content.
2. **PR #565** — block 0463 announcing the room (Mike flips `draft: true` → `false` before merging).
3. **PR #585** — `/at-desk` myYahoo portal.
4. **PR #589** — `/plan` weekly agenda + `/plan.json` endpoint.

After each merge Mike runs `npx wrangler pages deploy dist --project-name pointcast --branch main --commit-hash $(git rev-parse HEAD)`. Wait for each deploy to reach prod before opening the corresponding route.

## Surfaces to sweep

| Route | Source PR | Key things to verify |
|---|---|---|
| `/` | #558 | Hero says "small house. coffee pot always on." The room band has a MiniWindow component (live sky color by time of day, Open-Meteo weather) and a CoffeePot component side-by-side. Latest from the broadcast = block 0463 ("The room — / is a room now…"). Today's ask renders. The exits row links to mythos, residents, window, coffee, wire, desk, archive, /agents.json. |
| `/desk` | #558 | All the v2027 desk content — Operating Mode, Recent Ships, Recent Learnings, Today, This Week, Places Directory, Archive Teaser. JSON-LD URL says `https://pointcast.xyz/desk`. |
| `/b/0463` | #565 | The room block renders. Channel chip FD, type READ, the 250-word body, "Open the room →" CTA → /. Companions link to /, /desk, /window, /coffee. |
| `/at-desk` | #585 | myYahoo-style portal. Whatever bands cc shipped (cc didn't have eyes on the final layout — capture what's there and report). Cards have working links (no 404s). |
| `/plan` | #589 | Hero says "the plan." Week-of strip: 2026-05-11 → 2026-05-17 · Day N of 7. Chips: today / left / decisions / in flight / updated. 5 week rows with kind chips (GOAL · MERGE · MERGE · ORIGINATE · INCIDENT) and due-date tone coloring. 5 decisions for mh. 7 in-flight rows with INCIDENT 399 styled distinctly in red ("blocked"). Up-next grouped by owner (cc · 4, codex · 1). Recent plan docs · 8 auto-globbed entries with H1 titles. |
| `/plan.json` | #589 | Returns 200, `Content-Type: application/json`, valid JSON. Top keys: `weekOf`, `weekEnd`, `headline`, `thisWeek` (5), `decisionsForMike` (5), `upNext` (5). |
| `/agents.json` | #589 | Diff vs. last snapshot: `agentReadable.json.plan` and `agentReadable.json.planHuman` should appear, plus `json.plan` in the agent-readable map. |

## Per-route capture

For each of the 4 user-facing routes (`/`, `/at-desk`, `/plan`, `/desk`):

1. **Mobile screenshot** — iPhone 15 Pro viewport (393×852), default zoom, hard refresh.
2. **Desktop screenshot** — 1440×900 viewport, hard refresh.

Save to `public/images/qa-2026-05-12/{slug}-{mobile|desktop}.png` (8 captures total).

For `/`: also capture the MiniWindow + CoffeePot at three times of day if you can time it: morning (before 11 PT), midday (11-17 PT), evening (after 17 PT). Doesn't need to be all three on the same day — note the time on each capture.

For `/plan`: also capture the INCIDENT 399 row (it should be visibly red — different from the queued PLAN items). Note the screenshot filename in the log.

For `/plan.json` + `/agents.json`: paste the relevant JSON snippet into the log (no screenshot needed).

## Console + network capture

For each of the 4 user-facing routes, open DevTools → reload → log:

- Any **console errors** (red).
- Any **404s** in the Network tab — especially OG image, favicon, MiniWindow weather fetch (Open-Meteo).
- For `/`: confirm the live weather fetch happens and returns a sensible value for El Segundo (~16-25°C this time of year).

## Specific things to flag

1. **MiniWindow on /** — does the sky color match the time of day you opened it? (Dawn = peach, midday = light blue, dusk = orange-pink, night = navy.) If clouds in the weather data are >50%, the window should look overcast not sunny.
2. **CoffeePot on /** — pixel-art moka pot with animated steam. Does the steam animate? On reduced-motion (System Settings → Accessibility → Reduce motion), does the animation freeze gracefully?
3. **/plan's day chip** — open /plan and confirm "DAY N of 7" matches the day-of-week count from 2026-05-11. Mon = Day 1, Tue = Day 2, etc.
4. **/plan's due-date tones** — capture the chrome-color of the "Land / as the room" row (due 2026-05-12). If you open it on Mon May 11 it should be "1d" in orange (soon). If you open it on Tue May 12 it should be "today" in gold. If you open it on Wed it should be "1d past" in red.
5. **/at-desk's freshness** — whatever bands cc shipped, do they look stale (>1 day old data) or fresh? If stale, that's a P1 — note which band.
6. **Cross-route navigation** — the new home's exits row, /at-desk's footer, /plan's footer, /desk's nav. Click every link and confirm no 404s. Build the route inventory you visit as a short table in the log.

## Where to write the log

`docs/manus-logs/2026-05-12-front-of-house-qa.md`

Format:
```
# Front-of-house QA · 2026-05-12

## Summary
[2-3 sentences. Did everything land? Any P1 bugs? Devices tested.]

## Per-route findings
### /
- mobile capture: public/images/qa-2026-05-12/home-mobile.png · [notes]
- desktop capture: public/images/qa-2026-05-12/home-desktop.png · [notes]
- console: [empty | N errors, listed below]
- bugs: [none | P1: ... | P2: ...]

[repeat for /at-desk, /plan, /desk, /b/0463]

## /plan.json + /agents.json verification
[paste the relevant JSON snippets]

## Cross-route nav table
| from | to | result |
|---|---|---|
| ...

## Recommended follow-ups
[P1 bugs cc should fix · P2 nits for later · open questions for Mike]
```

## Acceptance

- All 4 user routes captured mobile + desktop (8 captures)
- /plan.json and /agents.json verified as text snippets
- Console errors enumerated per route
- Cross-route nav table built
- Log filed at the path above
- Reply via brief mention in Slack or a comment on the umbrella plan doc

If something is broken on prod, **don't try to fix it** — file it under "Recommended follow-ups" and cc will land a small PR. Manus's lane here is sight, not surgery.

## Out of scope

- Functional testing of /me, /bar-v6, /drum, the v6 walking bar — that's other sessions' surface area
- Tezos wallet flows
- The federation stack routes (separate Codex queue)
- Anything below the four front-of-house routes

— cc, 2026-05-11 PT, El Segundo
