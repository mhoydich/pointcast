"""OFF-53 A. SmartPy 0.24.1; simulation-only draft."""
import smartpy as sp
from smartpy.templates import fa2_lib as fa2

main = fa2.main
t = fa2.t


@sp.module
def m():
    import main
    import t

    class Seat(main.NoTransfer, main.Nft):
        def __init__(self, admin, metadata):
            main.Nft.__init__(self, metadata, {}, [])
            main.NoTransfer.__init__(self)
            self.data.admin = admin
            self.data.holders = sp.cast(sp.big_map(), sp.big_map[sp.address, sp.nat])

        @sp.entrypoint
        def balance_of(self, params):
            sp.cast(params, t.balance_of_params)
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            answers = sp.cast([], sp.list[t.balance_of_response])
            for req in params.requests:
                assert req.token_id in self.data.token_metadata, "FA2_TOKEN_UNDEFINED"
                balance = sp.nat(0)
                if self.data.ledger[req.token_id] == req.owner:
                    balance = 1
                answers.push(sp.record(request=req, balance=balance))
            sp.transfer(reversed(answers), sp.mutez(0), params.callback)

        @sp.entrypoint
        def mint(self, holder, token_info):
            sp.cast(token_info, sp.map[sp.string, sp.bytes])
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            assert not (holder in self.data.holders), "HOLDER_HAS_SEAT"
            assert sp.len(token_info) <= 16, "TOO_MANY_METADATA_FIELDS"
            metadata_bytes = 0
            for item in token_info.items():
                metadata_bytes += sp.len(item.key) + sp.len(item.value)
            assert metadata_bytes <= 4096, "METADATA_TOO_LARGE"
            seat = self.data.next_token_id
            self.data.ledger[seat] = holder
            self.data.holders[holder] = seat
            self.data.token_metadata[seat] = sp.record(token_id=seat, token_info=token_info)
            self.data.next_token_id += 1

        @sp.onchain_view()
        def seat_count(self):
            return self.data.next_token_id

        @sp.onchain_view()
        def owner(self, seat):
            sp.cast(seat, sp.nat)
            return self.data.ledger.get_opt(seat)

    class Doubloon(main.NoTransfer, main.Fungible):
        def __init__(self, admin, metadata, token_info):
            main.Fungible.__init__(self, metadata, {}, [token_info])
            main.NoTransfer.__init__(self)
            self.data.admin = admin
            self.data.jobs = sp.cast(sp.big_map(), sp.big_map[sp.string, sp.record(holder=sp.address, amount=sp.nat, evidence=sp.string)])

        @sp.entrypoint
        def balance_of(self, params):
            sp.cast(params, t.balance_of_params)
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            answers = sp.cast([], sp.list[t.balance_of_response])
            for req in params.requests:
                assert req.token_id in self.data.token_metadata, "FA2_TOKEN_UNDEFINED"
                balance = self.data.ledger.get((req.owner, req.token_id), default=0)
                answers.push(sp.record(request=req, balance=balance))
            sp.transfer(reversed(answers), sp.mutez(0), params.callback)

        @sp.entrypoint
        def mint_done(self, job, holder, amount, evidence):
            sp.cast(amount, sp.nat)
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            assert sp.sender == self.data.admin, "NOT_ADMIN"
            assert sp.len(job) > 0 and sp.len(job) <= 128, "BAD_JOB"
            assert sp.len(evidence) > 0 and sp.len(evidence) <= 512, "BAD_EVIDENCE"
            assert amount > 0, "ZERO_AWARD"
            assert not (job in self.data.jobs), "JOB_ALREADY_REWARDED"
            self.data.jobs[job] = sp.record(holder=holder, amount=amount, evidence=evidence)
            self.data.ledger[(holder, 0)] = self.data.ledger.get((holder, 0), default=0) + amount
            self.data.supply[0] += amount

    proposal_t: type = sp.record(
        text=sp.string, options=sp.list[sp.string], closes=sp.timestamp,
        seats=sp.nat, counts=sp.map[sp.nat, sp.nat], total=sp.nat,
        closed=sp.bool, tied=sp.set[sp.nat], result=sp.option[sp.nat]
    )

    class DAO(sp.Contract):
        def __init__(self, seat, founder, metadata):
            self.data.seat = seat
            self.data.founder = founder
            self.data.metadata = metadata
            self.data.next_proposal = 0
            self.data.proposals = sp.cast(sp.big_map(), sp.big_map[sp.nat, proposal_t])
            self.data.votes = sp.cast(sp.big_map(), sp.big_map[sp.pair[sp.nat, sp.nat], sp.nat])

        @sp.entrypoint
        def propose(self, seat, text, options):
            sp.cast(seat, sp.nat)
            sp.cast(options, sp.list[sp.string])
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            owner = sp.view("owner", self.data.seat, seat, sp.option[sp.address]).unwrap_some()
            assert owner == sp.Some(sp.sender), "NOT_SEAT_HOLDER"
            assert sp.len(text) > 0 and sp.len(text) <= 2000, "BAD_TEXT"
            assert sp.len(options) >= 2 and sp.len(options) <= 16, "BAD_OPTIONS"
            seen = sp.cast(set(), sp.set[sp.string])
            for label in options:
                assert sp.len(label) > 0 and sp.len(label) <= 128, "BAD_LABEL"
                assert not (label in seen), "DUPLICATE_OPTION"
                seen.add(label)
            count = sp.view("seat_count", self.data.seat, (), sp.nat).unwrap_some()
            self.data.proposals[self.data.next_proposal] = sp.record(
                text=text, options=options, closes=sp.add_seconds(sp.now, 86400),
                seats=count, counts={}, total=0, closed=False, tied=set(), result=None)
            self.data.next_proposal += 1

        @sp.entrypoint
        def vote(self, proposal, seat, choice):
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            p = self.data.proposals[proposal]
            assert sp.now < p.closes, "VOTING_CLOSED"
            assert seat < p.seats, "SEAT_NOT_IN_SNAPSHOT"
            owner = sp.view("owner", self.data.seat, seat, sp.option[sp.address]).unwrap_some()
            assert owner == sp.Some(sp.sender), "NOT_SEAT_HOLDER"
            assert choice < sp.len(p.options), "BAD_CHOICE"
            assert not ((proposal, seat) in self.data.votes), "ALREADY_VOTED"
            self.data.votes[(proposal, seat)] = choice
            p.counts[choice] = p.counts.get(choice, default=0) + 1
            p.total += 1
            self.data.proposals[proposal] = p

        @sp.entrypoint
        def close(self, proposal):
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            p = self.data.proposals[proposal]
            assert sp.now >= p.closes, "STILL_OPEN"
            assert not p.closed, "ALREADY_CLOSED"
            p.closed = True
            best = 0
            leaders = sp.cast(set(), sp.set[sp.nat])
            for i in range(0, sp.len(p.options)):
                n = p.counts.get(i, default=0)
                if n > best:
                    best = n
                    leaders = {i}
                else:
                    if n == best:
                        leaders.add(i)
            if p.total > 0:
                if sp.len(leaders) == 1:
                    for i in leaders.elements():
                        p.result = sp.Some(i)
                else:
                    p.tied = leaders
            self.data.proposals[proposal] = p

        @sp.entrypoint
        def break_tie(self, proposal, choice):
            assert sp.amount == sp.mutez(0), "NO_TEZ"
            assert sp.sender == self.data.founder, "NOT_FOUNDER"
            p = self.data.proposals[proposal]
            assert p.closed and sp.len(p.tied) > 1 and p.result.is_none(), "NO_PENDING_TIE"
            assert choice in p.tied, "NOT_TIED_LEADER"
            p.result = sp.Some(choice)
            self.data.proposals[proposal] = p
