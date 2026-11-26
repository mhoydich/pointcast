# Manus brief: one real test print of the Baby Bonfire first place kit (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Baby Bonfire: first place kit". Nobody has printed these parts. The point of this brief is to find out what is wrong with them. A report that says "this did not fit" is a good result.

**This place holds no flame. Do not put a candle or anything hot on or near the print.**

## Open these URLs

1. https://pointcast.xyz/baby-bonfire/first-place/ (after merge and deploy; before that, a Pages preview of the pull request, same path)
2. The four files linked there: `place-tile.stl`, `puck-blank.stl`, `puck-shell.stl`, `puck-lid.stl`
3. https://pointcast.xyz/baby-bonfire/first-place/files/manifest.json (sizes, triangle counts and sha256 of each file)

## Accounts and tools

- An online 3D printing service that takes STL uploads and prints FDM in PLA or PETG, or a person with a printer. Which service is Mike's choice.
- For the measuring: calipers that read to 0.05 mm, a phone with NFC, one round 25 mm NTAG213 sticker. This part needs a person with the parts in hand; say in the log who did it.

## Needs Mike's approval first

- Any order, payment, account creation or delivery address. Do not place an order without his explicit go. Getting a quote is fine.
- Buying the sticker.
- Do not buy the electronics for the sensing puck. That is not part of this brief.

## Step 1: upload and quote (no approval needed)

- Upload all four STL files. Units are millimetres. Do not rescale, repair or re-orient them: they sit the way they print (tile top face down).
- Capture: a screenshot of each file in the service's viewer, the dimensions the service reports (expected: 100 x 100 x 9.2, 46 x 46 x 6.3, 46 x 46 x 24, 46 x 46 x 4.5 mm), and any warning it raises (thin walls, non-manifold, needs supports). Copy warnings word for word.
- Capture the quote and lead time for one set in PLA, 0.2 mm layers, 15% infill, no supports. Put the quote in the log for Mike. Do not publish prices anywhere else.

## Step 2: print one set (after approval)

- Material PLA or PETG, 0.4 mm nozzle, 0.2 mm layers, three walls, 15% infill, no supports, no brim. Note what was actually used, and the printer or service.

## Step 3: photographs

Plain background, a ruler in frame. Tile from above; tile underside (feet, tag recess, hole); tile edge-on on a flat surface; blank puck in the bay from above and edge-on; shell with the lid on, in the bay; lid underside; a close view of the first-layer side of the tile (the top face); anything that printed badly.

## Step 4: measure and try (write the number, not "ok")

| What | Expected |
| --- | --- |
| Tile, side to side, both ways | 100.0 mm |
| Tile height on its feet | 9.2 mm |
| Bay, across the straight wall | 46.6 mm |
| Hole below the seat, across | 43.6 mm |
| Blank puck, across; height | 46.0 mm; 6.3 mm |
| Blank puck above the top face when seated | 1.0 mm |
| Tag recess, across; depth | 26.6 mm; 0.6 mm |
| Shell, across; height; cavity across | 46.0 mm; 24.0 mm; 42.0 mm |
| Lid lip, across the outside | 41.7 mm |

- Does the blank puck drop in under its own weight, turn freely, and push out from below? Same for the shell.
- Does the lid push onto the shell by hand? Does it fall off when turned over?
- On a flat surface, does the tile rock? Do all four feet touch?
- Did any surface sag, string or lift? Did the tile warp at the corners?
- With a 25 mm sticker in the recess: does a phone read it from above through the tile? From how far? From underneath? With the blank puck in? With a second tagged object sitting on the ring? On a metal surface?

## Where to write the result

`docs/manus-logs/2026-11-11-first-place-kit.md`: service or printer, material and settings, the table above with measured values, the yes/no answers with a sentence each, photographs, warnings verbatim. If a clearance needs to change, say by how much; the numbers are `bay.clearance` and `lid.lipClearance` in `public/baby-bonfire/first-place/files/params.json`.

## Not in scope

Posting about it anywhere public. Any flame. The sensing puck's electronics.
