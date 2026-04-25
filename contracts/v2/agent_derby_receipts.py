"""
agent_derby_receipts.py — public Agent Derby race receipts on Tezos.
Target: SmartPy v0.24.x

This is intentionally tiny. The deterministic race engine stays in the
PointCast client and /agent-derby.json manifest; the chain stores the player,
race id, canonical receipt hash, and enough readable fields for explorers.
"""

import smartpy as sp


@sp.module
def m():
    # SmartPy IDE imports user code as `import main` at runtime; naming the
    # @sp.module function `main` collides with that. Use `m`.
    RaceRecord = sp.record(
        player=sp.address,
        race_id=sp.string,
        receipt_hash=sp.bytes,
        seed=sp.string,
        track=sp.string,
        winner=sp.string,
        field_size=sp.nat,
        recorded_at=sp.timestamp,
        level=sp.nat,
    )

    class AgentDerbyReceipts(sp.Contract):
        def __init__(self, admin, metadata):
            self.data.admin = admin
            self.data.metadata = metadata
            self.data.records = sp.cast(sp.big_map(), sp.big_map[sp.bytes, RaceRecord])
            self.data.player_counts = sp.cast(sp.big_map(), sp.big_map[sp.address, sp.nat])
            self.data.record_count = sp.nat(0)

        def assert_admin_(self):
            assert sp.sender == self.data.admin, "NOT_ADMIN"

        @sp.entrypoint
        def record_race(self, params):
            sp.cast(
                params,
                sp.record(
                    race_id=sp.string,
                    receipt_hash=sp.bytes,
                    seed=sp.string,
                    track=sp.string,
                    winner=sp.string,
                    field_size=sp.nat,
                ),
            )
            assert params.field_size > 0, "EMPTY_FIELD"
            assert not (params.receipt_hash in self.data.records), "RECEIPT_RECORDED"

            self.data.records[params.receipt_hash] = sp.record(
                player=sp.sender,
                race_id=params.race_id,
                receipt_hash=params.receipt_hash,
                seed=params.seed,
                track=params.track,
                winner=params.winner,
                field_size=params.field_size,
                recorded_at=sp.now,
                level=sp.level,
            )
            self.data.player_counts[sp.sender] = self.data.player_counts.get(
                sp.sender,
                default=0,
            ) + 1
            self.data.record_count += 1

        @sp.entrypoint
        def set_admin(self, admin):
            self.assert_admin_()
            self.data.admin = admin

        @sp.entrypoint
        def set_metadata(self, metadata):
            self.assert_admin_()
            self.data.metadata = metadata


@sp.add_test()
def test():
    scenario = sp.test_scenario("AgentDerbyReceipts", m)
    admin = sp.test_account("admin")
    alice = sp.test_account("alice")

    c = m.AgentDerbyReceipts(
        admin.address,
        sp.big_map({"": sp.bytes("0x74657a6f732d73746f726167653a6465726279")}),
    )
    scenario += c

    c.record_race(
        sp.record(
            race_id="AD-ABC123",
            receipt_hash=sp.bytes("0x1111111111111111111111111111111111111111111111111111111111111111"),
            seed="gamgee-rc0",
            track="wire-mile",
            winner="codex-cantor",
            field_size=6,
        ),
        _sender=alice,
    )
    scenario.verify(c.data.record_count == 1)
    scenario.verify(c.data.player_counts[alice.address] == 1)
