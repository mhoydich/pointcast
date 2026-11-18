# Loom post and reply observations

`normalizeLoomEvents({rooms, now=Date.now(), maxAgeMs=120000})` is a pure,
standalone adapter for the shared `pointcast.office-data/v1` envelopes. No
network, timers, UI, credentials, sibling imports, or production wiring.

Provenance is the caller's successful Loom reader envelope, with a PointCast
Loom source URL matching the room address or room/message receipt. This does
not authenticate an arbitrary caller's objects. Production must supply real
reader results; test fixtures must never be used as a fallback. Records use
Loom's actual `id`, `at`, `from`, `parent` and `via` fields. Their shape was
checked against `src/lib/loom/service.mjs` and the declaration readback.

Only fresh successful reads contribute records. IDs must match current Loom
message IDs (`m_` plus ten lowercase alphanumeric characters), and room keys
must be 24 lowercase hex characters. Timestamps must be real UTC ISO dates,
not future dates, including relative to the source observation. Messages older
than the freshness window are retained internally as ancestry context only,
never emitted as events or unresolved replies. A fresh reply to an observed
older parent can therefore emit its real reply edge without making that parent
fresh activity. The parent must still pass every other validation rule. Echoes (`via` or
explicit `echo`), hidden records, seed IDs and Collator/robot notices are
ignored. Nothing infers execution, worker eligibility or approval from posts.
Sender handles are retained only from valid `from.address` handles; otherwise
`handle` is null. Public sender identity remains unverified.

Event IDs are `roomKey#messageId`; deduplication uses exactly that pair across
reads. A conflicting duplicate is excluded rather than choosing an arbitrary
version. `parentId` retains the raw Loom parent message ID and is scoped to
`roomKey`. `unresolvedReplies` contains the same event shape as `events`, but
holds actual replies whose ancestry cannot reach an observed root in that
room. Missing parents, cycles, future parents and filtered parents never create
synthetic roots or edges. Consumers must not draw unresolved edges. Original
message bodies, URLs embedded in messages and upstream errors are not copied.

The adapter caps input at 64 feeds and 2,000 messages per feed. Errors are fixed
codes. An invalid/failed feed makes aggregate state `error`; stale feeds make
it `stale`, even if another feed supplies valid records. Such partial records
are observations only; consumers must honor the aggregate state. With no
resolved events the state is `idle`, or `stale` when old messages were omitted.
`observedAt` is the oldest accepted read time, not normalization time or proof
of a new post. Aggregate `sourceUrl` is null for multiple distinct sources;
every event has its own fixed PointCast receipt URL.

Run `node --test tests/office/astra-4.test.mjs`. All fixtures are synthetic and
labelled test-only. No full site build or live activity rendering was tested.

Contract: https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_505c2g1l6b

Status: READY FOR TERRA REVIEW. Final cycle 3 fixes fresh replies to older
parents. Cycle 2 followed a cycle 1 declaration transport failure before repo work. This branch does not merge, deploy, or change PR1724.

## Parent-owned integration amendment

`data.parentContext` is an additive array, always present (including empty/error
results). It contains only validated older immediate parents needed by resolved
fresh reply events, deduplicated by room-qualified ID. Each entry is
`{id, roomKey, messageId, handle, at, sourceUrl, contextOnly: true}`. Original
source time/link are preserved; no event `type` is provided. Unrelated history,
unresolved ancestry, invalid/conflicting parents and stale/failed feeds are not
exported as context. Older ancestors still resolve internally, but only the
immediate edge target is exported. This does not authenticate sender handles.

Integration usage (Sid owns projection and rendering):

```js
const lookup = new Map([
  ...observed.data.events,
  ...(observed.data.parentContext ?? []),
].map(record => [record.id, record]));
const edges = observed.data.events.filter(e => e.type === 'reply').flatMap(e => {
  const parent = lookup.get(`${e.roomKey}#${e.parentId}`);
  return eligible.has(e.handle) && parent && eligible.has(parent.handle)
    ? [{ id: e.id, parentId: e.parentId, fromHandle: e.handle,
         toHandle: parent.handle, sourceUrl: e.sourceUrl }]
    : [];
});
```

Use `events` alone for activity counts, desk last-seen/light state, arrival IDs,
and chimes. Never concatenate context into that activity stream. Context may
locate an edge target but does not light its desk or refresh its timestamp.
Recompute/drop edges with the fresh event snapshot and expiry rules; never cache
context as current activity. Parent context is not an independent execution or
approval signal. The adapter now has 16 passing focused tests. These include a
projection-shaped lookup test, not an assembled browser/source-to-screen claim;
Sid's refreshed integration and independent review remain required.
