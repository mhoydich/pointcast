import smartpy as sp
from contracts import m, fa2

# Fixed public-only simulation identities. No wallet, key or seed is generated.
ADMIN = sp.address('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb')
ALICE = sp.address('tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6')
BOB = sp.address('tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN')
META = sp.big_map({'': sp.bytes('0x')})
INFO = {'decimals': sp.bytes('0x30')}

@sp.add_test()
def suite():
    s = sp.test_scenario('ufogp', [fa2.t, fa2.main, m])
    seat = m.Seat(ADMIN, META, 6)
    coin = m.Doubloon(ADMIN, META, INFO)
    s += seat
    s += coin
    dao = m.DAO(seat.address, ADMIN, META)
    s += dao
    seat.mint(holder=ALICE, token_info=INFO, _sender=BOB, _valid=False, _exception='NOT_ADMIN')
    seat.mint(holder=ALICE, token_info=INFO, _sender=ADMIN)
    seat.mint(holder=ALICE, token_info=INFO, _sender=ADMIN, _valid=False, _exception='HOLDER_HAS_SEAT')
    seat.mint(holder=BOB, token_info=INFO, _sender=ADMIN)
    s.verify(seat.data.next_token_id == 2)
    seat.transfer([sp.record(from_=ALICE, txs=[sp.record(to_=BOB, token_id=0, amount=1)])], _sender=ALICE, _valid=False, _exception='FA2_TX_DENIED')
    seat.update_operators([sp.variant.add_operator(sp.record(owner=ALICE, operator=BOB, token_id=0))], _sender=ALICE, _valid=False)
    coin.mint_done(job='OFF-53/A', holder=ALICE, evidence='loom:task#done', _sender=BOB, _valid=False, _exception='NOT_ADMIN')
    coin.mint_done(job='OFF-53/A', holder=ALICE, evidence='loom:task#done', _sender=ADMIN)
    coin.mint_done(job='OFF-53/A', holder=BOB, evidence='loom:task#done', _sender=ADMIN, _valid=False, _exception='JOB_ALREADY_REWARDED')
    s.verify(coin.data.ledger[(ALICE, 0)] == 1)
    s.verify(coin.data.supply[0] == 1)
    dao.propose(seat=0, text='First common good', options=['Nouns', 'Services', 'Jobs'], _sender=BOB, _valid=False, _exception='NOT_SEAT_HOLDER')
    dao.propose(seat=0, text='First common good', options=['Nouns', 'Services', 'Jobs'], _sender=ALICE, _now=sp.timestamp(100))
    seat.mint(holder=ADMIN, token_info=INFO, _sender=ADMIN)
    dao.vote(proposal=0, seat=2, choice=0, _sender=ADMIN, _now=sp.timestamp(101), _valid=False, _exception='SEAT_NOT_IN_SNAPSHOT')
    dao.vote(proposal=0, seat=0, choice=0, _sender=BOB, _valid=False, _exception='NOT_SEAT_HOLDER')
    dao.vote(proposal=0, seat=0, choice=3, _sender=ALICE, _valid=False, _exception='BAD_CHOICE')
    dao.vote(proposal=0, seat=0, choice=0, _sender=ALICE)
    dao.vote(proposal=0, seat=0, choice=1, _sender=ALICE, _valid=False, _exception='ALREADY_VOTED')
    dao.vote(proposal=0, seat=1, choice=1, _sender=BOB, _now=sp.timestamp(86499))
    dao.close(0, _now=sp.timestamp(86499), _valid=False, _exception='STILL_OPEN')
    dao.vote(proposal=0, seat=1, choice=1, _sender=BOB, _now=sp.timestamp(86500), _valid=False, _exception='VOTING_CLOSED')
    dao.close(0, _now=sp.timestamp(86500))
    s.verify(dao.data.proposals[0].result.is_none())
    dao.break_tie(proposal=0, choice=0, _sender=ALICE, _valid=False, _exception='NOT_FOUNDER')
    dao.break_tie(proposal=0, choice=2, _sender=ADMIN, _valid=False, _exception='NOT_TIED_LEADER')
    dao.break_tie(proposal=0, choice=1, _sender=ADMIN)
    s.verify(dao.data.proposals[0].result == sp.Some(1))
    dao.break_tie(proposal=0, choice=0, _sender=ADMIN, _valid=False, _exception='NO_PENDING_TIE')
    dao.close(0, _valid=False, _exception='ALREADY_CLOSED')
    dao.propose(seat=0, text='No voters', options=['A', 'B'], _sender=ALICE, _now=sp.timestamp(90000))
    dao.close(1, _now=sp.timestamp(176400))
    s.verify(dao.data.proposals[1].closed)
    s.verify(dao.data.proposals[1].result.is_none())
    dao.break_tie(proposal=1, choice=0, _sender=ADMIN, _valid=False, _exception='NO_PENDING_TIE')
    dao.propose(seat=0, text='Plurality', options=['A', 'B', 'C'], _sender=ALICE, _now=sp.timestamp(180000))
    dao.vote(proposal=2, seat=0, choice=2, _sender=ALICE)
    dao.close(2, _now=sp.timestamp(266400))
    s.verify(dao.data.proposals[2].result == sp.Some(2))
    s.verify(dao.balance == sp.mutez(0))

t = fa2.t

@sp.module
def callbacks():
    import t
    class Receiver(sp.Contract):
        def __init__(self):
            self.data.answers = sp.cast([], sp.list[t.balance_of_response])
            self.data.indexed = sp.cast({}, sp.map[sp.nat, t.balance_of_response])
        @sp.entrypoint
        def receive(self, answers):
            self.data.answers = answers
            self.data.indexed = {}
            i = 0
            for answer in answers:
                self.data.indexed[i] = answer
                i += 1

@sp.add_test()
def edges():
    s = sp.test_scenario('ufogp_edges', [fa2.t, fa2.main, m, callbacks])
    seat = m.Seat(ADMIN, META, 6)
    coin = m.Doubloon(ADMIN, META, INFO)
    receiver = callbacks.Receiver()
    s += seat
    s += coin
    s += receiver
    dao = m.DAO(seat.address, ADMIN, META)
    s += dao
    cb = sp.contract(sp.list[t.balance_of_response], receiver.address, entrypoint='receive').unwrap_some()
    seat.mint(holder=ALICE, token_info=INFO, _sender=ADMIN, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    seat.mint(holder=ALICE, token_info=INFO, _sender=ADMIN)
    seat.mint(holder=BOB, token_info=INFO, _sender=ADMIN)
    seat.mint(holder=ADMIN, token_info=INFO, _sender=ADMIN)
    for c in [seat, coin]:
        c.balance_of(requests=[sp.record(owner=ALICE, token_id=99)], callback=cb, _valid=False, _exception='FA2_TOKEN_UNDEFINED')
        c.balance_of(requests=[], callback=cb, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
        c.balance_of(requests=[], callback=cb)
        s.verify(sp.len(receiver.data.answers) == 0)
    seat.balance_of(requests=[sp.record(owner=ALICE, token_id=0), sp.record(owner=BOB, token_id=0)], callback=cb)
    s.verify(sp.len(receiver.data.answers) == 2)
    s.verify(receiver.data.indexed[0].request.owner == ALICE)
    s.verify(receiver.data.indexed[0].balance == 1 )
    s.verify(receiver.data.indexed[1].request.owner == BOB)
    s.verify(receiver.data.indexed[1].balance == 0)
    for job, evidence, error in [('', 'done', 'BAD_JOB'), ('job', '', 'BAD_EVIDENCE')]:
        coin.mint_done(job=job, holder=ALICE, evidence=evidence, _sender=ADMIN, _valid=False, _exception=error)
    coin.mint_done(job='job', holder=ALICE, evidence='done', _sender=ADMIN, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    coin.mint_done(job='job', holder=ALICE, evidence='done', _sender=ADMIN)
    coin.balance_of(requests=[sp.record(owner=ALICE, token_id=0), sp.record(owner=BOB, token_id=0)], callback=cb)
    s.verify(sp.len(receiver.data.answers) == 2)
    s.verify(receiver.data.indexed[0].request.owner == ALICE)
    s.verify(receiver.data.indexed[0].balance == 1 )
    s.verify(receiver.data.indexed[1].request.owner == BOB)
    s.verify(receiver.data.indexed[1].balance == 0)
    coin.transfer([sp.record(from_=ALICE, txs=[sp.record(to_=BOB, token_id=0, amount=1)])], _sender=ALICE, _valid=False, _exception='FA2_TX_DENIED')
    coin.update_operators([], _sender=ALICE, _valid=False, _exception='FA2_OPERATORS_UNSUPPORTED')
    dao.propose(seat=0, text='duplicate', options=['A', 'A'], _sender=ALICE, _valid=False, _exception='DUPLICATE_OPTION')
    dao.propose(seat=0, text='vote', options=['A', 'B'], _sender=ALICE, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    dao.propose(seat=0, text='vote', options=['A', 'B'], _sender=ALICE, _now=sp.timestamp(0))
    dao.vote(proposal=0, seat=0, choice=1, _sender=ALICE, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    dao.vote(proposal=0, seat=0, choice=1, _sender=ALICE)
    dao.vote(proposal=0, seat=1, choice=1, _sender=BOB)
    dao.vote(proposal=0, seat=2, choice=0, _sender=ADMIN)
    dao.break_tie(proposal=0, choice=0, _sender=ADMIN, _valid=False, _exception='NO_PENDING_TIE')
    dao.close(0, _now=sp.timestamp(86400), _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    dao.close(0, _now=sp.timestamp(86400))
    s.verify(dao.data.proposals[0].result == sp.Some(1))
    dao.break_tie(proposal=0, choice=0, _sender=ADMIN, _valid=False, _exception='NO_PENDING_TIE')
    dao.break_tie(proposal=0, choice=0, _sender=ADMIN, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    s.verify(seat.balance == sp.mutez(0))
    s.verify(coin.balance == sp.mutez(0))
    s.verify(dao.balance == sp.mutez(0))

@sp.add_test()
def metadata_bounds_and_atomicity():
    s = sp.test_scenario('ufogp_bounds', [fa2.t, fa2.main, m])
    seat = m.Seat(ADMIN, META, 6)
    coin = m.Doubloon(ADMIN, META, INFO)
    s += seat
    s += coin
    seat.mint(holder=ALICE, token_info={str(i): sp.bytes('0x') for i in range(17)}, _sender=ADMIN, _valid=False, _exception='TOO_MANY_METADATA_FIELDS')
    seat.mint(holder=ALICE, token_info={'': sp.bytes('0x'+'61'*4097)}, _sender=ADMIN, _valid=False, _exception='METADATA_TOO_LARGE')
    s.verify(seat.data.next_token_id == 0)
    s.verify(~seat.data.holders.contains(ALICE))
    seat.mint(holder=ALICE, token_info={'': sp.bytes('0x'+'61'*4096)}, _sender=ADMIN)
    s.verify(seat.data.ledger[0] == ALICE)
    seat.mint(holder=BOB, token_info={str(i): sp.bytes('0x') for i in range(16)}, _sender=ADMIN)
    s.verify(seat.data.next_token_id == 2)
    coin.mint_done(job='one', holder=ALICE, evidence='done', _sender=ADMIN)
    coin.mint_done(job='one', holder=BOB, evidence='done', _sender=ADMIN, _valid=False, _exception='JOB_ALREADY_REWARDED')
    s.verify(coin.data.supply[0] == 1)
    s.verify(coin.data.ledger[(ALICE, 0)] == coin.data.supply[0])
    s.verify(~coin.data.ledger.contains((BOB, 0)))
    dao = m.DAO(seat.address, ADMIN, META)
    s += dao
    for options in [['A'], [str(i) for i in range(17)], ['A', 'B'*129]]:
        dao.propose(seat=0, text='test', options=options, _sender=ALICE, _valid=False)
    s.verify(dao.data.next_proposal == 0)

@sp.add_test()
def cap_and_role_handover():
    s = sp.test_scenario('ufogp_handover', [fa2.t, fa2.main, m])
    seat = m.Seat(ADMIN, META, 6)
    coin = m.Doubloon(ADMIN, META, INFO)
    s += seat
    s += coin
    holders = [ADMIN, ALICE, BOB,
        sp.address('tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'),
        sp.address('KT1TezoooozzSmartPyzzSTATiCzzzwwBFA1'),
        sp.address('KT1Tezooo1zzSmartPyzzSTATiCzzzyfC8eF')]
    seventh = sp.address('KT1Tezooo2zzSmartPyzzSTATiCzzzwqqQ4H')
    for holder in holders:
        seat.mint(holder=holder, token_info=INFO, _sender=ADMIN)
    seat.mint(holder=seventh, token_info=INFO, _sender=ADMIN, _valid=False, _exception='SEAT_CAP_REACHED')
    s.verify(seat.data.next_token_id == 6)
    s.verify(seat.data.seat_cap == 6)
    s.verify(~seat.data.holders.contains(seventh))
    s.verify(~seat.data.ledger.contains(6))
    s.verify(~seat.data.token_metadata.contains(6))
    coin.mint_done(job='fixed-one', holder=BOB, evidence='done', _sender=ADMIN)
    s.verify(coin.data.jobs['fixed-one'].amount == 1)
    for c in [seat, coin]:
        c.accept_admin(_sender=BOB, _valid=False, _exception='NOT_PENDING_ADMIN')
        c.propose_admin(BOB, _sender=ALICE, _valid=False, _exception='NOT_ADMIN')
        c.propose_admin(ADMIN, _sender=ADMIN, _valid=False, _exception='ALREADY_ADMIN')
        c.propose_admin(ALICE, _sender=ADMIN, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
        c.propose_admin(ALICE, _sender=ADMIN)
        s.verify(c.data.admin == ADMIN)
        if c is seat:
            c.mint(holder=seventh, token_info=INFO, _sender=ALICE, _valid=False, _exception='NOT_ADMIN')
        else:
            c.mint_done(job='premature', holder=BOB, evidence='done', _sender=ALICE, _valid=False, _exception='NOT_ADMIN')
        c.propose_admin(BOB, _sender=ADMIN)
        c.accept_admin(_sender=ALICE, _valid=False, _exception='NOT_PENDING_ADMIN')
        c.cancel_admin(_sender=BOB, _valid=False, _exception='NOT_ADMIN')
        c.cancel_admin(_sender=ADMIN, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
        c.cancel_admin(_sender=ADMIN)
        c.accept_admin(_sender=BOB, _valid=False, _exception='NOT_PENDING_ADMIN')
        c.propose_admin(ALICE, _sender=ADMIN)
        c.accept_admin(_sender=ALICE, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
        c.accept_admin(_sender=ALICE)
        s.verify(c.data.admin == ALICE)
        s.verify(c.data.pending_admin.is_none())
        c.accept_admin(_sender=ALICE, _valid=False, _exception='NOT_PENDING_ADMIN')
        c.propose_admin(BOB, _sender=ADMIN, _valid=False, _exception='NOT_ADMIN')
    seat.mint(holder=seventh, token_info=INFO, _sender=ADMIN, _valid=False, _exception='NOT_ADMIN')
    seat.mint(holder=seventh, token_info=INFO, _sender=ALICE, _valid=False, _exception='SEAT_CAP_REACHED')
    coin.mint_done(job='next', holder=BOB, evidence='done', _sender=ADMIN, _valid=False, _exception='NOT_ADMIN')
    coin.mint_done(job='fixed-one', holder=ALICE, evidence='done', _sender=ALICE, _valid=False, _exception='JOB_ALREADY_REWARDED')
    coin.mint_done(job='next', holder=BOB, evidence='done', _sender=ALICE)
    s.verify(coin.data.supply[0] == 2)
    s.verify(coin.data.ledger[(BOB, 0)] == 2)
    dao = m.DAO(seat.address, ADMIN, META)
    s += dao
    dao.propose(seat=1, text='Tie during handover', options=['A','B'], _sender=ALICE, _now=sp.timestamp(0))
    dao.vote(proposal=0, seat=1, choice=0, _sender=ALICE)
    dao.vote(proposal=0, seat=2, choice=1, _sender=BOB)
    dao.close(0, _now=sp.timestamp(86400))
    dao.accept_founder(_sender=ALICE, _valid=False, _exception='NOT_PENDING_FOUNDER')
    dao.propose_founder(ALICE, _sender=BOB, _valid=False, _exception='NOT_FOUNDER')
    dao.propose_founder(ADMIN, _sender=ADMIN, _valid=False, _exception='ALREADY_FOUNDER')
    dao.propose_founder(ALICE, _sender=ADMIN, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    dao.propose_founder(ALICE, _sender=ADMIN)
    s.verify(dao.data.founder == ADMIN)
    dao.break_tie(proposal=0, choice=0, _sender=ALICE, _valid=False, _exception='NOT_FOUNDER')
    dao.propose_founder(BOB, _sender=ADMIN)
    dao.accept_founder(_sender=ALICE, _valid=False, _exception='NOT_PENDING_FOUNDER')
    dao.cancel_founder(_sender=BOB, _valid=False, _exception='NOT_FOUNDER')
    dao.cancel_founder(_sender=ADMIN, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    dao.cancel_founder(_sender=ADMIN)
    dao.accept_founder(_sender=BOB, _valid=False, _exception='NOT_PENDING_FOUNDER')
    dao.propose_founder(ALICE, _sender=ADMIN)
    dao.accept_founder(_sender=ALICE, _amount=sp.mutez(1), _valid=False, _exception='NO_TEZ')
    dao.accept_founder(_sender=ALICE)
    s.verify(dao.data.founder == ALICE)
    s.verify(dao.data.pending_founder.is_none())
    dao.accept_founder(_sender=ALICE, _valid=False, _exception='NOT_PENDING_FOUNDER')
    dao.break_tie(proposal=0, choice=0, _sender=ADMIN, _valid=False, _exception='NOT_FOUNDER')
    dao.break_tie(proposal=0, choice=0, _sender=ALICE)
    s.verify(dao.data.proposals[0].result == sp.Some(0))
