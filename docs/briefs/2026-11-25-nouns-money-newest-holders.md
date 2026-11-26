# Newest holders: review and home-page integration

The requested live home page's source is **absent from this tracked repository**. On 2026-11-25,
`https://nounsmoney.xyz/` returned the static workshop page titled “What could
money become? — Nouns Money”, loading `/assets/open-workshop/site.js`, `site.css`
and `home-2035.css`. None of that home source or those assets appears in the
tracked PointCast tree. `functions/_middleware.ts` has no nounsmoney.xyz rewrite.
`src/pages/nouns-money.astro` is the different PointCast collecting-room page.
The owning deployment/source location remains unverified.

This draft prepares the requested strip and an exact insertion snippet. **It
does not change the live nounsmoney.xyz home page.** Fable needs its source before
this can be called integrated. Do not merge this as a completed home-page change.

## Review

- Review route: `/nouns-money/newest-holders/` on a cloud preview (noindex).
- Read-only browser modules and CSS: `public/nouns-money/newest-holders/`.
- Canonical collection set: `src/data/nouns-money-collections.json`, shared with
  PR #1926. That API only provides a count; this feature uses live TzKT transfers.
- PR #1929's holder-count code and tests are unchanged.

The strip shows the latest receipt per wallet, not the wallet's first-ever note
or proof of a remaining balance. It reads across all configured collections,
excludes the resolved office, burn and self transfers, and keeps up to 12 unique
recipients. TzKT IDs break timestamp ties; cursor pagination fills beyond repeat
recipients. Active reverse `.tez` names take priority, with shortened addresses
as fallback. Note thumbnails and objkt links come from each receipt's token.

The whole section starts hidden. Failed office/transfer reads and empty results
leave it hidden. Optional name lookup failure keeps the addresses. No account,
wallet connection, local storage or server write is involved.

## Insert into the separately hosted home

1. Copy the three files in `public/nouns-money/newest-holders/` to that site's
   `/nouns-money/newest-holders/` public directory, preserving their names.
2. Run `node scripts/nouns-money-newest-holders-snippet.mjs` in this repo. Its
   stdout is the complete markup, canonical collection config, CSS link and
   module script; it does not write any files. Paste it immediately after the
   home page's closing hero `</section>`, before `<div class="ticker">`.
3. Fable: check at 390px in the cloud, including horizontal row scrolling,
   keyboard focus, long `.tez` names, a failed TzKT read and no JavaScript. The
   containing page should not scroll horizontally. Confirm thumbnail and objkt
   links against the live response, and retain the existing free-note copy.

## Validation on the iMac

- `node --test tests/nouns-money-newest-holders*.test.mjs`: 16/16 pass.
- `NMW_EXISTING_TOOLING="$PWD" node --test tests/nouns-money-newest-holders*.test.mjs tests/*nouns-money*.test.mjs`:
  189 tests, 186 pass, 1 fail, 2 skip. The single failure is the existing legacy
  copy ratchet: `reserve` in the collection config, `balance` in the count
  helper, and `redeem`/`reserve` in the rails helper. A scan of only tracked base
  files produced exactly the same violations; all three files are unchanged.
  No baseline was relaxed. The environment variable selects the copied local
  node_modules for the existing workshop DOM test.
- Astro compiler transform of the review page in memory: zero diagnostics.
- Live TzKT read at 2026-11-25 20:26 UTC: 12 distinct recipients, six `.tez`
  names, 12 thumbnails, newest `side-effects.tez`; office and burn absent.
  All ten distinct thumbnail URLs returned HTTP 200 with image/png content type.

No dependency installation, build, dist directory or visual viewport check was
run on the iMac. Claude's cloud 390px check and external-home integration remain.
