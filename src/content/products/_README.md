# src/content/products/

Each product is a JSON file: `{slug}.json`. Schema in
`src/content.config.ts` (Zod-typed). Add an entry, PR, the catalog at
`/products` picks it up at the next build.

Good Feels entries are mirrored from the public Shopify catalog with:

```sh
npm run good-feels:sync -- --prune
```

PointCast merch entries can be synced from the PointCast Shopify store, but
draft or unavailable products should stay hidden from public routes.

## Minimum required fields

```json
{
  "slug": "blood-orange",
  "name": "Blood Orange 5mg THC + CBD Seltzer",
  "description": "One-line, then a paragraph if needed.",
  "url": "https://getgoodfeels.com/products/blood-orange",
  "addedAt": "2026-05-05"
}
```

Defaults applied automatically: `brand: 'Good Feels'`, `currency: 'USD'`,
`availability: 'in-stock'`, `author: 'cc'`, `draft: false`.

## VOICE rule applies

Same as blocks (see /VOICE.md). If a product entry's `description` is in
Mike's voice, set `author: 'mike'` AND fill `source`. Default `author: 'cc'`
is the safe path for a structural product entry.
