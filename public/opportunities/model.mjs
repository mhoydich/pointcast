export const sites = ['pointcast','industrynext','intern','ues','rally'];
export const statuses = ['all','verified-current','needs-reconfirmation','proposed','historical-archive'];
export const kinds = ['all','paid-role','role','learning-program','participation-proposal','volunteer-field-task'];
export const projects = ['all','halation','listening','tag','social-systems','field-editorial','communications-lab','coffee','bread'];
export function readState(search) {
 const p = new URLSearchParams(search);
 const choice = (key, allowed, fallback) => allowed.includes(p.get(key)) ? p.get(key) : fallback;
 return {site:choice('site',sites,'pointcast'),network:p.get('network')==='1',q:(p.get('q')||'').slice(0,200),status:choice('status',statuses,'all'),kind:choice('kind',kinds,'all'),project:choice('project',projects,'all')};
}
export function queryState(s) {
 const p=new URLSearchParams(); p.set('site',s.site);
 for(const k of ['q','status','kind','project']) if(s[k] && s[k]!=='all') p.set(k,s[k]);
 if(s.network && s.site!=='pointcast') p.set('network','1');
 return '?'+p.toString();
}
export function selectRows(rows,s) {
 const q=s.q.trim().toLowerCase();
 return rows.filter(r=> (s.site==='pointcast'||s.network||r.sites.includes(s.site)) &&
 (s.status==='all'||r.status===s.status) && (s.project==='all'||r.project===s.project) &&
 (s.kind==='all'||(s.kind==='paid-role' ? r.kind==='role' && r.compensationKind==='paid' : r.kind===s.kind)) &&
 (!q||[r.title,r.description,r.expectations,r.skills,r.project,r.owner].join(' ').toLowerCase().includes(q)))
 .sort((a,b)=>Number(b.sites.includes(s.site))-Number(a.sites.includes(s.site)));
}
export function canApply(r) {
 return r.status==='verified-current' && !!r.availabilityVerifiedAt && r.applicationsEnabled===true &&
 r.applicationApproval===true && r.privacyProcessApproved===true && !!r.applicationUrl;
}
export function counts(rows) {
 return {total:rows.length,verifiedCurrent:rows.filter(r=>r.status==='verified-current').length,
 reconfirmation:rows.filter(r=>r.status==='needs-reconfirmation').length,proposed:rows.filter(r=>r.status==='proposed').length};
}
