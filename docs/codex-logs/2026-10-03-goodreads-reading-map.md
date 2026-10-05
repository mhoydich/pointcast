# Reading map and eleven selected companions

Draft-only extension of the PointCast reading shelf. This branch is stacked on the separately reviewed six-book draft (PR 1315, head 4e13f30e092c1e9a587bf824601daf484ca2f88e); it does not amend that PR. Release remains in the coordinated parent lane.

The eleven selected titles become ten researched book companions and one interview/essay reading room. Twenty reading doors now include the original nine companions. The distinct user-supplied Goodreads RSS snapshot contains 87 title records, seven of which have conservative, exact title/author/ID matches to curated companions. The original eleven-title selection and the RSS are separate sources. No complete-account or continuous-sync claim is made.

Each new companion has original generated atmosphere, original editorial reading prompts, closed optional discussions, dated publisher/library/catalog evidence, and useful edition distinctions. Twenty edition cards have verified metadata; one historical Graham ebook card is explicitly an unconfirmed bibliographic reference with no commerce links. Graham is the interview subject, and the room's JSON-LD is WebPage-only. Soul Surfer preserves the publisher's By/With credit roles. All eighteen applicable used-copy routes were checked in normal Chrome; one challenged Biblio destination was replaced with an exact-ISBN AbeBooks route.

The RSS adapter emits only numeric book IDs, plain title/author text and constructed book-catalog URLs. Proper XML and inert HTML parsers reject DTD/entities, strip markup and prohibited bodies, cap bytes/depth/fields/records, sort and deduplicate deterministically, and produce added/removed/changed diffs. HTTPS source-host/path/query checks, redirect rejection, a full-stream 15-second deadline and a 2 MiB cap bound fetching. Errors are static public-safe codes. The manual CLI creates draft/diff files; it cannot target the previous snapshot and preserves existing data on failure. Public pages do not fetch Goodreads.

Manual refresh uses either a privately held RSS file or GOODREADS_RSS_URL, with no credentials or account changes:

```sh
node scripts/refresh-reading-feed.mjs --input-private-file "$PRIVATE_RSS_FILE" --checked-at YYYY-MM-DD
```

Review the resulting reading-feed.draft.json and reading-feed.diff.json before replacing the public snapshot in a new reviewed commit. Do not commit raw RSS, the source URL, screenshots, profile/review links or activity metadata.

Focused validation: 28 tests pass, covering XML/HTML/privacy/limits/timeout/stale handling, draft-only writes, exact companion matching, thematic assignment, no-JavaScript fallback and keyboard-oriented control behavior. An offline replay reproduced 87 records with zero metadata differences. Full build:bare, agent/publishing audits and compiled-output guards run in the scoped nondeploy CI workflow. Browser evidence and independent review are recorded separately at the final reviewed head.

Copyright limits: no book text, quotations or publisher covers are reproduced. Current works, adaptations, apparatus and summaries retain separate rights. Allen/Wattles Gutenberg routes carry their specific U.S. qualification. Hill's online 1938 text uses the host's attributed nonrenewal determination; this does not make every 1937 or modern edition free. The Law of Success route is a verified university-library directory; its underlying scan was not inspected. Original artwork is an imagined scene, not an official cover, historical record, author artwork or endorsement.

No checkout, stock, price, fulfillment, affiliate, purchase, outreach, subscription, auto-sync, new credential or deployment is added.
