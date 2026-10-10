export const sites = ['pointcast','industrynext','intern','ues','rally'];
export const origins = ['all','internal','external'];
export const statuses = ['all','verified-current','needs-reconfirmation','proposed','historical-archive'];
export const kinds = ['all','paid-role','role','internship','trainee','learning-program','participation-proposal','volunteer-field-task'];
export const projects = ['all','halation','listening','tag','social-systems','field-editorial','communications-lab','coffee','bread','grok-imagine','internship-editions'];
export const editionIds = ['el-segundo-25mi','new-york-city-25mi','silicon-valley-25mi','built-world-southern-california','hollywood-creative'];
export const editionRoutes = {'el-segundo-25mi':'/jobs/internships/el-segundo/','new-york-city-25mi':'/jobs/internships/new-york-city/','silicon-valley-25mi':'/jobs/internships/silicon-valley/','built-world-southern-california':'/jobs/internships/built-world-southern-california/','hollywood-creative':'/jobs/internships/hollywood-creative/'};
export const listingStates = ['all','active-listing','program-reference','availability-unknown'];
export function readState(search,{edition}={}) {
 const p = new URLSearchParams(search);
 const choice = (key, allowed, fallback) => allowed.includes(p.get(key)) ? p.get(key) : fallback;
 const bound=edition!==undefined;
 return {site:bound?'pointcast':choice('site',sites,'pointcast'),network:bound?false:p.get('network')==='1',edition:bound?edition:choice('edition',['all',...editionIds],'all'),listingState:choice('listingState',listingStates,'all'),origin:choice('origin',origins,'all'),q:(p.get('q')||'').slice(0,200),status:choice('status',statuses,'all'),kind:choice('kind',kinds,'all'),project:choice('project',projects,'all')};
}
export function queryState(s) {
 const p=new URLSearchParams(); p.set('site',s.site);
 for(const k of ['q','status','kind','project','origin','edition','listingState']) if(s[k] && s[k]!=='all') p.set(k,s[k]);
 if(s.network && s.site!=='pointcast') p.set('network','1');
 return '?'+p.toString();
}
export function selectRows(rows,s) {
 const q=s.q.trim().toLowerCase();
 return rows.filter(r=> (s.site==='pointcast'||s.network||r.sites.includes(s.site)) &&
 (!s.edition||s.edition==='all'||(Array.isArray(r.editionIds)&&r.editionIds.includes(s.edition))) &&
 (!s.listingState||s.listingState==='all'||r.listingState===s.listingState) &&
 (!s.origin||s.origin==='all'||(r.origin||'internal')===s.origin) &&
 (s.status==='all'||r.status===s.status) && (s.project==='all'||r.project===s.project) &&
 (s.kind==='all'||(s.kind==='paid-role' ? ['role','internship','trainee'].includes(r.kind) && r.compensationKind==='paid' : r.kind===s.kind)) &&
 (!q||[r.title,r.description,r.expectations,r.skills,r.project,r.owner,r.employer,r.employerBoard,r.locationText,r.eligibility,r.terms,...sourceDetailEntries(r).map(f=>f.value)].join(' ').toLowerCase().includes(q)))
 .sort((a,b)=>Number(b.sites.includes(s.site))-Number(a.sites.includes(s.site)) || Number(b.origin==='external' && b.status==='verified-current')-Number(a.origin==='external' && a.status==='verified-current'));
}
export function canApply(r) {
 return r.status==='verified-current' && !!r.availabilityVerifiedAt && r.applicationsEnabled===true &&
 r.applicationApproval===true && r.privacyProcessApproved===true && !!r.applicationUrl;
}
export function counts(rows) {
 return {total:rows.length,verifiedCurrent:rows.filter(r=>r.status==='verified-current').length,
 reconfirmation:rows.filter(r=>r.status==='needs-reconfirmation').length,proposed:rows.filter(r=>r.status==='proposed').length};
}

// This outbound employer link is separate from the internal recruitment gate.
export function safeHttpsUrl(value) {
 if(typeof value!=='string')return null;
 try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;} catch {return null;}
}
export function externalApplicationLink(r) {
 if(r.origin!=='external'||r.sourceKind!=='official-external-job'||r.status!=='verified-current'||r.listingState!=='active-listing'||!r.availabilityVerifiedAt||!Number.isFinite(Date.parse(r.availabilityVerifiedAt))) return null;
 const source=safeHttpsUrl(r.sourceUrl),application=safeHttpsUrl(r.externalApplicationUrl);
 if(!source||!application)return null;
 // Preserve the reviewed xAI record's existing same-listing outbound behavior.
 if(r.id==='external-xai-grok-imagine-5244173007'&&source==='https://job-boards.greenhouse.io/xai/jobs/5244173007'&&application===source)return application;
 const evidence=r.applicationEvidence;
 const observationAt=Date.parse(evidence?.checkedAt);
 return evidence?.verified===true&&safeHttpsUrl(evidence.sourceUrl)===source&&safeHttpsUrl(evidence.applicationUrl)===application&&
 Number.isFinite(observationAt)&&observationAt===Date.parse(r.availabilityVerifiedAt)&&(!r.checkedAt||observationAt===Date.parse(r.checkedAt))&&
 typeof evidence.observation==='string'&&evidence.observation.trim()?application:null;
}

const factLabels={factualVariants:'Employer facts by edition',details:'Source facts',editionId:'Edition',missingFields:'Not stated or unverified',hoursPerWeek:'Hours per week',schoolRequirement:'School requirement',enrollmentRequired:'Enrollment required',publicSources:'Official sources',sourceTitle:'Source title',locationCheckNeeded:'Exact worksite check needed',cityReferenceDistanceMiles:'Approximate city-reference distance (miles)',cityReferenceCoordinates:'City-reference coordinates',centerCoordinateSourceUrl:'Reference-center coordinate source',factualLocationDetails:'Location details',anchor:'Reference center',methodologyCaveats:'Coverage and location caveats',coverageNotes:'Coverage notes',sourceDetails:'Employer facts',term:'Term / duration',deadline:'Application deadline',deadlineRule:'Deadline rule',exportControl:'Export control',enrollment:'Enrollment requirement',academicCredit:'Academic credit',workMode:'Work arrangement',hours:'Hours',payUnit:'Pay period',payCaveat:'Pay caveat',compensationCaveat:'Compensation caveat',geographyByEdition:'Location facts by edition',factualCaveats:'Source caveats',sourceVariants:'Source variants',sourceUrl:'Official source',applicationUrl:'Official application destination',approximateDistanceMiles:'Approximate city-reference distance (miles)',distanceMiles:'Distance (miles)',radiusMiles:'Radius (miles)',coordinates:'Reference coordinates',latitude:'Latitude',longitude:'Longitude',locationEvidence:'Worksite evidence',geographicConfidence:'Location precision',locationState:'Location qualification',membershipBasis:'Edition membership basis',centerLabel:'Radius reference center',centerCoordinates:'Radius reference coordinates',officialWorksite:'Stated worksite',officialWorksiteSourceUrl:'Worksite source',coordinateSourceUrl:'Coordinate source',precision:'Location precision',paid:'Paid',payDisclosed:'Disclosed pay',payPeriod:'Pay period',asOf:'Source snapshot date',asOfDate:'Source snapshot date',checkedAt:'Source check timestamp',remoteEligibility:'Remote eligibility',locationText:'Stated location',postingType:'Posting type',sourceDate:'Posting date',school:'School requirement'};
function factLabel(key){return factLabels[key]||key.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/^./,c=>c.toUpperCase());}
// Only the curated factual dictionary is expanded; intake/reviewer evidence is not public copy.
export function sourceDetailEntries(row) {
 const out=[];
 const visit=(value,path)=>{
  if(Array.isArray(value)){if(!value.length)out.push({label:path,value:'Not stated'});else value.forEach((v,i)=>visit(v,path+' · '+(i+1)));}
  else if(value&&typeof value==='object'){for(const [key,v] of Object.entries(value))visit(v,path?path+' / '+factLabel(key):factLabel(key));}
  else out.push({label:path,value:value===null||value===undefined||value===''?'Not stated':typeof value==='boolean'?(value?'Yes':'No'):String(value)});
 };
 if(row.sourceDetails&&typeof row.sourceDetails==='object')visit(row.sourceDetails,'');
 return out;
}
export function listingLabel(r) {
 return r.listingState==='program-reference'?'Program reference · no open listing':r.listingState==='availability-unknown'?'Availability unverified':externalApplicationLink(r)?'Active listing · checked':'Needs availability recheck';
}
export function checkedLabel(r) {
 const zone=r.reviewedTimezone==='America/Los_Angeles'?'America/Los_Angeles':r.reviewedTimezone;
 return (r.reviewedAt||'date not stated')+(zone?' ('+zone+')':'');
}
export function locationLabel(r) {
 return {'location-check':'Exact worksite and local placement need confirmation','regional-scope':'Regional industry scope; placement needs confirmation','not-stated':'Location not stated'}[r.locationState]||'Exact worksite not confirmed';
}
