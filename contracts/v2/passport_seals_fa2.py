# ============================================================
# passport_seals_fa2.py
# Target: SmartPy v0.24.1 (pinned — see ~/.claude/skills/tezos)
# FA2 lib: smartpy.templates.fa2_lib
#
# PointCast Passport Seals — soulbound FA2, Phase C of the Seal
# Registry PRD (docs/plans/2026-07-18-prd-seal-registry.md).
#
# The off-chain arc is live: /passport signs a journey (Beacon raw
# payload), /api/seals registers it, /townsfolk verifies it in the
# reader's browser. This contract is the on-chain rung: one
# soulbound seal token per address, claimed by the wallet itself.
#
# Rules, all enforced on-chain:
#   · claim_seal: public, gas-only. Caller mints exactly one seal
#     to self. Second claim fails PC_SEAL_ALREADY_CLAIMED.
#   · Soulbound via fa2_lib's NoTransfer policy — transfer raises
#     FA2_TX_DENIED, operator updates raise FA2_OPERATORS_UNSUPPORTED.
#     Listed BEFORE the Nft base so its policy wins the MRO.
#   · No burn. Foil doesn't peel.
#
# What is NOT on-chain (deliberate, per the PRD's trust model):
# whether the claimer actually published a verified seal at
# /api/seals. The chain proves "this wallet claimed, once"; the
# registry + reader-side verification prove the journey. The token
# metadata points at /townsfolk so indexers land on the shelf.
#
# Mirrors coffee_mugs_fa2.py structure for migration consistency.
#
# COMPILE (never originate from an agent — only Mike signs):
#   uv venv + smartpy-tezos==0.24.1, run from site-packages cwd:
#     cd $VENV/lib/python3.12/site-packages && \
#       python /abs/path/contracts/v2/passport_seals_fa2.py
#   Exit 0 + silent = scenario assertions passed. Output lands in
#   ./passport_seals/ — copy step_*_contract.json + _storage.json
#   into contracts/build/passport_seals/.
#
# DEPLOY (Mike, when ready — option B per coffee mugs notes):
#   1. Originate from Beacon wallet via /admin/deploy with the
#      compiled michelson + storage (admin = Mike's wallet).
#   2. Paste KT1 into src/data/contracts.json under passport_seals.
#   3. /townsfolk gains "mint this seal" for verified covers.
# ============================================================

import smartpy as sp
from smartpy.templates import fa2_lib as fa2

main = fa2.main


@sp.module
def m():
    import main

    class PassportSealsFA2(
        main.Admin,
        main.NoTransfer,
        main.Nft,
        main.ChangeMetadata,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """PointCast Passport Seals — soulbound FA2.

        One seal per address, self-claimed, never transferable. The
        NoTransfer policy (listed before Nft in the MRO) makes every
        transfer fail FA2_TX_DENIED and every operator update fail
        FA2_OPERATORS_UNSUPPORTED — the FA2 interface stays complete,
        the tokens stay put.
        """

        def __init__(self, administrator, metadata):
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.ChangeMetadata.__init__(self)
            main.Nft.__init__(self, metadata, {}, [])
            main.NoTransfer.__init__(self)
            main.Admin.__init__(self, administrator)
            # One-per-address enforcement: address → claimed token_id.
            self.data.seal_of = sp.cast(
                sp.big_map(), sp.big_map[sp.address, sp.nat]
            )

        @sp.entrypoint
        def claim_seal(self):
            """Public gas-only mint: exactly one soulbound seal to sender."""
            assert sp.amount == sp.mutez(0), "PC_SEAL_FREE_MINT_ONLY"
            assert not (sp.sender in self.data.seal_of), "PC_SEAL_ALREADY_CLAIMED"
            token_id = self.data.next_token_id
            self.data.token_metadata[token_id] = sp.record(
                token_id=token_id,
                # TZIP-21 fields as pre-encoded UTF-8 hex — the pinned
                # 0.24.1 stdlib has no bytes_of_string (dotpath's
                # utf8-bytes gotcha). Plaintext for each literal sits in
                # the deploy notes.
                token_info={
                    # "PointCast Passport Seal"
                    "name": sp.bytes("0x506f696e74436173742050617373706f7274205365616c"),
                    # "PCSEAL"
                    "symbol": sp.bytes("0x50435345414c"),
                    # "0"
                    "decimals": sp.bytes("0x30"),
                    # "https://pointcast.xyz/townsfolk"
                    "": sp.bytes("0x68747470733a2f2f706f696e74636173742e78797a2f746f776e73666f6c6b"),
                    # "A soulbound seal of a PointCast passport. …" (full text in deploy notes)
                    "description": sp.bytes("0x4120736f756c626f756e64207365616c206f66206120506f696e74436173742070617373706f72742e20436c61696d6564206279207468652077616c6c657420697473656c662c206e65766572207472616e7366657261626c652e20546865206a6f75726e6579206974207365616c73206973207075626c697368656420616e64207265616465722d766572696669656420617420706f696e74636173742e78797a2f746f776e73666f6c6b2e"),
                },
            )
            self.data.ledger[token_id] = sp.sender
            self.data.seal_of[sp.sender] = token_id
            self.data.next_token_id += 1


@sp.add_test()
def test():
    scenario = sp.test_scenario("passport_seals", [fa2.t, fa2.main, m])
    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")

    c = m.PassportSealsFA2(
        administrator=admin.address,
        metadata=sp.scenario_utils.metadata_of_url("ipfs://PLACEHOLDER-TZIP16"),
    )
    scenario += c

    # Alice claims her seal — token 0, ledger + seal_of updated.
    c.claim_seal(_sender=alice)
    scenario.verify(c.data.ledger[0] == alice.address)
    scenario.verify(c.data.seal_of[alice.address] == 0)
    scenario.verify(c.data.next_token_id == 1)

    # Second claim from the same wallet fails.
    c.claim_seal(_sender=alice, _valid=False, _exception="PC_SEAL_ALREADY_CLAIMED")

    # Paying the free mint fails.
    c.claim_seal(_sender=bob, _amount=sp.mutez(1), _valid=False)

    # Bob claims cleanly — token 1.
    c.claim_seal(_sender=bob)
    scenario.verify(c.data.ledger[1] == bob.address)

    # Soulbound: alice cannot transfer her seal anywhere, not even to bob.
    c.transfer(
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

    # Operators are unsupported entirely.
    c.update_operators(
        [
            sp.variant(
                "add_operator",
                sp.record(owner=alice.address, operator=bob.address, token_id=0),
            )
        ],
        _sender=alice,
        _valid=False,
        _exception="FA2_OPERATORS_UNSUPPORTED",
    )
