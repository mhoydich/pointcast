# A-1 — Hearth as the Loom front door

Draft for Fable's review. No merge or deployment.

## What changes

- A bare browser visit to `/loom` or `/loom/` opens the existing Hearth.
- Hearth has a visible **Full Loom** link to `/loom#directory`.
- For You replaces its count headline and number tiles with Hearth's shared
  “While you were out” sentence. The newest ask leads; additional asks start
  folded. This uses the common For You renderer, including Mike's public page.
- Existing public-name behavior, queues, actions, and posting identity remain.

## Routing choice

An early inline browser script calls `location.replace('/loom/hearth/')` only
when the pathname is exactly `/loom` or `/loom/` and both the query and fragment
are empty. Every existing query or hash bypasses it, including `?to=`, `?for=`,
`?as=`, composer links, message IDs, and the existing navigation tabs.

A server redirect cannot inspect a fragment. Also, the extensionless-path
branch in `functions/_middleware.ts` serves the static asset itself, bypassing
`functions/loom/index.ts`. The small client gate avoids changing either server
path. JavaScript-disabled and machine HTTP reads retain the existing response.
There are no Function, API, protocol-card, classic-page, or storage changes.

## Recap

`LoomRecap.astro` uses the existing `readHearth` and `whileYouWereOut` helpers.
It takes one snapshot per page visit and shares it across queue redraws. It
reads the browser's existing Hearth seen mark without updating it when viewing
someone's public For You page. A failed read shows an explicit retry action;
quiet and unavailable activity retain Hearth's existing wording.

## Evidence

- `node --test tests/loom*.test.mjs`: 322 passed, no failures or skips. This
  includes the changed tests, routing cases, public For You identity, one
  leading ask, and recap loading, shared reads, retry, text safety and storage.
- Changed Astro files passed `@astrojs/compiler` transforms in memory. Both
  browser scripts passed `node --check`; `git diff --check` passed.
- Independent review found no routing blocker. The preserved server, classic,
  API and JSON sources have no diff.

The earlier build stopped with `ENOSPC` while copying public downloads. Per
Mike's resumed instructions, no build or `dist/` output is produced in this
run. The local fixture browser scripts are included for the cloud follow-up;
they do not provide completed browser evidence yet.

390px check pending (Claude, cloud)

After a cloud build, run `node scripts/check-loom-hearth-front-browser.mjs`.
Set `PROGRESS_CHROMIUM_PATH` to the cloud Chromium executable, and use
`PROGRESS_PLAYWRIGHT_MODULE` if Playwright is installed outside this checkout.
The check exercises both compiled pages with local fixture messages and GET
requests only, then saves the two screenshots under
`docs/codex-logs/hearth-front-door-20261122/`. It blocks external browser
requests, so fonts use the existing system fallback.
