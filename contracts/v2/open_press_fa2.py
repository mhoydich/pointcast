"""Open Press. Each free mint publishes one new fixed-edition FA2 token (SmartPy 0.24.1)."""

import json

import smartpy as sp
from smartpy.templates import fa2_lib as fa2
from smartpy.templates.fa2_lib_testing import helpers

main = fa2.main


@sp.module
def m():
    import main
    import smartpy.stdlib.string_utils as string_utils

    class OpenPressFA2(
        main.Fungible,
        main.ChangeMetadata,
        main.OffchainviewTokenMetadata,
    ):
        def __init__(self, administrator, metadata):
            main.OffchainviewTokenMetadata.__init__(self)
            main.ChangeMetadata.__init__(self)
            # Fungible initializes the standard OwnerOrOperatorTransfer policy.
            main.Fungible.__init__(self, metadata, {}, [])
            self.data.paused = False
            self.data.administrator = sp.cast(administrator, sp.address)
            self.data.creators = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.address])
            self.data.royalties = sp.cast(
                sp.big_map(), sp.big_map[sp.nat, sp.map[sp.address, sp.nat]]
            )

        @sp.private(with_storage="read-only")
        def is_administrator_(self):
            return sp.sender == self.data.administrator

        @sp.entrypoint
        def set_pause(self, paused):
            assert self.is_administrator_(), "FA2_NOT_ADMIN"
            self.data.paused = paused

        @sp.entrypoint
        def mint(self, metadata_uri, editions, royalty_bps, royalty_shares):
            sp.cast(metadata_uri, sp.bytes)
            sp.cast(editions, sp.nat)
            sp.cast(royalty_bps, sp.nat)
            sp.cast(royalty_shares, sp.map[sp.string, sp.nat])
            assert not self.data.paused, "FA2_PAUSED"
            assert sp.amount == sp.mutez(0), "MINT_IS_FREE"
            assert sp.len(metadata_uri) > 0, "EMPTY_METADATA_URI"
            assert sp.len(metadata_uri) <= 256, "METADATA_URI_TOO_LONG"
            assert editions > 0 and editions <= 10000, "INVALID_EDITIONS"
            assert royalty_bps <= 2500, "ROYALTY_CAP"
            assert sp.len(royalty_shares) <= 10, "TOO_MANY_RECIPIENTS"
            total = sp.nat(0)
            checked_shares = sp.cast({}, sp.map[sp.address, sp.nat])
            royalties_json = '{"decimals":4,"shares":{'
            for payee in royalty_shares.items():
                assert payee.value > 0, "ZERO_SHARE"
                assert total + payee.value <= royalty_bps, "ROYALTY_SUM"
                # Keep Base58 text for JSON and let Michelson validate its checksum.
                # A bare wallet or KT1 address is 36 characters (no entrypoint suffix).
                assert sp.len(payee.key) == 36, "INVALID_ROYALTY_ADDRESS"
                address = sp.unpack(sp.pack(payee.key), sp.address).unwrap_some(
                    error="INVALID_ROYALTY_ADDRESS"
                )
                checked_shares[address] = payee.value
                if total > 0:
                    royalties_json += ","
                royalties_json += (
                    '"' + payee.key + '":' + string_utils.from_int(sp.to_int(payee.value))
                )
                total += payee.value
            assert total == royalty_bps, "ROYALTY_SUM"
            royalties_json += "}}"
            # token_info values are raw UTF-8. Skip PACK's tag, string tag and four-byte length.
            royalties_bytes = sp.slice(
                6, sp.len(royalties_json), sp.pack(royalties_json)
            ).unwrap_some()

            token_id = self.data.next_token_id
            self.data.next_token_id += 1
            self.data.creators[token_id] = sp.sender
            self.data.royalties[token_id] = checked_shares
            self.data.token_metadata[token_id] = sp.record(
                token_id=token_id,
                token_info={
                    "": metadata_uri,
                    "decimals": sp.bytes("0x30"),
                    "royalties": royalties_bytes,
                },
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
    wallet = "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw"
    splitter = "KT1S3BkgEQsW62vqkuatueUhzcTqkTfb4EXs"
    shares = {wallet: 2000, splitter: 500}
    contract.mint(
        metadata_uri=uri, editions=10000, royalty_bps=2500, royalty_shares=shares, _sender=author
    )
    scenario.verify(contract.data.creators[0] == author.address)
    scenario.verify(contract.data.supply[0] == 10000)
    scenario.verify(contract.data.ledger[(author.address, 0)] == 10000)
    scenario.verify(contract.data.token_metadata[0].token_info[""] == uri)
    scenario.verify(contract.get_royalties(0).shares[sp.address(splitter)] == 500)
    expected = json.dumps({"decimals": 4, "shares": shares}, sort_keys=True, separators=(",", ":"))
    scenario.verify(
        contract.data.token_metadata[0].token_info["royalties"]
        == sp.scenario_utils.bytes_of_string(expected)
    )

    # Base58 addresses from eleven deterministic SmartPy test accounts.
    payees = [
        "tz1YU7qdTSyQ554GLcKNiEPYokdEC8K4gPoz",
        "tz1gf45AFb3bwaJZdHU2SszociSCYXw9fNmz",
        "tz1UGRwhWTdqknbbgjjtd8qw6U88DJ4q6r9z",
        "tz1V8us4hAyk4u4z1iX23s4L5n7Yq77bhtRu",
        "tz1eD3oRPoBJCvAFQgbdDdJsaxi4nrjXLQDV",
        "tz1bMT9jfnDaDTRcoxUjHZ26gzL8dbcnBLaA",
        "tz1QBpR3SbWJb6VgEzsTKiPFDdCyuUwBMdRH",
        "tz1caLQEiibrqzp2uePugNLJyuy9RbYZQWKK",
        "tz1bQnLB55Fp3NkRmbPyhEQB3ZxbR2dmkZrN",
        "tz1gwHqJBA6n7kWfaQ8EzCnGK1gkm6W9Tdbk",
        "tz1LPKubaGMTasRxTAHX4zYkoKNKdCfifLYS",
    ]
    for editions, bps, royalty_shares, error in [
        (0, 0, {}, "INVALID_EDITIONS"),
        (10001, 0, {}, "INVALID_EDITIONS"),
        (1, 2501, {wallet: 2501}, "ROYALTY_CAP"),
        (1, 100, {wallet: 101}, "ROYALTY_SUM"),
        (1, 100, {wallet: 99}, "ROYALTY_SUM"),
        (1, 0, {wallet: 0}, "ZERO_SHARE"),
        (1, 1, {wallet + "%default": 1}, "INVALID_ROYALTY_ADDRESS"),
        (1, 11, dict.fromkeys(payees, 1), "TOO_MANY_RECIPIENTS"),
    ]:
        contract.mint(
            metadata_uri=uri,
            editions=editions,
            royalty_bps=bps,
            royalty_shares=royalty_shares,
            _sender=reader,
            _valid=False,
            _exception=error,
        )

    for bad_uri, amount, error in [
        (uri, sp.mutez(1), "MINT_IS_FREE"),
        (sp.bytes("0x"), sp.mutez(0), "EMPTY_METADATA_URI"),
        (sp.bytes("0x" + "61" * 257), sp.mutez(0), "METADATA_URI_TOO_LONG"),
    ]:
        contract.mint(
            metadata_uri=bad_uri,
            editions=1,
            royalty_bps=0,
            royalty_shares={},
            _sender=reader,
            _amount=amount,
            _valid=False,
            _exception=error,
        )
    scenario.verify(contract.data.next_token_id == 1)

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
        royalty_shares={},
        _sender=reader,
        _valid=False,
        _exception="FA2_PAUSED",
    )
    contract.transfer(transfer, _sender=author)
    contract.update_operators([sp.variant.add_operator(permission)], _sender=author)
    contract.transfer(transfer, _sender=reader)
    contract.update_operators([sp.variant.remove_operator(permission)], _sender=author)
    contract.transfer(transfer, _sender=reader, _valid=False, _exception="FA2_NOT_OPERATOR")
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
        [sp.record(request=sp.record(owner=reader.address, token_id=0), balance=4)],
    )
    scenario.verify(contract.data.ledger[(author.address, 0)] == 9996)
    updated = sp.scenario_utils.metadata_of_url("ipfs://updated")
    contract.set_metadata(updated, _sender=admin)
    scenario.verify(
        contract.data.metadata[""] == sp.scenario_utils.bytes_of_string("ipfs://updated")
    )
    scenario.verify(contract.data.creators[0] == author.address)
    contract.set_pause(False, _sender=admin)
    max_uri = sp.bytes("0x" + "61" * 256)
    contract.mint(
        metadata_uri=max_uri, editions=1, royalty_bps=0, royalty_shares={}, _sender=reader
    )
    scenario.verify(
        contract.data.token_metadata[1].token_info["royalties"]
        == sp.scenario_utils.bytes_of_string('{"decimals":4,"shares":{}}')
    )
    scenario.verify(contract.data.creators[1] == reader.address)
    scenario.verify(contract.data.supply[1] == 1)
    scenario.verify(contract.data.supply[0] == 10000)

    # A self transfer and a zero transfer preserve balances.
    def tx(to, amount, token=0):
        return sp.record(to_=to, token_id=token, amount=amount)

    def batch(*txs):
        return [sp.record(from_=reader.address, txs=list(txs))]

    contract.transfer(batch(tx(reader.address, 4), tx(admin.address, 0)), _sender=reader)
    scenario.verify(contract.data.ledger[(reader.address, 0)] == 4)
    scenario.verify(~contract.data.ledger.contains((admin.address, 0)))

    # The whole batch rolls back when its second transfer cannot complete.
    for rejected, error in [
        (tx(admin.address, 4), "FA2_INSUFFICIENT_BALANCE"),
        (tx(admin.address, 0, token=2), "FA2_TOKEN_UNDEFINED"),
    ]:
        contract.transfer(
            batch(tx(author.address, 1), rejected), _sender=reader, _valid=False, _exception=error
        )
        scenario.verify(contract.data.ledger[(reader.address, 0)] == 4)
        scenario.verify(contract.data.ledger[(author.address, 0)] == 9996)

    contract.transfer(batch(tx(author.address, 2), tx(admin.address, 1, token=1)), _sender=reader)
    scenario.verify(contract.data.ledger[(reader.address, 0)] == 2)
    scenario.verify(contract.data.ledger[(author.address, 0)] == 9998)
    scenario.verify(contract.data.ledger[(reader.address, 1)] == 0)
    scenario.verify(contract.data.ledger[(admin.address, 1)] == 1)

    contract.mint(
        metadata_uri=max_uri,
        editions=1,
        royalty_bps=2500,
        royalty_shares=dict.fromkeys(payees[:10], 250),
        _sender=reader,
    )
    scenario.verify(sp.len(contract.get_royalties(2).shares) == 10)


@sp.add_test()
def compile_open_press():
    scenario = sp.test_scenario("open_press_compile", [fa2.t, fa2.main, m])
    scenario += open_press(sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw"))
