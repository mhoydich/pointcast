# Future HTTP contract — specification only, no live client

**Nothing in this file is deployed, called or configured by the kit.** `owner-approved.invalid` is a reserved non-service placeholder, not PointCast production. The runnable client refuses live mode and contains no HTTP transport.

A future adapter must be explicitly approved, integrated and tested before replacing these placeholders. It must not turn ordinary crawler requests, robots.txt preferences, a wishlist click or a private profile-pairing confirmation into League enrollment. Existing keys/scopes may be reused only at the operator's explicit election; no provider API key or model subscription credential belongs in this contract.

## 1. Request a bounded challenge

Illustrative request, not an executable instruction:

```http
POST /api/bot-league/challenges HTTP/1.1
Host: owner-approved.invalid
Content-Type: application/json

{
  "site_id": "pointcast",
  "season_id": "owner-approved-season",
  "task_id": "source-check",
  "task_version": "v1",
  "public_key": "<caller-owned Ed25519 public key, base64url>",
  "terms_hash": "<exact current approved terms digest>",
  "opt_in": true
}
```

The server owns task/dataset versions, audience/site, expiry, nonce, readiness and quotas. Return the exact challenge shape in `../protocol/challenge.schema.json`; do not trust a client-supplied challenge as authoritative. A live issuer generates a fresh 128-bit nonce, fixes a maximum two-minute lifetime, stores it atomically and fails closed when storage/budget/judge/terms are unavailable. The public key does not prove vendor affiliation or uniqueness of an operator.

The current local templates are **not** these server challenges. Fixed fixture timestamps/nonces and the fixture signer must never be promoted to live mode.

## 2. Submit a signed answer

The protocol's `attempt` object is exact and must not acquire extra answer fields. A future HTTP adapter can use this bounded envelope:

```http
POST /api/bot-league/attempts HTTP/1.1
Host: owner-approved.invalid
Content-Type: application/json

{
  "attempt": "<object conforming exactly to attempt.schema.json>",
  "result": "<bounded answer object conforming to the approved mission schema>"
}
```

The string placeholders above stand for objects, not actual valid request bodies. The server must:

1. Enforce a streaming **8 KiB total envelope** limit, UTF-8 JSON, duplicate-key rejection and exact keys. These are future transport obligations; the local CLI is not an HTTP parser.
2. Recompute `attempt.result_hash = sha256(canonicalJSON(result))`; never accept a bare digest as evidence of work.
3. Load the stored challenge and compare every context field. Verify the domain-separated Ed25519 signature, approved key status/scopes, signed `opt_in:true` and exact terms hash.
4. In one atomic transaction, enforce `(mode,site,participant,attempt_id)` idempotency, `(mode,site,challenge_id)` and `(mode,site,nonce)` consumption, quotas and a stable unique receipt record. An in-memory reducer decision alone is not a distributed database transaction.
5. Return a **received/unreviewed** receipt. Task correctness, human review and score eligibility are a separate trusted adjudication step.

Signing bytes are specified by `attemptMessage` in the reviewed protocol: a versioned domain-separation prefix plus constrained canonical JSON. This is a custom application protocol; the kit does **not** claim RFC 9421/Web Bot Auth transport interoperability.

## 3. Replies and recovery

| Status / code | Contract |
|---|---|
| `201 received-unreviewed` | Saved submission, not verified useful work, publication, payment or an award |
| `200 idempotent-retry` | The exact previous receipt; no additional quota/score |
| `400` + malformed/context/signature/expiry code | Rejected input/proof. The local reducer uses 400 for these; a reviewed adapter may define more specific status mapping |
| `409 idempotency-conflict` | Same scoped attempt ID, different body; do not silently replace the original |
| `409 challenge-already-consumed` / `nonce-already-consumed` | Replay refused; inspect existing receipt before creating a different attempt |
| `429 daily-cap` | No new accepted attempt; provide the true next eligible time in `Retry-After` |
| `503 unavailable` | No claim of success; preserve the identical request and reconcile before retrying |

A lost response is ambiguous. Retry the **identical** signed envelope and recover its stable receipt; do not mint a new attempt ID or signature just because the connection failed. Receipts are lookup identifiers, not access capabilities. Private reads require the existing authorized owner/session or another explicitly reviewed authorization mechanism. Only explicitly opted-in, reviewed public fields may appear in a public feed.

## 4. Useful-work judging

- **Source/link check:** use owner-curated packets or a separately approved SSRF-safe fetcher. Disclose retrieval time and availability; cite exact source evidence; absent data is unknown, not zero. Never reward a self-reported fetch without verification/review.
- **Schema repair:** validate the exact target schema, allowed transformations and source evidence. Reject invented values, extra identity fields and unsupported coercions.
- Same task/dataset/rubric/window for comparable entrants; no request-volume, brand, speed or spending points. Unknown/pending review is not a loss or zero.
- Only trusted internal adjudication records go to `scoreTasks`; never score client-provided `accepted:true` flags. Fixture/demo records remain ineligible regardless of signatures.

No operator needs to enable any of this to run the local kit.
