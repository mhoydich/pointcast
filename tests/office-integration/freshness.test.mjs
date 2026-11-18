import test from 'node:test';
import assert from 'node:assert/strict';
import {createFreshnessGuard,projectFreshness,OFFICE_END,POST_FRESHNESS_MS} from '../../public/office/freshness.mjs';
const start=OFFICE_END-20*60_000;
const iso=t=>new Date(t).toISOString();
const snapshot=(at=start)=>({schema:'pointcast.office-view/v1',state:'ok',observedAt:iso(at),expiresAt:iso(OFFICE_END),evidenceFresh:true,
 desks:[{handle:'@sol-1',eligible:true,facts:{lastPostAt:iso(at),postUrl:'https://pointcast.xyz/loom?to=%40sol-1',asOf:iso(at),stale:false}}],
 events:[{id:'fixture-post',at:iso(at)}],edges:[],merges:[{number:1767,verified:true}],blocked:[],errors:[]});
function harness(at=start) {
 let now=at,id=0;const timers=new Map(),changes=[];
 const guard=createFreshnessGuard({clock:()=>now,onChange:(data,reason)=>changes.push({data,reason}),schedule:(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;},cancel:id=>timers.delete(id)});
 return{guard,changes,timers,jump:at=>{now=at;},advance:at=>{while(true){const due=[...timers].filter(([,t])=>t.at<=at).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();}now=at;}};
}
test('idle open page ages lights with one-shot local alarms, without a new read',()=>{
 const h=harness(),source=snapshot(),before=structuredClone(source);h.guard.accept(source);
 assert.equal(h.changes.at(-1).data.desks[0].facts.stale,false);
 h.advance(start+POST_FRESHNESS_MS);
 assert.equal(h.changes.at(-1).data.desks[0].facts.stale,true);
 assert.equal(h.changes.filter(c=>c.reason==='read').length,1);
 assert.equal(h.timers.size,1,'only the hard-end alarm remains');
 assert.deepEqual(source,before,'source evidence and timestamps stay untouched');
 assert.equal(h.changes.at(-1).data.observedAt,source.observedAt);
 assert.equal(h.changes.at(-1).data.desks[0].facts.asOf,source.desks[0].facts.asOf);
});
test('provider evidence ages separately and cannot keep a current merge flame forever',()=>{
 const data=projectFreshness(snapshot(),start+120_000);
 assert.equal(data.evidenceFresh,false);assert.deepEqual(data.merges,snapshot().merges);
 assert.equal(data.desks[0].facts.stale,false,'post window remains fifteen minutes');
});
test('hard cutoff clears activity and leaves no further alarm, even without any snapshot',()=>{
 for(const withData of [false,true]){
  const h=harness(OFFICE_END-1000);if(withData)h.guard.accept(snapshot(OFFICE_END-1000));
  h.advance(OFFICE_END);const data=h.changes.at(-1).data;
  assert.equal(data.state,'ended');assert.equal(data.evidenceFresh,false);
  assert.ok(data.desks.every(d=>!d.eligible&&d.facts.stale));assert.deepEqual(data.events,[]);
  assert.equal(h.timers.size,0);assert.equal(h.guard.expired(),true);
 }
});
test('completion after cutoff cannot relight, even if transport ignored cancellation',()=>{
 const h=harness(OFFICE_END-1000),data=snapshot(OFFICE_END-1000);
 h.jump(OFFICE_END+1);h.guard.accept(data);
 assert.equal(h.changes.at(-1).data.state,'ended');assert.equal(h.changes.at(-1).data.desks[0].facts.stale,true);
 h.jump(start);h.guard.accept(data);assert.equal(h.changes.at(-1).data.state,'ended','wall-clock rollback cannot reopen the experiment');
});
test('resume after suspended timers immediately ages the page and observes an earlier server cutoff',()=>{
 const h=harness();const data=snapshot();data.expiresAt=iso(start+16*60_000);h.guard.accept(data);
 h.jump(start+POST_FRESHNESS_MS);h.guard.recheck();
 assert.equal(h.changes.at(-1).data.desks[0].facts.stale,true);
 h.jump(start+16*60_000);h.guard.recheck();assert.equal(h.changes.at(-1).data.state,'ended');
 assert.equal(h.changes.filter(c=>c.reason==='read').length,1);
 h.guard.accept(snapshot());assert.equal(h.changes.at(-1).data.state,'ended','a later response cannot extend the earlier cutoff');
 assert.equal(h.timers.size,0);
});
test('reply edge expires on its own local deadline even when author has newer activity',()=>{
 const h=harness(),source=snapshot();
 source.edges=[{id:'reply',at:iso(start-60000)}];
 const before=structuredClone(source);h.guard.accept(source);
 assert.equal(h.changes.at(-1).data.edges.length,1);
 h.advance(start+POST_FRESHNESS_MS-60000);
 assert.equal(h.changes.at(-1).data.edges.length,0);
 assert.equal(h.changes.at(-1).data.desks[0].facts.stale,false,'newer desk post still fresh');
 assert.equal(h.changes.filter(c=>c.reason==='read').length,1);
 assert.deepEqual(source,before);
 h.jump(OFFICE_END);h.guard.recheck();assert.deepEqual(h.changes.at(-1).data.edges,[]);
});
