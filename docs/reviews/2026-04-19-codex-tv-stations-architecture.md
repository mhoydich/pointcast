# `/tv` STATIONS mode — architecture review

Author: `codex`  
Source: `docs/briefs/2026-04-19-codex-tv-stations.md`

The STATIONS brief is best implemented as an additive layer on top of the current `/tv`, not as a rewrite. `/tv` already works as a static, cast-friendly surface: build-time slides, minimal runtime state, no server dependency on page load, and graceful degradation when presence or poll fetches fail. STATIONS should preserve that property while adding a tunable local register.

## A1. Rendering strategy

Keep `/tv` statically generated and render STATIONS as a client-side mode switch. The server-side work should happen at build time: collect the global slide set, collect the in-range block pool, and precompute a per-station block summary array. Then embed that data into the page as HTML and `data-*` / JSON payloads the existing inline script can read.

That avoids the main downside of SSR here: losing durable edge-cache behavior on the most TV-like route in the site. `/tv` should stay cheap to open from a cast device, hotel TV browser, or old Chromecast path. The station layer does not need request-time personalization; it needs mode switching and prefiltered content.

Payload growth is acceptable. A station summary object only needs a small subset of block fields: id, title, dek, type, channel code/name/color, thumbnail/noun fallback, mood, location, and canonical URL. Even if all 15 stations carried 8 summaries each, that is roughly 120 lightweight entries. In practice several stations will have fewer, and some will have zero. The incremental HTML/inline-data cost should stay well within a "big-screen landing page" budget and compress well because titles, field names, and repeated markup patterns are highly redundant. This is a better trade than turning every `/tv` hit into an origin request.

I do recommend shipping `/tv/[station]` alongside `/tv`. Those pages should still be statically generated from the same shared data and same component structure; they simply boot into `station-feed` mode for a specific station. That gives PointCast a castable URL someone can bookmark or open directly on a TV without navigating the index first.

## A2. State management

Use plain inline JavaScript with a small state machine:

- `mode`: `global | stations-index | station-feed`
- `globalSlideIndex`
- `stationSlug`
- `stationSlideIndex`
- `weatherByStation`
- `paused`
- `autoReturnDeadline`
- `autoTourEnabled`

This keeps the runtime aligned with the current `/tv` philosophy. No framework is needed, and adding one would mostly increase boot cost for a page that is intentionally ambient.

The key behavioral distinction is that global rotation remains exactly as it works now, while station rotation becomes a sibling mode with its own timer and index. Entering `stations-index` pauses global slide advancement. Entering `station-feed` starts a finite local rotation over only that station's matching blocks. Exiting returns to the previous ambient state without rebuilding the page.

## A3. Station selection keys

Use a TV-style numeric mapping for the first nine stations and `Q W E R T Y` for the remaining six, ordered by distance from El Segundo. The mapping should be visually printed on the station-index grid so the user never has to memorize it.

This is more reliable than mnemonic first-letter shortcuts because the station set contains collisions and multi-word names: Manhattan Beach, Malibu, and maybe future Metro/Marina variants all fight for `M`; Long Beach and Los Angeles fight for `L`. Numeric-first input feels closer to channel surfing anyway, which reinforces the broadcast metaphor.

Keyboard support should be:

- `S` opens/closes the stations index from global mode
- `1-9`, `Q W E R T Y` choose a station from the index
- `Esc` or `B` returns from station feed to global
- arrow keys keep their existing next/previous role inside the active feed

Touch support should mirror the brief: swipe up to open the index, tap a tile to enter, swipe down to back out.

## A4. Back-to-global behavior

Auto-return to global after five minutes of inactivity in station feed, and also return to global when a station feed exhausts its local block list. That is the right middle path for the "cast it and walk away" use case.

Staying forever inside one station makes `/tv` too easy to strand. Cycling from station to station without an explicit opt-in risks making the interface feel unstable. The cleanest rule is: a viewer can tune to a place, but the broadcast eventually recenters itself. Global mode remains the canonical attract loop; station mode is a temporary zoom.

I would keep the optional station auto-tour scoped to global mode only. If enabled, it should begin only after a generous idle window and stop on any interaction. That preserves the "living geo-tour" idea without taking control away once someone has actively chosen Malibu or Long Beach.

## A5. Weather API edge caching

Use `functions/api/weather.ts` backed by `caches.default`, not a new KV namespace. This data is read-mostly, naturally TTL-shaped, and can be cached by request URL. Creating `PC_WEATHER_KV` would add operational surface without giving a meaningful product benefit.

The proxy should accept station identity plus coordinates, fetch Open-Meteo, normalize the response to a compact payload such as `{ tempF, condition, sunset, updatedAt }`, and send `Cache-Control: public, s-maxage=600`. On the worker side, cache by URL for ten minutes. That shares fetch cost across viewers while keeping the implementation simple and stateless.

Weather loading itself should be lazy. Global `/tv` mode should make zero weather calls. Entering the stations index should kick off tile-weather requests in the background. Direct `/tv/[station]` loads should fetch only that station immediately. This preserves the fast first paint of today's `/tv` while still making STATIONS feel alive once invoked.
