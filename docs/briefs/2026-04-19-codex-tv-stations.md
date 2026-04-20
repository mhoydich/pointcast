# Codex brief — `/tv` STATIONS mode

**Audience:** Codex. Second substantive project of the day, queued alongside Pulse (`docs/briefs/2026-04-19-codex-pulse-minigame.md`). These don't block each other — Pulse is a game layer (new route, new DO); STATIONS is a channel-flip layer on the existing `/tv`. You can work them in parallel or sequence.

**Context:** Mike 2026-04-19 17:45 PT: *"ok, lets give codex another project"*. The queue is real. Pulse is the interactive/game primitive; STATIONS is the geo-channel primitive. Together they let /tv cover "lite game" + "local content" — two of the four 0282 directives.

Also grounded in Mike's morning chat: *"100 mile radius ... Stations mode flips between them like broadcast channels — pick a city, you get its block feed, weather, events, and in-range drops"* (paraphrased from his exploration). The /local.json shipped this morning at 09:11 carries the full station + coordinate data you need.

---

## The feature: STATIONS mode on `/tv`

**One sentence:** Press a button (or wait for auto-cycle) and `/tv` flips from the global feed into a station-specific micro-feed — Malibu or Santa Barbara or Long Beach or any of the 15 cities within 100 miles of El Segundo — each carrying its own filtered block rotation, weather readout, and local identity.

### Why it matters for PointCast

- `/tv` today is a single broadcast. STATIONS turns it into a **tunable broadcast** — visitors cast to a TV in Long Beach and dial that channel; visitors in Santa Barbara dial theirs. Same site, 15 different ambient feeds.
- PointCast is El Segundo-anchored but SoCal-shaped. A station-level view honors the broader tonal register without losing the ES-home.
- The data already exists: `src/lib/local.ts` carries `STATIONS` (15 cities) and `filterInRangeBlocks()`. `/local.json` exposes the machine view. This is the consumer.

### UX shape

Three states, cleanly separated:

1. **Global mode** (current `/tv`). All feeds + daily drop + polls + presence. Default on load.
2. **Stations index**. A grid of 15 station tiles, each showing: name, miles + direction, block-count-in-range, thumbnail/noun for the most recent block there, and a tiny weather readout. Triggered by pressing `S` on keyboard OR swiping up on a touch device OR a dedicated "STATIONS" button in the top bar.
3. **Station feed**. A specific station's view — like `/tv` but the slide rotation only contains blocks whose `meta.location` matches that station (fuzzy substring match, same algorithm as `filterInRangeBlocks` but narrowed). Small "NOW VIEWING · MANHATTAN BEACH · 3mi N · ← BACK" overlay at the top. Auto-returns to global after N minutes of no interaction OR the station's feed exhausts.

### Mechanics

**Flip UX.** From global → stations-index: press `S`, swipe up, or click "STATIONS" in top bar. From stations-index → station feed: click a tile OR press number keys 1-9 + Q-R-T-Y-U-I for the 15 slots. From station feed → back: press `Esc` or `B`, click the back overlay, or swipe down.

**Station filtering.** Currently `meta.location` is freeform ("El Segundo", "Los Angeles", "Hollywood Hills → El Segundo"). The filter should be permissive: a station matches a block if the station's name (lowercased) appears anywhere in the block's location string. Edge cases to handle:

- "Long Beach" station matches "Long Beach" location but also "Long Beach, CA" — fine.
- "Los Angeles" — many ES blocks say "El Segundo" not "Los Angeles". Decision: "Los Angeles" station should match EVERY block within the 100-mile radius, since LA is the county-level anchor. Document this decision in the architecture doc.
- Stations that haven't been name-dropped yet (e.g. "Newport / Laguna") may have zero matching blocks. The station tile should still render — show "NO BLOCKS YET · COMING WHEN ONE LANDS" or similar.

**Weather per station.** Open-Meteo is already in use (MorningBrief uses it for El Segundo). Each station needs lat/lng. Problem: `STATIONS` in `src/lib/local.ts` has miles + direction but not coords. You need to add lat/lng to each station (use approximate city coords from any geocoding source; accuracy to ~2 decimal places is fine).

**Weather fetch strategy.** Options to evaluate:
- Fetch-per-station on station-feed entry (15 independent requests). Cold start = slow.
- Pre-fetch all 15 on /tv load. Parallel. Bandwidth cost ~15 small JSON responses.
- Lazy-load: global mode has no weather; only fetch when a station is activated. Probably best balance.
- Edge-cached via a Cloudflare Function that proxies Open-Meteo with a 10-minute cache. Shares fetch cost across all visitors.

Recommend the last option. Document the choice.

**Auto-rotate through stations.** Optional but interesting. After the viewer has been in global mode for N seconds, the TV could gently cycle through stations — spend 30s per station, then return to global. Makes /tv a living geo-tour rather than a static broadcast. Keyboard / swipe interaction pauses the auto-rotate.

---

## Architecture questions for your doc

### A1. Rendering strategy

`/tv` today is a single static page that builds all its slides at compile time. STATIONS changes this:

- Do you keep `/tv` SSG with stations as a client-side-rendered mode (all 15 stations' block arrays embedded in the initial HTML, ~modest payload bloat)? Or switch to SSR?
- If SSG with embedded data, the page gets bigger. Estimate the HTML size for 15 stations × 8 blocks per station = 120 block summaries. Is this acceptable?
- If SSR, you lose edge caching; every /tv load hits origin.

### A2. State management

`/tv` currently has a simple active-slide index + a poll-tally-refresh timer. STATIONS adds:
- Current mode (global / stations-index / station-feed)
- Current station (if in station-feed)
- Weather data per station (lazy-loaded)
- Auto-rotate timer + pause state
- Input handlers for S / Esc / numbers / swipes

You can get by with plain JS state + event handlers. No framework needed. Document the state machine.

### A3. Station selection keys

There are 15 stations. 1-9 is 9 keys. Q, W, E, R, T, Y is 6 more. Is that natural? Alphabetical-station-prefix (M for Manhattan Beach, L for Long Beach, etc.) collides because multiple stations start with same letters. Number keys feel like TV channel-flipping anyway — probably right.

Document your chosen key mapping. Consider a visual "keymap" legend overlay that appears on station-index entry.

### A4. Back-to-global behavior

If a viewer is in Long Beach station feed for 10 minutes without touching anything, does the TV:
- Stay in Long Beach until interaction?
- Auto-return to global after a fixed timeout (say 5 min)?
- Cycle through other stations then return to global?

Recommend the middle path (auto-return after ~5 min) — maintains the "I set this up and walked away, let /tv do its thing" use case.

### A5. Weather API edge-caching

As noted: a Cloudflare Function at `functions/api/weather.ts` proxying Open-Meteo with per-station KV or in-memory cache (10-minute TTL) is the right shape. But:

- Do you bind to `PC_WEATHER_KV` (new KV namespace) or reuse an existing one?
- If reusing, which? `PC_PING_KV` / `PC_POLLS_KV` / etc. — they're single-purpose named. Don't cross-pollinate.
- Or just use Cloudflare's native `caches.default` for HTTP-like caching?

Document your decision.

---

## Deliverables

### 1. Architecture doc

`docs/reviews/2026-04-19-codex-tv-stations-architecture.md`, 500-1000 words. Answers A1-A5 with rationale.

### 2. Implementation

- **`src/lib/local.ts`** — add `coords: { lat, lng }` to each entry in `STATIONS`. Use city-center approximations, 2-decimal precision is fine.
- **`src/pages/tv.astro`** — integrate STATIONS mode into the existing page. Structural changes OK but preserve all current behavior in global mode: daily drop slide, poll slides, presence constellation, ticker, auto-advance. Add stations-index and station-feed as parallel modes.
- **`src/pages/tv/[station].astro`** — dedicated station URLs? Optional — could be client-side mode-switch on `/tv`. Decide based on whether Mike/visitors want `/tv/malibu` as a castable URL (they probably do — bookmarking a station is a real use case).
- **`functions/api/weather.ts`** — if you go the proxy route. Fetches Open-Meteo, caches 10 min, returns structured weather payload `{ tempF, condition, sunset, updatedAt }`.
- **`/local.json` + `/local.astro` updates** — surface station coords if you add them (so the machine mirror carries the data too).

### 3. Site linkage

- Update `/for-agents` endpoints list with the new per-station URLs (if you ship `/tv/{station}`).
- Update `/tv`'s top bar with a small "STATIONS" affordance when in global mode.
- Update the /local page — add a "CAST THIS STATION →" link on each station row pointing at `/tv/{station}`.

---

## Working style

- Same as Pulse brief: ship-to-main, `author: 'codex'`, VOICE.md compliance.
- Design language: reuse the existing `/tv` palette (dark bg, Lora + JetBrains Mono, amber + oxblood). Station-feed mode should feel like "/tv at this place" — same chrome, different data.
- Keep the global-mode `/tv` intact. Current viewers shouldn't get a surprise layout change when they reload. STATIONS is additive, not substitutive.
- If you find conflicts with the Pulse implementation during integration, document them and ship around. Coordinate between the two projects only when they overlap.
- Budget: ~2-4 hours focused. Some of that is Open-Meteo contract research + station coord lookup, unavoidable.

---

## Why STATIONS and not another game / another interaction

Pulse already covers "multiplayer communal game." The next biggest missing shape on `/tv` is **tunable content** — the ability for a viewer to say "show me the local version of this." 15 stations × 8 blocks each ≈ 120 possible micro-feeds, compared to the current single 28-slide global feed. That's a significant increase in what `/tv` can show a viewer across a single visit.

Also: STATIONS is the primitive Manus's platform-matrix brief asked about when discussing location APIs and 100-mile-radius features. Landing STATIONS gives Manus something to reference in their platform analysis rather than an abstract feature.

---

Filed by cc, 2026-04-19 17:45 PT, sprint `codex-stations-handoff`. Linked from Block 0284.
