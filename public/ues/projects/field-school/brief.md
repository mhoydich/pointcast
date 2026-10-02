# Field School — Small practice. Close observation.

UES-P01 · University of El Segundo · Proposed build brief · 2 October 2026

A proposed deck of short, self-guided field practices that helps a learner begin an existing UES class with one useful observation.

## Question

What can one careful hour teach us about a place we thought we knew?

## Why this project is distinct

Existing UES courses already contain fieldwork and six-module syllabuses. This project adds a small practice-card companion; it does not create another course catalog, pathway map, or project brief generator.

## Keepable outcome

A private, downloadable observation card with a source note, uncertainty, access alternative, and a link back to the relevant existing class.

## Scope

- Six authored practice cards: light at one window; an accessible threshold; a public sign; a sound described in words; an object and its history; and one observation checked against a public source.
- Each card offers a 20-minute and a 60-minute version, a seated/indoor/remote equivalent, materials already at hand, a small task, an example marked synthetic, and a concrete self-check.
- Filter by available time and observation mode. Read the full practice before deciding to begin; no account, location permission, camera, or public posting.
- Save notes only in the learner’s browser with an explicit save action. Export Markdown or JSON, preview what is included, and reset only this tool’s data.
- Associate cards with existing public course IDs and routes from ues-classes.ts. Keep source lessons and completion standards untouched.

## Example

SYNTHETIC PRACTICE EXAMPLE · NOT A FIELD RESULT

Practice card · read one threshold: Choose a doorway you can observe without entering private property. Record the step, sign, light and ease of approach. Separate what you saw from what you inferred. Indoor alternative: examine a public photograph and name the limits of that evidence.

## Acceptance criteria

- All six practices have a timebox, source route, access alternative, uncertainty prompt and checkable output.
- Every linked course ID resolves through the existing catalog; no course route or completion receipt is replaced.
- Notes stay local; network inspection shows no note, location or identity transmission.
- Blocked storage and offline use degrade safely; export is readable and matches the preview.
- Keyboard interaction, visible focus, text resizing, 390px layout and print output are verified.

## Deliverables

- Six practice cards and scoped source
- Storage, export and catalog-link checks
- Desktop/mobile/print evidence
- Review notes and a draft PR

## Non-goals

No field trip booking, attendance tracking, participant collection, geolocation, completion certification or replacement curriculum.

## Existing resources

- [Marine Layer · UES-201](https://pointcast.xyz/ues/marine-layer-weather-light-daily-seeing)
- [The 25-Mile Atlas · UES-202](https://pointcast.xyz/ues/the-25-mile-atlas)
- [Existing class catalog](https://pointcast.xyz/ues)

## Suggested implementation scope

Branch: claude/ues-field-school. Files: src/pages/ues/field-school.astro and scoped practice data/client helpers; final paths chosen after repository review.

## Build and release rules

Read current AGENTS.md, CLAUDE.md, BLOCKS.md, TASKS.md, docs/OPERATIONS.md, docs/setup/agent-bridge.md, docs/inbox/ and relevant local skills. Canonical source: https://github.com/mhoydich/pointcast. Work in an isolated scoped worktree off fresh origin/main under the home directory; never edit ~/pointcast or the shared deploy checkout.

Preserve the ten existing UES course routes, current progress/completion semantics, funding surface, art archive, RADIUS instrument and other agents’ work. The separate IndustryNext Nouns Brief Studio, Learning Atlas and Studio Showcase remain separate assignments.

Use the existing BlockLayout for metadata and self-hosted fonts; keep new tools isolated from analytics, advertising, presence and wallet/session bridges. Design with ocean blue, cobalt, indigo, pale blue and white, architectural grids and strong readable type. No purchase, credential change, paid model API or replacement identity is required. If Nouns are used, render authentic CC0 assets with exact geometry and source provenance.

These are proposed builds. Existing self-paced classes remain available under their current terms. New applications, admissions, recruiting, real participant collection and public submissions stay closed. Do not claim accredited status, institutional partnerships or learner completion without evidence.

Deliver scoped source, meaningful focused tests, a build:bare result, desktop/mobile/print screenshots, a source self-review and draft PR. Run audit:agents for new agent-readable endpoints and audit:publishing before proposing publication. Return actual changed files, branch/base SHA, checks and limitations. No main push or broad shared navigation/homepage overwrite. Implementation release requires review and coordination; scripts/deploy.sh is the only production path after an approved merge. The current publication authorization covers these public project briefs, not a premature release of an unfinished tool.
