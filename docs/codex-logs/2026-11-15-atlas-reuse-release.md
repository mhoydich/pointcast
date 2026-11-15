# Team Terra reuse metadata — release receipt

ChatGPT, Mike's AI agent. Recorded 15 November 2026 after Mike approved merging and publishing PR #1746.

## Published release

- Live atlas: https://pointcast.xyz/teamterra-atlas/
- PR: https://github.com/mhoydich/pointcast/pull/1746
- Reviewed source: `ee8ca32861b94705583355de9235631d9f548024`
- Reviewed tree: `c3f9cc0db9bd1fb7b98bbf04768efd8833a451ac`
- Merge: `83181d17f6aed6fe21faa1e4e8ff456b93942755`
- Production workflow: https://github.com/mhoydich/pointcast/actions/runs/43744199340
- Cloudflare deployment: https://2307847d.pointcast.pages.dev
- Loom receipt: https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_3f5r265z63

The workflow completed successfully at 18:08:22 UTC. Build, integrity gate, actual Cloudflare upload and smoke checks all passed. The upload included 17,291 files (3,812 uploaded and 13,479 already present). `/`, `/court/` and `/blocks.json` returned HTTP 200.

The release adds the literal `not assessed` reuse status to 33 previously incomplete records, retains all 36 architecture compilation notes verbatim, and carries the corresponding note into all 69 GeoJSON features. The browser dataset matches the downloadable source. This metadata correction does not establish source-specific reuse permission.

## Verification

Three focused regression tests, JavaScript syntax and diff whitespace checks passed before merge. Independent review confirmed that all other record fields, coordinates and all 177 bundled world-map features were unchanged. The reviewer also ran the test bodies against the parent data: the two original omissions fail the new checks.

Independent live verification at 18:09 UTC returned HTTP 200 and exact byte matches for all three data files:

| File under `/teamterra-atlas/` | Bytes | SHA-256 |
|---|---:|---|
| `atlas.json` | 243,646 | `e443399bb60075090b9a3f6b662f53388f89b7e7edb604d25abf778b8e782aa1` |
| `places.geojson` | 127,881 | `cb91c29ea7d9e10d2946b6844e059fa537758686f25eb61b520b6be268051f3d` |
| `assets/atlas-data.js` | 451,500 | `dc18de495762e3a3f60b861b3483ff3d48cd7797852e391587c3e869c4296b2c` |

The live page returned HTTP 200 with the correct title, data-script reference and both download links. Its HTML differs from source because shared production SEO/head processing and the Tezos session bridge are injected. This pass verified HTTP delivery and data, without repeating browser or physical-device QA.

## Post-deployment town inspection

The required inspection ran once after the successful deployment, from merge `83181d17`. Its complete generated report accompanies this receipt in `src/data/town-inspector-report.json`.

| Observation | Result |
|---|---:|
| Advertised URLs checked | 747 |
| Open | 725 |
| Documented responses | 8 |
| Classified as broken | 11 |
| Prepared-only / unavailable | 3 |
| Manifest claims passed | 8 of 8 |
| Newly observed problem URLs versus the saved report | 0 |

The report was recorded at 18:14:25 UTC after a 318.93-second run. Its verdict is **drift**, and the command exited 1. All 14 problem URLs, classifications and HTTP statuses exactly match the saved report from 27 October 2026; no prior problem URL disappeared and no new one appeared. This comparison is with that recorded snapshot, rather than proof of uninterrupted behavior between the two observations. The exact paths and statuses remain in the generated report.

The subsequent publishing audit took 22.22 seconds and exited 0. It found 511 source blocks and 507 live blocks, newest ID `0786` in both, with no published blocks missing after accounting for drafts. The only worktree-cleanliness warning was the expected generated inspection report.

The inspection introduced no route fixes or source-permission decisions. Practice aliases remain pending their existing review. This follow-up record is prepared for the next maintenance merge; the atlas fix itself is already live.
