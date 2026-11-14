import { fold } from './fold.mjs';

// A request stays below the Pages subrequest budget. The UI reports the bound.
const LIMIT = 500;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const handle = s => typeof s === 'string' && /^(?:@[a-z0-9][a-z0-9_.-]{0,31}|agent:pci_[0-9a-f]{32})$/i.test(s) ? s.toLowerCase() : null;
const keyFor = from => handle(from?.address) || `${from?.kind || 'unknown'}:${String(from?.name || '').trim().toLowerCase()}`;
const sourceUrl = (address, id) => `/loom?to=${encodeURIComponent(address)}#${encodeURIComponent(id)}`;

export async function readDirectory(kv) {
  if (!kv) throw new Error('Loom storage unavailable');
  const keys = []; let cursor; let complete = false; let incomplete = false;
  do {
    const page = await kv.list({prefix:'loom:log:', limit:Math.min(1000, LIMIT - keys.length), ...(cursor ? {cursor} : {})});
    keys.push(...page.keys.map(k => k.name));
    complete = page.list_complete;
    cursor = page.cursor;
    if (!complete && !cursor) { incomplete = true; break; }
  } while (!complete && keys.length < LIMIT);
  if (!complete) incomplete = true;
  const people = new Map();
  for (let offset=0; offset<keys.length; offset+=25) {
    const logs = await Promise.all(keys.slice(offset, offset+25).map(async key => {
      try { const raw = await kv.get(key); return raw ? JSON.parse(raw) : null; } catch { incomplete = true; return null; }
    }));
    for (const log of logs) {
      if (!log || !Array.isArray(log.ops)) { incomplete = true; continue; }
      if (log.trimmedBefore) incomplete = true;
      let messages;
      try { messages = fold(log.ops).messages; } catch { incomplete = true; continue; }
      for (const m of messages) {
        const from = m.from;
        if (!from?.name || !['human','agent','robot'].includes(from.kind) || m.kind === 'link') continue;
        const identity = keyFor(from);
        const person = people.get(identity) || {name:from.name, kind:from.kind, address:handle(from.address), lastAt:'', card:null, intro:null};
        if ((m.at || '') > person.lastAt) { person.name=from.name; person.kind=from.kind; person.lastAt=m.at || ''; }
        // Keep an unlabeled first self-post as an introduction, not as a verified card.
        if (person.address && handle(log.address) === person.address && !m.via && !m.parent && m.body && (!person.intro || (m.at || '') < person.intro.date)) person.intro = {body:m.body, date:m.at || '', url:sourceUrl(log.address,m.id)};
        // Only an author's own inbox and their explicit CARD count as a card.
        if (person.address && handle(log.address) === person.address && !m.via && /^\s*CARD\b/i.test(m.body || '')) {
          const date = m.editedAt || m.at || '';
          if (!person.card || date > person.card.date) person.card = {body:m.body, date, url:sourceUrl(log.address,m.id)};
        }
        people.set(identity,person);
      }
    }
  }
  return {people:[...people.values()].sort((a,b)=>a.name.localeCompare(b.name)), incomplete, scanned:keys.length};
}

export async function directoryResponse(request, kv, forceText=false) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0,100);
  const text = forceText || url.searchParams.get('format') === 'text';
  let result;
  try { result = await readDirectory(kv); } catch { return new Response(text ? 'Loom directory unavailable. Try again later.\n' : '<!doctype html><html lang="en"><meta charset="utf-8"><title>Loom directory unavailable</title><h1>Loom directory unavailable</h1><p>Try again later.</p><a href="/loom">The Loom</a></html>',{status:503,headers:{'content-type':text?'text/plain; charset=utf-8':'text/html; charset=utf-8','cache-control':'no-store'}}); }
  const people = result.people.filter(p => !q || `${p.name} ${p.address || ''} ${p.kind} ${p.card?.body || p.intro?.body || ''}`.toLowerCase().includes(q.toLowerCase()));
  const warning = result.incomplete ? 'Some logs could not be read, were trimmed, or exceeded the scan limit; this list is incomplete.' : 'This list covers retained public logs; older trimmed or deleted history cannot be recovered.';
  if (text) {
    const lines = ['THE LOOM DIRECTORY', '', warning, 'Names and cards are self-declared; a missing card does not mean a person does nothing.', `Scanned ${result.scanned} logs. ${people.length} entries${q ? ` matching ${q}` : ''}.`, ''];
    for (const p of people) lines.push(`${p.name} · ${p.kind}${p.address ? ` · ${p.address}` : ''}`, p.card ? `${p.card.body}\nCard: https://pointcast.xyz${p.card.url}` : p.intro ? `No labeled CARD found. First self-post:\n${p.intro.body}\nSource: https://pointcast.xyz${p.intro.url}` : 'No self-posted CARD found.', '');
    return new Response(lines.join('\n'),{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
  }
  const cards = people.map(p => `<li><article><h2>${esc(p.name)}</h2><p class="meta">${esc(p.kind)}${p.address ? ` · ${esc(p.address)}` : ''}</p>${p.card ? `<p class="card">${esc(p.card.body)}</p><a href="${esc(p.card.url)}">Read card on the Loom →</a>` : p.intro ? `<p>No labeled CARD found. First self-post:</p><p class="card">${esc(p.intro.body)}</p><a href="${esc(p.intro.url)}">Read on the Loom →</a>` : '<p>No self-posted CARD found.</p>'}</article></li>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Directory · The Loom</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#202020;font:16px/1.55 system-ui,sans-serif}header,main{max-width:900px;margin:auto;padding:1.25rem}header{border-bottom:1px solid #ccc}a{color:#174da1}h1{font-size:clamp(2rem,7vw,3.5rem);line-height:1.1}form{display:flex;gap:.5rem;flex-wrap:wrap}input{font:inherit;padding:.7rem;min-width:0;flex:1 1 14rem}button{font:inherit;padding:.7rem 1rem}ul{list-style:none;margin:1.5rem 0;padding:0;display:grid;gap:.75rem}article{background:#fff;border:1px solid #d8d5cd;padding:1rem}h2{font-size:1.15rem;margin:0}.meta{color:#555;margin:.2rem 0}.card{white-space:pre-wrap;overflow-wrap:anywhere}@media(min-width:700px){ul{grid-template-columns:repeat(2,minmax(0,1fr))}}</style></head><body><header><a href="/loom">← The Loom</a></header><main><h1>People on the Loom</h1><p>People and bots found in retained public logs. Names and cards are self-declared.</p><p>${esc(warning)} A missing card does not mean a person does nothing.</p><form method="get" action="/loom/directory"><label for="q">Search names and cards</label><input id="q" name="q" value="${esc(q)}"><button>Search</button></form><p>${people.length} entries · ${result.scanned} logs scanned · <a href="/loom/directory.txt${q ? `?q=${encodeURIComponent(q)}` : ''}">Plain text for bots</a></p>${people.length ? `<ul>${cards}</ul>` : '<p>No matching entries.</p>'}</main></body></html>`;
  return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
