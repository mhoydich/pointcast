import {API,readGame,clockText,chainHTML,makePost,link} from './model.mjs';
let state=null, checked=0, busy=false, portraits={}, refreshVersion=0;
const el=id=>document.getElementById(id);
function paint() {
  if (!state) return;
  el('chain').innerHTML=chainHTML(state,portraits);
  el('tag').textContent=state.latest?.tag || 'Waiting for a first tag';
  el('game-status').textContent=state.status;
  el('checked').textContent='Read at '+new Date(checked).toLocaleTimeString()+'. Names, quotes and sources are not authenticated.';
  el('notices').replaceChildren(...state.notes.slice(-6).map(n=>{
    const p=document.createElement('p'),a=document.createElement('a');a.href=link(n.id);a.textContent=n.name+': '+n.body;p.append(a);return p;
  }));
  document.dispatchEvent(new CustomEvent('socrates-state',{detail:{...state,checkedAt:checked}}));
  tick();
}
function tick() {
  const stale=!checked || Date.now()-checked>120000;
  el('clock').textContent=state ? clockText(state.deadline) : 'Clock unavailable';
  el('move-submit').disabled=busy || stale || !state?.latest || state.attention || Date.now()>=state.deadline;
  if (stale) el('game-status').textContent='Room data is stale or unavailable. Refresh before playing.';
  else if (state && Date.now()>=state.deadline) el('game-status').textContent='Reported clock expired — Daniel decides how play resumes.';
}
async function fetchRoom() {
  const r=await fetch(API,{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!r.ok) throw new Error('Room could not be read.');
  return readGame(await r.json());
}
async function refresh() {
  if(busy)return;
  const version=++refreshVersion;
  try { const next=await fetchRoom();if(version!==refreshVersion)return;state=next;checked=Date.now();paint();el('read-error').textContent=''; }
  catch { if(version!==refreshVersion)return;checked=0;el('read-error').textContent='Live read failed. Retained text may be old; open the room or retry. No move is enabled.';tick(); }
}
el('refresh').addEventListener('click',refresh);
el('motion').addEventListener('click',()=>{const paused=el('motion').getAttribute('aria-pressed')!=='true';el('motion').setAttribute('aria-pressed',String(paused));el('motion').textContent=paused?'Resume flame':'Pause flame';document.querySelector('hearth-fire').style.display=paused?'none':'';el('flame-still').hidden=!paused;});
document.querySelectorAll('[data-live-form]').forEach(n=>n.disabled=false);
el('move-form').addEventListener('focusin',()=>{if(!el('move-form').dataset.parent && state?.latest)el('move-form').dataset.parent=state.latest.id;});
for(const mode of ['join','move']) el(mode+'-form').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget;if(busy)return;
  ++refreshVersion;
  const result=el(mode+'-result');result.textContent='Checking the room…';busy=true;tick();
  const data=Object.fromEntries(new FormData(form));
  let sending=false;
  try {
    const old=form.dataset.parent || state?.latest?.id;
    const fresh=await fetchRoom();state=fresh;checked=Date.now();paint();
    if(mode==='move' && old!==fresh.latest?.id)throw new Error('The reported move changed. Read it before submitting again.');
    const payload=makePost(data,state,mode);
    result.textContent='Posting publicly…';sending=true;
    const r=await fetch('/api/loom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
    const answer=await r.json();
    if(!r.ok || !answer.ok) {sending=false;throw new Error(answer.error || 'Post was refused.');}
    result.replaceChildren(document.createTextNode('Board accepted the post. '));
    const a=document.createElement('a');a.href=link(answer.message.id);a.textContent='Open its receipt and verify it remains there';result.append(a);
    // Success does not assert durable retention: the board has a known lost-write defect.
    await refresh();
  } catch(err) { result.textContent=sending?'Send outcome uncertain. Check the room before trying again; do not duplicate the post.':err.message; }
  finally {busy=false;delete form.dataset.parent;tick();refresh();}
});
fetch('/socrates-tag/players/manifest.json').then(r=>r.ok?r.json():{}).then(x=>{portraits=x.portraits||{};if(state)paint();}).catch(()=>{});
refresh();
setInterval(()=>{if(!document.hidden && !busy)refresh();},30000);
setInterval(tick,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
