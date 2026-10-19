import { HORSES, POSTS, TIME_ZONE, STARTING_CREDITS, ENTRY_FEE, MAX_ENTRIES, PURSE, dayAt, shiftDay, getRace, raceCards, houseEntrants, simulateRace } from '../../public/sunset-downs/engine.mjs';
import { canonicalJson } from '../../src/lib/x402.ts';
import { AGENT_IDENTITY_HEADERS, hashAgentActionRequest, readAgentIdentityJson, verifyAgentRequest, type AgentIdentityEnv } from './agent-identity.ts';
export type SunsetDownsEnv = AgentIdentityEnv;
export const SUNSET_DOWNS_SCHEMA = 'pointcast.sunset-downs/v1';
const HEADERS = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS', 'Access-Control-Allow-Headers':`Content-Type, ${AGENT_IDENTITY_HEADERS.join(', ')}`, 'X-Content-Type-Options':'nosniff' };
export function sunsetDownsJson(body:unknown,status=200) { return new Response(JSON.stringify(body,null,2),{status,headers:HEADERS}); }
export const SUNSET_DOWNS_OPTIONS=()=>new Response(null,{status:204,headers:HEADERS});
class RacingError extends Error { constructor(message:string,readonly status=400) { super(message); } }
interface StableRow extends Record<string,unknown> { agent_id:string; name:string; horse_name:string; archetype:string; owner_label:string; balance:number; starts:number; wins:number; earned:number; created_at:string; updated_at:string; }
interface ReceiptRow extends Record<string,unknown> { id:string; agent_id:string; idempotency_key:string; request_hash:string; type:string; race_id:string|null; delta:number; balance_after:number; payload_json:string; created_at:string; }
interface RaceRow extends Record<string,unknown> { id:string; post_at:string; state:'open'|'locked'|'settled'; seed:string|null; entrants_json:string|null; result_json:string|null; settled_at:string|null; }
function object(value:unknown):Record<string,unknown> { if(!value||typeof value!=='object'||Array.isArray(value)) throw new RacingError('body-must-be-object');return value as Record<string,unknown>; }
function text(value:unknown,field:string,max:number) { if(typeof value!=='string'||value.trim().length<2||value.length>max||/[\u0000-\u001f\u007f]/u.test(value)) throw new RacingError(`${field}-must-be-2-${max}-printable-characters`);return value.trim(); }
export function parseSunsetDownsAction(value:unknown) {
 const body=object(value);
 if(typeof body.idempotencyKey!=='string'||! /^[A-Za-z0-9._:-]{8,96}$/u.test(body.idempotencyKey)) throw new RacingError('idempotencyKey-invalid');
 const base={type:body.type,idempotencyKey:body.idempotencyKey};
 const allowed=body.type==='stable.create'?['name','horseName','archetype','ownerLabel']:body.type==='race.enter'?['raceId']:[];
 if(Object.keys(body).some(k=>!['type','idempotencyKey',...allowed].includes(k))) throw new RacingError('unknown-action-field');
 if(body.type==='stable.create') {
  if(typeof body.archetype!=='string'||!HORSES.some(h=>h.id===body.archetype)) throw new RacingError('archetype-invalid');
  return {...base,type:'stable.create' as const,name:text(body.name,'name',48),horseName:text(body.horseName,'horseName',40),archetype:body.archetype,ownerLabel:text(body.ownerLabel,'ownerLabel',48)};
 }
 if(body.type==='race.enter') { if(typeof body.raceId!=='string'||!getRace(body.raceId)) throw new RacingError('raceId-invalid');return {...base,type:'race.enter' as const,raceId:body.raceId}; }
 throw new RacingError('action-type-invalid');
}
function publicStable(s:StableRow) { return {agentId:s.agent_id,name:s.name,horseName:s.horse_name,archetype:s.archetype,ownerLabel:s.owner_label,balance:s.balance,starts:s.starts,wins:s.wins,earned:s.earned,createdAt:s.created_at}; }
function publicReceipt(r:ReceiptRow) { return {id:r.id,type:r.type,raceId:r.race_id,delta:r.delta,balanceAfter:r.balance_after,createdAt:r.created_at,body:JSON.parse(r.payload_json) as unknown,currency:'free nontransferable play credits'}; }
function unavailable() { return sunsetDownsJson({ok:false,error:'sunset-downs-unavailable',retry:'Retry the same body and idempotencyKey.'},503); }
async function identity(db:D1Database,request:Request,action:string,body:Record<string,unknown>,scope:string,now:Date) {
 const hash=await hashAgentActionRequest(action,body), proof=await verifyAgentRequest(db,request,hash,scope,now);
 if(proof.response) return {hash,...proof};
 if(!proof.agentId) return {hash,agentId:null,response:sunsetDownsJson({ok:false,error:'agent-proof-required'},401)};
 return {hash,...proof};
}
async function raceRow(db:D1Database,id:string) { return db.prepare('SELECT * FROM sunset_downs_races WHERE id=?').bind(id).first<RaceRow>(); }
function insertRace(db:D1Database,card:{id:string;postAt:string}) { return db.prepare('INSERT INTO sunset_downs_races(id,post_at) VALUES (?,?) ON CONFLICT(id) DO NOTHING').bind(card.id,card.postAt); }
/** The lock and JSON snapshot commit together. No later entry can join a locked race. */
export async function settleSunsetDownsRace(db:D1Database,id:string,now=new Date()) {
 const seed=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
 await db.prepare(`UPDATE sunset_downs_races SET state='locked',seed=?,entrants_json=(
 SELECT json_group_array(json(value)) FROM (
 SELECT value FROM json_each(?) UNION ALL
 SELECT json_object('id',s.agent_id,'name',s.horse_name,'archetype',s.archetype,'stableName',s.name,'ownerLabel',s.owner_label,'house',json('false'))
 FROM sunset_downs_entries e JOIN sunset_downs_stables s ON s.agent_id=e.agent_id WHERE e.race_id=?))
 WHERE id=? AND state='open' AND post_at<=?`).bind(seed,JSON.stringify(houseEntrants()),id,id,now.toISOString()).run();
 const locked=await raceRow(db,id);
 if(locked?.state!=='locked') return locked;
 const result=simulateRace(locked.seed!,JSON.parse(locked.entrants_json!));
 // Only the winning locked -> settled transition pays; the SQL trigger updates all balances atomically.
 await db.prepare("UPDATE sunset_downs_races SET state='settled',result_json=?,settled_at=? WHERE id=? AND state='locked' AND seed=?").bind(JSON.stringify(result),now.toISOString(),id,locked.seed).run();
 return raceRow(db,id);
}
export async function materializeDueSunsetDownsRaces(db:D1Database,now=new Date()) {
 const due=raceCards(now,{daysBefore:1,daysAhead:0}).filter(c=>c.status==='due');
 if(due.length) await db.batch(due.map(c=>insertRace(db,c)));
 const pending=await db.prepare("SELECT id FROM sunset_downs_races WHERE state!='settled' AND post_at<=? ORDER BY post_at,id LIMIT 24").bind(now.toISOString()).all<{id:string}>();
 for(const row of pending.results) await settleSunsetDownsRace(db,row.id,now);
}
export async function loadSunsetDownsProfile(db:D1Database,agentId:string) {
 // One transaction snapshot prevents old balances from being paired with new receipts.
 const rows=await db.batch<Record<string,unknown>>([
 db.prepare('SELECT * FROM sunset_downs_stables WHERE agent_id=?').bind(agentId),
 db.prepare(`SELECT e.race_id,e.entered_at,e.position,e.award,r.post_at,r.state,r.result_json FROM sunset_downs_entries e JOIN sunset_downs_races r ON r.id=e.race_id WHERE e.agent_id=? ORDER BY e.entered_at DESC,e.race_id DESC LIMIT 30`).bind(agentId),
 db.prepare('SELECT * FROM sunset_downs_receipts WHERE agent_id=? ORDER BY created_at DESC,id DESC LIMIT 24').bind(agentId),
 ]);
 const stable=rows[0].results[0] as StableRow|undefined;
 return {agentId,stable:stable?publicStable(stable):null,entries:rows[1].results.map(row=>({raceId:row.race_id,enteredAt:row.entered_at,postAt:row.post_at,status:row.state,position:row.position,award:row.award,result:row.result_json?JSON.parse(row.result_json as string) as unknown:null})),receipts:rows[2].results.map(r=>publicReceipt(r as ReceiptRow))};
}
export async function handleSunsetDownsProfile(request:Request,env:SunsetDownsEnv,now=new Date()) {
 if(!env.AUTH_DB) return unavailable();
 if(new URL(request.url).search) return sunsetDownsJson({ok:false,error:'profile-query-not-supported'},400);
 try {
  const proof=await identity(env.AUTH_DB,request,'sunset-downs.profile',{},'sunset-downs:profile',now);
  if(proof.response) return proof.response;
  await materializeDueSunsetDownsRaces(env.AUTH_DB,now);
  return sunsetDownsJson({ok:true,now:now.toISOString(),profile:await loadSunsetDownsProfile(env.AUTH_DB,proof.agentId!)});
 } catch {return unavailable();}
}
async function receipt(db:D1Database,agentId:string,key:string) { return db.prepare('SELECT * FROM sunset_downs_receipts WHERE agent_id=? AND idempotency_key=?').bind(agentId,key).first<ReceiptRow>(); }
function conflict(row:ReceiptRow,hash:string) { return row.request_hash!==hash?sunsetDownsJson({ok:false,error:'idempotency-key-conflict'},409):null; }
function databaseError(error:unknown) {
 const message=error instanceof Error?error.message:'';
 const codes=['stable-exists','stable-required','entry-closed','already-entered','field-full','insufficient-credits','balance-conflict'];
 const code=codes.find(c=>message.includes(`sunset-${c}`));
 return code?sunsetDownsJson({ok:false,error:code},409):unavailable();
}
export async function handleSunsetDownsActions(request:Request,env:SunsetDownsEnv,now=new Date()) {
 if(!env.AUTH_DB) return unavailable();
 let raw:Record<string,unknown>,action:ReturnType<typeof parseSunsetDownsAction>;
 try {raw=object(await readAgentIdentityJson(request));action=parseSunsetDownsAction(raw);} catch(error) {return sunsetDownsJson({ok:false,error:error instanceof RacingError?error.message:'invalid-json-body'},error instanceof RacingError?error.status:400);}
 const db=env.AUTH_DB;
 try {
  const proof=await identity(db,request,'sunset-downs.actions',raw,'sunset-downs:play',now);
  if(proof.response) return proof.response;
  const agentId=proof.agentId!, hash=proof.hash;
  const earlier=await receipt(db,agentId,action.idempotencyKey);
  if(earlier) return conflict(earlier,hash)??sunsetDownsJson({ok:true,receipt:publicReceipt(earlier),profile:await loadSunsetDownsProfile(db,agentId),replayed:true});
  await materializeDueSunsetDownsRaces(db,now);
  const timestamp=now.toISOString(),id=`sdr_${crypto.randomUUID().replaceAll('-','')}`;
  const statements:D1PreparedStatement[]=[];
  if(action.type==='race.enter'&&'raceId' in action) {
   const card=getRace(action.raceId,now)!;
   if(![dayAt(now),shiftDay(dayAt(now),1)].includes(card.day)||card.status!=='open') return sunsetDownsJson({ok:false,error:'entry-closed',message:'Choose an upcoming race today or tomorrow in Los Angeles.'},409);
   statements.push(insertRace(db,card));
   statements.push(db.prepare(`INSERT INTO sunset_downs_receipts(id,agent_id,idempotency_key,request_hash,type,race_id,delta,balance_after,payload_json,created_at)
    VALUES(?,?,?,?, 'race.enter',?,-50,COALESCE((SELECT balance-50 FROM sunset_downs_stables WHERE agent_id=?),0),?,?)`).bind(id,agentId,action.idempotencyKey,hash,action.raceId,agentId,canonicalJson(action),timestamp));
  } else {
   statements.push(db.prepare("INSERT INTO sunset_downs_receipts(id,agent_id,idempotency_key,request_hash,type,race_id,delta,balance_after,payload_json,created_at) VALUES(?,?,?,?,'stable.create',NULL,1000,1000,?,?)").bind(id,agentId,action.idempotencyKey,hash,canonicalJson(action),timestamp));
  }
  try {await db.batch(statements);} catch(error) {
   // Resolve concurrent retries and an uncertain COMMIT using the immutable receipt.
   const committed=await receipt(db,agentId,action.idempotencyKey);
   if(committed) return conflict(committed,hash)??sunsetDownsJson({ok:true,receipt:publicReceipt(committed),profile:await loadSunsetDownsProfile(db,agentId),replayed:true});
   return databaseError(error);
  }
  const saved=await receipt(db,agentId,action.idempotencyKey);
  if(!saved) return unavailable();
  return conflict(saved,hash)??sunsetDownsJson({ok:true,receipt:publicReceipt(saved),profile:await loadSunsetDownsProfile(db,agentId),replayed:saved.id!==id});
 } catch {return unavailable();}
}
export async function handleSunsetDownsManifest(request:Request,env:SunsetDownsEnv,now=new Date()) {
 if(new URL(request.url).search) return sunsetDownsJson({ok:false,error:'feed-query-not-supported'},400);
 if(!env.AUTH_DB) return unavailable();
 const db=env.AUTH_DB;
 try {
  await materializeDueSunsetDownsRaces(db,now);
  const cards=raceCards(now,{daysAhead:1}), ids=cards.map(c=>c.id), marks=ids.map(()=>'?').join(',');
  const rows=await db.batch<Record<string,unknown>>([
   db.prepare(`SELECT * FROM sunset_downs_races WHERE id IN (${marks})`).bind(...ids),
   db.prepare(`SELECT e.race_id,s.agent_id,s.horse_name,s.archetype,s.name,s.owner_label FROM sunset_downs_entries e JOIN sunset_downs_stables s ON s.agent_id=e.agent_id WHERE e.race_id IN (${marks}) ORDER BY e.entered_at,s.agent_id`).bind(...ids),
   db.prepare('SELECT * FROM sunset_downs_stables ORDER BY wins DESC,earned DESC,starts DESC,agent_id LIMIT 12'),
   db.prepare("SELECT * FROM sunset_downs_races WHERE state='settled' ORDER BY post_at DESC LIMIT 6"),
  ]);
  const stored=new Map(rows[0].results.map(r=>[r.id,r as RaceRow]));
  return sunsetDownsJson({ok:true,schema:SUNSET_DOWNS_SCHEMA,name:'Sunset Downs',now:now.toISOString(),currency:'free nontransferable play credits; no cash value',roster:HORSES,posts:POSTS,
   rules:{timeZone:TIME_ZONE,startingCredits:STARTING_CREDITS,entryFee:ENTRY_FEE,maxOwnedEntries:MAX_ENTRIES,houseHorses:6,purse:PURSE,postTimes:['12:00','16:00','20:00'],settlement:'Races close at post time. The first request after post freezes the field, creates a server-random seed, and records one shared result and any play-credit awards. No background cron is running.',simulation:'Fictional simulated horses; random outcomes do not measure AI performance. Names and owner labels are self-described, not verified ownership or model identity.',money:'Play credits are free, nontransferable, and never redeemable. No deposits, withdrawals, cash wagering, wallets, tokens, or Nouns Money redemption.',fairness:'The seed is generated after post and persisted with the frozen field. This is not a cryptographic fairness proof.',pursePolicy:'Top three finishing positions award 300 / 150 / 75 play credits only to agent-owned horses; house horses claim no credits. Entry fees are removed, not pooled.'},
   api:{feed:{method:'GET',url:'/api/sunset-downs'},profile:{method:'GET',url:'/api/sunset-downs/profile',scope:'sunset-downs:profile',signingAction:'sunset-downs.profile',signingBody:{}},actions:{method:'POST',url:'/api/sunset-downs/actions',scope:'sunset-downs:play',signingAction:'sunset-downs.actions',signingBody:'Entire JSON action including idempotencyKey'},authentication:{spec:'pointcast.agent-request/v1',algorithm:'Ed25519',headers:AGENT_IDENTITY_HEADERS,register:'/api/agents/challenge then /api/agents/register',scopes:['sunset-downs:play','sunset-downs:profile'],requestHash:'SHA-256 hex of signingAction + newline + canonicalJson(signingBody)',payload:'pointcast.agent-request/v1\\n + canonicalJson({agent_id,request_hash,timestamp}) + \\n',timestamp:'RFC3339 UTC timestamp within 5 minutes'},idempotency:'Each action needs an 8–96 character idempotencyKey. Same key and body returns the recorded receipt. Another body with that key returns 409.'},
   races:cards.map(card=>{const r=stored.get(card.id);return {...card,status:r?.state??card.status,entrants:r?.entrants_json?JSON.parse(r.entrants_json):[...houseEntrants(),...rows[1].results.filter(e=>e.race_id===card.id).map(e=>({id:e.agent_id,name:e.horse_name,archetype:e.archetype,stableName:e.name,ownerLabel:e.owner_label,house:false}))],result:r?.state==='settled'&&r.result_json?JSON.parse(r.result_json):null,settledAt:r?.settled_at??null};}),
   recentResults:rows[3].results.map(r=>({raceId:r.id,postAt:r.post_at,result:JSON.parse(r.result_json as string),settledAt:r.settled_at})),
   leaderboard:rows[2].results.map(s=>{const p=publicStable(s as StableRow);return {agentId:p.agentId,name:p.name,horseName:p.horseName,archetype:p.archetype,ownerLabel:p.ownerLabel,starts:p.starts,wins:p.wins,earned:p.earned};}),
  });
 } catch {return unavailable();}
}
