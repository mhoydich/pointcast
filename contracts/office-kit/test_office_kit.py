import smartpy as sp
from office_kit import m, main, t

# Public-only simulation identities. No wallet, key or seed is used.
ARTIST = sp.address("tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6")
BUYER = sp.address("tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN")
PATRON = sp.address("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")
STRANGER = sp.address("tz1Zc2gu5nrGMPubdLLeBDCSzWJzY8yd6Qp9")
META = sp.big_map({"": sp.bytes("0x")})
URI = sp.bytes("0x697066733a2f2f78")  # "ipfs://x"
TEZ = 1_000_000


@sp.add_test()
def listing_and_collect():
    s = sp.test_scenario("office_kit_listing", [t, main, m])
    k = m.OfficeKit(META)
    s += k
    k.list_piece(metadata_uri=URI, editions=2, price_mutez=sp.mutez(2 * TEZ), _sender=ARTIST)
    k.list_piece(metadata_uri=URI, editions=0, price_mutez=sp.mutez(1), _sender=ARTIST, _valid=False, _exception="NO_EDITIONS")
    s.verify(k.data.listings[0].artist == ARTIST)
    # wrong amounts fail
    k.collect(listing_id=0, to_=BUYER, _sender=BUYER, _amount=sp.mutez(TEZ), _valid=False, _exception="WRONG_AMOUNT")
    k.collect(listing_id=0, to_=BUYER, _sender=BUYER, _amount=sp.mutez(3 * TEZ), _valid=False, _exception="WRONG_AMOUNT")
    k.collect(listing_id=0, to_=BUYER, _sender=BUYER, _valid=False, _exception="WRONG_AMOUNT")
    # exact price works; the contract keeps nothing
    k.collect(listing_id=0, to_=BUYER, _sender=BUYER, _amount=sp.mutez(2 * TEZ))
    s.verify(k.balance == sp.mutez(0))
    s.verify(k.data.ledger[(BUYER, 0)] == 1)
    s.verify(k.data.supply[0] == 1)
    # a gift to someone else, paid by a stranger
    k.collect(listing_id=0, to_=PATRON, _sender=STRANGER, _amount=sp.mutez(2 * TEZ))
    s.verify(k.data.ledger[(PATRON, 0)] == 1)
    s.verify(k.balance == sp.mutez(0))
    # sold out
    k.collect(listing_id=0, to_=BUYER, _sender=BUYER, _amount=sp.mutez(2 * TEZ), _valid=False, _exception="SOLD_OUT")
    s.verify(k.data.supply[0] == 2)
    # free piece: price 0, exact 0
    k.list_piece(metadata_uri=URI, editions=1, price_mutez=sp.mutez(0), _sender=ARTIST)
    k.collect(listing_id=1, to_=BUYER, _sender=BUYER, _amount=sp.mutez(1), _valid=False, _exception="WRONG_AMOUNT")
    k.collect(listing_id=1, to_=BUYER, _sender=BUYER)
    s.verify(k.data.ledger[(BUYER, 1)] == 1)
    # unknown listing fails
    k.collect(listing_id=9, to_=BUYER, _sender=BUYER, _valid=False)


@sp.add_test()
def payroll():
    s = sp.test_scenario("office_kit_payroll", [t, main, m])
    k = m.OfficeKit(META)
    s += k
    DAY = 86400
    T0 = sp.timestamp(1_000_000)
    # 5 tez/period, 4 periods = 20 tez escrowed
    k.start_payroll(artist=ARTIST, amount_per_period=sp.mutez(5 * TEZ), periods=4, period_seconds=DAY,
                    _sender=PATRON, _amount=sp.mutez(19 * TEZ), _now=T0, _valid=False, _exception="WRONG_AMOUNT")
    k.start_payroll(artist=ARTIST, amount_per_period=sp.mutez(5 * TEZ), periods=4, period_seconds=DAY,
                    _sender=PATRON, _amount=sp.mutez(20 * TEZ), _now=T0)
    s.verify(k.balance == sp.mutez(20 * TEZ))
    # nothing vested yet
    k.claim_payroll(0, _sender=ARTIST, _now=T0.add_seconds(DAY - 1), _valid=False, _exception="NOTHING_VESTED")
    # strangers (and the patron) cannot claim or cancel
    k.claim_payroll(0, _sender=STRANGER, _now=T0.add_seconds(DAY), _valid=False, _exception="NOT_ARTIST")
    k.claim_payroll(0, _sender=PATRON, _now=T0.add_seconds(DAY), _valid=False, _exception="NOT_ARTIST")
    k.cancel_payroll(0, _sender=STRANGER, _now=T0.add_seconds(DAY), _valid=False, _exception="NOT_PATRON")
    k.cancel_payroll(0, _sender=ARTIST, _now=T0.add_seconds(DAY), _valid=False, _exception="NOT_PATRON")
    # after 2 periods artist claims 10 tez; claiming again pays nothing
    k.claim_payroll(0, _sender=ARTIST, _now=T0.add_seconds(2 * DAY + 5))
    s.verify(k.balance == sp.mutez(10 * TEZ))
    k.claim_payroll(0, _sender=ARTIST, _now=T0.add_seconds(2 * DAY + 6), _valid=False, _exception="NOTHING_VESTED")
    s.verify(k.balance == sp.mutez(10 * TEZ))
    # period 3 vests; patron cancels: refund only period 4 (5 tez); period 3 stays claimable
    k.cancel_payroll(0, _sender=PATRON, _now=T0.add_seconds(3 * DAY + 1))
    s.verify(k.balance == sp.mutez(5 * TEZ))
    k.cancel_payroll(0, _sender=PATRON, _now=T0.add_seconds(3 * DAY + 2), _valid=False, _exception="FULLY_VESTED")
    # much later, artist claims only the 5 tez that had vested at cancel
    k.claim_payroll(0, _sender=ARTIST, _now=T0.add_seconds(100 * DAY))
    s.verify(k.balance == sp.mutez(0))
    k.claim_payroll(0, _sender=ARTIST, _now=T0.add_seconds(101 * DAY), _valid=False)

    # second payroll: cancel before anything vests refunds everything, artist gets nothing
    k.start_payroll(artist=ARTIST, amount_per_period=sp.mutez(TEZ), periods=3, period_seconds=DAY,
                    _sender=PATRON, _amount=sp.mutez(3 * TEZ), _now=T0)
    k.cancel_payroll(1, _sender=PATRON, _now=T0.add_seconds(10))
    s.verify(k.balance == sp.mutez(0))
    k.claim_payroll(1, _sender=ARTIST, _now=T0.add_seconds(10 * DAY), _valid=False)

    # third: never cancelled, full term, one claim pays all and removes it
    k.start_payroll(artist=ARTIST, amount_per_period=sp.mutez(TEZ), periods=3, period_seconds=DAY,
                    _sender=PATRON, _amount=sp.mutez(3 * TEZ), _now=T0)
    k.claim_payroll(2, _sender=ARTIST, _now=T0.add_seconds(50 * DAY))
    s.verify(k.balance == sp.mutez(0))
    k.cancel_payroll(2, _sender=PATRON, _now=T0.add_seconds(51 * DAY), _valid=False)
