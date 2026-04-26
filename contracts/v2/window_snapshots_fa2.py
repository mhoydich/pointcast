# ============================================================
# window_snapshots_fa2.py
# Target: SmartPy v0.24.1 (current on smartpy.io, April 2026)
# FA2 lib: smartpy.templates.fa2_lib
#
# PointCast Window Snapshots FA2 — first drop in the foreshadowed
# Window Snapshots collection (see 2026-04-26 marketplace press
# release: "a queued Window Snapshots collection").
#
# Three painted interiors. Free open-edition, edition cap 100 each.
#
#   0 · galley     · "Galley"     · cap 100 · ~1970s mobile-home kitchen view
#   1 · long_room  · "Long Room"  · cap 100 · long living room w/ floral curtains
#   2 · lamp_wall  · "Lamp Wall"  · cap 100 · lamps + bottle-shelf wallpaper
#
# Public free mint (gas-only). Anyone can call mint_snapshot(token_id);
# the caller becomes the recipient and the contract enforces the
# edition cap. No allow-list, no waitlist, no price.
#
# Mirrors contracts/v2/coffee_mugs_fa2.py exactly so the deploy path
# is the same: Publisher /admin/deploy/new auto-admin-patches and
# lands admin on Mike's mainwallet directly. Once originated,
# register_tokens() registers all three IDs in one admin op and the
# /market UI picks up window_snapshots from supportedCollections.
# ============================================================

import smartpy as sp
from smartpy.templates import fa2_lib as fa2

main = fa2.main


@sp.module
def m():
    # SmartPy v0.24 pattern: stdlib + main module imports live INSIDE the
    # @sp.module function body so the SmartPy compiler processes them
    # alongside the contract source.
    import main
    import smartpy.stdlib.string_utils as string_utils

    class WindowSnapshotsFA2(
        main.Admin,
        main.Fungible,
        main.ChangeMetadata,
        main.WithdrawMutez,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """PointCast Window Snapshots FA2 multi-asset contract.

        Three painted interiors as token_ids 0..2, each capped at 100
        editions. Free public mint (gas-only). The mint entrypoint is
        named `mint_snapshot` to match the collection's voice.
        """

        def __init__(
            self,
            administrator,
            metadata,
            metadata_base_uri,
            royalty_bps,
            edition_caps,  # sp.map[sp.nat, sp.nat] — token_id → cap
        ):
            # ── Mixin initialisation (same reverse-dep order as Coffee Mugs) ──
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.WithdrawMutez.__init__(self)
            main.ChangeMetadata.__init__(self)
            main.Fungible.__init__(self, metadata, {}, [])
            main.Admin.__init__(self, administrator)

            # Base URI for token metadata.
            # https://pointcast.xyz/api/tezos-metadata/window-snapshots
            self.data.metadata_base_uri = sp.cast(metadata_base_uri, sp.string)

            # Royalty basis points — 2500 max enforced by FA2 lib (25%).
            # 750 = 7.5% (matches Coffee Mugs / Visit Nouns convention).
            self.data.royalty_bps = sp.cast(royalty_bps, sp.nat)

            # Per-token edition caps (token_id → max supply).
            self.data.edition_caps = sp.cast(
                edition_caps, sp.map[sp.nat, sp.nat]
            )

            # Per-token edition counter — token_id → minted-so-far.
            self.data.snapshot_supply = sp.cast(
                sp.big_map(), sp.big_map[sp.nat, sp.nat]
            )

        # ── Admin: register all 3 tokens with metadata ────────────────────
        @sp.entrypoint
        def register_tokens(self, snapshot_names):
            """Register the 3 snapshot tokens with their metadata. Admin-only.

            snapshot_names is a sp.map[sp.nat, sp.string] mapping
            token_id → human-readable name (e.g. 0 → "Galley").

            Idempotent guard: refuses if next_token_id != 0 (i.e.
            tokens already registered).
            """
            sp.cast(snapshot_names, sp.map[sp.nat, sp.string])
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            assert self.data.next_token_id == 0, "ALREADY_REGISTERED"

            for token_id in snapshot_names.keys():
                assert token_id in self.data.edition_caps, "NO_CAP_FOR_ID"

                uri = (
                    self.data.metadata_base_uri
                    + "/"
                    + string_utils.from_int(sp.to_int(token_id))
                    + ".json"
                )

                token_info = sp.cast({}, sp.map[sp.string, sp.bytes])
                token_info[""] = sp.pack(uri)
                token_info["name"] = sp.pack(snapshot_names[token_id])
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
                self.data.snapshot_supply[token_id] = 0

                if token_id >= self.data.next_token_id:
                    self.data.next_token_id = token_id + 1

        # ── Public mint ───────────────────────────────────────────────────
        @sp.entrypoint
        def mint_snapshot(self, token_id):
            """Mint one edition of token_id to the caller.

            - token_id must be 0..2 (i.e. registered).
            - Edition cap enforced: cannot exceed edition_caps[token_id].
            - Free mint, gas-only.
            """
            sp.cast(token_id, sp.nat)

            assert token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"

            cap = self.data.edition_caps[token_id]
            current = self.data.snapshot_supply.get(token_id, default=sp.nat(0))
            assert current < cap, "EDITION_CAP_REACHED"

            self.data.snapshot_supply[token_id] = current + 1
            self.data.supply[token_id] += 1

            ledger_key = (sp.sender, token_id)
            self.data.ledger[ledger_key] = (
                self.data.ledger.get(ledger_key, default=sp.nat(0)) + 1
            )

        # ── Admin: update metadata base URI ───────────────────────────────
        @sp.entrypoint
        def set_metadata_base_uri(self, new_base):
            sp.cast(new_base, sp.string)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.metadata_base_uri = new_base

        # ── Read-only views ───────────────────────────────────────────────
        @sp.onchain_view()
        def get_snapshot_supply(self, token_id):
            sp.cast(token_id, sp.nat)
            return self.data.snapshot_supply.get(token_id, default=sp.nat(0))

        @sp.onchain_view()
        def get_edition_cap(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.edition_caps, "NO_CAP_FOR_ID"
            return self.data.edition_caps[token_id]


# ──────────────────────────────────────────────────────────────────────────
# Test scenario — origination + register + mint smoke test.
# ──────────────────────────────────────────────────────────────────────────


@sp.add_test()
def test_window_snapshots():
    sc = sp.test_scenario("window_snapshots", m)
    sc.h1("PointCast Window Snapshots FA2")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")

    sc.h2("Origination")
    contract = m.WindowSnapshotsFA2(
        administrator=admin.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/api/tezos-metadata/window-snapshots.json"
        ),
        metadata_base_uri="https://pointcast.xyz/api/tezos-metadata/window-snapshots",
        royalty_bps=750,  # 7.5%
        edition_caps=sp.map(
            l={
                0: 100,  # galley
                1: 100,  # long_room
                2: 100,  # lamp_wall
            }
        ),
    )
    sc += contract

    sc.h2("Register the 3 token names")
    contract.register_tokens(
        sp.map(
            l={
                0: "Galley",
                1: "Long Room",
                2: "Lamp Wall",
            }
        ),
        _sender=admin,
    )

    sc.h3("Idempotent: second register call rejected")
    contract.register_tokens(
        sp.map(l={0: "Bogus"}),
        _sender=admin,
        _valid=False,
    )

    sc.h2("Mint one Galley to alice (free, gas-only)")
    contract.mint_snapshot(0, _sender=alice)
    sc.verify(contract.get_snapshot_supply(0) == 1)

    sc.h2("Mint one Lamp Wall to bob")
    contract.mint_snapshot(2, _sender=bob)
    sc.verify(contract.get_snapshot_supply(2) == 1)

    sc.h2("Cap enforcement: 99 more lamp_wall mints, 100th is the cap")
    for _ in range(99):
        contract.mint_snapshot(2, _sender=bob)
    sc.verify(contract.get_snapshot_supply(2) == 100)
    contract.mint_snapshot(2, _sender=bob, _valid=False)  # cap reached

    sc.h2("Unregistered token rejected")
    contract.mint_snapshot(99, _sender=alice, _valid=False)
