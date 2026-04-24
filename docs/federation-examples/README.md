# Federation examples — drop-in /compute.json starter kit

**Purpose:** stage minimum-viable `/compute.json` payloads for likely federation peers so Mike (or a peer operator) can deploy one in minutes and fire Vol. III's Trigger 2 ("first external /compute.json peer registers").

Each file here is a **ready-to-host** JSON document. Copy it to the peer domain's static root at `/compute.json`, confirm it responds with `Content-Type: application/json` + `Access-Control-Allow-Origin: *`, then email the URL to `hello@pointcast.xyz`. PointCast mirrors it into `/compute` with the `{host: 'your-domain.com'}` prefix and attribution stays clean.

---

## Canonical spec

The formal specification for this format is **[Compute Ledger RFC v0](../rfc/compute-ledger-v0.md)**. The examples in this directory conform to that spec. If something below contradicts the RFC, the RFC wins.

---

## Schema (compute-ledger-v0)

The minimum shape PointCast's federation mirror consumes. See `src/lib/compute-ledger.ts` for the canonical TypeScript definition, and the [RFC](../rfc/compute-ledger-v0.md) §3 for the authoritative shape. In JSON:

```json
{
  "schema": "compute-ledger-v0",
  "host": "your-domain.com",
  "federation": {
    "upstream": "https://pointcast.xyz/compute.json",
    "contact": "you@your-domain.com"
  },
  "summary": { "total": N, "last_24h": N, "last_7d": N },
  "collabs": { "collab-slug": count, ... },
  "entries": [
    {
      "at": "ISO8601 timestamp with tz offset",
      "collab": "collab-slug",
      "kind": "sprint | block | brief | ops | editorial | federated",
      "title": "short human-readable label",
      "artifact": "URL or path (optional)",
      "signature": "shy | modest | healthy | heavy",
      "notes": "optional one-line why"
    }
  ]
}
```

**Required fields per entry:** `at`, `collab`, `kind`, `title`, `signature`. Everything else is optional but recommended for readability.

**Signature bands:** `shy` (single-file edit, ~1-5k tokens), `modest` (component or retro, ~5-20k), `healthy` (feature across files, ~20-60k), `heavy` (primitive, ~60k+). Hand-curated is fine. CI-derived from git history is fine. Publish the band, keep the raw token counts private.

---

## Deploy in five minutes

1. Copy one of the example JSONs below to your domain's static root as `/compute.json`.
2. Make sure your host returns these headers (Cloudflare Pages, Vercel, Netlify, or plain static hosting all support this via a `_headers` file or equivalent):
   - `Content-Type: application/json; charset=utf-8`
   - `Access-Control-Allow-Origin: *`
   - `Cache-Control: public, max-age=300`
3. Confirm it resolves: `curl -sI https://your-domain.com/compute.json | head -4`
4. Email `hello@pointcast.xyz` with the URL and a one-line description of the domain.
5. PointCast will mirror your entries into `/compute` within 24h. You'll receive a reply with the mirror verification.

---

## Examples in this directory

### `good-feels-compute.json`

Minimum-viable ledger for `getgoodfeels.com`. Four seeded entries covering Mike's Good Feels editorial curation, cc's Schema.org product-markup ship, and an Emilie compliance-review ops entry. Describes the federation link upstream to PointCast.

**Deploy path:** drop this at `getgoodfeels.com/compute.json` (or `shop.getgoodfeels.com/compute.json` — either works, registration email mentions the canonical URL). The Shopify setup should accept it as a static asset; if not, a Cloudflare Worker in front of the shop domain can serve the static JSON. Confirm CORS headers before emailing registration.

**Why this first:** Mike owns the domain, so registration happens without external coordination. Fires Trigger 2 of Vol. III immediately.

---

## Future examples to stage

- `sparrow-compute.json` — if Sparrow moves off `pointcast.xyz/sparrow` to its own domain (e.g. `sparrow.pointcast.xyz` or a standalone), it can publish its own ledger of reader-side editorial.
- `magpie-compute.json` — once Magpie ships a public website (as opposed to a local app), same treatment.
- `friend-node-template.json` — a generic template for personal-blog peers, documented with inline comments explaining each field.

---

— filed by cc 2026-04-21 11:30 PT, alongside the `public/posters/` deck infrastructure and the Manus GTM brief. Source: Mike chat 2026-04-21 "ok go" approving the follow-up queue after Vol. II. These files are staging — nothing is deployed to an external domain by this ship. They sit here until Mike (or a peer) deploys one.
