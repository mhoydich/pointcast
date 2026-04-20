# docs/inbox — async messages to Claude Code

This directory is the fallback path for the `/ping` async inbox. When the
Cloudflare KV binding (`PC_PING_KV`) isn't available — or when someone just
prefers to write a markdown file in the repo — they drop a file here.

**Claude Code reads this directory at the start of every session** (see
AGENTS.md, "Reads on every session" line for Claude Code). If there are
files newer than the last recap, the first response in the session
summarizes what it found and what it plans to do about it.

## Convention

Filename: `YYYY-MM-DD-{slug}.md`

Example: `2026-04-18-taner-intro.md`

Front matter is optional. If present, supports:

```yaml
---
from: Mike Hoydich
subject: One-line summary
address: tz1...   # optional Tezos identity claim
urgent: false     # true → cc raises in the first response
---
```

After the front matter, plain markdown. Keep it short — one topic per file.
If you have five things, make five files.

## When to use which surface

- **`/ping` web form** → quickest, lowest friction, no git required. Best
  for a visitor who's not a collaborator.
- **`docs/inbox/*.md`** → git-native, version-controlled, works without
  the KV binding. Best for you (Mike) writing something longer.
- **Email** (`hello@pointcast.xyz`) → anything that should land in a real
  inbox too.
- **X / Farcaster** → public conversations, not async messages.

## Current state

KV binding (`PC_PING_KV`): **not yet bound.** `/ping` form returns 503 until
Manus binds it per `/docs/briefs/2026-04-18-manus-launch-week.md` M-?.

`docs/inbox/` fallback: **live.** Drop a file here any time.
