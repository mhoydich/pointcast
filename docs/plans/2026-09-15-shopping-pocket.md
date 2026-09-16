# Shopping from PointCast: Pocket, attribution, one profile

This change makes Beach Commons V19 directly shoppable and adds a browser-local saved list to the study and `/me`. It is a first slice, not an integrated checkout or account-synced wallet.

## Delivered in this branch

- Direct merchant buttons across all twelve researched seats, named merchant destinations, and a Check stock label for the sold-out Coleman snapshot.
- One compact shopping panel, Save controls on both card styles, saved-only filtering, reload/cross-tab persistence and a clear-list control. Corrupt or blocked browser storage degrades safely. Links work without JavaScript.
- `/me#shopping-pocket` exposes the same explicitly device-local list outside the signed-in account surface. No wallet or login is required to shop.
- `/api/shopping-metrics` stores bounded, anonymous outbound click events in the existing `PC_ANALYTICS_KV` binding for 90 days. Privacy signals suppress tracking. Repeated event IDs overwrite the same daily key; counts are not unique people. GET returns per-product counts and labels the 10,000-event report cap and eventual consistency. Missing storage is unavailable, never fabricated zero sales.
- Sales, revenue and commission are `null` with a not-connected explanation. No merchant relationship is invented and no personal identifier is sent to a merchant by PointCast tracking.

## Next: actual attributed sales

A direct external link cannot observe the merchant's completed order. Start with one approved affiliate or direct merchant integration. REI publishes an [affiliate entry point](https://www.rei.com/help?a=Become-an-REI-Co-op-Affiliate); terms, approval, credentials and reporting access have not been established for PointCast. Do not invent an affiliate ID, commission rate or universal checkout.

After approval, register the merchant-approved deep link and opaque sub-ID format per product. Keep source URLs separate from shopping URLs. Add nearby affiliate disclosure and `rel="sponsored"` to compensated links. Do not put a wallet, email or PointCast account ID in an outbound URL. Use provider-reported conversions, not price × clicks.

Implement a provider-specific signed webhook/API import only after its actual reporting contract is available. Persist in D1 with a unique `(provider, merchant, order_reference)` key, integer minor units, explicit currency, original source evidence, and conversion states pending / approved / refunded / reversed. Deduplicate retries, verify signatures and freshness, reject unknown merchants, and reconcile partial refunds. Display approved net sales by currency separately from gross sales and earned/paid commission. Avoid a public endpoint that lets a browser claim a confirmed sale.

Acceptance: one merchant-approved test order follows the exact PointCast link into the provider report, is imported once after retry, and reverses correctly after refund. Only then claim sales tracking is active. This measures attribution under the provider's rules, not causal incremental sales.

## Wallet direction: one profile, a useful pocket

1. **Finds:** explicit opt-in to import this device's saves into the existing signed PointCast account, using the existing session and owner-bound D1 records. Never silently attach a shared device's browsing to a signed-in person. Account switching must not expose another account's list.
2. **Receipts:** private verified purchases, source study, merchant link, return/support route and delivery status. A self-reported purchase has its own label and never enters confirmed revenue.
3. **Payment choice:** merchant-hosted card/express checkout for external goods; existing PointCast wallet rails for supported native purchases. A wallet connection is an identity capability, not spending consent.
4. **A prepared purchase:** an AI can propose a precise basket with seller, variant, currency, total including shipping/tax, and expiry. The person approves that exact quote. Idempotency and ambiguous settlement handling reuse the existing purchase pilot; do not activate its disabled production flag as part of this work.
5. **Optional ownership:** a consented receipt/collectible link after confirmed delivery; no public-chain shopping history by default. Refund status remains off-chain and correctable.

## Release and operating checks

Review and approve the PR before main merge under AGENTS.md. No new binding or migration is needed for this slice; confirm the existing analytics KV is attached to the deployment. Deploy the reviewed UI and Functions together. Probe malformed/cross-origin requests, a privacy-suppressed event, and the report. Use a preview KV namespace for synthetic clicks so tests do not pollute production. Do not publish this sparse checkout's build: it intentionally omits unrelated public media.

Developer references: [KV listing](https://developers.cloudflare.com/kv/api/list-keys/), [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
