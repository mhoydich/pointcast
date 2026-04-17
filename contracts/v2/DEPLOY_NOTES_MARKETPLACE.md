Marketplace Contract — Deployment Notes
This document covers everything required to originate and configure the marketplace.py contract on Tezos using SmartPy v0.24.1.
﻿
1. Prerequisites
Requirement
	
Version / Notes


SmartPy
	
v0.24.1 (pip install smartpy-tezos==0.24.1)


Octez client
	
v24+ (Tallinn protocol default)


FA2 contract
	
Already originated; address known


Admin wallet
	
Funded tz1/tz2/tz3 address
﻿
2. Initial Storage
The Marketplace.__init__ signature is positional:
Python
Marketplace(
    admin,               # sp.address
    fa2_contract,        # sp.address
    platform_fee_bps,    # sp.nat  (0–1000; 250 = 2.5 %)
    platform_fee_receiver, # sp.address
    royalty_receiver,    # sp.address
)
2a. SmartPy Origination Snippet
Python
import smartpy as sp
import marketplace

@sp.add_target(name="originate_marketplace")
def target():
    scenario = sp.test_scenario("Originate", marketplace.main)
    scenario += marketplace.main.Marketplace(
        admin                 = sp.address("tz1_YOUR_ADMIN_ADDRESS"),
        fa2_contract          = sp.address("KT1_YOUR_FA2_CONTRACT_ADDRESS"),
        platform_fee_bps      = sp.nat(250),          # 2.5 %
        platform_fee_receiver = sp.address("tz1_YOUR_FEE_RECEIVER_ADDRESS"),
        royalty_receiver      = sp.address("tz1_YOUR_ROYALTY_RECEIVER_ADDRESS"),
    )
Run compilation:
Bash
~/smartpy-cli/SmartPy.sh compile originate_marketplace.py output_dir/
The compiled Michelson and initial storage JSON will be written to output_dir/originate_marketplace/.
2b. Equivalent JSON Initial Storage
The storage is a Michelson pair tree. The equivalent JSON representation (for use with Taquito, octez-client, or an indexer) is:
JSON
{
  "admin": "tz1_YOUR_ADMIN_ADDRESS",
  "fa2_contract": "KT1_YOUR_FA2_CONTRACT_ADDRESS",
  "platform_fee_bps": "250",
  "platform_fee_receiver": "tz1_YOUR_FEE_RECEIVER_ADDRESS",
  "royalty_receiver": "tz1_YOUR_ROYALTY_RECEIVER_ADDRESS",
  "paused": false,
  "next_ask_id": "0",
  "asks": []
}
Note: asks is a big_map and is always initialised as an empty list [] in the origination storage. The runtime allocates the big-map ID automatically.
2c. octez-client Origination Command
Bash
octez-client originate contract marketplace \
  transferring 0 from $ADMIN_ALIAS \
  running output_dir/originate_marketplace/step_000_target.tz \
  --init "$(cat output_dir/originate_marketplace/step_000_target_storage.tz)" \
  --burn-cap 1.5
﻿
3. Post-Origination Steps
Step 1 — Record the Marketplace Address
After origination, note the KT1_MARKETPLACE_ADDRESS from the operation receipt. You will need it for all subsequent steps.
Step 2 — Configure FA2 Operators (Critical)
The marketplace calls transfer on the FA2 contract on behalf of each seller. For this to succeed, every seller must add the marketplace as an operator on the FA2 contract before calling list_ask.
Sellers call update_operators on the FA2 contract:
JSON
[
  {
    "add_operator": {
      "owner":    "tz1_SELLER_ADDRESS",
      "operator": "KT1_MARKETPLACE_ADDRESS",
      "token_id": 1
    }
  }
]
This is a per-token-id permission. If a seller lists multiple token IDs, they must add the marketplace as operator for each one separately (or use a batch call).
Step 3 — Verify Admin Configuration
After origination, confirm the following storage values are correct:
Field
	
Expected Value


admin
	
Your admin address


fa2_contract
	
The FA2 contract address


platform_fee_bps
	
250 (2.5 %) or your chosen value ≤ 1000


platform_fee_receiver
	
Address that will receive platform fees


royalty_receiver
	
Address that will receive creator royalties


paused
	
false
Step 4 — Optional: Adjust Platform Fee
Call set_platform_fee_bps if you need to change the fee after origination. The cap is 1000 bps (10 %).
Bash
octez-client call KT1_MARKETPLACE_ADDRESS from $ADMIN_ALIAS \
  --entrypoint set_platform_fee_bps \
  --arg '500'   # 5 %
﻿
4. Entrypoint Reference
Entrypoint
	
Caller
	
Parameters
	
Notes


list_ask
	
Seller
	
token_id, amount_mutez, royalty_bps
	
Blocked when paused


cancel_ask
	
Seller
	
ask_id
	
Always available (not blocked by pause)


update_ask
	
Seller
	
ask_id, new_amount_mutez
	
Blocked when paused


fulfill_ask
	
Buyer
	
ask_id (+ sp.amount)
	
Blocked when paused; rejects self-fulfillment


set_admin
	
Admin
	
new_admin
	
Transfers admin rights


set_paused
	
Admin
	
paused (bool)
	
Emergency circuit-breaker


set_platform_fee_bps
	
Admin
	
new_fee_bps (0–1000)
	
Capped at 10 %


set_platform_fee_receiver
	
Admin
	
new_receiver
	
Updates fee payout address


set_royalty_receiver
	
Admin
	
new_receiver
	
Updates royalty payout address
﻿
5. Fee Arithmetic
Fees are computed with sp.split_tokens(amount, numerator, denominator), which performs floor division in mutez to avoid rounding overflow.
Example — 2 tez sale, 2.5 % platform fee, 10 % royalty:
Recipient
	
Calculation
	
Amount


Platform fee receiver
	
floor(2,000,000 × 250 / 10,000)
	
50,000 mutez


Royalty receiver
	
floor(2,000,000 × 1,000 / 10,000)
	
200,000 mutez


Seller
	
2,000,000 − 50,000 − 200,000
	
1,750,000 mutez
﻿
6. Security Considerations
Self-fulfillment guard. fulfill_ask raises M_NO_SELF_FULFILL if sp.sender == ask.seller, preventing a seller from reclaiming their own payment.
Operator hygiene. Sellers should call update_operators with remove_operator after a listing is cancelled or fulfilled to revoke the marketplace's transfer rights for that token.
Pause mechanism. The admin can call set_paused(True) to halt new listings, price updates, and fulfillments. Cancellations remain available so sellers can always recover their tokens.
Fee cap. set_platform_fee_bps enforces a hard cap of 1000 bps (10 %) to protect sellers from admin abuse.