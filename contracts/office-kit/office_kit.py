"""
Office Kit v0 -- listings, editions and payroll. SmartPy 0.25.x. DRAFT, never deployed.

Spec: public/office-kit/SPEC.md (CC0).

Design, in one paragraph
------------------------
One contract, no admin. It is an FA2 (the stock SmartPy `Fungible` multi-asset
template, which gives transfer / balance_of / update_operators) plus two small
features: listings and payroll. Nothing here can be paused, upgraded, or
redirected, and nobody takes a fee.

Listings: MINT ON COLLECT. `list_piece` records the listing and registers the
token metadata with supply 0. Nothing is minted and nothing is held for sale,
so there is no inventory to get stuck in the contract. `collect` takes exactly
the price, sends it to the artist in the same operation, and mints one edition
to `to`. listing_id == FA2 token_id. Sold-out is `sold == editions`.

Payroll: the patron escrows amount_per_period * periods. Period k (1-based)
vests at start + k * period_seconds. The artist may claim vested periods; the
patron may cancel, which refunds only unvested periods and shrinks the payroll
to what has vested so the artist can still claim it later.

Money rules (the whole security story):
  * sale money never touches contract storage: collect forwards it, same op.
  * claim_payroll only ever pays the artist address stored in the payroll.
  * cancel_payroll only ever refunds the patron address stored in the payroll.
  * every entrypoint that is not meant to receive tez rejects any amount.
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2

main = fa2.main
t = fa2.t


@sp.module
def m():
    import main

    class OfficeKit(main.Fungible):
        def __init__(self, metadata):
            main.Fungible.__init__(self, metadata, {}, [])
            self.data.next_listing_id = sp.nat(0)
            self.data.listings = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(
                        artist=sp.address,
                        editions=sp.nat,
                        sold=sp.nat,
                        price=sp.mutez,
                    ),
                ],
            )
            self.data.next_payroll_id = sp.nat(0)
            self.data.payrolls = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(
                        patron=sp.address,
                        artist=sp.address,
                        per_period=sp.mutez,
                        periods=sp.nat,  # total periods (shrinks on cancel)
                        claimed=sp.nat,  # periods already paid out
                        period_seconds=sp.nat,
                        start=sp.timestamp,
                    ),
                ],
            )

        # ---------------------------------------------------------- listings

        @sp.entrypoint
        def list_piece(self, params):
            """Sender is the artist. Registers a token with supply 0."""
            sp.cast(
                params,
                sp.record(
                    metadata_uri=sp.bytes,
                    editions=sp.nat,
                    price_mutez=sp.mutez,
                ),
            )
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            assert params.editions > 0, "NO_EDITIONS"
            listing_id = self.data.next_listing_id
            self.data.next_listing_id += 1
            self.data.token_metadata[listing_id] = sp.record(
                token_id=listing_id, token_info={"": params.metadata_uri}
            )
            self.data.supply[listing_id] = 0
            self.data.listings[listing_id] = sp.record(
                artist=sp.sender,
                editions=params.editions,
                sold=0,
                price=params.price_mutez,
            )
            # FA2 helper state used by the template's token_id checks.
            self.data.next_token_id = self.data.next_listing_id

        @sp.entrypoint
        def collect(self, params):
            """Anyone. Exact price in, same price straight to the artist,
            one edition minted to `to`."""
            sp.cast(params, sp.record(listing_id=sp.nat, to_=sp.address))
            listing = self.data.listings[params.listing_id]
            assert sp.amount == listing.price, "WRONG_AMOUNT"
            assert listing.sold < listing.editions, "SOLD_OUT"
            self.data.listings[params.listing_id].sold = listing.sold + 1
            self.data.supply[params.listing_id] += 1
            key = (params.to_, params.listing_id)
            self.data.ledger[key] = self.data.ledger.get(key, default=0) + 1
            if listing.price > sp.mutez(0):
                sp.send(listing.artist, listing.price)

        # ----------------------------------------------------------- payroll

        @sp.entrypoint
        def start_payroll(self, params):
            """Sender is the patron and must send exactly per_period * periods."""
            sp.cast(
                params,
                sp.record(
                    artist=sp.address,
                    amount_per_period=sp.mutez,
                    periods=sp.nat,
                    period_seconds=sp.nat,
                ),
            )
            assert params.periods > 0, "NO_PERIODS"
            assert params.period_seconds > 0, "NO_PERIOD_LENGTH"
            assert params.amount_per_period > sp.mutez(0), "NO_AMOUNT"
            total = sp.split_tokens(params.amount_per_period, params.periods, 1)
            assert sp.amount == total, "WRONG_AMOUNT"
            pid = self.data.next_payroll_id
            self.data.next_payroll_id += 1
            self.data.payrolls[pid] = sp.record(
                patron=sp.sender,
                artist=params.artist,
                per_period=params.amount_per_period,
                periods=params.periods,
                claimed=0,
                period_seconds=params.period_seconds,
                start=sp.now,
            )

        @sp.entrypoint
        def claim_payroll(self, payroll_id):
            """Artist only. Pays every vested, unclaimed period to the artist."""
            sp.cast(payroll_id, sp.nat)
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            p = self.data.payrolls[payroll_id]
            assert sp.sender == p.artist, "NOT_ARTIST"
            elapsed = sp.as_nat(sp.now - p.start)
            vested = elapsed / p.period_seconds
            if vested > p.periods:
                vested = p.periods
            owed = sp.as_nat(vested - p.claimed)
            assert owed > 0, "NOTHING_VESTED"
            if vested == p.periods:
                del self.data.payrolls[payroll_id]
            else:
                self.data.payrolls[payroll_id].claimed = vested
            sp.send(p.artist, sp.split_tokens(p.per_period, owed, 1))

        @sp.entrypoint
        def cancel_payroll(self, payroll_id):
            """Patron only. Refunds only unvested periods. Vested periods stay
            claimable by the artist (payroll shrinks to what has vested)."""
            sp.cast(payroll_id, sp.nat)
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            p = self.data.payrolls[payroll_id]
            assert sp.sender == p.patron, "NOT_PATRON"
            elapsed = sp.as_nat(sp.now - p.start)
            vested = elapsed / p.period_seconds
            if vested > p.periods:
                vested = p.periods
            unvested = sp.as_nat(p.periods - vested)
            assert unvested > 0, "FULLY_VESTED"
            if vested == p.claimed:
                del self.data.payrolls[payroll_id]  # nothing left for artist
            else:
                self.data.payrolls[payroll_id].periods = vested
            sp.send(p.patron, sp.split_tokens(p.per_period, unvested, 1))
