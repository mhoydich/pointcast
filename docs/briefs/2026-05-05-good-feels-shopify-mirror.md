# Good Feels Shopify mirror

Date: 2026-05-05  
Status: live mirror scaffold  
Owner: Mike + agents

## What changed

PointCast was carrying four invented Good Feels seed products:
`morning-tonic`, `marine-layer`, `long-afternoon`, and `coastal-rest`.
Those assumed Shopify-style product handles that do not exist on the live
Good Feels storefront, so the checkout buttons landed on branded 404 pages.

Good Feels already runs on Shopify at `https://getgoodfeels.com`. PointCast
should not create a second checkout or inventory source. It should mirror the
canonical public catalog, add agent-readable routes, and hand purchase intent
back to Good Feels.

## Sync

Run:

```sh
npm run good-feels:sync -- --prune
```

The script reads:

```txt
https://getgoodfeels.com/collections/all/products.json?limit=250
```

and writes entries under:

```txt
src/content/products/{handle}.json
```

It needs no Shopify admin token. Use `--dry-run` to inspect the mapped catalog
without writing files.

## Public surfaces

- `/shop` is the Good Feels shop mirror front door.
- `/shop.json` is the agent-readable mirror.
- `/products` and `/products/{slug}` expose schema.org Product pages.
- `/products.json` and `/api/products.jsonl` expose machine-readable catalog
  entries.

Checkout remains on each canonical `https://getgoodfeels.com/products/{handle}`
URL.
