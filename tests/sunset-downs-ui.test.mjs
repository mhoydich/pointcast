import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import * as engine from '../public/sunset-downs/engine.mjs';
import * as story from '../public/sunset-downs/story.mjs';
const HTML=readFileSync(new URL('../public/sunset-downs/index.html',import.meta.url),'utf8');
const APP=readFileSync(new URL('../public/sunset-downs/app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'');
const AT=new Date('2026-10-19T18:00:00Z');
const AGENT='pci_'+ 'a'.repeat(32);
const copy=value=>structuredClone(value);
const control=()=>({agentId:AGENT,privateKey:{localTestKey:true},publicKey:{localTestPublicKey:true},pending:null});
const stable=()=>({agentId:AGENT,name:'Marquee Stables',ownerLabel:'An independent agent',horseName:'Second Billing',archetype:'stunt-double',balance:1000,starts:0,wins:0,earned:0});
const emptyProfile=()=>({agentId:AGENT,stable:null,entries:[],receipts:[]});
const ownedProfile=()=>({...emptyProfile(),stable:stable()});
function publicFeed(){return {ok:true,now:AT.toISOString(),races:engine.raceCards(AT).map(c=>({...c,entrants:engine.houseEntrants(),result:null})),leaderboard:[]};}
async function flush(){for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));}
async function until(check,message='DOM flow did not complete'){for(let i=0;i<50;i++){if(check())return;await flush();}assert.fail(message);}
/** Unit-DOM harness only: browser storage and SDK boundaries are mocked; real crypto and SQLite live in API tests. */
async function session(options={}){
 const dom=new JSDOM(HTML,{url:'https://pointcast.xyz/sunset-downs/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 let saved=options.control?copy(options.control):null,serverProfile=copy(options.profile??emptyProfile()),feed=copy(options.feed??publicFeed()),offline=Boolean(options.offline),locked=false;
 const calls={register:0,actions:[],fetches:0,profiles:0,keygen:0},errors=[];
 const frames=new Map();let frame=0;
 class Clock extends Date{constructor(...values){super(...(values.length?values:[AT.getTime()]));}static now(){return AT.getTime();}}
 Object.assign(w,engine,story,{structuredClone,Date:Clock});
 Object.defineProperty(w,'crypto',{value:globalThis.crypto});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.matchMedia=()=>({matches:Boolean(options.reducedMotion),addEventListener(){},removeEventListener(){}});
 w.requestAnimationFrame=fn=>{frames.set(++frame,fn);return frame;};w.cancelAnimationFrame=id=>frames.delete(id);
 w.setInterval=()=>1;w.clearInterval=()=>{};
 Object.defineProperty(w.navigator,'locks',{value:{async request(name,config,work){if(locked)return work(null);locked=true;try{return await work({name});}finally{locked=false;}}}});
 const database={createObjectStore(){},close(){},transaction(){const tx={objectStore(){return{get(){const request={};queueMicrotask(()=>{request.result=copy(saved);request.onsuccess?.();});return request;},put(record){saved=copy(record);queueMicrotask(()=>tx.oncomplete?.());}}}};return tx;}};
 Object.defineProperty(w,'indexedDB',{value:{open(){const request={result:database};queueMicrotask(()=>request.onsuccess?.());return request;}}});
 w.generateAgentKeys=async()=>{calls.keygen++;return{privateKey:{localTestKey:true},publicKey:{localTestPublicKey:true}};};
 w.registerAgent=async args=>{calls.register++;assert.ok(args.keys.privateKey);assert.ok(saved?.privateKey,'key must be stored before registry writes');return{ok:true,agent:{agent_id:AGENT}};};
 w.getProfile=async()=>{calls.profiles++;return options.getProfile?options.getProfile(calls.profiles,copy(serverProfile)):{ok:true,profile:copy(serverProfile)};};
 w.performAction=async({body})=>{calls.actions.push(copy(body));assert.equal(saved.pending.idempotencyKey,body.idempotencyKey,'action must be stored before it is sent');if(options.performAction)return options.performAction(body,serverProfile,calls);
  if(body.type==='stable.create')serverProfile.stable={...stable(),name:body.name,ownerLabel:body.ownerLabel,horseName:body.horseName,archetype:body.archetype};
  if(body.type==='race.enter'){serverProfile.stable.balance-=50;serverProfile.stable.starts++;serverProfile.entries.push({raceId:body.raceId,status:'open',postAt:engine.getRace(body.raceId,AT).postAt,award:0});}
  return{ok:true,profile:copy(serverProfile),receipt:{id:'local-test-receipt'}};
 };
 w.fetch=async()=>{calls.fetches++;if(offline)throw new Error('test offline');return{ok:true,async json(){return copy(feed);}};};
 w.addEventListener('error',e=>{errors.push(e.error??new Error(e.message));e.preventDefault();});
 const hooks=await w.eval(`(async()=>{${APP}\nreturn {refresh,loadProfile};})()`);
 await flush();
 const el=id=>w.document.getElementById(id);
 return{dom,w,el,hooks,calls,errors,frames,saved:()=>copy(saved),profile:()=>copy(serverProfile),setOffline:v=>{offline=v;},setFeed:v=>{feed=copy(v);},submit(){el('stable-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));},click:id=>el(id).click(),close(){assert.deepEqual(errors,[]);w.close();}};
}

test('public card and board render as escaped text, with today/tomorrow and six characters',async()=>{
 const feed=publicFeed();feed.races[0].name='<img src=x onerror=alert(1)>';feed.leaderboard=[{...stable(),name:'<img src=x onerror=alert(2)>',horseName:'<script>bad()</script>',ownerLabel:'<b>owner</b>'}];
 const x=await session({feed});try{
  assert.equal(x.w.document.querySelectorAll('.race-card').length,3);assert.equal(x.w.document.querySelectorAll('.cast-card').length,6);
  assert.match(x.el('races').textContent,/<img src=x/);assert.equal(x.el('races').querySelector('img'),null);
  assert.match(x.el('leaderboard').textContent,/<script>bad/);assert.equal(x.el('leaderboard').querySelector('script,img,b'),null);
  assert.ok([...x.w.document.querySelectorAll('[data-enter]')].every(b=>b.disabled));
  x.click('tomorrow-tab');assert.equal(x.el('tomorrow-tab').getAttribute('aria-pressed'),'true');assert.match(x.el('card-date').textContent,/TUESDAY, OCTOBER 20/);
 }finally{x.close();}
});
test('signup stores the control key before registration and an entry records one 50-credit debit',async()=>{
 const x=await session();try{
  assert.equal(x.el('stable-form').hidden,false);assert.equal(x.el('create-stable').disabled,false);
  x.el('stable-name').value='The Last Picture';x.el('owner-name').value='A local owner';x.el('horse-name').value='A New Star';x.el('archetype').value='golden-hour';
  x.submit();await until(()=>x.el('stable-form').hidden,'stable creation');
  assert.equal(x.calls.register,1);assert.equal(x.calls.keygen,1);assert.equal(x.saved().agentId,AGENT);assert.equal(x.saved().pending,null);assert.match(x.el('stable-profile').textContent,/1,000/);
  const button=x.w.document.querySelector('[data-enter]');assert.equal(button.disabled,false);button.click();await until(()=>x.profile().stable.balance===950&&x.saved().pending===null,'entry result');
  assert.equal(x.calls.actions.length,2);assert.equal(x.calls.actions[1].type,'race.enter');assert.equal(x.profile().entries.length,1);assert.match(x.el('stable-profile').textContent,/950/);
  assert.equal(x.w.document.querySelector(`[data-enter="${x.profile().entries[0].raceId}"]`).disabled,true);
 }finally{x.close();}
});
test('the card disables a post even if an old feed still labels its state open',async()=>{
 const feed=publicFeed();feed.races[0].postAt=new Date(AT.getTime()-1).toISOString();feed.races[0].status='open';
 const x=await session({control:control(),profile:ownedProfile(),feed});try{assert.equal(x.w.document.querySelector('[data-enter]').disabled,true);assert.match(x.w.document.querySelector('.race-card').textContent,/Gates closed/);assert.equal(x.calls.actions.length,0);}finally{x.close();}
});
test('feed failure pauses entries and signup while story and exhibition remain available',async()=>{
 const x=await session({control:control(),profile:ownedProfile()});try{
  assert.equal(x.w.document.querySelector('[data-enter]').disabled,false);
  x.setOffline(true);await x.hooks.refresh();assert.equal(x.el('service-note').dataset.error,'true');assert.ok([...x.w.document.querySelectorAll('[data-enter]')].every(b=>b.disabled));
  assert.equal(x.w.document.querySelectorAll('.cast-card').length,6);
  x.click('screen-test');x.click('skip-race');assert.equal(x.el('finish-results').children.length,6);assert.equal(x.calls.actions.length,0);assert.equal(x.profile().stable.balance,1000);
 }finally{x.close();}
});
test('screen-test skip and reduced motion finish locally without entries or awards',async()=>{
 for(const reducedMotion of [false,true]){
  const x=await session({control:control(),profile:ownedProfile(),reducedMotion});try{
   x.click('screen-test');assert.equal(x.el('race-theatre').hidden,false);if(!reducedMotion){assert.equal(x.el('finish-results').children.length,0);x.click('skip-race');}
   assert.equal(x.el('finish-results').children.length,6);assert.equal(x.el('skip-race').hidden,true);assert.equal(x.w.document.activeElement,x.el('finish-results'));assert.match(x.el('theatre-note').textContent,/No entries, purses, or stable records change/);
   assert.equal(x.calls.actions.length,0);assert.equal(x.profile().stable.balance,1000);assert.equal(x.profile().entries.length,0);
  }finally{x.close();}
 }
});
test('a saved pending entry cannot silently replace a different race; retry sends the exact stored body',async()=>{
 const saved=control();saved.pending={type:'race.enter',raceId:'sd-2026-10-19-noon',idempotencyKey:'pending-entry-001'};
 const x=await session({control:saved,profile:ownedProfile()});try{
  assert.equal(x.el('retry-request').hidden,false);x.w.document.querySelector('[data-enter="sd-2026-10-19-matinee"]').click();await flush();
  assert.equal(x.calls.actions.length,0);assert.match(x.el('stable-message').textContent,/Retry saved request/);
  x.click('retry-request');await until(()=>x.saved().pending===null,'pending retry');assert.equal(x.calls.actions.length,1);assert.deepEqual(x.calls.actions[0],saved.pending);assert.equal(x.profile().stable.balance,950);
 }finally{x.close();}
});
test('a delayed pre-action profile cannot overwrite a newer action balance',async()=>{
 let resolveOld;const old=new Promise(resolve=>{resolveOld=resolve;});
 const x=await session({control:control(),profile:ownedProfile(),getProfile(call,current){return call===2?old:{ok:true,profile:current};}});try{
  const refresh=x.hooks.refresh();await until(()=>x.calls.profiles===2,'delayed profile request');
  x.w.document.querySelector('[data-enter]').click();await until(()=>x.profile().stable.balance===950&&x.saved().pending===null,'new action balance');
  resolveOld({ok:true,profile:ownedProfile()});await refresh;await flush();assert.match(x.el('stable-profile').textContent,/950/);assert.doesNotMatch(x.el('stable-profile').textContent,/1,000/);assert.equal(x.calls.actions.length,1);
 }finally{x.close();}
});


test('an unavailable initial feed keeps new stable registration disabled',async()=>{
 const x=await session({offline:true});try{assert.equal(x.el('create-stable').disabled,true);assert.equal(x.el('service-note').dataset.error,'true');x.submit();await flush();assert.equal(x.calls.register,0);assert.equal(x.calls.actions.length,0);}finally{x.close();}
});
test('an uncertain write retains its stored idempotency key and explicit retry sends the exact request',async()=>{
 const x=await session({control:control(),profile:ownedProfile(),performAction(body,p,calls){if(calls.actions.length===1)throw new Error('network interrupted');p.stable.balance-=50;p.stable.starts++;p.entries.push({raceId:body.raceId,status:'open',postAt:engine.getRace(body.raceId,AT).postAt,award:0});return{ok:true,profile:copy(p)};}});try{
  x.w.document.querySelector('[data-enter]').click();await until(()=>x.calls.actions.length===1&&!x.el('retry-request').hidden,'saved uncertain action');
  assert.equal(x.profile().stable.balance,1000);const pending=x.saved().pending;assert.ok(pending.idempotencyKey);assert.equal(x.el('retry-request').disabled,false);
  x.click('retry-request');await until(()=>x.saved().pending===null,'retry completion');assert.equal(x.calls.actions.length,2);assert.deepEqual(x.calls.actions[0],x.calls.actions[1]);assert.deepEqual(x.calls.actions[0],pending);assert.equal(x.profile().stable.balance,950);
 }finally{x.close();}
});

test('repeated signup clicks while key registration is pending produce one identity and stable action',async()=>{
 const x=await session();try{
  x.el('stable-name').value='One Picture';x.el('owner-name').value='One Owner';x.el('horse-name').value='One Take';
  x.submit();x.submit();await until(()=>x.el('stable-form').hidden,'guarded double submit');await flush();
  assert.equal(x.calls.keygen,1);assert.equal(x.calls.register,1);assert.equal(x.calls.actions.length,1);assert.equal(x.profile().stable.balance,1000);
 }finally{x.close();}
});
test('recorded daily replay and repeat viewing display the same finish without further ledger calls',async()=>{
 const feed=publicFeed(),result=engine.simulateRace('ab'.repeat(16),engine.houseEntrants());feed.races[0].status='settled';feed.races[0].result=result;
 const p=ownedProfile();p.stable.balance=1250;p.stable.earned=300;
 const x=await session({control:control(),profile:p,feed});try{
  for(let i=0;i<2;i++){x.w.document.querySelector('[data-watch]').click();x.click('skip-race');assert.equal(x.el('finish-results').children.length,6);assert.match(x.el('theatre-note').textContent,/cannot change the result or pay a purse again/);assert.match(x.el('finish-results').children[0].textContent,new RegExp(result.finish[0].name));}
  assert.equal(x.calls.actions.length,0);assert.equal(x.profile().stable.balance,1250);assert.equal(x.profile().stable.earned,300);
 }finally{x.close();}
});
