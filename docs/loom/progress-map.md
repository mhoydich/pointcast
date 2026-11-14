# Loom / work in view · draft prototype

Sid, Mike’s AI agent on gpt-6.1-sol. Mike asked in #loom for connection maps and views of progress, human effort, model contributions and available compute (m_252d6f006y; related m_3j4b505d64 and m_0x1s380q31). Claim: m_155f3p5x1u. This is one concrete first visualization slice in the existing PointCast repo, not the whole future map/auth/3D system.

The buildless prototype is `public/loom-lab/progress/index.html`. It has a selectable responsibility/receipt map, readable phone cards, source inspection, receipt-interval view and a capacity view. Images under `public/images/loom-progress-preview/` are actual local Chromium viewport captures, not generated illustrations. Portraits reuse existing whole official CC0 Nouns from `/images/ufogp/`; no new badge rendering.

## What the sample means

Seven selected Sid work items: six retained final receipts and one blocked author edit. Three new artifact PR links are deduplicated. This is not a DAO census or a Doubloon ledger. Daniel’s text and visual follow-up remain one item. The R9 PNG handoff reuses existing R8 art and does not mean six new artworks; ledger overlap remains for its desk to reconcile. The incoming bot’s first check is distinct from Sid’s completed assignment to write its instructions.

The morning Nouns claim was not retained on the sampled fresh read. Its final result is present, but its interval stays unavailable. Claim-to-result intervals are wall-clock observations containing tools, waits and overlap; they are not human hours or compute time and must not be summed. A blocked waiting span is hatched and labelled as waiting.

All four ChatGPT seats have unknown available compute, quota, token usage and human time saved. Last observed posts do not establish present availability. Model/operator fields are self-reported; hashes pin captured text, not a person’s identity. Review handoffs are information, not authorization. There are no posting, approval, wallet or provider-account controls.

## Evidence and reproduction

`src/data/loom-progress-jobs.json` defines scoped work items and canonical receipt IDs. `src/data/loom-progress-evidence.json` pins public messages, text hashes, PR records and observation time. `node scripts/build-loom-progress-sample.mjs` checks evidence hashes and builds `public/loom-lab/progress/data.json`. The page reads that local snapshot only. It is not a live presence dashboard.

Local check: serve the repository’s `public/` directory and open `/loom-lab/progress/`. Full site builds are left to CI under cloud operations guidance. Focused domain tests: `node --test tests/loom-progress.test.mjs`.

Validation so far: five domain tests cover scoped counts, hidden/wrong-author results, missing/reversed clocks and pasted completion templates. Local Chromium at 1440×1100 and 390×844 passed map/cards defaults, blocked filtering, keyboard selection/focus, four whole portraits, unknown capacity, missing interval, no body overflow and GET-only page requests. Captured reports are in `progress-map-checks.json`. Physical devices and production behavior were not tested.

## Next stages, after review

Expand the sample with explicit job IDs and receipt reconciliation before adding DAO-wide totals. Add opt-in, expiring availability reports separately from authorized provider measurements. Test human acceptance/correction loops before calling a score “collective intelligence.” A future 3D/WebXR layer should reuse these relationships while retaining the card/text view; none is implemented here.

Draft only. No merge, deployment, mint, spending or social post. No new hosted Site registration or credentials.
