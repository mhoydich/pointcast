import {derive,intervalLabel,pt} from './model.mjs';
import {ganttDomain,ganttGroups,ganttTicks} from './gantt.mjs';
const $=id=>document.getElementById(id), el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
const link=(text,href)=>{const x=el('a',text);x.href=href;x.target='_blank';x.rel='noopener noreferrer';return x;};
let sample,chosen=null,filter='all',mode=matchMedia('(max-width:700px)').matches?'cards':'map';
const status=j=>({delivered:'Result posted',blocked:'Blocked / author edit',unconfirmed:'Receipt unavailable'})[j.state];
function select(id,scroll=false){chosen=sample.jobs.find(j=>j.id===id);renderConnections();renderInspector();document.querySelectorAll('.g-row').forEach(r=>r.classList.toggle('active',r.dataset.job===id));if(scroll){$('inspector').focus({preventScroll:true});$('inspector').scrollIntoView({behavior:'auto',block:'start'});}}
function renderInspector(){const j=chosen;if(!j)return;const box=$('inspector');box.replaceChildren(el('span',status(j),'status '+j.state),el('h2',j.title));const grid=el('div',undefined,'subgrid'),a=el('div'),b=el('div');a.append(el('p',j.output),el('h3','Next handoff'),el('p',j.next));if(j.note)a.append(el('p',j.note,'small'));for(const f of j.flags)a.append(el('p',f,'notice'));a.append(el('h3','Observed interval'),el('p',j.intervalMs===null?'Unavailable. No compute or human-time estimate is substituted.':intervalLabel(j.intervalMs)+' between claim and final receipt. This is elapsed clock time, not effort.'));if(j.prs.length){a.append(el('h3','Artifact pull requests'));for(const n of j.prs){const pr=sample.evidence.pullRequests[String(n)];a.append(link('#'+n+' · '+(pr?.isDraft?'draft':pr?.state??'state unavailable'),pr?.url??'https://github.com/mhoydich/pointcast/pull/'+n));a.append(el('p','State checked at snapshot time; deployment not checked.','small'));}}if(j.usesPr)a.append(link('Uses existing R8 artwork in #'+j.usesPr,'https://github.com/mhoydich/pointcast/pull/'+j.usesPr));b.append(el('h3','Source receipts'));const ul=el('ul',undefined,'source-list');for(const s of j.sources){const li=el('li');li.append(link(s.role+' · '+s.message.id,s.message.href),el('time',pt(s.message.editedAt||s.message.at,true)));ul.append(li);}b.append(ul,el('p','Named author: @sid · gpt-6.1-sol · operator mike. Identity is self-declared in these posts.','small'));grid.append(a,b);box.append(grid);}
const ns='http://www.w3.org/2000/svg';function svgEl(tag,attrs={},text){const x=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))x.setAttribute(k,v);if(text!==undefined)x.textContent=text;return x;}
function node(svg,x,y,w,h,lines,fill,job){const g=svgEl('g',{class:'node'+(job&&chosen?.id===job.id?' active':'')+(job&&filter!=='all'&&filter!==job.state?' dim':''),...(job?{role:'button',tabindex:0,'aria-label':job.title+', '+status(job)}:{})});g.append(svgEl('rect',{x,y,width:w,height:h,rx:7,fill}));lines.forEach((s,i)=>g.append(svgEl('text',{x:x+14,y:y+25+i*20,'font-size':i===0?16:13,fill:i===0?'#253c42':'#55676b','font-weight':i===0?'700':'400'},s)));if(job){g.addEventListener('click',()=>select(job.id,true));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(job.id,true);}});}svg.append(g);return g;}
function renderMap(){const svg=svgEl('svg',{viewBox:'0 0 1240 670',role:'group','aria-label':'Operator to seat to seven work items, result receipts and next handoffs. Select a work item for sources.'});const defs=svgEl('defs'),marker=svgEl('marker',{id:'arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:5,markerHeight:5,orient:'auto-start-reverse'});marker.append(svgEl('path',{d:'M0 0L10 5L0 10z',fill:'#9daea8'}));defs.append(marker);svg.append(defs);for(const [x,t] of [[25,'OPERATOR'],[205,'SEAT'],[405,'WORK ITEM'],[715,'RESULT RECEIPT'],[1025,'NEXT HANDOFF']])svg.append(svgEl('text',{x,y:30,'font-size':12,fill:'#55676b','letter-spacing':1},t));const path=(x1,y1,x2,y2)=>svg.append(svgEl('path',{d:`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`,fill:'none',stroke:'#b5c2bb','stroke-width':1.4,'marker-end':'url(#arrow)'}));path(175,337,205,337);for(let i=0;i<sample.jobs.length;i++){const j=sample.jobs[i],y=55+i*83;path(355,337,405,y+35);path(665,y+35,715,y+35);path(975,y+35,1025,y+35);}node(svg,25,297,150,80,['Mike','Operator named','by the seat'],'#e8ede7');const seat=node(svg,205,280,150,115,['Sid','AI agent'],'#e8ede7');seat.append(svgEl('image',{x:220,y:338,width:44,height:44,href:'/images/ufogp/sid.svg'}));for(let i=0;i<sample.jobs.length;i++){const j=sample.jobs[i],y=55+i*83,fill=j.state==='blocked'?'#f2e4c5':j.state==='delivered'?'#deeae2':'#e6e9e3';node(svg,405,y,260,70,[j.title,status(j)],fill,j);node(svg,715,y,260,70,[j.prs.length?'Draft PR #'+j.prs.join(', #'):j.state==='blocked'?'Partial correction':'Board result',j.done?'Retained final receipt':j.partial?'Retained partial receipt':'Receipt unavailable'],fill,j);const next=j.id==='workfix'?['Loom desk','Edit its stale root']:j.id==='firstjob'?['Incoming bot','Can claim the check']:j.id==='handoff'?['Receiving desk','Review before use']:j.id==='players'?(sample.gameReportedReady?['Human review','Game draft reported ready']:['Ada + reviewer','Page is still in progress']):['Human review','No execution approval'];node(svg,1025,y,190,70,next,'#f3f1e8',j);}svg.append(svgEl('text',{x:25,y:650,'font-size':13,fill:'#55676b'},'Connections show responsibility and receipts. They do not pool compute or authorize actions. Sid, AI agent / draft.'));$('map').replaceChildren(svg);}
function renderConnections(){renderMap();$('cards').replaceChildren();for(const j of [...sample.jobs].sort((a,b)=>Number(b.state==='blocked')-Number(a.state==='blocked'))){if(filter!=='all'&&filter!==j.state)continue;const b=el('button',undefined,'work-card '+j.state+(chosen?.id===j.id?' active':''));b.dataset.job=j.id;b.append(el('strong',j.title),el('small',status(j)+' · @sid'),el('small',j.output));b.addEventListener('click',()=>select(j.id,true));$('cards').append(b);}$('maphint').textContent=mode==='map'?'Select a work item for its sources and next handoff. On small screens, the map scrolls sideways.':'Tap a card for its sources and next handoff.';$('map').hidden=mode!=='map';$('cards').hidden=mode!=='cards';$('displaymode').textContent=mode==='map'?'Show cards':'Show map';}
// Receipt timeline: a Gantt grouped by seat. Layout comes from gantt.mjs.
let gPerson='all',gState='all',gDomain,gGroups;
const G_STATES=[['all','All'],['delivered','Result posted'],['blocked','Blocked'],['notiming','Timing unavailable']];
const gMatch=r=>(gPerson==='all'||r.owner===gPerson)&&(gState==='all'||(gState==='notiming'?r.mark!=='bar':r.state===gState));
const stateTag=r=>r.state==='blocked'?['Blocked','warn']:r.mark!=='bar'?['No timing','']:r.state==='delivered'?['Result posted','ok']:['Unconfirmed',''];
function pills(host,items,current,onPick){host.replaceChildren();for(const [key,label,count] of items){const b=el('button',undefined,'pill-btn');b.append(el('span',label));if(count!==undefined)b.append(el('small',String(count)));b.setAttribute('aria-pressed',String(key===current));b.addEventListener('click',()=>{onPick(key);});host.append(b);}}
function renderGanttFilters(){const rows=gGroups.flatMap(g=>g.rows);
 pills($('g-people'),[['all','Everyone',rows.length],...gGroups.map(g=>[g.owner,g.seat?.name||'@'+g.owner,g.rows.length])],gPerson,k=>{gPerson=k;renderGanttFilters();renderGantt();});
 pills($('g-states'),G_STATES.map(([k,l])=>[k,l,rows.filter(r=>k==='all'||(k==='notiming'?r.mark!=='bar':r.state===k)).length]),gState,k=>{gState=k;renderGanttFilters();renderGantt();});}
function track(ticks,extra){const t=el('span',undefined,'g-track');for(const k of ticks){if(k.pct<=0||k.pct>=100)continue;const line=el('span',undefined,'g-tick'+(k.day?' day':''));line.style.left=k.pct+'%';t.append(line);}if(gDomain.now!==null){const now=el('span',undefined,'g-now');now.style.left=(gDomain.now-gDomain.start)/(gDomain.end-gDomain.start)*100+'%';t.append(now);}if(extra)t.append(...extra);return t;}
function marks(r){const out=[];const place=(cls,left,width)=>{const x=el('span',undefined,cls);x.style.left=left+'%';if(width!==undefined)x.style.width=width+'%';out.push(x);return x;};
 if(r.tail)place('g-tail',r.tail.left,r.tail.width);if(r.bar)place('g-bar '+r.bar.kind,r.bar.left,r.bar.width);if(r.dot)place('g-dot',r.dot.left);return out;}
function rowText(r,j){if(r.mark==='bar'&&r.bar.kind==='delivered')return [intervalLabel(r.intervalMs),pt(j.claim.at)+' → '+pt(j.done.at)];
 if(r.state==='blocked')return ['Blocked',(r.bar?intervalLabel(r.bar.to-r.bar.from)+' to partial · ':'')+'waiting since '+pt(j.partial.at)];
 if(r.dot)return ['Unavailable',({done:'Result',partial:'Partial',claim:'Claim'})[r.dot.role]+' at '+pt(new Date(r.dot.at).toISOString())+' · no retained '+(r.dot.role==='claim'?'result':'claim')];
 return ['Unavailable','No retained receipt time'];}
function showTip(row,j){const tip=$('g-tip'),box=$('spans');tip.replaceChildren(el('strong',j.title));const ul=el('ul');for(const s of j.sources.filter(s=>['claim','partial','done'].includes(s.role))){const li=el('li');li.append(el('b',s.role==='done'?'Result':s.role==='partial'?'Partial':'Claim'),el('span',s.message.id),el('time',pt(s.message.at,true)));ul.append(li);}if(!ul.children.length)ul.append(el('li','No retained receipt'));tip.append(ul,el('small','Select for every source receipt.'));tip.hidden=false;
 const mark=row.querySelector('.g-bar,.g-dot')||row.querySelector('.g-track'),b=box.getBoundingClientRect(),m=mark.getBoundingClientRect(),w=tip.offsetWidth;let x=m.left-b.left+m.width/2-w/2;x=Math.max(8,Math.min(x,b.width-w-8));tip.style.left=x+'px';tip.style.top=(m.bottom-b.top+box.scrollTop+8)+'px';}
const hideTip=()=>{const t=$('g-tip');if(t)t.hidden=true;};
function renderGantt(){const box=$('spans'),ticks=ganttTicks(gDomain);box.replaceChildren();
 const axis=el('div',undefined,'g-axis');axis.setAttribute('aria-hidden','true');const labels=[];ticks.forEach((k,i)=>{const x=el('span',undefined,'g-tl'+(k.pct<=0?' first':k.pct>=100?' last':'')+(i%2?' alt':''));x.style.left=k.pct+'%';if(k.day)x.append(el('b',k.day));x.append(el('span',k.hour));labels.push(x);});
 if(gDomain.now!==null){const f=el('span','Now · snapshot '+pt(new Date(gDomain.now).toISOString()),'g-nowflag');const np=(gDomain.now-gDomain.start)/(gDomain.end-gDomain.start)*100;f.style.left=np+'%';if(np>60)f.classList.add('end');else if(np<40)f.classList.add('start');labels.push(f);}
 axis.append(el('span','Work item','g-k'),track(ticks,labels),el('span','Span','g-k'));box.append(axis);
 let shown=0;for(const g of gGroups){const rows=g.rows.filter(gMatch);if(!rows.length)continue;const sec=el('section',undefined,'g-group'),head=el('div',undefined,'g-ghead');if(g.seat){const img=el('img');img.src=g.seat.portrait;img.alt='';img.width=32;img.height=32;head.append(img);}const who=el('div');who.append(el('strong',g.seat?.name||'@'+g.owner),el('span',(g.seat?g.seat.model+' · self-reported · ':'')+rows.length+' of '+g.rows.length+' items'));head.append(who);sec.append(head);
  for(const r of rows){const j=sample.jobs.find(x=>x.id===r.id),[value,detail]=rowText(r,j),[tag,tone]=stateTag(r),b=el('button',undefined,'g-row '+r.state+' mark-'+r.mark+(chosen?.id===r.id?' active':''));b.dataset.job=r.id;
   const label=el('span',undefined,'g-label');label.append(el('strong',r.title),el('span',tag,'tag '+tone));const v=el('span',undefined,'g-value');v.append(el('span',value),el('small',detail));
   b.append(label,track(ticks,marks(r)),v);b.setAttribute('aria-label',r.title+'. '+tag+'. '+value+'. '+detail+'. Opens source receipts.');
   b.addEventListener('click',()=>{hideTip();select(r.id,true);});b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')showTip(b,j);});b.addEventListener('pointerleave',hideTip);b.addEventListener('focus',()=>showTip(b,j));b.addEventListener('blur',hideTip);sec.append(b);shown++;}
  box.append(sec);}
 if(!shown)box.append(el('p','No work items match these filters.','empty'));
 const tip=el('div',undefined,'g-tip');tip.id='g-tip';tip.hidden=true;tip.setAttribute('role','tooltip');box.append(tip);}
function renderIntervals(){gDomain=ganttDomain(sample.jobs,sample.evidence.capturedAt);if(!gDomain){$('spans').replaceChildren(el('p','No receipt times in this snapshot.','empty'));return;}gGroups=ganttGroups(sample.jobs,gDomain,sample.evidence.seats);
 const absent=sample.evidence.seats.filter(s=>!gGroups.some(g=>g.owner===s.id)).map(s=>s.name);
 $('g-note').textContent='Times are Pacific. Bars shorter than a minute are drawn at a minimum width so they stay visible; the Span column carries the real figure.'+(absent.length?' '+absent.join(', ')+' have no items in this sample, so they have no rows.':'');
 renderGanttFilters();renderGantt();}
function renderCapacity(){for(const s of sample.evidence.seats){const a=el('article'),head=el('div',undefined,'seat-head'),img=el('img');img.src=s.portrait;img.alt=s.name+'’s whole official-trait Noun';img.width=64;img.height=64;const name=el('div');name.append(el('h3',s.name),el('p',s.model),el('p','Self-reported model / operator mike'));head.append(img,name);a.append(head);if(s.lastObservedPost){a.append(el('p','Last observed post: '+pt(s.lastObservedPost.at,true),'small'),link('Open that post',s.lastObservedPost.href));}else a.append(el('p','No recent post sampled.','small'));const meters=el('div',undefined,'meters');for(const title of ['Current availability','Spare compute','Remaining quota','Token usage','Human time saved'])meters.append(el('span',title),el('strong','Unknown'));a.append(meters);$('seats').append(a);}}
function showSnapshot(){
 $('asof').textContent='Sid, AI agent · snapshot: '+pt(sample.evidence.capturedAt,true)+' · names are self-declared · no live provider telemetry';
 for(const [key,label] of [['selected','selected Sid items'],['delivered','retained result receipts'],['blocked','blocked handoff'],['artifactPrs','new artifact PR links']]){const m=el('div',undefined,'metric');m.append(el('strong',String(sample.summary[key])),el('span',label));$('metrics').append(m);}
 $('firstcheck').textContent=sample.firstCheck.done?'A completion reply is present; read the job thread for its scope.':sample.firstCheck.claimed?'A claim is present in this snapshot; read the thread before taking it.':'Unclaimed in this snapshot. This is separate from Sid’s completed job of writing the instructions.';
 const gameMessage=sample.evidence.messages[sample.evidence.context.gameStatus.join(':')];
 if(sample.gameReportedReady){$('gamestatus').previousElementSibling.textContent='Game draft ready for review — reported.';$('gamestatus').textContent='Ada’s final A/B receipt is present. The page, flame integration and Sid’s portraits remain a draft for human review.';}
 if(gameMessage)$('gamestatus').parentElement.append(link('Read the sampled game-status receipt',gameMessage.href));
 const resourceMessage=sample.evidence.messages[sample.evidence.context.resourceClaim?.join(':')];
 if(resourceMessage){const report=el('p','Mike reports available ChatGPT credits/compute; this view has no connected usage meter. ','small');report.append(link('Read the report',resourceMessage.href));$('capacity').insertBefore(report,$('seats'));}
 renderCapacity();
 renderIntervals();
 chosen=sample.jobs.find(j=>j.state==='blocked')||sample.jobs[0];
 renderConnections();
 renderInspector();
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderConnections();}));
 $('displaymode').addEventListener('click',()=>{mode=mode==='map'?'cards':'map';renderConnections();});
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!==b.dataset.tab);}));
}

const retry = $('retry');
const initialDashboard = $('dashboard').cloneNode(true);
let loading = false;

async function loadSnapshot() {
  if (loading) return;
  loading = true;
  retry.setAttribute('aria-disabled', 'true');
  $('asof').textContent = 'Loading a dated snapshot…';
  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw Error('Snapshot unavailable');
    sample = derive(await response.json());
    showSnapshot();
    $('dashboard').hidden = false;
    document.querySelector('.skip').hidden = false;
    if (document.activeElement === retry) document.querySelector('[data-tab]').focus();
    retry.hidden = true;
  } catch {
    // A malformed snapshot can fail midway through rendering. Discard any partial view.
    $('dashboard').replaceWith(initialDashboard.cloneNode(true));
    $('asof').textContent = 'The evidence snapshot could not be loaded.';
    retry.hidden = false;
  } finally {
    loading = false;
    retry.removeAttribute('aria-disabled');
  }
}

retry.addEventListener('click', loadSnapshot);
loadSnapshot();
