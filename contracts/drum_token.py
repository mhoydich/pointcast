"""
DRUM — FA1.2 fungible token for the PointCast drum room.

Phase C. Users earn DRUM by tapping drums on pointcast.xyz. Server
tracks accumulated drums in KV (src: functions/api/drum.ts), then signs
a claim voucher — the contract verifies the signature and mints DRUM to
the claimant's wallet.

Why FA1.2?
    Smaller contract, simpler interface, widely supported by every
    Tezos wallet + DEX that matters. DRUM is a plain fungible; no need
    for FA2's multi-asset machinery.

Why signed vouchers (not a permissionless mint)?
    A bare public `mint(amount)` entrypoint would let anyone claim any
    amount. We keep the counter of who-drummed-how-much server-side (in
    the VISITS KV), and the admin signs short-lived vouchers after
    verifying the drum count. The contract only accepts voucher-backed
    mints. Replay protection via `used_nonces` big_map.

Voucher shape (off-chain before packing):
    sp.pair(recipient, sp.pair(amount, sp.pair(nonce, expiry)))

Signed with the admin's tz1 private key. Server (Cloudflare Pages
Function) holds the key as a `wrangler secret`.

Compile: smartpy.io/ide — paste this file, Run, Download JSON artifacts.

Deploy: /admin/deploy — paste Michelson + initial storage, Kukai signs.
"""

import smartpy as sp


@sp.module
def main():

    class DrumToken(sp.Contract):
        def __init__(self, admin, signer_pubkey, metadata):
            """
            admin          — tz-address that can rotate config + emergency mint
            signer_pubkey  — the public key used to verify claim vouchers;
                             its matching private key lives in the server
                             Worker secret `DRUM_SIGNER_KEY`
            metadata       — TZIP-16 contract-level metadata URI
            """
            self.data.admin = admin
            self.data.signer_pubkey = signer_pubkey
            self.data.total_supply = sp.nat(0)
            self.data.ledger = sp.cast(sp.big_map(), sp.big_map[sp.address, sp.nat])
            # FA1.2 allowances: (owner, spender) → amount
            self.data.allowances = sp.cast(
                sp.big_map(),
                sp.big_map[sp.pair[sp.address, sp.address], sp.nat],
            )
            self.data.used_nonces = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.unit])
            self.data.paused = False
            self.data.metadata = metadata

        # ----------------------------------------------------------
        # FA1.2 standard transfer
        # ----------------------------------------------------------
        @sp.entrypoint
        def transfer(self, params):
            sp.cast(params, sp.record(from_=sp.address, to_=sp.address, value=sp.nat))
            assert not self.data.paused, "PAUSED"
            # Sender must be `from_` or have allowance.
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

        # ----------------------------------------------------------
        # FA1.2 approve — set spender's allowance.
        # ----------------------------------------------------------
        @sp.entrypoint
        def approve(self, params):
            sp.cast(params, sp.record(spender=sp.address, value=sp.nat))
            assert not self.data.paused, "PAUSED"
            key = (sp.sender, params.spender)
            # FA1.2 spec quirk: require current allowance to be 0 OR new
            # value to be 0 (prevents the TOCTOU race on allowance change).
            cur = self.data.allowances.get(key, default=sp.nat(0))
            assert cur == 0 or params.value == 0, "UNSAFE_ALLOWANCE_CHANGE"
            self.data.allowances[key] = params.value

        # ----------------------------------------------------------
        # FA1.2 view callbacks
        # ----------------------------------------------------------

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

        # ----------------------------------------------------------
        # Voucher-based claim — the drum-room-to-wallet bridge.
        #
        # Server computes (recipient, amount, nonce, expiry), packs the
        # tuple, signs with admin's private key → hands the bundle to
        # the client. Client calls this entrypoint; contract verifies
        # and mints.
        # ----------------------------------------------------------
        @sp.entrypoint
        def claim(self, params):
            sp.cast(params, sp.record(
                recipient = sp.address,
                amount    = sp.nat,
                nonce     = sp.nat,
                expiry    = sp.timestamp,
                signature = sp.signature,
            ))
            assert not self.data.paused, "PAUSED"
            assert sp.now <= params.expiry, "VOUCHER_EXPIRED"
            assert not self.data.used_nonces.contains(params.nonce), "NONCE_USED"
            # Anti-spoof: recipient must be the caller (prevents passing
            # someone else's signed voucher to a wallet you control).
            assert sp.sender == params.recipient, "WRONG_RECIPIENT"

            # Re-construct the signed payload exactly as the server did.
            payload = sp.pack(sp.record(
                recipient = params.recipient,
                amount    = params.amount,
                nonce     = params.nonce,
                expiry    = params.expiry,
            ))
            assert sp.check_signature(
                self.data.signer_pubkey, params.signature, payload
            ), "BAD_SIGNATURE"

            # Mint.
            self.data.used_nonces[params.nonce] = sp.unit
            self.data.ledger[params.recipient] = (
                self.data.ledger.get(params.recipient, default=sp.nat(0))
                + params.amount
            )
            self.data.total_supply += params.amount

        # ----------------------------------------------------------
        # Admin.
        # ----------------------------------------------------------

        @sp.entrypoint
        def admin_mint(self, params):
            """Emergency admin mint — bypass vouchers. Used for initial
            treasury allocation or grants outside the drum-room loop."""
            sp.cast(params, sp.record(recipient=sp.address, amount=sp.nat))
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.ledger[params.recipient] = (
                self.data.ledger.get(params.recipient, default=sp.nat(0))
                + params.amount
            )
            self.data.total_supply += params.amount

        @sp.entrypoint
        def admin_burn(self, params):
            """Burn from any holder — reserved for abuse remediation."""
            sp.cast(params, sp.record(owner=sp.address, amount=sp.nat))
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            cur = self.data.ledger.get(params.owner, default=sp.nat(0))
            assert cur >= params.amount, "BALANCE_TOO_LOW"
            self.data.ledger[params.owner] = sp.as_nat(cur - params.amount)
            self.data.total_supply = sp.as_nat(self.data.total_supply - params.amount)

        @sp.entrypoint
        def set_signer(self, new_key):
            sp.cast(new_key, sp.key)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.signer_pubkey = new_key

        @sp.entrypoint
        def set_admin(self, new_admin):
            sp.cast(new_admin, sp.address)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.admin = new_admin

        @sp.entrypoint
        def set_paused(self, paused):
            sp.cast(paused, sp.bool)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.paused = paused


# ----------------------------------------------------------------------
# Minimal test
# ----------------------------------------------------------------------

if "main" in __name__:

    @sp.add_test(name="DrumToken basic flow")
    def test():
        sc = sp.test_scenario(main)
        sc.h1("DRUM — FA1.2 + voucher claim")

        admin = sp.test_account("admin")
        alice = sp.test_account("alice")
        bob = sp.test_account("bob")
        # Use admin's key for signing; production uses a separate signer key
        # stored as a Worker secret.
        signer = sp.test_account("signer")

        meta = sp.utils.metadata_of_url("ipfs://QmDrumStub")

        c = main.DrumToken(
            admin=admin.address,
            signer_pubkey=signer.public_key,
            metadata=meta,
        )
        sc += c

        # Admin mint for initial treasury.
        c.admin_mint(sp.record(recipient=admin.address, amount=sp.nat(1000))).run(
            sender=admin
        )
        sc.verify(c.data.total_supply == 1000)
        sc.verify(c.data.ledger[admin.address] == 1000)

        # Non-admin mint — fails.
        c.admin_mint(sp.record(recipient=alice.address, amount=sp.nat(100))).run(
            sender=alice, valid=False
        )

        # Voucher claim flow — server signs, alice submits.
        now = sp.timestamp(1_770_000_000)
        expiry = sp.timestamp(1_770_000_000 + 600)  # +10min
        payload = sp.pack(sp.record(
            recipient = alice.address,
            amount    = sp.nat(50),
            nonce     = sp.nat(12345),
            expiry    = expiry,
        ))
        signature = sp.make_signature(
            secret_key=signer.secret_key, message=payload, message_format='Raw',
        )
        c.claim(sp.record(
            recipient = alice.address,
            amount    = sp.nat(50),
            nonce     = sp.nat(12345),
            expiry    = expiry,
            signature = signature,
        )).run(sender=alice, now=now)
        sc.verify(c.data.ledger[alice.address] == 50)
        sc.verify(c.data.total_supply == 1050)

        # Replay same voucher — fails.
        c.claim(sp.record(
            recipient = alice.address,
            amount    = sp.nat(50),
            nonce     = sp.nat(12345),
            expiry    = expiry,
            signature = signature,
        )).run(sender=alice, now=now, valid=False)

        # Wrong-recipient attack — alice's voucher, bob's call — fails.
        c.claim(sp.record(
            recipient = alice.address,
            amount    = sp.nat(50),
            nonce     = sp.nat(99999),
            expiry    = expiry,
            signature = signature,
        )).run(sender=bob, now=now, valid=False)

        # Expired voucher — fails.
        expired_payload = sp.pack(sp.record(
            recipient = alice.address,
            amount    = sp.nat(10),
            nonce     = sp.nat(55555),
            expiry    = sp.timestamp(1_770_000_000 - 100),
        ))
        expired_sig = sp.make_signature(
            secret_key=signer.secret_key, message=expired_payload, message_format='Raw',
        )
        c.claim(sp.record(
            recipient = alice.address,
            amount    = sp.nat(10),
            nonce     = sp.nat(55555),
            expiry    = sp.timestamp(1_770_000_000 - 100),
            signature = expired_sig,
        )).run(sender=alice, now=now, valid=False)

        # Transfer — alice → bob — regular FA1.2
        c.transfer(sp.record(
            from_=alice.address, to_=bob.address, value=sp.nat(20),
        )).run(sender=alice)
        sc.verify(c.data.ledger[alice.address] == 30)
        sc.verify(c.data.ledger[bob.address] == 20)

        # Pause → transfer blocked
        c.set_paused(True).run(sender=admin)
        c.transfer(sp.record(
            from_=alice.address, to_=bob.address, value=sp.nat(5),
        )).run(sender=alice, valid=False)
