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

Any wallet can call `mint` with zero tez. Supply `metadata_uri` as UTF-8 bytes of a URI to TZIP-21 JSON, `editions` as 1–10,000, and `recipients` as an address-to-basis-points map whose positive shares sum to `royalty_bps` (0–2,500). Use an empty map for zero royalties. The caller receives all editions and remains the recorded creator after transfers. The `get_royalties(token_id)` view returns the split with four decimal places. Marketplaces that read royalties from the linked JSON should see the same split there. Pausing blocks mints, transfers, and operator changes. Balance queries remain available.
