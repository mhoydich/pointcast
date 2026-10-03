import {canonical} from '../agent-client.js';

export const DESK_VERSION=1;
const ACTIONS=new Set(['task.start','task.deliver','task.verify','task.reflect','cat.collect','charm.use']);
const id=()=>crypto.randomUUID();
export const deskStorageKey=agentId=>`lucky-cat-v2-desk:${agentId||'unconnected'}`;
export function freshDeskState(newTaskId=id()){
 return {version:DESK_VERSION,newTaskId,selectedTask:'new',companion:'classic',drafts:[],pending:null,guide:null,guideChecks:[],savedAt:null};
}
export function normalizeDeskState(value,newTaskId=id()){
 const base=freshDeskState(newTaskId);
 if(!value||value.version!==DESK_VERSION||typeof value!=='object')return base;
 for(const key of ['newTaskId','selectedTask','companion'])if(typeof value[key]==='string'&&value[key].length<=100)base[key]=value[key];
 if(Array.isArray(value.drafts))base.drafts=value.drafts.filter(d=>d&&typeof d.key==='string'&&d.key.length<=200&&d.values&&typeof d.values==='object'&&JSON.stringify(d.values).length<=10000).slice(-52);
 if(value.pending&&ACTIONS.has(value.pending.body?.type)&&/^[A-Za-z0-9._:-]{8,96}$/.test(value.pending.body?.idempotencyKey||'')&&JSON.stringify(value.pending.body).length<=12000){
  base.pending={body:JSON.parse(JSON.stringify(value.pending.body)),createdAt:typeof value.pending.createdAt==='string'?value.pending.createdAt:null};
 }
 if(value.guide&&typeof value.guide.title==='string'&&typeof value.guide.purpose==='string'&&Array.isArray(value.guide.steps)&&value.guide.steps.length<=12&&value.guide.steps.every(s=>typeof s==='string'&&s.length<=1000))base.guide=value.guide;
 if(Array.isArray(value.guideChecks))base.guideChecks=value.guideChecks.filter(Number.isInteger).filter(n=>n>=0&&n<12);
 if(typeof value.savedAt==='string')base.savedAt=value.savedAt;
 return base;
}
export function readDeskState(storage,agentId,newTaskId=id()){
 try{return normalizeDeskState(JSON.parse(storage.getItem(deskStorageKey(agentId))),newTaskId);}catch{return freshDeskState(newTaskId);}
}
export function writeDeskState(storage,agentId,state,now=new Date().toISOString()){
 try{storage.setItem(deskStorageKey(agentId),JSON.stringify({...state,savedAt:now}));return true;}catch{return false;}
}
export function putDraft(state,key,values){
 if(JSON.stringify(values).length>10000)throw new Error('draft-too-large');
 return {...state,drafts:[...state.drafts.filter(d=>d.key!==key),{key,values:JSON.parse(JSON.stringify(values))}].slice(-52)};
}
export function getDraft(state,key){return state.drafts.find(d=>d.key===key)?.values||null;}
export function actionFingerprint(body){const {idempotencyKey,...action}=body;return canonical(action);}
export function stageAction(state,body,newKey=id(),now=new Date().toISOString()){
 if(state.pending){
  if(actionFingerprint(state.pending.body)!==actionFingerprint(body))throw new Error('pending-action-first');
  return {state,body:state.pending.body};
 }
 const requestBody=JSON.parse(JSON.stringify({...body,idempotencyKey:body.idempotencyKey||newKey}));
 if(!ACTIONS.has(requestBody.type)||!/^[A-Za-z0-9._:-]{8,96}$/.test(requestBody.idempotencyKey))throw new Error('invalid-action-key');
 if(new TextEncoder().encode(JSON.stringify(requestBody)).byteLength>8192)throw new Error('action-too-large');
 return {state:{...state,pending:{body:requestBody,createdAt:now}},body:requestBody};
}
function trimText(value){if(typeof value==='string')return value.trim();if(Array.isArray(value))return value.map(trimText);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,trimText(v)]));return value;}
export function receiptMatchesPending(receipt,pending){
 return !!pending&&!!receipt?.id&&receipt.body?.idempotencyKey===pending.body.idempotencyKey&&canonical(trimText(receipt.body))===canonical(trimText(pending.body));
}
export function reconcileDeskState(state,profile){
 // Advancing a phase is insufficient: another client may have submitted different work.
 const receipt=profile?.receipts?.find(r=>receiptMatchesPending(r,state.pending));
 return receipt?settleAction(state,receipt):state;
}
export function settleAction(state,receipt){
 if(!receiptMatchesPending(receipt,state.pending))return state;
 const body=state.pending.body;
 let next={...state,pending:null,drafts:state.drafts.filter(d=>d.key!==`${body.taskId}:${body.type}`)};
 if(body.type==='task.start')next={...next,selectedTask:body.taskId,newTaskId:id()};
 if(body.type==='task.reflect')next={...next,selectedTask:body.taskId};
 if(body.type==='cat.collect')next={...next,companion:body.catId};
 if(body.type==='charm.use'&&receipt.guidance)next={...next,guide:{...receipt.guidance,charmId:body.charmId,receiptId:receipt.id},guideChecks:[]};
 return next;
}
export function classifyActionError(error){
 const code=String(error?.message||'request-failed');
 const definitive=/^(unknown-action-field|unknown-check-field|action-type-invalid|body-must-be-object|invalid-json-body|cat-not-found|charm-not-found|cat-already-owned|insufficient-luck|milestone-not-reached|active-task-limit|daily-task-limit|daily-action-limit|task-phase-conflict)$/.test(code)||/^(goal|plan|summary|evidence|check|check-evidence|limitation|lesson|nextStep)-must-be-\d+-\d+-characters$/.test(code)||/^(plan|evidence|checks)-must-have-\d+-\d+-items$/.test(code)||/^(plan|evidence)-items-must-be-distinct$/.test(code)||/^(checks-must-be-distinct|check-outcome-invalid|idempotencyKey-invalid|taskId-invalid)$/.test(code);
 return {code,definitive,retryable:!definitive};
}
