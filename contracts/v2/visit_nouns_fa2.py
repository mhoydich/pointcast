# ============================================================
# visit_nouns_fa2.py
# Target: SmartPy v0.24.1  (current on smartpy.io, April 2026)
# FA2 lib: smartpy.templates.fa2_lib  (replaces the old fa2_lib wheel)
# ============================================================
#
# ── API MIGRATION NOTES (v0.16 → v0.24) ────────────────────
#
# 1. IMPORT PATH CHANGED
#    OLD: import fa2_lib
#    NEW: from smartpy.templates import fa2_lib as fa2
#         main = fa2.main   # the @sp.module that contains all FA2 classes
#
# 2. NO MORE Fa2MultiAsset CLASS
#    The monolithic Fa2MultiAsset is gone.  The equivalent is
#    main.Fungible (multi-token, each with a balance-per-address ledger).
#    Compose it with mixins: Admin, ChangeMetadata, WithdrawMutez,
#    OffchainviewTokenMetadata, OnchainviewBalanceOf.
#
# 3. __init__ SIGNATURE CHANGED (THE ORIGINAL BUG)
#    OLD: Fa2MultiAsset.__init__(self,
#             metadata=contract_metadata,   ← keyword arg
#             token_metadata=[],
#             ledger={})
#    NEW: main.Fungible.__init__(self,
#             metadata,                     ← positional, sp.big_map[str,bytes]
#             ledger,                       ← dict / sp.big_map
#             token_metadata)               ← list of sp.map[str,bytes]
#
# 4. MODULE SYSTEM
#    All contract classes must live inside @sp.module functions.
#    The FA2 base classes live in fa2.main.  Your class goes in a
#    separate @sp.module that imports main.
#
# 5. CONTROL FLOW
#    OLD: sp.if / sp.for / sp.while / sp.local
#    NEW: native Python if / for / while / direct assignment
#
# 6. CONTAINER MEMBERSHIP
#    OLD: container.contains(key)
#    NEW: key in container   (contains() still works but is deprecated)
#    NOTE: "not in" is NOT supported; use  not (key in container)
#
# 7. INTEGER → STRING CONVERSION
#    Use stdlib:  import smartpy.stdlib.string_utils as string_utils
#                 string_utils.from_int(sp.to_int(nat_value))
#
# 8. ROYALTIES (TZIP-21 / objkt)
#    objkt reads token_metadata[id].token_info["royalties"] as a
#    packed sp.record(decimals=sp.nat, shares=sp.map[sp.address, sp.nat]).
#    decimals=4 means shares values are in basis-points × 10
#    (i.e. 2000 / 10000 = 20 %).
#    NOTE: royalty_bps in storage is the source-of-truth; it is baked
#    into each token's metadata at first-mint time.  Changing
#    royalty_bps after a token has been minted does NOT retroactively
#    update that token's packed royalties bytes — that is a deliberate
#    design choice (immutable per-token royalties once minted).
#    If you need mutable royalties, store them in a separate big_map
#    and serve them from an offchain view instead.
#
# 9. set_admin vs set_administrator
#    main.Admin already provides a set_administrator entrypoint.
#    We also expose set_admin as a thin alias so the original API
#    surface is preserved.
#
# ── DELTA FROM REQUESTED SPEC ───────────────────────────────
#
# • withdraw_mutez (from main.WithdrawMutez mixin) is also present
#   alongside the custom withdraw(amount, to_) entrypoint.
#   Both do the same thing; keep whichever you prefer and remove the
#   other before deploying to avoid confusion.
#
# • URI/name/decimals token_info values must be raw UTF-8 bytes, not
#   Micheline-packed strings. Marketplaces like OBJKT, TzKT, and Kukai read the
#   empty-string key as a raw URI. `sp.pack("https://...")` produces a `0501...`
#   Micheline payload and shows up as an unknown token in wallets.
# • The royalties record is intentionally packed with sp.pack(), which produces
#   the common TZIP-21 `royalties` token_info shape.
#
# ============================================================

import smartpy as sp
from smartpy.templates import fa2_lib as fa2

# Expose the fa2.main module so our @sp.module can import it by name.
main = fa2.main


@sp.module
def my_module():
    import main
    import smartpy.stdlib.string_utils as string_utils

    class VisitNounsFA2(
        main.Admin,
        main.Fungible,
        main.ChangeMetadata,
        main.WithdrawMutez,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """Visit Nouns FA2 multi-asset contract.

        FA2 / TZIP-12 compliant open-edition minting contract.
        Each noun_id is a distinct FA2 token (token_id == noun_id).
        Anyone can mint; metadata is generated deterministically on
        first mint of each noun_id.
        """

        def __init__(
            self,
            administrator,
            metadata,
            metadata_base_cid,
            mint_price_mutez,
            royalty_bps,
            max_noun_id,
        ):
            # ── Mixin initialisation (reverse dependency order) ──────────
            # OnchainviewBalanceOf has no storage of its own.
            main.OnchainviewBalanceOf.__init__(self)
            # OffchainviewTokenMetadata has no storage of its own.
            main.OffchainviewTokenMetadata.__init__(self)
            # WithdrawMutez has no storage of its own.
            main.WithdrawMutez.__init__(self)
            # ChangeMetadata initialises self.data.metadata (overwritten below).
            main.ChangeMetadata.__init__(self)
            # Fungible initialises ledger, supply, token_metadata, operators,
            # next_token_id, and metadata.  We pass empty ledger + token list
            # because all tokens are minted lazily via mint_noun.
            main.Fungible.__init__(self, metadata, {}, [])
            # Admin initialises self.data.administrator.
            main.Admin.__init__(self, administrator)

            # ── Custom storage fields ─────────────────────────────────────
            # Base CID for deterministic metadata URIs.
            # Leave empty at origination; call set_metadata_base_cid post-deploy.
            self.data.metadata_base_cid = sp.cast(metadata_base_cid, sp.string)

            # Mint price in mutez (0 = gas-only free mint).
            self.data.mint_price_mutez = sp.cast(mint_price_mutez, sp.mutez)

            # Royalty basis points (2000 = 20 %, max 2500 = 25 %).
            # Stored as source-of-truth; baked into token_info on first mint.
            self.data.royalty_bps = sp.cast(royalty_bps, sp.nat)

            # Maximum noun_id that can be minted (inclusive, default 1199).
            self.data.max_noun_id = sp.cast(max_noun_id, sp.nat)

            # Per-noun edition counter: noun_supply[noun_id] = total minted.
            self.data.noun_supply = sp.cast(
                sp.big_map(), sp.big_map[sp.nat, sp.nat]
            )

        # ── Public mint entrypoint ────────────────────────────────────────

        @sp.entrypoint
        def mint_noun(self, noun_id):
            """Mint one edition of noun_id to the caller.

            - Anyone can call this entrypoint.
            - Caller must send exactly mint_price_mutez.
            - noun_id must be <= max_noun_id.
            - On first mint of a noun_id: token_metadata is created with
              a deterministic IPFS URI and packed TZIP-21 royalties.
            - On subsequent mints: supply and ledger are incremented.
            """
            sp.cast(noun_id, sp.nat)

            # Guard: noun_id within allowed range.
            assert noun_id <= self.data.max_noun_id, "NOUN_ID_EXCEEDS_MAX"

            # Guard: exact payment required.
            assert sp.amount == self.data.mint_price_mutez, "INCORRECT_MINT_PRICE"

            # ── First-mint: lazy token registration ───────────────────────
            if not (noun_id in self.data.token_metadata):
                # Deterministic URI: ipfs://<base_cid>/<noun_id>.json
                uri = (
                    self.data.metadata_base_cid
                    + "/"
                    + string_utils.from_int(sp.to_int(noun_id))
                    + ".json"
                )

                # Build TZIP-12 / TZIP-21 token_info map.
                # key ""        → the canonical metadata URI (TZIP-12 §8.1)
                # key "name"    → human-readable token name
                # key "decimals"→ "0" (editions are whole units)
                # key "royalties" → packed TZIP-21 royalties record
                #   sp.record(
                #       decimals = 4,          # shares are in 1/10000 units
                #       shares   = { royalty_recipient: bps_value }
                #   )
                #   objkt, teia, and most Tezos marketplaces read this key.
                token_info = sp.cast({}, sp.map[sp.string, sp.bytes])
                token_info[""] = sp.utils.bytes_of_string(uri)
                token_info["name"] = sp.utils.bytes_of_string(
                    "Noun " + string_utils.from_int(sp.to_int(noun_id))
                )
                token_info["decimals"] = sp.utils.bytes_of_string("0")
                token_info["royalties"] = sp.pack(
                    sp.record(
                        decimals=sp.nat(4),
                        shares={self.data.administrator: self.data.royalty_bps},
                    )
                )

                # Register token in the FA2 token_metadata big_map.
                self.data.token_metadata[noun_id] = sp.record(
                    token_id=noun_id,
                    token_info=token_info,
                )

                # Initialise supply entry (Fungible ledger requires it).
                self.data.supply[noun_id] = 0
                # Initialise per-noun edition counter.
                self.data.noun_supply[noun_id] = 0

                # Keep next_token_id consistent so all_tokens() view works.
                if noun_id >= self.data.next_token_id:
                    self.data.next_token_id = noun_id + 1

            # ── Mint: update supply, edition counter, and ledger ──────────
            self.data.supply[noun_id] += 1
            self.data.noun_supply[noun_id] += 1

            key = (sp.sender, noun_id)
            self.data.ledger[key] = self.data.ledger.get(key, default=0) + 1

        # ── Admin setters ─────────────────────────────────────────────────

        @sp.entrypoint
        def set_admin(self, new_admin):
            """Rotate the administrator address.

            Alias for the set_administrator entrypoint provided by
            main.Admin; kept for API compatibility with the v0.16 contract.
            """
            sp.cast(new_admin, sp.address)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.administrator = new_admin

        @sp.entrypoint
        def set_metadata_base_cid(self, cid):
            """Set the IPFS base CID used to construct token metadata URIs.

            Format expected: bare CIDv1 string, e.g.
              "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            The contract appends "/<noun_id>.json" automatically.
            """
            sp.cast(cid, sp.string)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.metadata_base_cid = cid

        @sp.entrypoint
        def set_mint_price(self, price_mutez):
            """Set the mint price in mutez (0 = gas-only free mint)."""
            sp.cast(price_mutez, sp.mutez)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.mint_price_mutez = price_mutez

        @sp.entrypoint
        def set_royalty_bps(self, bps):
            """Set royalty basis points for future mints (max 2500 = 25 %).

            NOTE: This only affects tokens minted AFTER this call.
            Already-minted tokens have their royalties baked into their
            packed token_info bytes and are not retroactively updated.
            """
            sp.cast(bps, sp.nat)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            assert bps <= 2500, "ROYALTY_EXCEEDS_MAX"
            self.data.royalty_bps = bps

        @sp.entrypoint
        def set_max_noun_id(self, max_id):
            """Set the maximum noun_id that can be minted (inclusive)."""
            sp.cast(max_id, sp.nat)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.max_noun_id = max_id

        @sp.entrypoint
        def withdraw(self, amount, to_):
            """Withdraw mutez from the contract balance to an address.

            Complement to the withdraw_mutez entrypoint provided by
            main.WithdrawMutez (which takes (destination, amount) in the
            opposite argument order).  Both are present; remove whichever
            you do not need before deploying.
            """
            sp.cast(amount, sp.mutez)
            sp.cast(to_, sp.address)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            sp.send(to_, amount)


# ── Test scenario ─────────────────────────────────────────────────────────────

@sp.add_test()
def test():
    sc = sp.test_scenario("VisitNounsFA2 Tests", my_module)
    sc.h1("Visit Nouns FA2 — Test Scenario")

    # ── Accounts ─────────────────────────────────────────────────────────
    admin = sp.test_account("Admin")
    alice = sp.test_account("Alice")
    bob   = sp.test_account("Bob")

    # ── Contract metadata (TZIP-16 stub) ─────────────────────────────────
    # The "" key points to the off-chain TZIP-16 JSON document.
    # At origination we use a placeholder; admin calls set_metadata
    # post-deploy to point at the real IPFS document.
    contract_metadata = sp.cast(
        sp.big_map({"": sp.utils.bytes_of_string("ipfs://QmTZIP16StubReplaceMePostDeploy")}),
        sp.big_map[sp.string, sp.bytes],
    )

    # ── Originate ────────────────────────────────────────────────────────
    sc.h2("Origination")
    c1 = my_module.VisitNounsFA2(
        administrator    = admin.address,
        metadata         = contract_metadata,
        metadata_base_cid= "",           # empty; set via set_metadata_base_cid
        mint_price_mutez = sp.mutez(0),  # free mint at launch
        royalty_bps      = 2000,         # 20 %
        max_noun_id      = 1199,
    )
    sc += c1
    sc.verify(c1.data.administrator == admin.address)
    sc.verify(c1.data.royalty_bps   == 2000)
    sc.verify(c1.data.max_noun_id   == 1199)

    # ── Set base CID before minting ───────────────────────────────────────
    sc.h2("Admin: set_metadata_base_cid")
    c1.set_metadata_base_cid(
        "ipfs://QmExampleBaseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        _sender=admin,
    )

    # ── Free minting ──────────────────────────────────────────────────────
    sc.h2("Free Minting (price = 0 mutez)")

    # Alice mints noun #0 — first mint creates token_metadata
    c1.mint_noun(0, _sender=alice, _amount=sp.mutez(0))
    sc.verify(c1.data.supply[0]                    == 1)
    sc.verify(c1.data.noun_supply[0]               == 1)
    sc.verify(c1.data.ledger[(alice.address, 0)]   == 1)
    sc.verify(c1.data.token_metadata[0].token_id   == 0)
    sc.verify(c1.data.next_token_id                == 1)

    # Bob mints noun #0 — second mint, no new token_metadata entry
    c1.mint_noun(0, _sender=bob, _amount=sp.mutez(0))
    sc.verify(c1.data.supply[0]                    == 2)
    sc.verify(c1.data.noun_supply[0]               == 2)
    sc.verify(c1.data.ledger[(bob.address, 0)]     == 1)

    # Alice mints noun #1199 (max boundary)
    c1.mint_noun(1199, _sender=alice, _amount=sp.mutez(0))
    sc.verify(c1.data.supply[1199]                 == 1)
    sc.verify(c1.data.next_token_id                == 1200)

    # Attempt to mint past max_noun_id — must fail
    c1.mint_noun(
        1200,
        _sender=alice,
        _amount=sp.mutez(0),
        _valid=False,
        _exception="NOUN_ID_EXCEEDS_MAX",
    )

    # ── Paid minting ──────────────────────────────────────────────────────
    sc.h2("Paid Minting (price = 1 tez)")
    c1.set_mint_price(sp.mutez(1_000_000), _sender=admin)
    sc.verify(c1.data.mint_price_mutez == sp.mutez(1_000_000))

    # Underpayment must fail
    c1.mint_noun(
        1,
        _sender=bob,
        _amount=sp.mutez(0),
        _valid=False,
        _exception="INCORRECT_MINT_PRICE",
    )

    # Overpayment must also fail
    c1.mint_noun(
        1,
        _sender=bob,
        _amount=sp.mutez(2_000_000),
        _valid=False,
        _exception="INCORRECT_MINT_PRICE",
    )

    # Exact payment succeeds
    c1.mint_noun(1, _sender=bob, _amount=sp.mutez(1_000_000))
    sc.verify(c1.data.supply[1]                    == 1)
    sc.verify(c1.data.ledger[(bob.address, 1)]     == 1)

    # ── Withdraw ──────────────────────────────────────────────────────────
    sc.h2("Withdraw")
    c1.withdraw(amount=sp.mutez(1_000_000), to_=admin.address, _sender=admin)

    # ── Royalty cap ───────────────────────────────────────────────────────
    sc.h2("Royalty Cap")
    c1.set_royalty_bps(2500, _sender=admin)
    sc.verify(c1.data.royalty_bps == 2500)

    c1.set_royalty_bps(
        2501,
        _sender=admin,
        _valid=False,
        _exception="ROYALTY_EXCEEDS_MAX",
    )

    # ── Non-admin rejection ───────────────────────────────────────────────
    sc.h2("Non-Admin Rejection")
    c1.set_admin(
        bob.address,
        _sender=alice,
        _valid=False,
        _exception="FA2_NOT_ADMIN",
    )
    c1.set_metadata_base_cid(
        "ipfs://QmEvil",
        _sender=alice,
        _valid=False,
        _exception="FA2_NOT_ADMIN",
    )
    c1.set_mint_price(
        sp.mutez(0),
        _sender=bob,
        _valid=False,
        _exception="FA2_NOT_ADMIN",
    )
    c1.set_max_noun_id(
        9999,
        _sender=alice,
        _valid=False,
        _exception="FA2_NOT_ADMIN",
    )
    c1.withdraw(
        amount=sp.mutez(0),
        to_=alice.address,
        _sender=alice,
        _valid=False,
        _exception="FA2_NOT_ADMIN",
    )

    # ── FA2 transfer ──────────────────────────────────────────────────────
    sc.h2("FA2 Transfer (TZIP-12)")
    # Alice transfers 1 edition of noun #0 to Bob
    c1.transfer(
        [
            sp.record(
                from_=alice.address,
                txs=[
                    sp.record(to_=bob.address, token_id=0, amount=1)
                ],
            )
        ],
        _sender=alice,
    )
    sc.verify(c1.data.ledger[(alice.address, 0)] == 0)
    sc.verify(c1.data.ledger[(bob.address,  0)]  == 2)

    # ── set_max_noun_id ───────────────────────────────────────────────────
    sc.h2("Admin: set_max_noun_id")
    c1.set_max_noun_id(500, _sender=admin)
    sc.verify(c1.data.max_noun_id == 500)
    c1.mint_noun(
        501,
        _sender=alice,
        _amount=sp.mutez(1_000_000),
        _valid=False,
        _exception="NOUN_ID_EXCEEDS_MAX",
    )
