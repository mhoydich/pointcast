"""Open Press. Each free mint publishes one new fixed-edition FA2 token (SmartPy 0.24.1)."""

import json

import smartpy as sp
from smartpy.templates import fa2_lib as fa2
from smartpy.templates.fa2_lib_testing import helpers

main = fa2.main


@sp.module
def m():
    import main

    class OpenPressFA2(
        main.PauseOwnerOrOperatorTransfer,
        main.Fungible,
        main.ChangeMetadata,
        main.OffchainviewTokenMetadata,
    ):
        def __init__(self, administrator, metadata):
            main.OffchainviewTokenMetadata.__init__(self)
            main.ChangeMetadata.__init__(self)
            main.Fungible.__init__(self, metadata, {}, [])
            main.PauseOwnerOrOperatorTransfer.__init__(self)
            self.data.administrator = sp.cast(administrator, sp.address)
            self.data.creators = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.address])
            self.data.royalties = sp.cast(
                sp.big_map(), sp.big_map[sp.nat, sp.map[sp.address, sp.nat]]
            )

        @sp.private(with_storage="read-only")
        def is_administrator_(self):
            return sp.sender == self.data.administrator

        @sp.entrypoint
        def mint(self, metadata_uri, editions, royalty_bps, recipients):
            sp.cast(metadata_uri, sp.bytes)
            sp.cast(editions, sp.nat)
            sp.cast(royalty_bps, sp.nat)
            sp.cast(recipients, sp.map[sp.address, sp.nat])
            assert not self.data.paused, "FA2_PAUSED"
            assert sp.amount == sp.mutez(0), "MINT_IS_FREE"
            assert sp.len(metadata_uri) > 0, "EMPTY_METADATA_URI"
            assert editions > 0 and editions <= 10000, "INVALID_EDITIONS"
            assert royalty_bps <= 2500, "ROYALTY_CAP"
            total = sp.nat(0)
            for share in recipients.values():
                assert share > 0, "ZERO_SHARE"
                total += share
            assert total == royalty_bps, "ROYALTY_SUM"

            token_id = self.data.next_token_id
            self.data.next_token_id += 1
            self.data.creators[token_id] = sp.sender
            self.data.royalties[token_id] = recipients
            self.data.token_metadata[token_id] = sp.record(
                token_id=token_id,
                token_info={"": metadata_uri, "decimals": sp.bytes("0x30")},
            )
            self.data.supply[token_id] = editions
            self.data.ledger[(sp.sender, token_id)] = editions

        @sp.onchain_view()
        def get_royalties(self, token_id):
            return sp.record(
                decimals=sp.nat(4),
                shares=self.data.royalties.get(token_id, error="FA2_TOKEN_UNDEFINED"),
            )


def open_press(administrator):
    contract = m.OpenPressFA2(administrator, sp.big_map())
    metadata = sp.create_tzip16_metadata(
        name="PointCast Open Press",
        description="Permissionless publishing of fixed editions on Tezos.",
        interfaces=["TZIP-012", "TZIP-016", "TZIP-021"],
        offchain_views=contract.get_offchain_views(),
    )
    metadata["permissions"] = {
        "operator": "owner-or-operator-transfer",
        "receiver": "owner-no-hook",
        "sender": "owner-no-hook",
    }
    to_bytes = sp.scenario_utils.bytes_of_string
    contract.data.metadata = sp.big_map(
        {
            "": to_bytes("tezos-storage:content"),
            "content": to_bytes(json.dumps(metadata, separators=(",", ":"))),
        }
    )
    return contract


@sp.add_test()
def test_open_press():
    scenario = sp.test_scenario("open_press", [fa2.t, fa2.main, m])
    admin = sp.test_account("admin")
    author = sp.test_account("stranger")
    reader = sp.test_account("reader")
    contract = open_press(admin.address)
    scenario += contract

    uri = sp.scenario_utils.bytes_of_string("ipfs://example/metadata.json")
    shares = {author.address: 2000, reader.address: 500}
    contract.mint(
        metadata_uri=uri, editions=10000, royalty_bps=2500, recipients=shares, _sender=author
    )
    scenario.verify(contract.data.creators[0] == author.address)
    scenario.verify(contract.data.supply[0] == 10000)
    scenario.verify(contract.data.ledger[(author.address, 0)] == 10000)
    scenario.verify(contract.data.token_metadata[0].token_info[""] == uri)
    scenario.verify(contract.get_royalties(0).shares[reader.address] == 500)

    for editions, bps, recipients, error in [
        (0, 0, {}, "INVALID_EDITIONS"),
        (10001, 0, {}, "INVALID_EDITIONS"),
        (1, 2501, {author.address: 2501}, "ROYALTY_CAP"),
        (1, 100, {author.address: 101}, "ROYALTY_SUM"),
        (1, 0, {author.address: 0}, "ZERO_SHARE"),
    ]:
        contract.mint(
            metadata_uri=uri,
            editions=editions,
            royalty_bps=bps,
            recipients=recipients,
            _sender=reader,
            _valid=False,
            _exception=error,
        )

    transfer = [
        sp.record(
            from_=author.address,
            txs=[
                sp.record(to_=reader.address, token_id=0, amount=1),
            ],
        )
    ]
    permission = sp.record(owner=author.address, operator=reader.address, token_id=0)
    contract.transfer(transfer, _sender=admin, _valid=False, _exception="FA2_NOT_OPERATOR")
    contract.update_operators(
        [sp.variant.add_operator(permission)],
        _sender=admin,
        _valid=False,
        _exception="FA2_NOT_OWNER",
    )
    contract.transfer(transfer, _sender=author)
    contract.update_operators([sp.variant.add_operator(permission)], _sender=author)
    contract.transfer(transfer, _sender=reader)
    contract.update_operators([sp.variant.remove_operator(permission)], _sender=author)
    contract.transfer(transfer, _sender=reader, _valid=False, _exception="FA2_NOT_OPERATOR")

    contract.set_pause(True, _sender=reader, _valid=False, _exception="FA2_NOT_ADMIN")
    contract.set_metadata(sp.big_map(), _sender=reader, _valid=False, _exception="FA2_NOT_ADMIN")
    contract.set_pause(True, _sender=admin)
    contract.mint(
        metadata_uri=uri,
        editions=1,
        royalty_bps=0,
        recipients={},
        _sender=reader,
        _valid=False,
        _exception="FA2_PAUSED",
    )
    contract.transfer(
        transfer, _sender=author, _valid=False, _exception=("FA2_TX_DENIED", "FA2_PAUSED")
    )
    contract.update_operators(
        [sp.variant.add_operator(permission)],
        _sender=author,
        _valid=False,
        _exception=("FA2_OPERATORS_UNSUPPORTED", "FA2_PAUSED"),
    )
    receiver = helpers.TestReceiverBalanceOf()
    scenario += receiver
    contract.balance_of(
        requests=[sp.record(owner=reader.address, token_id=0)],
        callback=sp.contract(
            sp.list[helpers.t_balance_of_response], receiver.address, entrypoint="receive_balances"
        ).unwrap_some(),
    )
    scenario.verify_equal(
        receiver.data.last_received_balances,
        [sp.record(request=sp.record(owner=reader.address, token_id=0), balance=2)],
    )
    scenario.verify(contract.data.ledger[(author.address, 0)] == 9998)
    updated = sp.scenario_utils.metadata_of_url("ipfs://updated")
    contract.set_metadata(updated, _sender=admin)
    scenario.verify(
        contract.data.metadata[""] == sp.scenario_utils.bytes_of_string("ipfs://updated")
    )
    scenario.verify(contract.data.creators[0] == author.address)
    contract.set_pause(False, _sender=admin)
    contract.mint(metadata_uri=uri, editions=1, royalty_bps=0, recipients={}, _sender=reader)
    scenario.verify(contract.data.creators[1] == reader.address)
    scenario.verify(contract.data.supply[1] == 1)
    scenario.verify(contract.data.supply[0] == 10000)


@sp.add_test()
def compile_open_press():
    scenario = sp.test_scenario("open_press_compile", [fa2.t, fa2.main, m])
    scenario += open_press(sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw"))
