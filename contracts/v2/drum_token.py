"""
DRUM Token — FA1.2 Fungible Token with Signed-Voucher Claim Flow
SmartPy v0.24.1

Storage layout:
  admin        : address       — contract administrator
  signer       : key           — off-chain signer whose public key is trusted for vouchers
  paused       : bool          — global pause flag
  total_supply : nat           — total tokens in circulation
  ledger       : big_map[address, {balance: nat, approvals: map[address, nat]}]
  used_nonces  : big_map[nat, unit]  — replay-protection registry
  metadata     : big_map[string, bytes]  — TZIP-016 contract metadata

Entrypoints:
  FA1.2 standard:
    transfer(from_, to_, value)
    approve(spender, value)
    getBalance(address, callback)
    getAllowance((owner, spender), callback)
    getTotalSupply((unit, callback))

  Admin:
    admin_mint(to_, amount)
    admin_burn(from_, amount)
    set_signer(key)
    set_paused(bool)

  Claim flow:
    claim(recipient, amount, nonce, expiry, signature)
      — verifies sp.check_signature over sp.pack({amount, expiry, nonce, recipient})
      — checks nonce not in used_nonces (replay protection)
      — checks sp.now <= expiry
      — requires sp.sender == recipient (anti-spoof)
      — mints amount to recipient and records nonce
"""

import smartpy as sp


@sp.module
def m():
    # SmartPy IDE imports user code as `import main` at runtime; naming the
    # @sp.module function `main` collides with that, raising NameError on
    # `sp` because the runtime evaluates the decorator before the import
    # finishes. Use `m` (matches coffee_mugs_fa2.py + visit_nouns_fa2.py).
    class DrumToken(sp.Contract):
        def __init__(self, admin, signer):
            """
            Positional init — both arguments are required at origination.

            admin  : sp.address  — the administrator address
            signer : sp.key      — the Ed25519/secp256k1 public key used to sign vouchers
            """
            self.data.admin = admin
            self.data.signer = signer
            self.data.paused = False
            self.data.total_supply = sp.nat(0)
            self.data.ledger = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.address,
                    sp.record(approvals=sp.map[sp.address, sp.nat], balance=sp.nat),
                ],
            )
            self.data.used_nonces = sp.cast(
                sp.big_map(),
                sp.big_map[sp.nat, sp.unit],
            )
            self.data.metadata = sp.cast(
                sp.big_map(),
                sp.big_map[sp.string, sp.bytes],
            )

        # ------------------------------------------------------------------ #
        # Internal helpers                                                     #
        # ------------------------------------------------------------------ #

        @sp.private(with_storage="read-only")
        def is_administrator_(self, sender):
            """Return True if sender is the current admin."""
            return sender == self.data.admin

        # ------------------------------------------------------------------ #
        # FA1.2 Standard Entrypoints                                          #
        # ------------------------------------------------------------------ #

        @sp.entrypoint
        def transfer(self, param):
            """
            Transfer `value` tokens from `from_` to `to_`.

            If the caller is not the admin:
              - the contract must not be paused
              - if from_ != sender, an allowance must cover the transfer
            """
            sp.cast(
                param,
                sp.record(from_=sp.address, to_=sp.address, value=sp.nat).layout(
                    ("from_ as from", ("to_ as to", "value"))
                ),
            )
            assert not self.data.paused, "FA1.2_Paused"

            balance_from = self.data.ledger.get(
                param.from_, default=sp.record(balance=0, approvals={})
            )
            balance_to = self.data.ledger.get(
                param.to_, default=sp.record(balance=0, approvals={})
            )

            balance_from.balance = sp.as_nat(
                balance_from.balance - param.value, error="FA1.2_InsufficientBalance"
            )
            balance_to.balance += param.value

            if not self.is_administrator_(sp.sender):
                if param.from_ != sp.sender:
                    balance_from.approvals[sp.sender] = sp.as_nat(
                        balance_from.approvals[sp.sender] - param.value,
                        error="FA1.2_NotAllowed",
                    )

            self.data.ledger[param.from_] = balance_from
            self.data.ledger[param.to_] = balance_to

        @sp.entrypoint
        def approve(self, param):
            """
            Approve `spender` to transfer up to `value` tokens on behalf of sender.

            Follows the FA1.2 safe-allowance-change pattern: the current
            allowance must be zero before setting a new non-zero value.
            """
            sp.cast(
                param,
                sp.record(spender=sp.address, value=sp.nat).layout(
                    ("spender", "value")
                ),
            )
            assert not self.data.paused, "FA1.2_Paused"

            spender_balance = self.data.ledger.get(
                sp.sender, default=sp.record(balance=0, approvals={})
            )
            alreadyApproved = spender_balance.approvals.get(param.spender, default=0)
            assert (
                alreadyApproved == 0 or param.value == 0
            ), "FA1.2_UnsafeAllowanceChange"

            spender_balance.approvals[param.spender] = param.value
            self.data.ledger[sp.sender] = spender_balance

        @sp.entrypoint
        def getBalance(self, param):
            """Callback-based view: returns the token balance of `address`."""
            (address, callback) = param
            result = self.data.ledger.get(
                address, default=sp.record(balance=0, approvals={})
            ).balance
            sp.transfer(result, sp.tez(0), callback)

        @sp.entrypoint
        def getAllowance(self, param):
            """Callback-based view: returns the allowance of `spender` for `owner`."""
            (args, callback) = param
            result = self.data.ledger.get(
                args.owner, default=sp.record(balance=0, approvals={})
            ).approvals.get(args.spender, default=0)
            sp.transfer(result, sp.tez(0), callback)

        @sp.entrypoint
        def getTotalSupply(self, param: sp.pair[sp.unit, sp.contract[sp.nat]]):
            """Callback-based view: returns the total token supply."""
            sp.transfer(self.data.total_supply, sp.tez(0), sp.snd(param))

        # ------------------------------------------------------------------ #
        # Admin Entrypoints                                                    #
        # ------------------------------------------------------------------ #

        @sp.entrypoint
        def admin_mint(self, param: sp.record(to_=sp.address, amount=sp.nat)):
            """Mint `amount` DRUM tokens to `to_`. Admin only."""
            assert self.is_administrator_(sp.sender), "Fa1.2_NotAdmin"
            receiver_balance = self.data.ledger.get(
                param.to_, default=sp.record(balance=0, approvals={})
            )
            receiver_balance.balance += param.amount
            self.data.ledger[param.to_] = receiver_balance
            self.data.total_supply += param.amount

        @sp.entrypoint
        def admin_burn(self, param: sp.record(from_=sp.address, amount=sp.nat)):
            """Burn `amount` DRUM tokens from `from_`. Admin only."""
            assert self.is_administrator_(sp.sender), "Fa1.2_NotAdmin"
            receiver_balance = self.data.ledger.get(
                param.from_, default=sp.record(balance=0, approvals={})
            )
            receiver_balance.balance = sp.as_nat(
                receiver_balance.balance - param.amount,
                error="FA1.2_InsufficientBalance",
            )
            self.data.ledger[param.from_] = receiver_balance
            self.data.total_supply = sp.as_nat(self.data.total_supply - param.amount)

        @sp.entrypoint
        def set_signer(self, param: sp.key):
            """Update the trusted signer public key. Admin only."""
            assert self.is_administrator_(sp.sender), "Fa1.2_NotAdmin"
            self.data.signer = param

        @sp.entrypoint
        def set_paused(self, param: sp.bool):
            """Pause or unpause the contract. Admin only."""
            assert self.is_administrator_(sp.sender), "Fa1.2_NotAdmin"
            self.data.paused = param

        # ------------------------------------------------------------------ #
        # Signed-Voucher Claim Entrypoint                                     #
        # ------------------------------------------------------------------ #

        @sp.entrypoint
        def claim(
            self,
            param: sp.record(
                recipient=sp.address,
                amount=sp.nat,
                nonce=sp.nat,
                expiry=sp.timestamp,
                signature=sp.signature,
            ),
        ):
            """
            Claim DRUM tokens via a backend-signed voucher.

            Checks (in order):
              1. Contract is not paused.
              2. sp.sender == recipient  (anti-spoof: only the intended recipient
                 can submit their own voucher).
              3. sp.now <= expiry        (voucher has not expired).
              4. nonce not in used_nonces (replay protection).
              5. sp.check_signature verifies the backend signature over the
                 packed payload: {amount, expiry, nonce, recipient}.

            On success: mints `amount` to `recipient` and records the nonce.

            Payload packing note:
              SmartPy records are sorted alphabetically in Michelson, so the
              packed binary is: pack({amount, expiry, nonce, recipient}).
              The backend MUST pack in the same field order.
            """
            assert not self.data.paused, "FA1.2_Paused"
            assert sp.sender == param.recipient, "Claim_WrongSender"
            assert sp.now <= param.expiry, "Claim_Expired"
            assert not (param.nonce in self.data.used_nonces), "Claim_NonceReplay"

            # Build the payload the backend signed
            payload = sp.pack(
                sp.record(
                    recipient=param.recipient,
                    amount=param.amount,
                    nonce=param.nonce,
                    expiry=param.expiry,
                )
            )

            assert sp.check_signature(
                self.data.signer, param.signature, payload
            ), "Claim_InvalidSignature"

            # Record nonce to prevent replay
            self.data.used_nonces[param.nonce] = ()

            # Mint tokens to recipient
            receiver_balance = self.data.ledger.get(
                param.recipient, default=sp.record(balance=0, approvals={})
            )
            receiver_balance.balance += param.amount
            self.data.ledger[param.recipient] = receiver_balance
            self.data.total_supply += param.amount

    # ---------------------------------------------------------------------- #
    # Test helper: callback contract for view entrypoints                     #
    # ---------------------------------------------------------------------- #

    class Viewer_nat(sp.Contract):
        """Simple callback contract that stores the last nat value received."""

        def __init__(self):
            self.data.last = sp.cast(None, sp.option[sp.nat])

        @sp.entrypoint
        def target(self, params):
            self.data.last = sp.Some(params)


# -------------------------------------------------------------------------- #
# Test Scenarios                                                               #
# -------------------------------------------------------------------------- #

if "main" in __name__:

    @sp.add_test()
    def test():
        sc = sp.test_scenario("DRUM Token", m)
        sc.h1("DRUM Token — FA1.2 + Signed-Voucher Claim")

        # Deterministic test accounts
        admin = sp.test_account("Admin")
        signer = sp.test_account("Signer")
        alice = sp.test_account("Alice")
        bob = sp.test_account("Bob")
        charlie = sp.test_account("Charlie")

        sc.h2("Accounts")
        sc.show([admin, alice, bob, charlie])

        # ------------------------------------------------------------------ #
        # Originate                                                            #
        # ------------------------------------------------------------------ #
        sc.h1("Originate Contract")
        c1 = m.DrumToken(admin=admin.address, signer=signer.public_key)
        sc += c1

        # ------------------------------------------------------------------ #
        # Admin mint                                                           #
        # ------------------------------------------------------------------ #
        sc.h1("Admin Mints Tokens")
        c1.admin_mint(to_=alice.address, amount=100, _sender=admin)
        sc.verify(c1.data.ledger[alice.address].balance == 100)
        sc.verify(c1.data.total_supply == 100)

        # ------------------------------------------------------------------ #
        # Transfer                                                             #
        # ------------------------------------------------------------------ #
        sc.h1("Transfer: Alice → Bob")
        c1.transfer(from_=alice.address, to_=bob.address, value=20, _sender=alice)
        sc.verify(c1.data.ledger[alice.address].balance == 80)
        sc.verify(c1.data.ledger[bob.address].balance == 20)

        # ------------------------------------------------------------------ #
        # Approve + transferFrom                                               #
        # ------------------------------------------------------------------ #
        sc.h1("Approve and TransferFrom")
        c1.approve(spender=charlie.address, value=30, _sender=bob)
        sc.verify(c1.data.ledger[bob.address].approvals[charlie.address] == 30)

        c1.transfer(from_=bob.address, to_=charlie.address, value=15, _sender=charlie)
        sc.verify(c1.data.ledger[bob.address].balance == 5)
        sc.verify(c1.data.ledger[charlie.address].balance == 15)
        sc.verify(c1.data.ledger[bob.address].approvals[charlie.address] == 15)

        # ------------------------------------------------------------------ #
        # Claim — valid voucher                                                #
        # ------------------------------------------------------------------ #
        sc.h1("Claim: Valid Voucher")
        expiry_time = sp.timestamp_from_utc(2030, 1, 1, 0, 0, 0)
        payload = sp.pack(
            sp.record(
                recipient=alice.address,
                amount=50,
                nonce=1,
                expiry=expiry_time,
            )
        )
        sig = sp.make_signature(signer.secret_key, payload, message_format="Raw")

        c1.claim(
            recipient=alice.address,
            amount=50,
            nonce=1,
            expiry=expiry_time,
            signature=sig,
            _sender=alice,
        )
        sc.verify(c1.data.ledger[alice.address].balance == 130)
        sc.verify(c1.data.total_supply == 150)
        sc.verify(c1.data.used_nonces.contains(1))

        # ------------------------------------------------------------------ #
        # Claim — replay rejection                                             #
        # ------------------------------------------------------------------ #
        sc.h1("Claim: Replay Rejection (same nonce)")
        c1.claim(
            recipient=alice.address,
            amount=50,
            nonce=1,
            expiry=expiry_time,
            signature=sig,
            _sender=alice,
            _valid=False,
            _exception="Claim_NonceReplay",
        )

        # ------------------------------------------------------------------ #
        # Claim — expired voucher                                              #
        # ------------------------------------------------------------------ #
        sc.h1("Claim: Expired Voucher")
        expired_time = sp.timestamp(0)
        payload2 = sp.pack(
            sp.record(
                recipient=alice.address,
                amount=50,
                nonce=2,
                expiry=expired_time,
            )
        )
        sig2 = sp.make_signature(signer.secret_key, payload2, message_format="Raw")
        c1.claim(
            recipient=alice.address,
            amount=50,
            nonce=2,
            expiry=expired_time,
            signature=sig2,
            _sender=alice,
            _now=sp.timestamp(100),  # Simulate time after expiry
            _valid=False,
            _exception="Claim_Expired",
        )

        # ------------------------------------------------------------------ #
        # Claim — wrong sender (anti-spoof)                                   #
        # ------------------------------------------------------------------ #
        sc.h1("Claim: Wrong Sender Rejection")
        payload3 = sp.pack(
            sp.record(
                recipient=bob.address,
                amount=50,
                nonce=3,
                expiry=expiry_time,
            )
        )
        sig3 = sp.make_signature(signer.secret_key, payload3, message_format="Raw")
        c1.claim(
            recipient=bob.address,
            amount=50,
            nonce=3,
            expiry=expiry_time,
            signature=sig3,
            _sender=alice,  # Alice tries to claim Bob's voucher — rejected
            _valid=False,
            _exception="Claim_WrongSender",
        )

        # ------------------------------------------------------------------ #
        # Claim — paused contract blocks claims                                #
        # ------------------------------------------------------------------ #
        sc.h1("Claim: Paused Contract Blocks Claims")
        c1.set_paused(True, _sender=admin)
        c1.claim(
            recipient=bob.address,
            amount=50,
            nonce=3,
            expiry=expiry_time,
            signature=sig3,
            _sender=bob,
            _valid=False,
            _exception="FA1.2_Paused",
        )
        # Unpause for subsequent operations
        c1.set_paused(False, _sender=admin)

        # ------------------------------------------------------------------ #
        # Admin signer rotation                                                #
        # ------------------------------------------------------------------ #
        sc.h1("Admin: Signer Rotation")
        new_signer = sp.test_account("NewSigner")
        c1.set_signer(new_signer.public_key, _sender=admin)
        sc.verify(c1.data.signer == new_signer.public_key)

        # Verify old signature is now invalid after rotation
        c1.claim(
            recipient=alice.address,
            amount=50,
            nonce=4,
            expiry=expiry_time,
            signature=sig,  # Signed by old signer
            _sender=alice,
            _valid=False,
            _exception="Claim_InvalidSignature",
        )

        # ------------------------------------------------------------------ #
        # View entrypoints                                                     #
        # ------------------------------------------------------------------ #
        sc.h1("View Entrypoints")

        sc.h2("getBalance")
        view_balance = m.Viewer_nat()
        sc += view_balance
        target_nat = sp.contract(sp.nat, view_balance.address, "target").unwrap_some()
        c1.getBalance((alice.address, target_nat))
        sc.verify_equal(view_balance.data.last, sp.Some(130))

        sc.h2("getTotalSupply")
        view_supply = m.Viewer_nat()
        sc += view_supply
        target_supply = sp.contract(sp.nat, view_supply.address, "target").unwrap_some()
        c1.getTotalSupply((sp.unit, target_supply))
        sc.verify_equal(view_supply.data.last, sp.Some(150))

        sc.h2("getAllowance")
        view_allowance = m.Viewer_nat()
        sc += view_allowance
        target_allowance = sp.contract(
            sp.nat, view_allowance.address, "target"
        ).unwrap_some()
        c1.getAllowance(
            (sp.record(owner=bob.address, spender=charlie.address), target_allowance)
        )
        sc.verify_equal(view_allowance.data.last, sp.Some(15))

        sc.h2("Admin Burn")
        c1.admin_burn(from_=alice.address, amount=10, _sender=admin)
        sc.verify(c1.data.ledger[alice.address].balance == 120)
        sc.verify(c1.data.total_supply == 140)
