# src/content/products/

Each product is a JSON file: `{slug}.json`. Schema in
`src/content.config.ts` (Zod-typed). Add an entry, PR, the catalog at
`/products` picks it up at the next build.

This directory ships **empty on purpose** at v0. The /products page
renders an onboarding state until the first product lands. Mike adds
the first one (or directs cc via /drop pointing at a
`shop.getgoodfeels.com/products/{slug}` URL).

## Minimum required fields

```json
{
  "slug": "coastal-rest",
  "name": "Coastal Rest Tincture",
  "description": "One-line, then a paragraph if needed.",
  "url": "https://shop.getgoodfeels.com/products/coastal-rest",
  "addedAt": "2026-04-18"
}
```

Defaults applied automatically: `brand: 'Good Feels'`, `currency: 'USD'`,
`availability: 'in-stock'`, `author: 'cc'`, `draft: false`.

## VOICE rule applies

Same as blocks (see /VOICE.md). If a product entry's `description` is in
Mike's voice, set `author: 'mike'` AND fill `source`. Default `author: 'cc'`
is the safe path for a structural product entry.
