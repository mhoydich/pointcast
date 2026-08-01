import smartpy as sp
from smartpy.templates import fa2_lib as fa2
main = fa2.main

@sp.module
def signal_stamps_module():
    import main
    class SaturdaySignalStampsFA2(main.Admin,main.Fungible,main.ChangeMetadata,main.OffchainviewTokenMetadata,main.OnchainviewBalanceOf):
        def __init__(self,administrator,metadata,token_metadata,edition_cap,max_token_id):
            main.OnchainviewBalanceOf.__init__(self); main.OffchainviewTokenMetadata.__init__(self); main.ChangeMetadata.__init__(self)
            main.Fungible.__init__(self,metadata,{},token_metadata); main.Admin.__init__(self,administrator)
            self.data.edition_cap=sp.cast(edition_cap,sp.nat); self.data.max_token_id=sp.cast(max_token_id,sp.nat)
            self.data.signal_supply=sp.cast(sp.big_map(),sp.big_map[sp.nat,sp.nat])
            self.data.claimed=sp.cast(sp.big_map(),sp.big_map[sp.pair[sp.address,sp.nat],sp.bool])

        @sp.entrypoint
        def mint_signal(self,token_id):
            sp.cast(token_id,sp.nat)
            assert token_id<=self.data.max_token_id,"TOKEN_ID_EXCEEDS_MAX"
            assert token_id in self.data.token_metadata,"TOKEN_NOT_REGISTERED"
            assert sp.amount==sp.tez(0),"NO_PAYMENT_ACCEPTED"
            key=(sp.sender,token_id)
            assert not(key in self.data.claimed),"ALREADY_CLAIMED"
            current=self.data.signal_supply.get(token_id,default=sp.nat(0))
            assert current<self.data.edition_cap,"EDITION_SOLD_OUT"
            self.data.claimed[key]=True; self.data.signal_supply[token_id]=current+1; self.data.supply[token_id]+=1
            self.data.ledger[key]=self.data.ledger.get(key,default=sp.nat(0))+1

        @sp.onchain_view()
        def get_mint_count(self,token_id):
            sp.cast(token_id,sp.nat); return self.data.signal_supply.get(token_id,default=sp.nat(0))

        @sp.onchain_view()
        def has_claimed(self,params):
            sp.cast(params,sp.record(claimer=sp.address,token_id=sp.nat)); return (params.claimer,params.token_id) in self.data.claimed

def make_signal_token_metadata():
    token_metadata=[]
    for token_id in range(50):
        token_metadata.append(sp.map(l={
            "":sp.scenario_utils.bytes_of_string("https://pointcast.xyz/collectibles/saturday-signal-stamps/metadata/%d.json"%token_id),
            "symbol":sp.scenario_utils.bytes_of_string("PCSS"),"name":sp.scenario_utils.bytes_of_string("Saturday Signal %02d"%(token_id+1)),"decimals":sp.scenario_utils.bytes_of_string("0")
        }))
    return token_metadata

@sp.add_test()
def test_saturday_signal_stamps():
    sc=sp.test_scenario("saturday_signal_stamps",signal_stamps_module); admin=sp.test_account("admin"); alice=sp.test_account("alice"); bob=sp.test_account("bob"); carol=sp.test_account("carol")
    c=signal_stamps_module.SaturdaySignalStampsFA2(administrator=admin.address,metadata=sp.scenario_utils.metadata_of_url("https://pointcast.xyz/collectibles/saturday-signal-stamps/contract.json"),token_metadata=make_signal_token_metadata(),edition_cap=2,max_token_id=49); sc+=c
    c.mint_signal(0,_sender=alice); sc.verify(c.data.signal_supply[0]==1); sc.verify(c.data.ledger[(alice.address,0)]==1)
    c.mint_signal(0,_sender=alice,_valid=False); c.mint_signal(0,_sender=bob); sc.verify(c.get_mint_count(0)==2)
    c.mint_signal(0,_sender=carol,_valid=False); c.mint_signal(49,_sender=alice); c.mint_signal(50,_sender=alice,_valid=False)
    c.mint_signal(1,_sender=alice,_amount=sp.tez(1),_valid=False); sc.verify(c.data.next_token_id==50)

@sp.add_test()
def mainnet_saturday_signal_stamps():
    sc=sp.test_scenario("saturday_signal_stamps_mainnet",signal_stamps_module)
    c=signal_stamps_module.SaturdaySignalStampsFA2(administrator=sp.address("tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw"),metadata=sp.scenario_utils.metadata_of_url("https://pointcast.xyz/collectibles/saturday-signal-stamps/contract.json"),token_metadata=make_signal_token_metadata(),edition_cap=100,max_token_id=49); sc+=c
    sc.verify(c.data.edition_cap==100); sc.verify(c.data.max_token_id==49); sc.verify(c.data.next_token_id==50)
