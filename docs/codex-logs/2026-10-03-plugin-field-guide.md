# 2026-10-03 — Plugin best-practices field guide

Author: Codex. Source baseline: `2a3e35326beffc23884b8fcca1c045623fe6565b`. Branch: `codex/plugin-field-guide-20261003`.

Prepared an educational field guide for PointCast, University of El Segundo, and IndustryNext. It contains five capability explanations and fifteen application scenarios, verified official sources, current public/source evidence, explicit implemented/analogy/proposed labels, original illustrative schemas, and three bounded first-pilot recommendations. It preserves UES private local progress and keeps hosting, plugin registration, and event subscription as separate implementation decisions.

Deliverables:

- `/ues/plugin-field-guide` — isolated, noindex reading page with local brand filter.
- `/ues/plugin-field-guide.md` and `/ues/plugin-field-guide.json` — companion exports.
- `docs/field-guides/2026-10-03-plugin-field-guide.md` — generated readable repository companion.
- Standalone HTML saved in Library as `PointCast-UES-IndustryNext-Plugin-Field-Guide.html`. Final SHA-256: `08259d3bac722828a6ad051cf8673cf1bbb809be48f3f484d0259de8429b28ff`.
- `docs/reviews/2026-10-03-plugin-field-guide-review.md` — source/probe evidence, independent review, checks and limits.

Validation: four focused tests passed, full `build:bare` passed, final Astro page compiled without diagnostics, desktop/mobile browser checks and script-free fallback passed, companion exports matched source. The review report explicitly records the full-build snapshot boundary relative to later prose-only changes.

A pre-existing PointCast MCP annotation/handler mismatch was recorded for a separate follow-up. The guide recommends a reviewed public-read allowlist rather than inheriting the full catalog. Native Extensions/MCP Events were not verified as implemented. Sites MCP hosting and actual account eligibility remain unverified.

No hub/navigation changes, live integrations, installs, subscriptions, private connections, credentials, publication, merge or deployment. The dirty wallet/auth checkout at `~/pointcast` was preserved; work used a separate HOME worktree. Editorial/X review, MH publication approval, and the parent release lane are still required. Task worktree/build/dependency copies are removed after the branch is preserved remotely.
