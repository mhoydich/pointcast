import {view, safeUrl, selectReport} from './model.mjs';
const $ = id => document.getElementById(id);
const drawer = $('drawer'); let data, report, active;
const link = (id,url) => { const el=$(id); const safe=safeUrl(url); if(safe){el.href=safe;el.hidden=false;}else{el.removeAttribute('href');el.hidden=true;} };
function render(){
  const v=view(data,report,new Date().toISOString());
  for(const [id,value] of Object.entries({reported:v.reported,'report-age':v.reportFreshness,'evidence-age':v.evidenceFreshness,merge:v.merge,tests:v.tests,deployment:v.deployment})) $(id).textContent=value;
  $('reporter').textContent=report?.source?.by?.name || 'No retained source';
  $('reported-at').textContent=report?.source?.at ? `Reported ${report.source.at}` : 'Report time unknown';
  link('report-link', report?.source?.id ? `https://pointcast.xyz/loom?to=${encodeURIComponent(`loom:${data.project.roomKey}#${report.source.id}`)}` : null);
  $('checked-at').textContent=`Checked ${data.evidence.checkedAt} · ${data.evidence.checkedBy}`;
  $('evidence-note').textContent=data.evidence.note;
  $('head').textContent=`Checked PR head: ${data.evidence.pr.head}`;
  $('next-action').textContent=data.project.nextAction;
  link('pr-link',data.evidence.pr.url);link('thread-link',data.project.threadUrl);
}
$('open').addEventListener('click',()=>{drawer.showModal(); if(data)render();});
$('close').addEventListener('click',()=>drawer.close());
drawer.addEventListener('close',()=>{active?.abort();$('open').focus();});
$('refresh').addEventListener('click',async()=>{
  if(!data || active)return;
  active=new AbortController(); const controller=active;const timer=setTimeout(()=>controller.abort(),8000);
  $('refresh').disabled=true;$('read-state').textContent='Reading the public Loom…';
  try{
    const response=await fetch(`https://pointcast.xyz/api/loom?to=${encodeURIComponent(data.project.room)}`,{method:'GET',credentials:'omit',cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('unavailable');
    const next=selectReport(await response.json(),data.project);
    if(!next)throw new Error('missing');
    if(controller.signal.aborted)return;
    report=next;render();$('read-state').textContent=`Public report read ${new Date().toISOString()}. Checked release evidence has not changed.`;
  }catch{ $('read-state').textContent='Could not refresh. Showing the saved report; no live state claimed.'; }
  finally{clearTimeout(timer);active=null;$('refresh').disabled=false;}
});
try{
  const response=await fetch('./project.json',{credentials:'omit'});if(!response.ok)throw new Error();data=await response.json();report=data.report.value;render();
  $('read-state').textContent=`Saved public snapshot read ${data.report.readAt}. Refresh is optional.`;
}catch{$('reported').textContent='Snapshot unavailable';$('read-state').textContent='No project state available. Nothing has been written.';$('refresh').disabled=true;}
