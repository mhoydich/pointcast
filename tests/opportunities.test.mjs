import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readState,queryState,selectRows,counts,canApply,externalApplicationLink} from '../public/opportunities/model.mjs';
const data=JSON.parse(readFileSync(new URL('../public/opportunities/catalog.json',import.meta.url)));
// Keep the original 24 proposals and reviewed xAI snapshot under regression coverage.
// Additive edition records have their own scope, evidence and rendering suite.
const rows=data.opportunities.filter(r=>r.origin!=='external'||r.id==='external-xai-grok-imagine-5244173007');
const internal=rows.filter(r=>r.origin!=='external');
const external=rows.find(r=>r.origin==='external');
import {jobsShell} from '../src/lib/opportunities-shell.mjs';
test('source counts distinguish roles, child briefs, tasks, proposals and archive',()=>{
 assert.deepEqual(counts(rows),{total:25,verifiedCurrent:1,reconfirmation:6,proposed:18});
 assert.equal(internal.filter(r=>r.kind==='role').length,4);assert.equal(rows.filter(r=>r.firstBrief).length,4);
 assert.equal(rows.filter(r=>r.kind==='volunteer-field-task').length,2);assert.equal(data.archive.recordCount,86);
 assert.equal(data.archive.fullDescriptions,10);assert.equal(data.archive.partialOverviews,2);assert.equal(data.archive.incompleteRecords,74);
 assert.equal(data.sourceFreshness.industrynext.registryObjects,14);assert.equal(new Set(rows.map(r=>r.id)).size,25);
});
test('brand views prioritize owned records and share stable IDs',()=>{
 assert.equal(selectRows(rows,readState('?site=industrynext')).length,6);
 assert.equal(selectRows(rows,readState('?site=intern')).length,12);
 assert.equal(selectRows(rows,readState('?site=ues')).length,18);
 assert.equal(selectRows(rows,readState('?site=rally')).length,0);
 const shared=selectRows(rows,readState('?site=intern&network=1'));assert.equal(shared.length,25);assert.equal(shared[0].owner,'intern');
});
test('availability, pay, archive, project, text and no result states are honest',()=>{
 for(const query of ['status=historical-archive','q=NO-MATCH-XYZ']) assert.equal(selectRows(rows,readState('?'+query)).length,0);
 for(const query of ['status=verified-current','kind=paid-role']) assert.deepEqual(selectRows(rows,readState('?'+query)).map(r=>r.id),[external.id]);
 assert.equal(selectRows(rows,readState('?project=halation')).length,1);
 assert.equal(selectRows(rows,readState('?q=offline&site=intern')).length,1);
 assert.equal(selectRows(rows,readState('?kind=volunteer-field-task')).length,2);
 assert.equal(rows.find(r=>r.id==='playlist-editor-listener-growth').compensation.startsWith('$0 guaranteed cash'),true);
 for(const r of internal.filter(r=>r.kind==='role' && r.id!=='playlist-editor-listener-growth')) assert.match(r.compensation,/not salary/);
});
test('URL state round trips and rejects unknown input',()=>{
 const s=readState('?site=intern&network=1&origin=internal&status=proposed&kind=learning-program&q=two+clients&project=communications-lab');
 assert.deepEqual(readState(queryState(s)),s);assert.equal(readState('?site=evil&kind=job&status=open').site,'pointcast');
 assert.equal(readState('?q='+ 'x'.repeat(250)).q.length,200);
});
test('applications require current availability plus role and privacy approvals',()=>{
 for(const row of rows) assert.equal(canApply(row),false);
 const current={status:'verified-current',availabilityVerifiedAt:'2026-10-05',applicationsEnabled:true,applicationApproval:true,privacyProcessApproved:true,applicationUrl:'https://example.test'};
 assert.equal(canApply(current),true);for(const field of ['availabilityVerifiedAt','applicationApproval','privacyProcessApproved']) assert.equal(canApply({...current,[field]:null}),false);
});
test('public artifact contains no application forms, private links, or JobPosting claims',()=>{
 const html=readFileSync(new URL('../public/opportunities/index.html',import.meta.url),'utf8');
 const content=JSON.stringify(data)+html;
 assert.doesNotMatch(content,/whimsical\.com|gmail\.com|mailto:|<form|\/market\/apply/);
 assert.doesNotMatch(html,/PRIVATE REVIEW|noindex,nofollow|JobPosting/);assert.equal(data.releaseState,'publication-authorized');assert.ok(data.availableProjectRoutes.every(route=>['/coffee/','/bread/'].includes(route)));for(const r of rows){assert.equal(r.applicationsEnabled,false);if(r.origin!=='external')assert.equal(r.availabilityVerifiedAt,null);}
});

test('pantry participation stays proposed with all approval gaps and inactive local source links',()=>{
 const pantry=rows.filter(r=>['coffee','bread'].includes(r.project));assert.equal(pantry.length,6);
 for(const r of pantry){assert.equal(r.status,'proposed');assert.equal(r.availability,'not open');assert.equal(r.compensationKind,'unresolved');assert.equal(r.supervisor,null);assert.equal(r.hours,null);assert.equal(r.sourceUrl,null);assert.equal(r.approvalGaps.length,6);assert.equal(canApply(r),false);assert.equal(r.sites.includes('intern'),false);}
 assert.equal(selectRows(rows,readState('?project=coffee')).length,3);assert.equal(selectRows(rows,readState('?project=bread')).length,3);assert.equal(selectRows(rows,readState('?kind=participation-proposal&site=ues')).length,6);
});


test('ours and external filters isolate source ownership without changing brand priority',()=>{
 assert.equal(internal.length,24);
 assert.deepEqual(counts(internal),{total:24,verifiedCurrent:0,reconfirmation:6,proposed:18});
 assert.deepEqual(selectRows(rows,readState('?origin=internal')).map(r=>r.id),[...internal.filter(r=>r.sites.includes('pointcast')),...internal.filter(r=>!r.sites.includes('pointcast'))].map(r=>r.id));
 assert.deepEqual(selectRows(rows,readState('?origin=external')).map(r=>r.id),[external.id]);
 assert.equal(selectRows(rows,readState('?site=intern&origin=external')).length,0);
 assert.equal(selectRows(rows,readState('?site=intern&network=1&origin=external')).length,1);
 for(const term of ['SpaceXAI','Palo Alto','Grok Imagine'])assert.deepEqual(selectRows(rows,readState('?q='+encodeURIComponent(term))).map(r=>r.id),[external.id]);
 assert.equal(readState('?origin=unknown').origin,'all');
});

test('external snapshot contains supported official facts and explicitly unknown dates/remote/pay period',()=>{
 assert.equal(external.title,'Creator & Community Program Lead — Grok Imagine');
 assert.equal(external.employer,'SpaceXAI');assert.equal(external.employerBoard,'xAI');
 assert.equal(external.locationText,'Palo Alto, CA');
 assert.deepEqual(external.pay,{min:140000,max:196000,currency:'USD',period:null});
 assert.equal(external.sourceDate,null);assert.equal(external.remoteEligibility,null);
 assert.equal(external.reviewedAt,'2026-10-06');assert.equal(external.reviewedTimezone,'America/Los_Angeles');
 assert.equal(external.checkedAt,'2026-10-07T00:28:29Z');assert.equal(external.availabilityVerifiedAt,external.checkedAt);
 assert.equal(external.sourceUrl,'https://job-boards.greenhouse.io/xai/jobs/5244173007');
 assert.match(external.terms,/may change/);assert.equal(canApply(external),false);
});

test('official outbound apply link never enables internal intake or accepts unsafe/unverified destinations',()=>{
 assert.equal(externalApplicationLink(external),external.sourceUrl);
 for(const row of internal)assert.equal(externalApplicationLink(row),null);
 for(const override of [
  {origin:'internal'}, {sourceKind:'unverified'}, {status:'needs-reconfirmation'},
  {listingState:'program-reference'}, {availabilityVerifiedAt:null}, {availabilityVerifiedAt:'bad date'},
  {externalApplicationUrl:'https://example.test/application'},
  {sourceUrl:'http://example.test',externalApplicationUrl:'http://example.test'},
  {sourceUrl:'https://user:secret@example.test/',externalApplicationUrl:'https://user:secret@example.test/'},
  {sourceUrl:'javascript:alert(1)',externalApplicationUrl:'javascript:alert(1)'}
 ])assert.equal(externalApplicationLink({...external,...override}),null);
});

test('jobs projection reuses the shared catalog/assets and gives no-JS readers an escaped official link',()=>{
 const shell=readFileSync(new URL('../public/opportunities/index.html',import.meta.url),'utf8');
 const html=jobsShell(shell,data);
 assert.match(html,/<link rel="canonical" href="https:\/\/pointcast.xyz\/jobs\/">/);
 for(const file of ['board.css','board.mjs','catalog.json'])assert.ok(html.includes('/opportunities/'+file));
 assert.doesNotMatch(html,/(?:href|src)="\.\//);
 assert.ok(html.includes(external.sourceUrl));assert.ok(html.includes('Creator &amp; Community Program Lead'));
 assert.doesNotMatch(html,/<form|noindex|"@type"\s*:\s*"JobPosting"/);
 assert.ok(jobsShell(shell,{opportunities:[]}).includes('Shared catalog JSON'));
 assert.ok(!jobsShell(shell,{opportunities:[]}).includes('fallback-jobs'));
 const escaped=jobsShell(shell,{opportunities:[{...external,title:'<img src=x onerror=alert(1)>',employer:'"bad"'}]});
 assert.ok(escaped.includes('&lt;img'));assert.doesNotMatch(escaped,/<img src=x/);
});
