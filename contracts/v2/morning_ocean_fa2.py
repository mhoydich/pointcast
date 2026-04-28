# ============================================================
# morning_ocean_fa2.py
# Target: SmartPy v0.24.1 (current on smartpy.io, April 2026)
# FA2 lib: smartpy.templates.fa2_lib
#
# PointCast Morning Ocean FA2
#
# Twenty-four generated maritime art cards:
# oil tankers, sailboats, tugboats, ferries, skiffs, yachts,
# planets, fog, sun, and quiet luxury at first light.
#
# Public free mint (gas-only). Anyone can call mint_ocean(token_id);
# the caller becomes the recipient and the contract enforces the
# per-token edition cap.
#
# Mirrors contracts/v2/window_snapshots_fa2.py so the deploy path is:
#   1. Paste this file into smartpy.io/ide
#   2. Run tests
#   3. Deploy contract -> Continue, download contract/storage JSON
#   4. Stage artifacts at public/admin/_artifacts/morning_ocean-*.json
#   5. Originate via /admin/deploy/new?prefill=morning_ocean
#   6. register_tokens(...) once, then paste KT1 into contracts.json
# ============================================================

import smartpy as sp
from smartpy.templates import fa2_lib as fa2

main = fa2.main


@sp.module
def m():
    import main
    import smartpy.stdlib.string_utils as string_utils

    class MorningOceanFA2(
        main.Admin,
        main.Fungible,
        main.ChangeMetadata,
        main.WithdrawMutez,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """PointCast Morning Ocean FA2 multi-asset contract."""

        def __init__(
            self,
            administrator,
            metadata,
            metadata_base_uri,
            royalty_bps,
            edition_caps,
        ):
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.WithdrawMutez.__init__(self)
            main.ChangeMetadata.__init__(self)
            main.Fungible.__init__(self, metadata, {}, [])
            main.Admin.__init__(self, administrator)

            self.data.metadata_base_uri = sp.cast(metadata_base_uri, sp.string)
            self.data.royalty_bps = sp.cast(royalty_bps, sp.nat)
            self.data.edition_caps = sp.cast(
                edition_caps, sp.map[sp.nat, sp.nat]
            )
            self.data.ocean_supply = sp.cast(
                sp.big_map(), sp.big_map[sp.nat, sp.nat]
            )

        @sp.entrypoint
        def register_tokens(self, token_names):
            """Register all Morning Ocean token ids with metadata URIs."""
            sp.cast(token_names, sp.map[sp.nat, sp.string])
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            assert self.data.next_token_id == 0, "ALREADY_REGISTERED"

            for token_id in token_names.keys():
                assert token_id in self.data.edition_caps, "NO_CAP_FOR_ID"

                uri = (
                    self.data.metadata_base_uri
                    + "/"
                    + string_utils.from_int(sp.to_int(token_id))
                    + ".json"
                )

                token_info = sp.cast({}, sp.map[sp.string, sp.bytes])
                token_info[""] = sp.pack(uri)
                token_info["name"] = sp.pack(token_names[token_id])
                token_info["decimals"] = sp.pack("0")
                token_info["royalties"] = sp.pack(
                    sp.record(
                        decimals=sp.nat(4),
                        shares={self.data.administrator: self.data.royalty_bps},
                    )
                )

                self.data.token_metadata[token_id] = sp.record(
                    token_id=token_id,
                    token_info=token_info,
                )

                self.data.supply[token_id] = 0
                self.data.ocean_supply[token_id] = 0

                if token_id >= self.data.next_token_id:
                    self.data.next_token_id = token_id + 1

        @sp.entrypoint
        def mint_ocean(self, token_id):
            """Mint one edition of token_id to the caller."""
            sp.cast(token_id, sp.nat)

            assert token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"

            cap = self.data.edition_caps[token_id]
            current = self.data.ocean_supply.get(token_id, default=sp.nat(0))
            assert current < cap, "EDITION_CAP_REACHED"

            self.data.ocean_supply[token_id] = current + 1
            self.data.supply[token_id] += 1

            ledger_key = (sp.sender, token_id)
            self.data.ledger[ledger_key] = (
                self.data.ledger.get(ledger_key, default=sp.nat(0)) + 1
            )

        @sp.entrypoint
        def set_metadata_base_uri(self, new_base):
            sp.cast(new_base, sp.string)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.metadata_base_uri = new_base

        @sp.onchain_view()
        def get_ocean_supply(self, token_id):
            sp.cast(token_id, sp.nat)
            return self.data.ocean_supply.get(token_id, default=sp.nat(0))

        @sp.onchain_view()
        def get_edition_cap(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.edition_caps, "NO_CAP_FOR_ID"
            return self.data.edition_caps[token_id]


@sp.add_test()
def test_morning_ocean():
    sc = sp.test_scenario("morning_ocean", m)
    sc.h1("PointCast Morning Ocean FA2")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")

    contract = m.MorningOceanFA2(
        administrator=admin.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/morning-ocean.json"
        ),
        metadata_base_uri="https://pointcast.xyz/api/morning-ocean-metadata",
        royalty_bps=750,
        edition_caps=sp.map(
            l={
                1: 44,
                2: 88,
                3: 44,
                4: 144,
                5: 44,
                6: 88,
                7: 44,
                8: 24,
                9: 88,
                10: 144,
                11: 44,
                12: 88,
                13: 24,
                14: 144,
                15: 44,
                16: 44,
                17: 24,
                18: 44,
                19: 88,
                20: 44,
                21: 88,
                22: 44,
                23: 8,
                24: 44,
            }
        ),
    )
    sc += contract

    contract.register_tokens(
        sp.map(
            l={
                1: "Sun Tanker",
                2: "Silver Sail",
                3: "Red Tug Moon",
                4: "Pearl Fishing Boat",
                5: "Research Morning",
                6: "Distant Freighter",
                7: "Palm Catamaran",
                8: "Champagne Yacht",
                9: "Harbor Ferry",
                10: "Blue Tug",
                11: "Crescent Rowboat",
                12: "Patrol Vessel",
                13: "Whale Ferry",
                14: "Coral Trawler",
                15: "Rose Skiff",
                16: "Landmark Ferry",
                17: "Solar Sail",
                18: "Twin Schooner",
                19: "Container Dawn",
                20: "Long Oil Tanker",
                21: "Bay Runner",
                22: "Wooden Launch",
                23: "Eclipse Carrier",
                24: "Mist Freighter",
            }
        ),
        _sender=admin,
    )

    contract.register_tokens(sp.map(l={1: "Bogus"}), _sender=admin, _valid=False)

    contract.mint_ocean(1, _sender=alice)
    sc.verify(contract.get_ocean_supply(1) == 1)

    contract.mint_ocean(23, _sender=bob)
    sc.verify(contract.get_ocean_supply(23) == 1)

    for _ in range(7):
        contract.mint_ocean(23, _sender=bob)
    sc.verify(contract.get_ocean_supply(23) == 8)
    contract.mint_ocean(23, _sender=bob, _valid=False)

    contract.mint_ocean(99, _sender=alice, _valid=False)
