# Open Press origination on Mike’s Mac

## Compile the reviewed revision

From the root of a checkout at the reviewed PR commit, run the following with Python 3.12. On an Intel Mac, start Docker Desktop for SmartPy’s compiler. Both SmartPy scenarios must pass. The compile scenario emits the production code and initial storage together.

```sh
press_dir=$(mktemp -d)
cp contracts/v2/open_press_fa2.py "$press_dir/"
cd "$press_dir"
python3.12 -m venv venv
venv/bin/python -m pip install smartpy-tezos==0.24.1
venv/bin/python open_press_fa2.py
cd open_press_compile
ls *_contract.json *_storage.json
```

The storage sets `administrator` to Mike’s Kukai address `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`, `paused` to `False`, and `next_token_id` to `0`. The `creators`, `ledger`, `operators`, `royalties`, `supply`, and `token_metadata` big maps start empty. The `metadata` big map contains the UTF-8 bytes of `tezos-storage:content` at the empty key and the generated TZIP-16 JSON with FA2 views at `content`. The compiler’s `*_storage.json` supplies the exact Micheline layout and bytes.

## Originate from Kukai

1. Open the [PointCast origination page](https://pointcast.xyz/admin/deploy/new), select **Mainnet**, and connect Mike’s Kukai wallet.
2. Run `pbcopy < *_contract.json` and paste into **Michelson code**. Run `pbcopy < *_storage.json` and paste into **Initial storage**. Verify the FA2 transfer layout passes and the admin preview matches the full address above.
3. Click **Originate**. In Kukai, review the network, zero initial balance, fee, and storage burn. Sign once when ready. Save the operation hash and KT1 after confirmation.
4. Check the KT1 on [TzKT](https://tzkt.io/) for the administrator, unpaused state, and zero tokens. In a follow-up PR, set `openPress.mainnet` in `src/data/contracts.json` to that KT1 and update its status. After that change deploys, [recent mints](https://pointcast.xyz/api/open-press/recent) should return `[]` until TzKT indexes the first mint.

## Mint inputs and attribution

Any wallet can call `mint` with zero tez. Pass `metadata_uri` as 1–256 UTF-8 bytes pointing to TZIP-21 JSON and `editions` as 1–10,000. All editions go to the sender. The recent-mints API exposes that address as `mintedBy` and the wallet page labels it “Minted by”. Authorship is a separate claim.

Supply `royalty_shares` as a Michelson `map string nat` with at most 10 entries. Each key is a bare Base58 Tezos payout address and each value is a positive share in basis points. The contract validates the addresses and requires the shares to sum to `royalty_bps` (0–2,500). Use an empty map for zero royalties. Pausing affects new mints only. Holders can still transfer editions, add or remove operators, and query balances.

## Royalties on objkt

Open Press writes the checked split into `token_info["royalties"]` as UTF-8 JSON with numeric `decimals: 4` and `shares`. The `get_royalties(token_id)` view returns the same split with typed address keys. Objkt documents automatic support for this token-metadata field. [Objkt royalty format](https://docs.objkt.com/product/collections-and-indexing/nft-smart-contracts#royalties)

The 25% cap binds readers of the contract’s checked values. The minter controls the JSON at `metadata_uri`. Publish the same royalties there. Objkt does not document which source wins a conflict, and Taquito gives the URI value precedence. A conflicting file can therefore report a different split to readers. Objkt indexing for this contract is unverified pending origination. [Taquito metadata resolution](https://taquito.io/docs/tzip12/)
