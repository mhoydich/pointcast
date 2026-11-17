import { createFloor } from './floor-layout.mjs';
import { createDesk, updateDesk } from './desk-view.mjs';
import { renderReplyThreads } from './reply-threads.mjs';
import { renderEvidence } from './evidence-indicators.mjs';
import { createPhoneNav } from './phone-nav.mjs';
import { createMotionControls } from './motion-ui.mjs';
const $ = id => document.getElementById(id);
const status = $('office-status'), refresh = $('office-refresh');
const motion = createMotionControls(document, document.body, {matchMedia:window.matchMedia?.bind(window)});
$('office-controls').append(motion.element);
const nav = createPhoneNav(document, {onSelect:key=>{const el=$('office-'+key);el.focus({preventScroll:true});el.scrollIntoView({block:'start'});}});
$('office-nav').append(nav.element);
let current = null, busy = false;
const safeLink = url => {try {const u=new URL(url);return u.origin==='https://pointcast.xyz'&&u.pathname==='/loom'?u.href:null;}catch{return null;}};
function paint(data) {
  current=data;
  const valid=data.schema==='pointcast.office-view/v1' && Array.isArray(data.desks) && data.desks.length<=25 && Array.isArray(data.events) && Array.isArray(data.edges);
  if(!valid) throw new Error('invalid_snapshot');
  const floor=createFloor(document,data.desks.map(d=>({handle:d.handle,name:d.name,nounUrl:null})));
  for(const d of data.desks){
    const mount=[...floor.querySelectorAll('[data-desk-handle]')].find(el=>el.dataset.deskHandle===d.handle);
    const nounUrl=typeof d.nounUrl==='string'&&d.nounUrl.startsWith('/images/ufogp/')?new URL(d.nounUrl,location.origin).href:null;
    const desk=createDesk(document,{...d,nounUrl}); updateDesk(desk,d.facts);
    const note=document.createElement('p');note.className='desk-note';note.textContent=d.lifecycle+' · '+d.artNote;
    const details=document.createElement('details'),summary=document.createElement('summary');
    summary.textContent='Source and last report';details.append(summary);
    desk.querySelectorAll('.office-desk__status,.office-desk__receipt,.office-desk__as-of,.office-desk__explanation').forEach(el=>details.append(el));
    details.append(note);desk.append(details);mount.append(desk);
  }
  $('office-floor').replaceChildren(floor);
  const list=document.createElement('ul');
  for(const e of data.events.slice(-40).reverse()){
    const url=safeLink(e.sourceUrl);if(!url)continue;
    const li=document.createElement('li'),a=document.createElement('a');a.href=url;a.textContent=(e.handle||'Unresolved label')+' · '+e.type+' · '+e.at;li.append(a);list.append(li);
  }
  if(!list.children.length){const li=document.createElement('li');li.textContent='No eligible recent posts observed. This is not a claim that nobody is working.';list.append(li);}
  $('office-events').replaceChildren(list);
  const links=renderReplyThreads(document,data.edges,{});links.querySelector('svg').remove();$('office-events').append(links);
  $('office-evidence').replaceChildren(renderEvidence(document,{merges:data.merges,blocked:data.blocked,asOf:data.observedAt,stale:!data.evidenceFresh}));
  const fine=document.createElement('p');fine.className='fine';fine.textContent='Tracked PRs: '+(data.trackedPrs||[]).join(', ')+'. This is a bounded watch list.';$('office-evidence').append(fine);
  status.textContent=data.state==='ended'?'Experiment ended. Source reads are stopped.':'Snapshot '+data.observedAt+' · '+data.state+(data.errors?.length?' · Some source checks are unavailable; unresolved desks stay dark':'')+'. Tap to read again.';
  refresh.disabled=data.state==='ended';drawEdges();
}
function drawEdges(){
  document.querySelector('.floor-threads')?.remove();if(!current?.edges?.length)return;
  const root=$('office-floor'),box=root.getBoundingClientRect(),positions={};
  root.querySelectorAll('[data-desk-handle]').forEach(el=>{const r=el.getBoundingClientRect();positions[el.dataset.deskHandle]={x:r.left-box.left+r.width/2,y:r.top-box.top+45};});
  const lines=renderReplyThreads(document,current.edges,positions);lines.classList.add('floor-threads');root.append(lines);
}
async function read(){
  if(busy)return;busy=true;refresh.disabled=true;status.textContent='Reading public sources…';
  const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),45000);
  try{
    const res=await fetch('/api/office',{method:'GET',credentials:'omit',signal:controller.signal});if(!res.ok)throw new Error('unavailable');
    paint(await res.json());
  }catch{
    // Never keep an old lit floor on a failed read.
    current=null;$('office-floor').replaceChildren(Object.assign(document.createElement('p'),{textContent:'Floor unavailable. Read the source board or try again.'}));
    $('office-events').replaceChildren();$('office-evidence').replaceChildren(Object.assign(document.createElement('p'),{textContent:'Provider evidence unavailable; no fire or red lamp asserted.'}));
    status.textContent='Source read failed. No live activity or running count is asserted.';
  }finally{clearTimeout(deadline);busy=false;if(current?.state!=='ended')refresh.disabled=false;}
}
refresh.addEventListener('click',read);window.addEventListener('resize',drawEdges);
// No auto retry, visibility fetch, recurring timer, fabricated post or fixture fallback.
read();
