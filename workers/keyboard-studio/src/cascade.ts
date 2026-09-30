import { DurableObject } from 'cloudflare:workers';
// @ts-ignore browser-compatible pure game module
import { seededBoard, applyMove, PROMPTS } from '../../../public/keyboard-cascade-game.js';

const ROOM = /^[0-9a-f]{32}$/;
const CLIENT = /^[0-9a-f-]{32,36}$/i;
const MAX_MESSAGES = 200;
const MAX_FRAGMENTS = 100;
const json = (value: unknown, status=200) => new Response(JSON.stringify(value), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});
interface Entry {id:string;name:string;text:string;at:number;kind:string}
interface RoomState { board:number[];seed:number;score:number;combo:number;moves:number;promptIndex:number;version:number;updatedAt:number }
export class KeyboardCascadeRoom extends DurableObject {
  constructor(ctx:DurableObjectState,env:unknown){super(ctx,env);
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS entries (seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT NOT NULL UNIQUE,client_id TEXT NOT NULL UNIQUE,kind TEXT NOT NULL,name TEXT NOT NULL,text TEXT NOT NULL,at INTEGER NOT NULL)');
  }
  private state():RoomState{const row=this.ctx.storage.sql.exec<{value:string}>("SELECT value FROM state WHERE key='game'").toArray()[0];if(row)return JSON.parse(row.value);const game={...seededBoard(crypto.getRandomValues(new Uint32Array(1))[0]),version:0,updatedAt:Date.now()};this.ctx.storage.sql.exec("INSERT INTO state (key,value) VALUES ('game',?)",JSON.stringify(game));return game}
  private entries(kind:string){return this.ctx.storage.sql.exec<Entry>('SELECT id,kind,name,text,at FROM entries WHERE kind=? ORDER BY seq ASC',kind).toArray()}
  async fetch(request:Request):Promise<Response>{
    const url=new URL(request.url),room=url.searchParams.get('room');if(!room||!ROOM.test(room))return json({error:'invalid-room'},400);
    if(request.method==='GET')return json({room,game:this.state(),prompt:PROMPTS[this.state().promptIndex],fragments:this.entries('fragment'),messages:this.entries('message')});
    if(request.method!=='POST')return json({error:'method-not-allowed'},405);
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return json({error:'expected-json'},415);
    const body=await request.text();if(body.length>4000)return json({error:'body-too-large'},413);
    let input:any;try{input=JSON.parse(body)}catch{return json({error:'invalid-json'},400)}
    if(input?.kind==='move'){
      const game=this.state();const moved=applyMove(game,input.a,input.b);if(!moved)return json({error:'no-match'},409);
      const next={...moved,version:game.version+1,updatedAt:Date.now()};this.ctx.storage.sql.exec("UPDATE state SET value=? WHERE key='game'",JSON.stringify(next));return json({game:next,prompt:PROMPTS[next.promptIndex]});
    }
    if(input?.kind!=='fragment'&&input?.kind!=='message')return json({error:'invalid-kind'},400);
    const kind=input.kind as string,name=typeof input.name==='string'?input.name.trim():'',text=typeof input.text==='string'?input.text.trim():'',clientId=input.clientId;
    if(!name||name.length>32||!text||text.length>(kind==='message'?500:1200)||typeof clientId!=='string'||!CLIENT.test(clientId))return json({error:'invalid-entry'},400);
    const prior=this.ctx.storage.sql.exec<Entry>('SELECT id,kind,name,text,at FROM entries WHERE client_id=?',clientId).toArray()[0];if(prior)return prior.kind===kind&&prior.name===name&&prior.text===text?json({entry:prior}):json({error:'client-id-conflict'},409);
    const count=this.ctx.storage.sql.exec<{count:number}>('SELECT COUNT(*) AS count FROM entries WHERE kind=?',kind).one().count;
    if(count>=(kind==='message'?MAX_MESSAGES:MAX_FRAGMENTS))return json({error:'room-full'},409);
    const entry={id:crypto.randomUUID(),kind,name,text,at:Date.now()};this.ctx.storage.sql.exec('INSERT INTO entries (id,client_id,kind,name,text,at) VALUES (?,?,?,?,?,?)',entry.id,clientId,kind,name,text,entry.at);
    return json({entry},201);
  }
}
