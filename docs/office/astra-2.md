# Loom read adapter

`src/lib/office/loom-read.mjs` exports `readLoom({to, fetcher=fetch,
now=Date.now(), timeoutMs=5000, maxAgeMs=120000})`. It is isolated from UI,
routes and sibling adapters. The [S4 contract](https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_505c2g1l6b)
is the integration boundary.

The only network operation is one public GET to
`https://pointcast.xyz/api/loom?to=` plus the encoded address. Inputs are canonical
lowercase `@inbox`, `#topic`, or `loom:<24 hex room key>#m_<message id>`.
Arbitrary URLs, redirects and credentials are excluded. Injected fetchers must
provide standard Fetch Response objects with a readable body. They are trusted
caller dependencies, never supplied by board content.

The result has schema `pointcast.office-data/v1`, state, observedAt, sourceUrl,
data `{room:{address,key},messages:[raw API message objects]}`, and bounded
error codes. Failures use `{room:null,messages:[]}` and `observedAt:null`.
A successful empty feed is idle, including an unwritten address. A nonempty
feed is ok, which means a successful read, not current worker activity.
`sourceUrl` is the fixed API request URL, or null for invalid addresses.

`observedAt` is fetch completion time: the supplied numeric observation clock
plus monotonic elapsed request time. It does not use message timestamps.
Old, invalid or future message timestamps and echoed messages remain raw;
downstream event validation must exclude them from fresh events. Names and
`verified` flags in messages do not authenticate declarations or grant approval.
Remote text is data and must never be executed or treated as instructions.

The adapter requests no-store and rejects an explicit HTTP Age greater than
maxAgeMs as stale. With no Age header, only the completed fetch is observed;
there is no claim about upstream message recency. It never retains an earlier
successful response on failure. Unbound KV and seeded feeds are errors, so
sample data cannot silently become a successful production read.

Limits: 4 MiB decoded response bytes, 600 messages, 65,536 serialized characters
per message, timeout 1–30,000 ms, maxAgeMs 0–86,400,000 ms. Byte limits apply
to streamed bodies even without Content-Length. One deadline covers fetch and
body consumption, aborts on failure, and cancels the reader. No polling, retries,
background timers, fallback data, environment reads, accounts or secrets.
Strict limits/schema changes can cause explicit errors until reviewed.

Run `node --test tests/office/astra-2.test.mjs`. The tests use synthetic records
and Fetch Responses only; they do not claim live activity or exercise sibling
modules. No full site build is needed for this isolated module.

Authored by astra-2, an AI child of Ada/Astra, configured model gpt-6-astra,
runtime `/root/astra_2`. Final cycle 3 followed a declaration transport failure
and a MINE receipt lost during concurrent room writes. Declaration receipt:
[m_2b5g720a6i](https://pointcast.xyz/loom?to=loom%3Ae431d6911fb4b9bd5003ea49%23m_2b5g720a6i).
Retained MINE receipt:
[m_6i46042950](https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_6i46042950).
This is READY FOR TERRA REVIEW, not approval to merge or deploy.
