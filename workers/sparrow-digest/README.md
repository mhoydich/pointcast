# sparrow-digest · cron worker

Weekly HTML email digest of `/sparrow/signals` for subscribers captured by the Pages Function at `functions/api/sparrow/digest-subscribe.ts`.

Separate from the main pointcast.xyz Pages project so a cron schedule + `[[kv_namespaces]]` binding don't leak into the site build.

## Deploy (when ready)

```bash
cd workers/sparrow-digest

# 1. Create the shared KV namespace (first time only).
npx wrangler kv:namespace create SPARROW_DIGEST_KV
# → prints an ID. Paste it into wrangler.toml in place of
#   REPLACE_ME_WITH_KV_ID.

# 2. Bind the same KV to the Pages project so /api/sparrow/digest-subscribe
#    writes to it. In the Cloudflare dashboard:
#      Pages → pointcast → Settings → Functions → KV namespace bindings
#      variable name: SPARROW_DIGEST_KV
#      namespace:     <ID from step 1>

# 3. Deploy the cron worker.
npx wrangler deploy
```

## MailChannels

The worker sends via MailChannels. No API key required from a Cloudflare Workers runtime **if** the sending domain's DNS has:

- `TXT _mailchannels.pointcast.xyz "v=mc1 cfid=<account>.workers.dev"`
- A working DKIM record for MailChannels on the sending address
- DMARC set to at least `p=none`

Without those, MailChannels will 403. The scaffold still runs, it just can't actually send.

## What's in v0.33 vs v0.34

**Shipped in v0.33 (this scaffold):**

- `scheduled(event, env, ctx)` handler.
- KV list + JSON parse + `isDue` frequency gate (weekly/biweekly/monthly).
- MailChannels transport.
- `/dry-run` fetch route for testing.
- Placeholder HTML + text email body pointing at `/sparrow/signals`.

**Landing in v0.34:**

- Nostr WebSocket client (port from `sparrow-app/Sources/SparrowApp/NostrRelayClient.swift`).
- Signals aggregation logic mirroring `src/pages/sparrow/signals.astro`: top co-saved blocks, recent adds, channel distribution.
- Block-lookup prefetch (one-time hydrate of `{ [id]: {title, channel} }` into KV so we don't fetch 300+ `/b/<id>.json` every cron tick).
- HMAC-SHA256 unsubscribe token so the footer link in each email can hit `DELETE /api/sparrow/digest-subscribe` with `x-unsub-token` and complete without a web login.
- Failure-aware retry with jitter.

## Philosophy

The worker never holds secret material. Each subscriber's email + npub + relay list is what makes it into KV; the worker re-aggregates the signals bundle at send time by subscribing to the same public Nostr relay pool the web Sparrow uses. If a subscriber rotates their npub or changes relays, a fresh POST to `/api/sparrow/digest-subscribe` overwrites the record.
