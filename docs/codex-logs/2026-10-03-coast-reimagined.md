# Coast, Reimagined — local review edition

The standalone `/art/v2/` gallery pairs 50 owner-published Midjourney source
references from July 18, 2026 with 50 individually generated OpenAI V2 artworks
dated October 3, 2026. Stable IDs are `MJ-JUL18-01` through `MJ-JUL18-50`.
The public provenance endpoint is `/art/v2/manifest.json`.

The source JPEGs, source hashes, slugs, pinned repository catalog links, and
source-to-output mappings were independently checked. The bounded source set is
50 selections from a 106-work public catalog, rather than a complete authenticated
Midjourney-account scan. Historical job IDs, indices and URLs are unavailable and
remain null. Historical prompts are disclosed as fragments; complete V2 prompts
are preserved.

The gallery includes 100 source WebP derivatives (900px and 480px) and 100 V2
WebPs (1024px and 420px), totaling 25,845,050 bytes. All 200 files fully decode;
all 50 V2 web hashes match the authorized producer handoff. Original 1254px PNG
masters are preserved by the producer separately; their hashes in the public
manifest are producer receipts, not a claim that this checkout contains or has
decoded those master files.

Verified input package SHA-256:

- Source ZIP: `20f749b1b43c58a860476cce3a4c7f4a7dca0809988e8c07eb3a9cd8f7c706eb`
- V2 web ZIP: `41f9cbaa49a3b5fa6605be186ce99b9d81ffe0c37cb3c02e700bfc7c65776232`

The exhibit preserves original source titles alongside new titles and captions.
It offers category and title/prompt search, paired/source/V2 views, and a keyboard
viewing room with filtered navigation and focus restoration. Reduced-motion
styling and the full no-JavaScript paired collection are provided. An isolated
layout suppresses global auth/session and analytics bridges.

Commerce is unavailable. The planned price is 1 tez; no network, token, contract,
listing, signing, minting, or payment is activated. Commercial rights, edition
terms and sale configuration still require resolution. The collection remains a
review edition with `noindex` until its publication review is complete.

Local validation on the `aa2869924f9a1dac0067c42be3938ca1080fc04d` main baseline:

- `node --test tests/art-v2.test.mjs`: 45 passed, 0 failed. Covers real-template
  interaction selectors, all image dimensions/hashes, provenance, title/caption
  search, keyboard/focus state, hostile-text handling and disabled commerce.
- `node scripts/audit-art-v2.mjs`: 50 sources, 50 V2 works, 200 verified files.
- `npm run build:bare`: passed; 2,831 pages built in 477.34 seconds.
- `node scripts/audit-art-v2.mjs --compiled`: passed; emitted manifest equals
  the safe projection, one main landmark, 50 cards / 100 images, one gallery
  JSON-LD record / 100 media, no private paths or Library identifiers.
- Local HTTP route and manifest returned 200 with 50 pairs; first and last source
  and V2 image responses were valid WebP files.
- Independent code/data/test/CI review found no remaining concrete blocker.

Native browser layout, modal top-layer behavior and mobile screenshots remain
unverified: browser-control capability was unavailable in this execution task.
The DOM tests emulate modal methods and layout rectangles and do not substitute
for that visual check.

No gallery branch was pushed, no PR opened, and no gallery merge, deployment or
social publication occurred. Public actions are paused under the latest owner
instruction and require explicit approval. The scoped `Art v2 gallery checks`
workflow is prepared locally; remote CI has not run.
