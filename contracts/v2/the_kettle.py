"""
the_kettle.py - The Kettle: a deterministic pour-to-boil prize game on Tezos
SmartPy v0.24.x

Core idea
=========
Anyone can pour() a fixed sip (exact amount, e.g. 0.5 tez) into the kettle.
Each pour increments the round's pour count. When the count reaches the
round's boil threshold, that pour "boils the kettle": the pourer instantly
wins the whole pot minus a carryover slice (default 10%) that stays in the
contract to seed the next round.

Growth
======
Each round's boil threshold increases by threshold_step, so rounds get
structurally longer and pots get bigger, on top of the compounding carryover
seed. Round 1 boils at start_threshold pours, round 2 at start_threshold +
threshold_step, and so on.

Fairness
========
There is no randomness anywhere. The state is fully public: everyone can see
the pour count and the threshold, and the race to land the boiling pour is
the game. This makes the contract trivially auditable - the only tez that
ever leaves is the winner payout, and only at the moment of a boil.

Admin can only tune sip price / threshold parameters at a round boundary
(before any pour lands in the new round), never mid-round.
"""

import smartpy as sp


@sp.module
def m():
    # SmartPy IDE imports user code as `import main` at runtime; naming the
    # @sp.module function `main` collides with that. Use `m`.
    class TheKettle(sp.Contract):
        def __init__(
            self,
            admin,
            sip_mutez,
            start_threshold,
            threshold_step,
            carryover_bps,
        ):
            assert sip_mutez > sp.mutez(0), "INVALID_SIP"
            assert start_threshold > 1, "INVALID_THRESHOLD"
            assert carryover_bps < 10000, "INVALID_CARRYOVER_BPS"

            self.data.admin = admin
            self.data.sip_mutez = sip_mutez
            self.data.threshold_step = threshold_step
            self.data.carryover_bps = carryover_bps

            # Live round state.
            self.data.round_id = sp.nat(0)
            self.data.boil_threshold = start_threshold
            self.data.pour_count = sp.nat(0)
            self.data.pot = sp.mutez(0)

            # (round_id, pour_index) -> pourer, for the frontend wall.
            self.data.pours = sp.cast(
                sp.big_map(),
                sp.big_map[sp.pair[sp.nat, sp.nat], sp.address],
            )
            # round_id -> boil result.
            self.data.boils = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(
                        winner=sp.address,
                        prize=sp.mutez,
                        pours=sp.nat,
                        level=sp.nat,
                        boiled_at=sp.timestamp,
                    ),
                ],
            )

        @sp.entrypoint
        def pour(self):
            assert sp.amount == self.data.sip_mutez, "WRONG_SIP_AMOUNT"

            self.data.pour_count += 1
            self.data.pot += sp.amount
            self.data.pours[(self.data.round_id, self.data.pour_count)] = sp.sender

            if self.data.pour_count == self.data.boil_threshold:
                # The kettle boils: this pour wins the pot minus carryover.
                carryover = sp.split_tokens(
                    self.data.pot,
                    self.data.carryover_bps,
                    10000,
                )
                prize = sp.sub_mutez(self.data.pot, carryover).unwrap_some(
                    error="CARRYOVER_EXCEEDS_POT"
                )

                self.data.boils[self.data.round_id] = sp.record(
                    winner=sp.sender,
                    prize=prize,
                    pours=self.data.pour_count,
                    level=sp.level,
                    boiled_at=sp.now,
                )

                # Next round: bigger threshold, seeded with the carryover.
                self.data.round_id += 1
                self.data.boil_threshold += self.data.threshold_step
                self.data.pour_count = 0
                self.data.pot = carryover

                if prize > sp.mutez(0):
                    sp.send(sp.sender, prize)

        @sp.entrypoint
        def set_admin(self, new_admin):
            sp.cast(new_admin, sp.address)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            self.data.admin = new_admin

        @sp.entrypoint
        def set_sip(self, new_sip_mutez):
            sp.cast(new_sip_mutez, sp.mutez)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            # Only at a round boundary, so nobody's live round is repriced.
            assert self.data.pour_count == 0, "ROUND_IN_PROGRESS"
            assert new_sip_mutez > sp.mutez(0), "INVALID_SIP"
            self.data.sip_mutez = new_sip_mutez

        @sp.entrypoint
        def set_threshold(self, new_threshold, new_step):
            sp.cast(new_threshold, sp.nat)
            sp.cast(new_step, sp.nat)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            # Only at a round boundary, so nobody's live round is repriced.
            assert self.data.pour_count == 0, "ROUND_IN_PROGRESS"
            assert new_threshold > 1, "INVALID_THRESHOLD"
            self.data.boil_threshold = new_threshold
            self.data.threshold_step = new_step

        @sp.entrypoint
        def set_carryover_bps(self, new_bps):
            sp.cast(new_bps, sp.nat)
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            # Only at a round boundary, so nobody's live round is repriced.
            assert self.data.pour_count == 0, "ROUND_IN_PROGRESS"
            assert new_bps < 10000, "INVALID_CARRYOVER_BPS"
            self.data.carryover_bps = new_bps


if "main" in __name__:

    @sp.add_test()
    def test():
        sc = sp.test_scenario("the_kettle", m)
        sc.h1("The Kettle")

        admin = sp.test_account("Admin")
        alice = sp.test_account("Alice")
        bob = sp.test_account("Bob")
        charlie = sp.test_account("Charlie")

        sip = sp.mutez(500_000)  # 0.5 tez

        sc.h2("Round 0 boils at 3 pours; winner gets pot minus 10% carryover")
        kettle = m.TheKettle(
            admin=admin.address,
            sip_mutez=sip,
            start_threshold=sp.nat(3),
            threshold_step=sp.nat(2),
            carryover_bps=sp.nat(1000),  # 10%
        )
        sc += kettle

        t0 = sp.timestamp_from_utc(2026, 7, 9, 18, 0, 0)

        kettle.pour(_sender=alice, _amount=sip, _level=100, _now=t0)
        kettle.pour(_sender=bob, _amount=sip, _level=101, _now=t0)
        sc.verify(kettle.data.pour_count == 2)
        sc.verify(kettle.data.pot == sp.mutez(1_000_000))

        # Wrong amount is rejected outright.
        kettle.pour(
            _sender=charlie,
            _amount=sp.mutez(499_999),
            _level=102,
            _now=t0,
            _valid=False,
            _exception="WRONG_SIP_AMOUNT",
        )

        # Charlie lands the boiling pour: pot is 1.5 tez, carryover 0.15.
        kettle.pour(_sender=charlie, _amount=sip, _level=103, _now=t0)

        sc.verify(kettle.data.round_id == 1)
        sc.verify(kettle.data.boil_threshold == 5)
        sc.verify(kettle.data.pour_count == 0)
        sc.verify(kettle.data.pot == sp.mutez(150_000))
        sc.verify(kettle.data.boils[0].winner == charlie.address)
        sc.verify(kettle.data.boils[0].prize == sp.mutez(1_350_000))
        sc.verify(kettle.data.boils[0].pours == 3)
        sc.verify(kettle.data.pours[(sp.nat(0), sp.nat(1))] == alice.address)
        sc.verify(kettle.data.pours[(sp.nat(0), sp.nat(3))] == charlie.address)
        # Contract keeps exactly the carryover.
        sc.verify(kettle.balance == sp.mutez(150_000))

        sc.h2("Round 1 needs 5 pours and starts seeded")
        kettle.pour(_sender=alice, _amount=sip, _level=110, _now=t0)
        kettle.pour(_sender=alice, _amount=sip, _level=111, _now=t0)
        kettle.pour(_sender=bob, _amount=sip, _level=112, _now=t0)
        kettle.pour(_sender=charlie, _amount=sip, _level=113, _now=t0)
        sc.verify(kettle.data.pour_count == 4)
        sc.verify(kettle.data.round_id == 1)

        # Alice snipes the fifth pour: pot = 0.15 seed + 5 * 0.5 = 2.65 tez.
        kettle.pour(_sender=alice, _amount=sip, _level=114, _now=t0)
        sc.verify(kettle.data.round_id == 2)
        sc.verify(kettle.data.boil_threshold == 7)
        sc.verify(kettle.data.boils[1].winner == alice.address)
        sc.verify(kettle.data.boils[1].prize == sp.mutez(2_385_000))
        sc.verify(kettle.data.pot == sp.mutez(265_000))
        sc.verify(kettle.balance == sp.mutez(265_000))

        sc.h2("Params only change at a round boundary")
        kettle.set_sip(
            sp.mutez(1_000_000),
            _sender=admin,
        )
        sc.verify(kettle.data.sip_mutez == sp.mutez(1_000_000))

        kettle.pour(_sender=bob, _amount=sp.mutez(1_000_000), _level=120, _now=t0)
        kettle.set_sip(
            sp.mutez(2_000_000),
            _sender=admin,
            _valid=False,
            _exception="ROUND_IN_PROGRESS",
        )
        kettle.set_threshold(
            sp.record(new_threshold=10, new_step=3),
            _sender=admin,
            _valid=False,
            _exception="ROUND_IN_PROGRESS",
        )
        kettle.set_carryover_bps(
            2000,
            _sender=admin,
            _valid=False,
            _exception="ROUND_IN_PROGRESS",
        )

        sc.h2("Non-admin cannot touch settings")
        kettle.set_sip(
            sp.mutez(1),
            _sender=alice,
            _valid=False,
            _exception="NOT_ADMIN",
        )
        kettle.set_admin(
            alice.address,
            _sender=bob,
            _valid=False,
            _exception="NOT_ADMIN",
        )

        kettle.set_admin(bob.address, _sender=admin)
        sc.verify(kettle.data.admin == bob.address)
