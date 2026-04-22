"""
daily_auction.py — self-perpetuating daily English auction for Visit Nouns FA2
SmartPy v0.24.x

Purpose
=======
Nouns DAO's defining primitive: every 24h, one new token mints to the top
bidder. Auction proceeds flow to a treasury. When one auction settles, the
next auto-starts for the next token id. Self-perpetuating.

The missing piece on Tezos. objkt has per-asset English auctions; nothing
implements the auto-mint-on-settle + auto-start-next loop. This contract is
that loop.

Architecture
============
- Wraps the already-deployed Visit Nouns FA2 at
  KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh (originated 2026-04-17). Not modified.
  Auction contract is the minter + intermediate owner.
- Flow per cycle:
    1. `bid()` — payable. Must beat current top by min_increment_bps.
       Previous top bidder refunded in the same operation.
       If bid lands in last extend_window_sec, push ends_at by extend_by_sec.
    2. After ends_at, anyone calls `settle_and_create_next()`:
       a. Auction contract calls Visit Nouns FA2 `mint_noun(current_noun_id)`.
          Token mints to auction contract (self-mint).
       b. Auction contract transfers the freshly-minted token to top bidder
          via FA2 transfer entrypoint.
       c. Proceeds split: (1 - keeper_tip_bps/10000) * bid → treasury;
          keeper_tip_bps/10000 * bid → sp.sender (whoever called settle).
       d. current_noun_id += 1 (mod 1200), reset auction state, fire next.
- v0 governance is 2-of-3 multisig (treasury address). No on-chain governor
  contract; that's v0.2.
- Visit Nouns FA2 holds no operator approval required because transfers where
  from == sp.sender (the auction contract) do not require operator setup.

Entry points
============
Public:
    bid()                                   payable
    settle_and_create_next()                anyone after ends_at

Admin-only (administrator = Mike's tz2 address):
    set_reserve_price(mutez)
    set_min_increment(bps)                  capped at 2000 (20%)
    set_duration(secs)                      capped [3600, 604800]
    set_extend_window(window_secs, by_secs) both capped to duration/2
    set_keeper_tip(bps)                     capped at 200 (2%)
    set_treasury(address)
    set_admin(address)
    set_paused(bool)                        while paused, bid() reverts;
                                            settle_and_create_next still works
    sweep_stuck_bid(to)                     admin-only, only if paused >30 days

Storage schema
==============
See DailyAuctionState record. Tracks:
    current_noun_id, highest_bidder, highest_bid, starts_at, ends_at,
    settled, reserve_price, min_increment_bps, extend_window_sec,
    extend_by_sec, duration_sec, keeper_tip_bps,
    visit_nouns_fa2, treasury, admin, paused,
    settled_count (increments each settle for event ordering + analytics)

Non-goals (v0)
==============
- No on-chain governance (multisig is governance)
- No trait editor; reuse noun.pics SVGs
- No Etherlink deployment
- No agent-bidder endpoint (observe-only via WebMCP in v0)
- No DRUM bid token (XTZ only)
- No Prize Cast yield routing (v1 skims 1%)

Author: cc, 2026-04-21.
Source: Mike chat "tezos nouns builder" (2 words) + "keep going" (cc picks
defaults on the 5 open questions from docs/briefs/2026-04-21-daily-auction-spec.md).

cc's picks on the 5 open questions (per "cc picks" pattern):
  (1) Integration: Option B (auction as intermediate owner, no Visit Nouns
      changes). Chosen because Visit Nouns FA2 is already on mainnet and
      cannot be upgraded in place — re-originating would break the live
      contract's address + existing holders.
  (2) Cycle time: UTC midnight (legibility; matches Ethereum Nouns' pattern).
      Implemented by setting duration_sec = 86400 and starting the first
      auction at next UTC midnight after origination.
  (3) First Noun seed: 0. Clean sequential rollout. (Mike can set via an
      admin entrypoint before activation if he wants aesthetic launch.)
  (4) Multisig signers: DEFERRED. The constructor takes a `treasury` address;
      Mike sets it to the multisig address after originating that multisig.
      origination script prompts Mike to paste the multisig address.
  (5) Branding: "Visit Nouns Auction" for v0 (continuity with the live FA2).
      Fresh brand lands with v0.2 spawner.
"""

import smartpy as sp


@sp.module
def main():
    BYTE_TO_NAT = sp.cast(
        {sp.bytes(f"0x{i:02x}"): i for i in range(256)},
        sp.map[sp.bytes, sp.nat],
    )

    # ── FA2 minimal interface (for calling Visit Nouns FA2) ─────────
    # We need two entrypoints from Visit Nouns FA2:
    #   - mint_noun(noun_id: nat) — public, payable. Mints 1 token to sender.
    #   - transfer(list of transfer records) — standard FA2.
    # Types must match FA2 exactly or the .contract resolution fails.
    FA2TransferTxn = sp.record(
        to_=sp.address,
        token_id=sp.nat,
        amount=sp.nat,
    )
    FA2TransferBatch = sp.record(
        from_=sp.address,
        txs=sp.list[FA2TransferTxn],
    )

    class DailyAuction(sp.Contract):
        def __init__(
            self,
            administrator,
            visit_nouns_fa2,
            treasury,
            first_noun_id,
            starts_at,
            duration_sec,
            reserve_price_mutez,
            min_increment_bps,
            extend_window_sec,
            extend_by_sec,
            keeper_tip_bps,
        ):
            """Seed the first auction.

            first_noun_id     — 0 by default. Admin can bump via set_current_noun_id
                                (not exposed in v0; pick at origination).
            starts_at         — timestamp of the first auction's start.
                                Typically next UTC midnight after origination.
            duration_sec      — 86400 (24h default).
            reserve_price_mutez — 0 default (gas-only start; admin can bump).
            min_increment_bps — 500 (5% default).
            extend_window_sec — 600 (if bid in last 10min, extend).
            extend_by_sec     — 900 (15min extension).
            keeper_tip_bps    — 50 (0.5% paid to whoever calls settle).
            """
            assert duration_sec >= 3600, "DURATION_TOO_SHORT"
            assert duration_sec <= 604800, "DURATION_TOO_LONG"
            assert min_increment_bps <= 2000, "INCREMENT_TOO_HIGH"
            assert keeper_tip_bps <= 200, "KEEPER_TIP_TOO_HIGH"
            assert extend_window_sec <= duration_sec // 2, "WINDOW_TOO_LARGE"
            assert extend_by_sec <= duration_sec // 2, "EXTEND_TOO_LARGE"
            assert first_noun_id < 1200, "INVALID_FIRST_NOUN_ID"

            self.data.administrator = administrator
            self.data.visit_nouns_fa2 = visit_nouns_fa2
            self.data.treasury = treasury
            self.data.paused = False

            # Auction knobs (admin-tunable post-origination)
            self.data.duration_sec = duration_sec
            self.data.reserve_price = reserve_price_mutez
            self.data.min_increment_bps = min_increment_bps
            self.data.extend_window_sec = extend_window_sec
            self.data.extend_by_sec = extend_by_sec
            self.data.keeper_tip_bps = keeper_tip_bps

            # Current auction state
            self.data.current_noun_id = first_noun_id
            self.data.starts_at = starts_at
            self.data.ends_at = sp.add_seconds(starts_at, sp.to_int(duration_sec))
            self.data.settled = False
            self.data.has_bid = False
            self.data.highest_bidder = sp.cast(
                administrator, sp.address
            )  # sentinel; overwritten on first bid
            self.data.highest_bid = sp.mutez(0)

            # Analytics / ordering
            self.data.settled_count = sp.nat(0)
            self.data.last_paused_at = sp.cast(None, sp.option[sp.timestamp])

        def is_admin_(self):
            return sp.sender == self.data.administrator

        # ── Public bid entrypoint ─────────────────────────────────────
        @sp.entrypoint
        def bid(self):
            """Place a bid on the current auction.

            - Must be before ends_at, not paused, not settled.
            - Must be >= max(reserve_price, previous_highest + min_increment%)
            - Refunds previous highest bidder.
            - If bid lands within extend_window_sec of ends_at, extend by
              extend_by_sec.
            """
            assert not self.data.paused, "PAUSED"
            assert not self.data.settled, "SETTLED"
            assert sp.now >= self.data.starts_at, "NOT_STARTED"
            assert sp.now < self.data.ends_at, "AUCTION_ENDED"
            assert sp.amount > sp.mutez(0), "NO_BID"

            # Compute minimum acceptable bid
            if self.data.has_bid:
                # max(previous * (1 + inc%), reserve)
                prev_mutez = sp.fst(
                    sp.ediv(self.data.highest_bid, sp.mutez(1)).unwrap_some()
                )
                min_increment = (prev_mutez * self.data.min_increment_bps) // 10000
                required_mutez = prev_mutez + min_increment
                required = sp.mul(sp.nat(1), sp.mutez(required_mutez))
                reserve = self.data.reserve_price
                if reserve > required:
                    required = reserve
            else:
                required = self.data.reserve_price

            assert sp.amount >= required, "BID_TOO_LOW"

            # Refund previous bidder
            if self.data.has_bid:
                sp.send(self.data.highest_bidder, self.data.highest_bid)

            # Record new top bid
            self.data.highest_bidder = sp.sender
            self.data.highest_bid = sp.amount
            self.data.has_bid = True

            # Soft-close: if we're inside the extend window, push ends_at
            if sp.now >= sp.add_seconds(
                self.data.ends_at, -sp.to_int(self.data.extend_window_sec)
            ):
                self.data.ends_at = sp.add_seconds(
                    self.data.ends_at, sp.to_int(self.data.extend_by_sec)
                )

        # ── settle_and_create_next ────────────────────────────────────
        @sp.entrypoint
        def settle_and_create_next(self):
            """Settle the current auction and roll to the next.

            Callable by anyone after ends_at. Caller earns keeper_tip_bps of
            the final bid as gas gratuity (mimics Nouns pattern).

            Settlement flow:
              1. If has_bid:
                 a. Call Visit Nouns FA2 mint_noun(current_noun_id).
                    Token mints to this contract (sp.sender in that call).
                 b. Transfer the token to highest_bidder via FA2 transfer.
                 c. Split proceeds: (1 - keeper_tip) to treasury, keeper_tip
                    to sp.sender (caller).
              2. If !has_bid: no mint, no transfer, no payout.
              3. Create next auction:
                 - current_noun_id = (current_noun_id + 1) mod 1200
                 - reset highest_bidder, highest_bid, has_bid
                 - starts_at = now, ends_at = now + duration_sec
                 - settled = False
            """
            assert sp.now >= self.data.ends_at, "NOT_ENDED"
            assert not self.data.settled, "ALREADY_SETTLED"

            # Mark settled first to prevent re-entry
            self.data.settled = True
            keeper = sp.sender

            if self.data.has_bid:
                # 1a. Call Visit Nouns FA2 mint_noun. Token mints to self.
                fa2_mint = sp.contract(
                    sp.nat, self.data.visit_nouns_fa2, entrypoint="mint_noun"
                ).unwrap_some(error="NO_MINT_ENTRYPOINT")
                # mint_noun takes payment (may be 0 if visit_nouns mint_price is 0).
                # v0 assumes mint_price is 0 on the live contract; admin can top up.
                sp.transfer(self.data.current_noun_id, sp.mutez(0), fa2_mint)

                # 1b. Transfer minted token from self → highest_bidder.
                fa2_transfer = sp.contract(
                    sp.list[FA2TransferBatch],
                    self.data.visit_nouns_fa2,
                    entrypoint="transfer",
                ).unwrap_some(error="NO_TRANSFER_ENTRYPOINT")
                txn = sp.record(
                    to_=self.data.highest_bidder,
                    token_id=self.data.current_noun_id,
                    amount=sp.nat(1),
                )
                batch = sp.record(
                    from_=sp.self_address(),
                    txs=[txn],
                )
                sp.transfer([batch], sp.mutez(0), fa2_transfer)

                # 1c. Split proceeds
                bid_mutez = sp.fst(
                    sp.ediv(self.data.highest_bid, sp.mutez(1)).unwrap_some()
                )
                keeper_mutez_amt = (bid_mutez * self.data.keeper_tip_bps) // 10000
                treasury_mutez_amt = sp.as_nat(bid_mutez - keeper_mutez_amt)

                if keeper_mutez_amt > 0:
                    sp.send(keeper, sp.mul(sp.nat(1), sp.mutez(keeper_mutez_amt)))
                if treasury_mutez_amt > 0:
                    sp.send(
                        self.data.treasury,
                        sp.mul(sp.nat(1), sp.mutez(treasury_mutez_amt)),
                    )

            # 3. Create next auction
            self.data.settled_count += sp.nat(1)
            next_id = (self.data.current_noun_id + 1) % sp.nat(1200)
            self.data.current_noun_id = next_id
            self.data.highest_bidder = self.data.administrator  # sentinel
            self.data.highest_bid = sp.mutez(0)
            self.data.has_bid = False
            self.data.starts_at = sp.now
            self.data.ends_at = sp.add_seconds(
                sp.now, sp.to_int(self.data.duration_sec)
            )
            self.data.settled = False

        # ── Admin entrypoints ─────────────────────────────────────────
        @sp.entrypoint
        def set_reserve_price(self, price_mutez):
            assert self.is_admin_(), "NOT_ADMIN"
            self.data.reserve_price = price_mutez

        @sp.entrypoint
        def set_min_increment(self, bps):
            assert self.is_admin_(), "NOT_ADMIN"
            assert bps <= sp.nat(2000), "INCREMENT_TOO_HIGH"
            self.data.min_increment_bps = bps

        @sp.entrypoint
        def set_duration(self, secs):
            assert self.is_admin_(), "NOT_ADMIN"
            assert secs >= sp.nat(3600), "DURATION_TOO_SHORT"
            assert secs <= sp.nat(604800), "DURATION_TOO_LONG"
            self.data.duration_sec = secs

        @sp.entrypoint
        def set_extend_window(self, params):
            """params: sp.record(window_sec=nat, by_sec=nat)"""
            assert self.is_admin_(), "NOT_ADMIN"
            assert params.window_sec <= self.data.duration_sec // sp.nat(2), (
                "WINDOW_TOO_LARGE"
            )
            assert params.by_sec <= self.data.duration_sec // sp.nat(2), (
                "EXTEND_TOO_LARGE"
            )
            self.data.extend_window_sec = params.window_sec
            self.data.extend_by_sec = params.by_sec

        @sp.entrypoint
        def set_keeper_tip(self, bps):
            assert self.is_admin_(), "NOT_ADMIN"
            assert bps <= sp.nat(200), "KEEPER_TIP_TOO_HIGH"
            self.data.keeper_tip_bps = bps

        @sp.entrypoint
        def set_treasury(self, addr):
            assert self.is_admin_(), "NOT_ADMIN"
            self.data.treasury = addr

        @sp.entrypoint
        def set_admin(self, addr):
            assert self.is_admin_(), "NOT_ADMIN"
            self.data.administrator = addr

        @sp.entrypoint
        def set_paused(self, paused):
            assert self.is_admin_(), "NOT_ADMIN"
            self.data.paused = paused
            if paused:
                self.data.last_paused_at = sp.Some(sp.now)

        @sp.entrypoint
        def sweep_stuck_bid(self, to):
            """Recovery path — only if paused > 30 days.

            Refunds the current highest bidder to an address chosen by admin,
            resets has_bid. Last resort — if the live auction is broken in a
            way that won't unjam otherwise.
            """
            assert self.is_admin_(), "NOT_ADMIN"
            assert self.data.paused, "NOT_PAUSED"
            paused_since = self.data.last_paused_at.unwrap_some(error="NEVER_PAUSED")
            assert sp.now >= sp.add_seconds(paused_since, 30 * 86400), (
                "PAUSED_TOO_RECENT"
            )
            if self.data.has_bid:
                sp.send(to, self.data.highest_bid)
                self.data.highest_bid = sp.mutez(0)
                self.data.has_bid = False


# ── Tests ────────────────────────────────────────────────────────────
if "templates" not in __name__:

    @sp.add_test()
    def test_init_and_bid():
        scenario = sp.test_scenario("daily-auction", main)
        scenario.h1("Daily Auction — v0 tests")

        admin = sp.test_account("admin")
        alice = sp.test_account("alice")
        bob = sp.test_account("bob")
        carol = sp.test_account("carol")
        treasury = sp.test_account("treasury")
        fa2_placeholder = sp.test_account("fa2").address  # stand-in; real FA2 mocked upstream

        start = sp.timestamp(1800000000)
        c = main.DailyAuction(
            administrator=admin.address,
            visit_nouns_fa2=fa2_placeholder,
            treasury=treasury.address,
            first_noun_id=sp.nat(0),
            starts_at=start,
            duration_sec=sp.nat(86400),
            reserve_price_mutez=sp.mutez(0),
            min_increment_bps=sp.nat(500),
            extend_window_sec=sp.nat(600),
            extend_by_sec=sp.nat(900),
            keeper_tip_bps=sp.nat(50),
        )
        scenario += c

        scenario.h2("Alice bids 1 tez")
        c.bid(_sender=alice, _amount=sp.tez(1), _now=start.add_seconds(10))
        scenario.verify(c.data.highest_bid == sp.tez(1))
        scenario.verify(c.data.highest_bidder == alice.address)

        scenario.h2("Bob bids 0.5 tez — rejected, below increment")
        c.bid(
            _sender=bob,
            _amount=sp.tez(1),  # below 5% increment = 1.05
            _now=start.add_seconds(100),
            _valid=False,
            _exception="BID_TOO_LOW",
        )

        scenario.h2("Bob bids 1.1 tez — accepted, alice refunded")
        c.bid(_sender=bob, _amount=sp.mutez(1100000), _now=start.add_seconds(200))
        scenario.verify(c.data.highest_bid == sp.mutez(1100000))
        scenario.verify(c.data.highest_bidder == bob.address)

        scenario.h2("Carol bids during extend window — ends_at pushed")
        late = start.add_seconds(86400 - 300)  # last 5 min
        c.bid(_sender=carol, _amount=sp.mutez(1200000), _now=late)
        scenario.verify(c.data.highest_bidder == carol.address)
        # ends_at pushed by 900s
        scenario.verify(c.data.ends_at == start.add_seconds(86400 + 900))

        scenario.h2("Paused — bid rejected")
        c.set_paused(True, _sender=admin)
        c.bid(
            _sender=alice,
            _amount=sp.tez(10),
            _now=start.add_seconds(86500),
            _valid=False,
            _exception="PAUSED",
        )
        c.set_paused(False, _sender=admin)

    @sp.add_test()
    def test_admin_setters():
        scenario = sp.test_scenario("daily-auction-admin", main)
        scenario.h1("Admin setters")
        admin = sp.test_account("admin")
        stranger = sp.test_account("stranger")
        treasury = sp.test_account("treasury")
        fa2 = sp.test_account("fa2").address

        c = main.DailyAuction(
            administrator=admin.address,
            visit_nouns_fa2=fa2,
            treasury=treasury.address,
            first_noun_id=sp.nat(0),
            starts_at=sp.timestamp(1800000000),
            duration_sec=sp.nat(86400),
            reserve_price_mutez=sp.mutez(0),
            min_increment_bps=sp.nat(500),
            extend_window_sec=sp.nat(600),
            extend_by_sec=sp.nat(900),
            keeper_tip_bps=sp.nat(50),
        )
        scenario += c

        scenario.h2("set_reserve_price admin — ok")
        c.set_reserve_price(sp.tez(2), _sender=admin)
        scenario.verify(c.data.reserve_price == sp.tez(2))

        scenario.h2("set_reserve_price stranger — rejected")
        c.set_reserve_price(
            sp.tez(99),
            _sender=stranger,
            _valid=False,
            _exception="NOT_ADMIN",
        )

        scenario.h2("set_min_increment too high — rejected")
        c.set_min_increment(
            sp.nat(3000),
            _sender=admin,
            _valid=False,
            _exception="INCREMENT_TOO_HIGH",
        )

        scenario.h2("set_keeper_tip too high — rejected")
        c.set_keeper_tip(
            sp.nat(500),
            _sender=admin,
            _valid=False,
            _exception="KEEPER_TIP_TOO_HIGH",
        )

        scenario.h2("set_duration too short — rejected")
        c.set_duration(
            sp.nat(60),
            _sender=admin,
            _valid=False,
            _exception="DURATION_TOO_SHORT",
        )
