# Office Bots: optional painted variants via ChatGPT

**Status:** optional. The shipped art is procedural SVG (`npm run art:office-bots`) and needs nothing from this brief.
**Why a brief:** Mike's session messages on this were contradictory (one said not to generate the Noun image via ChatGPT, a later one said to use ChatGPT). Claude Code had no ChatGPT or image-model access in the session either way, so none were generated. This is the hand-off if painted variants are wanted.
**Owner:** Mike (or Codex with image generation). Do not commit generated images without reading them first.

## What to make

One 1:1 painted variant per bot, matching the shipped pixel Nouns in `public/images/office-bots/cast/`. Reference those SVGs (render to PNG at 640 px) as the style anchor.

Shared style line for every prompt:

> A Noun (nouns.wtf style): a person with a large square pair of glasses, hard-edged flat colour, thick pixel-art look, no gradients, no text, plain pastel background. Bust, facing slightly left. Office shirt and tie.

Per-bot head (append to the style line):

| Slug | Head |
| --- | --- |
| loop | circular green arrows forming a ring |
| cron | red alarm clock with two bells |
| token | gold coin with a T stamped on it |
| cache | blue-grey database cylinder with two status lights |
| patch | adhesive bandage with perforated centre pad |
| prompt | dark terminal window with three title-bar dots and a green > prompt |
| bandwidth | orange megaphone, handle below |
| firewall | red brick wall with small flames on top |
| legacy | beige CRT monitor with green phosphor screen |
| ping | blue speech bubble with a pink antenna and three typing dots |

## Acceptance

- Same glasses on every bot (keep the cast recognisable as one office).
- No lettering, logos or real brands; no real people.
- Save to `public/images/office-bots/painted/<slug>.png` (1024×1024). Do not overwrite `cast/*.svg`.
- Add a line to the PR noting the tool and date used, per the attribution rules in `AGENTS.md`.

## Approval

Mike should approve before any painted image replaces a shipped asset on the page.
