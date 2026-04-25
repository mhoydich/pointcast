# ============================================================
# coffee_mugs_fa2.py
# Target: SmartPy v0.24.1 (current on smartpy.io, April 2026)
# FA2 lib: smartpy.templates.fa2_lib (replaces the old fa2_lib wheel)
#
# PointCast Coffee Mugs FA2 — Sprint v4 ship per Mike chat
# 2026-04-25 ~10:50 PT ("ok yah and lets go on the contract").
#
# Five token_ids, five rarity tiers, hard edition caps:
#   0 · ceramic   · common      · cap 333  · threshold 1 cup
#   1 · espresso  · uncommon    · cap 144  · threshold 3 cups
#   2 · latte     · rare        · cap 64   · threshold 7 cups
#   3 · paper     · ultra-rare  · cap 21   · threshold 15 cups
#   4 · bistro    · legendary   · cap 8    · threshold 30 cups
#
# Public free mint (gas-only). Anyone can call mint_mug(token_id);
# the caller becomes the recipient and the contract enforces the
# edition cap. Cup-count eligibility is a UI-level gate at /coffee
# (the rarity scarcity is what's enforced on-chain — the cap means
# you literally can't mint more than 8 bistros even if you bypass
# the UI).
#
# Mirrors contracts/v2/visit_nouns_fa2.py for migration consistency
# (SmartPy v0.24 fa2_lib pattern, mixins in same order, royalties
# packed as TZIP-21 record).
#
# DEPLOY (option B per docs/briefs/2026-04-25-mike-coffee-mugs-fa2.md):
#   1. Compile via smartpy.io online OR `node scripts/compile-coffee-mugs.mjs`
#   2. Mike originates from his Beacon wallet via /admin/deploy
#      (preferred — admin lands on Mike's main wallet, no throwaway hop)
#   3. Paste KT1 into src/data/contracts.json under coffee_mugs.mainnet
#   4. Deploy site; /coffee claim flow goes from `banked` → `mint to wallet`
#
# DEPLOY (option A — throwaway signer, faster but admin transfer needed):
#   1. Compile as above
#   2. node scripts/deploy-coffee-mugs-mainnet.mjs (mirror of
#      deploy-visit-nouns-mainnet.mjs, generates fresh /tmp signer)
#   3. node scripts/transfer-admin.mjs --contract coffee-mugs (one extra op)
#   4. Paste KT1 + redeploy site
# ============================================================

import smartpy as sp
from smartpy.templates import fa2_lib as fa2

main = fa2.main


# Stdlib helpers.
import smartpy.stdlib.string_utils as string_utils


@sp.module
def m():
    class CoffeeMugsFA2(
        main.Admin,
        main.Fungible,
        main.ChangeMetadata,
        main.WithdrawMutez,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """PointCast Coffee Mugs FA2 multi-asset contract.

        FA2 / TZIP-12 compliant fixed-edition minting contract with five
        rarity tiers. Each token_id 0-4 is a distinct mug variant with a
        hard edition cap baked into storage at origination.

        Public mint, gas-only. Caller mints to self. Contract enforces
        edition caps per token_id; cup-count eligibility is a UI gate.
        """

        def __init__(
            self,
            administrator,
            metadata,
            metadata_base_uri,
            royalty_bps,
            edition_caps,  # sp.map[sp.nat, sp.nat] — token_id → cap
        ):
            # ── Mixin initialisation (same reverse-dep order as Visit Nouns) ──
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.WithdrawMutez.__init__(self)
            main.ChangeMetadata.__init__(self)
            # Token metadata for all 5 mugs is pre-registered post-origination
            # via a separate `register_tokens` admin op. Origination itself
            # leaves the contract empty — the metadata bytes would otherwise
            # blow up the origination tx beyond the gas/storage limit.
            main.Fungible.__init__(self, metadata, {}, [])
            main.Admin.__init__(self, administrator)

            # ── Custom storage fields ─────────────────────────────────────
            # Base URI for token metadata. Either ipfs://<cid> or
            # https://pointcast.xyz/api/tezos-metadata/coffee-mugs/<id>.json
            # — we'll start with the HTTPS path for zero IPFS deps, migrate
            # to ipfs:// in a follow-up admin op.
            self.data.metadata_base_uri = sp.cast(metadata_base_uri, sp.string)

            # Royalty basis points — 2500 max enforced by FA2 lib (25%).
            # 750 = 7.5% (per the brief default).
            self.data.royalty_bps = sp.cast(royalty_bps, sp.nat)

            # Per-token edition caps (token_id → max supply).
            # Origination passes the full map; not modifiable post-origin.
            self.data.edition_caps = sp.cast(
                edition_caps, sp.map[sp.nat, sp.nat]
            )

            # Per-token edition counter — token_id → minted-so-far.
            self.data.mug_supply = sp.cast(
                sp.big_map(), sp.big_map[sp.nat, sp.nat]
            )

        # ── Admin: register all 5 tokens with metadata ────────────────────
        # Called once by admin after origination. Registers token_id → name
        # + uri + royalties for all five mugs in one op.
        @sp.entrypoint
        def register_tokens(self, mug_names):
            """Register the 5 mug tokens with their metadata. Admin-only.

            mug_names is a sp.map[sp.nat, sp.string] mapping
            token_id → human-readable name (e.g. 0 → "Ceramic Mug").

            Idempotent guard: refuses if next_token_id != 0 (i.e.
            tokens already registered).
            """
            sp.cast(mug_names, sp.map[sp.nat, sp.string])
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            assert self.data.next_token_id == 0, "ALREADY_REGISTERED"

            for token_id in mug_names.keys():
                # Confirm token_id has a cap configured (defensive guard).
                assert token_id in self.data.edition_caps, "NO_CAP_FOR_ID"

                # Build the metadata URI: <base>/<token_id>.json
                uri = (
                    self.data.metadata_base_uri
                    + "/"
                    + string_utils.from_int(sp.to_int(token_id))
                    + ".json"
                )

                # Token info map (TZIP-12 §8.1 + TZIP-21).
                token_info = sp.cast({}, sp.map[sp.string, sp.bytes])
                token_info[""] = sp.pack(uri)
                token_info["name"] = sp.pack(mug_names[token_id])
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

                # Initialise supply tracking.
                self.data.supply[token_id] = 0
                self.data.mug_supply[token_id] = 0

                # Bump next_token_id to keep the all_tokens view consistent.
                if token_id >= self.data.next_token_id:
                    self.data.next_token_id = token_id + 1

        # ── Public mint ───────────────────────────────────────────────────
        @sp.entrypoint
        def mint_mug(self, token_id):
            """Mint one edition of token_id to the caller.

            - token_id must be 0..4 (i.e. registered).
            - Edition cap enforced: cannot exceed edition_caps[token_id].
            - Free mint, gas-only (mint_price_mutez = 0).
            - Eligibility (cup count) is a UI-level gate at /coffee — the
              hard cap is what's enforced on-chain.
            """
            sp.cast(token_id, sp.nat)

            # Guard: token_id must be registered.
            assert token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"

            # Guard: edition cap.
            cap = self.data.edition_caps[token_id]
            current = self.data.mug_supply.get(token_id, default=sp.nat(0))
            assert current < cap, "EDITION_CAP_REACHED"

            # ── Increment supply + ledger ──────────────────────────────────
            self.data.mug_supply[token_id] = current + 1
            self.data.supply[token_id] += 1

            ledger_key = (sp.sender, token_id)
            self.data.ledger[ledger_key] = (
                self.data.ledger.get(ledger_key, default=sp.nat(0)) + 1
            )

        # ── Admin: update metadata base URI ───────────────────────────────
        # Used to migrate from HTTPS to IPFS (or rotate IPFS gateway)
        # without re-originating. Cannot change the per-token name or
        # royalties — those are baked at register_tokens time.
        @sp.entrypoint
        def set_metadata_base_uri(self, new_base):
            sp.cast(new_base, sp.string)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.metadata_base_uri = new_base

        # ── Read-only views ───────────────────────────────────────────────
        @sp.onchain_view()
        def get_mug_supply(self, token_id):
            """Return current minted supply for a token_id."""
            sp.cast(token_id, sp.nat)
            return self.data.mug_supply.get(token_id, default=sp.nat(0))

        @sp.onchain_view()
        def get_edition_cap(self, token_id):
            """Return the configured edition cap for a token_id."""
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.edition_caps, "NO_CAP_FOR_ID"
            return self.data.edition_caps[token_id]


# ──────────────────────────────────────────────────────────────────────────
# Test scenario — origination + register + mint smoke test.
# Run via the SmartPy IDE or smartpy compile. Confirms:
#   1. Origination with the 5-tier edition_caps works
#   2. register_tokens(...) succeeds once, fails on retry (idempotent)
#   3. mint_mug(0) works for any caller
#   4. mint_mug(0) past the cap returns EDITION_CAP_REACHED
#   5. mint_mug(99) returns TOKEN_NOT_REGISTERED
# ──────────────────────────────────────────────────────────────────────────


@sp.add_test()
def test_coffee_mugs():
    sc = sp.test_scenario("coffee_mugs", m)
    sc.h1("PointCast Coffee Mugs FA2")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")

    sc.h2("Origination")
    contract = m.CoffeeMugsFA2(
        administrator=admin.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/api/tezos-metadata/coffee-mugs.json"
        ),
        metadata_base_uri="https://pointcast.xyz/api/tezos-metadata/coffee-mugs",
        royalty_bps=750,  # 7.5%
        edition_caps=sp.map(
            l={
                0: 333,  # ceramic
                1: 144,  # espresso
                2: 64,   # latte
                3: 21,   # paper
                4: 8,    # bistro
            }
        ),
    )
    sc += contract

    sc.h2("Register the 5 token names")
    contract.register_tokens(
        sp.map(
            l={
                0: "Ceramic Mug",
                1: "Espresso Cup",
                2: "Latte Glass",
                3: "Paper Cup",
                4: "Bistro Cup",
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

    sc.h2("Mint one ceramic to alice (free, gas-only)")
    contract.mint_mug(0, _sender=alice)
    sc.verify(
        contract.get_mug_supply(0) == 1
    )

    sc.h2("Mint one bistro to bob (legendary)")
    contract.mint_mug(4, _sender=bob)
    sc.verify(contract.get_mug_supply(4) == 1)

    sc.h2("Cap enforcement: bistro to bob 8 more times → 9th rejected")
    for _ in range(7):
        contract.mint_mug(4, _sender=bob)
    sc.verify(contract.get_mug_supply(4) == 8)
    contract.mint_mug(4, _sender=bob, _valid=False)  # cap reached

    sc.h2("Unregistered token rejected")
    contract.mint_mug(99, _sender=alice, _valid=False)
