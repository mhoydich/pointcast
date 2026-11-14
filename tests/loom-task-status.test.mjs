import test from 'node:test';
import assert from 'node:assert/strict';
import { taskSummaries } from '../public/loom-task-status.mjs';
import { fold } from '../src/lib/loom/fold.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { pickOpenTask } from '../src/lib/loom/welcome.mjs';
const desk={name:"Loom desk (Mike's agent)",kind:'agent',address:'@loomdesk'};
const sid={name:'Sid',kind:'agent',address:'@sid'};
const msg=(id,seq,body,extra={})=>({id,seq,body,at:new Date(Date.UTC(2026,10,14,12,0,seq)).toISOString(),kind:'note',from:sid,...extra});
const root=(body='OFF-57 · Fix task status')=>msg('m_root',1,body,{kind:'question',from:desk});
const reply=(id,seq,body,extra={})=>msg(id,seq,body,{parent:'m_root',...extra});
const status=messages=>taskSummaries(messages).get('m_root');
test('DONE note closes a simple task; MINE claims without answering, and an explicit REOPEN opens it',()=>{
 const r=root();const mine=reply('m_claim',2,'Nov 14 · Sid, AI agent · MINE OFF-57');
 const done=reply('m_done',3,'Nov 14 · Sid, AI agent · DONE OFF-57. Result linked.');
 assert.equal(status([r,mine]).status,'open');assert.equal(status([r,mine]).claimedBy.address,'@sid');
 const competing=reply('m_competing',3,'MINE OFF-57',{from:{name:'Other',kind:'agent',address:'@other'}});
 assert.equal(status([r,mine,competing]).claimedBy.address,'@sid');assert.equal(status([r,mine,competing]).source.id,'m_claim');
 const closed=status([r,mine,done]);assert.equal(closed.status,'done');assert.equal(closed.by.address,'@sid');assert.equal(closed.source.id,'m_done');assert.match(closed.line,/OFF-57 DONE.*@sid.*reported/);
 assert.equal(status([r,mine,done,reply('m_reopen',4,'REOPEN OFF-57. Needs a correction.')]).status,'open');
});
test('DONE D cannot close A/B/D; parts, blockers and ambiguous generic reports stay separate',()=>{
 const r=root('OFF-57 · Fix the morning\nA · Old job\nB · Status\nD · Edited text');
 const mine=reply('m_mine',2,'Nov 14 · Sid, AI agent · MINE A/B');
 const blocked=reply('m_block',3,'BLOCKED A · needs author edit');const done=reply('m_done',4,'2026-11-14 PT · DONE D · OFF-57');
 let s=status([r,mine,blocked,done]);assert.equal(s.status,'open');assert.equal(s.blocked,true);assert.deepEqual(s.parts.map(p=>[p.part,p.status]),[['A','open'],['B','open'],['D','done']]);assert.equal(s.parts[1].claimedBy.address,'@sid');
 s=status([r,mine,blocked,done,reply('m_ambiguous',5,'DONE with some work.')]);assert.equal(s.status,'open');assert.equal(s.ambiguousReports,1);
 assert.equal(status([r,reply('m_all',6,'DONE ALL · full root finished')]).status,'done');
});
test('wrong-task, examples, partials, hidden, echoes and nested DONE do not close a task',()=>{
 for(const m of [reply('m_bad',2,'DONE OFF-999'),reply('m_bad',2,'Template · DONE OFF-57'),reply('m_bad',2,'PARTIAL · DONE OFF-57'),reply('m_bad',2,'DONE',{hidden:true}),reply('m_bad',2,'DONE',{via:{id:'m_other'}}),reply('m_bad',2,'DONE',{parent:'m_claim'})])assert.equal(status([root(),m]).status,'open');
 assert.equal(taskSummaries([msg('m_notask',1,'How to post DONE on OFF-57')]).size,0);
});
test('fold recomputes after an edit/hide and historical playback does not borrow a future DONE',()=>{
 const ops=[{op:'append',...root()},{op:'append',...reply('m_done',2,'DONE OFF-57')}];
 assert.equal(fold(ops,{until:1}).messages[0].taskStatus.status,'open');assert.equal(fold(ops).messages[0].taskStatus.status,'done');
 assert.equal(fold([...ops,{op:'edit',id:'m_done',seq:3,at:'2026-11-14T14:00:00Z',body:'BLOCKED OFF-57'}]).messages[0].taskStatus.blocked,true);
 assert.equal(fold([...ops,{op:'hide',id:'m_done',seq:3}]).messages[0].taskStatus.status,'open');
 assert.ok(!JSON.stringify(ops).includes('taskStatus'),'projection does not mutate the persisted log');
});
test('JSON read has a one-line status and receipt; GET adds no writes and no secret',async()=>{
 const data=new Map();let writes=0;const kv={get:async k=>data.get(k)??null,put:async(k,v)=>{writes++;data.set(k,v);}};
 const post=async(to,body)=>(await handleLoom(new Request('https://pointcast.xyz/api/loom',{method:'POST',body:JSON.stringify({to,from:sid,kind:'note',body})}),{kv,firstHelloEnabled:false})).json();
 const r=await post('#task-check','OFF-99 · Small task');const done=await post(r.address,'DONE OFF-99. Draft attached.');const before=writes;
 const response=await handleLoom(new Request('https://pointcast.xyz/api/loom?to=%23task-check'),{kv});const json=await response.json();const s=json.messages.find(m=>m.id===r.message.id).taskStatus;
 assert.equal(s.status,'done');assert.equal(s.source.id,done.message.id);assert.equal(s.by.address,'@sid');assert.equal(s.line.includes('\n'),false);assert.equal(writes,before);assert.ok(!JSON.stringify(json).includes(done.editToken));
});
test('automatic starter picker skips a reported DONE note even when root body still says open',()=>{
 const a={op:'append',...root('OFF-57 · Old starter\nowner: none\nstatus: open')};const done={op:'append',...reply('m_done',2,'DONE OFF-57')};
 assert.deepEqual(pickOpenTask([a]),{id:'OFF-57'});assert.equal(pickOpenTask([a,done]),null);
});

test('an explicit root status done is honored; stale root open cannot undo a DONE reply',()=>{
 const r=root('OFF-57 · Small task\nstatus: done');
 assert.equal(status([r]).status,'done');assert.equal(status([r]).by.address,'@loomdesk');
 const block=reply('m_block',2,'BLOCKED OFF-57');assert.equal(status([r,block]).status,'open');
 assert.equal(status([{...r,editedAt:'2026-11-14T14:00:00Z'},block]).status,'done');
 assert.equal(status([root('OFF-57 · Small task\nstatus: done when reviewed')]).status,'open','a done-when instruction is not a completed status');
});
