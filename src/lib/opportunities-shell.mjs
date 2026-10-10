import {externalApplicationLink,safeHttpsUrl,sourceDetailEntries,listingLabel,checkedLabel,locationLabel,editionIds,editionRoutes,counts} from '../../public/opportunities/model.mjs';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kindLabels={internship:'INTERNSHIP',trainee:'TRAINEE · SEPARATE FROM INTERNSHIPS',role:'ROLE', 'learning-program':'PROGRAM REFERENCE','participation-proposal':'PARTICIPATION PROPOSAL','volunteer-field-task':'UNPAID FIELD TASK'};
const fact=(label,value)=>`<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value??'Not stated')}</dd>`;
const sourceLink=(url,label)=>safeHttpsUrl(url)?`<a href="${escapeHtml(safeHttpsUrl(url))}">${escapeHtml(label)} ↗</a>`:'';
function fallbackCard(r,i,catalog){
 const external=r.origin==='external',apply=externalApplicationLink(r);
 const fields=external?fact('Eligibility',r.eligibility)+fact('Remote eligibility',r.remoteEligibility)+fact('Posting date',r.sourceDate)+fact('Pay period',r.pay?.period)+fact('Location qualification',locationLabel(r))+fact('Checked',r.checkedAt||checkedLabel(r))+sourceDetailEntries(r).map(f=>fact(f.label,f.value)).join(''):'';
 const source=external?sourceLink(r.sourceUrl,r.listingState==='program-reference'?'Read official employer program':'Read official employer source'):r.sourceUrl?sourceLink(r.sourceUrl,'Read dated public source'):(catalog.availableProjectRoutes||[]).includes(r.sourceDraftPath?.split('#')[0])?`<a href="${escapeHtml(r.sourceDraftPath)}">Read project participation scope ↗</a>`:'';
 const titleId='fallback-title-'+r.id;
 const type=!external&&r.kind==='learning-program'?'LEARNING PROPOSAL':kindLabels[r.kind]||r.kind;
 const payLabel=external?' · '+(r.compensationKind==='paid'?'PAID':r.compensationKind==='unpaid'?'UNPAID':'PAY NOT STATED'):'';
 return `<article class="card" data-record-id="${escapeHtml(r.id)}" data-status="${escapeHtml(r.status)}" aria-labelledby="${escapeHtml(titleId)}"><div class="card-top"><span>${String(i+1).padStart(2,'0')} / ${escapeHtml(external?r.employer:r.owner)} / ${escapeHtml(type+payLabel)}</span><span class="badge">${escapeHtml(external?listingLabel(r):r.status==='proposed'?'Proposed':'Needs reconfirmation')}</span></div><h3 id="${escapeHtml(titleId)}">${escapeHtml(r.title)}</h3>${external?`<p class="location">${escapeHtml(r.locationText||'Location not stated')} · Remote arrangement ${escapeHtml(r.remoteEligibility||'not stated')}</p>`:''}<p class="description">${escapeHtml(r.description)}</p><p class="comp"><strong>Compensation / support</strong>${escapeHtml(r.compensation||'Pay not stated')}</p><details><summary>${external?'Read employer facts &amp; terms':'Read the brief &amp; terms'}</summary><h4>${external?'Role / program focus':'Expected first move'}</h4><p>${escapeHtml(r.expectations)}</p><h4>Source terms / unresolved conditions</h4><p>${escapeHtml(r.terms)}</p>${r.firstBrief?`<h4>${escapeHtml(r.firstBrief.title)}</h4><p>${escapeHtml(r.firstBrief.terms)} This is a dependent brief, not an additional job.</p>`:''}${fields?`<dl class="source-details">${fields}</dl>`:''}${source}</details><p class="source">${external?escapeHtml(listingLabel(r))+' · ':''}Checked ${escapeHtml(checkedLabel(r))}${apply?' · available at check; may change':' · availability unverified'}</p>${apply?`<a class="employer-apply" href="${escapeHtml(apply)}">View role &amp; apply on employer site ↗</a>`:''}<p class="closed">${external?'Applications handled by employer. PointCast accepts no applications.':r.status==='proposed'?'Recruitment closed · program terms unresolved':'Applications unavailable in this catalog'}</p></article>`;
}

// Every jobs route projects this same catalog; no per-edition inventory is generated.
export function jobsShell(shell,catalog,editionId){
 const editions=(catalog.internshipEditions||[]).filter(e=>editionIds.includes(e.id)&&(catalog.opportunities||[]).some(r=>(Array.isArray(r.editionIds)&&r.editionIds.includes(e.id))));
 if(editions.some(e=>e.route!==editionRoutes[e.id]))throw new Error('Invalid internship edition route');
 const edition=editionId?editions.find(e=>e.id===editionId):null;
 if(editionId&&!edition)throw new Error('Cannot render an unknown or empty internship edition: '+editionId);
 const rows=(catalog.opportunities||[]).filter(r=>!edition||(Array.isArray(r.editionIds)&&r.editionIds.includes(edition.id)));
 const external=rows.filter(r=>r.origin==='external'),internal=rows.filter(r=>r.origin!=='external'),c=counts(rows);
 const active=external.filter(r=>externalApplicationLink(r)).length,programs=external.filter(r=>r.listingState==='program-reference').length;
 const unknown=external.length-active-programs;
 const title=edition?edition.title:'Jobs & opportunities';
 const route=edition?edition.route:'/jobs/';
 if(!/^\/jobs\/internships\/[a-z-]+\/$/.test(route)&&route!=='/jobs/')throw new Error('Invalid internship edition route');
 const nav=editions.length?`<nav class="edition-nav" aria-label="Internship editions"><a href="/jobs/"${!edition?' aria-current="page"':''}>All jobs</a>${editions.map(e=>`<a href="${escapeHtml(e.route)}"${edition?.id===e.id?' aria-current="page"':''}>${escapeHtml(e.title)}</a>`).join('')}</nav>`:'';
 const availability=`<p class="availability"><strong>${rows.length} shared catalog records · ${active} active official employer listings checked.</strong><br>${programs} program references · ${unknown} employer records awaiting availability recheck.${internal.length?`<br>Our ${internal.length} briefs and proposals retain their source terms; ${internal.filter(r=>r.status==='verified-current').length} verified current openings.`:''}<br>Availability may change. ${edition?'Location qualification is separate from listing availability.':'Internships and trainees keep distinct work types.'}</p>`;
 const editionFacts=edition?sourceDetailEntries({sourceDetails:{anchor:edition.anchor??null,radiusMiles:edition.radiusMiles??null,coverageNotes:edition.coverageNotes||[],methodologyCaveats:edition.methodologyCaveats||[]}}).map(f=>fact(f.label,f.value)).join(''):'';
 const snapshot=edition?`<p class="edition-snapshot"><strong>Source snapshot ${escapeHtml(edition.asOfDate)} · checked ${escapeHtml(edition.checkedAt)}</strong><br>${escapeHtml(edition.coverageNote)}<br>${escapeHtml(edition.locationCaveat)}</p><details class="edition-method"><summary>About this edition · scope and coverage</summary><dl class="source-details">${editionFacts}</dl></details>`:`<p class="edition-snapshot">A curated dated snapshot of employer sources alongside our existing proposals. This directory is not exhaustive and does not update automatically. Each record retains its checked date, facts and unresolved terms.</p>`;
 const fallback=rows.length?`<div class="fallback-jobs"><h3>${edition?'This edition':'Shared catalog'} · ${c.total} records</h3><p>Filters need JavaScript. All records in this ${edition?'edition':'catalog'} are readable below, including availability-unknown records and program references. Native details controls show employer facts and terms.</p><div class="cards">${rows.map((r,i)=>fallbackCard(r,i,catalog)).join('')}</div></div>`:'';
 let html=shell.replace('<title>Opportunities · PointCast</title>',`<title>${escapeHtml(title)} · PointCast</title><link rel="canonical" href="https://pointcast.xyz${escapeHtml(route)}">`)
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escapeHtml(edition?edition.title+'. '+edition.scope+'. Curated dated snapshot of official employer sources.':'Our proposals and checked official employer jobs, internships and separate trainee records, with visible sources and terms.')}">`)
  .replace('data-default-site="pointcast"',`data-default-site="pointcast" data-page="jobs"${edition?` data-edition="${escapeHtml(edition.id)}"`:''}`)
  .replaceAll('href="./board.css"','href="/opportunities/board.css"')
  .replaceAll('src="./board.mjs"','src="/opportunities/board.mjs"')
  .replaceAll('href="./catalog.json"','href="/opportunities/catalog.json"')
  .replace(/<div class="review-bar">[\s\S]*?<\/div>/,`<div class="review-bar">CURATED DATED SNAPSHOT <span>No applications accepted here</span></div>`)
  .replace(/<p class="availability">[\s\S]*?<\/p>/,availability)
  .replace('</header>','</header>'+nav+snapshot)
  .replace('Loading source records…',`${c.total} records · ${c.verifiedCurrent} verified current`)
  .replace(/<footer><p>[\s\S]*?<\/p>/,'<footer><p>Each record states its source check date and availability. A curated dated snapshot; official employer terms govern external applications.</p>')
  .replace('</noscript>',fallback+'</noscript>');
 if(edition){
  html=html.replace(/<h1>[\s\S]*?<\/h1>/,`<h1>${escapeHtml(edition.title)}<span class="dot">.</span></h1>`)
   .replace(/<p id="brand-description">[\s\S]*?<\/p>/,`<p id="brand-description">${escapeHtml(edition.scope)}. Internships, separately labeled trainees, and program references retain their own eligibility and availability.</p>`)
   .replace('<nav class="brands"','<nav class="brands" hidden')
   .replace('<label class="network-toggle"','<label class="network-toggle" hidden')
   .replace('<h2 id="view-title">The whole network</h2>',`<h2 id="view-title">${escapeHtml(edition.title)}</h2>`)
   .replace('<p id="view-note"></p>',`<p id="view-note">${escapeHtml(edition.locationCaveat)}</p>`)
   .replace('data-project-filter','hidden data-project-filter')
   .replace('data-origin-filter','hidden data-origin-filter')
   .replace('data-edition-filter','hidden data-edition-filter')
   .replace(/<section class="archive"[\s\S]*?<\/section>/,'')
   .replace(/<section class="program"[\s\S]*?<\/section>/,'');
 }
 return html;
}
