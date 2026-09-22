"""
campus_cards_fa2.py - Campus Cards multi-set collectible FA2
SmartPy v0.24.1

One contract for every Campus Cards set (the ten University of California
campuses, one set at a time; Set 01 is Santa Barbara). Each token ID is one
card. A card carries its own price, supply cap (0 = open edition), and an
open flag, so a new campus set is an `add_card` call per card, not a new
origination.

Every set in src/data/campus-cards.json is registered at origination
(Set 01 Santa Barbara = tokens 0-11, Set 02 Berkeley = 12-23); later sets
come in through add_card. The compiled storage carries inline placeholders;
scripts/campus-cards-mint-desk.mjs swaps each token's metadata for a TZIP-16
pointer to its pinned JSON before origination. set_token_info repairs a
card's metadata later without a new contract.

House style (PointCast contracts/v2, SmartPy 0.24.1): the module is `m`, no
module-level type aliases, no undecorated helpers, asserts inlined per
entrypoint. The standard fa2_lib Fungible base supplies canonical TZIP-12
transfer, balance_of, and update_operators.
"""

import json
import os

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


main = fa2.main

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "..", "..", "src", "data", "campus-cards.json")


def load_series():
    with open(DATA_PATH) as fh:
        return json.load(fh)


def card_token_info(series, card_set, card):
    rarity = series["rarities"][card["rarity"]]
    name = "Campus Cards · %s · %02d %s" % (card_set["title"].split(" · ")[1], card["n"], card["title"])
    placeholder = "ipfs://PLACEHOLDER_CAMPUS_CARDS_%s_%02d" % (card_set["id"].upper().replace("-", "_"), card["n"])
    attributes = json.dumps(
        [
            {"name": "Set", "value": card_set["title"]},
            {"name": "Card", "value": "%02d/%02d" % (card["n"], len(card_set["cards"]))},
            {"name": "Rarity", "value": rarity["label"]},
        ],
        ensure_ascii=True,
        separators=(",", ":"),
    )
    return sp.map(
        l={
            "name": sp.scenario_utils.bytes_of_string(name),
            "description": sp.scenario_utils.bytes_of_string(card["flavor"] + " " + series["notice"]),
            "symbol": sp.scenario_utils.bytes_of_string(series["symbol"]),
            "decimals": sp.scenario_utils.bytes_of_string("0"),
            "artifactUri": sp.scenario_utils.bytes_of_string(placeholder),
            "displayUri": sp.scenario_utils.bytes_of_string(placeholder),
            "thumbnailUri": sp.scenario_utils.bytes_of_string(placeholder),
            "attributes": sp.scenario_utils.bytes_of_string(attributes),
        }
    )


def all_token_metadata():
    series = load_series()
    return [
        card_token_info(series, card_set, card)
        for card_set in series["sets"]
        for card in card_set["cards"]
    ]


def all_terms():
    series = load_series()
    terms = []
    token_id = 0
    for card_set in series["sets"]:
        for card in card_set["cards"]:
            rarity = series["rarities"][card["rarity"]]
            terms.append(
                sp.record(
                    token_id=sp.nat(token_id),
                    set_id=card_set["id"],
                    price=sp.mutez(rarity["priceMutez"]),
                    cap=sp.nat(rarity["cap"]),
                )
            )
            token_id += 1
    return terms


def card_count():
    return sum(len(card_set["cards"]) for card_set in load_series()["sets"])


@sp.module
def m():
    import main

    class CampusCardsFA2(
        main.Fungible,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        def __init__(self, administrator, treasury, metadata, token_metadata, terms, paused):
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.Fungible.__init__(self, metadata, {}, token_metadata)

            sp.cast(administrator, sp.address)
            sp.cast(treasury, sp.address)
            sp.cast(paused, sp.bool)

            self.data.administrator = administrator
            self.data.treasury = treasury
            self.data.paused = paused
            self.data.cards = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(set_id=sp.string, price=sp.mutez, cap=sp.nat, open=sp.bool),
                ],
            )

            for term in terms:
                assert term.token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"
                self.data.cards[term.token_id] = sp.record(
                    set_id=term.set_id,
                    price=term.price,
                    cap=term.cap,
                    open=True,
                )

        @sp.entrypoint
        def mint(self, token_id, quantity):
            sp.cast(token_id, sp.nat)
            sp.cast(quantity, sp.nat)
            assert not self.data.paused, "MINT_PAUSED"
            assert token_id in self.data.cards, "CARD_NOT_FOUND"
            assert quantity > 0, "ZERO_QUANTITY"
            assert quantity <= 10, "MAX_10_PER_MINT"

            card = self.data.cards[token_id]
            assert card.open, "CARD_CLOSED"
            assert sp.amount == sp.mul(quantity, card.price), "WRONG_MINT_AMOUNT"

            current = self.data.supply[token_id]
            if card.cap > 0:
                assert current + quantity <= card.cap, "EDITION_CAP_REACHED"

            ledger_key = (sp.sender, token_id)
            self.data.ledger[ledger_key] = self.data.ledger.get(
                ledger_key, default=sp.nat(0)
            ) + quantity
            self.data.supply[token_id] = current + quantity

            if sp.amount > sp.mutez(0):
                sp.send(self.data.treasury, sp.amount)

        @sp.entrypoint
        def add_card(self, token_info, set_id, price, cap):
            sp.cast(token_info, sp.map[sp.string, sp.bytes])
            sp.cast(set_id, sp.string)
            sp.cast(price, sp.mutez)
            sp.cast(cap, sp.nat)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            token_id = self.data.next_token_id
            self.data.token_metadata[token_id] = sp.record(
                token_id=token_id, token_info=token_info
            )
            self.data.supply[token_id] = 0
            self.data.cards[token_id] = sp.record(
                set_id=set_id, price=price, cap=cap, open=False
            )
            self.data.next_token_id += 1

        @sp.entrypoint
        def set_card(self, token_id, price, cap, open):
            sp.cast(token_id, sp.nat)
            sp.cast(price, sp.mutez)
            sp.cast(cap, sp.nat)
            sp.cast(open, sp.bool)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            assert token_id in self.data.cards, "CARD_NOT_FOUND"
            card = self.data.cards[token_id]
            if cap > 0:
                assert cap >= self.data.supply[token_id], "CAP_BELOW_SUPPLY"
            self.data.cards[token_id] = sp.record(
                set_id=card.set_id, price=price, cap=cap, open=open
            )

        @sp.entrypoint
        def set_token_info(self, token_id, token_info):
            sp.cast(token_id, sp.nat)
            sp.cast(token_info, sp.map[sp.string, sp.bytes])
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            assert token_id in self.data.token_metadata, "TOKEN_NOT_REGISTERED"
            self.data.token_metadata[token_id] = sp.record(
                token_id=token_id, token_info=token_info
            )

        @sp.entrypoint
        def set_treasury(self, new_treasury):
            sp.cast(new_treasury, sp.address)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.treasury = new_treasury

        @sp.entrypoint
        def set_admin(self, new_administrator):
            sp.cast(new_administrator, sp.address)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.administrator = new_administrator

        @sp.entrypoint
        def set_paused(self, paused):
            sp.cast(paused, sp.bool)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.paused = paused

        @sp.onchain_view()
        def card(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.cards, "CARD_NOT_FOUND"
            return self.data.cards[token_id]

        @sp.onchain_view()
        def minted(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.cards, "CARD_NOT_FOUND"
            return self.data.supply[token_id]


@sp.module
def treasury_module():
    class TreasurySink(sp.Contract):
        def __init__(self):
            self.data.received = sp.mutez(0)

        @sp.entrypoint
        def default(self):
            self.data.received += sp.amount


@sp.add_test()
def test_campus_cards_fa2():
    scenario = sp.test_scenario("campus_cards_fa2", [fa2.t, fa2.main, m])
    scenario.add_module(treasury_module)

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")

    treasury = treasury_module.TreasurySink()
    scenario += treasury

    contract = m.CampusCardsFA2(
        administrator=admin.address,
        treasury=treasury.address,
        metadata=sp.scenario_utils.metadata_of_url("ipfs://PLACEHOLDER_CAMPUS_CARDS_CONTRACT_METADATA"),
        token_metadata=all_token_metadata(),
        terms=all_terms(),
        paused=False,
    )
    scenario += contract
    scenario.verify(contract.data.next_token_id == card_count())

    scenario.h2("Common card: open edition at 0.5 tez each, quantity pricing")
    common = 6  # Pardall Tunnel
    contract.mint(token_id=common, quantity=3, _sender=alice, _amount=sp.mutez(1_500_000))
    contract.mint(
        token_id=common, quantity=1, _sender=alice, _amount=sp.mutez(499_999),
        _valid=False, _exception="WRONG_MINT_AMOUNT",
    )
    contract.mint(
        token_id=common, quantity=11, _sender=alice, _amount=sp.mutez(5_500_000),
        _valid=False, _exception="MAX_10_PER_MINT",
    )
    scenario.verify(contract.data.ledger[(alice.address, common)] == 3)

    scenario.h2("Legendary card: cap 5 at 10 tez")
    legendary = 0  # Storke Tower
    contract.mint(token_id=legendary, quantity=4, _sender=alice, _amount=sp.mutez(40_000_000))
    contract.mint(
        token_id=legendary, quantity=2, _sender=bob, _amount=sp.mutez(20_000_000),
        _valid=False, _exception="EDITION_CAP_REACHED",
    )
    contract.mint(token_id=legendary, quantity=1, _sender=bob, _amount=sp.mutez(10_000_000))
    scenario.verify(contract.minted(legendary) == 5)

    scenario.h2("Proceeds forward to treasury")
    scenario.verify(treasury.data.received == sp.mutez(51_500_000))
    scenario.verify(contract.balance == sp.mutez(0))

    scenario.h2("Admin adds a new campus card: starts closed")
    contract.add_card(
        token_info=sp.map(l={"name": sp.scenario_utils.bytes_of_string("Campus Cards · Davis · 01")}),
        set_id="set-02",
        price=sp.mutez(1_000_000),
        cap=sp.nat(0),
        _sender=admin,
    )
    contract.add_card(
        token_info=sp.map(l={}), set_id="x", price=sp.mutez(0), cap=sp.nat(0),
        _sender=alice, _valid=False, _exception="NOT_ADMIN",
    )
    scenario.verify(contract.data.next_token_id == card_count() + 1)
    contract.mint(
        token_id=card_count(), quantity=1, _sender=bob, _amount=sp.mutez(1_000_000),
        _valid=False, _exception="CARD_CLOSED",
    )
    contract.set_card(token_id=card_count(), price=sp.mutez(0), cap=sp.nat(0), open=True, _sender=admin)
    contract.mint(token_id=card_count(), quantity=1, _sender=bob)
    scenario.verify(contract.minted(card_count()) == 1)

    scenario.h2("Set 02 Berkeley legendary is token 12 with its own cap")
    contract.mint(token_id=12, quantity=5, _sender=bob, _amount=sp.mutez(50_000_000))
    contract.mint(
        token_id=12, quantity=1, _sender=alice, _amount=sp.mutez(10_000_000),
        _valid=False, _exception="EDITION_CAP_REACHED",
    )

    scenario.h2("Cap cannot drop below supply")
    contract.set_card(
        token_id=legendary, price=sp.mutez(10_000_000), cap=sp.nat(4), open=True,
        _sender=admin, _valid=False, _exception="CAP_BELOW_SUPPLY",
    )

    scenario.h2("Transfers work (FA2 standard)")
    contract.transfer(
        [sp.record(from_=alice.address, txs=[sp.record(to_=bob.address, token_id=common, amount=1)])],
        _sender=alice,
    )
    scenario.verify(contract.data.ledger[(bob.address, common)] == 1)

    scenario.h2("Pause")
    contract.set_paused(True, _sender=admin)
    contract.mint(
        token_id=common, quantity=1, _sender=alice, _amount=sp.mutez(500_000),
        _valid=False, _exception="MINT_PAUSED",
    )


@sp.add_test()
def compile_campus_cards_fa2():
    scenario = sp.test_scenario("campus_cards_fa2_compile", [fa2.t, fa2.main, m])
    mike = sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw")
    contract = m.CampusCardsFA2(
        administrator=mike,
        treasury=mike,
        metadata=sp.scenario_utils.metadata_of_url("ipfs://PLACEHOLDER_CAMPUS_CARDS_CONTRACT_METADATA"),
        token_metadata=all_token_metadata(),
        terms=all_terms(),
        paused=True,
    )
    scenario += contract
    scenario.verify(contract.data.next_token_id == card_count())
    scenario.verify(contract.data.paused)
