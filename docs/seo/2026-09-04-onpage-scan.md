# PointCast on-page SEO scan — 2026-09-04

Exercise the rendered audit with:

```sh
npm run build:bare && npm test
node scripts/seo-scan.mjs
```

The test deliberately skips when `dist/` is absent, but emits a loud reason
and the command above. It audits rendered output, while the normalizer is a
separate build integration.

## Before

The first rendered pass scanned 2,118 HTML pages and reported broad metadata
gaps: 72 canonical-count issues, 428 non-self canonicals, 62 duplicate
descriptions, 681 duplicate descriptions, 972 descriptions outside 50–160
characters, 99 H1-count issues, 472 missing JSON-LD scripts, 506 missing OG
images, 43 apparent title-count issues, and 421 long titles.

It also had two sitemap defects not covered by the original implementation:

| Sitemap finding | Count |
| --- | ---: |
| Cross-file URLs emitted in trailing and non-trailing forms | 801 normalized pairs |
| Permanent-redirect sources in `sitemap-0.xml` | 3 observed (`/dashboard`, `/minted`, `/profile`) |

## Regressions found in review and fixed

The review caught problems that the first scan could not see because it used
the normalizer's document-wide title assumptions.

1. Title handling now reads and changes only the document `<head>`. Existing
   titles are preserved exactly, except a literal trailing
   ` — PointCast — PointCast`; inline SVG labels on `/town`, `/timeline`, and
   `PointCast2029Mark` remain intact. The test normalizes a 50-page temporary
   sample twice and explicitly proves the SVG-title count is unchanged.
2. Authored multiple H1s are no longer demoted. The minimal commented
   allowlist names five intentional pages; rendered `/me` still resolves
   `[data-me-name]` and `/profile` still resolves `#identity-name`.
3. OG validation recognizes files in `dist/` and `public/`, plus Cloudflare
   Pages Functions (including parameter segments). The daily Collect and
   Kennel Club cards are retained; Block cards 0581 and 0583 are now checked
   in as local generated assets. Fallback replacements clear conflicting
   `og:image:*` and Twitter image siblings and declare their actual PNG type.
4. Breadcrumb JSON-LD skips non-existent intermediate paths rather than
   emitting a URL that 404s. The rendered scan validates every same-origin
   BreadcrumbList item against the same local/Page Function route rule.
5. Description normalization is byte-idempotent and uses human-readable
   edition labels rather than raw URL suffixes for unavoidable mirror copy.
6. The auto sitemap filters deliberate noindex paths and every permanent
   redirect source declared in `_redirects`/middleware. The bespoke discovery
   and Block sitemaps now emit the trailing-slash canonical form, and the
   auto sitemap excludes routes owned by those two files so the normalized
   cross-file union is disjoint.

## After

After `npm run build:bare`, `node scripts/seo-scan.mjs` scans 2,118 pages.
There are no unexpected rendered defects, no broken BreadcrumbList item URLs,
no missing same-origin OG assets, no OG MIME mismatch, no sitemap redirect
sources, no non-canonical sitemap URLs, and no normalized cross-file sitemap
duplicates.

The scanner reports only five intentional H1-count findings:
`/auth/`, `/crystal-ball-pass/play/`, `/me/`, `/profile/`, and
`/sparrow/deck/`. They are explicitly documented in
`docs/seo/onpage-allowlist.json`; all other defect classes are zero. Existing
editorial titles are not treated as defects merely for exceeding 60
characters, because preserving an authored head title is the rule.
