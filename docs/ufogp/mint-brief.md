# Signing desk mint brief · UFOGP · 2026-11-13 PT

**Draft for review, not a request to sign yet.** Mike’s yes belongs in the Signing desk’s own chat and must name the network, exact operation, public addresses, artifact hashes, metadata, fee cap and storage-burn cap. A Loom post or poll is never approval. No operation below has been run by Sid.

**What a later yes would authorize:** originate three empty contracts, then issue six nontransferable seat NFTs to six distinct, existing, reviewed holder addresses. No initial doubloons, no attached tez and no treasury movement. Admin/founder/holder addresses and final metadata are **not supplied**; these lines are not ready for execution.

Costs below are from Ada’s `contracts/ufogp/COSTS.md` in draft PR #1690, read at commit `457ae991bbe4cb3d872852343aaadb42a2f6a6bc`. They are pinned-protocol fixture simulations, **not exact quotes or guaranteed caps**. Origination sums combine simulated burn and assumed fees. Mint sums combine a storage-growth proxy and a loose 0.15 tez fee allowance. Metadata/payload changes require new estimates. No wallet access is established here.

| Separate yes for each operation | Planning tez: burn/proxy + fee = sum | Permanent effect / what Mike accepts |
|---|---|---|
| 1. Originate **Seat**, empty, zero tez; reviewed immutable admin and metadata | 1.037250 + 0.004179 = **1.041429** | New contract and paid storage; admin cannot be changed. |
| 2. Originate **Doubloon**, supply 0, zero tez; reviewed immutable admin and metadata | 1.198500 + 0.004755 = **1.203255** | New contract; admin cannot be changed. No award is authorized. |
| 3. Originate **DAO**, empty, zero tez; reviewed founder and actual Seat KT1 | 0.761000 + 0.003082 = **0.764082** | Founder and Seat link cannot be changed; wrong link requires replacement. Compile after Seat’s real KT1 is known. |
| 4. Seat mint **ID 0 · Mike**, amount 1, approved distinct public holder, metadata `0.json` | 0.073500 + 0.150000 = **0.223500** | Holder and issuance metadata fixed; no transfer, burn, revocation or recovery. |
| 5. Seat mint **ID 1 · Loom desk**, amount 1, approved distinct public holder, metadata `1.json` | 0.073500 + 0.150000 = **0.223500** | Same permanent holder/metadata limits. |
| 6. Seat mint **ID 2 · Ada**, amount 1, approved distinct public holder, metadata `2.json` | 0.073500 + 0.150000 = **0.223500** | Same permanent holder/metadata limits. |
| 7. Seat mint **ID 3 · Sid**, amount 1, approved distinct public holder, metadata `3.json` | 0.073500 + 0.150000 = **0.223500** | Same permanent holder/metadata limits. |
| 8. Seat mint **ID 4 · Tess**, amount 1, approved distinct public holder, metadata `4.json` | 0.073500 + 0.150000 = **0.223500** | Same permanent holder/metadata limits. |
| 9. Seat mint **ID 5 · Lou**, amount 1, approved distinct public holder, metadata `5.json` | 0.073500 + 0.150000 = **0.223500** | Same permanent holder/metadata limits. |

**Fixture sum only: 4.349766 tez** (3.008766 originations + 1.341000 six mints). Each operation transfers **0 tez** to the contract; fees and storage burn still cost tez and are not recovered. Ada retains a **3–5 tez origination planning range**, before mint costs. Do not approve the fixture sum as a maximum. For comparison, Ada’s 4,096-byte seat metadata fixture is **1.235250 tez per mint**, rather than 0.223500; our full JSON is not the short-URI fixture.

**Before Mike’s yes:** independent review of #1690, final compiled code/storage hashes, verified admin/founder/six holder addresses, and metadata hashes/URIs must be attached. IDs must be minted in order. `contracts/ufogp/metadata/0–5.json` in #1689 are off-chain TZIP-21 JSON; review a TZIP-12 `token_info` map whose empty key contains the UTF-8 metadata URI. Current HTTPS asset paths are drafts and not immutable hosting. Publish and verify the files or pin immutable equivalents; recheck every URI and hash before signing. Estimate each exact payload on the chosen network and obtain separate fee and burn caps. A burn cap excludes fees. Losing admin/founder/holder access is unrecoverable in this version; a wrong issuance cannot be corrected in place. A failed included operation can still consume fees.

**Excluded:** no Doubloon mint or DAO call is approved by these nine lines. Decision 2 is still open. Any later `mint_done` needs its own reviewed job ID, evidence, recipient, amount and amount-specific yes. Ada’s ordinary one-unit award fixture is **0.196000 tez** (0.046000 proxy + 0.150000 allowance), not a quote; job IDs cannot be reused and awards cannot be transferred or revoked. The admin attests work completion—the contract cannot prove Loom evidence. DAO votes/results are permanent records; they execute no spending. No script, dry-run signer command, wallet creation, origination or mint was run for this brief.
