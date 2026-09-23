"""Nouns Drum Club Bandmates FA2 — compile-only launch preparation.

Twelve transferable, free open-edition FA2 token types. Each type maps to one
published Bandmate card (IDs 0 through 11). Metadata is supplied at origination
as raw TZIP-21 bytes and has no update entrypoint. This source creates no
network operation; originating it remains a separate, user-signed decision.
"""

from pathlib import Path

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


main = fa2.main
METADATA_DIR = Path(__file__).resolve().parents[1] / "nouns-bandmates" / "metadata"


BANDMATE_NAMES = [
    "Pocket Captain",
    "Parade Marshal",
    "Moon Rim",
    "Low & Slow",
    "Sidewalk Bassline",
    "Afterhours Operator",
    "Soft Signal",
    "Glass Garden",
    "Bright Steps",
    "Cloud Nine",
    "Purple Parade",
    "Last Spark",
]


def bandmate_token_info():
    """The immutable raw TZIP-21 URI, name, and decimal fields for IDs 0–11."""
    return [
        sp.map(
            l={
                "": sp.scenario_utils.bytes_of_string(
                    "tezos-storage:bandmate-" + str(token_id)
                ),
                "name": sp.scenario_utils.bytes_of_string(
                    "Nouns Drum Club Bandmate "
                    + str(token_id + 1).zfill(2)
                    + " · "
                    + name
                ),
                "decimals": sp.scenario_utils.bytes_of_string("0"),
                "symbol": sp.scenario_utils.bytes_of_string("NCBM"),
            }
        )
        for token_id, name in enumerate(BANDMATE_NAMES)
    ]


def bandmate_storage_metadata():
    """Load the exact full TZIP-16/TZIP-21 documents into immutable storage."""
    def document(name):
        value = (METADATA_DIR / name).read_text(encoding="utf-8")
        if not value.strip().startswith("{"):
            raise ValueError("Bandmates metadata must be a JSON object: " + name)
        return sp.scenario_utils.bytes_of_string(value)

    entries = {
        "": sp.scenario_utils.bytes_of_string("tezos-storage:collection"),
        "collection": document("contract.json"),
    }
    for token_id in range(12):
        entries["bandmate-" + str(token_id)] = document(str(token_id) + ".json")
    return sp.big_map(l=entries)


@sp.module
def m():
    import main

    class NounsBandmatesFA2(
        main.Fungible,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """Free, transferable, multi-asset FA2 with 12 fixed token types."""

        def __init__(self, administrator, metadata, token_info, paused):
            sp.cast(administrator, sp.address)
            sp.cast(metadata, sp.big_map[sp.string, sp.bytes])
            sp.cast(token_info, sp.list[sp.map[sp.string, sp.bytes]])
            sp.cast(paused, sp.bool)
            # The constructor fixes the collection's complete token set. There
            # is deliberately no register-token or metadata-update entrypoint.
            assert sp.len(token_info) == 12, "EXACTLY_TWELVE_TOKENS"
            assert "" in metadata, "METADATA_ROOT_MISSING"
            assert (
                metadata[""]
                == sp.bytes("0x74657a6f732d73746f726167653a636f6c6c656374696f6e")
            ), "METADATA_ROOT_INVALID"
            assert "collection" in metadata, "COLLECTION_METADATA_MISSING"
            for key in [
                "bandmate-0", "bandmate-1", "bandmate-2", "bandmate-3",
                "bandmate-4", "bandmate-5", "bandmate-6", "bandmate-7",
                "bandmate-8", "bandmate-9", "bandmate-10", "bandmate-11",
            ]:
                assert key in metadata, "TOKEN_METADATA_MISSING"

            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.Fungible.__init__(self, metadata, {}, token_info)

            self.data.administrator = administrator
            self.data.paused = paused
            # The launch originator receives one edition of every defined
            # Bandmate. They are ordinary transferable FA2 balances, not a
            # privileged reserve; later public mints remain open editions.
            for token_id in range(12):
                self.data.ledger[(administrator, token_id)] = 1
                self.data.supply[token_id] = 1

        @sp.entrypoint
        def mint(self, token_id):
            sp.cast(token_id, sp.nat)
            assert not self.data.paused, "MINT_PAUSED"
            assert sp.amount == sp.mutez(0), "MINT_IS_FREE"
            assert token_id in self.data.token_metadata, "UNKNOWN_TOKEN"

            key = (sp.sender, token_id)
            self.data.ledger[key] = self.data.ledger.get(
                key, default=sp.nat(0)
            ) + 1
            self.data.supply[token_id] += 1

        @sp.entrypoint
        def set_paused(self, paused):
            sp.cast(paused, sp.bool)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.paused = paused

        @sp.onchain_view()
        def minted(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.token_metadata, "UNKNOWN_TOKEN"
            return self.data.supply[token_id]


@sp.add_test()
def test_nouns_bandmates_fa2():
    scenario = sp.test_scenario("nouns_bandmates_fa2", [fa2.t, fa2.main, m])
    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")
    carol = sp.test_account("carol")
    contract = m.NounsBandmatesFA2(
        administrator=admin.address,
        metadata=bandmate_storage_metadata(),
        token_info=bandmate_token_info(),
        paused=False,
    )
    scenario += contract

    scenario.h2("Origination creates one transferable edition of every type")
    scenario.verify(contract.data.next_token_id == 12)
    for token_id in range(12):
        scenario.verify(contract.data.ledger[(admin.address, token_id)] == 1)
        scenario.verify(contract.minted(token_id) == 1)

    scenario.h2("Twelve fixed token types with free repeat mints")
    contract.mint(0, _sender=alice)
    contract.mint(0, _sender=alice)
    contract.mint(11, _sender=bob)
    scenario.verify(contract.data.ledger[(alice.address, 0)] == 2)
    scenario.verify(contract.data.ledger[(bob.address, 11)] == 1)
    scenario.verify(contract.minted(0) == 3)
    scenario.verify(contract.minted(11) == 2)

    scenario.h2("Mint rejects tez and unknown IDs")
    contract.mint(
        0,
        _sender=alice,
        _amount=sp.mutez(1),
        _valid=False,
        _exception="MINT_IS_FREE",
    )
    contract.mint(
        12,
        _sender=alice,
        _valid=False,
        _exception="UNKNOWN_TOKEN",
    )

    scenario.h2("Standard FA2 transfer requires owner or its operator")
    contract.transfer(
        [
            sp.record(
                from_=alice.address,
                txs=[sp.record(to_=carol.address, token_id=0, amount=1)],
            )
        ],
        _sender=bob,
        _valid=False,
        _exception="FA2_NOT_OPERATOR",
    )
    operator = sp.record(owner=alice.address, operator=bob.address, token_id=0)
    contract.update_operators([sp.variant.add_operator(operator)], _sender=alice)
    contract.transfer(
        [
            sp.record(
                from_=alice.address,
                txs=[sp.record(to_=carol.address, token_id=0, amount=1)],
            )
        ],
        _sender=bob,
    )
    scenario.verify(contract.data.ledger[(alice.address, 0)] == 1)
    scenario.verify(contract.data.ledger[(carol.address, 0)] == 1)

    scenario.h2("Only the administrator can pause mints, not transfers")
    contract.set_paused(True, _sender=alice, _valid=False, _exception="NOT_ADMIN")
    contract.set_paused(True, _sender=admin)
    contract.mint(1, _sender=alice, _valid=False, _exception="MINT_PAUSED")
    # Pausing is an emergency stop for new editions. It intentionally does
    # not freeze already-collected tokens or override standard FA2 transfers.
    contract.transfer(
        [
            sp.record(
                from_=admin.address,
                txs=[sp.record(to_=carol.address, token_id=1, amount=1)],
            )
        ],
        _sender=admin,
    )
    scenario.verify(contract.data.ledger[(carol.address, 1)] == 1)


@sp.add_test()
def compile_nouns_bandmates_fa2():
    scenario = sp.test_scenario("nouns_bandmates_fa2_compile", [fa2.t, fa2.main, m])
    contract = m.NounsBandmatesFA2(
        administrator=sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw"),
        metadata=bandmate_storage_metadata(),
        token_info=bandmate_token_info(),
        # The launch payload opens free collecting immediately. The same
        # administrator can later pause *new mints* through set_paused.
        paused=False,
    )
    scenario += contract
    scenario.verify(contract.data.next_token_id == 12)
    scenario.verify(~contract.data.paused)
