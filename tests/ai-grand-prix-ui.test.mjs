import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import * as engine from '../public/ai-grand-prix/engine.mjs';
const html=readFileSync(new URL('../public/ai-grand-prix/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/ai-grand-prix/app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
function session(saved){
 const dom=new JSDOM(html,{url:'https://pointcast.xyz/ai-grand-prix/',runScripts:'outside-only'}),w=dom.window,tools={};
 Object.assign(w,engine,{structuredClone});
 if(saved)w.localStorage.setItem('pointcast-ai-market-v1',JSON.stringify(saved));
 Object.defineProperty(w.document,'modelContext',{value:{registerTool(t){tools[t.name]=t;}}});
 w.eval(app);
 const el=id=>w.document.getElementById(id), click=id=>el(id).click(), submit=id=>el(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const choose=id=>w.document.querySelector(`[data-progress="${id}"]`).click();
 const state=()=>JSON.parse(w.localStorage.getItem('pointcast-ai-market-v1'));
 return {dom,w,tools,el,click,submit,choose,state};
}

test('price exercise page quotes the known tie and awards no podium points',()=>{
 const x=session();try{
  assert.equal(x.el('return').textContent,'70 pts');x.submit('bet-form');assert.equal(x.state().balance,950);
  x.click('budget-finish');assert.equal(x.state().balance,1020);assert.equal(x.el('budget-receipt').hidden,false);
  assert.ok(engine.standings(x.state()).every(r=>r.points===0));assert.equal(x.el('place').disabled,true);
 }finally{x.dom.window.close();}
});

test('page locks, revises, finalizes once, escapes notes, and exports the frozen receipt',async()=>{
 const x=session();try{
  x.choose('bug');x.submit('bet-form');x.click('lock-round');assert.equal(x.state().rounds.bug.status,'locked');assert.equal(x.el('place').disabled,true);assert.equal(x.w.document.activeElement,x.el('winner'));
  assert.throws(()=>x.tools.place_play_prediction.execute({race:'bug',model:'sol',stake:1}));
  x.el('result-note').value='too short';x.submit('result-form');assert.equal(x.state().rounds.bug.status,'locked');
  const note='Local practice: all timer checks passed. <img src=x onerror=alert(1)> is literal evidence text.';
  x.el('result-note').value=note;x.submit('result-form');assert.equal(x.state().rounds.bug.status,'provisional');assert.equal(x.state().balance,950);assert.equal(x.w.document.activeElement,x.el('finalize-result'));
  assert.equal(x.el('provisional-note').textContent,note);assert.equal(x.el('results').querySelector('img'),null);
  x.click('revise-result');assert.equal(x.state().rounds.bug.status,'locked');assert.equal(x.el('result-note').value,note);assert.equal(x.el('place').disabled,true);assert.equal(x.w.document.activeElement,x.el('result-note'));

  x.submit('result-form');x.click('finalize-result');assert.equal(x.state().balance,1066);assert.equal(x.state().tickets[0].payout,116);assert.equal(x.w.document.activeElement,x.el('resolution-note'));
  x.click('finalize-result');assert.equal(x.state().balance,1066);
  let blob,filename;x.w.Blob=Blob;x.w.URL.createObjectURL=b=>{blob=b;return 'blob:receipt'};x.w.URL.revokeObjectURL=()=>{};
  x.w.HTMLAnchorElement.prototype.click=function(){filename=this.download;};x.click('export-season');
  const receipt=JSON.parse(await blob.text());assert.equal(filename,'pointcast-race-lab-lap-1.json');
  assert.equal(receipt.format,'pointcast-ai-grand-prix-race-lab-v3');assert.equal(receipt.currentRounds.bug.resultNote,note);
  assert.deepEqual(receipt.currentRounds.bug.brief,engine.RACE_BRIEFS.bug);assert.equal(receipt.balance,1066);
  x.choose('arcade');assert.equal(x.el('result-note').value,'');
 }finally{x.dom.window.close();}
});

test('legacy sessions survive page load and cash preview cannot spend or resolve',()=>{
 const old=engine.initialState();old.balance=1066;old.rounds.bug.status='settled';old.rounds.bug.winner='sol';
 old.tickets=[{id:1,race:'bug',model:'sol',stake:50,status:'won',payout:116,lap:1}];
 const x=session(old);try{
  assert.equal(x.el('balance').textContent,'1,066');assert.match(x.el('results').textContent,/Legacy practice result/);
  x.click('cash-mode');assert.equal(x.el('place').disabled,true);assert.equal(x.el('demo-control').hidden,true);
  x.submit('bet-form');assert.equal(x.tools.read_play_market.execute().balance,1066);
  assert.throws(()=>x.tools.place_play_prediction.execute({race:'budget',model:'sol',stake:1}));
  x.click('play-mode');x.click('budget-finish');for(const id of ['arcade','report']){x.choose(id);x.click('void-round');}
  assert.equal(x.el('next-lap').disabled,false);x.click('next-lap');assert.equal(x.state().lap,2);assert.equal(x.state().balance,1066);
  assert.equal(x.state().history[0].rounds.bug.resultNote,undefined);assert.equal(x.state().tickets.length,1);
 }finally{x.dom.window.close();}
});
