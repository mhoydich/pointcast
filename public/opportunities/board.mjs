import {readState,queryState,selectRows,counts,externalApplicationLink,safeHttpsUrl,sourceDetailEntries,listingLabel,checkedLabel,locationLabel,editionIds} from './model.mjs';
const $=id=>document.getElementById(id);
const labels={pointcast:'The whole network',industrynext:'IndustryNext · business & work',intern:'Intern program · Communications Lab',ues:'University of El Segundo · learning',rally:'RALLY · a future area'};
const notes={pointcast:'Work, learning and contributions share one catalog. Each record keeps its own owner, type, source and terms.',industrynext:'Your business and work briefs first. AI credits are operating support, not salary. Current availability needs reconfirmation.',intern:'A distinct proposed learning program. These pathways are not employment offers; recruitment is closed pending program terms.',ues:'Learning proposals relevant to this view. Program affiliation, admissions, academic credit and mentorship are not established by these proposals.',rally:'No RALLY opportunity records have been approved for this catalog. A future view can use the same data without inventing openings.'};
const statusLabels={'verified-current':'Verified current','needs-reconfirmation':'Needs reconfirmation',proposed:'Proposed','historical-archive':'Historical archive'};
const ownerLabels={pointcast:'PointCast',industrynext:'IndustryNext',intern:'Intern program'};
const kindLabels={'participation-proposal':'PARTICIPATION PROPOSAL',role:'ROLE',internship:'INTERNSHIP',trainee:'TRAINEE · SEPARATE FROM INTERNSHIPS','learning-program':'PROGRAM REFERENCE','volunteer-field-task':'UNPAID FIELD TASK'};
const boundEdition=document.body.dataset.edition;
function pageState(){const query=new URLSearchParams(location.search);if(!query.has('site'))query.set('site',document.body.dataset.defaultSite||'pointcast');return readState(query.toString(),boundEdition?{edition:boundEdition}:{});}
let data,state=pageState();
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function link(url,text,cls){const href=safeHttpsUrl(url);if(!href)return null;const n=el('a',text,cls);n.href=href;return n;}
function card(r,i){
 const external=r.origin==='external',applyHref=externalApplicationLink(r);
 const article=el('article',undefined,'card');article.dataset.status=r.status;article.dataset.recordId=r.id;
 const top=el('div',undefined,'card-top');
 const owner=external?[r.employer,r.employerBoard&&r.employerBoard!==r.employer?r.employerBoard:null].filter(Boolean).join(' · '):ownerLabels[r.owner]||r.owner;
 const type=external?(kindLabels[r.kind]||r.kind)+' · '+(r.compensationKind==='paid'?'PAID':r.compensationKind==='unpaid'?'UNPAID':'PAY NOT STATED'):r.kind==='role'?'ROLE BRIEF · PAY UNCONFIRMED':r.kind==='learning-program'?'LEARNING PROPOSAL':kindLabels[r.kind];
 top.append(el('span',String(i+1).padStart(2,'0')+' / '+owner+' / '+type),el('span',external?listingLabel(r):statusLabels[r.status],'badge'));
 const title=el('h3',r.title);title.id='title-'+r.id;article.setAttribute('aria-labelledby',title.id);
 const comp=el('p',undefined,'comp');comp.append(el('strong','Compensation / support'),document.createTextNode(r.compensation||'Pay not stated'));
 const details=el('details');details.append(el('summary',external?'Read employer facts & terms':'Read the brief & terms'));
 details.append(el('h4',external?'Role / program focus':r.kind==='participation-proposal'?'Proposed scope':'Expected first move'),el('p',r.expectations),el('h4','Source terms / unresolved conditions'),el('p',r.terms));
 if(r.firstBrief)details.append(el('h4',r.firstBrief.title),el('p',r.firstBrief.terms+' This is a dependent brief, not an additional job.'));
 if(external){
  const facts=el('dl',undefined,'source-details');
  for(const f of [{label:'Eligibility',value:r.eligibility??'Not stated'},{label:'Remote eligibility',value:r.remoteEligibility??'Not stated'},{label:'Posting date',value:r.sourceDate??'Not stated'},{label:'Pay period',value:r.pay?.period??'Not stated'},{label:'Location qualification',value:locationLabel(r)},{label:'Checked',value:r.checkedAt||checkedLabel(r)},...sourceDetailEntries(r)])facts.append(el('dt',f.label),el('dd',f.value));
  details.append(facts);
 }
 const source=link(r.sourceUrl,external?(r.listingState==='program-reference'?'Read official employer program ↗':'Read official employer source ↗'):'Read dated public source ↗');
 if(source)details.append(source);
 else if(!external&&(data.availableProjectRoutes||[]).includes(r.sourceDraftPath?.split('#')[0]))details.append(link(new URL(r.sourceDraftPath,'https://pointcast.xyz').href,'Read project participation scope ↗'));
 else if(!external)details.append(el('p','Project source: '+(r.sourceDraftPath||'not stated')+' · link available when the project page is included in this release.'));
 article.append(top,title);
 if(external)article.append(el('p',(r.locationText||'Location not stated')+' · Remote arrangement '+(r.remoteEligibility||'not stated'),'location'));
 article.append(el('p',r.description,'description'),comp,details);
 if(external){
  article.append(el('p',listingLabel(r)+' · checked '+checkedLabel(r)+' · '+(applyHref?'available at check; may change':'availability unverified'),'source'));
  if(applyHref)article.append(link(applyHref,'View role & apply on employer site ↗','employer-apply'));
  article.append(el('p','Applications handled by employer. PointCast accepts no applications.','closed'));
 }else article.append(el('p','Source dated '+(r.sourceDate||'not stated')+' · checked '+checkedLabel(r)+' · availability unverified','source'),el('p',r.status==='proposed'?'Recruitment closed · program terms unresolved':'Applications unavailable in this catalog','closed'));
 return article;
}
function render(){
 if(!data)return;
 const edition=state.edition!=='all'?(data.internshipEditions||[]).find(e=>e.id===state.edition):null;
 if(boundEdition&&!edition)throw new Error('Edition metadata unavailable');
 for(const key of ['q','project','status','kind','origin','edition','listingState'])if($(key))$(key).value=state[key];
 $('network').checked=state.network;document.querySelector('.network-toggle').hidden=!!boundEdition||state.site==='pointcast';
 document.querySelectorAll('[data-site]').forEach(a=>{const current=a.dataset.site===state.site;if(current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');a.href=queryState({...state,site:a.dataset.site,network:false});});
 document.querySelectorAll('.edition-nav a').forEach(a=>{if(a.getAttribute('href')===(edition?.route||'/jobs/'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('view-title').textContent=edition?edition.title:labels[state.site];$('view-note').textContent=edition?edition.scope+'. '+edition.locationCaveat:notes[state.site];
 document.title=(edition?edition.title:labels[state.site])+' · PointCast '+(document.body.dataset.page==='jobs'?'Jobs':'Opportunities');
 const rows=selectRows(data.opportunities,state),c=counts(rows),external=rows.filter(r=>r.origin==='external');
 $('cards').replaceChildren(...rows.map(card));$('result-count').textContent=c.total+' records · '+external.filter(r=>externalApplicationLink(r)).length+' active employer listings · '+external.filter(r=>r.listingState==='program-reference').length+' program references';
 $('empty').hidden=rows.length>0;
 $('empty-note').textContent=state.status==='historical-archive'?'Historical records remain in a separate unmerged archive. They are not searchable live opportunities in this catalog.':state.kind==='paid-role'?'No confirmed paid roles, internships or trainees match this view. Unknown pay remains visible when this filter is cleared. Internal tool credits and possible revenue share do not establish salary.':state.status==='verified-current'||state.listingState==='active-listing'?'No currently verified listing matches this view. Clear this filter to see program references and records awaiting reconfirmation.':boundEdition?'Try another work type, employer state or search term within this edition.':state.site==='rally'&&!state.network?'No RALLY records yet. Include the shared network to explore other work and learning.':'Try a different project, work type, edition, search term or shared-network view.';
}
function update(next,{replace=false}={}){state=boundEdition?{...next,site:'pointcast',network:false,edition:boundEdition}:next;history[replace?'replaceState':'pushState'](null,'',queryState(state));render();}
const reset=()=>update({...state,q:'',project:'all',status:'all',kind:'all',origin:'all',listingState:'all',edition:boundEdition||'all'});
$('reset').addEventListener('click',reset);$('clear').addEventListener('click',reset);
for(const key of ['project','status','kind','origin','edition','listingState'])if($(key))$(key).addEventListener('change',()=>update({...state,[key]:$(key).value}));
$('q').addEventListener('input',()=>update({...state,q:$('q').value},{replace:true}));
$('network').addEventListener('change',()=>update({...state,network:$('network').checked}));
document.querySelectorAll('[data-site]').forEach(a=>a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();update({...state,site:a.dataset.site,network:false});}));
addEventListener('popstate',()=>{state=pageState();if(data)render();});
try{
 const response=await fetch(new URL('./catalog.json',import.meta.url));if(!response.ok)throw new Error('Catalog unavailable');data=await response.json();
 if($('edition')){
  const options=(data.internshipEditions||[]).filter(e=>editionIds.includes(e.id)&&data.opportunities.some(r=>(Array.isArray(r.editionIds)&&r.editionIds.includes(e.id)))).map(e=>{const n=el('option',e.title);n.value=e.id;return n;});
  $('edition').replaceChildren(el('option','All editions & original briefs'),...options);$('edition').firstChild.value='all';
 }
 render();
}catch(error){$('cards').replaceChildren();$('result-count').textContent=boundEdition?'Edition unavailable':'Catalog unavailable';$('empty').hidden=false;$('empty-note').textContent='The source catalog could not load for this view. Reload or use the shared catalog JSON link below.';}
