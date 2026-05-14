# Outbound bridges — distributing PointCast signals to the open web

PointCast publishes its canonical event stream at `/signal-feed.json`. Three bridge endpoints re-publish that stream in formats other networks already consume, so the broadcast reaches subscribers beyond the webring without anyone learning the PointCast contract.

## The three bridges

| Endpoint | Format | Consumed by |
|----------|--------|-------------|
| **`/signal-feed.atom.xml`** | Atom 1.0 | Any RSS/Atom reader (Feedly, NetNewsWire, Inoreader, …) |
| **`/signal-feed.bsky.json`** | Pre-formatted `app.bsky.feed.post` records | A cron worker that POSTs to `com.atproto.repo.createRecord` |
| **`/signal-feed.farcaster.json`** | Pre-formatted hub-API casts | A cron worker that calls `submitMessage` on a hub |

All three are built from the same `SignalEvent` stream so the content is identical across networks; only the wire format differs.

## Why payloads-as-files instead of an inline posting client

1. **Auth.** Bluesky and Farcaster both need credentials that pointcast.xyz (a static site) can't safely hold.
2. **Idempotency.** A file-based payload + a cron worker can dedupe against already-posted state on the worker side (worker maintains a small KV of `eventId → postedAt`).
3. **Auditable.** The payloads are checked into the deployed site, so anyone can see exactly what got bridged outward.

The bridge endpoints are pure pipes. The worker is the thing that authenticates and posts.

## Worker spec

A worker is any process (Cloudflare Worker, GitHub Action cron, a small node script) that:

1. Polls one of the bridge endpoints every N minutes.
2. Loads its own `postedEventIds` set from persistent storage (KV, Redis, a file).
3. Iterates new entries (where `eventId not in postedEventIds`).
4. Submits each to the partner network.
5. On success, adds `eventId` to `postedEventIds`.

### Bluesky worker (TypeScript sketch)

```ts
import { BskyAgent } from '@atproto/api';

const agent = new BskyAgent({ service: 'https://bsky.social' });
await agent.login({ identifier: env.BSKY_HANDLE, password: env.BSKY_APP_PASSWORD });

const res = await fetch('https://pointcast.xyz/signal-feed.bsky.json');
const { records } = await res.json();

const seen = await KV.get('bsky:postedEventIds');
const seenSet = new Set(seen ? JSON.parse(seen) : []);

for (const { eventId, record } of records) {
  if (seenSet.has(eventId)) continue;
  await agent.api.com.atproto.repo.createRecord({
    repo: agent.session!.did,
    collection: 'app.bsky.feed.post',
    record,
  });
  seenSet.add(eventId);
}
await KV.put('bsky:postedEventIds', JSON.stringify([...seenSet]));
```

### Farcaster worker (TypeScript sketch)

```ts
import { makeCastAdd, NobleEd25519Signer } from '@farcaster/hub-nodejs';

const signer = new NobleEd25519Signer(privateKeyBytes);
const FID = 12345; // your Farcaster FID

const res = await fetch('https://pointcast.xyz/signal-feed.farcaster.json');
const { casts } = await res.json();

const seen = await KV.get('fc:postedEventIds');
const seenSet = new Set(seen ? JSON.parse(seen) : []);

for (const { eventId, cast } of casts) {
  if (seenSet.has(eventId)) continue;
  const msg = await makeCastAdd(cast, { fid: FID, network: 1 }, signer);
  await hubClient.submitMessage(msg.value);
  seenSet.add(eventId);
}
await KV.put('fc:postedEventIds', JSON.stringify([...seenSet]));
```

## Cadence

Bridge endpoints update every time pointcast.xyz rebuilds (every PR merge, roughly). A worker polling every 15–30 minutes is fine — events are typically less than that frequency.

## Filtering

`bridgeableEvents()` in `src/lib/bridges.ts` drops `presence_change` kinds (too chatty for a public feed). To add filtering — say, only `block_published` + `ship_landed` — edit the bridge endpoint to apply additional filters.

## Inbound (not yet)

Reverse direction — pulling Bluesky replies or Farcaster reactions back into the PointCast feed — is a future sprint. The signal contract already has `verb_fired` and `presence_change` kinds that could carry these.

## Codex handoff

The worker side of this is a separate concern from the static-site PR. The brief for Codex:

> Implement two cron workers (Cloudflare Workers or Node scripts) that consume `/signal-feed.bsky.json` and `/signal-feed.farcaster.json` and post to their respective networks. Auth credentials in env vars. Dedupe via KV. Run every 20 minutes. Log each post + each dedupe-skip for observability.

Worker code lives outside this repo (`pointcast-bridges` GitHub repo or similar). When ready, document the worker repo URL in a follow-up PR here.
