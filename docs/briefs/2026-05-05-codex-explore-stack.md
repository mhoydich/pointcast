# Codex brief: review the /explore stack + CF Pages still stalled

**Date filed:** 2026-05-05 PT (early morning)
**Filed by:** Claude Code (cc) on behalf of Mike
**Severity:** medium — agent-readable surfaces shipped without Codex review per CLAUDE.md; CF Pages deploys are wedged again
**Mike's ask (verbatim):** *"have codex go"*

## tl;dr

Four PRs landed in `main` overnight that build a feature directory + freshness signals on top of the page tree. Per CLAUDE.md, agent-readable endpoints want Codex review — they didn't get it pre-merge because Mike said "review and publish." Filing the review now, post-merge, with a clear list of what to verify and what to push back on. Plus: CF Pages production has been stuck at the 08:27 UTC build for 30+ minutes despite four merges to `main` — this is the same recurring pattern as the 2026-04-30 stall brief.

## What shipped

| PR | Branch | What |
|---|---|---|
| [#342](https://github.com/mhoydich/pointcast/pull/342) | `explore-only` | New `/explore` page + `/explore.json` manifest, auto-built from `src/pages/*.astro` |
| [#384](https://github.com/mhoydich/pointcast/pull/384) | `explore-disc` | Wires `/explore` into `/agents.json` (human + json + CORS), `/llms.txt`, `/for-agents`, footer |
| [#388](https://github.com/mhoydich/pointcast/pull/388) | `explore-recent` | "New this week" strip; `lastCommit` ISO + `recent[]` on `/explore.json`, mtime via single bulk `git log` call |
| [#396](https://github.com/mhoydich/pointcast/pull/396) | `explore-pulse-clean` | `/explore.rss` (RSS 2.0); "Forgotten doors" section; `stale[]` + `feeds{}` on `/explore.json`; `/explore.rss` added to `agents.json.endpoints.rss` and CORS allowlist |

Files of interest:

- `src/lib/explore.ts` — frontmatter regex parser, category bucketing, `recentFeatures()`, `staleFeatures()`, `MTIMES` git-log parser
- `src/pages/explore.astro` — page render with sticky filter, channel grid, recent strip, stale list, footer
- `src/pages/explore.json.ts` — agent manifest with `categories`, `features[]`, `channels[]`, `apps[]`, `recent[]`, `stale[]`, `feeds{}`
- `src/pages/explore.rss.ts` — RSS 2.0 feed of the 30 most-recent pages
- `src/pages/agents.json.ts` — added `endpoints.human.explore`, `endpoints.json.explore`, `endpoints.rss.explore`, CORS entries for `/explore.json` and `/explore.rss`
- `public/llms.txt` — added `/explore + /explore.json` to the agent retrieval order
- `src/pages/for-agents.astro` — added `<li>` for `/explore + /explore.json`
- `src/components/FooterBar.astro` — added `/explore` link in the AGENTS group

## What to verify

**Agent-readable correctness**

- [ ] `/explore.json` payload schema is sane and stable (no breaking changes if a parallel agent renames a category key — `staleFeatures()` and `recentFeatures()` accept named args, easy to extend)
- [ ] `/explore.rss` validates against an RSS 2.0 validator (`<atom:link rel=self>`, `<lastBuildDate>`, GUIDs are stable across builds — uses `${url}#${mtime}` so a re-touched page gets a new GUID, which is intentional but worth a sanity check)
- [ ] CORS allowlist additions are correct: `/explore.json` and `/explore.rss` set `Access-Control-Allow-Origin: *` via the route handlers; CLAUDE.md's `audit:agents` script doesn't currently check those URLs but it passes today
- [ ] `endpoints.rss.explore` is consistent with the existing `rss.all` / `rss.postsOnly` shape

**Build-time cost**

- [ ] `import.meta.glob('../pages/*.astro', { query: '?raw', eager: true })` reads ~250 files on every build; verify it doesn't bloat the explorer chunk (raw text only, not compiled imports — should be fine but worth measuring)
- [ ] Bulk `git log --name-only --pretty=format:__COMMIT__%ct -- src/pages/*.astro` adds one process per build, ~tens of ms; falls back to `mtime: 0` if `.git` is shallow or missing — graceful

**Frontmatter parser**

- [ ] `pickConst()` regex in `src/lib/explore.ts` (`(?:const|let)\s+${name}\s*(?::[^=]+)?=\s*([^;\n]+)`) catches `const title = '...'` and `const title: string = "..."` — does it miss anything in real frontmatter? Looking specifically at pages that use template literals with newlines or computed titles. The explorer falls back to `deriveTitleFromSlug()` so any miss degrades to "Drum Radio" instead of the curated string, which is okay but suboptimal.

**Categorization**

- [ ] Categories in `CATEGORIES` are prefix/exact-match. Any new mental neighborhood that ought to bucket separately (e.g. `cb`, `commons`, `tide` are currently in `misc`)?

## CF Pages stall — recurring pattern, same as 2026-04-30 brief

`https://pointcast.xyz/agents.json` `generatedAt` is `2026-05-05T08:27:44Z`.

- #384 merged 08:35 — not live
- #388 merged 08:38 — not live
- #396 merged 08:56 — not live
- Plus several non-/explore merges (chartmaker, drum-meditate, ues track-05, content 0431) — none live

Last good deploy timestamp matches a build that ran *before* my first merge today, so something in the CF Pages pipeline has been jammed since ~08:27 UTC.

This is the same shape as the 2026-04-30 stall brief (`docs/briefs/2026-04-30-codex-cf-pages-stall.md`): builds queue behind one stuck deploy, fresh routes 404, last-good build keeps serving. That brief proposed:

1. Detect stuck-deploy with a cron poll on `agents.json.generatedAt`
2. Trigger a forced Pages deploy via API when stale > 15 min
3. Page Mike if forced-deploy fails

Worth picking back up. The pattern repeated today; if it repeats again Mike will need to keep manually kicking the dashboard.

## What's not changed

- BLOCKS.md schema — untouched
- Channel definitions — `CHANNEL_LIST` referenced read-only
- `/for-agents` JSON-LD — unchanged
- All wallet/contract code — untouched

## Push-back welcome on

- Whether `/explore` should be folded into `/for-agents` instead of being its own page
- Whether the geocities aesthetic (chunky pixel cards, `box-shadow: 4px 4px 0`) clashes with the Sparrow-stack purity goal — Mike's memory says "PointCast aesthetic: geocities + sim city, not clean AI product" so I leaned in, but worth a sanity check
- Whether `staleFeatures()` defaulting to 90 days is too generous — the section was empty on today's local build, suggesting most pages have been touched recently anyway

## Action

If anything breaks an agent's expected payload shape, the right move is a follow-up PR off `main`, not a revert — the explore stack is composable and the manifest fields are additive.
