import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {derive} from '../public/loom-lab/progress/model.mjs';
import {ganttDomain,ganttRow,ganttGroups,ganttTicks,pct} from '../public/loom-lab/progress/gantt.mjs';
const root=new URL('../',import.meta.url);
const original={definitions:JSON.parse(readFileSync(new URL('src/data/loom-progress-jobs.json',root))),evidence:JSON.parse(readFileSync(new URL('src/data/loom-progress-evidence.json',root)))};
const model=()=>derive(structuredClone(original));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≈ ${b}`);

test('window runs from the hour before the first receipt to the hour after the snapshot',()=>{
 const m=model(),d=ganttDomain(m.jobs,m.evidence.capturedAt);
 assert.equal(new Date(d.start).toISOString(),'2026-11-14T13:00:00.000Z');
 assert.equal(new Date(d.end).toISOString(),'2026-11-14T17:00:00.000Z');
 assert.equal(d.now,Date.parse(m.evidence.capturedAt));
});

test('a bar starts at the claim receipt and ends at the result receipt',()=>{
 const m=model(),d=ganttDomain(m.jobs,m.evidence.capturedAt),j=m.jobs.find(j=>j.id==='daniel'),r=ganttRow(j,d);
 assert.equal(r.mark,'bar');assert.equal(r.bar.kind,'delivered');
 assert.equal(r.bar.from,Date.parse(j.claim.at));assert.equal(r.bar.to,Date.parse(j.done.at));
 near(r.bar.left,(Date.parse(j.claim.at)-d.start)/(d.end-d.start)*100);
 near(r.bar.left+r.bar.width,(Date.parse(j.done.at)-d.start)/(d.end-d.start)*100);
 near(r.bar.width,j.intervalMs/(d.end-d.start)*100);
 // synthetic: a two-hour span in a four-hour window is half the track
 const s=ganttRow({id:'x',owner:'sid',state:'delivered',intervalMs:2*3600e3,claim:{at:'2026-11-14T14:00:00Z'},done:{at:'2026-11-14T16:00:00Z'}},d);
 near(s.bar.left,25);near(s.bar.width,50);
});

test('missing claim timing gives a dot at the result, never a bar',()=>{
 const m=model(),d=ganttDomain(m.jobs,m.evidence.capturedAt),j=m.jobs.find(j=>j.id==='morning'),r=ganttRow(j,d);
 assert.equal(j.intervalMs,null);assert.equal(r.mark,'dot');assert.equal(r.bar,null);
 assert.equal(r.dot.role,'done');assert.equal(r.dot.at,Date.parse(j.done.at));
 const none=ganttRow({id:'y',owner:'sid',state:'unconfirmed',intervalMs:null,claim:null,done:null,partial:null},d);
 assert.equal(none.mark,'none');assert.equal(none.bar,null);assert.equal(none.dot,null);
});

test('a reversed receipt clock gets no bar',()=>{
 const x=structuredClone(original);x.evidence.messages['officenoun-tasks:m_3t0r3b3954'].at='2026-11-14T00:00:00Z';
 const m=derive(x),d=ganttDomain(m.jobs,m.evidence.capturedAt),r=ganttRow(m.jobs.find(j=>j.id==='study'),d);
 assert.equal(r.bar,null);assert.equal(r.mark,'dot');
});

test('a blocked item draws claim → partial receipt, then a waiting tail to the snapshot',()=>{
 const m=model(),d=ganttDomain(m.jobs,m.evidence.capturedAt),j=m.jobs.find(j=>j.id==='workfix'),r=ganttRow(j,d);
 assert.equal(r.state,'blocked');assert.equal(r.bar.kind,'blocked');
 assert.equal(r.bar.from,Date.parse(j.claim.at));assert.equal(r.bar.to,Date.parse(j.partial.at));
 assert.equal(r.tail.kind,'waiting');assert.equal(r.tail.to,d.now);near(r.tail.left+r.tail.width,pct(d.now,d));
});

test('rows group by seat and sort by start; ticks sit on Pacific hour edges with a day label',()=>{
 const m=model(),d=ganttDomain(m.jobs,m.evidence.capturedAt),g=ganttGroups(m.jobs,d,m.evidence.seats);
 assert.equal(g.length,1);assert.equal(g[0].owner,'sid');assert.equal(g[0].seat.name,'Sid');assert.equal(g[0].rows.length,7);
 const starts=g[0].rows.map(r=>r.bar?.from??r.dot?.at);assert.deepEqual(starts,[...starts].sort((a,b)=>a-b));
 const t=ganttTicks(d);assert.deepEqual(t.map(x=>x.hour),['5 AM','6 AM','7 AM','8 AM','9 AM']);
 assert.equal(t[0].day,'Sat, Nov 14');assert.equal(t[1].day,null);near(t[0].pct,0);near(t.at(-1).pct,100);
});
