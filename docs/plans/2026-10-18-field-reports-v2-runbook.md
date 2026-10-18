# Field Reports v2 (the paper): deploy runbook

Written 2026-10-18. For cc to run at deploy time. Nothing here is run by a build agent. Spec: `2026-10-18-field-reports-v2-paper-spec.md`. Block: 0706 (0705 went to origin/codex/segundo-line-20261018 at 11:40 the same morning).

## 1. What shipped, and what is off until mail exists

- `/morning.xml`: the Morning Edition as RSS, frozen editions only, 30 at most. Live on deploy.
- `/morning` signup: addresses are kept as pending with a double opt-in. Live on deploy. No mail leaves until a sender exists.
- Slot 2 (courts): after a morning with no court reports it prints today's sourced sessions, the NWS wind and temperature, and sunset. After reports it prints yesterday's busiest court. House phones never decide it.
- `/r/how` and `/api/air/killtest`: how Field Reports counts, with the live kill-test number (10 on-site reports from 3 people, Sep 28 to Oct 23). Agents and house phones never count.
- `/r/me` house-phone marking, and the receipt link `Get tomorrow's paper`.
- Court data refresh: `/courts.json` and `/pickleball` carry sourced hours and fees (`hours_source`).
- `workers/morning-daily`: sends confirmations and the daily edition in LA hour 6 (crons `45 13 * * *` and `45 14 * * *`).
- Publish layer: block 0706, a front-door news line (kept out of the paper's town slot with `edition: false`), a New today entry, `/morning.xml` in the discovery sitemap.

Off until a mail sender exists: every email. Confirmations wait as pending rows; the Worker reports `configured: false` with the plain reason. Nothing is sent to anyone who has not confirmed.

## 2. Deploy order

1. Re-check the migration number. `git fetch origin`, then for fresh `origin/main` and every `origin/*` run `git ls-tree --name-only <ref> migrations/auth/` and confirm `0031_field_reports_paper.sql` is still the next free number. If not, renumber the file and every reference before going on.
2. Re-check the block id the same way for `src/content/blocks/` (0706 was free on 2026-10-18 at 12:20; 0705 is taken by `origin/codex/segundo-line-20261018`).
3. Apply the migration:
   `npx wrangler d1 execute pointcast-auth --remote --file migrations/auth/0031_field_reports_paper.sql`
   Confirm: `npx wrangler d1 execute pointcast-auth --remote --command "SELECT name FROM sqlite_master WHERE name IN ('air_house','edition_subscribers','morning_daily_runs')"` returns the three names.
4. Deploy the Worker: `cd workers/morning-daily && npx wrangler deploy`. Set its secret `MORNING_INTERNAL_KEY` to a fresh random value (`npx wrangler secret put MORNING_INTERNAL_KEY`; generate the value, do not print it). Check the Worker's `/status`: it must read `configured: false` with reason `send-email-not-onboarded` (SEND_EMAIL is bound, no Resend key yet). `POST /run` defaults to a dry run; a dry run never replaces a real run's row.
5. Merge the PR, then run `scripts/deploy.sh` (see `docs/OPERATIONS.md`, section 3). It builds, gates and smoke-tests prod.
6. Optional follow-up PR: uncomment the `MORNING_DAILY` stanza in `wrangler.toml`, set the Pages secret `MORNING_INTERNAL_KEY` to the same value as the Worker's, merge and deploy. After that a signup gets its confirmation at once instead of at the next 13:45 or 14:45 UTC tick.

## 3. Smoke list

- `/morning.xml`: valid RSS, each item links with `?src=rss`.
- `/morning`: a test signup answers `on-list`. Delete the test row afterwards.
- `/api/morning/unsubscribe?t=<bad token>`: the 400 page.
- `/r/how`: the count line shows, with the window and the Oct 24 read date.
- `/api/air/killtest`: numbers only, no handles, no times.
- `/courts.json`: courts carry `hours_source`.
- `/pickleball`: passes the Rich Results Test.
- A fresh receipt at any `/r/<spot>` shows `Get tomorrow's paper`.
- `/sitemap-discovery.xml` lists `/morning.xml`; `/r/how` is on `sitemap-0.xml`, not here.
- Home: the New today strip shows `The paper: RSS and signup`; block `/b/0706` renders.

## 4. The one thing that needs Mike: a mail sender

Pick one:

- (a) A Resend account with `pointcast.xyz` verified. Its DNS records go in at Namecheap. Its API key becomes the Worker's secret `RESEND_API_KEY`.
- (b) Move `pointcast.xyz` DNS to Cloudflare and onboard Email Sending. Then set `MORNING_SEND_EMAIL_READY = "true"` in `workers/morning-daily/wrangler.toml` and redeploy the Worker.

After either, the next tick sends every waiting confirmation. Nothing else changes.

## 5. Optional, only Mike can do it

On each of his phones, signed in, open `/r/me` and tap `This is a house phone`. Until then a phone of his counts like anyone's.

## 6. Sat Oct 24

Read `/r/how` (or `/api/air/killtest`). The window closed Fri Oct 23. If the test did not pass, the game layer freezes as the page says; nothing to deploy.

## 7. Rollback

- Pages: `scripts/deploy.sh` refuses to deploy an older sha (rollback pins stop at the ancestry check). Revert the merge on `main` with a PR, merge it, run `scripts/deploy.sh`.
- Worker: `cd workers/morning-daily && npx wrangler rollback`.
- Migration: the tables can stay. Nothing in the old code reads them.
