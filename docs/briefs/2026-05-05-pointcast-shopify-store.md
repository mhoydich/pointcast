# PointCast Shopify store bridge

Date: 2026-05-05  
Status: scaffolded  
Owner: Mike + agents

## Thesis

Use Shopify as the boring, competent commerce system. Use PointCast as the
agent-native storefront, discovery graph, pairing engine, and editorial layer.

PointCast should not become a checkout. It should make products legible:
`/products`, `/products.json`, `/api/products.jsonl`, `/pairings/{mood}`,
`/moment`, and future Blocks can all point to the same canonical Shopify
product URLs.

## What shipped

- `scripts/sync-shopify-products.mjs` pulls active Shopify products through
  Admin GraphQL and writes PointCast product entries under
  `src/content/products/{handle}.json`.
- `npm run shopify:sync` wraps the sync script.
- `/shop` is the human storefront front door over the synced product
  collection. It routes each buy action to the product's canonical shop URL.
- `/shop.json` mirrors the storefront lanes and checkout URLs for agents.
- Default API version is `2026-04`, the current stable Shopify version as of
  May 5, 2026.
- The sync is read-only. It requires only `read_products`.
- A Shopify Dev Dashboard app exists for the store:
  `PointCast product sync` -> active version `read-products-sync`.
- The app is installed once on `pointcast el segundo`. The install redirect
  identified the canonical API shop as `wi19jm-we.myshopify.com`.
- Credentials are on the app Settings tab. The client ID is visible; the client
  secret is masked behind reveal/copy controls. Do not commit either one.
- Client-credentials sync was verified against Shopify. `status:draft` returned
  one postcard product; `status:active` returned zero products because the
  postcard listing is still a Shopify draft.
- A local draft receipt was written to
  `src/content/products/pointcast-postcards-el-segundo-set-1.json` with
  `"draft": true`.

## Setup

Create or connect a Shopify store, then make a Dev Dashboard app with only the
read-only product scope. Shopify's current Dev Dashboard flow uses
client-credentials token exchange; the admin does not hand over a permanent
token for this path.

Environment:

```sh
SHOPIFY_STORE_DOMAIN=wi19jm-we.myshopify.com
SHOPIFY_CLIENT_ID=your_dev_dashboard_client_id
SHOPIFY_CLIENT_SECRET=your_dev_dashboard_client_secret
SHOPIFY_API_VERSION=2026-04
SHOPIFY_PUBLIC_STORE_URL=https://pointcast-el-segundo.myshopify.com
SHOPIFY_PRODUCT_QUERY=status:active
SHOPIFY_DEFAULT_BRAND=PointCast
```

`SHOPIFY_ACCESS_TOKEN` is still supported for older/admin-token flows, but
`SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` is the expected path for the app
created today. The script requests a short-lived Admin API access token at run
time and never writes it to disk.

Use `https://shop.pointcast.xyz` for `SHOPIFY_PUBLIC_STORE_URL` after a custom
Shopify storefront domain is attached.

Preview first:

```sh
npm run shopify:sync -- --dry-run
```

Preview draft products, including the current test product:

```sh
npm run shopify:sync -- --dry-run --query 'status:draft'
```

Write files:

```sh
npm run shopify:sync
```

Each written product then appears in:

- `/shop`
- `/shop.json`
- `/products`
- `/products/{slug}`
- `/products.json`
- `/api/products.jsonl`
- `/moment` if it shares a mood with a Block
- `/pairings/{mood}` through `pairsWithMood`

## Shopify fields

The sync maps Shopify product data to the existing PointCast product schema.

- `handle` -> `slug`
- `title` -> `name`
- `description` -> `description`
- `vendor` -> `brand`
- `productType` -> `category`
- media images -> `image`
- lowest USD variant price -> `priceUsd`
- variant saleability/status -> `availability`
- Shopify product URL or `SHOPIFY_PUBLIC_STORE_URL/products/{handle}` -> `url`

Optional PointCast enrichment can ride on Shopify metafields in namespace
`pointcast`:

- `dek`
- `category`
- `effects`
- `ingredients`
- `pairs_with_mood`
- `vibe_profile`
- `availability`

Tags work too:

- `effect:clear-head`
- `ingredient:yuzu`
- `mood:morning`
- `preorder`

## Compliance Notes

If the store sells hemp-derived CBD/THC, treat commerce setup as a compliance
track, not a styling task.

- Shopify says US hemp merchants must review and agree to Shopify's hemp
  selling requirements and remain responsible for federal, regional, local,
  Shopify, app, partner, and provider rules.
- Shopify Payments does not support hemp, CBD, or THC products. Use a
  compatible third-party payment provider that accepts those products.
- Shopify's hemp docs call out email-only order/shipping notifications for
  hemp products.
- Shipping needs carrier and destination checks; use shipping profiles to
  restrict locations by product.

## Product Lanes

Best first PointCast-native lanes:

1. Physical merch with no hemp exposure: postcards, stickers, prints, mugs,
   field notebooks, broadcast cards.
2. Existing Good Feels products as outbound catalog entries, if payment,
   shipping, testing, and jurisdiction constraints are already handled in
   Shopify.
3. Digital/downloadable artifacts: poster packs, audio packs, agent-readable
   zines, templates.
4. Limited drops paired with Blocks: publish a Block, ship the product, sync it
   back into `/products`.

## Next Step

Pick the store identity:

- `shop.pointcast.xyz` for PointCast merch.
- `getgoodfeels.com` for Good Feels products surfaced through PointCast.
- Two stores if hemp products and ordinary merch should stay operationally
  separate.
