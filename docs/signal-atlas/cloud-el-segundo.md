# El Segundo cloud publishing audit

Read-only audit, 2026-11-01 17:16 UTC. Source was fetched through the connected
GitHub account, pinned to current `main`
`e8d7ba59561d8a5335078bb81d81c90189063b68`; a final branch read confirmed it had
not changed. No Mac checkout was used as evidence. No workflow was dispatched,
PR changed, post sent, secret value requested, deployment started or setting
changed.

## Finding

The core El Segundo build and publishing path is already cloud-based: GitHub
Actions runs on Ubuntu and the existing Netlify Git integration builds the site.
It does not require a Mac runner. However, automatic shipping does not enforce
desk overlap, and its live verifier misclassifies valid CSS/PNG responses as
failed pages. The current commit was observed in the live publish stamp by an
Actions job, but that job failed its asset checks. A green build, a merged PR and
a completed workflow are not interchangeable with a complete live receipt.

## Current build and project mapping

- [netlify.toml](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/netlify.toml)
  declares `bun run build`, output `dist`, Node 22, Bun 1.4.4, and esbuild-bundled
  functions under `netlify/functions`. It does not declare a project UUID.
- [package.json](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/package.json)
  calls `scripts/build.mjs`. With `SITE_CITY` absent or `el-segundo`, that runs the
  edition/resource/event/OG generators, Vite, analytics/SEO/disclaimer injection
  and `scripts/publish/stamp.mjs`. The stamp takes `COMMIT_REF`, then `GITHUB_SHA`,
  otherwise `local`. The PR gate has a confirmed successful Linux build.
- [Build selection](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/scripts/build.mjs)
  sends other `SITE_CITY` values to the sister-site shell. This codebase is shared;
  do not assume one source merge affects only one deployed town. Sister sites are
  described as separate Netlify projects/stores, with draft/planned entries in the
  [registry](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/cities/registry.json).
- The committed [Netlify recovery record](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/docs/netlify-recovery-receipt.json)
  identifies project slug `elsegundo`, team `mhoydich`, and
  `https://app.netlify.com/projects/elsegundo/overview`. It is dated October 6,
  explicitly says the internal UUID was not read, and records a prepared release
  as **not published**. Its old deployment ID is historical evidence, not proof
  that a rollback is still retained today.
- No inspected workflow uses a Netlify CLI or Netlify credential. GitHub source
  does not establish current Netlify account access, build-hook configuration,
  environment values, domain mapping, retained rollback IDs or deploy settings.
  Those remain a separate authenticated read-only confirmation before rollout.
- The [Netlify ignore script](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/scripts/publish/netlify-ignore.sh)
  skips only a change consisting entirely of `PUBLISH_LOG.md`.

## Workflows and declared scopes

All nine checked workflow definitions use `ubuntu-latest`; none uses a Mac or
self-hosted runner. Permissions below are declarations, not proof of deployed
secret availability or additional service permissions.

| Workflow | Trigger and gate | Declared GitHub permissions | Result boundary |
| --- | --- | --- | --- |
| [publish-gate](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/publish-gate.yml) | PR to main | contents read | Bun frozen install/build, feeds, changed links and copy guard; does not run the full `npm test` suite |
| [publish-ship](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/publish-ship.yml) | PR opened/synchronized/reopened/labeled/ready; skips drafts | contents write, PR write, checks read, actions read | Can squash-merge; inline live verification follows |
| [publish-verify](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/publish-verify.yml) | Push to main, except publish-log message | contents write, PR write | Waits for commit stamp; checks URLs; writes log; on failure attempts a revert PR and immediate squash merge |
| [desk-overlap](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/desk-overlap.yml) | PR changes, main push, dispatch | contents read, PR read, statuses write | Publishes overlap status; never deploys |
| [daily-edition](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/daily-edition.yml) | 13:00 and 14:00 UTC daily; dispatch defaults dry-run; schedule gated by `EDITION_AUTOPILOT=pr/publish` | contents write, PR write | Can create PR or push edition/report to main; email has separate conditional switch |
| [morning-desk](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/morning-desk.yml) | 12:30 and 13:30 UTC daily; dispatch; schedule gated by `MORNING_DESK=pr` | contents write, PR write | Research and X drafts/artifacts/PR only |
| [places-refresh](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/places-refresh.yml) | Monday 14:17 UTC or dispatch | contents write, PR write | Fetches OSM/source links and opens a draft PR; no direct deploy |
| [ai-check](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/ai-check.yml) | Manual only; monthly schedule is commented out | contents write, PR write | Provider-backed reports/draft PR; no business send |
| [ai-offers-check](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/.github/workflows/ai-offers-check.yml) | Monday 13:15/14:15 UTC; dispatch defaults dry-run; schedule gated by `AI_OFFERS_CHECK=pr` | contents write, PR write | Artifact or draft research PR, no price rewrite/publish |

Credential **names only** referenced by these workflows are `GH_TOKEN` supplied
from `github.token`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `RESEARCH_REVIEW_TOKEN`,
`EMAIL_API_KEY`, `PERPLEXITY_API_KEY` and `OPENAI_API_KEY`. Switch/config names
include `EDITION_AUTOPILOT`, `EDITION_EMAIL`, `EMAIL_PROVIDER`, `EMAIL_FROM`,
`EMAIL_POSTAL_ADDRESS`, `MORNING_DESK`, `AI_OFFERS_CHECK` and
`AI_CHECK_OPENAI_MODEL`. Their presence, values and service scopes were not read.

## Actual receipts and conditional outcomes

| Evidence | What it establishes |
| --- | --- |
| [PR #117 gate run 41329053073](https://github.com/mhoydich/hello-token-reserve/actions/runs/41329053073) | Build, feed validation, links and guard passed on Ubuntu for PR head `2918f4641882856129f925371c6f28d3de46e9fc` |
| [Ship run 41329053062, job 124915088745](https://github.com/mhoydich/hello-token-reserve/actions/runs/41329053062/job/124915088745) | Logged auto-merge command success for #117, then `live commit e8d7ba59561d8a5335078bb81d81c90189063b68` at 17:00:16 UTC. Job failed on two PNG assets and CSS, all HTTP 200. This is a live-stamp observation with a failed full verifier, not a clean release receipt |
| [Ship run 41328000476, job 124911913303](https://github.com/mhoydich/hello-token-reserve/actions/runs/41328000476/job/124911913303) | PR #116 logged live commit `d846bb1226c0617438d3a9ac5742540e65ad1cf0`, then verified six URLs at 16:47 UTC; job succeeded |
| [Push verify 41323993776, job 124899982984](https://github.com/mhoydich/hello-token-reserve/actions/runs/41323993776/job/124899982984) | Verified commit `78e60e4aa33af684f985324b126b6fb253e9fc07` and four URLs; publish-record step succeeded; auto-revert step skipped |
| [PUBLISH_LOG.md](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/PUBLISH_LOG.md) | Contains only that `78e60e4` live receipt, at 08:01 PT; it is not a complete ledger of later inline ship runs |
| [Ship run 41330163465](https://github.com/mhoydich/hello-token-reserve/actions/runs/41330163465) | Job skipped with no runner and no steps; not a deployment |
| [Daily edition 41229000369](https://github.com/mhoydich/hello-token-reserve/actions/runs/41229000369) and [Morning desk 41226666327](https://github.com/mhoydich/hello-token-reserve/actions/runs/41226666327) | October 31 scheduled runs skipped; no generation, publishing, newsletter or X receipt follows from them |

The complete 55-run `branch=main` response contained skipped edition/desk
scheduled runs and no successful edition/email run. The latest 100 repository
runs were also examined. These bounded responses do not prove that no historical
delivery ever occurred. Current main's combined status response had no statuses,
and its check-run list was empty; the inline PR-head ship job is the relevant
evidence for the current merged SHA.

## Shipping and rollback gaps

The current [ship implementation](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/scripts/publish/ship.mjs)
accepts non-draft `cursor/*`, `codex/*`, `claude/*` branches or a `ship` label.
`hold` or a `Publish: hold` body line stops initial eligibility. It checks only a
check-run named `publish-gate`, not `desk/overlap`, before requesting squash merge.
Eligibility is checked initially rather than again immediately before merging.
Opening a ready PR or marking one ready is therefore a publishing action in this
repository, not a neutral review handoff.

Current repository metadata reports `allow_auto_merge: false`; the branch
response reports main unprotected with no required status checks. The job's
"auto-merge armed" message is the script's label for a successful CLI command,
not proof that protected-branch queueing occurred. The implementation also has an
explicit immediate squash-merge fallback.

The [verifier](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/scripts/publish/verify.mjs)
maps all changed `public/` files into URLs. Except XML/MD/TXT/JSON, every response
must contain an HTML `<title>`. Thus valid `/value/ads/worth-square.png`,
`/value/ads/worth-story.png` and `/value/value.css` responses caused #117's false
failure. It also accepts commit-prefix matching rather than exact full-SHA
equality. These checks should be repaired before relying on failures for rollback.

The token-merge path invokes that verifier inline and only exits on failure. It
does not write the publish log or open a revert. The separate main-push workflow
does both, but the source explicitly notes that a `GITHUB_TOKEN` merge does not
start that workflow. In the separate failure path, `git revert` is not prepared
for a merge commit needing a mainline argument; it also attempts immediate
squash merge of the revert rather than waiting for the ordinary gate.

Minimum remedy proposal, not an executed change:

1. Keep new work draft/held until explicit release authority and a concrete
   preview exist. Recheck hold/draft, exact head SHA, publish gate and desk overlap
   at the final merge boundary. Serialize publishers across both entry paths.
2. Use one shared post-merge verifier/receipt/rollback routine for inline shipping
   and main pushes. Validate expected asset types separately from HTML and require
   the intended full commit stamp. Record checked URLs, timestamp and deployment
   identity. A failed check must distinguish stale deployment from invalid content
   and verifier error.
3. Confirm the existing Netlify project UUID, repo/main link, build settings,
   current deployment and a retained known-good deployment through authenticated
   read-only access. Use existing Git integration; no new Netlify token is shown
   to be necessary by this audit.
4. Define owner-authorized rollback to that retained deploy, or a reviewed source
   revert that goes through the same checks. Handle merge commits and confirm the
   rollback's live stamp/routes. Do not assume the October historical deploy is
   available or that merely opening a revert restored production.

## Newsletter, feeds and X handoff

- [Newsletter API](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/netlify/functions/newsletter.mjs)
  captures contacts as `captured_unverified` and says no email was sent. It does
  not automatically forward signups into Buttondown. Owner reads/deletes use
  `RESEARCH_REVIEW_TOKEN`, distinct from `RESEARCH_INGEST_TOKEN`.
- [Edition sender](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/scripts/edition/send.mjs)
  renders previews by default. With `--deliver` and configured Buttondown settings,
  `draft` creates a provider draft; `send` requests `about_to_send` only in publish
  mode. Source configuration is not proof of an authenticated provider connection
  or delivery. The workflow invokes email after pushing source, without waiting
  for live URL verification despite its comment. Returned provider ID/URL is not
  durably recorded by the CLI. The committed [sample email JSON](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/content/edition-samples/2026-10-29/email/email.json)
  is a preview, not a send receipt. Minimum future handoff: verified live edition,
  approved exact email/audience, confirmed provider, idempotency and durable
  provider receipt before claiming dispatch; recipient delivery is a further state.
- [News/topic feeds](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/netlify/functions/today-live.mjs)
  and carousel feeds are implemented read surfaces. Feed validation does not
  distribute posts. The [channel manifest](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/public/channels.json)
  says the edition itself has no feed yet. A fresh feed item/URL is its own
  publication evidence; subscriber delivery or participation is not implied.
- [Morning Desk](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/scripts/edition/desk.mjs)
  writes X drafts and optionally a PR. It contains no X publishing transport.
  The [social kit](https://github.com/mhoydich/hello-token-reserve/blob/e8d7ba59561d8a5335078bb81d81c90189063b68/docs/maps/SOCIAL-KIT.md)
  is explicitly unposted draft copy. No X post receipt was found. Authenticated
  account identity, approval of exact content and an actual returned post URL/ID
  remain separate from these drafts; no new connection was made.
- Grok research receipts are `draft_only`, `published:false`. Feedback 202 means
  an upstream review run was accepted, not completed or published. Relevant
  credential/destination names are `GROK_FEEDBACK_WEBHOOK_KEY` and
  `GROK_FEEDBACK_WEBHOOK_URL`; neither value was requested or reproduced.

## Audit limits

Supplementary runtime evidence supplied by the parent after the GitHub audit:
a direct GET at 2026-11-01 17:18:38 UTC returned HTTP 200 from Netlify for
`https://elsegundo.xyz/publish.json`, commit
`e8d7ba59561d8a5335078bb81d81c90189063b68`, stamped
`2026-11-01T17:00:00.847Z`. The body SHA256 was
`c566b9abb9ba89a6fb93c9a4a66609faabcaba234d05f6ac2e5fa574f3654541`.
The parent saved its probe at `/tmp/signal-atlas-public-probes-network.json`.
This corroborates the current deployment stamp; it does not turn the failed
asset verifier into a passing end-to-end receipt.

A separately authorized local-only patch now exists under
`/tmp/el-segundo-verifier-20261101/`. It adds media-type/nonempty/HTML-fallback
smoke checks for known static assets and regression tests while retaining HTML,
XML/JSON and commit-prefix behavior. It does not change any workflow or deploy
the fix. Wider false rollback risks remain: the push workflow uses broad
`failure()` (including non-verification failures); deleted files and nonpublic
Netlify control files can enter URL checks; and it has no publisher concurrency
or stale-main guard. These are proposal-only follow-ups outside the narrow fix.

The original audit used GitHub read tools and source/Actions evidence. Workflow-specific
`actions/workflows/.../runs` URLs were rejected by the connector's endpoint
allowlist; the supported repository run collection and explicit run/job resources
supplied the evidence instead. No protected settings or secret APIs were queried.
No current Netlify account/configuration API was available in this audit. Optional
authoring/rendering tools outside the inspected build path were not exhaustively
audited for workstation dependencies. This report is a proposal and evidence
record, not permission to change release, security, access or spending settings.
