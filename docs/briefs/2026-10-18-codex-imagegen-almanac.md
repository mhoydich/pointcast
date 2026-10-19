# Codex image brief: Almanac photographs (2026-10-18)

Mike asked for new Currency Builder currencies made with the ChatGPT Pro subscription, through the tunnel to his machine if it works, or by controlling the machine if it doesn't. The cloud Claude Code session couldn't do either:

- Its network policy blocks `chatgpt.com` and `api.openai.com`, and the `codex` CLI isn't installed in the container.
- The only Remote Control session on Mike's Mac ("Generate 50 Pool Notes with Codex imagegen") has reported `computer_unreachable` since 2026-10-15 and is still waiting on a Bash approval. No other session on the Mac was reachable, and no bridge environment was listed.

So the 52 notes shipped as vector SVGs (`/currency-builder/almanac/`), and the photographs are one command away on the Mac.

## Run it

From the repo root on Mike's machine, with Codex signed in to ChatGPT and `image_generation` on:

```sh
npm install
node scripts/almanac-codex-imagegen.mjs          # all 8 shots; skips any already on disk
node scripts/almanac-codex-imagegen.mjs perseids # one shot by id
```

The script renders reference PNGs from the real note faces (2400 × 1200, into the OS temp dir), passes them to `codex exec -i … '$imagegen …'`, and checks that each PNG exists afterwards. Output: `public/images/currency-builder/almanac/photos/{id}.png`.

To run it from a cloud session next time, start `claude remote-control` in the repo folder on the Mac first. The session then shows up in the Claude Code app and can be messaged.

| id | Notes used | Shot |
| --- | --- | --- |
| `perseids-blanket` | W32 front | Beach blanket at night, red flashlight, star chart |
| `southbound-bluff` | W02 front | Bluff bench rail, binoculars, a whale blow far out |
| `el-segundo-blue-notebook` | W24 front | Field notebook, buckwheat sprig, hand lens |
| `grunion-night` | W14 front | Waterproof sleeve on dry sand, moonlit foam |
| `king-tide-binder` | W03 front + back | Tide-chart binder, brass tide clock |
| `quarter-board` | W02, W14, W32, W40 | One note per quarter pinned to a cork board |
| `press-sheet` | W32, W24, W02 | Uncut press sheet with crop marks |
| `album-page` | W49 front, W52 back | Collector album, typed week labels |

Every prompt says to keep the note artwork exactly as in the reference, with the full Noun and "NOT LEGAL TENDER", and to show no people, hands or logos.

## Hand back

- Check each PNG at full size. The Noun must match its reference pixel for pixel with nothing cropped, the year wheel must show the right lit week, and no note may read as real money. Reject anything with invented text.
- Commit the keepers on a branch. If they're wanted on `/currency-builder/almanac/`, add a photo strip under the hero in a normal PR. Note any rejects here.
- No Mike approval is needed to generate. Publishing goes through a normal PR.
