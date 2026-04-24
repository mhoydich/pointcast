# ============================================================
# passport_stamps_fa2.py
# Target: SmartPy v0.24.1
# FA2 lib: smartpy.templates.fa2_lib
# ============================================================
#
# Native PointCast Station Passport stamps.
#
# This contract is intentionally close to contracts/v2/visit_nouns_fa2.py:
# - FA2 multi-token collection via main.Fungible
# - public gas-only mint by default
# - lazy token metadata registration on first mint
# - one token ID per station stamp, P00-P23 -> 0-23
#
# Frontend flow:
# - Until this contract is originated, /passport mints Visit Nouns companion
#   proofs (#900-#923) through the already-live Visit Nouns FA2.
# - Once this contract has a KT1 in src/data/contracts.json under
#   passport_stamps.mainnet, /passport switches to mint_stamp(stamp_id).

import smartpy as sp
from smartpy.templates import fa2_lib as fa2

main = fa2.main


@sp.module
def passport_module():
    import main
    import smartpy.stdlib.string_utils as string_utils

    class PassportStampsFA2(
        main.Admin,
        main.Fungible,
        main.ChangeMetadata,
        main.WithdrawMutez,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """FA2 collection for PointCast Passport station stamps."""

        def __init__(
            self,
            administrator,
            metadata,
            metadata_base_url,
            mint_price_mutez,
            royalty_bps,
        ):
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.WithdrawMutez.__init__(self)
            main.ChangeMetadata.__init__(self)
            main.Fungible.__init__(self, metadata, {}, [])
            main.Admin.__init__(self, administrator)

            self.data.metadata_base_url = sp.cast(metadata_base_url, sp.string)
            self.data.mint_price_mutez = sp.cast(mint_price_mutez, sp.mutez)
            self.data.royalty_bps = sp.cast(royalty_bps, sp.nat)
            self.data.paused = False
            self.data.max_stamp_id = sp.nat(23)

            # 0 = unlimited open edition. Non-zero caps can be set per stamp.
            self.data.stamp_caps = sp.cast(
                sp.big_map(),
                sp.big_map[sp.nat, sp.nat],
            )
            self.data.stamp_supply = sp.cast(
                sp.big_map(),
                sp.big_map[sp.nat, sp.nat],
            )

            # Registry: token_id -> slug. These slugs line up with
            # /passport/stamps/{slug}.json and /passport/art/{slug}.svg.
            self.data.stamp_slugs = sp.cast(
                sp.big_map(
                    {
                        0: "el-segundo",
                        1: "manhattan-beach",
                        2: "hermosa",
                        3: "redondo-beach",
                        4: "venice",
                        5: "santa-monica",
                        6: "palos-verdes",
                        7: "long-beach",
                        8: "los-angeles",
                        9: "malibu",
                        10: "pasadena",
                        11: "anaheim-oc",
                        12: "newport-laguna",
                        13: "santa-barbara",
                        14: "north-san-diego",
                        15: "palm-springs",
                        16: "lax-westchester",
                        17: "inglewood",
                        18: "torrance",
                        19: "culver-city",
                        20: "san-pedro",
                        21: "hollywood",
                        22: "burbank-glendale",
                        23: "ventura",
                    }
                ),
                sp.big_map[sp.nat, sp.string],
            )

        @sp.private(with_storage="read-only")
        def stamp_code(self, stamp_id):
            tens = stamp_id / 10
            ones = stamp_id % 10
            return (
                "P"
                + string_utils.from_int(sp.to_int(tens))
                + string_utils.from_int(sp.to_int(ones))
            )

        @sp.private(with_storage="read-only")
        def stamp_uri(self, stamp_id):
            slug = self.data.stamp_slugs[stamp_id]
            return self.data.metadata_base_url + "/" + slug + ".json"

        @sp.private(with_storage="read-only")
        def assert_can_mint(self, stamp_id):
            assert not self.data.paused, "PASSPORT_PAUSED"
            assert stamp_id <= self.data.max_stamp_id, "STAMP_ID_EXCEEDS_MAX"
            assert stamp_id in self.data.stamp_slugs, "STAMP_NOT_REGISTERED"
            assert sp.amount == self.data.mint_price_mutez, "INCORRECT_MINT_PRICE"

            cap = self.data.stamp_caps.get(stamp_id, default=0)
            current = self.data.stamp_supply.get(stamp_id, default=0)
            if cap > 0:
                assert current < cap, "STAMP_SOLD_OUT"

        @sp.private(with_storage="read-write")
        def ensure_token_registered(self, stamp_id):
            if not (stamp_id in self.data.token_metadata):
                token_info = sp.cast({}, sp.map[sp.string, sp.bytes])
                token_info[""] = sp.pack(self.stamp_uri(stamp_id))
                token_info["name"] = sp.pack(
                    "PointCast Passport Stamp " + self.stamp_code(stamp_id)
                )
                token_info["symbol"] = sp.pack("PCPASS")
                token_info["decimals"] = sp.pack("0")
                token_info["royalties"] = sp.pack(
                    sp.record(
                        decimals=sp.nat(4),
                        shares={self.data.administrator: self.data.royalty_bps},
                    )
                )

                self.data.token_metadata[stamp_id] = sp.record(
                    token_id=stamp_id,
                    token_info=token_info,
                )
                self.data.supply[stamp_id] = 0
                self.data.stamp_supply[stamp_id] = 0

                if stamp_id >= self.data.next_token_id:
                    self.data.next_token_id = stamp_id + 1

        @sp.private(with_storage="read-write")
        def mint_to_(self, to_, stamp_id):
            self.ensure_token_registered(stamp_id)
            self.data.supply[stamp_id] += 1
            self.data.stamp_supply[stamp_id] += 1
            key = (to_, stamp_id)
            self.data.ledger[key] = self.data.ledger.get(key, default=0) + 1

        @sp.entrypoint
        def mint_stamp(self, stamp_id):
            """Mint one edition of station stamp token_id 0-23 to sender."""
            sp.cast(stamp_id, sp.nat)
            self.assert_can_mint(stamp_id)
            self.mint_to_(sp.sender, stamp_id)

        @sp.entrypoint
        def admin_mint(self, to_, stamp_id):
            """Admin mint for ops, giveaways, and migration receipts."""
            sp.cast(to_, sp.address)
            sp.cast(stamp_id, sp.nat)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            assert stamp_id <= self.data.max_stamp_id, "STAMP_ID_EXCEEDS_MAX"
            assert stamp_id in self.data.stamp_slugs, "STAMP_NOT_REGISTERED"
            self.mint_to_(to_, stamp_id)

        @sp.entrypoint
        def set_admin(self, new_admin):
            sp.cast(new_admin, sp.address)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.administrator = new_admin

        @sp.entrypoint
        def set_metadata_base_url(self, url):
            """Set base URL, e.g. https://pointcast.xyz/passport/stamps."""
            sp.cast(url, sp.string)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.metadata_base_url = url

        @sp.entrypoint
        def set_mint_price(self, price_mutez):
            sp.cast(price_mutez, sp.mutez)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.mint_price_mutez = price_mutez

        @sp.entrypoint
        def set_paused(self, paused):
            sp.cast(paused, sp.bool)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.paused = paused

        @sp.entrypoint
        def set_royalty_bps(self, bps):
            sp.cast(bps, sp.nat)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            assert bps <= 2500, "ROYALTY_EXCEEDS_MAX"
            self.data.royalty_bps = bps

        @sp.entrypoint
        def set_stamp_cap(self, stamp_id, cap):
            sp.cast(stamp_id, sp.nat)
            sp.cast(cap, sp.nat)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            assert stamp_id <= self.data.max_stamp_id, "STAMP_ID_EXCEEDS_MAX"
            self.data.stamp_caps[stamp_id] = cap

        @sp.entrypoint
        def set_stamp_slug(self, stamp_id, slug):
            """Admin escape hatch for metadata route fixes before first mint."""
            sp.cast(stamp_id, sp.nat)
            sp.cast(slug, sp.string)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            assert stamp_id <= self.data.max_stamp_id, "STAMP_ID_EXCEEDS_MAX"
            assert not (stamp_id in self.data.token_metadata), "TOKEN_ALREADY_REGISTERED"
            self.data.stamp_slugs[stamp_id] = slug

        @sp.entrypoint
        def withdraw(self, amount, to_):
            sp.cast(amount, sp.mutez)
            sp.cast(to_, sp.address)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            sp.send(to_, amount)


@sp.add_test()
def test():
    sc = sp.test_scenario("PassportStampsFA2 Tests", passport_module)
    sc.h1("PointCast Passport Stamps FA2")

    admin = sp.test_account("Admin")
    alice = sp.test_account("Alice")
    bob = sp.test_account("Bob")

    contract_metadata = sp.cast(
        sp.big_map({"": sp.pack("https://pointcast.xyz/passport.json")}),
        sp.big_map[sp.string, sp.bytes],
    )

    c1 = passport_module.PassportStampsFA2(
        administrator=admin.address,
        metadata=contract_metadata,
        metadata_base_url="https://pointcast.xyz/passport/stamps",
        mint_price_mutez=sp.mutez(0),
        royalty_bps=2000,
    )
    sc += c1

    sc.h2("Free public mint")
    c1.mint_stamp(0, _sender=alice, _amount=sp.mutez(0))
    sc.verify(c1.data.supply[0] == 1)
    sc.verify(c1.data.stamp_supply[0] == 1)
    sc.verify(c1.data.ledger[(alice.address, 0)] == 1)
    sc.verify(c1.data.token_metadata[0].token_id == 0)

    c1.mint_stamp(0, _sender=bob, _amount=sp.mutez(0))
    sc.verify(c1.data.supply[0] == 2)
    sc.verify(c1.data.ledger[(bob.address, 0)] == 1)

    c1.mint_stamp(23, _sender=alice, _amount=sp.mutez(0))
    sc.verify(c1.data.supply[23] == 1)

    c1.mint_stamp(
        24,
        _sender=alice,
        _amount=sp.mutez(0),
        _valid=False,
        _exception="STAMP_ID_EXCEEDS_MAX",
    )

    sc.h2("Paid mint")
    c1.set_mint_price(sp.mutez(1_000_000), _sender=admin)
    c1.mint_stamp(
        1,
        _sender=bob,
        _amount=sp.mutez(0),
        _valid=False,
        _exception="INCORRECT_MINT_PRICE",
    )
    c1.mint_stamp(1, _sender=bob, _amount=sp.mutez(1_000_000))
    sc.verify(c1.data.supply[1] == 1)

    sc.h2("Caps")
    c1.set_mint_price(sp.mutez(0), _sender=admin)
    c1.set_stamp_cap(stamp_id=2, cap=1, _sender=admin)
    c1.mint_stamp(2, _sender=alice, _amount=sp.mutez(0))
    c1.mint_stamp(
        2,
        _sender=bob,
        _amount=sp.mutez(0),
        _valid=False,
        _exception="STAMP_SOLD_OUT",
    )

    sc.h2("Pause")
    c1.set_paused(True, _sender=admin)
    c1.mint_stamp(
        3,
        _sender=alice,
        _amount=sp.mutez(0),
        _valid=False,
        _exception="PASSPORT_PAUSED",
    )
    c1.set_paused(False, _sender=admin)

    sc.h2("Admin mint and transfer")
    c1.admin_mint(to_=bob.address, stamp_id=4, _sender=admin)
    sc.verify(c1.data.ledger[(bob.address, 4)] == 1)
    c1.transfer(
        [
            sp.record(
                from_=bob.address,
                txs=[sp.record(to_=alice.address, token_id=4, amount=1)],
            )
        ],
        _sender=bob,
    )
    sc.verify(c1.data.ledger[(alice.address, 4)] == 1)

    sc.h2("Admin guards")
    c1.set_stamp_cap(
        stamp_id=5,
        cap=10,
        _sender=alice,
        _valid=False,
        _exception="FA2_NOT_ADMIN",
    )
    c1.set_royalty_bps(
        2501,
        _sender=admin,
        _valid=False,
        _exception="ROYALTY_EXCEEDS_MAX",
    )
