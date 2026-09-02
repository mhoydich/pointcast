"""
profile_object_fa2.py - PointCast owned profile objects
SmartPy v0.24.1

Each lowercase PointCast handle can be claimed once. The resulting token is a
single-edition FA2 NFT: its current owner may edit the on-chain page and may
transfer the token, so edit authority follows ownership. User text is stored
as UTF-8 bytes to avoid Michelson's printable-ASCII restriction.

This file follows the PointCast SmartPy house style: schemas are inlined and
contract logic is kept in entrypoints rather than undecorated helpers.
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


main = fa2.main


@sp.module
def m():
    import main

    class ProfileObjectFA2(
        main.Admin,
        main.OwnerOrOperatorTransfer,
        main.Nft,
        main.ChangeMetadata,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """One transferable NFT per immutable PointCast handle."""

        def __init__(self, administrator, metadata, paused):
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.ChangeMetadata.__init__(self)
            main.Nft.__init__(self, metadata, {}, [])
            main.OwnerOrOperatorTransfer.__init__(self)
            main.Admin.__init__(self, administrator)

            self.data.paused = sp.cast(paused, sp.bool)
            self.data.handles = sp.cast(
                sp.big_map(), sp.big_map[sp.nat, sp.bytes]
            )
            self.data.tokens_by_handle = sp.cast(
                sp.big_map(), sp.big_map[sp.bytes, sp.nat]
            )
            self.data.pages = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(
                        name=sp.bytes,
                        bio=sp.bytes,
                        links=sp.list[sp.bytes],
                        noun_seed=sp.nat,
                    ),
                ],
            )

        @sp.entrypoint
        def claim(self, handle):
            """Claim an unused 3-24 character lowercase ASCII handle."""
            sp.cast(handle, sp.bytes)
            assert not self.data.paused, "CLAIMS_PAUSED"
            assert sp.amount == sp.mutez(0), "CLAIM_IS_FREE"
            assert sp.len(handle) >= 3, "HANDLE_TOO_SHORT"
            assert sp.len(handle) <= 24, "HANDLE_TOO_LONG"
            assert not (handle in self.data.tokens_by_handle), "HANDLE_TAKEN"

            noun_seed = sp.nat(0)
            for index in range(sp.len(handle)):
                character = sp.slice(index, 1, handle).unwrap_some(
                    error="INVALID_HANDLE"
                )
                value = sp.to_nat(character)
                assert (
                    value == 45
                    or (value >= 48 and value <= 57)
                    or (value >= 97 and value <= 122)
                ), "INVALID_HANDLE"
                noun_seed = sp.mod((noun_seed * 31) + value, 1200)

            token_id = self.data.next_token_id
            metadata_uri = (
                # "https://pointcast.xyz/p/"
                sp.bytes(
                    "0x68747470733a2f2f706f696e74636173742e78797a2f702f"
                )
                + handle
                # ".json"
                + sp.bytes("0x2e6a736f6e")
            )
            self.data.token_metadata[token_id] = sp.record(
                token_id=token_id,
                token_info={
                    "": metadata_uri,
                    # "PointCast profile @"
                    "name": sp.bytes(
                        "0x506f696e74436173742070726f66696c652040"
                    )
                    + handle,
                    # "PCPROFILE"
                    "symbol": sp.bytes("0x504350524f46494c45"),
                    # "0"
                    "decimals": sp.bytes("0x30"),
                    # "Owned PointCast profile object. Edit authority follows ownership."
                    "description": sp.bytes(
                        "0x4f776e656420506f696e74436173742070726f66696c65206f626a6563742e204564697420617574686f7269747920666f6c6c6f7773206f776e6572736869702e"
                    ),
                },
            )
            self.data.ledger[token_id] = sp.sender
            self.data.handles[token_id] = handle
            self.data.tokens_by_handle[handle] = token_id
            self.data.pages[token_id] = sp.record(
                name=handle,
                bio=sp.bytes("0x"),
                links=[],
                noun_seed=noun_seed,
            )
            self.data.next_token_id += 1

        @sp.entrypoint
        def set_page(self, params):
            """Replace a page; only the token's current owner may edit it."""
            sp.cast(
                params,
                sp.record(
                    token_id=sp.nat,
                    page=sp.record(
                        name=sp.bytes,
                        bio=sp.bytes,
                        links=sp.list[sp.bytes],
                        noun_seed=sp.nat,
                    ),
                ),
            )
            assert params.token_id in self.data.ledger, "TOKEN_NOT_FOUND"
            assert self.data.ledger[params.token_id] == sp.sender, "NOT_OWNER"
            assert sp.len(params.page.name) <= 64, "NAME_TOO_LONG"
            assert sp.len(params.page.bio) <= 512, "BIO_TOO_LONG"
            assert sp.len(params.page.links) <= 12, "TOO_MANY_LINKS"
            assert params.page.noun_seed < 1200, "INVALID_NOUN_SEED"
            for link in params.page.links:
                assert sp.len(link) <= 256, "LINK_TOO_LONG"
            self.data.pages[params.token_id] = params.page

        @sp.entrypoint
        def set_paused(self, paused):
            sp.cast(paused, sp.bool)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.paused = paused

        @sp.onchain_view()
        def handle_of(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.handles, "TOKEN_NOT_FOUND"
            return self.data.handles[token_id]

        @sp.onchain_view()
        def token_of(self, handle):
            sp.cast(handle, sp.bytes)
            assert handle in self.data.tokens_by_handle, "HANDLE_NOT_FOUND"
            return self.data.tokens_by_handle[handle]

        @sp.onchain_view()
        def page(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.pages, "TOKEN_NOT_FOUND"
            return self.data.pages[token_id]


@sp.add_test()
def test_profile_object_fa2():
    scenario = sp.test_scenario("profile_object", [fa2.t, fa2.main, m])
    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")

    contract = m.ProfileObjectFA2(
        administrator=admin.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/p/contract.json"
        ),
        paused=False,
    )
    scenario += contract

    mike = sp.bytes("0x6d696b65")
    contract.claim(mike, _sender=alice)
    scenario.verify(contract.token_of(mike) == 0)
    scenario.verify(contract.handle_of(0) == mike)
    scenario.verify(contract.data.ledger[0] == alice.address)
    scenario.verify(contract.page(0).name == mike)

    contract.claim(
        mike,
        _sender=bob,
        _valid=False,
        _exception="HANDLE_TAKEN",
    )
    contract.claim(
        sp.bytes("0x4d696b65"),
        _sender=bob,
        _valid=False,
        _exception="INVALID_HANDLE",
    )

    alice_page = sp.record(
        name=sp.bytes("0x4d696b6520486f7964696368"),
        bio=sp.bytes("0x506f696e7443617374206e65696768626f722e"),
        links=[sp.bytes("0x68747470733a2f2f706f696e74636173742e78797a")],
        noun_seed=sp.nat(205),
    )
    contract.set_page(token_id=0, page=alice_page, _sender=alice)
    scenario.verify(contract.page(0).noun_seed == 205)
    contract.set_page(
        token_id=0,
        page=alice_page,
        _sender=bob,
        _valid=False,
        _exception="NOT_OWNER",
    )

    contract.transfer(
        [
            sp.record(
                from_=alice.address,
                txs=[sp.record(to_=bob.address, token_id=0, amount=1)],
            )
        ],
        _sender=alice,
    )
    scenario.verify(contract.data.ledger[0] == bob.address)
    contract.set_page(
        token_id=0,
        page=alice_page,
        _sender=alice,
        _valid=False,
        _exception="NOT_OWNER",
    )
    bob_page = sp.record(
        name=sp.bytes("0x426f6227732070616765"),
        bio=sp.bytes("0x4e6577206f776e65722e"),
        links=[],
        noun_seed=sp.nat(284),
    )
    contract.set_page(token_id=0, page=bob_page, _sender=bob)
    scenario.verify(contract.page(0).noun_seed == 284)

    contract.set_paused(True, _sender=admin)
    contract.claim(
        sp.bytes("0x6e6f67676c6573"),
        _sender=bob,
        _valid=False,
        _exception="CLAIMS_PAUSED",
    )


@sp.add_test()
def compile_profile_object_fa2():
    scenario = sp.test_scenario("profile_object_compile", [fa2.t, fa2.main, m])
    mike = sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw")
    contract = m.ProfileObjectFA2(
        administrator=mike,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/p/contract.json"
        ),
        paused=True,
    )
    scenario += contract
    scenario.verify(contract.data.paused)
