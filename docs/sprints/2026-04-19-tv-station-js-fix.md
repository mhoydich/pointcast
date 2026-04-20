---
sprintId: tv-station-js-fix
firedAt: 2026-04-20T07:11:00-08:00
trigger: cron
durationMin: 18
shippedAs: deploy:419db3a3
status: complete
---

# 07:11 tick — fixed broken JS template in /tv/[station].astro

## What shipped

Cleaned up the 6-hour-old flagged bug in Codex's STATIONS per-station route: `src/pages/tv/[station].astro` had a broken JS fallback that never actually ran.

### The bug

```astro
<script is:inline>
  window.location.replace({JSON.stringify(target)});
</script>
```

`{JSON.stringify(target)}` sits inside a `<script>` tag — Astro doesn't interpolate inside inline script bodies, so the brace was emitted verbatim. At runtime the JS parser hit `{JSON...}` and threw SyntaxError. The meta-refresh `<meta http-equiv="refresh" content={...}>` on line 18 DID interpolate correctly (Astro handles attribute expressions), so the redirect always worked — users never noticed — but the JS fallback was dead code.

### The fix

```astro
<script is:inline define:vars={{ target }}>
  window.location.replace(target);
</script>
```

`define:vars` is the proper Astro API for pushing frontmatter values into inline scripts. It injects `const target = "/tv?station=malibu";` at the top of the IIFE and JSON-escapes strings safely.

### Verified on production

`curl https://419db3a3.pointcast.pages.dev/tv/malibu/` returns:

```html
<meta http-equiv="refresh" content="0;url=/tv?station=malibu">
...
<script>(function(){const target = "/tv?station=malibu";
  window.location.replace(target);
})();</script>
```

Both redirect mechanisms now functional. Dual-redundant: meta-refresh fires in <100ms; JS runs after as belt-and-suspenders.

## Why this tick

- **Unblock-and-commit**: the bug was flagged in 2026-04-19-stations-docs-sweep.md at 01:31 PT and deferred "to avoid collision with Codex's active work." Brief #6 shipped at 06:20 PT (deploy 513fdf8a). Codex is now on low-risk reads only — no collision risk.
- **Surgical**: 2-line change in 1 file. Fits the tick discipline of one tight improvement + real deploy.
- **cc-side code ship**: after 5+ ticks of Codex orchestration + cc build+deploy-for-Codex, cc shipped its own diff this tick.

## Observations

- **Codex's work is getting committed.** `git log --oneline` shows `7079974 feat(tv): add stations mode` and `addf6e5 feat: enrich live presence broadcasts` both landed. Didn't see those commits happen this session — either Codex eventually got unstuck from its sandbox, or Mike ran commits from the desktop. Either way, the pending "commit-as-codex" question from earlier retros is partially resolved.
- **Big uncommitted diff remains** — `git status` shows ~80 modified files and 100+ untracked. Most are content (blocks/polls/OG images) + new pages (today, family, polls, moods, etc.) built throughout this session. Needs its own commit hygiene pass once Mike's back.
- No new approval dialogs in Codex app (last check end of Brief #6).

## What didn't

- **Kick off Codex #7** (/here congregation). Next logical step post-Brief-#6. Deferring one more tick to confirm Codex's #6 chat closes cleanly (no post-verify patches) before firing a new chat.
- **Audit the full /tv/[station].astro route** beyond the script fix — the file is tiny (28 lines), no other issues found, but didn't read every generated HTML.
- **Commit the session's uncommitted work.** Still pending Mike's call on batching strategy (one big sprint commit vs per-feature).

## Notes

- Build: 228 pages (unchanged; no new routes, single file edit).
- Deploy: `https://419db3a3.pointcast.pages.dev/tv/malibu/`
- Cumulative: **45 shipped** (27 cron + 19 chat with Brief #6 step 5 counted as 1 ship).
- Codex queue: 2/10 done (STATIONS + Presence DO). 8 pending. Next likely kickoff: #7 /here.
- STATIONS chat in sidebar: parked 9h. Still not unsticking.

— cc, 07:30 PT (2026-04-20)
