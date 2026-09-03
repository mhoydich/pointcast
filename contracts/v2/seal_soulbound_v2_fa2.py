"""
seal_soulbound_v2_fa2.py - extensible PointCast soulbound seals
SmartPy v0.24.1

V2 preserves the issuer-attested, revocable, non-transferable FA2 behavior of
the live seal contract. Administrators can add or retire seal kinds, and issuer
workers can create several attestations through one entrypoint call.
"""

import smartpy as sp
from smartpy.templates import fa2_lib as fa2


main = fa2.main


@sp.module
def m():
    import main

    class SealSoulboundV2FA2(
        main.Admin,
        main.NoTransfer,
        main.Nft,
        main.ChangeMetadata,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """Extensible, issuer-attested PointCast seals."""

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
                sp.big_map(),
                sp.big_map[sp.bytes, sp.map[sp.string, sp.bytes]],
            )
            description = sp.bytes(
                "0x417474657374656420506f696e7443617374207365616c2e204e6f6e2d7472616e7366657261626c653b206d6179206265207265766f6b656420627920697473206973737565722e"
            )
            # showed-up
            self.data.kinds[sp.bytes("0x73686f7765642d7570")] = {
                "name": sp.bytes(
                    "0x506f696e74436173742073686f7765642d7570207365616c"
                ),
                "symbol": sp.bytes("0x50435345414c"),
                "decimals": sp.bytes("0x30"),
                "description": description,
            }
            # kennel-club-holder
            self.data.kinds[
                sp.bytes("0x6b656e6e656c2d636c75622d686f6c646572")
            ] = {
                "name": sp.bytes(
                    "0x506f696e7443617374204b656e6e656c20436c756220686f6c646572207365616c"
                ),
                "symbol": sp.bytes("0x50435345414c"),
                "decimals": sp.bytes("0x30"),
                "description": description,
            }
            # resident
            self.data.kinds[sp.bytes("0x7265736964656e74")] = {
                "name": sp.bytes(
                    "0x506f696e7443617374207265736964656e74207365616c"
                ),
                "symbol": sp.bytes("0x50435345414c"),
                "decimals": sp.bytes("0x30"),
                "description": description,
            }
            # founding-100
            self.data.kinds[sp.bytes("0x666f756e64696e672d313030")] = {
                "name": sp.bytes(
                    "0x506f696e744361737420666f756e64696e6720313030207365616c"
                ),
                "symbol": sp.bytes("0x50435345414c"),
                "decimals": sp.bytes("0x30"),
                "description": description,
            }
            # streak-7
            self.data.kinds[sp.bytes("0x73747265616b2d37")] = {
                "name": sp.bytes(
                    "0x506f696e744361737420372d6461792073747265616b207365616c"
                ),
                "symbol": sp.bytes("0x50435345414c"),
                "decimals": sp.bytes("0x30"),
                "description": description,
            }
            # complete-30
            self.data.kinds[sp.bytes("0x636f6d706c6574652d3330")] = {
                "name": sp.bytes(
                    "0x506f696e744361737420636f6d706c657465203330207365616c"
                ),
                "symbol": sp.bytes("0x50435345414c"),
                "decimals": sp.bytes("0x30"),
                "description": description,
            }
            # post-office-alias
            self.data.kinds[
                sp.bytes("0x706f73742d6f66666963652d616c696173")
            ] = {
                "name": sp.bytes(
                    "0x506f696e744361737420706f7374206f666669636520616c696173207365616c"
                ),
                "symbol": sp.bytes("0x50435345414c"),
                "decimals": sp.bytes("0x30"),
                "description": description,
            }
            # x402-receipt
            self.data.kinds[sp.bytes("0x783430322d72656365697074")] = {
                "name": sp.bytes(
                    "0x506f696e744361737420783430322072656365697074207365616c"
                ),
                "symbol": sp.bytes("0x50435345414c"),
                "decimals": sp.bytes("0x30"),
                "description": description,
            }

            self.data.seals = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(
                        holder=sp.address,
                        kind=sp.bytes,
                        evidence=sp.bytes,
                        evidence_uri=sp.option[sp.bytes],
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
            sp.cast(
                params,
                sp.record(
                    to_=sp.address,
                    kind=sp.bytes,
                    evidence=sp.bytes,
                    evidence_uri=sp.option[sp.bytes],
                ),
            )
            assert not self.data.paused, "ATTESTATIONS_PAUSED"
            assert sp.amount == sp.mutez(0), "ATTESTATION_IS_FREE"
            assert (
                sp.sender == self.data.administrator
                or sp.sender in self.data.issuers
            ), "NOT_ISSUER"
            assert params.kind in self.data.kinds, "UNKNOWN_SEAL_KIND"
            assert sp.len(params.evidence) <= 2048, "EVIDENCE_TOO_LONG"
            if params.evidence_uri.is_some():
                assert sp.len(params.evidence_uri.unwrap_some()) <= 2048, (
                    "EVIDENCE_URI_TOO_LONG"
                )

            token_id = self.data.next_token_id
            self.data.token_metadata[token_id] = sp.record(
                token_id=token_id,
                token_info=self.data.kinds[params.kind],
            )
            self.data.ledger[token_id] = params.to_
            self.data.seals[token_id] = sp.record(
                holder=params.to_,
                kind=params.kind,
                evidence=params.evidence,
                evidence_uri=params.evidence_uri,
                issuer=sp.sender,
                attested_at=sp.now,
                revoked=False,
            )
            prior = self.data.seal_ids_by_holder.get(params.to_, default=[])
            self.data.seal_ids_by_holder[params.to_] = sp.cons(token_id, prior)
            self.data.next_token_id += 1

        @sp.entrypoint
        def attest_batch(self, attestations):
            sp.cast(
                attestations,
                sp.list[
                    sp.record(
                        to_=sp.address,
                        kind=sp.bytes,
                        evidence=sp.bytes,
                        evidence_uri=sp.option[sp.bytes],
                    )
                ],
            )
            assert not self.data.paused, "ATTESTATIONS_PAUSED"
            assert sp.amount == sp.mutez(0), "ATTESTATION_IS_FREE"
            assert (
                sp.sender == self.data.administrator
                or sp.sender in self.data.issuers
            ), "NOT_ISSUER"
            assert sp.len(attestations) <= 100, "BATCH_TOO_LARGE"

            for attestation in attestations:
                assert attestation.kind in self.data.kinds, "UNKNOWN_SEAL_KIND"
                assert sp.len(attestation.evidence) <= 2048, "EVIDENCE_TOO_LONG"
                if attestation.evidence_uri.is_some():
                    assert sp.len(attestation.evidence_uri.unwrap_some()) <= 2048, (
                        "EVIDENCE_URI_TOO_LONG"
                    )

                token_id = self.data.next_token_id
                self.data.token_metadata[token_id] = sp.record(
                    token_id=token_id,
                    token_info=self.data.kinds[attestation.kind],
                )
                self.data.ledger[token_id] = attestation.to_
                self.data.seals[token_id] = sp.record(
                    holder=attestation.to_,
                    kind=attestation.kind,
                    evidence=attestation.evidence,
                    evidence_uri=attestation.evidence_uri,
                    issuer=sp.sender,
                    attested_at=sp.now,
                    revoked=False,
                )
                prior = self.data.seal_ids_by_holder.get(
                    attestation.to_, default=[]
                )
                self.data.seal_ids_by_holder[attestation.to_] = sp.cons(
                    token_id, prior
                )
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
        def set_kind(self, kind, enabled, metadata):
            sp.cast(kind, sp.bytes)
            sp.cast(enabled, sp.bool)
            sp.cast(metadata, sp.map[sp.string, sp.bytes])
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            if enabled:
                self.data.kinds[kind] = metadata
            else:
                if kind in self.data.kinds:
                    del self.data.kinds[kind]

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
def test_seal_soulbound_v2_fa2():
    scenario = sp.test_scenario("seal_soulbound_v2", [fa2.t, fa2.main, m])
    admin = sp.test_account("admin")
    issuer = sp.test_account("issuer")
    stranger = sp.test_account("stranger")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")

    contract = m.SealSoulboundV2FA2(
        administrator=admin.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/seals/v2/contract.json"
        ),
        initial_issuers=[],
        paused=False,
    )
    scenario += contract

    new_kind = sp.bytes("0x6e65772d6b696e64")
    new_metadata = {
        "name": sp.bytes("0x4e6577206b696e64"),
        "symbol": sp.bytes("0x50435345414c"),
        "decimals": sp.bytes("0x30"),
    }
    contract.set_kind(
        kind=new_kind,
        enabled=True,
        metadata=new_metadata,
        _sender=stranger,
        _valid=False,
        _exception="NOT_ADMIN",
    )
    contract.set_kind(
        kind=new_kind, enabled=True, metadata=new_metadata, _sender=admin
    )
    contract.set_issuer(issuer=issuer.address, allowed=True, _sender=admin)
    contract.attest(
        to_=alice.address,
        kind=new_kind,
        evidence=sp.bytes("0x70726f6f66"),
        evidence_uri=sp.Some(sp.bytes("0x697066733a2f2f65766964656e6365")),
        _sender=issuer,
    )
    contract.attest_batch(
        [
            sp.record(
                to_=bob.address,
                kind=sp.bytes("0x73747265616b2d37"),
                evidence=sp.bytes("0x73747265616b3a37"),
                evidence_uri=None,
            )
        ],
        _sender=issuer,
    )
    scenario.verify(contract.data.ledger[0] == alice.address)
    scenario.verify(contract.data.seals[0].evidence_uri.is_some())
    scenario.verify(contract.data.ledger[1] == bob.address)

    contract.revoke(0, _sender=issuer)
    scenario.verify(contract.data.seals[0].revoked)
    contract.transfer(
        [
            sp.record(
                from_=bob.address,
                txs=[sp.record(to_=alice.address, token_id=1, amount=1)],
            )
        ],
        _sender=bob,
        _valid=False,
        _exception="FA2_TX_DENIED",
    )

    contract.set_issuer(issuer=issuer.address, allowed=False, _sender=admin)
    contract.attest(
        to_=bob.address,
        kind=new_kind,
        evidence=sp.bytes("0x70726f6f66"),
        evidence_uri=None,
        _sender=issuer,
        _valid=False,
        _exception="NOT_ISSUER",
    )
    contract.set_kind(kind=new_kind, enabled=False, metadata={}, _sender=admin)
    contract.attest(
        to_=bob.address,
        kind=new_kind,
        evidence=sp.bytes("0x70726f6f66"),
        evidence_uri=None,
        _sender=admin,
        _valid=False,
        _exception="UNKNOWN_SEAL_KIND",
    )


@sp.add_test()
def compile_seal_soulbound_v2_fa2():
    scenario = sp.test_scenario(
        "seal_soulbound_v2_compile", [fa2.t, fa2.main, m]
    )
    mike = sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw")
    cc = sp.address("tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY")
    claim = sp.address("tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG")
    contract = m.SealSoulboundV2FA2(
        administrator=mike,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/seals/v2/contract.json"
        ),
        initial_issuers=[mike, cc, claim],
        paused=True,
    )
    scenario += contract
    scenario.verify(contract.data.paused)
    scenario.verify(contract.data.issuers.contains(mike))
    scenario.verify(contract.data.issuers.contains(cc))
    scenario.verify(contract.data.issuers.contains(claim))
