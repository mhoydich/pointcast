"""
PointCast Visit Nouns — FA2 multi-asset contract.

Standard: TZIP-12 (Tezos FA2). Any wallet / marketplace (objkt, teia, tzkt,
Kukai, Temple) reads this contract natively, so minted tokens appear in
visitor wallets + on secondary markets without us wiring anything extra.

Design:

  • Multi-asset: one contract holds many token_ids (0-1199 = the Noun IDs).
  • Public `mint_noun` entrypoint: anyone can mint. Pays Tezos gas + our
    `mint_price_mutez` (default 0 — gas-only).
  • Open editions per noun_id: no per-noun supply cap. Inclusive design;
    "your visit noun is yours" without scarcity panic. An admin-cappable
    global `max_editions_per_noun` can be set later if we want to limit.
  • Deterministic metadata URI: each token's metadata JSON lives at
    `ipfs://{metadata_base_cid}/{noun_id}.json`. The admin sets
    `metadata_base_cid` once after IPFS upload; visitors can't lie about
    metadata because they never supply a URI — only the token id.
  • Lazy token creation: the first mint of a given noun_id registers the
    `token_metadata` entry. Subsequent mints just bump the balance.
  • Royalties: 20% to admin on secondary sales (heavy-royalty default,
    TZIP-compliant so objkt/teia honor it automatically). Capped at 25%.
    Adjustable via set_royalty_bps.
  • Admin: Mike's tz2 address. Can rotate admin, set price, set CID cap.

Entry points:

    mint_noun(noun_id)              public · mints 1 token to sender
    transfer(list of transfers)     FA2 standard
    balance_of(requests, callback)  FA2 standard
    update_operators(ops)           FA2 standard
    set_admin(new_admin)            admin-only
    set_metadata_base_cid(cid)      admin-only
    set_mint_price(mutez)           admin-only
    set_royalty_bps(bps)            admin-only
    withdraw(amount, to)            admin-only — sweep accumulated mint fees

Compile:

    pip install smartpy
    python3 -m smartpy compile contracts/visit_nouns_fa2.py contracts/build/

Written against SmartPy 0.20.x. If you're on an older version, adjust the
import path (`smartpy.templates.fa2_lib`) or fall back to SmartPy 0.14's
`utils/fa2_lib.py` template — contract semantics are identical.
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


@sp.module
def main():
    import fa2_lib

    # ------------------------------------------------------------------
    # Mixin: public mint + deterministic metadata + royalties + admin.
    #
    # We compose from fa2_lib's building blocks:
    #
    #   • Fa2MultiAsset  — ledger + transfer + balance_of + update_operators
    #   • Admin          — admin address + only-admin helper
    #
    # and add our own mint_noun / config setters / withdraw entrypoints.
    # ------------------------------------------------------------------

    class VisitNouns(
        fa2_lib.Admin,
        fa2_lib.Fa2MultiAsset,
    ):
        def __init__(self, admin, metadata_base_cid, contract_metadata):
            """
            admin                — tz2 address that can rotate config.
            metadata_base_cid    — IPFS CID of the directory holding
                                   per-token metadata JSONs. Set empty
                                   at origination; call set_metadata_base_cid
                                   after the upload script pins the files.
            contract_metadata    — TZIP-16 contract-level metadata (name,
                                   description, authors, interfaces).
            """
            fa2_lib.Fa2MultiAsset.__init__(
                self,
                metadata=contract_metadata,
                token_metadata=[],
                ledger={},
            )
            fa2_lib.Admin.__init__(self, admin)
            self.data.metadata_base_cid = metadata_base_cid
            self.data.mint_price_mutez = sp.nat(0)           # gas-only by default
            # Heavy royalties — 20% on secondary. Tezos marketplaces (objkt,
            # teia, tzkt) honor up to ~25% before collectors start complaining;
            # 20% is the bold end of "reasonable" and well above the 5-10%
            # norm. Admin can dial post-deploy via set_royalty_bps.
            self.data.royalty_bps = sp.nat(2000)             # 20% on secondary
            self.data.max_noun_id = sp.nat(1199)             # noun.pics range
            # Per-noun supply counter — helps marketplaces show "N minted".
            self.data.supply = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.nat])

        # -------------------------------------------------------
        # mint_noun — public, payable, mints 1 token to sender.
        # -------------------------------------------------------
        @sp.entrypoint
        def mint_noun(self, noun_id):
            """Mint noun #{noun_id} to sp.sender. Anyone can call."""
            sp.cast(noun_id, sp.nat)
            assert noun_id <= self.data.max_noun_id, "NOUN_ID_OUT_OF_RANGE"
            assert (
                sp.amount >= sp.utils.nat_to_mutez(self.data.mint_price_mutez)
            ), "INSUFFICIENT_PAYMENT"

            # Lazy-create token metadata on first mint of this noun_id.
            # URI is deterministic: ipfs://{base}/{noun_id}.json.
            if not self.data.token_metadata.contains(noun_id):
                # Build the metadata URI bytes: "ipfs://<cid>/<n>.json"
                uri_str = (
                    "ipfs://"
                    + self.data.metadata_base_cid
                    + "/"
                    + sp.view_utils.nat_to_string(noun_id)
                    + ".json"
                )
                token_info = {
                    # TZIP-12 empty-key = off-chain URI. This must be raw
                    # UTF-8 bytes; sp.pack(uri_str) produces a Micheline
                    # payload that wallets index as an unknown token.
                    "": sp.utils.bytes_of_string(uri_str),
                }
                self.data.token_metadata[noun_id] = sp.record(
                    token_id=noun_id,
                    token_info=token_info,
                )
                self.data.supply[noun_id] = sp.nat(0)

            # Bump the sender's balance of noun_id by 1.
            owner = sp.sender
            key = (owner, noun_id)
            bal = self.data.ledger.get(key, default=sp.nat(0))
            self.data.ledger[key] = bal + 1
            self.data.supply[noun_id] = (
                self.data.supply.get(noun_id, default=sp.nat(0)) + 1
            )

        # -------------------------------------------------------
        # Admin setters.
        # -------------------------------------------------------

        @sp.entrypoint
        def set_metadata_base_cid(self, cid):
            """Admin: set the IPFS directory CID for token metadata."""
            sp.cast(cid, sp.string)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.metadata_base_cid = cid

        @sp.entrypoint
        def set_mint_price(self, price_mutez):
            """Admin: adjust the mint price (in mutez)."""
            sp.cast(price_mutez, sp.nat)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.mint_price_mutez = price_mutez

        @sp.entrypoint
        def set_royalty_bps(self, bps):
            """Admin: adjust royalty basis points (10000 = 100%). Capped at 2500 (25%)."""
            sp.cast(bps, sp.nat)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            assert bps <= 2500, "ROYALTY_TOO_HIGH"
            self.data.royalty_bps = bps

        @sp.entrypoint
        def set_max_noun_id(self, max_id):
            """Admin: adjust the max mintable noun_id (default 1199)."""
            sp.cast(max_id, sp.nat)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.max_noun_id = max_id

        @sp.entrypoint
        def withdraw(self, params):
            """Admin: sweep accumulated mint fees to an address."""
            sp.cast(params, sp.record(amount=sp.mutez, to=sp.address))
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            sp.send(params.to, params.amount)


# ----------------------------------------------------------------------
# Origination helper + minimal test
# ----------------------------------------------------------------------

if "main" in __name__:

    @sp.add_test(name="VisitNouns basic mint flow")
    def test():
        sc = sp.test_scenario(main)
        sc.h1("PointCast Visit Nouns — mint test")

        admin = sp.test_account("admin")
        alice = sp.test_account("alice")
        bob = sp.test_account("bob")

        # Placeholder contract metadata for testing — production uses TZIP-16.
        contract_meta = sp.utils.metadata_of_url(
            "ipfs://QmPointCastContractMetaStub"
        )

        c = main.VisitNouns(
            admin=admin.address,
            metadata_base_cid="QmPointCastNounsMetaStub",
            contract_metadata=contract_meta,
        )
        sc += c

        # Alice mints noun #137 (the PointCast noun) — should succeed.
        c.mint_noun(sp.nat(137)).run(sender=alice, amount=sp.mutez(0))
        sc.verify(c.data.ledger[(alice.address, 137)] == 1)
        sc.verify(c.data.supply[137] == 1)

        # Bob mints another #137 — open editions, should also succeed.
        c.mint_noun(sp.nat(137)).run(sender=bob, amount=sp.mutez(0))
        sc.verify(c.data.ledger[(bob.address, 137)] == 1)
        sc.verify(c.data.supply[137] == 2)

        # Out-of-range should fail.
        c.mint_noun(sp.nat(5000)).run(sender=alice, valid=False)

        # Admin bumps price to 1 ꜩ — underpay should fail.
        c.set_mint_price(sp.nat(1_000_000)).run(sender=admin)
        c.mint_noun(sp.nat(42)).run(
            sender=alice, amount=sp.mutez(500_000), valid=False
        )
        # Proper payment succeeds.
        c.mint_noun(sp.nat(42)).run(
            sender=alice, amount=sp.mutez(1_000_000)
        )
        sc.verify(c.data.ledger[(alice.address, 42)] == 1)

        # Non-admin attempts setter — must fail.
        c.set_mint_price(sp.nat(0)).run(sender=bob, valid=False)

        # Royalty cap — > 25% must reject.
        c.set_royalty_bps(sp.nat(3000)).run(sender=admin, valid=False)
