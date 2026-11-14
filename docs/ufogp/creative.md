# OFF-53 B · 2026-11-13

Sid (Sol 6.1, Mike's agent), gpt-6.1-sol. Draft assets for review.

- Six founding seats and proposed token IDs: `src/data/ufogp-seats.json`.
- Site words for Tess: `src/data/ufogp-copy.json`. Render as text; the site is part C.
- Whole 320 × 320 Nouns: `public/images/ufogp/{mike,loom-desk,ada,sid,tess,lou}.svg`.
- Flag: `public/images/ufogp/flag.svg` (960 × 640).
- Share card: `public/images/ufogp/share-card.svg` (1200 × 630). A 1200 × 630 PNG is included for social unfurls.
- Hashes, trait filenames and numeric seeds: `public/images/ufogp/provenance.json`.
- TZIP-21 JSON: `contracts/ufogp/metadata/0.json` through `5.json`, mirrored at `public/ufogp/metadata/`. FA2 uses TZIP-12's token_metadata map, linking JSON through its empty key as UTF-8 URI bytes. TZIP-21 describes that JSON; these files do not implement a contract.

## Reproduce

From repo root: `node scripts/build-ufogp-creative.mjs`. For raster exports too: `node scripts/build-ufogp-creative.mjs --png` after installing repo dependencies (`@resvg/resvg-js`). Text rendering depends on available fonts; DejaVu Sans was used for the checked-in PNG previews.
Then `node --test tests/ufogp-creative.test.mjs`.
The script reads only checked-in official image data and reuses `src/lib/nouns-parts.mjs`. It needs no network or wallet. No image generation is used. Layer order: body, accessory, head, glasses; the complete 32 × 32 pixel canvas is retained, scaled to 320 × 320.

The charter specifies the head and body for each seat. It does not specify background, accessory or glasses. This draft chooses cool background, accessory-none and glasses-square-black for all six. Those choices are explicit in provenance. The displayed Nouns are new trait combinations, not claims to any numbered Ethereum Noun or its token.

Nouns artwork is CC0: https://nouns.wtf/brand and https://creativecommons.org/publicdomain/zero/1.0/ . The new combinations, flag and share card are also dedicated to CC0. Existing renderer software retains its repository license. Source attribution and SHA-256 are in provenance.

## Handoff to A and C

Proposed IDs 0–5 are in charter order: Mike, Loom desk, Ada, Sid, Tess, Lou. Confirm these IDs against A's contract before minting. No holder or creator address is guessed. `creators` is omitted because a Tezos address has not been supplied for this collection.

Metadata uses planned HTTPS artifact URIs on pointcast.xyz. They are draft paths, not a claim that these resources are live. Before any mint, the Signing desk must publish and verify the exact bytes or replace URIs with pinned immutable content, regenerate metadata, and confirm the hashes. Any URI or artwork change needs another check. `isBooleanAmount: true`, `decimals: 0` describe single-unit seats; transfer restrictions must be enforced by A's contract.

No wallet, signing, origination, minting, spending, merging or deployment is part of B. The site must describe contracts as proposed until there is independently checked chain evidence. The open poll has not closed; no winner is asserted in the copy.

## Interview addition

Read the UFOGP INTERVIEW and Tess's and Loom desk's replies on 2026-11-13. Replied once as Sid, six answers each under 250 characters: `loom:42baaa6831fa5fd2cf5802f5#m_1c5i6o586h`.

`interview-flag.svg` / `.png` carries Tess's six paths with a dotted seventh route and the desk's “take nothing, leave maps.” `interview-share-card.svg` / `.png` pairs that map with all six whole Nouns. Both are in `public/images/ufogp/`. The extra route is an application, not a seventh seat. No post to X was made. The assets are for other desks to review and lift after publication is separately authorized.

Part C already has draft PR #1687. These files are additive; it can consume the seat data and copy after review. Its independent portrait choices need reconciling with these explicit accessory/background/glasses choices before the assets are presented as one canonical set.

## Round two thread · 2026-11-13

`docs/ufogp/thread-draft.json` contains ten edited Office Noun interview posts, with picture paths and source reply IDs for each. Based on the visible replies by Tess, Loom desk and Sid; no answers are invented for the other seats. Each numbered post including its picture note is under 260 characters. The complete board draft is under the Loom's 2,000-character limit. SVG portrait assignments need raster export for X. The PNG cards are already included. No upload or post to X is authorized by this draft.
