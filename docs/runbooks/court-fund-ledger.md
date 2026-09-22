# The Court Fund — ledger runbook

The fund's promise is that every dollar is a line anyone can read. This is
how a line gets written. The ledger is `src/data/court-fund-ledger.json`;
the page at /paddles/fund and /paddles/fund.json compute every total from
the lines. Nothing is typed as a total.

## One-time setup (Mike)

1. In Stripe, create a Payment Link for the $25 patron pass and one for the
   $100 club seat. On each, add an optional custom field "Name for the wall
   (optional)". Turn off any subscription/auto-renew.
2. `wrangler pages secret put COURT_FUND_CHECKOUT_URL --project-name pointcast`
   and `... COURT_FUND_CLUB_CHECKOUT_URL ...`. Until these exist the page
   offers a pledge instead of a purchase.

## Recording money in

For each Stripe payment (weekly, from the Stripe dashboard export; never
paste card data or emails anywhere):

```json
{ "date": "2026-10-03", "kind": "in", "usd": 25, "note": "Patron pass", "name": "M. H." }
```

`name` only if the buyer typed one in the wall field. `usd` is the gross
amount the buyer paid; Stripe's fee is a house expense, not a fund expense.
The page splits each `in` line by `meta.split` when it totals.

## Recording money out

Only the fund half is ever paid out, and only for a court pick. A payout
line MUST carry a receipt URL (a public image or PDF under
`public/images/court-fund/` is fine) or the page refuses to count it:

```json
{ "date": "2026-11-14", "kind": "out", "usd": 449.98, "note": "Two portable nets and 60 balls for Hollyglen Park (season one pick)", "receipt": "https://pointcast.xyz/images/court-fund/2026-11-14-hollyglen.pdf", "photo": "https://pointcast.xyz/images/court-fund/2026-11-14-hollyglen.jpg" }
```

Rule: `fundBalance` may never go negative. If a pick costs more than the
fund holds, it waits, or the house tops it up with an `in` line that says
"House top-up" so the arithmetic stays honest.

## What the house half may pay for

Hosting, the research budget (web-search credits for the weekly refresh),
the hours spent keeping the register current at a stated rate, and Stripe
fees. It may not pay for anything that is not the register. The house half
is not itemised on the public page; the fund half is, to the cent.

## The pick

At the end of a season (or as soon as the fund can cover a candidate), read
`GET /api/paddles/fund` for the vote tally, choose, buy, record the `out`
line with the receipt and a photo, and add a `changes` row to
`src/data/paddle-register.json` (`kind: added`, `paddle: null`) so the
changes feed and RSS announce it. Then seed next season's candidates.

## The wall

`wall` is an array of names. A name goes on when its `in` line has `name`.
Keep the two in step. Names are initials or first names unless the buyer
wrote a full name.
