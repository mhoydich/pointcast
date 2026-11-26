"""Local compilation only. Public configuration required; never signs or sends."""
import os
import smartpy as sp
from contracts import m, fa2

@sp.add_test()
def compile_contract():
    target = os.environ['UFOGP_CONTRACT']
    if target not in ('seat', 'doubloon', 'dao'):
        raise ValueError('UFOGP_CONTRACT must be seat, doubloon, or dao')
    metadata = sp.scenario_utils.metadata_of_url(os.environ['UFOGP_METADATA_URI'])
    s = sp.test_scenario('ufogp_' + target, [fa2.t, fa2.main, m])
    if target == 'seat':
        seat_cap = int(os.environ['UFOGP_SEAT_CAP'])
        if seat_cap <= 0:
            raise ValueError('UFOGP_SEAT_CAP must be positive')
        contract = m.Seat(sp.address(os.environ['UFOGP_ADMIN']), metadata, seat_cap)
    elif target == 'doubloon':
        contract = m.Doubloon(sp.address(os.environ['UFOGP_ADMIN']), metadata, {
            'name': sp.bytes('0x' + b'UFOGP Doubloon'.hex()),
            'symbol': sp.bytes('0x' + b'DBL'.hex()),
            'decimals': sp.bytes('0x30'),
        })
    else:
        contract = m.DAO(sp.address(os.environ['UFOGP_SEAT']),
                         sp.address(os.environ['UFOGP_FOUNDER']), metadata)
    s += contract
