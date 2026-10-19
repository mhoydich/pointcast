# Manus brief: QA the Haggle Counter odds study (2026-10-05)

New page: `/shop/haggle/odds`, a study of the trade odds at the Haggle Counter.
All numbers are computed at build time from `src/lib/haggle.ts` via
`src/lib/haggle-odds.ts`. Nothing on the page calls an API.

## Open

1. https://pointcast.xyz/shop/haggle/odds (after the deploy that carries this PR)
2. https://pointcast.xyz/shop/haggle and follow the "the odds are worked out here" link in the rules list

No accounts needed. No wallet, no payment.

## Check

- Desktop (1280px) and phone (390px): no sideways page scroll. The tables and chart
  may scroll inside their own boxes, but the page must not.
- The bar chart shows eight items, three bars each, with labels that don't overlap
  the bars or run off the right edge.
- The "Five findings" numbers read 98.0%, R4, 75, 1–4¢, 85%.
- In the strategies table, the "Repeat 40% of list" row shows a red dash under Cup.
- The room tabs show "Haggle Counter" as the current room.

## Capture

- One full-page screenshot at each width.
- Any console errors.

## Write the result to

`docs/manus-logs/2026-10-05-haggle-odds-qa.md`

## Mike approval

None needed for QA. Do not haggle on the live counter for this task; real haggles
land on the public board.
