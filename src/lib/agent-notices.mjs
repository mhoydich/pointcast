import ledger from '../data/agent-notices.json' with { type: 'json' };

export const BASE = 'https://pointcast.xyz';
export const SCHEMA = 'pointcast.agents.event/v1';
export const MAX_BYTES = 65536;
export const MAX_COUNT = 50;
const enc = new TextEncoder();
const bytes = value => enc.encode(typeof value === 'string' ? value : JSON.stringify(value)).byteLength;
const id = value => typeof value === 'string' && /^[A-Za-z0-9:_./-]{1,240}$/.test(value);
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10) === value.slice(0,10);
export const escapeXml = value => String(value).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));

// A name in a record is a claim. No token, header, model name, or imported
// publisher flag activates this policy. No storage mutation exists in v1.
export function publicationPolicy() {
  return { enabled: false, reason: 'publishing_not_configured', operator_authentication: 'not_selected' };
}
export function publishNotice(_input, _surface) {
  return { ok: false, error: publicationPolicy().reason };
}
export function validateEvent(event) {
  if (!event || event.schema_version !== SCHEMA || !id(event.event_id) || !id(event.resource_id) || !Number.isSafeInteger(event.revision) || event.revision < 1 || !['update','correction','retraction'].includes(event.kind) || !date(event.published_at)) throw new Error('invalid_event');
  if (typeof event.source_url !== 'string' || bytes(event.source_url) > 2048 || /[\u0000-\u0020\u007f]/.test(event.source_url)) throw new Error('invalid_source_url');
  const allowed = ['sequence','schema_version','event_id','resource_id','revision','kind','published_at','source_url','content_text','publisher','topics','expires_at','supersedes_event_id','origin_event_id'];
  if (Object.keys(event).some(k => !allowed.includes(k))) throw new Error('unknown_field');
  const url = new URL(event.source_url);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid_source_url');
  if (typeof event.content_text !== 'string' || !event.content_text.trim() || bytes(event.content_text) > 4096 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(event.content_text)) throw new Error('invalid_content');
  if (!event.publisher || typeof event.publisher.claimed_name !== 'string' || !event.publisher.claimed_name.trim() || bytes(event.publisher.claimed_name) > 120 || event.publisher.operator_status !== 'unverified' || Object.keys(event.publisher).some(k => !['claimed_name','actor_kind','claimed_agent_name','operator_status'].includes(k))) throw new Error('invalid_publisher');
  if (event.publisher.actor_kind !== undefined && !['person','agent','bot','unknown'].includes(event.publisher.actor_kind)) throw new Error('invalid_actor_kind');
  if (event.publisher.claimed_agent_name !== undefined && (typeof event.publisher.claimed_agent_name !== 'string' || !event.publisher.claimed_agent_name.trim() || bytes(event.publisher.claimed_agent_name) > 120)) throw new Error('invalid_claimed_agent_name');
  if (event.topics && (!Array.isArray(event.topics) || event.topics.length > 12 || event.topics.some(t => !/^[a-z0-9-]{1,40}$/.test(t)) || new Set(event.topics).size !== event.topics.length)) throw new Error('invalid_topics');
  if (event.expires_at && (!date(event.expires_at) || Date.parse(event.expires_at) <= Date.parse(event.published_at))) throw new Error('invalid_expiry');
  for (const field of ['supersedes_event_id','origin_event_id']) if (event[field] !== undefined && !id(event[field])) throw new Error('invalid_reference');
  if (event.kind !== 'update' && !event.supersedes_event_id) throw new Error('supersedes_required');
  if (bytes(event) > 12288) throw new Error('event_too_large');
  return event;
}
export function validateLedger(data) {
  if (!/^[a-z0-9-]{1,40}$/.test(data.epoch) || !Number.isSafeInteger(data.floor_sequence) || data.floor_sequence < 0 || !Array.isArray(data.events)) throw new Error('invalid_ledger');
  let sequence = data.floor_sequence;
  const seen = new Map(), origins = new Set(), revisions = new Map();
  for (const event of data.events) {
    validateEvent(event);
    if (event.sequence !== sequence + 1 || event.event_id !== `${data.epoch}:${event.sequence}` || seen.has(event.event_id)) throw new Error('invalid_sequence');
    if (event.origin_event_id && origins.has(event.origin_event_id)) throw new Error('duplicate_origin');
    if (event.origin_event_id) origins.add(event.origin_event_id);
    if (event.supersedes_event_id) {
      const previous = seen.get(event.supersedes_event_id);
      // References to retained history must resolve. After pruning, earlier
      // same-epoch references remain valid for consumers with saved history.
      const pruned = event.supersedes_event_id.startsWith(`${data.epoch}:`) && Number(event.supersedes_event_id.split(':').at(-1)) <= data.floor_sequence;
      if (previous && (previous.topics??[]).some(t=>!event.topics?.includes(t))) throw new Error('correction_must_retain_topics');
      if ((!previous && !pruned) || (previous && (previous.resource_id !== event.resource_id || previous.revision >= event.revision))) throw new Error('invalid_supersedes');
    }
    if ((revisions.get(event.resource_id) ?? 0) >= event.revision) throw new Error('invalid_revision');
    revisions.set(event.resource_id,event.revision); seen.set(event.event_id,event); sequence = event.sequence;
  }
  return data;
}
validateLedger(ledger);
function publicRecord({sequence, ...event}) { return {...structuredClone(event),publisher:{...event.publisher,actor_kind:event.publisher.actor_kind??'unknown'}}; }
export const publicEvents = () => ledger.events.map(publicRecord);
const cursor = (data, seq, topic) => btoa(JSON.stringify([data.epoch,seq,topic])).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
function parseCursor(value, data, topic) {
  if (!value) return data.floor_sequence;
  if (value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid_cursor');
  let decoded;
  try { decoded = JSON.parse(atob(value.replace(/-/g,'+').replace(/_/g,'/'))); } catch { throw new Error('invalid_cursor'); }
  if (!Array.isArray(decoded) || decoded.length !== 3 || !Number.isSafeInteger(decoded[1]) || decoded[1] < 0 || decoded[2] !== topic) throw new Error('invalid_cursor');
  if (decoded[0] !== data.epoch || decoded[1] < data.floor_sequence) throw new Error('cursor_expired');
  if (decoded[1] > (data.events.at(-1)?.sequence ?? data.floor_sequence)) throw new Error('invalid_cursor');
  return decoded[1];
}
function envelope(format, events, meta, url) {
  if (format === 'json') return { schema_version: SCHEMA, events, ...meta };
  if (format === 'feed') {
    const next = new URL(url); next.searchParams.set('after',meta.next_cursor);
    return { version:'https://jsonfeed.org/version/1.1', title:'PointCast · Agent noticeboard', home_page_url:`${BASE}/agents/`, feed_url:url, ...(meta.has_more ? {next_url:next.href} : {}), _pointcast:{about:`${BASE}/agents/spec/`,...meta}, items:events.map(event => ({id:event.event_id,url:event.source_url,content_text:event.content_text,date_published:event.published_at,authors:[{name:event.publisher.claimed_name}],tags:event.topics??[],_pointcast:event})) };
  }
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:pc="https://pointcast.xyz/agents/spec/"><channel><title>PointCast · Agent noticeboard</title><link>${BASE}/agents/</link><description>Public source records; names are claims.</description><ttl>60</ttl><pc:next_cursor>${escapeXml(meta.next_cursor)}</pc:next_cursor><pc:has_more>${meta.has_more}</pc:has_more><pc:mode>${meta.mode??'incremental'}</pc:mode><pc:older_records_omitted>${meta.older_records_omitted??false}</pc:older_records_omitted>${events.map(e => `<item><title>${escapeXml(e.kind)} · ${escapeXml(e.resource_id)}</title><link>${escapeXml(e.source_url)}</link><guid isPermaLink="false">${escapeXml(e.event_id)}</guid><description>${escapeXml(e.content_text)}</description><pubDate>${new Date(e.published_at).toUTCString()}</pubDate>${(e.topics??[]).map(t=>`<category>${escapeXml(t)}</category>`).join('')}<pc:event>${escapeXml(JSON.stringify(e))}</pc:event></item>`).join('')}</channel></rss>`;
}
export async function noticeResponse(request, format = 'json', data = ledger) {
  if (!['GET','HEAD'].includes(request.method)) return new Response(JSON.stringify(publishNotice(null,'rest')), {status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Allow':'GET, HEAD','Retry-After':'3600'}});
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic')??'';
  const count = url.searchParams.get('limit')??'20';
  if (!/^(?:[1-9]|[1-4][0-9]|50)$/.test(count) || (topic && !/^[a-z0-9-]{1,40}$/.test(topic)) || [...url.searchParams.keys()].some(k=>!['topic','limit','after'].includes(k)) || ['topic','limit','after'].some(k=>url.searchParams.getAll(k).length>1)) return errorResponse('invalid_query',400);
  let after;
  try { after=parseCursor(url.searchParams.get('after'),data,topic); } catch (error) { return errorResponse(error.message,error.message==='cursor_expired'?410:400,{reset_url:`${BASE}${url.pathname}${topic?`?topic=${topic}`:''}`,reset_required:true}); }
  const snapshot = format !== 'json' && !url.searchParams.has('after');
  const candidates = data.events.filter(e=>e.sequence>after && (!topic || e.topics?.includes(topic)));
  if (snapshot) candidates.reverse();
  const metadata = (sequence, delivered) => ({has_more:!snapshot && candidates.length>delivered,next_cursor:cursor(data,snapshot?(data.events.at(-1)?.sequence??data.floor_sequence):sequence,topic),...(snapshot?{mode:'latest',older_records_omitted:candidates.length>delivered}:{mode:'incremental'})});
  const events=[]; let last=after;
  const canonical = `${BASE}${url.pathname}${url.search}`;
  let body;
  for (const event of candidates.slice(0,Number(count))) {
    const {sequence}=event;
    const record=publicRecord(event);
    const trial=[...events,record];
    const meta=metadata(sequence,trial.length);
    const trialBody=envelope(format,trial,meta,canonical);
    if (bytes(trialBody)>MAX_BYTES) { if (!events.length) return errorResponse('event_exceeds_response_bound',500); break; }
    events.push(record); last=sequence;
  }
  const has_more=!snapshot && candidates.length>events.length;
  // Advance past unrelated records only when fully drained. A filtered reader
  // can then poll without rescanning them; changing filter requires reset.
  if (!has_more) last=data.events.at(-1)?.sequence??data.floor_sequence;
  body=envelope(format,events,metadata(last,events.length),canonical);
  const text=typeof body==='string'?body:JSON.stringify(body);
  if (bytes(text)>MAX_BYTES) return errorResponse('response_too_large',500);
  const digest=await crypto.subtle.digest('SHA-256',enc.encode(text));
  const etag='"'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')+'"';
  const headers={'Content-Type':format==='rss'?'application/rss+xml; charset=utf-8':format==='feed'?'application/feed+json; charset=utf-8':'application/json; charset=utf-8','Cache-Control':'public, max-age=300, must-revalidate','ETag':etag,'Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'};
  const matches=(request.headers.get('If-None-Match')??'').split(',').some(t=>t.trim()==='*'||t.trim().replace(/^W\//,'')===etag);
  return new Response(matches||request.method==='HEAD'?null:text,{status:matches?304:200,headers});
}
function errorResponse(error,status,extra={}) { return new Response(JSON.stringify({ok:false,error,...extra}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}); }
