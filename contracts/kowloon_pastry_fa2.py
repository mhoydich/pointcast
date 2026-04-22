"""
Kowloon Pastry — FA2 multi-asset NFT (6 genesis token IDs).

Token IDs 0..5 map to the 6 pastries. Voucher-signed claim for self-claim,
admin_mint for finale airdrop. 10% royalty, CC0 art.
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


@sp.module
def main():
    import fa2_lib

    MAX_TOKEN_ID = sp.nat(5)

    class KowloonPastry(fa2_lib.Admin, fa2_lib.Fa2MultiAsset):
        def __init__(self, admin, signer_pubkey, metadata_base_cid, contract_metadata):
            fa2_lib.Fa2MultiAsset.__init__(
                self, metadata=contract_metadata, token_metadata=[], ledger={},
            )
            fa2_lib.Admin.__init__(self, admin)
            self.data.signer_pubkey = signer_pubkey
            self.data.metadata_base_cid = metadata_base_cid
            self.data.royalty_bps = sp.nat(1000)
            self.data.supply = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.nat])
            self.data.used_nonces = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.unit])

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
        def claim_pastry(self, params):
            sp.cast(params, sp.record(
                recipient=sp.address, token_id=sp.nat, nonce=sp.nat,
                expiry=sp.timestamp, signature=sp.signature,
            ))
            assert params.recipient == sp.sender, "RECIPIENT_MISMATCH"
            assert params.token_id <= MAX_TOKEN_ID, "TOKEN_ID_OUT_OF_RANGE"
            assert sp.now <= params.expiry, "VOUCHER_EXPIRED"
            assert not self.data.used_nonces.contains(params.nonce), "NONCE_USED"
            payload = sp.pack(
                (params.recipient, (params.token_id, (params.nonce, params.expiry)))
            )
            assert sp.check_signature(
                self.data.signer_pubkey, params.signature, payload
            ), "BAD_SIGNATURE"
            self._lazy_register(params.token_id)
            self.data.used_nonces[params.nonce] = ()
            self.data.supply[params.token_id] += sp.nat(1)
            key = (params.recipient, params.token_id)
            current = self.data.ledger.get(key, default=sp.nat(0))
            self.data.ledger[key] = current + sp.nat(1)

        @sp.entrypoint
        def admin_mint(self, params):
            sp.cast(params, sp.record(recipient=sp.address, token_id=sp.nat, amount=sp.nat))
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            assert params.token_id <= MAX_TOKEN_ID, "TOKEN_ID_OUT_OF_RANGE"
            self._lazy_register(params.token_id)
            self.data.supply[params.token_id] += params.amount
            key = (params.recipient, params.token_id)
            current = self.data.ledger.get(key, default=sp.nat(0))
            self.data.ledger[key] = current + params.amount

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
        def set_royalty_bps(self, bps):
            sp.cast(bps, sp.nat)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            assert bps <= sp.nat(2500), "ROYALTY_OVER_CAP"
            self.data.royalty_bps = bps

        @sp.offchain_view(pure=True)
        def token_supply(self, token_id):
            sp.cast(token_id, sp.nat)
            return self.data.supply.get(token_id, default=sp.nat(0))


if "templates" not in __name__:
    admin = sp.address("tz1burnburnburnburnburnburnburjAYjjX")
    signer_pubkey = sp.key("edpku6hZd7SogVb59XhElEhGVoyNEaNQv2rP8Kw1EZbSmNU11YwRHF")
    metadata_base_cid = "CID_TBD_ADMIN_SETS_POST_PIN"
    contract_metadata = sp.big_map({"": sp.utils.bytes_of_string("ipfs://CID_TBD_CONTRACT_METADATA")})
    sp.add_compilation_target(
        "kowloon_pastry",
        main.KowloonPastry(admin, signer_pubkey, metadata_base_cid, contract_metadata),
    )
