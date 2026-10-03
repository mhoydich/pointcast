# Art V2 commerce and minting handoff

This is an unsigned preparation release. No contract deployment, mint, listing, operator approval, purchase, signature, broadcast or key generation was performed. The requested collection has no verified minted inventory. Do not describe it as a live sale.

## Verified infrastructure (2026-10-03)

Inspected fresh `origin/main` at `551bd6e62b4126a811cbc5eba7e4ea831c5bc5c0` and public GET endpoints. PointCast's marketplace is a Tezos mainnet contract, `KT1X9LUxV5qaPVLr17uzRfxgRWPdGfRMYxQT`. RPC reports chain ID `NetXdQprcVkpaWU`. Marketplace storage is unpaused, `next_ask_id=0`, asks bigmap `806869`, and active asks are empty. Version 3 `fulfill_ask` takes a bare natural-number ask ID. The existing objkt `collectToken()` helper has a different ABI and is not used.

Public admin, platform fee receiver and shared royalty receiver: `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`. These establish existing infrastructure, not authorization to use that wallet as this collection's seller or creator. Platform share is currently 250 bps: 25,000 mutez deducted from a 1 tez listing payment. Royalties also come from that payment. Network fees and storage costs are additional and unknown until a wallet estimates them.

A separate PointCast blockchain was not identified. The Chain Messenger prepares Tezos envelopes; Etherlink payments do not establish a PointCast-owned chain. Preserve the second-chain status as `unverified_network` until the user names it and supplies verified configuration. No bridge, duplicate ownership or unified token inventory is implied.

Evidence:

- [Mainnet chain ID](https://rpc.tzkt.io/mainnet/chains/main/chain_id)
- [Current marketplace storage](https://api.tzkt.io/v1/contracts/KT1X9LUxV5qaPVLr17uzRfxgRWPdGfRMYxQT/storage)
- [Current active asks](https://api.tzkt.io/v1/bigmaps/806869/keys?active=true&limit=1)
- [Current entrypoints](https://api.tzkt.io/v1/contracts/KT1X9LUxV5qaPVLr17uzRfxgRWPdGfRMYxQT/entrypoints)
- [Official FA2 specification](https://docs.tezos.com/architecture/tokens/FA2)
- [Octez finality](https://octez.tezos.com/docs/active/consensus.html)

## Decisions required from the owner

1. Network: approve Tezos mainnet; identify any additional PointCast network or choose the existing PointCast marketplace on Tezos.
2. Collection: select an owner-authorized existing FA2 or hand off a separately reviewed dedicated collection. Existing El Segundo `KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb` is a candidate, not selected. IDs 0–9 exist; Agent Cabinet prepared IDs 10–12 are reserved but not approved. Do not allocate the new series IDs without collision and ownership checks. Imported objkt `KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP` has 43 tokens and a contract administrator; do not silently reuse it.
3. Wallets: approve seller and creator addresses. Existing Mike wallet above is only a candidate.
4. Editions: choose the number issued per work and review continued issuance permissions. Historical releases use different caps; Nouns Money's 50-art 1 tez catalog explicitly leaves editions TBD. Neither is authorization for this series. The preparer checks current issued supply against an approved limit; it does not assert that every FA2 enforces a cap. Review and disclose the selected collection's issuance policy.
5. Royalties: approve rate and receiver. Current marketplace v3 has a shared receiver across all asks; a new creator-specific receiver cannot be selected per listing. Do not silently adopt historical 750 bps or modify contract-wide settings.
6. Storage and rights: approve verified source/artwork rights and pinned immutable artwork/metadata. The current guarded adapter supports `ipfs-pinned` only; another approved storage policy requires explicit code review.

## Gallery integration

Gallery route: `/art/v2/`. Gallery worker owns its routes, source manifest and assets. Commerce owns `/art/v2/commerce/`, `/art/v2/commerce.json`, `ArtPurchasePanel.astro`, and the guards. Use `<ArtPurchasePanel artwork={entry} compact />`. Accepted entry fields: `id`, `source.rightsStatus`, `v2.asset`, `commerce.priceMutez`, `commerce.network`, `commerce.tokenId`, `commerce.contract`. Set exact price to `1000000`. `commerce.status` alone never enables preparation. `ownerEvidence` is not serialized into public HTML.

`src/data/art-v2-commerce.json` remains `status: preview`, `purchaseEnabled: false`, `unsignedPreparationEnabled: false`, with no financial defaults or invented inventory. Future reviewed configuration must bind each exact gallery ID to the authorized token, ask, immutable artifact URI, artifact SHA-256, immutable metadata URI, metadata SHA-256, pinned-file review and rights approval; specify approved wallets, limits, reviewed issuance policy, collection code SHA-256 (SHA-256 of `JSON.stringify(script.code)` from RPC), marketplace fee terms and release approval. Leave unused network status independent.

The current adapter supports canonical `operators` storage with `owner/operator/token_id` keys. El Segundo's existing operator map uses unannotated `address_0/address_1/nat` instead, so the current adapter intentionally cannot activate it without a reviewed adaptation. A different selected FA2 layout must be implemented and reviewed before enabling preparation. Unsupported layouts fail closed. Raw `token_metadata` must contain the empty-string URI pointer and UTF-8 hex `artifactSha256` and `metadataSha256` fields matching reviewed configuration. Inline or differently encoded metadata fails closed.

The client hashes local gallery bytes and checks the raw on-chain pointer and declared hashes. It does not download and re-hash remote IPFS artwork or metadata at runtime. Verify the actual pinned bytes against these hashes during owner-reviewed pinning and record `metadataApproval` before activation; indexer enrichment alone is not pinned-file verification. The component never connects a wallet, requests a signature, sends an operation, or starts login. It reads the actual existing Beacon account and requires mainnet both in the wallet and public RPC.

## Owner minting and release procedure

Resolve the decisions first. Confirm authenticated source ownership and generated files, pin them, and verify hashes. Inspect the chosen collection's administrator, mint ABI, available IDs and issuance rights. Prepare the concrete mint/metadata and listing operation files from that verified ABI only after terms and token IDs are approved. No executable mint operation is provided while the collection is undecided.

The owner reviews and performs all mint, operator approval and listing actions in their wallet. Verify applied operations, token metadata, seller ownership and the exact 1 tez ask through public chain reads. Operator approval permits the marketplace to transfer owned units of that token type; review its scope. Then update the trusted release config in a human-reviewed PR. Do not merge or deploy this draft until approval. Parent owns the serialized deployment lane and must use `scripts/deploy.sh` after approved merge.

Preparation returns an unsigned JSON review handoff, not forged transaction bytes, an authorization, a payment or a receipt. Plans expire after 60 seconds. Read/listing checks expire after 30 seconds. Wallet and contract terms must be rechecked immediately before the owner manually signs. Marketplace payout terms are mutable and `fulfill_ask` cannot atomically pin them. No fixed all-in total is promised.

## Receipt verification

`verifyPurchaseReceipt()` is a pure validator for data retrieved from the fixed public mainnet endpoints. A receipt loader and signing UI are deliberately not enabled in this preview. Do not pass user-supplied objects as chain proof. Read the complete operation group, canonical inclusion block hash from RPC, and consistent head/balance/listing data; require two successor blocks. Match the sole external purchase's buyer, destination, 1,000,000 mutez and ask ID. Match applied internal FA2 transfer from seller to buyer for the exact token, quantity one, and exact aggregated tez payouts to approved receivers. Hash format, generic confirmation and current ownership alone are insufficient.

Verified real TzKT shape using historical legacy sale [ooovVC2fjshk2SvMFHMZiN9PJYhHqcZUr7GW9iVRHsqcrhVXaHs](https://api.tzkt.io/v1/operations/ooovVC2fjshk2SvMFHMZiN9PJYhHqcZUr7GW9iVRHsqcrhVXaHs). Internals use integer `nonce` including zero, with matching hash/counter/level/block and buyer initiator; there is no `parentId`. Token-transfer API links the internal FA2 call ID, not external purchase ID. Current balances are supplemental evidence. Network/storage fees may occur on internal operations, so external fee fields alone do not determine total costs.

Pending, failed, rejected, disconnected and unverified states never mean ownership or completed purchase. A future submitted-but-uncertain operation requires receipt recheck, not automatic retry.

## Validation and remaining blockers

Tests use clearly labeled simulated fixtures and make no chain transactions. Cover preview/no-wallet gates, exact ABI/price, rights, metadata/bytes/code, seller inventory/operator, changed terms, wrong network, disconnect, duplicate clicks, rejection and precise canonical receipt/payout checks. Run `node --test tests/art-commerce.test.mjs` and exact-head `npm run build:bare`. Independent security review required before any release enablement.

Remaining blockers: authenticated source access, all actual artwork/rights, owner-approved terms and collection/network decisions, user-performed mint/list/operator actions, live token/listing verification, human PR approval, and parent-coordinated deployment. No live-sale or second-chain mint claim is permitted.
