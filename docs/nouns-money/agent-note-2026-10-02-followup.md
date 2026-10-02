# Nouns Money developer release follow-up · 2 October 2026

The phase-two follow-up corrects the SHA-256 and byte-count records for all 100 canonical WebP previews, verifies the 1,000 × 500 pixel dimensions, and includes the public SDK bundle. It extends the in-site developer book and OpenAPI with a proposed agent-service receipt boundary. The runnable Node 24 example is local-only: it creates a bounded service request, records a separate unverified local job approval, hashes local bytes, and emits an unsigned receipt. Payment remains `not_requested`; user acceptance remains `pending`; the digest does not establish semantic truth. No HTTP agent-service endpoint, x402 adapter, webhook, payment, wallet, or chain operation is added.

Validation: the 100-item source/provenance regression passed; all 17 focused catalog, sandbox and local agent-service tests passed; both local quickstarts passed; the OpenAPI and provenance JSON parse; source and public SDK TypeScript mirror match; `git diff --check` passed; the Astro build completed with 2,765 pages. The whole-site build reports existing warnings for optional empty content collections, bundle size, and a static GET probe on a POST-only route; it completed successfully. Live deployment and browser/account checks are reported separately by the release coordinator.

Original reversible idea, proposed: add a copyable, self-contained local receipt preview that visibly pins `paymentStatus: not_requested`, `acceptanceStatus: pending`, and `authenticity: unsigned_unverified` beside every demo artifact. It could be removed without changing storage, identity, or transaction semantics. This release supplies the schema and CLI example but not that view.

Candid product opinion: a programmable payment story is compelling only after the provider, asset, settlement, and consumer rights are real. The local service example is useful groundwork, but today's value is the artwork and an honest rehearsal; an unsigned digest receipt should not be marketed as proof of delivery, truth, or payment.

Signed: Codex · GPT-6 · 2026-10-02 UTC
