import test from 'node:test';
import assert from 'node:assert/strict';
import { active, admissionReason, baseStatus, CLIENT_EVENTS, fixedSessionConfig, IP_WINDOW_MS, MAX_REQUEST_BYTES, maxSessions, parseOffer, readBoundedBody, recoverUnsupportedRedirect, reserve, validOrigin } from '../src/policy.ts';
import type { Ledger, SessionRecord } from '../src/policy.ts';
const env = { VOICE_ENABLED:'true', OPENAI_API_KEY:'fixture-only', SITE_ORIGIN:'https://example.test', EXPERIMENT_END:'2099-01-01T00:00:00Z', MAX_SESSIONS:'10' };
const fresh = (): Ledger => ({attempts:0,salt:'salt',ipAttempts:{},sessions:{}});
const record = (id: string): SessionRecord => ({id,tokenHash:'hash',createdAt:100,deadline:120100,status:'creating'});
const sdp = 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n';
test('exact CORS origin; rejects suffix, null, absent and path', () => {
  assert.equal(validOrigin(env.SITE_ORIGIN,env),true);
  for(const origin of [null,'null','https://example.test.evil.com','https://example.test/','http://localhost:3000']) assert.equal(validOrigin(origin,env),false);
});
test('native PointCast origin is opt-in and exact while the existing site stays allowed', () => {
  const native = {...env, POINTCAST_ORIGIN:'https://pointcast.xyz'};
  assert.equal(validOrigin(env.SITE_ORIGIN,native),true);
  assert.equal(validOrigin('https://pointcast.xyz',native),true);
  assert.equal(validOrigin('https://pointcast.xyz',env),false);
  for(const origin of ['http://pointcast.xyz','https://www.pointcast.xyz','https://pointcast.xyz/','https://pointcast.xyz:8443','https://pointcast.xyz.evil.test','https://preview.pointcast.pages.dev','https://pointcast.pages.dev','null',null]) assert.equal(validOrigin(origin,native),false);
  assert.equal(validOrigin('https://evil.test',{...env,POINTCAST_ORIGIN:'https://evil.test'}),false);
});
test('localhost permitted only under explicit development', () => {
  assert.equal(validOrigin('http://localhost:3000',{...env,ENVIRONMENT:'development'}),true);
  assert.equal(validOrigin('http://localhost.evil:3000',{...env,ENVIRONMENT:'development'}),false);
});
test('missing credentials, disabled flag, unset/expired expiry fail closed', () => {
  assert.equal(baseStatus({...env,OPENAI_API_KEY:undefined}).reason,'setup_required');
  assert.equal(baseStatus({...env,VOICE_ENABLED:'false'}).reason,'paused');
  assert.equal(baseStatus({...env,EXPERIMENT_END:''}).reason,'setup_required');
  assert.equal(baseStatus({...env,EXPERIMENT_END:'2000-01-01'}).reason,'expired');
});
test('SDP accepts audio and event data; rejects arbitrary config, URLs, video, oversized', () => {
  assert.equal(parseOffer({sdp}),sdp);
  assert.equal(parseOffer({sdp,voiceTools:true}),sdp);assert.equal(parseOffer({sdp,voiceTools:false}),sdp);
  for(const value of [{sdp,model:'evil'},{sdp,instructions:'ignore'},{sdp,voiceTools:'true'},{sdp,voiceTools:1},{sdp,voiceTools:true,tools:[]}, {url:'https://private'}, {sdp:'https://foo'}, {sdp:sdp+'m=video 9 x\r\n'}, {sdp:'v=0'+'x'.repeat(MAX_REQUEST_BYTES)}, null]) assert.equal(parseOffer(value),null);
});
test('counts all attempts; failed calls never refund total allowance', () => {
  const ledger=fresh();
  for(let i=0;i<10;i++){ assert.equal(reserve(ledger,env,String(i),record(String(i)),100),null); ledger.sessions[String(i)].status='failed'; }
  assert.equal(ledger.attempts,10); assert.equal(reserve(ledger,env,'next',record('next'),100),'limit_reached');
});
test('expanded pool retains a fixed fifty-attempt ceiling and conservative default', () => {
  assert.equal(maxSessions({}),10);
  assert.equal(maxSessions({MAX_SESSIONS:'50'}),50);
  assert.equal(maxSessions({MAX_SESSIONS:'100'}),50);
  for(const value of ['0','-1','invalid']) assert.equal(maxSessions({MAX_SESSIONS:value}),0);
  const ledger=fresh(); ledger.attempts=50;
  assert.equal(admissionReason(ledger,{...env,MAX_SESSIONS:'100'}),'limit_reached');
});
test('adding capacity preserves debits and the hourly network allowance', () => {
  const ledger=fresh();
  for(let i=0;i<10;i++){ assert.equal(reserve(ledger,env,'same',record(String(i)),100),null); ledger.sessions[String(i)].status='closed'; }
  const expanded={...env,MAX_SESSIONS:'50'};
  assert.equal(reserve(ledger,expanded,'same',record('next'),101),'rate_limited');
  assert.equal(ledger.attempts,10);
  assert.equal(reserve(ledger,expanded,'same',record('next'),100+IP_WINDOW_MS+1),null);
  assert.equal(ledger.attempts,11);
  assert.equal(Object.keys(ledger.sessions).length,11);
});
test('two pending creates consume concurrency; uncertainty blocks intake', () => {
  const ledger=fresh();
  assert.equal(reserve(ledger,env,'a',record('1'),100),null);
  assert.equal(reserve(ledger,env,'b',record('2'),100),null);
  assert.equal(reserve(ledger,env,'c',record('3'),100),'busy');
  ledger.sessions['1'].status='uncertain'; assert.equal(admissionReason(ledger,env),'needs_attention');
  ledger.sessions['1'].status='closing'; assert.equal(admissionReason(ledger,env),'needs_attention');
  assert.equal(active(ledger.sessions['1']),true);
});
test('repeat calls share the original ten-attempt ceiling without the old three-call block', () => {
  const ledger=fresh();
  for(let i=0;i<10;i++){ assert.equal(reserve(ledger,env,'same',record(String(i)),100),null); ledger.sessions[String(i)].status='closed'; }
  assert.equal(ledger.attempts,10); assert.equal(reserve(ledger,env,'same',record('next'),101),'limit_reached');
  const limited=fresh();limited.ipAttempts.same=Array(10).fill(100);
  assert.equal(admissionReason(limited,env,'same',101),'rate_limited');
  assert.equal(admissionReason(limited,env,'same',100+IP_WINDOW_MS+1),null);
});
test('only the diagnosed pre-fetch redirect failure is recovered, with quota retained', () => {
  const ledger=fresh(); reserve(ledger,env,'one',record('one'),100);
  ledger.sessions.one.status='uncertain'; ledger.haltReason='creation_uncertain';
  assert.equal(recoverUnsupportedRedirect(ledger),false);
  ledger.accessProbe={state:'transport_error',code:'TypeError',message:'Invalid redirect value, must be one of "follow" or "manual"'};
  const ambiguous=structuredClone(ledger); ambiguous.sessions.one.upstreamId='live_accepted';
  assert.equal(recoverUnsupportedRedirect(ambiguous),false);
  assert.equal(recoverUnsupportedRedirect(ledger),true);
  assert.equal(ledger.attempts,1); assert.equal(ledger.sessions.one.status,'failed');
  assert.equal(admissionReason(ledger,env),null);
});
test('fixed API config locks model/tools/client events and has no private history', () => {
  const config=fixedSessionConfig(true);
  assert.equal(config.model,'gpt-live-1'); assert.equal(config.store,false);
  assert.deepEqual(config.client.data_channel.allowed_client_events,CLIENT_EVENTS);
  assert.ok(config.client.data_channel.allowed_server_events.some(e=>e.type==='response.event' && e.response_event==='response.output_item.done'));
  assert.ok(config.client.data_channel.allowed_server_events.filter(e=>e.type==='response.event').every(e=>typeof e.response_event==='string'));
  assert.equal(config.delegation.responses.model,'gpt-6-astra');
  assert.equal(config.delegation.responses.max_output_tokens,768);
  assert.equal(config.delegation.responses.tool_choice,'auto');
  assert.deepEqual(config.delegation.responses.tools.map(t=>t.name),['search_web','generate_image']);
  assert.equal(config.delegation.responses.parallel_tool_calls,false);
  assert.equal(config.delegation.responses.tools.some(t=>t.type==='web_search'),false,'hosted search cannot bypass server reservations');
  assert.ok(config.delegation.responses.tools.every(t=>t.parameters.required.includes('request_quote')));
  assert.equal('input' in config,false); assert.equal('session_id' in config,false);
});
test('old and cached clients retain voice-only delegation until they explicitly support tool receipts',()=>{
 for(const config of [fixedSessionConfig(),fixedSessionConfig(false)]){
  assert.equal(config.delegation.responses.model,'gpt-5.6-luna');assert.equal(config.delegation.responses.max_output_tokens,256);
  assert.equal(config.delegation.responses.tool_choice,'none');assert.deepEqual(config.delegation.responses.tools,[]);
  assert.equal(config.client.data_channel.allowed_server_events.some(e=>e.type==='response.event'),false);
 }
});
test('bounded parser stops a body without content-length', async () => {
  const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(20));controller.enqueue(new Uint8Array(20));controller.close();}});
  await assert.rejects(readBoundedBody(new Response(body),30),/body_too_large/);
});
