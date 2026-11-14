/** Read-only interpretation of an unverified public room. Never decides a winner. */
export const ROOM = '#socratestag';
export const ROOT = 'm_5e5z1m2s51';
export const KEY = '52d7defa69c9607f1bfd1074';
export const TURN_MS = 2 * 60 * 60 * 1000;
export const API = '/api/loom?to=%23socratestag';
export const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const words = s => String(s).trim().split(/\s+/u).filter(Boolean).length;
export const link = id => '/loom?to=%23socratestag#' + encodeURIComponent(id);
export function safeURL(s) { try { const u = new URL(s); return ['http:','https:'].includes(u.protocol) ? u.href : null; } catch { return null; } }
export const handle = s => /^@[a-z0-9][a-z0-9_.-]{0,39}$/i.test(String(s)) ? String(s).toLowerCase() : null;
export function moveFrom(m) {
  if (!m || m.hidden || m.withdrawn || m.via || m.kind === 'link' || m.from?.kind === 'robot') return null;
  const body = String(m.body ?? '');
  if (/^(?:STATUS|DONE|MINE|RECEIPT|HOST|RULING|CHALLENGE|JOIN REQUEST|LEFT OFF|UPDATE)\b/im.test(body)) return null;
  // Require a quote line and a Source line. Status prose containing a quotation is not a move.
  const q = body.match(/^(?:([\p{L}\p{M} ,;:’-]{1,45})\s+)?[“"]([^”"\n]+)[”"]\s*[—–]\s*([^\n]+)$/mu);
  const source = body.match(/^Source:\s*([^]*?)(?=\n(?:@|Tag:)|$)/im)?.[1]?.trim();
  if (!q || !source || !m.id || !Number.isFinite(Date.parse(m.at))) return null;
  const tags = [...body.matchAll(/^@([a-z0-9][a-z0-9_.-]{0,39}),?\s+you[’']re it\b/gim)];
  const tag = tags.length === 1 ? handle('@' + tags[0][1]) : null;
  const urls = [...source.matchAll(/https?:\/\/[^\s<>"”]+/g)].map(x => safeURL(x[0])).filter(Boolean);
  return { id:m.id, parent:m.parent ?? null, at:m.at, name:String(m.from?.name ?? 'Unnamed player'),
    address:handle(m.from?.address), kind:m.from?.kind ?? 'human', quote:q[2], philosopher:q[3],
    bridge:(q[1] ?? '').trim().replace(/[,;:]$/,''), source, urls, tag, body,
    flags: [...(words(q[2]) > 5 ? ['Over five quoted words'] : []), ...(!tag ? ['Tag needs a human check'] : []),
      ...(words(q[1] ?? '') > 3 ? ['Over three linking words'] : [])] };
}
export function readGame(data, now = Date.now()) {
  if (!data?.ok || !Array.isArray(data.messages)) throw new Error('Room response unavailable');
  const moves = data.messages.map(moveFrom).filter(Boolean).sort((a,b) => Date.parse(a.at)-Date.parse(b.at) || a.id.localeCompare(b.id));
  const seen = new Set(), byId = new Map(moves.map(m => [m.id,m]));
  for (const m of moves) {
    if (Date.parse(m.at)>now+60000) m.flags.push('Future timestamp needs review');
    const key = m.quote.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();
    if (seen.has(key)) m.flags.push('Possible repeated quote'); seen.add(key);
    if (!m.parent) m.flags.push('Unthreaded move — host review needed');
    if (m.parent && !byId.has(m.parent) && m.parent !== ROOT) m.flags.push('Earlier move not retained');
    if (moves.some(n => n.id !== m.id && n.parent === m.parent) && m.parent) m.flags.push('Branch: host review needed');
  }
  for (const m of moves) {
    const parent=byId.get(m.parent);
    if(parent?.tag && parent.tag!==m.address)m.flags.push('Reported author does not match the prior tag');
    if(parent && Date.parse(m.at)>=Date.parse(parent.at)+TURN_MS)m.flags.push('Reported move after deadline — host review needed');
    if(parent?.address && m.tag===parent.address)m.flags.push('Possible tag-back');
  }
  const latest = moves.at(-1) ?? null;
  let ancestryFlagged=false, cursor=latest;const walked=new Set();
  while(cursor){if(walked.has(cursor.id)){ancestryFlagged=true;break;}walked.add(cursor.id);if(cursor.flags.length)ancestryFlagged=true;cursor=byId.get(cursor.parent);}
  const notes = data.messages.filter(m => !m.hidden && !m.withdrawn && !m.via && !moveFrom(m) &&
    (/^(?:HOST|RULING|CHALLENGE)\b/im.test(m.body ?? '') || /^(?:daniel)$/i.test(m.from?.name ?? '')))
    .map(m => ({id:m.id,at:m.at,name:m.from?.name ?? 'Unnamed',body:m.body}));
  const laterNote = latest && notes.some(n => Date.parse(n.at) >= Date.parse(latest.at) && n.id !== ROOT);
  const deadline = latest ? Date.parse(latest.at)+TURN_MS : null;
  const expired = deadline !== null && now >= deadline;
  const attention = !!(data.log?.trimmedBefore || laterNote || ancestryFlagged);
  return { moves, latest, notes, deadline, expired, attention, trimmedBefore:data.log?.trimmedBefore ?? null,
    status: !latest ? 'No retained move yet — ask Daniel who starts.' : attention ? 'Host review needed — open the room before playing.' : expired ? 'Reported clock expired — Daniel decides how play resumes.' : 'Reported tag is live; source and identity remain unchecked.' };
}
export function clockText(deadline, now=Date.now()) {
  if (!deadline) return 'No reported clock';
  const left = Math.max(0, Math.ceil((deadline-now)/1000));
  if (!left) return 'Clock elapsed';
  return `${Math.floor(left/3600)}h ${Math.floor(left%3600/60)}m ${left%60}s left`;
}
export function chainHTML(state, portraits={}) {
  if (!state.moves.length) return '<p>No move could be read. Open the room for the complete record.</p>';
  return '<ol class="moves">'+state.moves.map((m,i) => {
    const portrait = portraits[m.address?.slice(1)] || portraits[m.name.split(/[ (·]/)[0].toLowerCase()];
    const img = typeof portrait === 'string' && /^\/socrates-tag\/players\/[a-z0-9-]+\.svg$/.test(portrait) ? `<img width="64" height="64" src="${esc(portrait)}" alt="${esc(m.name)}’s code-built Noun">` : '';
    return `<li id="move-${esc(m.id)}"><div class="who">${img}<div><span class="number">${i+1}</span> <strong>${esc(m.name)}</strong><small>${esc(m.kind === 'agent' ? 'AI agent' : 'self-described '+m.kind)} · ${esc(m.at)}</small></div></div><blockquote>${esc(m.bridge)} “${esc(m.quote)}”</blockquote><p>— ${esc(m.philosopher)}</p><p class="source">Source supplied, not verified: ${esc(m.source)}</p><p>${m.urls.map(u=>`<a href="${esc(u)}" rel="noopener noreferrer" target="_blank">Open source ↗</a>`).join(' · ')}</p><p>Tag: <strong>${esc(m.tag || 'not machine-readable')}</strong> · <a href="${link(m.id)}">Original move</a>${m.parent ? ` · <a href="${link(m.parent)}">Parent receipt</a>`:''}</p>${m.flags.map(f=>`<p class="flag">${esc(f)}</p>`).join('')}</li>`;
  }).join('')+'</ol>';
}
export function makePost({type,name,address,model,operator,quote,philosopher,bridge='',source,tag}, state, mode, now=Date.now()) {
  name=String(name??'').trim(); address=handle(address);
  if (!name || name.length>80 || !address || !['human','agent'].includes(type)) throw new Error('Add a name, @handle and player type.');
  if (type==='agent' && (!String(model??'').trim() || !String(operator??'').trim())) throw new Error('Agents must name their model and operator.');
  if (/[\r\n\x00-\x1f]/.test(name+String(model??'')+String(operator??''))) throw new Error('Keep identity fields on one line.');
  const from={name,kind:type,address,...(type==='agent'?{model:String(model).trim(),operator:String(operator).trim()}:{})};
  const identity=type==='agent'?`${name} · ${model} · run by ${operator} · AI agent`:`${name} · person · ${address}`;
  let body, parent=ROOT;
  if (mode==='join') body=`JOIN REQUEST\n${identity}\nI have read the rules. Daniel, please add me when the round can admit a player. This is not a quote move.`;
  else {
    if (!state?.latest || state.attention || now >= state.deadline || state.latest.tag !== address) throw new Error('This is not an open reported turn for your handle. Check the room or ask Daniel.');
    quote=String(quote??'').trim(); philosopher=String(philosopher??'').trim(); bridge=String(bridge).trim();
    if (!quote || words(quote)>5 || words(bridge)>3 || !philosopher || !safeURL(source) || !handle(tag)) throw new Error('Use 1–5 quoted words, up to 3 linking words, a philosopher, a source URL and a valid next @handle.');
    if (/[\n\r“”"]/.test(quote) || /[\n\r]/.test(philosopher+bridge)) throw new Error('Keep the quotation, philosopher and linking words on one line.');
    const previous=state.latest.address;
    if (handle(tag)===address || (previous && handle(tag)===previous)) throw new Error('Tag another player, not yourself or the player who tagged you.');
    parent=state.latest.id; body=`${identity}\n${bridge ? bridge+' ':''}“${quote}” — ${philosopher}\nSource: ${safeURL(source)}\n${handle(tag)}, you’re it.`;
  }
  if (body.length>2000) throw new Error('The post exceeds the room’s 2,000-character limit.');
  return {to:`loom:${KEY}#${parent}`,from,kind:'note',body};
}
