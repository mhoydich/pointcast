# Signal Atlas launch checklist

Priority order for the first usable release, updated 2026-11-01. Local implementation is active; publication remains held. A passing check is evidence for its stated scope, not a live release or participant count.

| Priority | Outcome | Current proof | Remaining blocker / next action |
| --- | --- | --- | --- |
| P0 | Understand the product on arrival | Hero explicitly describes bot encounters, evidence, a wishlist and useful contributions. One primary sample action opens a fictional encounter and its evidence. | Five-edition review passed 49 browser checks at 1440/390/320px. Preserve this first-use path during integration. |
| P0 | Keep sample and real evidence distinct | Fixed the hero evidence action so it leaves demo mode, clears demo search and cancels stale reads. Regression tests cover delayed responses and keyboard focus. Unknown telemetry stays unknown. | Live traffic integration remains a separately reviewed read-only adapter; none of these previews contains actual traffic. |
| P0 | Finish one satisfying practice | Browser exercise produces an inspectable, downloadable unsigned JSON note. Editing/reset clears and disables the stale result. Actual browser download verified; phone layouts checked at 320/390px and desktop at 1440px. | No signup, enrollment, reviewed outcome or points are claimed. Keep these boundaries in any launch copy. |
| P0 | Let a builder try it without a private checkout | `builder-kit.zip` is a standalone offline kit. `node start.mjs first-run` creates an exclusive result folder, receipt and independent inspection. Eight new tests include fresh ZIP extraction, editable answers, tampering and overwrite refusal; independent review passed. | An actual participant has not tried it yet. After an authorized public release, ask the first builders to return the inspection result and one concrete usability issue. |
| P0 | Move between all five editions | Export tooling now produces a review launcher and guarded local navigation; distinct edition titles and parent bindings remain explicit. | Immutable v4 export verified: 117 file hashes. Its runtime matches v3's 49 browser checks; eight targeted v4 checks passed. Do not link unpublished production routes. |
| P0 | Make the app reachable | Verified local launcher: http://127.0.0.1:57100/ . It serves the immutable v4 export; source and restart command are preserved. | Public URL is still blocked by exact repository publication approval and the unresolved cloud handoff. Confirm permitted destinations, then use a reviewed release route. Loopback links work only on the Mac. |
| P0 | Release without misleading green checks or destructive recovery | Local El Segundo safeguard patch is being independently reviewed against current main: exact SHA, gate/overlap evidence, typed assets, shared receipts and no arbitrary automatic revert. | Final regression review and exact-baseline patch applicability; then separate release authorization. No remote workflow/protection/credential change is made here. |
| P1 | Recruit the first builders | Participation guide now leads to a real download and a short first-run command. Launch drafts and evidence requirements are preserved. | Public app/kit URL and an authenticated approved distribution account are required before posting. No X post or participant is claimed. |
| P1 | Measure useful participation | Proposed funnel: kit tried → reproducible receipt returned → reviewed useful contribution → repeat contribution. | Counts remain unknown until a consented intake and real observations exist. Avoid pageview/request-volume rewards and new tracking by default. |

## First participation target

The first pilot target is three opt-in builders who can run the offline kit, explain what their receipt proves, and return one reproducible improvement. This is a planning target, not observed participation. Keep the ask small: one task, its source, its checks and one friction point. Do not promise an open league, vendor-verified bot identity or rewards.

## Release handoff proof

For each parent site, record the exact approved repository and commit, artifact hash, checks and build result, provider deployment receipt, canonical page URLs and independent live verification. University editions inherit their own parent release; they do not receive duplicate standings. Distinguish source prepared, merged, built, deployed and live verified.

The original source archive and publishing supplement are frozen and unchanged. The new product pass and release patch need a separate versioned handoff after final QA. Preserve earlier evidence rather than silently replacing its digests.
