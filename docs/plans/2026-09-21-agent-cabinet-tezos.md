# Agent Cabinet Tezos release runbook

**Status:** implementation prepared for review. No production migration, deployment,
wallet request, signature, mint, payment, or NFT delivery was performed by this
change.

## Fixed publication

PointCast prepared three deterministic SVG objects and content-addressed TZIP-21
metadata for token IDs 10-12 in the existing mainnet FA2
`KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb`. The proposed operation registers those
three tokens and mints 27 editions of each (81 total) directly to the reviewed
inventory recipient. PointCast is the publisher. Codex, cc, and Manus are
proposed resident associations; resident authorship and publication authorization
remain unverified.

The checked-in publication record is deliberately `prepared-only`,
`mainnetApproved: false`, `requestable: false`, with no operation hash. The admin
review page can produce one short-lived, digest-bound wallet request only after a
fresh chain/file/fee review, exact typed acknowledgement, and a separate button.
The wallet remains the final authority.

## Agent collection contract

An external agent does not need a PointCast account. A registered `pci_` identity
is optional attribution and grants neither spend authority nor wallet control.
The EVM payer and Tezos recipient are intentionally independent.

1. Read `/x402/collect.json` and choose an offer.
2. `POST /api/agent-cabinet/challenge` with `{offer,recipient}` and a fresh,
   stable `Idempotency-Key`.
3. Have that Tezos wallet sign the returned Micheline `payload`. This signature
   spends no tez and approves only the pinned recipient, FA2 token, artifact,
   metadata, x402 terms, nonce, and five-minute window.
4. `POST /api/agent-cabinet/collect` with the same key and
   `{offer,recipient,challengeId,publicKey,signature}`, without
   `Payment-Signature`, to verify the wallet and obtain the x402 402 quote.
5. After the payer's explicit spend approval, replay the exact POST with the
   x402 `Payment-Signature`. A 202 `payment-settled` response is durable and does
   not yet initiate Tezos delivery.
6. Follow the returned `intent.next` state. While its action is
   `resume-delivery`, replay the exact collect POST with the same key and body,
   omitting the payment header and honoring `retryAfterSeconds` or
   `Retry-After`. A settled intent never submits payment again. More than one
   replay may be needed while another delivery owns the sponsor counter lock.
7. When `intent.next.action` becomes `poll-status`, poll the returned
   `/api/agent-cabinet/status?id=<intentId>` URL. Completion requires the
   recorded x402 settlement plus the exact sponsor-to-recipient FA2 movement
   observed with at least two Tezos confirmations. GET status never pays,
   acquires the signer lock, prepares, signs, or injects. Stop automatic retries
   for `operator-payment-reconciliation` or `operator-review`.

The x402 receipt and Tezos operation are independently verifiable proofs. This
flow does not create a combined countersigned completion receipt.

The payment signer is intentionally pinned to
`pointcast.bubbletez-permit2-exact/v1`: Permit2 at
`0x000000000022D473030F116dDEE9F6B43aC78BA3`, spender
`0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E`, and witness
`Witness(address to,uint256 validAfter,bytes extra)`. This is a
facilitator-specific BubbleTez/TZ APAC profile, not the current generic x402
Permit2 typed-data profile. A generic signer must refuse it unless it explicitly
implements that named profile.

If optional `PointCast-Agent-*` attribution is used, use the same active
registered identity on challenge and collect through payment settlement.
Otherwise omit those headers through settlement. An exact already-paid delivery
replay may omit attribution so later key expiry or revocation cannot strand the
wallet-approved recipient.

## Release order

1. Review and merge one frozen source revision. Run the offline artifact checks,
   focused API/publication tests, and a complete production build from that SHA.
2. Apply `migrations/auth/0021_agent_cabinet.sql` to the existing production
   `AUTH_DB` **before deploying the Functions change**. It creates the Cabinet
   intent ledger, sanitized payment-attempt and signed-settlement evidence, and
   shared `tezos_sponsor_locks` table. Compatibility triggers
   mirror Other Worlds' legacy lock into the shared table in both directions,
   so an old and new Worker cannot concurrently own the same sponsor counter
   during rollout. Verify old-writer insert/delete, new-writer insert/delete,
   and conflicting insert behavior before continuing.
3. Deploy static artifacts, UI, and Functions with both Cabinet launch gates
   absent or false. Confirm the canonical artifact and metadata response bytes
   match the checked-in SHA-256 values.
4. Open `/admin/agent-cabinet`, run the fresh read-only review, inspect the
   existing “El Segundo” collection context, exact token IDs, quantities,
   destination, hashes, and maximum setup cost. Only the human administrator may
   enter the acknowledgement and approve the wallet operation.
5. After at least two confirmations, independently verify the applied operation,
   token metadata pointers and hashes, supply 27, and inventory balance 27 for
   every token. Do not rely only on the submitting wallet's success message.
6. Commit the verified publication receipt to
   `src/data/agent-cabinet-verified-publication.json`: minted status, operation
   hash, level, verification time, publisher authorization, and per-token
   metadata hash, artifact hash, total supply, sponsor balance, and confirmation
   evidence. The unsigned plan remains unchanged. Static catalog state and API
   enablement share this exact overlay, so an environment-only record cannot
   open a hidden paid API. Deploy that reviewed source while collection remains
   operationally disabled.
7. Revalidate the facilitator immediately before launch. Its `/supported`
   response must still advertise x402 v2 `exact` on `eip155:42793`, and a
   non-funded fixture or explicitly approved small end-to-end test must prove
   the exact named spender/witness profile. `/supported` alone does not prove
   typed-data compatibility. Record the review, then set
   `AGENT_CABINET_X402_PROFILE_APPROVED` to the exact profile identifier.
8. Configure the existing x402 receipt signer/payee settings plus the Cabinet
   variables below. Store the Tezos sponsor key only as a Cloudflare secret; do
   not put it in files, shell history, chat, or logs. Enable the two literal
   launch gates last. Before enabling, confirm both sponsor-lock tables agree
   and there is no unresolved or stale Other Worlds `preparing`, `signed`, or
   `submitted` claim holding the shared sponsor address.
9. Probe `GET /api/agent-cabinet/status` for `phase: open`, then perform one
   explicitly approved real collection using the seven-step contract above.
   Independently verify settlement, transfer, recipient holding, and rejection
   of a second collection of the same offer by that wallet.

Do not roll application code back across migration 0021 after a Cabinet intent
or shared lock exists. First disable both Cabinet launch gates, reconcile every
row and both lock tables, and prepare a reviewed compatibility rollback. The
triggers protect mixed-version deployment; they are not authorization for a
blind code rollback.

The migration command for the configured database is:

```sh
npx wrangler d1 migrations apply pointcast-auth --remote --config wrangler.toml
```

## Required runtime configuration

| Setting | Boundary |
| --- | --- |
| `AUTH_DB` | Existing PointCast D1 binding with migration 0021 applied |
| `AGENT_CABINET_ENABLED` | Literal `true`, set only at final activation |
| `AGENT_CABINET_MAINNET_APPROVED` | Literal `true` after explicit mainnet and spend approval |
| `AGENT_CABINET_X402_PROFILE_APPROVED` | Exact `pointcast.bubbletez-permit2-exact/v1`, set only after the facilitator compatibility review |
| `AGENT_CABINET_PUBLICATION_JSON` | Exact byte-for-byte semantic copy of the committed verified-publication overlay; environment-only publication drift fails closed |
| `AGENT_CABINET_SPONSOR_ADDRESS` | Exact verified inventory holder |
| `AGENT_CABINET_SPONSOR_SECRET_KEY` | Cloudflare secret deriving to that holder |
| `AGENT_CABINET_RPC_URL` | Credential-free HTTPS Tezos mainnet RPC |
| `AGENT_CABINET_MAX_OPERATION_MUTEZ` | Explicit maximum fee plus storage burn for one delivery |
| `AGENT_CABINET_TOTAL_BUDGET_MUTEZ` | Explicit ceiling across all reserved Cabinet delivery costs |
| existing `X402_*` settings | Must equal the checked-in one-cent USDC Etherlink terms; drift disables the Cabinet |

## Failure and recovery rules

- A quote does not reserve an edition. Capacity is atomically reserved just
  before a locally validated payment reaches the facilitator. The same atomic
  transition reserves the configured per-operation Tezos cost ceiling against
  the total sponsor budget; a buyer cannot pay for unfunded delivery capacity.
- Every paid invocation also owns a fresh server-generated attempt ID. Even
  when two concurrent retries carry the identical `Payment-Signature`, only
  the invocation that acquired that exact attempt may roll back a locally
  proven pre-submission failure; the losing retry cannot release the winner's
  edition or budget reservation.
- An ambiguous payment keeps its edition and must not be submitted again until
  the EVM result is reconciled by an operator. GET status cannot determine that
  outcome and the client must not automatically resubmit it.
- A canonical `settlement_pending` response is journaled before any later
  receipt work. Status preserves its facilitator transaction hash and network,
  but this is operator-only reconciliation evidence, not permission for a
  client or agent to resubmit the payment.
- The reservation stores a semantic owner/nonce hash and a sanitized Permit2
  summary, never the raw `Payment-Signature`. Equivalent base64 or JSON
  encodings therefore cannot reserve two intents.
- Once a locally signed settlement receipt exists, it is staged durably before
  the final settled transition. A later POST or GET can finish that transition
  without another facilitator call. Split-analytics failure does not erase the
  payment proof or cause a second charge. The signed receipt is also returned
  directly to the caller and remains addressable by transaction hash.
- Launch-gate, catalog, payee, or future budget changes stop new sales but do
  not rewrite or strand an already-paid delivery. Its immutable row remains the
  authority; the current RPC and the secret for its pinned sponsor are still
  operational prerequisites if signing has not occurred.
- Tezos signed bytes, deterministic operation hash, and maximum cost are stored
  before injection. A broadcast-uncertain operation is never automatically
  re-signed or re-injected.
- The sponsor manager-counter lock is shared with Other Worlds. Do not clear a
  lock, delete an intent, or refund its capacity merely to make a retry proceed.
- Either rail may perform read-only confirmation of the other rail's exact
  stored operation hash and release a confirmed or definitively failed holder;
  this does not depend on that holder's launch gate, current catalog, or signer
  secret.
- Monitor both rails as one queue. A persistent Other Worlds `preparing` row
  requires the existing operator recovery procedure before Cabinet activation;
  Cabinet must never work around or expire that counter lock.
- A paid but failed or unresolved delivery remains explicitly
  `paid-undelivered` or `delivery-uncertain` for operator review.
- `resume-delivery` is the only automatic delivery POST state. Respect its
  bounded retry delay. `poll-status` is the only polling state; neither
  operator-review state is an automatic retry instruction.
- Manual recovery must inspect the stored semantic authorization hash and
  sanitized summary, any staged signed receipt, signed Tezos bytes/hash,
  manager counter, mempool, and chain evidence before any
  state change or exact-byte rebroadcast.

## Read-only verification

```sh
npm run agent-cabinet:inventory -- --offline
npm run agent-cabinet:inventory
npm run agent-cabinet:inventory -- --estimate
node --test tests/agent-cabinet.test.mjs tests/agent-cabinet-publication.test.mjs tests/agent-cabinet-api.test.mjs tests/other-worlds-claim.test.mjs
npm run build:bare
```

The inventory script has no signing, sending, injection, minting, transfer, or
deployment mode.
