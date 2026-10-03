# Manual reading-feed refresh

The checked public snapshot contains 87 distinct Goodreads book IDs, titles, authors, and canonical book-catalog URLs. It is a manually reviewed RSS snapshot, not a complete account scan. No account name, profile/feed URL, review, rating, activity date, description, or cover URL is published.

The importer uses `saxes` 6.0.0 for XML and `parse5` 7.3.0 for inert HTML-to-text conversion. Declare both as direct dependencies when integrating these files. Neither parser executes content or fetches resources.

Run manually from the repository root, using an already authorized private `GOODREADS_RSS_URL` environment value:

```sh
node scripts/refresh-reading-feed.mjs
node --test tests/reading-feed.test.mjs
```

Alternatively, read an authorized RSS file held outside the public repository:

```sh
node scripts/refresh-reading-feed.mjs --input-private-file /private/path/feed.xml
```

The source allowlist accepts HTTPS Goodreads `/review/list_rss/<numeric ID>`, `shelf=ALL` or encoded `#ALL#`, and bounded normal pagination/sorting parameters. It rejects credentials, key parameters, other hosts, paths, shelves, fragments, arbitrary query parameters, and redirects. A 15-second deadline covers the request and streamed response; input is capped at 2 MiB, 1,000 records, depth 32, 512 title characters, and 256 author characters. DTD/entity declarations and undeclared custom XML entities are rejected; ordinary XML escapes remain supported.

Successful refreshes produce `src/data/reading-feed.draft.json` and `src/data/reading-feed.diff.json`, containing only public book metadata. The draft requires human review before integration. The previous `src/data/reading-feed.json` is never overwritten by this command. Failures preserve previous outputs and report a static `stale` or `error` status without raw parser, network, or private-source details.

There is no scheduler, automatic pagination/account scan, browser fetch, persistence, or publication step. Keep the source URL and raw RSS private.
