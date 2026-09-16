# Beach Commons shopping pocket

Implemented for Mike's request to make V19 easy to shop, investigate attributed sales, and develop a coherent profile/wallet experience.

Source adds named merchant links and local saves on the study, a shared shopping pocket on `/me`, an anonymous 90-day click-report endpoint on the existing analytics KV binding, and a staged merchant/profile/wallet implementation plan. Confirmed sales, revenue and commission remain unavailable until a real merchant conversion integration is configured.

Validation: 25 focused shopping, catalog, profile, session-state and holdings regression tests pass. Focused TypeScript checking passes. Chrome checks exercised Save, saved-only filtering, reload persistence and profile handoff. At 390px the V19 hero overflow was corrected and document width matched the viewport.

The complete site's server and client bundles compiled, but full prerender stopped at omitted, unrelated `public/showcast/bells-bloom/assets` in this sparse checkout. This checkout intentionally avoids downloading the entire media archive and is not deployable as a production artifact. A separate production build of both touched HTML routes and the JSON twin passed. Chrome verified the compiled shopping bundle, saved-only filtering and the saved item on `/me`. No production deployment, purchase, affiliate application or wallet operation was performed.

Release: review/approve PR, then build from the complete main checkout and deploy UI + Functions together. Confirm analytics KV and use preview storage for synthetic click tests. See `docs/plans/2026-09-15-shopping-pocket.md` for conversion integration acceptance and the one-profile wallet direction.
