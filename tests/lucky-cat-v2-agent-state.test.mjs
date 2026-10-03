import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {CATS,CHARMS} from '../public/lucky-cat/catalog.js';
import {freshDeskState,normalizeDeskState,readDeskState,writeDeskState,putDraft,getDraft,stageAction,receiptMatchesPending,reconcileDeskState,settleAction,classifyActionError,deskStorageKey} from '../public/lucky-cat/v2/agent-state.js';

const TASK='task-test-0001',KEY='retry-test-0001',AGENT='agent-test-0001';
const startBody={type:'task.start',taskId:TASK,goal:'Create a useful and verifiable draft.',plan:['Read the current source carefully.','Write a small usable improvement.','Verify the result against the goal.']};
const verifyBody={type:'task.verify',taskId:TASK,checks:[{check:'Inspect the saved output carefully.',outcome:'passed',evidence:'Observed the expected result in the saved output.'}],limitation:'This check did not test every browser.'};
const store=()=>{const map=new Map();return{getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),map};};
const receipt=body=>({id:'receipt-test-0001',body:structuredClone(body),type:body.type,delta:3,createdAt:'2026-10-03T12:00:00Z',guidance:null});

test('drafts survive reload and remain scoped to their signed identity',()=>{
 const storage=store();let state=putDraft(freshDeskState(TASK),`${TASK}:task.start`,{goal:'A draft with useful details',plan:'Read\nBuild\nCheck'});
 state.selectedTask=TASK;state.companion='ocean';assert.equal(writeDeskState(storage,AGENT,state,'2026-10-03T12:00:00Z'),true);
 const loaded=readDeskState(storage,AGENT);assert.equal(loaded.selectedTask,TASK);assert.equal(loaded.companion,'ocean');assert.equal(getDraft(loaded,`${TASK}:task.start`).goal,'A draft with useful details');
 assert.equal(readDeskState(storage,'different-agent').drafts.length,0);assert.equal(readDeskState(storage,null).drafts.length,0);
});
test('a saved exact retry body and key survive a browser reload',()=>{
 const storage=store();const staged=stageAction(freshDeskState(TASK),verifyBody,KEY,'2026-10-03T12:00:00Z');writeDeskState(storage,AGENT,staged.state);
 const loaded=readDeskState(storage,AGENT),retry=stageAction(loaded,verifyBody,'different-retry-key');assert.deepEqual(retry.body,staged.body);assert.equal(retry.body.idempotencyKey,KEY);
 assert.throws(()=>stageAction(loaded,{type:'charm.use',charmId:'second-look'}),/pending-action-first/);
});
test('phase advancement alone never clears an ambiguous submission',()=>{
 const {state}=stageAction(freshDeskState(TASK),verifyBody,KEY);const profile={tasks:[{id:TASK,phase:'verified'}],receipts:[]};
 assert.equal(reconcileDeskState(state,profile),state);assert.ok(state.pending);
});
test('receipt matching needs the same stable key and the same complete body',()=>{
 const {state,body}=stageAction(freshDeskState(TASK),verifyBody,KEY);const wrong=receipt({...body,limitation:'A different client submitted different limitations.'});
 assert.equal(receiptMatchesPending(wrong,state.pending),false);assert.equal(reconcileDeskState(state,{receipts:[wrong]}),state);
 assert.equal(receiptMatchesPending(receipt({...body,idempotencyKey:'another-retry-key'}),state.pending),false);
 assert.equal(receiptMatchesPending({...receipt(body),id:null},state.pending),false);
 const normalized=receipt({...body,limitation:`  ${body.limitation}  `});assert.equal(receiptMatchesPending(normalized,state.pending),true);assert.equal(reconcileDeskState(state,{receipts:[normalized]}).pending,null);
});
test('settling removes only the submitted phase draft and selects a newly saved task',()=>{
 let state=putDraft(freshDeskState(TASK),`${TASK}:task.start`,{goal:'Saved start'});state=putDraft(state,`${TASK}:task.deliver`,{summary:'Keep the later draft'});
 const staged=stageAction(state,startBody,KEY);const settled=settleAction(staged.state,receipt(staged.body));assert.equal(settled.pending,null);assert.equal(settled.selectedTask,TASK);assert.notEqual(settled.newTaskId,TASK);
 assert.equal(getDraft(settled,`${TASK}:task.start`),null);assert.equal(getDraft(settled,`${TASK}:task.deliver`).summary,'Keep the later draft');
});
test('collecting settles the companion and a charm receipt preserves its useful guide',()=>{
 let staged=stageAction(freshDeskState(TASK),{type:'cat.collect',catId:'ocean'},KEY);assert.equal(settleAction(staged.state,receipt(staged.body)).companion,'ocean');
 staged=stageAction(freshDeskState(TASK),{type:'charm.use',charmId:'second-look'},KEY);const r={...receipt(staged.body),guidance:CHARMS[1].guidance};let settled=settleAction(staged.state,r);assert.equal(settled.guide.title,CHARMS[1].guidance.title);assert.equal(settled.guide.receiptId,r.id);
 settled.guideChecks=[0,2];const storage=store();writeDeskState(storage,AGENT,settled);assert.deepEqual(readDeskState(storage,AGENT).guideChecks,[0,2]);assert.deepEqual(readDeskState(storage,AGENT).guide.steps,CHARMS[1].guidance.steps);
});
test('corrupt or unsupported state cannot create a mutation and drafts remain bounded',()=>{
 const storage=store();storage.setItem(deskStorageKey(AGENT),'{broken');assert.equal(readDeskState(storage,AGENT,TASK).pending,null);
 assert.equal(normalizeDeskState({version:99,pending:{body:startBody}},TASK).pending,null);assert.equal(normalizeDeskState({version:1,pending:{body:{type:'unknown',idempotencyKey:KEY}}},TASK).pending,null);
 let state=freshDeskState(TASK);for(let i=0;i<60;i++)state=putDraft(state,`task-${i}:task.start`,{goal:`draft ${i}`});assert.equal(state.drafts.length,52);assert.equal(getDraft(state,'task-0:task.start'),null);
 assert.throws(()=>putDraft(state,'huge',{goal:'x'.repeat(10001)}),/draft-too-large/);
});
test('a storage failure is explicit and oversized UTF-8 submissions never stage',()=>{
 assert.equal(writeDeskState({setItem(){throw new Error('quota');}},AGENT,freshDeskState(TASK)),false);
 assert.throws(()=>stageAction(freshDeskState(TASK),{type:'task.deliver',taskId:TASK,summary:'Useful delivered result',evidence:['🐈'.repeat(2500)]},KEY),/action-too-large/);
});
test('known rejection errors are definitive while failures and unknown codes retain the retry',()=>{
 for(const code of['goal-must-be-20-600-characters','checks-must-be-distinct','check-outcome-invalid','insufficient-luck','daily-action-limit','task-phase-conflict'])assert.equal(classifyActionError(new Error(code)).definitive,true,code);
 for(const error of[new TypeError('Failed to fetch'),new Error('lucky-cat-unavailable'),new Error('idempotency-key-conflict'),new Error('active-agent-key-not-found'),new Error('unknown future response'),new Error('database-must-be-reconfigured')])assert.equal(classifyActionError(error).retryable,true,error.message);
});

const html=await readFile(new URL('../src/lib/lucky-cat/v2-agents.html',import.meta.url),'utf8');
const bundle=(await build({entryPoints:[new URL('../public/lucky-cat/v2/agents.js',import.meta.url).pathname],bundle:true,write:false,format:'iife',platform:'browser',plugins:[{name:'local-agent-fixture',setup(b){
 b.onResolve({filter:/sculpture-scene\.js$/},()=>({path:'scene',namespace:'fixture'}));b.onResolve({filter:/agent-client\.js$/},()=>({path:'agent',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='scene'?`export function createSculptureScene(){return {setDesign(){},setReducedMotion(){},dispose(){}}}`:`export function canonical(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';}export const loadCredential=()=>Promise.resolve(globalThis.__agentMock.credential);export const registerBrowserAgent=()=>{throw new Error('No registration allowed in fixture');};export const signedRequest=(c,p,b)=>globalThis.__agentMock.request(c,p,b);`,loader:'js'}));
 }}]})).outputFiles[0].text;
const clone=value=>structuredClone(value);
function testProfile(tasks=[]){return{agentId:AGENT,balance:40,lifetimePoints:60,completedTasks:2,cats:['classic','ocean'],daily:{day:'2026-10-03',earned:8,remaining:52,taskStarts:1,maxTaskStarts:3,actionCount:3,maxActions:64},tasks,receipts:[],charms:[{id:'second-look',uses:1}],evidenceStatus:'self-reported'};}
function deliveredTask(){return{id:TASK,phase:'delivered',goal:startBody.goal,plan:startBody.plan,delivery:{summary:'Delivered a useful interface improvement.',evidence:['Inspect the saved preview at a local URL.']},verification:null,reflection:null,createdAt:'2026-10-03T12:00:00Z',updatedAt:'2026-10-03T12:05:00Z'};}
async function until(predicate){const deadline=Date.now()+15000;while(Date.now()<deadline){if(predicate())return;await new Promise(r=>setTimeout(r,10));}throw new Error('Fixture did not reach its expected state');}
async function fixture({profile=testProfile(),saved=null,request=null}={}){
 const dom=new JSDOM(html,{url:'http://127.0.0.1:8814/lucky-cat/agents/v2/',runScripts:'outside-only'});const w=dom.window;
 Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const mock=w.__agentMock={credential:{agentId:AGENT,expiresAt:'2027-01-01T00:00:00Z'},profile:clone(profile),calls:[],request:async(c,path,body)=>{mock.calls.push({path,body:body?clone(body):null});if(request)return request(mock,path,body);if(body)throw new Error('Unexpected write in read-only fixture');return{ok:true,profile:clone(mock.profile)};}};
 if(saved)w.localStorage.setItem(deskStorageKey(AGENT),JSON.stringify(saved));w.eval(bundle);await until(()=>w.document.querySelector('#agent-status').textContent==='Connected');return{dom,w,doc:w.document,mock,close(){w.dispatchEvent(new w.Event('pagehide'));dom.window.close();}};
}
function change(f,selector,value){const input=f.doc.querySelector(selector);assert.ok(input,selector);input.value=value;input.dispatchEvent(new f.w.Event('input',{bubbles:true}));return input;}
function click(f,selector){const button=f.doc.querySelector(selector);assert.ok(button,selector);button.click();}

test('the desk restores a real multi-check draft after reload and enforces 1–6 checks',async()=>{
 let state=freshDeskState(TASK);state.selectedTask=TASK;const p=testProfile([deliveredTask()]);const first=await fixture({profile:p,saved:state});
 try{
 assert.equal(first.doc.querySelector('[data-remove-check]').disabled,true);click(first,'#agent-add-check');assert.equal(first.doc.querySelectorAll('.agent-check-row').length,2);
 change(first,'[name="check-0"]','Check the normal path in the saved preview.');change(first,'[name="evidence-0"]','Observed the expected normal-path result.');change(first,'[data-check="outcome"]','passed');
 const outcomes=first.doc.querySelectorAll('[data-check="outcome"]');outcomes[1].value='failed';outcomes[1].dispatchEvent(new first.w.Event('change',{bubbles:true}));change(first,'[name="check-1"]','Check the empty result boundary case.');change(first,'[name="evidence-1"]','Observed an empty message that needs an improvement.');change(first,'[name="limitation"]','Only one browser was inspected in this preview.');
 const saved=JSON.parse(first.w.localStorage.getItem(deskStorageKey(AGENT)));first.close();const second=await fixture({profile:p,saved});
 try{assert.equal(second.doc.querySelectorAll('.agent-check-row').length,2);assert.equal(second.doc.querySelector('[name="check-0"]').value,'Check the normal path in the saved preview.');assert.equal(second.doc.querySelectorAll('[data-check="outcome"]')[1].value,'failed');for(let i=0;i<4;i++)click(second,'#agent-add-check');assert.equal(second.doc.querySelectorAll('.agent-check-row').length,6);assert.equal(second.doc.querySelector('#agent-add-check').disabled,true);assert.equal(second.mock.calls.filter(c=>c.body).length,0);}finally{second.close();}
 }finally{first.dom.window.close();}
});

test('lost confirmation retains the exact body until an exact idempotent replay returns a receipt',async()=>{
 let state=freshDeskState(TASK);state.selectedTask=TASK;let committed=null,awardCount=0;
 const f=await fixture({profile:testProfile([deliveredTask()]),saved:state,request:async(mock,path,body)=>{
 if(!body)return{ok:true,profile:clone(mock.profile)};
 if(!committed){committed=clone(body);awardCount++;mock.profile.tasks[0].phase='verified';mock.profile.tasks[0].verification={checks:clone(body.checks),limitation:body.limitation};mock.profile.balance+=8;throw new TypeError('Connection closed after the request');}
 assert.deepEqual(clone(body),committed);const r={...receipt(body),delta:8};mock.profile.receipts=[r];return{ok:true,receipt:r,profile:clone(mock.profile),replayed:true};
 }});
 try{
 change(f,'[name="check-0"]',verifyBody.checks[0].check);change(f,'[name="evidence-0"]',verifyBody.checks[0].evidence);change(f,'[data-check="outcome"]','passed');change(f,'[name="limitation"]',verifyBody.limitation);
 f.doc.querySelector('#agent-task-form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));await until(()=>!f.doc.querySelector('#agent-pending').hidden&&!f.doc.querySelector('#agent-retry').disabled);
 const saved=JSON.parse(f.w.localStorage.getItem(deskStorageKey(AGENT)));assert.deepEqual(saved.pending.body,committed);assert.deepEqual(JSON.parse(f.doc.querySelector('#agent-pending-body').textContent),committed);assert.equal(f.doc.querySelector('#agent-submit').disabled,true);
 click(f,'#agent-refresh');await until(()=>!f.doc.querySelector('#agent-refresh').disabled);assert.equal(f.doc.querySelector('#agent-pending').hidden,false,'advanced task without a matching receipt retains exact request');
 click(f,'#agent-retry');await until(()=>f.doc.querySelector('#agent-pending').hidden);assert.equal(awardCount,1);assert.equal(f.mock.calls.filter(c=>c.body).length,2);assert.equal(f.doc.querySelector('#agent-work-heading').textContent,'Carry the lesson forward.');assert.equal(f.doc.querySelector('#agent-toast').textContent,'Matching receipt restored. This step was awarded once.');
 }finally{f.close();}
});

test('all 60 collectible previews and previously earned charm guidance stay available without another spend',async()=>{
 const f=await fixture({profile:testProfile()});try{
 const found=new Set();for(let page=0;page<5;page++){for(const b of f.doc.querySelectorAll('[data-cat]'))found.add(b.dataset.cat);if(page<4)click(f,'#agent-cats-next');}assert.equal(found.size,60);assert.equal(found.size,CATS.length);
 const revisit=[...f.doc.querySelectorAll('#agent-charm-grid button')].find(b=>b.textContent==='Revisit guide');assert.ok(revisit);revisit.click();assert.equal(f.doc.querySelector('#agent-guidance-title').textContent,CHARMS[1].guidance.title);f.doc.querySelector('#agent-guidance-steps input').click();assert.equal(JSON.parse(f.w.localStorage.getItem(deskStorageKey(AGENT))).guideChecks.length,1);assert.equal(f.mock.calls.filter(c=>c.body).length,0);
 }finally{f.close();}
});
