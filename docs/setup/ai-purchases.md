# Optional AI purchase pilot

Status: deployed with the private profile at `/me#ai-purchases`; new purchases remain disabled unless explicitly enabled for a deployment. Payment validation uses mock wallets, fake settlement responses, fixture signatures and local integration tests. Deployment does not establish real wallet authorization or a live payment.

The first service is an optional **0.01 USDC contribution to publish one question on PointCast’s public Bench**. It does not purchase an AI answer. Free participation remains available at `/bench`, and using an AI connection does not require a wallet. A ChatGPT or Claude subscription does not fund USDC or authorize spending.

## Visitor flow and public information

1. Complete a task with a paired native AI runtime on the current PointCast account. For a new purchase, the runtime must be online, report subscription authentication, and have a recorded successful model task. These records are not independent provider attestations.
2. Write a question of up to 280 characters and request a quote. Review the exact public text, price, token, recipient, network and expiry. The server removes angle brackets, normalizes line endings and excessive blank lines, then trims the question; this canonical text is displayed before approval.
3. Explicitly choose an EIP-6963 browser wallet and connect it. Connection alone never signs or pays. Confirm the displayed public text and this one payment, then approve the payment authorization in the wallet.
4. Read the separate payment and delivery evidence. If an outcome is unknown, check the existing attempt; do not authorize another payment to recover it.

The canonical question and a shortened payer wallet address appear on the shared Bench. The private AI prompt and companion note are not sent with the purchase. The full payer address is present in the payment receipt and on-chain transfer; the shortened Bench label is not anonymity.

The browser signs one `PermitWitnessTransferFrom` authorization and submits it only through the authenticated purchase API. It discards stale signature results when the account, chain, owner/session, question, quote, selected purchase, or approval state changes. A wallet dialog may remain open after the page stops waiting; a late result must not be submitted.

## Supported payment terms and wallet requirements

| Field | Pinned pilot value |
| --- | --- |
| Service endpoint | `https://pointcast.xyz/api/agent/bench` |
| Scheme | x402 v2 `exact`, Permit2 |
| Network | Etherlink mainnet, `eip155:42793` / chain ID `42793` |
| Amount | `10000` atomic units = `0.01 USDC` |
| USDC asset | `0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9` |
| Recipient | `0x48e8479b4906d45fbe702a18ac2454f800238b37` |
| Permit2 verifying contract | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| x402 proxy / signed spender | `0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E` |
| Quote / authorization lifetime | At most 60 seconds; authorization cannot outlive the server quote |

The browser and server reserve at least 15 seconds for submission/settlement. A wallet dialog that uses that window stops the attempt before submission and requires a newly reviewed quote. A visibly full Bench is rejected at quote time and immediately before reservation. Capacity can still change between that check and delivery because the shared Bench uses KV rather than a global atomic seat reservation.

The current browser helper supports ordinary EOA signatures and requires a compatible wallet already on Etherlink, sufficient USDC, and a pre-existing sufficient **USDC → canonical Permit2 allowance**. It verifies that the returned signature recovers the reviewed payer account. Contract-wallet signatures are outside this pilot.

There is no automatic network addition/switch, allowance grant, unlimited approval, funding, server-held payer key, or unattended spending. The existing facilitator submits the authorized transfer. The wallet helper itself performs no network fetch or transaction submission; connecting requests an account, and approving requests one typed-data signature. A missing prerequisite requires separate deliberate wallet setup, not an automatic transaction from PointCast.

## Deployment prerequisites

Deployment and enabling payments are separate steps from completing this implementation.

- Apply `migrations/auth/0018_ai_purchases.sql` to the intended `AUTH_DB`, after the existing auth/runtime schema. The authenticated history API uses this table even when new purchases are disabled.
- Bind the existing `AUTH_DB` and `VISITS` stores. The runtime tables and Bench/paid-action schema must already exist.
- Configure a valid existing `X402_RECEIPT_SK` through the secret mechanism. Its signing key must match the published PointCast treasury receipt public key; an invalid or mismatched key must fail before settlement. Do not put secret values in configuration files, documentation or logs.
- Keep the deployed payment terms consistent with the pinned table. The helper rejects alternate assets, recipients, amounts, chains and spender fields instead of silently adopting overrides.
- Set `AI_PURCHASES_ENABLED=true` only in the intended deployment when enabling the pilot. Missing, false, or any other value disables new quotes/submissions. This document does not change production configuration or enable the flag.
- Verify the chosen deployment and complete an explicitly approved real-wallet test before describing live payment as proven. The fixture tests do not establish a funded wallet, usable allowance, facilitator availability, a live transfer, or rollup finality.

Existing authorized attempts remain readable/reconcilable after the flag is disabled or the runtime is removed. New purchases still require the runtime eligibility check.

**Public-launch cut line:** the pilot deliberately holds an owner after an unknown settlement or unresolved paid delivery. Read-only reconciliation can recover an already-recorded outcome, but cannot manufacture missing settlement evidence. There is no self-service override or automatic refund/redelivery. Establish an operator recovery process and prove its real-wallet cases before enabling this for general visitors. The investigation procedure below is useful for the owner pilot; it does not claim every unknown outcome can already be resolved in the product.

## Authenticated API

All operations use `/api/me/ai-purchases`. `GET` reads the current owner’s availability, eligible runtimes and up to 20 recent purchases. Mutating operations use `POST` with the normal PointCast session and a matching `Origin`; another account cannot read or operate on a purchase ID.

| POST operation | Request fields besides `operation` | Behavior |
| --- | --- | --- |
| `quote` | `requestId`, `runtimeId`, `question` | Creates an owner-bound quote. `requestId` is a stable 16–80 character identifier using letters, digits, `_` or `-`; replay with the same runtime/text returns the existing purchase. Changed content conflicts. |
| `submit` | `purchaseId`, `quoteHash`, `paymentSignature`, `confirmPublic: true` | Rechecks eligibility, expiry and current terms; reserves the attempt atomically and passes the single authorization to the fixed Bench service. `paymentSignature` is the base64 x402 payload, not a private key. |
| `reconcile` | `purchaseId` | Reads the existing paid-action intent, receipt, public record and independent chain evidence. Never submits another payment or republishes the question. |
| `cancel` | `purchaseId` | Expires a quote that has not been submitted. It cannot cancel or reverse a submitted authorization/transfer. |

A returned purchase includes its canonical `question`, `quote`, `quoteHash`, epoch-millisecond `expiresAt`, status, action/transaction IDs, receipt/result and proof flags. The client must submit the unchanged `quoteHash`; it cannot supply a recipient or spend limit that overrides the reviewed terms.

There is at most one `quoted`, `submitting` or `unresolved` purchase per owner and a bounded quote creation rate. A globally unique payment hash and unique service action key prevent the same stored attempt from being sent twice. Once a payment hash is reserved, repeated `submit` calls only reconcile that attempt, including after a lost response or runtime disconnect.

## Proof stages and recovery

| Evidence / state | What it establishes |
| --- | --- |
| Quote reviewed | Text and exact economic terms are selected; no wallet authorization yet. |
| Wallet signature | The selected EOA authorized the exact Permit2 message. This alone is not settlement or delivery. |
| `submitting` / `unresolved` | Submission started or the outcome remains uncertain. Do not pay again. |
| `receiptVerified` | Local verification of the treasury signature, pinned payment terms, payer, transaction hash and signed action binding. The action hash is SHA-256 of `bench` + newline + canonical JSON `{question: canonicalText}`. |
| `chainVerified` | A read-only Etherlink RPC observation of a successful transaction containing the exact USDC transfer from the payer to the pinned recipient. This is **not rollup finality**. |
| `deliveryVerified` | The signed Bench result matches the actual `VISITS` sit record, the canonical question and its day index. |
| `delivered` | Receipt and public delivery are verified. The independent chain observation can still be pending and is reported separately. |
| `failed` | The underlying intent records a definite failure; this particular reserved purchase is never automatically resubmitted. |
| `expired` | The unused quote expired or was skipped; it grants no fresh authorization. |

Unknown facilitator outcomes, lost submission responses, and recorded payments with unverified/failed delivery stay held for reconciliation or manual investigation. Neither a refresh nor `reconcile` authorizes another charge, automatically redelivers a failed action, or issues a refund. A known pre-submission failure in the shared payment gate is distinguished from an ambiguous post-submission failure; the private purchase wrapper still never retries its reserved authorization.

The purchase ledger stores a hash of the payment payload, payer, quote, action identifiers, signed merchant receipt, result and proof timestamps. It does **not** store the payer’s raw authorization/signature, private key, provider credential, or AI prompt. A merchant’s receipt signature is retained as proof; it cannot authorize another payer transfer. Purchase receipts survive deletion of the paired runtime because runtime IDs are historical references rather than cascading runtime foreign keys.

The latest chain observation is intentionally rechecked. A later unavailable or contradictory RPC result returns `chainVerified: false`; a historical observation must not be presented as current finality. `proofCheckedAt` timestamps that latest check. The original transaction hash and signed merchant receipt remain in the record for investigation.

## Investigating a held owner-pilot purchase

1. Keep the purchase ID and use **Check this purchase**. Do not make a new quote, replay a wallet signature, delete the pending row, or call the paid endpoint with a new idempotency key. An expiry only expires an unused authorization; it does not prove a submitted payment failed.
2. An authorized operator reads the matching purchase and paid intent from the intended `AUTH_DB`, binding the purchase ID and owner to the query below. This is an investigation query, not an instruction to alter production records. Keep the private action key and provider/wallet material out of logs and support messages.

   ```sql
   SELECT p.id, p.user_id, p.status AS purchase_status, p.question,
          p.payer, p.created_at, p.updated_at, p.expires_at,
          i.id AS action_id, i.status AS action_status, i.request_hash,
          i.tx_hash, i.error, i.settlement_json, i.result_json
   FROM ai_purchases p
   LEFT JOIN paid_action_intents i
     ON i.action = 'bench' AND i.idempotency_key = p.action_key
   WHERE p.id = ? AND p.user_id = ?;
   ```

3. For `succeeded`, validate the signed receipt against the published treasury key, exact payer/amount/recipient/asset, purchase request hash and action ID. Check the named transaction separately. Compare the signed `bench.sit` to `bench:sit:<id>` and `bench:index:<day>` in `VISITS`. Then reconcile the original purchase. This path recovers a lost browser response without another payment.
4. If the sit is present but its day index write failed, an authorized, separately reviewed repair can restore that **existing sit ID** to the correct current index. Preserve other index entries; do not create another sit or invoke the paid route. Reconcile afterward to verify the existing signed result. The integration test exercises this recovery.
5. If settlement is `settling`/`settlement_ambiguous`, or the intent is missing, obtain the facilitator's authoritative result for the existing attempt and inspect any transaction evidence. Confirm the original request is no longer in flight before considering a repair. Neither an RPC outage, an expired quote, nor elapsed time is evidence of nonpayment. If a matching authoritative outcome cannot be established, keep the hold and report that it remains unresolved.
6. If `settlement_failed` is already recorded by the gate, reconciliation closes this purchase as failed without another submission. If `settled`/`acting`/`action_failed` is recorded but there is no verifiable delivered result, retain the hold for a separately reviewed repair or refund decision. A controlled operator redelivery/refund tool is still required for public launch; the browser must not impersonate that tool.

Do not manually flip `receipt_verified`, `chain_verified`, or `delivery_verified` to make a purchase appear complete. Normal reconciliation must recompute those proofs. Both the underlying intent ledger and the private purchase ledger reject reuse of a transaction hash for a second purchase.

## Source and protocol references

Implementation: `src/lib/x402-buyer.ts`, `src/lib/auth/ai-purchases-ui.ts`, `src/components/AiPurchases.astro`, `functions/api/me/ai-purchases.ts`, `functions/_lib/x402-chain-proof.ts`, `functions/_lib/x402-gate.ts` and `migrations/auth/0018_ai_purchases.sql`.

- [EIP-6963 wallet discovery](https://eips.ethereum.org/EIPS/eip-6963): user-selected providers; wallet names/RDNS are self-described metadata.
- [EIP-712 typed signing](https://eips.ethereum.org/EIPS/eip-712): domain, chain, verifying contract and structured message.
- [Uniswap Permit2 SignatureTransfer](https://developers.uniswap.org/docs/protocols/permit2/concepts/signature-transfer): witness signing and unordered nonces.
- [TZ APAC Etherlink Permit2 proxy flow](https://github.com/tzapac/tzapac-x402-permit2#coinbase-permit2-proxy): the reviewed Etherlink proxy deployment and facilitator-paid submission; this deployment is identified as a beta.
- [Etherlink architecture](https://docs.etherlink.com/network/architecture/) and [node providers](https://docs.etherlink.com/evm/tools/node-providers/): distinguish an RPC transfer observation from finality.
