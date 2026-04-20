# Inspiration · Foursquare (2010-2014)

Mike 2026-04-18: "research a tad of foursquare which was super super,
maybe some feature there in the future."

Foursquare at its peak invented (or popularized) a small set of social-
location primitives that mapped beautifully to a venue + person + time
graph. Here's what's relevant to PointCast and how it could land on
top of the existing /beacon + /collabs + DRUM stack.

---

## Core Foursquare primitives

| primitive    | what it did                                                                  | PointCast equivalent (current)            | what would extend it                                |
|--------------|------------------------------------------------------------------------------|-------------------------------------------|-----------------------------------------------------|
| **check-in** | "I am at this venue right now" with GPS validation                           | CH.VST blocks (visit log)                 | A `/check-in?venue=...` micro-form, GPS-optional    |
| **mayorship**| Most check-ins at a venue in the last 60 days                                | None                                      | Map onto DRUM token earnings, per-venue leaderboard |
| **tip**      | A one-line note about a place ("the cold brew is great")                     | NOTE blocks (free-form)                   | First-class Tip type pinned to a venue              |
| **list**     | Curated venue collection ("Best dink courts in the South Bay")               | CH.VST + free-form blocks                 | A `/lists/{slug}` surface, per-collaborator         |
| **special**  | Venue offers a discount/freebie to incentivize repeat visits                 | None                                      | Good Feels offers shop discount per N check-ins     |
| **superuser**| Tiered editor reputation for venue accuracy                                  | None                                      | Per-collab attribution + audit trail on /collabs    |
| **explore**  | "What's good near me right now?" categorical browsing                        | None                                      | A `/near?lat=...&lng=...` API + UI                  |

## What made Foursquare sticky

1. **Habit loop** — the daily check-in was friction-free (one tap)
2. **Public reward** — mayor titles + leaderboards were visible
3. **Real-world payoff** — specials gave check-ins material value
4. **Friends as filter** — a tip from a friend > a tip from a stranger
5. **Crowd-curated venue DB** — the data improved with use

## Mapping to PointCast (proposed roadmap)

### v1 (now): Drop infrastructure
✅ `/drop` lets anyone paste a URL (location, product, listen, watch, etc.)
✅ `/api/drop` queues with classifier in `src/lib/url-classifier.ts`
✅ docs/drops/ fallback when KV not bound

### v2 (next): Check-in primitive
- New Block subtype: `CHECK-IN` with required `venue` field
- `/c/visit` becomes the live check-in stream
- DRUM-token reward per check-in (1 DRUM, capped at 1/day/venue)
- Venue auto-created from first check-in

### v3: Tips + lists
- `TIP` block type — short note + venue ref + author
- `/lists/{slug}` surface — author-curated venue collections
- Tips on a venue render in `/beacon` and venue page

### v4: Specials + mayorship
- Good Feels can post a "Special" type tied to a Visit Noun count
- Mayor of a venue = wallet with most check-ins in 60 days
- Mayorship visible on /beacon venue cards
- Token reward: top mayor of the week earns bonus DRUM

### v5: Friends graph
- /collabs entries can opt into a "follows" relation
- Tip + check-in feeds filterable by collab
- Privacy: opt-in, no default sharing

## What we should NOT copy

- **Public-by-default check-ins** — privacy is non-trivial; default is private with explicit share
- **Aggressive gamification** — points-for-everything killed FSQ's late-stage app; we keep it sparse
- **Splitting the app** (Foursquare → Foursquare + Swarm) — scope creep, learn the lesson
- **Selling the data** — never. Visit log is the user's own record

## Concrete first steps (for a future sprint pick)

1. Add `CHECK-IN` to the Block type enum (BLOCKS.md change → DAO PC-0006)
2. Build `/check-in` micro-form (paste venue or use GPS)
3. Wire DRUM to award 1 token per first-of-day check-in
4. Per-venue page at `/v/{slug}` aggregating check-ins + tips
5. Mayor calculation in a Cloudflare cron (no on-chain heavy lift)

— filed by cc, 2026-04-18
