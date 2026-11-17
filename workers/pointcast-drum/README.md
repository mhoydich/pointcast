# pointcast-drum

Standalone Cloudflare Worker for PointCast's realtime drum rooms. The Pages
project forwards `/api/drum/room` to this Worker through a Durable Object
binding.

## Current room contract

- One `DrumRoomV2` SQLite-backed Durable Object per normalized invite code.
- WebSocket Hibernation API, so idle connected rooms can sleep without
  dropping their visitors.
- Target: 100 visitors in one room. Safety ceiling: 125.
- Client frame ceiling: 512 bytes.
- Per-connection limit: 8 frames/second; room burst guard: 300 frames/second.
- Persisted room total and the latest 24 hits; presence stays ephemeral and
  anonymous.
- `welcome`, `presence`, `hit`, `reaction`, `pong`, and bounded error events.

The legacy `DrumRoom` export remains during the two-deploy transition so the
old Pages binding keeps working until Pages switches to `DrumRoomV2`.

## Verify

```bash
npm install
npm run verify
```

`npm run verify` checks generated bindings, strict TypeScript, Workers-runtime
tests (including 100 simultaneous sockets), and a Wrangler dry run.

For a running Worker:

```bash
node ../../scripts/load-drum-room.mjs \
  'ws://127.0.0.1:8787/?room=hundred-live' \
  --clients=100 --hold-ms=5000
```

## Deployment order

1. Deploy this Worker: `npm run deploy`.
2. Build PointCast and deploy Pages with the root binding set to
   `class_name = "DrumRoomV2"` and `script_name = "pointcast-drum"`.
3. Verify a real WebSocket welcome/fan-out and the Pages stats endpoint.
4. Run the 100-client harness against the immutable Pages deployment URL.

The order preserves the legacy class while Pages changes bindings, avoiding a
realtime outage during rollout.

## Chain room attestation (review patch; disabled by default)

This patch adds `GET/POST /api/drum/attest?room=<room>` and an authenticated
WebSocket at `/api/drum/chain-room?room=<room>`. Pages proxies both through the
`DRUM_ATTEST_WORKER` service binding. Anonymous existing rooms are separate and
never supply chain evidence. **No existing frontend calls these endpoints yet.**
This is endpoint infrastructure for review, not a completed room-only production
launch or passkey/device-pass integration.

Only direct **tz1 Ed25519 keys** work in this first route. A claimed address is
never trusted: the room derives tz1 from the key after verifying its proof.
`pcp1` controllers, device passes, tz2 keys and wallet-message mode fail closed.
They need a separate chain-key/controller-proof integration before launch.
Room attestation proves server-observed authenticated key activity; it does not
prove a person played, prevent Sybil keys, or certify the musical composition
named by the caller's `beat_hash`.

Client protocol (native/raw signatures only):

1. Open the chain-room WebSocket. Its challenge includes the pinned chain ID,
   genesis, room, a random one-connection nonce, expiry and a 32-byte digest.
   Rebuild the digest locally using `joinDigest` in `src/attest.ts`; never sign
   an unexplained remote digest. The join proof opts this identity into this
   room server witnessing its played intervals on this chain.
2. Sign that digest with Ed25519 and send
   `{v:1,type:"auth",public_key:<64 hex>,signature:<128 hex>}`. The returned
   `authenticated.player` is the derived tz1. Challenges expire in 60 seconds;
   socket authorization expires in 30 minutes.
3. Send the existing v1 hit frames with strictly increasing `seq`. Accepted hits
   return server timestamps. The room stores at most one observation per player
   per second, and never accepts a client-supplied player or timestamp as evidence.
4. Build the chain-core claim `{chain_id,genesis,sender,nonce,room,players,
   beat_hash,duration,ended_at_ms}`. Players must be sorted, unique direct tz1
   identities, and include the sender. Submit it with the sender's `public_key`
   and `request_signature` over locally rebuilt `requestDigest(claim)`.
   Every other listed player must supply the same exact-claim proof in
   `player_proofs: [{public_key,request_signature}, ...]`, ordered by their
   derived player address. Without each player's consent nothing is consumed.
   The HTTP proof uses the separate `pointcast-chain/drum-request/v1` tag,
   binding the exact canonical claim; join/room signatures cannot substitute.
5. A successful response is `{attestor,signature,room_digest}`. Set the
   transaction's `room_sig` to `{attestor,signature}`; sign/submit the actual
   transaction separately. This endpoint neither signs a player's transaction
   nor submits to a chain.

The route accepts 10–300 second intervals ending within the preceding 5 minutes.
Every player needs two server observations spanning the interval with at most
one second of tolerance. SQLite atomically reserves each played interval and
sender nonce **after** validating every player's exact-claim consent proof. Identical
retries return the same persisted receipt; changed claims at the same nonce or
overlapping intervals fail. Evidence/receipts survive hibernation, expire after
10 minutes, and are pruned by alarms and traffic. Request bodies are bounded to
16 KiB; rooms have 64 socket slots, a 30/minute per-ingress-IP budget, separate
120/minute authorized signing and upgrade budgets, 120 auth proofs/minute,
480 accepted hit frames/minute per derived player, and 18,000 accepted frames/minute
per room (300/second average). Shared or player-budget exhaustion throttles frames
without closing unrelated clients. 64 slots support a room playing below this
aggregate ceiling; this is not a guarantee of 64 clients each sending at 8/second.
Ingress buckets expire in 10 minutes and are capped at 2,048 entries per room. Idle/expired sockets are closed by alarms.

Operator release steps (not executed by this patch):

- Obtain Mike's main-merge approval after review.
- **Mike controls key custody:** create a fresh dedicated room-attestor Ed25519
  seed in a secret manager and install `DRUM_ATTESTOR_SK` via the secure Wrangler
  prompt. Never use any committed test fixture, personal wallet, or anchor key.
- Set `DRUM_ATTEST_CHAIN_ID`, `DRUM_ATTEST_GENESIS` and comma-separated
  `DRUM_ATTEST_ROOMS` to the deliberately approved chain and rooms. Their empty
  committed defaults return 503. DO names bind chain ID + genesis + room so
  changing the domain cannot re-use observations from the prior chain.
- Deploy the standalone drum Worker first (v4 SQLite namespace migration), then
  deploy Pages through `scripts/deploy.sh`. Register the public key from the
  attestation GET response in genesis or the approved `set_drum_attestors` call.
- Finish the frontend and controller/passkey proof integration, verify real
  wallet participation, and prove the launch profile separately.

Tests match the independent chain-core Rust session/room/signature vectors and
exercise raw socket identity, observed activity, hibernation, request proof,
claim tampering, interval/nonce reuse, concurrent reservations and bounded input
in the local Workers runtime. Public fixtures in Vitest config are test-only.
