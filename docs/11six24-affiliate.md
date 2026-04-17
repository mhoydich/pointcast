# 11SIX24 Ambassador / Affiliate Program

**Status (April 2026):** ✅ Active program, accepting applications.

## Key Details

| Feature | Details |
|---|---|
| **Sign-up URL** | https://11six24.com/pages/ambassador-program |
| **Typical commission** | $15 per paddle sold (Store Credit) OR $10 per paddle sold (Cash via PayPal) |
| **Jelly Bean paddles** | $10 Store Credit OR $5 Cash (lower due to the lower MSRP) |
| **Trackable code** | ✅ Approved ambassadors receive (a) a personal referral link + (b) a discount code to share with their audience |
| **Approval time** | Reviewed personally; typically within a few business days |

*Sources: 11SIX24 ambassador program page, independent research by Manus, April 2026.*

## Action items for Mike

1. **Apply** at https://11six24.com/pages/ambassador-program — mention PointCast as your platform, Vapor Power 2 as your daily driver, and the monthly page-view count.
2. **On approval** — paste both the referral link and the discount code into `src/components/PaddleBlock.astro` (replace the current bare `href=https://11six24.com/products/vapor-power-2` with the tracked referral URL, and surface the code as a small secondary chip on the block: e.g. `POINTCAST · 5% off`).
3. **Commission math** — if the block drives even 1 paddle/month, that's $15/mo in store credit (equivalent to a free paddle every 13-14 months). Meaningful if the block actually converts.

## Open questions (defer to when Mike applies)

- Do approved ambassadors get a custom landing page, or is it just a referral param like `?ref=mhoydich`?
- Does the tracking cookie persist across sessions / devices?
- Is there a performance tier (N paddles/quarter → higher commission)?

Ask the 11SIX24 ambassador-team DM directly once Mike hears back.
