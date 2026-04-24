# Manus · Gamgee RC0 Post-Deploy Live QA

Filed: 2026-04-23
Owner: Manus
Coordinator: Claude Code (cc)
Fire when: After `v1.0-gamgee-rc0` is tagged and deployed to production at
`pointcast.xyz` (Mike will confirm in this task's Manus thread).

## Goal

Verify the live Gamgee RC0 release matches the staging experience captured in
the earlier front-door QA (`docs/manus-logs/2026-04-23-gamgee-front-door-qa.md`).
Catch any production-specific drift before we call RC0 shipped.

## Task

1. Open `https://pointcast.xyz/` on both **desktop** and **mobile viewport**. Capture
   first-viewport + one scroll-depth screenshot per device. Confirm the new
   Gamgee RC0 front-door strip renders at the top and reads as a clear "what
   PointCast is" module.
2. Open `https://pointcast.xyz/gamgee` on desktop + mobile. Capture first
   viewport per device. Verify:
   - Three-audience grid (Humans / Agents / Builders) renders correctly
   - Mobile collapses to single column under ~760px
   - All outbound links resolve (footer: release doc, inventory, sprint, github)
3. Smoke-check the canonical agent surfaces — all should return 200 and match
   the schema exposed in `/agents.json`:
   - `https://pointcast.xyz/for-agents`
   - `https://pointcast.xyz/agents.json`
   - `https://pointcast.xyz/llms.txt`
   - `https://pointcast.xyz/llms-full.txt`
   - `https://pointcast.xyz/feed.json`
   - `https://pointcast.xyz/feed.xml`
4. Spot-check that the most recent block (whatever 04XX-series announces the
   Gamgee RC0 release) appears on the homepage feed, reachable via
   `/b/{id}` and `/b/{id}.json`.
5. Light header + performance check: page-weight for `/` and `/gamgee` on desktop
   — note if either is dramatically larger than the staging versions.

## Deliverable

Create `docs/manus-logs/2026-04-24-gamgee-rc0-live-qa.md` (or comment the
equivalent back to this task so Codex/Claude can commit it). Use this shape:

```md
# Manus log · Gamgee RC0 live QA · 2026-04-24

## Result

Pass / Partial / Fail

## Screenshots

- desktop-home-viewport1.webp
- mobile-home-viewport1.png
- desktop-gamgee-viewport1.webp
- mobile-gamgee-viewport1.png
- for-agents-desktop.webp
- agents-json-desktop.webp

(Attach to the Manus task, reference by filename here.)

## Findings

(Anything different from the staging QA. Any 5xx/4xx. Any layout drift on mobile.)

## Suggested follow-ups

(Small items for a post-RC0 tidy PR, if any.)
```

## Constraints

- Do not publish, merge, post publicly, or change account permissions.
- Do not enter secrets.
- Do not attempt to fix issues you find — flag them in the findings section
  for Codex or Claude to pick up.
- This is post-deploy QA; the deploy itself is Claude + Mike's responsibility.

## Reference

- Staging QA log: `docs/manus-logs/2026-04-23-gamgee-front-door-qa.md`
- Release doc: `docs/releases/gamgee.md`
- Release inventory: `docs/releases/gamgee-inventory.md`
- Sprint checklist: `docs/sprints/2026-04-23-gamgee-rc0.md`

## Dispatch command (do not run until Mike confirms deploy is live)

```sh
npm run manus:create -- \
  --title "PointCast Gamgee RC0 post-deploy live QA" \
  --file docs/briefs/2026-04-23-manus-gamgee-rc0-live-qa.md
```
