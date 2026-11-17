"""
Enjoy. Money — Hoydich Enterprises FA2 (TZIP-12) with TZIP-16 metadata.

Phase 1 of the Enjoy. Money plan (/nouns-money/enjoy/). Closed loop: this
contract has no sale, swap, burn-for-value or redemption path, and accepts no
tez anywhere.

Tokens (all decimals 0), registered at origination:

    0  Enjoy. Note — Series 1           ENJOY  paper-backed, fixed print run, sealable
    1  Nouns Reserve — Series 1         NOUNR  paper-backed, fixed print run, sealable
    2  KansasDAO Blue Note — Series 1   BLUE   paper-backed, fixed print run, sealable
    3  Bot Note (Enjoy. credits)        BOT    agent unit, admin-mintable, never sealable

Entry points:

    transfer / balance_of / update_operators   FA2 standard (owner or operator)
    mint(list of {to_, token_id, amount})      admin only, Treasury only, blocked once sealed
    seal(token_id)                             admin only, permanent, emits "seal"
    set_admin(address) / accept_admin()        two-step admin handoff
    set_treasury(address)                      admin only
    set_metadata(big_map)                      admin only, TZIP-16 contract metadata
    set_token_metadata(token_id, token_info)   admin only, e.g. final IPFS art URIs

Compile and test with SmartPy 0.24.1:  python contracts/enjoy-money/enjoy_money_fa2.py
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2
main = fa2.main


@sp.module
def enjoy_money_module():
    import main

    class EnjoyMoneyFA2(main.Fungible, main.ChangeMetadata, main.OffchainviewTokenMetadata, main.OnchainviewBalanceOf):
        def __init__(self, administrator, treasury, metadata, token_metadata, uncapped):
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.ChangeMetadata.__init__(self)
            main.Fungible.__init__(self, metadata, {}, token_metadata)
            self.data.administrator = sp.cast(administrator, sp.address)
            self.data.pending_administrator = sp.cast(None, sp.option[sp.address])
            self.data.treasury = sp.cast(treasury, sp.address)
            # token_id -> supply at the moment of sealing. Presence means minting is closed for good.
            self.data.sealed = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.nat])
            self.data.uncapped = sp.cast(uncapped, sp.set[sp.nat])

        @sp.private(with_storage="read-only")
        def is_administrator_(self):
            return sp.sender == self.data.administrator

        @sp.entrypoint
        def mint(self, batch):
            sp.cast(batch, sp.list[sp.record(to_=sp.address, token_id=sp.nat, amount=sp.nat).layout(("to_", ("token_id", "amount")))])
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            assert sp.amount == sp.tez(0), "NO_TEZ"
            for action in batch:
                assert action.token_id in self.data.token_metadata, "FA2_TOKEN_UNDEFINED"
                assert not (action.token_id in self.data.sealed), "TOKEN_SEALED"
                assert action.to_ == self.data.treasury, "MINT_ONLY_TO_TREASURY"
                assert action.amount > 0, "ZERO_AMOUNT"
                self.data.supply[action.token_id] += action.amount
                key = (action.to_, action.token_id)
                self.data.ledger[key] = self.data.ledger.get(key, default=0) + action.amount

        @sp.entrypoint
        def seal(self, token_id):
            sp.cast(token_id, sp.nat)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            assert sp.amount == sp.tez(0), "NO_TEZ"
            assert token_id in self.data.token_metadata, "FA2_TOKEN_UNDEFINED"
            assert not self.data.uncapped.contains(token_id), "TOKEN_NOT_SEALABLE"
            assert not (token_id in self.data.sealed), "ALREADY_SEALED"
            supply = self.data.supply[token_id]
            self.data.sealed[token_id] = supply
            sp.emit(sp.record(token_id=token_id, supply=supply), tag="seal", with_type=True)

        @sp.entrypoint
        def set_admin(self, administrator):
            sp.cast(administrator, sp.address)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.pending_administrator = sp.Some(administrator)

        @sp.entrypoint
        def accept_admin(self):
            pending = self.data.pending_administrator.unwrap_some(error="NO_PENDING_ADMIN")
            assert sp.sender == pending, "NOT_PENDING_ADMIN"
            self.data.administrator = pending
            self.data.pending_administrator = None

        @sp.entrypoint
        def set_treasury(self, treasury):
            sp.cast(treasury, sp.address)
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.treasury = treasury

        @sp.entrypoint
        def set_token_metadata(self, token_id, token_info):
            sp.cast(token_id, sp.nat)
            sp.cast(token_info, sp.map[sp.string, sp.bytes])
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            assert token_id in self.data.token_metadata, "FA2_TOKEN_UNDEFINED"
            self.data.token_metadata[token_id] = sp.record(token_id=token_id, token_info=token_info)

        @sp.onchain_view()
        def is_sealed(self, token_id):
            sp.cast(token_id, sp.nat)
            return token_id in self.data.sealed


TOKENS = [
    ("Enjoy. Note — Series 1", "ENJOY"),
    ("Nouns Reserve — Series 1", "NOUNR"),
    ("KansasDAO Blue Note — Series 1", "BLUE"),
    ("Bot Note (Enjoy. credits)", "BOT"),
]
BOT_NOTE = 3
# Placeholders only. scripts/enjoy-money-originate.mjs replaces them from
# contracts/enjoy-money/config.json and refuses to originate while they remain.
PLACEHOLDER_ADDRESS = "tz1burnburnburnburnburnburnburjAYjjX"
METADATA_BASE = "https://pointcast.xyz/nouns-money/enjoy/metadata"


def make_token_metadata(base=METADATA_BASE):
    return [
        sp.map(l={
            "": sp.scenario_utils.bytes_of_string("%s/%d.json" % (base, token_id)),
            "name": sp.scenario_utils.bytes_of_string(name),
            "symbol": sp.scenario_utils.bytes_of_string(symbol),
            "decimals": sp.scenario_utils.bytes_of_string("0"),
        })
        for token_id, (name, symbol) in enumerate(TOKENS)
    ]


def make_contract(administrator, treasury):
    return enjoy_money_module.EnjoyMoneyFA2(
        administrator=administrator,
        treasury=treasury,
        metadata=sp.scenario_utils.metadata_of_url("%s/contract.json" % METADATA_BASE),
        token_metadata=make_token_metadata(),
        uncapped=sp.set([BOT_NOTE]),
    )


def tx(from_, to_, token_id, amount):
    return sp.record(from_=from_, txs=[sp.record(to_=to_, token_id=token_id, amount=amount)])


@sp.add_test()
def test_enjoy_money():
    sc = sp.test_scenario("enjoy_money", enjoy_money_module)
    admin = sp.test_account("admin")
    treasury = sp.test_account("treasury")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")
    agent = sp.test_account("frog")
    new_admin = sp.test_account("new_admin")
    c = make_contract(admin.address, treasury.address)
    sc += c
    sc.verify(c.data.next_token_id == 4)

    sc.h2("Mint the print runs to Treasury, then seal the notes")
    c.mint([sp.record(to_=treasury.address, token_id=0, amount=100),
            sp.record(to_=treasury.address, token_id=1, amount=50),
            sp.record(to_=treasury.address, token_id=2, amount=50)], _sender=admin)
    sc.verify(c.data.supply[0] == 100)
    sc.verify(c.data.ledger[(treasury.address, 0)] == 100)
    c.seal(0, _sender=admin)
    sc.verify(c.is_sealed(0))
    sc.verify(c.data.sealed[0] == 100)
    c.seal(0, _sender=admin, _valid=False, _exception="ALREADY_SEALED")

    sc.h2("Minting into a sealed ID fails")
    c.mint([sp.record(to_=treasury.address, token_id=0, amount=1)], _sender=admin, _valid=False, _exception="TOKEN_SEALED")
    c.seal(1, _sender=admin)
    c.seal(2, _sender=admin)
    c.mint([sp.record(to_=treasury.address, token_id=2, amount=1)], _sender=admin, _valid=False, _exception="TOKEN_SEALED")

    sc.h2("The Bot Note stays mintable and can never be sealed")
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=3000)], _sender=admin)
    c.seal(3, _sender=admin, _valid=False, _exception="TOKEN_NOT_SEALABLE")
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=1000)], _sender=admin)
    sc.verify(c.data.supply[3] == 4000)
    sc.verify(~c.is_sealed(3))

    sc.h2("Mint is rejected for non-admins, outside Treasury, and for unknown or zero amounts")
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=1)], _sender=alice, _valid=False, _exception="FA2_NOT_ADMIN")
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=1)], _sender=treasury, _valid=False, _exception="FA2_NOT_ADMIN")
    c.mint([sp.record(to_=agent.address, token_id=3, amount=1)], _sender=admin, _valid=False, _exception="MINT_ONLY_TO_TREASURY")
    c.mint([sp.record(to_=treasury.address, token_id=4, amount=1)], _sender=admin, _valid=False, _exception="FA2_TOKEN_UNDEFINED")
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=0)], _sender=admin, _valid=False, _exception="ZERO_AMOUNT")
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=1)], _sender=admin, _amount=sp.tez(1), _valid=False, _exception="NO_TEZ")
    c.seal(1, _sender=alice, _valid=False, _exception="FA2_NOT_ADMIN")

    sc.h2("Transfers: a claim, an agent seed, and insufficient balance")
    c.transfer([tx(treasury.address, alice.address, 0, 1)], _sender=treasury)
    sc.verify(c.data.ledger[(alice.address, 0)] == 1)
    sc.verify(c.data.ledger[(treasury.address, 0)] == 99)
    c.transfer([tx(treasury.address, agent.address, 3, 1000)], _sender=treasury)
    c.transfer([tx(agent.address, bob.address, 3, 25)], _sender=agent)
    sc.verify(c.data.ledger[(bob.address, 3)] == 25)
    c.transfer([tx(alice.address, bob.address, 0, 2)], _sender=alice, _valid=False, _exception="FA2_INSUFFICIENT_BALANCE")
    c.transfer([tx(treasury.address, alice.address, 7, 1)], _sender=treasury, _valid=False, _exception="FA2_TOKEN_UNDEFINED")
    # Sealing closes minting, never transfers.
    c.transfer([tx(alice.address, bob.address, 0, 1)], _sender=alice)
    sc.verify(c.data.supply[0] == 100)

    sc.h2("Operator rules")
    c.transfer([tx(treasury.address, bob.address, 1, 1)], _sender=alice, _valid=False, _exception="FA2_NOT_OPERATOR")
    c.update_operators([sp.variant.add_operator(sp.record(owner=treasury.address, operator=alice.address, token_id=1))], _sender=alice, _valid=False, _exception="FA2_NOT_OWNER")
    c.update_operators([sp.variant.add_operator(sp.record(owner=treasury.address, operator=alice.address, token_id=1))], _sender=treasury)
    c.transfer([tx(treasury.address, bob.address, 1, 1)], _sender=alice)
    sc.verify(c.data.ledger[(bob.address, 1)] == 1)
    # The operator grant is per token: no reach into token 0.
    c.transfer([tx(treasury.address, bob.address, 0, 1)], _sender=alice, _valid=False, _exception="FA2_NOT_OPERATOR")
    c.update_operators([sp.variant.remove_operator(sp.record(owner=treasury.address, operator=alice.address, token_id=1))], _sender=treasury)
    c.transfer([tx(treasury.address, bob.address, 1, 1)], _sender=alice, _valid=False, _exception="FA2_NOT_OPERATOR")

    sc.h2("Two-step admin handoff")
    c.accept_admin(_sender=new_admin, _valid=False, _exception="NO_PENDING_ADMIN")
    c.set_admin(new_admin.address, _sender=alice, _valid=False, _exception="FA2_NOT_ADMIN")
    c.set_admin(new_admin.address, _sender=admin)
    sc.verify(c.data.administrator == admin.address)
    c.accept_admin(_sender=alice, _valid=False, _exception="NOT_PENDING_ADMIN")
    c.accept_admin(_sender=new_admin)
    sc.verify(c.data.administrator == new_admin.address)
    sc.verify(c.data.pending_administrator.is_none())
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=1)], _sender=admin, _valid=False, _exception="FA2_NOT_ADMIN")
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=1)], _sender=new_admin)

    sc.h2("Admin housekeeping: treasury rotation and metadata")
    c.set_treasury(alice.address, _sender=admin, _valid=False, _exception="FA2_NOT_ADMIN")
    c.set_treasury(bob.address, _sender=new_admin)
    c.mint([sp.record(to_=treasury.address, token_id=3, amount=1)], _sender=new_admin, _valid=False, _exception="MINT_ONLY_TO_TREASURY")
    c.mint([sp.record(to_=bob.address, token_id=3, amount=1)], _sender=new_admin)
    art = sp.map(l={"": sp.scenario_utils.bytes_of_string("ipfs://bafyfinalart/0.json")})
    c.set_token_metadata(token_id=0, token_info=art, _sender=alice, _valid=False, _exception="FA2_NOT_ADMIN")
    c.set_token_metadata(token_id=0, token_info=art, _sender=new_admin)
    c.set_token_metadata(token_id=9, token_info=art, _sender=new_admin, _valid=False, _exception="FA2_TOKEN_UNDEFINED")
    c.set_metadata(sp.scenario_utils.metadata_of_url("ipfs://bafycontract"), _sender=alice, _valid=False, _exception="FA2_NOT_ADMIN")
    c.set_metadata(sp.scenario_utils.metadata_of_url("ipfs://bafycontract"), _sender=new_admin)


@sp.add_test()
def build_enjoy_money():
    # The origination artifact copied to contracts/build/enjoy_money. Addresses are
    # placeholders; the originate script swaps in the configured admin and Treasury.
    sc = sp.test_scenario("enjoy_money_build", enjoy_money_module)
    c = make_contract(sp.address(PLACEHOLDER_ADDRESS), sp.address(PLACEHOLDER_ADDRESS))
    sc += c
    sc.verify(c.data.next_token_id == 4)
