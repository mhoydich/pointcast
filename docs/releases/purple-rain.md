# Purple Rain — publisher handoff

Publication was approved through the parent on 4 October 2026 at 14:03 UTC, after final checks. The designated release publisher owns merge and deployment. This branch must not be independently merged into main or deployed from a feature worktree.

## Candidate

Branch: `codex/purple-rain-release-20261004`. Fresh-main base: `87ae8af677f0b8b61692d53b7d2de9d406b07ec5`.

Adds `/purple-rain/` and its `/purple-rain.json` twin: four linked Fashion, Energy, Results and Time lenses, an accessible filterable atlas and 15-event chronology. The atlas has 18 licensed/PD photos and scans, 3 labeled original illustrations and 6 outbound-only archive references. Each entry retains its creator, source, caption, date and rights record. The JSON contains all 23 research-source records and original-art generation provenance; original PNGs are preserved alongside smaller WebP deliveries.

All editorial content, captions, image files and provenance are identical to the prior reviewed draft. Release changes are limited to approved/indexable metadata, the corresponding test assertion, feature-specific CI/compiled auditing, and this handoff evidence. The publication field records approval; it does not claim that the feature is already deployed. Research remains dated 3 October 2026.

The factual-content SHA-256, excluding only top-level `status` and `publication`, is `6a9dc5d6295b714c1e259a6db8b704d233ec9c0ab5b8d7b7b879ce88927aef07`. Method: sorted-key JSON, Unicode preserved, separators `(',', ':')`.

## Review evidence

- Independent factual continuity: [fact-review.md](../research/purple-rain/fact-review.md), all 53 factual references resolve; dated units/territories and exact award categories remain intact.
- Independent rights continuity: [rights-review.md](../research/purple-rain/rights-review.md), 25 public asset/provenance hashes recorded, no residual major issue. The draft-metadata observation in that report was resolved by this release candidate.
- Independent UI and accessibility review: [ui-review.md](../research/purple-rain/ui-review.md), strict TypeScript and Astro diagnostics pass, no critical/major issue or route collision. CSS/client hashes are unchanged.
- [Browser report](../research/purple-rain/browser-report.json): nine groups pass against production-compiled scoped output: lens/type/search/reset, keyboard controls, dialog zoom/Escape/focus return, 1440/768/390/320 layouts, no external hotlinks or audiovisual embedding, complete JSON, noJS content, reduced motion, and no runtime errors.
- Focused Node tests: seven pass. `scripts/audit-purple-rain.mjs` verifies indexable compiled HTML, canonical URL, complete native JSON, all gallery/timeline entries and preserved licensed-image hashes.

## Publisher gates

The full all-routes build has not run locally: Three explorers owns the first heavy Mac build slot. `.github/workflows/purple-rain-check.yml` runs focused tests, strict TypeScript, `npm run build:bare` and the compiled audit remotely. It has no deployment step. Require a passing check on the exact reviewed head, or finish the full-site gate in the publisher's allocated lane before merging/deploying.

Deploy only through the existing publisher using `scripts/deploy.sh` from current origin/main, following `docs/OPERATIONS.md`. This feature does not change the shared home, discovery feeds, block schema, auth, package files or deployment workflow. Astro's existing automatic sitemap can include the indexable route.

After the authorized deployment, smoke-check `/purple-rain/`, `/purple-rain.json`, HTML index/canonical metadata, lens/search/reset, gallery dialog, the official outbound playback links and selected image/provenance files. Inspect the actual new deployment; do not infer production success from these local or CI results.

Desktop/mobile screenshots, the reviewed local draft archive and source inventory were saved privately to Library before release preparation. The parent has their confirmed IDs. The production browser pass has fresh screenshots retained in the task evidence workspace.
