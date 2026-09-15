import { DurableObject } from 'cloudflare:workers';
import { active, admissionReason, baseStatus, fixedSessionConfig, isRecord, MAX_SESSION_SECONDS, parseOffer, readBoundedBody, recoverUnsupportedRedirect, reserve, sha256, validOrigin } from './policy.ts';
import type { Ledger, SessionRecord } from './policy.ts';
import { notesRequest, parseNotes, imageRequest, researchRequest, parseResearch } from './studio.ts';
import { IP_WINDOW_MS, MAX_PER_IP, maxSessions } from './policy.ts';
import { VoiceToolBridge, type VoiceToolReceipt } from './voice-tools.ts';

const API_ORIGIN = 'https://api.openai.com';
const LEDGER_KEY = 'voice-ledger-v1';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const TOKEN = /^[a-f0-9-]{73}$/;
function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
function denied(reason: string, status = 503): Response {
  const message = reason === 'busy' ? 'Shwa is talking with a couple of people. Try again shortly.' : reason === 'rate_limited' ? 'This network has reached its hourly call allowance.' : reason === 'limit_reached' ? 'This voice trial has used its call allowance.' : reason === 'invalid_offer' ? 'The audio connection could not be prepared. Please try again.' : 'Shwa’s voice is temporarily unavailable. Please try again later.';
  return json({ error: reason, reason, message }, status);
}
async function discardBody(request: Request): Promise<void> {
  if (request.body && !request.bodyUsed && !request.body.locked) await request.body.cancel();
}
async function parseJSON(request: Request, limit?: number): Promise<unknown> {
  return JSON.parse(await readBoundedBody(request, limit));
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    const origin = request.headers.get('Origin');
    const allowed = validOrigin(origin, env);
    // A direct status read is harmless, but only the configured site gets CORS.
    if (path !== '/status' && !allowed) { await discardBody(request); return denied('origin_not_allowed', 403); }
    let response: Response;
    if (request.method === 'OPTIONS') {
      if (!allowed || !['/status', '/session', '/session/close', '/notes', '/image', '/research', '/context', '/tool'].includes(path)) return denied('origin_not_allowed', 403);
      response = new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '300' } });
    } else if ((path === '/status' && request.method === 'GET') || (['/session', '/session/close', '/notes', '/image', '/research', '/context', '/tool'].includes(path) && request.method === 'POST')) {
      try {
        // Buffer only the small, bounded control payload before crossing the DO boundary.
        // Forwarding an unread client stream can outlive an early DO rejection.
        let forwarded = request;
        if (request.method === 'POST') {
          let body: string;
          try { body = await readBoundedBody(request, path === '/session/close' ? 1024 : 64 * 1024); }
          catch { return denied('invalid_offer', 400); }
          forwarded = new Request(request.url, { method: request.method, headers: request.headers, body });
        }
        response = await env.VOICE_SUPERVISOR.getByName('public-voice-v1').fetch(forwarded);
      } catch { response = denied('temporarily_unavailable'); }
    } else response = denied('not_found', 404);
    const headers = new Headers(response.headers);
    headers.set('Vary', 'Origin');
    headers.set('Cache-Control', 'no-store');
    if (allowed && origin) headers.set('Access-Control-Allow-Origin', origin);
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<Env>;

type Sideband = { socket: WebSocket; finalized: boolean; finished: Promise<boolean>; finish: (confirmed: boolean) => void; tools: VoiceToolBridge };
export class VoiceSupervisor extends DurableObject<Env> {
  private connections = new Map<string, Sideband>();
  private contextReplies=new Map<string,(accepted:boolean)=>void>();
  private closing = new Map<string, Promise<boolean>>();
  private imageJobs = new Set<string>();
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const ledger = await ctx.storage.get<Ledger>(LEDGER_KEY);
      if (!ledger) {
        await ctx.storage.put(LEDGER_KEY, { attempts: 0, salt: crypto.randomUUID(), ipAttempts: {}, sessions: {} } satisfies Ledger);
      } else if (recoverUnsupportedRedirect(ledger)) await ctx.storage.put(LEDGER_KEY, ledger);
    });
  }
  private async ledger(): Promise<Ledger> {
    const value = await this.ctx.storage.get<Ledger>(LEDGER_KEY);
    if (!value) throw new Error('state_unavailable');
    return value;
  }
  private async update<T>(change: (ledger: Ledger) => T): Promise<T> {
    return this.ctx.storage.transaction(async transaction => {
      const ledger = await transaction.get<Ledger>(LEDGER_KEY);
      if (!ledger) throw new Error('state_unavailable');
      const result = change(ledger);
      await transaction.put(LEDGER_KEY, ledger);
      const deadlines = Object.values(ledger.sessions).filter(active).filter(record => record.status !== 'uncertain' || record.upstreamId).map(record => record.deadline > Date.now() ? Math.min(record.deadline, record.retryAt ?? record.deadline) : record.retryAt ?? record.deadline);
      if (deadlines.length) await transaction.setAlarm(Math.max(Date.now() + 1, Math.min(...deadlines)));
      else await transaction.deleteAlarm();
      return result;
    });
  }
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/status' && request.method === 'GET') {
      const ledger = await this.ledger();
      const status = baseStatus(this.env);
      const ip = request.headers.get('CF-Connecting-IP');
      const ipHash = ip && ip.length <= 64 ? await sha256(`${ledger.salt}:${ip}`) : undefined;
      const reason = admissionReason(ledger, this.env, ipHash);
      const recent = ipHash ? (ledger.ipAttempts[ipHash] ?? []).filter(at => at > Date.now() - IP_WINDOW_MS).sort((a,b) => a-b) : [];
      const retryAt = reason === 'rate_limited' ? recent[Math.max(0, recent.length - MAX_PER_IP)] + IP_WINDOW_MS : undefined;
      const records = Object.values(ledger.sessions);
      const diagnostics = reason === 'needs_attention' ? {
        halt: ledger.haltReason ?? null,
        attempts: ledger.attempts,
        states: Object.fromEntries(['creating', 'open', 'closing', 'closed', 'failed', 'uncertain'].map(state => [state, records.filter(record => record.status === state).length])),
        pendingWithProviderId: records.filter(record => active(record) && record.upstreamId).length,
        closeAttempts: records.reduce((sum, record) => sum + (record.closeAttempts ?? 0), 0),
        failures: records.filter(record => record.failurePhase).map(record => ({phase: record.failurePhase, code: record.failureCode, status: record.failureStatus})),
      } : undefined;
      return json({ ...status, available: !reason, reason, diagnostics, retryAt, remainingCalls: Math.max(0, maxSessions(this.env)-ledger.attempts), networkCallsRemaining: Math.max(0, MAX_PER_IP-recent.length), message: !reason ? status.message : ['setup_required', 'paused', 'expired'].includes(reason) ? status.message : reason === 'busy' ? 'Shwa is talking with a couple of people. Try again shortly.' : reason === 'limit_reached' ? 'This voice trial has used its call allowance.' : reason === 'rate_limited' ? 'This network has reached its hourly allowance. The countdown shows when you can return.' : reason === 'needs_attention' ? 'The previous call is still closing. We’re checking it before opening the line.' : 'Shwa’s voice is temporarily unavailable.' });
    }
    if (!validOrigin(request.headers.get('Origin'), this.env)) return denied('origin_not_allowed', 403);
    if (path === '/session' && request.method === 'POST') return this.createSession(request);
    if (path === '/session/close' && request.method === 'POST') return this.requestClose(request);
    if (path === '/context' && request.method === 'POST') return this.contextUpdate(request);
    if (path === '/tool' && request.method === 'POST') return this.tool(request);
    if (['/notes','/image','/research'].includes(path) && request.method === 'POST') return this.studio(request, path.slice(1) as 'notes'|'image'|'research');
    return denied('not_found', 404);
  }
  private async createSession(request: Request): Promise<Response> {
    const status = baseStatus(this.env);
    if (!status.available) { await discardBody(request); return json({ ...status, error: status.reason }, 503); }
    if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') { await discardBody(request); return denied('invalid_offer', 415); }
    let sdp: string | null, voiceTools=false;
    try { const offer=await parseJSON(request);sdp=parseOffer(offer);voiceTools=isRecord(offer)&&offer.voiceTools===true; } catch { return denied('invalid_offer', 400); }
    if (!sdp) return denied('invalid_offer', 400);
    const ip = request.headers.get('CF-Connecting-IP') ?? (this.env.ENVIRONMENT === 'development' ? 'local' : null);
    if (!ip || ip.length > 64) return denied('client_unavailable', 403);
    const ledger = await this.ledger();
    const ipHash = await sha256(`${ledger.salt}:${ip}`);
    const now = Date.now();
    const id = crypto.randomUUID();
    const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const record: SessionRecord = { id, tokenHash: await sha256(token), createdAt: now, deadline: Math.min(now + MAX_SESSION_SECONDS * 1000, Date.parse(this.env.EXPERIMENT_END)), status: 'creating' };
    // Commit reservation and alarm before any upstream create. Failed attempts still count.
    const reason = await this.update(value => reserve(value, this.env, ipHash, record, now));
    if (reason) return denied(reason, ['busy', 'rate_limited', 'limit_reached'].includes(reason) ? 429 : 503);
    let phase = 'create_request';
    try {
      const upstream = await fetch(`${API_ORIGIN}/v1/live/sessions`, {
        method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${this.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: fixedSessionConfig(voiceTools), transport: { type: 'webrtc', sdp } }),
      });
      if (!upstream.ok) {
        await upstream.body?.cancel();
        const definiteRejection = upstream.status >= 400 && upstream.status < 500;
        await this.update(value => {
          value.sessions[id].status = definiteRejection ? 'failed' : 'uncertain';
          value.sessions[id].failurePhase = phase;
          value.sessions[id].failureStatus = upstream.status;
          if ([401, 403].includes(upstream.status)) value.haltReason = 'credential_unavailable';
          if (!definiteRejection) value.haltReason = 'creation_uncertain';
        });
        return denied('upstream_unavailable');
      }
      phase = 'read_response';
      const result: unknown = JSON.parse(await readBoundedBody(upstream, 128 * 1024));
      if (!isRecord(result) || !isRecord(result.session) || typeof result.session.id !== 'string' || !result.session.id.length || result.session.id.length > 512) throw new Error('invalid_upstream_session');
      // Save the provider ID before parsing other fields so a malformed answer can still be closed.
      const upstreamId = result.session.id;
      await this.update(value => { value.sessions[id].upstreamId = upstreamId; });
      if (!isRecord(result.transport) || typeof result.transport.sdp !== 'string' || !result.transport.sdp.startsWith('v=0')) throw new Error('invalid_upstream_answer');
      phase = 'attach_sideband';
      const sideband = await this.attach(id, upstreamId);
      if (sideband.finalized || sideband.socket.readyState !== 1 || Date.now() >= record.deadline) throw new Error('supervision_unavailable');
      const opened = await this.update(value => { if (value.sessions[id].status !== 'creating') return false; value.sessions[id].status = 'open'; return true; });
      if (!opened || sideband.finalized || sideband.socket.readyState !== 1) throw new Error('supervision_lost');
      // The provider configuration and API key never leave the server.
      return json({ transport: { type: 'webrtc', sdp: result.transport.sdp }, control: { id, token }, expiresAt: new Date(record.deadline).toISOString(), maxSessionSeconds: MAX_SESSION_SECONDS }, 201);
    } catch (error) {
      const code = error instanceof Error ? error.name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0,64) : 'unknown';
      await this.update(value => { value.sessions[id].failurePhase = phase; value.sessions[id].failureCode = code; });
      await this.markUncertain(id);
      await this.closeSession(id);
      return denied('connection_unavailable');
    }
  }
  private async contextUpdate(request:Request):Promise<Response>{
    if(!baseStatus(this.env).available)return denied('unavailable');
    let data:unknown;try{data=await parseJSON(request,2048);}catch{return denied('invalid_context',400);}
    if(!isRecord(data)||Object.keys(data).length!==3||typeof data.id!=='string'||!UUID.test(data.id)||typeof data.token!=='string'||!TOKEN.test(data.token)||typeof data.context!=='string'||!data.context.trim()||new TextEncoder().encode(data.context).length>480)return denied('invalid_context',400);
    const id=data.id,record=(await this.ledger()).sessions[id],digest=await sha256(data.token);
    if(!record||record.status!=='open'||record.deadline<=Date.now()||!crypto.subtle.timingSafeEqual(new TextEncoder().encode(digest),new TextEncoder().encode(record.tokenHash)))return denied('invalid_control',403);
    const connection=this.connections.get(id);if(!connection||connection.finalized||connection.socket.readyState!==1)return json({accepted:false},503);
    const reserved=await this.update(ledger=>{const r=ledger.sessions[id];if(r.status!=='open'||r.deadline<=Date.now()||(r.contextAttempts??0)>=30||Date.now()-(r.contextAt??0)<2000)return false;r.contextAttempts=(r.contextAttempts??0)+1;r.contextAt=Date.now();return true;});
    if(!reserved)return json({accepted:false,reason:'context_limit'},429);
    const event_id='app_'+crypto.randomUUID();let timer:ReturnType<typeof setTimeout>|undefined;
    try{const reply=new Promise<boolean>(resolve=>{this.contextReplies.set(event_id,resolve);timer=setTimeout(()=>resolve(false),4000);});connection.socket.send(JSON.stringify({type:'session.thinking.append',event_id,delegation_id:null,content:data.context}));return json({accepted:await reply});}
    catch{return json({accepted:false},502);}finally{if(timer)clearTimeout(timer);this.contextReplies.delete(event_id);}
  }
  private async studio(request: Request, kind: 'notes'|'image'|'research'): Promise<Response> {
    const image=kind==='image', research=kind==='research';
    if (!baseStatus(this.env).available) return denied('unavailable');
    if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return denied('invalid_request', 415);
    let data: unknown;
    try { data = await parseJSON(request, 24 * 1024); } catch { return denied('invalid_request',400); }
    if (!isRecord(data) || Object.keys(data).length !== 3 || typeof data.id !== 'string' || !UUID.test(data.id) || typeof data.token !== 'string' || !TOKEN.test(data.token)) return denied('invalid_control',400);
    const content = image ? data.prompt : research ? data.question : data.transcript;
    if (typeof content !== 'string' || !content.trim() || content.length > (image || research ? 1600 : 16000)) return denied('invalid_request',400);
    const id = data.id;
    const record = (await this.ledger()).sessions[id];
    const hash = await sha256(data.token);
    if (!record || !record.upstreamId || !['open','closing','closed'].includes(record.status) || !crypto.subtle.timingSafeEqual(new TextEncoder().encode(hash), new TextEncoder().encode(record.tokenHash))) return denied('invalid_control',403);
    if (Date.now() > record.createdAt + 10 * 60 * 1000) return json({message:'This conversation’s creative tools have expired. Start a new call.'},403);
    return this.runStudio(id,kind,content);
  }
  private async tool(request: Request): Promise<Response> {
    if (!baseStatus(this.env).available) return denied('unavailable');
    if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return denied('invalid_request',415);
    let data: unknown; try { data = await parseJSON(request,2048); } catch { return denied('invalid_request',400); }
    if (!isRecord(data) || Object.keys(data).length !== 3 || typeof data.id !== 'string' || !UUID.test(data.id) || typeof data.token !== 'string' || !TOKEN.test(data.token) || typeof data.callId !== 'string' || !/^[a-zA-Z0-9_-]{1,256}$/.test(data.callId)) return denied('invalid_control',400);
    const id=data.id, callId=data.callId, record=(await this.ledger()).sessions[id], hash=await sha256(data.token);
    if (!record || record.status !== 'open' || record.deadline <= Date.now() || !crypto.subtle.timingSafeEqual(new TextEncoder().encode(hash),new TextEncoder().encode(record.tokenHash))) return denied('invalid_control',403);
    const connection=this.connections.get(id);
    if (!connection || connection.finalized || connection.socket.readyState !== 1) return json({reason:'voice_unavailable',message:'The call has ended; no new voice tool work was started.'},409);
    // The browser and sideband receive the same event independently. Wait briefly
    // for its authenticated provider copy, never accept browser-supplied arguments.
    const call=await connection.tools.waitForCall(callId);
    if (!call) return json({reason:'unknown_tool_call',message:'This voice tool request could not be verified. Please ask Shwa again.'},409);
    const receipt=await connection.tools.run(callId,async (pending,signal):Promise<VoiceToolReceipt> => {
      if (!['search_web','generate_image'].includes(pending.name)) return {callId,name:pending.name,status:'failed',result:{},reason:'unsupported_tool',message:'That tool is not available in this room.'};
      const response=await this.runStudio(id,pending.name==='search_web'?'research':'image',pending.content,{signal,connection});
      const body: unknown=await response.json();
      const result=isRecord(body)?body:{};
      return {callId,name:pending.name,status:response.ok?'completed':'failed',result:response.ok?result:{},...(response.ok?{}:{reason:typeof result.reason==='string'?result.reason:'tool_failed',message:typeof result.message==='string'?result.message:'The requested work could not finish.'})};
    });
    return json(receipt);
  }
  private async runStudio(id: string, kind: 'notes'|'image'|'research', content: string, voice?: {signal: AbortSignal; connection: Sideband}): Promise<Response> {
    if (kind !== 'image') return this.runStudioOnce(id,kind,content,voice);
    // Shared by manual controls and voice tools. A second image request cannot
    // reserve another paid attempt while the first image is still running.
    if (this.imageJobs.has(id)) return json({reason:'image_busy',message:'An image is already being made for this call. No second image was started.'},409);
    this.imageJobs.add(id);
    try { return await this.runStudioOnce(id,kind,content,voice); }
    finally { this.imageJobs.delete(id); }
  }
  private async runStudioOnce(id: string, kind: 'notes'|'image'|'research', content: string, voice?: {signal: AbortSignal; connection: Sideband}): Promise<Response> {
    const image=kind==='image', research=kind==='research';
    const reason = await this.update(ledger => {
      const current = ledger.sessions[id];
      if (!current || (voice && (voice.signal.aborted || this.connections.get(id)!==voice.connection || voice.connection.finalized || current.status!=='open' || current.deadline<=Date.now()))) return 'call_ended';
      if (image) {
        if ((current.imageAttempts ?? 0) >= 2 || Object.values(ledger.sessions).reduce((sum,item)=>sum+(item.imageAttempts??0),0) >= 10) return 'image_limit';
        current.imageAttempts = (current.imageAttempts ?? 0)+1;
      } else if(research){
        if((current.researchAttempts??0)>=2 || Object.values(ledger.sessions).reduce((n,s)=>n+(s.researchAttempts??0),0)>=10)return 'research_limit';
        current.researchAttempts=(current.researchAttempts??0)+1;
      } else {
        if ((current.notesAttempts ?? 0) >= 8) return 'notes_limit';
        if (current.notesAt && Date.now()-current.notesAt < 12000) return 'notes_wait';
        current.notesAttempts = (current.notesAttempts ?? 0)+1; current.notesAt=Date.now();
      }
      return null;
    });
    if (reason) return json({reason,message:reason==='call_ended'?'The call ended before this work could start.':reason==='image_limit'?'The image allowance is used up (two per call, ten for this trial).':reason==='research_limit'?'The research allowance is used up (two per call, ten for this trial).':reason==='notes_limit'?'The live notes for this call are complete.':'Notes will refresh in a moment.'},reason==='call_ended'?409:429);
    // Persist only quota counters. Transcript, prompt, model output and image bytes are never stored.
    try {
      const response = await fetch(`${API_ORIGIN}/v1/${image?'images/generations':'responses'}`, {
        method:'POST', redirect:'manual', signal:voice?AbortSignal.any([voice.signal,AbortSignal.timeout(image?90000:research?60000:30000)]):AbortSignal.timeout(image?90000:research?60000:30000),
        headers:{Authorization:`Bearer ${this.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify(image?imageRequest(content):research?researchRequest(content):notesRequest(content)),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return json({reason:'provider_rejected',message:image?'OpenAI could not create this image. Try a different prompt; this project may also need image access enabled.':research?'Research could not finish. The call can continue.':'The notes could not update. Your voice call can continue.'},502);
      }
      const result: unknown=JSON.parse(await readBoundedBody(response,image?10*1024*1024:research?128*1024:32768));
      if (research) return json(parseResearch(result));
      if (!image) return json(parseNotes(result));
      if (!isRecord(result) || !Array.isArray(result.data) || !isRecord(result.data[0]) || typeof result.data[0].b64_json !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(result.data[0].b64_json)) throw Error('invalid_image');
      const usage=isRecord(result.usage)?result.usage:{};
      const inputTokens=typeof usage.input_tokens==='number'?Math.max(0,usage.input_tokens):Math.ceil(content.length/3);
      return json({image:result.data[0].b64_json,mimeType:'image/webp',estimatedCost:0.005+inputTokens*2/1e6,remainingImages:Math.max(0,2-((await this.ledger()).sessions[id].imageAttempts??0))});
    } catch { return json({reason:'generation_unconfirmed',message:image?'Image generation did not finish here. It may still have been charged; we won’t retry automatically.':research?'Research did not finish with usable citations. It may have been charged; no automatic retry.':'Notes are temporarily unavailable. Your call can continue.'},502); }
  }
  private async requestClose(request: Request): Promise<Response> {
    let data: unknown;
    try { data = await parseJSON(request, 1024); } catch { return denied('invalid_control', 400); }
    if (!isRecord(data) || Object.keys(data).length !== 2 || typeof data.id !== 'string' || !UUID.test(data.id) || typeof data.token !== 'string' || !TOKEN.test(data.token)) return denied('invalid_control', 400);
    const record = (await this.ledger()).sessions[data.id];
    const digest = await sha256(data.token);
    if (!record || !crypto.subtle.timingSafeEqual(new TextEncoder().encode(digest), new TextEncoder().encode(record.tokenHash))) return denied('invalid_control', 403);
    const closed = await this.closeSession(data.id);
    return json({ closed }, closed ? 200 : 202);
  }
  private async markUncertain(id: string): Promise<void> {
    await this.update(value => {
      const record = value.sessions[id];
      if (!record || record.status === 'closed' || record.status === 'failed') return;
      record.status = 'uncertain';
      if (record.upstreamId) record.retryAt = Date.now() + 15000;
      else value.haltReason = 'creation_uncertain';
    });
  }
  private async finalize(id: string): Promise<void> {
    await this.update(value => {
      const record = value.sessions[id];
      if (record) { record.status = 'closed'; delete record.retryAt; }
    });
    const connection = this.connections.get(id);
    if (connection) {
      connection.tools.dispose();
      this.connections.delete(id);
      if (connection.socket.readyState < 2) connection.socket.close(1000, 'Session finalized');
    }
  }
  private async attach(id: string, upstreamId: string): Promise<Sideband> {
    const existing = this.connections.get(id);
    if (existing && existing.socket.readyState === 1) return existing;
    // Only a stored provider ID is interpolated into this fixed origin and path.
    const handshake = new AbortController();
    const handshakeTimer = setTimeout(() => handshake.abort(), 5000);
    let response: Response;
    try {
      response = await fetch(`${API_ORIGIN}/v1/live/sessions/${encodeURIComponent(upstreamId)}/attach`, {
        headers: { Upgrade: 'websocket', Authorization: `Bearer ${this.env.OPENAI_API_KEY}` },
        redirect: 'manual', signal: handshake.signal,
      });
    } finally { clearTimeout(handshakeTimer); }
    if (response.status !== 101 || !response.webSocket) { await response.body?.cancel(); throw new Error('sideband_unavailable'); }
    const socket = response.webSocket;
    let finish!: (confirmed: boolean) => void;
    const finished = new Promise<boolean>(resolve => { finish = resolve; });
    const record=(await this.ledger()).sessions[id];
    const deadline=record?.deadline??0;
    const tools=new VoiceToolBridge({send:event=>socket.send(JSON.stringify(event)),active:()=>Date.now()<deadline && this.connections.get(id)===sideband && !sideband.finalized && socket.readyState===1});
    const sideband: Sideband = { socket, finalized: false, finished, finish, tools };
    this.connections.set(id, sideband);
    socket.addEventListener('message', event => {
      // Conversation/tool state is ephemeral and bounded. Only quota counters are
      // persisted; no audio, transcript, prompt, result, or credential is logged.
      if (typeof event.data !== 'string' || event.data.length > 128 * 1024) return;
      try {
        const message: unknown = JSON.parse(event.data);
        sideband.tools.observe(message);
        if(isRecord(message)&&typeof message.client_event_id==='string'&&['session.thinking.appended','error'].includes(String(message.type))) this.contextReplies.get(message.client_event_id)?.(message.type==='session.thinking.appended');
        if (isRecord(message) && message.type === 'session.closed') {
          sideband.finalized = true;
          sideband.tools.dispose();
          finish(true);
          this.ctx.waitUntil(this.finalize(id));
        }
      } catch { /* Irrelevant/malformed event content is never reflected or logged. */ }
    });
    const lost = () => {
      if (sideband.finalized) return;
      sideband.tools.dispose();
      finish(false);
      if (this.connections.get(id) === sideband) this.connections.delete(id);
      this.ctx.waitUntil(this.markUncertain(id));
    };
    socket.addEventListener('close', lost);
    socket.addEventListener('error', lost);
    socket.accept();
    return sideband;
  }
  private async closeSession(id: string): Promise<boolean> {
    this.connections.get(id)?.tools.dispose();
    const underway = this.closing.get(id);
    if (underway) return underway;
    const job = this.performClose(id);
    this.closing.set(id, job);
    try { return await job; } finally { this.closing.delete(id); }
  }
  private async performClose(id: string): Promise<boolean> {
    const record = (await this.ledger()).sessions[id];
    if (!record || record.status === 'closed' || record.status === 'failed') return true;
    if (!record.upstreamId) { await this.markUncertain(id); return false; }
    try {
      await this.update(value => { const current = value.sessions[id]; if (current.status !== 'closed') { current.status = 'closing'; current.closeAttempts = (current.closeAttempts ?? 0) + 1; current.retryAt = Date.now() + 15000; } });
      const sideband = await this.attach(id, record.upstreamId);
      if (sideband.finalized) return true;
      // Listener was installed during attach, before this command is sent.
      sideband.socket.send(JSON.stringify({ type: 'session.close', event_id: crypto.randomUUID() }));
      let timer: ReturnType<typeof setTimeout> | undefined;
      const confirmed = await Promise.race([sideband.finished, new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), 4000); })]);
      if (timer) clearTimeout(timer);
      if (confirmed) { await this.finalize(id); return true; }
    } catch { /* Keep reservation, halt intake, and retry through durable alarm. */ }
    await this.markUncertain(id);
    return false;
  }
  async alarm(): Promise<void> {
    try {
      const now = Date.now();
      const records = Object.values((await this.ledger()).sessions).filter(active);
      for (const record of records) {
        if (record.deadline <= now || record.status === 'uncertain' || record.status === 'closing') await this.closeSession(record.id);
      }
      // Reschedule even after a transient close error; never release an unconfirmed reservation.
      await this.update(() => undefined);
    } catch {
      await this.ctx.storage.setAlarm(Date.now() + 15000);
    }
  }
}
