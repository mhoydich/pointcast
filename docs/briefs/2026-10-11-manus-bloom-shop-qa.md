# Manus brief — BLOOM SHOP gallery QA (2026-10-11)

PR: https://github.com/mhoydich/pointcast/pull/1410. QA a preview or production deploy after Mike merges it; nothing ships before that.

## URLs to open
- `/bloom-shop` (index, all 20 works)
- `/bloom-shop/stamen-coordinates`, `/bloom-shop/night-jasmine`, `/bloom-shop/service-bay-sunset`
- `/bloom-shop.json`

## Accounts and tools
None. Only a browser: desktop Chrome plus a real phone (iOS Safari if possible).

## Checks
1. Index: five family sections with four works each. The "AI-generated digital art" label is visible near the top.
2. Click any work: the full-screen viewer opens. Arrow keys and on-screen arrows move through all 20. Swipe works on the phone. `F` and the Fullscreen button toggle fullscreen. ✕ and Esc close it.
3. Artwork page: prev/next links, palette swatches, draft prices. The checkout button is disabled and reads "Checkout not open yet". No payment form appears anywhere.
4. No horizontal scrolling at phone width.
5. `/bloom-shop.json` returns 20 works and `"checkoutActive": false`.

## Capture
Screenshots of the index, the open viewer and one artwork page, on desktop and phone. Log any console errors.

## Write results to
`docs/manus-logs/2026-10-11-bloom-shop-qa.md`

## Mike approval needed
Yes, to turn on any purchase flow: prices, editions, fulfillment vendor and terms. QA itself needs no approval.
