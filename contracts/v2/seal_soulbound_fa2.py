"""
seal_soulbound_fa2.py - PointCast attested soulbound seals
SmartPy v0.24.1

Admin and explicitly allowlisted issuers may attest one of the seeded seal
kinds to an address. Every seal is an FA2 NFT with the standard interface,
but fa2_lib's NoTransfer policy rejects transfers and operator updates.
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


main = fa2.main


@sp.module
def m():
    import main

    class SealSoulboundFA2(
        main.Admin,
        main.NoTransfer,
        main.Nft,
        main.ChangeMetadata,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """Issuer-attested, revocable, non-transferable PointCast seals."""

        def __init__(self, administrator, metadata, initial_issuers, paused):
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.ChangeMetadata.__init__(self)
            main.Nft.__init__(self, metadata, {}, [])
            main.NoTransfer.__init__(self)
            main.Admin.__init__(self, administrator)

            self.data.paused = sp.cast(paused, sp.bool)
            self.data.issuers = sp.cast(
                sp.big_map(), sp.big_map[sp.address, sp.unit]
            )
            for issuer in initial_issuers:
                self.data.issuers[issuer] = ()

            self.data.kinds = sp.cast(
                sp.big_map(), sp.big_map[sp.bytes, sp.unit]
            )
            # showed-up, kennel-club-holder, resident, founding-100
            self.data.kinds[sp.bytes("0x73686f7765642d7570")] = ()
            self.data.kinds[
                sp.bytes("0x6b656e6e656c2d636c75622d686f6c646572")
            ] = ()
            self.data.kinds[sp.bytes("0x7265736964656e74")] = ()
            self.data.kinds[sp.bytes("0x666f756e64696e672d313030")] = ()

            self.data.seals = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(
                        holder=sp.address,
                        kind=sp.bytes,
                        evidence=sp.bytes,
                        issuer=sp.address,
                        attested_at=sp.timestamp,
                        revoked=sp.bool,
                    ),
                ],
            )
            self.data.seal_ids_by_holder = sp.cast(
                sp.big_map(), sp.big_map[sp.address, sp.list[sp.nat]]
            )

        @sp.entrypoint
        def attest(self, params):
            """Issue a supported kind to an address with bytes evidence."""
            sp.cast(
                params,
                sp.record(to_=sp.address, kind=sp.bytes, evidence=sp.bytes),
            )
            assert not self.data.paused, "ATTESTATIONS_PAUSED"
            assert sp.amount == sp.mutez(0), "ATTESTATION_IS_FREE"
            assert (
                sp.sender == self.data.administrator
                or sp.sender in self.data.issuers
            ), "NOT_ISSUER"
            assert params.kind in self.data.kinds, "UNKNOWN_SEAL_KIND"
            assert sp.len(params.evidence) <= 2048, "EVIDENCE_TOO_LONG"

            token_id = self.data.next_token_id
            self.data.token_metadata[token_id] = sp.record(
                token_id=token_id,
                token_info={
                    # TzKT and wallets can decode the kind directly.
                    "name": sp.bytes("0x506f696e7443617374207365616c20")
                    + params.kind,
                    "symbol": sp.bytes("0x50435345414c"),
                    "decimals": sp.bytes("0x30"),
                    "description": sp.bytes(
                        "0x417474657374656420506f696e7443617374207365616c2e204e6f6e2d7472616e7366657261626c653b206d6179206265207265766f6b656420627920746865206973737565722e"
                    ),
                },
            )
            self.data.ledger[token_id] = params.to_
            self.data.seals[token_id] = sp.record(
                holder=params.to_,
                kind=params.kind,
                evidence=params.evidence,
                issuer=sp.sender,
                attested_at=sp.now,
                revoked=False,
            )
            prior = self.data.seal_ids_by_holder.get(params.to_, default=[])
            self.data.seal_ids_by_holder[params.to_] = sp.cons(token_id, prior)
            self.data.next_token_id += 1

        @sp.entrypoint
        def revoke(self, token_id):
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.seals, "SEAL_NOT_FOUND"
            seal = self.data.seals[token_id]
            assert (
                sp.sender == self.data.administrator or sp.sender == seal.issuer
            ), "NOT_ISSUER"
            assert not seal.revoked, "SEAL_ALREADY_REVOKED"
            self.data.seals[token_id].revoked = True

        @sp.entrypoint
        def set_issuer(self, issuer, allowed):
            sp.cast(issuer, sp.address)
            sp.cast(allowed, sp.bool)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            if allowed:
                self.data.issuers[issuer] = ()
            else:
                if issuer in self.data.issuers:
                    del self.data.issuers[issuer]

        @sp.entrypoint
        def set_paused(self, paused):
            sp.cast(paused, sp.bool)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.paused = paused

        @sp.onchain_view()
        def seals_of(self, holder):
            sp.cast(holder, sp.address)
            return self.data.seal_ids_by_holder.get(holder, default=[])


@sp.add_test()
def test_seal_soulbound_fa2():
    scenario = sp.test_scenario("seal_soulbound", [fa2.t, fa2.main, m])
    admin = sp.test_account("admin")
    issuer = sp.test_account("issuer")
    stranger = sp.test_account("stranger")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")

    contract = m.SealSoulboundFA2(
        administrator=admin.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/seals/contract.json"
        ),
        initial_issuers=[],
        paused=False,
    )
    scenario += contract

    showed_up = sp.bytes("0x73686f7765642d7570")
    evidence = sp.bytes("0x70617373706f72742d65646974696f6e2d68617368")
    contract.attest(
        to_=alice.address,
        kind=showed_up,
        evidence=evidence,
        _sender=stranger,
        _valid=False,
        _exception="NOT_ISSUER",
    )

    contract.set_issuer(issuer=issuer.address, allowed=True, _sender=admin)
    contract.attest(
        to_=alice.address,
        kind=showed_up,
        evidence=evidence,
        _sender=issuer,
    )
    scenario.verify(contract.data.ledger[0] == alice.address)
    scenario.verify(contract.data.seals[0].issuer == issuer.address)
    scenario.verify(sp.len(contract.seals_of(alice.address)) == 1)

    contract.transfer(
        [
            sp.record(
                from_=alice.address,
                txs=[sp.record(to_=bob.address, token_id=0, amount=1)],
            )
        ],
        _sender=alice,
        _valid=False,
        _exception="FA2_TX_DENIED",
    )

    contract.revoke(0, _sender=stranger, _valid=False, _exception="NOT_ISSUER")
    contract.revoke(0, _sender=issuer)
    scenario.verify(contract.data.seals[0].revoked)

    contract.set_issuer(issuer=issuer.address, allowed=False, _sender=admin)
    contract.attest(
        to_=bob.address,
        kind=showed_up,
        evidence=evidence,
        _sender=issuer,
        _valid=False,
        _exception="NOT_ISSUER",
    )
    contract.attest(
        to_=bob.address,
        kind=sp.bytes("0x756e6b6e6f776e"),
        evidence=evidence,
        _sender=admin,
        _valid=False,
        _exception="UNKNOWN_SEAL_KIND",
    )


@sp.add_test()
def compile_seal_soulbound_fa2():
    scenario = sp.test_scenario("seal_soulbound_compile", [fa2.t, fa2.main, m])
    mike = sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw")
    contract = m.SealSoulboundFA2(
        administrator=mike,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/seals/contract.json"
        ),
        initial_issuers=[],
        paused=True,
    )
    scenario += contract
    scenario.verify(contract.data.paused)
