"""
PointCast Marketplace — on-chain asks + fulfillment for FA2 tokens.

Phase B of "host our own marketplace." Replaces the objkt-marketplace
dependency at /collect: primary sales flow through *this* contract, you
set prices + royalties, you collect the platform fee (or set it to 0).

Supports any TZIP-12 FA2 token, not just our Visit Nouns — in time this
can list Broadcast Cards, DRUM, fxhash-imported tokens, whatever.

Ask lifecycle:

    list_ask(seller=msg_sender, token_contract, token_id, amount, price_mutez)
        → stores Ask under `asks[ask_id]`, bumps `next_ask_id`
        → requires seller to have already `update_operators(this_contract, true)`
          on the token contract (standard TZIP-17 operator handshake)

    fulfill_ask(ask_id, amount)
        → sends mutez from buyer: platform fee + royalty + seller_proceeds
        → transfers `amount` of token from seller to buyer via FA2 transfer
        → decrements ask.amount; removes if zero

    cancel_ask(ask_id)
        → seller-only; removes the ask

    update_ask(ask_id, price_mutez)
        → seller-only; adjusts the price on an existing ask

Platform fee is in BPS (basis points, 10000 = 100%). Default 200 = 2%.
Admin can raise, lower, or zero it out.

Royalties: each Ask carries its own royalty_bps + royalty_receiver so the
marketplace can honor per-token royalty rules set on our Visit Nouns
contract (20% default) or any external FA2 that registers royalties in
the ask. The client resolves royalty info when creating the listing.

Compile:

    (see contracts/README.md — same flow as visit_nouns_fa2.py:
     paste into smartpy.io, Run, Download.)

Deploy:

    /admin/deploy (paste compiled Michelson + init storage, Kukai signs)

Security notes:

    • FA2 transfer requires the marketplace to be an approved operator of
      the seller's tokens. list_ask does not enforce this on-chain (it
      can't verify operator state without reading the FA2); the frontend
      must call `update_operators` first. If operator approval is missing,
      fulfill_ask fails at the FA2 layer with a clear error.
    • Mutez split math uses integer division. The seller gets `price -
      platform_fee - royalty`; any 1-mutez rounding residue goes to the
      seller (micro-rounding, unavoidable in natural-number arithmetic).
    • Payment is pull-to-push: buyer's mutez arrives with the fulfill_ask
      call; contract splits via sp.send transfers. All-or-nothing — if
      any transfer fails, the whole op rolls back.
    • The ask storage uses big_map (lazy-loaded) so origination stays
      cheap even with thousands of listings.
"""

import smartpy as sp


@sp.module
def main():

    # --------------------------------------------------------------
    # Types
    # --------------------------------------------------------------

    Ask = sp.record(
        seller             = sp.address,
        token_contract     = sp.address,
        token_id           = sp.nat,
        amount             = sp.nat,         # editions remaining in this ask
        price_mutez        = sp.nat,
        royalty_bps        = sp.nat,         # 10000 = 100%
        royalty_receiver   = sp.address,
    )

    class Marketplace(sp.Contract):
        def __init__(self, admin, platform_fee_bps, treasury, metadata):
            """
            admin             — can rotate config
            platform_fee_bps  — fee on every fulfill, out of 10000 (200 = 2%)
            treasury          — address that receives platform fees
            metadata          — TZIP-16 contract-level metadata (IPFS URI)
            """
            self.data.admin = admin
            self.data.treasury = treasury
            self.data.platform_fee_bps = platform_fee_bps  # default 200
            self.data.paused = False
            self.data.next_ask_id = sp.nat(0)
            self.data.asks = sp.cast(sp.big_map(), sp.big_map[sp.nat, Ask])
            self.data.metadata = metadata

        # ----------------------------------------------------------
        # list_ask — seller creates a listing.
        # ----------------------------------------------------------
        @sp.entrypoint
        def list_ask(self, params):
            sp.cast(params, sp.record(
                token_contract   = sp.address,
                token_id         = sp.nat,
                amount           = sp.nat,
                price_mutez      = sp.nat,
                royalty_bps      = sp.nat,
                royalty_receiver = sp.address,
            ))
            assert not self.data.paused, "MARKET_PAUSED"
            assert params.amount > 0, "AMOUNT_ZERO"
            # Cap royalty at 25% even from the listing side — prevents a
            # bad-actor pretending to mint with high royalty then dumping.
            assert params.royalty_bps <= 2500, "ROYALTY_TOO_HIGH"

            ask_id = self.data.next_ask_id
            self.data.asks[ask_id] = sp.record(
                seller           = sp.sender,
                token_contract   = params.token_contract,
                token_id         = params.token_id,
                amount           = params.amount,
                price_mutez      = params.price_mutez,
                royalty_bps      = params.royalty_bps,
                royalty_receiver = params.royalty_receiver,
            )
            self.data.next_ask_id = ask_id + 1

        # ----------------------------------------------------------
        # fulfill_ask — buyer purchases from a listing.
        # ----------------------------------------------------------
        @sp.entrypoint
        def fulfill_ask(self, params):
            sp.cast(params, sp.record(ask_id=sp.nat, amount=sp.nat))
            assert not self.data.paused, "MARKET_PAUSED"
            assert self.data.asks.contains(params.ask_id), "ASK_NOT_FOUND"
            ask = self.data.asks[params.ask_id]
            assert params.amount > 0, "AMOUNT_ZERO"
            assert params.amount <= ask.amount, "AMOUNT_EXCEEDS_ASK"
            assert sp.sender != ask.seller, "NO_SELF_FULFILL"

            total_mutez = ask.price_mutez * params.amount
            assert (
                sp.amount >= sp.utils.nat_to_mutez(total_mutez)
            ), "INSUFFICIENT_PAYMENT"

            # Split the payment.
            platform_fee = (total_mutez * self.data.platform_fee_bps) // 10000
            royalty = (total_mutez * ask.royalty_bps) // 10000
            # Seller takes the remainder — any rounding dust flows to seller.
            seller_proceeds = sp.as_nat(total_mutez - platform_fee - royalty)

            if platform_fee > 0:
                sp.send(self.data.treasury, sp.utils.nat_to_mutez(platform_fee))
            if royalty > 0:
                sp.send(ask.royalty_receiver, sp.utils.nat_to_mutez(royalty))
            if seller_proceeds > 0:
                sp.send(ask.seller, sp.utils.nat_to_mutez(seller_proceeds))

            # Refund any overpayment.
            overpaid = sp.amount - sp.utils.nat_to_mutez(total_mutez)
            if overpaid > sp.mutez(0):
                sp.send(sp.sender, overpaid)

            # Transfer FA2 token from seller to buyer.
            transfer_param = sp.cast(
                sp.list([
                    sp.record(
                        from_=ask.seller,
                        txs=sp.list([
                            sp.record(
                                to_=sp.sender,
                                token_id=ask.token_id,
                                amount=params.amount,
                            )
                        ]),
                    )
                ]),
                sp.list[sp.record(
                    from_=sp.address,
                    txs=sp.list[sp.record(
                        to_=sp.address,
                        token_id=sp.nat,
                        amount=sp.nat,
                    )],
                )],
            )
            fa2 = sp.contract(
                sp.list[sp.record(
                    from_=sp.address,
                    txs=sp.list[sp.record(
                        to_=sp.address,
                        token_id=sp.nat,
                        amount=sp.nat,
                    )],
                )],
                ask.token_contract,
                entrypoint="transfer",
            ).unwrap_some(error="FA2_NOT_A_CONTRACT")
            sp.transfer(transfer_param, sp.mutez(0), fa2)

            # Update or remove the ask.
            remaining = sp.as_nat(ask.amount - params.amount)
            if remaining == 0:
                del self.data.asks[params.ask_id]
            else:
                self.data.asks[params.ask_id] = sp.record(
                    seller           = ask.seller,
                    token_contract   = ask.token_contract,
                    token_id         = ask.token_id,
                    amount           = remaining,
                    price_mutez      = ask.price_mutez,
                    royalty_bps      = ask.royalty_bps,
                    royalty_receiver = ask.royalty_receiver,
                )

        # ----------------------------------------------------------
        # cancel_ask — seller only.
        # ----------------------------------------------------------
        @sp.entrypoint
        def cancel_ask(self, ask_id):
            sp.cast(ask_id, sp.nat)
            assert self.data.asks.contains(ask_id), "ASK_NOT_FOUND"
            ask = self.data.asks[ask_id]
            assert sp.sender == ask.seller or sp.sender == self.data.admin, "NOT_AUTHORIZED"
            del self.data.asks[ask_id]

        # ----------------------------------------------------------
        # update_ask — seller adjusts price on an existing listing.
        # ----------------------------------------------------------
        @sp.entrypoint
        def update_ask(self, params):
            sp.cast(params, sp.record(ask_id=sp.nat, price_mutez=sp.nat))
            assert self.data.asks.contains(params.ask_id), "ASK_NOT_FOUND"
            ask = self.data.asks[params.ask_id]
            assert sp.sender == ask.seller, "NOT_SELLER"
            self.data.asks[params.ask_id] = sp.record(
                seller           = ask.seller,
                token_contract   = ask.token_contract,
                token_id         = ask.token_id,
                amount           = ask.amount,
                price_mutez      = params.price_mutez,
                royalty_bps      = ask.royalty_bps,
                royalty_receiver = ask.royalty_receiver,
            )

        # ----------------------------------------------------------
        # Admin.
        # ----------------------------------------------------------

        @sp.entrypoint
        def set_platform_fee_bps(self, bps):
            sp.cast(bps, sp.nat)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            assert bps <= 1000, "FEE_TOO_HIGH"   # 10% cap on platform fee
            self.data.platform_fee_bps = bps

        @sp.entrypoint
        def set_treasury(self, new_treasury):
            sp.cast(new_treasury, sp.address)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.treasury = new_treasury

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

    @sp.add_test(name="Marketplace basic flow")
    def test():
        sc = sp.test_scenario(main)
        sc.h1("PointCast Marketplace — basic flow")

        admin = sp.test_account("admin")
        treasury = sp.test_account("treasury")
        alice = sp.test_account("alice")    # seller
        bob = sp.test_account("bob")        # buyer

        meta = sp.utils.metadata_of_url("ipfs://QmMarketStub")

        mkt = main.Marketplace(
            admin=admin.address,
            treasury=treasury.address,
            platform_fee_bps=sp.nat(200),   # 2%
            metadata=meta,
        )
        sc += mkt

        # Alice lists an ask — asks[0] created.
        mkt.list_ask(sp.record(
            token_contract=sp.address("KT1TokenContractStub0000000000000000"),
            token_id=sp.nat(137),
            amount=sp.nat(1),
            price_mutez=sp.nat(5_000_000),        # 5 ꜩ
            royalty_bps=sp.nat(2000),             # 20%
            royalty_receiver=alice.address,
        )).run(sender=alice)
        sc.verify(mkt.data.next_ask_id == 1)

        # Seller can update price.
        mkt.update_ask(sp.record(
            ask_id=sp.nat(0),
            price_mutez=sp.nat(3_000_000),        # 3 ꜩ
        )).run(sender=alice)

        # Bob can't fulfill with underpayment.
        mkt.fulfill_ask(sp.record(ask_id=sp.nat(0), amount=sp.nat(1))).run(
            sender=bob, amount=sp.mutez(1_000_000), valid=False
        )

        # Alice can't fulfill her own ask.
        mkt.fulfill_ask(sp.record(ask_id=sp.nat(0), amount=sp.nat(1))).run(
            sender=alice, amount=sp.mutez(3_000_000), valid=False
        )

        # Non-seller can't cancel.
        mkt.cancel_ask(sp.nat(0)).run(sender=bob, valid=False)

        # Seller cancels — ask gone.
        mkt.cancel_ask(sp.nat(0)).run(sender=alice)
        sc.verify(~ mkt.data.asks.contains(sp.nat(0)))

        # Admin can raise fee but not above 10%.
        mkt.set_platform_fee_bps(sp.nat(500)).run(sender=admin)
        sc.verify(mkt.data.platform_fee_bps == 500)
        mkt.set_platform_fee_bps(sp.nat(2000)).run(sender=admin, valid=False)

        # Non-admin cannot pause.
        mkt.set_paused(True).run(sender=bob, valid=False)
        mkt.set_paused(True).run(sender=admin)
        # New listings refused while paused.
        mkt.list_ask(sp.record(
            token_contract=sp.address("KT1TokenContractStub0000000000000000"),
            token_id=sp.nat(42),
            amount=sp.nat(1),
            price_mutez=sp.nat(1_000_000),
            royalty_bps=sp.nat(2000),
            royalty_receiver=alice.address,
        )).run(sender=alice, valid=False)
