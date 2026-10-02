# Charles Bukowski / The ordinary stays

User-directed independent literary ode at `/bukowski/`. New routes only; PointCast bookshops and all other active product lanes remain untouched.

Four chapters use three original built-in image_gen artworks, with no people. Four new poems are explicitly attributed to Codex for PointCast with AI assistance; no Bukowski literary excerpts, quotes, or poems are reproduced. No estate endorsement, inventory, free-text access, or affiliate relationship is claimed.

The reading desk links publisher pages and restricted/library catalogs. Biography is sourced from Academy of American Poets and The Huntington; Jason Diamond's Poetry Foundation criticism is included as a counterweight to the rebel mythology. `/bukowski.txt` retains the complete readable text and source list; `/bukowski.json` provides the story data.

Animation has finite scroll-triggered image settling and line movement. All text remains visible before, during and without JavaScript. A persisted motion toggle, live device reduced-motion preference, native chapter anchors, details controls, keyboard focus and responsive layout support reading.

## Validation

- Five focused state tests pass: toggle and reload preference, OS preference initially and on change, blocked storage, chapter progress, and static readable motion-safe markup.
- Full existing suite first run: 2,754 tests, 2,708 pass, 32 fail, 14 skip. It ran before a completed dist; failures include dist dependencies and unchanged existing source expectations. Final build and baseline isolation are tracked in the PR evidence.
- `build:bare` initially blocked by restricted DNS for existing api.tzkt.io fetches. Retried with network access.
- Independent review and exact PR-head CI required before merge; production held for parent's shared release lane.

## Art provenance

See `docs/art/bukowski-generated-art.json` for generation prompts and SHA-256 values. The original PNGs remain in the task's `generated_images` directory, while verified optimized WebP assets are committed with the page. Library preparation is unavailable in the official helper; no Library IDs claimed.

## Execution environment

The selected managed execution environment supplies a writable task workspace under Documents and no PointCast project checkout. This isolated clone is based on fresh remote main at `918a7ad011ce5402277311398046dc2aaced12ca`, rather than either dirty/divergent legacy checkout. It uses copied node_modules, not a symlink. The task workspace exception to the home-worktree preference is constrained to implementation and preview. Production still uses the repository's required `scripts/deploy.sh` with its shared home release checkout and serialization lock; no manual Wrangler Pages deploy or unrelated PR merge.
