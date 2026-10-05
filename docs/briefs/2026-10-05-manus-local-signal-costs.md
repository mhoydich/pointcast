# Local Signal + Big Local Basket — browser acceptance

Open the PR preview's `/outages`, `/local-costs`, `/local`, `/apps`, and homepage at desktop and 390px width, plus 200% text enlargement. No login is needed for reading. Director sign-in is needed only to read the pending-price queue.

- Confirm the original educational-TV-inspired primary-color design stays readable, with no clipped controls or horizontal page overflow (the data table may scroll).
- Confirm live SCE, NWS and USGS cards, incident filters, SVG position dial, refresh, last-checked time, failure states and official source links. Disconnect networking: retained readings must say refresh failed and become stale after five minutes. Manual channels must remain unknown/manual, never green or clear.
- Confirm category filters, source dates, AAA regional-reference exclusion from basket, Metro base-fare evidence, missing-price assignments and clipboard agent brief.
- Using a test KV environment only, submit a first-hand sourced observation, confirm 201/pending-review, and verify it does not alter public prices. Confirm out-of-radius/invalid/future evidence is rejected; unavailable storage returns 503. No invented production observations.
- Director only: GET `/api/local-costs?action=queue`, check cursor pagination. Anonymous callers must receive 403.
- Capture desktop/mobile screenshots, browser-console errors and API response statuses. Write findings in `docs/manus-logs/2026-10-05-local-signal-costs.md`.

Do not merge or deploy without Mike's approval. Follow `docs/OPERATIONS.md` and `scripts/deploy.sh` for production.
