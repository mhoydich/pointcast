"""
prize_cast.py - Prize Cast no-loss prize-linked savings on Tezos
SmartPy v0.24.x

Core idea
=========
Deposits remain withdrawable as principal while "tickets" accrue as
amount_in_mutez * seconds_elapsed. After each draw cadence window, anyone can
call draw() to award the accumulated yield (contract balance minus total
principal) to one weighted winner, with a small caller incentive.

Randomness
==========
v0 intentionally uses a weak on-chain seed:

    blake2b(pack({ level, timestamp, contract_address }))

This is acceptable for an MVP with small pool sizes, but it is not robust
enough for large-value pools because block producers and timing can influence
it. v1 should move to commit-reveal, as noted in the PM brief.
"""

import smartpy as sp


@sp.module
def m():
    # SmartPy IDE imports user code as `import main` at runtime; naming the
    # @sp.module function `main` collides with that. Use `m`.
    Principal = sp.record(
        amount=sp.mutez,
        last_update=sp.timestamp,
        weight_snapshot=sp.nat,
    )
    WinnerRecord = sp.record(
        winner=sp.address,
        prize=sp.mutez,
        block=sp.nat,
    )

    BYTE_TO_NAT = sp.cast(
        {sp.bytes(f"0x{i:02x}"): i for i in range(256)},
        sp.map[sp.bytes, sp.nat],
    )

    def mutez_to_nat(amount):
        return sp.fst(sp.ediv(amount, sp.mutez(1)).unwrap_some())

    def weight_delta(principal, now_):
        elapsed_seconds = sp.as_nat(now_ - principal.last_update)
        return mutez_to_nat(principal.amount) * elapsed_seconds

    def bytes_prefix_to_nat(blob):
        value = sp.nat(0)
        for idx in range(8):
            byte = sp.slice(blob, idx, 1).unwrap_some(error="HASH_TOO_SHORT")
            value = (value * 256) + BYTE_TO_NAT[byte]
        return value

    def draw_seed(contract_address, level, timestamp):
        payload = sp.pack(
            sp.record(
                contract_address=contract_address,
                level=level,
                timestamp=timestamp,
            )
        )
        return bytes_prefix_to_nat(sp.blake2b(payload))

    class PrizeCast(sp.Contract):
        def __init__(
            self,
            admin,
            draw_cadence_blocks,
            min_deposit_mutez,
            caller_incentive_bps,
            starting_draw_level,
        ):
            assert draw_cadence_blocks > 0, "INVALID_DRAW_CADENCE"
            assert min_deposit_mutez > sp.mutez(0), "INVALID_MIN_DEPOSIT"
            assert caller_incentive_bps <= 10000, "INVALID_CALLER_INCENTIVE_BPS"

            self.data.admin = admin
            self.data.vault_total = sp.mutez(0)
            self.data.principals = sp.cast(
                sp.big_map(),
                sp.big_map[sp.address, Principal],
            )
            self.data.total_weight = sp.nat(0)
            self.data.last_draw_level = starting_draw_level
            self.data.draw_cadence_blocks = draw_cadence_blocks
            self.data.min_deposit_mutez = min_deposit_mutez
            self.data.caller_incentive_bps = caller_incentive_bps
            self.data.delegate = sp.cast(None, sp.option[sp.address])
            self.data.past_winners = sp.cast(
                sp.big_map(),
                sp.big_map[sp.nat, WinnerRecord],
            )
            self.data.past_winner_count = sp.nat(0)

            # QUESTION(MH): the requested storage sketch did not include an
            # iterable participant index, but Michelson big_maps cannot be
            # iterated. v0 adds a compact address index so draw() can settle
            # every depositor, select a weighted winner, and reset the round.
            self.data.participant_ids = sp.cast(
                sp.big_map(),
                sp.big_map[sp.address, sp.nat],
            )
            self.data.participant_addresses = sp.cast(
                sp.big_map(),
                sp.big_map[sp.nat, sp.address],
            )
            self.data.participant_count = sp.nat(0)

        def assert_admin_(self):
            assert sp.sender == self.data.admin, "NOT_ADMIN"

        def register_participant_(self, participant):
            if not (participant in self.data.participant_ids):
                participant_id = self.data.participant_count
                self.data.participant_ids[participant] = participant_id
                self.data.participant_addresses[participant_id] = participant
                self.data.participant_count += 1

        def load_principal_(self, participant):
            if participant in self.data.principals:
                return self.data.principals[participant]
            return sp.record(
                amount=sp.mutez(0),
                last_update=sp.now,
                weight_snapshot=sp.nat(0),
            )

        def accrue_principal_(self, participant):
            principal = self.load_principal_(participant)
            delta = weight_delta(principal, sp.now)
            principal.weight_snapshot += delta
            principal.last_update = sp.now
            self.data.total_weight += delta
            return principal

        @sp.entrypoint
        def deposit(self):
            assert sp.amount >= self.data.min_deposit_mutez, "MIN_DEPOSIT_NOT_MET"

            self.register_participant_(sp.sender)

            principal = self.accrue_principal_(sp.sender)
            principal.amount += sp.amount
            self.data.principals[sp.sender] = principal
            self.data.vault_total += sp.amount

        @sp.entrypoint
        def withdraw(self, amount):
            sp.cast(amount, sp.mutez)
            assert sp.amount == sp.mutez(0), "TEZ_NOT_ACCEPTED"
            assert sp.sender in self.data.principals, "NO_PRINCIPAL"

            principal = self.accrue_principal_(sp.sender)
            assert amount > sp.mutez(0), "ZERO_WITHDRAW"
            assert amount <= principal.amount, "INSUFFICIENT_PRINCIPAL"

            principal.amount = sp.sub_mutez(
                principal.amount,
                amount,
            ).unwrap_some(error="INSUFFICIENT_PRINCIPAL")
            self.data.vault_total = sp.sub_mutez(
                self.data.vault_total,
                amount,
            ).unwrap_some(error="INSUFFICIENT_VAULT_TOTAL")

            if (principal.amount == sp.mutez(0)) and (principal.weight_snapshot == 0):
                del self.data.principals[sp.sender]
            else:
                self.data.principals[sp.sender] = principal

            sp.send(sp.sender, amount)

        @sp.entrypoint
        def draw(self):
            assert sp.amount == sp.mutez(0), "TEZ_NOT_ACCEPTED"
            assert (
                sp.level >= (self.data.last_draw_level + self.data.draw_cadence_blocks)
            ), "DRAW_TOO_EARLY"

            for idx in sp.range(0, self.data.participant_count):
                participant = self.data.participant_addresses[idx]
                if participant in self.data.principals:
                    principal = self.accrue_principal_(participant)
                    self.data.principals[participant] = principal

            assert self.data.total_weight > 0, "NO_DEPOSITORS"

            prize_pool = sp.sub_mutez(
                sp.balance,
                self.data.vault_total,
            ).unwrap_some(error="NEGATIVE_PRIZE_POOL")
            assert prize_pool > sp.mutez(0), "NO_YIELD"

            random_seed = draw_seed(sp.self_address, sp.level, sp.now)
            random_target = random_seed % self.data.total_weight

            running_weight = sp.nat(0)
            winner = sp.cast(None, sp.option[sp.address])
            for idx in sp.range(0, self.data.participant_count):
                participant = self.data.participant_addresses[idx]
                if participant in self.data.principals:
                    principal = self.data.principals[participant]
                    if principal.weight_snapshot > 0:
                        upper_bound = running_weight + principal.weight_snapshot
                        if winner.is_none() and (random_target < upper_bound):
                            winner = sp.Some(participant)
                        running_weight = upper_bound

            winner_address = winner.unwrap_some(error="WINNER_NOT_FOUND")

            caller_fee = sp.split_tokens(
                prize_pool,
                self.data.caller_incentive_bps,
                10000,
            )
            winner_prize = sp.sub_mutez(
                prize_pool,
                caller_fee,
            ).unwrap_some(error="CALLER_FEE_EXCEEDS_PRIZE")

            # NOTE: `prize` records the net amount the winner actually received.
            self.data.past_winners[self.data.past_winner_count] = sp.record(
                winner=winner_address,
                prize=winner_prize,
                block=sp.level,
            )
            self.data.past_winner_count += 1

            if caller_fee > sp.mutez(0):
                sp.send(sp.sender, caller_fee)
            if winner_prize > sp.mutez(0):
                sp.send(winner_address, winner_prize)

            for idx in sp.range(0, self.data.participant_count):
                participant = self.data.participant_addresses[idx]
                if participant in self.data.principals:
                    principal = self.data.principals[participant]
                    principal.weight_snapshot = 0
                    principal.last_update = sp.now

                    if principal.amount == sp.mutez(0):
                        del self.data.principals[participant]
                    else:
                        self.data.principals[participant] = principal

            self.data.total_weight = 0
            self.data.last_draw_level = sp.level

        @sp.entrypoint
        def set_delegate(self, baker):
            sp.cast(baker, sp.option[sp.key_hash])
            self.assert_admin_()

            if baker.is_some():
                baker_key_hash = baker.unwrap_some()
                self.data.delegate = sp.Some(
                    sp.to_address(sp.implicit_account(baker_key_hash))
                )
                sp.set_delegate(sp.Some(baker_key_hash))
            else:
                self.data.delegate = sp.cast(None, sp.option[sp.address])
                sp.set_delegate(None)

        @sp.entrypoint
        def set_admin(self, new_admin):
            sp.cast(new_admin, sp.address)
            self.assert_admin_()
            self.data.admin = new_admin

        @sp.entrypoint
        def set_draw_cadence(self, new_cadence_blocks):
            sp.cast(new_cadence_blocks, sp.nat)
            self.assert_admin_()
            assert new_cadence_blocks > 0, "INVALID_DRAW_CADENCE"
            self.data.draw_cadence_blocks = new_cadence_blocks

        @sp.entrypoint
        def set_min_deposit(self, new_min_deposit_mutez):
            sp.cast(new_min_deposit_mutez, sp.mutez)
            self.assert_admin_()
            assert new_min_deposit_mutez > sp.mutez(0), "INVALID_MIN_DEPOSIT"
            self.data.min_deposit_mutez = new_min_deposit_mutez

        @sp.entrypoint
        def set_caller_incentive_bps(self, new_bps):
            sp.cast(new_bps, sp.nat)
            self.assert_admin_()
            assert new_bps <= 10000, "INVALID_CALLER_INCENTIVE_BPS"
            self.data.caller_incentive_bps = new_bps

        @sp.entrypoint
        def default(self):
            pass

    class DrawCaller(sp.Contract):
        def __init__(self):
            self.data.received = sp.mutez(0)

        @sp.entrypoint
        def default(self):
            self.data.received += sp.amount

        @sp.entrypoint
        def call_draw(self, target):
            sp.cast(target, sp.address)
            handle = sp.contract(sp.unit, target, entrypoint="draw").unwrap_some(
                error="INVALID_TARGET"
            )
            sp.transfer((), sp.mutez(0), handle)


if "main" in __name__:

    @sp.add_test()
    def test():
        sc = sp.test_scenario("prize_cast", m)
        sc.h1("Prize Cast")

        admin = sp.test_account("Admin")
        alice = sp.test_account("Alice")
        bob = sp.test_account("Bob")
        charlie = sp.test_account("Charlie")
        ops = sp.test_account("Ops")

        sc.h2("Two depositors over two weeks, deterministic winner, caller incentive")
        prize_cast = m.PrizeCast(
            admin=admin.address,
            draw_cadence_blocks=sp.nat(10),
            min_deposit_mutez=sp.mutez(1_000_000),
            caller_incentive_bps=sp.nat(50),  # 0.5 %
            starting_draw_level=sp.nat(1_000),
        )
        draw_caller = m.DrawCaller()
        sc += prize_cast
        sc += draw_caller

        week_0 = sp.timestamp_from_utc(2026, 4, 1, 0, 0, 0)
        week_2 = sp.timestamp_from_utc(2026, 4, 15, 0, 0, 0)

        prize_cast.deposit(
            _sender=alice,
            _amount=sp.mutez(10_000_000),
            _level=1_001,
            _now=week_0,
        )
        prize_cast.deposit(
            _sender=bob,
            _amount=sp.mutez(5_000_000),
            _level=1_012,
            _now=week_2,
        )

        sc.verify(prize_cast.data.vault_total == sp.mutez(15_000_000))
        sc.verify(prize_cast.data.total_weight == 0)

        prize_cast.default(
            _sender=admin,
            _amount=sp.mutez(200_000),
            _level=1_012,
            _now=week_2,
        )

        draw_caller.call_draw(
            prize_cast.address,
            _sender=ops,
            _level=1_012,
            _now=week_2,
        )

        expected_caller_fee = sp.mutez(1_000)
        expected_winner_prize = sp.mutez(199_000)

        sc.verify(prize_cast.data.past_winner_count == 1)
        sc.verify(prize_cast.data.past_winners[0].winner == alice.address)
        sc.verify(prize_cast.data.past_winners[0].prize == expected_winner_prize)
        sc.verify(prize_cast.data.past_winners[0].block == 1_012)
        sc.verify(draw_caller.data.received == expected_caller_fee)
        sc.verify(
            prize_cast.data.past_winners[0].prize + draw_caller.data.received
            == sp.mutez(200_000)
        )
        sc.verify(prize_cast.data.total_weight == 0)
        sc.verify(prize_cast.data.last_draw_level == 1_012)
        sc.verify(prize_cast.data.principals[alice.address].amount == sp.mutez(10_000_000))
        sc.verify(prize_cast.data.principals[bob.address].amount == sp.mutez(5_000_000))
        sc.verify(prize_cast.data.principals[alice.address].weight_snapshot == 0)
        sc.verify(prize_cast.data.principals[bob.address].weight_snapshot == 0)

        sc.h2("Same-block deposit + withdraw leaves zero ticket weight")
        edge_cast = m.PrizeCast(
            admin=admin.address,
            draw_cadence_blocks=sp.nat(10),
            min_deposit_mutez=sp.mutez(1_000_000),
            caller_incentive_bps=sp.nat(50),
            starting_draw_level=sp.nat(2_000),
        )
        sc += edge_cast

        same_block_time = sp.timestamp_from_utc(2026, 4, 20, 0, 0, 0)
        edge_cast.deposit(
            _sender=charlie,
            _amount=sp.mutez(2_000_000),
            _level=2_001,
            _now=same_block_time,
        )
        edge_cast.withdraw(
            sp.mutez(2_000_000),
            _sender=charlie,
            _level=2_001,
            _now=same_block_time,
        )

        sc.verify(edge_cast.data.vault_total == sp.mutez(0))
        sc.verify(edge_cast.data.total_weight == 0)
        sc.verify(not (charlie.address in edge_cast.data.principals))

        sc.h2("Zero depositors cannot draw")
        empty_cast = m.PrizeCast(
            admin=admin.address,
            draw_cadence_blocks=sp.nat(5),
            min_deposit_mutez=sp.mutez(1_000_000),
            caller_incentive_bps=sp.nat(50),
            starting_draw_level=sp.nat(3_000),
        )
        sc += empty_cast

        empty_cast.draw(
            _sender=ops,
            _level=3_005,
            _now=sp.timestamp_from_utc(2026, 4, 25, 0, 0, 0),
            _valid=False,
            _exception="NO_DEPOSITORS",
        )

        sc.h2("Admin rotates delegate and admin-controlled settings")
        first_baker = sp.key_hash("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")
        second_baker = sp.key_hash("tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6")

        prize_cast.set_delegate(sp.Some(first_baker), _sender=admin)
        sc.verify(
            prize_cast.data.delegate
            == sp.Some(sp.address("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"))
        )

        prize_cast.set_delegate(sp.Some(second_baker), _sender=admin)
        sc.verify(
            prize_cast.data.delegate
            == sp.Some(sp.address("tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6"))
        )

        prize_cast.set_draw_cadence(12, _sender=admin)
        prize_cast.set_min_deposit(sp.mutez(2_000_000), _sender=admin)
        prize_cast.set_caller_incentive_bps(75, _sender=admin)
        sc.verify(prize_cast.data.draw_cadence_blocks == 12)
        sc.verify(prize_cast.data.min_deposit_mutez == sp.mutez(2_000_000))
        sc.verify(prize_cast.data.caller_incentive_bps == 75)

        prize_cast.set_admin(bob.address, _sender=admin)
        sc.verify(prize_cast.data.admin == bob.address)
