import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readState,queryState,selectRows,counts,canApply} from '../public/opportunities/model.mjs';
const data=JSON.parse(readFileSync(new URL('../public/opportunities/catalog.json',import.meta.url)));
const rows=data.opportunities;
test('source counts distinguish roles, child briefs, tasks, proposals and archive',()=>{
 assert.deepEqual(counts(rows),{total:24,verifiedCurrent:0,reconfirmation:6,proposed:18});
 assert.equal(rows.filter(r=>r.kind==='role').length,4);assert.equal(rows.filter(r=>r.firstBrief).length,4);
 assert.equal(rows.filter(r=>r.kind==='volunteer-field-task').length,2);assert.equal(data.archive.recordCount,86);
 assert.equal(data.archive.fullDescriptions,10);assert.equal(data.archive.partialOverviews,2);assert.equal(data.archive.incompleteRecords,74);
 assert.equal(data.sourceFreshness.industrynext.registryObjects,14);assert.equal(new Set(rows.map(r=>r.id)).size,24);
});
test('brand views prioritize owned records and share stable IDs',()=>{
 assert.equal(selectRows(rows,readState('?site=industrynext')).length,6);
 assert.equal(selectRows(rows,readState('?site=intern')).length,12);
 assert.equal(selectRows(rows,readState('?site=ues')).length,18);
 assert.equal(selectRows(rows,readState('?site=rally')).length,0);
 const shared=selectRows(rows,readState('?site=intern&network=1'));assert.equal(shared.length,24);assert.equal(shared[0].owner,'intern');
});
test('availability, pay, archive, project, text and no result states are honest',()=>{
 for(const query of ['status=verified-current','kind=paid-role','status=historical-archive','q=NO-MATCH-XYZ']) assert.equal(selectRows(rows,readState('?'+query)).length,0);
 assert.equal(selectRows(rows,readState('?project=halation')).length,1);
 assert.equal(selectRows(rows,readState('?q=offline&site=intern')).length,1);
 assert.equal(selectRows(rows,readState('?kind=volunteer-field-task')).length,2);
 assert.equal(rows.find(r=>r.id==='playlist-editor-listener-growth').compensation.startsWith('$0 guaranteed cash'),true);
 for(const r of rows.filter(r=>r.kind==='role' && r.id!=='playlist-editor-listener-growth')) assert.match(r.compensation,/not salary/);
});
test('URL state round trips and rejects unknown input',()=>{
 const s=readState('?site=intern&network=1&status=proposed&kind=learning-program&q=two+clients&project=communications-lab');
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
 assert.doesNotMatch(content,/whimsical\.com|gmail\.com|mailto:|JobPosting|<form|\/market\/apply/);
 assert.doesNotMatch(html,/PRIVATE REVIEW|noindex,nofollow/);assert.equal(data.releaseState,'publication-authorized');assert.ok(data.availableProjectRoutes.every(route=>['/coffee/','/bread/'].includes(route)));for(const r of rows){assert.equal(r.applicationsEnabled,false);assert.equal(r.availabilityVerifiedAt,null);}
});

test('pantry participation stays proposed with all approval gaps and inactive local source links',()=>{
 const pantry=rows.filter(r=>['coffee','bread'].includes(r.project));assert.equal(pantry.length,6);
 for(const r of pantry){assert.equal(r.status,'proposed');assert.equal(r.availability,'not open');assert.equal(r.compensationKind,'unresolved');assert.equal(r.supervisor,null);assert.equal(r.hours,null);assert.equal(r.sourceUrl,null);assert.equal(r.approvalGaps.length,6);assert.equal(canApply(r),false);assert.equal(r.sites.includes('intern'),false);}
 assert.equal(selectRows(rows,readState('?project=coffee')).length,3);assert.equal(selectRows(rows,readState('?project=bread')).length,3);assert.equal(selectRows(rows,readState('?kind=participation-proposal&site=ues')).length,6);
});
