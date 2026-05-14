# Wire Attestations contract review

**Date:** 2026-05-08
**Reviewer:** Codex
**Commit:** fdebb35c9d05928092da5177c86768c60d9af5c6
**Source:** contracts/eth/wire_attestations.sol

## A. ERC-721 baseline correctness
**Verdict:** PASS
**Finding:** The inheritance and override surface match the OpenZeppelin Contracts v5 ERC721Enumerable pattern: `_update`, `_increaseBalance`, and `supportsInterface` are the right conflict points to override. `attestation()` and `tokenURI()` correctly gate reads through `_requireOwned(tokenId)`, so burned or never-minted token ids do not return stale attestation data. There is no burn path in this contract, but the inherited transfer path remains standard ERC-721 behavior.

## B. Reentrancy posture
**Verdict:** PASS
**Finding:** `attest()` follows checks-effects-interactions: it validates input and duplicate state, increments `nextTokenId`, stores the attestation, records the `(blockId, signer)` index, emits, then calls `_safeMint`. If `msg.sender` is a contract, the ERC721 receiver callback can reenter, but the original `(blockId, msg.sender)` pair is already marked as attested, so the duplicate invariant is preserved. Reentrancy can mint a different block during the callback, but that is equivalent to another permissionless call and does not create a privilege boundary issue.

## C. +1 encoding
**Verdict:** PASS
**Finding:** Keeping `byBlockSignerPlusOne` is the right choice because token ids start at 1 today but the sentinel should not depend on that convention forever. The mapping exposes a clean public read for raw storage while `tokenIdFor()` provides the ergonomic decoded value. The gas overhead is negligible compared with the clarity of an unambiguous default value.

## D. tokenURI gas
**Verdict:** SUGGEST
**Finding:** The on-chain JSON and Base64 encoding are acceptable for off-chain `eth_call` metadata reads, but `tokenURI()` is a relatively heavy view function because it performs several string concatenations and base64 encodes the full JSON every time. That is not a blocker for marketplaces and indexers, but other contracts should not be expected to call it. Since the contract currently allows arbitrary 4-byte strings, tightening the byte set also keeps generated JSON valid and prevents quotes, backslashes, and control bytes from breaking metadata.

```diff
@@
     function attest(string calldata blockId, bytes32 contentHash) external returns (uint256) {
         require(bytes(blockId).length == 4, "PCWIRE: blockId must be 4 chars");
+        bytes calldata b = bytes(blockId);
+        for (uint256 i = 0; i < 4; ++i) {
+            bytes1 c = b[i];
+            require(
+                (c >= 0x30 && c <= 0x39) ||
+                (c >= 0x41 && c <= 0x5A) ||
+                (c >= 0x61 && c <= 0x7A) ||
+                c == 0x2d ||
+                c == 0x5f,
+                "PCWIRE: blockId unsafe char"
+            );
+        }
         require(contentHash != bytes32(0), "PCWIRE: contentHash zero");
```

## E. blockId validation
**Verdict:** CONCERN
**Finding:** Exact 4-byte length without digit enforcement matches the future-proofing requirement, but "any 4 bytes" is looser than the surrounding JSON and URL construction can safely support. A block id containing `"` or `\` would produce invalid JSON in `tokenURI()`, and slash-like or control characters would create confusing `external_url` values. I would keep non-numeric ids allowed, but restrict the allowed characters to a small URL- and JSON-safe set such as `[0-9A-Za-z_-]`.

## F. No-admin / no-upgrade posture
**Verdict:** PASS
**Finding:** The no-admin, no-fee, no-upgrade posture is coherent for a public attestation registry where the contract should not become an editorial control point. The tradeoff is that validation mistakes, metadata wording, or indexing decisions are permanent after deployment. Given the intentionally small state machine, permanence is acceptable as long as the block id byte-set concern is resolved before Base mainnet deployment.

## G. OZ v5 vs v4 drift
**Verdict:** PASS
**Finding:** The source is written against the v5 API, not the v4 hook model: `_requireOwned` exists in v5, `_update(address,uint256,address)` is the correct transfer/mint hook, and `_increaseBalance(address,uint128)` is required by the enumerable extension. There are no leftover v4 hooks like `_beforeTokenTransfer` or `_afterTokenTransfer`. The `Strings` usage is also aligned with v5, including address hex conversion via `using Strings for address`.

## Overall verdict
APPROVE-WITH-CHANGES — The ERC-721 enumerable integration, reentrancy posture, duplicate-attestation indexing, and no-admin design all look sound for the stated Base mainnet target. I would not deploy exactly this source until `blockId` validation is narrowed to JSON- and URL-safe characters, because the current exact-4-byte rule can produce malformed metadata even though non-numeric ids should remain supported.
