# Morning Studies — PointCast release candidate

User request: “put for sale in some way” / “on pointcast”, immediately after the Kellogg-inspired advertising boards.

## Proposed public surface
- `/shop/morning-studies/` — native Astro page using BlockLayout.
- `/shop/morning-studies/catalog.json` — truthful inquiry-only machine-readable catalog.
- `/images/morning-studies/concept-preview.avif` — 360 × 240 preview of the most recent eight-panel concept board.
- Add a discovery link from `/shop` during review. Do not insert into an in-stock product feed or claim payment is enabled.

## Commercial scope
Print and original-commission inquiries, not an active checkout. Buyer contacts the existing public address hello@pointcast.xyz; a click only opens a draft in the buyer’s email application. No customer data is collected on this page. Mail delivery to the address has not been tested.

The uploaded board is unofficial AI-assisted concept work. It is neither authorized Kellogg merchandise nor a print-ready file. Branded references are portfolio-only. Final saleable work must be separately approved, brand-free or rights-cleared. No brand or mascot rights, edition scarcity, inventory, price or delivery date is represented as established.

## Authorization and release gate
Mike explicitly authorized putting the work for sale on PointCast. This is authorization for the inquiry storefront, not for inventing payment details, committing to production costs, buying postage, selling branded merchandise as official, publishing to other services, or deploying unrelated code.

Please review this branch, add one clearly labeled discovery link to the existing `/shop` page, and check build, image, accessibility and mailto links. Resolve any conflicts on the branch without overwriting concurrent work. Use the existing review and merge workflow. Deploy only through `scripts/deploy.sh` following `docs/OPERATIONS.md`; merge alone does not mean live. Confirm production returns the page and catalog and loads the image before reporting publication. If deployment cannot run, report the exact blocked step without claiming the storefront is live.

Suggested shop-link copy: “Morning Studies — bright visual directions from Hoydich Advertising. Ask about a brand-free or rights-cleared print or an original commission. By quotation; no checkout.”

## Validation already performed
- Local static preview rendered in Chromium at 1440 px and 390 px.
- No horizontal overflow at either viewport.
- Preview image decoded and loaded at both viewports.
- Five email links present; no submit endpoint or payment processor.
- JSON parsed; inquiry-only status, null price, false payments/preorders, false branded-art-for-sale asserted.
- Visual desktop inspection completed.
- Full Astro build has NOT run in this environment. Production has NOT been verified.

## Source integrity
Original chat artwork: `a_wide_colorful_composite_illustration_in_a_retro.png` (1536 × 1024).
Preview Git blob SHA: `ea9f4b1f53d2fd4659e473c8f863cc174ad23978`.
Thumbnail is not a final printable deliverable. Retain the original with Mike; do not market the thumbnail as high-resolution artwork.
