"""Deterministic local cost fixtures. Public addresses only; no accounts/keys.
The estimator consumes the labelled log and Micheline artifacts this emits.
"""
import smartpy as sp
from contracts import m, fa2

ADMIN = sp.address('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb')
ALICE = sp.address('tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6')
BOB = sp.address('tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN')
META = sp.big_map({'': sp.bytes('0x')})
INFO = {'decimals': sp.bytes('0x30')}

@sp.add_test()
def cost_cases():
    s = sp.test_scenario('ufogp_costs', [fa2.t, fa2.main, m])
    seat = m.Seat(ADMIN, META, 6)
    coin = m.Doubloon(ADMIN, META, INFO)
    s += seat
    s += coin
    dao = m.DAO(seat.address, ADMIN, META)
    s += dao
    s.h2('COST seat_mint_uri')
    seat.mint(holder=ALICE, token_info={'': sp.bytes('0x'+b'ipfs://example-seat-metadata'.hex()), **INFO}, _sender=ADMIN)
    s.h2('COST seat_mint_metadata_limit')
    seat.mint(holder=BOB, token_info={'': sp.bytes('0x'+'61'*4096)}, _sender=ADMIN)
    s.h2('COST doubloon_award')
    coin.mint_done(job='OFF-53/A', holder=ALICE, evidence='loom:task#done', _sender=ADMIN)
    s.h2('COST doubloon_award_reference_limits')
    coin.mint_done(job='J'*128, holder=ALICE, evidence='E'*512, _sender=ADMIN)
    s.h2('COST dao_propose_two')
    dao.propose(seat=0, text='First common good?', options=['Nouns', 'Services'], _sender=ALICE, _now=sp.timestamp(100))
    s.h2('COST dao_vote_first')
    dao.vote(proposal=0, seat=0, choice=0, _sender=ALICE, _now=sp.timestamp(101))
    s.h2('COST dao_vote_second')
    dao.vote(proposal=0, seat=1, choice=1, _sender=BOB, _now=sp.timestamp(102))
    s.h2('COST dao_close_tie')
    dao.close(0, _now=sp.timestamp(86500))
    s.h2('COST dao_break_tie')
    dao.break_tie(proposal=0, choice=1, _sender=ADMIN)
    s.h2('COST dao_propose_limits')
    dao.propose(seat=0, text='T'*2000, options=[str(i).zfill(128) for i in range(16)], _sender=ALICE, _now=sp.timestamp(90000))
    s.h2('COST dao_close_empty_sixteen')
    dao.close(1, _now=sp.timestamp(176400))
    s.h2('COST dao_propose_plurality')
    dao.propose(seat=0, text='Plurality', options=['A','B','C'], _sender=ALICE, _now=sp.timestamp(180000))
    s.h2('COST dao_vote_plurality')
    dao.vote(proposal=2, seat=0, choice=2, _sender=ALICE)
    s.h2('COST dao_close_winner')
    dao.close(2, _now=sp.timestamp(266400))
    s.verify(dao.data.proposals[2].result == sp.Some(2))
    s.verify(coin.data.supply[0] == 2)
    for prefix, contract in [('seat',seat),('doubloon',coin)]:
        s.h2('COST '+prefix+'_propose_admin')
        contract.propose_admin(BOB, _sender=ADMIN)
        s.h2('COST '+prefix+'_cancel_admin')
        contract.cancel_admin(_sender=ADMIN)
        s.h2('COST '+prefix+'_renominate_admin')
        contract.propose_admin(BOB, _sender=ADMIN)
        s.h2('COST '+prefix+'_accept_admin')
        contract.accept_admin(_sender=BOB)
    s.h2('COST dao_propose_founder')
    dao.propose_founder(BOB, _sender=ADMIN)
    s.h2('COST dao_cancel_founder')
    dao.cancel_founder(_sender=ADMIN)
    s.h2('COST dao_renominate_founder')
    dao.propose_founder(BOB, _sender=ADMIN)
    s.h2('COST dao_accept_founder')
    dao.accept_founder(_sender=BOB)
