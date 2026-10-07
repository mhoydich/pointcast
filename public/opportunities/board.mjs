import {readState,queryState,selectRows,counts,externalApplicationLink} from './model.mjs';
const $=id=>document.getElementById(id);
const labels={pointcast:'The whole network',industrynext:'IndustryNext · business & work',intern:'Intern program · Communications Lab',ues:'University of El Segundo · learning',rally:'RALLY · a future area'};
const notes={pointcast:'Work, learning and contributions share one catalog. Each record keeps its own owner, type, source and terms.',industrynext:'Your business and work briefs first. AI credits are operating support, not salary. Current availability needs reconfirmation.',intern:'A distinct proposed learning program. These pathways are not employment offers; recruitment is closed pending program terms.',ues:'Learning proposals relevant to this view. Program affiliation, admissions, academic credit and mentorship are not established by these proposals.',rally:'No RALLY opportunity records have been approved for this catalog. A future view can use the same data without inventing openings.'};
const statusLabels={'verified-current':'Verified current','needs-reconfirmation':'Needs reconfirmation',proposed:'Proposed','historical-archive':'Historical archive'};
const ownerLabels={pointcast:'PointCast',industrynext:'IndustryNext',intern:'Intern program'};
const kindLabels={'participation-proposal':'PARTICIPATION PROPOSAL',role:'ROLE BRIEF · PAY UNCONFIRMED','learning-program':'LEARNING PROPOSAL','volunteer-field-task':'UNPAID FIELD TASK'};
function pageState(){const query=new URLSearchParams(location.search);if(!query.has("site"))query.set("site",document.body.dataset.defaultSite||"pointcast");return readState(query.toString());}
let data,state=pageState();
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function card(r,i){
 const external=r.origin==='external';
 const applyHref=externalApplicationLink(r);
 const article=el('article',undefined,'card');article.dataset.status=r.status;
 const top=el('div',undefined,'card-top');top.append(el('span',String(i+1).padStart(2,'0')+' / '+(external?r.employer+' · '+r.employerBoard:ownerLabels[r.owner])+' / '+(external?'EXTERNAL EMPLOYER JOB · '+(r.compensationKind==='paid'?'PAID':'PAY NOT STATED'):kindLabels[r.kind])),el('span',external&&applyHref?'Listing checked':statusLabels[r.status],'badge'));
 const title=el('h3',r.title);title.id='title-'+r.id;article.setAttribute('aria-labelledby',title.id);
 const comp=el('p',undefined,'comp');comp.append(el('strong','Compensation / support'),document.createTextNode(r.compensation));
 const details=el('details');details.append(el('summary',external?'Read employer role & terms':'Read the brief & terms'));
 details.append(el('h4',external?'Role focus':r.kind==='participation-proposal'?'Proposed scope':'Expected first move'),el('p',r.expectations),el('h4','Source terms / unresolved conditions'),el('p',r.terms));
 if(r.firstBrief){details.append(el('h4',r.firstBrief.title),el('p',r.firstBrief.terms+' This is a dependent brief, not an additional job.'));}
 if(r.sourceUrl){const link=el('a',external?'Read official employer listing ↗':'Read dated public source ↗');link.href=r.sourceUrl;details.append(link);}else if((data.availableProjectRoutes||[]).includes(r.sourceDraftPath.split('#')[0])){const link=el('a','Read project participation scope ↗');link.href=new URL(r.sourceDraftPath,'https://pointcast.xyz').href;details.append(link);}else{details.append(el('p','Project source: '+r.sourceDraftPath+' · link available when the project page is included in this release.'));}
 article.append(top,title);
 if(external) article.append(el('p',r.locationText+' · Remote arrangement '+(r.remoteEligibility||'not stated'),'location'));
 article.append(el('p',r.description,'description'),comp,details);
 if(external){
  article.append(el('p','Posting date '+(r.sourceDate||'not stated')+' · checked '+r.reviewedAt+' PDT · '+(applyHref?'available at check; may change':'availability unverified'),'source'));
  if(applyHref){const link=el('a','View role & apply on employer site ↗','employer-apply');link.href=applyHref;article.append(link);}
  article.append(el('p','Applications handled by employer. PointCast accepts no applications.','closed'));
 }else{
  article.append(el('p','Source dated '+(r.sourceDate||'not stated')+' · checked '+r.reviewedAt+' · availability unverified','source'),el('p',r.status==='proposed'?'Recruitment closed · program terms unresolved':'Applications unavailable in this catalog','closed'));
 }
 return article;
}
function render(){
 if(!data)return;
 for(const key of ['q','project','status','kind','origin']) $(key).value=state[key];
 $('network').checked=state.network;document.querySelector('.network-toggle').hidden=state.site==='pointcast';
 document.querySelectorAll('[data-site]').forEach(a=>{const current=a.dataset.site===state.site;if(current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');a.href=queryState({...state,site:a.dataset.site,network:false});});
 $('view-title').textContent=labels[state.site];$('view-note').textContent=notes[state.site];
 document.title=labels[state.site]+' · PointCast '+(document.body.dataset.page==='jobs'?'Jobs':'Opportunities');
 const rows=selectRows(data.opportunities,state),c=counts(rows);
 $('cards').replaceChildren(...rows.map(card));$('result-count').textContent=c.total+' records · '+c.verifiedCurrent+' verified current';
 $('empty').hidden=rows.length>0;
 $('empty-note').textContent=state.status==='historical-archive'?'Historical records remain in a separate unmerged archive. They are not searchable live opportunities in this catalog.':state.kind==='paid-role'?'No confirmed paid roles match this view. Internal tool credits and possible revenue share do not establish salary.':state.status==='verified-current'?'No currently verified listing matches this view. Clear this filter to see proposals and items awaiting reconfirmation.':state.site==='rally'&&!state.network?'No RALLY records yet. Include the shared network to explore other work and learning.':'Try a different project, work type, search term or shared-network view.';
}
function update(next,{replace=false}={}){state=next;history[replace?'replaceState':'pushState'](null,'',queryState(state));render();}
const reset=()=>update({...state,q:'',project:'all',status:'all',kind:'all',origin:'all'});
$('reset').addEventListener('click',reset);$('clear').addEventListener('click',reset);
for(const key of ['project','status','kind','origin']) $(key).addEventListener('change',()=>update({...state,[key]:$(key).value}));
$('q').addEventListener('input',()=>update({...state,q:$('q').value},{replace:true}));
$('network').addEventListener('change',()=>update({...state,network:$('network').checked}));
document.querySelectorAll('[data-site]').forEach(a=>a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();update({...state,site:a.dataset.site,network:false});}));
addEventListener('popstate',()=>{state=pageState();if(data)render();});
try{const response=await fetch(new URL('./catalog.json',import.meta.url));if(!response.ok)throw new Error('Catalog unavailable');data=await response.json();render();}catch(error){$('result-count').textContent='Catalog unavailable';$('empty').hidden=false;$('empty-note').textContent='The source catalog could not load. Reload this catalog or use the JSON link below.';}
