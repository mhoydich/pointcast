import {renderVisual, bindVisual} from './visuals.js';
const data=JSON.parse(document.querySelector('#atlas-data').textContent);
const entries=data.entries;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const q=s=>document.querySelector(s);
const panel=q('#perspective');
let selected=entries.find(x=>x.id===new URL(location.href).searchParams.get('view'))||entries.find(x=>x.id===document.body.dataset.first)||entries[0];
const defaultEntry=entries.find(x=>x.id===document.body.dataset.first)||entries[0];
let category='All';
function number(e){return String(entries.indexOf(e)+1).padStart(2,'0')}
function source(e){return `<a class="source-link" href="${esc(e.url)}" target="_blank" rel="noopener">Read the primary source <span aria-hidden="true">↗</span><span class="sr-only"> (opens a new tab)</span></a>`}
function renderList(){
 const term=q('#query').value.toLowerCase().trim();
 const visible=entries.filter(e=>(category==='All'||e.category===category)&&[e.title,e.institution,e.summary,e.mechanism,...e.skills].join(' ').toLowerCase().includes(term));
 q('#result-count').textContent=`${visible.length} of ${entries.length} perspectives`;
 q('#view-list').innerHTML=visible.map(e=>`<button class="view-option ${e.id===selected.id?'selected':''}" data-view="${esc(e.id)}" aria-pressed="${e.id===selected.id}"><span class="view-number">${number(e)}</span><span><small>${esc(e.institution)}</small><strong>${esc(e.title)}</strong></span><span aria-hidden="true">↗</span></button>`).join('')||'<p class="empty">No matching perspectives. Try another word or choose All.</p>';
 q('#view-list').querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.view,true)));
}
function renderPanel(){
 const e=selected;
 panel.innerHTML=`<div class="perspective-top"><p class="eyebrow">PERSPECTIVE ${number(e)} / ${esc(e.category)}</p><button class="quiet-button" id="copy-link">Copy this view’s link</button></div><h2 tabindex="-1" id="view-title">${esc(e.title)}</h2><p class="byline">${esc(e.institution)} <span>·</span> Source dated ${esc(e.date)}</p><p class="evidence">${esc(e.evidenceType)}</p><p class="summary">${esc(e.summary)}</p><div class="source-row">${source(e)}<a href="#source-${esc(e.id)}" class="underlink">Source record ↓</a></div><section class="visual-panel" aria-labelledby="visual-heading"><div class="section-top"><h3 id="visual-heading">Explore the idea</h3><span>INTERACTIVE EXPLAINER</span></div><div id="visual-content">${renderVisual(e)}</div></section><div class="reasoning-grid"><section><p class="eyebrow">HOW IT WORKS · ATLAS ANALYSIS</p><h3>The mechanism</h3><p>${esc(e.mechanism)}</p><h3>What must hold</h3><p>${esc(e.assumptions)}</p></section><section><p class="eyebrow">PRESSURE TEST · ATLAS ANALYSIS</p><h3>The strongest objection</h3><p>${esc(e.counterargument)}</p><h3>What would change the view</h3><p>${esc(e.falsifier)}</p></section></div><div class="caveat"><strong>Read the boundary.</strong> ${esc(e.caveat)}</div><section class="project-card"><p class="eyebrow">FROM THESIS TO PROOF OF WORK · OUR PROJECT IDEA</p><h3>Make something you can explain.</h3><p>${esc(e.internExercise)}</p><div class="skill-tags">${e.skills.map(s=>`<span>${esc(s)}</span>`).join('')}</div><p><strong>Leave behind:</strong> ${esc(e.proofOfWork)}</p><a href="#learning" class="solid-link" id="use-brief">Make a project brief ↗</a></section>`;
 bindVisual(q('#visual-content'),e);
 q('.source-row .underlink').addEventListener('click',()=>{const record=document.getElementById('source-'+e.id);if(record)record.open=true});
 q('#copy-link').addEventListener('click',async()=>{const u=new URL(location.pathname,location.origin);u.searchParams.set('view',e.id);try{await navigator.clipboard.writeText(u.href);q('#copy-link').textContent='Link copied'}catch{q('#copy-link').textContent='Select and copy the address bar link'}});
 q('#brief-view').value=e.id;
 renderBrief();
 q('#use-brief').addEventListener('click',()=>{q('#brief-view').value=e.id;renderBrief()});
 document.querySelectorAll('.constellation [data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.view===e.id)));
}
function select(id,focus=false,history=true){selected=entries.find(x=>x.id===id)||defaultEntry;if(history){const u=new URL(location.href);u.searchParams.set('view',selected.id);window.history.pushState({},'',u)}renderList();renderPanel();if(focus)q('#view-title').focus({preventScroll:true})}
q('#query').addEventListener('input',renderList);
q('#clear-search').addEventListener('click',()=>{q('#query').value='';category='All';document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='All')));renderList();q('#query').focus()});
document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderList()}));
document.querySelectorAll('.constellation [data-view]').forEach(b=>b.addEventListener('click',()=>{select(b.dataset.view);q('#explore').scrollIntoView();q('#view-title').focus({preventScroll:true})}));
window.addEventListener('popstate',()=>select(new URL(location.href).searchParams.get('view'),false,false));
const options=entries.map(e=>`<option value="${esc(e.id)}">${number(e)} · ${esc(e.institution)} — ${esc(e.title)}</option>`).join('');
['compare-a','compare-b','brief-view'].forEach(id=>q('#'+id).innerHTML=options);
q('#compare-a').value='vc-labor-budget';q('#compare-b').value='economics-acemoglu-modest';
function compare(){const a=entries.find(e=>e.id===q('#compare-a').value),b=entries.find(e=>e.id===q('#compare-b').value);q('#comparison').innerHTML=[a,b].map(e=>`<article><p class="eyebrow">${esc(e.institution)} · ${esc(e.date)}</p><h3>${esc(e.title)}</h3><p class="evidence">${esc(e.evidenceType)}</p><dl><dt>Claim being considered</dt><dd>${esc(e.summary)}</dd><dt>Assumptions to examine</dt><dd>${esc(e.assumptions)}</dd><dt>Evidence that would change the view</dt><dd>${esc(e.falsifier)}</dd><dt>Practical implication · our analysis</dt><dd>${esc(e.implication)}</dd></dl>${source(e)}</article>`).join('');q('#compare-note').textContent=a.id===b.id?'You selected the same perspective twice. Choose a second view to compare.':'Compare the scope, date and evidence type before treating these as agreement or disagreement. A task result, a market forecast and a policy are different kinds of evidence.'}
q('#compare-a').addEventListener('change',compare);q('#compare-b').addEventListener('change',compare);
function renderBrief(){const e=entries.find(x=>x.id===q('#brief-view').value)||selected;q('#brief-project').innerHTML=`<p class="eyebrow">${esc(e.institution)}</p><h3>${esc(e.title)}</h3><p>${esc(e.internExercise)}</p><p><strong>Evidence of learning:</strong> ${esc(e.proofOfWork)}</p><p><strong>Skills to practice:</strong> ${e.skills.map(esc).join(' · ')}</p>`}
q('#brief-view').addEventListener('change',renderBrief);
q('#download-brief').addEventListener('click',()=>{const e=entries.find(x=>x.id===q('#brief-view').value);const content=`# AI thesis project brief\n\nPerspective: ${e.title}\nInstitution: ${e.institution}\nSource: ${e.url}\nSource date: ${e.date}\nAtlas checked: ${data.asOf}\n\n## Proposed exercise (atlas editorial idea)\n${e.internExercise}\n\n## Skills\n${e.skills.join(', ')}\n\n## Proof of work\n${e.proofOfWork}\n\n## My question and acceptance criteria\n${q('#brief-notes').value||'Write a clear question and define what a useful result would look like.'}\n\n## Review checklist\n- Cite one exact claim and its date.\n- Separate facts, forecasts, opinions and assumptions.\n- Keep public or synthetic inputs; record permissions.\n- Test a failure case and keep a revision log.\n- Explain the result without assistance.\n- Ask a reviewer to check the evidence and limitations.\n\nThis is a self-guided project, not a job listing, employer partnership, placement promise or accredited credential.\nExisting internship resource: https://elsegundo.xyz/property/#internships\n`;const blob=new Blob([content],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ai-project-${e.id}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);q('#download-status').textContent='Project brief downloaded. Your notes stayed in this browser.'});
renderList();renderPanel();compare();document.body.classList.add('atlas-ready');
