# PointCast on-page SEO scan — 2026-09-04

Command: `node scripts/seo-scan.mjs` after `npm run build:bare`.

The scanner walks every rendered `dist/**/*.html`, prints the 20 earliest
examples for every nonzero defect class, validates every JSON-LD script with
`JSON.parse`, and checks same-origin OG assets in `dist/` or `public/`.

## Before

2,118 HTML pages scanned from the untouched branch build.

| Defect class | Count | First examples (the command prints the worst 20) |
| --- | ---: | --- |
| Canonical count not one | 72 | `/auth/project`, `/collabs/arena`, fireplace variants |
| Canonical not self | 428 | `/404`, `/beach-commons`, version routes |
| Description count not one | 62 | `/auth/project`, fireplace variants |
| Duplicate description | 681 | `/25/magazine/california-football`, `/b/0557`, `/sparrow/b/0557` |
| Description outside 50–160 | 972 | `/25/2029/field-kit`, `/25/directory`, `/admin/deploy` |
| H1 count not one | 99 | `/auth`, `/crystal-ball-pass/play`, drum variants |
| JSON-LD missing | 472 | `/auth/project`, beach-commons, fireplace variants |
| OG image count not one | 506 | `/auth/project`, fireplace variants |
| OG image missing locally | 9 | `/b/0581`, `/cake`, `/collect`, `/kennel-club` |
| Title count not one | 43 | PointCast 25 2029 routes |
| Doubled PointCast title | 2 | `/wednesday/002`, `/worklife/001` |
| Duplicate title | 41 | `/collect/11`, gallery, Noun Court variants |
| Title over 60 characters | 421 | PointCast 25, Block, and editorial routes |

## After

2,118 HTML pages scanned after the source-controlled generated-page pass.

| Defect class | Count |
| --- | ---: |
| None | 0 |

The empty allowlist at `docs/seo/onpage-allowlist.json` is intentional. The
rendered-site test consumes the same scanner, so future exceptions need an
explicit, documented allowlist entry rather than silently regressing.
