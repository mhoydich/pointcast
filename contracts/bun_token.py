"""
$BUN — FA1.2 fungible token for the Kowloon universe.

Voucher-signed mint (same pattern as DRUM). Server /api/kowloon-voucher
caps earn at 2.00/day/wallet, signs (recipient, amount, nonce, expiry),
contract verifies + mints. Replay-protected via used_nonces big_map.

Compile:
    python3 -m smartpy compile contracts/bun_token.py contracts/build/
"""

import smartpy as sp


@sp.module
def main():

    class BunToken(sp.Contract):
        def __init__(self, admin, signer_pubkey, metadata):
            self.data.admin = admin
            self.data.signer_pubkey = signer_pubkey
            self.data.total_supply = sp.nat(0)
            self.data.ledger = sp.cast(sp.big_map(), sp.big_map[sp.address, sp.nat])
            self.data.allowances = sp.cast(
                sp.big_map(),
                sp.big_map[sp.pair[sp.address, sp.address], sp.nat],
            )
            self.data.used_nonces = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.unit])
            self.data.paused = False
            self.data.metadata = metadata

        @sp.entrypoint
        def transfer(self, params):
            sp.cast(params, sp.record(from_=sp.address, to_=sp.address, value=sp.nat))
            assert not self.data.paused, "PAUSED"
            if sp.sender != params.from_:
                allow_key = (params.from_, sp.sender)
                assert self.data.allowances.contains(allow_key), "NO_ALLOWANCE"
                cur = self.data.allowances[allow_key]
                assert cur >= params.value, "ALLOWANCE_TOO_LOW"
                self.data.allowances[allow_key] = sp.as_nat(cur - params.value)
            src_bal = self.data.ledger.get(params.from_, default=sp.nat(0))
            assert src_bal >= params.value, "BALANCE_TOO_LOW"
            self.data.ledger[params.from_] = sp.as_nat(src_bal - params.value)
            self.data.ledger[params.to_] = (
                self.data.ledger.get(params.to_, default=sp.nat(0)) + params.value
            )

        @sp.entrypoint
        def approve(self, params):
            sp.cast(params, sp.record(spender=sp.address, value=sp.nat))
            assert not self.data.paused, "PAUSED"
            key = (sp.sender, params.spender)
            cur = self.data.allowances.get(key, default=sp.nat(0))
            assert cur == 0 or params.value == 0, "UNSAFE_ALLOWANCE_CHANGE"
            self.data.allowances[key] = params.value

        @sp.entrypoint
        def getBalance(self, params):
            sp.cast(params, sp.pair[sp.address, sp.contract[sp.nat]])
            owner, cb = sp.match_record(params, "owner", "cb")
            bal = self.data.ledger.get(owner, default=sp.nat(0))
            sp.transfer(bal, sp.mutez(0), cb)

        @sp.entrypoint
        def getAllowance(self, params):
            sp.cast(
                params,
                sp.pair[sp.pair[sp.address, sp.address], sp.contract[sp.nat]],
            )
            key, cb = sp.match_record(params, "key", "cb")
            amt = self.data.allowances.get(key, default=sp.nat(0))
            sp.transfer(amt, sp.mutez(0), cb)

        @sp.entrypoint
        def getTotalSupply(self, cb):
            sp.cast(cb, sp.contract[sp.nat])
            sp.transfer(self.data.total_supply, sp.mutez(0), cb)

        @sp.entrypoint
        def claim(self, params):
            sp.cast(
                params,
                sp.record(
                    recipient=sp.address, amount=sp.nat, nonce=sp.nat,
                    expiry=sp.timestamp, signature=sp.signature,
                ),
            )
            assert not self.data.paused, "PAUSED"
            assert params.recipient == sp.sender, "RECIPIENT_MISMATCH"
            assert sp.now <= params.expiry, "VOUCHER_EXPIRED"
            assert not self.data.used_nonces.contains(params.nonce), "NONCE_USED"
            payload = sp.pack(
                (params.recipient, (params.amount, (params.nonce, params.expiry)))
            )
            assert sp.check_signature(
                self.data.signer_pubkey, params.signature, payload
            ), "BAD_SIGNATURE"
            self.data.used_nonces[params.nonce] = ()
            self.data.total_supply += params.amount
            self.data.ledger[params.recipient] = (
                self.data.ledger.get(params.recipient, default=sp.nat(0))
                + params.amount
            )

        @sp.entrypoint
        def setSignerPubkey(self, new_pubkey):
            sp.cast(new_pubkey, sp.key)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.signer_pubkey = new_pubkey

        @sp.entrypoint
        def setPaused(self, v):
            sp.cast(v, sp.bool)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.paused = v

        @sp.entrypoint
        def setAdmin(self, new_admin):
            sp.cast(new_admin, sp.address)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.admin = new_admin

        @sp.entrypoint
        def setMetadata(self, uri):
            sp.cast(uri, sp.bytes)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.metadata[""] = uri

        @sp.entrypoint
        def adminMint(self, params):
            sp.cast(params, sp.record(recipient=sp.address, amount=sp.nat))
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.total_supply += params.amount
            self.data.ledger[params.recipient] = (
                self.data.ledger.get(params.recipient, default=sp.nat(0))
                + params.amount
            )


if "templates" not in __name__:
    admin = sp.address("tz1burnburnburnburnburnburnburjAYjjX")
    signer_pubkey = sp.key("edpku6hZd7SogVb59XhElEhGVoyNEaNQv2rP8Kw1EZbSmNU11YwRHF")
    metadata = sp.big_map({"": sp.utils.bytes_of_string("ipfs://CID_TBD_ADMIN_SETS_POST_DEPLOY")})
    sp.add_compilation_target("bun_token", main.BunToken(admin, signer_pubkey, metadata))
