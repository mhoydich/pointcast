import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,placeBet,settle,quote,restore,standings,nextLap,RACE_BRIEFS,lockRound,submitResult,finalizeResult,reopenResult,budgetReceipt} from '../public/ai-grand-prix/engine.mjs';
const note='Local practice note: timer checks passed; no independently verified model run is claimed.';
function finish(s,id,winner){return finalizeResult(submitResult(lockRound(s,id),id,winner,note),id)}

test('stake enters pool and final winning payout includes stake',()=>{
 const s=initialState(),q=quote(s,'bug','sol',50),b=placeBet(s,'bug','sol',50);
 assert.equal(q.payout,116);assert.equal(b.balance,950);assert.equal(s.balance,1000);
 const done=finish(b,'bug','sol');assert.equal(done.balance,1066);assert.equal(done.tickets[0].payout,116);
 assert.throws(()=>finalizeResult(done,'bug'));assert.throws(()=>settle(done,'bug','sol'));assert.throws(()=>placeBet(done,'bug','sol',1));
});

test('losing and void rounds; no repeat refunds',()=>{
 const b=placeBet(initialState(),'bug','opus',100);assert.equal(finish(b,'bug','sol').balance,900);
 const v=settle(b,'bug','void');assert.equal(v.balance,1000);assert.equal(v.tickets[0].status,'refunded');assert.throws(()=>settle(v,'bug','void'));
});

test('invalid stakes and IDs never mutate balance',()=>{
 const s=initialState();for(const n of [0,-1,1.5,NaN,Infinity,1001,Number.MAX_SAFE_INTEGER])assert.throws(()=>placeBet(s,'bug','sol',n));
 for(const race of ['oops','__proto__'])assert.throws(()=>placeBet(s,race,'sol',1));
 assert.throws(()=>placeBet(s,'bug','bad',1));assert.equal(s.balance,1000);assert.equal(s.tickets.length,0);
});

test('all user bets settle using final pool and other rounds stay open',()=>{
 let s=placeBet(initialState(),'bug','sol',50);s=placeBet(s,'bug','opus',100);s=placeBet(s,'bug','sol',50);s=placeBet(s,'report','sol',100);
 const d=finish(s,'bug','sol');assert.equal(d.balance,950);assert.equal(d.tickets[0].payout,125);assert.equal(d.tickets[2].payout,125);assert.equal(d.tickets[3].status,'open');
});

test('restore safe fallback and successful open round trip',()=>{
 assert.equal(restore('bad').balance,1000);assert.equal(restore('{"version":1}').balance,1000);
 const b=placeBet(initialState(),'bug','sol',50);assert.deepEqual(restore(JSON.stringify(b)),b);
});

test('known price quote includes joint winners and zero for the known losing option',()=>{
 const s=initialState();assert.deepEqual(quote(s,'budget','sol',50),{payout:70,share:.2,multiple:1.4});
 assert.deepEqual(quote(s,'budget','sonnet',50),{payout:70,share:.2,multiple:1.4});
 assert.deepEqual(quote(s,'budget','opus',50),{payout:0,share:0,multiple:0});
 assert.deepEqual(budgetReceipt().winners,['sol','sonnet']);
});

test('price receipt uses only the published shared winners',()=>{
 let s=placeBet(initialState(),'budget','sol',50);s=placeBet(s,'budget','sonnet',50);s=placeBet(s,'budget','opus',50);
 const d=settle(s,'budget',['sol','sonnet']);assert.equal(d.balance,1000);assert.equal(d.tickets[0].payout,75);assert.equal(d.tickets[1].payout,75);assert.equal(d.tickets[2].payout,0);
 for(const winner of [[],['sol','sol'],'sol','opus',['opus','sonnet']])assert.throws(()=>settle(initialState(),'budget',winner));
 assert.throws(()=>lockRound(initialState(),'budget'));assert.throws(()=>finalizeResult(initialState(),'budget'));
});

test('locked predictions reject new bets and quotes and snapshot the published brief',()=>{
 const s=placeBet(initialState(),'bug','sol',50),locked=lockRound(s,'bug');
 assert.equal(locked.rounds.bug.status,'locked');assert.equal(locked.balance,950);assert.deepEqual(locked.rounds.bug.brief,RACE_BRIEFS.bug);
 assert.notEqual(locked.rounds.bug.brief,RACE_BRIEFS.bug);assert.equal(s.rounds.bug.status,'open');
 assert.throws(()=>placeBet(locked,'bug','opus',50));assert.throws(()=>quote(locked,'bug','opus',50));assert.throws(()=>lockRound(locked,'bug'));
 assert.deepEqual(restore(JSON.stringify(locked)),locked);
});

test('premature results and finalization are rejected',()=>{
 const s=initialState();assert.throws(()=>submitResult(s,'bug','sol',note));assert.throws(()=>finalizeResult(s,'bug'));assert.throws(()=>settle(s,'bug','sol'));
 const locked=lockRound(s,'bug');assert.throws(()=>finalizeResult(locked,'bug'));assert.throws(()=>settle(locked,'bug','sol'));
});

test('provisional receipt preserves stake and bankroll until finalization',()=>{
 const locked=lockRound(placeBet(initialState(),'bug','sol',50),'bug'),p=submitResult(locked,'bug','sol',note);
 assert.equal(p.rounds.bug.status,'provisional');assert.equal(p.rounds.bug.resultNote,note);assert.equal(p.balance,950);assert.equal(p.tickets[0].payout,null);assert.equal(p.tickets[0].status,'open');
 assert.equal(standings(p).find(x=>x.id==='sol').points,0);assert.throws(()=>placeBet(p,'bug','sol',1));assert.throws(()=>quote(p,'bug','sol',1));
 assert.deepEqual(restore(JSON.stringify(p)),p);assert.equal(finalizeResult(p,'bug').balance,1066);
});

test('local result note and winner IDs are bounded and validated',()=>{
 const s=lockRound(initialState(),'bug');
 for(const evidence of [null,1,'','too short',' '.repeat(30),'x'.repeat(2001)])assert.throws(()=>submitResult(s,'bug','sol',evidence));
 for(const winner of [null,'bad','void',[],['sol','sol'],['sol','bad']])assert.throws(()=>submitResult(s,'bug',winner,note));
 const p=submitResult(s,'bug',['sonnet','sol'],' '+note+' ');assert.equal(p.rounds.bug.winner,'sol,sonnet');assert.equal(p.rounds.bug.resultNote,note);
 assert.throws(()=>settle(p,'bug','sol'));assert.equal(s.rounds.bug.status,'locked');
});

test('revising a provisional receipt keeps the book locked and permits a corrected result',()=>{
 const p=submitResult(lockRound(placeBet(initialState(),'bug','sol',50),'bug'),'bug','sol',note),revised=reopenResult(p,'bug');
 assert.equal(revised.rounds.bug.status,'locked');assert.equal(revised.rounds.bug.winner,null);assert.equal(revised.rounds.bug.resultNote,null);assert.deepEqual(revised.rounds.bug.pools,p.rounds.bug.pools);assert.deepEqual(revised.rounds.bug.brief,p.rounds.bug.brief);
 assert.throws(()=>placeBet(revised,'bug','sol',1));assert.throws(()=>finalizeResult(revised,'bug'));assert.throws(()=>reopenResult(revised,'bug'));
 const done=finalizeResult(submitResult(revised,'bug','opus',note),'bug');assert.equal(done.balance,950);assert.equal(done.tickets[0].status,'lost');
});

test('void refunds in open, locked, and provisional phases without awarding podium points',()=>{
 const open=placeBet(initialState(),'bug','sol',50),locked=lockRound(open,'bug'),provisional=submitResult(locked,'bug','sol',note);
 for(const s of [open,locked,provisional]){const v=settle(s,'bug','void');assert.equal(v.balance,1000);assert.equal(v.tickets[0].payout,50);assert.equal(v.rounds.bug.status,'void');assert.ok(standings(v).every(x=>x.points===0));assert.throws(()=>settle(v,'bug','void'));assert.deepEqual(restore(JSON.stringify(v)),v);}
});

test('older v1 sessions acquire the price exercise and retain legacy settled outcomes without invented notes',()=>{
 const s=initialState();delete s.rounds.budget;delete s.history;delete s.lap;s.rounds.bug.status='settled';s.rounds.bug.winner='opus';
 const old=restore(JSON.stringify(s));assert.equal(old.rounds.budget.status,'open');assert.equal(old.lap,1);assert.equal(old.rounds.bug.winner,'opus');assert.equal(old.rounds.bug.resultNote,undefined);assert.equal(old.rounds.bug.brief,undefined);assert.equal(standings(old)[0].points,3);
});

test('restore rejects unsafe payouts, duplicate winners, or incomplete provisional receipts',()=>{
 const done=finish(placeBet(initialState(),'bug','sol',50),'bug','sol');
 for(const value of ['<img src=x onerror=alert(1)>',NaN,-1,1.5]){const bad=structuredClone(done);bad.tickets[0].payout=value;assert.equal(restore(JSON.stringify(bad)).tickets.length,0);}
 const duplicate=structuredClone(done);duplicate.rounds.bug.winner='sol,sol';assert.equal(restore(JSON.stringify(duplicate)).tickets.length,0);
 const provisional=submitResult(lockRound(placeBet(initialState(),'bug','sol',50),'bug'),'bug','sol',note);delete provisional.rounds.bug.resultNote;assert.equal(restore(JSON.stringify(provisional)).tickets.length,0);
});

test('next lap rejects locked and provisional races and preserves bankroll without repeat payouts',()=>{
 let s=placeBet(initialState(),'budget','sol',50);assert.throws(()=>nextLap(s));s=settle(s,'budget',['sol','sonnet']);s=lockRound(s,'bug');for(const r of ['arcade','report'])s=settle(s,r,'void');
 assert.throws(()=>nextLap(s));s=submitResult(s,'bug','sol',note);assert.throws(()=>nextLap(s));s=finalizeResult(s,'bug');
 const n=nextLap(s);assert.equal(n.balance,1020);assert.equal(n.lap,2);assert.equal(n.history[0].rounds.budget.winner,'sol,sonnet');assert.equal(n.history[0].rounds.bug.resultNote,note);assert.equal(n.rounds.budget.status,'open');assert.equal(n.tickets[0].lap,1);
 const after=settle(placeBet(n,'budget','sol',50),'budget',['sol','sonnet']);assert.equal(after.balance,1040);assert.equal(after.tickets[0].payout,70);assert.equal(after.tickets[1].lap,2);assert.equal(s.history.length,0);assert.deepEqual(restore(JSON.stringify(after)),after);
});

test('constructors split buildoff ties, omit price exercises and voids, and include archived laps',()=>{
 let s=settle(initialState(),'budget',['sol','sonnet']);s=finish(s,'bug','opus');s=finish(s,'arcade',['sol','sonnet']);s=settle(s,'report','void');
 const rows=standings(nextLap(s));assert.equal(rows[0].id,'opus');assert.equal(rows[0].points,3);assert.equal(rows.find(r=>r.id==='sol').points,1.5);assert.equal(rows.find(r=>r.id==='sonnet').shared,1);assert.ok(rows.every(r=>r.entered===2));
 const injected=structuredClone(s);injected.rounds.extra={status:'settled',winner:'opus'};assert.equal(standings(injected)[0].points,3);
});


test('shared provisional winners finalize against their combined locked pool once',()=>{
 let s=placeBet(initialState(),'arcade','sol',50);s=placeBet(s,'arcade','sonnet',50);s=placeBet(s,'arcade','opus',50);
 const locked=lockRound(s,'arcade'),provisional=submitResult(locked,'arcade',['sonnet','sol'],note);
 assert.equal(provisional.balance,850);const done=finalizeResult(provisional,'arcade');assert.equal(done.balance,1000);
 assert.equal(done.tickets[0].payout,75);assert.equal(done.tickets[1].payout,75);assert.equal(done.tickets[2].payout,0);
 assert.equal(standings(done).find(x=>x.id==='sol').points,1.5);assert.throws(()=>finalizeResult(done,'arcade'));
});

test('restore rejects extra pool fields instead of mixing known and untrusted totals',()=>{
 const s=placeBet(initialState(),'bug','sol',50);s.rounds.bug.pools.extra='unsafe';assert.equal(restore(JSON.stringify(s)).tickets.length,0);
});
