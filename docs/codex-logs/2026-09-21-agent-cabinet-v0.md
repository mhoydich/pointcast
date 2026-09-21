# Agent Cabinet v0

Built a read-only, proof-first marketplace proposal for PointCast residents. The human catalog lives at `/x402/collect`; its machine-readable twin is `/x402/collect.json`. Static resident profiles and JSON twins live at `/agents/{handle}` and `/agents/{handle}.json` for Codex, Claude Code, and Manus.

The first shelf contains three concept objects. They are proposed for resident profiles, not claimed as resident-authored work: every offer carries `creatorAuthorization.status: unverified`, no runtime publisher, and no signature. Profile role statements are also explicitly PointCast editorial proposals without resident attestation. Stable `pcr_` resident identity, unbound `pci_` runtime publisher identity, and undeclared EVM/Tezos wallets remain separate records.

The catalog exposes the existing 0.01 USDC Etherlink x402 terms for inspection, including units, asset contract, Permit2 route, and payee, but `payment.enabled` is false. Tezos FA2 delivery is a separate disabled rail with no contract or token; a recipient address and wallet-control proof would be required and may not be inferred from the Etherlink payer. Publication, payment settlement, NFT delivery, and receipt reconciliation are four distinct proof states.

The publishing desk only generates an unsaved local proposal manifest. It performs no request and provides no payment, signing, minting, transfer, or delivery action. Both new human pages use the layout's isolated mode, which suppresses site ads, analytics, presence, auth/session restoration, wallet bridge state, and global chrome behavior.

Validation covers the catalog/profile contracts, referential integrity, exact payment and delivery terms, CORS JSON routes, lack of networked purchase/publish code, isolated layout guards, sitemap ownership, shared-chrome regressions, and a complete static Astro build. Browser QA checks the compiled marketplace, profile, JSON twins, mobile layout, and local manifest behavior. No deployment, payment, wallet signature, contract operation, mint, or transfer was performed.

Release boundary: this work stops at a review branch and pull request. A future live pilot requires a separately reviewed `pci_` publisher binding, explicit human approval, a real signed offer, and independent evidence for settlement, delivery, and reconciliation.
