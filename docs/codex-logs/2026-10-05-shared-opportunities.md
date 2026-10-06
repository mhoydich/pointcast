# Shared opportunities — private review draft

Built against PointCast commit 87ae8af6 in isolated branch codex/shared-opportunities-20261005. No push, merge, deploy, new recruiting routes, application submissions or external outreach. The managed task permits edits in its workspace, so the isolated clone is inside task-2; it is a portable review artifact, not a release checkout. No full build ran during the UES release lane.

## Grounding

Read current AGENTS.md, docs/OPERATIONS.md, BLOCKS.md and TASKS.md. No .agents skill directory exists in this current checkout. Inspected /intern/index.astro, communications-lab.json, /worklife/open-to-work.astro, and the UES entry route. PointCast /worklife/open-to-work continues to be the browser-local profile board and is unchanged.

Read GitHub PR1304: open, draft, unmerged at a371e16276e7dae314fb6ae70255312b1c0c98c9. It contains 86 historical records (8 full, 2 partial, 76 incomplete). The draft catalog includes a summary of its availability state only. No historical source descriptions, recruiting URLs or private content were copied. Integration must reuse the archive after its own review; never relabel it current by default.

Latest parent recovery bundle materialized locally through Library, version 1, 15,829 bytes, SHA256 f6a5cbc13e728ce002f05afbe4935ee876f58898cd707e08804b2a11f06d87a4. Its three JSON files are readable. Counts now become 10 full, 2 partial and 74 title-only across 86 records; aliases mean records are not necessarily distinct roles. Only this metadata updates the draft; descriptions remain held outside the public artifact.

Read mhoydich/nouns5.4 public/market.json SHA 0f51224d43f3991b007f4ccbbcd3defe1f33966f and public/market/index.html SHA 4b267aed567a36fb2f2598022318a547d54b02c4. Source data timestamp is Aug 1 2026; parent reports Aug 2 source update. Four roles + four dependent briefs + two standalone tasks + one organization + three rails = 14 registry objects. The original source's `open_jobs` label is not used as current-availability verification. Live market/application page reads could not be completed through the web reader. Backend existence is parent-reported; delivery and applicants remain unverified. There is no application link in this draft.

## Data and behavior

public/opportunities/catalog.json is the only catalog; model.mjs parses URL state, selects records and prioritizes a site's own records when the network toggle is on. Board uses textContent for source strings. Query parameters support deep links, reload and back/forward. Search updates the current history entry; discrete filter and brand changes add entries. Unknown enum inputs normalize safely.

24 independent records: 4 role briefs with pay unconfirmed, 2 unpaid voluntary editorial field tasks, 12 proposed learning pathways from the existing Communications Lab and 6 proposed pantry participation scopes. Four first-task briefs remain inside their parent roles and are never counted as additional jobs. No verified current or confirmed paid roles exist. Historical-archive is an explicit empty state pointing to held history, not a hidden live-role count.

Each record carries stable ID, owner, relevant sites, project, work type, compensation kind/text, status, source URL/date, review date and separate current availability timestamp. Null means unknown. Reviewing a source is not availability verification. Three roles disclose AI operating credits, not salary; playlist role discloses $0 guaranteed cash and nonguaranteed possible revenue share. Separate work agreements remain required.

Communications Lab retains its program identity. The UES learning view is an editorial relevance mapping, not affiliation, admissions or academic credit. Pay/hours/eligibility/supervisor/location/agreements/legal review remain unresolved. Software, product, design and business families recovered by parent researchers are historical context only; no recruitment terms were inferred from them.

Existing profile cards, Lab pages, application flows and UES/RALLY pages are unchanged. Draft has no analytics, forms, wallet calls, application submission, JobPosting metadata or private links. noindex is a review signal, not access control. Never deploy this private review shell as a substitute for approval.

## Verification

Seven focused Node tests passed: exact counts and stable IDs; own-site/network ordering; status/pay/project/search/empty behavior; URL round trips; application approval gate; no private links/forms/JobPosting metadata. Both JS modules parse.

Chrome desktop: checked main/IndustryNext/intern tabs, role terms disclosure, paid-role empty state, project filter, network ordering, browser back and forward. Mobile at 390x844: page scrollWidth=clientWidth=390; checked intern view, RALLY empty state, shared network, search no result, reset and historical empty state. Native labeled inputs and disclosures, heading hierarchy, skip link, live counts and visible focus outline are present. No automated accessibility conformance claim. The screenshots and browser checks cover the initial 18-record draft; the six pantry additions have focused source/filter tests only. Browser refresh is held while the parent pauses previews/heavy jobs.

Publishing audit was invoked; its result is retained separately in review/audit-publishing.txt. It is not permission to publish. Full Astro production build, cross-host adapter installation and final release review remain for the serialized release lane.

## Decisions before launch

1. Which dated role briefs are still available? Named owner must approve each record and confirm compensation, scope, location, duration and work agreement.
2. Approve program identity and supervision, pay/hours/eligibility/location/agreements/legal review; decide whether it is learning, internship employment or another arrangement before recruitment.
3. Confirm accountable contact and privacy/retention process, test existing application delivery using authorized synthetic data, and approve application acceptance separately.
4. Review PR1304 archive text and integration; preserve historical dates/status and exclude private sources and applicant data.
5. Approve the PointCast mount and IndustryNext adapter/navigation patch; verify other external site ownership before any new mount.
6. Allocate serialized full-build/release slot and perform final source/privacy/content review. No public sharing is requested or performed by this work.

## Pantry coordination delta

Consumed six public-safe proposed scopes from the coffee/bread builder dated 2026-10-05. Preserved exact IDs/descriptions, source draft paths, not-open availability, null compensation/supervisor/hours and all six approval gaps. They use participation-proposal, not paid role, employment or an unpaid classification. PointCast owns them; UES sees learning-relevant participation; the intern program stays distinct with its twelve existing Lab pathways. /coffee/#team and /bread/#team are shown only as inactive local draft references because those pages are not integrated into this checkout. Applications remain disabled. No full build or new preview was started for this update.

## Publication authorization handoff

Parent relayed explicit user authorization to publish all today's website projects without another review. Removed private-review/noindex publication holds from the public shell and set catalog releaseState to publication-authorized. This does not confirm current opportunities or approve recruiting: all 24 original statuses/types/compensation gaps and disabled application intake remain. availableProjectRoutes defaults empty; serialized publisher must add /coffee/ and /bread/ only when those routes land in the same release, then regenerate IndustryNext adapter from this exact central catalog. Parent authorized direct handoff to publisher 01a10309-d270-708a-ab02-fa8301c0c016. No heavy build, browser, deployment, new Library bundle or other site edits occurred in this handoff. Earlier review-only statements above record prior state, superseded only for website publication.
