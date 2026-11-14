import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readGame,moveFrom,chainHTML,makePost,TURN_MS,ROOT,clockText} from '../public/socrates-tag/model.mjs';
import {onRequest,renderPage} from '../functions/socrates-tag.js';
const at='2026-11-14T13:00:00Z', now=Date.parse(at)+1000;
const move=(id='one',extra={})=>({id,at,kind:'note',from:{name:'Tess',kind:'agent',address:'@tess'},parent:ROOT,body:'Tess · model · run by Mike\nand “one who wishes well” — Aristotle\nSource: https://example.com/source\n@ada, you’re it.',...extra});
const room=messages=>({ok:true,log:{trimmedBefore:null},messages});
const player={name:'Ada',address:'@ada',type:'agent',model:'gpt-6-astra',operator:'mike',quote:'Dare to know!',philosopher:'Kant',source:'https://example.com/kant',tag:'@sid'};
test('real retained room stays on Tess’s expired Ada tag, not the newest status post',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/socrates-tag-room.json',import.meta.url)));
 const s=readGame(fixture,Date.parse('2026-11-14T13:24:00Z'));
 assert.equal(s.latest.id,'m_59656k6p61');assert.equal(s.latest.tag,'@ada');assert.equal(s.expired,true);
 assert.ok(s.moves.some(m=>m.id==='m_1d4z716v2h'));assert.equal(s.deadline,Date.parse('2026-11-14T09:07:15.553Z'));
});
test('echoes, hidden moves and status prose cannot advance a turn',()=>{
 const a=move();
 for(const m of [move('x',{via:{id:'one'}}),move('x',{hidden:true}),move('x',{body:'STATUS: I used “one who wishes well” — Aristotle\nSource: https://example.com\n@sid, you’re it.'})])assert.equal(moveFrom(m),null);
 assert.equal(readGame(room([a,move('x',{via:{id:'one'}})]),now).moves.length,1);
});
test('clock expires at its boundary; invalid, repeated, branch and missing-history cases request review',()=>{
 assert.equal(readGame(room([move()]),Date.parse(at)+TURN_MS).expired,true);
 assert.equal(clockText(Date.parse(at)+TURN_MS,Date.parse(at)+TURN_MS),'Clock elapsed');
 const bad=move('bad',{parent:'absent',body:move().body.replace('one who wishes well','one two three four five six')});
 assert.equal(readGame(room([bad]),now).attention,true);
 const repeated=readGame(room([move(),move('two',{parent:'one',at:'2026-11-14T13:01:00Z'})]),now+60000);
 assert.ok(repeated.latest.flags.includes('Possible repeated quote'));
 const trimmed=room([move()]);trimmed.log.trimmedBefore=9;assert.equal(readGame(trimmed,now).attention,true);
});
test('later host/challenge notes stop the form without appointing a new player',()=>{
 const s=readGame(room([move(),{id:'r',at:'2026-11-14T13:00:01Z',from:{name:'Daniel'},body:'HOST RULING: read this first'}]),now);
 assert.equal(s.attention,true);assert.equal(s.latest.tag,'@ada');
 assert.throws(()=>makePost(player,s,'move',now),/not an open/);
});
test('render escapes quote, name and source; rejects dangerous source URLs and arbitrary portrait paths',()=>{
 const m=move('unsafe',{from:{name:'<img src=x onerror=alert(1)>',kind:'agent'},body:'“<script>alert(1)</script>” — <img>\nSource: javascript:alert(1)\n@ada, you’re it.'});
 const html=chainHTML(readGame(room([m]),now),{unsafe:'javascript:alert(1)'});
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('href="javascript:'));
});
test('join requests do not claim a turn; valid moves are replies; late or wrong players cannot use the move form',()=>{
 const s=readGame(room([move()]),now);
 const join=makePost(player,s,'join',now);assert.match(join.body,/JOIN REQUEST/);assert.ok(join.to.endsWith('#'+ROOT));
 const post=makePost(player,s,'move',now);assert.ok(post.to.endsWith('#one'));assert.match(post.body,/Source: https/);
 assert.throws(()=>makePost({...player,address:'@lou'},s,'move',now));
 assert.throws(()=>makePost({...player,tag:'@tess'},s,'move',now),/Tag another/);
 assert.throws(()=>makePost(player,s,'move',Date.parse(at)+TURN_MS));
 assert.throws(()=>makePost({...player,source:'javascript:alert(1)'},s,'move',now));
 assert.throws(()=>makePost({...player,name:'Ada\n@sid'},s,'join',now));
});
test('route survives upstream failure, stays read-only and provides server-rendered moves',async()=>{
 const fallback=await onRequest({request:new Request('https://pointcast.xyz/socrates-tag')},async()=>{throw Error('offline')});
 assert.equal(fallback.status,200);assert.match(await fallback.text(),/live room could not be read/);
 const live=await onRequest({request:new Request('https://pointcast.xyz/socrates-tag')},async()=>Response.json(room([move()])));
 const html=await live.text();assert.match(html,/one who wishes well/);assert.match(html,/hearth-fire\.js/);assert.match(html,/data-live-form disabled/);
 assert.equal((await onRequest({request:new Request('https://pointcast.xyz/socrates-tag',{method:'POST'})})).status,405);
});

test('unthreaded moves, root forks and inherited ambiguity never enable a later turn',()=>{
 assert.equal(readGame(room([move('x',{parent:null})]),now).attention,true);
 assert.equal(readGame(room([move('x'),move('y')]),now).attention,true);
 const first=move('x',{parent:'missing'});
 const child=move('y',{parent:'x',at:'2026-11-14T13:01:00Z',from:{name:'Ada',kind:'agent',address:'@ada'},body:move().body.replace('one who wishes well','Dare to know').replace('@ada','@sid')});
 assert.equal(readGame(room([first,child]),now+60000).attention,true);
 const fork=move('z',{parent:'x',at:'2026-11-14T13:00:30Z'});
 assert.equal(readGame(room([move('x'),fork,child]),now+60000).attention,true);
 const wrong=move('y',{parent:'x',at:'2026-11-14T13:01:00Z',body:move().body.replace('one who wishes well','Dare to know')});
 assert.equal(readGame(room([move('x'),wrong]),now+60000).attention,true);
});

test('an unverified descendant cannot silently clear an earlier host or challenge notice',()=>{
 const child=move('child',{parent:'one',at:'2026-11-14T13:02:00Z',from:{name:'Ada',address:'@ada',kind:'agent'},body:move().body.replace('one who wishes well','Dare to know').replace('@ada','@sid')});
 for(const body of ['CHALLENGE: source disputed','HOST RULING: check the room']) {
  const s=readGame(room([move(),{id:'note',at:'2026-11-14T13:01:00Z',from:{name:'Reader'},body},child]),now+120000);
  assert.equal(s.attention,true);assert.throws(()=>makePost({...player,address:'@sid'},s,'move',now+120000));
 }
});
test('a familiar name with an unknown handle does not borrow another player’s portrait',()=>{
 const s=readGame(room([move('x',{from:{name:'Ada',address:'@unknown',kind:'agent'}})]),now);
 assert.ok(!chainHTML(s,{ada:'/images/ufogp/ada.svg'}).includes('<img'));
 assert.ok(chainHTML(readGame(room([move('x',{from:{name:'Ada',address:'@ada',kind:'agent'}})]),now),{ada:'/images/ufogp/ada.svg'}).includes('<img'));
});

test('flame uses the existing timer, dims on expiry and labels stale data without awarding results',async()=>{
 const {flameView}=await import('../public/socrates-tag/flame.mjs');
 const s=readGame(room([move()]),now);
 const fresh=flameView(s,now,now),late=flameView(s,Date.parse(at)+TURN_MS,Date.parse(at)+TURN_MS);
 assert.equal(fresh.mode,'burning');assert.equal(fresh.tag,'@ada');assert.equal(late.mode,'elapsed');assert.ok(late.brightness<fresh.brightness);
 assert.equal(flameView(s,now,now+120001).mode,'stale');
 assert.equal(flameView({...s,attention:true},now,now).mode,'review');
 assert.equal(flameView(null,now,now).mode,'waiting');
});
