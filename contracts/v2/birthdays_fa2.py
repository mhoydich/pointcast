# ============================================================
# birthdays_fa2.py
# Target: SmartPy v0.24.1 (current on smartpy.io, April 2026)
# FA2 lib: smartpy.templates.fa2_lib
#
# PointCast Birthdays FA2 — the mint surface for /cake.
# Per Mike chat 2026-04-25 ~3:55pm PT ("ok try and lets set up minting").
# Spec: docs/briefs/2026-04-25-cake-room-bdy-channel.md §v1 + the
# broader v2 brief at docs/briefs/2026-04-25-cake-v2-public-registration.md.
#
# ──────────────────────────────────────────────────────────────────────────
# Mint shape
# ──────────────────────────────────────────────────────────────────────────
#
# Open-ended multi-token FA2. Each birthday block on PointCast that has a
# committed BIRTHDAY-type entry gets one token_id, registered by admin via
# `register_birthday(token_id, ...)`. Token IDs are derived from PointCast
# block IDs — block 0366 → token_id 366 — so the on-chain ↔ off-chain
# mapping is unambiguous.
#
# Public free mint (gas-only, ~0.001-0.01 ꜩ depending on storage diff).
# One claim per wallet per token_id — celebrating Morgan's birthday from
# two wallets gives you two tokens; trying to claim Morgan's birthday twice
# from the same wallet reverts. The "I was there" semantic relies on
# wallet ≈ identity, which is the same trust assumption FA2 makes.
#
# No edition caps (open editions). No royalties (free art, no secondary
# market expectation). Mike retains admin via the standard FA2 main.Admin
# mixin, can transfer admin, and can rotate metadata base URI.
#
# ──────────────────────────────────────────────────────────────────────────
# Storage
# ──────────────────────────────────────────────────────────────────────────
#
# birthdays: big_map[nat, BirthdayMeta] — token_id → on-chain card
#   .recipient_slug   — slug from /cake/{slug} (e.g. "morgan")
#   .block_id         — PointCast block ID as string ("0366")
#   .noun_id          — Nouns seed assigned forever (e.g. 888)
#   .birthday_year    — Gregorian year the block was published
#   .registered_at    — timestamp of register_birthday call
#
# bday_supply: big_map[nat, nat] — token_id → minted count
# claimed:     big_map[(address, nat), bool] — (claimer, token_id) → true
# metadata_base_uri: string — base for token metadata JSON
#
# ──────────────────────────────────────────────────────────────────────────
# Entrypoints
# ──────────────────────────────────────────────────────────────────────────
#
# register_birthday(token_id, recipient_slug, block_id, noun_id,
#                   birthday_year, recipient_name)
#   Admin-only. Registers a new birthday card. Idempotent guard on
#   token_id already-exists. Token metadata URI is built as
#   <metadata_base_uri>/<token_id>.json.
#
# mint_birthday_card(token_id)
#   Public, gas-only. Caller mints one token to self. Reverts if:
#     - token_id not registered                 → TOKEN_NOT_REGISTERED
#     - this caller already claimed this token  → ALREADY_CLAIMED
#
# set_metadata_base_uri(new_base) — admin only, escape hatch (HTTPS → IPFS)
#
# ──────────────────────────────────────────────────────────────────────────
# Views
# ──────────────────────────────────────────────────────────────────────────
#
# get_mint_count(token_id) → nat
# get_birthday(token_id) → BirthdayMeta
# has_claimed(claimer, token_id) → bool
#
# ──────────────────────────────────────────────────────────────────────────
# Deploy (option B per the brief — preferred)
# ──────────────────────────────────────────────────────────────────────────
#
#   1. Compile via smartpy.io online IDE OR `node scripts/compile-birthdays.mjs`
#      (mirror of compile-coffee-mugs.mjs).
#   2. Mike originates from his Beacon wallet via /admin/deploy. Storage init:
#        administrator    = Mike's main wallet
#        metadata         = sp.scenario_utils.metadata_of_url("https://pointcast.xyz/api/tezos-metadata/birthdays.json")
#        metadata_base_uri= "https://pointcast.xyz/api/tezos-metadata/birthdays"
#   3. Paste KT1 into src/data/contracts.json under `birthdays.mainnet`.
#   4. For each existing BIRTHDAY block (today: just 0366), call
#      register_birthday(366, "morgan", "0366", 888, 2026, "Morgan").
#   5. Wire MintButton.astro on /b/0366 + /cake to dispatch
#      `mint_birthday_card(token_id)` (extend the existing entrypoint
#      switch in MintButton — it already handles `mint_noun`, `claim`,
#      `mint`; add `mint_birthday_card`).
# ============================================================

import smartpy as sp
from smartpy.templates import fa2_lib as fa2

main = fa2.main


@sp.module
def m():
    # SmartPy v0.24 pattern: stdlib + main module imports live INSIDE the
    # @sp.module function body so the SmartPy compiler processes them
    # alongside the contract source. Top-level imports break the IDE's
    # pyodide module resolution. Mirrors visit_nouns_fa2.py + coffee_mugs_fa2.py.
    import main
    import smartpy.stdlib.string_utils as string_utils

    # ── Birthday metadata record (on-chain) ─────────────────────────────────
    # One per registered token_id. Stays small — heavy lift (image, dek,
    # body) lives off-chain at the metadata URI.
    #
    # NOTE: SmartPy v0.24 rejects `BirthdayMeta = sp.record(field=sp.string, …)`
    # at module-top-level with `sp.string is undefined`. The schema is now
    # inlined at every usage point (sp.cast / sp.big_map[...]) — same
    # pattern as coffee_mugs_fa2.py + visit_nouns_fa2.py, which compile.

    class BirthdaysFA2(
        main.Admin,
        main.Fungible,
        main.ChangeMetadata,
        main.WithdrawMutez,
        main.OffchainviewTokenMetadata,
        main.OnchainviewBalanceOf,
    ):
        """PointCast Birthdays FA2 multi-token contract.

        FA2 / TZIP-12 compliant open-edition mint contract. Each token_id
        is one BIRTHDAY block on PointCast (token_id derived from block ID).
        Public free mint, one claim per wallet per token_id, no edition cap.
        """

        def __init__(
            self,
            administrator,
            metadata,
            metadata_base_uri,
        ):
            # ── Mixin initialisation ─────────────────────────────────────
            main.OnchainviewBalanceOf.__init__(self)
            main.OffchainviewTokenMetadata.__init__(self)
            main.WithdrawMutez.__init__(self)
            main.ChangeMetadata.__init__(self)
            # Token metadata is registered per-birthday via register_birthday
            # post-origination. Origination leaves the contract empty.
            main.Fungible.__init__(self, metadata, {}, [])
            main.Admin.__init__(self, administrator)

            # ── Custom storage fields ────────────────────────────────────
            self.data.metadata_base_uri = sp.cast(metadata_base_uri, sp.string)

            # token_id → BirthdayMeta (inline schema — module-level alias was
            # rejected by SmartPy v0.24).
            self.data.birthdays = sp.cast(
                sp.big_map(),
                sp.big_map[
                    sp.nat,
                    sp.record(
                        recipient_slug=sp.string,
                        recipient_name=sp.string,
                        block_id=sp.string,
                        noun_id=sp.nat,
                        birthday_year=sp.nat,
                        registered_at=sp.timestamp,
                    ),
                ],
            )

            # token_id → minted count
            self.data.bday_supply = sp.cast(
                sp.big_map(),
                sp.big_map[sp.nat, sp.nat],
            )

            # (claimer, token_id) → true (one claim per wallet per token)
            self.data.claimed = sp.cast(
                sp.big_map(),
                sp.big_map[sp.pair[sp.address, sp.nat], sp.bool],
            )

        # ── Admin: register a new birthday card ────────────────────────────
        @sp.entrypoint
        def register_birthday(self, params):
            """Register a new BIRTHDAY card on the contract.

            params = sp.record(
                token_id, recipient_slug, recipient_name,
                block_id, noun_id, birthday_year,
            )

            One call per birthday block on PointCast. Token metadata URI is
            built as <metadata_base_uri>/<token_id>.json — the actual JSON
            is served from /api/tezos-metadata/birthdays/<token_id>.json
            (a Cloudflare Function that maps token_id → block frontmatter).

            Idempotent: refuses if token_id already registered.
            """
            sp.cast(
                params,
                sp.record(
                    token_id=sp.nat,
                    recipient_slug=sp.string,
                    recipient_name=sp.string,
                    block_id=sp.string,
                    noun_id=sp.nat,
                    birthday_year=sp.nat,
                ),
            )
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            assert (
                params.token_id not in self.data.birthdays
            ), "ALREADY_REGISTERED"

            # Build the token metadata URI: <base>/<token_id>.json
            uri = (
                self.data.metadata_base_uri
                + "/"
                + string_utils.from_int(sp.to_int(params.token_id))
                + ".json"
            )

            # TZIP-12 §8.1 + TZIP-21 token_info.
            token_info = sp.cast({}, sp.map[sp.string, sp.bytes])
            token_info[""] = sp.pack(uri)
            token_info["name"] = sp.pack(
                "Happy birthday, " + params.recipient_name
            )
            token_info["decimals"] = sp.pack("0")
            # No royalties on birthday cards — free editions, no secondary
            # market expectation. Omitted from token_info on purpose.

            self.data.token_metadata[params.token_id] = sp.record(
                token_id=params.token_id,
                token_info=token_info,
            )

            # Initialise supply tracking for FA2 lib + our cleaner view.
            self.data.supply[params.token_id] = 0
            self.data.bday_supply[params.token_id] = 0

            # Persist on-chain card metadata.
            self.data.birthdays[params.token_id] = sp.record(
                recipient_slug=params.recipient_slug,
                recipient_name=params.recipient_name,
                block_id=params.block_id,
                noun_id=params.noun_id,
                birthday_year=params.birthday_year,
                registered_at=sp.now,
            )

            # Bump next_token_id so all_tokens view stays in sync. We allow
            # non-contiguous token_ids (block IDs can skip retired numbers),
            # so we only push next_token_id forward, never backward.
            if params.token_id >= self.data.next_token_id:
                self.data.next_token_id = params.token_id + 1

        # ── Public mint ──────────────────────────────────────────────────
        @sp.entrypoint
        def mint_birthday_card(self, token_id):
            """Mint one edition of token_id to the caller.

            - token_id must be registered (admin-pre-registered birthday).
            - Caller cannot have claimed this token_id before.
            - Free mint, gas-only (no XTZ payment required or accepted).
            - No edition cap — open editions forever.
            """
            sp.cast(token_id, sp.nat)

            # Guard: token_id must be registered.
            assert (
                token_id in self.data.birthdays
            ), "TOKEN_NOT_REGISTERED"

            # Guard: one claim per wallet per token_id.
            claim_key = (sp.sender, token_id)
            assert (
                claim_key not in self.data.claimed
            ), "ALREADY_CLAIMED"

            # Reject any attached XTZ — this contract is gas-only.
            assert sp.amount == sp.tez(0), "NO_PAYMENT_ACCEPTED"

            # ── Mark claim + increment supply + ledger ─────────────────────
            self.data.claimed[claim_key] = True

            current = self.data.bday_supply.get(token_id, default=sp.nat(0))
            self.data.bday_supply[token_id] = current + 1
            self.data.supply[token_id] += 1

            ledger_key = (sp.sender, token_id)
            self.data.ledger[ledger_key] = (
                self.data.ledger.get(ledger_key, default=sp.nat(0)) + 1
            )

        # ── Admin: update metadata base URI ────────────────────────────────
        # Used to migrate from HTTPS to IPFS without re-originating.
        @sp.entrypoint
        def set_metadata_base_uri(self, new_base):
            sp.cast(new_base, sp.string)
            assert sp.sender == self.data.administrator, "NOT_ADMIN"
            self.data.metadata_base_uri = new_base

        # ── Read-only views ────────────────────────────────────────────────
        @sp.onchain_view()
        def get_mint_count(self, token_id):
            """Return current minted supply for a token_id."""
            sp.cast(token_id, sp.nat)
            return self.data.bday_supply.get(token_id, default=sp.nat(0))

        @sp.onchain_view()
        def get_birthday(self, token_id):
            """Return the on-chain BirthdayMeta for a token_id."""
            sp.cast(token_id, sp.nat)
            assert token_id in self.data.birthdays, "TOKEN_NOT_REGISTERED"
            return self.data.birthdays[token_id]

        @sp.onchain_view()
        def has_claimed(self, params):
            """Return True if claimer has already minted token_id."""
            sp.cast(
                params,
                sp.record(claimer=sp.address, token_id=sp.nat),
            )
            return (params.claimer, params.token_id) in self.data.claimed


# ──────────────────────────────────────────────────────────────────────────
# Test scenario — origination + register + mint smoke test.
# Run via the SmartPy IDE or smartpy compile. Confirms:
#   1. Origination + register_birthday work
#   2. mint_birthday_card succeeds for a registered token, any caller
#   3. Same caller minting same token twice → ALREADY_CLAIMED
#   4. Different caller can mint same token (open editions)
#   5. Unregistered token rejected
#   6. XTZ attached to mint rejected
#   7. Idempotent: re-registering same token_id rejected
#   8. has_claimed view reflects state correctly
# ──────────────────────────────────────────────────────────────────────────


@sp.add_test()
def test_birthdays():
    sc = sp.test_scenario("birthdays", m)
    sc.h1("PointCast Birthdays FA2")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")
    carol = sp.test_account("carol")

    sc.h2("Origination")
    contract = m.BirthdaysFA2(
        administrator=admin.address,
        metadata=sp.scenario_utils.metadata_of_url(
            "https://pointcast.xyz/api/tezos-metadata/birthdays.json"
        ),
        metadata_base_uri="https://pointcast.xyz/api/tezos-metadata/birthdays",
    )
    sc += contract

    sc.h2("Register Morgan's birthday card (token_id = 366)")
    contract.register_birthday(
        sp.record(
            token_id=366,
            recipient_slug="morgan",
            recipient_name="Morgan",
            block_id="0366",
            noun_id=888,
            birthday_year=2026,
        ),
        _sender=admin,
    )

    sc.h3("Idempotent: re-registering same token_id rejected")
    contract.register_birthday(
        sp.record(
            token_id=366,
            recipient_slug="morgan-impostor",
            recipient_name="Not Morgan",
            block_id="0366",
            noun_id=888,
            birthday_year=2026,
        ),
        _sender=admin,
        _valid=False,
    )

    sc.h3("Non-admin register rejected")
    contract.register_birthday(
        sp.record(
            token_id=999,
            recipient_slug="hacker",
            recipient_name="Hacker",
            block_id="9999",
            noun_id=0,
            birthday_year=2026,
        ),
        _sender=alice,
        _valid=False,
    )

    sc.h2("Alice mints Morgan's card (free, gas-only)")
    contract.mint_birthday_card(366, _sender=alice)
    sc.verify(contract.get_mint_count(366) == 1)
    sc.verify(
        contract.has_claimed(
            sp.record(claimer=alice.address, token_id=sp.nat(366))
        )
    )

    sc.h3("Alice tries to mint Morgan's card again → ALREADY_CLAIMED")
    contract.mint_birthday_card(366, _sender=alice, _valid=False)
    sc.verify(contract.get_mint_count(366) == 1)

    sc.h2("Bob mints Morgan's card (different wallet, open editions)")
    contract.mint_birthday_card(366, _sender=bob)
    sc.verify(contract.get_mint_count(366) == 2)

    sc.h2("Carol mints with XTZ attached → NO_PAYMENT_ACCEPTED")
    contract.mint_birthday_card(
        366, _sender=carol, _amount=sp.tez(1), _valid=False
    )
    sc.verify(contract.get_mint_count(366) == 2)

    sc.h2("Carol mints unregistered token_id → TOKEN_NOT_REGISTERED")
    contract.mint_birthday_card(99999, _sender=carol, _valid=False)

    sc.h2("Carol mints Morgan's card (free)")
    contract.mint_birthday_card(366, _sender=carol)
    sc.verify(contract.get_mint_count(366) == 3)

    sc.h2("get_birthday view returns Morgan's metadata")
    morgan_card = contract.get_birthday(366)
    sc.verify(morgan_card.recipient_slug == "morgan")
    sc.verify(morgan_card.block_id == "0366")
    sc.verify(morgan_card.noun_id == 888)
    sc.verify(morgan_card.birthday_year == 2026)

    sc.h2("has_claimed view: alice yes, dan no")
    sc.verify(
        contract.has_claimed(
            sp.record(claimer=alice.address, token_id=sp.nat(366))
        )
    )
    sc.verify(
        ~contract.has_claimed(
            sp.record(
                claimer=sp.test_account("dan").address,
                token_id=sp.nat(366),
            )
        )
    )

    sc.h2("Admin rotates metadata base URI")
    contract.set_metadata_base_uri(
        "ipfs://Qm.../birthdays", _sender=admin
    )

    sc.h3("Non-admin URI rotation rejected")
    contract.set_metadata_base_uri(
        "ipfs://hacker", _sender=alice, _valid=False
    )
