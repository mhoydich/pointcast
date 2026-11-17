import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {derive,intervalLabel} from '../public/loom-lab/progress/model.mjs';
const root=new URL('../',import.meta.url);
const original={definitions:JSON.parse(readFileSync(new URL('src/data/loom-progress-jobs.json',root))),evidence:JSON.parse(readFileSync(new URL('src/data/loom-progress-evidence.json',root)))};
const copy=()=>structuredClone(original);
test('one scoped result per job; instruction carrier does not complete the incoming check',()=>{
 const m=derive(copy());assert.deepEqual(m.summary,{selected:7,delivered:6,blocked:1,unconfirmed:0,artifactPrs:3});assert.equal(m.firstCheck.done,false);assert.equal(m.jobs.find(j=>j.id==='daniel').prs.length,1);assert.equal(m.jobs.find(j=>j.id==='handoff').prs.length,0);
});
test('a hidden final or another author cannot be attributed as this seat’s delivery',()=>{
 for(const change of ['hidden','author']){const d=copy();const x=d.evidence.messages['officenoun-tasks:m_3t0r3b3954'];if(change==='hidden')x.hidden=true;else x.from.address='@lou';const m=derive(d);assert.equal(m.jobs.find(j=>j.id==='study').state,'unconfirmed');assert.equal(m.summary.delivered,5);assert.equal(m.jobs.find(j=>j.id==='study').intervalMs,null);}
});
test('missing claim keeps a retained result but yields unknown elapsed time; zero is different',()=>{
 const j=derive(copy()).jobs.find(j=>j.id==='morning');assert.equal(j.state,'delivered');assert.equal(j.intervalMs,null);assert.ok(j.flags.length);assert.equal(intervalLabel(null),'Unavailable');assert.equal(intervalLabel(0),'0m 0s');
});
test('a pasted DONE template in a question is not completion; dated reply headers are read',()=>{
 const d=copy();d.evidence.context.firstCheckReplies=[{body:'Question about this form:\nDONE FIRST-CHECK\nIs that right?'}];assert.equal(derive(d).firstCheck.done,false);d.evidence.context.firstCheckReplies=[{body:'2026-11-14 PT · MINE FIRST-CHECK · New AI agent'},{body:'2026-11-14 PT · DONE FIRST-CHECK · New AI agent'}];assert.deepEqual(derive(d).firstCheck,{claimed:true,done:true});
});
test('a reversed receipt clock is flagged rather than converted into effort',()=>{
 const d=copy();d.evidence.messages['officenoun-tasks:m_3t0r3b3954'].at='2026-11-14T00:00:00Z';const j=derive(d).jobs.find(j=>j.id==='study');assert.equal(j.intervalMs,null);assert.ok(j.flags.some(s=>s.includes('order')));
});
