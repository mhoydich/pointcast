# Mortality documentary edition — rights and release ledger

**Status: review-draft.** Companion: `mortality-edition-concept.json`. This records an edition concept; no mint plan, inventory, listing, sale, signature, upload, pinning or release authorization exists. `minted`, `listed`, `purchaseEnabled` and `unsignedPreparationEnabled` are false. Price, supply, royalties, network, wallets, collection, token/ask IDs, artwork/metadata URIs and all approvals are null. No archive50, 1 tez, 50-edition, 750-bps, existing-wallet or existing-collection defaults apply.

## Content and rights ledger

| Candidate material | Evidence and permitted description | Unresolved approval |
| --- | --- | --- |
| Editorial mortality study | `death-study.json`: original editorial prose with linked source paraphrases and a source ledger. Citation/access does not confer ownership of source pages, modern translations, images, recordings or site editions. Ancient subject matter and an underlying public-domain work do not automatically clear a publisher's electronic edition or a later translation. | Confirm source use, attribution, any quotations/permissions and final editorial authorship. Source-rights and ownership approvals remain null. |
| Original SVG | Planned inclusion of this project's original drawing, after root identifies and inspects the final file. No Midjourney attribution. | Concrete path, creator evidence, third-party font/media/dependency inspection and exact-byte SHA-256 are pending. |
| OpenAI Astra text | Actual queried contribution recorded in `death-openai-astra.json`, provider OpenAI, platform model identifier `gpt-6-astra`, date 2026-10-03. | Confirm applicable account terms and owner reuse decision; record receipt, prompt and response hashes. Build/version is not exposed. |
| OpenAI Sol text | Actual queried contribution recorded in `death-openai-sol.json`, provider OpenAI, platform model identifier `gpt-6-sol`, date 2026-10-03. | Same account-terms, reuse and hash checks. Build/version is not exposed. |
| Claude/Sonnet, DeepSeek, Qwen, Udio, Midjourney | Absent from this edition: not consulted and not rights-cleared. Prepared prompts are not their output. | A later contribution needs actual output, provenance, provider access/terms and independent rights review before inclusion. |

OpenAI's individual and business/developer terms allocate output rights to the user/customer relative to OpenAI, subject to applicable law. They also preserve the user's responsibility for input permissions and explain that outputs can be similar to those generated for others. The applicable account agreement must still be identified; the allocation does not itself establish exclusive statutory copyright or clear third-party content. No Creative Commons license, public-domain dedication or legal guarantee is asserted here. [Individual terms](https://openai.com/policies/row-terms-of-use/), [Europe individual terms](https://openai.com/policies/terms-of-use/), [Services Agreement §4](https://openai.com/policies/services-agreement/).

The SVG and supporting code also need a dependency/license check: OpenAI's Service Terms specifically note that code-generation output can carry third-party licenses. No indemnity is assumed for this proposed mixed-media edition. [Service Terms §4](https://openai.com/policies/service-terms/).

Keep complete model receipts separately from edited exhibition excerpts. Label any adaptation; do not silently alter a response attributed as verbatim. Model fluency is not evidence of consciousness or testimony of grief. This draft states no personal experience, faith or afterlife belief on Michael Hoydich's behalf, and implies no provider endorsement. A token would not automatically transfer copyright, exclusivity or a collector reproduction license; those terms remain unapproved.

## Exact bytes and immutable metadata

The final public concept records exact local hashes for the editorial study, SVG, model receipts, separate UTF-8 prompts/responses, and assembled review archive/manifest. Approved token artifact/metadata hashes and all storage URIs remain null, not valid digests or storage locations. Hash each complete file's bytes; separately record SHA-256 of UTF-8 prompt and response text so those values are not confused with JSON receipt hashes. Record the final SVG, editorial data, two receipts, assembled artifact/bundle, bundle manifest and final serialized token metadata. Do not self-hash this mutable concept as though it were final metadata.

A deterministic local review archive has been assembled and hashed. It has not been pinned, issued, or publicly stored. Future owner-reviewed pinning must verify actual pinned artwork and metadata bytes against their approved hashes and record `pinnedBytesApproval` and `metadataApproval`. Indexer enrichment and a local hash alone do not prove remote bytes. Bind each exact gallery ID to its authorized token/ask, immutable artifact URI/hash and metadata URI/hash. The current commerce adapter supports `ipfs-pinned` only; another policy requires explicit code review.

## Required owner/reviewer decisions before any future activation

Derived from the [commerce handoff](PointCast commerce handoff). These are unresolved requirements, not approvals:

- Confirm authenticated source ownership/access, final editorial and generated-asset provenance, quotations/permissions, provider account terms, creator credits and collector license. Approve exact final content and sensitivity review.
- Approve network, authorized seller/creator wallets, collection, price, edition limit and continued-issuance policy, royalty rate/receiver, storage policy, marketplace fee/payout terms and release. Do not infer them from another series.
- Inspect the selected collection's administrator, mint ABI, issuance rights, issued supply, available token IDs and collisions. Review the issuance policy instead of assuming a contract-enforced cap. Approve SHA-256 of `JSON.stringify(script.code)` obtained from RPC.
- Review the mint adapter and FA2 operator storage layout. The current adapter expects canonical `owner/operator/token_id` keys; the El Segundo candidate's unannotated layout is unsupported. No collection is selected here.
- Verify exact pinned artwork/metadata bytes and URI/hash bindings. Raw token metadata must use the empty-string URI pointer and matching UTF-8-hex `artifactSha256` and `metadataSha256` fields for the current adapter.
- Only after the above decisions, an owner may separately review concrete operations and manually perform mint, operator approval and listing in their wallet. Recheck network, wallet, contract and mutable payout terms immediately before signing. Verify applied operations, seller inventory, exact listing and token metadata through public chain reads; do not treat intent or current ownership alone as a purchase receipt.
- Run the relevant commerce tests and exact-head build; obtain independent security review and human-reviewed release PR. Parent owns the serialized deployment lane and approved `scripts/deploy.sh` invocation. No activation or code/config edit is part of this task.

The handbook's replay of a recorded 422-block `pointcast-dev` snapshot demonstrates consistency of that local recording under its verifier. It does not establish a public blockchain, production readiness, an authorized network, a mint adapter or second-chain ownership. Public-network and mint-adapter configuration remain unset. Tezos marketplace infrastructure is separate and is not selected for this concept.

