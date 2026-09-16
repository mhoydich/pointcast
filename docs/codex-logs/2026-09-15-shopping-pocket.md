# Beach Commons shopping pocket

Implemented for Mike's request to make V19 easy to shop, investigate attributed sales, and develop a coherent profile/wallet experience.

Source adds named merchant links and local saves on the study, a shared shopping pocket on `/me`, an anonymous 90-day click-report endpoint on the existing analytics KV binding, and a staged merchant/profile/wallet implementation plan. Confirmed sales, revenue and commission remain unavailable until a real merchant conversion integration is configured.

Validation: 25 focused shopping, catalog, profile, session-state and holdings regression tests pass. Focused TypeScript checking passes. Chrome checks exercised Save, saved-only filtering, reload persistence and profile handoff. At 390px the V19 hero overflow was corrected and document width matched the viewport.

The complete site's server and client bundles compiled, but full prerender stopped at omitted, unrelated `public/showcast/bells-bloom/assets` in this sparse checkout. This checkout intentionally avoids downloading the entire media archive and is not deployable as a production artifact. A separate production build of both touched HTML routes and the JSON twin passed. Chrome verified the compiled shopping bundle, saved-only filtering and the saved item on `/me`. No production deployment, purchase, affiliate application or wallet operation was performed.

Release: review/approve PR, then build from the complete main checkout and deploy UI + Functions together. Confirm analytics KV and use preview storage for synthetic click tests. See `docs/plans/2026-09-15-shopping-pocket.md` for conversion integration acceptance and the one-profile wallet direction.


## Production release and navigation correction

Mike approved publication on September 15. PR #1126 merged as `ce60fa747587dd6da91c8f5cdd138edac5739f5e`; Cloudflare production deployment `1d2b8270-c728-42da-b692-eb1e0ef69439` succeeded. The complete build passed (2,186 pages). Canonical V19 and `/me` HTML match the build after removing only the injected wallet-session bridge; the JSON twin and cover image match byte-for-byte. The live API rejects cross-origin writes, honors DNT/GPC, and accepted a temporary click that was independently found in KV, then removed with absence verified.

Live profile navigation exposed a lifecycle bug: a DOM readiness attribute could survive after event handlers were aborted. The follow-up tracks live controllers with a WeakMap, reinitializes aborted roots and clears the stale marker. The controller test now starts with a stale marker, simulates a page swap and verifies reinitialization does not duplicate listeners. All 25 focused tests and TypeScript checks pass.
