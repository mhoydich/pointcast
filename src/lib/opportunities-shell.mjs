import {externalApplicationLink} from '../../public/opportunities/model.mjs';

const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// /jobs is a projection of the same shell and catalog, including its no-JS links.
export function jobsShell(shell,catalog) {
 const links=catalog.opportunities.filter(r=>externalApplicationLink(r)).map(r=>`<li><a href="${escapeHtml(externalApplicationLink(r))}">${escapeHtml(r.title)} — ${escapeHtml(r.employer)}</a><br>${escapeHtml(r.locationText)} · ${escapeHtml(r.compensation)}<br>Checked ${escapeHtml(r.reviewedAt)} PDT. Posting date and remote arrangement not stated; availability may change.</li>`).join('');
 const fallback=links?`<div class="fallback-jobs"><h3>External jobs · official employer applications</h3><ul>${links}</ul><p>PointCast accepts no applications. Our proposals and their unresolved terms remain in the shared source catalog.</p></div>`:'';
 return shell.replace('<title>Opportunities · PointCast</title>','<title>Jobs &amp; opportunities · PointCast</title><link rel="canonical" href="https://pointcast.xyz/jobs/">')
  .replace('data-default-site="pointcast"','data-default-site="pointcast" data-page="jobs"')
  .replaceAll('href="./board.css"','href="/opportunities/board.css"')
  .replaceAll('src="./board.mjs"','src="/opportunities/board.mjs"')
  .replaceAll('href="./catalog.json"','href="/opportunities/catalog.json"')
  .replace('</noscript>',fallback+'</noscript>');
}
