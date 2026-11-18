import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {freshness,time,safeUrl,selectReport,view} from './model.mjs';
import {taskSummaries} from '../../public/loom-task-status.mjs';
const data=JSON.parse(await readFile(new URL('./project.json',import.meta.url)));
const now='2026-11-18T13:00:00Z';
test('strict UTC rejects normalized impossible, local and future timestamps',()=>{for(const value of ['2026-02-30T12:00:00Z','2026-11-18T25:00:00Z','2026-11-18T12:00:00','2026-11-18','nonsense',null])assert.equal(time(value),null);assert.equal(freshness('2026-11-19T00:00:00Z',now),'unknown');});
test('old evidence is stale and cannot masquerade as current merge proof',()=>{const d=structuredClone(data);d.evidence.checkedAt='2026-10-27T12:00:00Z';const v=view(d,d.report.value,now);assert.equal(v.evidenceFreshness,'stale');assert.match(v.merge,/Unknown/);});
test('valid checked merge never proves production, tests or approval',()=>{const v=view(data,data.report.value,now);assert.equal(v.merge,'Merged · checked');assert.match(v.tests,/Unknown/);assert.match(v.deployment,/Unknown/);assert.equal(v.approval,'Not an approval');});
test('malformed or absent evidence fails closed',()=>{for(const evidence of [{},null,{checkedAt:now,maxAgeHours:24,pr:{url:'javascript:alert(1)',head:'x',merged:true}}])assert.match(view({...data,evidence},null,now).merge,/Unknown/);});
test('link allowlist rejects credentials, injection, unrelated sites and query-bearing GitHub links',()=>{for(const url of ['javascript:alert(1)','https://evil.test/','https://github.com@evil.test/mhoydich/pointcast/pull/1','https://a:b@github.com/mhoydich/pointcast/pull/1','https://github.com/mhoydich/pointcast/pull/1?token=x','https://pointcast.xyz/loom?to=secret&token=x'])assert.equal(safeUrl(url),null);assert.ok(safeUrl(data.project.threadUrl));assert.ok(safeUrl(data.evidence.pr.url));});
test('reuse actual #1722 projection, preserve reported part state without closing whole task',()=>{
 const root={id:'m_test',kind:'note',body:'OFF-57\nB · Task state\nC · Other work',at:now,from:{name:'Owner'}};
 const reply={id:'m_reply',parent:root.id,body:'DONE B',at:now,from:{name:'Sid'}};
 const summary=taskSummaries([root,reply]).get(root.id);assert.equal(summary.status,'open');
 const p={...data.project,rootId:root.id};const report=selectReport({ok:true,log:{key:p.roomKey},messages:[{...root,taskStatus:summary,editToken:'must-not-leak',body:'private-ish unnecessary text'}]},p);
 assert.equal(report.status,'done');assert.equal(view(data,report,now).reported,'Done · reported');assert.doesNotMatch(JSON.stringify(report),/editToken|private-ish/);
});
test('missing root, wrong room and nonreported objects remain unknown',()=>{for(const payload of [{ok:true,log:{key:'wrong'},messages:[]},{ok:true,log:{key:data.project.roomKey},messages:[]},{ok:true,log:{key:data.project.roomKey},messages:[{id:data.project.rootId,taskStatus:{reported:false}}]}])assert.equal(selectReport(payload,data.project),null);});
test('new report cannot modify independent evidence and old source stays stale despite fresh fetch',()=>{const before=JSON.stringify(data.evidence);const r={status:'done',source:{at:'2026-11-14T12:00:00Z'},deployment:'live',verified:true};const v=view(data,r,now);assert.equal(v.reportFreshness,'stale');assert.match(v.deployment,/Unknown/);assert.equal(JSON.stringify(data.evidence),before);});

test('missing and nonboolean merge flags are unknown, never checked false',()=>{for(const value of [undefined,null,'false','true',0,1,{},[]]){const d=structuredClone(data);d.evidence.pr.merged=value;assert.match(view(d,null,now).merge,/Unknown/);}const d=structuredClone(data);d.evidence.pr.merged=false;assert.equal(view(d,null,now).merge,'Not merged · checked');});
