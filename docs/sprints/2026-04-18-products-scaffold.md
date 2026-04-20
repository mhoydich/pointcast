---
sprintId: products-scaffold
firedAt: 2026-04-18T08:11:00-08:00
trigger: cron
durationMin: 28
shippedAs: pending-deploy
status: complete
---

# /products scaffold · Good Feels SEO foothold

## What shipped

- **Schema:** new `products` content collection in `src/content.config.ts`. Required: slug, name, description, url, addedAt. Defaults: brand=Good Feels, currency=USD, availability=in-stock, author=cc. VOICE.md rules apply (mike attribution requires source).
- **`/products`** catalog page. Renders an onboarding state when the catalog is empty (currently the case). Once products land, renders by category with hero image, price, availability tag.
- **`/products/[slug]`** per-product detail page. Schema.org Product top-level JSON-LD, gallery, facts strip (price/availability/category/effects/ingredients), big CTA → shop.getgoodfeels.com. Disclaimer: "POINTCAST DOES NOT SELL OR FULFILL".
- **`/products.json`** — machine mirror. Per-product schema.org Product blocks embedded inline so any agent can lift one entry without re-fetching the page.
- **OG card** for /products via `scripts/generate-og-images.mjs`. Pink-magenta accent matching the GF channel palette.
- **`src/content/products/_README.md`** documenting authoring conventions.
- **Discovery wiring:** /products added to `agents.json` (human + json), home footer, /sprint backlog marked done.

## What didn't

- **First seed product:** intentionally not added. cc would have to invent product details (price, ingredients, effects) that belong to the Good Feels brand — that's exactly the kind of false attribution VOICE.md is designed to prevent. Sprint card `good-feels-product-block` (status: needs-input) is the path: Mike picks the first product (image, blurb, link), drops it via /drop or commits the JSON, cc files.
- **Per-product OG cards:** scaffold uses the catalog OG until the first product's hero image lands. Adding per-product OG generation when there are products to generate them for is a future sprint.
- **Cart / checkout:** not in scope. /products is a catalog, not a store. Shop.getgoodfeels.com handles the checkout. Disclaimer is on every product page.

## Follow-ups

- `good-feels-product-block` is now the highest-leverage next sprint — Mike picks one product and we light up the scaffold end-to-end.
- After 1-2 products land, generate per-product OG cards from the hero image.
- Once 5+ products are in, add `/c/good-feels-products` channel link or extend CH.GF to surface product blocks alongside notes.
- Sitemap inclusion: `/products` and per-product pages should land in `/sitemap-products.xml` once there are products to list.
- DAO PC-0007 candidate: "Allocate X% of any Visit Nouns secondary royalties to a 'Good Feels signal-boost' fund (e.g. paid promotion of new products via PointCast)."

## Notes

- Cron ran clean again — minute :11 fire, queue empty, KV unbound, fell through to next ready sprint.
- The empty-on-purpose state is a feature: it shows the scaffold + onboarding without inventing brand claims. The /products page itself documents what a first product needs.
- The disclaimer language ("POINTCAST DOES NOT SELL OR FULFILL") is conservative on purpose — keeps any cannabis-adjacent regulatory exposure off PointCast and squarely on shop.getgoodfeels.com which is the licensed shopping surface.
