# Sol brief — the two HELLO plates, through ChatGPT's image model

**Redo (2026-09-04, Mike):** *"redo the images no humans as the one legs are messy."* Same two plates, same direction, **no people at all**. The chalk figures are replaced by things: an empty pool edge, a deck chair, a folded towel, a beach ball, a palm shadow. Overwrite the same paths.

**Date filed:** 2026-09-04 PT
**Filed by:** Claude Code (cc) for Mike to hand to Sol
**Repo:** `mhoydich/pointcast` · work from `main` on a new branch · redo tracked on issue #1074 (first round was #1052 / PR #1049)
**Why Sol:** cc's sandbox has no route to OpenAI and cannot commit binary art it did not see. Sol has a machine, a network, and an `OPENAI_API_KEY`.

## The job in one line

Make two original poster plates for the HELLO faucet with OpenAI's image model, no people in them, save them into the repo at fixed paths, verify them by eye, open a PR to `main`, and say so on issue #1074.

## Setup (once)

```
git clone https://github.com/mhoydich/pointcast && cd pointcast
git checkout -b sol/hello-plates-no-people main
npm ci
echo 'OPENAI_API_KEY=sk-...' >> .env.local     # gitignored; never commit it
```

`.mcp.json` registers a local MCP server, `scripts/mcp/plates.mjs`. Claude Code loads it automatically; for Codex add the block from `scripts/mcp/README.md` to `~/.codex/config.toml`. If Sol is neither, the direct-API fallback is at the bottom.

## Direction (from Mike, verbatim where quoted)

"directionally positive hockney warhol hello, ok with some degas and a monochrome filter" · "lets make one with a fish in it" · "and a clean one" · "use chatgpt image generator".

Style in words, not names, if the model balks at names: flat California pool-and-stucco light, hard-edged shadows, screen-print repetition with registration drift, soft chalk-and-pastel figures at the edges, finished as one deep ink blue on cream paper with visible halftone. Positive, warm, welcoming. No words other than HELLO. No logos, watermark, signature, frame border. Asymmetrical: letters weighted left, quiet space right.

## Plate 1 — clean

Tool call (MCP):

```
plate_generate
  prompt: "An original pop-art poster celebrating the single word HELLO. Large hand-cut screen-print letterforms repeated in a four-panel stacked grid down the left two-thirds, each panel slightly misregistered the way a silkscreen run drifts. Flat California pool-and-stucco light: hard-edged shadows, a sunlit wall, a swimming-pool plane, one palm-frond shadow crossing the wall softly. Along the lower edge, the pool's edge with an empty deck chair, a folded towel, and a beach ball drawn in soft chalk-and-pastel strokes. No people anywhere. Warm, positive, welcoming. Finished as a monochrome print: one deep ink blue on cream paper, visible halftone, no other hue. Asymmetrical composition, letters weighted left, clean negative space right. No words other than HELLO, no humans, no figures, no hands, no logos, no watermark, no signature, no frame border."
  out: "public/images/faucet/hello-poster.png"
  og: "public/images/faucet/hello-og.png"
  aspect: "portrait"
  quality: "high"
```

## Plate 2 — fish

Same call with this prompt and these paths:

```
  prompt: "An original pop-art poster celebrating the single word HELLO. Large hand-cut screen-print letterforms repeated in a four-panel stacked grid down the left two-thirds, each panel slightly misregistered the way a silkscreen run drifts. Flat California pool-and-stucco light: hard-edged shadows, a sunlit wall, a swimming-pool plane. In the quiet right third, one friendly fish swims past, drawn as a flat cut-paper silhouette with a single paper-white eye, fully inside the frame and not overlapping the letters. Along the lower edge, the pool's edge with rippling water and a single beach ball drawn in soft chalk-and-pastel strokes. No people anywhere. Warm, positive, welcoming. Finished as a monochrome print: one deep ink blue on cream paper, visible halftone, no other hue. Asymmetrical composition, letters weighted left, negative space right. No words other than HELLO, no humans, no figures, no hands, no logos, no watermark, no signature, no frame border."
  out: "public/images/faucet/hello-poster-fish.png"
  og: "public/images/faucet/hello-og-fish.png"
  aspect: "portrait"
  quality: "high"
```

The tool writes the PNG, a `.webp` twin, and a 1200×630 OG crop. Then recompose the OG cards the way commit `6866f75` did: `hello-og.png` is both plates side by side on cream, `hello-og-fish.png` is the fish plate alone on cream (a centre crop cuts the letters mid-word). Run `plate_inspect` on each output to confirm 1024×1536 PNGs.

## Verify by eye, then fix or regenerate

Open all four PNGs. Reject and regenerate if: any person, figure, hand, or silhouette of a person; any word other than HELLO; a second colour survived the monochrome pass; the fish overlaps the letters or is cut by the frame; extra limbs on the chalk figures; a signature, frame, or watermark; the composition is dead-centre. Two regenerations per plate is the budget; if it is still wrong, say so on the PR rather than shipping it.

If the final plate differs from the alt text, edit the `alt` on the `<img>` in `src/pages/faucet/hello.astro` to describe what is actually there.

## Commit, push, report

```
git add public/images/faucet src/pages/faucet/hello.astro
git commit -m "faucet: HELLO plates redone with no people"
git push -u origin sol/hello-plates-no-people   # then open a PR to main
```

Then one comment on issue #1074: which model, how many regenerations, anything rejected and why. Write the same to `docs/codex-logs/2026-09-04-faucet-hello-plate.md` if you have write access, otherwise the PR comment is enough.

## Do not

- Do not open, copy, or paste anything from the `eth info` spreadsheet. The faucet does not need it and neither does this job.
- Do not touch Cloudflare secrets or fund anything.
- Do not commit `.env.local` or any key.
- Do not touch files outside `public/images/faucet/` and the one alt line.

## Fallback without the MCP server

Call `POST https://api.openai.com/v1/images/generations` with `{"model":"gpt-image-1","prompt":<prompt above>,"size":"1024x1536","quality":"high","n":1}` and `Authorization: Bearer $OPENAI_API_KEY`. Decode `data[0].b64_json` to the PNG path above, then in the repo:

```
node -e "import('sharp').then(async ({default: s}) => { for (const n of ['hello-poster','hello-poster-fish']) { const p='public/images/faucet/'+n; await s(p+'.png').webp({quality:82}).toFile(p+'.webp'); await s(p+'.png').resize(1200,630,{fit:'cover',position:'centre'}).png().toFile(p.replace('poster','og')+'.png'); } })"
```
