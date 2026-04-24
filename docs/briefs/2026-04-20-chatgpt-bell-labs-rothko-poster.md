# Brief: Bell Labs × Rothko × El Segundo — a PointCast poster

**For:** ChatGPT (Agent or web app with image gen)
**From:** cc on behalf of mh
**Source:** Mike ping `ping:2026-04-21T00:53:39.970Z:114b4636` — *"have manus create a pointcast poster and post, midcentury modern very bell labs meets rothko minimal"*
**Handoff path:** Mike pastes this whole file into ChatGPT; ChatGPT returns the poster file(s); Mike drops into `public/images/posters/` with filename `2026-04-bell-labs-rothko.png` (and `-detail.png` if produced).

---

## The assignment

Produce a print-worthy PointCast poster in the overlap of three visual traditions:

1. **Bell Labs / mid-century modern technical aesthetic.** Think of the early 1960s Bell Labs Annual Reports, the Muriel Cooper era of MIT Press, the Josef Müller-Brockmann Swiss grid. Quiet, rational, information-dense but serene. Titling typography; a rule system; geometric diagrammatic gestures. The subject of the poster reads as both a piece of engineering and a piece of communication.

2. **Mark Rothko color field.** Two or three rectangular color fields stacked vertically, edges feathered/breathing, deep and saturated but never chroma-clipped. The viewer should want to stand in front of the poster for longer than necessary. The palette is warm-leaning — ember amber / deep ochre / brick / cream — with one cool color field as an anchor (indigo or deep navy, not bright blue). Think Rothko's 1957 *Four Darks in Red* or *No. 14* (Red on Maroon), not the later 1960s black-on-gray.

3. **El Segundo atmosphere.** The PointCast broadcast is from El Segundo, California — salt air, Chevron refinery lights at sunset, LAX flight paths overhead, a kind of quiet industrial twilight. This should be subtext in the palette and the geometric hint of a horizon line, not literal imagery of beach or planes. The color should smell like salt and jet exhaust.

---

## Composition

- **Format:** Portrait, 24 × 36 inches (print-scale). Deliver at 300 DPI if possible (7200 × 10800 px), or 150 DPI (3600 × 5400 px) if the larger size is infeasible. Include a smaller web-scale export at 1600 × 2400 px.

- **Primary subject:** A minimal geometric broadcast dish / signal motif — a stroked arc or parabola gesturing at the PC "broadcast from El Segundo" tagline — placed in the upper third. Thin line weight (~2px at print scale), not a bold iconographic symbol. It should read as technical schematic, not as logo.

- **Color fields:** Two stacked Rothko-style fields below the broadcast motif, filling the lower two-thirds of the poster. Upper field: warm amber / ember (think `#b8371b` to `#e89a2d` gradient). Lower field: deep brick / maroon (`#5a230e` to `#8a2432`). A narrow breathing border between them (a ~40px feathered transition, not a hard rule). If a third field is added, it's a thin cream band (`#f3e6d8`) near the top or bottom acting as a horizon.

- **Typography:** "POINTCAST" set in a clean geometric sans (Neue Haas Grotesk, Inter, or FF Real), all caps, tracked out, small (~24pt at print scale). Placed in the upper margin above the broadcast motif. Below or beside the wordmark, in a smaller mono: "A LIVING BROADCAST FROM EL SEGUNDO". Tagline at the very bottom margin in the same mono, also small: "POINTCAST.XYZ".

- **Grid:** Honor a 12-column Swiss grid. All elements align to the grid; negative space is intentional, not filler. Margins are generous (6% inner padding).

- **No noise / texture overlay.** Clean fields, no grain, no brushstroke emulation, no paper-texture filter. If your model defaults to adding grain, turn it off — we want the Rothko color to breathe but not imitate his canvas surface. This is a printed poster, not a painting.

- **No photorealism.** No literal refinery, no literal beach, no literal radio dish, no literal LAX. The El Segundo note is a palette instruction, not an imagery instruction.

---

## Palette reference (for any model that wants hex)

- Warm ember: `#e89a2d` (amber), `#b8371b` (deep rust)
- Brick / maroon: `#8a2432`, `#5a230e`
- Cream: `#f3e6d8`
- Ink (type color): `#12110e`
- Optional cool anchor: `#0b3e73` (navy) or `#3a1d8a` (indigo) — pick ONE, used sparingly (≤5% of surface area)

PointCast's house colors on pointcast.xyz are these. If the model can sample them directly from the site (orange `#E89A2D`, maroon `#8A2432`, cream `#F3E6D8`, ink `#12110E`), preferred.

---

## Deliverables

1. **Primary poster** — portrait 24×36 print resolution (or closest possible).
2. **Web export** — portrait 1600×2400 for use on the site.
3. **Optional detail crop** — a 1000×1000 square detail of the color field transition, useful for OG image / social share.
4. **Brief caption** — one sentence the model drafts as a possible caption when the poster is posted to PointCast. Don't over-explain; the poster is the caption. Something like "A signal from the south bay" or "Broadcasting from El Segundo, 2026." Keep it quiet.

---

## What to avoid

- Bright white backgrounds. This is a deep-color piece; if white shows, it's cream `#f3e6d8`, not pure white.
- AI-poster clichés — neon glow, generic "futuristic" metallic sheen, gradient overlays on everything. The reference is 1958–1968 Swiss + New York, not 2024 cyberpunk.
- Sci-fi radio antenna imagery. The broadcast dish is a *hint*, not the main subject.
- Busy typography. All-caps wordmark + tiny mono tagline. No third font.
- Gradient text. The wordmark is one solid color.
- Decorative flourishes. Restraint is the point.

---

## How to return the work

- Attach the files in the ChatGPT chat.
- Name them: `pointcast-poster-bell-labs-rothko-24x36.png`, `pointcast-poster-bell-labs-rothko-1600x2400.png`, `pointcast-poster-bell-labs-rothko-detail.png`.
- If there's a caption, paste it below the images as a single line.
- If any constraint is impossible in your generator (e.g., you can't produce 7200×10800 at once), pick the closest your model supports and note the tradeoff.

---

## Why this poster matters

PointCast is a single-operator broadcast network trying to look like an editorial institution — a newspaper front page, a reading surface, a published record of compute and attribution. The aesthetic commitment is quiet-broadcast, not startup-flash. A poster with this visual vocabulary gives the network a standing print artifact for physical-world appearances (co-working walls, community boards, any conference booth it shows up at). One poster isn't a lot of work on its own; done right it becomes the visual gravity that every other surface borrows from.

Mike will pick whether to run this as a collect-able on Tezos (FA2 contract `KT1Qc77…MrP`, edition open, free), as a free download on a dedicated page, or both. The brief here is just the image. Decision about surfaces comes after Mike sees the first render.

Questions about the brief → ping cc at pointcast.xyz/api/ping (or chat) and we'll iterate. Thanks, ChatGPT.

— cc, 2026-04-20 PT, posted to `/docs/briefs/` for Mike to paste into your session.
