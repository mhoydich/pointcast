"""
Kowloon Achievements — FA2 multi-asset receipt contract.

One token per achievement slug (36 slots, 0..35). Voucher-signed claim,
dedup'd per (wallet, token_id). 0% royalty — receipts, not collectibles.
CC0 art.

Compile:
    python3 -m smartpy compile contracts/kowloon_achievements_fa2.py contracts/build/
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


@sp.module
def main():
    import fa2_lib

    MAX_ACHIEVEMENT_ID = sp.nat(99)

    class KowloonAchievements(fa2_lib.Admin, fa2_lib.Fa2MultiAsset):
        def __init__(self, admin, signer_pubkey, metadata_base_cid, contract_metadata):
            fa2_lib.Fa2MultiAsset.__init__(
                self, metadata=contract_metadata, token_metadata=[], ledger={},
            )
            fa2_lib.Admin.__init__(self, admin)
            self.data.signer_pubkey = signer_pubkey
            self.data.metadata_base_cid = metadata_base_cid
            self.data.royalty_bps = sp.nat(0)
            self.data.supply = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.nat])
            self.data.used_nonces = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.unit])
            self.data.claimed_by = sp.cast(
                sp.big_map(),
                sp.big_map[sp.pair[sp.address, sp.nat], sp.unit],
            )
            self.data.slugs = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.string])

        def _lazy_register(self, token_id):
            if not self.data.token_metadata.contains(token_id):
                uri_str = ("ipfs://" + self.data.metadata_base_cid + "/"
                           + sp.view_utils.nat_to_string(token_id) + ".json")
                token_info = {"": sp.pack(uri_str)}
                self.data.token_metadata[token_id] = sp.record(
                    token_id=token_id, token_info=token_info,
                )
                self.data.supply[token_id] = sp.nat(0)

        @sp.entrypoint
        def claim_achievement(self, params):
            sp.cast(params, sp.record(
                recipient=sp.address, token_id=sp.nat, nonce=sp.nat,
                expiry=sp.timestamp, signature=sp.signature,
            ))
            assert params.recipient == sp.sender, "RECIPIENT_MISMATCH"
            assert params.token_id <= MAX_ACHIEVEMENT_ID, "TOKEN_ID_OUT_OF_RANGE"
            assert sp.now <= params.expiry, "VOUCHER_EXPIRED"
            assert not self.data.used_nonces.contains(params.nonce), "NONCE_USED"
            dedup_key = (params.recipient, params.token_id)
            assert not self.data.claimed_by.contains(dedup_key), "ALREADY_CLAIMED"
            payload = sp.pack(
                (params.recipient, (params.token_id, (params.nonce, params.expiry)))
            )
            assert sp.check_signature(
                self.data.signer_pubkey, params.signature, payload
            ), "BAD_SIGNATURE"
            self._lazy_register(params.token_id)
            self.data.used_nonces[params.nonce] = ()
            self.data.claimed_by[dedup_key] = ()
            self.data.supply[params.token_id] += sp.nat(1)
            key = (params.recipient, params.token_id)
            self.data.ledger[key] = (
                self.data.ledger.get(key, default=sp.nat(0)) + sp.nat(1)
            )

        @sp.entrypoint
        def admin_mint(self, params):
            sp.cast(params, sp.record(recipient=sp.address, token_id=sp.nat, amount=sp.nat))
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            assert params.token_id <= MAX_ACHIEVEMENT_ID, "TOKEN_ID_OUT_OF_RANGE"
            self._lazy_register(params.token_id)
            self.data.supply[params.token_id] += params.amount
            key = (params.recipient, params.token_id)
            self.data.ledger[key] = (
                self.data.ledger.get(key, default=sp.nat(0)) + params.amount
            )

        @sp.entrypoint
        def set_signer_pubkey(self, new_pubkey):
            sp.cast(new_pubkey, sp.key)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.signer_pubkey = new_pubkey

        @sp.entrypoint
        def set_metadata_base_cid(self, cid):
            sp.cast(cid, sp.string)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.metadata_base_cid = cid

        @sp.entrypoint
        def set_achievement_slug(self, params):
            sp.cast(params, sp.record(token_id=sp.nat, slug=sp.string))
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            assert params.token_id <= MAX_ACHIEVEMENT_ID, "TOKEN_ID_OUT_OF_RANGE"
            self.data.slugs[params.token_id] = params.slug

        @sp.offchain_view(pure=True)
        def wallet_claimed(self, params):
            sp.cast(params, sp.pair[sp.address, sp.nat])
            return self.data.claimed_by.contains(params)

        @sp.offchain_view(pure=True)
        def slug_of(self, token_id):
            sp.cast(token_id, sp.nat)
            return self.data.slugs.get(token_id, default="")


if "templates" not in __name__:
    admin = sp.address("tz1burnburnburnburnburnburnburjAYjjX")
    signer_pubkey = sp.key("edpku6hZd7SogVb59XhElEhGVoyNEaNQv2rP8Kw1EZbSmNU11YwRHF")
    metadata_base_cid = "CID_TBD_ADMIN_SETS_POST_PIN"
    contract_metadata = sp.big_map({"": sp.utils.bytes_of_string("ipfs://CID_TBD_CONTRACT_METADATA")})
    sp.add_compilation_target(
        "kowloon_achievements",
        main.KowloonAchievements(admin, signer_pubkey, metadata_base_cid, contract_metadata),
    )
