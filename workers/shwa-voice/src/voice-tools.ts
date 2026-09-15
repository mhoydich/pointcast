// Live protocol: https://developers.openai.com/api/docs/guides/live-delegation
// Only provider-issued calls enter this bridge. The browser supplies a call ID,
// never function arguments, model configuration, or a fabricated function result.
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const opaque = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 256 && /^[a-zA-Z0-9_-]+$/.test(value);
const normalize = (value: string) => value.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();

export type VoiceToolName = 'search_web' | 'generate_image';
export type VoiceToolCall = { callId: string; name: string; content: string; requestQuote: string; responseId: string; invalid?: string };
export type VoiceToolReceipt = { callId: string; name: string; status: 'completed' | 'failed'; result: Record<string, unknown>; message?: string; reason?: string; voiceDelivery?: 'queued' | 'unavailable' };
type Pending = VoiceToolCall & { receipt?: VoiceToolReceipt; promise?: Promise<VoiceToolReceipt>; delivered: boolean };
type BackendResponse = { id: string; delegationId: string; calls: Set<string>; terminal: boolean; failed: boolean; continued: boolean };

export const VOICE_TOOLS = [
  { type: 'function', name: 'search_web', description: 'Look up current public facts, products, prices, sources, or links when the visitor explicitly asks. Return verified findings with citations to the room and voice. Do not call for incidental mentions, hypothetical examples, your own suggestions, or an unclear request. request_quote must quote the actual visitor request verbatim. Ask one useful question if the product or task is unclear.', strict: true,
    parameters: { type: 'object', additionalProperties: false, properties: { question: { type: 'string', description: 'Specific research question, including product names and relevant context; maximum 1600 characters.' }, request_quote: { type: 'string', description: 'Exact words the visitor spoke to request this lookup, maximum 700 characters.' } }, required: ['question', 'request_quote'] } },
  { type: 'function', name: 'generate_image', description: 'Generate an image only when the visitor explicitly asks to create, draw, generate, or make an image now. Merely discussing an image, describing a product, or mentioning art does not authorize this. A creative idea can remain a proposal on the board. request_quote must quote the actual visitor request verbatim. Preserve the discussed subject and corrections; for pickleball draw a pickleball paddle, never a boat paddle.', strict: true,
    parameters: { type: 'object', additionalProperties: false, properties: { prompt: { type: 'string', description: 'Concrete image prompt reflecting the conversation, maximum 1600 characters.' }, request_quote: { type: 'string', description: 'Exact words the visitor spoke to request image generation, maximum 700 characters.' } }, required: ['prompt', 'request_quote'] } },
];

export function explicitToolRequest(name: string, quote: string): boolean {
  const text = normalize(quote);
  if (/\b(?:do not|don't|dont|never|stop|cancel)\b.{0,30}\b(?:search|look|check|find|research|generat\w*|creat\w*|make|draw|paint)\b/.test(text)) return false;
  if (/\b(?:for example|hypothetically|imagine i|if i (?:asked|said)|someone (?:said|asked))\b/.test(text)) return false;
  if (name === 'search_web') return /\b(?:look\s+(?:it\s+)?up|search|research|find|check|compare)\b/.test(text) || /\b(?:how much|what(?:'s| is| are) (?:the )?(?:current )?(?:prices?|costs?))\b/.test(text);
  return name === 'generate_image' && (/\b(?:generate|create|make|draw|paint|render|show)\b.{0,100}\b(?:image|picture|illustration|art|artwork|poster|drawing|painting|visual|design|logo)\b/.test(text) || /\b(?:draw|paint|illustrate)\s+(?:me\s+)?(?:a|an|the)\s+\w/.test(text));
}

export function voiceToolSummary(receipt: VoiceToolReceipt): Record<string, unknown> {
  if (receipt.status === 'failed') return { status: 'failed', reason: receipt.reason ?? 'tool_failed', message: receipt.message ?? 'The requested work could not finish. Do not claim it succeeded.' };
  if (receipt.name === 'generate_image') return { status: 'completed', kind: 'image', message: 'The generated image is now available on the room board. You know the requested prompt and success status, not its pixels.' };
  const parts = Array.isArray(receipt.result.parts) ? receipt.result.parts.filter(record) : [];
  return { status: 'completed', kind: 'research', findings: parts.map(part => typeof part.text === 'string' ? part.text : '').join('\n').slice(0,6500), sources: parts.flatMap(part => Array.isArray(part.citations) ? part.citations.filter(record).map(c => ({ title: c.title, url: c.url })) : []).slice(0,8), message: 'These verified findings and clickable sources are on the room board. Answer the visitor with the relevant facts, including prices and uncertainty; do not ask them to research this themselves.' };
}

export class VoiceToolBridge {
  private calls = new Map<string, Pending>();
  private responses = new Map<string, BackendResponse>();
  private current = new Map<string, string>();
  private transcript: { text: string; at: number }[] = [];
  private waiters = new Map<string, Set<() => void>>();
  private stopped = false;
  private workSignal = new AbortController().signal;
  private options: { send: (event: Record<string, unknown>) => void; active: () => boolean; now?: () => number };
  constructor(options: { send: (event: Record<string, unknown>) => void; active: () => boolean; now?: () => number }) { this.options=options; }
  private now() { return this.options.now?.() ?? Date.now(); }
  private active() { return !this.stopped && this.options.active(); }

  observe(message: unknown): void {
    if (!this.active() || !record(message)) return;
    if (message.type === 'session.input_transcript.delta' && typeof message.delta === 'string') {
      this.transcript.push({ text: message.delta.slice(0,2000), at: this.now() });
      this.transcript = this.transcript.filter(part => part.at > this.now()-90000).slice(-80);
      while (this.transcript.reduce((n,part) => n+part.text.length,0) > 12000) this.transcript.shift();
      return;
    }
    if (message.type !== 'response.event' || !opaque(message.delegation_id) || !record(message.event)) return;
    const event = message.event, delegationId = message.delegation_id;
    if (event.type === 'response.created' && record(event.response) && opaque(event.response.id)) {
      if (this.responses.has(event.response.id) || this.responses.size >= 24) return;
      this.current.set(delegationId,event.response.id);
      this.responses.set(event.response.id,{ id:event.response.id, delegationId, calls:new Set(), terminal:false, failed:false, continued:false });
      return;
    }
    const responseId = record(event.response) && opaque(event.response.id) ? event.response.id : opaque(event.response_id) ? event.response_id : this.current.get(delegationId);
    const response = responseId ? this.responses.get(responseId) : undefined;
    if (!response || response.delegationId !== delegationId) return;
    if (event.type === 'response.output_item.done' && record(event.item) && event.item.type === 'function_call') {
      const item = event.item;
      if (response.terminal || !opaque(item.call_id) || this.calls.has(item.call_id) || this.calls.size >= 16) return;
      const name = typeof item.name === 'string' ? item.name.slice(0,100) : 'unknown';
      let content = '', requestQuote = '', invalid: string | undefined;
      if (!['search_web','generate_image'].includes(name)) invalid = 'unsupported_tool';
      else try {
        if (typeof item.arguments !== 'string' || item.arguments.length > 4000) throw Error();
        const args: unknown = JSON.parse(item.arguments), key = name === 'search_web' ? 'question' : 'prompt';
        if (!record(args) || Object.keys(args).length !== 2 || typeof args[key] !== 'string' || typeof args.request_quote !== 'string') throw Error();
        content = args[key].trim(); requestQuote = args.request_quote.trim();
        if (!content || content.length > 1600 || requestQuote.length < 8 || requestQuote.length > 700) throw Error();
      } catch { invalid = 'invalid_tool_arguments'; }
      const call: Pending = { callId:item.call_id,name,content,requestQuote,responseId:response.id,invalid,delivered:false };
      this.calls.set(call.callId,call); response.calls.add(call.callId);
      for (const done of this.waiters.get(call.callId) ?? []) done();
      if (invalid) this.complete(call,{ callId:call.callId,name,status:'failed',result:{},reason:invalid,message:'That tool request was invalid. Ask a clear question or use the room controls.' });
      return;
    }
    if (['response.completed','response.failed','response.incomplete','response.cancelled'].includes(String(event.type))) {
      response.terminal = true;
      response.failed = event.type !== 'response.completed';
      this.continue(response);
    }
  }

  async waitForCall(callId: string, milliseconds = 1500): Promise<VoiceToolCall | undefined> {
    if (this.calls.has(callId) || !this.active()) return this.calls.get(callId);
    await new Promise<void>(resolve => {
      const pending = this.waiters.get(callId) ?? new Set<() => void>();
      const done = () => { clearTimeout(timer); pending.delete(done); if (!pending.size) this.waiters.delete(callId); resolve(); };
      const timer = setTimeout(done,milliseconds); pending.add(done); this.waiters.set(callId,pending);
    });
    return this.calls.get(callId);
  }

  run(callId: string, execute: (call: VoiceToolCall, signal: AbortSignal) => Promise<VoiceToolReceipt>): Promise<VoiceToolReceipt> {
    const call = this.calls.get(callId);
    if (!call) return Promise.resolve({ callId,name:'unknown',status:'failed',result:{},reason:'unknown_tool_call',message:'The voice tool request could not be verified.' });
    if (call.promise) return call.promise;
    if (call.receipt) return Promise.resolve(call.receipt);
    call.promise = (async () => {
      let receipt: VoiceToolReceipt;
      const response = this.responses.get(call.responseId);
      const fragments=this.transcript.filter(part => part.at > this.now()-90000).map(part => part.text);
      const quoted=normalize(call.requestQuote);
      const heard=normalize(fragments.join('')).includes(quoted) || normalize(fragments.join(' ')).includes(quoted);
      if (!this.active() || response?.failed) receipt = this.failure(call,'call_ended','This call has ended. No new work was started.');
      else if (!explicitToolRequest(call.name,call.requestQuote) || !heard) receipt = this.failure(call,'needs_confirmation','Please explicitly ask Shwa to look this up or generate the image. No tool was charged for this unclear request.');
      else try { receipt = await execute(call,this.workSignal); }
      catch { receipt = this.failure(call,'generation_unconfirmed','The work did not return a confirmed result. It may have been charged; it was not retried.'); }
      this.complete(call,receipt);
      return call.receipt!;
    })();
    return call.promise;
  }
  private failure(call: VoiceToolCall, reason: string, message: string): VoiceToolReceipt { return {callId:call.callId,name:call.name,status:'failed',result:{},reason,message}; }
  private complete(call: Pending, receipt: VoiceToolReceipt) {
    call.receipt = receipt;
    if (!this.active()) { receipt.voiceDelivery = 'unavailable'; return; }
    try {
      this.options.send({type:'response.item.create',event_id:'tool_result_'+crypto.randomUUID(),item:{type:'function_call_output',call_id:call.callId,output:JSON.stringify(voiceToolSummary(receipt))}});
      call.delivered = true; receipt.voiceDelivery = 'queued';
      const response = this.responses.get(call.responseId); if (response) this.continue(response);
    } catch { receipt.voiceDelivery = 'unavailable'; }
  }
  private continue(response: BackendResponse) {
    if (!this.active() || response.failed || !response.terminal || response.continued || !response.calls.size || [...response.calls].some(id => !this.calls.get(id)?.delivered)) return;
    // Mark before sending: an uncertain transport result must not retry backend work.
    response.continued = true;
    try { this.options.send({type:'response.create',event_id:'tool_continue_'+crypto.randomUUID()}); } catch { /* Caller retains its receipt; no automatic paid retry. */ }
  }
  dispose() {
    // End voice ownership immediately, but let an already-authorized HTTP tool
    // finish under its own timeout so its paid result can reach the same board.
    this.stopped = true; this.transcript = [];
    for (const pending of this.waiters.values()) for (const done of pending) done();
    this.waiters.clear(); this.calls.clear(); this.responses.clear(); this.current.clear();
  }
}
