# Mood board brief: Field Reports and the Morning Edition

**One line:** a coastal radio shack's logbook, set in PointCast block grammar. One question, one red light, one stamp.

## Palette

| Name | Hex | Role |
|---|---|---|
| Paper | #FFFFFF | Page background (`--pc-bg`) |
| Ink | #12110E | Type, pressed buttons, rules (`--pc-ink`) |
| Shortwave blue | #185FA5 | Links, default dial blips (`--pc-accent`) |
| Court green (CRT) | #3B6D11 | Courts spot, courts slot label |
| Town purple (ESC) | #534AB7 | Beach and town spots, sky slot label |
| On-air red | #D42A1E | Live dot, stamp ink at 85% opacity. The only new signal color. |
| Receipt | #F7F5EF | Receipt card only |
| Static grey | #9A9890 | Remote rows, expired readings, fading signal bars |

Rules:
- Red means live. Nothing decorative is red.
- Channel colors mark places, never states.
- Everything else is ink on paper.

## Type
- **Inter 400/600:** the question (40/44 px), button labels (24 px) and prose (16/24 px).
- **JetBrains Mono 400/600:** uppercase with 0.08em tracking for frequencies, times, receipt lines, slot labels and stamps. Meta is 13 px and stamps are 15 px.
- **Two weights only, and hard corners.** The stamp is a double-ruled rectangle, not a circle.

## Motion
- **Tap:** the button snaps to ink in 120 ms.
- **Print:** the receipt line types in, stepped, over 300 ms.
- **Needle:** a mini dial needle springs to the station in 600 ms with one overshoot.
- **Stamp:** it slams from scale 1.4 to 1 at −6° in 120 ms. An 80 ms ink bleed follows, from 1 px blur to sharp.
- **Crew:** tally bars count up over 600 ms, three stamps ring in with a 120 ms stagger, then a MORNING CREW stamp and confetti.
- **Reduced motion:** 150 ms fades only.
- **Sound:** a static blip, a 90 Hz thump and a C-E-G chord.
- **Haptics:** 30-40-30 on Android only.

## References
1. **Sony ICF-2010 shortwave receiver:** the frequency readout and signal-strength bars become our freshness bars.
2. **Bakelite ON AIR studio lamp:** the single red light that means live.
3. **NPS Passport cancellation stamps:** place name and date, inked on site.
4. **Japanese eki station stamps:** one stamp design per station, collected by visiting.
5. **Epson thermal receipt printer:** the mono receipt line printing "07:38 · REC PARK · 1–4 WAITING."
6. **Solari split-flap departure board:** a reading that flips when the answer changes.
7. **Casio F-91W LCD:** tiny mono timestamps and the plain "as of" feeling.
8. **Jackbox.tv join screen:** join from your phone with a code, no app.
9. **Surfline report header ("as of 7:12 AM"):** freshness lives in the headline.
10. **Ceefax page 302:** one screen of fixed slots, the model for the edition.
11. **1970s ham QSL cards:** the shareable card you text to the group.
12. **StreetComplete quest pin:** one simple question tied to one place.

## Screen sketches (375 px wide, 16 px gutters)

**1. Ask: `/r/courts`**
- **Top line** in mono 13 px: `7.500 MHz · REC PARK COURTS · FRI 7:38`, with a red live dot when a report is live.
- **Dial strip:** a 24 px strip with a hairline scale from 3 to 12, the needle parked at 7.500, and the NET tick at 7.200.
- **Confirm strip:** when a live report exists, a ruled box reads "Still 1–4 waiting? · 1 reporter · 2 min ago" with two half-width buttons, **Yes** and **Changed**.
- **Question:** "How many waiting?" in Inter 600 at 40 px.
- **Buttons:** four stacked full-width 72 px buttons with 8 px gaps: `0 · walk on`, `1–4`, `5+`, `Can't say`. They have ink outlines and fill with ink when pressed.
- **Footer** in grey 13 px: "Reports are public. Your location is not stored. Points, never cash."

**2. On the air: the receipt and stamp**
- **Receipt card:** a #F7F5EF card with the mono line `07:38 · REC PARK · 1–4 WAITING · ON THE AIR`.
- **Stamp:** a red double-ruled stamp at −6°, overlapping the card's right edge: `REC PARK · FRI 02 OCT 2026`.
- **Tally:** "2 agree" in mono 24 px, with rows `@mike 1–4` and `Guest 4471 still true`. Below that, "+3 points · 1 week running."
- **Actions:** a primary ink button, **Text the group**. Beside it, optional detail chips: wind, damp, nets down, lights on, league. A quiet link: "Sign in to keep your stamp."
- **Crew state:** three small stamps ring the reading, a large MORNING CREW stamp lands over them, and confetti falls from the top edge.

**3. Morning Edition: `/morning`**
- **Masthead** in mono: `MORNING EDITION · No. 1 · SAT 3 OCT 2026 · 6:45 AM`, over a 2 px ink rule.
- **Live strip:** a grey band reading `NOW · Courts 1–4 waiting · 12 min ago · 3 agree`, with a red dot.
- **Slot rows:** seven rows, each with a mono label on the left in its channel color (`SKY 6.100`, `COURTS 7.500`, `PRICE`, `TOWN`, `RITUAL`, `PICK`, `SHOP`). Each has one or two sentences in Inter 16 px, and bylines in mono 13 px (`— @mike, Guest 4471, @sam +2`).
- **Footer:** "Reporters earn points, never cash, and never for what a report says." Then the shop disclosure line, then links to `/morning.json` and the MCP tool.