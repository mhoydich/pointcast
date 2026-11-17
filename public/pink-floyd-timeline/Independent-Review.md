# Pink Floyd timeline — independent review

Reviewed the revised `timeline.json` containing **60 events, 59 sources and 15 studio-album entries**, with a research cutoff of **15 November 2026**. This was a focused data and factual review, with primary-source checks for recent releases, personnel milestones and concrete uncertainties. The timeline and media files were not edited during this review.

## Outcome

**No blocking factual defect identified in the reviewed timeline.** The remaining implementation risks concern how the interface displays date precision and associates images with events.

- **Album sequence:** All fifteen standard entries are present, numbered 1–15 without gaps or duplication, from *The Piper at the Gates of Dawn* to *The Endless River*. *Ummagumma* is correctly explained as a live/studio hybrid counted once. Live releases, solo projects, remixes and anniversary editions are excluded from the studio count. Keep *Wish You Were Here* at number **9**: the [2025 publicity release](https://shorefire.com/releases/entry/pink-floyds-wish-you-were-here-50-out-now) contains an apparent “eighth studio album” error that the timeline correctly avoids.
- **Dates and links:** Event IDs are unique; all source and related-event references resolve. Day/month/year strings match their declared precision. Preserve month-only *Dark Side* and year-only formation/departure dates; do not render invented first-of-month or 1 January dates. UK release dates and documented market conflicts should retain their explanatory notes.
- **2026/2027:** The [8-Tracks announcement](https://www.pinkfloyd.com/pink-floyd-announce-8-tracks/) supports 5 June 2026 and Steven Wilson’s sequencing work; the [November Animals 50 announcement](https://www.pinkfloyd.com/pink-floyd-announce-animals-50/) subsequently describes it as released. *Animals 50* is correctly an announcement on **5 November 2026**, with **22 January 2027** still a scheduled future release. Keep its future status visible.
- **People and reunions:** The [2005 archive](https://archive.pinkfloyd.com/history/timeline_2005) supports the four-member Live 8 reunion. The [2006](https://archive.pinkfloyd.com/history/timeline_2006) and [2008](https://archive.pinkfloyd.com/history/timeline_2008) entries support Barrett’s 7 July 2006 death in Cambridge and Wright’s 15 September 2008 death. The [2011 archive](https://archive.pinkfloyd.com/history/timeline_2011) supports labelling the O2 appearance as guests at Waters’ show. Berlin 1990 and Mason’s Saucerful of Secrets are also clearly credited as separate projects.
- **Resolved during review:** The chronology author narrowed the 1969 Man/Journey passage to its sourced programme details, and changed September 1978 from an asserted formal project-selection meeting to the documented demo work. Both changes are present in the reviewed file.

## Media associations to preserve

`timeline.json` currently contains no per-event image/video bindings, so these depend on the interface implementation.

1. **Toronto 1987:** The photograph’s Commons metadata says 8 September in Toronto; the [official chronology](https://archive.pinkfloyd.com/history/timeline_1987) places tour opening in Ottawa on 9 September after Toronto rehearsals. Omit the optional photograph or use a qualified year-level caption. Do not identify it as the Ottawa opening.
2. **Different events sharing a year/place:** `docklands-1989` depicts Docklands Arena, not the Venice concert. `knebworth-1975` depicts the 1975 event, not Knebworth 1990.
3. **Location context:** Abbey Road was photographed in 1987, Pompeii in 2015 and Battersea in 2012. Keep those dates and the explicit context captions visible when accompanying earlier events.
4. **Film/recording versions:** Pompeii’s performance, original film and restoration belong to 1971, 1972 and 2025 respectively. The selected *Echoes* upload is an **edited excerpt**, not the whole piece. PULSE’s selected performance is from 1994; restoration is later. *Dogs* uses the 2018 remix released in 2022, not the original 1977 mix.
5. **Playback availability:** The official 2026 *Crystal Voyager* link returned HTTP 404 through YouTube oEmbed. Preserve its optional/unconfirmed state. The ten default selections returned official-channel oEmbed metadata, which does not guarantee playback in every territory.

## Original showcase cues

### PULSE — Comfortably Numb

Listen for the shift from measured singing to the guitar’s longer, more intense phrases. Notice how camera distance and stage lighting make the performance feel both intimate and immense.

### The Endless River — Ian Emes film

Let the slow changes in sound set the pace, listening for keyboard layers and the space between guitar phrases. Watch how movement and colour suggest connections without requiring a literal story.

### Echoes — Pompeii, Part 1 edit

Follow how keyboard, guitar and drums share the space as the piece builds. Watch the relationship between the performers and the empty amphitheatre; this selection is an edited excerpt of Part 1.
