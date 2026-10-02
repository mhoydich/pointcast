Recipient: Claude Code
Sender: Codex, at Michael Hoydich’s explicit request
Status: queued handoff; acceptance/start unconfirmed

Michael requested three University of El Segundo projects for Claude Code and authorized publishing their public-safe briefs to PointCast. This file queues one implementation assignment through the documented repository inbox. Do not treat the published brief as an implemented tool. Read this assignment and acknowledge with a session log or draft PR before claiming it started. Check for duplicate or active work first.

# Exhibition Hall — Make the work ready to be seen.

UES-P03 · University of El Segundo · Proposed build brief · 2 October 2026

A proposed preparation room that helps a learner package completed work with its context, access notes, rights and limitations before deciding whether to share it.

## Question

What must travel with an artifact so another person can understand it fairly?

## Why this project is distinct

The El Segundo School already has a 652-work art archive, and the proposed IndustryNext Studio Showcase is scoped to presenting verified projects. This project prepares a private exhibition packet; it does not create a competing gallery or claim a collection of completed student work.

## Keepable outcome

A portable, private exhibition packet: a wall label, an accessible text companion, a rights/source ledger and a release-readiness checklist.

## Scope

- Three clearly labeled synthetic finished-artifact fixtures: a weather plate, a civic poster study and an object archive record. No invented student, class completion or institutional endorsement.
- Choose a fixture or describe a learner-owned artifact in local-only text fields. No upload endpoint, media ingestion, personal contact field or submission service.
- Guide the learner through title, context, process, source, uncertainty, text equivalent and rights choice. Keep public release and CC0 licensing optional and separate.
- Preview a wall label, linear accessible companion and print packet. Compare private and public versions; require a deliberate local export rather than auto-publishing.
- Export Markdown, structured JSON and a print-friendly HTML view with the selected artifact description. The packet must distinguish a self-attested learning outcome from verified completion or accreditation.

## Example

SYNTHETIC EXHIBITION FIXTURE · NOT STUDENT WORK

Wall-label study · six moments of sky: Example artifact: a six-panel weather plate. Context: one repeated viewpoint. Method: observations plus a time-matched public source. Limitation: a single viewpoint cannot describe the whole coast. Rights: synthetic fixture for rehearsal.

## Acceptance criteria

- All fixtures are labeled synthetic wherever displayed or exported; no public exhibition or completed learner cohort is implied.
- Wall labels carry source/context, rights choice, text equivalent and limitations; fields safely render HTML-like input.
- Private notes can be excluded from the public-ready packet, and the preview shows exactly what will export.
- No file upload, contact collection, automatic publication, wallet, mint or licensing gate is added.
- Exports round-trip without losing provenance; print and 390px layouts remain readable, with keyboard-only use verified.

## Deliverables

- Three fixtures and packet schema
- Input, redaction, export and provenance checks
- Desktop/mobile/print packet evidence
- Review notes and a draft PR

## Non-goals

No new public portfolio, student attribution, automatic uploads, public moderation queue, course credential, rights transfer or minted edition.

## Existing resources

- [Living Archive · UES-204](https://pointcast.xyz/ues/living-archive)
- [El Segundo School · existing art archive](https://pointcast.xyz/el-segundo-school)
- [Existing UES classes](https://pointcast.xyz/ues)

## Suggested implementation scope

Branch: claude/ues-exhibition-hall. Files: src/pages/ues/exhibition-hall.astro and scoped fixture/packet helpers; final paths chosen after repository review.

## Build and release rules

Read current AGENTS.md, CLAUDE.md, BLOCKS.md, TASKS.md, docs/OPERATIONS.md, docs/setup/agent-bridge.md, docs/inbox/ and relevant local skills. Canonical source: https://github.com/mhoydich/pointcast. Work in an isolated scoped worktree off fresh origin/main under the home directory; never edit ~/pointcast or the shared deploy checkout.

Preserve the ten existing UES course routes, current progress/completion semantics, funding surface, art archive, RADIUS instrument and other agents’ work. The separate IndustryNext Nouns Brief Studio, Learning Atlas and Studio Showcase remain separate assignments.

Use the existing BlockLayout for metadata and self-hosted fonts; keep new tools isolated from analytics, advertising, presence and wallet/session bridges. Design with ocean blue, cobalt, indigo, pale blue and white, architectural grids and strong readable type. No purchase, credential change, paid model API or replacement identity is required. If Nouns are used, render authentic CC0 assets with exact geometry and source provenance.

These are proposed builds. Existing self-paced classes remain available under their current terms. New applications, admissions, recruiting, real participant collection and public submissions stay closed. Do not claim accredited status, institutional partnerships or learner completion without evidence.

Deliver scoped source, meaningful focused tests, a build:bare result, desktop/mobile/print screenshots, a source self-review and draft PR. Run audit:agents for new agent-readable endpoints and audit:publishing before proposing publication. Return actual changed files, branch/base SHA, checks and limitations. No main push or broad shared navigation/homepage overwrite. Implementation release requires review and coordination; scripts/deploy.sh is the only production path after an approved merge. The current publication authorization covers these public project briefs, not a premature release of an unfinished tool.
