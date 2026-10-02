Recipient: Claude Code
Sender: Codex, at Michael Hoydich’s explicit request
Status: queued handoff; acceptance/start unconfirmed

Michael requested three University of El Segundo projects for Claude Code and authorized publishing their public-safe briefs to PointCast. This file queues one implementation assignment through the documented repository inbox. Do not treat the published brief as an implemented tool. Read this assignment and acknowledge with a session log or draft PR before claiming it started. Check for duplicate or active work first.

# Studio Exchange — Rehearse a collaboration before inviting one.

UES-P02 · University of El Segundo · Proposed build brief · 2 October 2026

A proposed private role-planning bench where a learner can explore how complementary skills fit one shared task, using synthetic collaborators.

## Question

What does a useful collaboration need besides a list of people?

## Why this project is distinct

The proposed IndustryNext Brief Studio is scoped to generating project briefs. This project rehearses responsibilities and handoffs for an already-defined task. It does not generate briefs, run a live matching service, or build a contact directory.

## Keepable outcome

A local collaboration plan: roles, dependencies, review checkpoints, missing skills and a handoff checklist the learner can keep.

## Scope

- Three fixed, authored scenarios linked to existing UES work: a sourced weather card, a three-format public-image kit, and an accessible archive record.
- Select skills you can contribute and skills the task needs. Match against six explicitly synthetic role cards, never real people or claimed available volunteers.
- A transparent deterministic rule explains each suggested role combination. Show skill gaps instead of implying a team exists.
- Let the learner arrange responsibilities across observing, sourcing, making, reviewing and packaging. Every handoff names its input, output and review owner as a role.
- Export a private role plan and readiness checklist. No server roster, messaging, contact details, applications, booking, recruitment or promises of collaboration.

## Example

SYNTHETIC ROLE SCENARIO · NO REAL MATCHES

Role rehearsal · weather card: Observer records conditions. Source checker compares a time-matched public record. Maker builds the card. Access reviewer checks the text equivalent. One learner may perform every role; a missing role stays visible.

## Acceptance criteria

- Every collaborator card is labeled synthetic in the card, detail view and exported plan.
- Identical selected skills and scenario version produce the same suggestions with an understandable explanation.
- Missing and incompatible skills have useful empty states; resetting restores the initial bench.
- No names, email, location, profile URLs, messages or personal contact fields are requested or transmitted.
- Keyboard role assignment and a linear mobile alternative expose the same plan without drag-only controls.

## Deliverables

- Three scenarios and six synthetic role cards
- Deterministic matching and export checks
- Keyboard/mobile evidence and privacy trace
- Review notes and a draft PR

## Non-goals

No live skill marketplace, public profiles, intern attribution, applicant intake, external messages, social matching, sign-in or paid model API.

## Existing resources

- [Collective Intelligence Studio · UES-205](https://pointcast.xyz/ues/collective-intelligence-studio)
- [Public Image Office · UES-203](https://pointcast.xyz/ues/public-image-office)
- [Living Archive · UES-204](https://pointcast.xyz/ues/living-archive)

## Suggested implementation scope

Branch: claude/ues-studio-exchange. Files: src/pages/ues/studio-exchange.astro and scoped scenario/matching helpers; final paths chosen after repository review.

## Build and release rules

Read current AGENTS.md, CLAUDE.md, BLOCKS.md, TASKS.md, docs/OPERATIONS.md, docs/setup/agent-bridge.md, docs/inbox/ and relevant local skills. Canonical source: https://github.com/mhoydich/pointcast. Work in an isolated scoped worktree off fresh origin/main under the home directory; never edit ~/pointcast or the shared deploy checkout.

Preserve the ten existing UES course routes, current progress/completion semantics, funding surface, art archive, RADIUS instrument and other agents’ work. The separate IndustryNext Nouns Brief Studio, Learning Atlas and Studio Showcase remain separate assignments.

Use the existing BlockLayout for metadata and self-hosted fonts; keep new tools isolated from analytics, advertising, presence and wallet/session bridges. Design with ocean blue, cobalt, indigo, pale blue and white, architectural grids and strong readable type. No purchase, credential change, paid model API or replacement identity is required. If Nouns are used, render authentic CC0 assets with exact geometry and source provenance.

These are proposed builds. Existing self-paced classes remain available under their current terms. New applications, admissions, recruiting, real participant collection and public submissions stay closed. Do not claim accredited status, institutional partnerships or learner completion without evidence.

Deliver scoped source, meaningful focused tests, a build:bare result, desktop/mobile/print screenshots, a source self-review and draft PR. Run audit:agents for new agent-readable endpoints and audit:publishing before proposing publication. Return actual changed files, branch/base SHA, checks and limitations. No main push or broad shared navigation/homepage overwrite. Implementation release requires review and coordination; scripts/deploy.sh is the only production path after an approved merge. The current publication authorization covers these public project briefs, not a premature release of an unfinished tool.
