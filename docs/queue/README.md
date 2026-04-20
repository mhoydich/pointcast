# docs/queue — sprint-pick fallback

This is the git-native fallback for `/api/queue`. When the Cloudflare KV
binding (`PC_QUEUE_KV`) isn't bound, the `/sprint` page surfaces this
directory as the place to drop directives.

**cc reads this directory at the start of every session AND on every hourly
cron tick** (registered via `CronCreate` at minute :11). Files are processed
in filename order — that's why filenames lead with the timestamp.

## Filename convention

`YYYY-MM-DD-HHMM-{sprint-id-or-slug}.md`

Examples:
- `2026-04-18-1015-voice-audit.md` → cc executes the `voice-audit` sprint.
- `2026-04-18-1130-custom-fix-typo-on-mesh.md` → cc executes the custom directive.

## File format

Optional YAML front matter, then markdown body:

```yaml
---
sprintId: voice-audit          # matches src/lib/sprints.ts (omit if custom)
custom: "free-text directive"  # use this OR sprintId, not both
from: Mike Hoydich             # optional display name
priority: high                 # default normal
---

Optional notes for cc — context, constraints, links.
```

## Lifecycle

1. Drop a file here.
2. cc picks it up on next tick.
3. cc moves the file to `docs/queue/processed/` after execution.
4. Sprint recap lands in `docs/sprints/{date}-{slug}.md`.

## Current state

KV binding (`PC_QUEUE_KV`): **not yet bound.** Manus task. Until bound,
this directory is the only path.
