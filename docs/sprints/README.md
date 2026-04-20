# docs/sprints — autonomous sprint recap log

Every time cc fires a sprint (via hourly cron tick or chat-tick), it
appends a recap file here. One file per sprint, immutable once written.

## Filename

`YYYY-MM-DD-{sprint-id-or-slug}.md`

## File format

```yaml
---
sprintId: voice-audit
firedAt: 2026-04-18T11:11:00-08:00
trigger: cron               # cron | chat | ping | queue
durationMin: 28
shippedAs: deploy:abc12345  # commit / deploy reference
status: complete            # complete | partial | aborted
---

# {Sprint title}

## What shipped
- bullet
- bullet

## What didn't
- bullet (if any)

## Follow-ups
- bullet (queued for next sprint)

## Notes
Optional cc notes.
```

## Reading

`/sprints` page (planned) renders these chronologically.
`docs/sprints/index.md` gets auto-rebuilt on each new file (planned).
