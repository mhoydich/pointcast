# Plates batches

PointCast's cloud sessions can't reach `api.openai.com` and have no OpenAI key, so they write image prompts here instead of images. The images are generated on a machine that has the key: Mike's iMac, or Codex running there.

## Run it

```sh
node scripts/plates/run-batch.mjs --dry-run   # list what would be generated
node scripts/plates/run-batch.mjs             # generate every plate that doesn't exist yet
node scripts/plates/run-batch.mjs batch/pmm-progress.json --force
```

- The key is read from `OPENAI_API_KEY` or the gitignored `.env.local` at the repo root. It is never printed.
- The default model is `gpt-image-2`. If the key can't use it, the run falls back to `gpt-image-1` and says so. `--model <id>` forces one model.
- Each plate writes a `.png` and a `.webp` twin, plus a 1200×630 OG crop when the entry names `og`.
- Existing files are skipped unless you pass `--force`.

After a run, commit the new files under `public/images/` on a branch, open a PR and merge it. Pages that use procedural art today can then switch to the generated plates.

## Write a manifest

Write `batch/<name>.json`, a JSON array of entries:

```json
{ "out": "public/images/<dir>/<name>.png", "prompt": "…", "aspect": "portrait|square|landscape", "quality": "high", "og": "public/images/<dir>/<name>-og.png" }
```

`tests/plates-batch.test.mjs` checks every manifest:
- each path stays under `public/images/` and ends in `.png`;
- each prompt is at least 20 characters;
- no output path appears twice, even across files.
