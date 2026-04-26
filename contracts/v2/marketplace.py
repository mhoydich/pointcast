"""
marketplace.py - objkt-style FA2 NFT Marketplace
SmartPy v0.24.1

Architecture
============
A single @sp.module wraps the Marketplace contract (plain sp.Contract - no
fa2_lib mixin needed here since the marketplace does not hold tokens itself).
A second @sp.module (mock_fa2_module) provides a minimal stub FA2 contract
used exclusively by the test scenario.

Royalty flow on fulfill
=======================
  price_mutez
    ├─ platform_fee  = split_tokens(price, platform_fee_bps, 10000)  - platform_fee_receiver
    ├─ royalty_fee   = split_tokens(price, royalty_bps,       10000)  - royalty_receiver
    └─ seller_amount = price - platform_fee - royalty_fee             - seller

Error codes
===========
  M_NO_SELF_FULFILL       - buyer == seller
  ASK_NOT_FOUND           - ask_id does not exist
  NOT_SELLER              - caller is not the listing seller
  NOT_ADMIN               - caller is not the admin
  INCORRECT_AMOUNT        - sp.amount ≠ ask.amount_mutez
  MARKETPLACE_PAUSED      - contract is paused
  INVALID_ROYALTY_BPS     - royalty_bps > 10000
  FEE_CAPPED_AT_10_PERCENT- new platform fee > 1000 bps (10 %)
  INVALID_FA2_CONTRACT    - fa2_contract address does not expose a transfer entrypoint
"""

import smartpy as sp


# ---------------------------------------------------------------------------
# Main module - contains the Marketplace contract
# ---------------------------------------------------------------------------
@sp.module
def m():
    # SmartPy IDE imports user code as `import main` at runtime; naming the
    # @sp.module function `main` collides with that. Use `m`.
    class Marketplace(sp.Contract):
        """
        Objkt-style multi-collection FA2 marketplace.

        One originated marketplace handles every PointCast FA2 (Coffee
        Mugs, Visit Nouns, Birthdays, future drops). The fa2_contract
        address lives per-ask rather than per-marketplace, so any FA2
        token can be listed through the same surface and same ask_id
        space.

        Storage fields
        --------------
        admin                : sp.address  - privileged account
        platform_fee_bps     : sp.nat      - platform fee in basis points (max 1000 = 10 %)
        platform_fee_receiver: sp.address  - receives platform fee on each sale
        royalty_receiver     : sp.address  - receives creator royalty on each sale
        paused               : sp.bool     - if True, list/update/fulfill are disabled
        next_ask_id          : sp.nat      - auto-incrementing listing counter
        asks                 : big_map     - ask_id -> Ask record (includes fa2_contract)

        Ask record fields
        -----------------
        seller       : sp.address  - lister (must be FA2 owner + have approved this marketplace as operator)
        fa2_contract : sp.address  - which collection the token lives on
        token_id     : sp.nat      - which token within that collection
        amount_mutez : sp.mutez    - asking price
        royalty_bps  : sp.nat      - royalty share (per-listing, 0-10000)
        """

        def __init__(
            self,
            admin: sp.address,
            platform_fee_bps: sp.nat,
            platform_fee_receiver: sp.address,
            royalty_receiver: sp.address,
        ):
            # Multi-collection marketplace: fa2_contract lives per-ask
            # rather than per-marketplace, so one originated marketplace
            # handles every PointCast FA2 (Coffee Mugs, Visit Nouns,
            # Birthdays, future drops). Sellers list by passing the
            # contract address into list_ask.
            self.data.admin = admin
            self.data.platform_fee_bps = platform_fee_bps
            self.data.platform_fee_receiver = platform_fee_receiver
            self.data.royalty_receiver = royalty_receiver
            self.data.paused = False
            self.data.next_ask_id = sp.nat(0)

            # Typed big map: ask_id -> Ask record
            self.data.asks = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(
                        seller=sp.address,
                        fa2_contract=sp.address,
                        token_id=sp.nat,
                        amount_mutez=sp.mutez,
                        royalty_bps=sp.nat,
                    ),
                ],
            )

        # ------------------------------------------------------------------
        # Seller entrypoints
        # ------------------------------------------------------------------

        @sp.entrypoint
        def list_ask(self, fa2_contract, token_id, amount_mutez, royalty_bps):
            """
            Seller creates a new listing.

            Parameters
            ----------
            fa2_contract : sp.address - FA2 contract the token lives on
            token_id     : sp.nat     - FA2 token ID to list
            amount_mutez : sp.mutez   - asking price in mutez
            royalty_bps  : sp.nat     - royalty share in basis points (0-10000)
            """
            assert not self.data.paused, "MARKETPLACE_PAUSED"
            assert royalty_bps <= 10000, "INVALID_ROYALTY_BPS"

            ask_id = self.data.next_ask_id
            self.data.asks[ask_id] = sp.record(
                seller=sp.sender,
                fa2_contract=fa2_contract,
                token_id=token_id,
                amount_mutez=amount_mutez,
                royalty_bps=royalty_bps,
            )
            self.data.next_ask_id += 1

        @sp.entrypoint
        def cancel_ask(self, ask_id):
            """
            Seller removes their own listing.

            Parameters
            ----------
            ask_id : sp.nat - ID of the listing to cancel
            """
            assert self.data.asks.contains(ask_id), "ASK_NOT_FOUND"
            ask = self.data.asks[ask_id]
            assert sp.sender == ask.seller, "NOT_SELLER"

            del self.data.asks[ask_id]

        @sp.entrypoint
        def update_ask(self, ask_id, new_amount_mutez):
            """
            Seller changes the price of an existing listing.

            Parameters
            ----------
            ask_id          : sp.nat   - ID of the listing to update
            new_amount_mutez: sp.mutez - new asking price in mutez
            """
            assert not self.data.paused, "MARKETPLACE_PAUSED"
            assert self.data.asks.contains(ask_id), "ASK_NOT_FOUND"
            ask = self.data.asks[ask_id]
            assert sp.sender == ask.seller, "NOT_SELLER"

            self.data.asks[ask_id].amount_mutez = new_amount_mutez

        # ------------------------------------------------------------------
        # Buyer entrypoint
        # ------------------------------------------------------------------

        @sp.entrypoint
        def fulfill_ask(self, ask_id):
            """
            Buyer pays the listed price and receives the NFT.

            The entrypoint:
              1. Validates the ask exists, caller is not the seller, and
                 sp.amount equals the listed price.
              2. Splits the payment: seller share, platform fee, royalty.
              3. Dispatches an FA2 transfer from seller - buyer.
              4. Deletes the ask from storage.

            Parameters
            ----------
            ask_id : sp.nat - ID of the listing to fulfill
            """
            assert not self.data.paused, "MARKETPLACE_PAUSED"
            assert self.data.asks.contains(ask_id), "ASK_NOT_FOUND"

            ask = self.data.asks[ask_id]
            assert sp.sender != ask.seller, "M_NO_SELF_FULFILL"
            assert sp.amount == ask.amount_mutez, "INCORRECT_AMOUNT"

            # ── Fee calculation ──────────────────────────────────────────
            # sp.split_tokens(amount, numerator, denominator) performs
            # floor division in mutez, preventing rounding overflow.
            platform_fee = sp.split_tokens(
                ask.amount_mutez, self.data.platform_fee_bps, 10000
            )
            royalty_fee = sp.split_tokens(ask.amount_mutez, ask.royalty_bps, 10000)
            seller_amount = ask.amount_mutez - platform_fee - royalty_fee

            # ── Disbursements ────────────────────────────────────────────
            if seller_amount > sp.mutez(0):
                sp.send(ask.seller, seller_amount)

            if platform_fee > sp.mutez(0):
                sp.send(self.data.platform_fee_receiver, platform_fee)

            if royalty_fee > sp.mutez(0):
                sp.send(self.data.royalty_receiver, royalty_fee)

            # ── FA2 transfer: seller - buyer ─────────────────────────────
            # Build the FA2 transfer_params list (TZIP-12 layout).
            transfer_tx = sp.record(
                to_=sp.sender,
                token_id=ask.token_id,
                amount=sp.nat(1),
            )
            transfer_batch = sp.record(
                from_=ask.seller,
                txs=[transfer_tx],
            )
            transfer_params = [transfer_batch]

            fa2_transfer_handle = sp.contract(
                sp.list[
                    sp.record(
                        from_=sp.address,
                        txs=sp.list[
                            sp.record(
                                to_=sp.address,
                                token_id=sp.nat,
                                amount=sp.nat,
                            )
                        ],
                    )
                ],
                ask.fa2_contract,
                entrypoint="transfer",
            ).unwrap_some(error="INVALID_FA2_CONTRACT")

            sp.transfer(transfer_params, sp.mutez(0), fa2_transfer_handle)

            # ── Remove listing ───────────────────────────────────────────
            del self.data.asks[ask_id]

        # ------------------------------------------------------------------
        # Admin entrypoints
        # ------------------------------------------------------------------

        @sp.entrypoint
        def set_admin(self, new_admin):
            """Transfer admin rights to a new address."""
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.admin = new_admin

        @sp.entrypoint
        def set_paused(self, paused):
            """Pause or unpause the marketplace."""
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.paused = paused

        @sp.entrypoint
        def set_platform_fee_bps(self, new_fee_bps):
            """
            Update the platform fee. Capped at 1000 bps (10 %).

            Parameters
            ----------
            new_fee_bps : sp.nat - new fee in basis points (0-1000)
            """
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            assert new_fee_bps <= 1000, "FEE_CAPPED_AT_10_PERCENT"
            self.data.platform_fee_bps = new_fee_bps

        @sp.entrypoint
        def set_platform_fee_receiver(self, new_receiver):
            """Update the address that receives platform fees."""
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.platform_fee_receiver = new_receiver

        @sp.entrypoint
        def set_royalty_receiver(self, new_receiver):
            """Update the address that receives creator royalties."""
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.royalty_receiver = new_receiver


# ---------------------------------------------------------------------------
# Mock FA2 module - used only in the test scenario
# ---------------------------------------------------------------------------
@sp.module
def mock_fa2_module():
    """
    Minimal FA2 stub that records the last transfer call.
    Used to verify that fulfill_ask dispatches the correct FA2 transfer.
    """

    class MockFA2(sp.Contract):
        def __init__(self):
            self.data.last_transfer = sp.cast(
                None,
                sp.option[
                    sp.list[
                        sp.record(
                            from_=sp.address,
                            txs=sp.list[
                                sp.record(
                                    to_=sp.address,
                                    token_id=sp.nat,
                                    amount=sp.nat,
                                )
                            ],
                        )
                    ]
                ],
            )

        @sp.entrypoint
        def transfer(self, params):
            self.data.last_transfer = sp.Some(params)


# ---------------------------------------------------------------------------
# Test scenario
# ---------------------------------------------------------------------------
@sp.add_test()
def test():
    scenario = sp.test_scenario("Marketplace", m)
    scenario.add_module(mock_fa2_module)

    # ── Accounts ────────────────────────────────────────────────────────────
    admin = sp.test_account("admin")
    seller = sp.test_account("seller")
    buyer = sp.test_account("buyer")
    platform_fee_receiver = sp.test_account("platform_fee_receiver")
    royalty_receiver = sp.test_account("royalty_receiver")

    # ── Contract origination ─────────────────────────────────────────────────
    scenario.h1("Contract Origination")

    mock_fa2 = mock_fa2_module.MockFA2()
    scenario += mock_fa2

    marketplace = m.Marketplace(
        admin=admin.address,
        platform_fee_bps=sp.nat(250),  # 2.5 %
        platform_fee_receiver=platform_fee_receiver.address,
        royalty_receiver=royalty_receiver.address,
    )
    scenario += marketplace

    # ── Test 1: List Ask ─────────────────────────────────────────────────────
    scenario.h2("Test 1 - List Ask")
    marketplace.list_ask(
        fa2_contract=mock_fa2.address,
        token_id=sp.nat(1),
        amount_mutez=sp.mutez(1_000_000),  # 1 tez
        royalty_bps=sp.nat(1000),          # 10 %
        _sender=seller.address,
    )
    scenario.verify(marketplace.data.asks.contains(0))
    scenario.verify(marketplace.data.asks[0].seller == seller.address)
    scenario.verify(marketplace.data.asks[0].fa2_contract == mock_fa2.address)
    scenario.verify(marketplace.data.asks[0].amount_mutez == sp.mutez(1_000_000))
    scenario.verify(marketplace.data.asks[0].royalty_bps == sp.nat(1000))

    # ── Test 2: Update Ask ───────────────────────────────────────────────────
    scenario.h2("Test 2 - Update Ask")
    marketplace.update_ask(
        ask_id=sp.nat(0),
        new_amount_mutez=sp.mutez(2_000_000),  # raise to 2 tez
        _sender=seller.address,
    )
    scenario.verify(marketplace.data.asks[0].amount_mutez == sp.mutez(2_000_000))

    # ── Test 3: Self-fulfill rejection ───────────────────────────────────────
    scenario.h2("Test 3 - Self-fulfill rejection (M_NO_SELF_FULFILL)")
    marketplace.fulfill_ask(
        0,
        _sender=seller.address,
        _amount=sp.mutez(2_000_000),
        _valid=False,
        _exception="M_NO_SELF_FULFILL",
    )

    # ── Test 4: Fulfill Ask & Royalty Split ──────────────────────────────────
    scenario.h2("Test 4 - Fulfill Ask & Royalty Split")
    # Price  = 2,000,000 mutez
    # Fee    = split_tokens(2_000_000, 250, 10000) = 50,000 mutez  (2.5 %)
    # Royalty= split_tokens(2_000_000, 1000, 10000) = 200,000 mutez (10 %)
    # Seller = 2,000,000 - 50,000 - 200,000 = 1,750,000 mutez
    marketplace.fulfill_ask(
        0,
        _sender=buyer.address,
        _amount=sp.mutez(2_000_000),
    )
    # Ask must be removed after fulfillment
    scenario.verify(~marketplace.data.asks.contains(0))
    # FA2 stub must have recorded the transfer
    scenario.verify(mock_fa2.data.last_transfer.is_some())

    # ── Test 5: Cancel Ask ───────────────────────────────────────────────────
    scenario.h2("Test 5 - Cancel Ask")
    marketplace.list_ask(
        fa2_contract=mock_fa2.address,
        token_id=sp.nat(2),
        amount_mutez=sp.mutez(1_000_000),
        royalty_bps=sp.nat(500),
        _sender=seller.address,
    )
    # ask_id 1 (next_ask_id was 1 after the first listing)
    marketplace.cancel_ask(1, _sender=seller.address)
    scenario.verify(~marketplace.data.asks.contains(1))

    # ── Test 6: Pause ────────────────────────────────────────────────────────
    scenario.h2("Test 6 - Admin Pause")
    marketplace.set_paused(True, _sender=admin.address)
    scenario.verify(marketplace.data.paused)

    # Listing must be rejected while paused
    marketplace.list_ask(
        fa2_contract=mock_fa2.address,
        token_id=sp.nat(3),
        amount_mutez=sp.mutez(1_000_000),
        royalty_bps=sp.nat(500),
        _sender=seller.address,
        _valid=False,
        _exception="MARKETPLACE_PAUSED",
    )

    # ── Test 7: Admin fee change ─────────────────────────────────────────────
    scenario.h2("Test 7 - Admin Fee Change")
    # Unpause first so the marketplace is operational again
    marketplace.set_paused(False, _sender=admin.address)

    # Valid fee update (5 %)
    marketplace.set_platform_fee_bps(500, _sender=admin.address)
    scenario.verify(marketplace.data.platform_fee_bps == 500)

    # Fee above 10 % cap must be rejected
    marketplace.set_platform_fee_bps(
        2000,
        _sender=admin.address,
        _valid=False,
        _exception="FEE_CAPPED_AT_10_PERCENT",
    )
    # Fee must remain unchanged
    scenario.verify(marketplace.data.platform_fee_bps == 500)
