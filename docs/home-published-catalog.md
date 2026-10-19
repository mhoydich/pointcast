# Updating the published project catalog

The homepage rotation, Latest browse page and catalog feed share
`src/data/home-latest-projects.json`. A route present in source, merged main,
an open PR or a build is still pending until its publication is verified.
Keep proposal, demonstration and operational limits in each record's `group`
and `dek`; admission checks that these fields are nonempty, while the release
reviewer checks their accuracy.

`scripts/admit-home-published-projects.mjs` is an offline preparation tool.
It does not make HTTP requests, run Git, deploy, watch the site or automatically
change the source catalog. No background admission process is running. The
release coordinator invokes it after obtaining and reviewing actual deployment
and HTTP evidence, then reviews its separate output for the next scoped release.

## Coordinator workflow

1. Publish the project through the existing prescribed release lane. Record the
   actual deployed source commit, completion timestamp and deployment-specific
   immutable origin from the deployment receipt and live marker.
2. Issue actual GET requests for every candidate's human route on both
   `https://pointcast.xyz` and the immutable deployment origin. Both responses
   must be 200. Save the raw response bytes, not transformed or reconstructed
   text. For a fragment link, fetch the route without its fragment and verify the
   target exists in both saved HTML bodies.
3. Create the finite HTTP proof JSON below. SHA-256 each raw body and record its
   exact nonzero byte length. Place body files under the proof directory without
   symlinks. The proof timestamp must be strictly after deployment completion.
4. Independently review the normalized receipt and the HTTP evidence. Its
   `proofSha256` is the SHA-256 of the exact HTTP-proof JSON file bytes. The
   receipt's commit must match the actual deployment/live marker and proof.
5. Run the offline intake with a separate output file, inspect its diff against
   the existing catalog, then admit that reviewed catalog in the next scoped
   source release. Replacing the review file is atomic after the whole batch
   passes; the helper never overwrites any input. The output must be outside the
   real proof directory, protecting every saved body as well as the JSON inputs.

```sh
node scripts/admit-home-published-projects.mjs \
  --catalog src/data/home-latest-projects.json \
  --candidates /path/to/intake/candidates.json \
  --receipt /path/to/intake/reviewed-release.json \
  --proof /path/to/intake/proof/http-proof.json \
  --proof-dir /path/to/intake/proof \
  --out /path/to/intake/catalog-for-review.json
```

Existing records remain in their original order with their existing fields.
New records append in intake order. An update must match the same existing
`id` and exact `href` and requires `--update-existing`; this explicit flag
replaces only that matched row. ID-only/href-only matches fail. A legacy row
without an ID needs a separately reviewed migration before it can be updated.
The flag does not bypass any publication proof or candidate validation.

## Intake files

Candidates are a nonempty array of the canonical record fields: `id`, `title`,
`href`, `group`, `dek`, `image`, `publishedAt`, `sources`, `imageRights` and
optionally `publication: { "state": "pending" }`. A candidate may omit
`publication`; it cannot supply its own verified state or receipt metadata.
`publishedAt` may be null when the original publication date is unknown; it is
never invented from the HTTP probe or deployment timestamp. Optional `addedAt`
records an explicit UTC intake date separately.
IDs are unique lowercase slugs. Hrefs are unique internal public paths with an
optional target fragment, without queries, traversal or ambiguous encoding.
Dates accept 1–9 fractional digits in ISO UTC timestamps (`Z` or `+00:00`).
Original precision determines after-deployment ordering; public metadata is
normalized to millisecond ISO UTC `Z` timestamps, truncating submillisecond
precision. The exact original proof bytes remain bound to the reviewed receipt
hash. Sources require a public HTTPS
URL, title and checked date. Private paths, Library/chat tracking, userinfo,
credential parameters and tracking query parameters are refused. Public text
fields also refuse recognizable private filesystem paths without redacting them.
Public API paths on official external sites remain valid source URLs; the
private-route restriction applies to PointCast and known private chat surfaces.
The director-only `/desk` and its descendants are excluded even if their public
sign-in door returns 200; unrelated public routes such as `/r/desk` are distinct.

For a text-only card use:

```json
{"image":null,"imageRights":{"status":"not-used","source":null,"license":null,"checkedAt":null}}
```

An image must be an internal image asset. Its reviewed rights status must be
`original`, `existing-published-asset`, `licensed`, `public-domain` or
`permission-granted`, with a public
source URL, nonempty license/rights description and checked UTC timestamp.
Only `existing-published-asset` may retain `license: null` when rights are
unknown; it records an already published asset without inventing a rights claim.
This records the review; it does not independently certify a license.

A normalized, independently reviewed release receipt is:

```json
{
  "releaseId": "pointcast-release-20261006",
  "commit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "canonicalOrigin": "https://pointcast.xyz",
  "immutableOrigin": "https://deadbeef.pointcast.pages.dev",
  "completedAt": "2026-10-06T15:00:00.000Z",
  "proofSha256": "EXACT_LOWERCASE_SHA256_OF_PROOF_JSON_BYTES"
}
```

The example commit/origin are fixtures. Use the actual production commit and
eight-hex Cloudflare deployment hostname, never a branch alias, custom host,
port or credential-bearing URL. Release IDs are public lowercase slugs, never
private receipt paths or raw private receipt text. Unknown input fields fail.

The HTTP proof contains the matching commit, checked timestamp and finite
response list. Each candidate route needs one exact response URL per origin:

```json
{
  "commit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "checkedAt": "2026-10-06T15:01:00.000Z",
  "responses": [
    {"url":"https://pointcast.xyz/new-study/","method":"GET","status":200,"bodyPath":"canonical/new-study.html","sha256":"EXACT_BODY_SHA256","bytes":123},
    {"url":"https://deadbeef.pointcast.pages.dev/new-study/","method":"GET","status":200,"bodyPath":"immutable/new-study.html","sha256":"EXACT_BODY_SHA256","bytes":123}
  ]
}
```

`method` may be omitted for the existing normalized proof shape, whose records
must represent actual GETs; if supplied it must be `GET`. Bodies must be regular
files within the proof directory after realpath resolution. Any symlink, missing
file, wrong hash, zero/wrong length, duplicate proof URL, non-200 response,
wrong commit, malformed/duplicate-key JSON or early timestamp refuses the batch.
Unused proof records are also checked. HTML anchors use parsed element IDs or
legacy named anchors; comments, script strings and inert templates do not count.
Limits are 4 MiB per JSON file, 16 MiB per body, 5,000 candidates/catalog rows,
20,000 responses and 50 source URLs per candidate.

Only public record fields and sanitized release ID, commit, UTC proof timestamp,
canonical route URL and immutable origin enter emitted `publication` metadata.
Proof filenames, local paths and raw receipt text stay in the private review
bundle. Hashes bind the reviewed receipt to saved evidence. An offline helper
cannot independently prove that a supplied fixture came from the network;
independent receipt review and actual GET collection are the trust boundary.

Run the focused fixture suite with installed dependencies:

```sh
node --test tests/home-published-admission.test.mjs
```

The suite uses temporary local files and no network, Git or deploy operations.
